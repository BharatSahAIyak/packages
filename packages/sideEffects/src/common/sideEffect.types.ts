import { XMessage } from "@samagra-x/xmessage";

export type SideEffectData = {
    transformerId: string,
    eventName: string,
    timestamp: number,
    eventData: XMessage,
}
