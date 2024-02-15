import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../common/transformer.interface";

export class HttpPostTransformer implements ITransformer {

    constructor(
        private readonly config: Record<string, any>
    ) { }

    async transform(xmsg: XMessage): Promise<XMessage> {
        console.log("HTTP POST transformer used with: " + JSON.stringify(xmsg));
        return xmsg;
    }
}
