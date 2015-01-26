/**
 * @author David Gossow - dgossow@willowgarage.com
 * @author Russell Toris - rctoris@wpi.edu
 * @author Jihoon Lee - jihoonlee.in@gmail.com
 */

/**
 * A Viewer can be used to render an interactive 3D scene to a HTML5 canvas.
 *
 * @constructor
 * @param options - object with following keys:
 *
 *  * divID - the ID of the div to place the viewer in
 *  * width - the initial width, in pixels, of the canvas
 *  * height - the initial height, in pixels, of the canvas
 *  * background (optional) - the color to render the background, like '#efefef'
 *  * antialias (optional) - if antialiasing should be used
 *  * intensity (optional) - the lighting intensity setting to use
 *  * cameraPosition (optional) - the starting position of the camera
 */
ROS3D.Viewer = function(options) {
  var that = this;
  options = options || {};
  var divID = options.divID;
  var width = options.width;
  var height = options.height;
  var background = options.background || '#111111';
  var antialias = options.antialias || true;
  var intensity = options.intensity || 0.2;
  var near = options.near || 0.1;
  var far = options.far || 1000;
  var cameraPosition = options.cameraPose || {
    x : 3,
    y : 3,
    z : 3
  };

  // create the canvas to render to
  this.renderer = new THREE.WebGLRenderer({
    antialias : antialias
    //, preserveDrawingBuffer : true
  });
  this.renderer.setClearColor(parseInt(background.replace('#', '0x'), 16), 1.0);
  this.renderer.sortObjects = false;
  this.renderer.setSize(width, height);
  this.renderer.autoClear = false;
  
  if(options.enableShadows) {
      this.renderer.shadowMapEnabled = true;
      this.renderer.shadowMapSoft = true;
      this.renderer.shadowMapType = THREE.PCFSoftShadowMap;
  }
  else {
      this.renderer.shadowMapEnabled = false;
  }
  
  // create the global scene
  this.scene = new THREE.Scene();
  // create the global scene for HUD
  this.sceneOrtho = new THREE.Scene();

  // create the global camera
  this.camera = new THREE.PerspectiveCamera(40, width / height, near, far);
  this.camera.position.x = cameraPosition.x;
  this.camera.position.y = cameraPosition.y;
  this.camera.position.z = cameraPosition.z;
  // add controls to the camera
  this.cameraControls = new ROS3D.OrbitControls({
    scene : this.scene,
    camera : this.camera
  });
  this.cameraControls.userZoomSpeed = 0.5;
  
  // create the global camera with orthogonal projection
  this.cameraOrtho = new THREE.OrthographicCamera( - width / 2, width / 2, height / 2, - height / 2, 1, 10 );
  this.cameraOrtho.position.z = 10;

  // lights
  this.scene.add(new THREE.AmbientLight(0x555555));
  
  this.directionalLight = new THREE.DirectionalLight(0xffffff, intensity);
  that.directionalLight.position = new THREE.Vector3(-1, -1, 1);
  that.directionalLight.position.normalize();
  /*
  if(options.enableShadows) {
      this.directionalLight.castShadow = true;
      this.directionalLight.shadowMapWidth = this.directionalLight.shadowMapHeight = 4096;
      this.directionalLight.shadowCameraNear = 1;
      this.directionalLight.shadowCameraFar = 50;
      this.directionalLight.shadowCameraLeft = -5;
      this.directionalLight.shadowCameraRight = 5;
      this.directionalLight.shadowCameraTop = 5;
      this.directionalLight.shadowCameraBottom = -5;
  }
  */
  this.scene.add(this.directionalLight);
  
  this.spotLight = new THREE.SpotLight( 0xffffcc, 0.9 );
  this.spotLight.position.set( 0, 0, 10 );
  this.spotLight.target.position.set( 0, 0, 0 );
  this.spotLight.angle = Math.PI;
  this.spotLight.exponent = 1;
  if(options.enableShadows) {
      this.spotLight.castShadow = true;
      this.spotLight.shadowMapWidth = this.directionalLight.shadowMapHeight = 4096;
      this.spotLight.shadowCameraNear = 1;
      this.spotLight.shadowCameraFar = 50;
  }
  this.scene.add( this.spotLight );

  // propagates mouse events to three.js objects
  this.selectableObjects = new THREE.Object3D();
  this.scene.add(this.selectableObjects);
  var mouseHandler = new ROS3D.MouseHandler({
    renderer : this.renderer,
    camera : this.camera,
    rootObject : this.selectableObjects,
    fallbackTarget : this.cameraControls
  });

  // highlights the receiver of mouse events
  this.highlighter = new ROS3D.Highlighter({
    mouseHandler : mouseHandler
  });

  /**
   * Renders the associated scene to the viewer.
   */
  function draw() {
    // update the controls
    that.cameraControls.update();

    // put light to the top-left of the camera
    //that.directionalLight.position = that.camera.localToWorld(new THREE.Vector3(-1, 1, 0));
    //that.directionalLight.position.normalize();

    // set the scene
    that.renderer.clear(true, true, true);
    that.renderer.render(that.scene, that.camera);

    // render any mouseovers
    that.highlighter.renderHighlight(that.renderer, that.scene, that.camera);

    // draw the frame
    requestAnimationFrame(draw);
    
    // draw HUD
    that.renderer.render(that.sceneOrtho, that.cameraOrtho);
  }

  // add the renderer to the page
  document.getElementById(divID).appendChild(this.renderer.domElement);

  // begin the animation
  draw();
};

/**
 * Add the given THREE Object3D to the global scene in the viewer.
 *
 * @param object - the THREE Object3D to add
 * @param selectable (optional) - if the object should be added to the selectable list
 */
ROS3D.Viewer.prototype.addObject = function(object, selectable) {
  if (selectable) {
    this.selectableObjects.add(object);
  } else {
    this.scene.add(object);
  }
};
