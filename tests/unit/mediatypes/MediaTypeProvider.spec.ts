import { MockProxy } from 'jest-mock-extended';
import container from '../../../etc/container';
import { IMediaType } from '../../../src/media/MediaType';
import { MediaTypeNotFoundError } from './../../../src/mediatypes/MediaTypeNotFoundError';
import { MediaTypeProvider } from './../../../src/mediatypes/MediaTypeProvider';

jest.mock('../../../etc/container');

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
        (container as MockProxy<typeof container>).get.mockReturnValue({ invalid: 'invalid' });

        try {
            mediaTypeProvider.get('youtube');
        } catch (error) {
            expect(error).toBeInstanceOf(MediaTypeNotFoundError);
            expect(error).toContain('container');
        }
    });

    it('Should return class from container when found', () => {
        const MOCK_MEDIA_TYPE = {
            getPlaylist: () => Promise.reject('mock'),
            getDetails: () => Promise.reject('mock'),
            getStream: () => Promise.reject('mock'),
        } as IMediaType;

        (container as MockProxy<typeof container>).get.mockReturnValue(MOCK_MEDIA_TYPE);

        const result = mediaTypeProvider.get('youtube');

        expect(result).toBe(MOCK_MEDIA_TYPE);
    });
});
