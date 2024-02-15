import { XMessage } from "@samagra-x/xmessage";

export interface ITransformer {
    transform(xmsg: XMessage): Promise<XMessage>
}
