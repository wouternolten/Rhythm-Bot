import { PlaySoundFileCommand } from './../command/PlaySoundFileCommand';
import * as fs from 'fs';
import { ICommand } from '../command';
import { IRhythmBotConfig } from './bot-config';
import { createInfoEmbed } from '../helpers';
import {
    IBot,
    CommandMap,
    Client,
    ParsedArgs,
    Interface,
    SuccessfulParsedMessage,
    Message,
    VoiceConnection,
    VoiceState,
    projectDir,
    requireFile,
} from 'discord-bot-quickstart';

const TWO_SECONDS = 2000;

type SoundMap = {
    soundFiles: { [username: string]: string };
}

export class WelcomeTuneBot extends IBot<IRhythmBotConfig> {
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
    }

    onRegisterDiscordCommands(map: CommandMap<(cmd: SuccessfulParsedMessage<Message>, msg: Message) => void>): void {
        const commandMap: { [key: string]: ICommand } = {
            horn: new PlaySoundFileCommand('airhorn_four.wav'),
            badumtss: new PlaySoundFileCommand('badum_tss.wav')
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

                commandMap[key].execute(cmd, msg);
            })
        });
    }

    parsedMessage(msg: SuccessfulParsedMessage<Message>) {}

    onClientCreated(client: Client): void {
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
