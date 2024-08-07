import { CustomTelemetrySideEffect } from "../customTelemetry";
import { PropertyObserverSideEffect } from "../propertyObserver";
import { TelemetrySideEffect } from "../telemetry/telemetry.sideEffect";
import { ISideEffect } from "./sideEffect.interface";

export const SupportedSideEffects = [
    TelemetrySideEffect,
    CustomTelemetrySideEffect,
    PropertyObserverSideEffect,
];

/// Note: Local side-effect config takes precedence over
/// global side-effects.
export class SideEffectFactory {
    static getSideEffects(
        eventName: string,
        config: {
            globalConfig?: Record<string, any>,
            localConfig?: Record<string, any>,
        },
        filteredSideEffects: Partial<typeof SupportedSideEffects>
    ): ISideEffect[] {
        return filteredSideEffects.reduce((acc, effect) => {
            if (effect?.doesConsumeEvent(eventName)) {
                const resolvedConfig = config.localConfig?.[effect.getName()] ?? config.globalConfig?.[effect.getName()] ?? {};
                acc.push(new effect(resolvedConfig));
            }
            return acc;
        }, [] as ISideEffect[]);
    }
}
