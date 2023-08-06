import { AudioPlayer } from '@discordjs/voice';
import { BotStatus } from 'src/bot/BotStatus';
import { IChannelManager } from 'src/channel/ChannelManager';
import { IQueueManager } from 'src/queue/QueueManager';
import AbstractMediaPlayerStateHandler from './AbstractMediaPlayerStateHandler';
import { PlayerState } from './Types';

export default class PausedStateHandler extends AbstractMediaPlayerStateHandler {
    constructor(
        private readonly status: BotStatus,
        private readonly audioPlayer: AudioPlayer,
        private readonly queueManager: IQueueManager,
        private readonly channelManager: IChannelManager
    ) {
        super();
    }

    async play(): Promise<void> {
        if (!this.audioPlayer.unpause()) {
            throw new Error('Failed to unpause player');
        }

        const currentSong = this.queueManager.getLastPlayedSong();

        if (currentSong) {
            this.status.setBanner(`Playing ${currentSong.name}`);
            this.channelManager.sendInfoMessage(`⏯️ "${currentSong.name}" resumed`);
        }
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

        const nextSongToPlay = this.queueManager.nextSongInQueue();

        if (nextSongToPlay) {
            this.status.setBanner(`Up Next: "${nextSongToPlay.name}" Requested by: ${nextSongToPlay.requestor}`);
            return;
        }

        this.status.emptyBanner();
    }

    getApplicableStateName(): PlayerState {
        return PlayerState.Paused;
    }
}
