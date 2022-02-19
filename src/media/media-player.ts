import { IMediaTypeProvider } from './../mediatypes/IMediaTypeProvider';
import { IRhythmBotConfig } from '../bot/bot-config';
import { BotStatus } from '../bot/bot-status';
import { MediaQueue } from './media-queue';
import { MediaItem } from './media-item.model';
import { createEmbed, createErrorEmbed, createInfoEmbed } from '../helpers';
import { Logger, TextChannel, DMChannel, NewsChannel, VoiceConnection, StreamDispatcher, Message, VoiceChannel } from 'discord-bot-quickstart';
import { Readable } from 'stream';
import yts from 'yt-search';
import { SpotifyAPIHelper } from '../helpers/SpotifyAPIHelper';

// TODO: Why does the playerp stop for a millisecond when searching?
export class MediaPlayer {
     // TODO: Make all variables private.
    queue: MediaQueue = new MediaQueue();
    connection?: VoiceConnection;
    dispatcher?: StreamDispatcher;
    private lastPlayedSong?: MediaItem;
    private autoPlay: boolean = true;

    
    // TODO: find a way to directly inject this.
    private channel: TextChannel | DMChannel | NewsChannel;
    private playing: boolean = false;
    private paused: boolean = false;
    private stopping: boolean = false;

    constructor(
        private readonly config: IRhythmBotConfig,
        private readonly status: BotStatus, // TODO: Make subscription-driven. (Command, don't ask)
        private readonly logger: Logger,
        private readonly mediaTypeProvider: IMediaTypeProvider
    ) { }

    async addMedia(item: MediaItem, silent = false): Promise<void> {
        if (!item.name || !item.duration) {
            let type = undefined;
            try {
                type = this.mediaTypeProvider.get(item.type);
            } catch (error) {
                return Promise.reject(`Error when fetching media type: ${error}`);
            }

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
            if (this.autoPlay && this.lastPlayedSong) {
                await this.findNextSongAndPlay(this.lastPlayedSong);
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
        let type = this.mediaTypeProvider.get(item.type);

        if (!type) {
            this.channel.send(createErrorEmbed(`Invalid type for item. See logs`));
            this.logger.error({ message: 'Invalid type for item', erroredItem: item });
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
        this.lastPlayedSong = item;
        
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

    async setConnection(channel: VoiceChannel): Promise<void> {
        if (channel.type === 'voice') {
            this.connection = await channel.join();
            return;
        }

        return Promise.reject(`User isn't in a voice channel!`);
    }

    private async findNextSongAndPlay(lastPlayedSong: MediaItem): Promise<void> {
        if (!this.config.youtube || !this.config.spotify) {
            return;
        }
        
        const helper = new SpotifyAPIHelper(
            this.config.spotify.clientId,
            this.config.spotify.clientSecret,
            this.logger
        );

        const lettersAndSpacesRegex = /[^\w\s\-]+/gm;

        /**
         * For future readers: most stuff in youtube videos that's behind brackets can be omitted.
         * For instance: 
         * - (Official video)
         * - (Remastered 2012)
         * - (Music video)
         * - ...etc.
         * 
         * Spotify will not recognize this. 
         * However, this will mean that searching will be a little more vague, possibly leading to results
         * that are not connected to the original.
         */
        const everyThingAfterBracketsRegex = /\(.*/gm;

        const [artist, track] = lastPlayedSong
            .name
            .replace(everyThingAfterBracketsRegex, '')
            .replace(lettersAndSpacesRegex, ' ')
            .split(" - ");

        let searchTrack: string, searchArtist: string;

        if (!track) {
            searchTrack = artist;
        } else {
            searchTrack = track;
            searchArtist = artist;
        }

        const spotifyId: string = await helper.getSpotifyIDForSong(searchTrack, searchArtist || undefined);
        const recommendation: string = await helper.getRecommendationForTrack(spotifyId);
        const videos = await yts({ query: recommendation, pages: 1 }).then((res) => res.videos);
        
        if (videos === null || videos.length === 0) {
            this.logger.info(`No songs found for recommendation.`);
            return;
        }

        await this.addMedia({
            type: 'youtube',
            url: videos[0].url,
            requestor: 'Auto play',
            name: videos[0].title,
            duration: videos[0].timestamp
        }, true);

        if (!this.isPlaying()) {
            this.play();
        }
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
