import { MediaItem } from './../media/media-item.model';
import { MessageEmbed } from 'discord.js';
import ytpl from 'ytpl';

export function secondsToTimestamp(seconds: number): string {
    if (seconds < 0) {
        throw new Error('Timestamp cannot be negative');
    }

    let secondsLeft = seconds;

    let hours = Math.floor(secondsLeft / 3600);
    secondsLeft -= hours * 3600;
    
    let minutes = Math.floor(secondsLeft / 60);
    secondsLeft -= minutes * 60;

    return `${leftPad(hours, 2)}:${leftPad(minutes, 2)}:${leftPad(Math.round(secondsLeft), 2)}`;
}

export function leftPad(integer: Number, amount: Number): string {
    let paddedInt: string = integer.toString();

    while (paddedInt.length < amount) {
        paddedInt = '0' + paddedInt;
    }

    return paddedInt;
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

export function isInteger(body: string): Boolean {
    if (typeof body !== 'string') {
        return false;
    }

    const numericBody = Number(body);

    return Number.isInteger(numericBody);
}
