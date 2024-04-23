export type GraphNode = {
    "data": {
        "id": string,
        "label": string,
        "name": string,
        "inputParams": [
            {
               "name": string, 
            }
        ],
        "inputs": Record<string, any>,
    }
};

export type Edge = {
    "source": string,
    "sourceHandle": string,
    "target": string,
};

export type Recipe = {
    "nodes": GraphNode[],
    "edges": Edge[],
};

export type TransformerNode = {
    id: string,
    type: string,
    config: Record<string, any>,
    states: Record<string, string>,
    sideEffects?: Record<string, any>,
};

export type LogicDef = {
    id: string,
    transformers: TransformerNode[],
};
