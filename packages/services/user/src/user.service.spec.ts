import axios from 'axios';
import configService from './userServiceConfig';
import { createFAUser, updateFAUser } from './user.service';
var MockAdapter = require('axios-mock-adapter');

const MockFAresponse = {
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImMxVU5ON0pIUVc4X21ROHBTaWZKbzBXekdybDlTbTRnIn0.eyJleHAiOjE1ODY4ODQzNzksImlhdCI6MTU4Njg4NDMxOSwiaXNzIjoiZnVzaW9uYXV0aC5pbyIsInN1YiI6IjAwMDAwMDAwLTAwMDAtMDAwMS0wMDAwLTAwMDAwMDAwMDAwMCIsImF1dGhlbnRpY2F0aW9uVHlwZSI6IlVTRVJfQ1JFQVRFIiwiZW1haWwiOiJ0ZXN0MEBmdXNpb25hdXRoLmlvIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInByZWZlcnJlZF91c2VybmFtZSI6InVzZXJuYW1lMCJ9.Z1jV8xDcayZZDBdLRVd2fIyowhstRI4Dgk7_u2XFerc',
  user: {
    active: true,
    breachedPasswordLastCheckedInstant: 1471786483322,
    birthDate: '1976-05-30',
    connectorId: 'e3306678-a53a-4964-9040-1c96f36dda72',
    data: {
      displayName: 'Johnny Boy',
      favoriteColors: ['Red', 'Blue'],
    },
    email: 'example@fusionauth.io',
    expiry: 1571786483322,
    firstName: 'John',
    fullName: 'John Doe',
    id: '00000000-0000-0001-0000-000000000000',
    imageUrl: 'http://65.media.tumblr.com/tumblr_l7dbl0MHbU1qz50x3o1_500.png',
    lastLoginInstant: 1471786483322,
    lastName: 'Doe',
    memberships: [
      {
        data: {
          externalId: 'cc6714c6-286c-411c-a6bc-ee413cda1dbc',
        },
        groupId: '2cb5c83f-53ff-4d16-88bd-c5e3802111a5',
        id: '27218714-305e-4408-bac0-23e7e1ddceb6',
        insertInstant: 1471786482322,
      },
    ],
    middleName: 'William',
    mobilePhone: '303-555-1234',
    passwordChangeRequired: false,
    passwordLastUpdateInstant: 1471786483322,
    preferredLanguages: ['en', 'fr'],
    registrations: [
      {
        applicationId: '10000000-0000-0002-0000-000000000001',
        data: {
          displayName: 'Johnny',
          favoriteSports: ['Football', 'Basketball'],
        },
        id: '00000000-0000-0002-0000-000000000000',
        insertInstant: 1446064706250,
        lastLoginInstant: 1456064601291,
        preferredLanguages: ['en', 'fr'],
        roles: ['user', 'community_helper'],
        timezone: 'America/Chicago',
        username: 'johnny123',
        usernameStatus: 'ACTIVE',
        verified: true,
        verifiedInstant: 1698772159415,
      },
    ],
    timezone: 'America/Denver',
    tenantId: 'f24aca2b-ce4a-4dad-951a-c9d690e71415',
    twoFactor: {
      methods: [
        {
          authenticator: {
            algorithm: 'HmacSHA1',
            codeLength: 6,
            timeStep: 30,
          },
          id: '35VW',
          method: 'authenticator',
        },
        {
          id: 'V7SH',
          method: 'sms',
          mobilePhone: '555-555-5555',
        },
        {
          email: 'example@fusionauth.io',
          id: '7K2G',
          method: 'email',
        },
      ],
    },
    usernameStatus: 'ACTIVE',
    username: 'johnny123',
    verified: true,
    verifiedInstant: 1698772159415,
  },
};

const mockFARequest = {
  applicationId: '368994e6-ba8a-49b5-8446-7b99ab1fffdf',
  disableDomainBlock: false,
  user: {
    birthDate: '1976-05-30',
    data: {
      displayName: 'Test User',
      favoriteColors: ['Red', 'Blue'],
    },
    email: 'example@fusionauth.io',
    encryptionScheme: 'salted-sha256',
    factor: 24000,
    expiry: 1571786483322,
    firstName: 'John',
    fullName: 'John Doe',
    imageUrl: 'http://65.media.tumblr.com/tumblr_l7dbl0MHbU1qz50x3o1_500.png',
    lastName: 'Doe',
    memberships: [
      {
        data: {
          externalId: 'cc6714c6-286c-411c-a6bc-ee413cda1dbc',
        },
        groupId: '2cb5c83f-53ff-4d16-88bd-c5e3802111a5',
      },
    ],
    middleName: 'William',
    mobilePhone: '303-555-1234',
    password: 'supersecret',
    passwordChangeRequired: false,
    preferredLanguages: ['en', 'fr'],
    timezone: 'America/Denver',
    twoFactor: {
      methods: [
        {
          authenticator: {
            algorithm: 'HmacSHA1',
            codeLength: 6,
            timeStep: 30,
          },
          secret: 'aGVsbG8Kd29ybGQKaGVsbG8gaGVsbG8=',
          method: 'authenticator',
        },
        {
          method: 'sms',
          mobilePhone: '555-555-5555',
        },
        {
          method: 'email',
          email: 'example@fusionauth.io',
        },
      ],
    },
    usernameStatus: 'ACTIVE',
    username: 'johnny123',
  },
};

describe('userService', () => {
  it('create FA user', async () => {
    const mock = new MockAdapter(axios);

    mock.onPost('testUrl/api/user/').reply(200, MockFAresponse);

    const appConfig = {
      fusionAuthUrl: 'testUrl',
      fusionAuthKey: 'abcd'
    };

    configService.setConfig(appConfig);
    const result = await createFAUser(mockFARequest);
    expect(result).toEqual({ data: MockFAresponse, success: 'true' });
  });

  it('update FA user', async () => {
    const mock = new MockAdapter(axios);

    mock.onPut('testUrl/api/user/00000000-0000-0001-0000-000000000000').reply(200, MockFAresponse);

    const appConfig = {
      fusionAuthUrl: 'testUrl',
      fusionAuthKey: 'abcd'
    };

    configService.setConfig(appConfig);
    const result = await updateFAUser("00000000-0000-0001-0000-000000000000", MockFAresponse);
    expect(result).toEqual({ data: MockFAresponse, success: 'true' });
  });
});
