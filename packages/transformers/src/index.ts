import llm from './modules/llm';
import nuralCoreference from './modules/nuralCoreference';
import searchSimilarChunks from './modules/searchSimilarChunks';
import common from './modules/common';

export default  {
    services: {
        ...common.services,
        ...llm.services,
        ...nuralCoreference.services,
        ...searchSimilarChunks.services
    },
    actions: {
        ...common.actions,
        ...llm.actions,
        ...nuralCoreference.actions,
        ...searchSimilarChunks.actions
    },
    gaurds: {
        ...common.gaurds,
        ...llm.gaurds,
        ...nuralCoreference.gaurds,
        ...searchSimilarChunks.gaurds
    },
    config: common.config
}