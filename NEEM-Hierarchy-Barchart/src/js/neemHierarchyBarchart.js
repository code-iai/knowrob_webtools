const barHandler = require('./barchartHandler');
const barchartGenerator = require('./barchartGenerator');
const $rdf =  window.$rdf || require('rdflib');

let uri = 'http://knowrob.org/kb/knowrob.owl';
let mimeType = 'application/rdf+xml';
let store = $rdf.graph();

function visualizeBarchart(pathToOWLFile, treeContainerId, nodeOnClickCallback){
    fetch(pathToOWLFile)
        .then(response => response.text())
        .then(text => {
            $rdf.parse(text, store, uri, mimeType);
            let treeData = 'test';
            //let treeData = JSON.parse(text);
            barHandler.displayBarchart(treeData, treeContainerId, nodeOnClickCallback);
        });
}

function visualizeTaskTimeBarchart(pathToOWLFile, treeContainerId, nodeOnClickCallback){
    fetch(pathToOWLFile)
        .then(response => response.text())
        .then(text => {
            $rdf.parse(text, store, uri, mimeType);
            let treeData = createTaskTimeJSONFile();
            //let treeData = JSON.parse(text);
            barHandler.displayBarchart(treeData, treeContainerId, nodeOnClickCallback);
        });
}


function visualizeTaskNumBarchart(pathToOWLFile, treeContainerId, nodeOnClickCallback){
    fetch(pathToOWLFile)
        .then(response => response.text())
        .then(text => {
            $rdf.parse(text, store, uri, mimeType);
            let treeData = createTaskNumJSONFile();
            //let treeData = JSON.parse(text);
            barHandler.displayBarchart(treeData, treeContainerId, nodeOnClickCallback);
        });
}

function visualizeReasoningTimeBarchart(pathToOWLFile, treeContainerId, nodeOnClickCallback){
    fetch(pathToOWLFile)
        .then(response => response.text())
        .then(text => {
            $rdf.parse(text, store, uri, mimeType);
            let treeData = createReasoningTimeJSONFile();
            //let treeData = JSON.parse(text);
            barHandler.displayBarchart(treeData, treeContainerId, nodeOnClickCallback);
        });
}



function visualizeReasoningNumBarchart(pathToOWLFile, treeContainerId, nodeOnClickCallback){
    fetch(pathToOWLFile)
        .then(response => response.text())
        .then(text => {
            $rdf.parse(text, store, uri, mimeType);
            let treeData = createReasoningNumJSONFile();
            //let treeData = JSON.parse(text);
            barHandler.displayBarchart(treeData, treeContainerId, nodeOnClickCallback);
        });
}

function createReasoningNumJSONFile(){
    let allTriples = store.statementsMatching(undefined, new $rdf.NamedNode(uri+'#predicate'), undefined);
    let jsonFile = {'name': 'flare', 'children' : []};

    let reasoningDict = {};

    allTriples.map((triple) => {
        let reasoningType = triple.object.value;

        if(reasoningDict.hasOwnProperty(reasoningType)){
            console.log(reasoningDict[reasoningType]['size']);
            reasoningDict[reasoningType]['size'] += 1;
        }
        else{
            let reasoningObj = {};
            reasoningObj['name'] = reasoningType;
            reasoningObj['size'] = 1;
            reasoningDict[reasoningType] = reasoningObj;
        }
    });

    console.log(reasoningDict);
    Object.keys(reasoningDict).map((reasoningType) => {
        jsonFile['children'].push(reasoningDict[reasoningType]);
    });
    console.log(jsonFile);
    return jsonFile;
}

function createReasoningTimeJSONFile(){
    let allTriples = store.statementsMatching(undefined, new $rdf.NamedNode(uri+'#predicate'), undefined);
    let jsonFile = {'name': 'flare', 'children' : []};

    let reasoningDict = {};

    allTriples.map((triple) => {
        let reasoningType = triple.object.value;
        let prologQueryId =  triple.subject.value;
        let prologQueryStartTime = Number(store.statementsMatching(
            new $rdf.NamedNode(prologQueryId), new $rdf.NamedNode(uri+'#startTime'), undefined)[0].object.value.split('_')[1]);
        let prologQueryEndTime = Number(store.statementsMatching(
            new $rdf.NamedNode(prologQueryId), new $rdf.NamedNode(uri+'#endTime'), undefined)[0].object.value.split('_')[1]);

        let totalTime = prologQueryEndTime - prologQueryStartTime;

        let reasoningObject = {};
        reasoningObject['name'] = prologQueryId.split('#')[1];
        reasoningObject['size'] = totalTime;

        if(reasoningDict.hasOwnProperty(reasoningType)){
            reasoningDict[reasoningType].push(reasoningObject);
        }
        else{
            reasoningDict[reasoningType] = [reasoningObject];
        }

    });

    Object.keys(reasoningDict).map((reasoningType) => {
        let child = {};
        child['name'] = reasoningType;
        child['children'] = reasoningDict[reasoningType];
        jsonFile['children'].push(child);
    });
    return jsonFile;
}

function createTaskTimeJSONFile(){
    let allTriples = store.statementsMatching(undefined, new $rdf.NamedNode(uri+'#performedInProjection'), undefined);
    let jsonFile = {'name': 'flare', 'children' : []};

    let taskDict = {};

    allTriples.map((triple) => {
        let taskId =  triple.subject.value;
        let taskType = taskId.split('#')[1].split('_')[0];

        let taskStartTime = Number(store.statementsMatching(
            new $rdf.NamedNode(taskId), new $rdf.NamedNode(uri+'#startTime'), undefined)[0].object.value.split('_')[1]);
        let taskEndTime = Number(store.statementsMatching(
            new $rdf.NamedNode(taskId), new $rdf.NamedNode(uri+'#endTime'), undefined)[0].object.value.split('_')[1]);

        let totalTime = taskEndTime - taskStartTime;

        let taskObject = {};
        taskObject['name'] = taskId.split('#')[1];
        taskObject['size'] = totalTime;

        if(taskDict.hasOwnProperty(taskType)){
            taskDict[taskType].push(taskObject);
        }
        else{
            taskDict[taskType] = [taskObject];
        }

    });

    Object.keys(taskDict).map((reasoningType) => {
        let child = {};
        child['name'] = reasoningType;
        child['children'] = taskDict[reasoningType];
        jsonFile['children'].push(child);
    });
    return jsonFile;
}

function createTaskNumJSONFile(){
    let allTriples = store.statementsMatching(undefined, new $rdf.NamedNode(uri+'#performedInProjection'), undefined);
    let jsonFile = {'name': 'flare', 'children' : []};

    let taskDict = {};

    allTriples.map((triple) => {
        let taskType = triple.subject.value.split('#')[1].split('_')[0];

        if(taskDict.hasOwnProperty(taskType)){
            taskDict[taskType]['size'] += 1;
        }
        else{
            let taskObj = {};
            taskObj['name'] = taskType;
            taskObj['size'] = 1;
            taskDict[taskType] = taskObj;
        }
    });

    Object.keys(taskDict).map((taskType) => {
        jsonFile['children'].push(taskDict[taskType]);
    });

    return jsonFile;
}

global.neemHierarchyBarchart = {};
global.neemHierarchyBarchart.visualizeBarchart = visualizeBarchart;
global.neemHierarchyBarchart.visualizeReasoningTimeBarchart = visualizeReasoningTimeBarchart;
global.neemHierarchyBarchart.visualizeReasoningNumBarchart = visualizeReasoningNumBarchart;
global.neemHierarchyBarchart.visualizeTaskTimeBarchart = visualizeTaskTimeBarchart;
global.neemHierarchyBarchart.visualizeTaskNumBarchart = visualizeTaskNumBarchart;



exports.visualizeBarchart = visualizeBarchart;
exports.visualizeReasoningTimeBarchart = visualizeReasoningTimeBarchart;
exports.visualizeReasoningNumBarchart = visualizeReasoningNumBarchart;
exports.visualizeTaskTimeBarchart = visualizeTaskTimeBarchart;
exports.visualizeTaskNumBarchart = visualizeTaskNumBarchart;


