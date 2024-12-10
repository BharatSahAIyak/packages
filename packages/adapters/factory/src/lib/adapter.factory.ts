import {
    IEmailProvider,
    ISmsProvider,
    IChatProvider,
    IPushProvider
} from '@novu/stateless';
import { NodemailerProvider } from '@samagra-x/uci-adapters-nodemailer';
import { MailgunEmailProvider } from '@samagra-x/uci-adapters-mailgun';
import { MailjetEmailProvider } from '@samagra-x/uci-adapters-mailjet';
import { MailtrapEmailProvider } from '@samagra-x/uci-adapters-mailtrap';
import { TwilioSmsProvider } from '@samagra-x/uci-adapters-twilio-sms'
import { DiscordProvider } from '@samagra-x/uci-adapters-discord';
import { SlackProvider } from '@samagra-x/uci-adapters-slack';
import { TelegramBotProvider } from '@samagra-x/uci-adapters-telegram-bot';
import { GupshupWhatsappProvider } from '@samagra-x/uci-adapters-gupshup-whatsapp-adapter';
import { GupshupWhatsappV2Provider } from '@samagra-x/uci-adapters-gupshup-whatsapp-v2-adapter';
import { PwaBotProvider } from '@samagra-x/uci-adapters-pwa';
import { FcmProvider } from '@samagra-x/uci-adapters-fcm';

import { GenericAdapterConfig } from './adapter.factory.config';
import { XMessageProvider } from '@samagra-x/xmessage';


export enum AdapterType {
    EMAIL,
    SMS,
    CHAT,
    XMESSAGE
}

// Naming format is provider + channel
const emailTypes: string[] = [
    'NodemailerEmail',
    'MailgunEmail',
    'MailtrapEmail',
    'MailjetEmail',
];
const smsTypes: string[] = [
    'TwilioSms'
];
const chatTypes: string[] = [
    'DiscordDiscord',
    'SlackSlack',
    'TelegramTelegram'
];
const xmessageType: string[] = [
    'GupshupWhatsapp',
    'GupshupWhatsappV2',
    'PwaPwa',
    'FirebaseFcm'
];

export class AdapterFactory {
    static getAdapter(
        consumerData: GenericAdapterConfig
    ): IEmailProvider | ISmsProvider | IChatProvider | IPushProvider | XMessageProvider | undefined {
        switch (consumerData.type) {
            case 'NodemailerEmail':
                return new NodemailerProvider(consumerData.config);
            case 'MailgunEmail':
                return new MailgunEmailProvider(consumerData.config);
            case 'MailjetEmail':
                return new MailjetEmailProvider(consumerData.config);
            case 'MailtrapEmail':
                return new MailtrapEmailProvider(consumerData.config);
            case 'TwilioSms':
                return new TwilioSmsProvider(consumerData.config);
            case 'DiscordDiscord':
                return new DiscordProvider(consumerData.config);
            case 'SlackSlack':
                return new SlackProvider();
            case 'TelegramTelegram':
                return new TelegramBotProvider(consumerData.config);
            case 'GupshupWhatsapp':
                return new GupshupWhatsappProvider(consumerData.config);
            case 'GupshupWhatsappV2':
                return new GupshupWhatsappV2Provider(consumerData.config);
            case 'PwaPwa':
                return new PwaBotProvider(consumerData.config);
            case 'FirebaseFcm':
                return new FcmProvider(consumerData.config);
            default:
                return undefined;
        }
    }

    static getAdapterType(
        type: string
    ): AdapterType | undefined {
        if (emailTypes.includes(type)) {
            return AdapterType.EMAIL;
        }
        else if (smsTypes.includes(type)) {
            return AdapterType.SMS;
        }
        else if (chatTypes.includes(type)) {
            return AdapterType.CHAT;
        }
        else if (xmessageType.includes(type)) {
            return AdapterType.XMESSAGE;
        }
        else {
            return undefined;
        }
    }
}