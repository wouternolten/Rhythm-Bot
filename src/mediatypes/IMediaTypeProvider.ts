import { IMediaType } from '../media/MediaType';

export interface IMediaTypeProvider {
    /**
     * @param {string} type 
     * @returns {IMediaType}
     * @throws {MediaTypeNotFoundError}
     */
    get(type: string): IMediaType;
}
