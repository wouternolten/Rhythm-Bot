import { MediaPlayer } from '../media/media-player';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { ICommand } from './ICommand';
import { createInfoEmbed } from '../helpers';
import yts from 'yt-search';

export class SearchAndAddCommand implements ICommand {
    constructor(private readonly player: MediaPlayer) { }
    
    async execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): Promise<void> {
        const query = cmd.body;

        if (!query) {
            msg.channel.send(createInfoEmbed(`No songs found`));
            return;
        }

        const videos = await yts({ query, pages: 1 }).then((res) => res.videos);
        
        if (videos === null || videos.length === 0) {
            msg.channel.send(createInfoEmbed(`No songs found`));
            return;
        }

        this.player.addMedia({
            type: 'youtube',
            url: videos[0].url,
            requestor: msg.author.username
        }, msg);
    }
}