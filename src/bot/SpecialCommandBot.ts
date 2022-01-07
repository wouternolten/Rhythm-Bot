import { MediaPlayer } from 'src/media';
import { projectDir, requireFile } from 'discord-bot-quickstart';
import { Client, VoiceConnection, VoiceState } from 'discord.js';
import * as fs from 'fs';

type SoundMap = {
    soundFiles: { [username: string]: string };
}

const TWO_SECONDS = 2000;

export class SpecialCommandBot {
    getSoundMap(): SoundMap | undefined {
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

    registerExtraCommands(client: Client, player: MediaPlayer): void {
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
                    const firstSong = player.queue.first;

                    if (firstSong) {
                        player.stop();
                        const time = player.dispatcher?.totalStreamTime || 0;
                        firstSong.begin = time;
                        await player.addMedia(firstSong, newVoiceState.member.lastMessage, true);
                        player.move(player.queue.length - 1, 1);
                        player.pause();
                    }

                    const stream = connection.play(`${process.cwd()}\\data\\sounds\\${soundMap[newVoiceState.member.user.username]}`);

                    if (firstSong) {
                        stream.on('close', () => {
                            player.play()
                        });
                    }
                })
            }, TWO_SECONDS);
        })
    }
}