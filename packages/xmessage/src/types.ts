export enum State {
  STARTING = 1,
  ONGOING,
  COMPLETED,
}

export class ConversationStage {
  stage!: number;
  state!: State;
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

export enum DeviceType {
  PHONE = "PHONE",
}

export class Transformer {
  id!: string;
  metaData!: Map<string, string>; // templateID, configID, userData
}

export type XMessagePayload = {
  text?: string;
  media?: MessageMedia;
  location?: LocationParams;
  contactCard?: ContactCard;
  buttonChoices?: Array<ButtonChoice>;
  stylingTag?: StylingTag;
  flow?: string;
  questionIndex?: number;
  mediaCaption?: string;
  metaData?: string;
}

export class XMessageThread {
  offset!: number; // normal form or simple chat..
  startDate!: string;
  lastMessageId!: string; // last incoming msgId
}

export class MessageMedia {
  category!: MediaCategory; // category list {image, audio, document, video}
  text!: string; // caption, if applicable
  url!: string;
  size?: number;
  messageMediaError?: MessageMediaError;
}

export class LocationParams {
  longitude!: number | null;
  latitude!: number | null;
  address!: String;
  url!: String;
  name!: String;
}

export class ContactCard {
  address!: Address;
  name!: string;
}

export class ButtonChoice {
  key!: string;
  text!: string;
  backmenu!: boolean;
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

export class Address {
  city!: string;
  country!: string;
  countryCode!: number;
}
