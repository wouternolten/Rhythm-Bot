import { parse, SuccessfulParsedMessage } from 'discord-command-parser';
import { Message, MessageReaction, User } from 'discord.js';
import { IQueueManager } from 'src/queue/QueueManager';
import { Logger } from 'winston';
import { ICommandMapFactory } from '../command/ICommandMapFactory';
import { CommandMap } from '../helpers/CommandMap';
import { MediaPlayer } from '../media/MediaPlayer';
import { IRhythmBotConfig } from './IRhythmBotConfig';

export class RhythmBot {
    private readonly commands: CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>;

    constructor(
        private readonly config: IRhythmBotConfig,
        private readonly user: User,
        private readonly player: MediaPlayer,
        private readonly queueManager: IQueueManager,
        private readonly logger: Logger,
        commandMapFactory: ICommandMapFactory
    ) {
        this.commands = commandMapFactory.createMusicBotCommandsMap();
    }

    handleMessage(msg: Message): void {
        if (!this.config.command?.symbol) {
            this.logger.error('Symbol handle message not set.');

            return;
        }

        if (msg.author.id === this.user.id) {
            return;
        }

        let parsed = parse(msg, this.config.command.symbol);

        if (!parsed.success) {
            return;
        }

        let handlers = this.commands.get(parsed.command);

        if (!handlers) {
            this.logger.debug('Handlers not found');
            return;
        }

        this.logger.debug(`Bot Command: ${msg.content}`);
        handlers.forEach((handle) => {
            handle(parsed as SuccessfulParsedMessage<Message>, msg);
        });
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
            reaction.message.author.id !== this.user.id ||
            user.id === this.user.id ||
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
