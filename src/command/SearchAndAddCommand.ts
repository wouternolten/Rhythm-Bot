import { MediaPlayer } from '../media/media-player';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { ICommand } from './ICommand';
import { createInfoEmbed, getPlayList } from '../helpers';
import yts from 'yt-search';

const YOUTUBE_REGEX = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/;

export class SearchAndAddCommand implements ICommand {
    constructor(private readonly player: MediaPlayer) { }
    
    async execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): Promise<void> {
        const query = cmd.body;

        if (!query) {
            msg.channel.send(createInfoEmbed(`No songs found`));
            return;
        }

        if (YOUTUBE_REGEX.test(cmd.body)) {
            if (cmd.body.indexOf('&list=') !== -1) {
                const playList = await getPlayList(cmd.body);
                
                if (!playList) {
                    return;
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

                createInfoEmbed(`Playlist "${playList.title}" added`);
            } else {
                await this.player.addMedia({
                    type: 'youtube',
                    url: cmd.body,
                    requestor: msg.author.username
                });
            }
        } else {
            const videos = await yts({ query, pages: 1 }).then((res) => res.videos);
            
            if (videos === null || videos.length === 0) {
                msg.channel.send(createInfoEmbed(`No songs found`));
                return;
            }

            await this.player.addMedia({
                type: 'youtube',
                url: videos[0].url,
                requestor: msg.author.username,
                name: videos[0].title,
                duration: videos[0].timestamp
            });
        }

        if (!this.player.isPlaying()) {
            this.player.play();
        }
    }

    getDescription(): string {
        return `search for a song and directly add it to the queue.`
    }
}