import { AudioPlayer, AudioPlayerStatus } from '@discordjs/voice';
import { IChannelManager } from 'src/channel/ChannelManager';
import { IQueueManager } from 'src/queue/QueueManager';
import { Logger } from 'winston';
import { BotStatus } from '../bot/BotStatus';
import IMediaPlayerStateHandler from './state/IMediaPlayerStateHandler';
import { PlayerState } from './state/Types';

// TODO: Why does the player stop for a millisecond when searching?
export class MediaPlayer {
    private state: PlayerState = PlayerState.Idle;

    constructor(
        private readonly status: BotStatus, // TODO: Make subscription-driven. (Command, don't ask)
        private readonly logger: Logger,
        private readonly audioPlayer: AudioPlayer,
        private readonly queueManager: IQueueManager,
        private readonly channelManager: IChannelManager,
        private readonly stateHandlers: IMediaPlayerStateHandler[]
    ) {
        this.initializePlayer();
    }

    // --------------------------------------------------------------------------
    // State changing methods
    // --------------------------------------------------------------------------
    async play(): Promise<void> {
        await this.performFunction('play', PlayerState.Playing);
    }

    async stop(silent: boolean = false): Promise<void> {
        await this.performFunction('stop', PlayerState.Idle, silent);
    }

    async pause(): Promise<void> {
        await this.performFunction('pause', PlayerState.Paused);
    }

    async skip(): Promise<void> {
        await this.stop(true);
        await this.channelManager.sendInfoMessage(`⏭️ "${this.queueManager.getLastPlayedSong()?.name}" skipped`);
        await this.play();
    }

    private async performFunction(functionName: string, nextState: PlayerState, silent?: boolean): Promise<void> {
        try {
            const handler = this.getHandlerForState(this.state);

            if (silent === undefined) {
                await handler[functionName]();
            } else {
                await handler[functionName](silent);
            }

            this.setPlayerState(nextState);
        } catch (error) {
            this.channelManager.sendErrorMessage(`Failed to ${functionName} player`);
            this.logger.error(error);
        }
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

    private getHandlerForState(state: PlayerState): IMediaPlayerStateHandler {
        const handler = this.stateHandlers.find((handler) => handler.getApplicableStateName() === state);

        if (!handler) {
            throw new Error('Handler not found');
        }

        return handler;
    }
}
