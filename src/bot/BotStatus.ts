import { Client, ClientUser, PresenceStatusData } from 'discord.js';

export class BotStatus {
    private readonly user: ClientUser;
    
    constructor(client: Client) {
        this.user = client.user;
    }

    setBanner(status: string) {
        try {
            this.user.setPresence({
                activities: [{ name: status }],
            });
        } catch (error) {
            console.error(error);
        }
    }

    setActivity(activity: PresenceStatusData) {
        this.user.setStatus(activity);
    }
}
