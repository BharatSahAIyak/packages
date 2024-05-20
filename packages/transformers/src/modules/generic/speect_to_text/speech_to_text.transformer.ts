import { MessageMedia, XMessage } from "@samagra-x/xmessage";
import axios, { AxiosResponse } from "axios";
import { ITransformer } from "../../common/transformer.interface";
var FormData = require('form-data');

export class SpeechToTextTransformer implements ITransformer {

  /// Accepted config properties for SpeechToTextTransformer:
  /// baseUrl: Base URL of the speech-to-text service endpoint. This is a required property.
  /// language: Language code specifying the language of the audio input. Defaults to 'en' if not provided. (optional)
  /// spellCheck: Whether to enable spell check. Defaults to false if not provided. (optional)
  /// persist: Boolean indicating whether to persist the extracted text to payload.text. Defaults to false if not provided. (optional)
  constructor(config: Record<string, any>) {
    this.baseUrl = config.baseUrl;
    this.language = config.language || "en";
    this.spellCheck = config.spellCheck ?? false;
    this.persist = config.persist ?? false;
  }

  private readonly baseUrl: string;
  private readonly language: string;
  private readonly spellCheck: boolean;
  private readonly persist: boolean;

  async transform(xmsg: XMessage): Promise<XMessage> {
      const media : MessageMedia[] | undefined = xmsg.payload?.media;

      if (!this.baseUrl) {
        throw new Error("`baseUrl` is a required config!");
      }
      if (!media || media.length === 0 || !media[0].url || !(media[0].url.length > 0)) {
        throw new Error("Media URL not found in message payload");
      }
      
      const url = media[0].url;

      const formData = new FormData();
      formData.append('language', this.language);
      formData.append('spellCheck', this.spellCheck.toString());
      formData.append('fileUrl', url);

      let response: AxiosResponse<any> | undefined;

      try {
        response = await axios.post(this.baseUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } catch (error) {
        console.error('Error:', error);
        if (axios.isAxiosError(error)) {
          console.error('Axios Error:', error.response?.data);
        } else {
          const unknownError = error as Error;
          console.error('Generic Error:', unknownError.message);
        }
      }

      const speechToTextData = response?.data.text;

      if (!xmsg.payload) {
        xmsg.payload = {};
      }
      if (!xmsg.payload.metaData) {
        xmsg.payload.metaData = {};
      }
      xmsg.payload.metaData.speechToTextData = speechToTextData;

      if (this.persist) {
        xmsg.payload.text = speechToTextData;
      }

      return xmsg;
  }
}
