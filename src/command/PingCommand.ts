import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { ICommand } from './ICommand';

const random = (array) => array[Math.floor(Math.random() * array.length)];
const pingPhrases = [`Can't stop won't stop!`, `:ping_pong: Pong Bitch!`];

export class PingCommand implements ICommand {
    execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): void {
        let phrases = pingPhrases.slice();
        
        if (msg.guild) {
            phrases = phrases.concat(msg.guild.emojis.cache.array().map((x) => x.name));
        }

        msg.channel.send(random(phrases));
    }

    getDescription(): string {
        return 'check if the bot is still alive.'; 
    }
}