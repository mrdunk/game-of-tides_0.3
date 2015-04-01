
var MAPSIZE = 3600000;
var SKY = 0xAAAABB;
var MAX_VIEW_DISTANCE = MAPSIZE ;

var settingsWindow;

var mouse_position = new THREE.Vector2(0.5, 0.5);
var last_mouse_position = new THREE.Vector2(0.5, 0.5);
var mouse_move = new THREE.Vector2(0, 0);
var mouse_click = -1;
var key_presses = [];

window.onload = function() {
    "use strict";
    settingsWindow = document.getElementById('settingsWindow');

    var display = new Display();
    display.setFog(MAX_VIEW_DISTANCE);
    display.setSea(-1000);
    display.setCameraPosition( MAPSIZE/2, MAPSIZE/2, MAX_VIEW_DISTANCE/2 );
    display.updateLandscape();

    display.setCameraDirection(0, -Math.PI / 2);

    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('mouseup', onMouseUp, false);
    window.addEventListener('keydown', onKeyPress, false);
};

function onMouseMove(event){
    "use strict";
    mouse_position.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse_position.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function onMouseDown(ev){
    "use strict";
    mouse_click = ev.button;
    console.log(mouse_click);
}

function onMouseUp(ev){
    "use strict";
    mouse_click = -1;
}

function onKeyPress(ev){
    "use strict";
    console.log(ev.keyCode);
    key_presses.push(ev.keyCode);
}


function Display(){
    "use strict";
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.setClearColor( SKY );

    // Disable right click context menu.
    this.renderer.domElement.oncontextmenu = function (e) {
        e.preventDefault();
    };

    document.body.appendChild( this.renderer.domElement );

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
            90,             // Field of view
            window.innerWidth / window.innerHeight,      // Aspect ratio
            100,            // Near plane
            MAX_VIEW_DISTANCE // Far plane
            );

    //var data_generator = {generator_type: 'TestDataGenerator', width: MAPSIZE, height: MAPSIZE, resolution: 100};
    var data_generator = {generator_type: 'LandscapeDataGenerator', max_recursion: 3};
    this.landscape_geometry = new ComplexGeometry(this.scene, data_generator);

    // TODO move lighting into its own function.
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight.position.set( 0, 0, MAPSIZE );
    this.scene.add( directionalLight );

    this.framecount = 0;

    this.render();
}

Display.prototype = {
    constructor: Display,
    setFog: function(max_distance){
        "use strict";
        if(!this.scene.fog){
            this.scene.fog = new THREE.Fog( SKY, 1, max_distance );
        }
        this.scene.fog.far = max_distance;
    },
    setSea: function(level){
        "use strict";
        var seaGeom = new THREE.PlaneGeometry(MAPSIZE, MAPSIZE);
        var seaMesh = new THREE.Mesh(seaGeom, new THREE.MeshBasicMaterial( { color: 0x2233AA } ) ) ;
        seaMesh.position.y = MAPSIZE /2;
        seaMesh.position.x = MAPSIZE /2;
        seaMesh.position.z = level;

        this.scene.add(seaMesh);
    },
    setSky: function(colour){
        "use strict";
        // TODO
    },
    updateLandscape: function(geometry, bottomLeft, topRight, recursion){
        "use strict";
        this.landscape_geometry.AddArea(bottomLeft, topRight, recursion);
    },
    setCameraPosition: function(arg1, arg2, arg3){
        "use strict";
        if(arg1 && arg2 && arg3){
            // x, y, z
            this.camera.position.set(arg1, arg2, arg3);
        } else if(arg1 && !arg2 && !arg3){
            // A vector.
            this.camera.position = arg1;
        }
    },
    setCameraDirection: function(pan, tilt){
        "use strict";
        var look_at = new THREE.Vector3( 0, 0, 0 );
        this.camera.up = new THREE.Vector3(0,0,1);

        tilt = THREE.Math.clamp(tilt, -Math.PI/2 +0.01, Math.PI/2);

        this.camera_pan = pan;
        this.camera_tilt = tilt;

        tilt += Math.PI * 2;    // Set tilt==0 to be straight ahead.
        
        look_at.x = this.camera.position.x + 100 * Math.cos( tilt ) * Math.sin( pan );
        look_at.y = this.camera.position.y + 100 * Math.cos( tilt ) * Math.cos( pan );
        look_at.z = this.camera.position.z + 100 * Math.sin( tilt );
        this.camera.lookAt(look_at);

    },
    updateCameraPosition: function(position_diff){
        "use strict";
        this.camera.position.addVectors(this.camera.position, position_diff);
    },
    updateCameraDirection: function(pan_diff, tilt_diff){
        "use strict";
        this.setCameraDirection(this.camera_pan + pan_diff, this.camera_tilt + tilt_diff);
    },
    decodeKeys: function(){
        
    },
    render: function(){
        "use strict";
        // Queue up the next frame.
        requestAnimationFrame(function(){this.render();}.bind(this));

        // Stats widget. Displays fps, etc.
        stats.begin();

        mouse_move.x = mouse_position.x - last_mouse_position.x;
        mouse_move.y = mouse_position.y - last_mouse_position.y;
        last_mouse_position.x = mouse_position.x;
        last_mouse_position.y = mouse_position.y;

        if(mouse_click === 0){
            this.updateCameraDirection(mouse_move.x, mouse_move.y);
        }
        if(mouse_click === 2){
            this.camera.translateZ(-10000);
        }

        if(this.framecount % 1200 === 0){
            console.log('tick');
            this.updateLandscape();
        }

        this.framecount++;

        this.renderer.render( this.scene, this.camera );

        // Stats widget. Displays fps, etc.
        stats.end();
    }
};
