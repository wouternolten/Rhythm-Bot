import { MediaTypeNotFoundError } from './../../../src/mediatypes/MediaTypeNotFoundError';
import { MediaTypeProvider } from './../../../src/mediatypes/MediaTypeProvider';
import { IMediaType } from '../../../src/media/MediaType';
import { MediaItem } from '../../../src/media/MediaItem';

const mockGetReturnValue = jest.fn();

jest.mock('typedi', () => {
    const originalModule = jest.requireActual('typedi');

    return {
        __esModule: true,
        ...originalModule,
        Container: {
            get: (...params: any) => mockGetReturnValue(params)
        }
    }
});

let mediaTypeProvider: MediaTypeProvider;

describe('Getting media types', () => {
    beforeEach(() => {
        mediaTypeProvider = new MediaTypeProvider();
    });

    it('Should return error when mediaType not found', () => {
        try {
            mediaTypeProvider.get('INVALID');
        } catch (error) {
            expect(error).toBeInstanceOf(MediaTypeNotFoundError);
        }
    });

    it('Should return error when mediaType not found in container', () => {
        mockGetReturnValue.mockReturnValue({ 'invalid': 'invalid' });

        try {
            mediaTypeProvider.get('youtube');
        } catch (error) {
            expect(error).toBeInstanceOf(MediaTypeNotFoundError);
            expect(error).toContain('container');
        }
    });

    it('Should return class from container when found', () => {
        const MOCK_MEDIA_TYPE = {
            getPlaylist: (item: MediaItem) => Promise.reject('mock'),
            getDetails: (item: MediaItem) => Promise.reject('mock'),
            getStream: (item: MediaItem) => Promise.reject('mock')
        } as IMediaType;
        
        mockGetReturnValue.mockReturnValue(MOCK_MEDIA_TYPE);

        const result = mediaTypeProvider.get('youtube');

        expect(result).toBe(MOCK_MEDIA_TYPE);
    });
});
