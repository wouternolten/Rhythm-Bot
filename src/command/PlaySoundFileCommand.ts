import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message, VoiceConnection } from 'discord.js';
import { ICommand } from './ICommand';

export class PlaySoundFileCommand implements ICommand {
    constructor(private readonly fileName: string) { }
    
    execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): void {
        msg.member.voice.channel.join().then((connection: VoiceConnection) => {
            connection.play(`${process.cwd()}\\data\\sounds\\${this.fileName}`);
        });
    }

    getDescription(): string {
        return 'plays a sound file.';
    }
}