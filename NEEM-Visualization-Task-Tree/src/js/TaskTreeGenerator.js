const constants = require('./Constants');
const LoggedTask = require('./LoggedTask');
let taskDict = {};
let entitiesDict = {}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

exports.generateTaskTree = (triples) => {
    triples.map(x => createEntitiesDict(x));
    Object.keys(entitiesDict).map(entityName => createTaskDict(entityName));

    return transformTaskDictToJson();
};


function createEntitiesDict(triple) {
    let subject = triple.subject.value;
    let predicate = triple.predicate.value;
    let object = triple.object.value;

    if(!entitiesDict.hasOwnProperty(subject)){
        entitiesDict[subject]={};
    }

    if(predicate == constants.URI_TASK_SUB_ACTION){
        if(entitiesDict[subject].hasOwnProperty(predicate)){
            entitiesDict[subject][predicate].push(object);
        }
        else {
            entitiesDict[subject][predicate] = [object];
        }
    }
    else{
        entitiesDict[subject][predicate] = object;
    }
}

function createTaskDict(entityName){
    let propertyDict = entitiesDict[entityName];
    if(propertyDict.hasOwnProperty(constants.URI_START_TIME)){
        taskDict[entityName] = propertyDict;
    }
}

function getStartNodes(){
    let startNodeList = []

    Object.keys(taskDict).map((potentialStartNodeName) => {
        let isSubAction = false;
        let nodeNameList = Object.keys(taskDict);

        for (let i = 0; i < nodeNameList.length; i++){
            let nodeName = nodeNameList[i];
            if(taskDict[nodeName].hasOwnProperty(constants.URI_TASK_SUB_ACTION)
                && (taskDict[nodeName][constants.URI_TASK_SUB_ACTION].indexOf(potentialStartNodeName) > -1)){
                isSubAction = true;
                break;
            }
        }

        if(!isSubAction){
            startNodeList.push(new LoggedTask.LoggedTask(potentialStartNodeName,taskDict[potentialStartNodeName]));
        }
    });

    //TODO sort list by previous and next action
    return startNodeList;
}

function traverseTaskTree(loggedTask){
    let firstAction = '';
    let actionList = [];
    let childrenList = [];

    if(loggedTask.subActionList.length == 0){
        let action = {}
        action['name'] = loggedTask.loggedTaskUri.split('#')[1];
        action['successful'] = loggedTask.taskSuccess.capitalize();
        action['startTime'] = loggedTask.startTime.toString();
        action['endTime'] = loggedTask.endTime.toString();

        return action;
    }

    for(let i = 0; i < loggedTask.subActionList.length; i++){
        //find the the task which doesnt have a previous task
        if(!taskDict[loggedTask.subActionList[i]].hasOwnProperty(constants.URI_TASK_PREVIOUS_ACTION)){
            firstAction = loggedTask.subActionList[i];
            break;
        }
    }

    actionList.push(firstAction);
    let tempAction = firstAction;

    while (tempAction){
        if(taskDict[tempAction].hasOwnProperty(constants.URI_TASK_NEXT_ACTION)){
            actionList.push(taskDict[tempAction][constants.URI_TASK_NEXT_ACTION]);
            tempAction = taskDict[tempAction][constants.URI_TASK_NEXT_ACTION];
        }
        else{
            tempAction = null;
        }
    }
    actionList.map((action) => {
        let childLoggedTask = new LoggedTask.LoggedTask(action, taskDict[action]);
        childrenList.push(traverseTaskTree(childLoggedTask));
    });

    let action = {};
    action['name'] = loggedTask.loggedTaskUri.split('#')[1];
    action['_children'] = childrenList;
    action['successful'] = loggedTask.taskSuccess.capitalize();
    action['startTime'] = loggedTask.startTime.toString();
    action['endTime'] = loggedTask.endTime.toString();

    return action;
}

function transformTaskDictToJson(){
    let startNodeList = getStartNodes();
    let childrenList = [];

    startNodeList.map((startNode) => {
        childrenList.push(traverseTaskTree(startNode));
    });

    let experimentNode = {};
    experimentNode['name'] = 'Experiment';
    experimentNode['_children'] = childrenList;
    experimentNode['successful'] = 'True';

    return experimentNode;
}


