import { IChannelManager } from 'src/channel/ChannelManager';
import { IQueueManager } from 'src/queue/QueueManager';
import { ICommand } from './ICommand';

export class AutoPlayNextVideoCommand implements ICommand {
    constructor(private readonly queueManager: IQueueManager, private readonly channelManager: IChannelManager) {}

    execute(): void {
        this.queueManager.setAutoPlay(!this.queueManager.getAutoPlay());
        this.channelManager.sendInfoMessage(`Autoplay is currently ${this.queueManager.getAutoPlay() ? 'on' : 'off'}`);
    }

    getDescription(): string {
        return '(toggle on/off) autoplay the first recommendation when queue is empty.';
    }
}
