import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
import { Events } from "@samagra-x/uci-side-effects";

export class XMessageTransform implements ITransformer {

    constructor(readonly config: Record<string, any>) { }


    async transform(xmsg: XMessage): Promise<XMessage> {


        Object.keys(this.config.rawData).forEach(async (key) => {
            if (xmsg.payload.hasOwnProperty(key)) {
                if (key === 'text') {
                    if (await this.checkForRequiredFields(key, this.config.rawData[key])) {
                        xmsg.payload.text = this.config.rawData[key];
                    }
                    else {
                        this.sendErrorTelemetry(xmsg, 'Data not valid for text key');
                    }

                }
            }
            else if (key === 'media') {
                if (await this.checkForRequiredFields(key, this.config.rawData[key])) {
                    xmsg.payload.media = this.config.rawData[key];
                }
                else {
                    this.sendErrorTelemetry(xmsg, 'Data not valid for media key');
                }
            }
            else if (key === 'contactCard') {
                if (await this.checkForRequiredFields(key, this.config.rawData[key])) {
                    xmsg.payload.contactCard = this.config.rawData[key];
                }
                else {
                    this.sendErrorTelemetry(xmsg, 'Data not valid for contactCard key');
                }
            }
            else if (key === 'buttonChoices') {
                if (await this.checkForRequiredFields(key, this.config.rawData[key])) {
                    xmsg.payload.buttonChoices = this.config.rawData[key];
                }
                else {
                    this.sendErrorTelemetry(xmsg, 'Data not valid for buttonChoices key');
                }
            }
            else if (key === 'location') {
                if (await this.checkForRequiredFields(key, this.config.rawData[key])) {
                    xmsg.payload.location = this.config.rawData[key];
                }
                else {
                    this.sendErrorTelemetry(xmsg, 'Data not valid for location key');
                }
            }
            else {
                this.sendErrorTelemetry(xmsg, `Key ${key} not found in xmsg.payload`);
            }

        });
        return xmsg;



    }
    private async sendErrorTelemetry(xmsg: XMessage, error: string) {
        const xmgCopy = { ...xmsg };
        xmgCopy.transformer!.metaData!.errorString = error;
        this.config.eventBus.pushEvent({
            eventName: Events.CUSTOM_TELEMETRY_EVENT_ERROR,
            transformerId: this.config.transformerId,
            eventData: xmgCopy,
            timestamp: Date.now(),
        })
    }

    private async sendLogTelemetry(xmsg: XMessage, log: string, startTime: number) {
        const xmgCopy = { ...xmsg };
        xmgCopy.transformer!.metaData!.telemetryLog = log;
        xmgCopy.transformer!.metaData!.stateExecutionTime = Date.now() - startTime;
        this.config.eventBus.pushEvent({
            eventName: Events.CUSTOM_TELEMETRY_EVENT_LOG,
            transformerId: this.config.transformerId,
            eventData: xmgCopy,
            timestamp: Date.now(),
        })
    }
    private async checkForRequiredFields(key: string, Object: any) {
        if (key == 'text') {

            if (typeof Object !== 'string') {
                return false;

            }
            return true;
        }
        else if (key == 'media') {
            if (Object.category && !['image', 'audio', 'document', 'video'].includes(Object.category)) {
                return false;
            }
            if (Object.caption && typeof Object.caption !== 'string') {
                return false;
            }
            if (Object.url && typeof Object.url !== 'string') {
                return false;
            }
            if (Object.size && typeof Object.size !== 'number') {
                return false;
            }
            if (Object.mimeType && typeof Object.mimeType !== 'string') {
                return false;
            }
            return true;
        }
        else if (key == 'contactCard') {
            if (Object.header && Object.header.title && typeof Object.header.title !== 'string') {
                return false;
            }
            if (Object.header && Object.header.description && typeof Object.header.description !== 'string') {
                return false;
            }
            if (Object.footer && Object.footer.title && typeof Object.footer.title !== 'string') {
                return false;
            }
            if (Object.footer && Object.footer.description && typeof Object.footer.description !== 'string') {
                return false;
            }
            if (Object.content && Object.content.columns && typeof Object.content.columns !== 'number') {
                return false;
            }
            if (Object.content && Object.content.cells && !Array.isArray(Object.content.cells)) {
                return false;
            }
            return true;
        }
        else if (key == 'buttonChoices') {
            if (Object.isSearchable && typeof Object.isSearchable !== 'boolean') {
                return false;
            }
            if (Object.choices.length == 0) {
                return false;
            }
            return true;
        }
        else if (key == 'location') {
            if (Object.longitude && typeof Object.longitude !== 'number' && Object.longitude !== null) {
                return false;
            }
            if (Object.latitude && typeof Object.latitude !== 'number' && Object.latitude !== null) {
                return false;
            }
            if (Object.address && typeof Object.address !== 'string') {
                return false;
            }
            if (Object.url && typeof Object.url !== 'string') {
                return false;
            }
            if (Object.name && typeof Object.name !== 'string') {
                return false;
            }
            return true;
        }
        else {
            return false;
        }
    }
}