import { IMediaFilePlayer } from './../media/MediaFilePlayer';
import { IMediaItemHelper } from './../helpers/IMediaItemHelper';
import { SpotifyAPIHelper } from './../helpers/SpotifyAPIHelper';
import { CommandMap } from "../helpers/CommandMap";
import { Logger } from 'winston';
import { SuccessfulParsedMessage } from "discord-command-parser";
import { Message } from "discord.js";
import { IRhythmBotConfig } from "../bot/IRhythmBotConfig";
import { MediaPlayer } from "../media/MediaPlayer";
import { PlayAOEFileCommand } from "./PlayAOEFileCommand";
import { PlaySoundFileCommand } from "./PlaySoundFileCommand";
import { ICommandMapFactory } from './ICommandMapFactory';
import { AutoPlayNextVideoCommand } from './AutoPlayNextVideoCommand';
import { ICommand } from './ICommand';
import { ListSongsCommand } from './ListSongsCommand';
import { MoveSongCommand } from './MoveSongCommand';
import { PingCommand } from './PingCommand';
import { RemoveSongCommand } from './RemoveSongCommand';
import { SearchAndAddCommand } from './SearchAndAddCommand';
import { SearchCommand } from './SearchCommand';
import { SimplePlayerActCommand } from './SimplePlayerActCommand';
import { IQueueManager } from 'src/queue/QueueManager';

export class CommandMapFactory implements ICommandMapFactory {
    constructor(
        private readonly player: MediaPlayer,
        private readonly mediaFilePlayer: IMediaFilePlayer,
        private readonly config: IRhythmBotConfig,
        private readonly spotifyAPIHelper: SpotifyAPIHelper,
        private readonly mediaItemHelper: IMediaItemHelper,
        private readonly queueManager: IQueueManager,
        private readonly logger: Logger
    ) {

    }

    createMusicBotCommandsMap(): CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void> {
        const map = new CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>();

        let commandMap = this.buildMusicBotCommands();
        commandMap = this.addHelpCommand(commandMap);

        Object.keys(commandMap).forEach(key => {
            map.on(key, async (cmd: SuccessfulParsedMessage<Message>, msg: Message) => {
                try {
                    commandMap[key].execute(cmd, msg);
                } catch (error) {
                    this.logger.debug(error);
                    this.logger.debug(`Error when executing command: ${error.message}`);
                }
            })
        });

        return map;
    }

    // TODO: DI INJECTION!?
    createWelcomeBotCommandsMap(): CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void> {
        const map = new CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>();

        let commandMap = this.buildWelcomeBotCommands(this.mediaFilePlayer);
        commandMap = this.addHelpCommand(commandMap);

        Object.keys(commandMap).forEach(key => {
            map.on(key, async (cmd: SuccessfulParsedMessage<Message>, msg: Message) => {
                try {
                    commandMap[key].execute(cmd, msg);
                } catch (error) {
                    this.logger.debug(`Error when executing command: ${error.message}`);
                }
            })
        });

        return map;
    }

    private buildWelcomeBotCommands(mediaPlayer: IMediaFilePlayer): { [key: string]: ICommand } {
        return {
            horn: new PlaySoundFileCommand('airhorn_four.wav', mediaPlayer),
            badumtss: new PlaySoundFileCommand('badum_tss.wav', mediaPlayer),
            aoe: new PlayAOEFileCommand(mediaPlayer, this.logger)
        };
    }

    private buildMusicBotCommands(): { [key: string]: ICommand } {
        return {
            autoplay: new AutoPlayNextVideoCommand(this.player),
            clear: new SimplePlayerActCommand(this.player, 'clear'),
            list: new ListSongsCommand(this.player),
            move: new MoveSongCommand(this.player),
            p: new SearchAndAddCommand(this.player, this.spotifyAPIHelper, this.mediaItemHelper, this.queueManager, this.logger),
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
