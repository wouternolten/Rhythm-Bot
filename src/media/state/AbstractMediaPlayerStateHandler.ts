import IMediaPlayerStateHandler from './IMediaPlayerStateHandler';
import { PlayerState } from './Types';

export default abstract class AbstractMediaPlayerStateHandler implements IMediaPlayerStateHandler {
    async play(): Promise<void> {
        return;
    }

    async stop(): Promise<void> {
        return;
    }

    async pause(): Promise<void> {
        return;
    }

    getApplicableStateName(): PlayerState {
        throw new Error('Method not implemented.');
    }
}
