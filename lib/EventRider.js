'use strict';

const OpearloAnalytics = require('opearlo-analytics');

module.exports = class VoxaOpearloEventRider {
  constructor(event, state) {
    this.name = state.name;
    this.alexaEvent = event;
    this.variables = {};
    this.ignoreState = this.name === 'entry'; // The entry state is at the start of every request, so it's really not interesting to know anything about;
  }

  ignore() {
    this.ignoreState = true;
  }

  log(eventName, variables) {
    OpearloAnalytics.registerVoiceEvent(this.alexaEvent.user.userId, 'Custom', eventName, variables || {});
  }

};
