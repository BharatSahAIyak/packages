import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common";

export class SimpleRetryTransformer implements ITransformer {

    /// Accepted config properties:
    ///     retries: string: Number of reties before failure. Default is 1. (optional)
    ///     delay: number: Delay in milliseconds before next retry. Default is 0. (optional)
    constructor(readonly config: Record<string, any>) { }

    async transform(xmsg: XMessage): Promise<XMessage> {
        if (!xmsg.transformer) {
            xmsg.transformer = {
                metaData: {},
            }
        }
        this.config.delay = this.config.delay ?? 0;
        if (!xmsg.transformer.metaData!.retryCount || xmsg.transformer.metaData!.retryCount < (this.config.retries ?? 1)) {
            xmsg.transformer.metaData!.retryCount = (xmsg.transformer.metaData!.retryCount || 0) + 1;
            xmsg.transformer.metaData!.state = 'retry';
            await this.delay(this.config.delay);
        }
        else {
            delete xmsg.transformer.metaData!.retryCount;
            xmsg.transformer.metaData!.state = 'error';
        }
        console.log(`SIMPLE_RETRY count: ${xmsg.transformer.metaData!.retryCount}`);
        return xmsg;
    }

    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
