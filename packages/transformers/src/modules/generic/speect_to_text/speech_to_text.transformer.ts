import { XMessage } from "@samagra-x/xmessage";
import axios from "axios";
import { ITransformer } from "../../common/transformer.interface";
var FormData = require('form-data');

export class SpeechToTextTransformer implements ITransformer {
  /// Accepted config properties for SpeechToTextTransformer:
  /// baseUrl: Base URL of the speech-to-text service endpoint. This is a required property.
  /// language: Language code specifying the language of the audio input. Defaults to 'en' if not provided. (optional)
  /// spellCheck: Whether to enable spell check. Defaults to false if not provided. (optional)

  private readonly baseUrl: string;
  private readonly language: string;
  private readonly spellCheck: boolean;

  constructor(config: Record<string, any>) {
    if (!config.baseUrl) {
      throw new Error("Configuration missing baseUrl");
    }
    this.baseUrl = config.baseUrl;

    this.language = config.language || "en";

    this.spellCheck = config.spellCheck ?? false;
  }

  async transform(xmsg: XMessage): Promise<XMessage> {
    try {
      const url = xmsg.payload?.media?.url;
      if (!url) {
        throw new Error("Media URL not found in message payload");
      }

      const formData = new FormData();
      formData.append('language', this.language);
      formData.append('spellCheck', this.spellCheck.toString());
      formData.append('fileUrl', url);

      const response = await axios.post(this.baseUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const extractedText = response.data?.text_read;

      if (!extractedText) {
        throw new Error("Failed to extract text from the provided URL");
      }

      if (!xmsg.payload) {
        xmsg.payload = {};
      }
      if (!xmsg.payload.metaData) {
        xmsg.payload.metaData = {};
      }
      xmsg.payload.metaData.speechToTextData = extractedText;

      return xmsg;
    } catch (error) {
      console.error("Error in SpeechToTextTransformer transformer:", error);
      throw error;
    }
  }
}
