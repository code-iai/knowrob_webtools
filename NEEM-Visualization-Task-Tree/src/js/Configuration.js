const $ = window.$ || require('jquery');
let taskTreeCanvasSelection;

exports.treeContainerId;

exports.viewerWidth = () => {
    return taskTreeCanvasSelection.width();
};
exports.viewerHeight = () => {
    return taskTreeCanvasSelection.height();
};

exports.duration = 750;

exports.initConfiguration = (treeContainerId, taskTreeCanvas) => {
    exports.treeContainerId = treeContainerId;
    taskTreeCanvasSelection = $(taskTreeCanvas);
};

