import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common";
import { TelemetryLogger } from "../../common/telemetry";
const config = require('./config.json');

export class SimpleRetryTransformer implements ITransformer {

    /// Accepted config properties:
    ///     retries: string: Number of reties before failure. Default is 1. (optional)
    ///     delay: number: Delay in milliseconds before next retry. Default is 0. (optional)
    constructor(readonly config: Record<string, any>) {}
    private readonly telemetryLogger = new TelemetryLogger(this.config);


    async transform(xmsg: XMessage): Promise<XMessage> {
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} started!`, ((performance.timeOrigin + performance.now()) * 1000), config['eventId']);
        if (!xmsg.transformer) {
            xmsg.transformer = {
                metaData: {},
            }
        }
        this.config.delay = this.config.delay ?? 0;
        if (!xmsg.transformer.metaData!.retryCount || xmsg.transformer.metaData!.retryCount < (this.config.retries ?? 1)) {
            xmsg.transformer.metaData!.retryCount = (xmsg.transformer.metaData!.retryCount || 0) + 1;
            xmsg.transformer.metaData!.state = 'retry';
            this.telemetryLogger.sendLogTelemetry(xmsg, `Retry count: ${xmsg.transformer.metaData!.retryCount}`, ((performance.timeOrigin + performance.now()) * 1000), config['eventId']);
            await this.delay(this.config.delay);
        }
        else {
            delete xmsg.transformer.metaData!.retryCount;
            xmsg.transformer.metaData!.state = 'error';
            this.telemetryLogger.sendErrorTelemetry(xmsg, 'Retry limit exceeded!');
        }
        console.log(`SIMPLE_RETRY count: ${xmsg.transformer.metaData!.retryCount}`);
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} finished!`, ((performance.timeOrigin + performance.now()) * 1000), config['eventId']);
        return xmsg;
    }

    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
