'use strict'

/* Universal analytics is missing the screenview functionality in it's app. This extnds it with that capacility
 */
const universalAnalytics = require('universal-analytics');

module.exports = function(){
  let ua = universalAnalytics.apply(universalAnalytics,arguments);
  ua.screenview = screenview.bind(ua);
  return ua;
}

function screenview(screenName, appName, appVersion, appId, appInstallerId, params, fn) {

  console.log('Pre',arguments)

 if (typeof screenName === 'object' && screenName != null) {
     params = screenName;
     if (typeof appName === 'function') {
         fn = appName
     }
     screenName = appName = appVersion = appId = appInstallerId = null;
 } else if (typeof appName === 'function') {
     fn = appName
     appName = appVersion = appId = appInstallerId = null;
 } else if (typeof appVersion === 'function') {
     fn = appVersion;
     appVersion = appId = appInstallerId = null;
 } else if (typeof appId === 'function') {
     fn = appId;
     appId = appInstallerId = null;
 } else if (typeof appInstallerId === 'function') {
     fn = appInstallerId;
     appInstallerId = null;
 } else if (typeof params === 'function') {
     fn = params;
     params = null;
 }

 params = Object.assign({}, params);

 params.cd = screenName || params.cd || this._context.cd;
 params.an = appName || params.an || this._context.an;
 params.av = appVersion || params.av || this._context.av;
 params.aid = appId || params.aid || this._context.aid;
 params.aiid = appInstallerId || params.aiid || this._context.aiid;

 this._tidyParameters(params);

 console.log('Post',params)

 if (!params.cd) {
     return this._handleError("Please provide a screen name (cd)", fn);
 }
 if (!params.an) {
     return this._handleError("Please provide an app name (an)", fn);
 }

 return this._withContext(params)._enqueue("screenview", params, fn);
}
