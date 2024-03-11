import axios from 'axios';
import {
  ChannelTypeEnum,
  IChatOptions,
  IChatProvider,
  ISendMessageSuccessResponse,
} from '@novu/stateless';
import { MessageState, MessageType, XMessage } from '@samagra-x/xmessage';
import { v4 as uuid4 } from 'uuid';
import { SlackBotProviderConfig } from './slack.bot.config';
import { SlackUpdateMessage } from './types';

export class SlackProvider implements IChatProvider {
  channelType = ChannelTypeEnum.CHAT as ChannelTypeEnum.CHAT;
  id = 'slack';
  private axiosInstance = axios.create();

  constructor(private config: SlackBotProviderConfig) {}

  async convertMessageToXMsg(msg: SlackUpdateMessage): Promise<XMessage> {
    let messageType = MessageType.TEXT;
    let text = msg.text;
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
        userID: msg.user,
        bot: false,
      },
      channelURI: "Bot",
      providerURI: "Slack",
      messageState: MessageState.REPLIED,
      messageId: {
        channelMessageId: msg.ts,
        Id: uuid4(),
      },
      messageType: messageType,
      timestamp: msg.date,
      payload: {
        text: text,
      },
    };

    return xmessage;
  }

  async sendMessage(data: IChatOptions): Promise<ISendMessageSuccessResponse> {
    if (!data.channel) {
      return {};
    }
    const url = new URL(data.webhookUrl || 'https://slack.com/api/chat.postMessage');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.botToken}`,
    };
    
    const response = await this.axiosInstance.post(url.toString(), {
      channel: data.channel,
      text: data.content,
    }, { headers });
      
    if (response.data.ok) {
      return {
          id: response.data.ts,
          date: response.data.result.date,
        };
      } else {return {}}
    
  }

}
