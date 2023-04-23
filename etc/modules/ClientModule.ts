import { Token, Container, Module } from 'containor';
import { Client, GatewayIntentBits } from 'discord.js';
import tokens from '../tokens';

export default class ClientModule implements Module {
    // Ensure singleton in this case, since Discord can only handle 1 connection per token.
    private musicBot: Client | undefined;
    private welcomeBot: Client | undefined;

    public provides: Token[] = [tokens.musicBotClient, tokens.welcomeBotClient];

    public register(container: Container): void {
        container.add(
            tokens.musicBotClient,
            (): Client => {
                if (!this.musicBot) {
                    this.musicBot = this.createClient();
                }

                return this.musicBot;
            }
        )

        container.add(
            tokens.welcomeBotClient,
            (): Client => {
                if (!this.welcomeBot) {
                    this.welcomeBot = this.createClient();
                }

                return this.welcomeBot
            }
        );
    }

    createClient(): Client {
        return new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.MessageContent
            ],
        });
    }
}
