import { token } from 'containor';
import { Client, ClientUser } from 'discord.js';
import { Logger } from 'winston';
import { BotStatus } from '../src/bot/BotStatus';
import { IRhythmBotConfig } from '../src/bot/IRhythmBotConfig';
import { RhythmBot } from '../src/bot/RhythmBot';
import { WelcomeTuneBot } from '../src/bot/WelcomeTuneBot';
import { ChannelManager } from '../src/channel/ChannelManager';
import { CommandMapFactory } from '../src/command/CommandMapFactory';
import { AudioPlayerFactory } from '../src/helpers/AudioPlayerFactory';
import { AudioEventBus } from '../src/helpers/EventBus';
import { SpotifyAPIHelper } from '../src/helpers/SpotifyAPIHelper';
import { YoutubeAPIHelper } from '../src/helpers/YoutubeAPIHelper';
import { MediaFilePlayer } from '../src/media/MediaFilePlayer';
import { MediaPlayer } from '../src/media/MediaPlayer';
import { SongRecommender } from '../src/media/SongRecommender';
import IdleStateHandler from '../src/media/state/IdleStateHandler';
import IMediaPlayerStateHandler from '../src/media/state/IMediaPlayerStateHandler';
import PausedStateHandler from '../src/media/state/PausedStateHandler';
import PlayingStateHandler from '../src/media/state/PlayingStateHandler';
import { MediaTypeProvider } from '../src/mediatypes/MediaTypeProvider';
import { YoutubeMediaType } from '../src/mediatypes/YoutubeMediaType';
import { QueueManager } from '../src/queue/QueueManager';

export default {
    logger: token<Logger>('logger'),
    config: token<IRhythmBotConfig>('config'),

    // Clients
    musicBotClient: token<Client>('musicBotClient'),
    musicBotClientUser: token<ClientUser>('musicBotClientUser'),
    welcomeBotClient: token<Client>('welcomeBotClient'),

    // Bots
    rhythmBot: token<RhythmBot>('rhythmBot'),
    welcomeTuneBot: token<WelcomeTuneBot>('welcomeTuneBot'),
    botStatus: token<BotStatus>('botStatus'),

    // Channel
    channelManager: token<ChannelManager>('channelManager'),

    // Commands
    commandMapFactory: token<CommandMapFactory>('commandMapFactory'),

    // Helpers
    musicBotAudioPlayerFactory: token<AudioPlayerFactory>('musicBotAudioPlayerFactory'),
    welcomeBotAudioPlayerFactory: token<AudioPlayerFactory>('welcomeBotAudioPlayerFactory'),
    spotifyApiHelper: token<SpotifyAPIHelper>('spotifyApiHelper'),
    youtubeApiHelper: token<YoutubeAPIHelper>('youtubeApiHelper'),
    welcomeBotAudioEventBus: token<AudioEventBus>('welcomeBotAudioEventBus'),
    musicBotAudioEventBus: token<AudioEventBus>('musicBotAudioEventBus'),

    // Media
    mediaPlayer: token<MediaPlayer>('mediaPlayer'),
    mediaFilePlayer: token<MediaFilePlayer>('mediaFilePlayer'),
    songRecommender: token<SongRecommender>('songRecommender'),
    pausedStateHandler: token<PausedStateHandler>('pausedStateHandler'),
    playingStateHandler: token<PlayingStateHandler>('playingStateHandler'),
    idleStateHandler: token<IdleStateHandler>('idleStateHandler'),
    stateHandlers: token<IMediaPlayerStateHandler[]>('stateHandlers'),

    // MediaTypes
    mediaTypeProvider: token<MediaTypeProvider>('mediaTypeProvider'),
    youtubeMediaType: token<YoutubeMediaType>('youtubeMediaType'),

    // Queue
    queueManager: token<QueueManager>('queueManager'),
};
