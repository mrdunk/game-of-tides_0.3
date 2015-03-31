

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

          console.log(e.data);

          this.geometry.addAttribute( 'position', new THREE.BufferAttribute(e.data.vertices, 3 ) );
          this.geometry.addAttribute( 'index', new THREE.BufferAttribute(e.data.indexes, 1 ) );
          this.geometry.computeVertexNormals();

          this.mesh.geometry = this.geometry;

          this.scene.add(this.mesh);
        }
    }.bind(this), false);
}

ComplexGeometry.prototype = {
    constructor: ComplexGeometry,
    AddArea: function(top_left, bottom_right, recursion){
        "use strict";
        this.worker.postMessage(this.data_generator);
    },
    RemoveArea: function(top_left, bottom_right){
    },
    AddTile: function(corners){
    },
    RemoveTile: function(centre){
    }
};
