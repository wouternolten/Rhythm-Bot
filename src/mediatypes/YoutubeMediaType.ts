import { Logger } from 'discord-bot-quickstart';
import ytdl, { getInfo } from 'ytdl-core';
import { MediaItem } from './../media/media-item.model';
import { Readable } from 'stream';
import ytpl from 'ytpl';
import { IMediaType } from './../media/media-type.model';
import { secondsToTimestamp } from '../helpers';
import { Service } from 'typedi';

@Service()
export class YoutubeMediaType implements IMediaType {
    // TODO: Inject logger
    constructor(private readonly logger: Logger) {}
    
    getType(): string {
        return 'youtube'; 
    }

    getPlaylist(item: MediaItem): Promise<MediaItem[]> {
        console.info('Getting playlist');

        return ytpl(item.url).then((playlist: ytpl.Result) => {
            if (!playlist?.items || !Array.isArray(playlist.items)) {
                return Promise.reject(`Cannot fetch playlist from ${this.getType()}: returned value is not an array`);
            }

            return playlist.items.map(
                item => ({
                    type: this.getType(),
                    url: item.url,
                    name: item.title,
                    duration: item.duration
                } as MediaItem)
            )
        });
    }

    getDetails(item: MediaItem): Promise<MediaItem> {
        console.info('Fetching details');

        if (item.name && item.duration) {
            return Promise.resolve(item);
        }

        item.url = item.url.includes('://') ? item.url : `https://www.youtube.com/watch?v=${item.url}`;

        return getInfo(item.url)
            .then(info => {
                item.name = info.videoDetails?.title || 'Unknown';
                item.duration = secondsToTimestamp(parseInt(info.videoDetails?.lengthSeconds) || 0);

                return item;
            })
    }

    getStream(item: MediaItem): Promise<Readable> {
        console.info('Getting stream');

        return Promise.resolve(
            ytdl(item.url, {
                filter: 'audioonly',
                quality: 'highestaudio',
                begin: item.begin
            })
        );
    }
}