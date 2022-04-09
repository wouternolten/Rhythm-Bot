import { MediaItem } from "src/media";

export interface IMediaItemHelper {
    getMediaItemForSearchString(searchString: string): Promise<MediaItem | null>;
}