import { XMessage, MessageType, MessageState } from "@samagra-x/xmessage";
import { DocRetrieverTransformer } from "./doc_retriever.transformer";
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("DocRetrieverTransformer", () => {
    let transformer: DocRetrieverTransformer;
    let mockXMessage: XMessage;

    beforeEach(() => {
        const config = {
            url: "http://example.com",
            documentIds: ["doc1", "doc2"],
            staticNoContentResponse: "No documents found",
            topK: 10
        };
        transformer = new DocRetrieverTransformer(config);

        mockXMessage = {
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
                text: "Testing bot",
            },
        };
    });

    describe("transform", () => {
        it("should retrieve chunks and attach them to metaData.retrievedChunks when documents are found", async () => {
            const mockedResponse = [
                { chunkId: "chunk1", content: "Chunk content 1" },
                { chunkId: "chunk2", content: "Chunk content 2" }
            ];
            mockedAxios.get.mockResolvedValue({ data: mockedResponse });

            const transformedMessage = await transformer.transform(mockXMessage);

            expect(transformedMessage.transformer!.metaData!.retrievedChunks).toEqual(mockedResponse);
            expect(transformedMessage.transformer!.metaData!.state).toEqual("if");
        });

        it("should set state to 'else' and attach staticNoContentResponse to payload.text when no documents are found", async () => {
            mockedAxios.get.mockResolvedValue({ data: [] });
            mockXMessage.payload.metaData = '{}' 
            const transformedMessage = await transformer.transform(mockXMessage);

            expect(transformedMessage.transformer!.metaData!.state).toEqual("else");
            expect(transformedMessage.payload!.text).toEqual("No documents found");
            expect(transformedMessage.payload!.metaData).toEqual(expect.stringContaining('"staticResponse":true'));
        });

        it("should throw error when 'url' is not defined in the configuration", async () => {
            const config = {};
            const transformerWithoutUrl = new DocRetrieverTransformer(config);

            await expect(transformerWithoutUrl.transform(mockXMessage)).rejects.toThrow("`url` not defined in DOC_RETRIEVER transformer");
        });
    });
});
