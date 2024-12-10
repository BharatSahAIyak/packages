import axios, { AxiosResponse } from 'axios';
import { GSWhatsAppMessage, MethodType } from './types';
import { v4 as uuid4 } from 'uuid';
import {
  MessageId,
  SenderReceiverInfo,
  XMessagePayload,
  ButtonChoice,
  MediaCategory,
  XMessage,
  MessageState,
  MessageType,
  XMessageProvider,
} from '@samagra-x/xmessage';

interface ExtendedXMessagePayload extends XMessagePayload {
  qrPayload?: Record<string, string>;
  buttonUrlParam?: string;
  ctaButtonUrl?: string;
  campaignId?: string;
}

export interface IGSWhatsappConfig {
  password2Way: string;
  passwordHSM: string;
  username2Way: string;
  usernameHSM: string;
}

interface GSWhatsappOutBoundResponse {
  response: GSResponse;
}

interface GSResponse {
  id: string;
  phone: string;
  details: string;
  status: string;
}

class MessageBuilder {
  private params: URLSearchParams;

  constructor() {
    this.params = new URLSearchParams();
    this.setDefaultParams();
  }

  private setDefaultParams(): void {
    this.params.append('v', '1.1');
    this.params.append('format', 'json');
    this.params.append('auth_scheme', 'plain');
    this.params.append('extra', 'Samagra');
    this.params.append('data_encoding', 'text');
    this.params.append('messageId', '123456789');
  }

  setCredentials(username: string, password: string, method: string): this {
    this.params.append('method', method);
    this.params.append('userid', username);
    this.params.append('password', password);
    return this;
  }

  setQuickReplyPayloads(payloads: Record<string, string>): this {
    this.params.set('isTemplate', 'true');
    Object.entries(payloads).forEach(([_, value], index) => {
      if (index < 3) {
        this.params.set(`qrPayload_${index + 1}`, value);
      }
    });
    return this;
  }

  setButtonParams(payload: ExtendedXMessagePayload): this {
    if (payload.buttonUrlParam && payload.ctaButtonUrl) {
      throw new Error('Cannot use both buttonUrlParam and ctaButtonUrl simultaneously');
    }

    if (payload.buttonUrlParam) {
      this.params.set('buttonUrlParam', payload.buttonUrlParam);
    }

    if (payload.ctaButtonUrl) {
      this.params.set('cta_button_url', payload.ctaButtonUrl);
    }

    return this;
  }

  setCampaignTracking(campaignId: string): this {
    this.params.set('extra', campaignId);
    return this;
  }

  setMessageParams(xMsg: XMessage, text: string): this {
    this.params.set('send_to', '91' + xMsg.to.userID);
    this.params.set('phone_number', '91' + xMsg.to.userID);
    this.params.set('msg_type', MessageType.TEXT);
    this.params.set('channel', 'Whatsapp');
    if (xMsg.messageId.Id) {
      this.params.set('msg_id', xMsg.messageId.Id);
    }
    this.params.set('msg', text);
    return this;
  }

  getParams(): URLSearchParams {
    return this.params;
  }
}

export class GupshupWhatsappProvider implements XMessageProvider {
  private readonly providerConfig?: IGSWhatsappConfig;
  private readonly baseUrl = 'https://media.smsgupshup.com/GatewayAPI/rest';

  constructor(config?: IGSWhatsappConfig) {
    this.providerConfig = config;
  }

  private async sendOutboundMessage(url: string): Promise<any> {
    try {
      const response: AxiosResponse = await axios.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Error sending message:', error.response?.data || error.message);
      throw error;
    }
  }

  private handleTextMessage(xMsg: XMessage, builder: MessageBuilder): void {
    const extendedPayload = xMsg.payload as ExtendedXMessagePayload;
    let text = extendedPayload.text || '';

    const metadata = extendedPayload.metaData || {};
    
    if (metadata.qrPayload) {
      builder.setQuickReplyPayloads(metadata.qrPayload);
    }

    if (metadata.ctaButtonUrl) {
      builder.setButtonParams({
        ...extendedPayload,
        ctaButtonUrl: metadata.ctaButtonUrl
      });
    }

    if (metadata.campaignId) {
      builder.setCampaignTracking(metadata.campaignId);
    }

    text += this.renderMessageChoices(extendedPayload.buttonChoices?.choices || []);
    builder.setMessageParams(xMsg, text);
  }

  private handleMediaMessage(xMsg: XMessage, builder: MessageBuilder): void {
    if (xMsg.payload.media?.[0]) {
      const media = xMsg.payload.media[0];
      const extendedPayload = xMsg.payload as ExtendedXMessagePayload;
      const metadata = extendedPayload.metaData || {};
      const params = builder.getParams();
      params.set('method', MethodType.MEDIAMESSAGE);
      params.set('msg_type', this.getMessageTypeByMediaCategory(media.category!));
      params.set('media_url', media.url!);
      params.set('isHSM', 'false');

      if (metadata.qrPayload) {
        params.set('isTemplate', 'true');
        builder.setQuickReplyPayloads(metadata.qrPayload);
      }

      if (metadata.ctaButtonUrl || metadata.buttonUrlParam) {
        builder.setButtonParams({
          ...extendedPayload,
          ctaButtonUrl: metadata.ctaButtonUrl,
          buttonUrlParam: metadata.buttonUrlParam
        });
      }

      if (metadata.campaignId) {
        builder.setCampaignTracking(metadata.campaignId);
      }

      if (media.caption) {
        params.set('caption', media.caption);
      }
      if (media.filename) {
        params.set('filename', media.filename);
      }
    }
  }

  private getMessageTypeByMediaCategory = (
    category: MediaCategory
  ): MessageType => {
    let messageType: MessageType = MessageType.TEXT;
  
    if (category !== null) {
      if (category === MediaCategory.IMAGE) {
        messageType = MessageType.IMAGE;
      } else if (category === MediaCategory.AUDIO) {
        messageType = MessageType.AUDIO;
      } else if (category === MediaCategory.VIDEO) {
        messageType = MessageType.VIDEO;
      } else if (category === MediaCategory.FILE) {
        messageType = MessageType.DOCUMENT;
      }
    }
  
    return messageType;
  };

  private renderMessageChoices(choices: ButtonChoice[]): string {
    if (!choices.length) return '';
    return '\n\n' + choices.map((choice, index) => `${index + 1}. ${choice.text}`).join('\n');
  }             

  async convertMessageToXMsg(msg: GSWhatsAppMessage): Promise<XMessage> {
    const xMsg = new XMessage();
    xMsg.messageId = MessageId.builder()
      .setChannelMessageId(msg.messageId || uuid4())
      .build();
    
    xMsg.to = new SenderReceiverInfo();
    xMsg.to.userID = msg.mobile.replace('91', '');
    
    xMsg.from.userID = "admin"
    
    xMsg.channelURI = 'whatsapp';
    xMsg.providerURI = 'gupshup';
    xMsg.timestamp = Date.now();
    xMsg.messageState = MessageState.REPLIED;
    
    const payload: ExtendedXMessagePayload = {
      text: msg.text || ''
    };
    
    xMsg.payload = payload;
    
    return xMsg;
  }

  async sendMessage(xMsg: XMessage): Promise<XMessage | void> {
    if (!this.providerConfig) {
      console.error("Configuration not set for adapter!");
      return;
    }

    try {
      const builder = new MessageBuilder();
      
      if (xMsg.messageState === MessageState.REPLIED) {
        builder.setCredentials(
          this.providerConfig.username2Way,
          this.providerConfig.password2Way,
          MethodType.SIMPLEMESSAGE
        );

        this.handleTextMessage(xMsg, builder);
        this.handleMediaMessage(xMsg, builder);

        const url = new URL(`${this.baseUrl}?${builder.getParams()}`);
        
        try {
          const response: GSWhatsappOutBoundResponse = await this.sendOutboundMessage(url.toString());
          
          if (response?.response.status === 'success') {
            xMsg.messageId = MessageId.builder()
              .setChannelMessageId(response.response.id)
              .build();
            xMsg.messageState = MessageState.SENT;
          } else {
            console.error('Gupshup Whatsapp Message not sent:', response?.response.details);
            xMsg.messageState = MessageState.NOT_SENT;
          }
        } catch (error) {
          console.error('Error in Send Gupshup Whatsapp Outbound Message', error);
          xMsg.messageState = MessageState.NOT_SENT;
        }
      }

      return xMsg;
    } catch (error) {
      console.error('Error in processing outbound message', error);
      throw error;
    }
  }
}
