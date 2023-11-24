import axios from 'axios';
import { BotUtil } from './botutil';
import configService from './botServiceConfig';

type JsonNode = Record<string, any>;

const cache: Map<string, any> = new Map();

export class Pair<T1, T2> {
  constructor(
    public first: T1,
    public second: T2
  ) {}
}

export const getBotNodeFromStartingMessage = async (
  startingMessage: string,
): Promise<any> => {
  const cacheKey = `bot-for-starting-message:${startingMessage}`;

  if (cache.has(cacheKey)) {
    console.log(
      `getBotNodeFromStartingMessage from cache: ${cache.get(cacheKey)}`
    );
    return Promise.resolve(cache.get(cacheKey));
  } else {
    try {
      const response = await axios.get(`${configService.getConfig('baseUrl')}/admin/bot/search`, {
        params: {
          perPage: 5,
          page: 1,
          match: true,
          startingMessage: startingMessage,
        },
      });

      if (response.data) {
        console.log(
          `Call getBotNodeFromStartingMessage: ${
            response.data
          } cache: ${cache.get(cacheKey)}`
        );
        try {
          const root = response.data;

          if (
            root.result &&
            root.result.data &&
            root.result.data.length > 0 &&
            root.result.data[0]
          ) {
            return root.result.data[0];
          }

          return {}; // Default value if the structure is not as expected
        } catch (jsonParsingException) {

          return {}; // Default value if JSON parsing fails
        }
      } else {
        return {}; // Default value if response is null
      }
    } catch (error: any) {
      console.log(`Error in getting campaign: ${error}`);
      return {}; // Default value in case of error
    }
  }
};

export const getBotNodeFromName = async (botName: string): Promise<any> => {
  const cacheKey = `bot-for-name:${botName}`;
  console.log(`BotService::getBotNodeFromName::fetchingBotData : ${botName}`);

  if (cache.has(cacheKey)) {
    console.log(`getBotNodeFromName from cache: ${cache.get(cacheKey)}`);
    return cache.get(cacheKey);
  } else {
    try {
      const response = await axios.get(`${configService.getConfig('baseUrl')}/admin/bot/search`, {
        params: {
          perPage: 5,
          page: 1,
          match: true,
          name: botName,
        },
      });

      if (response.data) {
        console.log(
          `Call getBotNodeFromName: ${response.data} cache: ${cache.get(
            cacheKey
          )}`
        );
        try {
          const root = response.data;

          if (
            root.result &&
            root.result.data &&
            root.result.data.length > 0 &&
            root.result.data[0]
          ) {
            return root.result.data[0];
          }

          return {}; // Default value if the structure is not as expected
        } catch (jsonParsingException) {
          return {}; // Default value if JSON parsing fails
        }
      } else {
        return {}; // Default value if response is null
      }
    } catch (error: any) {
      console.log(`Error::getBotNodeFromName in getting campaign: ${error}`);
      return {}; // Default value in case of error
    }
  }
};

export const getBotNodeFromId = async (botId: string): Promise<any> => {
  const cacheKey = `bot-node-by-id:${botId}`;
  console.log(`getBotNodeFromId from cache : ${cache.get(cacheKey)}`);

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  } else {
    try {
      const response = await axios.get(`${configService.getConfig('baseUrl')}/admin/bot/${botId}`);
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

          return null; // Default value if the structure is not as expected
        } catch (jsonParsingException) {
          return null; // Default value if JSON parsing fails
        }
      } else {
        return null; // Default value if response is null
      }
    } catch (error: any) {
      console.log(`Error::getBotNodeFromId in getting campaign: ${error}`);
      return null; // Default value in case of error
    }
  }
};

export const getBotIdFromBotName = async (
  botName: string
): Promise<string | null> => {
  const cacheKey = `Bot-id-for-bot-name: ${botName}`;
  console.log(
    `BotService::getBotIdFromBotName::calling from update user: ${botName}`
  );

  if (cache.has(cacheKey)) {
    console.log(`getBotIdFromBotName from cache: ${cache.get(cacheKey)}`);
    return Promise.resolve(cache.get(cacheKey));
  } else {
    try {
      const response = await axios.get(`${configService.getConfig('baseUrl')}/admin/bot/search`, {
        params: {
          perPage: 5,
          page: 1,
          match: true,
          name: botName,
        },
      });

      if (response.data) {
        console.log(
          `BotService:getBotIdFromBotName::Got Data From UCI Api : ${
            response.data
          } cache : ${cache.get(cacheKey)}`
        );
        try {
          const root: JsonNode = response.data;

          if (
            root.result &&
            root.result.data &&
            root.result.data.length > 0 &&
            root.result.data[0] &&
            BotUtil.checkBotValidFromJsonNode(root.result.data[0])
          ) {
            return BotUtil.getBotNodeData(root.result.data[0], 'id');
          }

          return null;
        } catch (jsonMappingException: any) {
          console.error(
            `Error while parsing data from JSON : ${jsonMappingException}`
          );
          return null;
        }
      }
    } catch (error: any) {
      console.error(
        `BotService:getBotIdFromBotName::Exception: ${error.message}`
      );
      return null;
    }

    return null;
  }
};

export const updateUser = async (
  userID: string,
  botName: string
): Promise<Pair<boolean, string>> => {
  console.log(
    `BotService:updateUser::Calling UCI Api: UserId: ${userID} botName: ${botName}`
  );

  try {
    const botID = await getBotIdFromBotName(botName);

    console.log(
      `BotService:updateUser::Calling add user on UCI Api:botId: ${botID}`
    );

    const url = `${configService.getConfig('baseUrl')}/admin/bot/${botID}/addUser/${userID}`;
    const response = await axios.get(url);

    if (response.data !== null) {
      console.log(
        `BotService:updateUser::user added FA successfully: ${response.data}`
      );

      try {
        const root = response.data;
        const responseCode = root.responseCode;

        if (
          root.result !== null &&
          root.result.status !== null &&
          (root.result.status.toLowerCase() === 'user_added' ||
            root.result.status.toLowerCase() === 'user_exists')
        ) {
          const addedUserID = root.result.userId;
          return new Pair(true, addedUserID);
        }

        return new Pair(false, '');
      } catch (jsonParsingException) {
        return new Pair(false, '');
      }
    } else {
      console.error(
        'BotService:updateUser::addUser: UCI Api returned null response'
      );
      return new Pair(false, '');
    }
  } catch (error: any) {
    console.error(`BotService:updateUser::Calling UCI Api:Exception: ${error}`);
    return new Pair(false, '');
  }
};

export const getAdapterByID = async (
  adapterID: string
): Promise<JsonNode | null> => {
  const cacheKey = `adapter-by-id: ${adapterID}`;
  console.log(
    `BotService:getAdapterByID::Calling get adapter by id from uci api: ${adapterID}`
  );

  if (cache.has(cacheKey)) {
    console.log(`getAdapterByID from cache: ${cache.get(cacheKey)}`);
    return cache.get(cacheKey);
  } else {
    console.log(`getAdapterByID from webclient: ${cache.get(cacheKey)}`);

    try {
      const response = await axios.get(`${configService.getConfig('baseUrl')}/admin/adapter/${adapterID}`);
      console.log(
        `BotService:getAdapterByID::Got Data From UCI Api : cache key : ${cacheKey} cache data : ${cache.get(
          cacheKey
        )}`
      );

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
  }
};

export const getAdapterCredentials = async (
  adapterID: string
): Promise<JsonNode | null> => {
  const cacheKey = `adapter-credentials: ${adapterID}`;
  const adapter = await getAdapterByID(adapterID);
  console.log(`getAdapterByID: ${adapter}`);

  if (adapter !== null) {
    let vaultKey: string | null;
    try {
      vaultKey = adapter.logicIDs[0].adapter.config.credentials.vault;
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

  const cacheKey = `adapter-credentials-by-id: ${secretKey}`;

  console.log(
    `BotService:getVaultCredentials::Calling get vault credentials from uci api: ${secretKey}`
  );

  if (cache.has(cacheKey)) {
    console.log(`getVaultCredentials from cache : ${cache.get(cacheKey)}`);
    return cache.get(cacheKey);
  } else {
    console.log(`getVaultCredentials from axios : ${cache.get(cacheKey)}`);

    const response = await webClient.get(`/admin/secret/${secretKey}`);

    console.log(
      `BotService:getVaultCredentials::Got Data From UCI Api : cache key : ${cacheKey} cache data : ${cache.get(
        cacheKey
      )}`
    );
    if (response.data !== null) {
      try {
        const credentials: Record<string, string> = {};
        const root = response.data;
        if (root.result !== null && root.result.logicIDs[0].adapter.config.credentials !== null) {
          return root.result.logicIDs[0].adapter.config.credentials;
        }
        return null;
      } catch (e: any) {
        console.error(`BotService:getVaultCredentials::Exception: ${e}`);
        return null;
      }
    }

    return null;
  }
};

export const getFirstFormByBotID = async (
  botId: string
): Promise<string | null> => {
  const cacheKey = `form-by-bot-name:${botId}`;

  if (cache.has(cacheKey)) {
    console.log(`getFirstFormByBotID from cache : ${cache.get(cacheKey)}`);
    return cache.get(cacheKey);
  } else {
    const response = await axios.get(`${configService.getConfig('baseUrl')}/admin/bot/${botId}`);

    console.log(
      `Call getFirstFormByBotID : ${response.data} cache : ${cache.get(
        cacheKey
      )}`
    );

    if (response.data !== null) {
      try {
        const root = response.data;
        if (
          root.result !== null &&
          root.result &&
          BotUtil.checkBotValidFromJsonNode(root.result)
        ) {
          return root.result.logicIDs[0].transformers[0].meta['formID'].toString();
        }
        return null;
      } catch (e: any) {
        console.error(`Error in getFirstFormByBotID >>> ${e}`);
        return null;
      }
    }

    return null;
  }
};

export const getBotNameByBotID = async (
  botId: string
): Promise<string | null> => {
  const cacheKey = `bot-name-by-id:${botId}`;

  if (cache.has(cacheKey)) {
    console.log(`getBotNameByBotID from cache : ${cache.get(cacheKey)}`);
    return cache.get(cacheKey);
  } else {
    const response = await axios.get(`${configService.getConfig('baseUrl')}/admin/bot/${botId}`);

    console.log(
      `Call getBotNameByBotID : ${response.data} cache : ${cache.get(cacheKey)}`
    );

    if (response.data !== null) {
      try {
        const root = response.data;
        if (
          root.result !== null &&
          root.result &&
          BotUtil.checkBotValidFromJsonNode(root.result)
        ) {
          return root.result['name'].toString();
        }
        return null;
      } catch (e: any) {
        console.error(`Error in getBotNameByBotID >>> ${e}`);
        return null;
      }
    }

    return null;
  }
};

// interface ApplicationData {
//   appName: string;
//   parts: any;
// }

// interface Application {
//   data: ApplicationData;
//   name: string;
// }

// function getButtonLinkedApp(appName: string): Application | null {
//   try {
//     const application = getCampaignFromName(appName);
//     const buttonLinkedAppID = application?.data?.parts[0]?.buttonLinkedApp;

//     if (buttonLinkedAppID) {
//       const linkedApplication = getCampaignFromID(buttonLinkedAppID);
//       return linkedApplication;
//     }
//   } catch (e) {
//     console.error(e);
//   }
//   return null;
// }

// function getApplications(): Application[] {
//   let applications: Application[] = [];

//   // Adjust the type of ApplicationResponse and Void based on your actual implementation
//   const response: ClientResponse<ApplicationResponse, Void> = fusionAuthClient.retrieveApplications();

//   if (response.wasSuccessful()) {
//     applications = response.successResponse.applications;
//   } else if (response.exception !== null) {
//     const exception: Error = response.exception;
//     console.log('getApplications', exception);
//   }

//   return applications;
// }

// function getCampaignFromID(botId: string): Application | null {
//   // Adjust the type of ApplicationResponse and Void based on your actual implementation
//   const applicationResponse: ClientResponse<ApplicationResponse, Error> = fusionAuthClient.retrieveApplication(botId);

//   if (applicationResponse.wasSuccessful()) {
//     return applicationResponse.successResponse.application;
//   } else if (applicationResponse.exception !== null) {
//     throw applicationResponse.exception;
//   }

//   return null;
// }

// function getCampaignFromName(botName: string): Application | null {
//   const applications: Application[] = getApplications();

//   let currentApplication: Application | null = null;

//   if (applications.length > 0) {
//     for (const application of applications) {
//       if (application.name === botName) {
//         currentApplication = application;
//         break;
//       }
//     }
//   }

//   return currentApplication;
// }
