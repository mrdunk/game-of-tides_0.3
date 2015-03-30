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
var zeroVector = new THREE.Vector3( -1, -1, -1 );
var zeroVector2 = new THREE.Vector3( -2, -2, -2 );

var GRASS = new THREE.MeshLambertMaterial( { color: 0x22AA33 } );
GRASS.side = THREE.BackSide;

var TEST = new THREE.MeshLambertMaterial( { color: 0xFF0000 } );

var SKY = 0xAAAABB;
var MAX_VIEW_DISTANCE = MAPSIZE ;


var land_geometry = new THREE.Geometry();
var land_geometries = {};
var other_geometries = {};
var removed_geometries = {};

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
    other_geometries.background = createBackground();
    scene.add(other_geometries.background);

    console.log("Generating geometry...");
    
    // Create a test object and add it to the scene.
    var testobject_geometry = new THREE.BoxGeometry( 1000, 1000, 1000 );
    var testobjectMesh = new THREE.Mesh(testobject_geometry, TEST );
    other_geometries.testobject = testobjectMesh;
    scene.add(testobjectMesh);

    var land_mesh = new THREE.Mesh(land_geometry, GRASS );
    scene.add(land_mesh);


    var land_wire = new THREE.Mesh(land_geometry, new THREE.MeshBasicMaterial( { color: 0xFF0000, wireframe: true } ) ) ;
    scene.add(land_wire);

    tileArea(rootNode, 3, 2000);

    console.log("done.");

//    var light2 = new THREE.HemisphereLight( 0xF0F0F0, 0x202020, 1 ); // soft white light
//    scene.add( light2 );

    var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight.position.set( 0, 0, MAPSIZE );
    scene.add( directionalLight );

    render(land_geometries, other_geometries, rootNode, scene, camera);

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
        cameraPositionDiff.z = -1;
    }
    if(ev.keyCode === 189){
        // -
        cameraPositionDiff.z = 1;
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

function look(camera, scene, speed){
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
        camera.translateZ( -speed / 10 );
    }

    camera.position.z = THREE.Math.clamp(camera.position.z, 0, MAPSIZE);
}

var lastTimeInMs = Date.now();

function render(land_geometries, other_geometries, rootNode, scene, camera){
    "use strict";

    // Queue up the next frame.
    requestAnimationFrame(function(){render(land_geometries, other_geometries, rootNode, scene, camera);});

    // Stats widget. Displays fps, etc.
    stats.begin();

    var timeInMs = Date.now();
    var timeDiffInMs = timeInMs - lastTimeInMs;
    lastTimeInMs = timeInMs;

    //tileArea(rootNode, 3, 30);

    var speed = camera.position.z * timeDiffInMs / 60;

    look(camera, scene, speed);
    cameraPositionDiff.multiplyScalar(speed);
    camera.position.addVectors(camera.position, cameraPositionDiff);
    cameraPositionDiff.set(0,0,0);

    if(frameCounter % 60 === 0){
        //ProjectMose(camera, scene);
        other_geometries.testobject.position.setX(camera.position.x);
        other_geometries.testobject.position.setY(camera.position.y);

        scene.children[3].visible = showWireframe;

        settingsWindow.setAttribute('contents', ['position.x', Math.round(camera.position.x)]);
        settingsWindow.setAttribute('contents', ['position.y', Math.round(camera.position.y)]);
        settingsWindow.setAttribute('contents', ['position.z', Math.round(camera.position.z)]);
        settingsWindow.setAttribute('contents', ['speed', Math.round(speed * 100) / 100]);
    }

    // These only need done if the geometry has changed.
    if(land_geometry.dirty){
        land_geometry.dirty = false;
        land_geometry.computeFaceNormals();
        land_geometry.computeVertexNormals();
    }

    // Test removeGeometry() by calling it on all nodes.
    for (var first in land_geometries) {
        if(first.split(',').length === 2){
            var nodex = first.split(',')[0];
            var nodey = first.split(',')[1];
            if(Math.abs(camera.position.x - nodex) > camera.position.z || Math.abs((MAPSIZE - camera.position.y) - nodey) > camera.position.z){
                removeGeometry(first);
                break;
            }
        }
    }
    restructureGeometry();

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

var open_list = [];
var closed_set = {};

function tileArea(start_node, max_recursion, cycle_time){
    "use strict";
    console.log('@@@', open_list.length);

    var start_time = Date.now();

    if(!open_list.length){
        if(!closed_set[[start_node.coordinate.x, start_node.coordinate.y, start_node.recursion]]){
            closed_set[[start_node.coordinate.x, start_node.coordinate.y, start_node.recursion]] = true;
            open_list.push(start_node);
        }
    }
    while(open_list.length && start_time + cycle_time > Date.now()){
        var working_node = open_list.pop();
        if(working_node.populateProgress === 2 && max_recursion > working_node.recursion){
            for(var child_itterator = 0; child_itterator < working_node._children.size(); ++child_itterator){
                var child = working_node._children.get(child_itterator);
                if(!closed_set[[child.coordinate.x, child.coordinate.y, child.recursion]]){
                    closed_set[[child.coordinate.x, child.coordinate.y, child.recursion]] = true;
                    open_list.push(child);
                }
            }
            for(var corner_itterator = 0; corner_itterator < working_node._corners.size(); ++corner_itterator){
                var corner = working_node._corners.get(corner_itterator);
                if(!closed_set[[corner.coordinate.x, corner.coordinate.y, corner.recursion]]){
                    closed_set[[corner.coordinate.x, corner.coordinate.y, corner.recursion]] = true;
                    open_list.push(corner);
                }
            }
        } else {
            createTile(working_node);
        }
    }
    console.log(open_list.length, land_geometry.vertices.length, land_geometry.faces.length);
}

function createTile(node){
    "use strict";
    
    if(typeof land_geometries[[node.coordinate.x, node.coordinate.y]] === 'object'){
        // Already have this node.
        // These nodes are corners who's multiple parents each try to draw them. Silly parents.
        //console.log("***", other_geometries[[node.coordinate.x, node.coordinate.y]], node.parents.size());
        return;
    }

    var tileGeometry = new THREE.Geometry();

    if(node.terrain >= TERRAIN_SHORE){
        var verticesStartLength = tileGeometry.vertices.length;
        tileGeometry.vertices.push( new THREE.Vector3(node.coordinate.x, MAPSIZE - node.coordinate.y, node.height) );
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
    } else {
        return;
    }

    land_geometries[[node.coordinate.x, MAPSIZE - node.coordinate.y].toString()] = 
        {vert_length: tileGeometry.vertices.length, vert_start: land_geometry.vertices.length, face_start: land_geometry.faces.length};
    land_geometry.merge(tileGeometry, tileGeometry.matrix);

    land_geometry.dirty = true;
}


function removeGeometry(node_data){
    "use strict";
    var position_in_geometry = land_geometries[node_data];
    
    for(var itterator = position_in_geometry.vert_start; itterator < position_in_geometry.vert_start + position_in_geometry.vert_length; itterator += 1){
        land_geometry.vertices[itterator] = zeroVector;
    }

    removed_geometries[position_in_geometry.vert_start] = position_in_geometry;
    
    console.log('deleting: ', position_in_geometry, node_data);
    delete land_geometries[node_data];

    land_geometry.verticesNeedUpdate = true;
}

var last_valid_vertex = -1;

function restructureGeometry(time_to_spend){
    "use strict";
    var time_started = Date.now();
    if(!time_to_spend){
        time_to_spend = 10000;
    }

    if(last_valid_vertex < 0){
        last_valid_vertex = land_geometry.vertices.length;
    }
    
    var vertex_head = 0;
    var face_head = 0;
    var vertex_tail = 0;
    var face_tail = 0;
    var pointer;

    for(var test = 0; test < land_geometry.vertices.length; test++){
        if(land_geometry.vertices[test].x < 0){
            console.log(test, land_geometry.vertices[test]);
        }
    }

    while(vertex_head < last_valid_vertex){  // && time_started + time_to_spend > Date.now()){

        var first_vertex = land_geometry.vertices[vertex_head];
        var node_position;
        if(removed_geometries[vertex_head]){
            node_position = removed_geometries[vertex_head];

            if(vertex_head != node_position.vert_start){console.log("#");}

            vertex_head += node_position.vert_length;
            face_head += node_position.vert_length -1;
            delete removed_geometries[node_position.vert_start];
        } else if(land_geometries[[first_vertex.x, first_vertex.y].toString()]){
            node_position = land_geometries[[first_vertex.x, first_vertex.y].toString()];

            if(vertex_head != node_position.vert_start){console.log("*");}
            land_geometries[[first_vertex.x, first_vertex.y].toString()].vert_start = vertex_tail;
            land_geometries[[first_vertex.x, first_vertex.y].toString()].face_start = face_tail;

            node_position = land_geometries[[first_vertex.x, first_vertex.y].toString()];

            for(pointer = 0; pointer < node_position.vert_length; pointer++){
                land_geometry.vertices[vertex_tail + pointer] = land_geometry.vertices[vertex_head + pointer];
            }
            for(pointer = 0; pointer < node_position.vert_length -1; pointer++){
                land_geometry.vertices[face_tail + pointer] = land_geometry.vertices[face_head + pointer];
            }
            vertex_tail += node_position.vert_length;
            face_tail += node_position.vert_length -1;
            vertex_head += node_position.vert_length;
            face_head += node_position.vert_length -1;
        } else {
            console.log(".");
            break;
        }
    }


    if(vertex_tail){
        for(pointer = vertex_tail; pointer < land_geometry.vertices.length; pointer++){
            land_geometry.vertices[pointer] = zeroVector2;
        }
    }
    for(test = 0; test < land_geometry.vertices.length; test++){
        if(land_geometry.vertices[test].x < 0){
            console.log(test, land_geometry.vertices[test]);
        }
    }

    last_valid_vertex = vertex_tail;
    console.log(vertex_tail, land_geometry.vertices.length);
}
