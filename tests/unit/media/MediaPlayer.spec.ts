import { mock } from 'jest-mock-extended';
import { Logger } from 'winston';
import { BotStatus } from '../../../src/bot/BotStatus';
import { IChannelManager } from '../../../src/channel/ChannelManager';
import { AudioEventBus, AudioEventBusStatus } from '../../../src/helpers/EventBus';
import { MediaPlayer } from '../../../src/media/MediaPlayer';
import IMediaPlayerStateHandler from '../../../src/media/state/IMediaPlayerStateHandler';
import { PlayerState } from '../../../src/media/state/Types';
import { IQueueManager } from '../../../src/queue/QueueManager';

let mediaPlayer: MediaPlayer;

const status = mock<BotStatus>();
const logger = mock<Logger>();
const queueManager = mock<IQueueManager>();
const channelManager = mock<IChannelManager>();
const stateHandler = mock<IMediaPlayerStateHandler>();
let eventBus: AudioEventBus;

beforeEach(() => {
    jest.resetAllMocks();

    eventBus = new AudioEventBus();
    mediaPlayer = new MediaPlayer(status, logger, queueManager, channelManager, [stateHandler], eventBus);

    stateHandler.getApplicableStateName.mockReturnValue(PlayerState.Idle);
});

describe('Initialize', () => {
    describe('stateChange event', () => {
        it('Should not play when previous player state was not playing', () => {
            mediaPlayer.initializePlayer();

            eventBus.emit(AudioEventBusStatus.AudioPlayerIdle);

            expect(logger.debug).toHaveBeenCalled();
            expect(stateHandler.play).not.toHaveBeenCalled();
        });

        it('Should play new song when player is idle', async () => {
            mediaPlayer.initializePlayer();

            await mediaPlayer.play();

            eventBus.emit(AudioEventBusStatus.AudioPlayerIdle);

            expect(stateHandler.play).toHaveBeenCalledTimes(2);
        });
    });

    describe('error event', () => {
        it('Should log error, send to channel and skip song on error', async () => {
            mediaPlayer.initializePlayer();

            eventBus.emit(AudioEventBusStatus.AudioPlayerError, new Error());
            expect.assertions(3);

            expect(logger.error).toHaveBeenCalled();
            expect(channelManager.sendErrorMessage).toHaveBeenCalledWith(expect.stringContaining('Error Playing Song'));
            expect(channelManager.sendErrorMessage).toHaveBeenCalledTimes(1);
        });
    });
});

describe.each(['play', 'stop', 'pause'])('play/stop/pause()', (value: string) => {
    it(`Should throw error when ${value} fails`, async () => {
        const error = new Error('error');
        stateHandler[value].mockRejectedValue(error);

        expect.assertions(2);

        await mediaPlayer[value]();

        expect(channelManager.sendErrorMessage).toHaveBeenCalledWith(expect.stringContaining(value));
        expect(logger.error).toHaveBeenCalledWith(error);
    });

    it(`Should not fail when ${value} succeeds`, async () => {
        await mediaPlayer[value]();

        expect(channelManager.sendErrorMessage).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });

    it('Should error out when handler not found', async () => {
        stateHandler.getApplicableStateName.mockReturnValue('INVALID');

        expect.assertions(2);

        await mediaPlayer[value]();

        expect(channelManager.sendErrorMessage).toHaveBeenCalledWith(expect.stringContaining(value));
        expect(logger.error).toHaveBeenCalled();
    });
});

describe('skip()', () => {
    it('Should stop and play succesfully', async () => {
        await mediaPlayer.skip();

        expect(stateHandler.stop).toHaveBeenCalledWith(true);
    });
});
