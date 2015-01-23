
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
    
    // The topic where the canvas publishes snapshots
    var snapshotTopic;
    
    // configuration of div names
    var canvasDiv     = options.canvas_div || 'markers'
    var designatorDiv = options.designator_div || 'designator'
    var pictureDiv    = options.picture_div || 'mjpeg'
    var historyDiv    = options.history_div || 'history'
    var libraryDiv    = options.library_div || 'examplequery'
    var queryDiv      = options.query_div || 'user_query'
    var nextButtonDiv = options.next_button_div || 'btn_query_next'
    
    var background = options.background || '#ffffff';
    var near = options.near || 0.01;
    var far = options.far || 1000.0;

    this.init = function () {
      // Connect to ROS.
      ros = new ROSLIB.Ros({url : rosURL});
      ros.on('connection', function() {
        console.log('Connected to websocket server.');
      });
      ros.on('error', function(error) {
        console.log('Error connecting to websocket server: ', error);
      });
      ros.on('close', function() {
        console.log('Connection to websocket server closed.');
      });
      
      var width = 800;
      var height = 600;
      // Create the main viewer.
      rosViewer = new ROS3D.Viewer({
        divID : canvasDiv,
        width : width,
        height : height,
        antialias : true,
        background : background,
        near: near,
        far: far
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
    
      // The topic where the canvas publishes snapshots
      snapshotTopic = new ROSLIB.Topic({
        ros : ros,
        name : '/canvas/snapshot',
        messageType : 'sensor_msgs/Image'
      });

      var camera_topic = new ROSLIB.Topic({
        ros : ros,
        name : '/camera/pose',
        messageType : 'geometry_msgs/Pose'
      });
      camera_topic.subscribe(function(message) {
        that.set_camera_pose(message);
      });
      
      // fill example query select
      this.populate_query_select(libraryDiv, libraryFile);
      
      this.setup_autocompletion();
      this.setup_history_field();
      this.setup_query_field();
      this.resize_canvas();
      set_inactive(document.getElementById(nextButtonDiv));
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
            exec: function(editor) { that.query(); }
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
        ace.edit(historyDiv).setValue(ace.edit(historyDiv).getValue() + "stopped.\n", -1);
        ace.edit(historyDiv).navigateFileEnd();
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

    this.query = function () {
      var query = ace.edit(queryDiv);
      var history = ace.edit(historyDiv);
      var q = query.getValue().trim();
    
      if (q.substr(q.length - 1) == ".") {
        q = q.substr(0, q.length - 1);
        prolog = this.new_pl_client();
        
        history.setValue(history.getValue() + "\n\n?- " + q +  ".\n", -1);
        history.navigateFileEnd();
        set_active(document.getElementById(nextButtonDiv));
        
        prolog.jsonQuery(q, function(result) {
            history.setValue(history.getValue() + prolog.format(result), -1);
            history.navigateFileEnd();
            if( ! result.value ) set_inactive(document.getElementById(nextButtonDiv));
        }, mode=1); // incremental mode
        
        query.setValue("");
        
        this.add_history_item(q);
        historyIndex = -1;
      }
      else {
        if (prolog != null && prolog.finished == false) {
          history.setValue(history.getValue() + "stopped.\n\n", -1);
          history.navigateFileEnd();
          prolog.finishClient();
        }
        else {
          alert("Invalid prolog query '" + q + "'. Prolog queries always end with a dot.");
        }
      }
    };

    this.next_solution = function () {
      var history = ace.edit(historyDiv);
      prolog.nextQuery(function(result) {
          history.setValue(history.getValue() + prolog.format(result), -1);
          history.navigateFileEnd();
          if( ! result.value ) set_inactive(document.getElementById(nextButtonDiv));
      });
      user_query.focus();
    };
    
    function set_active(div) {
      div.style.pointerEvents = "auto";
      div.style.backgroundColor = "#dadada";
      div.style.color = "#606060";
    }
    
    function set_inactive(div) {
      div.style.pointerEvents = "none";
      div.style.backgroundColor = "#cfcfcf";
      div.style.color = "#adadad";
    }

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
    //////////// Snapshots
    ///////////////////////////////
    
    this.publish_snapshot = function (frameNumber, fps) {
      console.log("Publishing canvas snapshot frame:" + frameNumber + " fps:" + fps);
      var gl = rosViewer.renderer.getContext();
      var width  = gl.drawingBufferWidth;
      var height = gl.drawingBufferHeight;
      
      // Compute frame timestamp based on FPS and frame number
      var t = frameNumber/fps;
      var secs  = Math.floor(t);
      var nsecs = Math.round(1000*(t - secs));
      
      // FIXME: Why does this fail?
      //    Also it is not nice to copy the pixel data below. Would be
      //    nicer if we could use the return of glReadPixels directly.
      //var buf = new Uint8Array(width * height * 3);
      //gl.readPixels(0, 0, width, height, gl.RGB, gl.UNSIGNED_BYTE, buf);
      var buf = new Uint8Array(width * height * 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      // Copy to pixels array (Note: Workaround for serialization issue when using Uint8Array directly)
      var pixels = [];
      var pixelStride = 4; // 4 bytes per pixel (RGBA)
      for(var y=height-1; y>=0; y--) {
        for(var x=0; x<width; x++) {
          var index = (x + y*width)*pixelStride;
          // Read RGB, ignore alpha
          pixels.push(buf[index+0]);
          pixels.push(buf[index+1]);
          pixels.push(buf[index+2]);
        }
      }
      
      // Finally generate ROS message
      var msg = new ROSLIB.Message({
        header: {
          // Two-integer timestamp
          stamp: { secs:secs, nsecs:nsecs },
          // Frame this data is associated with
          frame_id: "image",
          // Consecutively increasing ID
          seq: frameNumber
        },
        // image height, that is, number of rows
        height: height,
        // image width, that is, number of cols
        width: width,
        // Encoding of pixels -- channel meaning, ordering, size
        encoding: "rgb8",
        // is this data bigendian?
        is_bigendian: 0,
        // Full row length in bytes
        step: width*3,
        // actual matrix data, size is (step * rows)
        data: pixels
      });
      
      snapshotTopic.publish(msg);
    }
    
    ///////////////////////////////
    //////////// Camera
    ///////////////////////////////
    
    this.set_camera_pose = function(pose) {
        that.set_camera_position(pose.position);
        that.set_camera_orientation(pose.orientation);
    }
    
    this.set_camera_position = function(position) {
        rosViewer.cameraControls.camera.position.x = position.x;
        rosViewer.cameraControls.camera.position.y = position.y;
        rosViewer.cameraControls.camera.position.z = position.z;
    }
    
    this.set_camera_orientation = function(orientation) {
        var orientation = new THREE.Quaternion(orientation.x, orientation.y,
                                               orientation.z, orientation.w);
        var frontVector = new THREE.Vector3(0, 1, 0);
        frontVector.applyQuaternion(orientation);
        rosViewer.cameraControls.center = rosViewer.cameraControls.camera.position.clone();
        rosViewer.cameraControls.center.add(frontVector);
    }
    
    ///////////////////////////////
    //////////// HUD
    ///////////////////////////////
    
    var spriteLayouter = [];
    
    var hudTextMesh;
    
    this.create_text_texture = function(options) {
        var textLines = options.textLines || [
            "  Time: 56278462378",
            "  Task: Making Pancake",
            "Action: Grasp Pancake Tube"
        ];
        
        // Font options
        var font = options.font || "Bold 24px Monospace";
        var useShadow = options.useShadow || false;
        var margin = options.margin || [12, 12];
        var lineHeight = 24;
        
        // Create a canvas for 2D rendering
        var canvas  = document.createElement('canvas');
        
        // Compute size of the canvas so that it fits the text.
        // We need a special context for measuring the size.
        var maxWidth = 0;
        var heightSum = 0;
        var measure_ctx = canvas.getContext('2d');
        measure_ctx.font = font;
        for(var i=0; i<textLines.length; i++) {
            var m = measure_ctx.measureText(textLines[i]);
            if(m.width>maxWidth) maxWidth = m.width;
            heightSum += m.height;
        }
        
        // Create context with appropriate canvas size 
        var ctx = canvas.getContext('2d');
        // TODO: Don't multiply by 2!
        ctx.canvas.width = 2*(maxWidth + margin[0]);
        ctx.canvas.height = 2*(lineHeight*textLines.length + margin[1]);
        ctx.font = font;
        // Configure text shadow
        if(useShadow) {
            ctx.shadowColor = options.shadowColor || "gray";
            ctx.shadowOffsetX = options.shadowOffsetX || 4;
            ctx.shadowOffsetY = options.shadowOffsetY || 4
            ctx.shadowBlur = options.shadowBlur || 6;
        }
        // Configure text
        ctx.fillStyle = options.fillStyle || "#144F78";
        
        // Render text into 2D canvas
        for(var i=0; i<textLines.length; i++) {
            // TODO: Don't offset x by 0.5*ctx.canvas.width and y by 0.5*ctx.canvas.height
            ctx.fillText(textLines[i],
                         0.5*margin[0] + 0.5*ctx.canvas.width,
                         0.5*margin[1] + (i+1)*lineHeight + 0.5*ctx.canvas.height);
        }
        
        // Finally create texture from canvas
        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        
        return texture;
    }
    
    this.show_hud_text = function(options) {
        var texture = this.create_text_texture(options);
        
        var material = new THREE.SpriteMaterial( {
              map: texture
            , useScreenCoordinates: false
            , alignment: THREE.SpriteAlignment.center
        } );
        var mesh = new THREE.Sprite( material );
        
        var actualFontSize = 0.25; // ?
        var scale_x = texture.image.width / texture.image.height * actualFontSize;
        var scale_y = actualFontSize;
        mesh.scale.set(scale_x, scale_y, 1);
            
        var layout_function = function() {
            mesh.position.set(
                rosViewer.cameraOrtho.left,
                rosViewer.cameraOrtho.top,
                1
            );
        };
        spriteLayouter.push(layout_function);
        layout_function();
        
        if(hudTextMesh) {
            rosViewer.sceneOrtho.remove(hudTextMesh);
        }
        rosViewer.sceneOrtho.add(mesh);
        hudTextMesh = mesh;
    }
    
    ///////////////////////////////
    ///////////////////////////////
    
    this.resize_canvas = function () {
      var w = $('#'+canvasDiv).width();
      var h = $('#'+canvasDiv).height();
      rosViewer.renderer.setSize(w, h);
      rosViewer.camera.aspect = w/h;
      rosViewer.camera.updateProjectionMatrix();
      
      rosViewer.cameraOrtho.left = - w / 2;
      rosViewer.cameraOrtho.right = w / 2;
      rosViewer.cameraOrtho.top = h / 2;
      rosViewer.cameraOrtho.bottom = - h / 2;
      rosViewer.cameraOrtho.updateProjectionMatrix();
      
      for(var i=0; i<spriteLayouter.length; i++) {
        spriteLayouter[i]();
      }
    }

    // fill the select with json data from url
    this.populate_query_select = function (id, url) {
      try{
        // url must point to a json-file containing an array named "query" with
        // the query strings to display in the select
        var request = new XMLHttpRequest
        request.open("GET", url, false);
        request.send(null);

        var querylist = JSON.parse(request.responseText);

        var select = document.getElementById(id);
        if(select !== null) {
          for (var i = 0; i < querylist.query.length; i++) {
            var opt = document.createElement('option');
            opt.value = querylist.query[i].q;
            opt.innerHTML = querylist.query[i].text;
            select.appendChild(opt);
          }
        }
      }
      catch(e) {
        console.warn(e);
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
