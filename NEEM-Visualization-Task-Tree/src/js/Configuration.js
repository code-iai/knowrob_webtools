const $ = window.$ || require('jquery');
let taskTreeCanvasSelection;

exports.treeContainerId;

exports.viewerWidth = () => {
    return taskTreeCanvasSelection.width();
};
exports.viewerHeight = () => {
    return taskTreeCanvasSelection.height();
};

exports.nodeOnClickCallback;

exports.duration = 750;

exports.initConfiguration = (treeContainerId, taskTreeCanvas, nodeOnClickCallback) => {
    exports.treeContainerId = treeContainerId;
    taskTreeCanvasSelection = $(taskTreeCanvas);
    exports.nodeOnClickCallback = nodeOnClickCallback;
};

