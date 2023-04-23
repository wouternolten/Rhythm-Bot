import { MediaItem } from './../../../src/media/media-item.model';
import { SpotifyAPIHelper } from './../../../src/helpers/SpotifyAPIHelper';
import { SongRecommender } from './../../../src/media/SongRecommender';
import { mock, MockProxy } from 'jest-mock-extended';
import { IMediaItemHelper } from '../../../src/helpers/IMediaItemHelper';
import { Logger } from 'winston';

let songRecommender: SongRecommender;
let spotifyApiHelper: MockProxy<SpotifyAPIHelper>;
let mediaItemHelper: MockProxy<IMediaItemHelper>;
let logger: MockProxy<Logger>

beforeEach(() => {
    spotifyApiHelper = mock<SpotifyAPIHelper>();
    mediaItemHelper = mock<IMediaItemHelper>();
    logger = mock<Logger>();
    
    songRecommender = new SongRecommender(
        spotifyApiHelper,
        mediaItemHelper,
        logger
    );
});

describe('recommendNextSong()', () => {
    it('Should return null when media item has no name', async () => {
        expect(await songRecommender.recommendNextSong({} as MediaItem)).toBeNull();
    });

    it('Should search for track and artist when lastPlayedSong has them', async () => {
        const lastPlayedSong = {
            name: "Rick Astley - Never gonna give you up"
        } as MediaItem;

        await songRecommender.recommendNextSong(lastPlayedSong);

        expect(spotifyApiHelper.getSpotifyIDForSong).toHaveBeenCalledWith(
            "Never gonna give you up",
            "Rick Astley"
        );
    });

    it('Should search for full name when lastPlayedSong does not have hyphen', async () => {
        const lastPlayedSong = {
            name: "Rick Astley Never gonna give you up"
        } as MediaItem;

        await songRecommender.recommendNextSong(lastPlayedSong);

        expect(spotifyApiHelper.getSpotifyIDForSong).toHaveBeenCalledWith(
            "Rick Astley Never gonna give you up",
            undefined
        );
    });

    it('Should search for track and artist when lastPlayedSong has them with brackets added', async () => {
        const lastPlayedSong = {
            name: "Rick Astley - Never gonna give you up (Official video)"
        } as MediaItem;

        await songRecommender.recommendNextSong(lastPlayedSong);

        expect(spotifyApiHelper.getSpotifyIDForSong).toHaveBeenCalledWith(
            "Never gonna give you up",
            "Rick Astley"
        );
    });

    it('Should log and return null when spotify helper throws error', async () => {
        const lastPlayedSong = {
            name: "Rick Astley - Never gonna give you up (Official video)"
        } as MediaItem;

        const error = new Error();

        spotifyApiHelper.getSpotifyIDForSong.mockRejectedValue(error);

        const result = await songRecommender.recommendNextSong(lastPlayedSong);

        expect(logger.error).toHaveBeenCalledWith(expect.any(String), { error, lastPlayedSong });
        expect(result).toBeNull();
    });

    it('Should return mediaItem from helper when found', async () => {
        const lastPlayedSong = {
            name: "Rick Astley - Never gonna give you up (Official video)"
        } as MediaItem;

        const expected = {
            name: "Some uber awesome name",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        };

        spotifyApiHelper.getSpotifyIDForSong.mockResolvedValue('123');
        spotifyApiHelper.getRecommendationForTrack.mockResolvedValue('some-string');
        mediaItemHelper.getMediaItemForSearchString.mockResolvedValue(expected);

        expect(await songRecommender.recommendNextSong(lastPlayedSong)).toEqual(expected);
    })
});
