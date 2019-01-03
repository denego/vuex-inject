import mainModuleConfig from './exampleModules/main';
import initStore from './initStore';

describe('inline injection', () => {
  let store;

  function initStoreWithOptions (opts) {
    let mainModule = mainModuleConfig();
    return initStore({ mainModule }, opts);
  }

  it('should allow inline state and getter injection', () => {
    store = initStoreWithOptions({
      inject: {
        mainModule: {
          getters: {
            $allData: () => [123],
          },
          state: {
            $keyState: () => 'qwe',
          },
        },
      },
    });
    expect(store.getters['mainModule/moreData']).toEqual([123, 2]);
    expect(store.getters['mainModule/secondKey']).toEqual('qwe2');
  });

  it('should allow inline action and mutation injection', () => {
    store = initStoreWithOptions({
      inject: {
        mainModule: {
          actions: {
            $doAct: ({ commit }, p) => commit('setLocalAct', 'qwe'),
          },
          mutations: {
            $setKey: ({ commit }, p) => commit('setLocalKey', 'fdg'),
          },
        },
      },
    });
    store.dispatch('mainModule/mainAct', { a: 1 });
    expect(store.state.mainModule.localAct).toBe('qwe');

    store.dispatch('mainModule/setKeyAct', 'asd');
    expect(store.state.mainModule.localKey).toBe('fdg');
  });

  it('should throw "module not found"', () => {
    expect(() => initStoreWithOptions({
      inject: {
        noSuchModule: {
          actions: {
            $doAct: () => {},
          },
        },
      },
    }))
      .toThrowError('module not found: ' + JSON.stringify({
        module: 'noSuchModule',
        type: 'actions',
        local: '$doAct',
        cond: 'isInjectable',
      }));
  });

});
