import { parse, SuccessfulParsedMessage } from 'discord-command-parser';
import { Client, Message, VoiceState } from 'discord.js';
import * as fs from 'fs';
import { Logger } from 'winston';
import { CommandMap } from '../helpers/CommandMap';
import { projectDirectory } from '../helpers/ProjectDirectory';
import { ICommandMapFactory } from './../command/ICommandMapFactory';
import { IMediaFilePlayer } from './../media/MediaFilePlayer';
import { IRhythmBotConfig } from './IRhythmBotConfig';

const TWO_SECONDS = 2000;

type SoundMap = {
    soundFiles: { [username: string]: string };
};

export class WelcomeTuneBot {
    private readonly commands: CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>;

    constructor(
        private readonly config: IRhythmBotConfig,
        private readonly mediaPlayer: IMediaFilePlayer,
        commandsFactory: ICommandMapFactory,
        private readonly client: Client,
        private readonly logger: Logger
    ) {
        this.commands = commandsFactory.createWelcomeBotCommandsMap();
    }

    handleMessage(msg: Message): void {
        try {
            if (!this.config.command?.symbol) {
                this.logger.error('Symbol handle message not set.');

                return;
            }

            if (msg.author.id === this.client.user.id) {
                return;
            }

            const parsed = parse(msg, this.config.command.symbol);

            if (!parsed.success) {
                return;
            }

            const handlers = this.commands.get(parsed.command);

            if (!handlers) {
                return;
            }

            this.logger.debug(`Welcome tune bot command: ${msg.content}`);
            handlers.forEach((handle) => {
                handle(parsed as SuccessfulParsedMessage<Message>, msg);
            });
        } catch (error) {
            this.logger.error({ handleMessageCatchError: error });
        }
    }

    handleVoiceStateUpdate(oldVoiceState: VoiceState, newVoiceState: VoiceState) {
        if (oldVoiceState.channelId) {
            return;
        }

        const soundMap = this.getSoundMap();

        if (!soundMap || !soundMap[newVoiceState.member.user.username]) {
            return;
        }

        setTimeout(() => {
            this.mediaPlayer.playFile(
                `${process.cwd()}\\data\\sounds\\${soundMap[newVoiceState.member.user.username]}`,
                newVoiceState
            );
        }, TWO_SECONDS);
    }

    private getSoundMap(): SoundMap | undefined {
        const configPath = projectDirectory('../bot-config.json');

        if (!fs.existsSync(configPath)) {
            return;
        }
        delete require.cache[projectDirectory('../bot-config.json')];

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const soundMap = require(projectDirectory(configPath)).soundFiles;

        if (!soundMap) {
            return;
        }

        return soundMap as SoundMap;
    }
}
