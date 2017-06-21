var CONSTANTS = require('../../constants');


/**
 *
 * Creating a subscriber to the update topic for a single data set.
 *
 * @param {Mediator} syncDatasetTopics         - The mediator used for subscriptions.
 * @param {DataManager} datasetManager   - The individual data set manager. This is where the business logic exists for
 * @returns {Subscription} - The subscription for the update topic
 */
module.exports = function subscribeToUpdateTopic(syncDatasetTopics, datasetManager) {

  /**
   *
   * Handling the update topic for this dataset.
   *
   * @param parameters
   * @param parameters.topicUid     - (Optional)  A unique ID to be used to publish completion / error topics.
   * @param parameters.itemToUpdate - The Dataset Item To Update
   */
  return function handleUpdateTopic(parameters) {
    var self = this;
    parameters = parameters || {};

    var datasetItemToUpdate = parameters.itemToUpdate;

    // remove _syncStatus, it can cause sync loop when updated and this data is irrelevant outside client
    delete datasetItemToUpdate._syncStatus;

    //Creating the item in the sync store
    datasetManager.update(datasetItemToUpdate).then(function(updatedDataSetItem) {
      var creatDoneTopic = syncDatasetTopics.getTopic(CONSTANTS.TOPICS.UPDATE, CONSTANTS.DONE_PREFIX, parameters.topicUid);

      self.mediator.publish(creatDoneTopic, updatedDataSetItem);

    }).catch(function(error) {

      var errorCreateTopic = syncDatasetTopics.getTopic(CONSTANTS.TOPICS.UPDATE, CONSTANTS.ERROR_PREFIX, parameters.topicUid);

      self.mediator.publish(errorCreateTopic, error);
    });
  };
};