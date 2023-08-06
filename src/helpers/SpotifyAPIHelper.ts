import { IRhythmBotConfig } from '../bot/IRhythmBotConfig';
import axios, { AxiosRequestConfig } from 'axios';
import { Logger } from 'winston';

const API_BASE_URL = 'https://api.spotify.com/v1';
const ACCOUNT_BASE_URL = 'https://accounts.spotify.com';

export class SpotifyAPIHelper {
    private token?: string = null;

    constructor(
        private readonly config: IRhythmBotConfig,
        private readonly logger: Logger
    ) {
    }

    async getSpotifyIDForSong(track: string, artist?: string): Promise<string> {
        if (track === '') {
            return Promise.reject('Invalid track passed');
        }

        const token = await this.getAccessToken();

        let artistTrackQuery: string;

        if (artist) {
            artistTrackQuery = `track:${track}+artist:${artist}`;
        } else {
            artistTrackQuery = track;
        }

        const totalQuery = `/search?q=${artistTrackQuery.trim().replace(/[\s]+/gm, '%20')}&type=track&limit=1`;

        this.logger.debug(JSON.stringify({ track, artist, totalQuery }));

        const requestOptions = {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        } as AxiosRequestConfig;

        const result = await axios.get(API_BASE_URL + totalQuery, requestOptions);

        if (!result.data?.tracks?.items[0]?.id) {
            if (artist) {
                return this.getSpotifyIDForSong(`${artist} ${track}`);
            }

            if (track.indexOf(" ") !== -1) {
                return this.getSpotifyIDForSong(track.slice(0, track.lastIndexOf(" ")), artist);
            }

            return Promise.reject('Invalid response; no tracks found');
        }

        return result.data.tracks.items[0].id;
    }

    
    async getTracksFromPlaylist(playListId: string): Promise<string[]> {
        if (playListId === '') {
            return Promise.reject('Empty playlistId given.');
        }

        if (/[^\w]+/.test(playListId) === true) {
            return Promise.reject('Invalid playlistId given');
        }

        const token = await this.getAccessToken();

        const requestOptions = {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        } as AxiosRequestConfig;

        try {
            return await axios.get(
                `${API_BASE_URL}/playlists/${playListId}/tracks?limit=50&fields=items(track(name,artists))`,
                requestOptions
            ).then(({ data }) => data.items.map(item => `${item.track.artists[0].name} - ${item.track.name}`));
        } catch (errorFetchingTracksFromPlayList) {
            this.logger.error({ errorFetchingTracksFromPlayList });

            throw errorFetchingTracksFromPlayList;
        }
    }

    async getRecommendationForTrack(spotifyId: string): Promise<string> {
        let token = await this.getAccessToken();

        const config = {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            params: {
                seed_tracks: spotifyId
            }
        } as AxiosRequestConfig;

        return axios
            .get('https://api.spotify.com/v1/recommendations', config)
            .then((result) => {
                if (Array.isArray(result.data.tracks) === false || result.data.tracks.length === 0) {
                    return Promise.reject('No track data found');
                }

                const currentTrack = result.data.tracks[0];

                if (Array.isArray(currentTrack.artists) === false || !currentTrack.name) {
                    return Promise.reject('Invalid track - no artist or track name found');
                }

                return `${currentTrack.artists[0].name} - ${currentTrack.name}`;
            });
    }

    private async getAccessToken(): Promise<string> {
        if (this.token) {
            return this.token;
        }

        const { spotify } = this.config;

        const base64Auth = new Buffer(spotify.clientId + ':' + spotify.clientSecret).toString('base64');

        return axios.post(
            ACCOUNT_BASE_URL + '/api/token',
            'grant_type=client_credentials',
            { headers: { 'Authorization': 'Basic ' + base64Auth } }
        ).then(result => {
            if (!result.data?.access_token) {
                return Promise.reject('No access token found');
            }

            this.setTokenWithTimeOut(result.data.access_token, result.data.expires_in);

            return this.token;
        });
    }

    private setTokenWithTimeOut(token: string, timeOutInSeconds: number): void
    {
        this.token = token;

        setTimeout(() => this.token = undefined, timeOutInSeconds * 1000);
    }
}
