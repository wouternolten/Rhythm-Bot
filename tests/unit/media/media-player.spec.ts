import { MessageEmbed, VoiceConnection } from 'discord.js';
import { MediaItem } from './../../../src/media/media-item.model';
import { Logger, Message, TextChannel, StreamDispatcher } from 'discord-bot-quickstart';
import { BotStatus } from './../../../src/bot/bot-status';
import { IRhythmBotConfig } from '../../../src/bot/bot-config';
import { IMediaType, MediaPlayer } from '../../../src/media';
import { Readable } from 'stream';

const ITEM_TYPE = 'youtube';
const ITEM_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const ITEM_REQUESTOR = '!t3m r3q43st0r';
const ITEM_NAME = 'Rick Astley - Never Gonna Give You Up (Official Music Video)';
const ITEM_DURATION = '13:37';
const ITEM_BEGIN = '4:20';

const VALID_ITEM = {
    type: ITEM_TYPE,
    url: ITEM_URL,
    requestor: ITEM_REQUESTOR,
    name: ITEM_NAME,
    duration: ITEM_DURATION,
    begin: ITEM_BEGIN
} as MediaItem;

const VALID_MESSAGE = {
    member: {
        voice: {
            channel: {
                type: 'voice',
                join: jest.fn().mockResolvedValue({})
            }
        }
    }
} as unknown as Message;

let mediaPlayer: MediaPlayer;
const config: IRhythmBotConfig = {
    stream: {
        seek: 1,
        volume: 1,
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

const logger: Logger = {
    debug: jest.fn(),
    error: jest.fn()
} as unknown as Logger;

const connection = {
    play: jest.fn()
} as unknown as VoiceConnection;

beforeEach(() => {
    jest.clearAllMocks();
    mediaPlayer = new MediaPlayer(config, status, channel, logger);
})

describe('Adding media', () => {
    it('Should reject when unnamed item and invalid type are given', async () => {
        expect.assertions(1);

        try {
            await mediaPlayer.addMedia({} as MediaItem, VALID_MESSAGE);
        } catch (error) {
            expect(error).toEqual('Unknown Media Type!');
        }
    });

    it('Should reject when unnamed item details cannot be found', async () => {
        const item = {
            type: ITEM_TYPE
        } as MediaItem;

        const mediaType = {
            getDetails: jest.fn().mockRejectedValue('Error')
        } as unknown as IMediaType;

        mediaPlayer.typeRegistry.set(ITEM_TYPE, mediaType);

        expect.assertions(1);

        try {
            await mediaPlayer.addMedia(item, VALID_MESSAGE);
        } catch (error) {
            expect(error).toEqual('Error when getting details for item');
        }
    });

    it('Should send a message to the channel when not silent', async () => {
        await mediaPlayer.addMedia(VALID_ITEM, VALID_MESSAGE, false);

        expect(channel.send).toBeCalled();
    });
});

describe('Playing', () => {
    it('Should display a message that the queue is empty', () => {
        mediaPlayer.play();

        // @ts-ignore
        const messageEmbed: MessageEmbed = channel.send.mock.calls[0][0] as MessageEmbed;

        expect(messageEmbed.title).toEqual(`Queue is empty! Add some songs!`);
    });

    it('Should display a message when no connection is established', () => {
        mediaPlayer.queue.enqueue(VALID_ITEM);

        mediaPlayer.play();
     
    });

    it('Should log when type is invalid of first queue item', () => {
        const item = { ...VALID_ITEM };
        item.type = 'invalid type';

        mediaPlayer.queue.enqueue(item);
        mediaPlayer.setConnection(connection);

        mediaPlayer.play();

        // @ts-ignore
        const messageEmbed: MessageEmbed = channel.send.mock.calls[0][0] as MessageEmbed;

        expect(messageEmbed.description).toEqual(`Invalid type for item. See logs`);
    });

    describe('Happy path playing', () => {
        const mediaType = {
            getStream: jest.fn().mockResolvedValue(new Readable())
        } as unknown as IMediaType;

        const dispatcher = {
            on: jest.fn(),
            resume: jest.fn(),
            pause: jest.fn(),
            end: jest.fn()
        } as unknown as StreamDispatcher;

        beforeEach(() => {
            mediaPlayer.queue.enqueue(VALID_ITEM);
            mediaPlayer.typeRegistry.set(ITEM_TYPE, mediaType);
            mediaPlayer.setConnection(connection);
            connection.play = jest.fn(() => dispatcher);
        });

        it('Should dispatch stream when not playing', async () => {
            await mediaPlayer.play();

            expect(connection.play).toBeCalled();
            expect(dispatcher.on).toBeCalled();
        });

        it('Should resume dispatcher after pausing', async () => {
            await mediaPlayer.play();

            mediaPlayer.pause();

            await mediaPlayer.play();
            expect(dispatcher.resume).toBeCalled();
        })

        it('Should display a message when already playing and not paused', async () => {
            await mediaPlayer.play();
            await mediaPlayer.play();

            // @ts-ignore
            const messageEmbed: MessageEmbed = channel.send.mock.calls[0][0] as MessageEmbed;

            expect(messageEmbed.title).toEqual(`Already playing a song!`);
        })
    });
});