import { AudioPlayer, AudioPlayerStatus, createAudioResource, StreamType } from '@discordjs/voice';
import { DMChannel, NewsChannel, TextChannel } from 'discord.js';
import { Readable } from 'stream';
import { Logger } from 'winston';
import { BotStatus } from '../bot/BotStatus';
import { IRhythmBotConfig } from '../bot/IRhythmBotConfig';
import { createEmbed, createErrorEmbed, createInfoEmbed } from '../helpers/helpers';
import { IMediaTypeProvider } from '../mediatypes/IMediaTypeProvider';
import { MediaItem } from './MediaItem';
import { MediaQueue } from './MediaQueue';
import type { IMediaType } from './MediaType';
import { ISongRecommender } from './SongRecommender';

enum PlayerState {
    Playing = 'playing',
    Paused = 'paused', 
    Idle = 'idle'
};

// TODO: Why does the player stop for a millisecond when searching?
export class MediaPlayer {
    private readonly queue: MediaQueue = new MediaQueue();
    private lastPlayedSong?: MediaItem;
    private autoPlay: boolean;
    private state: PlayerState = PlayerState.Idle;
    private currentSong: Readable;

    constructor(
        private readonly config: IRhythmBotConfig,
        private readonly status: BotStatus, // TODO: Make subscription-driven. (Command, don't ask)
        private readonly logger: Logger,
        private readonly mediaTypeProvider: IMediaTypeProvider,
        private readonly songRecommender: ISongRecommender,
        private readonly channel: TextChannel | DMChannel | NewsChannel,
        private readonly audioPlayer: AudioPlayer
    ) {
        this.initializePlayer();
    }

    // --------------------------------------------------------------------------
    // State changing methods
    // --------------------------------------------------------------------------
    async play(): Promise<void> {
        if (this.isInState(PlayerState.Playing)) {
            return;
        }

        if (this.isInState(PlayerState.Paused)) {
            this.setPlayerState(PlayerState.Playing);
            if (!this.audioPlayer.unpause()) {
                this.setPlayerState(PlayerState.Paused);
                return;
            }
            this.determineStatus();
            this.channel.send(createInfoEmbed(`⏯️ "${this.queue.first.name}" resumed`));
            return;
        }

        if (this.queue.length === 0) {
            if (!this.autoPlay || !this.lastPlayedSong) {
                this.channel.send(createInfoEmbed(`Queue is empty! Add some songs!`));
                return;
            }

            await this.findNextSongToPlay(this.lastPlayedSong);
        }

        
        if (this.queue.length > 0) {
            this.playFirstItemFromQueue();
        }
    } 

    stop(): void {
        if (this.state === PlayerState.Idle) {
            return;
        }

        const previousPlayerState = this.state;

        if (this.audioPlayer.stop()) {
            this.setPlayerState(PlayerState.Idle);

            if (this.queue.first) {
                this.channel.send(createInfoEmbed(`⏹️ "${this.queue.first.name}" stopped`));
            }

            this.determineStatus();
        } else {
            this.logger.error('Failed to stop player.');
            this.setPlayerState(previousPlayerState);
        }
    }

    pause(): void {
        if (this.state !== PlayerState.Playing) {
            return;
        }

        if (this.audioPlayer.pause()) {
            this.setPlayerState(PlayerState.Paused);

            if (this.queue.first) {
                this.channel.send(createInfoEmbed(`⏸️ "${this.queue.first.name}" paused`));
            }

            this.determineStatus();
        }
    }

    // --------------------------------------------------------------------------
    // Queue changing methods
    // --------------------------------------------------------------------------
    async addMedia(item: MediaItem, silent = false): Promise<void> {
        if (!item.name || !item.duration) {
            let type: IMediaType | undefined;
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

        if (silent) {
            return;
        }

        this.channel.send({
            embeds: [
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
            ]
        });
    }

    at(idx: number) {
        return this.queue[idx];
    }

    remove(item: MediaItem) {
        if (item == this.queue.first) {
            this.stop();
        }
        this.queue.dequeue(item);
        this.determineStatus();
        this.channel.send(createInfoEmbed(`Track Removed`, `${item.name}`));
    }

    clear() {
        if (!this.isInState(PlayerState.Idle)) {
            this.stop();
        }
        this.queue.clear();
        this.determineStatus();
        this.channel.send(createInfoEmbed(`Playlist Cleared`));
    }

    skip() {
        if (this.queue.length === 0) {
            this.channel.send(createInfoEmbed('No track to skip!'));
            return;
        }
        
        const item = this.queue.first;
        this.audioPlayer.stop();
        this.channel.send(createInfoEmbed(`⏭️ "${item.name}" skipped`));
    }

    // TODO: Change feature; shuffle should just select a different song as soon as this one is done.
    shuffle() {
        if (!this.isInState(PlayerState.Idle)) {
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

    toggleAutoPlay(): void {
        this.autoPlay = !this.autoPlay;
    }

    getAutoPlay(): boolean {
        return this.autoPlay;
    }

    getQueueLength(): number {
        return this.queue.length;
    }

    getQueue(): MediaItem[] {
        return [...this.queue];
    }

    // --------------------------------------------------------------------------
    // Private  methods
    // --------------------------------------------------------------------------
    private async findNextSongToPlay(lastPlayedSong: MediaItem): Promise<void> {
        let nextVideo: MediaItem | undefined | null; 
        
        try {
            await this.songRecommender.recommendNextSong(lastPlayedSong);
        } catch (e) {
            this.logger.error(e);
        }

        if (!nextVideo) {
            this.logger.info(`No songs found for recommendation.`);
            return;
        }

        await this.addMedia({
            ...nextVideo,
            requestor: 'Auto play'
        }, true);
    }

    private setPlayerState(state: PlayerState) {
        this.logger.debug(`Player moving from state ${this.state} to ${state}`);
        this.state = state;
    }

    private isInState(state: PlayerState): boolean {
        return this.state === state;
    }
    
    private async playFirstItemFromQueue(): Promise<void>
    {
        if (!this.isInState(PlayerState.Idle)) {
            this.logger.error('PlayerState should be idle to play!');
            return;
        }

        let item = this.queue.first;
        let type = this.mediaTypeProvider.get(item.type);

        if (!type) {
            this.channel.send(createErrorEmbed(`Invalid type for item. See logs`));
            this.logger.error(JSON.stringify({ message: 'Invalid type for item', erroredItem: item }));
            return;
        }

        this.setPlayerState(PlayerState.Playing);
        this.lastPlayedSong = item;

        this.currentSong = await type.getStream(item);

        this.audioPlayer.play(
            createAudioResource(
                this.currentSong,
                { inputType: StreamType.Arbitrary }
            )
        );

        this.determineStatus();
        const msg = await this.channel.send({
            embeds: [
                createEmbed()
                    .setTitle('▶️ Now playing')
                    .setDescription(`${item.name}`)
                    .addFields({ name: 'Requested By', value: `${item.requestor}` })
            ]
        });
        msg.react(this.config.emojis.stopSong);
        msg.react(this.config.emojis.playSong);
        msg.react(this.config.emojis.pauseSong);
        msg.react(this.config.emojis.skipSong);
    }

    private initializePlayer(): void
    {
        this.audioPlayer.on('error', (err) => {
            this.skip();
            this.logger.error('Error playing song: ', { err });
            this.channel.send(createErrorEmbed(`Error Playing Song: ${err.message}`));
            this.play();
        });

        this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
            if (!this.isInState(PlayerState.Playing)) {
                this.logger.debug(
                    'Not doing anything with idle state, as previous state was not playing.'
                );
                return;
            }

            this.logger.debug('Stream done');
            this.setPlayerState(PlayerState.Idle);
            this.determineStatus();
            const track = this.queue.dequeue();
            if (this.config.queue.repeat) {
                this.queue.enqueue(track);
            }
            setTimeout(() => { this.play() }, 1000);
        });

        this.audioPlayer.on('debug', (message) => {
            this.logger.debug(`V1 debug: ${message}`);
        });

        this.autoPlay = !!this.config.queue?.autoPlay;
    }

    // Todo: move to subscription / listener events.
    private determineStatus(): void {
        let item = this.queue.first;
        if (!item) {
            this.status.setBanner(`No Songs In Queue`);
            return;
        }

        switch (this.state) {
            case PlayerState.Idle:
                this.status.setBanner(`Up Next: "${item.name}" Requested by: ${item.requestor}`);
                break;   
            case PlayerState.Paused:
                this.status.setBanner(`Paused: "${item.name}" Requested by: ${item.requestor}`);
                break;
            case PlayerState.Playing:
                this.status.setBanner(`"${item.name}" ${this.queue.length > 1 ? `, Up Next "${this.queue[1].name}"` : ''}`);
                break;
        }
    }
}
