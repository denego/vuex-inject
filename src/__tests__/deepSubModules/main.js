export default function () {
  return {
    namespaced: true,

    modules: {
      mainsec: {
        namespaced: true,

        modules: {
          mainthird: {
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
                $allData: 'depModule/depsec/depthird/allData',
              },
              state: {
                $keyState: 'depModule/depsec/depthird/form.key',
              },
              actions: {
                $doAct: 'depModule/depsec/depthird/doAct',
              },
              mutations: {
                $setKey: 'depModule/depsec/depthird/setKey',
              },
            },
          },
        },
      },
    },
  };
};
