import { Logger } from 'winston';

export function mockLogger(): Logger {
    return {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
    } as unknown as Logger;
};