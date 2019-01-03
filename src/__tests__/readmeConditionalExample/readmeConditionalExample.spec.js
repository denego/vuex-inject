import initStore from './store';

describe('acl', () => {
  it('should have conditional injection', () => {
    let store = initStore();

    // profile feature is turned off,
    // default implementation for $profileGroups
    expect(store.getters['acl/$profileGroups']).toEqual([]);
    expect(store.getters['acl/isAdmin']).toBe(false);

    // profile feature should be toggled for beta user
    store.commit('profile/setFeatureStatus', true);

    // profile/groups become available
    expect(store.getters['acl/$profileGroups']).toEqual(['user', 'admin']);
    expect(store.getters['acl/isAdmin']).toBe(true);
  });
});
