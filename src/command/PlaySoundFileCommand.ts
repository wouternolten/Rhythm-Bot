import { IMediaFilePlayer } from './../media/MediaFilePlayer';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { ICommand } from './ICommand';

export class PlaySoundFileCommand implements ICommand {
    constructor(
        private readonly fileName: string,
        private readonly mediaPlayer: IMediaFilePlayer
    ) { }
    
    execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): void {
        this.mediaPlayer.playFile(`${process.cwd()}\\data\\sounds\\${this.fileName}`, msg.member.voice);
    }

    getDescription(): string {
        return 'plays a sound file.';
    }
}
