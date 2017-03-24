Voxa Opearlo
===========

[![Build Status](https://travis-ci.org/mediarain/voxa-opearlo.svg?branch=master)](https://travis-ci.org/mediarain/voxa-opearlo)
[![Coverage Status](https://coveralls.io/repos/github/mediarain/voxa-opearlo/badge.svg?branch=master)](https://coveralls.io/github/mediarain/voxa-opearlo?branch=master)

An [Opearlo](https://www.npmjs.com/package/opearlo-analytics) plugin for [voxa](https://mediarain.github.io/voxa/)

Installation
-------------

Just install from [npm](https://www.npmjs.com/package/voxa-opearlo)

```bash
npm install --save voxa-opearlo
```

Usage
------

```javascript

const voxaOpearlo = require('voxa-opearlo');

const opearloConfig = {
  userId: 'userId',
  appName: 'appName',
  apiKey: 'apiKey',
};

voxaOpearlo(skill, opearloConfig);

```

What you get
------------
Once you register the Voxa plugin, it will handle logging all incoming intents automatically.
Additionally, each state will be logged as a CustomEvent. Thus out of the box you'll get a pathway that looks like:

![voice pathway](https://cloud.githubusercontent.com/assets/1660429/24310429/8f0d4ef4-1095-11e7-911a-d49268c1df60.png)

###Suppressing State Events

Sometimes smaller intermediary states can flood the pathways diagram. Suppress a state from logging as follows:
```javascript
skill.onState('my-state',alexaEvent => {
  alexaEvent.opearlo.ignore();
  return {reply: 'Greeting', to: 'my-next-state'};
})
```

###Logging variables
You can also add additional values which will be logged along with the state custom event
```javascript
skill.onState('my-state',alexaEvent => {
  alexaEvent.opearlo.variables.myVariable = 'hello'
  return {reply: 'Greeting', to: 'my-next-state'};
})
```

###Custom Events
You can also log custom events from a state.
```javascript
skill.onState('my-state',alexaEvent => {
  alexaEvent.opearlo.log('my-custom-event',{myVariable: 'hello'});
  return {reply: 'Greeting', to: 'my-next-state'};
})
```
