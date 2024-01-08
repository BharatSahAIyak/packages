import llm from './modules/llm';
import common from './modules/common';

export default  {
    services: {
        ...common.services,
        ...llm.services
    },
    actions: {
        ...common.actions,
        ...llm.actions
    },
    gaurds: {
        ...common.gaurds,
        ...llm.gaurds
    },
    config: common.config
}