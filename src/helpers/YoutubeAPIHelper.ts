import { MEDIA_TYPE_YOUTUBE } from './../mediatypes/MediaType';
import { Logger } from "discord-bot-quickstart";
import { MediaItem } from "src/media";
import { IMediaItemHelper } from "./IMediaItemHelper";
import * as youtube from 'youtube-search-without-api-key';

export class YoutubeAPIHelper implements IMediaItemHelper {
    constructor(private readonly logger: Logger) {
    }

    async getMediaItemForSearchString(searchString: string): Promise<MediaItem | null> {
        if (searchString === '') {
            return null;
        }
        
        try {
            const youtubeSearchResults = await youtube.search(searchString);
            
            if (!youtubeSearchResults || youtubeSearchResults.length === 0) {
                return null;
            }

            const video = youtubeSearchResults[0];

            return {
                type: MEDIA_TYPE_YOUTUBE,
                url: video.snippet.url,
                name: video.snippet.title,
                duration: video.duration_raw
            } as MediaItem;
        } catch (errorSearchingYoutube) {
            this.logger.error(JSON.stringify({ errorSearchingYoutube }));
            return null;
        }
    }
}