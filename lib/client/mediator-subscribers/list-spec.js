var mediator = require("fh-wfm-mediator/lib/mediator");
var sinon = require('sinon');
require("sinon-as-promised");
var chai = require('chai');
var expect = chai.expect;
var _ = require('lodash');
var q = require('q');
var shortid = require('shortid');
var MediatorTopicUtility = require('fh-wfm-mediator/lib/topics');
var CONSTANTS = require('../../constants');


describe("Sync List Mediator Topic", function() {
  var listTopic = "wfm:sync:mockdatasetid:list";
  var mockDataItem = {
    id: "mockdataitemid",
    name: "This is a mock data item"
  };

  var mockDatasetId = "mockdatasetid";

  var syncSubscribers = new MediatorTopicUtility(mediator);
  syncSubscribers.prefix(CONSTANTS.SYNC_TOPIC_PREFIX).entity(mockDatasetId);

  beforeEach(function() {
    this.subscribers = {};
  });

  afterEach(function() {
    _.each(this.subscribers, function(subscriber, topic) {
      mediator.remove(topic, subscriber.id);
    });

    syncSubscribers.unsubscribeAll();
  });

  describe("No Error", function() {

    var doneTopic = "done:wfm:sync:mockdatasetid:list";
    var arrayOfDataItems = [mockDataItem];
    var mockMetaData = {
      syncEvents: {
        mockdataitemid: {
          message: 'mock message'
        }
      }
    };
    var mockDatasetManager = {
      datasetId: mockDatasetId,
      list: sinon.stub().resolves(arrayOfDataItems),
      getMetaData: sinon.stub().callsArgWith(0, mockMetaData)
    };

    function checkMocks(listResult) {
      expect(listResult).to.deep.equal(arrayOfDataItems);

      sinon.assert.calledOnce(mockDatasetManager.list);
    }

    beforeEach(function() {
      mockDatasetManager.list.reset();
      syncSubscribers.on(CONSTANTS.TOPICS.LIST, require('./list')(syncSubscribers, mockDatasetManager));
    });

    it("should handle no unique topic id", function() {
      var testDeferred = q.defer();

      this.subscribers[doneTopic] = mediator.subscribe(doneTopic, testDeferred.resolve);

      mediator.publish(listTopic);

      return testDeferred.promise.then(checkMocks);
    });

    it("should handle a unique topic id", function() {
      var testDeferred = q.defer();

      var topicUid = shortid.generate();

      var expectedDoneTopic = doneTopic + ":" + topicUid;

      this.subscribers[doneTopic] = mediator.subscribe(expectedDoneTopic, testDeferred.resolve);

      mediator.publish(listTopic, {
        topicUid: topicUid
      });

      return testDeferred.promise.then(checkMocks);
    });

    describe("Sync Status", function() {

      it("Should return list with ._syncStatus", function() {
        var testDeferred = q.defer();

        this.subscribers[doneTopic] = mediator.subscribe(doneTopic, testDeferred.resolve);

        mediator.publish(listTopic);


        return testDeferred.promise.then(function(data) {
          expect(data).to.be.an('array');
          expect(data[0].id).to.equal(mockDataItem.id);
          expect(data[0]._syncStatus).to.deep.equal(mockMetaData.syncEvents.mockdataitemid);
        });


      });
    });

  });


  describe("Error", function() {

    var expectedTopicError = new Error("SYNC-Error-Code : Sync Error Message");
    var errorTopic = "error:wfm:sync:mockdatasetid:list";

    var mockMetaData = {
      syncEvents: {
        mockSyncEv1: {}
      }
    };

    var mockDatasetManager = {
      datasetId: mockDatasetId,
      list: sinon.stub().rejects(expectedTopicError),
      getMetaData: sinon.stub().callsArgOnWith(0, mockMetaData)
    };

    beforeEach(function() {
      mockDatasetManager.list.reset();
      syncSubscribers.on(CONSTANTS.TOPICS.LIST, require('./list')(syncSubscribers, mockDatasetManager));
    });

    function checkMocks(topicError) {
      expect(topicError).to.deep.equal(expectedTopicError);

      sinon.assert.calledOnce(mockDatasetManager.list);
    }

    it("should handle no unique topic id", function() {
      var testDeferred = q.defer();
      this.subscribers[errorTopic] = mediator.subscribe(errorTopic, testDeferred.resolve);

      mediator.publish(listTopic);

      return testDeferred.promise.then(checkMocks);
    });

    it("should handle a unique topic id", function() {
      var testDeferred = q.defer();

      var topicUid = shortid;
      var expectedErrorTopic = errorTopic + ":" + topicUid;

      this.subscribers[errorTopic] = mediator.subscribe(expectedErrorTopic, testDeferred.resolve);

      mediator.publish(listTopic, {
        topicUid: topicUid
      });

      return testDeferred.promise.then(checkMocks);
    });

  });

});