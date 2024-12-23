import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common";
import { TelemetryLogger } from "../../common/telemetry";
const config = require('./config.json');

export class RandomBinaryTransformer implements ITransformer {

    constructor(readonly config: Record<string, any>) {}
    private readonly telemetryLogger = new TelemetryLogger(this.config);

    async transform(xmsg: XMessage): Promise<XMessage> {
        console.log("RANDOM_BINARY transformer called.");
        if (!xmsg.transformer) {
            xmsg.transformer = {
                metaData: {}
            }
        }
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} started!`, Math.floor((performance.timeOrigin + performance.now()) * 1000), config['eventId']);
        xmsg.transformer.metaData!.state = Math.random() > 0.5 ? 'if' : 'else';
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} finished!`, Math.floor((performance.timeOrigin + performance.now()) * 1000), config['eventId']);
        return xmsg;
    }
}