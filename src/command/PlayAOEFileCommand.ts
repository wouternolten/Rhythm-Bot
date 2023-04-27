import { IMediaFilePlayer } from './../media/MediaFilePlayer';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import fs from 'fs';
import { ICommand } from './ICommand';
import { isInteger, leftPad } from '../helpers/helpers';
import { Logger } from 'winston';

const AOE_SOUND_DIRECTORY = `${process.cwd()}\\data\\sounds\\age_taunts`;

export class PlayAOEFileCommand implements ICommand {
    public constructor(
        private mediaPlayer: IMediaFilePlayer,
        private logger: Logger
    ) { }
    
    async execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): Promise<void> {
        let { body } = cmd;

        if (!body || !isInteger(body)) {
            this.logger.error('No body given');
        }

        body = leftPad(Number(body), 2);

        let fileNames = undefined;

        try {
            fileNames = await fs.promises.readdir(AOE_SOUND_DIRECTORY);
        } catch (error) {
            this.logger.error({ errorWhileFindingAgeTaunts: error });
        }

        const fileName = fileNames.find((fileName: string) => fileName.startsWith(body));

        if (!fileName) {
            this.logger.error('File not found: ' + body);
            return;
        }

        return this.mediaPlayer.playFile(`${AOE_SOUND_DIRECTORY}\\${fileName}`, msg.member.voice);
    }

    getDescription(): string {
        return 'Plays an command from Age of Empires with it\'s corresponding number.';
    }
}
