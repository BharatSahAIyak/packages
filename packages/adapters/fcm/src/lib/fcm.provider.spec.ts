const MockMessaging = {
    send: jest.fn(() => MockMessaging),
    then: jest.fn(() => MockMessaging),
    catch: jest.fn(() => MockMessaging),
};

const MockAdmin = {
    initializeApp: jest.fn(),
    messaging: jest.fn(() => MockMessaging),
    credential: {
        cert: jest.fn(),
    }
};

jest.mock('firebase-admin', () => MockAdmin);

import { MessageState, MessageType } from "@samagra-x/xmessage";
import { FcmProvider } from "./fcm.provider";

describe('fcm adapter tests', () => {

    it('fcm adapter works as expected', async () => {
        const provider = new FcmProvider({
            client_email: 'myClientEmail',
            client_id: 'myClientId',
            client_x509_cert_url: 'myClientCert',
            private_key: 'myPrivateKey',
            private_key_id: 'myPrivateId',
            project_id: 'myProjectId'
        });
        await provider.sendMessage({
            messageType: MessageType.BROADCAST,
            channelURI: 'Fcm',
            providerURI: 'Firebase',
            from: {
                userID: 'admin',
                bot: true,
            },
            to: {
                userID: 'myUserId',
                deviceID: 'userFcmToken'
            },
            messageId: {
                Id: '00000000-0000-0000-0000-000000000000'
            },
            timestamp: 9999,
            payload: {
                subject: 'my notification title',
                text: 'my notification body',
                media: [
                    {
                        url: 'myImageUrl',
                    }
                ]
            },
            messageState: MessageState.SENT,
        });

        expect(MockAdmin.initializeApp).toHaveBeenCalledTimes(1);
        expect(MockAdmin.credential.cert).toHaveBeenCalledWith({
            client_email: 'myClientEmail',
            client_id: 'myClientId',
            client_x509_cert_url: 'myClientCert',
            private_key: 'myPrivateKey',
            private_key_id: 'myPrivateId',
            project_id: 'myProjectId',
            type: 'service_account',
            'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
            'token_uri': 'https://oauth2.googleapis.com/token',
            'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs',
            'universe_domain': 'googleapis.com'
        });
        expect(MockMessaging.send).toHaveBeenCalledWith({
            token: 'userFcmToken',
            notification: {
                title: 'my notification title',
                body: 'my notification body',
                imageUrl: 'myImageUrl',
            }
        });
    });
});
