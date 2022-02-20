import { MediaPlayer } from './../media/media-player';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { ICommand } from './ICommand';
import { IRhythmBotConfig } from 'src/bot';
import { createErrorEmbed, createInfoEmbed } from '../helpers';

export class JoinUserChannelCommand implements ICommand {
    constructor(
        private readonly player: MediaPlayer,
        private readonly config: IRhythmBotConfig
    ) {
        this.player = player;
        this.config = config;
    }

    async execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): Promise<void> {
        if (this.player.isConnected()) {
            msg.channel.send(createInfoEmbed('Already in a channel.'));
            return;
        }

        try {
            await this.player.connectToMessageChannel(msg);

            msg.channel.send(createInfoEmbed(`Joined Channel: ${msg.member.voice.channel.name}`));

            if (this.config.auto.play) {
                this.player.play();
            }
        } catch (error) {
            msg.channel.send(createErrorEmbed(error));
        }
    }

    getDescription(): string {
        return 'lets the bot join a voice channel.'; 
    }
}