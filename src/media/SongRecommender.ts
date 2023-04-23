import { IMediaItemHelper } from '../helpers/IMediaItemHelper';
import { SpotifyAPIHelper } from '../helpers/SpotifyAPIHelper';
import { MediaItem } from './MediaItem';
import { Logger } from 'winston';

export interface ISongRecommender {
    recommendNextSong(lastPlayedSong: MediaItem): Promise<MediaItem | null>;
}

export class SongRecommender implements ISongRecommender {
    public constructor(
        private readonly spotifyApiHelper: SpotifyAPIHelper,
        private readonly mediaItemHelper: IMediaItemHelper,
        private readonly logger: Logger
    ) { }

    public async recommendNextSong(lastPlayedSong: MediaItem): Promise<MediaItem | null> {
        console.log(lastPlayedSong);
        if (!lastPlayedSong.name) {
            return null;
        }
        
        const lettersAndSpacesRegex = /[^\w\s\-]+/gm;

        /**
         * For future readers: most stuff in youtube videos that's behind brackets can be omitted.
         * For instance: 
         * - (Official video)
         * - (Remastered 2012)
         * - (Music video)
         * - ...etc.
         * 
         * Spotify will not recognize this. 
         * However, this will mean that searching will be a little more vague, possibly leading to results
         * that are not connected to the original.
         */
        const everyThingAfterBracketsRegex = /\(.*/gm;

        const [artist, track] = lastPlayedSong
            .name
            .replace(everyThingAfterBracketsRegex, '')
            .replace(lettersAndSpacesRegex, ' ')
            .split(" - ");

        let searchTrack: string, searchArtist: string;

        if (!track) {
            searchTrack = artist.trim();
        } else {
            searchTrack = track.trim();
            searchArtist = artist.trim();
        }

        try {
            const spotifyId: string = await this.spotifyApiHelper.getSpotifyIDForSong(searchTrack, searchArtist || undefined);
            const recommendation: string = await this.spotifyApiHelper.getRecommendationForTrack(spotifyId);
            return this.mediaItemHelper.getMediaItemForSearchString(recommendation);
        } catch (error) {
            this.logger.error('Failed to get recommended song', { error, lastPlayedSong });
            return null;
        }
    }
}
