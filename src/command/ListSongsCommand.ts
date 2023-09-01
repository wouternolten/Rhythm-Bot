import { IChannelManager } from 'src/channel/ChannelManager';
import { IQueueManager } from 'src/queue/QueueManager';
import { ICommand } from './ICommand';

export class ListSongsCommand implements ICommand {
    constructor(private readonly queueManager: IQueueManager, private readonly channelManager: IChannelManager) {}

    execute(): void {
        const items = this.queueManager
            .getQueue()
            .map((item, idx) => `${idx + 1}: "${item.name}${item.requestor ? `"` : ''}"`);

        if (items.length > 0) {
            this.channelManager.sendInfoMessageWithTitle(items.join('\n\n'), 'Current playing queue');
        } else {
            this.channelManager.sendInfoMessage(`There are no songs in the queue.`);
        }
    }

    getDescription(): string {
        return 'lists all songs currently in queue.';
    }
}
