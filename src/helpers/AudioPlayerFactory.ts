import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, joinVoiceChannel } from '@discordjs/voice';
import { Client, Message, VoiceBasedChannel, VoiceState } from 'discord.js';
import { AudioEventBus, AudioEventBusStatus } from './EventBus';
import { ChannelInfo } from './MessageInformationHelper';

export interface IAudioPlayerFactory {
    getAudioPlayer(): AudioPlayer;
    initialize(): void;
    getChannelInfo(): ChannelInfo | undefined;
}

export class AudioPlayerFactory implements IAudioPlayerFactory {
    private audioPlayer: AudioPlayer;
    private channel: VoiceBasedChannel | undefined;

    constructor(private readonly client: Client, private readonly audioEventBus: AudioEventBus) {}

    public getAudioPlayer(): AudioPlayer | undefined {
        return this.audioPlayer;
    }

    public initialize(): void {
        this.client.on('messageCreate', (message: Message<boolean>) => {
            if (!message?.member?.voice?.channel) {
                return;
            }

            this.createSubscribedAudioPlayer(message.member.voice);
        });
    }

    public getChannelInfo(): ChannelInfo | undefined {
        if (!this.channel) {
            return undefined;
        }

        return {
            id: this.channel.id,
            name: this.channel.name,
        };
    }

    private createSubscribedAudioPlayer(voice: VoiceState): AudioPlayer {
        if (this.channel?.id && this.channel?.id !== voice.channelId) {
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

        if (!this.audioPlayer) {
            this.audioPlayer = createAudioPlayer();
            this.channel = voice.channel;

            this.sendEventsToEventBus();
        }

        connection.subscribe(this.audioPlayer);

        return this.audioPlayer;
    }

    private sendEventsToEventBus() {
        this.audioPlayer.on('error', (error) => this.audioEventBus.emit('error', error));
        this.audioPlayer.on('debug', (message) => this.audioEventBus.emit('debug', message));
        this.audioPlayer.on('stateChange', (oldState, newState) => {
            this.audioEventBus.emit('stateChange', oldState, newState);
            if (newState.status !== AudioPlayerStatus.Idle || oldState.status === AudioPlayerStatus.Idle) {
                this.audioEventBus.emit(AudioEventBusStatus.AudioPlayerIdle);
            }
        });
        this.audioPlayer.on('subscribe', (subscription) => this.audioEventBus.emit('subscribe', subscription));
        this.audioPlayer.on('unsubscribe', (unsubscribe) => this.audioEventBus.emit('unsubscribe', unsubscribe));
    }
}
