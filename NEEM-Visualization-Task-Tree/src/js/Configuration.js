const $ = window.$ || require('jquery');

exports.treeContainerId = '#chart';

exports.viewerWidth = () => {
    return $('#chart').width();
};
exports.viewerHeight = () => {
    return $('#chart').height();
};

exports.duration = 750;