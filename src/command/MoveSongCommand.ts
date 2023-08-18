import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { IChannelManager } from 'src/channel/ChannelManager';
import { IQueueManager } from 'src/queue/QueueManager';
import { ICommand } from './ICommand';

export class MoveSongCommand implements ICommand {
    constructor(private readonly queueManager: IQueueManager, private readonly channelManager: IChannelManager) {}

    execute(cmd: SuccessfulParsedMessage<Message>): void {
        if (cmd.arguments.length <= 1) {
            return;
        }

        const current = Math.min(Math.max(parseInt(cmd.arguments[0]), 0), this.queueManager.getQueueLength() - 1),
            targetDesc = cmd.arguments[1];

        let target = 0;

        if (current === -1) {
            return;
        }

        if (targetDesc == 'up') {
            target = Math.min(current - 1, 0);
        } else if (targetDesc == 'down') {
            target = Math.max(current + 1, this.queueManager.getQueueLength() - 1);
        } else {
            target = parseInt(targetDesc);
        }

        this.queueManager.move(current, target);
        this.channelManager.sendInfoMessage('Moved songs!');
    }

    getDescription(): string {
        return 'moves a song in queue. Usage: `move [song index to move] [up / down / target destination]`.';
    }
}
