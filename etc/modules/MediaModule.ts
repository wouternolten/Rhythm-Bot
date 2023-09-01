import { Container, Module, Token } from 'containor';
import { MediaFilePlayer } from '../../src/media/MediaFilePlayer';
import { MediaPlayer } from '../../src/media/MediaPlayer';
import { SongRecommender } from '../../src/media/SongRecommender';
import IdleStateHandler from '../../src/media/state/IdleStateHandler';
import IMediaPlayerStateHandler from '../../src/media/state/IMediaPlayerStateHandler';
import PausedStateHandler from '../../src/media/state/PausedStateHandler';
import PlayingStateHandler from '../../src/media/state/PlayingStateHandler';
import tokens from '../tokens';

export default class MediaModule implements Module {
    public provides: Token[] = [tokens.mediaFilePlayer, tokens.songRecommender, tokens.mediaPlayer];

    public register(container: Container): void {
        container.add(tokens.mediaFilePlayer, MediaFilePlayer, [tokens.welcomeBotAudioPlayerFactory, tokens.logger]);

        container.add(tokens.songRecommender, SongRecommender, [
            tokens.spotifyApiHelper,
            tokens.youtubeApiHelper,
            tokens.logger,
        ]);

        container.add(tokens.idleStateHandler, IdleStateHandler, [
            tokens.botStatus,
            tokens.logger,
            tokens.mediaTypeProvider,
            tokens.musicBotAudioPlayerFactory,
            tokens.queueManager,
            tokens.channelManager,
        ]);

        container.add(tokens.playingStateHandler, PlayingStateHandler, [
            tokens.botStatus,
            tokens.musicBotAudioPlayerFactory,
            tokens.queueManager,
            tokens.channelManager,
        ]);

        container.add(tokens.pausedStateHandler, PausedStateHandler, [
            tokens.botStatus,
            tokens.musicBotAudioPlayerFactory,
            tokens.queueManager,
            tokens.channelManager,
        ]);

        container.add(tokens.stateHandlers, (): IMediaPlayerStateHandler[] => [
            container.get(tokens.idleStateHandler),
            container.get(tokens.playingStateHandler),
            container.get(tokens.pausedStateHandler),
        ]);

        container.share(tokens.mediaPlayer, MediaPlayer, [
            tokens.botStatus,
            tokens.logger,
            tokens.queueManager,
            tokens.channelManager,
            tokens.stateHandlers,
            tokens.musicBotAudioEventBus,
        ]);
    }
}
