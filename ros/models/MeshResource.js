/**
 * @author Jihoon Lee - jihoonlee.in@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A MeshResource is an THREE object that will load from a external mesh file. Currently loads
 * Collada files.
 *
 * @constructor
 * @param options - object with following keys:
 *
 *  * path (optional) - the base path to the associated models that will be loaded
 *  * resource - the resource file name to load
 *  * material (optional) - the material to use for the object
 *  * warnings (optional) - if warnings should be printed
 *  * loader (optional) - the Collada loader to use (e.g., an instance of ROS3D.COLLADA_LOADER
 *                        ROS3D.COLLADA_LOADER_2) -- defaults to ROS3D.COLLADA_LOADER_2
 */
ROS3D.MeshResource = function(options) {
  var that = this;
  options = options || {};
  var path = options.path || '/';
  var scale = options.scale || [1,1,1];
  var resource = options.resource;
  var material = options.material || null;
  this.warnings = options.warnings;
  var loaderType = options.loader || ROS3D.COLLADA_LOADER_2;
  
  this.options = options;

  THREE.Object3D.call(this);

  // check for a trailing '/'
  if (path.substr(path.length - 1) !== '/') {
    this.path += '/';
  }

  var uri = path + resource;
  var fileType = uri.substr(-4).toLowerCase();

  // check the type
  var loader;
  if (fileType === '.dae') {
    if (loaderType ===  ROS3D.COLLADA_LOADER) {
      loader = new THREE.ColladaLoader();
    } else {
      loader = new ColladaLoader2();
    }
    loader.log = function(message) {
      if (that.warnings) {
        console.warn(message);
      }
    };
    
    loader.load(uri, function colladaReady(collada) {
  
      // check for a scale factor in ColladaLoader2
      if(loaderType === ROS3D.COLLADA_LOADER_2 && collada.dae.asset.unit) {
        collada.scene.scale = new THREE.Vector3(
          scale[0]*collada.dae.asset.unit,
          scale[1]*collada.dae.asset.unit,
          scale[2]*collada.dae.asset.unit);
      }
      else {
        collada.scene.scale = new THREE.Vector3(scale[0], scale[1], scale[2]);
      }
      
      // Remember material defined in mesh in order to allow resetting
      // highlight material to mesh material.
      var setDefaultMaterial = function(node) {
          node.default_material = node.material;
          if (node.children) {
              for (var i = 0; i < node.children.length; i++) {
                  setDefaultMaterial(node.children[i]);
              }
          }
      };
      setDefaultMaterial(collada.scene);
      
      if(material !== null) {
        var setMaterial = function(node, material) {
          // NOTE(daniel): node.material.map is defined even if loading failed.
          // But texture size is set to zero then.
          // Don't use the mesh material if this is the case.
          var hasMap = false;
          if (node.material && node.material.map) {
            hasMap = (node.material.map.image.width * node.material.map.image.height) > 0;
          }
    
          if (!hasMap) {
            node.material = material;
            if (node.children) {
                for (var i = 0; i < node.children.length; i++) {
                    setMaterial(node.children[i], material);
                }
            }
          }
        };

        setMaterial(collada.scene, material);
      }

      that.add(collada.scene);
    });
  }
  else if (fileType === '.stl') {
    loader = new THREE.STLLoader();
    loader.addEventListener( 'error', function ( event ) {
      if (that.warnings) {
        console.warn(event.message);
      }
    });
    loader.addEventListener( 'load', function ( event ) {
  
      var geometry = event.content;
      geometry.computeFaceNormals();
      
      if(material == null) {
          material = new THREE.MeshPhongMaterial({
              color : 0x999999,
              blending : THREE.NormalBlending
          });
      }
      var mesh = new THREE.Mesh( geometry, material );
      mesh.default_material = material;
      that.add(mesh);
    } );
    loader.load(uri);
  }
};
ROS3D.MeshResource.prototype.__proto__ = THREE.Object3D.prototype;
