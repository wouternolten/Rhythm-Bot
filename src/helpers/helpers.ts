import { MediaItem } from './../media/media-item.model';
import { Message, VoiceConnection, MessageEmbed } from 'discord.js';
import moment from 'moment';
import ytpl from 'ytpl';

export function joinUserChannel(msg: Message): Promise<VoiceConnection> {
    return new Promise((done, error) => {
        let channel = msg.member.voice.channel;
        if (channel && channel.type === 'voice') {
            channel.join().then((connection) => {
                done(connection);
            });
        } else {
            error(`User isn't on a voice channel!`);
        }
    });
}

export function secondsToTimestamp(seconds: number): string {
    return moment().startOf('day').seconds(seconds).format('HH:mm:ss');
}

export function createEmbed() {
    return new MessageEmbed().setColor('#a600ff');
}

export function createErrorEmbed(message: string) {
    return new MessageEmbed().setColor('#ff3300').setTitle('Error').setDescription(message);
}

export function createInfoEmbed(title: string, message: string = '') {
    return new MessageEmbed().setColor('#0099ff').setTitle(title).setDescription(message);
}

export async function getPlayList(url: string): Promise<{ title: string, items: MediaItem[] } | undefined> {
    let playList: ytpl.Result;

    try {
        playList = await ytpl(url);
    } catch (error) {
        console.error('Error when fetching playlist: ' + error);
        return;
    }

    return {
        title: playList.title,
        items: playList.items.map(item => ({ type: 'youtube', url: item.shortUrl, name: item.title, duration: item.duration } as MediaItem))
    };
}