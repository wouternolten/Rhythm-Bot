import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { IChannelManager } from 'src/channel/ChannelManager';
import { IMediaItemHelper } from 'src/helpers/IMediaItemHelper';
import { IQueueManager } from 'src/queue/QueueManager';
import { IRhythmBotConfig } from '../bot/IRhythmBotConfig';
import { MediaPlayer } from './../media/MediaPlayer';
import { ICommand } from './ICommand';

const YOUTUBE_REGEX = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-_]*)(&(amp;)?[\w?=]*)?/;

export class SearchCommand implements ICommand {
    constructor(
        private readonly player: MediaPlayer,
        private readonly mediaItemHelper: IMediaItemHelper,
        private readonly queueManager: IQueueManager,
        private readonly channelManager: IChannelManager,
        private readonly config: IRhythmBotConfig
    ) {}

    async execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): Promise<void> {
        let noResults = true;

        if (!cmd.body || typeof cmd.body !== 'string') {
            this.channelManager.sendInfoMessage(`Please input a song.`);
            return;
        }

        if (YOUTUBE_REGEX.test(cmd.body)) {
            await this.queueManager.addMedia({
                type: 'youtube',
                url: cmd.body,
                requestor: msg.author.username,
            });

            this.player.play();
            return;
        }

        const videos = await this.mediaItemHelper.getMediaItemsForSearchString(cmd.body, 3);

        if (Array.isArray(videos) && videos.length > 0) {
            await this.channelManager.sendSearchResults(videos);

            noResults = false;
        }

        if (noResults) {
            this.channelManager.sendInfoMessage(`No songs found`);
        }
    }

    getDescription(): string {
        return 'search for a song.';
    }
}
