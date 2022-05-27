export interface IRhythmBotConfig {
    auto?: {
        deafen?: boolean;
        pause?: boolean;
        play?: boolean;
        reconnect?: boolean;
    };
    queue?: {
        announce?: boolean;
        repeat?: boolean;
    };
    stream?: {
        seek?: number;
        packetLossPercentage?: number;
        forwardErrorCorrection?: boolean;
        volume?: number;
        bitrate?: number | 'auto';
    };
    emojis?: {
        addSong?: string;
        stopSong?: string;
        playSong?: string;
        pauseSong?: string;
        skipSong?: string;
    };
    useWelcomeBot: boolean,
    youtube?: {
        apiKey: string;
    }
    spotify?: {
        clientId: string;
        clientSecret: string;
    }
        command?: {
        symbol?: string;
    };
    discord: {
        token: string;
        log?: boolean;
    };
    directory: {
        plugins?: string;
        logs: string;
    };
}
