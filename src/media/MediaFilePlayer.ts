import { AudioPlayer, createAudioResource } from '@discordjs/voice';
import { VoiceState } from 'discord.js';
import { IAudioPlayerFactory } from '../helpers/AudioPlayerFactory';

export interface IMediaFilePlayer {
    playFile(fileName: string, channel: VoiceState): void;
}

// TODO: TESTS
export class MediaFilePlayer implements IMediaFilePlayer {
    private audioPlayer: AudioPlayer;

    public constructor(private readonly audioPlayerFactory: IAudioPlayerFactory) {}

    public playFile(fileName: string, channel: VoiceState): void {
        if (!this.audioPlayer) {
            this.audioPlayer = this.audioPlayerFactory.getAudioPlayer();
        }

        this.audioPlayer.play(createAudioResource(fileName));
    }
}
