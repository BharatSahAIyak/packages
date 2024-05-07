import { MessageState, MessageType, XMessage } from "@samagra-x/xmessage";
import { MessageTypeClassifierTransformer } from "./message_type_classifier.transformer";

describe("MessageTypeClassifierTransformer", () => {
    describe("Transformer tests", () => {
        it("Should output correct message type", async () => {
            const msg: XMessage = {
                messageType: MessageType.HSM,
                messageId: {
                    Id: '00000000-0000-0000-000000000000'
                },
                to: {
                    userID: '00000000-0000-0000-000000000001'
                },
                from: {
                    userID: '00000000-0000-0000-000000000002'
                },
                channelURI: "Pwa",
                providerURI: "Pwa",
                timestamp: 0,
                messageState: MessageState.REPLIED,
                payload: {},
                transformer: {
                    metaData: {}
                }
            }
            const transformer = new MessageTypeClassifierTransformer({});
            expect((await transformer.transform(msg)).transformer!.metaData!.state).toBe(MessageType.HSM);
            msg.messageType = MessageType.AUDIO;
            expect((await transformer.transform(msg)).transformer!.metaData!.state).toBe(MessageType.AUDIO);
        });

        it("Default message type is TEXT", async () => {
            //@ts-ignore
            const msg: XMessage = {
                messageId: {
                    Id: '00000000-0000-0000-000000000000'
                },
                to: {
                    userID: '00000000-0000-0000-000000000001'
                },
                from: {
                    userID: '00000000-0000-0000-000000000002'
                },
                channelURI: "Pwa",
                providerURI: "Pwa",
                timestamp: 0,
                messageState: MessageState.REPLIED,
                payload: {},
                transformer: {
                    metaData: {}
                }
            };
            const transformer = new MessageTypeClassifierTransformer({});
            expect((await transformer.transform(msg)).transformer!.metaData!.state).toBe(MessageType.TEXT);
        });
    });
});