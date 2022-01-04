import {
    ForcePlayVideoCommand,
    HelpCommand,
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
import { VoiceConnection, VoiceState } from 'discord.js';
import { MediaPlayer } from '../media';
import { BotStatus } from './bot-status';
import { IRhythmBotConfig } from './bot-config';
import { joinUserChannel, createInfoEmbed } from '../helpers';
import {
    IBot,
    CommandMap,
    Client,
    ParsedArgs,
    Interface,
    SuccessfulParsedMessage,
    Message,
    readFile,
    MessageReaction,
    User,
} from 'discord-bot-quickstart';

const helptext = readFile('../helptext.txt');
const RICK_ROLL_ID = 'dQw4w9WgXcQ';
const AIR_HORN_ID = 'UaUa_0qPPgc';

export class RhythmBot extends IBot<IRhythmBotConfig> {
    helptext: string;
    player: MediaPlayer;
    status: BotStatus;

    constructor(config: IRhythmBotConfig) {
        super(config, <IRhythmBotConfig>{
            auto: {
                deafen: false,
                pause: false,
                play: true,
                reconnect: true,
            },
            discord: {
                log: true,
            },
            command: {
                symbol: '!',
            },
            directory: {
                plugins: './plugins',
                logs: '../bot.log',
            },
            queue: {
                announce: true,
                repeat: false,
            },
            stream: {
                seek: 0,
                volume: 1,
                bitrate: 'auto',
                forwardErrorCorrection: false,
            },
            emojis: {
                addSong: '👍',
                stopSong: '⏹️',
                playSong: '▶️',
                pauseSong: '⏸️',
                skipSong: '⏭️',
            },
        });
        this.helptext = helptext;
    }

    onRegisterDiscordCommands(map: CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>): void {
        // TODO:
        // - Bug found: unfortunately, due to classes not being available until onClientCreated() has been called, so we need to instantiate that
        // - Refactor all commands
        // - Asynchronously load commands with memoization. 

                if (cmd.body != null && cmd.body !== '') {
                    if (YOUTUBE_REGEX.test(cmd.body)) {
                        await this.player.addMedia({
                            type: 'youtube',
                            url: cmd.body,
                            requestor: msg.author.username
                        });

                        return;
        }

        map
            .on('clear', (cmd: SuccessfulParsedMessage<Message>, msg: Message) => new SimplePlayerActCommand(this.player, 'clear').execute(cmd, msg))
            .on('help', (cmd: SuccessfulParsedMessage<Message>, msg: Message) => new HelpCommand(this.helptext).execute(cmd, msg))
            .on('horn', (cmd: SuccessfulParsedMessage<Message>, msg: Message) => new ForcePlayVideoCommand(this.player, AIR_HORN_ID).execute(cmd, msg))
            .on('join', (cmd: SuccessfulParsedMessage<Message>, msg: Message) => new JoinUserChannelCommand(this.player, this.config).execute(cmd, msg))
            .on('leave', (cmd: SuccessfulParsedMessage<Message>, msg: Message) => new LeaveChannelCommand(this.player, this.client).execute(cmd, msg))
            .on('list', (cmd: SuccessfulParsedMessage<Message>, msg: Message) => new ListSongsCommand(this.player).execute(cmd, msg))
            .on('move', (cmd: SuccessfulParsedMessage<Message>, msg: Message) => new MoveSongCommand(this.player).execute(cmd, msg))
            .on('p', (cmd: SuccessfulParsedMessage<Message>, msg: Message) => new SearchAndAddCommand(this.player).execute(cmd, msg))
            .on('pause', (cmd: SuccessfulParsedMessage<Message>, msg: Message) => new SimplePlayerActCommand(this.player, 'pause').execute(cmd, msg))
            .on('play', (cmd: SuccessfulParsedMessage<Message>, msg: Message) => new PlaySongCommand(this.player).execute(cmd, msg))
            .on('ping', (cmd: SuccessfulParsedMessage<Message>, msg: Message) => new PingCommand().execute(cmd, msg))
            .on('remove', (cmd: SuccessfulParsedMessage<Message>, msg: Message) => new RemoveSongCommand(this.player).execute(cmd, msg))
            .on('repeat', (cmd: SuccessfulParsedMessage<Message>, msg: Message) => new ToggleRepeatModeCommand(this.config).execute(cmd, msg))
            .on('rick', (cmd: SuccessfulParsedMessage<Message>, msg: Message) => new ForcePlayVideoCommand(this.player, RICK_ROLL_ID).execute(cmd, msg))
            .on('search', (cmd: SuccessfulParsedMessage<Message>, msg: Message) => new SearchCommand(this.player, this.config).execute(cmd, msg))
            .on('shuffle', (cmd: SuccessfulParsedMessage<Message>, msg: Message) => new SimplePlayerActCommand(this.player, 'shuffle').execute(cmd, msg))
            .on('skip', (cmd: SuccessfulParsedMessage<Message>, msg: Message) => new SimplePlayerActCommand(this.player, 'skip').execute(cmd, msg))
            .on('stop', (cmd: SuccessfulParsedMessage<Message>, msg: Message) => new SimplePlayerActCommand(this.player, 'stop').execute(cmd, msg))
            .on('time', (cmd: SuccessfulParsedMessage<Message>, msg: Message) => new TimeCommand(this.player).execute(cmd, msg))
            .on('volume', (cmd: SuccessfulParsedMessage<Message>, msg: Message) => new VolumeCommand(this.player).execute(cmd, msg));
    }

    parsedMessage(msg: SuccessfulParsedMessage<Message>) {
        const handlers = this.commands.get(msg.command);
        if (handlers) {
            this.player.channel = msg.message.channel;
        }
    }

    onClientCreated(client: Client): void {
        this.status = new BotStatus(client);
        this.player = new MediaPlayer(this.config, this.status, this.logger);

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
                            }, reaction.message);
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
        });
    }

    onReady(client: Client): void {
        this.player.determineStatus();
        console.log(`Guilds: ${this.client.guilds.cache.keyArray().length}`);
        this.client.guilds.cache.forEach((guild) => {
            console.log(`\nGuild Name: ${guild.name}`);

            const channels = guild.channels.cache
                .filter((x) => x.isText() && x.permissionsFor(this.client.user).has('MANAGE_MESSAGES'))
                .map((x) => x.name);

            if (channels && channels.length > 0) {
                console.log(`Can manage message in these channels \n${channels.join('\n')}`);
            } else {
                console.log('Unable to manage messages on this guild');
            }
        });
    }

    onRegisterConsoleCommands(map: CommandMap<(args: ParsedArgs, rl: Interface) => void>): void {}

    joinChannelAndPlay(msg: Message) {
        new Promise<void>((done) => {
            if (!this.player.connection) {
                joinUserChannel(msg).then((conn) => {
                    this.player.connection = conn;
                    msg.channel.send(createInfoEmbed(`Joined Channel: ${conn.channel.name}`));
                    done();
                });
            } else {
                done();
            }
        }).then(() => {
            this.player.play();
        });
    }
}
