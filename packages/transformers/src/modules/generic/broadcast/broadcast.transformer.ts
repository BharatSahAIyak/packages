import { MediaCategory, XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
import { TelemetryLogger } from "../../common/telemetry";

export class BroadcastTransformer implements ITransformer {

    private telemetryLogger: TelemetryLogger;

    constructor(readonly config: Record<string, any>) {
        this.telemetryLogger = new TelemetryLogger(this.config);
    }

    async transform(xmsg: XMessage): Promise<XMessage> {
        console.log("Broadcast transformer called.");
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} started!`, Date.now());
        xmsg.payload.subject = this.config.title;
        xmsg.payload.text = this.config.body;
        if (!xmsg.payload.media) {
            xmsg.payload.media = [];
        }
        xmsg.payload.media.push({
            url: this.config.image,
            category: MediaCategory.IMAGE_URL,
            caption: "Image",
        });
        xmsg.payload.media.push({
            url: this.config.icon,
            category: MediaCategory.IMAGE_URL,
            caption: "Icon_Image",
        });
        xmsg.payload.metaData = {
            ...xmsg.payload.metaData,
            deeplink: this.config.deeplink,
        }
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} finished!`, Date.now());
        return xmsg;
    }
}
