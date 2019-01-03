import mainModuleConfig from './exampleModules/main';
import depModuleConfig from './exampleModules/dep';
import initStore from './initStore';

describe('module with non-injectable dependency', () => {
  let store;

  beforeEach(() => {
    let mainModule = mainModuleConfig();
    let depModule = depModuleConfig({ isInjectable: false });
    store = initStore({ mainModule, depModule });
  });

  it('should have default getter', () => {
    expect(store.getters['mainModule/$allData']).toEqual([]);
  });

  it('should have default action', () => {
    store.dispatch('mainModule/mainAct', { a: 1 });
    expect(store.state.mainModule.localAct).toEqual({ a: 1 });
  });

  it('should have default state', () => {
    expect(store.getters['mainModule/secondKey']).toEqual('def2');
  });

  it('should have default mutation', () => {
    let newKey = 'asd';
    store.dispatch('mainModule/setKeyAct', newKey);
    expect(store.getters['mainModule/secondKey']).toEqual('def2');
    expect(store.state.mainModule.localKey).toBe('asd');
  });
});
