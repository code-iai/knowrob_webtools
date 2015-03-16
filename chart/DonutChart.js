// inspired by http://bl.ocks.org/dbuezas/9306799

function DonutChart(options) {
  
  this.options = options || {};
  
  options = options || {};
  var w = options.width || 600;
  var h = options.height || 300;
  var textOffset = 14;
  var tweenDuration = 250;
  var label = options.label || "units";
  var fontsize = options.fontsize || "14px";
  var query = options.query || "";
  
  
  // // // // // // // // // // // // // 
  // Set up chart canvas
  var margin = {top: 10, right: 10, bottom: 0, left: 10},
      width = w - margin.left - margin.right,
      height = h - margin.top - margin.bottom,
      radius = Math.min(width, height) / 2;
      
  var color = d3.scale.category20();
      
  var svg = d3.select("#"+options.id).append("svg:svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);
            
  svg.append("g")
            .attr("class", "slices");
  svg.append("g")
            .attr("class", "labels");
  svg.append("g")
            .attr("class", "lines");
            
  svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
            
            

  // // // // // // // // // // // // //
  // Layout helper functions
            
  var pie = d3.layout.pie()
            .sort(null)
            .value(function(d) {
              return parseFloat(d.value);
            });
  
  var arc = d3.svg.arc()
            .outerRadius(radius * 0.8)
            .innerRadius(radius * 0.4);
  
  var outerArc = d3.svg.arc()
            .innerRadius(radius * 0.9)
            .outerRadius(radius * 0.9);
            
  var key = function(d){ return d.data.label; };
  
  
  
  // // // // // // // // // // // // // // // // // // // // // // // // //
  // Convert the diagram message of the form value1[], value2[] into a map
  // key-value map
  var msgToMap = function(msg){
    var res = new Array();
    for(i=0; i < msg.value1.length; i++) {
      res[i] = {'label': msg.value1[i], 'value': msg.value2[i]};
    };
    return res;
  };
  
  
  // // // // // // // // // // // // // 
  // Update data from ROS message
  this.update = function(msg) {
    
    data = msgToMap(msg);
    
    // // // // // // // // // // // // // 
    // Pie slices
    
    var slice = svg.select(".slices").selectAll("path.slice")
          .data(pie(data), key);
    
    slice.enter()
         .insert("path")
         .style("fill", function(d) { return color(d.data.label); })
         .attr("class", "slice");
    
    slice.transition()
         .duration(1000)
         .attrTween("d", function(d) {
            this._current = this._current || d;
            var interpolate = d3.interpolate(this._current, d);
            this._current = interpolate(0);
            return function(t) {
              return arc(interpolate(t));
            };
         });
    
    slice.exit()
         .remove();


    // // // // // // // // // // // // // 
    // Text labels    
    
    var text = svg.select(".labels").selectAll("text")
    .data(pie(data), key);
    
    text.enter()
        .append("text")
        .style("font-size", fontsize)
        .attr("dy", ".35em")
        .text(function(d) {
          return d.data.label;
        });
    
    function midAngle(d){
      return d.startAngle + (d.endAngle - d.startAngle)/2;
    }
    
    text.transition().duration(1000)
        .attrTween("transform", function(d) {
          this._current = this._current || d;
          var interpolate = d3.interpolate(this._current, d);
          this._current = interpolate(0);
          return function(t) {
            var d2 = interpolate(t);
            var pos = outerArc.centroid(d2);
            pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
            return "translate("+ pos +")";
          };
        })
        .styleTween("text-anchor", function(d){
          this._current = this._current || d;
          var interpolate = d3.interpolate(this._current, d);
          this._current = interpolate(0);
          return function(t) {
            var d2 = interpolate(t);
            return midAngle(d2) < Math.PI ? "start":"end";
          };
        });
    
    text.exit()
        .remove();
    
        
    // // // // // // // // // // // // // // 
    // Slice-to-text lines
    
    var polyline = svg.select(".lines").selectAll("polyline")
            .data(pie(data), key);
    
    polyline.enter()
            .append("polyline");
    
    polyline.transition().duration(1000)
            .attrTween("points", function(d){
              this._current = this._current || d;
              var interpolate = d3.interpolate(this._current, d);
              this._current = interpolate(0);
              return function(t) {
                var d2 = interpolate(t);
                var pos = outerArc.centroid(d2);
                pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                return [arc.centroid(d2), outerArc.centroid(d2), pos];
              };                      
            });
    
    polyline.exit()
            .remove();
  };

  

  
  // // // // // // // // // // // // // // // // // // // // // // // // 
  // Helper functions
  // 
  
  // External trigger to remove this chart
  this.remove = function() {
    svg.remove();
  }
  
  this.getWidth = function() {
    return width;
  }
  this.getHeight = function() {
    return height;
  }
  this.getData = function() {
    return data;
  }
  this.getLabel = function() {
    return label;
  }
  this.getQuery = function() {
    return query;
  }
  
  this.setWidth = function(width) {
    width = width;
  }
  this.setHeight = function(height) {
    height = height;
  }
  this.setData = function(d) {
    data = d;
  }
  this.setLabel = function(l) {
    label = l;
  }
  this.setQuery = function(q) {
    query = q;
  }
  
}
