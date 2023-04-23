import { Readable } from 'stream';
import ytdl from 'ytdl-core';
import { mockLogger } from '../../mocks/mockLogger';
import { MediaItem } from './../../../src/media/MediaItem';
import { YoutubeMediaType } from './../../../src/mediatypes/YoutubeMediaType';

const URL = 'some_url';
const NAME = 'song title';
const DURATION = '4:20:69';

let mockYtplReturnValue;
let mockYtdlCoreReturnValue = jest.fn();
let mockYtdlGetInfoReturnValue = jest.fn();

jest.mock('ytdl-core', () => {
    const originalModule = jest.requireActual('ytdl-core');

    return {
        __esModule: true,
        ...originalModule,
        default: (...params: any) => mockYtdlCoreReturnValue(params),
        getInfo: (...params: any) => mockYtdlGetInfoReturnValue(params)
    }
});

jest.mock('ytpl', () => {
    const originalModule = jest.requireActual('ytpl');

    return {
        __esModule: true,
        ...originalModule,
        default: () => mockYtplReturnValue
    }
});

const MEDIA_ITEM = {
    type: 'some_type',
    url: URL,
} as MediaItem;

let youtubeMediaType: YoutubeMediaType;

const logger = mockLogger();

beforeEach(() => {
    youtubeMediaType = new YoutubeMediaType(logger);
});

describe('Playlist', () => {
    it('Should return rejected promise from ytpl on getPlaylist', async () => {
        mockYtplReturnValue = Promise.reject('My error');

        expect.assertions(1);

        try {
            await youtubeMediaType.getPlaylist(MEDIA_ITEM);
        } catch (error) {
            expect(error).toEqual('My error');
        }
    });

    it('Should return rejected promise on invalid return object', async () => {
        mockYtplReturnValue = Promise.resolve({});

        expect.assertions(1);

        try {
            await youtubeMediaType.getPlaylist(MEDIA_ITEM);
        } catch (error) {
            expect(error).toContain('playlist');
        }
    });

    it('Should return a playlist of items on getPlaylist', async () => {
        const playList = {
            items: [{
                url: URL,
                title: NAME,
                duration: DURATION
            }]
        };

        mockYtplReturnValue = Promise.resolve(playList);

        expect.assertions(1);

        const result = await youtubeMediaType.getPlaylist(MEDIA_ITEM);

        expect(result).toEqual([{
            type: youtubeMediaType.getType(),
            url: URL,
            name: NAME,
            duration: DURATION
        }]);
    })
});

describe('Details', () => {
    it('Should return item when duration and name are set', async () => {
        const item = {
            name: NAME,
            duration: DURATION
        } as MediaItem;

        expect.assertions(1);

        const result = await youtubeMediaType.getDetails(item);

        expect(result).toBe(item);
    });

    it('Should search for a full youtube url when item url is only a part', async () => {
        const item = {
            url: URL
        } as MediaItem;

        mockYtdlGetInfoReturnValue.mockResolvedValue(item);

        expect.assertions(1);

        await youtubeMediaType.getDetails(item);
        
        expect(mockYtdlGetInfoReturnValue.mock.calls[0][0][0]).toContain('https://');   
    });

    it('Should return info about an item', async () => {
        const item = {
            url: 'https://awesome-sauce.com/' + URL
        } as MediaItem;

        const returnedVideoInfo = {
            videoDetails: {
                title: NAME,
                lengthSeconds: '1'
            }
        } as ytdl.videoInfo;

        mockYtdlGetInfoReturnValue.mockResolvedValue(returnedVideoInfo);

        const result = await youtubeMediaType.getDetails(item);

        expect(result).toEqual({
            url: 'https://awesome-sauce.com/' + URL,
            name: NAME,
            duration: '00:00:01'
        });
    });
});

describe('Stream', () => {
    it('Should return a readable stream', async () => {
        const returnReadable = new Readable();

        mockYtdlCoreReturnValue.mockResolvedValue(returnReadable);

        expect.assertions(1);

        const result = await youtubeMediaType.getStream(MEDIA_ITEM);

        expect(result).toBe(returnReadable);
    });
});
