export default function createInjectPlugin (options) {
  let opts = normalizeOptions(options);
  let modules = opts.modules;

  return store => {
    injectAll(store, opts);

    Object.keys(modules).forEach(moduleName => {
      store.registerModule(moduleName, modules[moduleName]);
    });
  };
}

export function normalizeOptions (options) {
  let defaults = {
    modules: {},
    inject: {},
    moduleField: 'inject',
    conditionalGetterName: 'isInjectable',
  };

  if (!options) {
    return defaults;
  }

  let res = {
    ...defaults,
    ...options,
  };

  joinDecoratorInjections(options.modules, res.moduleField);

  res.inject = normalizeInjectOption(
    joinInjectOptions(options.inject, options.modules, res.moduleField),
    res.conditionalGetterName,
  );

  return res;
}

function normalizeInjectOption (inject, condName) {
  let norm = [];
  Object.keys(inject).forEach(module => {
    norm = norm.concat(
      normalizeInjectConfig(inject[module], module, condName)
    );
  });
  return norm;
}

function normalizeInjectConfig (config, module, cond) {
  let injections = [];
  Object.keys(config).forEach(type => {
    Object.keys(config[type]).forEach(local => {
      let dep = config[type][local];
      if (typeof dep === 'string') {
        dep = dep.split('/');
      }
      injections.push({ module, type, local, dep, cond });
    });
  });
  return injections;
}

function joinInjectOptions (optionsInject, modules, moduleField) {
  let inject = {};

  function addInject (moduleName, type, config) {
    if (!inject[moduleName]) {
      inject[moduleName] = {};
    }
    if (!inject[moduleName][type]) {
      inject[moduleName][type] = {};
    }
    Object.assign(inject[moduleName][type], config);
  }

  Object.keys(modules || {}).forEach(moduleName => {
    Object.keys(modules[moduleName][moduleField] || {})
      .forEach(type => {
        addInject(moduleName, type, modules[moduleName][moduleField][type]);
      });
  });
  Object.keys(optionsInject || {}).forEach(moduleName => {
    Object.keys(optionsInject[moduleName] || {})
      .forEach(type => {
        addInject(moduleName, type, optionsInject[moduleName][type]);
      });
  });
  return inject;
}

function injectAll (store, opts) {
  opts.inject.forEach(inj => {
    injectByType(inj.type, inj, store, opts.modules);
  });
}

function injectByType (type, config, store, modules) {
  let module = modules[config.module];
  if (!module) {
    throw Error(`module not found: ${JSON.stringify(config)}`);
  }
  let localName = config.local;
  let dep = config.dep;
  let remoteName = typeof dep !== 'function' && depFullName(dep);
  let getters = module.getters;
  let actions = module.actions;
  let defaultGetter = getters && getters[localName];
  let defaultAction = actions && actions[localName];

  let tempActionName = `${localName}_${Math.random()}`;

  if (type === 'getters' || type === 'state') {
    if (!defaultGetter) {
      throw Error(`no defaultGetter: ${JSON.stringify(config)}`);
    }
  }

  if (type === 'actions' || type === 'mutations') {
    if (!defaultAction) {
      throw Error(`no defaultAction: ${JSON.stringify(config)}`);
    }
    actions[tempActionName] = actions[localName];
  }

  if (type === 'getters') {
    injectGetter(
      config,
      store,
      getters,
      (state, getters, rootState, rootGetters) => rootGetters[remoteName],
      getters[localName],
    );
  }

  if (type === 'state') {
    injectGetter(
      config,
      store,
      getters,
      (state, getters, rootState, rootGetters) => {
        let dep = config.dep.reduce((res, member) => [
          ...res,
          ...member.split('.'),
        ], []);
        let result = rootState;
        while (dep.length > 0) {
          result = result[dep.shift()];
        }
        return result;
      },
      getters[localName],
    );
  }

  if (type === 'actions') {
    injectAction(
      config,
      store,
      actions,
      ({ dispatch }, data) => dispatch(remoteName, data, { root: true }),
      actions[tempActionName],
    );
  }

  if (type === 'mutations') {
    injectAction(
      config,
      store,
      actions,
      ({ commit }, data) => commit(remoteName, data, { root: true }),
      actions[tempActionName],
    );
  }
}

function conditional (conditionFn, trueFn, falseFn) {
  return function () {
    let condition = conditionFn.apply(this, arguments);
    return (condition ? trueFn : falseFn).apply(this, arguments);
  };
}

function injectGetter (config, store, moduleGetters, implFn, defaultFn) {
  let localName = config.local;
  if (typeof config.dep === 'function') {
    moduleGetters[localName] = config.dep;
    return;
  }
  let remoteIsAvailable = `${depModuleName(config.dep)}/${config.cond}`;

  let conditionFn = (state, getters, rootState, rootGetters) => {
    let isAvailableExists = isGetterExist(rootGetters, remoteIsAvailable);
    return !isAvailableExists || rootGetters[remoteIsAvailable];
  };

  moduleGetters[localName] = conditional(conditionFn, implFn, defaultFn);
}

function injectAction (config, store, moduleActions, implFn, defaultFn) {
  let localName = config.local;
  if (typeof config.dep === 'function') {
    moduleActions[localName] = config.dep;
    return;
  }
  let remoteIsAvailable = `${depModuleName(config.dep)}/${config.cond}`;
  let conditionFn = ({ state, getters, rootState, rootGetters }) => {
    let isAvailableExists = isGetterExist(rootGetters, remoteIsAvailable);
    return !isAvailableExists || rootGetters[remoteIsAvailable];
  };
  moduleActions[localName] = conditional(conditionFn, implFn, defaultFn);
}

function depFullName (depAsArray) {
  return depAsArray.join('/');
}

function depModuleName (depAsArray) {
  let resultArray = [...depAsArray];
  resultArray.pop();
  return resultArray.join('/');
}

function isGetterExist (getters, name) {
  return Boolean(Object.getOwnPropertyDescriptor(getters, name));
}

let decoratorInjections = [];

function getModulesFnMap (modules) {
  let fnMap = new WeakMap();
  Object.keys(modules || {}).forEach(moduleName => {
    Object.keys(modules[moduleName]).forEach(type => {
      Object.keys(modules[moduleName][type] || {}).forEach(fn => {
        if (typeof modules[moduleName][type][fn] === 'function') {
          fnMap.set(modules[moduleName][type][fn], [moduleName, type, fn]);
        }
      });
    });
  });
  return fnMap;
}

function joinDecoratorInjections (modules, moduleField) {
  let fnMap = getModulesFnMap(modules);
  while (decoratorInjections.length) {
    let [fn, dep, forceType] = decoratorInjections.shift();
    let [moduleName, type, name] = fnMap.get(fn) || [];
    type = forceType || type;
    if (fn && name) {
      modules[moduleName][moduleField] = modules[moduleName][moduleField] || {};
      let conf = modules[moduleName][moduleField];
      conf[type] = conf[type] || {};
      conf[type][name] = dep;
      fnMap.delete(fn);
    }
  }
}

export function legacyDecorator (type, dep) {
  if (dep === undefined) {
    dep = type;
    type = undefined;
  }
  return function (target, name, config) {
    decoratorInjections.push([target[name], dep, type]);
    return config;
  };
}

export const inject = legacyDecorator;
