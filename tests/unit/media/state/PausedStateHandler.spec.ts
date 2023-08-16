import { AudioPlayer } from '@discordjs/voice';
import { mock } from 'jest-mock-extended';
import { IAudioPlayerFactory } from '../../../../src/helpers/AudioPlayerFactory';
import PausedStateHandler from '../../../../src/media/state/PausedStateHandler';
import { getValidMediaItem } from '../../../fixtures/mediaItemFixtures';
import { BotStatus } from './../../../../src/bot/BotStatus';
import { IChannelManager } from './../../../../src/channel/ChannelManager';
import { IQueueManager } from './../../../../src/queue/QueueManager';

let handler: PausedStateHandler;

const status = mock<BotStatus>();
const audioPlayer = mock<AudioPlayer>();
const audioPlayerFactory = mock<IAudioPlayerFactory>();
const queueManager = mock<IQueueManager>();
const channelManager = mock<IChannelManager>();

beforeEach(() => {
    jest.resetAllMocks();

    audioPlayerFactory.getAudioPlayer.mockReturnValue(audioPlayer);

    handler = new PausedStateHandler(status, audioPlayerFactory, queueManager, channelManager);
});

describe('stop()', () => {
    it('Should throw an error when no audio player could be created', async () => {
        audioPlayerFactory.getAudioPlayer.mockReturnValue(undefined);

        try {
            await handler.stop();
        } catch (e) {
            expect(e).toBeDefined();
        }
    });

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
            queueManager.nextSongInQueue.mockReturnValue(getValidMediaItem());

            await handler.stop(true);

            expect(status.setBanner).toHaveBeenCalledWith(expect.stringContaining(getValidMediaItem().name));
        });
    });
});

describe('play()', () => {
    it('Should throw an error when no audio player could be created', async () => {
        audioPlayerFactory.getAudioPlayer.mockReturnValue(undefined);

        try {
            await handler.play();
        } catch (e) {
            expect(e).toBeDefined();
        }
    });

    it('Should throw an error when unpausing the audio player fails', async () => {
        audioPlayer.unpause.mockReturnValue(false);

        expect.assertions(1);

        try {
            await handler.play();
        } catch (e) {
            expect(e).toBeDefined();
        }
    });

    it('Should not error out', async () => {
        audioPlayer.unpause.mockReturnValue(true);

        await handler.play();

        expect(channelManager.sendInfoMessage).not.toHaveBeenCalled();
        expect(status.setBanner).not.toHaveBeenCalled();
    });

    it('Should set banner and send info message when song found', async () => {
        const item = getValidMediaItem();
        audioPlayer.unpause.mockReturnValue(true);
        queueManager.getLastPlayedSong.mockReturnValue(item);

        await handler.play();

        expect(channelManager.sendInfoMessage).toHaveBeenCalledWith(expect.stringContaining(item.name));
        expect(status.setBanner).toHaveBeenCalledWith(expect.stringContaining(item.name));
    });
});
