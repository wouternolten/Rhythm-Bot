import { IChannelManager } from 'src/channel/ChannelManager';
import { IQueueManager } from 'src/queue/QueueManager';
import { Logger } from 'winston';
import { BotStatus } from '../bot/BotStatus';
import { AudioEventBus, AudioEventBusStatus } from '../helpers/EventBus';
import IMediaPlayerStateHandler from './state/IMediaPlayerStateHandler';
import { PlayerState } from './state/Types';

export class MediaPlayer {
    private state: PlayerState = PlayerState.Idle;

    constructor(
        private readonly status: BotStatus,
        private readonly logger: Logger,
        private readonly queueManager: IQueueManager,
        private readonly channelManager: IChannelManager,
        private readonly stateHandlers: IMediaPlayerStateHandler[],
        private readonly eventBus: AudioEventBus
    ) {}

    public initializePlayer(): void {
        this.eventBus.on(AudioEventBusStatus.AudioPlayerError, async (error) => {
            this.logger.error('Error playing song: ', { error });
            await this.channelManager.sendErrorMessage(`Error Playing Song: ${error.message}`);
            await this.skip();
        });

        this.eventBus.on(AudioEventBusStatus.AudioPlayerIdle, () => {
            if (!this.isInState(PlayerState.Playing)) {
                this.logger.debug('Not doing anything with idle state, as previous state was not playing.');
                return;
            }

            this.logger.debug('Stream done');
            this.setPlayerState(PlayerState.Idle);
            this.play();
        });

        this.status.emptyBanner();
    }

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
        this.logger.debug(`Performing function ${functionName}, current state ${this.state}, next state: ${nextState}`);

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

    private setPlayerState(state: PlayerState) {
        this.logger.debug(`Player moving from state ${this.state} to ${state}`);
        this.state = state;
    }

    private isInState(state: PlayerState): boolean {
        return this.state === state;
    }

    private getHandlerForState(state: PlayerState): IMediaPlayerStateHandler {
        const handler = this.stateHandlers.find((handler) => handler.getApplicableStateName() === state);

        if (!handler) {
            throw new Error('Handler not found');
        }

        return handler;
    }
}
