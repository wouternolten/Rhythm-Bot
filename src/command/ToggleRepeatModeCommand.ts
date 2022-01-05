import { IRhythmBotConfig } from './../bot/bot-config';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { createInfoEmbed } from '../helpers';
import { ICommand } from './ICommand';

export class ToggleRepeatModeCommand implements ICommand {
    constructor(private readonly config: IRhythmBotConfig) { }

    execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): void {
        this.config.queue.repeat = !this.config.queue.repeat;
        msg.channel.send(createInfoEmbed(`Repeat mode is ${this.config.queue.repeat ? 'on' : 'off'}`));
    }
    
    getDescription(): string {
        return `put the queue on repeat.`;
    }
}