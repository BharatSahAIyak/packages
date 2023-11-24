// src/user.service.ts
import axios from "axios";
import { FusionAuthClient } from "@fusionauth/typescript-client";

// src/userServiceConfig.ts
var UserServiceConfig = class _UserServiceConfig {
  constructor() {
    this.config = {};
  }
  static getInstance() {
    if (!_UserServiceConfig.instance) {
      _UserServiceConfig.instance = new _UserServiceConfig();
    }
    return _UserServiceConfig.instance;
  }
  setConfig(config) {
    this.config = { ...this.config, ...config };
  }
  getConfig(key) {
    return this.config[key];
  }
};
var userServiceConfig_default = UserServiceConfig.getInstance();

// src/user.service.ts
var findApplicationByID = async (applicationID) => {
  try {
    const fusionAuthUrl = userServiceConfig_default.getConfig("fusionAuthUrl");
    const fusionAuthAppID = userServiceConfig_default.getConfig("fusionAuthAppID");
    const fusionAuthClient = new FusionAuthClient(
      fusionAuthAppID,
      fusionAuthUrl
    );
    const response = await fusionAuthClient.retrieveApplication(applicationID);
    return response.statusCode === 200 ? true : false;
  } catch (error) {
    console.error(`Error in findApplicationByID: ${error}`);
    return false;
  }
};
var findFAUserByUsername = async (username) => {
  try {
    const fusionAuthUrl = userServiceConfig_default.getConfig("fusionAuthUrl");
    const fusionAuthAppID = userServiceConfig_default.getConfig("fusionAuthAppID");
    const fusionAuthClient = new FusionAuthClient(
      fusionAuthAppID,
      fusionAuthUrl
    );
    const response = await fusionAuthClient.retrieveUserByUsername(username);
    if (response.wasSuccessful()) {
      return response.response.user;
    } else if (response.exception) {
      const exception = response.exception;
      console.error(
        `Exception in findFAUserByUsername: ${exception.toString()}`
      );
    }
    return void 0;
  } catch (error) {
    console.error(`Error in findFAUserByUsername: ${error}`);
    return void 0;
  }
};
var findByEmail = async (email) => {
  try {
    const fusionAuthUrl = userServiceConfig_default.getConfig("fusionAuthUrl");
    const fusionAuthAppID = userServiceConfig_default.getConfig("fusionAuthAppID");
    const fusionAuthClient = new FusionAuthClient(
      fusionAuthAppID,
      fusionAuthUrl
    );
    const response = await fusionAuthClient.retrieveUserByEmail(email);
    if (response.wasSuccessful()) {
      return response.response.user;
    } else if (response.exception) {
      const exception = response.exception;
      console.error(`Exception in findByEmail: ${exception.toString()}`);
    }
    return void 0;
  } catch (error) {
    console.error(`Error in findByEmail: ${error}`);
    return void 0;
  }
};
var findUsersForCampaign = async (campaignName) => {
  try {
    return [];
  } catch (error) {
    console.error(`Error in findUsersForCampaign: ${error}`);
    return [];
  }
};
var jsonArrayToList = (userPhonesResponse) => {
  const usersList = [];
  if (userPhonesResponse) {
    for (let i = 0; i < userPhonesResponse.length; i++) {
      usersList.push(String(userPhonesResponse[i]));
    }
  }
  return usersList;
};
var getUsersFromFederatedServers = async (campaignID, meta) => {
  const baseURL = meta?.page ? `${userServiceConfig_default.getConfig(
    "CAMPAIGN_URL"
  )}/admin/bot/getAllUsers/${campaignID}/${meta.page}` : `${userServiceConfig_default.getConfig(
    "CAMPAIGN_URL"
  )}/admin/bot/getAllUsers/${campaignID}`;
  const headers = {
    "Content-Type": "application/json",
    "admin-token": userServiceConfig_default.getConfig("CAMPAIGN_ADMIN_TOKEN")
  };
  if (meta?.["conversation-authorization"]) {
    headers["Conversation-Authorization"] = meta["conversation-authorization"];
  }
  console.log(
    `UserService:getUsersFromFederatedServers::Calling botId: ${campaignID} ::: Base URL : ${baseURL}`
  );
  try {
    const response = await axios.get(baseURL, { headers });
    return response.data.result;
  } catch (error) {
    console.error(`Error:getUsersFromFederatedServers::Exception: ${error}`);
    return null;
  }
};
var getUsersMessageByTemplate = async (jsonData) => {
  console.log("UserService:getUsersMessageByTemplate::CallingTemplaterService");
  const baseURL = `${userServiceConfig_default.getConfig(
    "baseUrlTemplate"
  )}/process/testMany`;
  const headers = {
    "Content-Type": "application/json"
  };
  try {
    const response = await axios.post(baseURL, jsonData, { headers });
    console.log(`response body: ${response.data}`);
    const usersMessage = response.data.processed;
    return usersMessage;
  } catch (error) {
    console.error(`Error:getUsersMessageByTemplate::Exception: ${error}`);
    return null;
  }
};
var getManager = async (applicant) => {
  try {
    const managerName = applicant.data?.reportingManager;
    const u = await getUserByFullName(managerName, "SamagraBot");
    return u || null;
  } catch (e) {
    return null;
  }
};
var getProgramCoordinator = async (applicant) => {
  try {
    const coordinatorName = applicant.data?.programCoordinator;
    const u = await getUserByFullName(coordinatorName, "SamagraBot");
    return u || null;
  } catch (e) {
    return null;
  }
};
var getProgramConstruct = (applicant) => {
  try {
    const programConstruct = String(applicant.data?.programConstruct);
    return programConstruct !== "undefined" ? programConstruct : "2";
  } catch (e) {
    return "2";
  }
};
var getEngagementOwner = async (applicant) => {
  try {
    const engagementOwnerName = String(applicant.data?.programOwner);
    const u = await getUserByFullName(engagementOwnerName, "SamagraBot");
    return u ?? null;
  } catch (e) {
    return null;
  }
};
var getUserByFullName = async (fullName, campaignName) => {
  try {
    const allUsers = await findUsersForCampaign(campaignName);
    const user = allUsers.find((u) => u.fullName === fullName);
    return user || null;
  } catch (e) {
    return null;
  }
};
var isAssociate = (applicant) => {
  try {
    const role = applicant.data?.get("role");
    return role === "Program Associate";
  } catch (error) {
    return true;
  }
};
var cache = {};
var getUserByPhoneFromFederatedServers = async (campaignID, phone) => {
  const baseURL = `${userServiceConfig_default.getConfig(
    "CAMPAIGN_URL"
  )}/admin/v1/bot/getFederatedUsersByPhone/${campaignID}/${phone}`;
  const cacheKey = `FEDERATED USERS: USER SERVICE: ${baseURL}`;
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }
  try {
    const response = await axios.get(baseURL, {
      headers: {
        "Content-Type": "application/json",
        "admin-token": userServiceConfig_default.getConfig("CAMPAIGN_ADMIN_TOKEN")
        // Replace with your actual admin token
      },
      timeout: 9e4
      // 90 seconds timeout
    });
    const users = response.data;
    try {
      const user = users.result.data.user;
      user.is_registered = "yes";
      cache[cacheKey] = user;
      return user;
    } catch (error) {
      const user = { is_registered: "no" };
      cache[cacheKey] = user;
      return user;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};
var createFAUser = async (node) => {
  try {
    const url = `${userServiceConfig_default.getConfig("fusionAuthUrl")}/api/user/`;
    console.log(`url: ${url}, node: ${JSON.stringify(node)}`);
    const response = await axios.post(url, node, {
      headers: {
        "Content-Type": "application/json",
        Authorization: userServiceConfig_default.getConfig("fusionAuthKey")
      }
    });
    const resultNode = response.data;
    const responseNode = { success: "false" };
    if (resultNode) {
      if (resultNode.fieldErrors) {
        responseNode.success = "false";
        responseNode.errors = resultNode.fieldErrors.map(
          (error) => error.message
        );
      } else if (resultNode.generalErrors) {
        responseNode.success = "false";
        responseNode.errors = resultNode.generalErrors.map(
          (error) => error.message
        );
      } else {
        responseNode.success = "true";
        responseNode.data = resultNode;
      }
    } else {
      responseNode.success = "false";
      responseNode.errors = ["No response from Fusion Auth"];
    }
    return responseNode;
  } catch (error) {
    console.error(`Error in createFAUser: ${error}`);
    return null;
  }
};
var updateFAUser = async (userId, node) => {
  try {
    const url = `${userServiceConfig_default.getConfig("fusionAuthUrl")}/api/user/${userId}`;
    console.log(`url: ${url}, node: ${JSON.stringify(node)}`);
    const response = await axios.put(url, node, {
      headers: {
        "Content-Type": "application/json",
        Authorization: userServiceConfig_default.getConfig("fusionAuthKey")
      }
    });
    const resultNode = response.data;
    const responseNode = { success: "false" };
    if (resultNode) {
      if (resultNode.fieldErrors) {
        responseNode.success = "false";
        responseNode.errors = resultNode.fieldErrors.map(
          (error) => error.message
        );
      } else if (resultNode.generalErrors) {
        responseNode.success = "false";
        responseNode.errors = resultNode.generalErrors.map(
          (error) => error.message
        );
      } else {
        responseNode.success = "true";
        responseNode.data = resultNode;
      }
    } else {
      responseNode.success = "false";
      responseNode.errors = ["No response from Fusion Auth"];
    }
    return responseNode;
  } catch (error) {
    console.error(`Error in updateFAUser: ${error}`);
    return null;
  }
};
export {
  createFAUser,
  findApplicationByID,
  findByEmail,
  findFAUserByUsername,
  getEngagementOwner,
  getManager,
  getProgramConstruct,
  getProgramCoordinator,
  getUserByFullName,
  getUserByPhoneFromFederatedServers,
  getUsersFromFederatedServers,
  getUsersMessageByTemplate,
  isAssociate,
  jsonArrayToList,
  updateFAUser
};
