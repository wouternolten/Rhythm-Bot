import { CommandMap } from "discord-bot-quickstart";
import { SuccessfulParsedMessage } from "discord-command-parser";
import { Message } from "discord.js";

export interface ICommandMapFactory {
    createMusicBotCommandsMap(): CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>;
    createWelcomeBotCommandsMap(): CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>;
}