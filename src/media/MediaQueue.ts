import { MediaItem } from './MediaItem';

export class MediaQueue extends Array<MediaItem> {
    get first(): MediaItem {
        return this[0];
    }

    get last(): MediaItem {
        return this[this.length - 1];
    }

    enqueue(item: MediaItem): void {
        this.push(item);
    }

    dequeue(item?: MediaItem): MediaItem {
        if (item) {
            const idx = this.indexOf(item);
            if (idx > -1) {
                this.splice(idx, 1);
            }
            return item;
        }

        return this.shift();
    }

    move(key1, key2) {
        if (key1 != key2) {
            this.splice(key2, 0, this.splice(key1, 1)[0]);
        }
    }
}
