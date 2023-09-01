import { createAudioResource, StreamType } from '@discordjs/voice';
import { BotStatus } from 'src/bot/BotStatus';
import { IChannelManager } from 'src/channel/ChannelManager';
import { IAudioPlayerFactory } from 'src/helpers/AudioPlayerFactory';
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
        private readonly audioPlayerFactory: IAudioPlayerFactory,
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

        const type = this.mediaTypeProvider.get(item.type);

        if (!type) {
            const message = 'Invalid type for item.';
            this.channelManager.sendErrorMessage(`${message} See logs`);
            this.logger.error(JSON.stringify({ message, erroredItem: item }));
            throw new Error(message);
        }

        const currentSong = await type.getStream(item);

        const audioPlayer = this.audioPlayerFactory.getAudioPlayer();

        if (!audioPlayer) {
            throw new Error('Audio player not found');
        }

        audioPlayer.play(createAudioResource(currentSong, { inputType: StreamType.Arbitrary }));

        this.status.setBanner(`Playing ${item.name}`);
        await this.channelManager.sendTrackPlayingMessage(item);
    }

    getApplicableStateName(): PlayerState {
        return PlayerState.Idle;
    }
}
