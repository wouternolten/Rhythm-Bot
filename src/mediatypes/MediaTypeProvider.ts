import { IMediaType } from './../media/MediaType';
import { MediaTypeNotFoundError } from './MediaTypeNotFoundError';
import { IMediaTypeProvider } from './IMediaTypeProvider';
import container from '../../etc/container';
import tokens from '../../etc/tokens';
import { Token } from 'containor';

export class MediaTypeProvider implements IMediaTypeProvider {
    private MEDIA_TYPES: { [key: string]: Token<IMediaType>} = {
        'youtube': tokens.youtubeMediaType
    };

    get(type: string): IMediaType {
        if (!this.MEDIA_TYPES[type]) {
            throw new MediaTypeNotFoundError(`Media type ${type} not found.`);
        }

        const returnType = container.get(this.MEDIA_TYPES[type]) as IMediaType;

        if (!returnType) {
            throw new MediaTypeNotFoundError(`Media type ${type} not found in DI container.`);
        }

        return returnType;
    }
}
