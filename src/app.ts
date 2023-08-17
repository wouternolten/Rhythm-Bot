import { config as dotenv } from 'dotenv';
import 'reflect-metadata';
import container from '../etc/container';
import tokens from '../etc/tokens';

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

    musicBotClient.on('ready', () => {
        container.get(tokens.channelManager).initialize();
        container.get(tokens.musicBotAudioPlayerFactory).initialize();
        container.get(tokens.mediaPlayer).initializePlayer();
        container.get(tokens.rhythmBot).initialize();

        logger.info('Bot is ready to go.');
    });

    musicBotClient.on('disconnect', async () => {
        logger.debug('Music bot Disconnected');
    });

    musicBotClient.on('error', async (error: Error) => {
        logger.error({ musicBotClientError: error });
    });

    try {
        await musicBotClient.login(config.discord.token);
        await welcomeBotClient.login(config.discord.welcomeBotToken);
    } catch (error) {
        logger.error({ clientLoginError: error });
        process.exit(1);
    }
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
