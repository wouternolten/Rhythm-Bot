import { token } from 'containor';
import { Client, ClientUser } from 'discord.js';
import { Logger } from 'winston';
import { BotStatus } from '../src/bot/BotStatus';
import { IRhythmBotConfig } from '../src/bot/IRhythmBotConfig';
import { RhythmBot } from '../src/bot/RhythmBot';
import { MediaPlayer } from '../src/media/MediaPlayer';
import { MediaTypeProvider } from '../src/mediatypes/MediaTypeProvider';
import { YoutubeMediaType } from '../src/mediatypes/YoutubeMediaType';
import { WelcomeTuneBot } from './../src/bot/WelcomeTuneBot';
import { CommandMapFactory } from './../src/command/CommandMapFactory';
import { AudioPlayerFactory } from './../src/helpers/AudioPlayerFactory';
import { SpotifyAPIHelper } from './../src/helpers/SpotifyAPIHelper';
import { YoutubeAPIHelper } from './../src/helpers/YoutubeAPIHelper';
import { MediaFilePlayer } from './../src/media/MediaFilePlayer';
import { SongRecommender } from './../src/media/SongRecommender';

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
