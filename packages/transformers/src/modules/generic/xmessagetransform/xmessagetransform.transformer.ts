import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
import { Events } from "@samagra-x/uci-side-effects";
import get from 'lodash/get';
import set from 'lodash/set';
import { replace } from "lodash";
export class XMessageTransform implements ITransformer {

    constructor(readonly config: Record<string, any>) { }


    async transform(xmsg: XMessage): Promise<XMessage> {


        console.log("Renderer called.");
        if (!this.config.rawData) {
            this.sendErrorTelemetry(xmsg, 'config.rawData is required');
            return xmsg;
        }
        const xmsgCopy = { ...xmsg };
        const rawData: Array<Object> = this.config.rawData as Array<Object>;
        
            for (const key in rawData) {
                if (Object.prototype.hasOwnProperty.call(rawData, key)) {
                    const element: any = rawData[key];
                    if (key == 'text') {
                        this.resolvePlaceholders(element, xmsg);
                        set(xmsgCopy, 'payload.text', element.value);
                    }
                    else if (key == 'media') {
                        this.resolvePlaceholders(element, xmsg);
                        set(xmsgCopy, 'payload.media.url', element.value);
                        set(xmsgCopy, 'payload.media.mediaCategory', element.mediaCategory);
                        set(xmsgCopy, 'payload.media.size', element.size);  
                        set(xmsgCopy, 'payload.media.caption', element.caption);
                        set(xmsgCopy, 'payload.media.mimeType', element.mimeType);

                    }
                    else if (key == 'contactCard') {
                        this.resolvePlaceholders(element, xmsg);
                        set(xmsgCopy, 'payload.contactCard.header', element.header);
                        set(xmsgCopy, 'payload.contactCard.footer', element.footer);
                       
                        const valueArray = JSON.parse(element.value);
                        for (let i = 0; i < valueArray.length; i++) {
                            set(xmsgCopy, `payload.contactCard.content.cells[${i}].title`, valueArray[i]);
                            set(xmsgCopy, `payload.contactCard.content.cells[${i}].description`, valueArray[i]);
                        }
                        
                        

                    }
                    else if (key == 'buttonChoices') {
                        this.resolvePlaceholders(element, xmsg);
                        set(xmsgCopy, 'payload.buttonChoices.isSearchable', element.isSearchable);
                        const valueArray = JSON.parse(element.value);
                        for (let i = 0; i < valueArray.length; i++) {
                            set(xmsgCopy, `payload.buttonChoices.choices[${i}]choices[${i}].key`, valueArray[i]);
                            set(xmsgCopy, `payload.buttonChoices.choices[${i}].text`, valueArray[i]);
                        }

                    }
                    else {
                        this.sendErrorTelemetry(xmsg, 'Invalid key provided in rawData.replacements');
                        return xmsg;
                    }
                }
            
        }

        return xmsgCopy;





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

    /// Recursively resolves all the placeholders inside a JSON.
    private resolvePlaceholders(jsonValue: Record<string, any>, xmsg: XMessage) {
        Object.entries(jsonValue).forEach(([key, value]) => {
            if (typeof value === 'string') {
                set(jsonValue, key, this.getResolvedValue(value, xmsg));
            }
            else {
                this.resolvePlaceholders(jsonValue[key], xmsg);
            }
        });
    }

    /// Gets resolved value of a string containing placeholders
    /// by extracting it from XMessage.
    private getResolvedValue(value: string, xmsg: XMessage): string {
        const xmsgPlaceholder = /\{\{msg:([^}]*)\}\}/g;
        const historyPlaceholder = /\{\{history:([^}]*)\}\}/g;
        const replacements: Record<string, any> = {};
        let matched;
        while ((matched = xmsgPlaceholder.exec(value)) !== null) {
            replacements[matched[0]] = get(xmsg, matched[1]);
        }
        while ((matched = historyPlaceholder.exec(value)) !== null) {
            replacements[matched[0]] = get(xmsg.transformer?.metaData?.userHistory[0] ?? {}, matched[1]);
        }
        Object.entries(replacements).forEach((replacement) => {
            value = value.replaceAll(replacement[0], replacement[1] ?? '');
        });
        return value;
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

}
