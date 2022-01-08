import { Client, PresenceStatusData } from 'discord.js';

export class BotStatus {
    constructor(private readonly client: Client) {}

    setBanner(status: string) {
        this.client.user.setPresence({
            activity: {
                name: status,
            },
        });
    }

    setActivity(activity: PresenceStatusData) {
        this.client.user.setStatus(activity);
    }
}
