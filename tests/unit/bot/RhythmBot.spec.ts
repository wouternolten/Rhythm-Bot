import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Client, ClientUser, Message, MessageReaction, User } from 'discord.js';
import { mock } from 'jest-mock-extended';
import { Logger } from 'winston';
import { IRhythmBotConfig } from '../../../src/bot/IRhythmBotConfig';
import { RhythmBot } from '../../../src/bot/RhythmBot';
import { IChannelManager } from '../../../src/channel/ChannelManager';
import { ICommandMapFactory } from '../../../src/command/ICommandMapFactory';
import { IAudioPlayerFactory } from '../../../src/helpers/AudioPlayerFactory';
import { CommandMap } from '../../../src/helpers/CommandMap';
import { IMessageInformationHelper } from '../../../src/helpers/MessageInformationHelper';
import { IQueueManager } from '../../../src/queue/QueueManager';
import { MediaPlayer } from './../../../src/media/MediaPlayer';

const mockParseReturnValue = jest.fn();

jest.mock('discord-command-parser', () => {
    const originalModule = jest.requireActual('ytdl-core');

    return {
        __esModule: true,
        ...originalModule,
        parse: (msg: Message<boolean>, symbol: string) => mockParseReturnValue(msg, symbol),
    };
});

const TEXT_CHANNEL_ID = 'some-text-id';
const TEXT_CHANNEL_NAME = 'some-text-name';
const VOICE_CHANNEL_ID = 'some-voice-id';
const VOICE_CHANNEL_NAME = 'some-voice-name';

let bot: RhythmBot;
const config = {
    command: {
        symbol: '!',
    },
    emojis: {
        addSong: '👍',
        stopSong: '⏹️',
        playSong: '▶️',
        pauseSong: '⏸️',
        skipSong: '⏭️',
    },
} as unknown as IRhythmBotConfig;
const mediaPlayer = mock<MediaPlayer>();
const logger = mock<Logger>();
const channelManager = mock<IChannelManager>();
const audioPlayerFactory = mock<IAudioPlayerFactory>();
const client = mock<Client>();
const messageInformationHelper = mock<IMessageInformationHelper>();
const queueManager = mock<IQueueManager>();

const botUser = {
    id: 'RICK_ASTLEY',
} as unknown as ClientUser;

const otherUser = {
    id: 'MICHAEL_JACKSON',
} as unknown as User;

// I'm not mocking the commandMap, because, unlike the parse function, it's a simple key / value object.
const commands = new CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>();
const commandFunction = jest.fn();
commands.on('cmd', (cmd, msg) => commandFunction(cmd, msg));

const commandFactory = { createMusicBotCommandsMap: () => commands } as ICommandMapFactory;

const message = {
    content: 'Some content',
    author: otherUser,
} as unknown as Message;

client.user = botUser;

describe('Invalid config', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        bot = new RhythmBot(
            client,
            {} as unknown as IRhythmBotConfig,
            mediaPlayer,
            queueManager,
            logger,
            channelManager,
            audioPlayerFactory,
            messageInformationHelper,
            commandFactory
        );
    });

    it('Should log error and return when no symbol set on handleMessage', () => {
        bot.handleMessage(message);

        expect(logger.error).toBeCalled();
    });

    it('Should log warning and return when no emoji set on handleReaction', () => {
        bot.handleReaction({} as unknown as MessageReaction, botUser);

        expect(logger.error).toBeCalled();
    });
});

describe('Valid constructor parameters', () => {
    beforeEach(() => {
        jest.resetAllMocks();

        messageInformationHelper.getTextChannelInfo.mockReturnValue({
            id: TEXT_CHANNEL_ID,
            name: TEXT_CHANNEL_NAME,
        });

        channelManager.getChannelInfo.mockReturnValue({
            id: TEXT_CHANNEL_ID,
            name: TEXT_CHANNEL_NAME,
        });

        messageInformationHelper.getUserVoiceChannelInfo.mockReturnValue({
            id: VOICE_CHANNEL_ID,
            name: VOICE_CHANNEL_NAME,
        });

        audioPlayerFactory.getChannelInfo.mockReturnValue({
            id: VOICE_CHANNEL_ID,
            name: VOICE_CHANNEL_NAME,
        });

        bot = new RhythmBot(
            client,
            config,
            mediaPlayer,
            queueManager,
            logger,
            channelManager,
            audioPlayerFactory,
            messageInformationHelper,
            commandFactory
        );
    });

    describe('handleMessage()', () => {
        it('Should return when message user is bot itself', () => {
            mockParseReturnValue.mockReturnValue({ success: true, command: 'cmd' });
            const botMessage = { ...message } as unknown as Message;
            botMessage.author = botUser;

            bot.handleMessage(botMessage);

            expect(logger.error).not.toBeCalled();
            expect(commandFunction).not.toBeCalled();
        });

        it('Should return when parsing fails on handle message', () => {
            mockParseReturnValue.mockReturnValue({ success: false, command: 'cmd' });

            bot.handleMessage(message);

            expect(commandFunction).not.toBeCalled();
        });

        it('Should return when no handlers found', () => {
            mockParseReturnValue.mockReturnValue({ success: true, command: 'INVALID' });

            bot.handleMessage(message);

            expect(logger.error).not.toBeCalled();
        });

        it('Should call handler when no text or voice channel is set', () => {
            channelManager.getChannelInfo.mockReturnValue(undefined);
            audioPlayerFactory.getChannelInfo.mockReturnValue(undefined);

            mockParseReturnValue.mockReturnValue({
                success: true,
                command: 'cmd',
                message: {
                    channel: {},
                },
            });

            bot.handleMessage(message);

            expect(commandFunction).toBeCalled();
        });

        it('Should not call handler when user is in other text channel', () => {
            messageInformationHelper.getTextChannelInfo.mockReturnValue({
                id: 'too-cool-for-id',
                name: 'too-cool-for-school',
            });

            bot.handleMessage(message);

            expect(channelManager.sendErrorMessage).toHaveBeenCalledWith(expect.stringContaining('text channel'));
        });

        it('Should not call handler when user is in other voice channel', () => {
            messageInformationHelper.getUserVoiceChannelInfo.mockReturnValue({
                id: 'too-cool-for-id',
                name: 'too-cool-for-school',
            });

            mockParseReturnValue.mockReturnValue({
                success: true,
                command: 'cmd',
                message: {
                    channel: {},
                },
            });

            bot.handleMessage(message);

            expect(channelManager.sendErrorMessage).toHaveBeenCalledWith(expect.stringContaining('voice channel'));
        });

        it('Should call handler when found on handleMessage', () => {
            mockParseReturnValue.mockReturnValue({
                success: true,
                command: 'cmd',
                message: {
                    channel: {},
                },
            });

            bot.handleMessage(message);

            expect(commandFunction).toBeCalled();
        });
    });

    describe('handleReaction()', () => {
        it('Should throw an error when partial fetching of reaction fails on handleReaction', async () => {
            const reaction = {
                partial: true,
                fetch: jest.fn().mockRejectedValue(''),
            } as unknown as MessageReaction;

            await bot.handleReaction(reaction, botUser);

            expect(logger.error).toBeCalled();
        });

        it('Should return when original reaction message is not bot user', async () => {
            const reaction = {
                partial: false,
                message: {
                    author: {
                        id: `NOT_${botUser.id}`,
                    },
                },
                users: {
                    remove: jest.fn(),
                },
            } as unknown as MessageReaction;

            await bot.handleReaction(reaction, otherUser);

            expect(reaction.users.remove).not.toBeCalled();
        });

        it('Should return when bot itself is reacting', async () => {
            const reaction = {
                partial: false,
                message: {
                    author: {
                        id: botUser.id,
                    },
                },
                users: {
                    remove: jest.fn(),
                },
            } as unknown as MessageReaction;

            await bot.handleReaction(reaction, botUser);

            expect(reaction.users.remove).not.toBeCalled();
        });

        it('Should return when embed is not an array', async () => {
            const reaction = {
                partial: false,
                message: {
                    author: {
                        id: botUser.id,
                    },
                    embeds: 1234,
                },
                users: {
                    remove: jest.fn(),
                },
            } as unknown as MessageReaction;

            await bot.handleReaction(reaction, otherUser);

            expect(reaction.users.remove).not.toBeCalled();
        });

        it('Should return when no embeds found', async () => {
            const reaction = {
                partial: false,
                message: {
                    author: {
                        id: botUser.id,
                    },
                    embeds: [],
                },
                users: {
                    remove: jest.fn(),
                },
            } as unknown as MessageReaction;

            await bot.handleReaction(reaction, otherUser);

            expect(reaction.users.remove).not.toBeCalled();
        });

        describe('Reacting', () => {
            const emojiWithFunction = {
                [config.emojis.pauseSong]: 'pause',
                [config.emojis.playSong]: 'play',
                [config.emojis.skipSong]: 'skip',
                [config.emojis.stopSong]: 'stop',
            };

            it.each(Object.keys(emojiWithFunction))('Should perform action when emoji clicked', async (emojiName) => {
                const reaction = {
                    partial: false,
                    message: {
                        author: {
                            id: botUser.id,
                        },
                        embeds: [
                            {
                                url: 'some_url',
                            },
                        ],
                    },
                    emoji: {
                        name: emojiName,
                    },
                    users: {
                        remove: jest.fn(),
                    },
                } as unknown as MessageReaction;

                await bot.handleReaction(reaction, otherUser);

                expect(mediaPlayer[emojiWithFunction[emojiName]]).toBeCalled();
                expect(reaction.users.remove).toBeCalled();
            });

            it('Should perform action when add media emoji clicked', async () => {
                const reaction = {
                    partial: false,
                    message: {
                        author: {
                            id: botUser.id,
                        },
                        embeds: [
                            {
                                url: 'some_url',
                            },
                        ],
                    },
                    emoji: {
                        name: config.emojis.addSong,
                    },
                    users: {
                        remove: jest.fn(),
                    },
                } as unknown as MessageReaction;

                await bot.handleReaction(reaction, otherUser);

                expect(queueManager.addMedia).toBeCalled();
                expect(reaction.users.remove).toBeCalled();
            });
        });
    });
});
