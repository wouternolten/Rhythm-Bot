import { AudioPlayer, createAudioResource } from '@discordjs/voice';
import { VoiceState } from 'discord.js';
import { IAudioPlayerFactory } from '../helpers/AudioPlayerFactory';

export interface IMediaFilePlayer {
    playFile(fileName: string): void;
}

export class MediaFilePlayer implements IMediaFilePlayer {
    private audioPlayer: AudioPlayer;

    public playFile(fileName: string): void {

    // TODO: FIX CHANNEL
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public playFile(fileName: string, channel: VoiceState): void {
        if (!this.audioPlayer) {
            this.audioPlayer = this.audioPlayerFactory.getAudioPlayer();
        }

        this.audioPlayer.play(createAudioResource(fileName));
    }
}
