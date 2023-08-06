import { Container, Module, Token } from 'containor';
import { MediaFilePlayer } from '../../src/media/MediaFilePlayer';
import { SongRecommender } from '../../src/media/SongRecommender';
import IdleStateHandler from '../../src/media/state/IdleStateHandler';
import PausedStateHandler from '../../src/media/state/PausedStateHandler';
import PlayingStateHandler from '../../src/media/state/PlayingStateHandler';
import tokens from '../tokens';

export default class MediaModule implements Module {
    public provides: Token[] = [tokens.mediaFilePlayer, tokens.songRecommender];

    public register(container: Container): void {
        container.add(tokens.mediaFilePlayer, MediaFilePlayer, [tokens.welcomeBotAudioPlayerFactory]);

        container.add(tokens.songRecommender, SongRecommender, [
            tokens.spotifyApiHelper,
            tokens.youtubeApiHelper,
            tokens.logger,
        ]);

        container.add(tokens.idleStateHandler, IdleStateHandler, [
            tokens.botStatus,
            tokens.logger,
            tokens.mediaTypeProvider,
            tokens.musicBotAudioPlayer,
            tokens.queueManager,
            tokens.channelManager,
        ]);

        container.add(tokens.playingStateHandler, PlayingStateHandler, [
            tokens.botStatus,
            tokens.musicBotAudioPlayer,
            tokens.queueManager,
            tokens.channelManager,
        ]);

        container.add(tokens.pausedStateHandler, PausedStateHandler, [
            tokens.botStatus,
            tokens.musicBotAudioPlayer,
            tokens.queueManager,
            tokens.channelManager,
        ]);
    }
}
