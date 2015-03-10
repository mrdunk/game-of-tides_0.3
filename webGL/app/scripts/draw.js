var MAPSIZE = 3600000;
var mouse = [.5, .5];
var renderer;
var mouseClick = false;
var cameraPositionDiff = new THREE.Vector3( 0, 0, 0 );
//var cameraRotation = new THREE.Euler( 0, 0, 0, 'XYZ' );

window.onload = function() {
    var rootNode = Module.CreateMapRoot();
    Module.RaiseIslands(rootNode);
    Module.DistanceFromShore(rootNode);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild( renderer.domElement );

    var scene = new THREE.Scene();

    var camera = new THREE.PerspectiveCamera(
            90,             // Field of view
            window.innerWidth / window.innerHeight,      // Aspect ratio
            1000,            // Near plane
            MAPSIZE         // Far plane
            );

    camera.position.set( MAPSIZE/2, MAPSIZE/2, MAPSIZE/2 );
//    camera.up = new THREE.Vector3(0,0,1);
//    var centreStage = new THREE.Vector3(MAPSIZE/2, MAPSIZE/2, 0);
//    camera.lookAt( centreStage );

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
                }
            }
            for(var grandChild = 0; grandChild < childNode._corners.size(); ++grandChild){
                var newNode = createTile(childNode._corners.get(grandChild));
                if(newNode){
                    meshes.push(newNode);
                    geometry.merge(meshes[meshes.length -1], meshes[meshes.length -1].matrix);
                }
            }
        }
    }
    var allMesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial( { color: 0x22AA33 } ) ) ;
    scene.add(allMesh);

    var allWire = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial( { color: 0xFF0000, wireframe: true } ) ) ;
    scene.add(allWire);

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
    var x = 0.5 - (ev.clientX / window.innerWidth);
    var y = 0.5 - (ev.clientY / window.innerHeight);


    if(mouseClick){
        //cameraViewPos[0] += (x - mouse[0]) * MAPSIZE;
        //cameraViewPos[1] += (y - mouse[1]) * MAPSIZE;
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
        //cameraViewPos[2] /= 1.1;
        cameraPositionDiff.z = -MAPSIZE/100;
    }
    if(ev.keyCode === 45){
        //cameraViewPos[2] *= 1.1;
        cameraPositionDiff.z = MAPSIZE/100;
    }

};

var target_position = new THREE.Vector3( 0, 0, 0 );
var up = new THREE.Vector3(0,0,1);
var target_x = 0;
var target_y = 0;

function look(camera, scene){

    target_x -= mouse[0] /100;
    target_y += mouse[1] /100;
    target_y = THREE.Math.clamp(target_y, -Math.PI/2 +0.01, Math.PI/2);

    camera.up = up;
    target_position.x = camera.position.x + 100 * Math.cos( target_y ) * Math.sin( target_x );
    target_position.y = camera.position.y + 100 * Math.cos( target_y ) * Math.cos( target_x );
    target_position.z = camera.position.z + 100 * Math.sin( target_y );
    camera.lookAt(target_position);

    if(mouseClick){
        camera.translateZ( -MAPSIZE/1000 );
    }
}

function render(meshes, scene, camera){
    requestAnimationFrame(function(){render(meshes, scene, camera);});
    stats.begin();

    look(camera, scene);
    camera.position.addVectors(camera.position, cameraPositionDiff);
    cameraPositionDiff.set(0,0,0);
    //camera.position.set(cameraViewPos[0], cameraViewPos[1], cameraViewPos[2]);

    renderer.render( scene, camera );
    stats.end();
}

function createBackground(){
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
    var height = node.height;
    var heightCount = 0;
    if(height === MAPSIZE){
        height = 4;
    }
    tileGeometry.vertices.push( new THREE.Vector3(node.coordinate.x, node.coordinate.y, height / 4) );
    for(var cornerIndex = 0; cornerIndex < node._corners.size(); ++cornerIndex){
        var corner = node._corners.get(cornerIndex);
        if(corner.height < MAPSIZE && corner.height > 0){
            height = corner.height;
        } else {
            height = 0;
            heightCount = 0;
            for(var neighbourIndex = 0; neighbourIndex < corner.parents.size(); ++neighbourIndex){
                var neighbour = Module.unordered_set_get(corner.parents, neighbourIndex);
                if(neighbour.height < MAPSIZE){
                    height += neighbour.height;
                    heightCount += 1;
                }
            }
            height /= heightCount;
        }
        tileGeometry.vertices.push( new THREE.Vector3(corner.coordinate.x, corner.coordinate.y, height / 4) );
        if(tileGeometry.vertices.length > 2){
            tileGeometry.faces.push( new THREE.Face3( 0, tileGeometry.vertices.length -2, tileGeometry.vertices.length -1) );
        }
    }
    tileGeometry.faces.push( new THREE.Face3( 0, tileGeometry.vertices.length -1, 1) );

    tileGeometry.computeFaceNormals();
    tileGeometry.computeVertexNormals();
    return tileGeometry;
}
