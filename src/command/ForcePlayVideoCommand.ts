import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { ICommand } from './ICommand';
import { MediaPlayer } from '../media/media-player';

export class ForcePlayVideoCommand implements ICommand {
    constructor(
        private readonly player: MediaPlayer,
        private readonly youtubeId: string
    ) { }

    // TODO: 
    // 1. Place current video after forced video
    // 2. Play current video again at stopped timestamp.
    async execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): Promise<void> {
        await this.player.addMedia({
            type: 'youtube',
            url: `https://www.youtube.com/watch?v=${this.youtubeId}`,
            requestor: msg.author.username,
        }, msg);

        const current = this.player.queue.length - 1;

        if (current === 0) {
            return;
        }

        if (this.player.dispatcher) {
            const time = this.player.dispatcher.totalStreamTime;
            const currentSong = this.player.queue.first;
            currentSong.begin = `${time}ms`;

            await this.player.addMedia(currentSong, msg, true);
        }

        this.player.skip();
    }

    getDescription(): string {
        return `top secret command.`;
    }
}