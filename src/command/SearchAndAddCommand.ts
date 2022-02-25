import { Logger } from 'discord-bot-quickstart';
import { SpotifyAPIHelper } from './../helpers/SpotifyAPIHelper';
import { MediaPlayer } from '../media/media-player';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { ICommand } from './ICommand';
import { createErrorEmbed, createInfoEmbed } from '../helpers';
import yts from 'yt-search';
import { MediaItem } from 'src/media';
import ytpl from 'ytpl';

const YOUTUBE_REGEX = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/;
const SPOTIFY_REGEX = /spotify\.com/;

export class SearchAndAddCommand implements ICommand {
    constructor(
        private readonly player: MediaPlayer,
        private readonly spotifyAPIHelper: SpotifyAPIHelper,
        private readonly logger: Logger
    ) { }
    
    async execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): Promise<void> {
        const query = cmd.body;

        if (!query) {
            msg.channel.send(createInfoEmbed(`No songs found`));
            return;
        }

        if (YOUTUBE_REGEX.test(query)) {
            if (query.indexOf('&list=') !== -1) {
                try {
                    await this.addYoutubePlayList(query, msg)
                } catch (error) {
                    return;
                }
            } else {
                await this.player.addMedia({
                    type: 'youtube',
                    url: cmd.body,
                    requestor: msg.author.username
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

        if (!this.player.isPlaying()) {
            this.player.play();
        }
    }

    getDescription(): string {
        return `search for a song and directly add it to the queue.`
    }

    private async addSpotifyPlayList(query: string, msg: Message): Promise<void> {
        const playListId = this.getPlayListIdFromSpotifyQuery(query);

        if (!playListId) {
            msg.channel.send(createInfoEmbed('Playlist not found.'));
            return;
        }

        let playListItems;

        try {
            playListItems = await this.spotifyAPIHelper.getTracksFromPlaylist(playListId)
        } catch (errorGettingTracksFromPlaylist) {
            this.logger.error({ errorGettingTracksFromPlaylist });
            msg.channel.send(createErrorEmbed('Error when trying get tracks from playlist'));

            return;
        }

        Promise.all(playListItems.map(async (playListItem: string) => {
            try {
                await this.searchForVideo(playListItem, msg, true);
            } catch (error) { }
            
            this.logger.info(`Added ${playListItem}`);
        }));

        msg.channel.send(createInfoEmbed('Added spotify playlist'));
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
            this.logger.error({ errorWhenFetchingPlayList });
            msg.channel.send(createErrorEmbed('Error when fetching playlist'));
            throw errorWhenFetchingPlayList;
        }

        for (const item of playList.items) {
            await this.player.addMedia({
                type: item.type,
                name: item.name,
                url: item.url,
                duration: item.duration,
                requestor: msg.author.username,
            }, true);
        }

        msg.channel.send(createInfoEmbed(`Playlist "${playList.title}" added`));
    }

    private async searchForVideo(query: string, msg: Message, silent = false): Promise<void> {
        let videos;

        try {
            videos = await yts({ query, pages: 1 }).then((res) => res.videos);
        } catch (searchResultError) {
            this.logger.error({ searchResultError });
            msg.channel.send(createErrorEmbed('Error when fetching search results'));
            throw searchResultError;
        }
        
        if (!videos || !Array.isArray(videos) || videos.length === 0) {
            msg.channel.send(createInfoEmbed(`No songs found`));
            return;
        }

        await this.player.addMedia({
            type: 'youtube',
            url: videos[0].url,
            requestor: msg.author.username,
            name: videos[0].title,
            duration: videos[0].timestamp
        }, silent);
    }

    private async getPlayList(url: string): Promise<{ title: string, items: MediaItem[] }> {
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
            items: playList.items.map(item => ({ type: 'youtube', url: item.shortUrl, name: item.title, duration: item.duration } as MediaItem))
        };
    }
}