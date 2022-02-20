import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { ICommand } from './ICommand';
import { MediaPlayer } from '../media/media-player';

export class ForcePlayVideoCommand implements ICommand {
    constructor(
        private readonly player: MediaPlayer,
        private readonly youtubeId: string
    ) { }

    async execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): Promise<void> {
        this.player.forcePlaySong({
            type: 'youtube',
            url: `https://www.youtube.com/watch?v=${this.youtubeId}`,
            requestor: msg.author.username,
        });
    }

    getDescription(): string {
        return `top secret command.`;
    }
}