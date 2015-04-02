/* global THREE */


function ComplexGeometry(scene, data_generator){
    "use strict";
    this.scene = scene;
    this.worker = new Worker('scripts/worker.js');
    this.data_generator = data_generator;
    this.geometry = new THREE.BufferGeometry();

    this.material = new THREE.MeshPhongMaterial( {color: 0x00ff00} );
    //this.material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
    this.mesh = new THREE.Mesh();
    this.mesh.name = 'landscape';
    this.mesh.material = this.material;
    this.geometry = new THREE.BufferGeometry();

    this.worker.addEventListener('message', function workerCallback(e) {
        console.log('Worker said: ', e.data);
        if(e.data.vertices && e.data.indexes){
          this.geometry.dispose();
          this.scene.remove(this.mesh.name);

          if(this.geometry.getAttribute( 'position' ) && this.geometry.getAttribute( 'index' ) &&
                          (this.geometry.getAttribute( 'position' ).length < e.data.vertices.length ||
                           this.geometry.getAttribute( 'index' ).length < e.data.indexes.length)){
            console.log('Replacing landscape geometry.');
            this.geometry = new THREE.BufferGeometry();
          }

          this.geometry.addAttribute( 'position', new THREE.BufferAttribute(e.data.vertices, 3 ) );
          this.geometry.addAttribute( 'index', new THREE.BufferAttribute(e.data.indexes, 1 ) );
          this.geometry.computeVertexNormals();

          this.mesh.geometry = this.geometry;

          this.scene.add(this.mesh);
        }
    }.bind(this), false);
    this.worker.onerror = function(e) {
      console.log("Error in file: "+e.filename+"\nline: "+e.lineno+"\nDescription: "+e.message);
    };
}

ComplexGeometry.prototype = {
    constructor: ComplexGeometry,
    AddArea: function(top_left, bottom_right, recursion){
        "use strict";
        this.data_generator.max_recursion = recursion;
        this.worker.postMessage(this.data_generator);
    },
    /*RemoveArea: function(top_left, bottom_right){
    },
    AddTile: function(corners){
    },
    RemoveTile: function(centre){
    }*/
};
