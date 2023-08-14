import { Container, Module, Token } from 'containor';
import * as path from 'path';
import { createLogger, format, Logger, transports } from 'winston';
import { AudioPlayerFactory } from '../../src/helpers/AudioPlayerFactory';
import { AudioEventBus } from '../../src/helpers/EventBus';
import { SpotifyAPIHelper } from '../../src/helpers/SpotifyAPIHelper';
import { YoutubeAPIHelper } from '../../src/helpers/YoutubeAPIHelper';
import tokens from '../tokens';

const { Console, File } = transports;
const { combine, timestamp, printf } = format;
const lineFormat = printf(({ level, message, timestamp }) => {
    return `[${timestamp}] (${level}): ${message}`;
});

export default class HelpersModule implements Module {
    public provides: Token[] = [
        tokens.musicBotAudioPlayerFactory,
        tokens.welcomeBotAudioPlayerFactory,
        tokens.spotifyApiHelper,
        tokens.youtubeApiHelper,
        tokens.logger,
    ];

    public register(container: Container): void {
        container.add(tokens.logger, (): Logger => {
            return createLogger({
                level: 'silly',
                format: combine(timestamp(), lineFormat),
                transports: [
                    new Console(),
                    new File({
                        filename: path.basename(container.get(tokens.config).directory.logs),
                        dirname: path.dirname(container.get(tokens.config).directory.logs),
                        maxsize: 1e7,
                    }),
                ],
            }) as Logger;
        });

        container.share(tokens.musicBotAudioPlayerFactory, AudioPlayerFactory, [
            tokens.musicBotClient,
            tokens.musicBotAudioEventBus,
        ]);
        container.share(tokens.welcomeBotAudioPlayerFactory, AudioPlayerFactory, [
            tokens.welcomeBotClient,
            tokens.welcomeBotAudioEventBus,
        ]);
        container.add(tokens.spotifyApiHelper, SpotifyAPIHelper, [tokens.config, tokens.logger]);
        container.add(tokens.youtubeApiHelper, YoutubeAPIHelper, [tokens.logger]);
        container.share(tokens.musicBotAudioEventBus, AudioEventBus, []);
        container.share(tokens.welcomeBotAudioEventBus, AudioEventBus, []);
    }
}
