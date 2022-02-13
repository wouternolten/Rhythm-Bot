import { IMediaType } from '../media/media-type.model';

export interface IMediaTypeProvider {
    /**
     * @param {string} type 
     * @returns {IMediaType}
     * @throws {MediaTypeNotFoundError}
     */
    get(type: string): IMediaType;
}