import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message, VoiceConnection } from 'discord.js';
import fs from 'fs';
import { ICommand } from '.';
import { isInteger, leftPad } from '../helpers';

const AOE_SOUND_DIRECTORY = `${process.cwd()}\\data\\sounds\\age_taunts`;

export class PlayAOEFileCommand implements ICommand {
    async execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): Promise<void> {
        let { body } = cmd;

        if (!body || !isInteger(body)) {
            console.error('No body given');
        }

        body = leftPad(Number(body), 2);

        let fileNames = undefined;

        try {
            fileNames = await fs.promises.readdir(AOE_SOUND_DIRECTORY);
        } catch (error) {
            console.error({ errorWhileFindingAgeTaunts: error });
        }

        const fileName = fileNames.find((fileName: string) => fileName.startsWith(body));

        if (!fileName) {
            console.error('File not found: ' + body);
            return;
        }

        msg.member.voice.channel.join().then((connection: VoiceConnection) => {
            connection.play(`${AOE_SOUND_DIRECTORY}\\${fileName}`);
        });
    }

    getDescription(): string {
        return 'Plays an command from Age of Empires with it\'s corresponding number.';
    }
}