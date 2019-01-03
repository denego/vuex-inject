// store/modules/profile.js
export default {
  namespaced: true,

  state: {
    isFeatureEnabled: false,
    groups: ['user', 'admin'],
  },

  getters: {
    isInjectable: state => state.isFeatureEnabled,
  },

  mutations: {
    setFeatureStatus: (state, value) => { state.isFeatureEnabled = value; },
  },
};
