import { IMediaTypeProvider } from './../mediatypes/IMediaTypeProvider';
import {
    AutoPlayNextVideoCommand,
    ForcePlayVideoCommand,
    ICommand,
    JoinUserChannelCommand,
    LeaveChannelCommand,
    ListSongsCommand,
    MoveSongCommand,
    PlaySongCommand,
    PingCommand,
    RemoveSongCommand,
    SearchAndAddCommand,
    SearchCommand,
    SimplePlayerActCommand,
    TimeCommand,
    ToggleRepeatModeCommand,
    VolumeCommand,
} from './../command';
import { MediaPlayer } from '../media';
import { BotStatus } from './bot-status';
import { IRhythmBotConfig } from './bot-config';
import { createErrorEmbed, createInfoEmbed } from '../helpers';
import {
    CommandMap,
    Client,
    SuccessfulParsedMessage,
    Message,
    readFile,
    MessageReaction,
    User,
    ConsoleReader,
    ParsedArgs,
    Interface,
} from 'discord-bot-quickstart';
import { Logger } from 'winston';
import { IBot } from './IBot';
import { parse } from 'discord-command-parser';

const RICK_ROLL_ID = 'dQw4w9WgXcQ';

/** 
 * TODO: Create player on first command.
 * Then directly insert player into channel.
*/
export class RhythmBot implements IBot {
    player: MediaPlayer;
    status: BotStatus;
    private readonly client: Client;
    private readonly commands: CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>;

    constructor(
        private readonly config: IRhythmBotConfig,
        private readonly mediaTypeProvider: IMediaTypeProvider,
        private readonly logger: Logger,
        private readonly console: ConsoleReader,
    ) {
        // TODO: MOVE TO DI CONTAINER
        this.client = this.createClient();

        this.console
            .commands
            .on('exit', (args: ParsedArgs, rl: Interface) => {
                if(this.client)
                    this.client.destroy();
                rl.close();
            });

        this.status = new BotStatus(this.client);
        this.player = new MediaPlayer(this.config, this.status, this.logger, this.mediaTypeProvider);
        this.commands = this.registerDiscordCommands();
    }

    registerDiscordCommands(): CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void> {
        const map = new CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>();

        // TODO: find a way to fetch the player from somewhere?
        const commandMap: { [key: string]: ICommand } = {
            autoplay: new AutoPlayNextVideoCommand(this.player),
            clear: new SimplePlayerActCommand(this.player, 'clear'),
            join: new JoinUserChannelCommand(this.player, this.config),
            leave: new LeaveChannelCommand(this.player, this.client),
            list: new ListSongsCommand(this.player),
            move: new MoveSongCommand(this.player),
            p: new SearchAndAddCommand(this.player),
            pause: new SimplePlayerActCommand(this.player, 'pause'),
            play: new PlaySongCommand(this.player),
            ping: new PingCommand(),
            q: new ListSongsCommand(this.player),
            queue: new ListSongsCommand(this.player),
            remove: new RemoveSongCommand(this.player),
            repeat: new ToggleRepeatModeCommand(this.config),
            rick: new ForcePlayVideoCommand(this.player, RICK_ROLL_ID),
            search: new SearchCommand(this.player, this.config),
            shuffle: new SimplePlayerActCommand(this.player, 'shuffle'),
            skip: new SimplePlayerActCommand(this.player, 'skip'),
            stop: new SimplePlayerActCommand(this.player, 'stop'),
            time: new TimeCommand(this.player),
            volume: new VolumeCommand(this.player),
        };

        const descriptions = Object
            .keys(commandMap)
            .map((key) => '`' + key + '`: ' + commandMap[key].getDescription())
            .join('\n');
        
        const helpCommand = {
            execute: (cmd: SuccessfulParsedMessage<Message>, msg: Message): void => { msg.channel.send("Commands: \n\n" + descriptions) }
        } as unknown as ICommand;

        commandMap.help = helpCommand;

        Object.keys(commandMap).forEach(key => {
            map.on(key, async (cmd: SuccessfulParsedMessage<Message>, msg: Message) => {
                const channel = msg.member.voice.channel;

                if (!channel || channel.type !== 'voice') {
                    msg.channel.send(createInfoEmbed(`User isn't in a voice channel!`));
                    return;
                }

                if (!this.player) {
                    msg.channel.send(createErrorEmbed(`Error: no player found.`));
                    return;
                }

                if (!this.player.connection) {
                    try {
                        await this.player.setConnection(msg.member.voice.channel);
                    } catch (error) {
                        msg.channel.send(createErrorEmbed(`Error: player ${msg.member.nickname} is not in a voice channel`));
                        return;
                    }
                }

                commandMap[key].execute(cmd, msg);
            })
        });

        return map;
    }

    parsedMessage(msg: SuccessfulParsedMessage<Message>) {
        const handlers = this.commands.get(msg.command);
        if (handlers) {
            // TODO: find a better way to do this.
            this.player.setChannel(msg.message.channel);
        }
    }

    // TODO: MOVE TO SEPARATE CLASS.
    createClient(): Client {
        const client = new Client();

        client.on('messageReactionAdd', async (reaction: MessageReaction, user: User) => {
            if (reaction.partial) {
                try {
                    await reaction.fetch();
                } catch (error) {
                    this.logger.debug(error);
                    return;
                }
            }
            if (reaction.message.author.id === this.client.user.id && user.id !== this.client.user.id) {
                if (reaction.message.embeds.length > 0) {
                    const embed = reaction.message.embeds[0];
                    if (embed) {
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
                    }
                    reaction.users.remove(user.id);
                }
            }
        })
        .on('ready', () => {
            this.logger.debug('Bot Online');
        })
        .on('disconnect', () => {
            this.logger.debug('Bot Disconnected');
        })
        .on('error', (error: Error) => {
            this.logger.error(error);
        })
        .on('message', (msg: Message) => {
            let parsed = parse(msg, this.config.command.symbol);

            if (!parsed.success) return;
            
            this.parsedMessage(parsed);

            let handlers = this.commands.get(parsed.command);

            if(handlers) {
                this.logger.debug(`Bot Command: ${msg.content}`);
                handlers.forEach(handle => {
                    handle(parsed as SuccessfulParsedMessage<Message>, msg);
                });
            }
        });

        return client;
    }

    connect(): Promise<string> {
        return this.client.login(this.config.discord.token);
    }

    listen(): void {
        return this.console.listen();
    }
}
