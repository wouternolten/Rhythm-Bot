import { SpotifyAPIHelper } from './../helpers/SpotifyAPIHelper';
import { YoutubeAPIHelper } from './../helpers/YoutubeAPIHelper';
import { IRhythmBotConfig } from '../bot/bot-config';
import { BotStatus } from '../bot/bot-status';
import { MediaQueue } from './media-queue';
import { MediaItem } from './media-item.model';
import { IMediaType } from './media-type.model';
import { createEmbed, createErrorEmbed, createInfoEmbed, secondsToTimestamp } from '../helpers';
import { Logger, TextChannel, DMChannel, NewsChannel, VoiceConnection, StreamDispatcher, Message, VoiceChannel } from 'discord-bot-quickstart';
import { Readable } from 'stream';
import ytdl from 'ytdl-core';
import { getInfo } from 'ytdl-core';
import ytpl from 'ytpl';

const youtubeType: string = 'youtube';
const MAX_YOUTUBE_ITEMS = 5;

// TODO: Why does the playerp stop for a millisecond when searching?
export class MediaPlayer {
     // TODO: Make all variables private.
    typeRegistry: Map<string, IMediaType> = new Map<string, IMediaType>();
    queue: MediaQueue = new MediaQueue();
    connection?: VoiceConnection;
    dispatcher?: StreamDispatcher;
    private lastPlayedSong?: MediaItem;
    private autoPlay: boolean = false;

    
    // TODO: find a way to directly inject this.
    private channel: TextChannel | DMChannel | NewsChannel;
    private playing: boolean = false;
    private paused: boolean = false;
    private stopping: boolean = false;

    constructor(
        private readonly config: IRhythmBotConfig,
        private readonly status: BotStatus, // TODO: Make subscription-driven. (Command, don't ask)
        private readonly logger: Logger
    ) {
        // TODO: this is ugly. Fix it.
        this.fillTypeRegistryWithDefaults();
    }

    async addMedia(item: MediaItem, silent = false): Promise<void> {
        if (!item.name || !item.duration) {
            let type = this.typeRegistry.get(item.type);

            if (!type) {
                return Promise.reject('Unknown Media Type!');
            }

            try {
                const details = await type.getDetails(item);

                item.name = details.name;
                item.duration = details.duration;
            } catch (error) {
                const errorMessage = 'Error when getting details for item';
                this.logger.error(`${errorMessage}: \n ${JSON.stringify({ item, error })}`);
                return Promise.reject(errorMessage);
            }
        }

        this.queue.enqueue(item);
        this.determineStatus();

        if (!silent) {
            this.channel.send(
                createEmbed()
                    .setTitle('Track Added')
                    .addFields(
                        { name: 'Title:', value: item.name },
                        {
                            name: 'Position:',
                            value: `${this.queue.indexOf(item) + 1}`,
                            inline: true,
                        },
                        {
                            name: 'Requested By:',
                            value: item.requestor,
                            inline: true,
                        }
                    )
            );
        }
    }

    at(idx: number) {
        return this.queue[idx];
    }

    remove(item: MediaItem) {
        if (item == this.queue.first && (this.playing || this.paused)) {
            this.stop();
        }
        this.queue.dequeue(item);
        this.determineStatus();
        this.channel.send(createInfoEmbed(`Track Removed`, `${item.name}`));
    }

    clear() {
        if (this.playing || this.paused) {
            this.stop();
        }
        this.queue.clear();
        this.determineStatus();
        this.channel.send(createInfoEmbed(`Playlist Cleared`));
    }

    async play(): Promise<void> {
        if (this.queue.length == 0) {
            if (this.autoPlay) {
                await this.findNextSongAndPlay();
                return;
            }

            this.channel.send(createInfoEmbed(`Queue is empty! Add some songs!`));
            return;
        }

        if (this.playing && !this.paused) {
            this.channel.send(createInfoEmbed(`Already playing a song!`));
            return;
        }

        if (!this.connection) {
            this.channel.send(createInfoEmbed(`No connection established`));
            return;
        }

        let item = this.queue.first;
        let type = this.typeRegistry.get(item.type);

        if (!type) {
            this.channel.send(createErrorEmbed(`Invalid type for item. See logs`));
            console.error({ message: 'Invalid type for item', erroredItem: item });
            return;
        }

        if (!this.playing) {
            const stream = await type.getStream(item);
            this.dispatchStream(stream, item);
        } else if (this.paused && this.dispatcher) {
            this.dispatcher.resume();
            this.paused = false;
            this.determineStatus();
            this.channel.send(createInfoEmbed(`⏯️ "${this.queue.first.name}" resumed`));
        }
    }

    stop() {
        if (this.playing) {
            this.playing = false;
        }

        if (this.dispatcher) {
            this.stopping = true;
            let item = this.queue.first;
            this.paused = false;
            this.dispatcher.pause();
            this.dispatcher.destroy();
            this.determineStatus();
            this.channel.send(createInfoEmbed(`⏹️ "${item.name}" stopped`));
        }
    }

    skip() {
        if (this.playing && this.dispatcher) {
            let item = this.queue.first;
            this.paused = false;
            this.dispatcher.pause();
            this.dispatcher.destroy();
            this.channel.send(createInfoEmbed(`⏭️ "${item.name}" skipped`));
        } else if (this.queue.length > 0) {
            let item = this.queue.first;
            this.queue.dequeue();
            this.channel.send(createInfoEmbed(`⏭️ "${item.name}" skipped`));
        }
        this.determineStatus();
    }

    pause() {
        if (this.paused) {
            return;
        }

        if (this.playing && this.dispatcher) {
            this.dispatcher.pause();
            this.paused = true;
            this.determineStatus();
            this.channel.send(createInfoEmbed(`⏸️ "${this.queue.first.name}" paused`));
        }
    }

    // TODO: Change feature; shuffle should just select a different song as soon as this one is done.
    shuffle() {
        if (this.playing || this.paused) {
            this.stop();
        }
        this.queue.shuffle();
        this.determineStatus();
        this.channel.send(createInfoEmbed(`🔀 Queue Shuffled`));

        this.play();
    }

    move(currentIdx: number, targetIdx: number) {
        let max = this.queue.length - 1;
        let min = 0;
        currentIdx = Math.min(Math.max(currentIdx, min), max);
        targetIdx = Math.min(Math.max(targetIdx, min), max);

        if (currentIdx != targetIdx) {
            this.queue.move(currentIdx, targetIdx);
            this.determineStatus();
        }
    }

    setVolume(volume: number) {
        volume = Math.min(Math.max(volume / 100 + 0.5, 0.5), 2);
        this.config.stream.volume = volume;
        if (this.dispatcher) {
            this.dispatcher.setVolume(volume);
        }
    }

    getVolume() {
        return (this.config.stream.volume - 0.5) * 100 + '%';
    }

    // Todo: move to subscription / listener events.
    determineStatus() {
        let item = this.queue.first;
        if (item) {
            if (this.playing) {
                if (this.paused) {
                    this.status.setBanner(`Paused: "${item.name}" Requested by: ${item.requestor}`);
                } else {
                    this.status.setBanner(
                        `"${item.name}" ${this.queue.length > 1 ? `, Up Next "${this.queue[1].name}"` : ''}`
                    );
                }
            } else {
                this.status.setBanner(`Up Next: "${item.name}" Requested by: ${item.requestor}`);
            }
        } else {
            this.status.setBanner(`No Songs In Queue`);
        }
    }

    private dispatchStream(stream: Readable, item: MediaItem) {
        if (this.dispatcher) {
            this.dispatcher.end();
            this.dispatcher = null;
        }
        this.dispatcher = this.connection.play(stream, {
            seek: this.config.stream.seek,
            volume: this.config.stream.volume,
            bitrate: this.config.stream.bitrate,
            fec: this.config.stream.forwardErrorCorrection,
            plp: this.config.stream.packetLossPercentage,
            highWaterMark: 1 << 25,
        });
        
        this.playing = true;
        
        this.dispatcher.on('start', async () => {
            this.determineStatus();
            const msg = await this.channel.send(
                createEmbed()
                    .setTitle('▶️ Now playing')
                    .setDescription(`${item.name}`)
                    .addField('Requested By', `${item.requestor}`)
            );
            msg.react(this.config.emojis.stopSong);
            msg.react(this.config.emojis.playSong);
            msg.react(this.config.emojis.pauseSong);
            msg.react(this.config.emojis.skipSong);
            this.lastPlayedSong = item;
        });
        this.dispatcher.on('debug', (info: string) => {
            this.logger.debug(info);
        });
        this.dispatcher.on('error', (err) => {
            this.skip();
            this.logger.error(err);
            this.channel.send(createErrorEmbed(`Error Playing Song: ${err}`));
        });
        this.dispatcher.on('close', () => {
            this.logger.debug(`Stream Closed`);
            if (this.dispatcher) {
                this.playing = false;
                this.dispatcher = null;
                this.determineStatus();
                if (!this.stopping) {
                    let track = this.queue.dequeue();
                    if (this.config.queue.repeat) {
                        this.queue.enqueue(track);
                    }
                    setTimeout(() => {
                        this.play();
                    }, 1000);
                }
                this.stopping = false;
            }
        });
        this.dispatcher.on('finish', () => {
            this.logger.debug('Stream Finished');
            if (this.dispatcher) {
                this.playing = false;
                this.dispatcher = null;
                this.determineStatus();
                if (!this.stopping) {
                    let track = this.queue.dequeue();
                    if (this.config.queue.repeat) {
                        this.queue.enqueue(track);
                    }
                    setTimeout(() => {
                        this.play();
                    }, 1000);
                }
                this.stopping = false;
            }
        });
        this.dispatcher.on('end', (reason: string) => {
            this.logger.debug(`Stream Ended: ${reason}`);
        });
    }

    private fillTypeRegistryWithDefaults(): void {
        this.typeRegistry.set(youtubeType, {
            getPlaylist: (item: MediaItem) =>
                new Promise<MediaItem[]>((done, error) => {
                    console.log('Getting playlist');
                    ytpl(item.url)
                        .then((playlist) => {
                            const items = playlist.items.map(
                                (item) =>
                                    <MediaItem>{
                                        type: youtubeType,
                                        url: item.url,
                                        name: item.title,
                                    }
                            );
                            done(items);
                        })
                        .catch((err) => error(err));
                }),
            getDetails: (item: MediaItem) =>
                new Promise<MediaItem>((done, error) => {
                    console.log('Fetching details');
                    item.url = item.url.includes('://') ? item.url : `https://www.youtube.com/watch?v=${item.url}`;
                    getInfo(item.url)
                        .then((info) => {
                            item.name = info.videoDetails.title ? info.videoDetails.title : 'Unknown';
                            item.duration = secondsToTimestamp(parseInt(info.videoDetails.lengthSeconds) || 0);
                            done(item);
                        })
                        .catch((err) => error(err));
                }),
            getStream: (item: MediaItem) =>
                new Promise<Readable>((done, error) => {
                    console.log('Getting stream');
                    let stream = ytdl(item.url, {
                        filter: 'audioonly',
                        quality: 'highestaudio',
                        begin: item.begin
                    });
                    if (stream) {
                        done(stream);
                    } else {
                        error('Unable to get media stream');
                    }
                }),
        });
    }

    async setConnection(channel: VoiceChannel): Promise<void> {
        if (channel.type === 'voice') {
            this.connection = await channel.join();
            return;
        }

        return Promise.reject(`User isn't in a voice channel!`);
    }

    private async findNextSongAndPlayWithSpotify(lastPlayedSong: MediaItem): Promise<void> {
        if (!this.config.youtube || !this.config.spotify) {
            return;
        }
        
        const helper = new SpotifyAPIHelper(
            this.config.spotify.clientId,
            this.config.spotify.clientSecret
        );

        const song = lastPlayedSong.name.split(" - ");

        const spotifyId: string = await helper.getSpotifyIDForSong(song[0], song[1] || undefined);
        const recommendation: string = await helper.getRecommendationForTrack(spotifyId);
    }

    private async findNextSongAndPlay(): Promise<void> {
        if (!this.lastPlayedSong || !this.config.youtube) {
            return;
        }

        let lastPlayedYoutubeId = this.getYoutubeIdFromUrl(this.lastPlayedSong.url);

        if (!lastPlayedYoutubeId) {
            return;
        }

        let success = false;
        let nextVideoIds: string[] = null;
        
        try {
            nextVideoIds = await new YoutubeAPIHelper(this.config.youtube.apiKey)
                .getRecommendedYoutubeIdsForCurrentVideo(lastPlayedYoutubeId, MAX_YOUTUBE_ITEMS);
        } catch (error) {
            this.logger.error(`Error finding recommended video for url. Currenturl: ${lastPlayedYoutubeId}, error: ${JSON.stringify(error)}`);
            return;
        }

        if (!nextVideoIds) {
            return;
        }

        let index = 0;

        while (!success && index < nextVideoIds.length) {
            index++;
        
            try {
                await this.addMedia({
                    type: 'youtube',
                    url: `https://youtube.com/watch?v=${nextVideoIds[index]}`,
                    requestor: 'Gewoon Bram'
                });

                success = true;
            } catch (error) {}
        }

        if (this.queue.length > 0) {
            this.play();
        }
    }

    private getYoutubeIdFromUrl(fullUrl: string): string | null
    {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = fullUrl.match(regExp);
        return ( match && match[7].length==11 ) ? match[7] : null;
    }

    isPlaying(): boolean {
        return this.playing;
    }

    getChannel(): TextChannel | DMChannel | NewsChannel {
        return this.channel;
    }

    setChannel(channel: TextChannel | DMChannel | NewsChannel): void {
        this.channel = channel;
    }

    toggleAutoPlay(): void {
        this.autoPlay = !this.autoPlay;
    }

    getAutoPlay(): boolean {
        return this.autoPlay;
    }
}
