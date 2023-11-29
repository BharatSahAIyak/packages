"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  botServiceConfig: () => botServiceConfig_default,
  getBotIdFromBotName: () => getBotIdFromBotName,
  getBotNameByBotID: () => getBotNameByBotID,
  getBotNodeFromId: () => getBotNodeFromId,
  getBotNodeFromName: () => getBotNodeFromName,
  getBotNodeFromStartingMessage: () => getBotNodeFromStartingMessage,
  getFirstFormByBotID: () => getFirstFormByBotID,
  updateUser: () => updateUser
});
module.exports = __toCommonJS(src_exports);

// src/bot.service.ts
var import_axios = __toESM(require("axios"));

// src/botutil.ts
var _BotUtil = class _BotUtil {
  /**
   * Get true if bot is valid else invalid message, from JSON node data
   * @param data
   * @return
   */
  static getBotValidFromJsonNode(data) {
    const status = data["status"].toString();
    const startDate = data["startDate"].toString();
    const endDate = data["endDate"].toString();
    console.log(`Bot Status: ${status}, Start Date: ${startDate}, End Date: ${endDate}`);
    return _BotUtil.getBotValid(status, startDate, endDate);
  }
  /**
   * Get true if bot is valid else invalid message, by status, start date & end date
   * @param status
   * @param startDate
   * @param endDate
   * @return
   */
  static getBotValid(status, startDate, endDate) {
    if (!_BotUtil.checkBotLiveStatus(status)) {
      return `This conversation is not active yet. Please contact your state admin to seek help with this.`;
    } else if (startDate == null || startDate === "null" || startDate === "") {
      console.log("Bot start date is empty.");
      return `This conversation is not active yet. Please contact your state admin to seek help with this.`;
    } else if (!_BotUtil.checkBotStartDateValid(startDate)) {
      if (startDate == null || startDate === "null" || startDate === "") {
        return `This conversation is not active yet. It will be enabled on ${startDate}. Please try again then.`;
      }
      return `This conversation is not active yet. Please try again then.`;
    } else if (!_BotUtil.checkBotEndDateValid(endDate)) {
      return `This conversation has expired now. Please contact your state admin to seek help with this.`;
    }
    return "true";
  }
  /**
   * Check if bot is valid or not, by JSON node data
   * @param data
   * @return
   */
  static checkBotValidFromJsonNode(data) {
    const status = data["status"]?.toString();
    const startDate = data["startDate"]?.toString();
    const endDate = data["endDate"]?.toString();
    console.log(`Bot Status: ${status}, Start Date: ${startDate}, End Date: ${endDate}`);
    return _BotUtil.checkBotValid(status, startDate, endDate);
  }
  /**
   * Check if bot is valid or not, by status, start date & end date
   * @param status
   * @param startDate
   * @param endDate
   * @return
   */
  static checkBotValid(status, startDate, endDate) {
    return _BotUtil.checkBotLiveStatus(status) && _BotUtil.checkBotStartDateValid(startDate) && _BotUtil.checkBotEndDateValid(endDate) && !(startDate == null || startDate === "null" || startDate === "");
  }
  /**
   * Check if bot' status is live/enabled
   * @param status
   * @return
   */
  static checkBotLiveStatus(status) {
    status = status.toLowerCase();
    if (status === _BotUtil.botLiveStatus || status === _BotUtil.botEnabledStatus) {
      return true;
    }
    console.log("Bot is invalid as its status is not live or enabled.");
    return false;
  }
  /**
   * Check if bot's start date is valid (Should be less than or equal to the current date)
   * @param startDate
   * @return
   */
  static checkBotStartDateValid(startDate) {
    try {
      const currentDate = /* @__PURE__ */ new Date();
      const botStartDate = new Date(startDate);
      return currentDate >= botStartDate;
    } catch (error) {
      console.error("Error in checkBotStartDateValid:", error);
    }
    return false;
  }
  /**
   * Check if bot's end date is valid (Should be empty OR greater than or equal to the current date)
   * @param endDate
   * @return
   */
  static checkBotEndDateValid(endDate) {
    try {
      if (endDate == null || endDate === "null" || endDate === "") {
        console.log("Bot end date is empty.");
        return true;
      }
      const currentDate = /* @__PURE__ */ new Date();
      const botEndDate = new Date(endDate);
      botEndDate.setHours(23, 59, 59);
      return currentDate < botEndDate;
    } catch (error) {
      console.error("Error in checkBotEndDateValid:", error);
    }
    return false;
  }
};
_BotUtil.botEnabledStatus = "enabled";
_BotUtil.botLiveStatus = "live";
_BotUtil.adminUserId = "admin";
_BotUtil.transformerTypeBroadcast = "broadcast";
_BotUtil.transformerTypeGeneric = "generic";
/**
* Get value by key from bot json node
* @param botNode
* @param key
* @return
*/
_BotUtil.getBotNodeData = (botNode, key) => {
  if (botNode[key] !== void 0 && botNode[key] !== null && typeof botNode[key] === "string" && botNode[key] !== "null" && botNode[key] !== "") {
    return botNode[key];
  }
  return null;
};
var BotUtil = _BotUtil;

// src/botServiceConfig.ts
var BotServiceConfig = class _BotServiceConfig {
  constructor() {
    this.config = {};
  }
  static getInstance() {
    if (!_BotServiceConfig.instance) {
      _BotServiceConfig.instance = new _BotServiceConfig();
    }
    return _BotServiceConfig.instance;
  }
  setConfig(config) {
    this.config = { ...this.config, ...config };
  }
  getConfig(key) {
    return this.config[key];
  }
};
var botServiceConfig_default = BotServiceConfig.getInstance();

// src/bot.service.ts
var cache = /* @__PURE__ */ new Map();
var Pair = class {
  constructor(first, second) {
    this.first = first;
    this.second = second;
  }
};
var getBotNodeFromStartingMessage = async (startingMessage) => {
  const cacheKey = `bot-for-starting-message:${startingMessage}`;
  if (cache.has(cacheKey)) {
    console.log(
      `getBotNodeFromStartingMessage from cache: ${cache.get(cacheKey)}`
    );
    return Promise.resolve(cache.get(cacheKey));
  } else {
    try {
      const response = await import_axios.default.get(`${botServiceConfig_default.getConfig("baseUrl")}/admin/bot/search`, {
        params: {
          perPage: 5,
          page: 1,
          match: true,
          startingMessage
        }
      });
      if (response.data) {
        console.log(
          `Call getBotNodeFromStartingMessage: ${response.data} cache: ${cache.get(cacheKey)}`
        );
        try {
          const root = response.data;
          if (root.result && root.result.data && root.result.data.length > 0 && root.result.data[0]) {
            return root.result.data[0];
          }
          return {};
        } catch (jsonParsingException) {
          return {};
        }
      } else {
        return {};
      }
    } catch (error) {
      console.log(`Error in getting campaign: ${error}`);
      return {};
    }
  }
};
var getBotNodeFromName = async (botName) => {
  const cacheKey = `bot-for-name:${botName}`;
  console.log(`BotService::getBotNodeFromName::fetchingBotData : ${botName}`);
  if (cache.has(cacheKey)) {
    console.log(`getBotNodeFromName from cache: ${cache.get(cacheKey)}`);
    return cache.get(cacheKey);
  } else {
    try {
      const response = await import_axios.default.get(`${botServiceConfig_default.getConfig("baseUrl")}/admin/bot/search`, {
        params: {
          perPage: 5,
          page: 1,
          match: true,
          name: botName
        }
      });
      if (response.data) {
        console.log(
          `Call getBotNodeFromName: ${response.data} cache: ${cache.get(
            cacheKey
          )}`
        );
        try {
          const root = response.data;
          if (root.result && root.result.data && root.result.data.length > 0 && root.result.data[0]) {
            return root.result.data[0];
          }
          return {};
        } catch (jsonParsingException) {
          return {};
        }
      } else {
        return {};
      }
    } catch (error) {
      console.log(`Error::getBotNodeFromName in getting campaign: ${error}`);
      return {};
    }
  }
};
var getBotNodeFromId = async (botId) => {
  const cacheKey = `bot-node-by-id:${botId}`;
  console.log(`getBotNodeFromId from cache : ${cache.get(cacheKey)}`);
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  } else {
    try {
      const response = await import_axios.default.get(`${botServiceConfig_default.getConfig("baseUrl")}/admin/bot/${botId}`);
      if (response.data) {
        console.log(
          `Call getBotNodeFromId: ${response.data} cache: ${cache.get(
            cacheKey
          )}`
        );
        try {
          const root = response.data;
          if (root.result) {
            return root.result;
          }
          return null;
        } catch (jsonParsingException) {
          return null;
        }
      } else {
        return null;
      }
    } catch (error) {
      console.log(`Error::getBotNodeFromId in getting campaign: ${error}`);
      return null;
    }
  }
};
var getBotIdFromBotName = async (botName) => {
  const cacheKey = `Bot-id-for-bot-name: ${botName}`;
  console.log(
    `BotService::getBotIdFromBotName::calling from update user: ${botName}`
  );
  if (cache.has(cacheKey)) {
    console.log(`getBotIdFromBotName from cache: ${cache.get(cacheKey)}`);
    return Promise.resolve(cache.get(cacheKey));
  } else {
    try {
      const response = await import_axios.default.get(`${botServiceConfig_default.getConfig("baseUrl")}/admin/bot/search`, {
        params: {
          perPage: 5,
          page: 1,
          match: true,
          name: botName
        }
      });
      if (response.data) {
        console.log(
          `BotService:getBotIdFromBotName::Got Data From UCI Api : ${response.data} cache : ${cache.get(cacheKey)}`
        );
        try {
          const root = response.data;
          if (root.result && root.result.data && root.result.data.length > 0 && root.result.data[0] && BotUtil.checkBotValidFromJsonNode(root.result.data[0])) {
            return BotUtil.getBotNodeData(root.result.data[0], "id");
          }
          return null;
        } catch (jsonMappingException) {
          console.error(
            `Error while parsing data from JSON : ${jsonMappingException}`
          );
          return null;
        }
      }
    } catch (error) {
      console.error(
        `BotService:getBotIdFromBotName::Exception: ${error.message}`
      );
      return null;
    }
    return null;
  }
};
var updateUser = async (userID, botName) => {
  console.log(
    `BotService:updateUser::Calling UCI Api: UserId: ${userID} botName: ${botName}`
  );
  try {
    const botID = await getBotIdFromBotName(botName);
    console.log(
      `BotService:updateUser::Calling add user on UCI Api:botId: ${botID}`
    );
    const url = `${botServiceConfig_default.getConfig("baseUrl")}/admin/bot/${botID}/addUser/${userID}`;
    const response = await import_axios.default.get(url);
    if (response.data !== null) {
      console.log(
        `BotService:updateUser::user added FA successfully: ${response.data}`
      );
      try {
        const root = response.data;
        const responseCode = root.responseCode;
        if (root.result !== null && root.result.status !== null && (root.result.status.toLowerCase() === "user_added" || root.result.status.toLowerCase() === "user_exists")) {
          const addedUserID = root.result.userId;
          return new Pair(true, addedUserID);
        }
        return new Pair(false, "");
      } catch (jsonParsingException) {
        return new Pair(false, "");
      }
    } else {
      console.error(
        "BotService:updateUser::addUser: UCI Api returned null response"
      );
      return new Pair(false, "");
    }
  } catch (error) {
    console.error(`BotService:updateUser::Calling UCI Api:Exception: ${error}`);
    return new Pair(false, "");
  }
};
var getFirstFormByBotID = async (botId) => {
  const cacheKey = `form-by-bot-name:${botId}`;
  if (cache.has(cacheKey)) {
    console.log(`getFirstFormByBotID from cache : ${cache.get(cacheKey)}`);
    return cache.get(cacheKey);
  } else {
    const response = await import_axios.default.get(`${botServiceConfig_default.getConfig("baseUrl")}/admin/bot/${botId}`);
    console.log(
      `Call getFirstFormByBotID : ${response.data} cache : ${cache.get(
        cacheKey
      )}`
    );
    if (response.data !== null) {
      try {
        const root = response.data;
        if (root.result !== null && root.result && BotUtil.checkBotValidFromJsonNode(root.result)) {
          return root.result.logicIDs[0].transformers[0].meta["formID"].toString();
        }
        return null;
      } catch (e) {
        console.error(`Error in getFirstFormByBotID >>> ${e}`);
        return null;
      }
    }
    return null;
  }
};
var getBotNameByBotID = async (botId) => {
  const cacheKey = `bot-name-by-id:${botId}`;
  if (cache.has(cacheKey)) {
    console.log(`getBotNameByBotID from cache : ${cache.get(cacheKey)}`);
    return cache.get(cacheKey);
  } else {
    const response = await import_axios.default.get(`${botServiceConfig_default.getConfig("baseUrl")}/admin/bot/${botId}`);
    console.log(
      `Call getBotNameByBotID : ${response.data} cache : ${cache.get(cacheKey)}`
    );
    if (response.data !== null) {
      try {
        const root = response.data;
        if (root.result !== null && root.result && BotUtil.checkBotValidFromJsonNode(root.result)) {
          return root.result["name"].toString();
        }
        return null;
      } catch (e) {
        console.error(`Error in getBotNameByBotID >>> ${e}`);
        return null;
      }
    }
    return null;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  botServiceConfig,
  getBotIdFromBotName,
  getBotNameByBotID,
  getBotNodeFromId,
  getBotNodeFromName,
  getBotNodeFromStartingMessage,
  getFirstFormByBotID,
  updateUser
});
