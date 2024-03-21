import { ISideEffect } from "../common/sideEffect.interface";
import { SideEffectData } from "../common/sideEffect.types";

export class TelemetrySideEffect implements ISideEffect {

    constructor(config: Record<string, any>) { }

    static doesConsumeEvent(eventName: string): Boolean {
        return false;
    }

    getName(): string {
        throw new Error("Method not implemented.");
    }

    async execute(sideEffectData: SideEffectData): Promise<Boolean> {
        throw new Error("Method not implemented.");
    }
}
