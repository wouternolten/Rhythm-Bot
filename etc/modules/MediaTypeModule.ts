import { Container, Module, Token } from "containor";
import tokens from "../tokens";
import { MediaTypeProvider } from "../../src/mediatypes/MediaTypeProvider";
import { YoutubeMediaType } from "../../src/mediatypes/YoutubeMediaType";

export default class MediaTypeModule implements Module {
    public provides: Token[] = [
        tokens.mediaTypeProvider,
        tokens.youtubeMediaType
    ];

    public register(container: Container): void {
        container.add(tokens.mediaTypeProvider, MediaTypeProvider, []);
        container.add(tokens.youtubeMediaType, YoutubeMediaType, [tokens.logger]);
    }
}
