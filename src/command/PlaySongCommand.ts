import { MediaPlayer } from 'src/media';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { ICommand } from './ICommand';
import { createInfoEmbed, joinUserChannel } from '../helpers';

export class PlaySongCommand implements ICommand {
    constructor(private readonly player: MediaPlayer) { }
    
    execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): void {
        new Promise<void>((done) => {
            if (!this.player.connection) {
                joinUserChannel(msg).then((conn) => {
                    this.player.connection = conn;
                    msg.channel.send(createInfoEmbed(`Joined Channel: ${conn.channel.name}`));
                    done();
                });
            } else {
                done();
            }
        }).then(() => {
            this.player.play();
        });
    }
}