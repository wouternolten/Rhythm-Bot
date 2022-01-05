import { MediaPlayer } from 'src/media';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { ICommand } from './ICommand';

export class MoveSongCommand implements ICommand {
    constructor(private readonly player: MediaPlayer) { }
    
    execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): void {
        if (cmd.arguments.length <= 1) {
            return;
        }

        let current = Math.min(Math.max(parseInt(cmd.arguments[0]), 0), this.player.queue.length - 1),
            targetDesc = cmd.arguments[1],
            target = 0;
        
        if (current === -1) {
            return;
        }
        
        if (targetDesc == 'up') {
            target = Math.min(current - 1, 0);
        } else if (targetDesc == 'down') {
            target = Math.max(current + 1, this.player.queue.length - 1);
        } else {
            target = parseInt(targetDesc);
        }

        this.player.move(current, target);
    }

    getDescription(): string {
        return 'moves a song in queue. Usage: `move [song index to move] [up / down / target destination]`.'; 
    }
}