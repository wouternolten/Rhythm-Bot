import { config as dotenv } from 'dotenv';
import 'reflect-metadata';
import container from '../etc/container';
import tokens from '../etc/tokens';

dotenv();

(async () => {
    try {
        await initialiseClients();
    } catch (error) {
        container.get(tokens.logger).error(error);
    }
})();

async function initialiseClients(): Promise<void> {
    const config = container.get(tokens.config);
    const musicBotClient = container.get(tokens.musicBotClient);
    const welcomeBotClient = container.get(tokens.welcomeBotClient);
    const logger = container.get(tokens.logger);

    welcomeBotClient.on('ready', () => {
        container.get(tokens.welcomeBotAudioPlayerFactory).initialize();
        container.get(tokens.welcomeTuneBot).initialize();

        logger.info('Welcome bot ready to go.');
    });

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
