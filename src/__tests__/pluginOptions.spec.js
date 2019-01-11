import { normalizeOptions } from '../injectPlugin';

describe('inject options', () => {

  it('should have default values', () => {
    let opts = normalizeOptions();
    expect(opts).toEqual({
      inject: {},
      modules: {},
      moduleField: 'inject',
      conditionalGetterName: 'isInjectable',
    });
  });

  it('should be normalized', () => {
    let opts = normalizeOptions({
      moduleField: 'inj',
      conditionalGetterName: 'isInj',
      inject: {
        main: {
          getters: {
            $depAll: 'depModule/allOverride',
            $depIsHere: 'depModule/isHere',
          },
        },
      },
      modules: {
        main: {
          inj: {
            getters: {
              $depAll: 'depModule/all',
            },
          },
        },
        second: {
          inj: {
            getters: {
              $mainData: 'main/data',
            },
          },
        },
      },
    });
    expect(opts.inject).toEqual([
      {
        module: 'main',
        type: 'getters',
        local: '$depAll',
        dep: ['depModule', 'allOverride'],
        cond: 'isInj',
      },
      {
        module: 'main',
        type: 'getters',
        local: '$depIsHere',
        dep: ['depModule', 'isHere'],
        cond: 'isInj',
      },
      {
        module: 'second',
        type: 'getters',
        local: '$mainData',
        dep: ['main', 'data'],
        cond: 'isInj',
      },
    ]);
  });

  it('should handle edge cases', () => {
    expect(
      () => normalizeOptions({ inject: { a: null } })
    ).not.toThrow();
    expect(
      () => normalizeOptions({ modules: { a: {} } })
    ).not.toThrow();
    expect(
      () => normalizeOptions({ inject: { a: null } })
    ).not.toThrow();
  });

});
