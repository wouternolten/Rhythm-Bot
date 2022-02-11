import { SpotifyAPIHelper } from './../../../src/helpers/SpotifyAPIHelper';
import axios, { Axios } from 'axios';

jest.mock('axios');

const CLIENT_ID = 'id';
const CLIENT_SECRET = 'secret';

const TRACK_STRING = 'Never gonna give you up';
const ARTIST_STRING = 'Rick Astley';
const TRACK_ID = '4cOdK2wGLETKBW3PvgPWqT';

const TOKEN_RESPONSE = {
    data: {
        access_token: 'ACCESS_TOKEN'
    }
};

let helper: SpotifyAPIHelper;

beforeEach(() => {
    helper = new SpotifyAPIHelper(CLIENT_ID, CLIENT_SECRET)
});

describe('Test fetching data for search string', () => {
    it('Should return a rejected promise when token api is unreachable', async () => {
        axios.post = jest.fn().mockRejectedValue('Error');

        expect.assertions(1);

        try {
            await helper.getSpotifyIDForSong(TRACK_STRING, ARTIST_STRING);
        } catch (error) {
            expect(error).toEqual('Error');
        }
    });

    it('Should return a rejected promise when no access token is found', async () => {
        axios.post = jest.fn().mockResolvedValue({});

        expect.assertions(1);

        try {
            await helper.getSpotifyIDForSong(TRACK_STRING, ARTIST_STRING);
        } catch (error) {
            expect(error).toEqual('No access token found');
        }
    });

    describe('When token retrieving succeeds', () => {
        beforeEach(() => {
            axios.post = jest.fn().mockResolvedValue(TOKEN_RESPONSE)
        });

        it('Should return a rejected promise when searching fails', async () => {
            axios.get = jest.fn().mockRejectedValue('Rejected promise');

            expect.assertions(1);

            try {
                await helper.getSpotifyIDForSong(TRACK_STRING, ARTIST_STRING);
            } catch (error) {
                expect(error).toEqual('Rejected promise');
            }
        });

        describe('Invalid return data', () => {
            beforeEach(() => {
                expect.assertions(1);
            });

            it('Should error out when no response is given', () => {
                checkSpotifyId(undefined);
            })

            it('Should error out when data is not set', () => {
                checkSpotifyId({});
            });

            it('Should error out when tracks are not set', () => {
                checkSpotifyId({ data: {} });
            });

            it('Should error out when items are not set', () => {
                checkSpotifyId({ data: { tracks: {} } });
            });

            it('Should error out when id is not set', () => {
                checkSpotifyId({ data: { tracks: { items: [] } } });
            });

            async function checkSpotifyId(returnData: {}): Promise<void> {
                axios.get = jest.fn().mockResolvedValue(returnData);

                try {
                    await helper.getSpotifyIDForSong(TRACK_STRING, ARTIST_STRING);
                } catch (error) {
                    expect(error).toBeDefined();
                }
            }
        });

        it('Should return an id when found', async () => {
            const validData = {
                data: {
                    tracks: {
                        items: [
                            {
                                id: TRACK_ID
                            }
                        ]
                    }
                }
            };

            axios.get = jest.fn().mockResolvedValue(validData);

            const id = await helper.getSpotifyIDForSong(TRACK_STRING, ARTIST_STRING);

            expect(id).toEqual(TRACK_ID);
        });

        it('Should not set artist when none provided', async () => {
            const validData = {
                data: {
                    tracks: {
                        items: [
                            {
                                id: TRACK_ID
                            }
                        ]
                    }
                }
            };

            axios.get = jest.fn().mockResolvedValue(validData);

            await helper.getSpotifyIDForSong(TRACK_STRING);

            // @ts-ignore
            const firstArgument = axios.get.mock.calls[0][0] as string;
            
            expect(firstArgument.search('artist')).toEqual(-1);
        });
    })
});

describe('Test fetching data for id', () => {
    it('Should return a rejected promise when token api is unreachable', async () => {
        axios.post = jest.fn().mockRejectedValue('Error');

        expect.assertions(1);

        try {
            await helper.getRecommendationForTrack(TRACK_ID);
        } catch (error) {
            expect(error).toEqual('Error');
        }
    });

    it('Should return a rejected promise when no access token is found', async () => {
        axios.post = jest.fn().mockResolvedValue({});

        expect.assertions(1);

        try {
            await helper.getRecommendationForTrack(TRACK_ID);
        } catch (error) {
            expect(error).toEqual('No access token found');
        }
    });


    describe('When token retrieving succeeds', () => {
        beforeEach(() => {
            axios.post = jest.fn().mockResolvedValue(TOKEN_RESPONSE)
        });

        describe('Invalid return data', () => {
            beforeEach(() => {
                expect.assertions(1);
            });

            it('Should error out when no response is given', () => {
                getRecommendationForTrack(undefined);
            })

            it('Should error out when data is not set', () => {
                getRecommendationForTrack({});
            });

            it('Should error out when tracks are not set', () => {
                getRecommendationForTrack({ data: {} });
            });

            it('Should error out when tracks are not an array', () => {
                getRecommendationForTrack({ data: { tracks: {} } });
            });

            it('Should error out when tracks are an empty array', () => {
                getRecommendationForTrack({ data: { tracks: [] } });
            });

            it('Should error out when first track has no artist', () => {
                getRecommendationForTrack({ data: { tracks: [{name: TRACK_STRING}] } });
            });

            it('Should error out when first track has no name', () => {
                getRecommendationForTrack({ data: { tracks: [{artists: [{name: ARTIST_STRING }]}] } });
            });

            async function getRecommendationForTrack(returnData: {}): Promise<void> {
                axios.get = jest.fn().mockResolvedValue(returnData);

                try {
                    await helper.getRecommendationForTrack(TRACK_ID);
                } catch (error) {
                    expect(error).toBeDefined();
                }
            }
        });

        it('Should return a nicely formatted string for a recommendation', async () => {
            axios.get = jest.fn().mockResolvedValue({
                data: {
                    tracks: [
                        {
                            artists: [{ name: ARTIST_STRING }],
                            name: TRACK_STRING
                        },
                    ]
                }
            });

            const result = await helper.getRecommendationForTrack(TRACK_ID);

            expect(result).toEqual(`${ARTIST_STRING} - ${TRACK_STRING}`);
        });
    });
})