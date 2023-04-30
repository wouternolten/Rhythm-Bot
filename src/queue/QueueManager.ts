import { IRhythmBotConfig } from "./../bot/IRhythmBotConfig";
import { MediaItem } from "./../media/MediaItem";
import { MediaQueue } from "./../media/MediaQueue";
import { IMediaType } from "./../media/MediaType";
import { ISongRecommender } from "./../media/SongRecommender";
import { MediaTypeProvider } from "./../mediatypes/MediaTypeProvider";
import { Logger } from "winston";
import { IChannelManager } from "src/channel/ChannelManager";

export interface IQueueManager {
    addMedia(item: MediaItem, silent?: boolean): Promise<void>;
    getNextSongToPlay(): Promise<MediaItem | undefined>;
    at(index: number): MediaItem;
    remove(item: MediaItem): void;
    clear(): void;
    shuffle(): void;
    move(currentIndex: number, targetIndex: number): void;
    getAutoPlay(): boolean;
    setAutoPlay(audioPlay: boolean): void;
    getQueueLength(): number;
    getQueue(): MediaItem[];
    getLastPlayedSong(): MediaItem | undefined;
}

export class QueueManager implements IQueueManager {
    private readonly queue: MediaQueue = new MediaQueue();
    private autoPlay: boolean;
    private lastFetchedSong: MediaItem;

    constructor(
        readonly configuration: IRhythmBotConfig,
        private readonly mediaTypeProvider: MediaTypeProvider,
        private readonly logger: Logger,
        private readonly songRecommender: ISongRecommender,
        private readonly channelManager: IChannelManager
    ) {
        this.autoPlay = configuration.queue.autoPlay;
    }

    async addMedia(item: MediaItem, silent?: boolean): Promise<void> {
        if (!item.name || !item.duration) {
            let type: IMediaType | undefined;
            try {
                type = this.mediaTypeProvider.get(item.type);
            } catch (error) {
                return Promise.reject(`Error when fetching media type: ${error}`);
            }

            try {
                const details = await type.getDetails(item);

                item.name = details.name;
                item.duration = details.duration;
            } catch (error) {
                const errorMessage = 'Error when getting details for item';
                this.logger.error(`${errorMessage}: \n ${JSON.stringify({ item, error })}`);
                return Promise.reject(errorMessage);
            }
        }

        this.queue.enqueue(item);

        if (silent) {
            return;
        }

        this.channelManager.sendTrackAddedMessage(item, this.queue.indexOf(item) + 1);
    }

    async getNextSongToPlay(): Promise<MediaItem | undefined> {
        if (this.queue.length > 0) {
            this.lastFetchedSong = this.queue.first;
            return this.queue.shift();
        }

        if ((!this.autoPlay && this.queue.length === 0) || (this.autoPlay && !this.lastFetchedSong)) {
            return undefined;
        }

        const nextSong = await this.findNextSongToPlay(this.lastFetchedSong)

        if (nextSong) {
            this.lastFetchedSong = nextSong;
        }

        return nextSong;
    }

    at(index: number): MediaItem {
        return this.queue[index];
    }

    remove(item: MediaItem): void {
        this.queue.dequeue(item);
    }

    clear(): void {
        this.queue.clear();
    }

    shuffle(): void {
        this.queue.shuffle();
    }

    move(currentIndex: number, targetIndex: number): void {
        const max = this.queue.length - 1;
        const min = 0;
        currentIndex = Math.min(Math.max(currentIndex, min), max);
        targetIndex = Math.min(Math.max(targetIndex, min), max);

        this.queue.move(currentIndex, targetIndex);
    }

    setAutoPlay(autoPlay: boolean): void {
        this.autoPlay = autoPlay;
    }

    getAutoPlay(): boolean {
        return this.autoPlay;
    }

    getQueueLength(): number {
        return this.queue.length;
    }

    getQueue(): MediaItem[] {
        return [...this.queue];
    }

    getLastPlayedSong(): MediaItem | undefined {
        return this.lastFetchedSong;
    }
    
    private async findNextSongToPlay(lastPlayedSong: MediaItem): Promise<MediaItem | undefined> {
        let nextSong: MediaItem | undefined | null; 
        
        try {
            nextSong = await this.songRecommender.recommendNextSong(lastPlayedSong);
        } catch (e) {
            this.logger.error(e);
        }

        if (!nextSong) {
            this.logger.info(`No songs found for recommendation.`);
            return undefined;
        }

        return nextSong;
    }
}
