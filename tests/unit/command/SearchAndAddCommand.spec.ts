import { MediaItem } from './../../../src/media/media-item.model';
import { IMediaItemHelper } from './../../../src/helpers/IMediaItemHelper';
import { SpotifyAPIHelper } from './../../../src/helpers/SpotifyAPIHelper';
import { MediaPlayer } from '../../../src/media';
import { SearchAndAddCommand } from './../../../src/command/SearchAndAddCommand';
import { createErrorEmbed, createInfoEmbed } from '../../../src/helpers';
import { mockLogger } from '../../mocks/mockLogger';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';

jest.mock('../../../src/helpers');

jest.mock('ytpl', () => {
    const originalModule = jest.requireActual('ytpl');

    return {
        __esModule: true,
        ...originalModule,
        default: () => mockYtplReturnValue
    }
});

let searchAndAddCommand: SearchAndAddCommand;
let mockYtplReturnValue;//, mockYtsReturnValue;
let player = {
    addMedia: jest.fn(),
    isPlaying: jest.fn(),
    play: jest.fn()
} as unknown as MediaPlayer;

let spotifyAPIHelper = {} as unknown as SpotifyAPIHelper;

let logger = mockLogger();

let mediaItemHelper = {
    getMediaItemForSearchString: jest.fn()
} as unknown as IMediaItemHelper;

const RICK_ASTLEY = 'RICK_ASTLEY';
const NEVER_GONNA_GIVE_YOU_UP_SPOTIFY_RADIO = 'https://open.spotify.com/playlist/37i9dQZF1E8NRjNUGTUFgD?si=70798392132d446d';
const NEVER_GONNA_GIVE_YOU_UP_YOUTUBE_LINK = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

const MESSAGE = {
    channel: {
        send: jest.fn()
    },
    author: {
        username: RICK_ASTLEY
    }
} as unknown as Message;

beforeEach(() => {
    jest.clearAllMocks();
    searchAndAddCommand = new SearchAndAddCommand(player, spotifyAPIHelper, mediaItemHelper, logger);
})

it('Should return when no body given', async () => {
    expect.assertions(1);

    await searchAndAddCommand.execute({} as SuccessfulParsedMessage<Message>, MESSAGE);

    expect(MESSAGE.channel.send).toBeCalled();
});

it('Should have a description', () => {
    expect(searchAndAddCommand.getDescription()).toBeDefined();
});

describe('Playlist', () => {
    const CMD = {
        body: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL634F2B56B8C346A2'
    } as unknown as SuccessfulParsedMessage<Message>;
    
    it('Should return when no playlist found', async () => {
        expect.assertions(1);

        mockYtplReturnValue = Promise.reject('error');

        await searchAndAddCommand.execute(CMD, MESSAGE);

        expect(createErrorEmbed).toBeCalled();
    });

    it.each([
        undefined,
        {},
        { title: 'Title' },
        { items: {} },
        { title: 'Some title', items: {} },
        { title: 'Some title', items: [] }
    ])('Should return when invalid results returned', async (ytplReturnValue) => {
        expect.assertions(1);

        mockYtplReturnValue = Promise.resolve(ytplReturnValue);

        await searchAndAddCommand.execute(CMD, MESSAGE);

        expect(createErrorEmbed).toBeCalled();
    });

    it('Should add media to player', async () => {
        expect.assertions(1);

        player.isPlaying = jest.fn().mockReturnValue(true);

        mockYtplReturnValue = Promise.resolve({
            title: 'Rick astley playlist',
            items: [
                {
                    name: 'first item',
                    shortUrl: 'url',
                    duration: '12345'
                },
                {
                    name: 'second item',
                    shortUrl: 'url',
                    duration: '12345'
                }
            ]
        });

        await searchAndAddCommand.execute(CMD, MESSAGE);

        expect(player.addMedia).toBeCalledTimes(2);
    });

    it('Should add media to player and play', async () => {
        expect.assertions(2);

        player.isPlaying = jest.fn().mockReturnValue(false);

        mockYtplReturnValue = Promise.resolve({
            title: 'Rick astley playlist',
            items: [
                {
                    name: 'first item',
                    shortUrl: 'url',
                    duration: '12345'
                },
                {
                    name: 'second item',
                    shortUrl: 'url',
                    duration: '12345'
                }
            ]
        });

        await searchAndAddCommand.execute(CMD, MESSAGE);

        expect(player.addMedia).toBeCalledTimes(2);
        expect(player.play).toBeCalled();
    });
});

describe('Youtube video', () => {
    const CMD = {
        body: NEVER_GONNA_GIVE_YOU_UP_YOUTUBE_LINK
    } as unknown as SuccessfulParsedMessage<Message>;

    it('Should add media to player and play', async () => {
        expect.assertions(2);

        await searchAndAddCommand.execute(CMD, MESSAGE);

        expect(player.addMedia).toBeCalled();
        expect(player.play).toBeCalled();
    });
});

describe('Search terms', () => {
    const CMD_BODY = 'Rick Astley';
    const CMD = {
        body: CMD_BODY
    } as unknown as SuccessfulParsedMessage<Message>;

    it('Should return when search videos errors out', async () => {
        expect.assertions(1);
        
        mediaItemHelper.getMediaItemForSearchString = jest.fn(() => Promise.reject('Error'));

        await searchAndAddCommand.execute(CMD, MESSAGE);

        expect(createErrorEmbed).toBeCalled();
    });

    it('Should return when no video result found', async () => {
        expect.assertions(1);

         mediaItemHelper.getMediaItemForSearchString = jest.fn(() => Promise.resolve(null));

        await searchAndAddCommand.execute(CMD, MESSAGE);

        expect(player.addMedia).not.toBeCalled();
    });

    it('Should add found video to player', async () => {
        const video = {
            type: 'youtube',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            title: 'The best video ever',
            duration: '69:42'
        } as MediaItem;

        expect.assertions(1);
        mediaItemHelper.getMediaItemForSearchString = jest.fn(() => Promise.resolve(video));

        await searchAndAddCommand.execute(CMD, MESSAGE);

        expect(player.addMedia).toHaveBeenCalledWith({
            ...video,
            requestor: RICK_ASTLEY
        }, false);
    });
});

describe('Spotify playlist', () => {
    const CMD = {
        body: NEVER_GONNA_GIVE_YOU_UP_SPOTIFY_RADIO
    } as unknown as SuccessfulParsedMessage<Message>;

    it('Should send channel message and return when invalid playlist given', async () => {
        const invalidPlayListCommand = {
            body: 'https://open.spotify.com/playlist?si=70798392132d446d'
        } as unknown as SuccessfulParsedMessage<Message>;

        expect.assertions(1);

        await searchAndAddCommand.execute(invalidPlayListCommand, MESSAGE);

        expect(createInfoEmbed).toBeCalled();
    });

    it('Should error out when spotify cannot get tracks', async () => {
        spotifyAPIHelper.getTracksFromPlaylist = jest.fn().mockRejectedValue('error');

        expect.assertions(1);

        await searchAndAddCommand.execute(CMD, MESSAGE);

        expect(createErrorEmbed).toBeCalled();
    });

    it('Should not quit when one track not found', async () => {
        const video = {
            type: 'youtube',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            title: 'The best video ever',
            duration: '69:42'
        } as MediaItem;

        expect.assertions(1);

        mediaItemHelper.getMediaItemForSearchString = jest.fn(() => Promise.resolve(video));
        spotifyAPIHelper.getTracksFromPlaylist = jest.fn().mockResolvedValue(['The best song ever']);

        await searchAndAddCommand.execute(CMD, MESSAGE);

        expect(createInfoEmbed).toBeCalled();
    });
});