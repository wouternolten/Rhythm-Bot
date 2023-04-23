import { MediaPlayer } from '../media/MediaPlayer';
import { SuccessfulParsedMessage } from "discord-command-parser";
import { Message } from "discord.js";
import { createInfoEmbed } from "../helpers/helpers";
import { ICommand } from "./ICommand";

export class ListSongsCommand implements ICommand {
    constructor(private readonly player: MediaPlayer) { }

    execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): void {
        let items = this.player.getQueue().map(
            (item, idx) => `${idx + 1}: "${item.name}${item.requestor ? `"` : ''}"`
        );

        if (items.length > 0) {
            msg.channel.send(createInfoEmbed('Current Playing Queue', items.join('\n\n')));
        } else {
            msg.channel.send(createInfoEmbed(`There are no songs in the queue.`));
        }
    }

    
    getDescription(): string {
        return 'lists all songs currently in queue.'; 
    }
}
