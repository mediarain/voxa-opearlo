'use strict';

const chai = require('chai');
const OpearloAnalytics = require('opearlo-analytics');

const simple = require('simple-mock');

const expect = chai.expect;
const EventRider = require('../lib/EventRider');

describe('EventRider', () => {
  const opearloConfig = {
    userId: 'userId',
    appName: 'appName',
    apiKey: 'apiKey',
  };

  beforeEach(() => {
    simple.mock(OpearloAnalytics, 'recordAnalytics').callbackWith('MOCK TRACKED');
    simple.mock(OpearloAnalytics, 'registerVoiceEvent').returnWith('MOCK TRACKED');
  });

  afterEach(function(){
    simple.restore();
  })

  it('should ignore the entry state', () => {
    let sut = new EventRider({},{name: 'entry'});
    expect(sut.ignoreState).to.be.true;
  });

  it('should not ignore other states', () => {
    let sut = new EventRider({},{name: 'goodie'});
    expect(sut.ignoreState).to.be.false;
  });

  it('ignore method means we ignore things', () => {
    let sut = new EventRider({},{name: 'blah'});
    expect(sut.ignoreState).to.be.false;
    sut.ignore();
    expect(sut.ignoreState).to.be.true;
  });

  it('remember the state name', () => {
    let sut = new EventRider({},{name: 'goodie'});
    expect(sut.name).to.equal('goodie')
    });

  describe('log',() =>{
    it('write a custom event', () => {
      let sut = new EventRider({user: {userId: 'myId'}},{name: 'goodie'});
      sut.log('blah',{meat: 'yummy'})
      expect(OpearloAnalytics.registerVoiceEvent.called).to.be.true;
      expect(OpearloAnalytics.registerVoiceEvent.lastCall.args[2]).to.equal('blah');
      expect(OpearloAnalytics.registerVoiceEvent.lastCall.args[3].meat).to.equal('yummy');
    });

    it('write a custom event with no variables', () => {
      let sut = new EventRider({user: {userId: 'myId'}},{name: 'goodie'});
      sut.log('blah')
      expect(OpearloAnalytics.registerVoiceEvent.called).to.be.true;
      expect(OpearloAnalytics.registerVoiceEvent.lastCall.args[2]).to.equal('blah');
    });
  })
});
