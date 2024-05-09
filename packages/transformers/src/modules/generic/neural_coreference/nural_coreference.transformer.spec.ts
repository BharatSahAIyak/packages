import { XMessage, MessageType, MessageState } from "@samagra-x/xmessage";
import { NeuralCoreferenceTransformer } from "./nural_coreference.transformer";

const eventBus = {
  pushEvent: (event: any) => {}
}

const openai200normal = {
  id: "cmpl-8Y1uU3RVsY9kkGnQrSE7rmWcdHNvk",
  object: "text_completion",
  created: 1703121186,
  model: "gpt-3.5-turbo-instruct",
  choices: [
    {
      message: {
        content: "The capital of France is Paris.",
      },
      index: 0,
      logprobs: null,
      finish_reason: "stop",
    },
  ],
  usage: {
    prompt_tokens: 142,
    completion_tokens: 42,
    total_tokens: 184,
  },
};

const mockOpenAIresponses = {
  create: openai200normal,
};

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(mockOpenAIresponses.create),
        },
      },
    };
  });
});

class FormDataMock {
  append(key: string, value: string) {}
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
    it("should throw an error when `APIKey` is not defined", async () => {
      const config = {
        prompt: "Prompt",
        eventBus
      };
      const transformer = new NeuralCoreferenceTransformer(config);

      await expect(transformer.transform(mockXMessage)).rejects.toThrow(
        "`APIKey` not defined in NEURAL_COREFERENCE transformer"
      );
    });

    it("should throw an error when `prompt` is not defined", async () => {
      const config = {
        APIKey: "api_key",
        eventBus
      };
      const transformer = new NeuralCoreferenceTransformer(config);
      await expect(transformer.transform(mockXMessage)).rejects.toThrow(
        "`prompt` not defined in NEURAL_COREFERENCE transformer"
      );
    });

    it("should transform XMessage with UserHistory", async () => {
      const APIKey = "apikey";
      const openAIConfig = {
        prompt: "What is the capital of France?",
        APIKey,
        eventBus
      };
      const transformer = new NeuralCoreferenceTransformer(openAIConfig);
      const transformedXmsg = await transformer.transform(mockXMessage);
      expect(transformedXmsg.payload.text).toEqual(
        "The capital of France is Paris."
      );
    });
  });
});