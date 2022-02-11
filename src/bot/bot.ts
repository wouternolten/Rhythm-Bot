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


/** 
 * TODO: Create player on first command.
 * Then directly insert player into channel.
*/
export class RhythmBot extends IBot<IRhythmBotConfig> {
    helptext: string;
    player: MediaPlayer;
    status: BotStatus;

    constructor(
        config: IRhythmBotConfig
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
    }

    onRegisterDiscordCommands(map: CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>): void {
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
    }

    parsedMessage(msg: SuccessfulParsedMessage<Message>) {
        const handlers = this.commands.get(msg.command);
        if (handlers) {
            // TODO: find a better way to do this.
            this.player.setChannel(msg.message.channel);
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
        });
    }

    onReady(client: Client): void {}
    onRegisterConsoleCommands(map: CommandMap<(args: ParsedArgs, rl: Interface) => void>): void {}
}
