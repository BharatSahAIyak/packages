import { MessageType, XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common";
import { TelemetryLogger } from "../../common/telemetry";
const config = require('./config.json');

export class MessageTypeClassifierTransformer implements ITransformer {

    readonly config: Record<string, any>;
    readonly telemetryLogger: TelemetryLogger;
    constructor(config: Record<string, any>) {
        this.config = config;
        this.telemetryLogger = new TelemetryLogger(this.config);
    }

    async transform(xmsg: XMessage): Promise<XMessage> {
        xmsg.transformer!.metaData!.state = xmsg.messageType ?? MessageType.TEXT;
        this.telemetryLogger.sendLogTelemetry(xmsg, `Message type classified as ${xmsg.transformer!.metaData!.state}`, Math.floor((performance.timeOrigin + performance.now()) * 1000), config['eventId']);
        return xmsg;
    }
}