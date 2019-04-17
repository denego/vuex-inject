export default function ({ isInjectable = true } = {}) {
  return {
    namespaced: true,

    modules: {
      depsec: {
        namespaced: true,

        modules: {
          depthird: {
            namespaced: true,

            state: {
              form: {
                key: 'value1',
              },
              lastAct: null,
            },

            getters: {
              allData: () => [2, 3],
              isInjectable: () => isInjectable,
            },

            mutations: {
              setKey (state, payload) {
                state.form.key = payload;
              },
              setLastAct (state, payload) {
                state.lastAct = payload;
              },
            },

            actions: {
              doAct: ({ commit }, p) => commit('setLastAct', p),
            },
          },
        },
      },
    },
  };
};
