import { XMessage, MessageType, MessageState } from "@samagra-x/xmessage";
import { NeuralCoreferenceTransformer } from "./nural_coreference.transformer";

class FormDataMock {
  append(key: string, value: string) { }
}
(global as any).FormData = FormDataMock;

const mockXMessage: XMessage = {
  messageType: MessageType.TEXT,
  messageId: {
    Id: "1234567890",
    channelMessageId: "1234567890",
  },
  to: {
    userID: "user123",
  },
  from: {
    userID: "admin",
    bot: true,
    meta: new Map(Object.entries({ botMobileNumber: "919999999999" })),
  },
  channelURI: "",
  providerURI: "",
  timestamp: 4825,
  messageState: MessageState.REPLIED,
  payload: {
    text: "Test query",
  },
  transformer: {
    metaData: {
      userHistory: [
        { from: { bot: true }, payload: { text: "History message 1" } },
        { from: { bot: false }, payload: { text: "History message 2" } },
      ],
    },
  },
};

describe("NeuralCoreferenceTransformer", () => {
  describe("transform", () => {
    it("should throw an error when `openAIAPIKey` is not defined", async () => {
      const config = {
        prompt: "Prompt",
      };
      const transformer = new NeuralCoreferenceTransformer(config);

      await expect(transformer.transform(mockXMessage)).rejects.toThrow(
        "`openAIAPIKey` not defined in NEURAL_COREFERENCE transformer"
      );
    });

    it("should throw an error when `prompt` is not defined", async () => {
      const config = {
        openAIAPIKey: "api_key",
      };
      const transformer = new NeuralCoreferenceTransformer(config);
      await expect(transformer.transform(mockXMessage)).rejects.toThrow(
        "`prompt` not defined in NEURAL_COREFERENCE transformer"
      );
    });

    it("should transform XMessage with UserHistory", async () => {

      const openAIAPIKey = process.env.OPENAI_API_KEY;

      if (!openAIAPIKey) {
        throw new Error('OpenAI API key is not provided.');
      }

      const openAIConfig = { prompt: 'What is the capital of France?', openAIAPIKey };

      const transformer = new NeuralCoreferenceTransformer(openAIConfig);

      const transformedXmsg = await transformer.transform(mockXMessage);

      expect(transformedXmsg.payload.text).toEqual(
        "The capital of France is Paris."
      );
    });
  });
});