import { Token, Module, Container } from 'containor';
import { CommandMapFactory } from '../../src/command/CommandMapFactory';
import tokens from '../tokens';

export default class CommandModule implements Module {
    public provides: Token[] = [tokens.commandMapFactory];

    public register(container: Container) {
        container.add(tokens.commandMapFactory, CommandMapFactory, [
            tokens.mediaPlayer,
            tokens.mediaFilePlayer,
            tokens.config,
            tokens.spotifyApiHelper,
            tokens.youtubeApiHelper,
            tokens.logger
        ]);
    }   
}
