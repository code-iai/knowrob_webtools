
function DataVisClient(options) {
  
  var that = this;
  var ros = options.ros;
  var containerId = options.containerId;
  var topic = options.topic;
  
  
  // internal buffer, keeps mapping between IDs and the chart objects
  var chartHandle = [];
  
  
  // add a chart to the internal buffer and create the appropriate HTML elements
  this.addChart = function(id, type, options) {
    
    // only create a new panel if none with this ID exists already:
    if($( containerId ).find("#" + options.id).length == 0) {
    
      var html = 
      '<div class="col-md-3">\n' +
      '  <div class="panel panel-default">\n' +
      '    <div class="panel-heading text-right">\n';
      
      if('query' in options) {
        html +=
        '    <a class="edit-widget" href="#">\n' +
        '      <span class="glyphicon glyphicon-cog text-right" style="margin-right:5px;" aria-hidden="true" data-toggle="modal" data-target="#editChart" data-edit="' + options.id + '"></span>\n' +
        '    </a>\n' +
        '    <a class="reload-widget" href="#">\n' +
        '      <span class="glyphicon glyphicon-repeat text-right" style="margin-right:5px;" aria-hidden="true" data-reload="' + options.id + '"></span>\n';
        '    </a>\n';
      } else {
        html += 
        '    <span class="glyphicon glyphicon-cog text-right" style="margin-right:5px; color:#ccc;" aria-hidden="true"></span>\n' +
        '    <span class="glyphicon glyphicon-repeat text-right" style="margin-right:5px; color:#ccc;" aria-hidden="true"></span>\n';
      }
      
      html +=   
      '    <a class="close-widget" href="#">\n' +
      '      <span class="glyphicon glyphicon-remove text-right" aria-hidden="true" data-remove="' + options.id + '"></span>\n' +
      '  </a></div>\n' +
      '    <div class="panel-body text-center" id="' + options.id + '"></div>\n' +
      '    <div class="panel-footer text-center" id="footer_' + options.id + '">' + options.label + '</div>\n' +
      '  </div>\n' +
      '</div>';
      
      // create new container for this chart:
      $( containerId ).append(html);
      
      
      // create diagram object (wrapping d3 object)
      var handle = null
      if (type == 0) {
        handle = new DonutChart(options);
        
      } else if (type == 1) {
        handle = new BarChart(options);
        
      } else if (type == 2) {
        handle = new TreeDiagram(options);
        
      } else if (type == 3) {
        handle = new Timeline(options);
      }
      
      // add to internal map id--handle
      if(handle != null) {
        chartHandle.push({
          id: id,
          handle: handle
        });
      }
    } else {
      console.log("Warning: Tried to add duplicate chart for ID " + id);
    }
    
  };
  
  
  // update a chart based on the options passed as argument
  this.updateChart = function(id, options) {

    chart = that.getChart(id);
    
    // clear possibly existing diagrams for this elements
    $('#'+ id).empty();
    
    if(chart instanceof DonutChart) {
      chart = new DonutChart(options)
    } else if(chart instanceof BarChart) {
      chart = new BarChart(options)
    } else if(chart instanceof TreeDiagram) {
      chart = new TreeDiagram(options)
    } else if(chart instanceof Timeline) {
      chart = new Timeline(options)
    }
    
    $('#footer_'+ id).text(options.label);
  }
  
  // find the d3 diagram this message refers to and update the data
  this.updateChartData = function(id, values) {
    that.getChart(id).update(values);
  };
  
  
  // Remove a chart both from the internal buffer and the HTML page
  this.removeChart = function(id) {
    
    console.log("Removing: " + id)
    
    // remove SVG
    that.getChart(id).remove();
    
    // remove surrounding divs
    $( "div#"+id ).parents( ".col-md-3" ).remove();
    
    // remove from internal array buffer
    chartHandle.splice(chartHandle.findIndex(function (element, index, array) {
      if(element.id == id) {return true} else {return false}
    }, this), 1);
    
  };
  
  
  
  this.getChart = function(id) {
    return chartHandle.find(function (element, index, array) {
      if(element.id == id) {return true} else {return false}
    }, this).handle;
  };
  
  
  
  
  
  var rosTopic = new ROSLIB.Topic({
    ros : ros,
    name : topic,
    messageType : 'data_vis_msgs/DataVis'
  });
  
  rosTopic.subscribe(function(message) {
    
    // remove chart if message empty
    if (message.values.length == 0) {
      that.removeChart( message.id );
      return;
    }
    
    // create new chart if ID is not yet in chartHandle buffer
    if (chartHandle.findIndex(function (element, index, array) {
      if(element.id == message.id) {return true} else {return false}
    }, this) == -1 ) {
      
      var options = {
        id: message.id,
        data: message.values[0],
        where: containerId,
        label: message.title,
        width: message.width,
        height: message.height,
        radius: (message.height-120)/2,//height*3/10,
        innerRadius: (message.height-120)/2*4/9,
        fontsize: message.fontsize//"14px"
      };
      
      that.addChart(message.id, message.type, options);
    }
    
    if (message.type == 2) { // tree diagram
      that.updateChartData(message.id, message.values);
    } else {
      that.updateChartData(message.id, message.values[0]);
    }
  })
}
// type constants
// DataVisClient.PIECHART = 0;
// DataVisClient.BARCHART = 1;
// DataVisClient.TREEDIAGRAM = 2;
// DataVisClient.TIMELINE = 3;