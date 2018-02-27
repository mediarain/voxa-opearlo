'use strict';

const chai = require('chai');
const OpearloAnalytics = require('opearlo-analytics');

const simple = require('simple-mock');

const expect = chai.expect;
const Voxa = require('voxa');
const voxaOpearlo = require('../lib/Voxa-Opearlo');
const views = require('./views');

describe('Voxa-Opearlo plugin', () => {
  let voxaApp;
  let alexaSkill;
  const opearloConfig = {
    userId: 'userId',
    appName: 'appName',
    apiKey: 'apiKey',
  };

  beforeEach(() => {
    voxaApp = new Voxa.VoxaApp({ views });
    alexaSkill = new Voxa.AlexaPlatform(voxaApp);
    simple.mock(OpearloAnalytics, 'recordAnalytics').callbackWith('MOCK TRACKED');
    simple.mock(OpearloAnalytics, 'registerVoiceEvent').returnWith('MOCK TRACKED');
  });

  afterEach(() => {
    simple.restore();
  });

  it('should register Opearlo analytics on LaunchRequest', () => {
    const spy = simple.spy(() => ({ tell: 'LaunchIntent.OpenResponse', to: 'entry' }));
    alexaSkill.onIntent('LaunchIntent', spy);

    const event = {
      request: {
        locale: 'en-us',
        type: 'LaunchRequest',
      },
      session: {
        new: true,
        application: {
          applicationId: 'appId',
        },
        user: {
          userId: 'user-id',
        },
      },
    };

    voxaOpearlo(voxaApp, opearloConfig);
    return alexaSkill.execute(event)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(reply.sessionAttributes.state).to.equal('entry');
        expect(reply.response.outputSpeech.ssml).to.include('Hello! How are you?');
        expect(OpearloAnalytics.registerVoiceEvent.called).to.be.true;
        expect(OpearloAnalytics.registerVoiceEvent.calls[0].args[0]).to.equal('user-id');
        expect(OpearloAnalytics.registerVoiceEvent.calls[0].args[1]).to.equal('IntentRequest');
      });
  });

  it('should register state information', () => {
    const spy = simple.spy(() => ({ tell: 'LaunchIntent.OpenResponse', to: 'entry' }));
    alexaSkill.onIntent('LaunchIntent', spy);

    const event = {
      request: {
        type: 'LaunchRequest',
      },
      session: {
        new: true,
        application: {
          applicationId: 'appId',
        },
        user: {
          userId: 'user-id',
        },
      },
    };

    voxaOpearlo(voxaApp, opearloConfig);
    return alexaSkill.execute(event)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(reply.sessionAttributes.state).to.equal('entry');
        expect(reply.response.outputSpeech.ssml).to.include('Hello! How are you?');
        expect(OpearloAnalytics.registerVoiceEvent.called).to.be.true;
        expect(OpearloAnalytics.registerVoiceEvent.calls[1].args[0]).to.equal('user-id');
        expect(OpearloAnalytics.registerVoiceEvent.calls[1].args[1]).to.equal('Custom');
        expect(OpearloAnalytics.registerVoiceEvent.calls[1].args[2]).to.equal('LaunchIntent');
      });
  });

  it('should register states that don\'t have a reply', () => {
    const spy = simple.spy(() => ({ to: 'die' }));
    alexaSkill.onIntent('LaunchIntent', spy);

    const event = {
      request: {
        type: 'LaunchRequest',
      },
      session: {
        new: true,
        application: {
          applicationId: 'appId',
        },
        user: {
          userId: 'user-id',
        },
      },
    };

    voxaOpearlo(voxaApp, opearloConfig);
    return alexaSkill.execute(event)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(OpearloAnalytics.registerVoiceEvent.called).to.be.true;
        expect(OpearloAnalytics.registerVoiceEvent.calls[1].args[0]).to.equal('user-id');
        expect(OpearloAnalytics.registerVoiceEvent.calls[1].args[1]).to.equal('Custom');
        expect(OpearloAnalytics.registerVoiceEvent.calls[1].args[2]).to.equal('LaunchIntent');
        expect(OpearloAnalytics.registerVoiceEvent.calls[1].args[3].reply).to.be.undefined;
      });
  });

  it('should register Opearlo analytics on IntentRequest', () => {
    const spy = simple.spy(() => ({ ask: 'Question.Ask', to: 'entry' }));
    alexaSkill.onIntent('SomeIntent', spy);

    const event = {
      request: {
        type: 'IntentRequest',
        intent: {
          name: 'SomeIntent',
        },
      },
      session: {
        new: false,
        application: {
          applicationId: 'appId',
        },
        user: {
          userId: 'user-id',
        },
      },
    };

    voxaOpearlo(voxaApp, opearloConfig);
    return alexaSkill.execute(event)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(reply.sessionAttributes.state).to.equal('entry');
        expect(reply.response.outputSpeech.ssml).to.include('What time is it?');
      });
  });

  it('should register Opearlo analytics on IntentRequest and end the session', () => {
    const spy = simple.spy(() => ({ tell: 'ExitIntent.GeneralExit', to: 'die' }));
    alexaSkill.onIntent('ExitIntent', spy);

    const event = {
      request: {
        type: 'IntentRequest',
        intent: {
          name: 'ExitIntent',
        },
      },
      session: {
        new: false,
        application: {
          applicationId: 'appId',
        },
        user: {
          userId: 'user-id',
        },
      },
    };

    voxaOpearlo(voxaApp, opearloConfig);
    return alexaSkill.execute(event)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(reply.sessionAttributes.state).to.equal('die');
        expect(reply.response.outputSpeech.ssml).to.include('Ok. Goodbye.');
      });
  });

  it('should not register Opearlo analytics on IntentRequest with an invalid state', () => {
    const spy = simple.spy(() => ({ tell: 'ExitIntent.GeneralExit', to: 'die' }));
    alexaSkill.onState('ExitIntent', spy);

    const event = {
      request: {
        type: 'IntentRequest',
        intent: {
          name: 'ExitIntent',
        },
      },
      session: {
        new: false,
        application: {
          applicationId: 'appId',
        },
        user: {
          userId: 'user-id',
        },
      },
    };

    voxaOpearlo(voxaApp, opearloConfig);
    return alexaSkill.execute(event)
      .then((reply) => {
        expect(spy.called).to.be.false;
        expect(reply.response.outputSpeech.ssml).to.include('An unrecoverable error occurred.');
      });
  });


  it('should register Opearlo analytics on SessionEndedRequest', () => {
    const spy = simple.spy(() => ({ tell: 'ExitIntent.GeneralExit' }));
    voxaApp.onSessionEnded(spy);

    const event = {
      request: {
        type: 'SessionEndedRequest',
      },
      session: {
        new: false,
        application: {
          applicationId: 'appId',
        },
        user: {
          userId: 'user-id',
        },
      },
    };

    voxaOpearlo(voxaApp, opearloConfig);
    return alexaSkill.execute(event)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(reply.version).to.equal('1.0');
        expect(OpearloAnalytics.recordAnalytics.called).to.be.true;
      });
  });

  it('should register Opearlo analytics on unexpected error', () => {
    const intentSpy = simple.spy(() => {
      throw new Error('random error');
    });
    alexaSkill.onIntent('ErrorIntent', intentSpy);

    const spy = simple.spy((event, err, reply) => {
      reply.clear();
      reply.addStatement('Error: random error');
      return reply;
    });

    voxaApp.onError(spy);

    const event = {
      request: {
        locale: 'en-us',
        type: 'IntentRequest',
        intent: {
          name: 'ErrorIntent',
        },
      },
      session: {
        new: false,
        application: {
          applicationId: 'appId',
        },
        user: {
          userId: 'user-id',
        },
      },
    };

    voxaOpearlo(voxaApp, opearloConfig);
    return alexaSkill.execute(event)
      .then((reply) => {
        expect(spy.called).to.be.true;
      });
  });

  it('should not record analytics if the user is ignored', () => {
    const spy = simple.spy(() => ({ tell: 'ExitIntent.GeneralExit' }));
    voxaApp.onSessionEnded(spy);

    const event = {
      request: {
        type: 'SessionEndedRequest',
      },
      session: {
        new: false,
        application: {
          applicationId: 'appId',
        },
        user: {
          userId: 'user-id',
        },
      },
    };

    voxaOpearlo(voxaApp, Object.assign({ ignoreUsers: ['user-id'] }, opearloConfig));
    return alexaSkill.execute(event)
      .then((reply) => {
        expect(OpearloAnalytics.recordAnalytics.called).to.not.be.true;
      });
  });

  it('should record sessions terminated due to errors as an error', () => {
    const spy = simple.spy(() => ({ tell: 'ExitIntent.GeneralExit' }));
    voxaApp.onSessionEnded(spy);

    const event = {
      request: {
        type: 'SessionEndedRequest',
        reason: 'ERROR',
        error: {
          message: 'my message'
        }
      },
      session: {
        new: false,
        application: {
          applicationId: 'appId',
        },
        user: {
          userId: 'user-id',
        },
      },
    };

    voxaOpearlo(voxaApp, Object.assign({ ignoreUsers: ['user-id'] }, opearloConfig));
    return alexaSkill.execute(event)
      .then((reply) => {
        expect(OpearloAnalytics.registerVoiceEvent.lastCall.args[2]).to.equal('Error');
      });
  });
});
