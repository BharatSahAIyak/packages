import axios, { AxiosResponse } from 'axios';
import { GSWhatsAppMessage, MethodType } from './types';
import {
  StylingTag,
  MessageId,
  SenderReceiverInfo,
  XMessagePayload,
  LocationParams,
  MessageMedia,
  ButtonChoice,
  MediaCategory,
  XMessage,
  MessageState,
  MessageType,
  XMessageProvider,
} from '@samagra-x/xmessage';
import { v4 as uuid4 } from 'uuid';
import { FileUtil } from './utils';
import { URLSearchParams } from 'url';

export type IGSWhatsappConfig = {
  password2Way: string,
  passwordHSM: string,
  username2Way: string,
  usernameHSM: string,
  userServiceUrl: string,
  fusionAuthUrl: string,
  applicationId: string,
  authToken: string
};

type GSWhatsappReport = {
  externalId: string;
  eventType: string;
  eventTs: string;
  destAddr: string;
  srcAddr: string;
  cause: string;
  errorCode: string;
  channel: string;
  extra: string;
};

type Section = {
  title: string;
  rows: SectionRow[];
}

type Button = {
  type: string;
  reply: ReplyButton;
}

type ReplyButton = {
  id: string;
  title: string;
}

type Action = {
  buttons?: Button[] | null;
  button?: string | null;
  sections?: Section[];
}

type GSResponse = {
  id: string;
  phone: string;
  details: string;
  status: string;
}

export type GSWhatsappOutBoundResponse = {
  response: GSResponse;
}

type SectionRow = {
  id: string;
  title: string;
}

interface UserSearchResponse {
  users: {
    id: string;
    username: string;
  }[];
  total: number;
}
export class GupshupWhatsappProvider implements XMessageProvider {

  private readonly providerConfig?: IGSWhatsappConfig;
  private userHistory: XMessage[];

  constructor(config?: IGSWhatsappConfig, userHistory: XMessage[] = []) {
    this.providerConfig = config;
    this.userHistory = userHistory;
  }

  private getMessageState = (eventType: String): MessageState => {
    let messageState: MessageState;
  
    switch (eventType) {
      case 'SENT':
        messageState = MessageState.SENT;
        break;
      case 'DELIVERED':
        messageState = MessageState.DELIVERED;
        break;
      case 'READ':
        messageState = MessageState.READ;
        break;
      default:
        messageState = MessageState.FAILED_TO_DELIVER;
        // TODO: Save the state of the message and reason in this case.
        break;
    }
  
    return messageState;
  };
  
  private isInboundMediaMessage = (type: String) => {
    // Implement the logic to check if the message type is a media message
    return (
      type === 'image' || type === 'audio' || type === 'video' || type === 'file'
    );
  };
  
  private getInboundInteractiveContentText = (message: GSWhatsAppMessage) => {
    let text: string = '';
    const interactiveContent: string | undefined = message.interactive;
  
    if (interactiveContent && interactiveContent.length > 0) {
      try {
        const node: any = JSON.parse(interactiveContent);
        // console.log('interactive content node:', node);
  
        const type: string = node.type !== undefined ? node.type : '';
  
        if (type.toLowerCase() === 'list_reply') {
          text =
            node.list_reply !== undefined && node.list_reply.title !== undefined
              ? node.list_reply.title
              : '';
        } else if (type.toLowerCase() === 'button_reply') {
          text =
            node.button_reply !== undefined &&
            node.button_reply.title !== undefined
              ? node.button_reply.title
              : '';
        }
      } catch (error: any) {
        console.error('Exception in getInboundInteractiveContentText:', error);
      }
    }
  
    // console.log('Inbound interactive text:', text);
    return text;
  };

  private getUserById = async (userId: string): Promise<string> => {
    const url = `${this.providerConfig?.fusionAuthUrl}/api/user/${userId}`;
    
    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': this.providerConfig?.authToken,
          'Content-Type': 'application/json',
          'X-FusionAuth-Application-Id': this.providerConfig?.applicationId,
        },
      });
  
      return response.data?.user?.data?.loginId;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  };
  
  
  private getMediaCategoryByMimeType = (mimeType: string): MediaCategory | undefined => {
    let category: MediaCategory | undefined = undefined;
    if (FileUtil.isFileTypeImage(mimeType)) {
      category = MediaCategory.IMAGE;
    } else if (FileUtil.isFileTypeAudio(mimeType)) {
      category = MediaCategory.AUDIO;
    } else if (FileUtil.isFileTypeVideo(mimeType)) {
      category = MediaCategory.VIDEO;
    } else if (FileUtil.isFileTypeDocument(mimeType)) {
      category = MediaCategory.FILE;
    }
    return category;
  };
  
  private getMediaInfo = async (message: GSWhatsAppMessage) => {
    const result: MessageMedia = {};
    let mime_type = '';
    let mediaContent = '';

    if (message.type === 'image') {
      mediaContent = message.image || '';
    } else if (message.type === 'audio') {
      mediaContent = message.audio || '';
    } else if (message.type === 'voice') {
      mediaContent = message.voice || '';
    } else if (message.type === 'video') {
      mediaContent = message.video || '';
    } else if (message.type === 'document') {
      mediaContent = message.document || '';
    }

    if (mediaContent && mediaContent.length > 0) {
      try {
        const node = JSON.parse(mediaContent);
        const url = node.url || '';
        const signature = node.signature || '';
        mime_type = node.mime_type || '';
        result.url = url + signature;
        result.category = this.getMediaCategoryByMimeType(mime_type);
        result.mimeType = mime_type;
      } catch (error: any) {
        console.error('Exception in getMediaInfo:', error);
        throw error;
      }
    }
  
    return result;
  };
  
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
  private getInboundLocationParams = (
    message: GSWhatsAppMessage
  ): LocationParams => {
    let longitude: number | null = null;
    let latitude: number | null = null;
    let address: string = '';
    let name: string = '';
    let url: string = '';
    const locationContent: string | undefined = message.location;
  
    if (locationContent && locationContent.length > 0) {
      try {
        const node: any = JSON.parse(locationContent);
        // console.log('locationcontent node:', node);
  
        longitude =
          node.longitude !== undefined ? parseFloat(node.longitude) : null;
        latitude = node.latitude !== undefined ? parseFloat(node.latitude) : null;
        address = node.address !== undefined ? node.address : '';
        name = message.name;
        url = node.url !== undefined ? node.url : '';
      } catch (error) {
        console.error('Exception in getInboundLocationParams:', error);
      }
    }
  
    const location: LocationParams = {
      latitude: latitude,
      longitude: longitude,
      address: address,
      url: url,
      name: name,
    };
  
    return location;
  };

  private generateConversationId(): string {
    return uuid4();
  }

  private getLastMessageTimestamp(userHistory: XMessage[]): number {
    if (!userHistory || userHistory.length === 0) {
      return 0;
    }
    return new Date(userHistory[0].timestamp).getTime();
  }

  private shouldCreateNewConversation(lastMessageTimestamp: number, currentTimestamp: number): boolean {
    const TWENTY_MINUTES = 20 * 60 * 10**6; // 20 minutes in microseconds
    return currentTimestamp - lastMessageTimestamp > TWENTY_MINUTES;
  }

  updateConversationIdBasedOnUserHistory(xmsg: XMessage, userHistory: any): XMessage {
    this.userHistory = userHistory
    xmsg = this.manageConversation(xmsg)
    return xmsg;
  }

  private manageConversation(xmsg: XMessage): XMessage {
    const currentTimestamp = xmsg.timestamp;
    const lastMessageTimestamp = this.getLastMessageTimestamp(this.userHistory);

    if (this.shouldCreateNewConversation(lastMessageTimestamp, currentTimestamp)) {
      xmsg.messageId.conversationId = this.generateConversationId();
    } else if (this.userHistory.length > 0) {
      const lastConversationId = this.userHistory[0]?.messageId.conversationId;
      xmsg.messageId.conversationId = lastConversationId || this.generateConversationId();
    } else {
      xmsg.messageId.conversationId = this.generateConversationId();
    }

    return xmsg;

  }

  private processedXMessage = (
    message: GSWhatsAppMessage,
    xmsgPayload: XMessagePayload,
    to: SenderReceiverInfo,
    from: SenderReceiverInfo,
    messageState: MessageState,
    messageIdentifier: MessageId,
    messageType: MessageType
  ): XMessage => {
    const existingTransformer = (message as any).transformer || { metaData: {} };
    
    const xmsg = {
        to: to,
        from: from,
        channelURI: 'Whatsapp',
        providerURI: 'Gupshup',
        messageState: messageState,
        messageId: messageIdentifier,
        messageType: messageType,
        timestamp: (parseInt(message.timestamp as string) || Date.now()) * 10**3,
        payload: xmsgPayload,
        transformer: existingTransformer
    };
    this.manageConversation(xmsg);
    return xmsg;
  };
  
  private renderMessageChoices = (buttonChoices: ButtonChoice[] | null): string => {
    const processedChoicesBuilder: string[] = [];
  
    if (buttonChoices !== null) {
      for (const choice of buttonChoices) {
        processedChoicesBuilder.push(choice.text + '\n');
      }
  
      if (processedChoicesBuilder.length > 0) {
        // Remove the trailing newline character
        return processedChoicesBuilder.join('').slice(0, -1);
      }
    }
  
    return '';
  };
  
  private async searchUser(phoneNumber: string): Promise<string | null> {
    try {
      const response = await axios.get<UserSearchResponse>(
        `${this.providerConfig?.fusionAuthUrl}/api/user/search?queryString=${phoneNumber}&exactMatch=true`,
        {
          headers: {
            'x-application-id': `${this.providerConfig?.applicationId}`,
            'Authorization': `${this.providerConfig?.authToken}`
          }
        }
      );
      
      if (response.data.total > 0) {
        return response.data.users[0].id;
      }
      return null;
    } catch (error) {
      console.error('Error searching user:', error);
      return null;
    }
  }
  
  private async registerUser(phoneNumber: string): Promise<string | null> {
    try {
      const response = await axios.post<any>(
        `${this.providerConfig?.userServiceUrl}/api/signup`,
        {
          user: {
            active: true,
            username: phoneNumber,
            password: "00000000",
            data: {
              cmvideoCount: 0
            }
          },
          registration: {
            applicationId: `${this.providerConfig?.applicationId}`
          }
        },
        {
          headers: {
            'x-application-id': `${this.providerConfig?.applicationId}`,
            'Authorization': `${this.providerConfig?.authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.responseCode === 'OK' && response.data.result?.id) {
        return response.data.result.id;
      }
      console.error('User registration failed:', response.data.params.errMsg || 'Unknown error');
      return null;
    } catch (error) {
      console.error('Error registering user:', error);
      return null;
    }
  }
  
  // Convert GupShupWhatsAppMessage to XMessage
  convertMessageToXMsg = async (msg: any): Promise<XMessage> => {
    const message = msg as GSWhatsAppMessage;
    const phoneNumber = message.mobile;
    const from: SenderReceiverInfo = { 
      userID: '',
      deviceID: phoneNumber
    };
    const to: SenderReceiverInfo = { userID: 'admin' };

    if (this.providerConfig?.fusionAuthUrl && this.providerConfig?.userServiceUrl) {
      let userId = await this.searchUser(phoneNumber);

      if (!userId) {
        userId = await this.registerUser(phoneNumber);
      }

      from.userID = userId as string;
    } else {
      // not relevant for bhasai
      from.userID = phoneNumber;
    }

    const messageState: MessageState[] = [MessageState.REPLIED];
    const messageIdentifier: MessageId = { Id: uuid4() };
    if (message.messageId) {
      messageIdentifier.replyId = message.messageId;
    }
    const messageType: MessageType = message.type?.toUpperCase() as MessageType ?? MessageType.REPORT;
    // @ts-ignore
    const xmsgPayload: XMessagePayload = {};

    const thumbsUpEmojis = ['👍', '👍🏻', '👍🏼', '👍🏽', '👍🏾', '👍🏿'];
    const thumbsDownEmojis = ['👎', '👎🏻', '👎🏼', '👎🏽', '👎🏾', '👎🏿'];

    if (message.response != null) {
      const reportResponse = message.response;
      const participantJsonList: GSWhatsappReport[] = JSON.parse(reportResponse);
      for (const reportMsg of participantJsonList) {
        const eventType = reportMsg.eventType;
        xmsgPayload.text = '';
        from.deviceID = reportMsg.destAddr;
        messageState[0] = this.getMessageState(eventType);
      }

      return this.processedXMessage(
        message,
        xmsgPayload,
        to,
        from,
        messageState[0],
        messageIdentifier,
        messageType
      );
    }
    else if (thumbsUpEmojis.includes(message.text ?? '')) {
      return this.processedXMessage(
        message,
        xmsgPayload,
        from,
        to,
        MessageState.REPLIED,
        messageIdentifier,
        MessageType.FEEDBACK_POSITIVE,
      );
    }
    else if (thumbsDownEmojis.includes(message.text ?? '')) {
      return this.processedXMessage(
        message,
        xmsgPayload,
        from,
        to,
        MessageState.REPLIED,
        messageIdentifier,
        MessageType.FEEDBACK_NEGATIVE,
      );
    }
    else if (message.type === 'text' && message.text) {
      messageState[0] = MessageState.REPLIED;
      if (message.text.startsWith('\\register')) {
        xmsgPayload.text = message.text.replace('\\register ', '').trim();
        return this.processedXMessage(
          message,
          xmsgPayload,
          to,
          from,
          messageState[0],
          messageIdentifier,
          MessageType.REGISTRATION,
        );
      }
      else {
        xmsgPayload.text = message.text;
        return this.processedXMessage(
          message,
          xmsgPayload,
          to,
          from,
          messageState[0],
          messageIdentifier,
          messageType
        );
      }
    } else if (message.type === 'interactive') {
  
      messageState[0] = MessageState.REPLIED;
      xmsgPayload.text = this.getInboundInteractiveContentText(message);
  
      return this.processedXMessage(
        message,
        xmsgPayload,
        to,
        from,
        messageState[0],
        messageIdentifier,
        MessageType.TEXT
      );
    } else if (message.type === 'location') {
  
      messageState[0] = MessageState.REPLIED;
      xmsgPayload.location = this.getInboundLocationParams(message);
      xmsgPayload.text = '';
  
      return this.processedXMessage(
        message,
        xmsgPayload,
        to,
        from,
        messageState[0],
        messageIdentifier,
        messageType
      );
    } else if (this.isInboundMediaMessage(message.type)) {
  
      messageState[0] = MessageState.REPLIED;
      xmsgPayload.text = '';
      xmsgPayload.media = [ await this.getMediaInfo(message) ];

      return this.processedXMessage(
        message,
        xmsgPayload,
        to,
        from,
        messageState[0],
        messageIdentifier,
        messageType
      );
    } else if (message.type === 'button') {

      return this.processedXMessage(
        message,
        xmsgPayload,
        to,
        from,
        messageState[0],
        messageIdentifier,
        messageType
      );
    }
  
    throw new Error('Invalid message type');
  };
  
  private optInUser = async (
    xMsg: XMessage,
    usernameHSM: string,
    passwordHSM: string,
    username2Way: string,
    password2Way: string
  ): Promise<void> => {
    const optInBuilder = new URL('https://media.smsgupshup.com/GatewayAPI/rest');
    optInBuilder.searchParams.append('v', '1.1');
    optInBuilder.searchParams.append('format', 'json');
    optInBuilder.searchParams.append('auth_scheme', 'plain');
    optInBuilder.searchParams.append('method', 'OPT_IN');
    optInBuilder.searchParams.append('userid', usernameHSM);
    optInBuilder.searchParams.append('password', passwordHSM);
    optInBuilder.searchParams.append('channel', 'Whatsapp');
    optInBuilder.searchParams.append('send_to', xMsg.to?.deviceID as string);
    optInBuilder.searchParams.append('messageId', '123456789');
  
    const expanded = optInBuilder;
    // console.log(expanded);
  
    try {
      const response = await axios.get<string>(expanded.toString());
      // console.log(response.data);
    } catch (error: any) {
      console.error('Error:', error.response?.data || error.message || error);
    }
  }
  
  private createSectionRow = (id: string, title: string): SectionRow => {
    return {
      id: id,
      title: title,
    };
  }

  sendOutboundMessage = (url: string, body: any): Promise<GSWhatsappOutBoundResponse> => {
    return new Promise<GSWhatsappOutBoundResponse>((resolve, reject) => {
      axios.create()
        .post<GSWhatsappOutBoundResponse>(url, body)
        .then((response: AxiosResponse<GSWhatsappOutBoundResponse>) => {
          resolve(response.data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
  
  private getOutboundListActionContent = (xMsg: XMessage): string => {
    const rows: SectionRow[] = xMsg.payload.buttonChoices?.choices?.map((choice) =>
      this.createSectionRow(choice.key, choice.text)
    ) || [{ id: '', title: '' }];
  
    const action: Action = {
      button: 'Options',
      sections: [
        {
          title: 'Choose an option',
          rows: rows,
        },
      ],
    };
  
    try {
      const content: string = JSON.stringify(action);
      const node: Action = JSON.parse(content);
      const data: { button?: string; sections?: Section[] } = {};
  
      data.button = node.button || undefined;
      data.sections = node.sections || undefined;
      return JSON.stringify(data);
    } catch (error: any) {
      console.error(`Exception in getOutboundListActionContent: ${error}`);
    }
  
    return '';
  }
  
  private getOutboundQRBtnActionContent = (xMsg: XMessage): string => {
    const buttons: Button[] = [];
  
    xMsg.payload.buttonChoices?.choices?.forEach((choice) => {
      const button: Button = {
        type: 'reply',
        reply: {
          id: choice.key,
          title: choice.text,
        },
      };
      buttons.push(button);
    });
  
    const action: Action = {
      buttons: buttons,
    };
  
    try {
      const content: string = JSON.stringify(action);
      const node = JSON.parse(content);
      const data: any = {};
  
      data.buttons = node.buttons;
      return JSON.stringify(data);
    } catch (error: any) {
      console.error(`Exception in getOutboundQRBtnActionContent: ${error}`);
    }
  
    return '';
  }
  
  private getURIBuilder = (): URLSearchParams => {
    const queryParams = new URLSearchParams();
    queryParams.append('v', '1.1');
    queryParams.append('format', 'json');
    queryParams.append('auth_scheme', 'plain');
    queryParams.append('extra', 'Samagra');
    queryParams.append('data_encoding', 'text');
    queryParams.append('messageId', '123456789');
    return queryParams;
  }
  
  private setBuilderCredentialsAndMethod = (
    queryParams: URLSearchParams,
    method: string,
    username: string,
    password: string
  ): URLSearchParams => {
    queryParams.append('method', method);
    queryParams.append('userid', username);
    queryParams.append('password', password);
    return queryParams;
  }
  
  // Convert XMessage to GupShupWhatsAppMessage
  async sendMessage (xMsg: XMessage) {
    if (!this.providerConfig) {
      console.error("Configuration not set for adapter!");
      return;
    }
    try {
      if (
        (this.providerConfig.usernameHSM && this.providerConfig.passwordHSM) ||
        (this.providerConfig.username2Way && this.providerConfig.password2Way)
      ) {
        let text: string = xMsg.payload.text || '';
        let builder = this.getURIBuilder();
        xMsg.to.userID = await this.getUserById(xMsg.to.userID)
  
        if (xMsg.messageState === MessageState.OPTED_IN) {
          text += this.renderMessageChoices(xMsg.payload.buttonChoices?.choices || []);
  
          builder = this.setBuilderCredentialsAndMethod(
            builder,
            MethodType.OPTIN,
            this.providerConfig.username2Way,
            this.providerConfig.password2Way,
          );
          builder.set('channel', xMsg.channelURI.toLowerCase());
          builder.set('send_to',xMsg.to.deviceID as string);
          builder.set('phone_number', xMsg.to.deviceID as string);
        } else if (
          xMsg.messageType !== null &&
          xMsg.messageType === MessageType.HSM
        ) {
          this.optInUser(
            xMsg,
            this.providerConfig.usernameHSM,
            this.providerConfig.passwordHSM,
            this.providerConfig.username2Way,
            this.providerConfig.password2Way,
          );
  
          text += this.renderMessageChoices(xMsg.payload.buttonChoices?.choices || []);
  
          builder = this.setBuilderCredentialsAndMethod(
            builder,
            MethodType.SIMPLEMESSAGE,
            this.providerConfig.usernameHSM,
            this.providerConfig.passwordHSM,
          );
  
          builder.set('send_to', xMsg.to.deviceID as string);
          builder.set('msg', text);
          builder.set('isHSM', 'true');
          builder.set('msg_type', MessageType.HSM);
        } else if (
          xMsg.messageType !== null &&
          xMsg.messageType === MessageType.HSM_WITH_BUTTON
        ) {
          this.optInUser(
            xMsg,
            this.providerConfig.usernameHSM,
            this.providerConfig.passwordHSM,
            this.providerConfig.username2Way,
            this.providerConfig.password2Way,
          );
  
          text += this.renderMessageChoices(xMsg.payload.buttonChoices?.choices || []);
  
          builder = this.setBuilderCredentialsAndMethod(
            builder,
            MethodType.OPTIN,
            this.providerConfig.usernameHSM,
            this.providerConfig.passwordHSM,
          );
  
          builder.set('send_to', xMsg.to.deviceID as string);
          builder.set('msg', text);
          builder.set('isTemplate', 'true');
          builder.set('msg_type', MessageType.HSM);
        } else if (xMsg.messageState === MessageState.REPLIED) {
          let plainText: boolean = true;
          // let msgType: MessageType = MessageType.TEXT;
          const stylingTag: StylingTag | undefined =
            xMsg.payload.stylingTag !== null
              ? xMsg.payload.stylingTag
              : undefined;
          builder = this.setBuilderCredentialsAndMethod(
            builder,
            MethodType.SIMPLEMESSAGE,
            this.providerConfig.username2Way,
            this.providerConfig.password2Way,
          );
  
          builder.set('send_to', xMsg.to.deviceID as string);
          builder.set('phone_number', xMsg.to.deviceID as string);
          builder.set('msg_type', xMsg.messageType);
          builder.set('channel', 'Whatsapp');
          if (xMsg.messageId.Id) {
            builder.set('msg_id', xMsg.messageId.Id);
          }

          if (
            stylingTag !== undefined &&
            FileUtil.isStylingTagIntercativeType(stylingTag) &&
            FileUtil.validateInteractiveStylingTag(xMsg.payload)
          ) {
            if (stylingTag === StylingTag.LIST) {
              const content: string = this.getOutboundListActionContent(xMsg);
              // console.log('list content: ', content);
  
              if (content.length > 0) {
                builder.set('interactive_type', 'list');
                builder.set('action', content);
                builder.set('msg', text);
                plainText = false;
              }
            } else if (stylingTag === StylingTag.QUICKREPLYBTN) {
              const content: string = this.getOutboundQRBtnActionContent(xMsg);
              // console.log('QR btn content: ', content);
  
              if (content.length > 0) {
                builder.set('interactive_type', 'dr_button');
                builder.set('action', content);
                builder.set('msg', text);
                plainText = false;
              }
            }
          }

          // Note: We only support single media per message for now.
          if (xMsg.payload.media && xMsg.payload.media.length && xMsg.payload.media[0].url) {
            const media: MessageMedia = xMsg.payload.media[0];

            builder.set('method', MethodType.MEDIAMESSAGE);
            builder.set(
              'msg_type',
              this.getMessageTypeByMediaCategory(media.category!)
            );
  
            builder.set('media_url', media.url!);
            if (media.caption) {
              builder.set('caption', media.caption);
            }
            if (media.filename) {
              builder.set('filename', media.filename)
            }
            builder.set('isHSM', 'false');
            plainText = false;
          }
  
          if (plainText) {
            text += this.renderMessageChoices(xMsg.payload.buttonChoices?.choices || []);
            builder.set('msg', text);
          }
        }
  
        console.log(text);
        const postParams = Object.fromEntries(builder);

        
        const expanded = new URL(
          `https://media.smsgupshup.com/GatewayAPI/rest`
        );
        // console.log(expanded);
  
        try {
          const response: GSWhatsappOutBoundResponse = await this.sendOutboundMessage(
            expanded.toString(),
            postParams
          );
  
          if (response !== null && response.response.status === 'success') {
            xMsg.messageId = MessageId.builder()
              .setChannelMessageId(response.response.id)
              .build();
            xMsg.messageState = MessageState.SENT;
            return xMsg;
          } else {
            console.error(
              'Gupshup Whatsapp Message not sent: ',
              response.response.details
            );
            xMsg.messageState = MessageState.NOT_SENT;
            return xMsg;
          }
        } catch (error) {
          console.error('Error in Send GS Whatsapp Outbound Message', error);
        }
      } else {
        console.error('Credentials not found');
        xMsg.messageState = MessageState.NOT_SENT;
        return xMsg;
      }
    } catch (error) {
      console.error('Error in processing outbound message', error);
      throw error;
    }
  };
}
