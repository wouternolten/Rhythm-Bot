import { EmbedBuilder, RGBTuple } from '@discordjs/builders';

const darkBlue: RGBTuple = [0, 153, 255];
const darkOrange: RGBTuple = [255, 51, 0];
const electricPurple: RGBTuple = [166, 0, 255];

export function secondsToTimestamp(seconds: number): string {
    if (seconds < 0) {
        throw new Error('Timestamp cannot be negative');
    }

    let secondsLeft = seconds;

    const hours = Math.floor(secondsLeft / 3600);
    secondsLeft -= hours * 3600;

    const minutes = Math.floor(secondsLeft / 60);
    secondsLeft -= minutes * 60;

    return `${leftPad(hours, 2)}:${leftPad(minutes, 2)}:${leftPad(Math.round(secondsLeft), 2)}`;
}

export function leftPad(integer: number, amount: number): string {
    let paddedInt: string = integer.toString();

    while (paddedInt.length < amount) {
        paddedInt = '0' + paddedInt;
    }

    return paddedInt;
}

export function createEmbed() {
    return new EmbedBuilder().setColor(electricPurple);
}

export function createErrorEmbed(message: string) {
    return { embeds: [new EmbedBuilder().setColor(darkOrange).setTitle('Error').setDescription(message)] };
}

export function createInfoEmbed(message: string, title?: string) {
    const infoEmbed = new EmbedBuilder().setColor(darkBlue).setDescription(message);

    try {
        if (title) {
            infoEmbed.setTitle(title);
        }
    } catch (error) {
        console.error(error);
    }

    return { embeds: [infoEmbed] };
}

export function isInteger(body: string): boolean {
    if (typeof body !== 'string') {
        return false;
    }

    const numericBody = Number(body);

    return Number.isInteger(numericBody);
}
