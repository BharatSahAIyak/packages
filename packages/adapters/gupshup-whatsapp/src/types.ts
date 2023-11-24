export type GSWhatsAppMessage = {
  waNumber: string; // botNumber
  mobile: string; // user's number
  replyId: string;
  messageId: string;
  timestamp: number | null;
  name: string;
  version: number | null;
  type: string;
  text: string;
  image: string;
  document: string;
  voice: string;
  audio: string;
  video: string;
  location: string;
  response: string;
  extra: string;
  app: string;
  interactive: string | null;
}

export class Address {
  city!: string;
  country!: string;
  countryCode!: number;
}

export class ButtonChoice {
  key!: string;
  text!: string;
  backmenu!: boolean;
}

export class ContactCard {
  address!: Address;
  name!: string;
}

export enum State {
  STARTING = 1,
  ONGOING,
  COMPLETED,
}

export enum DeviceType {
  PHONE = "PHONE",
}

export enum StylingTag {
  LIST = "LIST",
  QUICKREPLYBTN = "QUICKREPLYBTN",
  IMAGE = "IMAGE",
  IMAGE_URL = "IMAGE_URL",
  AUDIO = "AUDIO",
  VIDEO = "VIDEO",
}

export enum MediaCategory {
  IMAGE_URL = "IMAGE_URL",
  AUDIO_URL = "AUDIO_URL",
  VIDEO_URL = "VIDEO_URL",
  IMAGE = "IMAGE",
  AUDIO = "AUDIO",
  VIDEO = "VIDEO",
  FILE="FILE"
}

export enum MessageMediaError {
  PAYLOAD_TOO_LARGE = "payloadTooLarge",
  EMPTY_RESPONSE = "emptyResponse",
}

export enum MethodType {
  SIMPLEMESSAGE = "SendMessage",
  MEDIAMESSAGE = "SendMediaMessage",
  OPTIN = "OPT_IN",
}

export class ConversationStage {
  stage!: number;
  state!: State;
}

export class LocationParams {
  longitude!: number | null;
  latitude!: number | null;
  address!: String;
  url!: String;
  name!: String;
}

export class MessageId {
  public Id?: string;
  public channelMessageId: string;
  public replyId?: string;

  constructor(builder: MessageIdBuilder) {
    this.Id = builder.id;
    this.channelMessageId = builder.channelMessageId;
    this.replyId = builder.replyId;
  }

  static builder(): MessageIdBuilder {
    return new MessageIdBuilder();
  }
}

export class MessageIdBuilder {
  public id: string = '';
  public channelMessageId: string = '';
  public replyId: string = '';

  public setId(id: string): MessageIdBuilder {
    this.id = id;
    return this;
  }

  public setChannelMessageId(channelMessageId: string): MessageIdBuilder {
    this.channelMessageId = channelMessageId;
    return this;
  }

  public setReplyId(replyId: string): MessageIdBuilder {
    this.replyId = replyId;
    return this;
  }

  public build(): MessageId {
    return new MessageId(this);
  }
}

export class MessageMedia {
  category!: MediaCategory; // category list {image, audio, document, video}
  text!: string; // caption, if applicable
  url!: string;
  size?: number;
  messageMediaError?: MessageMediaError;
}

export class Provider {
  name!: string;
}

export class SenderReceiverInfo {
  // persist
  userID!: string; // PhoneNo
  groups?: Array<string>;
  campaignID?: string;
  formID?: string;
  bot?: boolean;
  broadcast?: boolean;
  meta?: Map<string, string>;
  deviceType?: DeviceType;
  deviceID?: string; // UUID
  encryptedDeviceID?: string; // Encrypted Device String
}

export class Transformer {
  id!: string;
  metaData!: Map<string, string>; // templateID, configID, userData
}

export class XMessagePayload {
  text!: string;
  media?: MessageMedia;
  location?: LocationParams;
  contactCard!: ContactCard;
  buttonChoices!: Array<ButtonChoice>;
  stylingTag!: StylingTag;
  flow?: string;
  questionIndex?: number;
  mediaCaption?: string;
}

export class XMessageThread {
  offset!: number; // normal form or simple chat..
  startDate!: string;
  lastMessageId!: string; // last incoming msgId
}

import { FileUtil } from './utils'

export class MediaSizeLimit {
  private readonly imageSize: number | undefined;
  private readonly audioSize: number | undefined;
  private readonly videoSize: number | undefined;
  private readonly documentSize: number | undefined;

  constructor(
    imageSize: number | undefined,
    audioSize: number | undefined,
    videoSize: number | undefined,
    documentSize: number | undefined
  ) {
    this.imageSize = imageSize;
    this.audioSize = audioSize;
    this.videoSize = videoSize;
    this.documentSize = documentSize;
  }

  public getMaxSizeForMedia(mimeType: string): number {
    if (FileUtil.isFileTypeImage(mimeType) && this.imageSize !== undefined) {
      return 1024 * 1024 * this.imageSize;
    } else if (FileUtil.isFileTypeAudio(mimeType) && this.audioSize !== undefined) {
      return 1024 * 1024 * this.audioSize;
    } else if (FileUtil.isFileTypeVideo(mimeType) && this.videoSize !== undefined) {
      return 1024 * 1024 * this.videoSize;
    } else if (FileUtil.isFileTypeDocument(mimeType) && this.documentSize !== undefined) {
      return 1024 * 1024 * this.documentSize;
    } else {
      return -1;
    }
  }
}
