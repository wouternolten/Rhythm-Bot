export interface IBot {
    connect(): Promise<string>;
    listen(): void;
}