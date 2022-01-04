import { SuccessfulParsedMessage } from "discord-command-parser";
import { Message } from "discord.js";
import { ICommand } from "./ICommand";

export class HelpCommand implements ICommand {
    constructor(private readonly helptext: string) {
        this.helptext = helptext;
    }

    execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): void {
        msg.channel.send(this.helptext);
    }
}