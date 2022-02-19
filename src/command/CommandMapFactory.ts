import { CommandMap } from "discord-bot-quickstart";
import { SuccessfulParsedMessage } from "discord-command-parser";
import { Message } from "discord.js";
import { IRhythmBotConfig } from "../bot";
import { createInfoEmbed, createErrorEmbed } from "../helpers";
import { MediaPlayer } from "../media";
import {
    ICommandMapFactory,
    ICommand,
    AutoPlayNextVideoCommand,
    SimplePlayerActCommand,
    JoinUserChannelCommand,
    ListSongsCommand,
    MoveSongCommand,
    SearchAndAddCommand,
    PlaySongCommand,
    PingCommand,
    RemoveSongCommand,
    ToggleRepeatModeCommand,
    ForcePlayVideoCommand,
    SearchCommand,
    TimeCommand,
    VolumeCommand
} from ".";
import { PlaySoundFileCommand } from "./PlaySoundFileCommand";

const RICK_ROLL_ID = 'dQw4w9WgXcQ';

export class CommandMapFactory implements ICommandMapFactory {
    constructor(
        private readonly player: MediaPlayer,
        private readonly config: IRhythmBotConfig
    ) {

    }

    createMusicBotCommandsMap(): CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void> {
        const map = new CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>();

        let commandMap = this.buildMusicBotCommands();
        commandMap = this.addHelpCommand(commandMap);

        Object.keys(commandMap).forEach(key => {
            map.on(key, async (cmd: SuccessfulParsedMessage<Message>, msg: Message) => {
                const channel = msg.member.voice.channel;

                if (!channel || channel.type !== 'voice') {
                    msg.channel.send(createInfoEmbed(`User isn't in a voice channel!`));
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

    createWelcomeBotCommandsMap(): CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void> {
        const map = new CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>();

        let commandMap = this.buildWelcomeBotCommands();
        commandMap = this.addHelpCommand(commandMap);

        Object.keys(commandMap).forEach(key => {
            map.on(key, async (cmd: SuccessfulParsedMessage<Message>, msg: Message) => {
                const channel = msg.member.voice.channel;

                if (!channel || channel.type !== 'voice') {
                    msg.channel.send(createInfoEmbed(`User isn't in a voice channel!`));
                    return;
                }

                commandMap[key].execute(cmd, msg);
            })
        });

        return map;
    }

    private buildWelcomeBotCommands(): { [key: string]: ICommand } {
        return {
            horn: new PlaySoundFileCommand('airhorn_four.wav'),
            badumtss: new PlaySoundFileCommand('badum_tss.wav'),
        };
    }

    private buildMusicBotCommands(): { [key: string]: ICommand } {
        return {
            autoplay: new AutoPlayNextVideoCommand(this.player),
            clear: new SimplePlayerActCommand(this.player, 'clear'),
            join: new JoinUserChannelCommand(this.player, this.config),
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
    }

    private addHelpCommand(commands: { [key: string]: ICommand }): { [key: string]: ICommand} {        
        const descriptions = Object
            .keys(commands)
            .map((key) => '`' + key + '`: ' + commands[key].getDescription())
            .join('\n');
        
        const helpCommand = {
            execute: (cmd: SuccessfulParsedMessage<Message>, msg: Message): void => { msg.channel.send("Commands: \n\n" + descriptions) }
        } as unknown as ICommand;

        return {
            ...commands,
            help: helpCommand
        }
    }
}