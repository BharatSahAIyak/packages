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
  MessageState: () => MessageState,
  MessageType: () => MessageType,
  XMessage: () => XMessage
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MessageState,
  MessageType,
  XMessage
});
