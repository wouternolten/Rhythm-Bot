import { MediaPlayer } from './../media/media-player';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { ICommand } from './ICommand';
import { IRhythmBotConfig } from 'src/bot';
import { createErrorEmbed, createInfoEmbed, joinUserChannel } from '../helpers';

export class JoinUserChannelCommand implements ICommand {
    constructor(
        private readonly player: MediaPlayer,
        private readonly config: IRhythmBotConfig
    ) {
        this.player = player;
        this.config = config;
    }

    async execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): Promise<void> {
        if (this.player.connection) {
            msg.channel.send(createInfoEmbed('Already in a channel.'));
            return;
        }

        joinUserChannel(msg)
            .then((connection) => {
                this.player.connection = connection;
                msg.channel.send(createInfoEmbed(`Joined Channel: ${connection.channel.name}`));
                if (this.config.auto.play) {
                    this.player.play();
                }
            })
            .catch((err) => {
                console.log(err);
                msg.channel.send(createErrorEmbed(err));
            });
    }
}