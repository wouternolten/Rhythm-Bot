import { PlaySoundFileCommand } from './../command/PlaySoundFileCommand';
import * as fs from 'fs';
import { ICommand } from '../command';
import { IRhythmBotConfig } from './bot-config';
import { createInfoEmbed } from '../helpers';
import { CommandMap } from '../helpers/CommandMap';
import { PlayAOEFileCommand } from '../command/PlayAOEFileCommand';
import { parse, SuccessfulParsedMessage } from 'discord-command-parser';
import { Message, Client, VoiceState, VoiceConnection } from 'discord.js';
import { projectDirectory } from '../helpers/ProjectDirectory';
import { Logger } from 'winston';

const TWO_SECONDS = 2000;

type SoundMap = {
    soundFiles: { [username: string]: string };
}

export class WelcomeTuneBot {
    constructor(
        private readonly config: IRhythmBotConfig,
        private readonly commands: CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>,
        private readonly client: Client,
        private readonly logger: Logger
    ) {

    }

    handleMessage(msg: Message): void {
        if (!this.config.command?.symbol) {
            this.logger.error('Symbol handle message not set.');

            return;
        }

        if (msg.author.id === this.client.user.id) {
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
        handlers.forEach(handle => {
            handle(parsed as SuccessfulParsedMessage<Message>, msg);
        });
    }
    
    handleVoiceStateUpdate(oldVoiceState: VoiceState, newVoiceState: VoiceState) {
        if (oldVoiceState.channelID) {
            return;
        }

        const soundMap = this.getSoundMap();

        if (!soundMap || !soundMap[newVoiceState.member.user.username]) {
            return;
        }

        setTimeout(() => {
            newVoiceState.channel.join().then(async (connection: VoiceConnection) => {
                connection.play(`${process.cwd()}\\data\\sounds\\${soundMap[newVoiceState.member.user.username]}`);
            })
        }, TWO_SECONDS);
    }
    
    private getSoundMap(): SoundMap | undefined {
        const configPath = projectDirectory('../bot-config.json');
        
        if (!fs.existsSync(configPath)) {
            return;
        }
        delete require.cache[projectDirectory('../bot-config.json')];
        const soundMap = require(projectDirectory(configPath)).soundFiles;

        if (!soundMap) {
            return;
        }

        return soundMap as SoundMap;
    }
}
