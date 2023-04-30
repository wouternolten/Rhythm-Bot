import { IMediaItemHelper } from 'src/helpers/IMediaItemHelper';
import { IRhythmBotConfig } from '../bot/IRhythmBotConfig';
import { MediaPlayer } from './../media/MediaPlayer';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { ICommand } from './ICommand';
import { createEmbed, createInfoEmbed } from '../helpers/helpers';
import { IQueueManager } from 'src/queue/QueueManager';

const YOUTUBE_REGEX = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/;

export class SearchCommand implements ICommand {
    constructor(
        private readonly player: MediaPlayer,
        private readonly mediaItemHelper: IMediaItemHelper,
        private readonly queueManager: IQueueManager,
        private readonly config: IRhythmBotConfig
    ) { }

    async execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): Promise<void> {
        let noResults = true;

        if (!cmd.body || typeof cmd.body !== 'string') {
            msg.channel.send(createInfoEmbed(`Please input a song.`));
            return;
        } 

        if (YOUTUBE_REGEX.test(cmd.body)) {
            await this.queueManager.addMedia({
                type: 'youtube',
                url: cmd.body,
                requestor: msg.author.username
            });

            this.player.play();
            return;
        }

        const videos = await this.mediaItemHelper.getMediaItemsForSearchString(cmd.body, 3);

        if (Array.isArray(videos) && videos.length > 0) {
            await Promise.all(
                videos
                    .slice(0, 3)
                    .map((video) =>
                        createEmbed()
                            .setTitle(`${video.name}`)
                            .addFields({ name: 'Duration', value: `${video.duration}`, inline: true })
                            .setThumbnail(video.imageUrl)
                            .setURL(video.url)
                    )
                    .map((embed) =>
                        msg.channel.send({ embeds: [embed] }).then((m) => m.react(this.config.emojis.addSong))
                    )
            );

            noResults = false;
        }

        if (noResults) {
            msg.channel.send(createInfoEmbed(`No songs found`));
        }
    }

    getDescription(): string {
        return 'search for a song.';
    }
}
