import { XMessage } from "@samagra-x/xmessage";
import { version } from '../../node_modules/@types/uuid/index.d';

export type SideEffectData = {
    transformerId: string,
    eventName: string,
    timestamp: number,
    version:string;
    environment:string,
    phonenumber:;
    eventData: XMessage,
}
