import * as path from 'path';

const directory = path.resolve(path.dirname(require.main.filename));

export function projectDirectory(...args: string[]): string
{
    if (args.some(x => x.startsWith('./') || x.startsWith('../'))) {
        return path.resolve(directory, ...args);
    }

    return path.resolve(...args);
}