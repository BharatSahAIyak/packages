import { XMessage, MessageType, MessageState } from "@samagra-x/xmessage";
import { TranslateTransformer } from "./translate.transfomer";

describe("TranslateTransformer", () => {
  const mockXMessage: XMessage = {
    messageType: MessageType.TEXT,
    messageId: { Id: "123", channelMessageId: "456" },
    to: { userID: "9876543210" },
    from: { userID: "1234567890", bot: true, meta: new Map() },
    channelURI: "",
    providerURI: "",
    timestamp: Date.now(),
    messageState: MessageState.REPLIED,
    payload: { text: "Hello, world!" },
  };
  it("should throw an error when `provider` is not defined", async () => {
    const config = {
      inputLanguage: "en",
      outputLanguage: "hi",
    };
    const transformer = new TranslateTransformer(config);
    await expect(transformer.transform(mockXMessage)).rejects.toThrow(
      "`provider` not defined in TRANSLATE transformer"
    );
  });

  it("should throw an error when `inputLanguage` is not defined", async () => {
    const config = {
      provider: "Bhashini",
      outputLanguage: "hi",
    };
    const transformer = new TranslateTransformer(config);

    await expect(transformer.transform(mockXMessage)).rejects.toThrow(
      "`inputLanguage` not defined in TRANSLATE transformer"
    );
  });

  it("should throw an error when `outputLanguage` is not defined", async () => {
    const config = {
      provider: "Bhashini",
      inputLanguage: "hi",
    };
    const transformer = new TranslateTransformer(config);

    await expect(transformer.transform(mockXMessage)).rejects.toThrow(
      "`outputLanguage` not defined in TRANSLATE transformer"
    );
  });

  it("should return the original message when inputLanguage is the same as outputLanguage", async () => {
    const config = {
      provider: "Bhashini",
      inputLanguage: "en",
      outputLanguage: "en",
    };
    const transformer = new TranslateTransformer(config);

    const transformedMessage = await transformer.transform(mockXMessage);
    expect(transformedMessage).toEqual(mockXMessage);
  });

  it("should throw an error when provider is Azure", async () => {
    const config = {
      provider: "Azure",
      inputLanguage: "en",
      outputLanguage: "hi",
    };
    const transformer = new TranslateTransformer(config);

    await expect(transformer.transform(mockXMessage)).rejects.toThrow(
      "Azure is not configured yet in TRANSLATE transformer"
    );
  });
});
