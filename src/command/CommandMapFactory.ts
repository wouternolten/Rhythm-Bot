import { IMediaItemHelper } from './../helpers/IMediaItemHelper';
import { SpotifyAPIHelper } from './../helpers/SpotifyAPIHelper';
import { CommandMap } from "../helpers/CommandMap";
import { Logger } from 'winston';
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
    ListSongsCommand,
    MoveSongCommand,
    SearchAndAddCommand,
    PingCommand,
    RemoveSongCommand,
    SearchCommand
} from ".";
import { PlayAOEFileCommand } from "./PlayAOEFileCommand";
import { PlaySoundFileCommand } from "./PlaySoundFileCommand";

export class CommandMapFactory implements ICommandMapFactory {
    constructor(
        private readonly player: MediaPlayer,
        private readonly config: IRhythmBotConfig,
        private readonly spotifyAPIHelper: SpotifyAPIHelper,
        private readonly mediaItemHelper: IMediaItemHelper,
        private readonly logger: Logger
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

                if (!this.player.isConnected()) {
                    try {
                        await this.player.connectToMessageChannel(msg);
                    } catch (error) {
                        msg.channel.send(createErrorEmbed(`Error: player ${msg.member.nickname} is not in a voice channel`));
                        return;
                    }
                }

                try {
                    commandMap[key].execute(cmd, msg);
                } catch (error) {
                    this.logger.debug(`Error when executing command: ${error.message}`);
                }
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

                try {
                    commandMap[key].execute(cmd, msg);
                } catch (error) {
                    this.logger.debug(`Error when executing command: ${error.message}`);
                }
            })
        });

        return map;
    }

    private buildWelcomeBotCommands(): { [key: string]: ICommand } {
        return {
            horn: new PlaySoundFileCommand('airhorn_four.wav'),
            badumtss: new PlaySoundFileCommand('badum_tss.wav'),
            aoe: new PlayAOEFileCommand()
        };
    }

    private buildMusicBotCommands(): { [key: string]: ICommand } {
        return {
            autoplay: new AutoPlayNextVideoCommand(this.player),
            clear: new SimplePlayerActCommand(this.player, 'clear'),
            list: new ListSongsCommand(this.player),
            move: new MoveSongCommand(this.player),
            p: new SearchAndAddCommand(this.player, this.spotifyAPIHelper, this.mediaItemHelper, this.logger),
            pause: new SimplePlayerActCommand(this.player, 'pause'),
            ping: new PingCommand(),
            q: new ListSongsCommand(this.player),
            queue: new ListSongsCommand(this.player),
            remove: new RemoveSongCommand(this.player),
            search: new SearchCommand(this.player, this.mediaItemHelper, this.config),
            skip: new SimplePlayerActCommand(this.player, 'skip'),
            stop: new SimplePlayerActCommand(this.player, 'stop'),
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
