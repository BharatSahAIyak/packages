import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
import get from 'lodash/get';
import set from 'lodash/set';

export class FieldSetterTransformer implements ITransformer {

    /// Accepted parameters:
    /// setters: Record<string, string> : This defines the fields that need to be set,
    ///          where the `key` is the parameter which needs to be set in `XMessage`
    ///          and `value` is the parameter in `XMessage` which should be used as value.
    ///          If `value` is a normal string or JSON, the value will be used directly, if
    ///          the value is enclosed in {} like {xmsg:payload.text} or {history:payload.text},
    ///          it will be extracted from `XMessage` or from the most recent history message.
    constructor(
        readonly config: Record<string, any>,
    ) { }

    async transform(xmsg: XMessage): Promise<XMessage> {
        console.log("Field Setter called.");
        if (!this.config.setters) {
            throw new Error('`config.setters` is a required parameter!');
        }
        const xmsgCopy = { ...xmsg };
        const setters: Record<string, string> = this.config.setters;
        Object.entries(setters).forEach((entry) => {
            set(xmsgCopy, entry[0], this.getResolvedValue(entry[1], xmsg));
        });
        return xmsgCopy;
    }

    private getResolvedValue(value: string, xmsg: XMessage): string | JSON {
        const xmsgPlaceholder = /\{msg:([^}]*)\}/g;
        const historyPlaceholder = /\{history:([^}]*)\}/g;
        const replacements: Record<string, any> = {};
        let matched;
        if (typeof value === 'string') {
            while ((matched = xmsgPlaceholder.exec(value)) !== null) {
                replacements[matched[0]] = get(xmsg, matched[1]);
            }
            while ((matched = historyPlaceholder.exec(value)) !== null) {
                replacements[matched[0]] = get(xmsg.transformer?.metaData?.userHistory[0] ?? {}, matched[1]);
            }
            Object.entries(replacements).forEach((replacement) => {
                value = value.replaceAll(replacement[0], replacement[1]);
            });
        }
        return value;
    }
}
