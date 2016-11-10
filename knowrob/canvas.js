/**
 * WebGL canvas for marker visualization.
 **/
function KnowrobCanvas(client, options){
    var that = this;
    
    // The canvas object
    this.rosViewer = new ROS3D.Viewer({
        divID : options.divID,
        width : 1920,
        height : 1080,
        antialias : true,
        background : options.background || '#ffffff',
        enableShadows: false,
        near: options.near || 0.01,
        far: options.far || 1000.0,
        on_render: client.on_render || options.on_render,
        on_window_dblclick: options.on_window_dblclick
    });
    // add some default objects to the scene
    this.rosViewer.scene.add(new ROS3D.Grid());
    
    this.resize = function (w,h) {
        console.info("RESIZE CANVAS " + w + " " + h);
        console.info("   RATIO " + (w/h));
      // update perspective projection
      this.rosViewer.resize(w, h);
    };
    
    /**
     * Create an image snapshot of this canvas, create a ROS image message
     * and send that message via dedicated topic to the server.
     **/
    this.snapshot = function (frameNumber, fps) {
      console.log("Publishing canvas snapshot frame:" + frameNumber + " fps:" + fps);
      
      var gl = this.rosViewer.renderer.getContext("webgl", {preserveDrawingBuffer: true});
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
      
      client.snapshotTopic.publish(msg);
    };
    
    ///////////////////////////////
    //////////// Camera
    ///////////////////////////////
    
    this.setCameraPose = function(pose) {
        that.setCameraPosition(pose.position);
        that.setCameraOrientation(pose.orientation);
    };
    
    this.setCameraPosition = function(position) {
        that.rosViewer.cameraControls.camera.position.x = position.x;
        that.rosViewer.cameraControls.camera.position.y = position.y;
        that.rosViewer.cameraControls.camera.position.z = position.z;
    };
    
    this.setCameraOrientation = function(orientation) {
        var orientation = new THREE.Quaternion(orientation.x, orientation.y,
                                               orientation.z, orientation.w);
        var frontVector = new THREE.Vector3(0, 0, 1);
        frontVector.applyQuaternion(orientation);
        that.rosViewer.cameraControls.center = that.rosViewer.cameraControls.camera.position.clone();
        that.rosViewer.cameraControls.center.add(frontVector);
    };
};
