import { SuccessfulParsedMessage } from "discord-command-parser";
import { Client, Message } from "discord.js";
import { MediaPlayer } from "src/media";
import { createInfoEmbed } from "../helpers";
import { ICommand } from "./ICommand";

export class LeaveChannelCommand implements ICommand {
    constructor(
        private readonly player: MediaPlayer,
        private readonly client: Client
    ) {}

    execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): void {
        this.player.stop();
        this.player.connection = null;
        this.client.voice.connections.forEach((conn) => {
            conn.disconnect();
            msg.channel.send(createInfoEmbed(`Disconnecting from channel: ${conn.channel.name}`));
        });
    }

    getDescription(): string {
        return 'lets the bot leave the voice channel.'; 
    }
}