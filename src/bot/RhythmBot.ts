import { parse, SuccessfulParsedMessage } from 'discord-command-parser';
import { Client, Message, MessageReaction, User } from 'discord.js';
import { IQueueManager } from 'src/queue/QueueManager';
import { Logger } from 'winston';
import { IChannelManager } from '../channel/ChannelManager';
import { ICommandMapFactory } from '../command/ICommandMapFactory';
import { IAudioPlayerFactory } from '../helpers/AudioPlayerFactory';
import { CommandMap } from '../helpers/CommandMap';
import { IMessageInformationHelper } from '../helpers/MessageInformationHelper';
import { MediaPlayer } from '../media/MediaPlayer';
import { IRhythmBotConfig } from './IRhythmBotConfig';

export class RhythmBot {
    private readonly commands: CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>;

    constructor(
        private readonly client: Client,
        private readonly config: IRhythmBotConfig,
        private readonly player: MediaPlayer,
        private readonly queueManager: IQueueManager,
        private readonly logger: Logger,
        private readonly channelManager: IChannelManager,
        private readonly audioPlayerFactory: IAudioPlayerFactory,
        private readonly messageInformationHelper: IMessageInformationHelper,
        commandMapFactory: ICommandMapFactory
    ) {
        this.commands = commandMapFactory.createMusicBotCommandsMap();
    }

    initialize(): void {
        this.client.on('messageCreate', (msg: Message) => {
            this.handleMessage(msg);
        });

        this.client.on('messageReactionAdd', (reaction: MessageReaction, user: User) => {
            this.handleReaction(reaction, user);
        });
    }

    handleMessage(msg: Message): void {
        if (!this.config.command?.symbol) {
            this.logger.error('Symbol handle message not set.');

            return;
        }

        if (msg.author.id === this.client.user.id) {
            return;
        }

        if (!this.correctTextChannel(msg) || !this.correctVoiceChannel(msg)) {
            return;
        }

        const parsed = parse(msg, this.config.command.symbol);

        if (!parsed.success) {
            return;
        }

        const handlers = this.commands.get(parsed.command);

        if (!handlers) {
            this.logger.debug('Handlers not found');
            return;
        }

        this.logger.debug(`Bot Command: ${msg.content}`);
        handlers.forEach((handle) => {
            handle(parsed as SuccessfulParsedMessage<Message>, msg);
        });
    }

    correctTextChannel(msg: Message<boolean>): boolean {
        const textChannelInfo = this.channelManager.getChannelInfo();

        if (!textChannelInfo) {
            return true;
        }

        if (textChannelInfo.id === this.messageInformationHelper.getTextChannelInfo(msg)?.id) {
            return true;
        }

        this.channelManager.sendErrorMessage(`Please join this text channel to send messages to the bot!`);

        return false;
    }

    correctVoiceChannel(msg: Message<boolean>): boolean {
        const voiceChannelInfo = this.audioPlayerFactory.getChannelInfo();

        if (!voiceChannelInfo) {
            return true;
        }

        if (voiceChannelInfo.id === this.messageInformationHelper.getUserVoiceChannelInfo(msg)?.id) {
            return true;
        }

        this.channelManager.sendErrorMessage(
            `Please join voice channel ${voiceChannelInfo.name} to send messages to the bot.`
        );

        return false;
    }

    async handleReaction(reaction: MessageReaction, user: User): Promise<void> {
        if (!this.config.emojis) {
            this.logger.error('Emojis not set for reactions. Not handling reaction');

            return;
        }

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                this.logger.error(JSON.stringify(error));
                return;
            }
        }

        if (
            reaction.message.author.id !== this.client.user.id ||
            user.id === this.client.user.id ||
            Array.isArray(reaction.message.embeds) == false ||
            reaction.message.embeds.length === 0
        ) {
            return;
        }

        const embed = reaction.message.embeds[0];

        if (reaction.emoji.name === this.config.emojis.addSong && embed.url) {
            this.logger.debug(`Emoji Click: Adding Media: ${embed.url}`);
            this.queueManager.addMedia({
                type: 'youtube',
                url: embed.url,
                requestor: user.username,
            });
        }

        if (reaction.emoji.name === this.config.emojis.stopSong) {
            this.logger.debug('Emoji Click: Stopping Song');
            this.player.stop();
        }

        if (reaction.emoji.name === this.config.emojis.playSong) {
            this.logger.debug('Emoji Click: Playing/Resuming Song');
            this.player.play();
        }

        if (reaction.emoji.name === this.config.emojis.pauseSong) {
            this.logger.debug('Emoji Click: Pausing Song');
            this.player.pause();
        }

        if (reaction.emoji.name === this.config.emojis.skipSong) {
            this.logger.debug('Emoji Click: Skipping Song');
            this.player.skip();
        }

        reaction.users.remove(user.id);
    }
}
