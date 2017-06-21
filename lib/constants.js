module.exports = {
  TOPIC_PREFIX: "wfm",
  SYNC_TOPIC_PREFIX: "wfm:sync",
  ERROR_PREFIX: "error",
  DONE_PREFIX: "done",
  TOPICS: {
    CREATE: "create",
    UPDATE: "update",
    LIST: "list",
    REMOVE: "remove",
    READ: "read",
    START: "start",
    STOP: "stop"
  },
  SYNC_TOPICS:{
    DATA:{
      REMOTE_UPDATE_APPLIED: "remote_update_applied",
      REMOTE_UPDATE_FAILED: "remote_update_failed"
    },
    SYNC_COMPLETE: "sync_complete",
    FORCE_SYNC: "force_sync"
  }
};