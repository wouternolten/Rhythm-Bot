import { Readable } from 'stream';
import { MediaItem } from './MediaItem';

export interface IMediaType {
    getPlaylist(item: MediaItem): Promise<MediaItem[]>;
    getDetails(item: MediaItem): Promise<MediaItem>;
    getStream(item: MediaItem): Promise<Readable>;
}
