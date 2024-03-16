import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";

export class UserFeedbackLoopTransformer implements ITransformer {

    /// Accepted config properties:
    ///     prompt: string: A prompt to send the user to reply to. If not provided, default `XMessage.payload` will be used.
    constructor(readonly config: Record<string, any>) { }

    async transform(xmsg: XMessage): Promise<XMessage> {
        console.log(`USER_FEEDBACK_LOOP called with: ${JSON.stringify(xmsg)}`);
        if (!this.config.restoreState) {
            throw new Error('restoreState is required!');
        }
        if (!xmsg.transformer) {
            xmsg.transformer = {
                metaData: { }
            };
        }
        // `config.restoreState` is an injected value, pulled from state.
        // This value is not supposed to be set externally.
        xmsg.transformer.metaData!.restoreState = this.config.restoreState;
        xmsg.payload.text = this.config.prompt || xmsg.payload.text;
        return xmsg;
    }
}
