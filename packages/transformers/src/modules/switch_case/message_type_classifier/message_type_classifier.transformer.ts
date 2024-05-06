import { MessageType, XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common";

export class MessageTypeClassifierTransformer implements ITransformer {

    readonly config: Record<string, any>;

    constructor(config: Record<string, any>) {
        this.config = config;
    }

    async transform(xmsg: XMessage): Promise<XMessage> {
        xmsg.transformer!.metaData!.state = xmsg.messageType ?? MessageType.TEXT;
        return xmsg;
    }
}