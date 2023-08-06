import { joinVoiceChannel, createAudioPlayer } from '@discordjs/voice';
import { Client, VoiceState } from 'discord.js';
import { AudioPlayer } from '@discordjs/voice';

export interface IAudioPlayerFactory {
    createSubscribedAudioPlayer(voice: VoiceState): AudioPlayer;
}

export class AudioPlayerFactory {
    constructor(private readonly loggedInClient: Client) { }
    
    createSubscribedAudioPlayer(voice: VoiceState): AudioPlayer {
        const connection = joinVoiceChannel({
            channelId: voice.channelId,
            guildId: voice.guild.id,
            adapterCreator: voice.guild.voiceAdapterCreator,
            group: this.loggedInClient.user.id,
            selfMute: false,
            selfDeaf: false
        });

        const audioPlayer = createAudioPlayer();

        connection.subscribe(audioPlayer);

        return audioPlayer;
    }
}
