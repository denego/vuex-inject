import { inject, normalizeOptions } from '../injectPlugin';

describe('decorator injections', () => {

  it('should be added to modules config', () => {
    let opts = normalizeOptions({
      modules: {
        main: {
          getters: {
            @inject('depModule/version')
            $version () {},
            @inject('state', 'depModule/form.key')
            $stateKey () {},
          },
          actions: {
            @inject('depModule/doAct')
            $doAct () {},
            @inject('mutations', 'depModule/mutate')
            $mutate () {},
          },
        },
      },
    });
    expect(opts.modules.main.inject).toEqual({
      actions: { $doAct: 'depModule/doAct' },
      getters: { $version: 'depModule/version' },
      mutations: { $mutate: 'depModule/mutate' },
      state: { $stateKey: 'depModule/form.key' },
    });
  });

  it('should handle edge cases', () => {
    expect(
      () => normalizeOptions({ modules: { b: { getters: null } } })
    ).not.toThrow();
    expect(
      () => normalizeOptions({ modules: {
        a: {
          @inject('dep/asd')
          init () {},
        },
      } })
    ).not.toThrow();
  });

  it('should support submodules', () => {
    let opts = normalizeOptions({
      modules: {
        main: {
          getters: {
            @inject('depModule/version')
            $version () {},
            @inject('state', 'depModule/form.key')
            $stateKey () {},
          },
          modules: {
            submain: {
              actions: {
                @inject('depModule/doAct')
                $doAct () {},
                @inject('mutations', 'depModule/mutate')
                $mutate () {},
              },
            },
          },
        },
      },
    });
    expect(opts.modules.main.inject).toEqual({
      getters: { $version: 'depModule/version' },
      state: { $stateKey: 'depModule/form.key' },
    });
    expect(opts.modules.main.modules.submain.inject).toEqual({
      actions: { $doAct: 'depModule/doAct' },
      mutations: { $mutate: 'depModule/mutate' },
    });
  });
});
