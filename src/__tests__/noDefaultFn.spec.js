import mainModuleConfig from './exampleModules/main';
import depModuleConfig from './exampleModules/dep';
import initStore from './initStore';

describe('module without default implementations', () => {

  function testTemplate (modifyFn, expectedError) {
    return () => {
      let mainModule = mainModuleConfig();
      let depModule = depModuleConfig();

      modifyFn(mainModule, depModule);

      expect(
        () => initStore({ mainModule, depModule })
      ).toThrowError(expectedError);
    };
  }

  it('should throw if no default getter', testTemplate(
    mainModule => { mainModule.getters.$allData = null; },
    'no defaultGetter: ' + JSON.stringify({
      module: 'mainModule',
      type: 'getters',
      local: '$allData',
      dep: ['depModule', 'allData'],
      cond: 'isInjectable',
    })
  ));

  it('should throw if no default getter for state injection', testTemplate(
    mainModule => { mainModule.getters.$keyState = null; },
    'no defaultGetter: ' + JSON.stringify({
      module: 'mainModule',
      type: 'state',
      local: '$keyState',
      dep: ['depModule', 'form.key'],
      cond: 'isInjectable',
    })
  ));

  it('should throw if no default action', testTemplate(
    mainModule => { mainModule.actions.$doAct = null; },
    'no defaultAction: ' + JSON.stringify({
      module: 'mainModule',
      type: 'actions',
      local: '$doAct',
      dep: ['depModule', 'doAct'],
      cond: 'isInjectable',
    })
  ));

  it('should throw if no default action for mutation', testTemplate(
    mainModule => { mainModule.actions.$setKey = null; },
    'no defaultAction: ' + JSON.stringify({
      module: 'mainModule',
      type: 'mutations',
      local: '$setKey',
      dep: ['depModule', 'setKey'],
      cond: 'isInjectable',
    })
  ));

});
