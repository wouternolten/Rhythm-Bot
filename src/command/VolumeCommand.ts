import { MediaPlayer } from './../media/media-player';
import { createInfoEmbed } from '../helpers';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { ICommand } from './ICommand';

export class VolumeCommand implements ICommand {
    constructor(private readonly player: MediaPlayer) { }
    
    execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): void {
        if (cmd.arguments.length > 0) {
            let temp = cmd.arguments[0];
            if (temp) {
                let volume = Math.min(Math.max(parseInt(temp), 0), 100);
                this.player.setVolume(volume);
            }
        }
        msg.channel.send(createInfoEmbed(`Volume is at ${this.player.getVolume()}`));
    }

    getDescription(): string {
        return 'turn the volume up/down. Minimum = 0 (muted) Maximum = 100.';
    }
}