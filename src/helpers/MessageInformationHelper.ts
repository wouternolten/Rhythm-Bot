import { Message, TextChannel } from 'discord.js';

export type ChannelInfo = {
    id: string;
    name: string;
};

export interface IMessageInformationHelper {
    getTextChannelInfo(message: Message<boolean>): ChannelInfo | undefined;
    getUserVoiceChannelInfo(message: Message<boolean>): ChannelInfo | undefined;
}

export class MessageInformationHelper implements IMessageInformationHelper {
    getTextChannelInfo(message: Message<boolean>): ChannelInfo | undefined {
        if (!message.channel.isTextBased()) {
            return undefined;
        }

        return {
            name: (message.channel as TextChannel)?.name,
            id: message.channel.id,
        };
    }

    getUserVoiceChannelInfo(message: Message<boolean>): ChannelInfo | undefined {
        if (!message.member?.voice?.channel) {
            return undefined;
        }

        return {
            name: message.member.voice.channel.name,
            id: message.member.voice.channel.id,
        };
    }
}
