import {
  XMessage,
  MessageType,
  MessageState,
  MediaCategory,
} from "@samagra-x/xmessage";
import axios from "axios";
import { SpeechToTextTransformer } from "./speech_to_text.transformer";
import FormData from "form-data";

jest.mock("axios");

describe("SpeechToTextTransformer", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should extract text from a provided URL and store it in metadata", async () => {
    const mockXMessage: XMessage = {
      messageType: MessageType.AUDIO,
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
        meta: new Map(Object.entries({ botMobileNumber: "919999999999" })),
      },
      channelURI: "",
      providerURI: "",
      timestamp: 4825,
      messageState: MessageState.REPLIED,
      payload: {
        media: {
          url: "https://example.com/sample.wav",
          category: MediaCategory.AUDIO,
        },
      },
    };

    const mockedResponse = {
      data: {
        text_read: ["मेर", "न", "राहुल", "है"],
      },
    };

    (axios.post as jest.MockedFunction<typeof axios.post>).mockResolvedValue(
      mockedResponse
    );

    const transformer = new SpeechToTextTransformer({
      baseUrl: "https://ai-tools-proxy.dev.bhasai.samagra.io/speech-to-text",
      language: "en",
      model_name: "ai4bharat/conformer-en-gpu--t4",
    });

    const transformedMessage = await transformer.transform(mockXMessage);

    expect(transformedMessage.payload?.metaData?.speechToTextData).toEqual(
      mockedResponse.data.text_read
    );

    expect(axios.post).toHaveBeenCalledWith(
      "https://ai-tools-proxy.dev.bhasai.samagra.io/speech-to-text",
      expect.any(FormData), // Verify that FormData is passed
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  });

  it("should handle errors during text extraction", async () => {
    const mockXMessage: XMessage = {
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
        meta: new Map(Object.entries({ botMobileNumber: "919999999999" })),
      },
      channelURI: "",
      providerURI: "",
      timestamp: 4825,
      messageState: MessageState.REPLIED,
      payload: {
        media: {
          url: "https://example.com/sample.wav",
          category: MediaCategory.AUDIO,
        },
      },
    };

    (axios.post as jest.MockedFunction<typeof axios.post>).mockRejectedValue(
      new Error("Failed to extract text")
    );

    const transformer = new SpeechToTextTransformer({
      baseUrl: "https://ai-tools-proxy.dev.bhasai.samagra.io/speech-to-text",
      language: "en",
      model_name: "ai4bharat/conformer-en-gpu--t4",
    });

    await expect(transformer.transform(mockXMessage)).rejects.toThrow(
      "Failed to extract text"
    );
  });

  it("should throw an error if no media URL is provided", async () => {
    const mockXMessage: XMessage = {
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
        meta: new Map(Object.entries({ botMobileNumber: "919999999999" })),
      },
      channelURI: "",
      providerURI: "",
      timestamp: 4825,
      messageState: MessageState.REPLIED,
      payload: {
        text: "No media URL provided",
      },
    };

    const transformer = new SpeechToTextTransformer({
      baseUrl: "https://ai-tools-proxy.dev.bhasai.samagra.io/speech-to-text",
      language: "en",
      model_name: "ai4bharat/conformer-en-gpu--t4",
    });

    await expect(transformer.transform(mockXMessage)).rejects.toThrow(
      "Media URL not found in message payload"
    );
  });

  it("should handle empty response from text extraction service", async () => {
    const mockXMessage: XMessage = {
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
        meta: new Map(Object.entries({ botMobileNumber: "919999999999" })),
      },
      channelURI: "",
      providerURI: "",
      timestamp: 4825,
      messageState: MessageState.REPLIED,
      payload: {
        media: {
          url: "https://example.com/empty.wav",
          category: MediaCategory.AUDIO,
        },
      },
    };

    const mockedResponse = {
      data: {
        text_read: [],
      },
    };

    (axios.post as jest.MockedFunction<typeof axios.post>).mockResolvedValue(
      mockedResponse
    );

    const transformer = new SpeechToTextTransformer({
      baseUrl: "https://ai-tools-proxy.dev.bhasai.samagra.io/speech-to-text",
      language: "en",
      model_name: "ai4bharat/conformer-en-gpu--t4",
    });

    const transformedMessage = await transformer.transform(mockXMessage);

    expect(transformedMessage.payload?.metaData?.speechToTextData).toEqual([]);
  });
});