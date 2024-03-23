import { XMessage, MessageType, MessageState } from "@samagra-x/xmessage";
import { SQLLLMTransformer } from "./sqlLLM.transformer";

const openai200normal = {
  "id": "cmpl-8Y1uU3RVsY9kkGnQrSE7rmWcdHNvk",
  "object": "text_completion",
  "created": 1703121186,
  "model": "gpt-3.5-turbo-instruct",
  "choices": [
      {
          "message": {
              content:"The capital of France is Paris.",
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

let mockOpenAIresponses = {
  create: openai200normal,
};

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => {
      return {
          chat:{
              completions: {
                  create: jest.fn().mockImplementation(async () => { return mockOpenAIresponses.create; })
              }
          }
      }
  })
});
class FormDataMock {
  append(key: string, value: string) {
  }
}
(global as any).FormData = FormDataMock;

(global.fetch as jest.Mock) = jest.fn();

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
};

describe("SQLLLMTransformer", () => {
  describe("transform", () => {
    it("should throw an error when `openAIAPIKey` is not defined", async () => {
      const config = {
        model: "model_name",
        xlsxIds: ["xlsx_id"],
        outputLanguage: "en",
        excelParserURL: "http://example.com",
      };
      const transformer = new SQLLLMTransformer(config);

      await expect(transformer.transform(mockXMessage)).rejects.toThrow(
        "`openAIAPIKey` not defined in SQLLLM transformer"
      );
    });

    it("should throw an error when `xlsxIds` is not defined", async () => {
      const config = {
        openAIAPIKey: "api_key",
        model: "model_name",
        outputLanguage: "en",
        excelParserURL: "http://example.com",
      };
      const transformer = new SQLLLMTransformer(config);
      await expect(transformer.transform(mockXMessage)).rejects.toThrow(
        "`xlsxIds` not defined in SQLLLM transformer"
      );
    });

    it("should throw an error when `excelParserURL` is not defined", async () => {
      const config = {
        openAIAPIKey: "api_key",
        model: "model_name",
        xlsxIds: ["xlsx_id"],
        outputLanguage: "en",
      };
      const transformer = new SQLLLMTransformer(config);
      await expect(transformer.transform(mockXMessage)).rejects.toThrow(
        "`excelParserURL` not defined in SQLLLM transformer"
      );
    });
    it("should throw an error when `model` is not defined", async () => {
      const config = {
        openAIAPIKey: "api_key",
        xlsxIds: ["xlsx_id"],
        outputLanguage: "en",
        excelParserURL: "http://example.com",
      };
      const transformer = new SQLLLMTransformer(config);
      await expect(transformer.transform(mockXMessage)).rejects.toThrow(
        "`model` not defined in SQLLLM transformer"
      );
    });
    it("should successfully process a message and return transformed message", async () => {
      const config = {
        openAIAPIKey: "api_key",
        model: "model_name",
        xlsxIds: ["xlsx_id"],
        outputLanguage: "en",
        excelParserURL: "http://example.com",
      };
      const transformer = new SQLLLMTransformer(config);
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          data: {
            url: "http://example.com/mock_sql_response.txt",
          },
          error: null,
        }),
        text: jest.fn().mockResolvedValue("Mock SQL response"),
      });
      jest.spyOn(transformer, "sendMessage").mockResolvedValueOnce(undefined);
      const transformedMessage = await transformer.transform(mockXMessage);
      expect(transformedMessage).toBeDefined();
      expect(transformedMessage.payload.text).toBeDefined();
      expect(transformedMessage.payload.text).toEqual("The capital of France is Paris.");
    });
  });
});
