import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
const config = require('./config.json');
import { Events } from "@samagra-x/uci-side-effects";
import { TelemetryLogger } from "../../common/telemetry";
const ivm = require('isolated-vm');

export class CodeRunnerTransformer implements ITransformer {

    /// Accepted config properties:
    ///     code: string: The code to execute in the runner
    ///
    /// Note: The code may only modify `XMessage.transformer.metaData`
    /// and `XMessage.payload` inside the code. The `XMessage` object
    /// will be provided in the context as a stringified JSON in $0.
    /// Note: If the `XMessage` is modified, the function must returned
    /// the modified `XMessage` as a stringified JSON.
    constructor(readonly config: Record<string, any>) {}
    private readonly telemetryLogger = new TelemetryLogger(this.config);

    async transform(xmsg: XMessage): Promise<XMessage> {
        const startTime = Math.floor((performance.timeOrigin + performance.now()) * 1000);
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} Finished`, startTime, config['eventId']);
        if (!this.config?.code) {
            throw new Error('config.code is required');
        }
        if (!xmsg.transformer) {
            xmsg.transformer = {
                metaData: {}
            };
        }
        const isolate = new ivm.Isolate({ memoryLimit: 64 });
        const context = isolate.createContextSync();
        const jail = context.global;
        jail.setSync('global', jail.derefInto());
        const xmsgCopy: Partial<XMessage> = {};
        xmsgCopy.payload = xmsg.payload;
        xmsgCopy.transformer = xmsg.transformer;
        const codeResult = context.evalClosureSync(
            this.config.code,
            [JSON.stringify(xmsgCopy)],
            {
                timeout: 30_000,
            }
        );
        if (codeResult) {
            try {
                const modifiedXmsg: XMessage = JSON.parse(codeResult);
                xmsg.transformer.metaData = modifiedXmsg.transformer?.metaData;
                xmsg.payload = modifiedXmsg.payload;
            }
            catch (err) {
                this.telemetryLogger.sendErrorTelemetry(xmsg, `${err}`);
                console.log(err);
                throw new Error('XMessage must be returned as a stringified JSON!');
            }
        }
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} Finished`, startTime, config['eventId']);
        return xmsg;
    }
}
