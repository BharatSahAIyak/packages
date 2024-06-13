import { MessageState, MessageType, XMessage } from "@samagra-x/xmessage";
import { FieldSetterTransformer } from "./field_setter.transformer";

describe('Field Setter Tests', () => {
    let mockXMessage: XMessage;

    beforeEach(() => {
        mockXMessage = {
            to: {
              userID: "admin",
            },
            from: {
              userID: "mockUserId",
            },
            channelURI: "Whatsapp",
            providerURI: "Gupshup",
            messageState: MessageState.REPLIED,
            messageId: {
              Id: "00000000-0000-0000-0000-000000000000",
            },
            messageType: MessageType.TEXT,
            timestamp: 1715602492000,
            payload: {
              text: "Hello testing",
            },
            adapterId: "11111111-1111-1111-1111-111111111111",
            app: "22222222-2222-2222-222222222222",
            ownerId: "33333333-3333-3333-333333333333",
            orgId: "44444444-4444-4444-444444444444",
            transformer: {
                metaData: {
                    userHistory: [
                        {
                            "id": 11,
                            "app": "BOT_ID_1",
                            "messageType": "TEXT",
                            "channelMessageId": "CHANNEL_MESSAGE_ID_1",
                            "sessionId": "SESSION_ID_1",
                            "adapterId": "3073705e-7e9d-4b7b-96f8-0f2d84351628",
                            "orgId": "5a8d8a57-cd84-4670-8f75-e8ede4504752",
                            "ownerId": "2fc6a82e-0bd1-4e58-a752-98eba6211c9c",
                            "messageId": {
                                "Id": "fe9cdbdd-d04e-4db1-bf7e-653265b185e4"
                            },
                            "to": "USER_ID_2",
                            "from": "admin",
                            "channelURI": "Pwa",
                            "providerURI": "Pwa",
                            "timestamp": "2024-04-11T07:07:48.209Z",
                            "messageState": "REPLIED",
                            "lastMessageID": null,
                            "payload": {
                                "text": "Hello User",
                                "metaData": {}
                            },
                            "metaData": {
                                "currentState": "1",
                                "currentStateTimestamp": "1712819268157"
                            }
                        }
                    ]
                }
            }
        };
    });

    it('Works with strings without placeholders', async () => {
        const transformer = new FieldSetterTransformer({
            setters: {
                "payload.text": "hi there",
            }
        });
        const transformedMsg = await transformer.transform(mockXMessage);
        expect(transformedMsg.payload.text).toBe('hi there');
    });

    it('Does not error on non object or string fields', async () => {
        const transformer = new FieldSetterTransformer({
            setters: {
                "transformer.metaData.myVar": true,
                "transformer.metaData.myVar2": null,
                "transformer.metaData.myVar3": undefined,
                "transformer.metaData.myVar4": [1, 2, 4],
                "transformer.metaData.myVar5": 124,
            }
        });
        const transformedMsg = await transformer.transform(mockXMessage);
        expect(transformedMsg.transformer!.metaData!.myVar).toBe(true);
        expect(transformedMsg.transformer!.metaData!.myVar2).toBe(null);
        expect(transformedMsg.transformer!.metaData!.myVar3).toBe(undefined);
        expect(transformedMsg.transformer!.metaData!.myVar4).toStrictEqual([1, 2, 4]);
        expect(transformedMsg.transformer!.metaData!.myVar5).toBe(124);
    });

    it('Works with JSON without placeholders', async () => {
        const requiredValue = {
            "my key": "my value",
            "my key 2": "my value 2",
        };
        const transformer = new FieldSetterTransformer({
            setters: {
                "transformer.metaData.fakeData": requiredValue,
            }
        });
        const transformedMsg = await transformer.transform(mockXMessage);
        expect(transformedMsg.transformer!.metaData!.fakeData).toBe(requiredValue);
    });

    it('Works with string placeholders', async () => {
        const placeholderValue = "The current user is {{msg:from.userID}} and previous message was {{history:payload.text}}";
        const expectedValue = "The current user is mockUserId and previous message was Hello User";
        const transformer = new FieldSetterTransformer({
            setters: {
                "payload.text": placeholderValue,
            }
        });
        const transformedMsg = await transformer.transform(mockXMessage);
        expect(transformedMsg.payload.text).toBe(expectedValue);
    });

    it('Works with JSON placeholders', async () => {
        const placeholderValue1 = {
            myKey1: "{{msg:payload.text}}",
            myKey2: "hi testing",
            myKey3: {
                myNestedKey1: "{{history:channelURI}}",
                myNestedKey2: "{{msg:from.userID}}"
            }
        };
        const expectedValue1 = {
            myKey1: "Hello testing",
            myKey2: "hi testing",
            myKey3: {
                myNestedKey1: "Pwa",
                myNestedKey2: "mockUserId"
            }
        };
        const placeholderValue2 = {
            myKey4: "hi",
            myKey5: "{{msg:payload.text}}"
        }
        const expectedValue2 = {
            myKey4: "hi",
            myKey5: "Hello testing"
        }
        const transformer = new FieldSetterTransformer({
            setters: {
                "transformer.metaData.myProperty1": placeholderValue1,
                "transformer.metaData.myProperty2": placeholderValue2,
            }
        });
        const transformedMsg = await transformer.transform(mockXMessage);
        expect(transformedMsg.transformer!.metaData!.myProperty1).toStrictEqual(expectedValue1);
        expect(transformedMsg.transformer!.metaData!.myProperty2).toStrictEqual(expectedValue2);
    });

    it('Field Setter only modifies specified values', async () => {
        const xmsgCopy = JSON.parse(JSON.stringify(mockXMessage));
        const transformer = new FieldSetterTransformer({
            setters: {
                "payload.text": "hi user",
                "channelURI": "Pwa"
            }
        });
        const transformedMsg = await transformer.transform(mockXMessage);
        xmsgCopy.payload.text = '';
        transformedMsg.payload.text = '';
        transformedMsg.channelURI = '';
        xmsgCopy.channelURI = '';
        expect(xmsgCopy).toStrictEqual(transformedMsg);
    });
})
