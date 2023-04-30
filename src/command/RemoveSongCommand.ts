import { SuccessfulParsedMessage } from "discord-command-parser";
import { Message } from "discord.js";
import { ICommand } from "./ICommand";
import { IQueueManager } from 'src/queue/QueueManager';

export class RemoveSongCommand implements ICommand {
    constructor(private readonly queueManager: IQueueManager) { }

    execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): void {
        if (!cmd.arguments || cmd.arguments.length === 0) {
            return;
        }

        const idx = parseInt(cmd.arguments[0]);
        const item = this.queueManager.at(idx - 1);
        if (item) {
            this.queueManager.remove(item);
        }
    }

    getDescription(): string {
        return 'remove a song from the queue. Usage: `remove [song index]`.'; 
    }
}
