import { MediaPlayer } from 'src/media';
import { SuccessfulParsedMessage } from "discord-command-parser";
import { Message } from "discord.js";
import { ICommand } from "./ICommand";

export class RemoveSongCommand implements ICommand {
    constructor(private readonly player: MediaPlayer) { }

    execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): void {
        if (!cmd.arguments || cmd.arguments.length === 0) {
            return;
        }

        let idx = parseInt(cmd.arguments[0]);
        let item = this.player.at(idx - 1);
        if (item) {
            this.player.remove(item);
        }
    }

    getDescription(): string {
        return 'remove a song from the queue. Usage: `remove [song index]`.'; 
    }
}