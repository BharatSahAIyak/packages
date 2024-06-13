import { XMessage } from "@samagra-x/xmessage";

export type SideEffectData = {
    transformerId: string,
    eventName: string,
    timestamp: number,
    eventData: XMessage,
}

export enum Events {
    DEFAULT_TRANSFORMER_START_EVENT = 'DEFAULT_TRANSFORMER_START_EVENT',
    DEFAULT_TRANSFORMER_END_EVENT = 'DEFAULT_TRANSFORMER_END_EVENT',
    CUSTOM_TELEMETRY_EVENT_LOG = 'CUSTOM_TELEMETRY_EVENT_LOG',
    CUSTOM_TELEMETRY_EVENT_ERROR = 'CUSTOM_TELEMETRY_EVENT_ERROR',
}
