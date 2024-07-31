import { XMessage } from "@samagra-x/xmessage";
import { RandomBinaryTransformer } from "./random_binary.transformer";
import { TelemetryLogger } from "../../common/telemetry";

describe("RandomBinaryTransformer", () => {
    let mockEventBus: { pushEvent: jest.Mock };
    let mockConfig: { eventBus: any, transformerId: string };
    let mockTelemetryLogger: {sendLogTelemetry: jest.Mock, sendErrorTelemetry: jest.Mock};

    beforeEach(() => {
        mockEventBus = { pushEvent: jest.fn() };
        mockConfig = { eventBus: mockEventBus, transformerId: 'random-binary-transformer-id' };
        mockTelemetryLogger = {sendLogTelemetry: jest.fn(), sendErrorTelemetry: jest.fn()};
        jest.spyOn(TelemetryLogger.prototype, 'sendLogTelemetry').mockImplementation(mockTelemetryLogger.sendLogTelemetry);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    })

    describe("transform", () => {
        it("should generate 'if' or 'else' state randomly and attach it to metaData.state", async () => {
            const transformer = new RandomBinaryTransformer(mockConfig);
            const xmsg = new XMessage();
            await transformer.transform(xmsg);
            expect(xmsg.transformer!.metaData!.state).toMatch(/^(if|else)$/);
            expect(mockTelemetryLogger.sendLogTelemetry).toHaveBeenCalled();
        });

        it("should attach 'if' state when Math.random() > 0.5", async () => {
            jest.spyOn(Math, "random").mockReturnValue(0.6);
            const transformer = new RandomBinaryTransformer(mockConfig);
            const xmsg = new XMessage();
            await transformer.transform(xmsg);
            expect(xmsg.transformer!.metaData!.state).toEqual("if");
        });

        it("should attach 'else' state when Math.random() <= 0.5", async () => {
            jest.spyOn(Math, "random").mockReturnValue(0.4);
            const transformer = new RandomBinaryTransformer({});
            const xmsg = new XMessage();
            await transformer.transform(xmsg);
            expect(xmsg.transformer!.metaData!.state).toEqual("else");
        });

        it("should call sendLogTelemetry with start and finish messages", async () => {
            const transformer = new RandomBinaryTransformer(mockConfig);
            const xmsg = new XMessage();
            await transformer.transform(xmsg);

            expect(mockTelemetryLogger.sendLogTelemetry).toHaveBeenCalledTimes(2);
            expect(mockTelemetryLogger.sendLogTelemetry).toHaveBeenCalledWith(xmsg, `${mockConfig.transformerId} started!`, expect.any(Number));
            expect(mockTelemetryLogger.sendLogTelemetry).toHaveBeenCalledWith(xmsg, `${mockConfig.transformerId} finished!`, expect.any(Number));
        });
    });
});