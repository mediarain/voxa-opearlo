'use strict';

const views = (function views() {
  return {
    Intent: {
      Launch: {
        ask: 'Welcome! Ask me for help.',
        reprompt: 'Just say: help me',
      },
      EasterEgg: {
        tell: 'Boo!'
      },

      Help: {
        tell: 'This is an example for Opearlo analytics integration.',
      },
    },
  };
}());
module.exports = views;
