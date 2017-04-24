'use strict';

const _ = require('lodash');
const OpearloAnalytics = require('opearlo-analytics');
const debug = require('debug')('voxa:opearlo');
const EventRider = require('./EventRider');

const defaultConfig = {
  initialState: 'entry',
  userId: 'userId',
  appName: 'appName',
  apiKey: 'apiKey',
  ignoreUsers: [],
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

  skill.onBeforeStateChanged((event, reply, state) => {
    event.opearlo = new EventRider(event, state);
  });

  skill.onIntentRequest((alexaEvent) => {
    OpearloAnalytics.registerVoiceEvent(
      alexaEvent.session.user.userId,
      'IntentRequest',
      alexaEvent.intent);

    debug(`${alexaEvent.intent.name} logged`);
  });

  skill.onAfterStateChanged((alexaEvent, reply, transition) => {
    const rider = alexaEvent.opearlo;
    if (transition && !rider.ignoreState) {
      if (transition.reply) rider.variables.reply = transition.reply;
      rider.variables.to = transition.to;

      OpearloAnalytics.registerVoiceEvent(
        alexaEvent.session.user.userId,
        'Custom',
        rider.name,
        alexaEvent.opearlo.variables);
      debug(`${transition.to} state logged`);
    }
  });

  function logSessionEnd(alexaEvent) {
    if (alexaEvent.request.reason === 'ERROR') {
      OpearloAnalytics.registerVoiceEvent(alexaEvent.session.user.userId, 'Custom', 'Error', alexaEvent.request.error);
      debug('Session Error logged');
    } else {
      OpearloAnalytics.registerVoiceEvent(alexaEvent.session.user.userId, 'Custom', 'Session ended');
      debug('Session Ended logged');
    }
  }

  skill.onSessionEnded((alexaEvent) => {
    if (alexaEvent.request.type === 'SessionEndedRequest') {
      logSessionEnd(alexaEvent);
    }
    if (_.includes(pluginConfig.ignoreUsers, alexaEvent.user.userId)) return Promise.resolve(null);
    if (pluginConfig.suppressSending) return Promise.resolve(null);

    return new Promise(resolve => OpearloAnalytics.recordAnalytics(
      alexaEvent.session.user.userId,
      pluginConfig.apiKey,
      () => {
        debug('recordAnalytics');
        resolve();
      }
    ));
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
