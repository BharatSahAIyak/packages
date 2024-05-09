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
    transformer: {
      metaData: {}
    }
  };
  const eventBus = {
    pushEvent: (event: any) => {}
  }
  it("should throw an error when `provider` is not defined", async () => {
    const config = {
      inputLanguage: "en",
      outputLanguage: "hi",
      eventBus
    };
    const transformer = new TranslateTransformer(config);
    await expect(transformer.transform(mockXMessage)).rejects.toThrow(
      "`provider` not defined in TRANSLATE transformer"
    );
  });

  it("should return the original message when inputLanguage is the same as outputLanguage", async () => {
    const config = {
      provider: "Bhashini",
      inputLanguage: "en",
      outputLanguage: "en",
      eventBus
    };
    const transformer = new TranslateTransformer(config);

    const transformedMessage = await transformer.transform(mockXMessage);
    expect(transformedMessage).toEqual(mockXMessage);
  });
});
