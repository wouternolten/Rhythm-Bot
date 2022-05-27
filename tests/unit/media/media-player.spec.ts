import { IMediaItemHelper } from './../../../src/helpers/IMediaItemHelper';
import { SpotifyAPIHelper } from './../../../src/helpers/SpotifyAPIHelper';
import { IMediaTypeProvider } from './../../../src/mediatypes/IMediaTypeProvider';
import { MessageEmbed, VoiceConnection } from 'discord.js';
import { MediaItem } from './../../../src/media/media-item.model';
import { TextChannel, StreamDispatcher, VoiceChannel } from 'discord.js';
import { BotStatus } from './../../../src/bot/bot-status';
import { IRhythmBotConfig } from '../../../src/bot/bot-config';
import { IMediaType, MediaPlayer } from '../../../src/media';
import { Readable } from 'stream';
import { MediaTypeNotFoundError } from '../../../src/mediatypes/MediaTypeNotFoundError';
import { mockLogger } from '../../mocks/mockLogger';

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

const logger = mockLogger();

const connection = {
    play: jest.fn()
} as unknown as VoiceConnection;

const mediaItemHelper = {
    getMediaItemForSearchString: jest.fn(),
    getMediaItemsForSearchString: jest.fn()
} as IMediaItemHelper;

const voiceChannel = {
    type: 'voice',
    join: () => Promise.resolve(connection)
} as unknown as VoiceChannel;

const spotifyAPIHelper = {} as unknown as SpotifyAPIHelper;

let mediaTypeProvider: IMediaTypeProvider;

beforeEach(() => {
    jest.clearAllMocks();
    mediaTypeProvider = {
        get: jest.fn()
    } as IMediaTypeProvider;

    mediaPlayer = new MediaPlayer(config, status, logger, mediaTypeProvider, spotifyAPIHelper, mediaItemHelper);
    mediaPlayer.setChannel(channel);
})

describe('Adding media', () => {
    it('Should reject when mediaTypeProvider throws error', async () => {
        expect.assertions(1);

        mediaTypeProvider.get = jest.fn(() => { throw new MediaTypeNotFoundError('MY ERROR') });

        try {
            await mediaPlayer.addMedia({} as MediaItem);
        } catch (error) {
            expect(error).toContain('MY ERROR');
        }
    });

    it('Should reject when unnamed item and invalid type are given', async () => {
        expect.assertions(1);

        try {
            await mediaPlayer.addMedia({} as MediaItem);
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

        mediaTypeProvider.get = jest.fn((args) => {
            if (args !== ITEM_TYPE) {
                throw new Error('ERROR IN TEST');
            }

            return mediaType;
        });

        expect.assertions(1);

        try {
            await mediaPlayer.addMedia(item);
        } catch (error) {
            expect(error).toEqual('Error when getting details for item');
        }
    });

    it('Should send a message to the channel when not silent', async () => {
        await mediaPlayer.addMedia(VALID_ITEM, false);

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

    it('Should log when type is invalid of first queue item', async () => {
        const item = { ...VALID_ITEM };
        item.type = 'invalid type';

        expect.assertions(1);

        mediaPlayer.addMedia(item, true);
        await mediaPlayer.setConnection(voiceChannel);

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
            mediaPlayer.addMedia(VALID_ITEM, true);
            mediaTypeProvider.get = jest.fn().mockReturnValue(mediaType);
            mediaPlayer.setConnection(voiceChannel);
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