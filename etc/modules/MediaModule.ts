import { Container, Module, Token } from "containor";
import { MediaFilePlayer } from "../../src/media/MediaFilePlayer";
import { SongRecommender } from "../../src/media/SongRecommender";
import tokens from "../tokens";

export default class MediaModule implements Module {
    public provides: Token[] = [tokens.mediaFilePlayer, tokens.songRecommender];

    public register(container: Container): void {
        container.add(tokens.mediaFilePlayer, MediaFilePlayer, [tokens.welcomeBotAudioPlayerFactory]);

        container.add(tokens.songRecommender, SongRecommender, [
            tokens.spotifyApiHelper,
            tokens.youtubeApiHelper,
            tokens.logger
        ])
    }
}
