import Vue from 'vue';
import Vuex from 'vuex';
import createInjectPlugin from '../../../injectPlugin';

import app from './modules/app';
import rest from './modules/rest';

Vue.use(Vuex);

export default function initStore (params, injectParams) {
  return new Vuex.Store({
    plugins: [
      createInjectPlugin({
        modules: { app, rest },
        inject: {
          rest: {
            getters: { $appVersion: 'app/version' },
          },
        },
        ...injectParams,
      }),
    ],
    ...params,
  });
};
