import { Message, MessageReaction, TextChannel, User, VoiceState } from 'discord.js';
import { config as dotenv } from 'dotenv';
import 'reflect-metadata';
import { Logger } from 'winston';
import container from '../etc/container';
import tokens from '../etc/tokens';
import { MediaPlayer } from '../src/media/MediaPlayer';
import { RhythmBot } from './bot/RhythmBot';
import { ChannelManager } from './channel/ChannelManager';

let musicBotCreated = false;

dotenv();

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception: ', err);
});

(async () => {
    try {
        await initialiseClients();

        // clients.welcomeBot.client.on('voiceStateUpdate', async (oldState) => {
        //     if (!musicBotCreated) {
        //         logger.debug('voiceStateUpdate for welcome bot');
        //         createWelcomeBot(oldState);
        //         musicBotCreated = true;
        //     }
        // });
    } catch (error) {
        container.get(tokens.logger).error(error);
    }
})();

async function initialiseClients(): Promise<void> {
    const config = container.get(tokens.config);
    const musicBotClient = container.get(tokens.musicBotClient);
    const welcomeBotClient = container.get(tokens.welcomeBotClient);
    const logger = container.get(tokens.logger);

    try {
        await musicBotClient.login(config.discord.token);
        await welcomeBotClient.login(config.discord.welcomeBotToken);
    } catch (error) {
        logger.error({ clientLoginError: error });
        process.exit(1);
    }

    musicBotClient.on('voiceStateUpdate', async (oldState, newState) => {
        if (!musicBotCreated && (oldState.channel || newState.channel)) {
            const useState = oldState.channel ? oldState : newState;
            initMusicBot(useState);
            musicBotCreated = true;
        }
    });
}

// async function createWelcomeBot(
//     config: IRhythmBotConfig,
//     commandMapFactory: ICommandMapFactory,
//     logger: Logger
// ) {
//     const cloneConfig = {
//         ...config,
//         discord: {
//             token: process.env.WELCOME_BOT_TOKEN,
//             log: config.discord.log
//         }
//     } as IRhythmBotConfig;

//     const client: Client = createClient();

//     client.on('debug', async (message: string) => { logger.debug(message) });

//     try {
//         await client.login(cloneConfig.discord.token);
//     } catch (error) {
//         logger.error({ clientLoginError: error });
//         process.exit(1);
//     }

//     const mediaV2audioPlayer = createAudioPlayer();

//     mediaV2audioPlayer.on('debug', (message) => {
//         logger.debug(`V2 debug: ${message}`);
//     })

//     const mediaPlayer: IMediaFilePlayer = new MediaFilePlayer(
//         mediaV2audioPlayer,
//         logger,
//         client.user.id
//     );

//     const welcomeBot = new WelcomeTuneBot(
//         cloneConfig,
//         mediaPlayer,
//         commandMapFactory.createWelcomeBotCommandsMap(mediaPlayer),
//         client,
//         Container.get('logger')
//     );

//     client.on('voiceStateUpdate', async (oldVoiceState: VoiceState, newVoiceState: VoiceState) => {
//         logger.debug('voiceStateUpdate');
//         welcomeBot.handleVoiceStateUpdate(oldVoiceState, newVoiceState)
//     });

//     client.on('messageCreate', async (msg: Message) => {
//         logger.debug('message');
//         welcomeBot.handleMessage(msg)
//     });

//     client.on('interactionCreate', async (interaction) => {
//         logger.debug('Interaction');
//         console.log(interaction);
//     })

//     client.on('ready', async () => { logger.debug('Welcome bot online') });
//     client.on('disconnect', async () => { logger.debug('Welcome bot Disconnected') });
//     client.on('error', async (error: Error) => { logger.error({ welcomeBotClientError: error }) });
// }

function initMusicBot(state: VoiceState): void {
    const { client } = state;
    const channel = state.guild.channels.cache
        .filter((cacheChannel) => cacheChannel.name.toLowerCase().startsWith('rhythm') && cacheChannel.isTextBased())
        .first();

    container.share(
        tokens.channelManager,
        (): ChannelManager => new ChannelManager(container.get(tokens.config), channel as TextChannel)
    );

    container.share(
        tokens.mediaPlayer,
        (): MediaPlayer =>
            new MediaPlayer(
                container.get(tokens.botStatus),
                container.get(tokens.logger),
                container.get(tokens.queueManager),
                container.get(tokens.channelManager),
                [
                    container.get(tokens.idleStateHandler),
                    container.get(tokens.playingStateHandler),
                    container.get(tokens.pausedStateHandler),
                ],
                container.get(tokens.musicBotAudioEventBus)
            )
    );

    const musicBot: RhythmBot = container.get(tokens.rhythmBot);
    const logger: Logger = container.get(tokens.logger);

    client.on('messageCreate', (msg: Message) => {
        musicBot.handleMessage(msg);
    });

    client.on('messageReactionAdd', (reaction: MessageReaction, user: User) => {
        musicBot.handleReaction(reaction, user);
    });
    client.on('ready', async () => {
        logger.debug('Music bot online');
    });
    client.on('disconnect', async () => {
        logger.debug('Music bot Disconnected');
    });
    client.on('error', async (error: Error) => {
        logger.error({ musicBotClientError: error });
    });
}
