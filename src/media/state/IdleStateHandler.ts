import { AudioPlayer, createAudioResource, StreamType } from '@discordjs/voice';
import { BotStatus } from 'src/bot/BotStatus';
import { IChannelManager } from 'src/channel/ChannelManager';
import { IMediaTypeProvider } from 'src/mediatypes/IMediaTypeProvider';
import { IQueueManager } from 'src/queue/QueueManager';
import { Logger } from 'winston';
import AbstractMediaPlayerStateHandler from './AbstractMediaPlayerStateHandler';
import { PlayerState } from './Types';

export default class IdleStateHandler extends AbstractMediaPlayerStateHandler {
    constructor(
        private readonly status: BotStatus,
        private readonly logger: Logger,
        private readonly mediaTypeProvider: IMediaTypeProvider,
        private readonly audioPlayer: AudioPlayer,
        private readonly queueManager: IQueueManager,
        private readonly channelManager: IChannelManager
    ) {
        super();
    }

    async play(): Promise<void> {
        const item = await this.queueManager.getNextSongToPlay();

        if (!item) {
            const message = 'Failed to find song. Try again please.';
            this.channelManager.sendErrorMessage(message);
            throw new Error(message);
        }

        let type = this.mediaTypeProvider.get(item.type);

        if (!type) {
            const message = 'Invalid type for item.';
            this.channelManager.sendErrorMessage(`${message} See logs`);
            this.logger.error(JSON.stringify({ message, erroredItem: item }));
            throw new Error(message);
        }

        const currentSong = await type.getStream(item);

        this.audioPlayer.play(createAudioResource(currentSong, { inputType: StreamType.Arbitrary }));

        this.status.setBanner(`Playing ${item.name}`);
        await this.channelManager.sendTrackPlayingMessage(item);
    }

    getApplicableStateName(): PlayerState {
        return PlayerState.Idle;
    }
}
