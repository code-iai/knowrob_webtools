
function Knowrob(options){
    var that = this;
  
    // The index to the currently active history item
    // history items are saved on the server and queried using AJAX
    var historyIndex = -1;
    
    // Names of prolog predicates and modules for auto completion
    var prologNames;

    // global ROS handle
    var ros;

    // global jsonprolog handle
    var prolog;
    
    // the 3d canvas
    var rosViewer;
    
    // keep aliva message publisher
    var keepAlive;
    
    // URL for ROS server
    var rosURL = options.ros_url || 'ws://localhost:9090'
    
    // File that contains example queries
    var libraryFile = options.library_file || 'queriesForRobohow.json'
    
    // configuration of div names
    var canvasDiv     = options.canvas_div || 'markers'
    var designatorDiv = options.designator_div || 'designator'
    var pictureDiv    = options.picture_div || 'mjpeg'
    var historyDiv    = options.history_div || 'history'
    var libraryDiv    = options.library_div || 'examplequery'
    var queryDiv      = options.query_div || 'user_query'

    this.init = function () {
      // Connect to ROS.
      ros = new ROSLIB.Ros({url : rosURL});
      // Create the main viewer.
      rosViewer = new ROS3D.Viewer({
        divID : canvasDiv,
        width : 800,
        height : 600,
        antialias : true,
        background : '#ffffff'
      });
      rosViewer.addObject(new ROS3D.Grid());
      
      // Setup publisher that sends a dummy message in order to keep alive the socket connection
      keepAlive = new KeepAlivePublisher({ros : ros, interval : 30000});
      
      // Setup a client to listen to TFs.
      var tfClient = new ROSLIB.TFClient({
        ros : ros,
        angularThres : 0.01,
        transThres : 0.01,
        rate : 10.0,
        fixedFrame : '/my_frame'
      });

      // Setup the marker client.
      var markerClient = new ROS3D.MarkerClient({
        ros : ros,
        tfClient : tfClient,
        topic : '/visualization_marker',
        rootObject : rosViewer.scene
      });

      // Setup the marker array client.
      var markerArrayClient = new ROS3D.MarkerArrayClient({
        ros : ros,
        tfClient : tfClient,
        topic : '/visualization_marker_array',
        rootObject : rosViewer.scene,
        markerClient : markerClient
      });

      var desig_listener = new ROSLIB.Topic({
        ros : ros,
        name : '/logged_designators',
        messageType : 'designator_integration_msgs/Designator'
      });
      desig_listener.subscribe(function(message) {
        document.getElementById(designatorDiv).innerHTML=
            format_designator(message.description, "", 0, 0);
      });

      var img_listener = new ROSLIB.Topic({
        ros : ros,
        name : '/logged_images',
        messageType : 'std_msgs/String'
      });
      img_listener.subscribe(function(message) {
        document.getElementById(pictureDiv).innerHTML=
            '<img class="picture" src="/'+message.data+'" width="300" height="240"/>';
      });
      
      var dataVisClient = new DataVisClient({
        ros: ros,
        containerId: '#chart',
        topic: 'data_vis_msgs',
        //width: 500,//210,
        //height: 500//210
      });
      
      this.resize_canvas();
      // fill example query select
      this.populate_query_select(libraryDiv, libraryFile);
      
      this.setup_autocompletion();
      this.setup_history_field();
      this.setup_query_field();
    };

    this.setup_history_field = function () {
        var history = ace.edit(historyDiv);
        history.setTheme("ace/theme/solarized_light");
        history.getSession().setMode("ace/mode/prolog");
        history.getSession().setUseWrapMode(true);
        history.setOptions({
            readOnly: true,
            showGutter: false,
            printMarginColumn: false,
            highlightActiveLine: false,
            highlightGutterLine: false
        });
        return history;
    }

    this.setup_query_field = function () {
        var userQuery = ace.edit(queryDiv);
        userQuery.resize(true);
        userQuery.setTheme("ace/theme/solarized_light");
        userQuery.getSession().setMode("ace/mode/prolog");
        userQuery.getSession().setUseWrapMode(true);
        userQuery.setOptions({
            showGutter: false,
            printMarginColumn: false,
            highlightActiveLine: false,
            highlightGutterLine: false,
            enableBasicAutocompletion: true
        });
        userQuery.commands.addCommand({
            name: 'send_query', readOnly: false,
            bindKey: {win: 'Enter',  mac: 'Enter'},
            exec: function(editor) { that.query(userQuery); }
        });
        userQuery.commands.addCommand({
            name: 'new_line', readOnly: false,
            bindKey: {win: 'Ctrl-Enter',  mac: 'Command-Enter'},
            exec: function(editor) { that.set_query_value(userQuery.getValue()+"\n"); }
        });
        userQuery.commands.addCommand({
            name: 'next_result', readOnly: false,
            bindKey: {win: 'Ctrl-;',  mac: 'Command-;'},
            exec: function(editor) { that.next_solution(); }
        });
        userQuery.commands.addCommand({
            name: 'next_result', readOnly: false,
            bindKey: {win: 'Ctrl-n',  mac: 'Command-n'},
            exec: function(editor) { that.next_solution(); }
        });
        userQuery.commands.addCommand({
            name: 'next_history', readOnly: false,
            bindKey: {win: 'Up',  mac: 'Up'},
            exec: function(editor) { that.set_next_history_item(); }
        });
        userQuery.commands.addCommand({
            name: 'previous_history', readOnly: false,
            bindKey: {win: 'Down',  mac: 'Down'},
            exec: function(editor) { that.set_previous_history_item(); }
        });
        return userQuery;
    }
    
    this.setup_autocompletion = function() {
        // Add completer for prolog code
        ace.require("ace/ext/language_tools").addCompleter({
            getCompletions: function(editor, session, pos, prefix, callback) {
                var names = that.get_completions();
                if( names ) {
                  callback(null, names.map(function(x) {
                      return {name: x, value: x, score: 100, meta: "pl"};
                  }));
                }
            }
        });
    }
    
    this.new_pl_client = function() {
      if (prolog != null && prolog.finished == false) {
        prolog.finishClient();
      }
      prolog = new JsonProlog(ros, {});
      return prolog;
    }
    
    this.get_completions = function() {
      if( ! prologNames ) {
        prolog = this.new_pl_client();
        prologNames = [];
        // Query for predicates/modules and collect all results
        prolog.jsonQuery("findall(X, current_predicate(X/_);current_module(X), L)", function(x) {
          if (x.value) {
            // Parse each value
            var lines = x.value.split("\n");
            for(i=1; i<lines.length-1; ++i) {
              var tmp = lines[i].split(" = ");
              if(tmp.length==2) {
                console.log(tmp[1].trim());
                prologNames.push(tmp[1].trim());
              }
            }
            prologNames.sort();
          }
          else {
            console.warn("Unable to query prolog names.");
            console.warn(x);
          }
        }, mode=0);
      }
      return prologNames;
    }
    
    ///////////////////////////////
    //////////// Getter
    ///////////////////////////////
    
    this.get_ros = function () {
      return ros;
    }

    this.get_ros_viewer = function () {
      return rosViewer;
    }
    
    this.get_prolog_names = function() {
      return prologNames;
    }
    
    ///////////////////////////////
    //////////// Prolog queries
    ///////////////////////////////

    this.query = function (query) {
      var history = ace.edit(historyDiv);
      var q = query.getValue().trim();
    
      if (q.substr(q.length - 1) == ".") {
        q = q.substr(0, q.length - 1);
        
        history.setValue(history.getValue() + "\n\n?- " + q +  ".\n", -1);
        history.navigateFileEnd();
        
        prolog = this.new_pl_client();
        prolog.jsonQuery(q, function(result) {
            history.setValue(history.getValue() + prolog.format(result), -1);
            history.navigateFileEnd();
        }, mode=1); // incremental mode
        
        query.setValue("");
        
        this.add_history_item(q);
        historyIndex = -1;
      }
      else {
        if (prolog != null && prolog.finished == false) {
          prolog.finishClient();
        }
      }
    };

    this.next_solution = function () {
      var history = ace.edit(historyDiv);
      prolog.nextQuery(function(result) {
            history.setValue(history.getValue() + prolog.format(result), -1);
            history.navigateFileEnd();
      });
      user_query.focus();
    };

    // append the selected query to the user_query form
    this.add_selected_to_queryform = function (selectid) {
      var select = document.getElementById(selectid);
      this.set_query_value(select.options[select.selectedIndex].value);
    }

    // set the value of the query editor and move the cursor to the end
    this.set_query_value = function (val){
      var user_query = ace.edit(queryDiv);
      user_query.setValue(val, -1);
      user_query.focus();
      user_query.navigateFileEnd();
    }
    
    ///////////////////////////////
    //////////// History
    ///////////////////////////////

    this.add_history_item = function (query) {
        $.ajax({
            url: "/add_history_item",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({query: query}),  
            dataType: "json"
        }).done( function (request) {})
    }

    this.set_history_item = function (index) {
        $.ajax({
            url: "/get_history_item",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({index: index}),  
            dataType: "json",
            success: function (data) {
                 ace.edit(queryDiv).setValue(data.item);
                 historyIndex = data.index;
            }
        }).done( function (request) {})
    }

    this.set_next_history_item = function () {
        this.set_history_item(historyIndex+1);
    }
    
    this.set_previous_history_item = function () {
        this.set_history_item(historyIndex-1);
    }
    
    ///////////////////////////////
    ///////////////////////////////
    
    this.resize_canvas = function () {
      var w = $('#'+canvasDiv).width()-8.0;
      var h = $('#'+canvasDiv).height()-8.0;
      rosViewer.renderer.setSize(w, h);
      rosViewer.camera.aspect = w/h;
      rosViewer.camera.updateProjectionMatrix();
    }

    // fill the select with json data from url
    this.populate_query_select = function (id, url) {
      // url must point to a json-file containing an array named "query" with
      // the query strings to display in the select
      var request = new XMLHttpRequest
      request.open("GET", url, false);
      request.send(null);

      var querylist = JSON.parse(request.responseText);

      var select = document.getElementById(id);

      for (var i = 0; i < querylist.query.length; i++) {
        var opt = document.createElement('option');
        opt.value = querylist.query[i].q;
        opt.innerHTML = querylist.query[i].text;
        select.appendChild(opt);
      }
    }

    // hook for links of class "show_code" that pastes the content of the
    // previous code block into the query field
    $( document ).ready(function() {
      $( "a.show_code" ).click(function( event ) {
        this.set_query_value( $(this).closest("pre + *").prev().find('code').html() );
        event.preventDefault();
      });
    });
}

