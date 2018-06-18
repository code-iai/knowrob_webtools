$(window).on('load',function() {
    neemHierarchyBarchart.visualizeTaskNumBarchart('../test/log.owl', 'body', (d) => {console.log(d);});
});