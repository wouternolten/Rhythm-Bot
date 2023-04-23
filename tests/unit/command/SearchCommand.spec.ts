import { MEDIA_TYPE_YOUTUBE } from './../../../src/mediatypes/MediaType';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import { SearchCommand } from './../../../src/command/SearchCommand';
import { MediaPlayer } from './../../../src/media';
import { IRhythmBotConfig } from './../../../src/bot/bot-config';
import { IMediaItemHelper } from './../../../src/helpers/IMediaItemHelper';
import { Message, MessageEmbed } from 'discord.js';
import { createEmbed, createInfoEmbed } from '../../../src/helpers';

jest.mock('../../../src/helpers');

const player = {
    addMedia: jest.fn(),
    play: jest.fn()
} as unknown as MediaPlayer;

const mediaItemHelper = {
    getMediaItemsForSearchString: jest.fn(),
    getMediaItemForSearchString: jest.fn()
} as IMediaItemHelper;

const config = {
    emojis: {
        addSong: 'add_song_emoji'
    }
} as unknown as IRhythmBotConfig;

let searchCommand: SearchCommand;

const RICK_ASTLEY = 'Rick Astley';
const NEVER_GONNA_GIVE_YOU_UP_YOUTUBE_LINK = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const NEVER_GONNA_GIVE_YOU_UP = 'Never gonna give you up';

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


describe('Youtube search', () => {
    it('Should directly add media and play if input is a YT url', async () => {
        const cmd = { body: NEVER_GONNA_GIVE_YOU_UP_YOUTUBE_LINK } as SuccessfulParsedMessage<Message>;
        
        await searchCommand.execute(cmd, MESSAGE);

        expect(player.addMedia).toBeCalled();
        expect(player.play).toBeCalled();
    });
});

describe('Keyword search', () => {
    const keywordCmd = { body: NEVER_GONNA_GIVE_YOU_UP } as SuccessfulParsedMessage<Message>;

    it('Should display a message when no results found', async () => {
        (mediaItemHelper.getMediaItemsForSearchString as jest.Mock).mockReturnValue([]);

        await searchCommand.execute(keywordCmd, MESSAGE);

        expect(createInfoEmbed).toBeCalled();
    });

    it('Should add found videos to channel', async () => {
        (mediaItemHelper.getMediaItemsForSearchString as jest.Mock)
            .mockReturnValue([
                {
                    type: MEDIA_TYPE_YOUTUBE,
                    url: NEVER_GONNA_GIVE_YOU_UP_YOUTUBE_LINK
                } 
            ]);
        
        const placedMessage = {
            react: jest.fn()
        };

        (createEmbed as jest.Mock).mockImplementation(() => {
            return new MessageEmbed().setColor('#a600ff');
        });
        
        (MESSAGE.channel.send as jest.Mock).mockResolvedValue(placedMessage);
        
        await searchCommand.execute(keywordCmd, MESSAGE);

        expect(createEmbed).toBeCalled();
        expect(placedMessage.react).toBeCalled();
    });
});
