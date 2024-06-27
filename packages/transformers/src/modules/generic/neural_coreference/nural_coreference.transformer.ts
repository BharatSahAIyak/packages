import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
import OpenAI from 'openai';
import { Events } from "@samagra-x/uci-side-effects";

export class NeuralCoreferenceTransformer implements ITransformer {

    /// Accepted config properties:
    ///     prompt: GPT prompt used to get coreferenced output.
    ///     APIKey: openAI API key.
    ///     model: openAI API key.
    constructor(readonly config: Record<string, any>) { }

    async transform(xmsg: XMessage): Promise<XMessage> {
        const startTime = Date.now();
        this.sendLogTelemetry(xmsg, `${this.config.transformerId} started!`, startTime);
        console.log("NEURAL_COREFERENCE transformer called.");
        if (!xmsg.transformer?.metaData?.userHistory || !xmsg.transformer?.metaData?.userHistory?.length) {
            this.sendErrorTelemetry(xmsg, "UserHistory not found! Returning original XMessage in NEURAL_COREFERENCE transformer");
            console.log("UserHistory not found! Returning original XMessage in NEURAL_COREFERENCE transformer")
            return xmsg
        };
        if (!this.config.prompt) {
            this.sendErrorTelemetry(xmsg, '`prompt` not defined in NEURAL_COREFERENCE transformer');
            throw new Error('`prompt` not defined in NEURAL_COREFERENCE transformer');
        }
        if (!this.config.APIKey) {
            this.sendErrorTelemetry(xmsg, '`APIKey` not defined in NEURAL_COREFERENCE transformer');
            throw new Error('`APIKey` not defined in NEURAL_COREFERENCE transformer');
        }
        if (!this.config.model) {
            this.sendErrorTelemetry(xmsg, '`Model` not defined in NEURAL_COREFERENCE transformer, using gpt-3.5-turbo.');
        }
        this.config.prompt = [{
            role: "user",
            content: this.config.prompt
            .replace('{{user_history}}',`${xmsg.transformer?.metaData?.userHistory.map((message: any)=>message.from == 'admin' ? `AI:${message.payload.text}`: `USER:${message.payload.text}`).join("\n")}`)
            .replace('{{user_question}}',xmsg.payload.text)
        }];
        const openai = new OpenAI({apiKey: this.config.APIKey});
        const response: any = await openai.chat.completions.create({
            model: this.config.model || 'gpt-3.5-turbo',
            messages: this.config.prompt
        }).catch((ex) => {
            this.sendErrorTelemetry(xmsg, `NEURAL_COREFERENCE failed. Reason: ${ex}`);
            console.error(`NEURAL_COREFERENCE failed. Reason: ${ex}`);
            throw ex;
        });
        let userArray = response["choices"][0].message.content?.split('User: ');
        xmsg.payload.text = userArray[userArray.length - 1];
        this.sendLogTelemetry(xmsg, `${this.config.transformerId} finished!`, startTime);
        return xmsg;
    }

    private async sendErrorTelemetry(xmsg: XMessage, error: string) {
        const xmgCopy = {...xmsg};
        xmgCopy.transformer!.metaData!.errorString = error;
        this.config.eventBus.pushEvent({
          eventName: Events.CUSTOM_TELEMETRY_EVENT_ERROR,
          transformerId: this.config.transformerId,
          eventData: xmgCopy,
          timestamp: Date.now(),
        })
    }

    private async sendLogTelemetry(xmsg: XMessage, log: string, startTime: number) {
        const xmgCopy = {...xmsg};
        xmgCopy.transformer!.metaData!.telemetryLog = log;
        xmgCopy.transformer!.metaData!.stateExecutionTime = Date.now() - startTime;
        this.config.eventBus.pushEvent({
          eventName: Events.CUSTOM_TELEMETRY_EVENT_LOG,
          transformerId: this.config.transformerId,
          eventData: xmgCopy,
          timestamp: Date.now(),
        })
    }
}
