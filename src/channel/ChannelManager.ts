import { Client, Message, TextChannel } from 'discord.js';
import { IRhythmBotConfig } from 'src/bot/IRhythmBotConfig';
import { Logger } from 'winston';
import { createEmbed, createErrorEmbed, createInfoEmbed } from './../helpers/helpers';
import { MediaItem } from './../media/MediaItem';

export interface IChannelManager {
    sendInfoMessage(message: string): Promise<void>;
    sendInfoMessageWithTitle(message: string, title: string): Promise<void>;
    sendErrorMessage(message: string): Promise<void>;
    sendTrackAddedMessage(item: MediaItem, position: number): Promise<void>;
    sendTrackPlayingMessage(item: MediaItem): Promise<void>;
    sendSearchResults(items: MediaItem[]): Promise<void>;
}

export class ChannelManager implements IChannelManager {
    private channel: TextChannel | any | undefined; // I'm a developer and too lazy to type 26 different aspects of a 'channel' when I just need one method.

    constructor(
        private readonly config: IRhythmBotConfig,
        private readonly client: Client,
        private readonly logger: Logger
    ) {
        this.initialize();
    }

    private initialize(): void {
        this.client.on('messageCreate', (message: Message<boolean>) => {
            this.channel = message.channel;
        });
    }

    private getChannel(): TextChannel | undefined {
        if (!this.channel) {
            this.logger.error('Channel not found in channel manager. Call stack added', {
                callStack: new Error().stack,
            });
        }

        return this.channel;
    }

    async sendInfoMessage(message: string): Promise<void> {
        await this.getChannel()?.send(createInfoEmbed(message));
    }

    async sendInfoMessageWithTitle(message: string, title: string): Promise<void> {
        await this.getChannel()?.send(createInfoEmbed(message, title));
    }

    async sendErrorMessage(message: string): Promise<void> {
        await this.getChannel()?.send(createErrorEmbed(message));
    }

    async sendTrackAddedMessage(item: MediaItem, position: number): Promise<void> {
        await this.getChannel()?.send({
            embeds: [
                createEmbed()
                    .setTitle('Track Added')
                    .setImage(item.imageUrl ?? '')
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
                    ),
            ],
        });
    }

    async sendTrackPlayingMessage(item: MediaItem): Promise<void> {
        const message = await this.getChannel()?.send({
            embeds: [
                createEmbed()
                    .setTitle('▶️ Now playing')
                    .setDescription(`${item.name}`)
                    .addFields({ name: 'Requested By', value: `${item.requestor}` }),
            ],
        });

        await Promise.all([
            message.react(this.config.emojis.stopSong),
            message.react(this.config.emojis.playSong),
            message.react(this.config.emojis.pauseSong),
            message.react(this.config.emojis.skipSong),
        ]);
    }

    async sendSearchResults(items: MediaItem[]): Promise<void> {
        await Promise.all(
            items
                .slice(0, 3)
                .map((video) =>
                    createEmbed()
                        .setTitle(`${video.name}`)
                        .addFields({ name: 'Duration', value: `${video.duration}`, inline: true })
                        .setThumbnail(video.imageUrl)
                        .setURL(video.url)
                )
                .map((embed) =>
                    this.channel
                        .send({ embeds: [embed] })
                        .then((message: Message) => message.react(this.config.emojis.addSong))
                )
        );
    }
}
