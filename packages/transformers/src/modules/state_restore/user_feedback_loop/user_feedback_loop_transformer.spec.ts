import { XMessage } from "@samagra-x/xmessage";
import { UserFeedbackLoopTransformer } from "./user_feedback_loop_transformer";

describe('UserFeedbackLoopTransformer', () => {
    let transformer: UserFeedbackLoopTransformer;
    let xmsg: XMessage;

    beforeEach(() => {
        transformer = new UserFeedbackLoopTransformer({ restoreState: 'previous_state' });
        xmsg = {
            payload: {},
            transformer: {
                metaData: {}
            }
        } as XMessage;
    });

    it('should set the restore state and prompt if provided', async () => {
        const prompt = 'Please provide your feedback';
        const restoreState = 'previous_state';
        const transformerWithPrompt = new UserFeedbackLoopTransformer({ restoreState, prompt });
        const result = await transformerWithPrompt.transform(xmsg);
        expect(result.transformer?.metaData!.restoreState).toBe(restoreState);
        expect(result.payload!.text).toBe(prompt);
    });

    it('should throw an error if prompt is not provided and payload text is not present', async () => {
        const transformerWithoutPrompt = new UserFeedbackLoopTransformer({ restoreState: 'previous_state' });
        await expect(transformerWithoutPrompt.transform(xmsg)).rejects.toThrow('prompt or `XMessage.payload.text` is required!');
    });

    it('should throw an error if restoreState is not provided', async () => {
        const transformerWithoutRestoreState = new UserFeedbackLoopTransformer({ prompt: 'Please provide your feedback' });
        await expect(transformerWithoutRestoreState.transform(xmsg)).rejects.toThrow('restoreState is required!');
    });

    it('should set the restore state and use payload text as prompt if prompt is not provided', async () => {
        const restoreState = 'previous_state';
        const prompt = 'Please provide your feedback';
        xmsg.payload!.text = prompt;
        const result = await transformer.transform(xmsg);
        expect(result.transformer?.metaData!.restoreState).toBe(restoreState);
        expect(result.payload!.text).toBe(prompt);
    });
});
