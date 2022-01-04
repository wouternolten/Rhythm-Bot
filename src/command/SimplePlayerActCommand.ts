import { MediaPlayer } from 'src/media';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { ICommand } from './ICommand';

export class SimplePlayerActCommand implements ICommand {
    constructor(
        private readonly player: MediaPlayer,
        private readonly invokeFunction: string
    ) { }

    execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): void {
        this.player[this.invokeFunction]();
    }
}