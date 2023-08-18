export class CommandMap<T> extends Map<string, Array<T>> {
    on(cmd: string, handler: T): this {
        if (!this.has(cmd)) this.set(cmd, [handler]);
        else this.get(cmd).push(handler);

        return this;
    }

    off(cmd: string, handler?: T): this {
        if (!handler) {
            this.delete(cmd);
        } else {
            const array = this.get(cmd);
            if (array) {
                const idx = array.indexOf(handler);
                if (idx > -1) array.splice(idx, 1);
            }
        }

        return this;
    }
}
