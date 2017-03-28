'use strict';

const _ = require('lodash');
const universalAnalytics = require('./universal-analytics-wrapper');
const debug = require('debug')('voxa:opearlo');
const detect = require('./detect');
//const EventRider = require('./EventRider');

const defaultConfig = {
  ignoreUsers: [],
  debug: false,
  appName: detect.appName(),
  appVersion: detect.appVersion()
};


/* A rider that allows logging events
/* Send at the end of each request
 *
 * How would we log intents?
 * How would we log states?
 */


class GoogleAnalyticsEventRider {
  constructor(alexaEvent, config) {
    this.alexaEvent = alexaEvent;
    this.config = config;
    this.params = {};
    this.path = [];
    this.visitor = universalAnalytics(config.trackingId, alexaEvent.user.userId, {debug: config.debug, strictCidFormat: false});
  }

  ignore() {
    this.ignoreState = true;
  }

  startSession() {
    this.params.sc = 'start'
  }

  endSession() {
    this.params.sc = 'end'
  }

  state(name) {
    this.path.push(name);
  }

  recordTranstion(trans) {
    this.path.push(trans);
  }

  intent(name, event) {
    if(!name) throw new Error('Name is required')
    this.intent = name;
  }

  logPath() {
    if(!this.path.length >= 0) throw new Error(`Expected something in the path`)
    let name = _(this.path).map(t => t.reply).compact().value().join('; ');

    this.visitor.screenview(name, this.config.appName, this.config.appVersion, null, null ,this.params);
    this.params = {};
  }

}

function register(skill, config) {
  if(!config.trackingId) throw new Error('trackingId is required in the config file');
  const pluginConfig = _.merge({}, defaultConfig, config);

  skill.onRequestStarted(event => {
    console.log('Request started. Attaching event')
    event.ga = new GoogleAnalyticsEventRider(event,pluginConfig);
  })

  skill.onSessionStarted(event => {
    event.ga.startSession();
  });

  skill.onSessionEnded(event => {
    event.ga.endSession();
  });

  skill.onIntentRequest(event => {
    // TODO: How to get the intent slots in there?
    // TODO: Do we want to try and work the from state in?
    event.ga.intent(event.intent.name,event)
  });

  skill.onBeforeStateChanged((event, reply, state) => {
    //event.ga.state = state.name;
    //if(!event.ga.path.length) event.ga.state(state.name)
    //event.ga.ignoreState = state.name === 'entry'; // The entry state is at the start of every request, so it's really not interesting to know anything about;
  });

  skill.onAfterStateChanged((alexaEvent, reply, transition) => {
    let ga = alexaEvent.ga;
    if(!ga.ignoreState) ga.recordTranstion(transition)
  });

  skill.onBeforeReplySent((event,reply) => {
    event.ga.logPath(event);

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
  });


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
