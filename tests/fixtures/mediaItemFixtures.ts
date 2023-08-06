import { MediaItem } from '../../src/media/MediaItem';

const ITEM_TYPE = 'youtube';
const ITEM_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const ITEM_REQUESTOR = '!t3m r3q43st0r';
const ITEM_NAME = 'Rick Astley - Never Gonna Give You Up (Official Music Video)';
const ITEM_DURATION = '13:37';
const ITEM_BEGIN = '4:20';

const VALID_ITEM = {
    type: ITEM_TYPE,
    url: ITEM_URL,
    requestor: ITEM_REQUESTOR,
    name: ITEM_NAME,
    duration: ITEM_DURATION,
    begin: ITEM_BEGIN,
} as MediaItem;

export const getValidMediaItem = (): MediaItem => VALID_ITEM;
