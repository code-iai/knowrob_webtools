
function JsonProlog(ros, options){
  var that = this;
  this.raw = options.raw || false;
  this.finished = false;
  var ros = ros;
  
  this.makeid = function() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 8; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  };

  var qid = that.makeid();
  
  this.jsonQuery = function(query, callback, mode=0) {
      queryMode = mode || 0;
      // connect to ROS service
      var client = new ROSLIB.Service({
        ros : ros,
        name : '/json_prolog/simple_query',
        serviceType : 'json_prolog/PrologQuery'
      });
      // send query
      var request = new ROSLIB.ServiceRequest({
        mode : queryMode,  // 1->INCREMENTAL, 0->ALL
        id : qid,
        query : query
      });
      client.callService(request, function(result) {
        if (result.ok == true) {
          that.nextQuery(callback);
        }
        else {
          callback({ error: result.message });
          that.finishClient();
        }
      });
  };

  this.nextQuery = function (callback) {
    // connect to ROS service
    var client = new ROSLIB.Service({
      ros : ros,
      name : '/json_prolog/next_solution',
      serviceType : 'json_prolog/PrologNextSolution'
    });
    // send query
    var request = new ROSLIB.ServiceRequest({id : qid});
    client.callService(request, function(result) {
      // status = NO_SOLUTION
      if (result.status == 0 && result.solution == "") {
        callback({ completed: true });
        that.finishClient();
      }
      // status = QUERY_FAILED
      else if (result.status == 2) {
        callback({ error: result.solution });
      }
      // status = OK
      else if (result.status == 3 && result.solution == "{}") {
        callback({ completed: true, hasMore: true });
        that.finishClient();
      }
      else if (result.status == 3 && result.solution == "{}") {
        callback({ completed: true, hasMore: true });
        that.finishClient();
      }
      else if (result.status == 3 && result.solution != "{}") {
        var solution = JSON.parse(result.solution);

        function parseSolution (solution, level, ret) {
          var indent = "";
          for (var i = 0; i < level; i++){indent += " "}
          for (var key in solution) {
            if (solution.hasOwnProperty(key)) {
              if (solution[key] instanceof Array || solution[key] instanceof Object) {
                ret += indent + key + " = [\n";
                //console.log("array!");
                ret = parseSolution(solution[key], level + 1, ret);
                ret += indent + "]\n"
              } else {
                ret += indent + key + " = " + solution[key] + "\n";
              }
            }
          }
          return ret;
        }
        if (that.raw == true) {
          var ret = solution;
        } else {
          var ret = parseSolution(solution, 0, "");
        }

        callback({ value: ret });
      }
    });

  };

  this.finishClient = function () {
    var client = new ROSLIB.Service({
      ros : ros,
      name : '/json_prolog/finish',
      serviceType : 'json_prolog/PrologFinish'
    });
    request = new ROSLIB.ServiceRequest({
      id : qid
    });
    client.callService(request, function(e) { });
    that.finished = true;
  };
  
  this.format = function(result) {
    if (result.error) {
      return result.error;
    }
    else if (result.completed) {
      if (result.hasMore) {
        return "true.\n\n";
      }
      else {
        return "false.\n\n";
      }
    }
    else {
      return result.value;
    }
  }
}
