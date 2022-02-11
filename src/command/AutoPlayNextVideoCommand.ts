import { MediaPlayer } from '../media';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { ICommand } from './ICommand';
import { createInfoEmbed } from '../helpers';

export class AutoPlayNextVideoCommand implements ICommand {
    constructor(private readonly player: MediaPlayer) {}
        
    execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): void {
        this.player.toggleAutoPlay();

        msg.channel.send(createInfoEmbed(`Autoplay is currently ${this.player.getAutoPlay() ? 'on' : 'off'}`));
    }

    getDescription(): string {
        return '(toggle on/off) autoplay the first recommendation when queue is empty.';
    }
}