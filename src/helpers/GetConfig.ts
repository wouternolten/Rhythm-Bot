import * as fs from 'fs';
import * as path from 'path';
import { IRhythmBotConfig } from './../bot/bot-config';
import { projectDirectory } from './ProjectDirectory';

export async function getConfig(configName: string): Promise<IRhythmBotConfig>
{
    const configPath = projectDirectory(configName);

    if (!fs.existsSync(configPath)) {
        await writeJson({ discord: { token: '<BOT-TOKEN>' }, useWelcomeBot: false }, configPath);
    }

    const config: IRhythmBotConfig = require(projectDirectory(configName));

    if (!!config && config.discord.token === '<BOT-TOKEN>') {
        return Promise.reject('Invalid Token for the music bot - Create valid token in the Discord Developer Portal');
    }

    return config;
}

async function writeJson(data: any, ...args: string[])
{
    const target = projectDirectory(...args);
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    await new Promise((res, rej) => {
        fs.writeFile(target, JSON.stringify(data), 'utf8', (err) => {
            if (err) {
                rej(err);
            }

            res(0);
        })
    });
}