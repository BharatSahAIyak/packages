import { LLMTransformer } from "./llm.transformer";
import { MessageType, MessageState, XMessage } from "@samagra-x/xmessage";
import fetch from "jest-fetch-mock";

jest.mock("node-fetch", () => fetch);
let transformer: LLMTransformer;

const xmsg = {
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
        text: 'What is the capital of france?'
    },
    transformer: {
        metaData: {
            userHistory: []
        }
    }
};

describe("LLMTransformer Tests", () => {
    beforeEach(() => {
        transformer = new LLMTransformer({
            model: "gpt-3.5-turbo",
            openAIAPIKey: "mockkey",
            outboundURL: "mockOutboundURL",
            bhashiniUserId: "mockUserId",
            bhashiniAPIKey: "mockAPIKey",
            bhashiniURL: "mockBhashiniURL",
            temperature: 0.5,
            outputLanguage: "en",
        });
    });

    it("should transform XMessage correctly", async () => {
        
        const mockCreate = jest.fn().mockResolvedValueOnce({
            choices: [{ message: { content: "The capital of Spain is Madrid." } }]
        });
        jest.mock("openai", () => ({
            chat: {
                completions: {
                    create: mockCreate,
                },
            },
        }));        

        const transformerConfig = {
            model: "gpt-3.5-turbo",
            openAIAPIKey: "mockkey",
            outboundURL: "mockOutboundURL",
            bhashiniUserId: "mockUserId",
            bhashiniAPIKey: "mockAPIKey",
            bhashiniURL: "mockBhashiniURL",
            temperature: 0.5,
            outputLanguage: "en",
        };
        const transformer = new LLMTransformer(transformerConfig);
        const transformedXMsg = await transformer.transform(xmsg);
        expect(transformedXMsg.payload.text).toBe(
            "The capital of France is Paris."
        );
        expect(transformedXMsg.payload.media).toEqual([]);
        expect(transformedXMsg.to).toEqual({
            userID: "admin",
            bot: true,
            meta: new Map(
                Object.entries({
                    botMobileNumber: "919999999999",
                })
            ),
        });
        expect(transformedXMsg.from).toEqual({
            userID: "9999999999",
        });
    });

    it('should transform XMessage correctly when the input message is a non-English text', async () => {
        const mockCreate = jest.fn().mockResolvedValueOnce({
            choices: [{ message: { content: "The capital of Spain is Madrid." } }]
        });
        jest.mock("openai", () => ({
            chat: {
                completions: {
                    create: mockCreate,
                },
            },
        }));

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
                text: '¿Cuál es la capital de España?'
            },
            transformer: {
                metaData: {
                    userHistory: []
                }
            }
        };
        
        const transformedXMessage = await transformer.transform(xmsgNonEnglish);
        expect(transformedXMessage.payload.text).toContain("Madrid");
    });

    it('should throw error if model is not defined', async () => {
        const transformer = new LLMTransformer({ openAIAPIKey: 'mockApiKey' });
        const config = {
            openAIAPIKey: 'mockkey',
            outboundURL: 'mockOutboundURL',
            bhashiniUserId: 'mockUserId',
            bhashiniAPIKey: 'mockAPIKey',
            bhashiniURL: 'mockBhashiniURL',
            temperature: 0.5,
            outputLanguage: 'en'
        }
        await expect(transformer.transform(xmsg)).rejects.toThrow('`model` not defined in LLM transformer');
    });

    it('should initialize xmsg.transformer.metaData.userHistory if not present', async () => {
        const transformer = new LLMTransformer({ openAIAPIKey: 'mockkey', model: 'gpt-3.5-turbo' }); // Provide the correct API key
        const transformedXMessage = await transformer.transform(xmsg);
        expect(transformedXMessage.transformer?.metaData?.userHistory).toEqual([]);
    });

    it('should call sendMessage method with transformed XMessage when enableStream is false', async () => {
        const transformer = new LLMTransformer({
            openAIAPIKey: 'mockkey',
            model: 'gpt-3.5-turbo',
            outboundURL: 'mockOutboundURL'
        });
        transformer.sendMessage = jest.fn();
        const transformedMessage = await transformer.transform(xmsg);
        expect(transformedMessage).toBeDefined();
        expect(transformer.sendMessage).toHaveBeenCalled();
        expect(transformer.sendMessage).toHaveBeenCalledWith(transformedMessage);
        expect(transformedMessage.payload.text).toContain("Paris");
    });

    it('should create an instance of LLMTransformer with valid configuration properties', () => {
        const config = {
            openAIAPIKey: 'mockkey',
            model: 'gpt-3.5-turbo',
            outboundURL: 'mockOutboundURL'
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
            payload: {},
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
