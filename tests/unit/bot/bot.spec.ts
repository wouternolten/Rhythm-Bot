import { MediaPlayer } from './../../../src/media';
import { IRhythmBotConfig } from './../../../src/bot/bot-config';
import { RhythmBot } from './../../../src/bot/bot';
import { Message, User, MessageReaction } from 'discord.js';
import { SuccessfulParsedMessage } from 'discord-bot-quickstart';
import { CommandMap } from './../../../src/helpers/CommandMap';
import { mockLogger } from '../../mocks/mockLogger';

const mockParseReturnValue = jest.fn();

jest.mock('discord-command-parser', () => {
    const originalModule = jest.requireActual('ytdl-core');

    return {
        __esModule: true,
        ...originalModule,
        parse: (...params: any) => mockParseReturnValue(params)
    }
});

let bot: RhythmBot;

const config = {
    command: {
        symbol: "!"
    },
    "emojis": {
        "addSong": "👍",
        "stopSong": "⏹️",
        "playSong": "▶️",
        "pauseSong": "⏸️",
        "skipSong": "⏭️"
    }
} as unknown as IRhythmBotConfig;

const botUser = {
    id: "RICK_ASTLEY"
} as unknown as User;

const otherUser = {
    id: "MICHAEL_JACKSON"
} as unknown as User;

const mediaPlayer = {
    addMedia: jest.fn(),
    stop: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    skip: jest.fn(),
    setChannel: jest.fn()
} as unknown as MediaPlayer;

const logger = mockLogger();

// I'm not mocking the commandMap, because, unlike the parse function, it's a simple key / value object.
const commands = new CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>();
const commandFunction = jest.fn();
commands.on('cmd', (cmd, msg) => commandFunction(cmd, msg));

const message = {
    content: "Some content",
    author: otherUser
} as unknown as Message;

describe('Invalid config', () => {
    beforeEach(() => {
        bot = new RhythmBot(
            {} as unknown as IRhythmBotConfig,
            botUser,
            mediaPlayer,
            logger,
            {} as unknown as CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>
        );
    });

    it('Should log error and return when no symbol set on handleMessage', () => {
        bot.handleMessage(message);

        expect(logger.error).toBeCalled();
    });

    it('Should log warning and return when no emoji set on handleReaction', () => {
        bot.handleReaction({} as unknown as MessageReaction, botUser);

        expect(logger.warning).toBeCalled();
    });
});

describe('Valid constructor parameters', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        bot = new RhythmBot(
            config,
            botUser,
            mediaPlayer,
            logger,
            commands
        );
    });

    it('Should return when message user is bot itself', () => {
        mockParseReturnValue.mockReturnValue({ success: true, command: "cmd" });
        const botMessage = { ...message } as unknown as Message;
        botMessage.author = botUser;

        bot.handleMessage(botMessage);

        expect(logger.error).not.toBeCalled();
        expect(commandFunction).not.toBeCalled();
    });

    it('Should return when parsing fails on handle message', () => {
        mockParseReturnValue.mockReturnValue({ success: false, command: "cmd" });

        bot.handleMessage(message);

        expect(commandFunction).not.toBeCalled();
    });

    it('Should return when no handlers found', () => {
        mockParseReturnValue.mockReturnValue({ success: true, command: "INVALID" });

        bot.handleMessage(message);

        expect(logger.error).not.toBeCalled();
    });

    it('Should call handler when found on handleMessage', () => {
        mockParseReturnValue.mockReturnValue({
            success: true,
            command: "cmd",
            message: {
                channel: {}
            }
        });

        bot.handleMessage(message);

        expect(commandFunction).toBeCalled();
    });

    it('Should throw an error when partial fetching of reaction fails on handleReaction', async () => {
        const reaction = {
            partial: true,
            fetch: jest.fn().mockRejectedValue('')
        } as unknown as MessageReaction;

        await bot.handleReaction(reaction, botUser);

        expect(logger.error).toBeCalled();
    });

    it('Should return when original reaction message is not bot user', async () => {
        const reaction = {
            partial: false,
            message: {
                author: {
                    id: `NOT_${botUser.id}`
                }
            },
            users: {
                remove: jest.fn()
            }
        } as unknown as MessageReaction;

        await bot.handleReaction(reaction, otherUser);

        expect(reaction.users.remove).not.toBeCalled();
    });

    it('Should return when bot itself is reacting', async () => {
        const reaction = {
            partial: false,
            message: {
                author: {
                    id: botUser.id
                }
            },
            users: {
                remove: jest.fn()
            }
        } as unknown as MessageReaction;

        await bot.handleReaction(reaction, botUser);

        expect(reaction.users.remove).not.toBeCalled();
    });

    it('Should return when embed is not an array', async () => {
        const reaction = {
            partial: false,
            message: {
                author: {
                    id: botUser.id
                },
                embeds: 1234
            },
            users: {
                remove: jest.fn()
            }
        } as unknown as MessageReaction;

        await bot.handleReaction(reaction, otherUser);

        expect(reaction.users.remove).not.toBeCalled();
    });

    it('Should return when no embeds found', async () => {
        const reaction = {
            partial: false,
            message: {
                author: {
                    id: botUser.id
                },
                embeds: []
            },
            users: {
                remove: jest.fn()
            }
        } as unknown as MessageReaction;

        await bot.handleReaction(reaction, otherUser);

        expect(reaction.users.remove).not.toBeCalled();
    });

    describe('Reacting', () => {
        const emojiWithFunction = {
            [config.emojis.addSong]: "addMedia",
            [config.emojis.pauseSong]: "pause",
            [config.emojis.playSong]: "play",
            [config.emojis.skipSong]: "skip",
            [config.emojis.stopSong]: "stop",
        };

        it.each(Object.keys(emojiWithFunction))
            ('Should perform action when emoji clicked', async (emojiName) => {
            const reaction = {
                partial: false,
                message: {
                    author: {
                        id: botUser.id
                    },
                    embeds: [{
                        url: "some_url"
                    }]
                },
                emoji: {
                    name: emojiName
                },
                users: {
                    remove: jest.fn()
                }
            } as unknown as MessageReaction;

            await bot.handleReaction(reaction, otherUser);

            expect(mediaPlayer[emojiWithFunction[emojiName]]).toBeCalled();
            expect(reaction.users.remove).toBeCalled();
        });
    })


});