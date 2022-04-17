import { MEDIA_TYPE_YOUTUBE } from './../../../src/mediatypes/MediaType';
import { YoutubeAPIHelper } from './../../../src/helpers/YoutubeAPIHelper';
import * as youtube from 'youtube-search-without-api-key';
import { mockLogger } from '../../mocks/mockLogger';

jest.mock('youtube-search-without-api-key');

const NEVER_GONNA_GIVE_YOU_UP = 'Never gonna give you up';
const NEVER_GONNA_GIVE_YOU_UP_YOUTUBE_LINK = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const NEVER_GONNA_GIVE_YOU_UP_DURATION = '13:37';
const NEVER_GONNA_LET_YOU_DOWN = 'Never gonna let you down';
const NEVER_GONNA_LET_YOU_DOWN_YOUTUBE_LINK = 'https://www.youtube.com/watch?v=Ar-IEE_DIEo';
const NEVER_GONNA_LET_YOU_DOWN_DURATION = '42:69';

let youtubeAPIHelper: YoutubeAPIHelper;
let logger = mockLogger();

beforeEach(() => {
    youtubeAPIHelper = new YoutubeAPIHelper(logger);
});


it.each(['getMediaItemForSearchString', 'getMediaItemsForSearchString'])
    ('Should return null when empty search string provided', async (functionName: string) => {
        const result = await youtubeAPIHelper[functionName]('');
        
        expect(result).toBeNull();
    });


it.each(['getMediaItemForSearchString', 'getMediaItemsForSearchString'])
    ('Should return null when empty search string provided', async (functionName: string) => {
        const result = await youtubeAPIHelper[functionName]('');
        
        expect(result).toBeNull();
    });

it.each([null, undefined])
    ('Should return null when empty search results returned', async (value: null | undefined | []) => {
        (youtube.search as jest.Mock).mockResolvedValue(value);

        const result = await youtubeAPIHelper.getMediaItemForSearchString('The best videos ever');

        expect(result).toBeNull();
    });

it('Should return null when empty array search results returned', async () => {
        (youtube.search as jest.Mock).mockResolvedValue([]);

        const result = await youtubeAPIHelper.getMediaItemForSearchString('The best videos ever');

        expect(result).toBeNull();
});

it('Should return first result given', async () => {
    (youtube.search as jest.Mock).mockResolvedValue([
        {
            snippet: {
                url: NEVER_GONNA_GIVE_YOU_UP_YOUTUBE_LINK,
                title: NEVER_GONNA_GIVE_YOU_UP
            },
            duration_raw: NEVER_GONNA_GIVE_YOU_UP_DURATION
        },
        {
            snippet: {
                url: NEVER_GONNA_LET_YOU_DOWN_YOUTUBE_LINK,
                title: NEVER_GONNA_LET_YOU_DOWN
            },
            duration_raw: NEVER_GONNA_LET_YOU_DOWN_DURATION
        }
    ]);


    const result = await youtubeAPIHelper.getMediaItemForSearchString('The best videos ever');

    expect(result).toEqual({
        type: MEDIA_TYPE_YOUTUBE,
        url: NEVER_GONNA_GIVE_YOU_UP_YOUTUBE_LINK,
        name: NEVER_GONNA_GIVE_YOU_UP,
        duration: NEVER_GONNA_GIVE_YOU_UP_DURATION
    });
});

it('Should log and return null when search rejects', async () => {
    (youtube.search as jest.Mock).mockRejectedValue('Error');

    const result = await youtubeAPIHelper.getMediaItemForSearchString('The best videos ever');

    expect(logger.error).toBeCalled();
    expect(result).toBeNull();
})