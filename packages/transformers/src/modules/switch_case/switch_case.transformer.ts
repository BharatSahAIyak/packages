import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../common/transformer.interface";

export class SwitchCaseTransformer implements ITransformer{

    constructor(
        private readonly config: Record<string, any>
    ){}

    async transform(xmsg: XMessage): Promise<XMessage> {
        const selector = Math.floor(Math.random() * 4);
        console.log(`SWITCH_CASE called with selector: ${([1, 2, 3, 4])[selector]} and data: ${JSON.stringify(xmsg)}`)
        xmsg.transformer = {
            metaData: {
                state: ([1, 2, 3, 4])[selector],
            }
        }

        return xmsg;
    }
}