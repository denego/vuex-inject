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

  res.inject = [];
  (function deep (parents, modules) {
    if (!modules) {
      return;
    }
    res.inject = res.inject.concat(normalizeInjectOption(
      joinInjectOptions(
        options.inject, modules, res.moduleField, parents
      ),
      res.conditionalGetterName,
    ));
    Object.keys(modules)
      .filter(moduleName => modules[moduleName].modules)
      .forEach(moduleName => {
        deep(parents.concat(moduleName), modules[moduleName].modules);
      });
  }([], options.modules));

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

function joinInjectOptions (optionsInject, modules, moduleField, parents) {
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
        addInject(
          [...parents, moduleName].join('/'),
          type,
          modules[moduleName][moduleField][type]
        );
      });
  });
  Object.keys(optionsInject || {}).forEach(moduleName => {
    Object.keys(optionsInject[moduleName] || {})
      .forEach(type => {
        addInject(
          moduleName,
          type,
          optionsInject[moduleName][type]
        );
      });
  });
  return inject;
}

function injectAll (store, opts) {
  opts.inject.forEach(inj => {
    injectByType(inj.type, inj, store, opts.modules);
  });
}

function getModuleByName (modules, name) {
  if (!name) {
    return null;
  }

  let parts = name.split('/');
  while (parts.length > 1) {
    modules = modules[parts.shift()].modules;
  }
  return modules[parts.shift()];
}

function injectByType (type, config, store, modules) {
  let module = getModuleByName(modules, config.module);
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

  (function deep (modules, parent) {
    Object.keys(modules || {}).forEach(name => {
      Object.keys(modules[name]).forEach(type => {
        Object.keys(modules[name][type] || {}).forEach(fn => {
          if (typeof modules[name][type][fn] === 'function') {
            fnMap.set(modules[name][type][fn], [parent + name, type, fn]);
          }
          if (modules[name].modules) {
            deep(modules[name].modules, `${name}/`);
          }
        });
      });
    });
  }(modules, ''));

  return fnMap;
}

function joinDecoratorInjections (modules, moduleField) {
  let fnMap = getModulesFnMap(modules);
  while (decoratorInjections.length) {
    let [fn, dep, forceType] = decoratorInjections.shift();
    let [moduleName, type, name] = fnMap.get(fn) || [];
    let module = getModuleByName(modules, moduleName);
    type = forceType || type;
    if (fn && name) {
      module[moduleField] = module[moduleField] || {};
      let conf = module[moduleField];
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
