import fetch from "jest-fetch-mock";
jest.mock("node-fetch", () => require("jest-fetch-mock"));

import { LLMTransformer } from "./llm.transformer";
import { MessageType, MessageState, XMessage } from "@samagra-x/xmessage";

const openai200normal = {
    "id": "cmpl-8Y1uU3RVsY9kkGnQrSE7rmWcdHNvk",
    "object": "text_completion",
    "created": 1703121186,
    "model": "gpt-3.5-turbo-instruct",
    "choices": [
        {
            "message": {
                content: "The capital of France is Paris.",
            },
            "index": 0,
            "logprobs": null,
            "finish_reason": "stop"
        }
    ],
    "usage": {
        "prompt_tokens": 142,
        "completion_tokens": 42,
        "total_tokens": 184
    }
};

const eventBus = {
    pushEvent: (event: any) => {}
}

let mockOpenAIresponses = {
    create: openai200normal,
};

jest.mock('openai', () => {
    return jest.fn().mockImplementation(() => {
        return {
            chat: {
                completions: {
                    create: jest.fn().mockImplementation(async () => { return mockOpenAIresponses.create; })
                }
            }
        }
    })
});

let transformer: LLMTransformer;
let xmsg: XMessage;

describe("LLMTransformer Tests", () => {
    beforeEach(() => {
        transformer = new LLMTransformer({
            model: "gpt-3.5-turbo",
            APIKey: "mockkey",
            outboundURL: "mockOutboundURL",
            bhashiniUserId: "mockUserId",
            bhashiniAPIKey: "mockAPIKey",
            bhashiniURL: "mockBhashiniURL",
            temperature: 0.5,
            outputLanguage: "en",
            eventBus
        });

        xmsg = {
            messageType: MessageType.TEXT,
            messageId: {
                Id: "4305161194925220864-131632492725500592",
                channelMessageId: "4305161194925220864-131632492725500592",
            },
            to: {
                userID: "9999999999",
            },
            from: {
                userID: "admin",
                bot: true,
                meta: new Map(Object.entries({
                    botMobileNumber: "919999999999",
                })),
            },
            channelURI: "",
            providerURI: "",
            timestamp: 4825,
            messageState: MessageState.REPLIED,
            payload: {
                text: 'What is the capital of france?',
                metaData: {}
            },
            transformer: {
                metaData: {
                    userHistory: []
                }
            }
        };
    });

    it("should transform XMessage correctly", async () => {
        const transformerConfig = {
            model: "gpt-3.5-turbo",
            APIKey: "mockkey",
            outboundURL: "mockOutboundURL",
            bhashiniUserId: "mockUserId",
            bhashiniAPIKey: "mockAPIKey",
            bhashiniURL: "mockBhashiniURL",
            temperature: 0.5,
            outputLanguage: "en",
            eventBus
        };
        const transformer = new LLMTransformer(transformerConfig);
        const transformedXMsg = await transformer.transform(xmsg);
        expect(transformedXMsg.payload.text).toBe(
            "The capital of France is Paris."
        );
        expect(transformedXMsg.payload.media).toEqual([]);
        expect(transformedXMsg.to).toEqual(xmsg.to);
        expect(transformedXMsg.from).toEqual(xmsg.from);
    });

    it('should transform XMessage correctly when the input message is a non-English text', async () => {
        const xmsgNonEnglish = {
            messageType: MessageType.TEXT,
            messageId: {
                Id: "4305161194925220864-131632492725500592",
                channelMessageId: "4305161194925220864-131632492725500592",
            },
            to: {
                userID: "9999999999",
            },
            from: {
                userID: "admin",
                bot: true,
                meta: new Map(Object.entries({
                    botMobileNumber: "919999999999",
                })),
            },
            channelURI: "",
            providerURI: "",
            timestamp: 4825,
            messageState: MessageState.REPLIED,
            payload: {
                text: '¿Cuál es la capital de España?',
                metaData: {}
            },
            transformer: {
                metaData: {
                    userHistory: []
                }
            }
        };

        const transformedXMessage = await transformer.transform(xmsgNonEnglish);
        expect(transformedXMessage.payload.text).toContain("France");
    });

    it('should throw error if model is not defined', async () => {
        const transformer = new LLMTransformer({
            APIKey: 'mockApiKey',
            eventBus
        });
        const config = {
            APIKey: 'mockkey',
            outboundURL: 'mockOutboundURL',
            bhashiniUserId: 'mockUserId',
            bhashiniAPIKey: 'mockAPIKey',
            bhashiniURL: 'mockBhashiniURL',
            temperature: 0.5,
            outputLanguage: 'en',
            eventBus
        }
        await expect(transformer.transform(xmsg)).rejects.toThrow('`model` not defined in LLM transformer');
    });

    it('should create an instance of LLMTransformer with valid configuration properties', () => {
        const config = {
            APIKey: 'mockkey',
            model: 'gpt-3.5-turbo',
            outboundURL: 'mockOutboundURL',
            eventBus
        };
        const transformer = new LLMTransformer(config);
        expect(transformer.config).toEqual(config);
        expect(transformer.sendMessage).toBeInstanceOf(Function);
        expect(transformer.transform).toBeInstanceOf(Function);
    })

    it('should respect responseFormat in transformer config', () => {
        const config = {
            APIKey: 'mockkey',
            model: 'gpt-3.5-turbo',
            outboundURL: 'mockOutboundURL',
            response_format: {
                "type": "json_schema",
                "json_schema": {
                    "name": "reasoning_schema",
                    "strict": true,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "reasoning_steps": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                },
                                "description": "The reasoning steps leading to the final conclusion."
                            },
                            "answer": {
                                "type": "string",
                                "description": "The final answer, taking into account the reasoning steps."
                            }
                        },
                        "required": ["reasoning_steps", "answer"],
                        "additionalProperties": false
                    }
                }
            },
            eventBus
        };
        const transformer = new LLMTransformer(config);
        expect(transformer.config).toEqual(config);
        expect(transformer.sendMessage).toBeInstanceOf(Function);
        expect(transformer.transform).toBeInstanceOf(Function);
    })

    it('should handle empty input message payload', async () => {
        const xmsgEmptyPayload = {
            messageType: MessageType.TEXT,
            messageId: {
                Id: "4305161194925220864-131632492725500592",
                channelMessageId: "4305161194925220864-131632492725500592",
            },
            to: {
                userID: "9999999999",
            },
            from: {
                userID: "admin",
                bot: true,
                meta: new Map(Object.entries({
                    botMobileNumber: "919999999999",
                })),
            },
            channelURI: "",
            providerURI: "",
            timestamp: 4825,
            messageState: MessageState.REPLIED,
            payload: {
                metaData: {}
            },
            transformer: {
                metaData: {
                    userHistory: []
                }
            }
        };
        await expect(transformer.transform(xmsgEmptyPayload)).rejects.toThrow(
            "`xmsg.payload.text` not defined in LLM transformer"
        );
    });

});
