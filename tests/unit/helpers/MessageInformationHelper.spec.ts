import { Message } from 'discord.js';
import { IMessageInformationHelper, MessageInformationHelper } from '../../../src/helpers/MessageInformationHelper';

let helper: IMessageInformationHelper;

beforeEach(() => {
    helper = new MessageInformationHelper();
});

describe('getTextChannelInfo()', () => {
    it('Should return undefined when channel is not text based', () => {
        const message = {
            channel: {
                isTextBased: () => false,
            },
        } as unknown as Message;

        expect(helper.getTextChannelInfo(message)).toBeUndefined();
    });

    it('Should return name and id when channel is text based', () => {
        const message = {
            channel: {
                isTextBased: () => true,
                name: 'Astley',
                id: 'dQw4w9WgXcQ',
            },
        } as unknown as Message;

        expect(helper.getTextChannelInfo(message)).toEqual({
            name: 'Astley',
            id: 'dQw4w9WgXcQ',
        });
    });
});

describe('getUserVoiceChannelInfo()', () => {
    it('Should return undefined when no member', () => {
        const message = {} as unknown as Message;

        expect(helper.getUserVoiceChannelInfo(message)).toBeUndefined();
    });

    it('Should return undefined when member has no voice', () => {
        const message = {
            member: {},
        } as unknown as Message;

        expect(helper.getUserVoiceChannelInfo(message)).toBeUndefined();
    });

    it('Should return undefined when member has no voice channel', () => {
        const message = {
            member: {
                voice: {},
            },
        } as unknown as Message;

        expect(helper.getUserVoiceChannelInfo(message)).toBeUndefined();
    });

    it('Should return name and id when channel is text based', () => {
        const message = {
            member: {
                voice: {
                    channel: {
                        name: 'Astley',
                        id: 'dQw4w9WgXcQ',
                    },
                },
            },
        } as unknown as Message;

        expect(helper.getUserVoiceChannelInfo(message)).toEqual({
            name: 'Astley',
            id: 'dQw4w9WgXcQ',
        });
    });
});
