import { MediaItem } from "src/media";

export interface IMediaItemHelper {
    getMediaItemForSearchString(searchString: string): Promise<MediaItem | null>;
    getMediaItemsForSearchString(searchString: string, limit: number): Promise<MediaItem[] | null>;
}