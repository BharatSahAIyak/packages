import axios from 'axios';
import { ISideEffect } from "../common/sideEffect.interface";
import { SideEffectData } from "../common/sideEffect.types";

export class TelemetrySideEffect implements ISideEffect {

    constructor(private config: Record<string, any>) { }

    static doesConsumeEvent(eventName: string): boolean {
        return false;
    }

    getName(): string {
        throw new Error("Method not implemented.");
    }

    async execute(sideEffectData: SideEffectData): Promise<boolean> {
        try {
            const eventData = sideEffectData.eventData?.payload;
            const host = this.extractHostFromEventData(eventData);

            if (!eventData || !host) {
                console.error("Event data or host not found.");
                return false;
            }

            await this.sendEventDataToTemetry(eventData, host);
            console.log("Event data sent to Telemetry service successfully.");
            return true;
        } catch (error) {
            console.error("Error occurred during telemetry:", error);
            return false;
        }
    }

    private extractHostFromEventData(eventData: Record<string, any>): string {
        return eventData?.transformer?.metaData?.host || "";
    }    

    private async sendEventDataToTemetry(eventData: Record<string, any>, host: string): Promise<void> {
        try {
            await axios.post(`${host}/save`, eventData);
        } catch (error) {
            console.error("Error occurred while sending event data to Telemetry service:", error);
            throw error;
        }
    }
}
