import { AudioPlayer } from '@discordjs/voice';
import { mock } from 'jest-mock-extended';
import { Logger } from 'winston';
import { IAudioPlayerFactory } from '../../../src/helpers/AudioPlayerFactory';
import { MediaFilePlayer } from '../../../src/media/MediaFilePlayer';

let mediaFilePlayer: MediaFilePlayer;

const logger = mock<Logger>();
const audioPlayerFactory = mock<IAudioPlayerFactory>();

beforeEach(() => {
    jest.resetAllMocks();

    mediaFilePlayer = new MediaFilePlayer(audioPlayerFactory, logger);
});

describe('playFile()', () => {
    it('Should log an error when no audio player found', () => {
        audioPlayerFactory.getAudioPlayer.mockReturnValue(undefined);

        mediaFilePlayer.playFile('some-file');

        expect(logger.error).toHaveBeenCalled();
    });

    it('Should play streamed audio resource', () => {
        const audioPlayer = mock<AudioPlayer>();

        audioPlayerFactory.getAudioPlayer.mockReturnValue(audioPlayer);

        mediaFilePlayer.playFile('some-file');

        expect(audioPlayer.play).toHaveBeenCalled();
    });
});
