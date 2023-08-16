import { Client, TextChannel } from 'discord.js';
import { mock } from 'jest-mock-extended';
import { Logger } from 'winston';
import { IRhythmBotConfig } from '../../../src/bot/IRhythmBotConfig';
import { ChannelManager } from '../../../src/channel/ChannelManager';

let channelManager: ChannelManager;

const client = mock<Client>();
const config = mock<IRhythmBotConfig>();
const logger = mock<Logger>();

beforeEach(() => {
    jest.clearAllMocks();

    channelManager = new ChannelManager(config, client, logger);
});

it('Should log and not send a message to channel when no channel found', async () => {
    channelManager.sendInfoMessage('Something');

    expect(logger.error).toHaveBeenCalled();
});

it('Should send message when channel found', async () => {
    const channel = mock<TextChannel>();
    client.on.mockImplementation((_, fn) => {
        fn({ channel });

        return client;
    });

    channelManager.initialize();

    channelManager.sendInfoMessage('Something');

    expect(logger.error).not.toHaveBeenCalled();
});
