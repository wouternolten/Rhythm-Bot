import { AudioPlayer, AudioPlayerStatus, createAudioResource, StreamType } from '@discordjs/voice';
import { IChannelManager } from 'src/channel/ChannelManager';
import { IQueueManager } from 'src/queue/QueueManager';
import { Logger } from 'winston';
import { BotStatus } from '../bot/BotStatus';
import { IMediaTypeProvider } from '../mediatypes/IMediaTypeProvider';
import { MediaItem } from './MediaItem';

enum PlayerState {
    Playing = 'playing',
    Paused = 'paused',
    Idle = 'idle',
}

// TODO: Why does the player stop for a millisecond when searching?
export class MediaPlayer {
    private state: PlayerState = PlayerState.Idle;

    constructor(
        private readonly status: BotStatus, // TODO: Make subscription-driven. (Command, don't ask)
        private readonly logger: Logger,
        private readonly mediaTypeProvider: IMediaTypeProvider,
        private readonly audioPlayer: AudioPlayer,
        private readonly queueManager: IQueueManager,
        private readonly channelManager: IChannelManager
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

            const currentSong = this.queueManager.getLastPlayedSong();

            if (currentSong) {
                this.status.setBanner(`Playing ${currentSong.name}`);
                this.channelManager.sendInfoMessage(`⏯️ "${currentSong.name}" resumed`);
            }
            return;
        }

        try {
            const itemToPlay = await this.queueManager.getNextSongToPlay();

            if (!itemToPlay) {
                this.channelManager.sendErrorMessage('Failed to find song. Try again please.');
                return;
            }

            await this.playFirstItemFromQueue(itemToPlay);
        } catch (error) {
            this.logger.error('Failed to play song due to error', error);
            return;
        }
    }

    async stop(silent: boolean = false): Promise<void> {
        if (this.state === PlayerState.Idle) {
            return;
        }

        const previousPlayerState = this.state;

        if (!this.audioPlayer.stop()) {
            this.logger.error('Failed to stop player.');
            this.setPlayerState(previousPlayerState);
            return;
        }

        this.setPlayerState(PlayerState.Idle);

        const lastPlayedSong = this.queueManager.getLastPlayedSong();
        if (lastPlayedSong && !silent) {
            this.channelManager.sendInfoMessage(`⏹️ "${lastPlayedSong.name}" stopped`);
        }

        const nextSongToPlay = await this.queueManager.getNextSongToPlay();

        if (nextSongToPlay) {
            this.status.setBanner(`Up Next: "${nextSongToPlay.name}" Requested by: ${nextSongToPlay.requestor}`);
            return;
        }

        this.status.emptyBanner();
    }

    pause(): void {
        if (this.state !== PlayerState.Playing || !this.audioPlayer.pause()) {
            return;
        }

        this.setPlayerState(PlayerState.Paused);
        const lastSong = this.queueManager.getLastPlayedSong();

        if (lastSong) {
            this.channelManager.sendInfoMessage(`⏸️ "${lastSong?.name}" paused`);
            this.status.setBanner(`Paused: "${lastSong.name}" Requested by: ${lastSong.requestor}`);
        }
    }

    async skip(): Promise<void> {
        this.stop(true);
        await this.channelManager.sendInfoMessage(`⏭️ "${this.queueManager.getLastPlayedSong()?.name}" skipped`);
        this.play();
    }

    // --------------------------------------------------------------------------
    // Queue changing methods
    // --------------------------------------------------------------------------
    clear() {
        if (!this.isInState(PlayerState.Idle)) {
            this.stop(true);
        }

        this.queueManager.clear();
        this.channelManager.sendInfoMessage(`Playlist cleared`);
    }

    // TODO: Change feature; shuffle should just select a different song as soon as this one is done.
    shuffle() {
        if (!this.isInState(PlayerState.Idle)) {
            this.stop(true);
        }

        this.queueManager.shuffle();
        this.channelManager.sendInfoMessage(`🔀 Queue Shuffled`);

        this.play();
    }

    // --------------------------------------------------------------------------
    // Private methods
    // --------------------------------------------------------------------------
    private setPlayerState(state: PlayerState) {
        this.logger.debug(`Player moving from state ${this.state} to ${state}`);
        this.state = state;
    }

    private isInState(state: PlayerState): boolean {
        return this.state === state;
    }

    private async playFirstItemFromQueue(item: MediaItem): Promise<void> {
        let type = this.mediaTypeProvider.get(item.type);

        if (!type) {
            this.channelManager.sendErrorMessage(`Invalid type for item. See logs`);
            this.logger.error(JSON.stringify({ message: 'Invalid type for item', erroredItem: item }));
            return;
        }

        this.setPlayerState(PlayerState.Playing);
        const currentSong = await type.getStream(item);

        this.audioPlayer.play(createAudioResource(currentSong, { inputType: StreamType.Arbitrary }));

        this.status.setBanner(`Playing ${item.name}`);
        this.channelManager.sendTrackPlayingMessage(item);
    }

    private initializePlayer(): void {
        this.audioPlayer.on('error', async (error) => {
            await this.skip();
            this.logger.error('Error playing song: ', { error });
            await this.channelManager.sendErrorMessage(`Error Playing Song: ${error.message}`);
            await this.play();
        });

        this.audioPlayer.on(AudioPlayerStatus.Idle, async () => {
            if (!this.isInState(PlayerState.Playing)) {
                this.logger.debug('Not doing anything with idle state, as previous state was not playing.');
                return;
            }

            this.logger.debug('Stream done');
            this.setPlayerState(PlayerState.Idle);
            await this.play();
        });

        this.audioPlayer.on('debug', (message) => {
            this.logger.debug(`V1 debug: ${message}`);
        });

        this.status.emptyBanner();
    }
}
