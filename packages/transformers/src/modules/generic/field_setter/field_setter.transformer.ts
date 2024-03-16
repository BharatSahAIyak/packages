import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
import get from 'lodash/get';
import set from 'lodash/set';

export class FieldSetterTransformer implements ITransformer {

    /// Accepted parameters:
    /// setters: Record<string, string> : This defines the fields that need to be set,
    ///          where the `key` is the parameter which needs to be set in `XMessage`
    ///          and `value` is the parameter in `XMessage` which should be used as value.
    ///          If `value` is a normal string, the value will be used directly, if the value
    ///          is enclosed in {} like {xmsg:payload.text} or {history:payload.text}, it will
    ///          be extracted from `XMessage` or from the most recent history message.
    constructor(
        readonly config: Record<string, any>,
    ) { }

    async transform(xmsg: XMessage): Promise<XMessage> {
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

    private getResolvedValue(value: string, xmsg: XMessage): string {
        const xmsgPlaceholder = /\{xmsg:(.*)\}/;
        const historyPlaceholder = /\{history:(.*)\}/;

        if (value.match(xmsgPlaceholder)) {
            return get(xmsg, value.match(xmsgPlaceholder)![1]);
        }
        else if (value.match(historyPlaceholder)) {
            return get(xmsg.transformer?.metaData?.userHistory.pop() ?? {}, value.match(historyPlaceholder)![1]);
        }
        else {
            return value;
        }
    }
}
