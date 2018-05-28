const taskTreeConfiguration = require('./Configuration');
const treeContainerHandler = require('./TreeContainerHandler');


let root;
exports.displayTree = (treeData, treeContainerId, taskTreeCanvas, nodeOnClickCallback) => {
    taskTreeConfiguration.initConfiguration(treeContainerId, taskTreeCanvas, nodeOnClickCallback);
    // Define the root
    root = treeData;
    root.x0 = taskTreeConfiguration.viewerHeight() / 2;
    root.y0 = 0;
    // Layout the tree initially and center on the root node.
    treeContainerHandler.initView(root);
    treeContainerHandler.update(root);
    treeContainerHandler.centerNode(root);
};