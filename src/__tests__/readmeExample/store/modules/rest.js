// store/modules/rest.js
export default {
  namespaced: true,
  getters: {
    baseRestUrl: (state, getters) => {
      return `/api/${getters.$appVersion}`;
    },
    // $ here doesn't have any special meaning
    $appVersion: () => '',
  },
};
