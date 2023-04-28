import { MEDIA_TYPE_YOUTUBE } from './../mediatypes/MediaType';
import { Logger } from 'winston';
import { MediaItem } from "../media/MediaItem";
import { IMediaItemHelper } from "./IMediaItemHelper";
import * as youtube from 'youtube-search-without-api-key';

export class YoutubeAPIHelper implements IMediaItemHelper {
    constructor(private readonly logger: Logger) {
    }

    async getMediaItemForSearchString(searchString: string): Promise<MediaItem | null> {
        if (searchString === '') {
            return null;
        }
        
        const returnValue = await this.getMediaItemsForSearchString(searchString, 1);

        if (!Array.isArray(returnValue)) {
            return null;
        }

        return returnValue[0];
    }

    async getMediaItemsForSearchString(searchString: string, limit: number): Promise<MediaItem[] | null> {
        if (searchString === '') {
            return null;
        }

        try {
            const youtubeSearchResults = await youtube.search(searchString);
            
            if (!youtubeSearchResults || youtubeSearchResults.length === 0) {
                return null;
            }

            return youtubeSearchResults
                .slice(0, limit)
                .map(video => ({
                        type: MEDIA_TYPE_YOUTUBE,
                        url: video.snippet.url,
                        name: video.snippet.title,
                        duration: video.duration_raw,
                        imageUrl: video.snippet?.thumbnails?.url
                    } as MediaItem)
                );
        } catch (errorSearchingYoutube) {
            this.logger.error(JSON.stringify({ errorSearchingYoutube }));
            return null;
        }
    }
}
