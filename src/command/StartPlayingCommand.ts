import { MediaPlayer } from 'src/media';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { ICommand } from './ICommand';
import { createErrorEmbed } from '../helpers';

export class StartPlayingCommand implements ICommand {
    constructor(private readonly player: MediaPlayer) { }
    
    async execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): Promise<void> {
        if (!this.player.isConnected()) {
            try {
                await this.player.connectToMessageChannel(msg);
            } catch (error) {
                msg.channel.send(createErrorEmbed(error));
                return;
            }
        }

        this.player.play();
    }

    getDescription(): string {
        return 'start playing songs.'; 
    }
}
