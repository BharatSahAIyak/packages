import { MessageState, MessageType, XMessage, XMessageProvider } from "@samagra-x/xmessage";
import admin from 'firebase-admin';
import { Message } from "firebase-admin/lib/messaging/messaging-api";
import { FCMProviderConfig } from "./fcm.types";
import { v4 as uuid4 } from 'uuid';
import { deleteApp } from "firebase-admin/app";

export class FcmProvider implements XMessageProvider {

    constructor(private config: FCMProviderConfig) {}

    async convertMessageToXMsg(msg: XMessage): Promise<XMessage> {
        msg.channelURI = 'Fcm';
        msg.providerURI = 'Firebase';
        msg.to = {
            userID: 'admin',
            bot: true,
        };
        msg.from.bot = false;
        msg.messageType = msg.messageType ?? MessageType.BROADCAST;
        msg.messageState = MessageState.ENQUEUED;
        msg.timestamp = Date.now();
        msg.messageId = {
            Id: uuid4(),
        };
        msg.payload = {};
        return msg;
    }

    async convertXmsgToMsg(xmsg: XMessage): Promise<any> {
        return xmsg;
    }

    async sendMessage(xmsg: XMessage): Promise<any> {
        const appName = `${this.config.project_id}_${uuid4()}`;
        xmsg.messageState = MessageState.SENT;
        const keys: any = {
            "project_id": this.config.project_id,
            "private_key_id": this.config.private_key_id,
            "private_key": Buffer.from(this.config.private_key).toString(),
            "client_email": this.config.client_email,
            "client_id": this.config.client_id,
            "client_x509_cert_url": this.config.client_x509_cert_url,
            "type": "service_account",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "universe_domain": "googleapis.com"
        };

        admin.initializeApp(
            {
            credential: admin.credential.cert(keys)
            },
            appName,
        );

        const fcmToken = xmsg.to.deviceID;

        const message: Message = {
            token: fcmToken,
            data: {
                title: xmsg.payload?.subject,
                body: xmsg.payload?.text,
                imageUrl: xmsg.payload?.media?.[0]?.url,
                icon: xmsg.payload?.media?.[1]?.url,
                notificationId: xmsg.app
            }
        }

        message.data = {
            ...message.data,
            ...xmsg.payload?.metaData?.broadcastData
        }

        admin.app(appName).messaging().send(message)
        .then((response) => {
            console.log('Successfully sent message:', response);
        })
        .catch((error) => {
            console.error('Error sending message:', error);
        })
        .finally(() => deleteApp({
            name: appName,
            options: {
                projectId: this.config.project_id,
            }
        }));
    }
}