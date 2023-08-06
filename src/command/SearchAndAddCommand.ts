import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { IChannelManager } from 'src/channel/ChannelManager';
import { IMediaItemHelper } from 'src/helpers/IMediaItemHelper';
import { IQueueManager } from 'src/queue/QueueManager';
import { Logger } from 'winston';
import ytpl from 'ytpl';
import { MediaItem } from '../media/MediaItem';
import { MediaPlayer } from '../media/MediaPlayer';
import { SpotifyAPIHelper } from './../helpers/SpotifyAPIHelper';
import { ICommand } from './ICommand';

const YOUTUBE_REGEX = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/;
const SPOTIFY_REGEX = /spotify\.com/;

export class SearchAndAddCommand implements ICommand {
    constructor(
        private readonly player: MediaPlayer,
        private readonly spotifyAPIHelper: SpotifyAPIHelper,
        private readonly mediaItemHelper: IMediaItemHelper,
        private readonly queueManager: IQueueManager,
        private readonly channelManager: IChannelManager,
        private readonly logger: Logger
    ) {}

    async execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): Promise<void> {
        const query = cmd.body;

        if (!query) {
            this.channelManager.sendInfoMessage(`No songs found`);
            return;
        }

        if (YOUTUBE_REGEX.test(query)) {
            if (query.indexOf('&list=') !== -1) {
                try {
                    await this.addYoutubePlayList(query, msg);
                } catch (error) {
                    return;
                }
            } else {
                console.log(3);
                await this.queueManager.addMedia({
                    type: 'youtube',
                    url: cmd.body,
                    requestor: msg.author.username,
                });
            }
        } else if (SPOTIFY_REGEX.test(query)) {
            if (query.indexOf('playlist') !== -1) {
                try {
                    await this.addSpotifyPlayList(query, msg);
                } catch (error) {
                    return;
                }
            }
        } else {
            try {
                await this.searchForVideo(query, msg);
            } catch (error) {
                return;
            }
        }

        this.player.play();
    }

    getDescription(): string {
        return `search for a song and directly add it to the queue.`;
    }

    private async addSpotifyPlayList(query: string, msg: Message): Promise<void> {
        const playListId = this.getPlayListIdFromSpotifyQuery(query);

        if (!playListId) {
            this.channelManager.sendInfoMessage('Playlist not found.');
            return;
        }

        let playListItems;

        try {
            playListItems = await this.spotifyAPIHelper.getTracksFromPlaylist(playListId);
        } catch (errorGettingTracksFromPlaylist) {
            this.logger.error(JSON.stringify({ errorGettingTracksFromPlaylist }));
            this.channelManager.sendErrorMessage('Error when trying get tracks from playlist');

            return;
        }

        await Promise.all(
            playListItems.map(async (playListItem: string) => {
                try {
                    await this.searchForVideo(playListItem, msg, true);
                } catch (error) {}

                this.logger.info(`Added ${playListItem}`);
            })
        );

        this.channelManager.sendInfoMessage('Added spotify playlist');
    }

    private getPlayListIdFromSpotifyQuery(query: string): string | null | undefined {
        const regexGroups = /playlist\/(?<playlistId>[a-zA-Z0-9]+)/.exec(query);
        return regexGroups?.groups?.playlistId as string | undefined;
    }

    private async addYoutubePlayList(query: string, msg: Message): Promise<void> {
        let playList;

        try {
            playList = await this.getPlayList(query);
        } catch (errorWhenFetchingPlayList) {
            this.logger.error(JSON.stringify({ errorWhenFetchingPlayList }));
            this.channelManager.sendErrorMessage('Error when fetching playlist');
            throw errorWhenFetchingPlayList;
        }

        for (const item of playList.items) {
            await this.queueManager.addMedia(
                {
                    type: item.type,
                    name: item.name,
                    url: item.url,
                    duration: item.duration,
                    requestor: msg.author.username,
                },
                true
            );
        }

        this.channelManager.sendInfoMessage(`Playlist "${playList.title}" added`);
    }

    private async searchForVideo(query: string, msg: Message, silent = false): Promise<void> {
        let mediaItem;

        try {
            mediaItem = await this.mediaItemHelper.getMediaItemForSearchString(query);
        } catch (errorGettingMediaItemForSearchString) {
            this.logger.error(JSON.stringify({ errorGettingMediaItemForSearchString }));
            this.channelManager.sendErrorMessage('Error when fetching media item');
            return;
        }

        if (mediaItem) {
            await this.queueManager.addMedia(
                {
                    ...mediaItem,
                    requestor: msg.author.username,
                },
                silent
            );
        }
    }

    private async getPlayList(url: string): Promise<{ title: string; items: MediaItem[] }> {
        let playList: ytpl.Result;

        playList = await ytpl(url);

        if (
            !playList ||
            !playList.title ||
            !playList.items ||
            !Array.isArray(playList.items) ||
            playList.items.length === 0
        ) {
            return Promise.reject('Invalid playlist returned');
        }

        return {
            title: playList.title,
            items: playList.items.map(
                (item) =>
                    ({ type: 'youtube', url: item.shortUrl, name: item.title, duration: item.duration } as MediaItem)
            ),
        };
    }
}
