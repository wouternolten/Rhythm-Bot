import { MEDIA_TYPE_YOUTUBE } from './../../../src/mediatypes/MediaType';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import { SearchCommand } from './../../../src/command/SearchCommand';
import { MediaPlayer } from './../../../src/media/MediaPlayer';
import { IMediaItemHelper } from './../../../src/helpers/IMediaItemHelper';
import { Message } from 'discord.js';
import { IRhythmBotConfig } from '../../../src/bot/IRhythmBotConfig';
import { mock, MockProxy } from 'jest-mock-extended';
import { IQueueManager } from '../../../src/queue/QueueManager';
import { IChannelManager } from '../../../src/channel/ChannelManager';

jest.mock('../../../src/helpers/helpers');

const player: MockProxy<MediaPlayer> = mock<MediaPlayer>();
const mediaItemHelper: MockProxy<IMediaItemHelper> = mock<IMediaItemHelper>(); 
const queueManager: MockProxy<IQueueManager> = mock<IQueueManager>();
const channelManager: MockProxy<IChannelManager> = mock<IChannelManager>();

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
    author: {
        username: RICK_ASTLEY
    }
} as unknown as Message;

beforeEach(() => {
    searchCommand = new SearchCommand(
        player,
        mediaItemHelper,
        queueManager,
        channelManager,
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

        expect(channelManager.sendInfoMessage).toHaveBeenCalledWith('Please input a song.');
    });


describe('Youtube search', () => {
    it('Should directly add media and play if input is a YT url', async () => {
        const cmd = { body: NEVER_GONNA_GIVE_YOU_UP_YOUTUBE_LINK } as SuccessfulParsedMessage<Message>;
        
        await searchCommand.execute(cmd, MESSAGE);

        expect(queueManager.addMedia).toBeCalled();
        expect(player.play).toBeCalled();
    });
});

describe('Keyword search', () => {
    const keywordCmd = { body: NEVER_GONNA_GIVE_YOU_UP } as SuccessfulParsedMessage<Message>;

    it('Should display a message when no results found', async () => {
        mediaItemHelper.getMediaItemsForSearchString.mockResolvedValue([]);

        await searchCommand.execute(keywordCmd, MESSAGE);

        expect(channelManager.sendInfoMessage).toBeCalled();
    });

    it('Should add found videos to channel', async () => {
        const videos = [
            {
                type: MEDIA_TYPE_YOUTUBE,
                url: NEVER_GONNA_GIVE_YOU_UP_YOUTUBE_LINK
            }
        ];

        mediaItemHelper.getMediaItemsForSearchString.mockResolvedValue(videos);
        
        await searchCommand.execute(keywordCmd, MESSAGE);

        expect(channelManager.sendSearchResults).toBeCalledWith(videos);
    });
});
