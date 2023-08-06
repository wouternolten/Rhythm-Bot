import { AudioPlayer } from '@discordjs/voice';
import { mock } from 'jest-mock-extended';
import { Readable } from 'stream';
import { Logger } from 'winston';
import { BotStatus } from '../../../../src/bot/BotStatus';
import { IChannelManager } from '../../../../src/channel/ChannelManager';
import { IMediaType } from '../../../../src/media/MediaType';
import IdleStateHandler from '../../../../src/media/state/IdleStateHandler';
import { IMediaTypeProvider } from '../../../../src/mediatypes/IMediaTypeProvider';
import { IQueueManager } from '../../../../src/queue/QueueManager';
import { getValidMediaItem } from '../../../fixtures/mediaItemFixtures';

jest.mock('@discordjs/voice');

let handler: IdleStateHandler;

const status = mock<BotStatus>();
const logger = mock<Logger>();
const mediaTypeProvider = mock<IMediaTypeProvider>();
const audioPlayer = mock<AudioPlayer>();
const queueManager = mock<IQueueManager>();
const channelManager = mock<IChannelManager>();

beforeEach(() => {
    jest.resetAllMocks();

    handler = new IdleStateHandler(status, logger, mediaTypeProvider, audioPlayer, queueManager, channelManager);
});

describe('play()', () => {
    it('Should throw error when item is not found', async () => {
        queueManager.getNextSongToPlay.mockResolvedValue(undefined);

        expect.assertions(2);

        try {
            await handler.play();
        } catch (e) {
            expect(channelManager.sendErrorMessage).toHaveBeenCalled();
            expect(e).toBeDefined();
        }
    });

    it('Should throw error when mediaType not found', async () => {
        queueManager.getNextSongToPlay.mockResolvedValue(getValidMediaItem());
        mediaTypeProvider.get.mockReturnValue(undefined);

        expect.assertions(3);

        try {
            await handler.play();
        } catch (e) {
            expect(logger.error).toHaveBeenCalled();
            expect(channelManager.sendErrorMessage).toHaveBeenCalled();
            expect(e).toBeDefined();
        }
    });

    it('Should start playing he audio player when found', async () => {
        queueManager.getNextSongToPlay.mockResolvedValue(getValidMediaItem());
        const mediaType = mock<IMediaType>();
        mediaType.getStream.mockResolvedValue(mock<Readable>());
        mediaTypeProvider.get.mockReturnValue(mediaType);

        await handler.play();

        expect(audioPlayer.play).toHaveBeenCalled();
    });
});
