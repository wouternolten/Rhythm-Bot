import { Container } from 'containor';
import BotModule from './modules/BotModule';
import ClientModule from './modules/ClientModule';
import CommandModule from './modules/CommandModule';
import HelpersModule from './modules/HelpersModule';
import MediaModule from './modules/MediaModule';
import MediaTypeModule from './modules/MediaTypeModule';
import QueueModule from './modules/QueueModule';

const container = new Container();

container.use(ClientModule);
container.use(BotModule);
container.use(CommandModule);
container.use(HelpersModule);
container.use(MediaModule);
container.use(MediaTypeModule);
container.use(QueueModule);

export default container;
