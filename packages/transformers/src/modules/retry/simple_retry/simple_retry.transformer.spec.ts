import { XMessage } from "@samagra-x/xmessage";
import { SimpleRetryTransformer } from "./simple_retry.transformer";
import { TelemetryLogger } from "../../common/telemetry";

describe('SimpleRetryTransformer', () => {
    let transformer: SimpleRetryTransformer;
    let xmsg: XMessage;
    let mockEventBus = { pushEvent: jest.fn() };
    let mockConfig = { eventBus: mockEventBus, transformerId: 'simple-retry-transformer' }
    let mockLogger = { sendErrorTelemetry: jest.fn(), sendLogTelemetry: jest.fn() };
    jest.spyOn(TelemetryLogger.prototype, 'sendErrorTelemetry').mockImplementation(mockLogger.sendErrorTelemetry);
    jest.spyOn(TelemetryLogger.prototype, 'sendLogTelemetry').mockImplementation(mockLogger.sendLogTelemetry);

    beforeEach(() => {
        transformer = new SimpleRetryTransformer({ retries: 3, delay: 1000, ...mockConfig });
        xmsg = {
            transformer: {
                metaData: {}
            }
        } as XMessage;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const mockDelay = async () => {
        return new Promise(resolve => setTimeout(resolve, 1000));
    };

    it('should retry the specified number of times before erroring out', async () => {
        await transformer.transform(xmsg);
        expect(xmsg.transformer?.metaData!.retryCount).toBe(1);

        await transformer.transform(xmsg);
        expect(xmsg.transformer?.metaData!.retryCount).toBe(2);

        await transformer.transform(xmsg);
        expect(xmsg.transformer?.metaData!.retryCount).toBe(3);

        await transformer.transform(xmsg);
        expect(xmsg.transformer?.metaData!.state).toBe('error');
    });

    it('should wait for the specified delay before retrying', async () => {
        const delaySpy = jest.spyOn(transformer as any, 'delay').mockImplementation(mockDelay);
        const start = Math.floor((performance.timeOrigin + performance.now()) * 1000);

        await transformer.transform(xmsg);
        const end = Math.floor((performance.timeOrigin + performance.now()) * 1000);

        expect(end - start).toBeGreaterThanOrEqual(1000);
        delaySpy.mockRestore();
    });

    it('should retry only the specified number of times', async () => {

        await transformer.transform(xmsg);
        await transformer.transform(xmsg);
        await transformer.transform(xmsg);
        await transformer.transform(xmsg);
        expect(xmsg.transformer?.metaData!.state).toBe('error');
    });

    it('should handle case when no config is provided', async () => {
        const transformerWithoutConfig = new SimpleRetryTransformer({});
        await transformerWithoutConfig.transform(xmsg);
        expect(xmsg.transformer?.metaData!.retryCount).toBe(1);
    });

    it('should handle case when no transformer metadata is provided', async () => {
        const xmsgWithoutMetadata = {} as XMessage;
        await transformer.transform(xmsgWithoutMetadata);
        expect(xmsgWithoutMetadata.transformer!.metaData!.retryCount).toBe(1);
    });

    it('should retry with default delay if no delay is provided', async () => {
        const transformerWithDefaultDelay = new SimpleRetryTransformer({ retries: 3 });
        const start = Math.floor((performance.timeOrigin + performance.now()) * 1000);
        await transformerWithDefaultDelay.transform(xmsg);
        const end = Math.floor((performance.timeOrigin + performance.now()) * 1000);
        expect(end - start).toBeGreaterThanOrEqual(0);
    });

    it('should send telemetry log events', async () => {
        const trasformer = new SimpleRetryTransformer({ retries: 3 });
        await trasformer.transform(xmsg);
        expect(mockLogger.sendLogTelemetry).toHaveBeenCalled();
    })
});