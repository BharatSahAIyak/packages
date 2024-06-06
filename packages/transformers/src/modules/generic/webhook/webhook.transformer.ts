import { XMessage } from "@samagra-x/xmessage";
import axios, { AxiosResponse } from "axios";
import { ITransformer } from "../../common/transformer.interface";

export class WebhookTransformer implements ITransformer {

  /// Accepted config properties for WebhookTransformer:
  /// baseUrl: Base URL of the webhook endpoint. This is a required property.

  constructor(config: Record<string, any>) {
    this.baseUrl = config.baseUrl;
  }

  private readonly baseUrl: string;

  async transform(xmsg: XMessage): Promise<XMessage> {
    if (!this.baseUrl) {
      throw new Error("baseUrl is a required config!");
    }

    const payload = xmsg.payload;
    if (!payload) {
      throw new Error("Message payload is missing!");
    }

    let response: AxiosResponse<any> | undefined;

    try {
      response = await axios.post(this.baseUrl, payload);
    }
    catch (error) {
      console.error('Error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios Error:', error.response?.data);
      }
      else {
        const unknownError = error as Error;
        console.error('Generic Error:', unknownError.message);
      }
      throw error;
    }

    const webhookData = response?.data;

    if (!xmsg.payload.metaData) {
      xmsg.payload.metaData = {};
    }
    xmsg.payload.metaData.webhookData = webhookData;

    return xmsg;
  }
}