import { ClientUser } from 'discord.js';
import { Logger } from 'winston';

export class BotStatus {
    constructor(
        private readonly user: ClientUser,
        private readonly logger: Logger
    ) {
    }

    setBanner(status: string) {
        try {
            this.user.setPresence({
                activities: [{ name: status }],
            });
        } catch (error) {
            this.logger.error(error);
        }
    }

    emptyBanner(): void {
        try {
            this.user.setPresence({
                activities: [{ name: ''}],
            });
        } catch (error) {
            this.logger.error(error);
        }
    }
}
