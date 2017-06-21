'use strict';

var mediator = require('../mediator');

angular.module('wfm.core.mediator', ['ng'])

.factory('mediator', function mediatorService($q) {
  var originalRequest = mediator.request;

  // monkey patch the request function, wrapping the returned promise as an angular promise
  mediator.request = function() {
    var promise = originalRequest.apply(mediator, arguments);
    return $q.when(promise);
  };

  mediator.subscribeForScope = function(topic,scope,fn) {
    var subscriber = mediator.subscribe(topic,fn);
    scope.$on("$destroy", function() {
      mediator.remove(topic, subscriber.id);
    });

  };

  return mediator;
});

module.exports = 'wfm.core.mediator';
