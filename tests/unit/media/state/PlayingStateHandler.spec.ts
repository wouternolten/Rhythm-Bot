import { AudioPlayer } from '@discordjs/voice';
import { mock } from 'jest-mock-extended';
import { getValidMediaItem } from '../../../fixtures/mediaItemFixtures';
import { BotStatus } from './../../../../src/bot/BotStatus';
import { IChannelManager } from './../../../../src/channel/ChannelManager';
import PlayingStateHandler from './../../../../src/media/state/PlayingStateHandler';
import { IQueueManager } from './../../../../src/queue/QueueManager';

let handler: PlayingStateHandler;

const status = mock<BotStatus>();
const audioPlayer = mock<AudioPlayer>();
const queueManager = mock<IQueueManager>();
const channelManager = mock<IChannelManager>();

beforeEach(() => {
    jest.resetAllMocks();

    handler = new PlayingStateHandler(status, audioPlayer, queueManager, channelManager);
});

describe('stop()', () => {
    it('Should throw an error when stopping the audio player fails', async () => {
        audioPlayer.stop.mockReturnValue(false);

        expect.assertions(1);

        try {
            await handler.stop();
        } catch (e) {
            expect(e).toBeDefined();
        }
    });

    describe('stop succeeds', () => {
        beforeEach(() => {
            audioPlayer.stop.mockReturnValue(true);
        });

        it('Should not send a message to channel manager when last song not found and not silent', async () => {
            queueManager.getLastPlayedSong.mockReturnValue(undefined);

            await handler.stop(false);

            expect(channelManager.sendInfoMessage).not.toHaveBeenCalled();
        });

        it('Should send a message to channel when last song found and not silent', async () => {
            const item = getValidMediaItem();
            queueManager.getLastPlayedSong.mockReturnValue(item);

            await handler.stop(false);

            expect(channelManager.sendInfoMessage).toHaveBeenCalledWith(expect.stringContaining(item.name));
        });

        it('Should empty banner when no next song found', async () => {
            await handler.stop(true);

            expect(status.emptyBanner).toHaveBeenCalled();
        });

        it('Should set the banner to the next song to play when found', async () => {
            queueManager.nextSongInQueue.mockResolvedValue(getValidMediaItem());

            await handler.stop(true);

            expect(status.setBanner).toHaveBeenCalledWith(expect.stringContaining(getValidMediaItem().name));
        });
    });
});

describe('pause()', () => {
    it('Should throw an error when pausing the audio player fails', async () => {
        audioPlayer.pause.mockReturnValue(false);

        expect.assertions(1);

        try {
            await handler.pause();
        } catch (e) {
            expect(e).toBeDefined();
        }
    });

    it('Should send a message in channel and set banner when last played song found', async () => {
        const item = getValidMediaItem();
        audioPlayer.pause.mockReturnValue(true);
        queueManager.getLastPlayedSong.mockReturnValue(item);

        await handler.pause();

        expect(channelManager.sendInfoMessage).toHaveBeenCalledWith(expect.stringContaining(item.name));
        expect(status.setBanner).toHaveBeenCalledWith(expect.stringContaining(item.name));
    });

    it('Should not error out when unpausing succeeds', async () => {
        audioPlayer.pause.mockReturnValue(true);
        queueManager.getLastPlayedSong.mockReturnValue(undefined);

        await handler.pause();

        expect(true).toBe(true);
    });
});
