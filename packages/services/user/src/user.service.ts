import axios from 'axios';
import { FusionAuthClient, User } from '@fusionauth/typescript-client';
import configService from './userServiceConfig';

interface JSONObject {
  // Define the structure of your JSONObject
  [key: string]: any;
}

// interface FAUser {
//   registrationChannel: string;
//   mobilePhone: string;
//   username: string;
//   id: string;
//   type: string;
// }

// interface FADevice {
//   type: string;
//   id: string;
// }

// interface FAUserSegment {
//   device: FADevice;
//   users: FAUser[];
// }

interface FieldError {
  message: string;
}

interface ResponseNode {
  success: string;
  errors?: string[] | FieldError[];
  data?: Record<string, any>;
}

// const createApplicationIfNotExists = async (applicationID: string, applicationName: string): Promise<boolean> => {
//   return await findApplicationByID(applicationID) ? true : createApplication(applicationID, applicationName);
// };

export const findApplicationByID = async (
  applicationID: string
): Promise<boolean> => {
  try {
    const fusionAuthUrl = configService.getConfig('fusionAuthUrl');
    const fusionAuthAppID = configService.getConfig('fusionAuthAppID');
    const fusionAuthClient = new FusionAuthClient(
      fusionAuthAppID,
      fusionAuthUrl
    );
    const response = await fusionAuthClient.retrieveApplication(applicationID);
    return response.statusCode === 200 ? true : false;
  } catch (error: any) {
    console.error(`Error in findApplicationByID: ${error}`);
    return false;
  }
};

// const createApplication = (applicationID: string, applicationName: string): boolean => {
//   try {
//     const application = new Application()
//       .with(app => app.id = applicationID)
//       .with(app => app.name = applicationName);

//     const response = fusionAuthClient.createApplication(applicationID, { application: application,
//       role: {description: '',
//         id: '',
//         insertInstant: 0,
//         isDefault: true,
//         isSuperRole: true,
//         lastUpdateInstant: 0,
//         name: 'string',},
//       sourceApplicationId: ''});

//     if (response) {
//       console.log(`Success: ${response}`);
//       return true;
//     } else {
//       console.log(`Error response: ${response}`);
//       return false;
//     }
//   } catch (error: any) {
//     console.error(`Error in createApplication: ${error}`);
//     return false;
//   }
// };

export const findFAUserByUsername = async (
  username: string
): Promise<User | undefined> => {
  try {
    const fusionAuthUrl = configService.getConfig('fusionAuthUrl');
    const fusionAuthAppID = configService.getConfig('fusionAuthAppID');
    const fusionAuthClient = new FusionAuthClient(
      fusionAuthAppID,
      fusionAuthUrl
    );
    const response = await fusionAuthClient.retrieveUserByUsername(username);

    if (response.wasSuccessful()) {
      return response.response.user;
    } else if (response.exception) {
      // Exception Handling
      const exception = response.exception;
      console.error(
        `Exception in findFAUserByUsername: ${exception.toString()}`
      );
    }
    return undefined;
  } catch (error: any) {
    console.error(`Error in findFAUserByUsername: ${error}`);
    return undefined;
  }
};

export const findByEmail = async (email: string): Promise<User | undefined> => {
  try {
    const fusionAuthUrl = configService.getConfig('fusionAuthUrl');
    const fusionAuthAppID = configService.getConfig('fusionAuthAppID');
    const fusionAuthClient = new FusionAuthClient(
      fusionAuthAppID,
      fusionAuthUrl
    );
    const response = await fusionAuthClient.retrieveUserByEmail(email);

    if (response.wasSuccessful()) {
      return response.response.user;
    } else if (response.exception) {
      // Exception Handling
      const exception = response.exception;
      console.error(`Exception in findByEmail: ${exception.toString()}`);
    }
    return undefined;
  } catch (error: any) {
    console.error(`Error in findByEmail: ${error}`);
    return undefined;
  }
};

const findUsersForCampaign = async (campaignName: string): Promise<User[]> => {
  try {
    // Fixme: Important
    /*
     * Application currentApplication =
     * botService.getCampaignFromName(campaignName); FusionAuthClient
     * staticClient = getFusionAuthClient(); if(currentApplication != null){
     * UserSearchCriteria usc = new UserSearchCriteria(); usc.numberOfResults =
     * 10000; usc.queryString = "(memberships.groupId: " +
     * currentApplication.data.get("group") + ")"; SearchRequest sr = new
     * SearchRequest(usc); ClientResponse<SearchResponse, Errors> cr =
     * staticClient.searchUsersByQueryString(sr);
     *
     * if (cr) { return cr.users; } else if
     * (cr.exception != null) { // Exception Handling Exception exception =
     * cr.exception; console.error("Exception in getting users for campaign: " +
     * exception.toString()); } }
     */
    return [];
  } catch (error: any) {
    console.error(`Error in findUsersForCampaign: ${error}`);
    return [];
  }
};

export const jsonArrayToList = (userPhonesResponse: any[]): string[] => {
  const usersList: string[] = [];
  if (userPhonesResponse) {
    for (let i = 0; i < userPhonesResponse.length; i++) {
      usersList.push(String(userPhonesResponse[i]));
    }
  }
  return usersList;
};

export const getUsersFromFederatedServers = async (
  campaignID: string,
  meta: Record<string, string> | null
): Promise<any[] | null> => {
  const baseURL = meta?.page
    ? `${configService.getConfig(
        'CAMPAIGN_URL'
      )}/admin/bot/getAllUsers/${campaignID}/${meta.page}`
    : `${configService.getConfig(
        'CAMPAIGN_URL'
      )}/admin/bot/getAllUsers/${campaignID}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'admin-token': configService.getConfig('CAMPAIGN_ADMIN_TOKEN'),
  };

  if (meta?.['conversation-authorization']) {
    headers['Conversation-Authorization'] = meta['conversation-authorization'];
  }

  console.log(
    `UserService:getUsersFromFederatedServers::Calling botId: ${campaignID} ::: Base URL : ${baseURL}`
  );

  try {
    const response = await axios.get(baseURL, { headers });
    return response.data.result;
  } catch (error: any) {
    console.error(`Error:getUsersFromFederatedServers::Exception: ${error}`);
    return null;
  }
};

export const getUsersMessageByTemplate = async (
  jsonData: any
): Promise<any[] | null> => {
  console.log('UserService:getUsersMessageByTemplate::CallingTemplaterService');
  const baseURL = `${configService.getConfig(
    'baseUrlTemplate'
  )}/process/testMany`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios.post(baseURL, jsonData, { headers });
    console.log(`response body: ${response.data}`);
    const usersMessage: any[] = response.data.processed;
    return usersMessage;
  } catch (error: any) {
    console.error(`Error:getUsersMessageByTemplate::Exception: ${error}`);
    return null;
  }
};

export const getManager = async (applicant: User): Promise<Nullable<User>> => {
  try {
    const managerName = applicant.data?.reportingManager as string | undefined;
    //@ts-ignore
    const u = await getUserByFullName(managerName, 'SamagraBot');
    return u || null;
  } catch (e) {
    return null;
  }
};

export const getProgramCoordinator = async (
  applicant: User
): Promise<Nullable<User>> => {
  try {
    const coordinatorName = applicant.data?.programCoordinator as string;
    const u = await getUserByFullName(coordinatorName, 'SamagraBot');
    return u || null;
  } catch (e) {
    return null;
  }
};

export const getProgramConstruct = (applicant: User): string => {
  try {
    const programConstruct = String(applicant.data?.programConstruct);
    return programConstruct !== 'undefined' ? programConstruct : '2';
  } catch (e) {
    return '2';
  }
};

export const getEngagementOwner = async (
  applicant: User
): Promise<User | null> => {
  try {
    const engagementOwnerName = String(applicant.data?.programOwner);
    const u = await getUserByFullName(engagementOwnerName, 'SamagraBot');
    return u ?? null;
  } catch (e) {
    return null;
  }
};

type Nullable<T> = T | null;

export const getUserByFullName = async (
  fullName: string,
  campaignName: string
): Promise<Nullable<User>> => {
  try {
    const allUsers: User[] = await findUsersForCampaign(campaignName);
    const user = allUsers.find((u) => u.fullName === fullName);
    return user || null;
  } catch (e) {
    return null;
  }
};

// const update = async (user: User): Promise<Nullable<User>> => {
//   try {
//     const userResponse = await fusionAuthClient.updateUser(user.id, new UserRequest(false, false, user));
//     if (userResponse) {
//       return userResponse.response.user || null;
//     }
//     return null;
//   } catch (error) {
//     return null;
//   }
// };

export const isAssociate = (applicant: User): boolean => {
  try {
    const role = applicant.data?.get('role') as string;
    return role === 'Program Associate';
  } catch (error) {
    return true;
  }
};

const cache: { [key: string]: JSONObject } = {};

export const getUserByPhoneFromFederatedServers = async (
  campaignID: string,
  phone: string
): Promise<JSONObject | null> => {
  const baseURL = `${configService.getConfig(
    'CAMPAIGN_URL'
  )}/admin/v1/bot/getFederatedUsersByPhone/${campaignID}/${phone}`;
  const cacheKey = `FEDERATED USERS: USER SERVICE: ${baseURL}`;

  // Check if the data is in the cache
  if (cache[cacheKey]) {
    return cache[cacheKey] as JSONObject;
  }

  try {
    const response = await axios.get(baseURL, {
      headers: {
        'Content-Type': 'application/json',
        'admin-token': configService.getConfig('CAMPAIGN_ADMIN_TOKEN'), // Replace with your actual admin token
      },
      timeout: 90000, // 90 seconds timeout
    });

    const users = response.data;

    try {
      const user = users.result.data.user;
      user.is_registered = 'yes';
      cache[cacheKey] = user;
      return user;
    } catch (error) {
      const user: JSONObject = { is_registered: 'no' };
      cache[cacheKey] = user;
      return user;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

// const registerUpdateFAUser = async (username: string, applicationID: string, segment: FAUserSegment): Promise<Record<string, any>> => {
//   const data: Record<string, any> = {};
//   const device: Record<string, string> = {
//     type: segment.device.type,
//     id: segment.device.id,
//   };

//   data.device = device;

//   if (segment.users && segment.users.length > 0) {
//     const users: Record<string, string>[] = segment.users.map((fauser) => ({
//       registrationChannel: fauser.registrationChannel,
//       mobilePhone: fauser.mobilePhone,
//       username: fauser.username,
//     }));

//     data.users = users;
//   }

//   const user: User = {
//     username: username,
//     password: 'dummyPassword',
//     active: true,
//     data: data,
//   };

//   const registration: UserRegistration = {
//     applicationId: applicationID,
//     username: username,
//   };

//   let response: ClientResponse<RegistrationResponse> | null = null;
//   const existingUser: User | undefined = await findFAUserByUsername(username);

//   const responseNode: Record<string, any> = {
//     success: 'true',
//     message: 'User registered.',
//   };

//   if (existingUser) {
//     const userResponse = await fusionAuthClient.updateUser(existingUser.id, new UserRequest(user));

//     if (userResponse) {
//       const existingRegistration = existingUser.getRegistrationForApplication(applicationID);

//       if (!existingRegistration) {
//         response = await fusionAuthClient.register(existingUser.id, new RegistrationRequest(null, registration));
//       } else {
//         responseNode.success = 'true';
//         responseNode.message = 'User registered.';
//         return responseNode;
//       }
//     } else if (userResponse) {
//       responseNode.success = 'false';
//       responseNode.errors = userResponse.response.fieldErrors.toString();
//       return responseNode;
//     } else {
//       responseNode.success = 'false';
//       responseNode.errors = 'No response from FusionAuth.';
//       return responseNode;
//     }
//   } else {
//     response = await fusionAuthClient.register(null, new RegistrationRequest(user, registration));
//   }

//   if (response) {
//     responseNode.success = 'true';
//     responseNode.message = 'User registered.';
//   } else if (response) {
//     responseNode.success = 'false';
//     responseNode.errors = response.response.fieldErrors.toString();
//   } else {
//     responseNode.success = 'false';
//     responseNode.errors = 'No response from FusionAuth.';
//   }

//   return responseNode;
// };

export const createFAUser = async (
  node: Record<string, any>
): Promise<ResponseNode | null> => {
  try {
    const url = `${configService.getConfig('fusionAuthUrl')}/api/user/`;
    console.log(`url: ${url}, node: ${JSON.stringify(node)}`);

    const response = await axios.post(url, node, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: configService.getConfig('fusionAuthKey'),
      },
    });

    const resultNode: Record<string, any> = response.data;
    const responseNode: ResponseNode = { success: 'false' };
    if (resultNode) {
      if (resultNode.fieldErrors) {
        responseNode.success = 'false';
        responseNode.errors = resultNode.fieldErrors.map(
          (error: FieldError) => error.message
        );
      } else if (resultNode.generalErrors) {
        responseNode.success = 'false';
        responseNode.errors = resultNode.generalErrors.map(
          (error: FieldError) => error.message
        );
      } else {
        responseNode.success = 'true';
        responseNode.data = resultNode;
      }
    } else {
      responseNode.success = 'false';
      responseNode.errors = ['No response from Fusion Auth'];
    }

    return responseNode;
  } catch (error: any) {
    console.error(`Error in createFAUser: ${error}`);
    return null;
  }
};

export const updateFAUser = async (
  userId: string,
  node: Record<string, any>
): Promise<ResponseNode | null> => {
  try {
    const url = `${configService.getConfig('fusionAuthUrl')}/api/user/${userId}`;
    console.log(`url: ${url}, node: ${JSON.stringify(node)}`);

    const response = await axios.put(url, node, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: configService.getConfig('fusionAuthKey'),
      },
    });
    const resultNode: Record<string, any> = response.data;
    const responseNode: ResponseNode = { success: 'false' };

    if (resultNode) {
      if (resultNode.fieldErrors) {
        responseNode.success = 'false';
        responseNode.errors = resultNode.fieldErrors.map(
          (error: FieldError) => error.message
        );
      } else if (resultNode.generalErrors) {
        responseNode.success = 'false';
        responseNode.errors = resultNode.generalErrors.map(
          (error: FieldError) => error.message
        );
      } else {
        responseNode.success = 'true';
        responseNode.data = resultNode;
      }
    } else {
      responseNode.success = 'false';
      responseNode.errors = ['No response from Fusion Auth'];
    }

    return responseNode;
  } catch (error: any) {
    console.error(`Error in updateFAUser: ${error}`);
    return null;
  }
};
