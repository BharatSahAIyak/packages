import axios from 'axios';
import { ISideEffect } from "../common/sideEffect.interface";
import { SideEffectData } from "../common/sideEffect.types";
import { MessageId } from '@samagra-x/xmessage';

interface SubEventData {
    botId: string;
    userId: string;
    conversationId: string;
    orgId: string;
    messageId: MessageId;
    error?: string;
    phoneNumber: string;
}

interface ConstructedEventData {
    version: string;
    eventType: 'single' | 'chain';
    event: string;
    subEvent: SubEventData;
    timestamp: number;
    actorId: string;
    actorType: string;
    environment: string;
    sessionId?: string;
    timeTaken?: number;
}

export class TelemetrySideEffect implements ISideEffect {
    constructor(private readonly config: Record<string, any>) { }

    static doesConsumeEvent(eventName: string): boolean {
        return false;
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
            botId: "botId",
            userId: sideEffectData.eventData.to.userID,
            conversationId: "conversationId",
            orgId: sideEffectData.eventData?.orgId || '',
            messageId: sideEffectData.eventData?.messageId || '',
            error: sideEffectData.error,
            phoneNumber: "phonenumber",
        };

        const eventData: ConstructedEventData = {
            version: sideEffectData.version,
            eventType: "single",
            event: sideEffectData.eventName,
            subEvent: subEventData,
            timestamp: Date.now(),
            actorId: sideEffectData.transformerId,
            actorType: "Transformer",
            environment: sideEffectData.environment,
        };

        return eventData;
    }

    private extractHostFromConfig(): string {
        return this.config[this.getName()].host || "";
    }

    private async sendEventDataToTelemetry(eventData: ConstructedEventData, host: string): Promise<void> {
        try {
            await axios.post(`${host}/save`, eventData);
        } catch (error) {
            console.error("Error occurred while sending event data to Telemetry service:", error);
            throw error;
        }
    }
}
