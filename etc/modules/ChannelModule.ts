import { Container, Module, Token } from 'containor';
import { ChannelManager } from '../../src/channel/ChannelManager';
import tokens from '../tokens';

export default class ChannelModule implements Module {
    public provides: Token[] = [tokens.channelManager];

    public register(container: Container): void {
        container.share(tokens.channelManager, ChannelManager, [tokens.config, tokens.musicBotClient, tokens.logger]);
    }
}
