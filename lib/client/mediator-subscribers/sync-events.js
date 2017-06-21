  /**
 * Initialsing a subscriber for sync events.
 */

module.exports = function syncEventSubscriber(datasetManager) {

  /**
   * Handling the sync events
   *
   * @param {object} parameters
   */
  return function handleSyncEventTopics(parameters) {
    if (parameters && parameters.uid && parameters.message) {
      datasetManager.addEvent(parameters);
    }
  };
};
