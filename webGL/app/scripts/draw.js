var MAPSIZE = 3600000;
var mouse = [.5, .5];
var renderer;
var mouseClick = false;
var viewPos = [MAPSIZE / 2, MAPSIZE / 2, MAPSIZE / 2];

window.onload = function() {
    var rootNode = Module.CreateMapRoot();
    Module.RaiseIslands(rootNode);
    console.log(rootNode);
    console.log(rootNode.parents);
    console.log(rootNode.parents.size());
    console.log(rootNode._children);
    console.log(rootNode._children.size());

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( 800, 600 );
    document.body.appendChild( renderer.domElement );

    var scene = new THREE.Scene();

    var camera = new THREE.PerspectiveCamera(
            90,             // Field of view
            800 / 600,      // Aspect ratio
            0.1,            // Near plane
            //1000,
            //10000           // Far plane
            MAPSIZE
            );
    camera.position.set( MAPSIZE/2, MAPSIZE/2, MAPSIZE/2 );
    var centreStage = new THREE.Vector3(MAPSIZE/2, MAPSIZE/2, 0);
    camera.lookAt( centreStage );

    // Background
    var meshes = [createBackground()];
    scene.add(meshes[meshes.length -1]);

    var geometry = new THREE.Geometry();

    for(var child = 0; child < rootNode._children.size(); ++child){
        if(rootNode._children.get(child).height && rootNode._children.get(child).populateProgress === 2){
            var childNode = rootNode._children.get(child);
            for(var grandChild = 0; grandChild < childNode._children.size(); ++grandChild){
                var newNode = createTile(childNode._children.get(grandChild));
                if(newNode){
                    meshes.push(newNode);
                    geometry.merge(meshes[meshes.length -1].geometry, meshes[meshes.length -1].matrix);
                    //scene.add(meshes[meshes.length -1]);
                }
            }
            for(var grandChild = 0; grandChild < childNode._corners.size(); ++grandChild){
                var newNode = createTile(childNode._corners.get(grandChild));
                if(newNode){
                    meshes.push(newNode);
                    geometry.merge(meshes[meshes.length -1].geometry, meshes[meshes.length -1].matrix);
                    //scene.add(meshes[meshes.length -1]);
                }
            }
        }
    }
    var allMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial( { color: 0x22AA33 } ) ) ;
    scene.add(allMesh);

    var light2 = new THREE.HemisphereLight( 0xF0F0F0, 0x202020, 1 ); // soft white light
    scene.add( light2 );

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
    var tile = new THREE.Shape();
    tile.moveTo(1, 1);
    tile.moveTo(MAPSIZE -1, 1);
    tile.moveTo(MAPSIZE -1, MAPSIZE -1);
    tile.moveTo(1, MAPSIZE -1);
    tile.moveTo(1, 1);

    var tileGeom = new THREE.ShapeGeometry(tile);
    var tileMesh = new THREE.Mesh(tileGeom, new THREE.MeshBasicMaterial( { color: 0x2233AA } ) ) ;

    return tileMesh;
}

function createTile(node){
    if(node._corners.size() < 3 || node.height <= 0){
        return;
    }
    var firstCornerCoordinate = null;
    var tile = new THREE.Shape();
    for(var cornerIndex = 0; cornerIndex < node._corners.size(); ++cornerIndex){
        var corner = node._corners.get(cornerIndex);
        if(!firstCornerCoordinate){
            firstCornerCoordinate = corner.coordinate;
        }
        tile.moveTo(corner.coordinate.x, corner.coordinate.y);
    }
    tile.moveTo(firstCornerCoordinate.x, firstCornerCoordinate.y);

    var tileGeom = new THREE.ShapeGeometry(tile);
    var tileMesh = new THREE.Mesh(tileGeom, new THREE.MeshBasicMaterial( { color: 0x228011 + (0x100 * Math.round(0xFF * Math.random()) / 2) } ) ) ;

    return tileMesh;
}
