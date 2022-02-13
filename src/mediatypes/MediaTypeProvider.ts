import { IMediaType } from './../media/media-type.model';
import { MediaTypeNotFoundError } from './MediaTypeNotFoundError';
import { YoutubeMediaType } from './YoutubeMediaType';
import { IMediaTypeProvider } from './IMediaTypeProvider';
import { Container, Service } from 'typedi';

@Service()
export class MediaTypeProvider implements IMediaTypeProvider {
    private MEDIA_TYPES = {
        'youtube': YoutubeMediaType
    };

    get(type: string): IMediaType {
        if (!this.MEDIA_TYPES[type]) {
            throw new MediaTypeNotFoundError(`Media type ${type} not found.`);
        }

        const returnType = Container.get(this.MEDIA_TYPES[type]) as IMediaType;

        if (!returnType) {
            throw new MediaTypeNotFoundError(`Media type ${type} not found in DI container.`);
        }

        return returnType;
    }
}