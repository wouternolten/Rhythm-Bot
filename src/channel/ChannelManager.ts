import { TextChannel, DMChannel, NewsChannel } from "discord.js";
import { IRhythmBotConfig } from "src/bot/IRhythmBotConfig";
import { createEmbed, createErrorEmbed, createInfoEmbed } from "./../helpers/helpers";
import { MediaItem } from "./../media/MediaItem";

export interface IChannelManager {
    sendInfoMessage(message: string): Promise<void>;
    sendErrorMessage(message: string): Promise<void>;
    sendTrackAddedMessage(item: MediaItem, position: number): Promise<void>;
    sendTrackPlayingMessage(item: MediaItem): Promise<void>;
}

export class ChannelManager implements IChannelManager {
    constructor(
        private readonly config: IRhythmBotConfig,
        private readonly channel: TextChannel | DMChannel | NewsChannel
    ) { }
    
    async sendInfoMessage(message: string): Promise<void> {
        await this.channel.send(createInfoEmbed(message));
    }

    async sendErrorMessage(message: string): Promise<void> {
        await this.channel.send(createErrorEmbed(message));
    }

    async sendTrackAddedMessage(item: MediaItem, position: number): Promise<void> {
        await this.channel.send({
            embeds: [
                createEmbed()
                    .setTitle('Track Added')
                    .addFields(
                        { name: 'Title:', value: item.name },
                        {
                            name: 'Position:',
                            value: String(position),
                            inline: true,
                        },
                        {
                            name: 'Requested By:',
                            value: item.requestor,
                            inline: true,
                        }
                    )
            ]
        });
    }

    async sendTrackPlayingMessage(item: MediaItem): Promise<void> {
        const message = await this.channel.send({
            embeds: [
                createEmbed()
                    .setTitle('▶️ Now playing')
                    .setDescription(`${item.name}`)
                    .addFields({ name: 'Requested By', value: `${item.requestor}` })
            ]
        });

        await Promise.all([
            message.react(this.config.emojis.stopSong),
            message.react(this.config.emojis.playSong),
            message.react(this.config.emojis.pauseSong),
            message.react(this.config.emojis.skipSong)
        ]);
    }
}
