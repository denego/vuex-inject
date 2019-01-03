import Vue from 'vue';
import Vuex from 'vuex';
import createInjectPlugin from '../../../injectPlugin';

import profile from './modules/profile';
import acl from './modules/acl';

Vue.use(Vuex);

export default function initStore (params, injectParams) {
  return new Vuex.Store({
    plugins: [
      createInjectPlugin({
        modules: { profile, acl },
        ...injectParams,
      }),
    ],
    ...params,
  });
};
