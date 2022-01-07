import {
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
import { VoiceConnection, VoiceState } from 'discord.js';
import { MediaPlayer } from '../media';
import { BotStatus } from './bot-status';
import { IRhythmBotConfig } from './bot-config';
import { joinUserChannel } from '../helpers';
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

    constructor(
        config: IRhythmBotConfig,
        private readonly specialCommandBot: SpecialCommandBot
    ) {
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
        this.specialCommandBot.registerExtraCommands(this.client, this.player);
    }

    onRegisterDiscordCommands(map: CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>): void {
        const commandMap: {[key: string]: ICommand} = {
            clear: new SimplePlayerActCommand(this.player, 'clear'),
            horn: new ForcePlayVideoCommand(this.player, AIR_HORN_ID),
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
            map.on(key, (cmd: SuccessfulParsedMessage<Message>, msg: Message) => {
                const channel = msg.member.voice.channel;

                if (!channel || channel.type !== 'voice') {
                    msg.channel.send(createInfoEmbed(`User isn't in a voice channel!`));
                    return;
                }

                commandMap[key].execute(cmd, msg);
            })
        });
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
