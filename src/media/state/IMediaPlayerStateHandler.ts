import { PlayerState } from './Types';
export default interface IMediaPlayerStateHandler {
    play(): Promise<void>;
    stop(silent: boolean): Promise<void>;
    pause(): Promise<void>;
    getApplicableStateName(): PlayerState;
}
