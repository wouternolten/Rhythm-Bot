export interface IRhythmBotConfig {
    auto?: {
        deafen?: boolean;
        pause?: boolean;
        play?: boolean;
        reconnect?: boolean;
    };
    queue?: {
        announce?: boolean;
        autoPlay?: boolean;
    };
    stream?: {
        seek?: number;
        packetLossPercentage?: number;
        forwardErrorCorrection?: boolean;
        bitrate?: number | 'auto';
    };
    emojis?: {
        addSong?: string;
        stopSong?: string;
        playSong?: string;
        pauseSong?: string;
        skipSong?: string;
    };
    useWelcomeBot: boolean;
    spotify?: {
        clientId: string;
        clientSecret: string;
    };
    command?: {
        symbol?: string;
    };
    discord: {
        token: string;
        welcomeBotToken: string;
        log?: boolean;
    };
    directory: {
        plugins?: string;
        logs: string;
    };
}
