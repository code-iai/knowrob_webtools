/* The following code makes use of the Google Visualization API, Licensed under Creative Commons 3
More information can be found on https://developers.google.com/chart/
*/

function Timeline (options) {
  var that = this;

  options = options || {};
  var w = options.width - 100 || 200;
  var h = options.height - 100 || 200;
  var data = options.data || [];
  var where = options.where;
  var label = options.label;
  var fontsize = options.fontsize || "12px";
  this.ros = options.ros || false;
  this.label = options.label;

  var chart;
  var dataTable;
  this.remove = function() {
    chart.clearChart();
  }

  this.update = function(data) {
      var container = document.getElementById('chart');
      chart = new google.visualization.Timeline(container);
      dataTable = new google.visualization.DataTable();
      
      dataTable.addColumn({ type: 'string', id: 'Event' });
      dataTable.addColumn({ type: 'number', id: 'Start' });
      dataTable.addColumn({ type: 'number', id: 'End' });
      
      // create arrays of data
      // alert("creating data array!" + data[0]["value2"].length);
      var data_array = [];
      for(i=0; i<data["value1"].length;i++) //note: should check that value1 and value2 have the same size
      {
        var times = data["value2"][i].split("_"); //start and endtimes were concatenated with _
        var cur_array=[data["value1"][i], parseFloat(times[0])*1000, parseFloat(times[1])*1000];
        data_array.push(cur_array)
        // alert("inserting" + JSON.stringify(cur_array));
      }
      
      dataTable.addRows(data_array);
      // alert(JSON.stringify(dataTable));
      var view =  new google.visualization.DataView(dataTable);
      

      
      google.visualization.events.addListener(chart, 'select', function(){
        var selection = chart.getSelection();
        var prolog = new JsonProlog(that.ros, {});
        for (var i = 0; i < selection.length; i++) {
         var query = "remove_task_tree, !, visualize_task_tree_in_timeline('http://knowrob.org/kb/cram_log.owl#timepoint_" + (dataTable.getValue(selection[i].row, 1) / 1000.0)  +
                                                                       "', 'http://knowrob.org/kb/cram_log.owl#timepoint_" + (dataTable.getValue(selection[i].row, 2) / 1000.0)  + 
                                                                       "', '" + dataTable.getValue(selection[i].row, 0) + "' ).";
         console.log(query);
         prolog.jsonQuery(query,
          function(result) 
          { 
            prolog.finishClient(); 
          });	     
         }
     });
     
     chart.draw(view);
  }
}


