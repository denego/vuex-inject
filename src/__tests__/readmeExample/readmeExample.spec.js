import initStore from './store';

describe('rest', () => {
  it('should have baseRestUrl', () => {
    let store = initStore({}, {
      inject: {
        rest: {
          getters: { $appVersion: () => '1.1' },
        },
      },
    });
    expect(store.getters['rest/baseRestUrl']).toBe('/api/1.1');
  });
});
