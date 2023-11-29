import {
  getBotIdFromBotName,
  getBotNameByBotID,
  getBotNodeFromId,
  getBotNodeFromName,
  getBotNodeFromStartingMessage,
  getFirstFormByBotID,
  updateUser,
} from './bot.service';
import axios from 'axios';
import configService from './botServiceConfig';
var MockAdapter = require('axios-mock-adapter');

const mockBotsDb = [
  {
    id: 'testId',
    createdAt: '2023-05-04T19:22:40.768Z',
    updatedAt: '2023-05-04T19:22:40.769Z',
    name: 'TestName',
    startingMessage: 'Namaste Bot Test',
    ownerID: null,
    ownerOrgID: null,
    purpose: 'TestPurpose',
    description: 'TestDescription',
    startDate: '2023-05-03T00:00:00.000Z',
    endDate: '2025-12-01T00:00:00.000Z',
    status: 'ENABLED',
    tags: [],
    botImage: 'testImageFile',
    users: [
      {
        id: 'testUserId',
        createdAt: '2023-05-05T09:26:14.817Z',
        updatedAt: '2023-05-05T09:26:14.818Z',
        name: 'Testing User Segment - 1',
        description: null,
        count: 0,
        category: null,
        allServiceID: 'testServiceId',
        byPhoneServiceID: 'testPhoneServiceId',
        byIDServiceID: null,
        botId: null,
        all: {
          id: 'testId',
          createdAt: '2023-05-05T09:25:49.482Z',
          updatedAt: '2023-05-05T09:25:49.482Z',
          type: 'get',
          config: {
            url: 'http://testSegmentUrl/segments/1/mentors?deepLink=nipunlakshya://chatbot',
            type: 'GET',
            cadence: {
              perPage: 1,
              retries: 5,
              timeout: 60,
              concurrent: true,
              pagination: true,
              concurrency: 10,
              'retries-interval': 10,
            },
            pageParam: 'page',
            credentials: {},
            totalRecords: 1,
          },
          name: null,
        },
      },
    ],
    logicIDs: [
      {
        id: 'testLogicId',
        name: 'Load Test Firebase Broadcast Logic',
        createdAt: '2023-05-05T09:28:11.910Z',
        updatedAt: '2023-05-05T09:28:11.911Z',
        description: null,
        adapterId: 'testAdapterId',
        transformers: [
          {
            id: 'testTransformerId',
            createdAt: '2023-05-05T09:28:11.894Z',
            updatedAt: '2023-05-05T09:28:11.912Z',
            meta: {
              body: 'Hello ${name}-${phoneNo}, Test Notification',
              type: 'broadcast',
              title: 'Firebase Test Notification',
              data: {
                botId: 'testConversationBotId',
              },
              formID: 'testFormId',
              params: ['name', 'phoneNo'],
              templateType: 'JS_TEMPLATE_LITERALS',
            },
            transformerId: 'testTransformerId',
            conversationLogicId: 'testConversationLogicId',
          },
        ],
        adapter: {
          id: 'testAdapterId',
          createdAt: '2023-03-18T06:02:41.824Z',
          updatedAt: '2023-03-18T06:02:41.824Z',
          channel: 'web',
          provider: 'firebase',
          config: {
            credentials: {
              vault: 'testVault',
              variable: 'nl-app-firebase-notification',
            },
          },
          name: 'Test Firebase Adapter',
        },
      },
    ],
  },
];

describe('BotService', () => {
  it('get bot node from bot starting message', async () => {
    const mock = new MockAdapter(axios);
    mock
      .onGet('testUrl/admin/bot/search', {
        params: {
          perPage: 5,
          page: 1,
          match: true,
          startingMessage: 'test starting message',
        },
      })
      .reply(200, {
        result: { data: mockBotsDb },
      });

    const appConfig = {
      baseUrl: 'testUrl',
    };

    configService.setConfig(appConfig);
    const result = await getBotNodeFromStartingMessage('test starting message');
    expect(result).toEqual(mockBotsDb[0]);
  });

  it('get bot node from name', async () => {
    const mock = new MockAdapter(axios);
    mock
      .onGet('testUrl2/admin/bot/search', {
        params: {
          perPage: 5,
          page: 1,
          match: true,
          name: 'testName',
        },
      })
      .reply(200, {
        result: { data: mockBotsDb },
      });

    const appConfig = {
      baseUrl: 'testUrl2',
    };

    configService.setConfig(appConfig);
    const result = await getBotNodeFromName('testName');
    expect(result).toEqual(mockBotsDb);
  });

  it('get bode node from id', async () => {
    const mock = new MockAdapter(axios);
    mock.onGet('testUrl3/admin/bot/testID', {}).reply(200, {
      result: mockBotsDb[0],
    });

    const appConfig = {
      baseUrl: 'testUrl3',
    };

    configService.setConfig(appConfig);
    const result = await getBotNodeFromId('testID');
    expect(result).toEqual(mockBotsDb[0]);
  });

  it('get bode id from name', async () => {
    const mock = new MockAdapter(axios);
    mock
      .onGet('testUrl4/admin/bot/search', {
        params: {
          perPage: 5,
          page: 1,
          match: true,
          name: 'testBotName',
        },
      })
      .reply(200, {
        result: { data: mockBotsDb },
      });

    const appConfig = {
      baseUrl: 'testUrl4',
    };

    configService.setConfig(appConfig);
    const result = await getBotIdFromBotName('testBotName');
    expect(result).toEqual(mockBotsDb[0].id);
  });

  it('update user', async () => {
    const mock = new MockAdapter(axios);

    mock
      .onGet('testUrl5/admin/bot/search', {
        params: {
          perPage: 5,
          page: 1,
          match: true,
          name: 'testBotName',
        },
      })
      .reply(200, {
        result: { data: mockBotsDb },
      });

    mock.onGet(`testUrl5/admin/bot/testId/addUser/testUserId`, {}).reply(200, {
      result: {
        data: mockBotsDb,
        responseCode: 200,
        status: 'user_added',
        userId: 'testUserId',
      },
    });

    const appConfig = {
      baseUrl: 'testUrl5',
    };

    class Pair<T1, T2> {
      constructor(
        public first: T1,
        public second: T2
      ) {}
    }

    configService.setConfig(appConfig);
    const result = await updateUser('testUserId', 'testBotName');
    expect(result).toEqual(new Pair(true, 'testUserId'));
  });

  it('get first form by bot id', async () => {
    const mock = new MockAdapter(axios);

    mock.onGet(`testUrl8/admin/bot/testBotId2`, {}).reply(200, {
      result: mockBotsDb[0],
    });

    const appConfig = {
      baseUrl: 'testUrl8',
    };

    configService.setConfig(appConfig);
    const result = await getFirstFormByBotID('testBotId2');
    expect(result).toEqual(
      mockBotsDb[0].logicIDs[0].transformers[0].meta['formID']
    );
  });

  it('get bot name by bot id', async () => {
    const mock = new MockAdapter(axios);

    mock.onGet(`testUrl9/admin/bot/testBotId3`, {}).reply(200, {
      result: mockBotsDb[0],
    });

    const appConfig = {
      baseUrl: 'testUrl9',
    };

    configService.setConfig(appConfig);
    const result = await getBotNameByBotID('testBotId3');
    expect(result).toEqual(mockBotsDb[0].name);
  });
});
