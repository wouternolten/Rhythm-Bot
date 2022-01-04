import { IRhythmBotConfig } from './../bot/bot-config';
import { MediaPlayer } from './../media/media-player';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { ICommand } from './ICommand';
import { createEmbed, createInfoEmbed, joinUserChannel } from '../helpers';
import yts from 'yt-search';

const YOUTUBE_REGEX = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/;

export class SearchCommand implements ICommand {
    constructor(
        private readonly player: MediaPlayer,
        private readonly config: IRhythmBotConfig
    ) { }

    async execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): Promise<void> {
        let noResults = false;

        if (cmd.body != null && cmd.body !== '') {
            if (YOUTUBE_REGEX.test(cmd.body)) {
                await this.player.addMedia({
                    type: 'youtube',
                    url: cmd.body,
                    requestor: msg.author.username
                }, msg);

                return;
            }

            const videos = await yts({ query: cmd.body, pages: 1 }).then((res) => res.videos);
            if (videos != null && videos.length > 0) {
                await Promise.all(
                    videos
                        .slice(0, 3)
                        .map((video) =>
                            createEmbed()
                                .setTitle(`${video.title}`)
                                .addField('Author:', `${video.author.name}`, true)
                                .addField('Duration', `${video.timestamp}`, true)
                                .setThumbnail(video.image)
                                .setURL(video.url)
                        )
                        .map((embed) =>
                            msg.channel.send(embed).then((m) => m.react(this.config.emojis.addSong))
                        )
                );
            } else {
                noResults = true;
            }
        } else {
            noResults = true;
        }

        if (noResults) {
            msg.channel.send(createInfoEmbed(`No songs found`));
        }
    }
}