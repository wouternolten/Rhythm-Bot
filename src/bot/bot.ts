import { MediaPlayer } from '../media';
import { IRhythmBotConfig } from './bot-config';
import {
    CommandMap,
    SuccessfulParsedMessage,
    Message
} from 'discord-bot-quickstart';
import { Logger } from 'winston';
import { parse } from 'discord-command-parser';
import { MessageReaction, User } from 'discord.js';

export class RhythmBot {
    constructor(
        private readonly config: IRhythmBotConfig,
        private readonly user: User,
        private readonly player: MediaPlayer,
        private readonly logger: Logger,
        private readonly commands: CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>
    ) {
    }

    parsedMessage(msg: SuccessfulParsedMessage<Message>) {
        // TODO: Split functionality; the player should not update a channel; another class should be responsible for this.
        this.player.setChannel(msg.message.channel);
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
            return;
        }

        this.logger.debug(`Bot Command: ${msg.content}`);
        this.parsedMessage(parsed);
        handlers.forEach(handle => {
            handle(parsed as SuccessfulParsedMessage<Message>, msg);
        });
    }

    async handleReaction(reaction: MessageReaction, user: User): Promise<void> {
        if (!this.config.emojis) {
            this.logger.warning('Emojis not set for reactions. Not handling reaction');

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

        if (!embed) {
            return;
        }
        
        if (reaction.emoji.name === this.config.emojis.addSong && embed.url) {
            this.logger.debug(`Emoji Click: Adding Media: ${embed.url}`);
            this.player.addMedia({
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
