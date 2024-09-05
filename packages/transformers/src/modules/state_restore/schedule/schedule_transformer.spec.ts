import { XMessage } from "@samagra-x/xmessage";
import { ScheduleTransformer } from "./schedule_transformer";

jest.mock("../../common/telemetry", () => {
    return {
        TelemetryLogger: jest.fn().mockImplementation(() => {
            return {
                sendLogTelemetry: jest.fn(),
            };
        }),
    };
});

describe('ScheduleTransformer', () => {
    let transformer: ScheduleTransformer;
    let xmsg: XMessage;

    beforeEach(() => {
        xmsg = {
            from: { userID: 'user1' },
            channelURI: 'channel1',
            providerURI: 'provider1',
            transformer: {
                metaData: {}
            }
        } as XMessage;

        transformer = new ScheduleTransformer({
            transformerId: 'test-transformer',
            timerDuration: 5000,
            resetOnReply: false
        });
    });

    it('should throw an error if timerDuration is not provided', async () => {
        transformer = new ScheduleTransformer({
            transformerId: 'test-transformer'
        });

        await expect(transformer.transform(xmsg)).rejects.toThrow('timerDuration is required!');
    });

    it('should set the correct timerId and timerDuration in xmsg', async () => {
        const result = await transformer.transform(xmsg);
        const timerId = `timer_user1_channel1_provider1`;

        expect(result.transformer?.metaData?.timerId).toBe(timerId);
        expect(result.transformer?.metaData?.timerDuration).toBe(5000);
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.clearAllMocks();
    });
});
