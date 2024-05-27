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
    ///          the value is enclosed in {{}} like {{xmsg:payload.text}} or {{history:payload.text}},
    ///          it will be extracted from `XMessage` or from the most recent history message.
    ///          You can also use placeholders {{}} inside a JSON value.
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
            if (typeof entry[1] === 'string') {
                set(xmsgCopy, entry[0], this.getResolvedValue(entry[1], xmsg));
            }
            else {
                this.resolvePlaceholders(entry[1], xmsg);
                set(xmsgCopy, entry[0], entry[1]);
            }
        });
        return xmsgCopy;
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
}
