const d3 = window.d3 || require('d3');
const treeHandler = require('./TreeHandler');

global.neemVisualizationTaskTree = {};
global.neemVisualizationTaskTree.loadTree = (pathToJSONFile) => {
    d3.json(pathToJSONFile, function(error, treeData){
        treeHandler.displayTree(error,treeData);
    });
};




