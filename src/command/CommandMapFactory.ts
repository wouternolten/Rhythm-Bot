import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { IChannelManager } from 'src/channel/ChannelManager';
import { IQueueManager } from 'src/queue/QueueManager';
import { Logger } from 'winston';
import { IRhythmBotConfig } from '../bot/IRhythmBotConfig';
import { CommandMap } from '../helpers/CommandMap';
import { MediaPlayer } from '../media/MediaPlayer';
import { IMediaItemHelper } from './../helpers/IMediaItemHelper';
import { SpotifyAPIHelper } from './../helpers/SpotifyAPIHelper';
import { IMediaFilePlayer } from './../media/MediaFilePlayer';
import { AutoPlayNextVideoCommand } from './AutoPlayNextVideoCommand';
import { ICommand } from './ICommand';
import { ICommandMapFactory } from './ICommandMapFactory';
import { ListSongsCommand } from './ListSongsCommand';
import { MoveSongCommand } from './MoveSongCommand';
import { PingCommand } from './PingCommand';
import { PlayAOEFileCommand } from './PlayAOEFileCommand';
import { PlaySoundFileCommand } from './PlaySoundFileCommand';
import { RemoveSongCommand } from './RemoveSongCommand';
import { SearchAndAddCommand } from './SearchAndAddCommand';
import { SearchCommand } from './SearchCommand';
import { SimplePlayerActCommand } from './SimplePlayerActCommand';

export class CommandMapFactory implements ICommandMapFactory {
    constructor(
        private readonly player: MediaPlayer,
        private readonly mediaFilePlayer: IMediaFilePlayer,
        private readonly config: IRhythmBotConfig,
        private readonly spotifyAPIHelper: SpotifyAPIHelper,
        private readonly mediaItemHelper: IMediaItemHelper,
        private readonly queueManager: IQueueManager,
        private readonly channelManager: IChannelManager,
        private readonly logger: Logger
    ) {}

    createMusicBotCommandsMap(): CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void> {
        const map = new CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>();

        let commandMap = this.buildMusicBotCommands();
        commandMap = this.addHelpCommand(commandMap);

        Object.keys(commandMap).forEach((key) => {
            map.on(key, async (cmd: SuccessfulParsedMessage<Message>, msg: Message) => {
                try {
                    commandMap[key].execute(cmd, msg);
                } catch (error) {
                    this.logger.debug(error);
                    this.logger.debug(`Error when executing command: ${error.message}`);
                }
            });
        });

        return map;
    }

    // TODO: DI INJECTION!?
    createWelcomeBotCommandsMap(): CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void> {
        const map = new CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>();

        let commandMap = this.buildWelcomeBotCommands(this.mediaFilePlayer);
        commandMap = this.addHelpCommand(commandMap);

        Object.keys(commandMap).forEach((key) => {
            map.on(key, async (cmd: SuccessfulParsedMessage<Message>, msg: Message) => {
                try {
                    commandMap[key].execute(cmd, msg);
                } catch (error) {
                    this.logger.debug(`Error when executing command: ${error.message}`);
                }
            });
        });

        return map;
    }

    private buildWelcomeBotCommands(mediaPlayer: IMediaFilePlayer): { [key: string]: ICommand } {
        return {
            horn: new PlaySoundFileCommand('airhorn_four.wav', mediaPlayer),
            badumtss: new PlaySoundFileCommand('badum_tss.wav', mediaPlayer),
            aoe: new PlayAOEFileCommand(mediaPlayer, this.logger),
        };
    }

    private buildMusicBotCommands(): { [key: string]: ICommand } {
        return {
            autoplay: new AutoPlayNextVideoCommand(this.queueManager, this.channelManager),
            clear: new SimplePlayerActCommand(this.player, 'clear'),
            list: new ListSongsCommand(this.queueManager, this.channelManager),
            move: new MoveSongCommand(this.queueManager, this.channelManager),
            p: new SearchAndAddCommand(
                this.player,
                this.spotifyAPIHelper,
                this.mediaItemHelper,
                this.queueManager,
                this.channelManager,
                this.logger
            ),
            pause: new SimplePlayerActCommand(this.player, 'pause'),
            ping: new PingCommand(this.channelManager),
            q: new ListSongsCommand(this.queueManager, this.channelManager),
            queue: new ListSongsCommand(this.queueManager, this.channelManager),
            remove: new RemoveSongCommand(this.queueManager, this.channelManager),
            search: new SearchCommand(
                this.player,
                this.mediaItemHelper,
                this.queueManager,
                this.channelManager,
                this.config
            ),
            skip: new SimplePlayerActCommand(this.player, 'skip'),
            stop: new SimplePlayerActCommand(this.player, 'stop'),
        };
    }

    private addHelpCommand(commands: { [key: string]: ICommand }): { [key: string]: ICommand } {
        const descriptions = Object.keys(commands)
            .map((key) => '`' + key + '`: ' + commands[key].getDescription())
            .join('\n');

        const helpCommand = {
            execute: (): void => {
                this.channelManager.sendInfoMessage('Commands: \n\n' + descriptions);
            },
        } as unknown as ICommand;

        return {
            ...commands,
            help: helpCommand,
        };
    }
}
