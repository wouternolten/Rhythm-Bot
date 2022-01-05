import { MediaPlayer } from './../media/media-player';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { ICommand } from './ICommand';
import { secondsToTimestamp, createInfoEmbed } from '../helpers';

export class TimeCommand implements ICommand {
    constructor(private readonly player: MediaPlayer) {}

    execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): void {
        const media = this.player.queue.first;
        if (this.player.playing && this.player.dispatcher) {
            const elapsed = secondsToTimestamp(this.player.dispatcher.totalStreamTime / 1000);
            msg.channel.send(createInfoEmbed('Time Elapsed', `${elapsed} / ${media.duration}`));
        } else if (this.player.queue.first) {
            msg.channel.send(createInfoEmbed('Time Elapsed', `00:00:00 / ${media.duration}`));
        } else {
            msg.channel.send(createInfoEmbed('No song playing.'));
        }
    }
    
    getDescription(): string {
        return `display the time elapsed in the current song.`;
    }
}