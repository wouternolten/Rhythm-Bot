import { IMediaFilePlayer } from './../media/MediaFilePlayer';
import { ICommand } from './ICommand';

export class PlaySoundFileCommand implements ICommand {
    constructor(private readonly fileName: string, private readonly mediaPlayer: IMediaFilePlayer) {}

    execute(): void {
        this.mediaPlayer.playFile(`${process.cwd()}\\data\\sounds\\${this.fileName}`);
    }

    getDescription(): string {
        return 'plays a sound file.';
    }
}
