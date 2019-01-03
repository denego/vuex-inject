// store/modules/acl.js
export default {
  namespaced: true,

  getters: {
    isAdmin: (state, getters) => getters.$profileGroups.indexOf('admin') >= 0,
    $profileGroups: () => [],
  },

  inject: {
    state: {
      $profileGroups: 'profile/groups',
    },
  },
};
