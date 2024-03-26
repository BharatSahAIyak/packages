import axios, { AxiosResponse } from 'axios';
import { GSWhatsAppMessage, MediaSizeLimit, MethodType } from './types';
import {
  StylingTag,
  MessageMediaError,
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
import { uploadFileFromPath } from './minioClient';

export type IGSWhatsappConfig = {
  password2Way: string,
  passwordHSM: string,
  username2Way: string,
  usernameHSM: string,
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

type GSWhatsappOutBoundResponse = {
  response: GSResponse;
}

type SectionRow = {
  id: string;
  title: string;
}

export class GupshupWhatsappProvider implements XMessageProvider {

  private readonly providerConfig?: IGSWhatsappConfig;

  constructor(config?: IGSWhatsappConfig) {
    this.providerConfig = config;
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
  
  private getMediaCategoryByMimeType = (mimeType: string): MediaCategory | null => {
    let category: MediaCategory | null = null;
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
    const result: Record<string, any> = {};
  
    let mediaUrl = '';
    let mime_type = '';
    let category: any = null;
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
        // console.log('media content node:', node);
  
        const url = node.url || '';
        const signature = node.signature || '';
        mime_type = node.mime_type || '';
  
        mediaUrl = url + signature;
  
        category = this.getMediaCategoryByMimeType(mime_type);
      } catch (error: any) {
        console.error('Exception in getMediaInfo:', error);
      }
    }
  
    result.mediaUrl = mediaUrl;
    result.mime_type = mime_type;
    result.category = category;
  
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
  
  private uploadInboundMediaFile = async (
    messageId: string,
    mediaUrl: string,
    mime_type: string
  ): Promise<Record<string, any>> => {
    const result: Record<string, any> = {};
    const mediaSizeLimit = new MediaSizeLimit(
      /* imageSize: */ 10, // 10 MB
      /* audioSize: */ 5,
      /* videoSize: */ 20,
      /* documentSize: */ 15
    );
    const maxSizeForMedia: number = mediaSizeLimit.getMaxSizeForMedia(mime_type);
    let name = '';
    let url = '';
  
    if (mediaUrl && mediaUrl.length > 0) {
      const inputBytes: Uint8Array | null =
        await FileUtil.getInputBytesFromUrl(mediaUrl);
  
      if (inputBytes) {
        const sizeError: string = FileUtil.validateFileSizeByInputBytes(
          inputBytes,
          maxSizeForMedia
        );
  
        if (sizeError === '') {
          // Unique File Name
          name = FileUtil.getUploadedFileName(mime_type, messageId);
          const filePath: string | null = await FileUtil.fileToLocalFromBytes(
            inputBytes,
            mime_type,
            name
          );
  
          if (filePath && filePath.length > 0) {
            url = await uploadFileFromPath(filePath, name);
          } else {
            result.size = 0;
            result.error = MessageMediaError.EMPTY_RESPONSE;
          }
        } else {
          result.size = inputBytes.length;
          result.error = MessageMediaError.PAYLOAD_TOO_LARGE;
        }
      } else {
        result.size = 0;
        result.error = MessageMediaError.EMPTY_RESPONSE;
      }
    } else {
      result.size = 0;
      result.error = MessageMediaError.EMPTY_RESPONSE;
    }
  
    result.name = name;
    result.url = url;
  
    return result;
  };
  
  private getInboundMediaMessage = async (
    message: GSWhatsAppMessage
  ): Promise<MessageMedia> => {
    try {
      const mediaInfo: Record<string, any> = await this.getMediaInfo(message);
      const mediaData: Record<string, any> = await this.uploadInboundMediaFile(
        message.messageId || '',
        mediaInfo.mediaUrl,
        mediaInfo.mime_type
      );
  
      // console.log('media data:', mediaData);
  
      const media: MessageMedia = {
        text: mediaData.name,
        url: mediaData.url,
        category: mediaInfo.category as MediaCategory,
      };
  
      if (mediaData.error) {
        media.messageMediaError = mediaData.error as MessageMediaError;
      }
  
      if (mediaData.size) {
        media.size = mediaData.size as number;
      }
  
      return media;
    } catch (err) {
      console.log('Error in getInboundMediaMessage:', err);
      return {} as MessageMedia;
    }
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
  
  private processedXMessage = (
    message: GSWhatsAppMessage,
    xmsgPayload: XMessagePayload,
    to: SenderReceiverInfo,
    from: SenderReceiverInfo,
    messageState: MessageState,
    messageIdentifier: MessageId,
    messageType: MessageType
  ): XMessage => {
    return {
      to: to,
      from: from,
      channelURI: 'Whatsapp',
      providerURI: 'Gupshup',
      messageState: messageState,
      messageId: messageIdentifier,
      messageType: messageType,
      timestamp: parseInt(message.timestamp as string) || Date.now(),
      payload: xmsgPayload,
    };
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
  
  // Convert GupShupWhatsAppMessage to XMessage
  convertMessageToXMsg = async (msg: any): Promise<XMessage> => {
    const message = msg as GSWhatsAppMessage;
    const from: SenderReceiverInfo = { userID: '' }; // Replace with actual initialization
    const to: SenderReceiverInfo = { userID: 'admin' }; // Replace with actual initialization
  
    const messageState: MessageState[] = [MessageState.REPLIED];
    const messageIdentifier: MessageId = { Id: uuid4() }; // Replace with actual initialization
    const messageType: MessageType = message.type?.toUpperCase() as MessageType ?? MessageType.REPORT;
    // @ts-ignore
    const xmsgPayload: XMessagePayload = {}; // Replace with actual initialization

    const thumbsUpEmojis = ['👍', '👍🏻', '👍🏼', '👍🏽', '👍🏾', '👍🏿'];
    const thumbsDownEmojis = ['👎', '👎🏻', '👎🏼', '👎🏽', '👎🏾', '👎🏿'];

    if (message.response != null) {
      const reportResponse = message.response;
      const participantJsonList: GSWhatsappReport[] = JSON.parse(reportResponse);
      for (const reportMsg of participantJsonList) {
        const eventType = reportMsg.eventType;
        xmsgPayload.text = '';
        messageIdentifier.channelMessageId = reportMsg.externalId;
        from.userID = reportMsg.destAddr.substring(2);
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
    else if (thumbsUpEmojis.includes(msg.text)) {
      from.userID = message.mobile.substring(2);
      if (message.messageId) {
        messageIdentifier.channelMessageId = message.messageId;
      }
      return this.processedXMessage(
        msg,
        xmsgPayload,
        from,
        to,
        MessageState.REPLIED,
        messageIdentifier,
        MessageType.FEEDBACK_POSITIVE,
      );
    }
    else if (thumbsDownEmojis.includes(msg.text)) {
      from.userID = message.mobile.substring(2);
      if (message.messageId) {
        messageIdentifier.channelMessageId = message.messageId;
      }
      return this.processedXMessage(
        msg,
        xmsgPayload,
        from,
        to,
        MessageState.REPLIED,
        messageIdentifier,
        MessageType.FEEDBACK_POSITIVE,
      );
    }
    else if (message.type === 'text' && message.text) {
      from.userID = message.mobile.substring(2);
      if (message.replyId) {
        messageIdentifier.replyId = message.replyId || '';
      }
      if (message.messageId) {
          messageIdentifier.channelMessageId = message.messageId;
      }
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
      from.userID = message.mobile.substring(2);
      messageIdentifier.replyId = message.replyId;
  
      messageState[0] = MessageState.REPLIED;
      xmsgPayload.text = this.getInboundInteractiveContentText(message);
      messageIdentifier.channelMessageId = message.messageId || '';
  
      return this.processedXMessage(
        message,
        xmsgPayload,
        to,
        from,
        messageState[0],
        messageIdentifier,
        messageType
      );
    } else if (message.type === 'location') {
      from.userID = message.mobile.substring(2);
      messageIdentifier.replyId = message.replyId;
  
      messageState[0] = MessageState.REPLIED;
      xmsgPayload.location = this.getInboundLocationParams(message);
      xmsgPayload.text = '';
      messageIdentifier.channelMessageId = message.messageId || '';
  
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
      from.userID = message.mobile.substring(2);
      messageIdentifier.replyId = message.replyId;
  
      messageState[0] = MessageState.REPLIED;
      xmsgPayload.text = '';
      xmsgPayload.media = [await this.getInboundMediaMessage(message)];
      messageIdentifier.channelMessageId = message.messageId || '';

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
      from.userID = message.mobile.substring(2);

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
    const phoneNumber = '91' + xMsg.to.userID;
    const optInBuilder = new URL('https://media.smsgupshup.com/GatewayAPI/rest');
    optInBuilder.searchParams.append('v', '1.1');
    optInBuilder.searchParams.append('format', 'json');
    optInBuilder.searchParams.append('auth_scheme', 'plain');
    optInBuilder.searchParams.append('method', 'OPT_IN');
    optInBuilder.searchParams.append('userid', usernameHSM);
    optInBuilder.searchParams.append('password', passwordHSM);
    optInBuilder.searchParams.append('channel', 'Whatsapp');
    optInBuilder.searchParams.append('send_to', phoneNumber);
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

  private sendOutboundMessage = (url: string): Promise<GSWhatsappOutBoundResponse> => {
    return new Promise<GSWhatsappOutBoundResponse>((resolve, reject) => {
      axios.create()
        .get<GSWhatsappOutBoundResponse>(url)
        .then((response: AxiosResponse<GSWhatsappOutBoundResponse>) => {
          resolve(response.data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
  
  private getOutboundListActionContent = (xMsg: XMessage): string => {
    const rows: SectionRow[] = xMsg.payload.buttonChoices?.map((choice) =>
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
  
    xMsg.payload.buttonChoices?.forEach((choice) => {
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

  private async sendLocationMessage(
    to: string,
    locationParams: LocationParams
  ): Promise<void> {
  
    const { longitude, latitude, name, address } = locationParams;
  
    if (!longitude || !latitude || !name || !address) {
      throw new Error('Missing location parameters for sending location message');
    }
  
    const baseUrl = 'https://media.smsgupshup.com/GatewayAPI/rest';
  
    const queryParams = new URLSearchParams();
    queryParams.append('method', 'SendMessage');
    queryParams.append('msg_type', 'LOCATION');
    queryParams.append('userid', this.providerConfig?.username2Way ?? '');
    queryParams.append('password', this.providerConfig?.password2Way ?? '');
    queryParams.append('send_to', to);
    queryParams.append('location', JSON.stringify({
      longitude: longitude.toString(),
      latitude: latitude.toString(),
      name,
      address
    }));
  
    const fullUrl = `${baseUrl}?${queryParams.toString()}`;
  
    try {
      const response = await axios.get(fullUrl);
      console.log('Location message sent:', response.data);
    } catch (error) {
      console.error('Error sending location message:', error);
      throw error;
    }
  }

  private async sendAudioMessage(xMsg: XMessage, media: MessageMedia): Promise<void> {
    try {
      const { url } = media;
      if (!url) {
        console.error('Audio URL is missing');
        return;
      }
  
      const phoneNumber = '91' + xMsg.to.userID;
      const baseUrl = 'https://media.smsgupshup.com/GatewayAPI/rest';
      const queryParams = new URLSearchParams();
      queryParams.append('method', 'SendMessage');
      queryParams.append('msg_type', 'AUDIO');
      queryParams.append('userid', this.providerConfig?.username2Way ?? '');
      queryParams.append('password', this.providerConfig?.password2Way ?? '');
      queryParams.append('send_to', phoneNumber);
      queryParams.append('audio', JSON.stringify({ url }));
  
      const fullUrl = `${baseUrl}?${queryParams.toString()}`;
      const response = await axios.get(fullUrl);
      console.log('Audio message sent:', response.data);
    } catch (error) {
      console.error('Error sending audio message:', error);
      throw error;
    }
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
        
        if (xMsg.messageType === MessageType.LOCATION && xMsg.payload.location) {
          await this.sendLocationMessage(`91${xMsg.to.userID}`, xMsg.payload.location);
          xMsg.messageState = MessageState.SENT;
          return; 
        }

        if (xMsg.payload.media && xMsg.payload.media.length > 0) {
          const media: MessageMedia = xMsg.payload.media[0];
          const isAudio: boolean = media.category === MediaCategory.AUDIO;
        
          if (isAudio) {
            await this.sendAudioMessage(xMsg, media);
            return;
          }

          builder.set('method', MethodType.MEDIAMESSAGE);
          let plainText = true;
          if (media.url && media.category) {
            builder.set('msg_type', this.getMessageTypeByMediaCategory(media.category));
            builder.set('media_url', media.url);
            builder.set('caption', media.text || '');
            builder.set('isHSM', 'false');
            plainText = false;
          } else {
            console.error('Media URL or category is missing');
          }
        }                        

        if (xMsg.messageState === MessageState.OPTED_IN) {
          text += this.renderMessageChoices(xMsg.payload.buttonChoices || []);
  
          builder = this.setBuilderCredentialsAndMethod(
            builder,
            MethodType.OPTIN,
            this.providerConfig.username2Way,
            this.providerConfig.password2Way,
          );
  
          builder.set('channel', xMsg.channelURI.toLowerCase());
          builder.set('send_to', '91' + xMsg.to.userID);
          builder.set('phone_number', '91' + xMsg.to.userID);
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
  
          text += this.renderMessageChoices(xMsg.payload.buttonChoices || []);
  
          builder = this.setBuilderCredentialsAndMethod(
            builder,
            MethodType.SIMPLEMESSAGE,
            this.providerConfig.usernameHSM,
            this.providerConfig.passwordHSM,
          );
  
          builder.set('send_to', '91' + xMsg.to.userID);
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
  
          text += this.renderMessageChoices(xMsg.payload.buttonChoices || []);
  
          builder = this.setBuilderCredentialsAndMethod(
            builder,
            MethodType.OPTIN,
            this.providerConfig.usernameHSM,
            this.providerConfig.passwordHSM,
          );
  
          builder.set('send_to', '91' + xMsg.to.userID);
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
  
          builder.set('send_to', '91' + xMsg.to.userID);
          builder.set('phone_number', '91' + xMsg.to.userID);
          builder.set('msg_type', xMsg.messageType);
          builder.set('channel', 'Whatsapp');
          if (xMsg.messageId.channelMessageId) {
            builder.set('msg_id', xMsg.messageId.channelMessageId);
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
  
          if (xMsg.payload.media && xMsg.payload.media.length > 0) {
            const media: MessageMedia = xMsg.payload.media[0];
            builder.set('method', MethodType.MEDIAMESSAGE);
            if (media.url && media.category) {
              builder.set('msg_type', this.getMessageTypeByMediaCategory(media.category));
              builder.set('media_url', media.url);
              builder.set('caption', media.text || '');
              builder.set('isHSM', 'false');
              plainText = false;
            } else {
              console.error('Media URL or category is missing');
            }
          }          
  
          if (plainText) {
            text += this.renderMessageChoices(xMsg.payload.buttonChoices || []);
            builder.set('msg', text);
          }
        }
  
        console.log(text);
        const expanded = new URL(
          `https://media.smsgupshup.com/GatewayAPI/rest?${builder}`
        );
        // console.log(expanded);
  
        try {
          const response: GSWhatsappOutBoundResponse = await this.sendOutboundMessage(
            expanded.toString()
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
