import { SuccessfulParsedMessage } from 'discord-bot-quickstart';
import { SearchCommand } from './../../../src/command/SearchCommand';
import { MediaPlayer } from './../../../src/media';
import { IRhythmBotConfig } from './../../../src/bot/bot-config';
import { IMediaItemHelper } from './../../../src/helpers/IMediaItemHelper';
import { Message } from 'discord.js';
import { createInfoEmbed } from '../../../src/helpers';

jest.mock('../../../src/helpers');

const player = {
    addMedia: jest.fn(),
    isPlaying: jest.fn(),
    play: jest.fn()
} as unknown as MediaPlayer;

const mediaItemHelper = {} as unknown as IMediaItemHelper;
const config = {} as unknown as IRhythmBotConfig;
let searchCommand: SearchCommand;

const RICK_ASTLEY = 'Rick Astley';
const NEVER_GONNA_GIVE_YOU_UP_YOUTUBE_LINK = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

const MESSAGE = {
    channel: {
        send: jest.fn()
    },
    author: {
        username: RICK_ASTLEY
    }
} as unknown as Message;

beforeEach(() => {
    searchCommand = new SearchCommand(
        player,
        mediaItemHelper,
        config
    );
});

it('Should have a description', () => {
    expect(searchCommand.getDescription()).toBeTruthy();
    expect(searchCommand.getDescription().length).toBeGreaterThan(1);
});

it.each([undefined, null, ''])
    ('Should send a message for an invalid string if empty / no body given', (body) => {
        const cmd = { body } as SuccessfulParsedMessage<Message>;

        searchCommand.execute(cmd, MESSAGE);

        expect(createInfoEmbed).toHaveBeenCalledWith('Please input a song.');
    });

it('Should directly add media and play if input is a YT url', async () => {
    const cmd = { body: NEVER_GONNA_GIVE_YOU_UP_YOUTUBE_LINK } as SuccessfulParsedMessage<Message>;

    (player.isPlaying as jest.Mock).mockReturnValue(false);

    await searchCommand.execute(cmd, MESSAGE);

    expect(player.addMedia).toBeCalled();
    expect(player.play).toBeCalled();
});

it('Should directly add media and play if input is a YT url but player is already playing', async () => {
    const cmd = { body: NEVER_GONNA_GIVE_YOU_UP_YOUTUBE_LINK } as SuccessfulParsedMessage<Message>;

    (player.isPlaying as jest.Mock).mockReturnValue(true);

    await searchCommand.execute(cmd, MESSAGE);

    expect(player.addMedia).toBeCalled();
    expect(player.play).not.toBeCalled();
});

it('Should send ')
