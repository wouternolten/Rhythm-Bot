import { createAudioResource } from '@discordjs/voice';
import { createReadStream } from 'fs';
import { Logger } from 'winston';
import { IAudioPlayerFactory } from '../helpers/AudioPlayerFactory';

export interface IMediaFilePlayer {
    playFile(fileName: string): void;
}

export class MediaFilePlayer implements IMediaFilePlayer {
    public constructor(private readonly audioPlayerFactory: IAudioPlayerFactory, private readonly logger: Logger) {}

    public playFile(fileName: string): void {
        const audioPlayer = this.audioPlayerFactory.getAudioPlayer();

        if (!audioPlayer) {
            this.logger.error('Audio player not found for media file player');
            return;
        }

        // We play a streamed version, because the player gets stuck on buffering. Link: https://github.com/discordjs/discord.js/issues/7232
        this.audioPlayerFactory.getAudioPlayer().play(createAudioResource(createReadStream(fileName)));
    }
}
