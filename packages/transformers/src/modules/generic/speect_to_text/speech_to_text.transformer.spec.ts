import {
  XMessage,
  MessageType,
  MessageState,
  MediaCategory,
} from "@samagra-x/xmessage";
import axios from "axios";
import { SpeechToTextTransformer } from "./speech_to_text.transformer";
import FormData from "form-data";
import { TelemetryLogger } from "../../common/telemetry";

describe("SpeechToTextTransformer", () => {
  let mockEvent = { pushEvent: jest.fn() };
  let mockConfig = { eventBus: mockEvent, transformerId: "speech-to-text-transformer" };
  // let mockLogger = { sendErrorTelemetry: jest.fn(), sendLogTelemetry: jest.fn() };
  // jest.spyOn(TelemetryLogger.prototype, "sendErrorTelemetry").mockImplementation(mockLogger.sendErrorTelemetry);
  // jest.spyOn(TelemetryLogger.prototype, "sendLogTelemetry").mockImplementation(mockLogger.sendLogTelemetry);


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
      transformer: {
        metaData: {
        },
      },
      channelURI: "",
      providerURI: "",
      timestamp: 4825,
      messageState: MessageState.REPLIED,
      payload: {
        media: [
          {
            url: "https://example.com/sample.wav",
            category: MediaCategory.AUDIO,
          },
        ],
      },
    };

    const mockedResponse = {
      data: {
        text: "मेर नाम राहुल है",
      }
    };

    jest.spyOn(axios, 'post').mockImplementation((url, data, config) => {
      if (url === "http://mockbaseurl") {
        return Promise.resolve(mockedResponse);
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    const transformer = new SpeechToTextTransformer({
      baseUrl: "http://mockbaseurl",
      language: "en",
      ...mockConfig,
    });

    const transformedMessage = await transformer.transform(mockXMessage);

    expect(transformedMessage.payload?.metaData?.speechToTextData).toEqual(
      mockedResponse.data.text
    );

    expect(axios.post).toHaveBeenCalledWith(
      "http://mockbaseurl",
      expect.any(FormData),
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
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
      transformer: {
        metaData: {
        },
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
      baseUrl: "http://mockbaseurl",
      language: "en",
      ...mockConfig,
    });

    await expect(transformer.transform(mockXMessage)).rejects.toThrow(
      "Media URL not found in message payload"
    );
  });

  it("should handle empty response from text extraction service", async () => {
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
      transformer: {
        metaData: {
        }
      },
      channelURI: "",
      providerURI: "",
      timestamp: 4825,
      messageState: MessageState.REPLIED,
      payload: {
        media: [{
          url: "https://example.com/empty.wav",
          category: MediaCategory.AUDIO,
        }],
      },
    };

    const mockedResponse = {
      data: {
        text: ""
      }
    };

    jest.spyOn(axios, 'post').mockImplementation((url, data, config) => {
      if (url === "http://mockbaseurl") {
        return Promise.resolve(mockedResponse);
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    const transformer = new SpeechToTextTransformer({
      baseUrl: "http://mockbaseurl",
      language: "en",
      ...mockConfig,
    });

    const transformedMessage = await transformer.transform(mockXMessage);

    expect(transformedMessage.payload?.metaData?.speechToTextData).toEqual("");
  });

  it("should persist extracted text to payload.text when persist is true", async () => {
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
      transformer: {
        metaData: {
          
        },
      },
      channelURI: "",
      providerURI: "",
      timestamp: 4825,
      messageState: MessageState.REPLIED,
      payload: {
        media: [
          {
            url: "https://example.com/sample.wav",
            category: MediaCategory.AUDIO,
          },
        ],
      },
    };

    const mockedResponse = {
      data: {
        text: "This is a sample transcription",
      }
    };

    jest.spyOn(axios, 'post').mockImplementation((url, data, config) => {
      if (url === "http://mockbaseurl") {
        return Promise.resolve(mockedResponse);
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    const transformer = new SpeechToTextTransformer({
      baseUrl: "http://mockbaseurl",
      language: "en",
      persist: true,
      ...mockConfig,
    });

    const transformedMessage = await transformer.transform(mockXMessage);

    expect(transformedMessage.payload?.text).toBe(mockedResponse.data.text);
    expect(transformedMessage.payload?.metaData?.speechToTextData).toBe(mockedResponse.data.text);

    expect(axios.post).toHaveBeenCalledWith(
      "http://mockbaseurl",
      expect.any(FormData),
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  });
});
