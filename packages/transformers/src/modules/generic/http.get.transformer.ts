import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../common";

export class HttpGetTransformer implements ITransformer {

    constructor(
        private readonly config: Record<string, any>
    ) { }

    async transform(xmsg: XMessage): Promise<XMessage> {
        console.log("HTTP GET transformer used with: " + JSON.stringify(xmsg));
        return xmsg;
    }
}
