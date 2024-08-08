import {
  ChannelTypeEnum,
  IChatOptions,
  IChatProvider,
  ISendMessageSuccessResponse,
} from "@novu/stateless";
import axios, { AxiosResponse } from "axios";
import { DiscordBotProviderConfig } from "./discord.bot.config";
import FormData from "form-data";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

export class DiscordProvider implements IChatProvider {
  channelType = ChannelTypeEnum.CHAT as ChannelTypeEnum.CHAT;
  public id = "discord";

  constructor(private config: DiscordBotProviderConfig) {}

  async sendMessage(data: IChatOptions): Promise<ISendMessageSuccessResponse> {
    // Setting the wait parameter with the URL API to respect user parameters
    const url = new URL(this.config.webhookUrl);
    url.searchParams.set("wait", "true");
    if (data.content.length <= 2000) {
      const response = await axios.post(url.toString(), {
          content: data.content,
        });
      return {
        id: response.data.id, 
        date: response.data.timestamp
      };
    }
    // Else create a temp .txt file and send that file to the server
    const tempFilePath = path.join(__dirname, `${uuidv4()}.txt`);
    fs.writeFileSync(tempFilePath, data.content, "utf-8");
    url.searchParams.set("wait", "true");
    const form = new FormData();
    form.append("file", fs.createReadStream(tempFilePath));
    let response: AxiosResponse<any> | null = null;
    try {
      response = await axios.post(url.toString(), form, {
        headers: {
          ...form.getHeaders(),
        },
      });
    } catch (e) {
      console.log(e);
    } finally {
      fs.unlinkSync(tempFilePath);
    }
    if (response) {
      return {
        id: response.data.id,
        date: response.data.timestamp,
      };
    } else {
      throw new Error("Failed to get a response from the server");
    }
  }
}
