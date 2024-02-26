import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";

export class UserFeedbackLoopTransformer implements ITransformer {

    /// Accepted config properties:
    ///     prompt: string: A prompt to send the user to reply to. If not provided, `XMessage.payload.text` is required.
    ///     restoreState: string: The target state id to restore the state to.
    constructor(readonly config: Record<string, any>) { }

    async transform(xmsg: XMessage): Promise<XMessage> {
        console.log(`USER_FEEDBACK_LOOP called with: ${JSON.stringify(xmsg)}`);
        if (!this.config.prompt && !xmsg.payload.text) {
            throw new Error('prompt or `XMessage.payload.text` is required!');
        }
        if (!this.config.restoreState) {
            throw new Error('restoreState is required!');
        }
        if (!xmsg.transformer) {
            xmsg.transformer = {
                metaData: { }
            };
        }
        xmsg.transformer.metaData!.restoreState = this.config.restoreState;
        xmsg.payload.text = this.config.prompt || xmsg.payload.text;
        return xmsg;
    }
}
