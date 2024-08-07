import { XMessage } from "@samagra-x/xmessage";
import { TelemetryLogger } from "./telemetry";
import { Events } from "@samagra-x/uci-side-effects";

describe('TelemetryLogger', () => {
    let telemetryLogger: TelemetryLogger;
    let mockEventBus: { pushEvent: jest.Mock };
    let mockConfig: { eventBus: any, transformerId: string };

    beforeEach(() => {
        mockEventBus = { pushEvent: jest.fn() };
        mockConfig = { eventBus: mockEventBus, transformerId: 'test-transformer-id' };
        telemetryLogger = new TelemetryLogger(mockConfig);
    });

    it('should send error telemetry', async () => {
        const mockXMessage: XMessage = {
            transformer: {
                metaData: {}
            }
        } as XMessage;
        const errorString = 'Test error';

        await telemetryLogger.sendErrorTelemetry(mockXMessage, errorString);

        expect(mockEventBus.pushEvent).toHaveBeenCalledWith({
            eventName: Events.CUSTOM_TELEMETRY_EVENT_ERROR,
            transformerId: mockConfig.transformerId,
            eventData: {
                ...mockXMessage,
                transformer: {
                    metaData: {
                        errorString: errorString
                    }
                }
            },
            timestamp: expect.any(Number),
        });
    });
});