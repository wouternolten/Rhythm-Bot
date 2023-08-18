import { MediaPlayer } from '../media/MediaPlayer';
import { ICommand } from './ICommand';

export class SimplePlayerActCommand implements ICommand {
    constructor(private readonly player: MediaPlayer, private readonly invokeFunction: string) {}

    execute(): void {
        this.player[this.invokeFunction]();
    }

    getDescription(): string {
        return `${this.invokeFunction}s the player.`;
    }
}
