import { MediaCategory, XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
import get from 'lodash/get';
import set from 'lodash/set';
import { TelemetryLogger } from "../../common/telemetry";

export class BroadcastTransformer implements ITransformer {
    constructor(readonly config: Record<string, any>) { }

    private readonly telemetryLogger = new TelemetryLogger(this.config);

    async transform(xmsg: XMessage): Promise<XMessage> {
        console.log("Broadcast transformer called.");
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} started!`, Date.now());
        const xmsgCopy = { ...xmsg };
        xmsgCopy.payload.subject = this.config.title;
        xmsgCopy.payload.text = this.config.body;
        xmsgCopy.payload.media?.push({
            url: this.config.image,
            category: MediaCategory.IMAGE_URL,
            caption: "Image",
        })
        xmsgCopy.payload.media?.push({
            url: this.config.icon,
            category: MediaCategory.IMAGE_URL,
            caption: "Icon_Image",
        })
        xmsgCopy.payload.metaData = {
            deeplink: this.config.deeplink
        }
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} finished!`, Date.now());
        return xmsgCopy;
    }
}
