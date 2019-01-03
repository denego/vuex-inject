export default function () {
  return {
    namespaced: true,

    state: {
      localKey: null,
      localAct: null,
    },

    getters: {
      secondKey: (state, getters) => getters.$keyState + '2',
      moreData: (state, getters) => getters.$allData.concat(2),

      $allData: () => [],
      $keyState: () => 'def',
    },

    actions: {
      mainAct: ({ dispatch }, p) => dispatch('$doAct', p),
      setKeyAct: ({ dispatch }, p) => dispatch('$setKey', p),

      $doAct: ({ commit }, p) => commit('setLocalAct', p),
      $setKey: ({ commit }, p) => commit('setLocalKey', p),
    },

    mutations: {
      setLocalKey: (state, p) => { state.localKey = p; },
      setLocalAct: (state, p) => { state.localAct = p; },
    },

    inject: {
      getters: {
        $allData: 'depModule/allData',
      },
      state: {
        $keyState: 'depModule/form.key',
      },
      actions: {
        $doAct: 'depModule/doAct',
      },
      mutations: {
        $setKey: 'depModule/setKey',
      },
    },
  };
};
