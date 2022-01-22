import * as fs from 'fs';
import {
    ForcePlayVideoCommand,
    ICommand,
} from '../command';
import { MediaPlayer } from '../media';
import { BotStatus } from './bot-status';
import { IRhythmBotConfig } from './bot-config';
import { createErrorEmbed, createInfoEmbed } from '../helpers';
import {
    IBot,
    CommandMap,
    Client,
    ParsedArgs,
    Interface,
    SuccessfulParsedMessage,
    Message,
    readFile,
    VoiceConnection,
    VoiceState,
    projectDir,
    requireFile,
} from 'discord-bot-quickstart';

const helptext = readFile('../helptext.txt');
const AIR_HORN_ID = 'UaUa_0qPPgc';
const TWO_SECONDS = 2000;

type SoundMap = {
    soundFiles: { [username: string]: string };
}

export class WelcomeTuneBot extends IBot<IRhythmBotConfig> {
    helptext: string;
    player: MediaPlayer;
    status: BotStatus;

    constructor(
        config: IRhythmBotConfig
    ) {
        super(config, <IRhythmBotConfig>{
            discord: {
                log: true,
            },
            command: {
                symbol: '!',
            },
            directory: {
                plugins: './plugins',
                logs: '../bot.log',
            },
        });

        this.helptext = helptext;
    }

    onRegisterDiscordCommands(map: CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>): void {
        const commandMap: { [key: string]: ICommand } = {
            horn: new ForcePlayVideoCommand(this.player, AIR_HORN_ID),
        };

        const descriptions = Object
            .keys(commandMap)
            .map((key) => '`' + key + '`: ' + commandMap[key].getDescription())
            .join('\n');
        
        const helpCommand = {
            execute: (cmd: SuccessfulParsedMessage<Message>, msg: Message): void => { msg.channel.send("Commands: \n\n" + descriptions) }
        } as unknown as ICommand;

        commandMap.help = helpCommand;

        Object.keys(commandMap).forEach(key => {
            map.on(key, async (cmd: SuccessfulParsedMessage<Message>, msg: Message) => {
                const channel = msg.member.voice.channel;

                if (!channel || channel.type !== 'voice') {
                    msg.channel.send(createInfoEmbed(`User isn't in a voice channel!`));
                    return;
                }

                if (!this.player) {
                    msg.channel.send(createErrorEmbed(`Error: no player found.`));
                    return;
                }

                if (!this.player.connection) {
                    try {
                        await this.player.setConnection(msg.member.voice.channel);
                    } catch (error) {
                        msg.channel.send(createErrorEmbed(`Error: player ${msg.member.nickname} is not in a voice channel`));
                        return;
                    }
                }

                commandMap[key].execute(cmd, msg);
            })
        });
    }

    parsedMessage(msg: SuccessfulParsedMessage<Message>) {
        const handlers = this.commands.get(msg.command);
        if (handlers) {
            this.player.setChannel(msg.message.channel);
        }
    }

    onClientCreated(client: Client): void {
        this.status = new BotStatus(client);
        this.player = new MediaPlayer(this.config, this.status, this.logger);

        client.on('voiceStateUpdate', (oldVoiceState: VoiceState, newVoiceState: VoiceState) => {
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
        });
    }

    onReady(client: Client): void {}
    onRegisterConsoleCommands(map: CommandMap<(args: ParsedArgs, rl: Interface) => void>): void { }
    
    
    private getSoundMap(): SoundMap | undefined {
        const configPath = projectDir('../bot-config.json');
        
        if (!fs.existsSync(configPath)) {
            return;
        }
        delete require.cache[projectDir('../bot-config.json')];
        const soundMap = requireFile(configPath).soundFiles;

        if (!soundMap) {
            return;
        }

        return soundMap as SoundMap;
    }
}
