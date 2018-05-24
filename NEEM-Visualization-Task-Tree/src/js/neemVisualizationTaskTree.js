const d3 = window.d3 || require('d3');
const treeHandler = require('./TreeHandler');
const taskTreeGenerator = require('./TaskTreeGenerator');
const $rdf =  window.$rdf || require('rdflib');

function visualizeTaskTree(pathToOWLFile, treeContainerId, taskTreeCanvas){
    fetch(pathToOWLFile)
        .then(response => response.text())
        .then(text => {
            let treeData = createJSONFile(text);
            treeHandler.displayTree(treeData, treeContainerId, taskTreeCanvas);
        });
}

function triples(result){
    console.log(result);
}
function createJSONFile(data){
    var uri = 'http://knowrob.org/kb/knowrob.owl'
    var mimeType = 'application/rdf+xml'
    var store = $rdf.graph()

    try {
        $rdf.parse(data, store, uri, mimeType);
        let allTriples = store.statementsMatching(undefined, undefined, undefined);
        return taskTreeGenerator.generateTaskTree(allTriples);
    } catch (err) {
        console.log(err);
    }

}


global.neemVisualizationTaskTree = {};
global.neemVisualizationTaskTree.visualizeTaskTree = visualizeTaskTree;
global.neemVisualizationTaskTree.createJSONFile = createJSONFile;

exports.visualizeTaskTree = visualizeTaskTree;
exports.createJSONFile = createJSONFile;