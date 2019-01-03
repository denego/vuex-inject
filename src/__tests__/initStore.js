import Vue from 'vue';
import Vuex from 'vuex';
import injectPlugin from '../../index';

Vue.use(Vuex);

export default function (modules, options) {
  return new (Vuex.Store)({ plugins: [
    injectPlugin({ modules, ...options }),
  ] });
};
