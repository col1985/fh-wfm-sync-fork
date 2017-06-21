var mediator = require("fh-wfm-mediator/lib/mediator");
var sinon = require('sinon');
require("sinon-as-promised");
var chai = require('chai');
var _ = require('lodash');
var q = require('q');
var expect = chai.expect;
var shortid = require('shortid');
var MediatorTopicUtility = require('fh-wfm-mediator/lib/topics');
var CONSTANTS = require('../../constants');


describe("Sync Read Mediator Topic", function() {
  var readTopic = "wfm:sync:mockdatasetid:read";

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
    var doneTopic = "done:wfm:sync:mockdatasetid:read";
    var mockMetaData = {};
    var mockDatasetManager = {
      datasetId: "mockdatasetid",
      read: sinon.stub().resolves(mockDataItem),
      getMetaData: sinon.stub().callsArgWith(0, mockMetaData)
    };

    function checkMocks(readResult) {
      expect(readResult).to.deep.equal(mockDataItem);

      sinon.assert.calledOnce(mockDatasetManager.read);
      sinon.assert.calledWith(mockDatasetManager.read, sinon.match(mockDataItem.id));
    }


    beforeEach(function() {
      mockDatasetManager.read.reset();
      syncSubscribers.on(CONSTANTS.TOPICS.READ, require('./read')(syncSubscribers, mockDatasetManager));
    });

    it("should handle no unique topic id", function() {
      var testDeferred = q.defer();

      this.subscribers[doneTopic] = mediator.subscribe(doneTopic, testDeferred.resolve);

      mediator.publish(readTopic, {
        id: mockDataItem.id
      });

      return testDeferred.promise.then(checkMocks);
    });

    it("should handle a unique topic id", function() {
      var testDeferred = q.defer();

      var topicUid = shortid.generate();
      var expectedDoneTopic = doneTopic + ":" + topicUid;

      this.subscribers[doneTopic] = mediator.subscribe(expectedDoneTopic, testDeferred.resolve);

      mediator.publish(readTopic, {
        id: mockDataItem.id,
        topicUid: topicUid
      });

      return testDeferred.promise.then(checkMocks);
    });

  });


  describe("Error", function() {
    var expectedTopicError = new Error("SYNC-Error-Code : Sync Error Message");
    var errorTopic = "error:wfm:sync:mockdatasetid:read";
    var mockMetaData = {};

    function checkMocks(topicError) {
      expect(topicError).to.deep.equal(expectedTopicError);

      sinon.assert.calledOnce(mockDatasetManager.read);
      sinon.assert.calledWith(mockDatasetManager.read, sinon.match(mockDataItem.id));
    }

    var mockDatasetManager = {
      datasetId: "mockdatasetid",
      read: sinon.stub().rejects(expectedTopicError),
      getMetaData: sinon.stub().callsArgWith(0, mockMetaData)
    };

    beforeEach(function() {
      mockDatasetManager.read.reset();
      syncSubscribers.on(CONSTANTS.TOPICS.READ, require('./read')(syncSubscribers, mockDatasetManager));
    });

    it("should handle no unique topic id", function() {
      var testDeferred = q.defer();

      this.subscribers[errorTopic] = mediator.subscribe(errorTopic, testDeferred.resolve);

      mediator.publish(readTopic, {
        id: mockDataItem.id
      });

      return testDeferred.promise.then(checkMocks);
    });

    it("should handle a unique topic id", function() {
      var testDeferred = q.defer();

      var topicUid = shortid.generate();
      var expectedErrorTopic = errorTopic + ":" + topicUid;

      this.subscribers[errorTopic] = mediator.subscribe(expectedErrorTopic, testDeferred.resolve);

      mediator.publish(readTopic, {
        id: mockDataItem.id,
        topicUid: topicUid
      });

      return testDeferred.promise.then(checkMocks);
    });

  });

  describe("Sync Event", function() {
    var doneTopic = "done:wfm:sync:mockdatasetid:read";
    var mockMetaData = {
      syncEvents: {
        mockdataitemid: {
          entityId: "mockdataitemid",
          code: "mockEventCode",
          action: "mockEventAction",
          message: "mockEventMessage",
          type: "mockEventType",
          ts: sinon.match.number
        }
      }
    };
    var mockDatasetManager;

    it("should add a sync status to the item read if there is any available", function() {
      var testReadResultWithEvents = {
        id: mockDataItem.id,
        name: mockDataItem.name,
        _syncStatus: mockMetaData.syncEvents[mockDataItem.id]
      };

      mockDatasetManager = {
        datasetId: "mockdatasetid",
        read: sinon.stub().resolves(mockDataItem),
        getMetaData: sinon.stub().callsArgWith(0, mockMetaData)
      };
      mockDatasetManager.read.reset();
      syncSubscribers.on(CONSTANTS.TOPICS.READ, require('./read')(syncSubscribers, mockDatasetManager));

      var testDeferred = q.defer();

      this.subscribers[doneTopic] = mediator.subscribe(doneTopic, testDeferred.resolve);

      mediator.publish(readTopic, {
        id: mockDataItem.id
      });

      return testDeferred.promise.then(function(readResult) {
        sinon.assert.calledOnce(mockDatasetManager.read);
        sinon.assert.calledOnce(mockDatasetManager.getMetaData);

        sinon.assert.calledWith(mockDatasetManager.getMetaData, sinon.match.func);
        sinon.assert.calledWith(mockDatasetManager.read, sinon.match(mockDataItem.id));

        expect(readResult).to.deep.equal(testReadResultWithEvents);
      });
    });

    it("should not add a sync status to the item read if no sync events exist for that item", function() {
      var mockDataItemNoEvents = {
        id: "mockDataItemNoEvents",
        name: "This is a mock data item with no sync events"
      };

      var testReadResultNoEvents = {
        id: mockDataItemNoEvents.id,
        name: mockDataItemNoEvents.name,
        _syncStatus: mockMetaData.syncEvents[mockDataItemNoEvents.id]
      };

      mockDatasetManager = {
        datasetId: "mockdatasetid",
        read: sinon.stub().resolves(mockDataItemNoEvents),
        getMetaData: sinon.stub().callsArgWith(0, mockMetaData)
      };

      mockDatasetManager.read.reset();
      syncSubscribers.on(CONSTANTS.TOPICS.READ, require('./read')(syncSubscribers, mockDatasetManager));

      var testDeferred = q.defer();

      this.subscribers[doneTopic] = mediator.subscribe(doneTopic, testDeferred.resolve);

      mediator.publish(readTopic, {
        id: mockDataItemNoEvents.id
      });

      return testDeferred.promise.then(function(readResult) {
        sinon.assert.calledOnce(mockDatasetManager.read);
        sinon.assert.calledOnce(mockDatasetManager.getMetaData);

        sinon.assert.calledWith(mockDatasetManager.getMetaData, sinon.match.func);
        sinon.assert.calledWith(mockDatasetManager.read, sinon.match(mockDataItemNoEvents.id));

        expect(readResult).to.deep.equal(testReadResultNoEvents);
      });
    });
  });

});