import { MediaPlayer } from './../media/media-player';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { ICommand } from './ICommand';
import { secondsToTimestamp, createInfoEmbed } from '../helpers';

export class TimeCommand implements ICommand {
    constructor(private readonly player: MediaPlayer) {}

    execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): void {
        const media = this.player.getFirstSong();

        if (!media) {
            msg.channel.send(createInfoEmbed('No song playing.'));
            return;
        }

        const elapsed = secondsToTimestamp(this.player.getCurrentSongTimeElapsedInMilliSeconds() / 1000);
        msg.channel.send(createInfoEmbed('Time Elapsed', `${elapsed} / ${media.duration}`));
    }
    
    getDescription(): string {
        return `display the time elapsed in the current song.`;
    }
}