const displayMatrix = require('./displayMatrix');
const $rdf =  window.$rdf || require('rdflib');
const $ = window.$ || require('jquery');

function showMatrix(logPath, containerId, onClickLabelMethod) {
    fetch(logPath)
        .then(response => response.text())
        .then(text => {
            let matrix = createJSONFile(text);
            $(containerId).append('<aside class="sorterSelect">\n' +
                '              Row Order: <select id="rowOrder">\n' +
                '              <option value="name">Alphabetically</option>\n' +
                '              <option value="count">By Frequency</option>\n' +
                '          </select><br/>\n' +
                '              Column Order: <select id="columnOrder">\n' +
                '              <option value="name">Alphabetically</option>\n' +
                '              <option value="count">By Frequency</option>\n' +
                '          </select>\n' +
                '          </aside>');
            displayMatrix.displayMatrix(matrix, containerId, onClickLabelMethod);

        });
}

function createJSONFile(data){
    let coOccurrenceDict = createCoOccurrenceDict(data);
    return transformDictIntoJSON(coOccurrenceDict);
}


function transformDictIntoJSON(coOccurrenceDict){
    let nodesList = [];
    let linksList = [];
    let indexCounter = -1;
    let nodeNameIndexDict = {};

    Object.keys(coOccurrenceDict).map((taskType) => {
        indexCounter += 1;
        nodeNameIndexDict[taskType] = indexCounter;
        let taskTypeIndex = indexCounter;
        nodesList.push({'group': 'action', 'index': taskTypeIndex, 'name': taskType});
        Object.keys(coOccurrenceDict[taskType]).map((reasoningTaskType) => {
            let reasoningTaskIndex;
            let numReasoningTasks = coOccurrenceDict[taskType][reasoningTaskType];

            if(!nodeNameIndexDict.hasOwnProperty(reasoningTaskType)){
                indexCounter += 1;
                nodeNameIndexDict[reasoningTaskType] = indexCounter;
                reasoningTaskIndex = indexCounter;
                nodesList.push({'group': 'reason', 'index': reasoningTaskIndex, 'name': reasoningTaskType});
            }
            else{
                reasoningTaskIndex = nodeNameIndexDict[reasoningTaskType];
            }

            linksList.push({'source': taskTypeIndex,
                'target': reasoningTaskIndex,
                'value': numReasoningTasks});
        });
    });

    return {'nodes': nodesList, 'links': linksList};
}

function createCoOccurrenceDict(data){
    let uri = 'http://knowrob.org/kb/knowrob.owl';
    let mimeType = 'application/rdf+xml';
    let store = $rdf.graph();
    let coOccurrenceDict = {};

    try {
        $rdf.parse(data, store, uri, mimeType);
        let allTriples = store.statementsMatching(undefined, new $rdf.NamedNode(uri+'#failure'), undefined);
        allTriples.map((triple) => {
            let taskType = triple.subject.value.split('#')[1].split('_')[0];
            let failure = triple.object.value;
            if(coOccurrenceDict.hasOwnProperty(taskType)){
                if(coOccurrenceDict[taskType].hasOwnProperty(failure)){
                    coOccurrenceDict[taskType][failure] = coOccurrenceDict[taskType][failure] + 1;
                }
                else {
                    coOccurrenceDict[taskType][failure] = 1;
                }
            }
            else{
                coOccurrenceDict[taskType] = {};
                coOccurrenceDict[taskType][failure] = 1;
            }
        });
    } catch (err) {
        console.log(err);
    }

    return coOccurrenceDict;
}

exports.showMatrix = showMatrix;
global.showMatrx = showMatrix;

