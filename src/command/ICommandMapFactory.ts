import { IMediaFilePlayer } from './../media/MediaFilePlayer';
import { SuccessfulParsedMessage } from "discord-command-parser";
import { Message } from "discord.js";
import { CommandMap } from "../helpers/CommandMap";

export interface ICommandMapFactory {
    createMusicBotCommandsMap(): CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>;
    createWelcomeBotCommandsMap(): CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>;
}
