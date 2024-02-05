import {
  ChannelTypeEnum,
  IChatOptions,
  IChatProvider,
  ISendMessageSuccessResponse,
} from '@novu/stateless';
import { MessageState, MessageType, XMessage } from '@samagra-x/xmessage';
import axios from 'axios';
import { v4 as uuid4 } from 'uuid';
import { TelegramBotProviderConfig } from './telegram.bot.config';
import { TelegramUpdateMessage } from './types';

export class TelegramBotProvider implements IChatProvider {
  channelType = ChannelTypeEnum.CHAT as ChannelTypeEnum.CHAT;
  public id = 'telegram';
  private axiosInstance = axios.create();
  
  constructor(private config: TelegramBotProviderConfig) {}

  async convertMessageToXMsg(msg: TelegramUpdateMessage): Promise<XMessage> {
    let messageType = MessageType.TEXT;
    let text = msg.message.text;
    if (text.startsWith('\\register')) {
      text = text.replace('\\register ', '').trim();
      messageType = MessageType.REGISTRATION;
    }
    const xmessage: XMessage = {
      to: {
        userID: "admin",
        bot: true,
      },
      from: {
        userID: `${msg.message.from.id}`,
        bot: false,
      },
      channelURI: "Bot",
      providerURI: "Telegram",
      messageState: MessageState.REPLIED,
      messageId: {
        channelMessageId: `${msg.update_id}`,
        Id: uuid4(),
      },
      messageType: messageType,
      timestamp: msg.message.date,
      payload: {
        text: text,
      },
    };

    return xmessage;
  }

  // Use @ts-ignore if webhookUrl is not passed.
  // `channel` is a required attribute and is equal to chat_id of bot and user.
  async sendMessage(data: IChatOptions): Promise<ISendMessageSuccessResponse> {
    if (!data.channel) {
      return {};
    }
    const url = new URL(
      data.webhookUrl || `https://api.telegram.org/bot${this.config.botToken}/sendMessage`
    );
    const response = await this.axiosInstance.post(url.toString(), {
      text: data.content,
      chat_id: data.channel,
    });

    if (response.data.ok == true) {
      return {
        id: `${response.data.result.from.id}_${response.data.result.chat.id}_${response.data.result.message_id}`,
        date: response.data.result.date,
      };
    }
    else {
      return {};
    }
  }
}
