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

const mockOpenAIresponses = {
    create: jest.fn(() => openai200normal),
};

jest.mock('openai', () => {
    return jest.fn().mockImplementation(() => {
        return {
            chat: {
                completions: {
                    create: jest.fn().mockImplementation(async () => { return mockOpenAIresponses.create(); })
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

    it('transformer does not modify original XMessage object when streaming is enabled', async () => {
        const transformerConfig = {
            model: "gpt-3.5-turbo",
            APIKey: "mockkey",
            outboundURL: "mockOutboundURL",
            bhashiniUserId: "mockUserId",
            bhashiniAPIKey: "mockAPIKey",
            bhashiniURL: "mockBhashiniURL",
            temperature: 0.5,
            outputLanguage: "en",
            eventBus,
            enableStream: true,
        };
        const transformer = new LLMTransformer(transformerConfig);
        jest.spyOn(mockOpenAIresponses, 'create').mockReturnValue([
            {
                choices: [{
                    delta: {
                        content: 'Hello there.',
                    }
                }]
            },
            {
                choices: [{
                    delta: {
                        content: ' How are you.',
                    }
                }]
            }
        ] as any);
        jest.spyOn(transformer, 'sendMessage').mockImplementation(async (data) => {
            // sendMessage should have been called with copy of XMessage.
            expect(data.messageId.Id != xmsg.messageId.Id).toBe(true);
            expect(data.from.userID).toStrictEqual(xmsg.to.userID);
            expect(data.to.userID).toStrictEqual(xmsg.from.userID);
            // check whether actual payload is set.
            expect(data.payload.text).toEqual('Hello there.');
        });
        const transformedXMsg = await transformer.transform(xmsg);
        // Original message id is not modified.
        expect(transformedXMsg.messageId.Id).toEqual(xmsg.messageId.Id);
        // Original message from, to is not modified.
        expect(transformedXMsg.to).toEqual(xmsg.to);
        expect(transformedXMsg.from).toEqual(xmsg.from);
        // Check `messageIdChanged` is only set for messages
        // directly sent by LLM.
        expect(transformedXMsg.payload.metaData?.messageIdChanged).toBeUndefined();
        // Check if new message id used for streams has been preserved in metaData.
        expect(transformedXMsg.transformer?.metaData?.streamMessageId).toBeDefined();
    });

    it("should use default prompt when neither config.prompt nor transformer.metaData.prompt are available", async () => {
        jest.spyOn(mockOpenAIresponses, 'create').mockReturnValue({
            choices: [{
                message: {
                    content: "Default prompt response",
                }
            }]
        } as any);

        const transformer = new LLMTransformer({
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

        const transformedXMsg = await transformer.transform(xmsg);

        const expectedPrompt = "You are am assistant who helps with answering questions for users based on the search results. If question is not relevant to search reults/corpus, refuse to answer";
        expect(transformedXMsg.transformer?.metaData?.prompt[0].content).toBe(expectedPrompt);
        expect(typeof transformedXMsg.transformer?.metaData?.prompt).toBe("object");

        
    });

    it("should use config.prompt when available, taking precedence over transformer.metaData.prompt", async () => {
        const configPrompt = "You are a helpful assistant. Answer the following question:";
        jest.spyOn(mockOpenAIresponses, 'create').mockReturnValue({
            choices: [{
                message: {
                    content: "Config prompt response",
                }
            }]
        } as any);

        const transformer = new LLMTransformer({
            model: "gpt-3.5-turbo",
            APIKey: "mockkey",
            outboundURL: "mockOutboundURL",
            bhashiniUserId: "mockUserId",
            bhashiniAPIKey: "mockAPIKey",
            bhashiniURL: "mockBhashiniURL",
            temperature: 0.5,
            outputLanguage: "en",
            eventBus,
            prompt: configPrompt
        });

        xmsg.transformer!.metaData!.prompt = "This prompt should be ignored";

        const transformedXMsg = await transformer.transform(xmsg);

        expect(transformedXMsg.transformer?.metaData?.prompt[0].content).toBe(configPrompt);
        expect(typeof transformedXMsg.transformer?.metaData?.prompt).toBe("object");
    });

    it("should use transformer.metaData.prompt when available and config.prompt is not set", async () => {
        const metaDataPrompt = "You are an AI language model. Please provide a concise answer:";
        jest.spyOn(mockOpenAIresponses, 'create').mockReturnValue({
            choices: [{
                message: {
                    content: "Metadata prompt response",
                }
            }]
        } as any);

        xmsg.transformer!.metaData!.prompt = metaDataPrompt;

        const transformer = new LLMTransformer({
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

        const transformedXMsg = await transformer.transform(xmsg);

        expect(transformedXMsg.transformer?.metaData?.prompt[0].content).toBe(metaDataPrompt);
        expect(typeof transformedXMsg.transformer?.metaData?.prompt).toBe("object");
    });

    it("should replace {{date}} placeholder in the prompt with current date", async () => {
        const datePrompt = "Today is {{date}}. You are a helpful assistant. Answer the following question:";
        jest.spyOn(mockOpenAIresponses, 'create').mockReturnValue({
            choices: [{
                message: {
                    content: "Date prompt response",
                }
            }]
        } as any);

        const transformer = new LLMTransformer({
            model: "gpt-3.5-turbo",
            APIKey: "mockkey",
            outboundURL: "mockOutboundURL",
            bhashiniUserId: "mockUserId",
            bhashiniAPIKey: "mockAPIKey",
            bhashiniURL: "mockBhashiniURL",
            temperature: 0.5,
            outputLanguage: "en",
            eventBus,
            prompt: datePrompt
        });

        const transformedXMsg = await transformer.transform(xmsg);
        expect(transformedXMsg.transformer?.metaData?.prompt[0].content).toMatch(
            /Today is [A-Z][a-z]{2} \d{2}, \d{4} \([A-Z][a-z]+\)\. You are a helpful assistant\. Answer the following question:/
        );
        expect(typeof transformedXMsg.transformer?.metaData?.prompt).toBe("object");
    });
});


