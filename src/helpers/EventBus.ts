import { EventEmitter } from 'events';

export enum AudioEventBusStatus {
    AudioPlayerIdle = 'audioPlayer.idle',
    AudioPlayerError = 'audioPlayer.error',
}

export class AudioEventBus extends EventEmitter {}
