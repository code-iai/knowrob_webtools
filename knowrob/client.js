/**
 * Establishes connection to a ROS master via websocket.
 **/
function KnowrobClient(options){
    var that = this;
    // Object that holds user information
    this.flask_user = options.flask_user;
    // ROS handle
    this.ros = undefined;
    // URL for ROS server
    var rosURL = options.ros_url || 'ws://localhost:9090';
    // Use rosauth?
    var authentication  = options.authentication === '' ? true : options.authentication === 'True';
    // URL for rosauth token retrieval
    var authURL  = options.auth_url || '/wsauth/v1.0/by_session';
    // The selected episode
    this.episode;
    // The openEASE menu that allows to activate episodes/ui/..
    this.menu = options.menu;
    // global jsonprolog handle
    var prolog;
    
    // User interface names (e.g., editor, memory replay, ...)
    var user_interfaces = options.user_interfaces || [];
    // Query parameters encoded in URL
    // E.g., localhost/#foo&bar=1 yields in:
    //    URL_QUERY = {foo: undefined, bar: 1}
    var urlQuery = {};
    
    var pageOverlayDisabled = false;
    // true iff connection to ROS master is established
    this.isConnected = false;
    // true iff json_prolog is connected
    this.isPrologConnected = false;
    // true iff registerNodes was called before
    var isRegistered = false;
    // Names of prolog predicates and modules for auto completion
    var prologNames;
    // Prefix for mesh GET URL's
    var meshPath  = options.meshPath || '/';
    // Block the interface until an episode was selected?
    var requireEpisode = options.require_episode;
    // Viewer used by tutorial page
    var globalViewer = options.global_viewer;
    // The selected marker object or undefined
    this.selectedMarker = undefined;
    
    // ROS messages
    var tfClient = undefined;
    var markerClient = undefined;
    var markerArrayClient = undefined;
    var designatorClient = undefined;
    var imageClient = undefined;
    var cameraPoseClient = undefined;
    this.snapshotTopic = undefined;
    
    // Redirects incomming marker messages to currently active canvas.
    function CanvasProxy(scene) {
        this.viewer = function() {
            //if(globalViewer) {
            //    var w = globalViewer();
            //    if(w) return w;
            //}
            var ui = that.getActiveFrame().ui; if(!ui) return undefined;
            var v = ui.rosViewer; if(!v) return undefined;
            return v.rosViewer;
        };
        this.add = function(m) {
            if(this.viewer()) this.viewer()[scene].add(m);
        };
        this.remove = function(m) {
            if(this.viewer()) this.viewer()[scene].remove(m);
        };
    };
    this.scene             = new CanvasProxy('scene');
    this.selectableObjects = new CanvasProxy('selectableObjects');
    this.backgroundScene   = new CanvasProxy('backgroundScene');
    
    this.init = function() {
        // Connect to ROS.
        iosOverlay({
            text: "Loading Knowledge Base"
          , spinner: createSpinner()
          , isSpinning: function() {
              return !that.isConnected || !that.isPrologConnected;
          }
          , onhide: function() {
              // Show overlay until an episode is selected
              if(requireEpisode && !that.episode.hasEpisode()) {
                that.showPageOverlay();
              }
          }
        });
        that.connect();
        
        that.episode = new KnowrobEpisode(that);
        if(options.category && options.episode)
            that.episode.setEpisode(options.category, options.episode);
        
        that.initAutoCompletion();
        that.createOverlay();
      
        setInterval(containerRefresh, 570000);
        containerRefresh();
    };
    
    function containerRefresh() {
        $.ajax({
            url: '/api/v1.0/refresh_by_session',
            type: "GET",
            contentType: "application/json",
            dataType: "json"
        });
    };

    this.connect = function () {
      that.ros = new ROSLIB.Ros({url : rosURL});
      that.ros.on('connection', function() {
          that.isConnected = true;
          console.log('Connected to websocket server.');
          if (authentication) {
              // Acquire auth token for current user and authenticate, then call registerNodes
              that.authenticate(authURL, that.registerNodes);
          } else {
              // No authentication requested, call registerNodes directly
              that.registerNodes();
              that.waitForJsonProlog();
          }
      });
      that.ros.on('close', function() {
          console.log('Connection to websocket server closed.');
          that.ros = undefined;
          setTimeout(that.connect, 500);
      });
      that.ros.on('error', function(error) {
          console.log('Error connecting to websocket server: ', error);
          if(that.ros) that.ros.close();
          that.ros = undefined;
          setTimeout(that.connect, 500);
      });
    };

    this.authenticate = function (authurl, then) {
        console.log("Acquiring auth token");
        // Call wsauth api to acquire auth token by existing user login session
        $.ajax({
            url: authurl,
            type: "GET",
            contentType: "application/json",
            dataType: "json"
        }).done( function (request) {
            if(!that.ros) {
                console.warn("Lost connection to ROS master.");
                return;
            }
            console.log("Sending auth token");
            that.ros.authenticate(request.mac,
                             request.client,
                             request.dest,
                             request.rand,
                             request.t,
                             request.level,
                             request.end);
            that.waitForJsonProlog();
            
            // If a callback function was specified, call it in the context of Knowrob class (that)
            if(then) {
                then.call(that);
            }
        });
    };
    
    this.registerNodes = function () {
      if(isRegistered) return;
      isRegistered = true;
      
      // Setup publisher that sends a dummy message in order to keep alive the socket connection
      {
          var interval = options.interval || 30000;
          // The topic dedicated to keep alive messages
          var keepAliveTopic = new ROSLIB.Topic({ ros : that.ros, name : '/keep_alive', messageType : 'std_msgs/Bool' });
          // A dummy message for the topic
          var keepAliveMsg = new ROSLIB.Message({ data : true });
          // Function that publishes the keep alive message
          var ping = function() { keepAliveTopic.publish(keepAliveMsg); };
          // Call ping at regular intervals.
          setInterval(ping, interval);
      };
    
      // topic used for publishing canvas snapshots
      that.snapshotTopic = new ROSLIB.Topic({
        ros : that.ros,
        name : '/openease/video/frame',
        messageType : 'sensor_msgs/Image'
      });
      
      // Setup a client to listen to TFs.
      tfClient = new ROSLIB.TFClient({
        ros : that.ros,
        angularThres : 0.01,
        transThres : 0.01,
        rate : 10.0,
        fixedFrame : '/my_frame'
      });

      // Setup the marker client.
      markerClient = new ROS3D.MarkerClient({
        ros : that.ros,
        tfClient : tfClient,
        topic : '/visualization_marker',
        sceneObjects : that.scene,
        selectableObjects : that.selectableObjects,
        backgroundObjects : that.backgroundScene
      });

      // Setup the marker array client.
      markerArrayClient = new ROS3D.MarkerArrayClient({
        ros : that.ros,
        tfClient : tfClient,
        topic : '/visualization_marker_array',
        sceneObjects : that.scene,
        selectableObjects : that.selectableObjects,
        backgroundObjects : that.backgroundScene,
        markerClient : markerClient,
        path : meshPath,
        on_dblclick: options.on_dblclick || that.on_marker_dblclick,
        on_contextmenu: options.on_contextmenu || that.on_marker_contextmenu,
        on_delete: options.on_marker_delete || that.on_marker_delete
      });

      // Setup the designator message client.
      designatorClient = new ROSLIB.Topic({
        ros : that.ros,
        name : '/logged_designators',
        messageType : 'designator_integration_msgs/Designator'
      });
      designatorClient.subscribe(function(message) {
        if(message.description.length==0) {
          console.warn("Ignoring empty designator.");
        }
        else {
          var designatorHtml = "";
          if(message.type==0) {
              designatorHtml += "OBJECT DESIGNATOR";
          }
          else if(message.type==1) {
              designatorHtml += "ACTION DESIGNATOR";
          }
          else if(message.type==2) {
              designatorHtml += "LOCATION DESIGNATOR";
          }
          else if(message.type==3) {
              designatorHtml += "HUMAN DESIGNATOR";
          }
          else {
              designatorHtml += "DESIGNATOR";
          }
          designatorHtml += format_designator(message.description);
          that.getActiveFrame().on_designator_received(designatorHtml);
        }
      });
        
      // Setup the image message client.
      imageClient = new ROSLIB.Topic({
        ros : that.ros,
        name : '/logged_images',
        messageType : 'std_msgs/String'
      });
      imageClient.subscribe(function(message) {
          var ext = message.data.substr(message.data.lastIndexOf('.') + 1);
          var url = message.data;
          if(!url.startsWith("/knowrob/")) url = '/knowrob/knowrob_data/'+url;
          
          var imageHeight, imageWidth;
          var html = '';
          if(ext=='jpg' || ext =='png') {
              html += '<div class="image_view">';
              html += '<img id="mjpeg_image" class="picture" src="'+url+'" width="300" height="240"/>';
              html += '</div>';
              
              imageHeight = function() { return document.getElementById('mjpeg_image').height; };
              imageWidth  = function() { return document.getElementById('mjpeg_image').width; };
          }
          else if(ext =='ogg' || ext =='ogv' || ext =='mp4') {
              html += '<div class="image_view">';
              html += '  <video id="mjpeg_image" controls autoplay loop>';
              html += '    <source src="'+url+'" ';
              if(ext =='ogg' || ext =='ogv') html += 'type="video/ogg" ';
              else if(ext =='mp4') html += 'type="video/mp4" ';
              html += '/>';
              html += 'Your browser does not support the video tag.';
              html += '</video></div>';
              
              imageHeight = function() { return document.getElementById('mjpeg_image').videoHeight; };
              imageWidth  = function() { return document.getElementById('mjpeg_image').videoWidth; };
          }
          else {
              console.warn("Unknown data format on /logged_images topic: " + message.data);
          }
          if(html.length>0) {
              that.getActiveFrame().on_image_received(html, imageWidth, imageHeight);
          }
      });

      cameraPoseClient = new ROSLIB.Topic({
        ros : that.ros,
        name : '/camera/pose',
        messageType : 'geometry_msgs/Pose'
      });
      cameraPoseClient.subscribe(function(message) {
          that.getActiveFrame().on_camera_pose_received(message);
      });
      
      for(var i in user_interfaces) {
          var frame = document.getElementById(user_interfaces[i].id+"-frame");
          if(frame && frame.contentWindow && frame.contentWindow.on_register_nodes)
              frame.contentWindow.on_register_nodes();
      }
      if(!document.getElementById(getActiveFrameName()+"-frame"))
          that.getActiveFrame().on_register_nodes();
    };
    
    this.waitForJsonProlog = function () {
        var client = new JsonProlog(that.ros, {});
        client.jsonQuery("true", function(result) {
            client.finishClient();
            if(result.error) {
                // Service /json_prolog/simple_query does not exist
                setTimeout(that.waitForJsonProlog, 500);
            }
            else {
                that.isPrologConnected = true;
                that.episode.selectMongoDB();
            }
        });
    };
    
    ///////////////////////////////
    //////////// Auto Completion for Prolog Predicates
    ///////////////////////////////
    
    this.queryPredicateNames = function() {
      if( ! prologNames ) {
        prolog = this.newProlog();
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
    };
    
    this.initAutoCompletion = function() {
        // Add completer for prolog code
        ace.require("ace/ext/language_tools").addCompleter({
            getCompletions: function(editor, session, pos, prefix, callback) {
                var names = that.queryPredicateNames();
                if( names ) {
                  callback(null, names.map(function(x) {
                      return {name: x, value: x, score: 100, meta: "pl"};
                  }));
                }
            }
        });
    };
    
    ///////////////////////////////
    //////////// Marker Visualization
    ///////////////////////////////
    
    this.newProlog = function() {
        return new JsonProlog(that.ros, {});
    };
    
    this.newCanvas = function(options) {
        return new KnowrobCanvas(that, options);
    };
    
    this.newDataVis = function(options) {
        return new DataVisClient(options);
    };
    
    this.newTaskTreeVis = function(options) {
        return new TaskTreeVisClient(options);
    };
    
    this.selectMarker = function(marker) {
        if(that.selectedMarker == marker.ns) return;
        
        if(that.selectedMarker) that.unselectMarker(that.selectedMarker);
        that.selectedMarker = marker.ns;
        
        var prolog = new JsonProlog(that.ros, {});
        prolog.jsonQuery("term_to_atom("+marker.ns+",MarkerName), "+
            "marker_highlight(MarkerName), marker_publish.",
            function(result) { prolog.finishClient(); });
    };
    
    this.unselectMarker = function() {
        var prolog = new JsonProlog(that.ros, {});
        prolog.jsonQuery("term_to_atom("+that.selectedMarker+",MarkerName), "+
            "marker_highlight_remove(MarkerName), marker_publish.",
            function(result) { prolog.finishClient(); });
        that.selectedMarker = undefined;
    };
    
    this.on_render = function(camera,scene) {
        if(that.getActiveFrame())
            that.getActiveFrame().on_render(camera,scene);
    };
    
    this.on_marker_dblclick = function(marker) {
        that.selectMarker(marker);
        if(that.getActiveFrame())
            that.getActiveFrame().on_marker_dblclick(marker);
    };
    
    this.on_marker_delete = function(ns) {
        if(ns === that.selectedMarker) {
            that.unselectMarker();
        }
        if(that.getActiveFrame())
            that.getActiveFrame().on_marker_delete(ns);
    };
    
    this.on_marker_contextmenu = function(marker) {
        if(that.getActiveFrame())
            that.getActiveFrame().on_marker_contextmenu(marker);
    };
    
    ///////////////////////////////
    //////////// Edisodes
    ///////////////////////////////
    
    this.setEpisode = function(category, episode) {
        that.episode.setEpisode(category, episode, that.on_episode_selected);
    };
    
    this.on_episode_selected = function(library) {
        if(that.getActiveFrame())
            that.getActiveFrame().on_episode_selected(library);
        that.hidePageOverlay();
    };
    
    ///////////////////////////////
    //////////// Frames
    ///////////////////////////////
    
    function showFrame(name, fading) {
        // Hide inactive frames
        for(var i in user_interfaces) {
            if(user_interfaces[i].id == name) continue;
            $("#"+user_interfaces[i].id+"-frame").hide();
            $("#"+user_interfaces[i].id+"-frame").removeClass("selected-frame");
            $("#"+user_interfaces[i].id+"-menu").removeClass("selected-menu");
        }
        // Show selected frame
        $("#"+name+"-frame").show();
        $("#"+name+"-frame").addClass("selected-frame");
        $("#"+name+"-menu").addClass("selected-menu");
        // Load menu items of active frame
        that.menu.updateFrameMenu(document.getElementById(name+"-frame").contentWindow);
    };
    
    this.getActiveFrame = function() {
        var frame = document.getElementById(getActiveFrameName()+"-frame");
        if(frame) return frame.contentWindow;
        else return window;
        //else return undefined;
    };
    
    function getActiveFrameName() {
      for(var i in user_interfaces) {
        if(urlQuery[user_interfaces[i].id]) return user_interfaces[i].id;
      }
      return "kb";
    };
    
    ///////////////////////////////
    //////////// URL Location
    ///////////////////////////////
    
    function updateQueryString() {
        urlQuery = {};
        var query = window.location.hash.substring(1);
        var vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            if (typeof urlQuery[pair[0]] === "undefined") {
                // If first entry with this name
                urlQuery[pair[0]] = decodeURIComponent(pair[1]);
            }
            else if (typeof urlQuery[pair[0]] === "string") {
                // If second entry with this name
                var arr = [ urlQuery[pair[0]],decodeURIComponent(pair[1]) ];
                urlQuery[pair[0]] = arr;
            }
            else {
                // If third or later entry with this name
                urlQuery[pair[0]].push(decodeURIComponent(pair[1]));
            }
        }
    };
    
    this.updateLocation = function() {
      updateQueryString();
      showFrame(getActiveFrameName());
    };
    
    ///////////////////////////////
    //////////// Frame Overlay
    ///////////////////////////////
    
    this.createOverlay = function() {
        // Create page iosOverlay
        var page = document.getElementById('page');
        if(page) {
            var pageOverlay = document.createElement("div");
            pageOverlay.setAttribute("id", "page-overlay");
            pageOverlay.className = "ui-ios-overlay ios-overlay-hide div-overlay";
            pageOverlay.innerHTML += '<span class="title">Please select an Episode</span';
            pageOverlay.style.display = 'none';
            page.appendChild(pageOverlay);
            var spinner = createSpinner();
            pageOverlay.appendChild(spinner.el);
        }
    };
    
    this.showPageOverlay = function() {
      var pageOverlay = document.getElementById('page-overlay');
      if(pageOverlay && !pageOverlayDisabled) {
          pageOverlay.style.display = 'block';
          pageOverlay.className = pageOverlay.className.replace("hide","show");
          pageOverlay.style.pointerEvents = "auto";
      }
    };
    
    this.hidePageOverlay = function() {
      var pageOverlay = document.getElementById('page-overlay');
      if(pageOverlay && !pageOverlayDisabled) {
          //pageOverlay.style.display = 'none';
          pageOverlay.className = pageOverlay.className.replace("show","hide");
          pageOverlay.style.pointerEvents = "none";
      }
    };
};