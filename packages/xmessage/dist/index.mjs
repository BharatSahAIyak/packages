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
export {
  MessageState,
  MessageType,
  XMessage
};
