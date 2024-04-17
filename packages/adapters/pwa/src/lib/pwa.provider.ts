import { MessageState, MessageType, XMessage, XMessageProvider } from '@samagra-x/xmessage';
import { v4 as uuid4 } from 'uuid';
import { PwaBotConfig } from './pwa.bot.config';
import axios from 'axios';
import { PwaBotMessage } from './types';

export class PwaBotProvider implements XMessageProvider {

    constructor(private config: PwaBotConfig) {}

    async convertMessageToXMsg(msg: PwaBotMessage): Promise<XMessage> {
        let messageType = MessageType.TEXT;
        if (msg.messageType == MessageType.FEEDBACK_POSITIVE) {
            messageType = MessageType.FEEDBACK_POSITIVE;
        } 
        else if (msg.messageType == MessageType.FEEDBACK_NEGATIVE) {
            messageType = MessageType.FEEDBACK_NEGATIVE;
        }
        else if (msg.messageType == MessageType.FEEDBACK_NEUTRAL) {
            messageType = MessageType.FEEDBACK_NEUTRAL;
        }
        let text = msg.body || '';
        if (text.startsWith('\\register')) {
            text = text.replace('\\register ', '').trim();
            messageType = MessageType.REGISTRATION;
        }
        const xmessage: XMessage = {
            to: {
                userID: "admin",
                bot: true,
            },
            from: {
                userID: `${msg.userId}`,
                bot: false,
            },
            channelURI: "Bot",
            providerURI: "Pwa",
            messageState: MessageState.REPLIED,
            messageId: {
                channelMessageId: msg.conversationId,
                Id: `${msg.messageId}`,
                replyId: msg.replyId,
            },
            messageType: messageType,
            timestamp: new Date().getTime(),
            payload: {
                text: text,
                metaData: msg.metaData
            },
        };

        return xmessage;
    }

    async sendMessage(xmsg: XMessage) {
        await axios.post(
            this.config.socketEndpoint,
            xmsg
        );
    }
}
