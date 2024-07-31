import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common";
import { TelemetryLogger } from "../../common/telemetry";

export class RandomBinaryTransformer implements ITransformer {

    constructor(readonly config: Record<string, any>) { }
    private readonly telemertyLogger = new TelemetryLogger(this.config);

    async transform(xmsg: XMessage): Promise<XMessage> {
        console.log("RANDOM_BINARY transformer called.");
        if (!xmsg.transformer) {
            xmsg.transformer = {
                metaData: {}
            }
        }
        this.telemertyLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} started!`, Date.now());
        xmsg.transformer.metaData!.state = Math.random() > 0.5 ? 'if' : 'else';
        this.telemertyLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} finished!`, Date.now());
        return xmsg;
    }
}