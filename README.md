# vuex-inject

Decouple [Vuex](http://vuex.vuejs.org/) modules from each other.

<hr />

[![Build Status](https://travis-ci.com/denego/vuex-inject.svg?branch=master)](https://travis-ci.com/denego/vuex-inject)
[![Coverage Status](https://coveralls.io/repos/github/denego/vuex-inject/badge.svg?branch=master)](https://coveralls.io/github/denego/vuex-inject?branch=master)
[![NPM version](https://img.shields.io/npm/v/vuex-inject.svg)](https://www.npmjs.com/package/vuex-inject)

## Installation

```bash
$ npm install vuex-inject
```

## Usage
```js
import modules from 'src/store/modules';
import createInjectPlugin from 'vuex-inject';

const store = new Vuex.Store({
  // pass 'modules' to the plugin instead of store
  plugins: [
    createInjectPlugin({
     modules,
     inject: {
       modA: {
         getters: { modBList: 'modB/list' },
       },
     },
    }),
  ],
  // modules,
});
```

## Example

Let's have a look at the following simple vuex modules:
```js
// store/modules/app.js
export default {
  namespaced: true,
  getters: {
    version: () => '0.1',
  },
};

// store/modules/rest.js
export default {
  namespaced: true,
  getters: {
    baseRestUrl: (state, getters, rootState, rootGetters) => {
      let appVersion = rootGetters['app/version'];
      return `/api/${appVersion}`;
    },
  },
};

// store/index.js
// ...
export default function initStore (params) {
  return Vuex.store({
    modules: { app, rest },
    ...params,
  });
};
```

`rest` module is coupled with `app` module: we can't use it or
test it separately.

Let's rewrite `rest` module with the plugin:
```js
// store/modules/rest.js
export default {
  namespaced: true,
  getters: {
    baseRestUrl: (state, getters) => {
      return `/api/${getters.$appVersion}`;
    },
    // $ here doesn't have any special meaning
    $appVersion: () => '',
  },
};

// store/index.js
// ...
export default function initStore (params, injectParams) {
  return new Vuex.Store({
    plugins: [
      createInjectPlugin({
        modules: { app, rest },
        inject: {
          rest: {
            getters: { $appVersion: 'app/version' },
          },
        },
        ...injectParams,
      }),
    ],
    ...params,
  });
};
```

Now `rest` module knows nothing about `app` module and it can be tested
separately but in a more "integrated" way (through the store) than unit
tests for each function in a module config:

```js
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
```

## What's inside

The injections is quite simple. When the following module will be passed to
createInjectPlugin:
```js
export default {
  namespaced: true,

  getters: {
    $todoList: () => [],
    $todoTitle: () => '',
  },

  actions: {
    $addTodoItem: () => {},
    $mutateTodoTitle: () => {},
  },

  inject: {
    getters: {
      $todoList: 'todo/list',
    },
    state: {
      // Note: state will be injected as getter
      $todoTitle: 'todo/form.title',
    },
    actions: {
      $addTodoItem: 'todo/addItem',
    },
    mutations: {
      // Note: mutation will be injected as action
      $mutateTodoTitle: 'todo/setTitle',
    },
  },
};
```

the module functions will be replaced with something like this:
```js
export default {
  namespaced: true,

  getters: {
    $todoList: (s, g, rootGetters) => rootGetters['todo/list'],
    $todoTitle: (s, g, rg, rootState) => rootState.todo.form.title,
  },

  actions: {
    $addTodoItem: ({ dispatch }, p) => {
      dispatch('todo/addItem', p, { root: true });
    },
    $mutateTodoTitle: ({ commit }, value) => {
      commit('todo/setTitle', value, { root: true });
    },
  },
};
```

## Conditional injection

Conditional injection may help implement dynamic feature toggles. If the module,
we are injecting from, has `isInjectable` (default name) getter and its value is `false`, then
all the parts injected from that module will return default (original) values,
until `isInjectable` getter become `true`.

Example:
```js
// store/modules/profile.js
export default {
  namespaced: true,

  state: {
    isFeatureEnabled: false,
    groups: ['user', 'admin'],
  },

  getters: {
    isInjectable: state => state.isFeatureEnabled,
  },

  mutations: {
    setFeatureStatus: (state, value) => { state.isFeatureEnabled = value; },
  },
};


// store/modules/acl.js
export default {
  namespaced: true,

  getters: {
    isAdmin: (state, getters) => getters.$profileGroups.indexOf('admin') >= 0,
    $profileGroups: () => [],
  },

  inject: {
    state: {
      $profileGroups: 'profile/groups',
    },
  },
};


// test
describe('acl', () => {
  it('should have conditional injection', () => {
    let store = initStore();

    // profile feature is turned off,
    // default implementation for $profileGroups
    expect(store.getters['acl/$profileGroups']).toEqual([]);
    expect(store.getters['acl/isAdmin']).toBe(false);

    // profile feature should be toggled for beta user
    store.commit('profile/setFeatureStatus', true);

    // profile/groups become available
    expect(store.getters['acl/$profileGroups']).toEqual(['user', 'admin']);
    expect(store.getters['acl/isAdmin']).toBe(true);
  });
});
```

## API

### `createInjectPlugin(options)`

Creates a new instance of the plugin with the given options. The following
options can be provided:

* `modules <Object>`: store modules config. We pass it here instead of
    store constructor.
* `inject <Object>`: injection config. This config has precedence over inner
    module inject config.
* `moduleField <String>`: Inner module inject config will be looked under this
    name. Defaults to `inject`
* `conditionalGetterName <String>`: Getter name to check to find out if
    conditional injection is allowed. Defaults to `isInjectable`


## License

[MIT](https://github.com/denego/vuex-inject/blob/master/LICENSE) © Denis Pobelov
