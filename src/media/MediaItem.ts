export interface MediaItem {
    type: string;
    url: string;
    requestor?: string;
    name?: string;
    duration?: string;
    imageUrl?: string;
    begin?: string | number | Date;
}
