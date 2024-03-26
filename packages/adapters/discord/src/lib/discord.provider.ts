import {
  ChannelTypeEnum,
  IChatOptions,
  IChatProvider,
  ISendMessageSuccessResponse,
} from '@novu/stateless';
import { MessageState, MessageType, XMessage } from '@samagra-x/xmessage';
import { v4 as uuid4 } from "uuid";
import axios from 'axios';
import {Client, IntentsBitField} from "discord.js"
import { DiscordBotProviderConfig } from './discord.bot.config';
import { DiscordMessage } from './types';

export class DiscordProvider implements IChatProvider {

    channelType = ChannelTypeEnum.CHAT as ChannelTypeEnum.CHAT;
    public id = 'discord';
    private client: Client;
    private axiosInstance = axios.create();

    constructor(private config: DiscordBotProviderConfig) {
      this.client = new Client({ intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
      ]});

      this.client.on('ready', () => {
        console.log(`Logged in as ${this.client.user.tag}!`);
      });

      this.client.on('messageCreate', async (message) => {
        // Handle incoming messages here
        // Example: const xmessage = await this.convertMessageToXMsg(message);
        // Process xmessage as needed
      });

      this.client.login(config.botToken);
  }

  async convertMessageToXMsg(msg: DiscordMessage): Promise<XMessage> {
    let messageType = MessageType.TEXT;
    let text = msg.content;
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
        userID: `${msg.author.id}`,
        bot: false,
      },
      channelURI: "Bot",
      providerURI: "Discord",
      messageState: MessageState.REPLIED,
      messageId: {
        channelMessageId: `${msg.id}`,
        Id: uuid4(),
      },
      messageType: messageType,
      timestamp: msg.createdTimestamp,
      payload: {
        text: text,
      },
    };

    return xmessage;
  }

  async sendMessage(data: IChatOptions): Promise<ISendMessageSuccessResponse> {
    // Setting the wait parameter with the URL API to respect user parameters
    const url = new URL(data.webhookUrl);
    url.searchParams.set('wait', 'true');
    const response = await this.axiosInstance.post(url.toString(), {
      content: data.content,
    });

    return {
      id: response.data.id,
      date: response.data.timestamp,
    };
  }

}
