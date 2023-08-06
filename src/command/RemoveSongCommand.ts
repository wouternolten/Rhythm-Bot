import { SuccessfulParsedMessage } from "discord-command-parser";
import { Message } from "discord.js";
import { ICommand } from "./ICommand";
import { IQueueManager } from 'src/queue/QueueManager';
import { IChannelManager } from "src/channel/ChannelManager";

export class RemoveSongCommand implements ICommand {
    constructor(
        private readonly queueManager: IQueueManager,
        private readonly channelManager: IChannelManager
    ) { }

    execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): void {
        if (!cmd.arguments || cmd.arguments.length === 0) {
            return;
        }

        const index = parseInt(cmd.arguments[0]);
        const item = this.queueManager.at(index - 1);
        if (!item) {
            return;
        }
        
        this.queueManager.remove(item);
        this.channelManager.sendInfoMessageWithTitle(`Track Removed`, item.name);
    }

    getDescription(): string {
        return 'remove a song from the queue. Usage: `remove [song index]`.'; 
    }
}
