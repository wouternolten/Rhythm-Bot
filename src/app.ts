import { YoutubeAPIHelper } from './helpers/YoutubeAPIHelper';
import { ICommandMapFactory } from './command/ICommandMapFactory';
import { CommandMapFactory } from './command/CommandMapFactory';
import { MediaPlayer } from '../src/media';
import { BotStatus } from './bot/bot-status';
import { Client, Message, MessageReaction, User } from 'discord.js';
import 'reflect-metadata';
import * as path from 'path';
import { IMediaTypeProvider } from './mediatypes/IMediaTypeProvider';
import { Container } from 'typedi';
import { MediaTypeProvider } from './mediatypes/MediaTypeProvider';
import { config as dotenv } from 'dotenv';
import { IRhythmBotConfig, RhythmBot } from './bot';
import { WelcomeTuneBot } from './bot/welcometunebot';
import { createLogger, transports, format, Logger } from 'winston';
import { SpotifyAPIHelper } from './helpers/SpotifyAPIHelper';
import { IMediaItemHelper } from './helpers/IMediaItemHelper';
import { getConfig } from './helpers/GetConfig';

const { Console, File } = transports;
const { combine, timestamp, printf } = format;
const lineFormat = printf(({ level, message, timestamp }) => {
    return `[${timestamp}] (${level}): ${message}`;
});

dotenv();

(async () => {
    try {
        let config: IRhythmBotConfig;

        try {
            config = await getConfig('../bot-config.json');
        } catch (error) {
            console.error({ configError: error });
            process.exit(1);
        }
        await createContainer(config);

        const mediaTypeProvider = Container.get(MediaTypeProvider) as IMediaTypeProvider;
        
        const client: Client = new Client();

        try {
            await client.login(config.discord.token);
        } catch (error) {
            console.error({ clientLoginError: error });
            process.exit(1);
        }

        const botStatus = new BotStatus(client.user);
        
        const logger: Logger = Container.get('logger') as Logger;

        const spotifyApiHelper: SpotifyAPIHelper = new SpotifyAPIHelper(
            config.spotify.clientId,
            config.spotify.clientSecret,
            logger
        );
        
        const youtubeAPIHelper: IMediaItemHelper = new YoutubeAPIHelper(logger);

        const mediaPlayer = new MediaPlayer(
            config,
            botStatus,
            Container.get('logger'),
            mediaTypeProvider,
            spotifyApiHelper,
            youtubeAPIHelper
        );

        const commandMapFactory: ICommandMapFactory = new CommandMapFactory(
            mediaPlayer,
            config,
            spotifyApiHelper,
            youtubeAPIHelper,
            Container.get('logger')
        );

        const musicBot = new RhythmBot(
            config,
            client.user,
            mediaPlayer,
            logger,
            commandMapFactory.createMusicBotCommandsMap()
        );

        client.on('message', (msg: Message) => musicBot.handleMessage(msg));
        client.on('messageReactionAdd', (reaction: MessageReaction, user: User) => musicBot.handleReaction(reaction, user));
        client.on('ready', () => logger.debug('Bot online'));
        client.on('disconnect', () => logger.debug('Bot Disconnected'));
        client.on('error', (error: Error) => logger.error({ clientError: error }));

        if (config.useWelcomeBot) {
            const cloneConfig = {
                ...config,
                discord: {
                    token: process.env.WELCOME_BOT_TOKEN,
                    log: config.discord.log
                }
            } as IRhythmBotConfig;

            const welcomeBot = new WelcomeTuneBot(cloneConfig);
            
            welcomeBot.connect().then(() => {
                welcomeBot.logger.debug('Rhythm Bot Online');
                welcomeBot.listen();
            });
        }
    } catch (error) {
        console.error(error);
    }
})();

async function createContainer(config: IRhythmBotConfig): Promise<void> {
    Container.set('logger', createLogger({
        level: 'silly',
        format: combine(
            timestamp(),
            lineFormat
        ),
        transports: [
            new Console(),
            new File({ filename: path.basename(config.directory.logs), dirname: path.dirname(config.directory.logs), maxsize: 1e+7 })
        ]
    }) as Logger);
}