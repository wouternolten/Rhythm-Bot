import { secondsToTimestamp } from "../../../src/helpers";

describe('Seconds to timestamp', () => {
    const secondsToTimeStampTest: { seconds: number, timeStamp: string }[] = [
        { seconds: 0, timeStamp: '00:00:00'},
        { seconds: 1, timeStamp: '00:00:01' },
        { seconds: 1.1111111111111, timeStamp: '00:00:01'},
        { seconds: 11, timeStamp: '00:00:11' },
        { seconds: 60, timeStamp: '00:01:00' },
        { seconds: 61, timeStamp: '00:01:01' },
        { seconds: 666, timeStamp: '00:11:06' },
        { seconds: 3600, timeStamp: '01:00:00' },
        { seconds: 6666, timeStamp: '01:51:06' },
        { seconds: 66666, timeStamp: '18:31:06' },
    ];

    it('Should throw error when timestamp is below zero', () => {
        try {
            secondsToTimestamp(-5);
        } catch (error) {
            expect(error).toBeDefined();
        }
    })

    it.each(secondsToTimeStampTest)('Should generate correct timestamp', (secondsWithTimeStamps: { seconds: number, timeStamp: string }) => {
        expect(secondsToTimestamp(secondsWithTimeStamps.seconds)).toEqual(secondsWithTimeStamps.timeStamp);
    });
});