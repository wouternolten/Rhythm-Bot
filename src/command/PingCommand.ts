import { SuccessfulParsedMessage } from 'discord-command-parser';
import { Message } from 'discord.js';
import { IChannelManager } from 'src/channel/ChannelManager';
import { ICommand } from './ICommand';

const random = (array) => array[Math.floor(Math.random() * array.length)];
const pingPhrases = [`Can't stop won't stop!`, `:ping_pong: Pong!`];

export class PingCommand implements ICommand {
    constructor(
        private readonly channelManager: IChannelManager
    ) { }

    execute(cmd: SuccessfulParsedMessage<Message>, msg: Message): void {
        let phrases = pingPhrases.slice();
        
        if (msg.guild) {
            phrases = phrases.concat(msg.guild.emojis.cache.map((x) => x.name));
        }

        this.channelManager.sendInfoMessage(random(phrases));
    }

    getDescription(): string {
        return 'check if the bot is still alive.'; 
    }
}
