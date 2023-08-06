import { Container, Module, Token } from 'containor';
import { QueueManager } from '../../src/queue/QueueManager';
import tokens from '../tokens';

export default class QueueModule implements Module {
    public provides: Token<unknown>[] = [tokens.queueManager];

    public register(container: Container): void {
        container.share(tokens.queueManager, QueueManager, [
            tokens.config,
            tokens.mediaTypeProvider,
            tokens.logger,
            tokens.songRecommender,
            tokens.channelManager,
        ]);
    }
}
