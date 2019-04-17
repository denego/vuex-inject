import mainModuleConfig from './deepSubModules/main';
import depModuleConfig from './deepSubModules/dep';
import initStore from './initStore';

let store;

let assertions = () => {
  it('should have injected getter', () => {
    expect(store.getters['mainModule/mainsec/mainthird/moreData'])
      .toEqual([2, 3, 2]);
  });

  it('should have injected state', () => {
    expect(store.getters['mainModule/mainsec/mainthird/secondKey'])
      .toEqual('value12');
  });

  it('should have injected action', () => {
    store.dispatch('mainModule/mainsec/mainthird/mainAct', { a: 1 });
    expect(store.state.depModule.depsec.depthird.lastAct).toEqual({ a: 1 });
    expect(store.state.mainModule.mainsec.mainthird.localAct).toBe(null);
  });

  it('should have injected mutation', () => {
    let newKey = 'asd';
    store.dispatch('mainModule/mainsec/mainthird/setKeyAct', newKey);
    expect(store.state.depModule.depsec.depthird.form.key).toEqual(newKey);
    expect(store.getters['mainModule/mainsec/mainthird/secondKey'])
      .toEqual(newKey + '2');
    expect(store.state.mainModule.mainsec.mainthird.localKey).toBe(null);
  });
};

describe('deep submodule', () => {
  beforeEach(() => {
    let mainModule = mainModuleConfig();
    let depModule = depModuleConfig();
    store = initStore({ mainModule, depModule });
  });

  assertions();
});

describe('deep submodule with inline injection', () => {
  beforeEach(() => {
    let mainModule = mainModuleConfig();
    let depModule = depModuleConfig();
    let inject = mainModule.modules.mainsec.inject;
    delete mainModule.modules.mainsec.inject;
    store = initStore({ mainModule, depModule }, {
      inject: {
        'mainModule/mainsec': inject,
      },
    });
  });

  assertions();
});
