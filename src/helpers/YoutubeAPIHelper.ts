import axios, { AxiosRequestConfig } from 'axios';

export class YoutubeAPIHelper
{
    constructor(private readonly apiKey: string) {}

    getRecommendedYoutubeIdsForCurrentVideo(url: string, itemLimit: number): Promise<string[]> {
        if (itemLimit < 1 || itemLimit > 10) {
            return Promise.reject('Failed to get recommended YoutubeIds. itemLimit should be between 1 and 10');
        }

        const config = {
            params: {
                part: 'snippet',
                relatedToVideoId: url,
                type: 'video',
                key: this.apiKey,
                maxResults: itemLimit
            }
        } as AxiosRequestConfig;

        return axios
            .get(`https://youtube.googleapis.com/youtube/v3/search`, config)
            .then(response => response.data.items.map(item => item.id.videoId));
    }
}