const d3 = window.d3 || require('d3');
const treeHandler = require('./TreeHandler');

function visualizeTaskTree(pathToJSONFile, treeContainerId, taskTreeCanvas){
    d3.json(pathToJSONFile, function(error, treeData){
        treeHandler.displayTree(error,treeData, treeContainerId, taskTreeCanvas);
    });
}

global.neemVisualizationTaskTree = {};
global.neemVisualizationTaskTree.visualizeTaskTree = visualizeTaskTree;

exports.visualizeTaskTree = visualizeTaskTree;