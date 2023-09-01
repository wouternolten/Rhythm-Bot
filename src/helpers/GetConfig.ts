import * as fs from 'fs';
import * as path from 'path';
import { IRhythmBotConfig } from '../bot/IRhythmBotConfig';
import { projectDirectory } from './ProjectDirectory';

export function getConfig(configName: string): IRhythmBotConfig {
    const configPath = projectDirectory(configName);

    if (!fs.existsSync(configPath)) {
        writeJson({ discord: { token: '<BOT-TOKEN>' }, useWelcomeBot: false }, configPath);
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const config: IRhythmBotConfig = require(projectDirectory(configName));

    if (!!config && config.discord.token === '<BOT-TOKEN>') {
        throw new Error('Invalid Token for the music bot - Create valid token in the Discord Developer Portal');
    }

    return config;
}

function writeJson(data: { [key: string]: unknown }, ...args: string[]): void {
    const target = projectDirectory(...args);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(projectDirectory(...args), JSON.stringify(data), 'utf8');
}
