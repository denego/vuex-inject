import mainModuleConfig from './exampleModules/main';
import depModuleConfig from './exampleModules/dep';
import initStore from './initStore';

describe('main module', () => {
  let store;

  beforeEach(() => {
    let mainModule = mainModuleConfig();
    let depModule = depModuleConfig();
    store = initStore({ mainModule, depModule });
  });

  it('should have injected getter', () => {
    expect(store.getters['mainModule/moreData']).toEqual([2, 3, 2]);
  });

  it('should have injected state', () => {
    expect(store.getters['mainModule/secondKey']).toEqual('value12');
  });

  it('should have injected action', () => {
    store.dispatch('mainModule/mainAct', { a: 1 });
    expect(store.state.depModule.lastAct).toEqual({ a: 1 });
    expect(store.state.mainModule.localAct).toBe(null);
  });

  it('should have injected mutation', () => {
    let newKey = 'asd';
    store.dispatch('mainModule/setKeyAct', newKey);
    expect(store.state.depModule.form.key).toEqual(newKey);
    expect(store.getters['mainModule/secondKey']).toEqual(newKey + '2');
    expect(store.state.mainModule.localKey).toBe(null);
  });

});
