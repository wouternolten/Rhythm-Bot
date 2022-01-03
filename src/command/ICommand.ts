import { SuccessfulParsedMessage } from "discord-command-parser";
import { Message } from "discord.js";

export interface ICommand {
    execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): void;
}