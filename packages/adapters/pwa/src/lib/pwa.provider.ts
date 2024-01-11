import { MessageState, MessageType, XMessage, XMessageProvider } from '@samagra-x/xmessage';
import { v4 as uuid4 } from 'uuid';
import { PwaBotConfig } from './pwa.bot.config';
import axios from 'axios';
import { PwaBotMessage } from './types';

export class PwaBotProvider implements XMessageProvider {

    constructor(private config: PwaBotConfig) {}

    static async convertMessageToXMsg(msg: PwaBotMessage): Promise<XMessage> {
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
                channelMessageId: `${msg.conversationId}`,
                Id: `${msg.messageId}`,
            },
            messageType: MessageType.TEXT,
            timestamp: new Date().getTime(),
            payload: {
                text: msg.body,
            },
        };

        return xmessage;
    }

    async sendMessage(xMsg: XMessage) {
        await axios.post(
            this.config.socketEndpoint,
            xMsg
        );
    }
}
