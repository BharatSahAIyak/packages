import axios from 'axios';
import { ISideEffect } from "../common/sideEffect.interface";
import { SideEffectData } from "../common/sideEffect.types";
import { MessageId } from '@samagra-x/xmessage';

interface SubEventData {
    botId: string;
    userId: string;
    orgId: string;
    messageId?: MessageId;
    error?: string;
    totalTime?: number;
}

interface ConstructedEventData {
    generator: string;
    version: string;
    timestamp: string;
    actorId: string;
    actorType: string;
    sessionId?: string;
    deviceId?: string;
    env: string;
    eventId: string;
    event: string;
    subEvent: string;
    timeElapsed?: number;
    eventData:SubEventData;
}

const AcceptedEvents: string[] = ['DEFAULT:TRANSFORMER_START_EVENT', 'DEFAULT:TRANSFORMER_END_EVENT'];

export class TelemetrySideEffect implements ISideEffect {
    constructor(private readonly config: Record<string, any>) { }

    static doesConsumeEvent(eventName: string): Boolean {
        return AcceptedEvents.includes(eventName);
    }

    getName(): string {
        return "Telemetry";
    }

    async execute(sideEffectData: SideEffectData): Promise<boolean> {
        try {
            const eventData: ConstructedEventData = this.createEventData(sideEffectData);
            const host: string = this.extractHostFromConfig();

            if (!eventData || !host) {
                console.error("Event data or host not found.");
                return false;
            }

            await this.sendEventDataToTelemetry(eventData, host);
            console.log("Event data sent to Telemetry service successfully.");
            return true;
        } catch (error) {
            console.error("Error occurred during telemetry:", error);
            return false;
        }
    }

    private createEventData(sideEffectData: SideEffectData): ConstructedEventData {
        const subEventData: SubEventData = {
            botId: sideEffectData.eventData.app || '',
            userId: sideEffectData.eventData.to.userID,
            orgId: sideEffectData.eventData?.orgId || '',
            messageId: sideEffectData.eventData?.messageId || '',
        };

        const eventData: ConstructedEventData = {
            generator: "Transformer",
            version: "0.0.1", // Placeholder
            timestamp: new Date().toISOString(),
            actorId: sideEffectData.transformerId,
            actorType: "Transformer",
            env: "prod", // Placeholder
            eventId: "E040",
            event: 'Transformer Execution',
            subEvent: sideEffectData.eventName,
            eventData: subEventData
        };

        if (sideEffectData.eventName === 'DEFAULT:TRANSFORMER_END_EVENT') {
            eventData.eventId = "E041";
            eventData.timeElapsed = xmessage.transformer.metadata.totalTime; // Placeholder
        }
    
        return eventData;
    }

    private extractHostFromConfig(): string {
        return this.config[this.getName()].host || "";
    }

    private async sendEventDataToTelemetry(eventDataArray: ConstructedEventData, host: string): Promise<void> {
        try {
            await axios.post(`${host}/metrics/v1/save`, eventDataArray, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error("Error occurred while sending event data to Telemetry service:", error);
            throw error;
        }
    }
}
