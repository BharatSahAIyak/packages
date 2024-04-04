import { SideEffectData } from "./sideEffect.types";

export interface ISideEffect {
    execute(sideEffectData: SideEffectData): Promise<Boolean>;
}
