const Timepoint = require('./Timepoint');
const Constants = require('./Constants');

class LoggedTask {
    constructor(loggedTaskUri, propertyDict) {
        this.loggedTaskUri = loggedTaskUri;
        this.startTime = new Timepoint.Timepoint(propertyDict[Constants.URI_START_TIME]);
        this.endTime = new Timepoint.Timepoint(propertyDict[Constants.URI_END_TIME]);
        this.taskSuccess = propertyDict[Constants.URI_TASK_SUCCESS] || 'True';
        this.taskContext = propertyDict[Constants.URI_TASK_CONTEXT];
        this.previousAction = propertyDict[Constants.URI_TASK_PREVIOUS_ACTION];
        this.nextAction = propertyDict[Constants.URI_TASK_NEXT_ACTION];
        this.subActionList = propertyDict[Constants.URI_TASK_SUB_ACTION] || [];
    }
}

exports.LoggedTask = LoggedTask;

