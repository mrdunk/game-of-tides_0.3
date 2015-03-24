/* global THREE */
/* global stats */
/* global Module */

var MAPSIZE = 3600000;


var TERRAIN_UNDEFINED = 0;
var TERRAIN_SEA = 1;
var TERRAIN_SHALLOWS = 2;
var TERRAIN_SHORE = 3;
var TERRAIN_LAND = 4;
var TERRAIN_ROOT = 99;


var NODE_UNINITIALISED = 0;
var NODE_PARTIAL = 1;
var NODE_COMPLETE = 2;


var mouse = new THREE.Vector2(0.5, 0.5);
var renderer;
var mouseClick = false;
var cameraPositionDiff = new THREE.Vector3( 0, 0, 0 );
var cameraAngleDiff  = new THREE.Vector2( 0, -Math.PI/2 );
var frameCounter = 0;
var showWireframe = false;


var GRASS = new THREE.MeshLambertMaterial( { color: 0x22AA33 } );
GRASS.side = THREE.BackSide;

var BEACH = new THREE.MeshLambertMaterial( { color: 0xFFCC00 } );
BEACH.side = THREE.BackSide;

var TEST = new THREE.MeshLambertMaterial( { color: 0xFF0000 } );

var SKY = 0xAAAABB;
var MAX_VIEW_DISTANCE = MAPSIZE ;

var settingsWindow;

window.onload = function() {
    "use strict";
    settingsWindow = document.getElementById('settingsWindow');

    var rootNode = Module.CreateMapRoot();
    Module.RaiseIslands(rootNode);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( SKY );

    document.body.appendChild( renderer.domElement );

    var scene = new THREE.Scene();
    //scene.fog = new THREE.FogExp2( 0xefd1b5, 10 / MAX_VIEW_DISTANCE );
    scene.fog = new THREE.Fog( SKY, 1, MAX_VIEW_DISTANCE );

    var camera = new THREE.PerspectiveCamera(
            90,             // Field of view
            window.innerWidth / window.innerHeight,      // Aspect ratio
            100,            // Near plane
            MAX_VIEW_DISTANCE // Far plane
            );
    camera.position.set( MAPSIZE/2, MAPSIZE/2, MAX_VIEW_DISTANCE / 2 );

    // Background
    var meshes = [createBackground()];
    scene.add(meshes[meshes.length -1]);

    console.log("Generating geometry...");
    var grass_geometry = new THREE.Geometry();
    var beach_geometry = new THREE.Geometry();
    var testobject_geometry = new THREE.BoxGeometry( 1000, 1000, 1000 );
    var grassMesh = new THREE.Mesh(grass_geometry, GRASS );
    var beachMesh = new THREE.Mesh(beach_geometry, BEACH );
    var testobjectMesh = new THREE.Mesh(testobject_geometry, TEST );
    meshes.push(testobjectMesh);
    scene.add(grassMesh);
    scene.add(beachMesh);
    scene.add(testobjectMesh);

    var grassWire = new THREE.Mesh(grass_geometry, new THREE.MeshBasicMaterial( { color: 0xFF0000, wireframe: true } ) ) ;
    var beachWire = new THREE.Mesh(beach_geometry, new THREE.MeshBasicMaterial( { color: 0xFF0000, wireframe: true } ) ) ;
    scene.add(grassWire);
    scene.add(beachWire);

    for(var child = 0; child < rootNode._children.size(); ++child){
        var childNode = rootNode._children.get(child);
        if(childNode.populateProgress === 2){
            var grandChild, newNode;
            for(grandChild = 0; grandChild < childNode._children.size(); ++grandChild){
                newNode = createTile(childNode._children.get(grandChild));
                meshes.push(newNode);
                if(childNode.height < MAPSIZE / 100 && childNode.scenery < 200){
                //if(childNode.terrain === TERRAIN_SHORE){
                    beach_geometry.merge(meshes[meshes.length -1], meshes[meshes.length -1].matrix);
                } else {
                    grass_geometry.merge(meshes[meshes.length -1], meshes[meshes.length -1].matrix);
                }
            }
            for(grandChild = 0; grandChild < childNode._corners.size(); ++grandChild){
                newNode = createTile(childNode._corners.get(grandChild));
                meshes.push(newNode);
                grass_geometry.merge(meshes[meshes.length -1], meshes[meshes.length -1].matrix);
            }
        }
    }
    console.log("done.");

//    var light2 = new THREE.HemisphereLight( 0xF0F0F0, 0x202020, 1 ); // soft white light
//    scene.add( light2 );

    var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight.position.set( 0, 0, MAPSIZE );
    scene.add( directionalLight );

    render(meshes, scene, camera);

    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('mouseup', onMouseUp, false);
    window.addEventListener('keydown', onKeyPress, false);
};

function onMouseMove(event){
    "use strict";
    //var x = 0.5 - (ev.clientX / window.innerWidth);
    //var y = 0.5 - (ev.clientY / window.innerHeight);
    //mouse.set(x, y);
    
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function onMouseDown(ev){
    "use strict";
    mouseClick = true;
}

function onMouseUp(ev){
    "use strict";
    mouseClick = false;
}

function onKeyPress(ev){
    "use strict";
    console.log(ev.keyCode);
    if(ev.keyCode === 187){
        // +
        cameraPositionDiff.z = -MAPSIZE/100;
    }
    if(ev.keyCode === 189){
        // -
        cameraPositionDiff.z = MAPSIZE/100;
    }
    if(ev.keyCode === 37){
        // left arrow
    }
    if(ev.keyCode === 38){
        // up arrow
    }
    if(ev.keyCode === 39){
        // right arrow
    }
    if(ev.keyCode === 40){
        // down arrow
    }
    if(ev.keyCode === 32){
        // space
        showWireframe = !showWireframe;
    }
}


var mouseVector = new THREE.Vector3();
var raycaster = new THREE.Raycaster();

function ProjectMose(camera, scene){
    "use strict";
    // update the picking ray with the camera and mouse position    
    raycaster.setFromCamera( mouse, camera );   

    // calculate objects intersecting the picking ray
    var intersects = raycaster.intersectObjects( scene.children );

    for ( var intersect in intersects ) {
        if(intersects[intersect].object.material.oldColor){
            intersects[intersect].object.material.color = intersects[intersect].object.material.oldColor;
            delete intersects[intersect].object.material.oldColor;
        } else {
            intersects[intersect].object.material.oldColor = intersects[intersect].object.material.color;
            intersects[intersect].object.material.color = new THREE.Color( 0xFFFFFF );
        }
        
    }
}


var target_position = new THREE.Vector3( 0, 0, 0 );
var up = new THREE.Vector3(0,0,1);

function look(camera, scene){
    "use strict";

    var tempMouse = mouse.clone();

    cameraAngleDiff.add(tempMouse.divideScalar(100));
    cameraAngleDiff.y = THREE.Math.clamp(cameraAngleDiff.y, -Math.PI/2 +0.01, Math.PI/2);

    camera.up = up;
    target_position.x = camera.position.x + 100 * Math.cos( cameraAngleDiff.y ) * Math.sin( cameraAngleDiff.x );
    target_position.y = camera.position.y + 100 * Math.cos( cameraAngleDiff.y ) * Math.cos( cameraAngleDiff.x );
    target_position.z = camera.position.z + 100 * Math.sin( cameraAngleDiff.y );
    camera.lookAt(target_position);

    if(mouseClick){
        camera.translateZ( -MAPSIZE/1000 );
    }

    camera.position.z = THREE.Math.clamp(camera.position.z, 0, MAPSIZE);
}

function render(meshes, scene, camera){
    "use strict";
    requestAnimationFrame(function(){render(meshes, scene, camera);});
    stats.begin();

    look(camera, scene);
    camera.position.addVectors(camera.position, cameraPositionDiff);
    cameraPositionDiff.set(0,0,0);

    if(frameCounter % 60 === 0){
        //ProjectMose(camera, scene);
        meshes[1].position.setX(camera.position.x);
        meshes[1].position.setY(camera.position.y);

        scene.children[4].visible = showWireframe;
        scene.children[5].visible = showWireframe;

        settingsWindow.setAttribute('contents', ['position.x', Math.round(camera.position.x)]);
        settingsWindow.setAttribute('contents', ['position.y', Math.round(camera.position.y)]);
        settingsWindow.setAttribute('contents', ['position.z', Math.round(camera.position.z)]);
    }

    renderer.render( scene, camera );

    frameCounter += 1;

    stats.end();
}

function createBackground(){
    "use strict";
    var tileGeom = new THREE.PlaneGeometry(MAPSIZE, MAPSIZE);
    var tileMesh = new THREE.Mesh(tileGeom, new THREE.MeshBasicMaterial( { color: 0x2233AA } ) ) ;
    tileMesh.position.y = MAPSIZE /2;
    tileMesh.position.x = MAPSIZE /2;
    tileMesh.position.z = -100;

    return tileMesh;
}

function createTile(node){
    "use strict";
    //console.log(node.recursion, node.terrain, node._corners.size());
    var tileGeometry = new THREE.Geometry();

    if(node.terrain >= TERRAIN_SHORE){
        if(node.populateProgress != NODE_COMPLETE){
            if(node._corners.size() >= 3){
                tileGeometry.vertices.push( new THREE.Vector3(node.coordinate.x, MAPSIZE - node.coordinate.y, node.height) );
                var verticesStartLength = tileGeometry.vertices.length -1;
                for(var cornerIndex = 0; cornerIndex < node._corners.size(); ++cornerIndex){
                    var cornerNode = node._corners.get(cornerIndex);

                    if(cornerNode.height > MAPSIZE){
                        // Something has gone very wrong with this node so just bail.
                        return new THREE.Geometry();
                    }

                    tileGeometry.vertices.push( new THREE.Vector3(cornerNode.coordinate.x, MAPSIZE - cornerNode.coordinate.y, cornerNode.height) );
                    if(tileGeometry.vertices.length > 2){
                        tileGeometry.faces.push( new THREE.Face3( verticesStartLength, tileGeometry.vertices.length -2, tileGeometry.vertices.length -1) );
                    }
                }
                tileGeometry.faces.push( new THREE.Face3( verticesStartLength, tileGeometry.vertices.length -1, verticesStartLength +1) );

                tileGeometry.computeFaceNormals();
                tileGeometry.computeVertexNormals();
            } else {
                console.log(node);
            }
        }
    }

    return tileGeometry;
}

function createTestObject(){

}
