import { AudioPlayer } from '@discordjs/voice';
import { BotStatus } from 'src/bot/BotStatus';
import { IChannelManager } from 'src/channel/ChannelManager';
import { IQueueManager } from 'src/queue/QueueManager';
import AbstractMediaPlayerStateHandler from './AbstractMediaPlayerStateHandler';
import { PlayerState } from './Types';

export default class PlayingStateHandler extends AbstractMediaPlayerStateHandler {
    constructor(
        private readonly status: BotStatus,
        private readonly audioPlayer: AudioPlayer,
        private readonly queueManager: IQueueManager,
        private readonly channelManager: IChannelManager
    ) {
        super();
    }

    async stop(silent: boolean = false): Promise<void> {
        if (!this.audioPlayer.stop()) {
            throw new Error('Failed to stop player.');
        }

        if (!silent) {
            const lastPlayedSong = this.queueManager.getLastPlayedSong();
            if (lastPlayedSong) {
                this.channelManager.sendInfoMessage(`⏹️ "${lastPlayedSong.name}" stopped`);
            }
        }

        const nextSongToPlay = await this.queueManager.nextSongInQueue();

        if (nextSongToPlay) {
            this.status.setBanner(`Up Next: "${nextSongToPlay.name}" Requested by: ${nextSongToPlay.requestor}`);
            return;
        }

        this.status.emptyBanner();
    }

    async pause(): Promise<void> {
        if (!this.audioPlayer.pause()) {
            throw new Error('Failed to pause player.');
        }

        const lastSong = this.queueManager.getLastPlayedSong();

        if (lastSong) {
            await this.channelManager.sendInfoMessage(`⏸️ "${lastSong.name}" paused`);
            this.status.setBanner(`Paused: "${lastSong.name}" Requested by: ${lastSong.requestor}`);
        }
    }

    getApplicableStateName(): PlayerState {
        return PlayerState.Playing;
    }
}
