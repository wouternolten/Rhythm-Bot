import IMediaPlayerStateHandler from './IMediaPlayerStateHandler';

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
}
