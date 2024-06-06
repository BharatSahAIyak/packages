import { XMessage, MessageType, MessageState } from "@samagra-x/xmessage";
import axios from "axios";
import { WebhookTransformer } from "./webhook.transformer";


describe("WebhookTransformer", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });


  it("should send the payload to the webhook and store the response in metadata", async () => {
    const mockXMessage: XMessage = {
      messageType: MessageType.TEXT,
      messageId: {
        Id: "1234567890",
        channelMessageId: "1234567890",
      },
      to: {
        userID: "9999999999",
      },
      from: {
        userID: "admin",
        bot: true,
      },
      channelURI: "",
      providerURI: "",
      timestamp: 4825,
      messageState: MessageState.REPLIED,
      payload: {
        text: "Hello, this is a test message.",
      },
    };
    const mockedResponse = {
      data: {
        success: true,
        message: "Webhook received the data successfully",
      }
    };
    jest.spyOn(axios, 'post').mockImplementation((url, data, config) => {
      if (url === "http://mockwebhookurl") {
        return Promise.resolve(mockedResponse);
      }
      return Promise.reject(new Error('Unexpected URL'));
    });
    const transformer = new WebhookTransformer({
      baseUrl: "http://mockwebhookurl",
    });
    const transformedMessage = await transformer.transform(mockXMessage);

    expect(transformedMessage.payload?.metaData?.webhookData).toEqual(mockedResponse.data);
    expect(axios.post).toHaveBeenCalledWith(
      "http://mockwebhookurl",
      mockXMessage.payload
    );
  });


  it("should throw an error if baseUrl is not provided", async () => {
    const mockXMessage: XMessage = {
        messageType: MessageType.TEXT,
        messageId: {
          Id: "1234567890",
          channelMessageId: "1234567890",
        },
        to: {
          userID: "9999999999",
        },
        from: {
          userID: "admin",
          bot: true,
        },
        channelURI: "",
        providerURI: "",
        timestamp: 4825,
        messageState: MessageState.REPLIED,
        payload: {
          text: "Hello, this is a test message.",
        },
      };
    const transform = new WebhookTransformer({config: {}});
    expect(transform.transform(mockXMessage)).rejects.toThrow("baseUrl is a required config!"); 
  });


  it("should persist the webhook response to payload.text when persist is true", async () => {
    const mockXMessage: XMessage = {
      messageType: MessageType.TEXT,
      messageId: {
        Id: "1234567890",
        channelMessageId: "1234567890",
      },
      to: {
        userID: "9999999999",
      },
      from: {
        userID: "admin",
        bot: true,
      },
      channelURI: "",
      providerURI: "",
      timestamp: 4825,
      messageState: MessageState.REPLIED,
      payload: {
        text: "Hello, this is a test message.",
      },
    };
    const mockedResponse = {
      data: {
        success: true,
        message: "Webhook received the data successfully",
      }
    };
    jest.spyOn(axios, 'post').mockImplementation((url, data, config) => {
      if (url === "http://mockwebhookurl") {
        return Promise.resolve(mockedResponse);
      }
      return Promise.reject(new Error('Unexpected URL'));
    });
    const transformer = new WebhookTransformer({
      baseUrl: "http://mockwebhookurl",
    });
    const transformedMessage = await transformer.transform(mockXMessage);
    expect(transformedMessage.payload?.metaData?.webhookData).toEqual(
      mockedResponse.data
    );
  });
});