import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { Container } from 'typedi';
import { config as dotenv } from 'dotenv';
import { MikroORM, IDatabaseDriver, Connection } from '@mikro-orm/core';
import { IRhythmBotConfig, RhythmBot } from './bot';
import { Playlist } from './media/playlist.model';
import { WelcomeTuneBot } from './bot/welcometunebot';
import winston, { createLogger, transports, format } from 'winston';

const { Console, File } = transports;
const { combine, timestamp, printf } = format;
const lineFormat = printf(({ level, message, timestamp }) => {
    return `[${timestamp}] (${level}): ${message}`;
});

dotenv();

export let ORM: MikroORM<IDatabaseDriver<Connection>>;

(async () => {
    try {
        const configPath = projectDir('../bot-config.json');
        if (!fs.existsSync(configPath)) {
            await writeJson({ discord: { token: '<BOT-TOKEN>' }, useWelcomeBot: false }, configPath);
        }
        const config: IRhythmBotConfig = requireFile(configPath);

        if (!!config && config.discord.token === '<BOT-TOKEN>') {
            console.error('Invalid Token for the music bot - Create valid token in the Discord Developer Portal');
            process.exit(0);
        }

        ORM = await MikroORM.init({
            type: 'sqlite',
            dbName: 'data/rhythm.db',
            entities: [Playlist],
        });
        const migrator = ORM.getMigrator();
        migrator.createMigration();
        await migrator.up();

        Container.set('logger', createLogger({
            level: 'silly',
            format: combine(
                timestamp(),
                lineFormat
            ),
            transports: [
                new Console(),
                new File({ filename: path.basename(config.directory.logs), dirname: path.dirname(config.directory.logs), maxsize: 1e+7 })
            ]
        }) as winston.Logger);

        musicBot.connect().then(() => {
            musicBot.logger.debug('Rhythm Bot Online');
            musicBot.listen();
        });

        if (config.useWelcomeBot) {
            const cloneConfig = {
                ...config,
                discord: {
                    token: process.env.WELCOME_BOT_TOKEN,
                    log: config.discord.log
                }
            } as IRhythmBotConfig;

            const welcomeBot = new WelcomeTuneBot(cloneConfig);
            
            welcomeBot.connect().then(() => {
                welcomeBot.logger.debug('Rhythm Bot Online');
                welcomeBot.listen();
            });
        }
    } catch (error) {
        console.error(error);
    }
})();
