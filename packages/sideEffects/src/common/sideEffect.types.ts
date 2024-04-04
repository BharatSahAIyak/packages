import { XMessage } from "@samagra-x/xmessage";
import { version } from '../../node_modules/@types/uuid/index.d';

export type SideEffectData = {
    transformerId: string,
    eventName: string,
    timestamp: number,
    eventData: XMessage,
}

export enum Events {
    DEFAULT_TRANSFORMER_START_EVENT = 'DEFAULT_TRANSFORMER_START_EVENT',
    DEFAULT_TRANSFORMER_END_EVENT = 'DEFAULT_TRANSFORMER_END_EVENT'
}
