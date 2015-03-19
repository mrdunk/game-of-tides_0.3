"use strict";

var MAPSIZE = 3600000;
var mouse = new THREE.Vector2(0.5, 0.5);
var renderer;
var mouseClick = false;
var cameraPositionDiff = new THREE.Vector3( 0, 0, 0 );
var cameraAngleDiff  = new THREE.Vector2( 0, -Math.PI/2 );
var frameCounter = 0;
var showWireframe = false;
//var GRASS = new THREE.MeshDepthMaterial();
var GRASS = new THREE.MeshLambertMaterial( { color: 0x22AA33 } );
var SKY = 0xAAAABB;
var MAX_VIEW_DISTANCE = MAPSIZE;

window.onload = function() {
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
            //MAPSIZE         // Far plane
            );
    camera.position.set( MAPSIZE/2, MAPSIZE/2, MAX_VIEW_DISTANCE / 2 );

    // Background
    var meshes = [createBackground()];
    scene.add(meshes[meshes.length -1]);

    console.log("Generating geometry...");
    var geometry = new THREE.Geometry();
    var allMesh = new THREE.Mesh(geometry, GRASS ) ;
    scene.add(allMesh);

    for(var child = 0; child < rootNode._children.size(); ++child){
        if(rootNode._children.get(child).height && rootNode._children.get(child).populateProgress === 2){
            var childNode = rootNode._children.get(child);
            for(var grandChild = 0; grandChild < childNode._children.size(); ++grandChild){
                var newNode = createTile(childNode._children.get(grandChild));
                if(newNode){
                    meshes.push(newNode);
                    geometry.merge(meshes[meshes.length -1], meshes[meshes.length -1].matrix);
                    //allMesh.add(new THREE.Mesh(newNode, GRASS));
                }
            }
            for(var grandChild = 0; grandChild < childNode._corners.size(); ++grandChild){
                var newNode = createTile(childNode._corners.get(grandChild));
                if(newNode){
                    meshes.push(newNode);
                    geometry.merge(meshes[meshes.length -1], meshes[meshes.length -1].matrix);
                    //allMesh.add(new THREE.Mesh(newNode, GRASS));
                }
            }
        }
    }
    console.log("done.");

    //var allMesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial( { color: 0x22AA33 } ) ) ;
    //scene.add(allMesh);

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
    window.addEventListener('keydown', onKeyPress, false);
};

function onMouseMove(event){
    //var x = 0.5 - (ev.clientX / window.innerWidth);
    //var y = 0.5 - (ev.clientY / window.innerHeight);
    //mouse.set(x, y);
    
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1
};

function onMouseDown(ev){
    mouseClick = true;
};

function onMouseUp(ev){
    mouseClick = false;
};

function onKeyPress(ev){
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
};


var mouseVector = new THREE.Vector3();
var raycaster = new THREE.Raycaster();

function ProjectMose(camera, scene){
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

    //camera.position.z = THREE.Math.clamp(camera.position.z, 0, MAPSIZE);
}

function render(meshes, scene, camera){
    requestAnimationFrame(function(){render(meshes, scene, camera);});
    stats.begin();

    look(camera, scene);
    camera.position.addVectors(camera.position, cameraPositionDiff);
    cameraPositionDiff.set(0,0,0);

    if(frameCounter % 60 === 0){
        //ProjectMose(camera, scene);
        scene.children[2].visible = showWireframe;
    }

    renderer.render( scene, camera );

    frameCounter += 1;

    stats.end();
}

function createBackground(){
    var tileGeom = new THREE.PlaneGeometry(MAPSIZE, MAPSIZE);
    var tileMesh = new THREE.Mesh(tileGeom, new THREE.MeshBasicMaterial( { color: 0x2233AA } ) ) ;
    tileMesh.position.y = MAPSIZE /2;
    tileMesh.position.x = MAPSIZE /2;
    tileMesh.position.z = -100;

    return tileMesh;
}

function createTile(node){
    if(!node || node._corners.size() < 3 || node.terrain <= 2){
        return;
    }
    
    var tileGeometry = new THREE.Geometry();

    if(node.populateProgress == 2){
        for(var cornerIndex = 0; cornerIndex < node._corners.size(); ++cornerIndex){
            var cornerNode = node._corners.get(cornerIndex);
            var newNode = createTile(cornerNode);
            if(newNode){
                tileGeometry.merge(newNode, newNode.matrix);
            }
        }
        for(var childIndex = 0; childIndex < node._children.size(); ++childIndex){
            var childNode = node._children.get(childIndex);
            var newNode = createTile(childNode);
            if(newNode){
                tileGeometry.merge(newNode, newNode.matrix);
            }
        }
    } else if(node.populateProgress == 1){  // NODE_PARTIAL
        // This Node is adjacent to a completed Node.
        // We need to fill in the gaps along the border.
        tileGeometry.vertices.push( new THREE.Vector3(node.coordinate.x, node.coordinate.y, node.height) );
        for(var childIndex = 0; childIndex < node._children.size(); ++childIndex){
            var childNode = node._children.get(childIndex);

            var firstLoop = true;
            var firstCorner, lastCorner, cornerCoordinate, firstHeight, lastHeight, cornerHeight;
            for(var cornerIndex = 0; cornerIndex < childNode._corners.size(); ++cornerIndex){
                var cornerNode = childNode._corners.get(cornerIndex);
                cornerCoordinate = cornerNode.coordinate;
                cornerHeight = cornerNode.height;

                if(cornerHeight > MAPSIZE || cornerHeight < 0){
                    cornerHeight = 0;
                    var heightCount = 0;
                    for(var neighbourIndex = 0; neighbourIndex < cornerNode.parents.size(); ++neighbourIndex){
                        var neighbour = Module.unordered_set_get(cornerNode.parents, neighbourIndex);
                        if(neighbour.height < MAPSIZE){
                            cornerHeight += neighbour.height;
                            heightCount += 1;
                        }
                    }
                    cornerHeight /= heightCount;
                }

                if(!firstLoop){
                    if(!node.isInside(lastCorner) || !node.isInside(cornerCoordinate)){
                        tileGeometry.vertices.push( new THREE.Vector3(cornerCoordinate.x, cornerCoordinate.y, cornerHeight / 8));
                        tileGeometry.vertices.push( new THREE.Vector3(lastCorner.x, lastCorner.y, lastHeight / 8));
                        tileGeometry.faces.push( new THREE.Face3( 0, tileGeometry.vertices.length -2, tileGeometry.vertices.length -1) );
                        tileGeometry.faces.push( new THREE.Face3( 0, tileGeometry.vertices.length -1, tileGeometry.vertices.length -2) );  // Reverse side as well.
                    }
                } else {
                    firstCorner = cornerCoordinate;
                    firstHeight = cornerHeight;
                    firstLoop = false;
                }
                lastCorner = cornerCoordinate;
                lastHeight = cornerHeight;
            }
            if(!firstLoop){
                if(!node.isInside(lastCorner) || !node.isInside(firstCorner)){
                    tileGeometry.vertices.push( new THREE.Vector3(firstCorner.x, firstCorner.y, firstHeight / 8));
                    tileGeometry.vertices.push( new THREE.Vector3(lastCorner.x, lastCorner.y, lastHeight / 8));
                    tileGeometry.faces.push( new THREE.Face3( 0, tileGeometry.vertices.length -2, tileGeometry.vertices.length -1) );
                    tileGeometry.faces.push( new THREE.Face3( 0, tileGeometry.vertices.length -1, tileGeometry.vertices.length -2) );  // Reverse side as well.
                }
            }
        }
    }

    if(node.populateProgress != 2){  // NODE_COMPLETE
        var height = node.height;
        var heightCount = 0;
        if(height === MAPSIZE){
            height = 1;
        }
        tileGeometry.vertices.push( new THREE.Vector3(node.coordinate.x, node.coordinate.y, height) );
        var verticesStartLength = tileGeometry.vertices.length -1;
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
            tileGeometry.vertices.push( new THREE.Vector3(corner.coordinate.x, corner.coordinate.y, height) );
            if(tileGeometry.vertices.length > 2){
                tileGeometry.faces.push( new THREE.Face3( verticesStartLength, tileGeometry.vertices.length -2, tileGeometry.vertices.length -1) );
            }
        }
        tileGeometry.faces.push( new THREE.Face3( verticesStartLength, tileGeometry.vertices.length -1, verticesStartLength +1) );

        tileGeometry.computeFaceNormals();
        tileGeometry.computeVertexNormals();
    }

    return tileGeometry;
}
