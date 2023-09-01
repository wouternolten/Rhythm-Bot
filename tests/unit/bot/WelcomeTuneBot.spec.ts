import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Client, ClientUser, Message, User, VoiceState } from 'discord.js';
import { EventEmitter } from 'events';
import { mock } from 'jest-mock-extended';
import { Logger } from 'winston';
import { IRhythmBotConfig } from '../../../src/bot/IRhythmBotConfig';
import { WelcomeTuneBot } from '../../../src/bot/WelcomeTuneBot';
import { ICommandMapFactory } from '../../../src/command/ICommandMapFactory';
import { CommandMap } from '../../../src/helpers/CommandMap';
import { IMediaFilePlayer } from '../../../src/media/MediaFilePlayer';

const botUser = {
    id: 'RICK_ASTLEY',
} as unknown as ClientUser;

const message = {
    content: 'Some content',
    author: {
        id: 'MICHAEL_JACKSON',
    } as unknown as User,
} as unknown as Message;

const mockParseReturnValue = jest.fn();
const mockProjectReturnValue = jest.fn();
const mockFsExistsSyncReturnValue = jest.fn();

jest.mock('discord-command-parser', () => ({
    parse: (msg: Message<boolean>, symbol: string) => mockParseReturnValue(msg, symbol),
}));

jest.mock('../../../src/helpers/ProjectDirectory', () => ({
    projectDirectory: (dir: string) => mockProjectReturnValue(dir),
}));

jest.mock('fs', () => ({ existsSync: (path: string) => mockFsExistsSyncReturnValue(path) }));

let bot: WelcomeTuneBot;

const config = mock<IRhythmBotConfig>();
const filePlayer = mock<IMediaFilePlayer>();
const client = new EventEmitter() as unknown as Client;
const logger = mock<Logger>();
// I'm not mocking the commandMap, because, unlike the parse function, it's a simple key / value object.
const commands = new CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>();
const commandFunction = jest.fn();
commands.on('cmd', (cmd, msg) => commandFunction(cmd, msg));
const commandFactory = { createWelcomeBotCommandsMap: () => commands } as ICommandMapFactory;

beforeEach(() => {
    jest.resetAllMocks();

    client.user = botUser;
    config.command.symbol = '!';

    bot = new WelcomeTuneBot(config, filePlayer, commandFactory, client, logger);
    bot.initialize();
});

describe('messageCreate', () => {
    it('Should log error and return when config command symbol is not set', () => {
        config.command.symbol = undefined;

        client.emit('messageCreate', {} as unknown as Message);

        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Symbol'));
    });

    it('Should not parse message when message is from author', () => {
        client.emit('messageCreate', { author: { id: botUser.id } } as unknown as Message);

        expect(logger.error).not.toHaveBeenCalled();
        expect(mockParseReturnValue).not.toHaveBeenCalled();
    });

    it('Should return when parsing message failed', () => {
        mockParseReturnValue.mockReturnValue({});
        client.emit('messageCreate', message);

        expect(commandFunction).not.toHaveBeenCalled();
    });

    it('Should call handler when found on handleMessage', () => {
        mockParseReturnValue.mockReturnValue({
            success: true,
            command: 'cmd',
            message: {
                channel: {},
            },
        });

        client.emit('messageCreate', message);

        expect(commandFunction).toBeCalled();
    });
});

describe('handleVoiceStateUpdate', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('Should not get soundmap when user was already in voice channel', () => {
        client.emit('voiceStateUpdate', { channelId: '1' } as unknown as VoiceState, {} as unknown as VoiceState);

        expect(mockProjectReturnValue).not.toHaveBeenCalled();
    });

    it('Should not play file when config is not found', () => {
        mockProjectReturnValue.mockReturnValue('some-path');
        mockFsExistsSyncReturnValue.mockReturnValue(false);

        client.emit('voiceStateUpdate', {} as unknown as VoiceState, {} as unknown as VoiceState);

        jest.runAllTimers();

        expect(mockFsExistsSyncReturnValue).toHaveBeenCalled();
        expect(filePlayer.playFile).not.toHaveBeenCalled();
    });

    it('Should not play file when it is not found', () => {
        mockProjectReturnValue.mockImplementation((dir: string) => {
            if (dir === '../bot-config.json') {
                return 'path/to/config.json';
            }

            return 'some-path-without-files';
        });

        mockFsExistsSyncReturnValue.mockReturnValue(true);
        jest.mock('some-path-without-files', () => {}, { virtual: true });

        client.emit('voiceStateUpdate', {} as unknown as VoiceState, {} as unknown as VoiceState);

        jest.runAllTimers();

        expect(mockProjectReturnValue).toHaveBeenCalledWith('path/to/config.json');
        expect(filePlayer.playFile).not.toHaveBeenCalled();
    });

    it('Should not play file when file for user name not found', () => {
        mockProjectReturnValue.mockImplementation((dir: string) => {
            if (dir === '../bot-config.json') {
                return 'path/to/config.json';
            }

            return 'my-path';
        });

        mockFsExistsSyncReturnValue.mockReturnValue(true);
        jest.mock('my-path', () => ({ soundFiles: { someId: 'file.mp3' } }), { virtual: true });

        client.emit(
            'voiceStateUpdate',
            {} as unknown as VoiceState,
            {
                member: {
                    user: {
                        username: 'other-id',
                    },
                },
            } as unknown as VoiceState
        );

        jest.runAllTimers();

        expect(mockProjectReturnValue).toHaveBeenCalledWith('path/to/config.json');
        expect(filePlayer.playFile).not.toHaveBeenCalled();
    });

    it('Should play file when file for user name found', () => {
        const username = 'Rick_Astley';
        mockProjectReturnValue.mockImplementation((dir: string) => {
            if (dir === '../bot-config.json') {
                return 'path/to/config.json';
            }

            return 'my-valid-path';
        });

        mockFsExistsSyncReturnValue.mockReturnValue(true);
        jest.mock('my-valid-path', () => ({ soundFiles: { [username]: 'file.mp3' } }), { virtual: true });

        client.emit(
            'voiceStateUpdate',
            {} as unknown as VoiceState,
            {
                member: {
                    user: {
                        username,
                    },
                },
            } as unknown as VoiceState
        );

        jest.runAllTimers();

        expect(filePlayer.playFile).toHaveBeenCalled();
    });
});
