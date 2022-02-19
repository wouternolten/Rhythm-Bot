import { ClientUser, PresenceStatusData } from 'discord.js';

export class BotStatus {
    constructor(private readonly user: ClientUser) {

    }

    setBanner(status: string) {
        this.user.setPresence({
            activity: {
                name: status,
            },
        });
    }

    setActivity(activity: PresenceStatusData) {
        this.user.setStatus(activity);
    }
}
