import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
import { Events } from "@samagra-x/uci-side-effects";

export class XMessageTransform implements ITransformer {

    constructor(readonly config: Record<string, any>) { }


    async transform(xmsg: XMessage): Promise<XMessage> {
        const startTime = Date.now();
        this.sendLogTelemetry(xmsg, `${this.config.transformerId} Finished`, startTime);
        if (!xmsg.paylaod.buttons) {
            throw new Error('config.buttons is required');
        }

        if (!this.config.rawData) {
            throw new Error('config.rawData is required');
        }
        const xmsgCopy: Partial<XMessage> = {};
        xmsgCopy.payload = xmsg.payload;
        xmsgCopy.transformer = xmsg.transformer;
        xmsgCopy.rawData = this.config.rawData;

        return xmsgCopy as XMessage;


    }
    private async sendErrorTelemetry(xmsg: XMessage, error: string) {
        const xmgCopy = {...xmsg};
        xmgCopy.transformer!.metaData!.errorString = error;
        this.config.eventBus.pushEvent({
          eventName: Events.CUSTOM_TELEMETRY_EVENT_ERROR,
          transformerId: this.config.transformerId,
          eventData: xmgCopy,
          timestamp: Date.now(),
        })
    }

    private async sendLogTelemetry(xmsg: XMessage, log: string, startTime: number) {
        const xmgCopy = {...xmsg};
        xmgCopy.transformer!.metaData!.telemetryLog = log;
        xmgCopy.transformer!.metaData!.stateExecutionTime = Date.now() - startTime;
        this.config.eventBus.pushEvent({
          eventName: Events.CUSTOM_TELEMETRY_EVENT_LOG,
          transformerId: this.config.transformerId,
          eventData: xmgCopy,
          timestamp: Date.now(),
        })
    }
}