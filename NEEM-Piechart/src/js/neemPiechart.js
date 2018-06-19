const pieHandler = require('./piechartHandler');
const $rdf =  window.$rdf || require('rdflib');

let uri = 'http://knowrob.org/kb/knowrob.owl';
let mimeType = 'application/rdf+xml';
let store = $rdf.graph();

let dataset = [
    { name: 'Firearms', total: 8124, percent: 67.9 },
    { name: 'Knives or cutting instruments', total: 1567, percent: 13.1 },
    { name: 'Other weapons', total: 1610, percent: 13.5 },
    { name: 'Hands, fists, feet, etc.', total: 660, percent: 5.5 }
];

function visualizeReasoningVsTaskTimePiechart(pathToOWLFile, treeContainerId, nodeOnClickCallback){
    fetch(pathToOWLFile)
        .then(response => response.text())
        .then(text => {
            $rdf.parse(text, store, uri, mimeType);
            let treeData = createReasoningVsTaskTimeJSONFile();
            //let treeData = JSON.parse(text);
            //pieHandler.displayPiechart(treeData, treeContainerId, nodeOnClickCallback);
            pieHandler.displayPiechart(treeData, treeContainerId, nodeOnClickCallback);
        });
}

function visualizeErrorVsTaskNumPiechart(pathToOWLFile, treeContainerId, nodeOnClickCallback){
    fetch(pathToOWLFile)
        .then(response => response.text())
        .then(text => {
            $rdf.parse(text, store, uri, mimeType);
            let treeData = createErrorVsTaskNumJSONFile();
            //let treeData = JSON.parse(text);
            //pieHandler.displayPiechart(treeData, treeContainerId, nodeOnClickCallback);
            pieHandler.displayPiechart(treeData, treeContainerId, nodeOnClickCallback);
        });
}

function visualizeReasoningVsTaskNumPiechart(pathToOWLFile, treeContainerId, nodeOnClickCallback){
    fetch(pathToOWLFile)
        .then(response => response.text())
        .then(text => {
            $rdf.parse(text, store, uri, mimeType);
            let treeData = createReasoningVsTaskNumJSONFile();
            //let treeData = JSON.parse(text);
            //pieHandler.displayPiechart(treeData, treeContainerId, nodeOnClickCallback);
            pieHandler.displayPiechart(treeData, treeContainerId, nodeOnClickCallback);
        });
}


function createReasoningVsTaskTimeJSONFile(){
    let reasoningTriples = store.statementsMatching(undefined, new $rdf.NamedNode(uri+'#predicate'), undefined);
    let taskTriples = store.statementsMatching(undefined, new $rdf.NamedNode(uri+'#performedInProjection'), undefined);
    let result = [];
    let reasoningObj = {};
    let taskObj = {};

    let reasoningTotalTime = 0;
    let taskTotalTime = 0;

    reasoningTriples.map((triple) => {
        let prologQueryId =  triple.subject.value;
        let prologQueryStartTime = Number(store.statementsMatching(
            new $rdf.NamedNode(prologQueryId), new $rdf.NamedNode(uri+'#startTime'), undefined)[0].object.value.split('_')[1]);
        let prologQueryEndTime = Number(store.statementsMatching(
            new $rdf.NamedNode(prologQueryId), new $rdf.NamedNode(uri+'#endTime'), undefined)[0].object.value.split('_')[1]);

        reasoningTotalTime = reasoningTotalTime + (prologQueryEndTime - prologQueryStartTime);
    });

    taskTriples.map((triple) => {
        let taskId =  triple.subject.value;
        let taskStartTime = Number(store.statementsMatching(
            new $rdf.NamedNode(taskId), new $rdf.NamedNode(uri+'#startTime'), undefined)[0].object.value.split('_')[1]);
        let taskEndTime = Number(store.statementsMatching(
            new $rdf.NamedNode(taskId), new $rdf.NamedNode(uri+'#endTime'), undefined)[0].object.value.split('_')[1]);

        taskTotalTime = taskTotalTime + (taskEndTime - taskStartTime);
    });

    let totalTime = taskTotalTime + reasoningTotalTime;

    reasoningObj['name'] = 'Reasoning Time';
    reasoningObj['total'] = reasoningTotalTime
    reasoningObj['percent'] = reasoningTotalTime/totalTime*100;
    result.push(reasoningObj);

    taskObj['name'] = 'Task Time';
    taskObj['total'] = taskTotalTime;
    taskObj['percent'] = taskTotalTime/totalTime*100;
    result.push(taskObj);

    return result;
}
function createReasoningVsTaskNumJSONFile(){
    let numReasoning = store.statementsMatching(undefined, new $rdf.NamedNode(uri+'#predicate'), undefined).length;
    let numTask = store.statementsMatching(undefined, new $rdf.NamedNode(uri+'#performedInProjection'), undefined).length;
    let total = numReasoning + numTask;
    let result = [];
    let reasoningObj = {};
    let taskObj = {};

    reasoningObj['name'] = 'Reasoning';
    reasoningObj['total'] = numReasoning;
    reasoningObj['percent'] = numReasoning/total*100;
    result.push(reasoningObj);

    taskObj['name'] = 'Task';
    taskObj['total'] = numTask;
    taskObj['percent'] = numTask/total*100;
    result.push(taskObj);

    return result;
}

function createErrorVsTaskNumJSONFile(){
    let numFailure = store.statementsMatching(undefined, new $rdf.NamedNode(uri+'#failure'), undefined).length;
    let numTask = store.statementsMatching(undefined, new $rdf.NamedNode(uri+'#performedInProjection'), undefined).length;
    let total = numTask;
    let result = [];
    let failureObj = {};
    let taskObj = {};

    failureObj['name'] = 'Failed Tasks';
    failureObj['total'] = numFailure;
    failureObj['percent'] = numFailure/total*100;
    result.push(failureObj);

    taskObj['name'] = 'Successful Tasks';
    taskObj['total'] = (numTask-numFailure);
    taskObj['percent'] = (numTask-numFailure)/total*100;
    result.push(taskObj);

    return result;
}

global.neemPiechart = {};
global.neemPiechart.visualizeReasoningVsTaskTimePiechart = visualizeReasoningVsTaskTimePiechart;
global.neemPiechart.visualizeReasoningVsTaskNumPiechart = visualizeReasoningVsTaskNumPiechart;
global.neemPiechart.visualizeErrorVsTaskNumPiechart = visualizeErrorVsTaskNumPiechart;

exports.visualizeReasoningVsTaskTimePiechart = visualizeReasoningVsTaskTimePiechart;
exports.visualizeReasoningVsTaskNumPiechart = visualizeReasoningVsTaskNumPiechart;
exports.visualizeErrorVsTaskNumPiechart = visualizeErrorVsTaskNumPiechart;

