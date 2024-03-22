import axios from 'axios';
import {
  ChannelTypeEnum,
  IChatOptions,
  IChatProvider,
  ISendMessageSuccessResponse,
} from '@novu/stateless';
import { MessageState, MessageType, XMessage } from '@samagra-x/xmessage';
import { v4 as uuidv4 } from 'uuid';

import { SlackBotProviderConfig } from './slack.bot.config';
import { SlackUpdateMessage } from './types';

export class SlackProvider implements IChatProvider {
  channelType = ChannelTypeEnum.CHAT as ChannelTypeEnum.CHAT;
  id = 'slack';

  constructor(private config: SlackBotProviderConfig) {}

  async convertMessageToXMsg(msg: SlackUpdateMessage): Promise<XMessage> {
    const { text, user, ts } = msg;
    const messageType = text.startsWith('\\\\register')
      ? MessageType.REGISTRATION
      : MessageType.TEXT;

    const xmessage: XMessage = {
      to: {
        userID: 'admin',
        bot: true,
      },
      from: {
        userID: user,
        bot: false,
      },
      channelURI: 'Slack',
      providerURI: 'Slack',
      messageState: MessageState.REPLIED,
      messageId: {
        channelMessageId: ts,
        Id: uuidv4(),
      },
      messageType,
      timestamp: new Date().getTime(),
      payload: {
        text: messageType === MessageType.REGISTRATION
          ? text.replace('\\\\register ', '').trim()
          : text,
      },
    };

    return xmessage;
  }

  async sendMessage(data: IChatOptions): Promise<ISendMessageSuccessResponse> {
    if (!data.webhookUrl && !data.channel) {
      return {};
    }

    const url = new URL(data.webhookUrl || 'https://slack.com/api/chat.postMessage');
    const payload:any = {
      text: data.content,
    };

    if (!data.webhookUrl) {
      payload.channel = data.channel;
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.botToken}`,
    };

    const response = await axios.post(url.toString(), payload, { headers });

    if (response.data.ok && response.data.messages?.length) {
      return {
        id: response.data.messages[0].ts,
      };
    } else {
      return {};
    }
  }
}