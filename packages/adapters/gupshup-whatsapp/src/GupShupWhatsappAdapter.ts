import axios, { AxiosInstance, AxiosResponse } from 'axios';
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
} from '@samagra-x/xmessage';
import { FileUtil } from './utils';
import { URLSearchParams } from 'url';
import { uploadFileFromPath } from './minioClient';
import configService from './gupshupWhatsappAdapterServiceConfig';

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

const getMessageState = (eventType: String): MessageState => {
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

const isInboundMediaMessage = (type: String) => {
  // Implement the logic to check if the message type is a media message
  return (
    type === 'image' || type === 'audio' || type === 'video' || type === 'file'
  );
};

const getInboundInteractiveContentText = (message: GSWhatsAppMessage) => {
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

const getMediaCategoryByMimeType = (mimeType: string): MediaCategory | null => {
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

const getMediaInfo = async (message: GSWhatsAppMessage) => {
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

      category = getMediaCategoryByMimeType(mime_type);
    } catch (error: any) {
      console.error('Exception in getMediaInfo:', error);
    }
  }

  result.mediaUrl = mediaUrl;
  result.mime_type = mime_type;
  result.category = category;

  return result;
};

const getMessageTypeByMediaCategory = (
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

const uploadInboundMediaFile = async (
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

const getInboundMediaMessage = async (
  message: GSWhatsAppMessage
): Promise<MessageMedia> => {
  try {
    const mediaInfo: Record<string, any> = await getMediaInfo(message);
    const mediaData: Record<string, any> = await uploadInboundMediaFile(
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

const getInboundLocationParams = (
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

const processedXMessage = (
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
    channelURI: 'WhatsApp',
    providerURI: 'gupshup',
    messageState: messageState,
    messageId: messageIdentifier,
    messageType: messageType,
    timestamp: parseInt(message.timestamp as string) || Date.now(),
    payload: xmsgPayload,
  };
};

const renderMessageChoices = (buttonChoices: ButtonChoice[] | null): string => {
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

function generateNewMessageId(): string {
  const fMin = BigInt('4000000000000000000'); // 19 characters
  const fMax = BigInt('4999999999999999999'); // 19 characters
  const first = BigInt(
    Math.floor(Number(fMin) + Math.random() * (Number(fMax) - Number(fMin) + 1))
  );

  const sMin = BigInt('100000000000000000'); // 18 characters
  const sMax = BigInt('999999999999999999'); // 18 characters
  const second = BigInt(
    Math.floor(Number(sMin) + Math.random() * (Number(sMax) - Number(sMin) + 1))
  );

  return first + '-' + second;
}

// Convert GupShupWhatsAppMessage to XMessage
export const convertMessageToXMsg = async (msg: any): Promise<XMessage> => {
  const message = msg as GSWhatsAppMessage;
  const from: SenderReceiverInfo = { userID: '' }; // Replace with actual initialization
  const to: SenderReceiverInfo = { userID: 'admin' }; // Replace with actual initialization

  const messageState: MessageState[] = [MessageState.REPLIED];
  const messageIdentifier: MessageId = { channelMessageId: '' }; // Replace with actual initialization
  const messageType: MessageType = message.type.toUpperCase() as MessageType;
  // @ts-ignore
  const xmsgPayload: XMessagePayload = {}; // Replace with actual initialization

  if (
    message.response == null &&
    (message.messageId == null || message.messageId === '')
  ) {
    message.messageId = generateNewMessageId();
  }

  if (message.response != null) {
    const reportResponse = message.response;
    const participantJsonList: GSWhatsappReport[] = JSON.parse(reportResponse);
    for (const reportMsg of participantJsonList) {
      const eventType = reportMsg.eventType;
      xmsgPayload.text = '';
      messageIdentifier.channelMessageId = reportMsg.externalId;
      from.userID = reportMsg.destAddr.substring(2);
      messageState[0] = getMessageState(eventType);
    }

    return processedXMessage(
      message,
      xmsgPayload,
      to,
      from,
      messageState[0],
      messageIdentifier,
      messageType
    );
  } else if (message.type === 'text' && message.text) {
    from.userID = message.mobile.substring(2);
    messageIdentifier.replyId = message.replyId || '';

    // if (message.type === 'OPT_IN') {
    //   messageState[0] = MessageState.OPTED_IN;
    // } else if (message.type === 'OPT_OUT') {
    //   xmsgPayload.text = 'stop-wa';
    //   messageState[0] = MessageState.OPTED_OUT;
    // } else {
    //   messageState[0] = MessageState.REPLIED;
    //   xmsgPayload.text = message.text;
    //   messageIdentifier.channelMessageId = message.messageId;
    // }

    messageState[0] = MessageState.REPLIED;
    xmsgPayload.text = message.text;
    messageIdentifier.channelMessageId = message.messageId || '';

    return processedXMessage(
      message,
      xmsgPayload,
      to,
      from,
      messageState[0],
      messageIdentifier,
      messageType
    );
  } else if (message.type === 'interactive') {
    from.userID = message.mobile.substring(2);
    messageIdentifier.replyId = message.replyId;

    messageState[0] = MessageState.REPLIED;
    xmsgPayload.text = getInboundInteractiveContentText(message);
    messageIdentifier.channelMessageId = message.messageId || '';

    return processedXMessage(
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
    xmsgPayload.location = getInboundLocationParams(message);
    xmsgPayload.text = '';
    messageIdentifier.channelMessageId = message.messageId || '';

    return processedXMessage(
      message,
      xmsgPayload,
      to,
      from,
      messageState[0],
      messageIdentifier,
      messageType
    );
  } else if (isInboundMediaMessage(message.type)) {
    from.userID = message.mobile.substring(2);
    messageIdentifier.replyId = message.replyId;

    messageState[0] = MessageState.REPLIED;
    xmsgPayload.text = '';
    xmsgPayload.media = await getInboundMediaMessage(message);
    messageIdentifier.channelMessageId = message.messageId || '';

    return processedXMessage(
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

    return processedXMessage(
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

async function optInUser(
  xMsg: XMessage,
  usernameHSM: string,
  passwordHSM: string,
  username2Way: string,
  password2Way: string
): Promise<void> {
  const phoneNumber = '91' + xMsg.to.userID;
  const optInBuilder = new URL('https://media.smsgupshup.com/GatewayAPI/rest');
  optInBuilder.searchParams.append('v', '1.1');
  optInBuilder.searchParams.append('format', 'json');
  optInBuilder.searchParams.append('auth_scheme', 'plain');
  optInBuilder.searchParams.append('method', 'OPT_IN');
  optInBuilder.searchParams.append('userid', usernameHSM);
  optInBuilder.searchParams.append('password', passwordHSM);
  optInBuilder.searchParams.append('channel', 'WHATSAPP');
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

interface SectionRow {
  id: string;
  title: string;
}

function createSectionRow(id: string, title: string): SectionRow {
  return {
    id: id,
    title: title,
  };
}

interface Section {
  title: string;
  rows: SectionRow[];
}

interface Button {
  type: string;
  reply: ReplyButton;
}

interface ReplyButton {
  id: string;
  title: string;
}

interface Action {
  buttons?: Button[] | null;
  button?: string | null;
  sections?: Section[];
}

interface GSResponse {
  id: string;
  phone: string;
  details: string;
  status: string;
}

interface GSWhatsappOutBoundResponse {
  response: GSResponse;
}

class GSWhatsappService {
  private static gupshuupService: GSWhatsappService | null = null;
  private readonly webClient: AxiosInstance;

  private constructor() {
    this.webClient = axios.create();
  }

  public static getInstance(): GSWhatsappService {
    if (GSWhatsappService.gupshuupService === null) {
      GSWhatsappService.gupshuupService = new GSWhatsappService();
    }
    return GSWhatsappService.gupshuupService;
  }

  public sendOutboundMessage(url: string): Promise<GSWhatsappOutBoundResponse> {
    return new Promise<GSWhatsappOutBoundResponse>((resolve, reject) => {
      this.webClient
        .get<GSWhatsappOutBoundResponse>(url)
        .then((response: AxiosResponse<GSWhatsappOutBoundResponse>) => {
          resolve(response.data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
}

function getOutboundListActionContent(xMsg: XMessage): string {
  const rows: SectionRow[] = xMsg.payload.buttonChoices?.map((choice) =>
    createSectionRow(choice.key, choice.text)
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

function getOutboundQRBtnActionContent(xMsg: XMessage): string {
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

function getURIBuilder(): URLSearchParams {
  const queryParams = new URLSearchParams();
  queryParams.append('v', '1.1');
  queryParams.append('format', 'json');
  queryParams.append('auth_scheme', 'plain');
  queryParams.append('extra', 'Samagra');
  queryParams.append('data_encoding', 'text');
  queryParams.append('messageId', '123456789');
  return queryParams;
}

function setBuilderCredentialsAndMethod(
  queryParams: URLSearchParams,
  method: string,
  username: string,
  password: string
): URLSearchParams {
  queryParams.append('method', method);
  queryParams.append('userid', username);
  queryParams.append('password', password);
  return queryParams;
}

export const getAdapterByID = async (
  adapterID: string
): Promise<JsonNode | null> => {
  // console.log(
  //   `BotService:getAdapterByID::Calling get adapter by id from uci api: ${adapterID}`
  // );

  // if (cache.has(cacheKey)) {
  //   console.log(`getAdapterByID from cache: ${cache.get(cacheKey)}`);
  //   return cache.get(cacheKey);
  // } else {
  //   console.log(`getAdapterByID from webclient: ${cache.get(cacheKey)}`);
  const config = {
    headers: {
      'admin-token': configService.getConfig('adminToken'),
    },
  };
  try {
    const response = await axios.get(
      `${configService.getConfig('baseUrl')}/admin/adapter/${adapterID}`,
      config
    );
    // console.log(
    //   `BotService:getAdapterByID::Got Data From UCI Api : cache key : ${cacheKey} cache data : ${cache.get(
    //     cacheKey
    //   )}`
    // );

    if (response.data !== null) {
      const root = response.data;

      if (
        root != null &&
        root.result != null &&
        root.result.id != null &&
        root.result.id !== ''
      ) {
        return root.result;
      }

      return null;
    } else {
      return null;
    }
  } catch (error: any) {
    console.error(`BotService:getAdapterByID::Exception: ${error}`);
    return null;
  }
  // }
};

export const getAdapterCredentials = async (
  adapterID: string
): Promise<JsonNode | null> => {
  const cacheKey = `adapter-credentials: ${adapterID}`;
  const adapter = await getAdapterByID(adapterID);
  // console.log(`getAdapterByID: ${JSON.stringify(adapter)}`);

  if (adapter !== null) {
    let vaultKey: string | null;
    try {
      vaultKey = adapter.config.credentials.variable;
    } catch (ex: any) {
      console.error(
        `Exception in fetching adapter variable from json node: ${ex}`
      );
      vaultKey = null;
    }

    if (vaultKey !== null && vaultKey !== '') {
      return await getVaultCredentials(vaultKey);
    }
  }

  return null;
};

type JsonNode = Record<string, any>;

export const getVaultCredentials = async (
  secretKey: string
): Promise<JsonNode | null> => {
  const adminToken = configService.getConfig('vaultServiceToken');

  if (adminToken === null || adminToken === undefined || adminToken === '') {
    return null;
  }

  const webClient = axios.create({
    baseURL: configService.getConfig('vaultServiceUrl'),
    headers: {
      ownerId: '8f7ee860-0163-4229-9d2a-01cef53145ba',
      ownerOrgId: 'org1',
      'admin-token': adminToken,
    },
  });

  // const cacheKey = `adapter-credentials-by-id: ${secretKey}`;

  // console.log(
  //   `BotService:getVaultCredentials::Calling get vault credentials from uci api: ${secretKey}`
  // );

  // if (cache.has(cacheKey)) {
  //   console.log(`getVaultCredentials from cache : ${cache.get(cacheKey)}`);
  //   return cache.get(cacheKey);
  // } else {
  //   console.log(`getVaultCredentials from axios : ${cache.get(cacheKey)}`);

  const response = await webClient.get(`/admin/secret/${secretKey}`);

  // console.log(
  //   `BotService:getVaultCredentials::Got Data From UCI Api : cache key : ${cacheKey} cache data : ${cache.get(
  //     cacheKey
  //   )}`
  // );
  if (response.data !== null) {
    try {
      const credentials: Record<string, string> = {};
      const root = response.data;
      if (root.result !== null && root.result !== null) {
        return root.result[secretKey];
      }
      return null;
    } catch (e: any) {
      console.error(`BotService:getVaultCredentials::Exception: ${e}`);
      return null;
    }
  }

  return null;
  // }
};

// Convert XMessage to GupShupWhatsAppMessage
export const convertXMessageToMsg = async (xMsg: XMessage) => {
  // @ts-ignore
  const adapterIdFromXML: string = xMsg.adapterId;
  // const adapterId: string = '44a9df72-3d7a-4ece-94c5-98cf26307324';

  try {
    const credentials = await getAdapterCredentials(adapterIdFromXML);
    // console.log(credentials);
    if (credentials && Object.keys(credentials).length !== 0) {
      let text: string = xMsg.payload.text || '';
      let builder = getURIBuilder();

      if (xMsg.messageState === MessageState.OPTED_IN) {
        text += renderMessageChoices(xMsg.payload.buttonChoices || []);

        builder = setBuilderCredentialsAndMethod(
          builder,
          MethodType.OPTIN,
          credentials['username2Way'],
          credentials['password2Way']
        );

        builder.set('channel', xMsg.channelURI.toLowerCase());
        builder.set('send_to', '91' + xMsg.to.userID);
        builder.set('phone_number', '91' + xMsg.to.userID);
      } else if (
        xMsg.messageType !== null &&
        xMsg.messageType === MessageType.HSM
      ) {
        optInUser(
          xMsg,
          credentials['usernameHSM'],
          credentials['passwordHSM'],
          credentials['username2Way'],
          credentials['password2Way']
        );

        text += renderMessageChoices(xMsg.payload.buttonChoices || []);

        builder = setBuilderCredentialsAndMethod(
          builder,
          MethodType.SIMPLEMESSAGE,
          credentials['usernameHSM'],
          credentials['passwordHSM']
        );

        builder.set('send_to', '91' + xMsg.to.userID);
        builder.set('msg', text);
        builder.set('isHSM', 'true');
        builder.set('msg_type', MessageType.HSM);
      } else if (
        xMsg.messageType !== null &&
        xMsg.messageType === MessageType.HSM_WITH_BUTTON
      ) {
        optInUser(
          xMsg,
          credentials['usernameHSM'],
          credentials['passwordHSM'],
          credentials['username2Way'],
          credentials['password2Way']
        );

        text += renderMessageChoices(xMsg.payload.buttonChoices || []);

        builder = setBuilderCredentialsAndMethod(
          builder,
          MethodType.OPTIN,
          credentials['usernameHSM'],
          credentials['passwordHSM']
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
        builder = setBuilderCredentialsAndMethod(
          builder,
          MethodType.SIMPLEMESSAGE,
          credentials['username2Way'],
          credentials['password2Way']
        );

        builder.set('send_to', '91' + xMsg.to.userID);
        builder.set('phone_number', '91' + xMsg.to.userID);
        builder.set('msg_type', xMsg.messageType);
        builder.set('channel', 'WHATSAPP');
        builder.set('msg_id', xMsg.messageId.channelMessageId);

        if (
          stylingTag !== undefined &&
          FileUtil.isStylingTagIntercativeType(stylingTag) &&
          FileUtil.validateInteractiveStylingTag(xMsg.payload)
        ) {
          if (stylingTag === StylingTag.LIST) {
            const content: string = getOutboundListActionContent(xMsg);
            // console.log('list content: ', content);

            if (content.length > 0) {
              builder.set('interactive_type', 'list');
              builder.set('action', content);
              builder.set('msg', text);
              plainText = false;
            }
          } else if (stylingTag === StylingTag.QUICKREPLYBTN) {
            const content: string = getOutboundQRBtnActionContent(xMsg);
            // console.log('QR btn content: ', content);

            if (content.length > 0) {
              builder.set('interactive_type', 'dr_button');
              builder.set('action', content);
              builder.set('msg', text);
              plainText = false;
            }
          }
        }

        if (xMsg.payload.media && xMsg.payload.media.url) {
          const media: MessageMedia = xMsg.payload.media;

          builder.set('method', MethodType.MEDIAMESSAGE);
          builder.set(
            'msg_type',
            getMessageTypeByMediaCategory(media.category)
          );

          builder.set('media_url', media.url);
          builder.set('caption', media.text);
          builder.set('isHSM', 'false');
          plainText = false;
        }

        if (plainText) {
          text += renderMessageChoices(xMsg.payload.buttonChoices || []);
          builder.set('msg', text);
        }
      }

      console.log(text);
      const expanded = new URL(
        `${configService.getConfig('gupshupUrl')}?${builder}`
      );
      // console.log(expanded);

      try {
        const response: GSWhatsappOutBoundResponse =
          await GSWhatsappService.getInstance().sendOutboundMessage(
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
