import { AudioPlayer, createAudioPlayer, joinVoiceChannel } from '@discordjs/voice';
import { Client, Message, VoiceState } from 'discord.js';
import { AudioEventBus } from './EventBus';

export interface IAudioPlayerFactory {
    getAudioPlayer(): AudioPlayer;
}

export class AudioPlayerFactory {
    private audioPlayer: AudioPlayer;
    private channelId: string;

    constructor(private readonly client: Client, private readonly audioEventBus: AudioEventBus) {
        this.initialize();
    }

    public getAudioPlayer(): AudioPlayer | undefined {
        return this.audioPlayer;
    }

    private initialize(): void {
        this.client.on('messageCreate', (message: Message<boolean>) => {
            if (!message?.member?.voice?.channel) {
                return;
            }

            this.createSubscribedAudioPlayer(message.member.voice);
        });
    }

    private createSubscribedAudioPlayer(voice: VoiceState): AudioPlayer {
        if (this.channelId && this.channelId !== voice.channelId) {
            return this.audioPlayer; // Don't go to a different channel.
        }

        const connection = joinVoiceChannel({
            channelId: voice.channelId,
            guildId: voice.guild.id,
            adapterCreator: voice.guild.voiceAdapterCreator,
            group: this.client.user.id,
            selfMute: false,
            selfDeaf: false,
        });

        this.channelId = voice.channelId;

        if (!this.audioPlayer) {
            this.audioPlayer = createAudioPlayer();

            this.sendEventsToEventBus();
        }

        connection.subscribe(this.audioPlayer);

        return this.audioPlayer;
    }

    private sendEventsToEventBus() {
        this.audioPlayer.on('error', (error) => this.audioEventBus.emit('error', error));
        this.audioPlayer.on('debug', (message) => this.audioEventBus.emit('debug', message));
        this.audioPlayer.on('stateChange', (oldState, newState) =>
            this.audioEventBus.emit('stateChange', oldState, newState)
        );
        this.audioPlayer.on('subscribe', (subscription) => this.audioEventBus.emit('subscribe', subscription));
        this.audioPlayer.on('unsubscribe', (unsubscribe) => this.audioEventBus.emit('unsubscribe', unsubscribe));
    }
}
