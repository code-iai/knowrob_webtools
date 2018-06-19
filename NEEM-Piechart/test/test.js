$(window).on('load',function() {
    neemPiechart.visualizeReasoningVsTaskTimePiechart('../test/log.owl', 'body', (d) => {console.log(d);});
});