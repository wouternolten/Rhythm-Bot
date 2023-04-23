import { Client } from 'discord.js';
import { SongRecommender } from './../src/media/SongRecommender';
import { MediaFilePlayer } from './../src/media/MediaFilePlayer';
import { YoutubeAPIHelper } from './../src/helpers/YoutubeAPIHelper';
import { SpotifyAPIHelper } from './../src/helpers/SpotifyAPIHelper';
import { AudioPlayerFactory } from './../src/helpers/AudioPlayerFactory';
import { CommandMapFactory } from './../src/command/CommandMapFactory';
import { WelcomeTuneBot } from './../src/bot/WelcomeTuneBot';
import { RhythmBot } from '../src/bot/RhythmBot';
import { Logger } from 'winston';
import { token } from 'containor';
import { IRhythmBotConfig } from '../src/bot/IRhythmBotConfig';
import { BotStatus } from '../src/bot/BotStatus';
import { MediaPlayer } from '../src/media/MediaPlayer';
import { MediaTypeProvider } from '../src/mediatypes/MediaTypeProvider';
import { YoutubeMediaType } from '../src/mediatypes/YoutubeMediaType';

export default {
    logger: token<Logger>('logger'),
    config: token<IRhythmBotConfig>('config'),

    // Clients
    musicBotClient: token<Client>('musicBotClient'),
    welcomeBotClient: token<Client>('welcomeBotClient'),

    // Bots
    rhythmBot: token<RhythmBot>('rhythmBot'),
    welcomeTuneBot: token<WelcomeTuneBot>('welcomeTuneBot'),
    botStatus: token<BotStatus>('botStatus'),
    
    // Commands
    commandMapFactory: token<CommandMapFactory>('commandMapFactory'),

    // Helpers
    musicBotAudioPlayerFactory: token<AudioPlayerFactory>('musicBotAudioPlayerFactory'),
    welcomeBotAudioPlayerFactory: token<AudioPlayerFactory>('welcomeBotAudioPlayerFactory'),
    spotifyApiHelper: token<SpotifyAPIHelper>('spotifyApiHelper'),
    youtubeApiHelper: token<YoutubeAPIHelper>('youtubeApiHelper'),

    // Media
    mediaPlayer: token<MediaPlayer>('mediaPlayer'),
    mediaFilePlayer: token<MediaFilePlayer>('mediaFilePlayer'),
    songRecommender: token<SongRecommender>('songRecommender'),

    // MediaTypes
    mediaTypeProvider: token<MediaTypeProvider>('mediaTypeProvider'),
    youtubeMediaType: token<YoutubeMediaType>('youtubeMediaType')
}
