$(window).on('load',function() {
    neemVisualizationTaskTree.visualizeTaskTree('../test/log.owl', '#tree-container', document, (d) => {console.log(d);});
});