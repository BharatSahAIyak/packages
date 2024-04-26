import { MessageState, MessageType, XMessage, XMessageProvider } from '@samagra-x/xmessage';
import { v4 as uuid4 } from 'uuid';
import { PwaBotConfig } from './pwa.bot.config';
import axios from 'axios';
import { PwaBotMessage } from './types';

export class PwaBotProvider implements XMessageProvider {

    constructor(private config: PwaBotConfig) {}

    async convertMessageToXMsg(msg: XMessage): Promise<XMessage> {
        msg.channelURI = 'Bot';
        msg.providerURI = 'Pwa';
        msg.to = {
            userID: 'admin',
            bot: true,
        };
        msg.from.bot = false;
        msg.messageType = msg.messageType ?? MessageType.TEXT;
        msg.messageState = MessageState.REPLIED;
        msg.timestamp = Date.now();
        msg.payload = msg.payload ?? {};
        return msg;
    }

    async sendMessage(xmsg: XMessage) {
        if (xmsg.payload.text && !xmsg.payload.text.endsWith('<end/>')) {
            xmsg.payload.text = `${xmsg.payload.text}<end/>`;
        }
        await axios.post(
            this.config.socketEndpoint,
            xmsg
        );
    }
}
