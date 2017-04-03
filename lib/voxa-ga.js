'use strict';

const _ = require('lodash');
const debug = require('debug')('voxa:opearlo');
const detect = require('./detect');
const EventRider = require('./EventRider');

const defaultConfig = {
  ignoreUsers: [],
  debug: false,
  appName: detect.appName(),
  appVersion: detect.appVersion()
};

function register(skill, config) {
  if(!config.trackingId) throw new Error('trackingId is required in the config file');
  const pluginConfig = _.merge({}, defaultConfig, config);

  skill.onRequestStarted(event => {
    event.ga = new EventRider(event,pluginConfig);
    event.ga.time('Interaction','Request');
  })

  skill.onSessionStarted(event => {
    event.ga.startSession();
  });

  skill.onSessionEnded(event => {
    event.ga.endSession();
    if (event.request.type === 'SessionEndedRequest') { // If this is an external end, we cannot ride on the normal pageview, we have to make one
      event.ga.pushPath('SessionEndedExternally');
      event.ga.logPath(event)
      return send(event);
    }
  });

  skill.onStateMachineError((event,reply,error) => {
    let ga = event.ga
    if(!ga) return;
    let errMsg = error.stack || error.body || error.data || error.message || (error.request ? error.request.href : null) || error;
    ga.visitor.exception({exd: errMsg});
    return send(event).then(_.constant(undefined));
  });

  skill.onIntentRequest(event => {
    var ga = event.ga;
    ga.visitor.event("Intents",event.intent.name,undefined,undefined,{ni: 1});
    _.forEach(event.intent.slots,function(slot){
      ga.visitor.event("Slots",slot.name,slot.value, isNaN(slot.value) ? undefined: +slot.value, {ni: 1})
    });
  });

  skill.onBeforeStateChanged((event, reply, state) => {
    //event.ga.state = state.name;
    event.ga.from = state.name;
    event.ga.time('States',state.name);
    //event.ga.ignoreState = state.name === 'entry'; // The entry state is at the start of every request, so it's really not interesting to know anything about;
  });

  skill.onAfterStateChanged((event, reply, transition) => {
    let ga = event.ga;
    if(!ga.ignoreState) {
      ga.pushPath(transition.reply)
      ga.visitor.event("States",ga.from, undefined, undefined, {ni: 1});
      event.ga.timeEnd('States',ga.from);
    }
    else{
      event.ga.timeRemove('States',ga.from);
    }
  });

  skill.onBeforeReplySent((event,reply) => {
    event.ga.logPath(event);
    event.ga.timeEnd('Interaction','Request');
    return send(event);
  });

  function send(event) {
    if (_.includes(pluginConfig.ignoreUsers, event.user.userId)) return null;
    return new Promise( function(resolve){
      event.ga.visitor.send(function(err,cnt){
        if(err) {
           console.error('Failed to send analytics')
           console.error(err.stack || err);
           return resolve(); //Analytics errors shouldn't tank the whole process
        }
        return resolve();
      })
    })
  }


  return;
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
    if (_.includes(pluginConfig.ignoreUsers, alexaEvent.user.userId)) return null;

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
