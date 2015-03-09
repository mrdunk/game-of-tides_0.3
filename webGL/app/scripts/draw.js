var MAPSIZE = 3600000;
var mouse = [.5, .5];
var renderer;
var mouseClick = false;
var viewPos = [MAPSIZE / 2, MAPSIZE / 2, MAPSIZE / 2];

window.onload = function() {
    var rootNode = Module.CreateMapRoot();
    Module.RaiseIslands(rootNode);
    Module.DistanceFromShore(rootNode);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( 800, 600 );
    document.body.appendChild( renderer.domElement );

    var scene = new THREE.Scene();

    var camera = new THREE.PerspectiveCamera(
            90,             // Field of view
            800 / 600,      // Aspect ratio
            100,            // Near plane
            //1000,
            //10000           // Far plane
            MAPSIZE         // Far plane
            );
    camera.position.set( MAPSIZE/2, 0, MAPSIZE/2 );
    var centreStage = new THREE.Vector3(MAPSIZE/2, MAPSIZE/2, 0);
    camera.lookAt( centreStage );

    // Background
    var meshes = [createBackground()];
    scene.add(meshes[meshes.length -1]);

    var geometry = new THREE.Geometry();
    var wireframe = new THREE.Geometry();

    for(var child = 0; child < rootNode._children.size(); ++child){
        if(rootNode._children.get(child).height && rootNode._children.get(child).populateProgress === 2){
            var childNode = rootNode._children.get(child);
            for(var grandChild = 0; grandChild < childNode._children.size(); ++grandChild){
                var newNode = createTile(childNode._children.get(grandChild));
                if(newNode){
                    meshes.push(newNode);
                    geometry.merge(meshes[meshes.length -1], meshes[meshes.length -1].matrix);
                    //scene.add(meshes[meshes.length -1]);
                }
            }
            for(var grandChild = 0; grandChild < childNode._corners.size(); ++grandChild){
                var newNode = createTile(childNode._corners.get(grandChild));
                if(newNode){
                    meshes.push(newNode);
                    geometry.merge(meshes[meshes.length -1], meshes[meshes.length -1].matrix);
                    //scene.add(meshes[meshes.length -1]);
                }
            }
        }
    }
    var allMesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial( { color: 0x22AA33 } ) ) ;
    scene.add(allMesh);

    //var allWire = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial( { color: 0xFF0000, wireframe: true } ) ) ;
    //scene.add(allWire);

//    var light2 = new THREE.HemisphereLight( 0xF0F0F0, 0x202020, 1 ); // soft white light
//    scene.add( light2 );

    var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight.position.set( 0, 0, MAPSIZE );
    scene.add( directionalLight );

    render(meshes, scene, camera);

    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('mouseup', onMouseUp, false);
    window.addEventListener('keypress', onKeyPress, false);
};

function onMouseMove(ev){
    var x = 1 - (ev.clientX / window.innerWidth);
    var y = ev.clientY / window.innerHeight;

    if(mouseClick){
//        viewPos[2] += (y - mouse[1]) * MAPSIZE;
//    } else {
        viewPos[0] += (x - mouse[0]) * MAPSIZE;
        viewPos[1] += (y - mouse[1]) * MAPSIZE;
    }

    mouse = [x, y];
};

function onMouseDown(ev){
    mouseClick = true;
};

function onMouseUp(ev){
    mouseClick = false;
};

function onKeyPress(ev){
    if(ev.keyCode === 43 || ev.keyCode === 61){
        viewPos[2] /= 1.1;
    }
    if(ev.keyCode === 45){
        viewPos[2] *= 1.1;
    }

};
function render(meshes, scene, camera){
    requestAnimationFrame(function(){render(meshes, scene, camera);});
    stats.begin();

    //for(var meshItterator in meshes){
    //    meshes[meshItterator].rotation.x += 0.01;
    //}

    //camera.position.set( MAPSIZE * mouse[0], MAPSIZE * mouse[1], MAPSIZE/2 );
    camera.position.set(viewPos[0], viewPos[1], viewPos[2]);

    renderer.render( scene, camera );
    stats.end();
}

function createBackground(){
    /*var tile = new THREE.Shape();
    tile.moveTo(1, 1);
    tile.moveTo(MAPSIZE -1, 1);
    tile.moveTo(MAPSIZE -1, MAPSIZE -1);
    tile.moveTo(1, MAPSIZE -1);
    tile.moveTo(1, 1);

    var tileGeom = new THREE.ShapeGeometry(tile);
    var tileMesh = new THREE.Mesh(tileGeom, new THREE.MeshBasicMaterial( { color: 0x2233AA } ) ) ;
    
    return tileMesh;*/

    var tileGeom = new THREE.PlaneGeometry(MAPSIZE, MAPSIZE);
    var tileMesh = new THREE.Mesh(tileGeom, new THREE.MeshBasicMaterial( { color: 0x2233AA } ) ) ;
    tileMesh.position.y = MAPSIZE /2;
    tileMesh.position.x = MAPSIZE /2;
    tileMesh.position.z = -1;

    return tileMesh;
}

function createTile(node){
    if(node._corners.size() < 3 || node.height <= 0){
        return;
    }
    var tileGeometry = new THREE.Geometry();
    tileGeometry.vertices.push( new THREE.Vector3(node.coordinate.x, node.coordinate.y, node.height / 4) );
    for(var cornerIndex = 0; cornerIndex < node._corners.size(); ++cornerIndex){
        var height = 0;
        var corner = node._corners.get(cornerIndex);
        for(var neighbourIndex = 0; neighbourIndex < corner.parents.size(); ++neighbourIndex){
            var neighbour = Module.unordered_set_get(corner.parents, neighbourIndex);
            height += neighbour.height;
        }
        height /= corner.parents.size();
        tileGeometry.vertices.push( new THREE.Vector3(corner.coordinate.x, corner.coordinate.y, height / 4) );
        //tileGeometry.vertices.push( new THREE.Vector3(corner.coordinate.x, corner.coordinate.y, corner.height / 10) );
        if(tileGeometry.vertices.length > 2){
            tileGeometry.faces.push( new THREE.Face3( 0, tileGeometry.vertices.length -2, tileGeometry.vertices.length -1) );
        }
    }
    tileGeometry.faces.push( new THREE.Face3( 0, tileGeometry.vertices.length -1, 1) );

    tileGeometry.computeFaceNormals();
    tileGeometry.computeVertexNormals();
    return tileGeometry;
}
