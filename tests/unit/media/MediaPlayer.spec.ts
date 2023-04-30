import { IMediaTypeProvider } from '../../../src/mediatypes/IMediaTypeProvider';
import { MediaItem } from '../../../src/media/MediaItem';
import { TextChannel, VoiceChannel } from 'discord.js';
import { BotStatus } from '../../../src/bot/BotStatus';
import { IRhythmBotConfig } from '../../../src/bot/IRhythmBotConfig';
import { MediaPlayer } from '../../../src/media/MediaPlayer';
import { Readable } from 'stream';
import { MediaTypeNotFoundError } from '../../../src/mediatypes/MediaTypeNotFoundError';
import { mockLogger } from '../../mocks/mockLogger';
import { ISongRecommender, SongRecommender } from '../../../src/media/SongRecommender';
import { AudioPlayer } from '@discordjs/voice';
import { mock, MockProxy } from 'jest-mock-extended';
import { IMediaType } from '../../../src/media/MediaType';
import { createEmbed, createInfoEmbed } from '../../../src/helpers/helpers';
import { EmbedBuilder } from '@discordjs/builders';
import { clear } from 'console';
import { QueueManager } from '../../../src/queue/QueueManager';

const ITEM_TYPE = 'youtube';
const ITEM_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const ITEM_REQUESTOR = '!t3m r3q43st0r';
const ITEM_NAME = 'Rick Astley - Never Gonna Give You Up (Official Music Video)';
const ITEM_DURATION = '13:37';
const ITEM_BEGIN = '4:20';

jest.mock('../../../src/helpers/helpers');

const VALID_ITEM = {
    type: ITEM_TYPE,
    url: ITEM_URL,
    requestor: ITEM_REQUESTOR,
    name: ITEM_NAME,
    duration: ITEM_DURATION,
    begin: ITEM_BEGIN
} as MediaItem;

let mediaPlayer: MediaPlayer;
const config: IRhythmBotConfig = {
    stream: {
        seek: 1,
        bitrate: 1,
        forwardErrorCorrection: true,
        packetLossPercentage: 1,
    },
    emojis: {
        stopSong: '1',
        playSong: '1',
        pauseSong: '1',
        skipSong: '1',
    },
    queue: {
        repeat: false
    }
} as unknown as IRhythmBotConfig;

const status: BotStatus = {
    setBanner: jest.fn(),
    setActivity: jest.fn()
} as unknown as BotStatus;

const channel: TextChannel = {
    send: jest.fn()
} as unknown as TextChannel;

const logger = mockLogger();

let songRecommender: MockProxy<ISongRecommender>;
let audioPlayer: MockProxy<AudioPlayer>;
let mediaTypeProvider: MockProxy<IMediaTypeProvider>;

beforeEach(() => {
    jest.clearAllMocks();

    (createEmbed as jest.Mock).mockImplementation(() => {
        return new EmbedBuilder().setColor([1,2,3]);
    });
    mediaTypeProvider = mock<IMediaTypeProvider>();
    audioPlayer = mock<AudioPlayer>();
    songRecommender = mock<SongRecommender>();
    
    mediaPlayer = new MediaPlayer(
        config,
        status,
        logger,
        mediaTypeProvider,
        songRecommender,
        channel,
        audioPlayer
    );
})

describe.skip('To add later', () => {
    describe('Playing', () => {
        afterEach(() => {
            mediaPlayer.clear();
        });

        it('Should still have status paused when unpausing fails', async () => {
            mediaPlayer.pause();

            audioPlayer.pause.mockReturnValue(false);
            audioPlayer.unpause.mockReturnValue(false);

            await mediaPlayer.play();

            expect(createInfoEmbed).not.toHaveBeenCalledWith(expect.stringContaining('resumed'));
        });

        it('Should start playing when unpausing succeeds', async () => {
            audioPlayer.pause.mockReturnValue(true);
            audioPlayer.unpause.mockReturnValue(true);

            mediaPlayer.pause();

            await mediaPlayer.play();

            expect(createInfoEmbed).toHaveBeenCalledWith(expect.stringContaining('resumed'));
        });

        it('Should display a message that the queue is empty', async () => {
            mediaPlayer.clear();

            await mediaPlayer.play();

            expect(createInfoEmbed).toHaveBeenCalledWith('Queue is empty! Add some songs!');
        });
        
        it('Should log when type is invalid of first queue item', async () => {
            const item = { ...VALID_ITEM };
            item.type = 'invalid type';

            expect.assertions(1);

            mediaPlayer.play();

            // @ts-ignore
            const messageEmbed: MessageEmbed = channel.send.mock.calls[0][0] as MessageEmbed;

            expect(messageEmbed.description).toEqual(`Invalid type for item. See logs`);
        });
    });

    describe('stop()', () => {
        it('Should do nothing when player state is idle', () => {
            mediaPlayer.stop();

            expect(audioPlayer.stop).not.toBeCalled();
        });

        it('Should log and still be idle if stopping fails', () => {
            simulatePausedState();

            audioPlayer.stop.mockReturnValue(false);

            mediaPlayer.stop();

            expect(logger.error).toBeCalled();
            expect(createInfoEmbed).not.toBeCalled();
        });

        it('Should stop without message to channel if no queue item', () => {
            simulatePausedState();

            audioPlayer.stop.mockReturnValue(true);

            mediaPlayer.stop();

            expect(createInfoEmbed).not.toBeCalled();
            expect(status.setBanner).toHaveBeenCalledTimes(2);
            expect(status.setBanner).toHaveBeenCalledWith('No Songs In Queue');
        });

        it('Should stop with message to channel if queue item', () => {
            simulateQueue();
            simulatePausedState();

            audioPlayer.stop.mockReturnValue(true);

            mediaPlayer.stop();

            expect(createInfoEmbed).toHaveBeenNthCalledWith(2, expect.stringContaining('stopped'));
        });
    });

    describe('pause()', () => {
        beforeEach(() => {
            simulateQueue();
        });

        it('Should do nothing when not playing', () => {
            mediaPlayer.pause();

            expect(createInfoEmbed).not.toBeCalled();
        });

        it('Should not send message when unsuccesfully pausing', () => {
            simulatePlayingState();

            audioPlayer.pause.mockReturnValueOnce(false);

            mediaPlayer.pause();

            expect(audioPlayer.pause).toHaveBeenCalled();
            expect(createInfoEmbed).not.toHaveBeenCalled();
        });

        it('Should send message when succesfully pausing', () => {
            simulatePlayingState();

            audioPlayer.pause.mockReturnValueOnce(true);

            mediaPlayer.pause();

            expect(audioPlayer.pause).toHaveBeenCalled();
            expect(createInfoEmbed).toHaveBeenCalled(expect.stringContaining('paused'));
        });

        afterEach(() => {
            clear();
        });
    })
});

// TODO: COMPLETELY REMOVE ADD MEDIA AND USE QUEUE MANAGER

function simulatePausedState(): void
{
    audioPlayer.pause.mockReturnValueOnce(true);
    mediaPlayer.pause();
}

function simulatePlayingState(): void
{
    simulateQueue();
    const myType = mock<IMediaType>();
    const readable = mock<Readable>();
    myType.getStream.mockResolvedValue(readable);
    mediaTypeProvider.get.mockReturnValueOnce(myType);
    mediaPlayer.play();
}
