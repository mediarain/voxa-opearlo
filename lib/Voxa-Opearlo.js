'use strict';

const _ = require('lodash');
const OpearloAnalytics = require('opearlo-analytics');
const debug = require('debug')('voxa:opearlo');

const defaultConfig = {
  initialState: 'entry',
  userId: 'userId',
  appName: 'appName',
  apiKey: 'apiKey',
};

function register(skill, config) {
  const pluginConfig = _.merge({}, defaultConfig, config);

  skill.onSessionStarted((alexaEvent) => {
    OpearloAnalytics.initializeAnalytics(
      pluginConfig.userId,
      pluginConfig.appName,
      alexaEvent.session);

    debug('Session started');
  });

  skill.onIntentRequest((alexaEvent, reply) => {
    OpearloAnalytics.registerVoiceEvent(
      alexaEvent.session.user.userId,
      'IntentRequest',
      alexaEvent.intent);

    debug(`${alexaEvent.intent.name} logged`);
  });

  skill.onAfterStateChanged((alexaEvent, reply, transition) => {
    if (transition) {
      OpearloAnalytics.registerVoiceEvent(
        alexaEvent.session.user.userId,
        'Custom',
        'State transition',
        { to: transition.to });

      debug(`${transition.to} state logged`);
    }
  });

  skill.onBeforeReplySent((alexaEvent, reply, transition) => new Promise((resolve, reject) => {
    OpearloAnalytics.recordAnalytics(
      alexaEvent.session.user.userId,
      pluginConfig.apiKey,
      (result) => {
        debug(`recordAnalytics (state: ${transition.to.name}); result: ${result}`);
        resolve();
      });
  }));

  skill.onSessionEnded((alexaEvent) => {
    OpearloAnalytics.registerVoiceEvent(alexaEvent.session.user.userId,
      'Custom',
      'Session ended');
    debug('SessionEndedRequest logged');

    if(alexaEvent.request.type == 'SessionEndedRequest') { //If we get an explict session ended request, we'll need to trigger this ourselves
      return new Promise( (resolve,reject) =>  OpearloAnalytics.recordAnalytics(
        alexaEvent.session.user.userId,
        pluginConfig.apiKey,
        (result) => {
          debug(`recordAnalytics (SessionEndedRequest);`);
          resolve();
        })
      );
    }
  });

  skill.onStateMachineError((alexaEvent, reply, error) => {
    OpearloAnalytics.registerVoiceEvent(alexaEvent.session.user.userId,
      'Custom',
      'Error',
      { message: error.message });

    debug(`Error logged: ${error}`);
  });
}

module.exports = register;
