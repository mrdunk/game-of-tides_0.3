

function ComplexGeometry(data_generator){
    "use strict";
    this.worker = new Worker('scripts/worker.js');
    this.data_generator = data_generator;
    this.geometry = new THREE.BufferGeometry();

    this.worker.addEventListener('message', function(e) {
        console.log('Worker said: ', e.data);
    }, false);

    //this.worker.postMessage('Hello World');
    this.worker.postMessage('arrayBuffer', ['arrayBuffer']);
}

ComplexGeometry.prototype = {
    constructor: ComplexGeometry,
    AddArea: function(top_left, bottom_right, recursion){
        "use strict";

        var time_in = Date.now();
        var vertices_temp = [];
        var indexes_temp = [];
        var current_index = 0;
        var shape = this.data_generator.next();
        while(shape){
            var centre_index = current_index;
            var last_index = false;
            var first_index = false;
            var index;
            for(var point_index in shape){
                index = current_index;
                if(centre_index != index){
                    if(!first_index){
                        first_index = index;
                    }
                    if(last_index){
                        indexes_temp.push(centre_index, index, last_index);
                    }
                    last_index = index;
                }
                current_index++;

                vertices_temp.push(shape[point_index][0]);  // x
                vertices_temp.push(shape[point_index][1]);  // y
                vertices_temp.push(shape[point_index][2]);  // z
            }
            indexes_temp.push(centre_index, first_index, last_index);
            shape = this.data_generator.next();
        }
        console.log(Date.now() - time_in, 'ms');

        time_in = Date.now();
        this.geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(vertices_temp), 3 ) );
        this.geometry.addAttribute( 'index', new THREE.BufferAttribute( new Uint32Array( indexes_temp ), 1 ) );
        console.log(Date.now() - time_in, 'ms');

        time_in = Date.now();
        this.geometry.computeBoundingSphere();
        this.geometry.computeVertexNormals();
        console.log(Date.now() - time_in, 'ms');

        time_in = Date.now();
        //var material = new THREE.MeshBasicMaterial( { color: 0x00ff00, wireframe: true } );
        var material = new THREE.MeshBasicMaterial( { color: 0x00ff00} );
        var mesh = new THREE.Mesh( this.geometry, material );
        
        var parent_node = new THREE.Object3D();
        parent_node.add(mesh);
        console.log(Date.now() - time_in, 'ms');

        return parent_node;
    },
    AddAreaWorker: function(top_left, bottom_right, recursion){
        "use strict";
        this.worker.postMessage();
    },
    RemoveArea: function(top_left, bottom_right){
    },
    AddTile: function(corners){
    },
    RemoveTile: function(centre){
    },
    PointToHashKey: function(centre){
        "use strict";
        return centre[0].slice(0, 2).join();
    },
};


function TestDataGenerator(width, height, point_density){
    "use strict";
    this.width = width;
    this.height = height;
    this.point_density = point_density;
}

TestDataGenerator.prototype = {
    TestDataGenerator: ComplexGeometry,
    next: function(){
        "use strict";
        if(this.generator_x === undefined){
            this.space_between = this.width / this.point_density;
            if(this.height / this.point_density > this.space_between){
                this.space_between = this.height / this.point_density;
            }
            this.generator_x = this.space_between /2;
            this.generator_y = this.space_between /2;
        }
        var z = 1000;

        while(this.generator_x < this.width + this.space_between /2){
            while(this.generator_y < this.height + this.space_between /2){
                var shape = [];
                shape.push([this.generator_x, this.generator_y, z]);
                var points = Math.floor((Math.random() * 8) + 3);
                for(var p = 0; p < Math.PI *2; p += Math.PI * 2 / points){
                    shape.push([this.generator_x + (Math.sin(p) * this.space_between /4), this.generator_y + (Math.cos(p) * this.space_between /4), z]);
                }
                this.generator_y += this.space_between;
                return shape;
            }
            this.generator_y = this.space_between /2;
            this.generator_x += this.space_between;
        }
    },
    reset: function(){
        "use strict";
        this.generator_x = null;
        this.generator_y = null;
    }
};
