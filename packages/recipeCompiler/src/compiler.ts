import { Recipe, GraphNode, LogicDef, TransformerNode } from "./types";
import { v4 as uuid4 } from "uuid";

export class RecipeCompiler {

    constructor() { }

    private createNodeMapping(flowLogic: Recipe): {
        indexNodeMap: Record<number, GraphNode>
        nodeIndexMap: Record<string, number>,
    } 
    {
        const indexNodeMap: Record<number, GraphNode> = {};
        const nodeIndexMap: Record<string, number> = {};
        let counter = 0;
        flowLogic.nodes.forEach((node) => {
          indexNodeMap[counter] = node;
          nodeIndexMap[node.data.id] = counter++;
        });
        return { indexNodeMap, nodeIndexMap };
    }

    private createEdgeMapping(flowLogic: Recipe): Record<string, Array<string>> {
        const edgeMapping: Record<string, Array<string>> = {};
        flowLogic.edges.forEach((edge) => {
          const edgeKey = `${edge.source}#${edge.target}`;
          if (!Array.isArray(edgeMapping[edgeKey])) {
            edgeMapping[edgeKey] = [];
          }
          edgeMapping[edgeKey].push(edge.sourceHandle);
        });
        return edgeMapping;
    }

    private createLogicGraph(
        flowLogic: Recipe,
        nodeIndexMap: Record<string, number>,
    ): Array<Set<number>> {
        const logicGraph: Array<Set<number>> = Array.from({ length: flowLogic.nodes.length }, () => new Set<number>());
        flowLogic.edges.forEach((edge) => {
          if (nodeIndexMap[edge.source] == undefined || nodeIndexMap[edge.target] == undefined) {
            throw new Error('Invalid logic flow data!');
          }
          logicGraph[nodeIndexMap[edge.source]].add(nodeIndexMap[edge.target]);
        });
        return logicGraph;
    }

    private traverse(
        node: number,
        logicGraph: Array<Set<number>>,
        indexNodeMap: Record<number, GraphNode>,
        edgeMapping: Record<string, Array<string>>,
        visited: Array<boolean>,
        logicDef: LogicDef,
    ) {
        visited[node] = true;
    
        // Extract state targets from edge data.
        const states: Record<string, string> = {};
        logicGraph[node].forEach((adjacentNode) => {
          const edgeKey = `${indexNodeMap[node].data.id}#${indexNodeMap[adjacentNode].data.id}`;
          if (!edgeMapping[edgeKey]) {
            throw new Error('Invalid logic flow data!');
          }
          edgeMapping[edgeKey].forEach((state) => {
            // Original Id is extracted from the state name which is in the format:
            //    LABEL_CLASSIFIER-output-LABEL_0-xMessage
            // We want to extract "LABEL_0" in this.
            const stateId = state.split("-")[2];
            states[stateId] = indexNodeMap[adjacentNode].data.id;
          });
        });
    
        const config: Record<string, any> = {};
        const configParameters = new Set(indexNodeMap[node].data.inputParams.map((input) => input.name));
        let sideEffects = undefined;
        Object.entries(indexNodeMap[node].data.inputs).forEach(([key, value]) => {
          if (!configParameters.has(key)) return;
          // Side-Effects are passed along with other parameters
          // from flowise.
          if (key === 'sideEffects') {
            sideEffects = value;
            return;
          }
          config[key] = value;
        });

        const nodeData: TransformerNode = {
          id: indexNodeMap[node].data.id,
          type: indexNodeMap[node].data.name,
          config: config,
          states: states,
        };
        if (sideEffects) {
          nodeData.sideEffects = sideEffects;
        }
        logicDef.transformers.push(nodeData);

        logicGraph[node].forEach((adjacentnode) => {
          if (visited[adjacentnode]) return;
          this.traverse(adjacentnode, logicGraph, indexNodeMap, edgeMapping, visited, logicDef);
        });
    }

    private createLogicDef(
        logicGraph: Array<Set<number>>,
        indexNodeMap: Record<number, GraphNode>,
        edgeMapping: Record<string, Array<string>>,
    ): LogicDef {
        const logicDef: LogicDef = {
          id: uuid4(),
          transformers: [],
        };
        const visited = new Array(logicGraph.length).fill(false);
        logicGraph.forEach((_node, index) => {
          if (visited[index]) return;
          this.traverse(index, logicGraph, indexNodeMap, edgeMapping, visited, logicDef);
        });
      
        return logicDef;
    }

    async compileLogic(flowLogic: Recipe): Promise<LogicDef> {
        const { indexNodeMap, nodeIndexMap } = this.createNodeMapping(flowLogic);
        const logicGraph: Array<Set<number>> = this.createLogicGraph(flowLogic, nodeIndexMap);
        const edgeMapping: Record<string, Array<string>> = this.createEdgeMapping(flowLogic);
        const logicDef: LogicDef = this.createLogicDef(logicGraph, indexNodeMap, edgeMapping);
        logicDef.transformers.sort((t1, t2) => nodeIndexMap[t1.id] - nodeIndexMap[t2.id]);
        return logicDef;
    }
}
