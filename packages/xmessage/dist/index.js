"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Address: () => Address,
  ButtonChoice: () => ButtonChoice,
  ContactCard: () => ContactCard,
  ConversationStage: () => ConversationStage,
  DeviceType: () => DeviceType,
  LocationParams: () => LocationParams,
  MediaCategory: () => MediaCategory,
  MessageId: () => MessageId,
  MessageIdBuilder: () => MessageIdBuilder,
  MessageMedia: () => MessageMedia,
  MessageMediaError: () => MessageMediaError,
  MessageState: () => MessageState,
  MessageType: () => MessageType,
  SenderReceiverInfo: () => SenderReceiverInfo,
  State: () => State,
  StylingTag: () => StylingTag,
  Transformer: () => Transformer,
  XMessage: () => XMessage,
  XMessageThread: () => XMessageThread
});
module.exports = __toCommonJS(src_exports);

// src/xMessage.ts
var MessageState = /* @__PURE__ */ ((MessageState2) => {
  MessageState2["NOT_SENT"] = "NOT_SENT";
  MessageState2["FAILED_TO_DELIVER"] = "FAILED_TO_DELIVER";
  MessageState2["DELIVERED"] = "DELIVERED";
  MessageState2["READ"] = "READ";
  MessageState2["REPLIED"] = "REPLIED";
  MessageState2["ENQUEUED"] = "ENQUEUED";
  MessageState2["SENT"] = "SENT";
  MessageState2["OPTED_IN"] = "OPTED_IN";
  MessageState2["OPTED_OUT"] = "OPTED_OUT";
  return MessageState2;
})(MessageState || {});
var MessageType = /* @__PURE__ */ ((MessageType2) => {
  MessageType2["HSM"] = "HSM";
  MessageType2["TEXT"] = "TEXT";
  MessageType2["HSM_WITH_BUTTON"] = "HSM_WITH_BUTTON";
  MessageType2["BROADCAST_TEXT"] = "BROADCAST_TEXT";
  MessageType2["IMAGE"] = "IMAGE";
  MessageType2["VIDEO"] = "VIDEO";
  MessageType2["AUDIO"] = "AUDIO";
  MessageType2["DOCUMENT"] = "DOCUMENT";
  MessageType2["LOCATION"] = "LOCATION";
  return MessageType2;
})(MessageType || {});
var XMessage = class {
  toXML() {
    return "";
  }
  // public completeTransform() {
  //   this.transformers.pop();
  // }
  getChannel() {
    return this.channelURI;
  }
  getProvider() {
    return this.providerURI;
  }
  secondsSinceLastMessage() {
    if (this.timestamp != null) {
      const currentTimestamp = Date.now() / 1e3;
      return currentTimestamp - this.timestamp;
    } else {
      return Number.MAX_VALUE;
    }
  }
  setChannel(channel) {
    this.channelURI = channel;
  }
  setProvider(provider) {
    this.providerURI = provider;
  }
};

// src/types.ts
var State = /* @__PURE__ */ ((State2) => {
  State2[State2["STARTING"] = 1] = "STARTING";
  State2[State2["ONGOING"] = 2] = "ONGOING";
  State2[State2["COMPLETED"] = 3] = "COMPLETED";
  return State2;
})(State || {});
var ConversationStage = class {
};
var MessageId = class {
  constructor(builder) {
    this.Id = builder.id;
    this.channelMessageId = builder.channelMessageId;
    this.replyId = builder.replyId;
  }
  static builder() {
    return new MessageIdBuilder();
  }
};
var MessageIdBuilder = class {
  constructor() {
    this.id = "";
    this.channelMessageId = "";
    this.replyId = "";
  }
  setId(id) {
    this.id = id;
    return this;
  }
  setChannelMessageId(channelMessageId) {
    this.channelMessageId = channelMessageId;
    return this;
  }
  setReplyId(replyId) {
    this.replyId = replyId;
    return this;
  }
  build() {
    return new MessageId(this);
  }
};
var SenderReceiverInfo = class {
  // Encrypted Device String
};
var DeviceType = /* @__PURE__ */ ((DeviceType2) => {
  DeviceType2["PHONE"] = "PHONE";
  return DeviceType2;
})(DeviceType || {});
var Transformer = class {
  // templateID, configID, userData
};
var XMessageThread = class {
  // last incoming msgId
};
var MessageMedia = class {
};
var LocationParams = class {
};
var ContactCard = class {
};
var ButtonChoice = class {
};
var StylingTag = /* @__PURE__ */ ((StylingTag2) => {
  StylingTag2["LIST"] = "LIST";
  StylingTag2["QUICKREPLYBTN"] = "QUICKREPLYBTN";
  StylingTag2["IMAGE"] = "IMAGE";
  StylingTag2["IMAGE_URL"] = "IMAGE_URL";
  StylingTag2["AUDIO"] = "AUDIO";
  StylingTag2["VIDEO"] = "VIDEO";
  return StylingTag2;
})(StylingTag || {});
var MediaCategory = /* @__PURE__ */ ((MediaCategory2) => {
  MediaCategory2["IMAGE_URL"] = "IMAGE_URL";
  MediaCategory2["AUDIO_URL"] = "AUDIO_URL";
  MediaCategory2["VIDEO_URL"] = "VIDEO_URL";
  MediaCategory2["IMAGE"] = "IMAGE";
  MediaCategory2["AUDIO"] = "AUDIO";
  MediaCategory2["VIDEO"] = "VIDEO";
  MediaCategory2["FILE"] = "FILE";
  return MediaCategory2;
})(MediaCategory || {});
var MessageMediaError = /* @__PURE__ */ ((MessageMediaError2) => {
  MessageMediaError2["PAYLOAD_TOO_LARGE"] = "payloadTooLarge";
  MessageMediaError2["EMPTY_RESPONSE"] = "emptyResponse";
  return MessageMediaError2;
})(MessageMediaError || {});
var Address = class {
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Address,
  ButtonChoice,
  ContactCard,
  ConversationStage,
  DeviceType,
  LocationParams,
  MediaCategory,
  MessageId,
  MessageIdBuilder,
  MessageMedia,
  MessageMediaError,
  MessageState,
  MessageType,
  SenderReceiverInfo,
  State,
  StylingTag,
  Transformer,
  XMessage,
  XMessageThread
});
