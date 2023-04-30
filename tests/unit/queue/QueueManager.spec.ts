import { mock, MockProxy } from 'jest-mock-extended';
import { Logger } from 'winston';
import { IRhythmBotConfig } from '../../../src/bot/IRhythmBotConfig';
import { IChannelManager } from '../../../src/channel/ChannelManager';
import { MediaItem } from '../../../src/media/MediaItem';
import { IMediaType } from '../../../src/media/MediaType';
import { ISongRecommender } from '../../../src/media/SongRecommender';
import { MediaTypeProvider } from '../../../src/mediatypes/MediaTypeProvider';
import { QueueManager } from './../../../src/queue/QueueManager';

const ITEM_TYPE = 'youtube';
const ITEM_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const ITEM_REQUESTOR = '!t3m r3q43st0r';
const ITEM_NAME = 'Rick Astley - Never Gonna Give You Up (Official Music Video)';
const ITEM_DURATION = '13:37';
const ITEM_BEGIN = '4:20';

const VALID_ITEM: MediaItem = {
    type: ITEM_TYPE,
    url: ITEM_URL,
    requestor: ITEM_REQUESTOR,
    name: ITEM_NAME,
    duration: ITEM_DURATION,
    begin: ITEM_BEGIN
};

let queueManager: QueueManager;

let configuration: MockProxy<IRhythmBotConfig>;
let mediaTypeProver: MockProxy<MediaTypeProvider>;
let logger: MockProxy<Logger>;
let songRecommender: MockProxy<ISongRecommender>;
let channelManager: MockProxy<IChannelManager>;

beforeEach(() => {
    configuration = mock<IRhythmBotConfig>();
    mediaTypeProver = mock<MediaTypeProvider>();
    logger = mock<Logger>();
    songRecommender = mock<ISongRecommender>();
    channelManager = mock<IChannelManager>();

    queueManager = new QueueManager(
        configuration,
        mediaTypeProver,
        logger,
        songRecommender,
        channelManager
    );
});

describe('addMedia()', () => {
    const incompleteItem: MediaItem = {
        type: ITEM_TYPE,
        url: ITEM_URL
    };

    const type = mock<IMediaType>();

    it('Should add item when valid', async () => {
        await queueManager.addMedia(VALID_ITEM);

        expect(queueManager.at(0)).toEqual(VALID_ITEM);
        expect(channelManager.sendTrackAddedMessage).toHaveBeenCalledWith(VALID_ITEM, 1);
    });

    it('Should reject when mediaType is not fetched', async () => {
        mediaTypeProver.get.mockImplementation(() => { throw new Error('message') });

        expect.assertions(1);

        try {
            await queueManager.addMedia(incompleteItem);
        } catch (error) {
            expect(error).toBeDefined();
        }
    });

    it('Should reject when details cannot be fetched', async () => {
        mediaTypeProver.get.mockReturnValue(type);
        type.getDetails.mockRejectedValue(new Error());

        expect.assertions(2);

        try {
            await queueManager.addMedia(incompleteItem);
        } catch (error) {
            expect(logger.error).toHaveBeenCalled();
            expect(error).toBeDefined();
        }
    });

    it('Should reject when details cannot be fetched', async () => {
        mediaTypeProver.get.mockReturnValue(type);
        type.getDetails.mockResolvedValue(VALID_ITEM);

        await queueManager.addMedia(incompleteItem);

        expect(queueManager.at(0)).toEqual({
            ...incompleteItem,
            name: ITEM_NAME,
            duration: ITEM_DURATION
        });
    });
});

describe('getNextSongToPlay()', () => {
    it('Should return first item in list when it exists', async () => {
        queueManager.addMedia(VALID_ITEM, true);

        expect(await queueManager.getNextSongToPlay()).toEqual(VALID_ITEM);
    });

    it('Should return undefined when nothing in queue and no autoplay', async () => {
        expect(await queueManager.getNextSongToPlay()).toBeUndefined();
    });

    describe('autoplay on', () => {
        beforeEach(() => {
            configuration.queue.autoPlay = true;

            queueManager = new QueueManager(
                configuration,
                mediaTypeProver,
                logger,
                songRecommender,
                channelManager
            );
        });

        it('Should return undefined when autoplay is on, but no last song', async () => {
            expect(await queueManager.getNextSongToPlay()).toBeUndefined();
        });

        it('Should return undefined when song recommender errors', async () => {
            // Add media once and get song to flush queue, but set last song.
            await queueManager.addMedia(VALID_ITEM, true);
            await queueManager.getNextSongToPlay();

            songRecommender.recommendNextSong.mockRejectedValue(new Error());

            expect(await queueManager.getNextSongToPlay()).toBeUndefined();
            expect(logger.error).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalled();
        });

        it('Should return song of song recommender', async () => {
            const secondSong: MediaItem = {
                url: 'https://www.youtube.com/watch?v=L_jWHffIx5E',
                name: 'Smash Mouth - All Star',
                type: 'youtube'
            };

            // Add media once and get song to flush queue, but set last song.
            await queueManager.addMedia(VALID_ITEM, true);
            await queueManager.getNextSongToPlay();

            songRecommender.recommendNextSong.mockResolvedValue(secondSong);

            expect(await queueManager.getNextSongToPlay()).toEqual(secondSong);
        });
    });
});
