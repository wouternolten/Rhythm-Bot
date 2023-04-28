import { WelcomeTuneBot } from './../../src/bot/WelcomeTuneBot';
import { BotStatus } from './../../src/bot/BotStatus';
import { Container, Module, Token } from "containor";
import tokens from "../tokens";
import { RhythmBot } from '../../src/bot/RhythmBot';
import { IRhythmBotConfig } from '../../src/bot/IRhythmBotConfig';
import { getConfig } from '../../src/helpers/GetConfig';

export default class BotModule implements Module {
    public provides: Token[] = [
        tokens.botStatus, 
        tokens.welcomeTuneBot, 
        tokens.rhythmBot,
        tokens.config
    ];

    public register(container: Container): void {
        container.add(tokens.config, (): IRhythmBotConfig => {
            let config: IRhythmBotConfig;

            try {
                config = getConfig('../bot-config.json');
            } catch (error) {
                console.error({ configError: error });
                process.exit(1);
            }

            return config;
        });

        container.add(tokens.botStatus, BotStatus, [
            tokens.musicBotClientUser,
            tokens.logger
        ]);

        container.add(tokens.welcomeTuneBot, WelcomeTuneBot, [
            tokens.config,
            tokens.mediaFilePlayer,
            tokens.commandMapFactory,
            tokens.welcomeBotClient,
            tokens.logger
        ]);

        container.add(tokens.rhythmBot, RhythmBot, [
            tokens.config,
            tokens.musicBotClientUser,
            tokens.mediaPlayer,
            tokens.logger,
            tokens.commandMapFactory
        ]);
    }
}
