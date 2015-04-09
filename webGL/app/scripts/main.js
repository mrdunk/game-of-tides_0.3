/* global stats */
/* global THREE */
/* global ComplexGeometry */

var MAPSIZE = 3600000;
var SKY = 0xAAAABB;
var MAX_VIEW_DISTANCE = MAPSIZE ;

var KEY_CURSOR_LEFT = 37;
var KEY_CURSOR_UP = 38;
var KEY_CURSOR_RIGHT = 39;
var KEY_CURSOR_DOWN = 40;
var KEY_PLUS = 187;
var KEY_MINUS = 189;
var KEY_SHIFT = 16;

var settingsWindow;

var mouse_position = new THREE.Vector2(0.5, 0.5);
var last_mouse_position = new THREE.Vector2(0.5, 0.5);
var mouse_move = new THREE.Vector2(0, 0);
var mouse_click = -1;
var key_presses = [];

function onMouseMove(event){
    'use strict';
    mouse_position.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse_position.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
function onMouseDown(ev){
    'use strict';
    mouse_click = ev.button;
    console.log(mouse_click);
}

function onMouseUp(){
    'use strict';
    mouse_click = -1;
}

function onKeyPress(ev){
    'use strict';
    key_presses.push(ev);
}


function Display(){
    'use strict';
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
    var data_generator = {generator_type: 'LandscapeDataGenerator', max_recursion: 1};
    this.landscape_geometry = new ComplexGeometry(this.scene, data_generator);

    // TODO move lighting into its own function.
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight.position.set( 0, 0, MAPSIZE );
    this.scene.add( directionalLight );

    this.framecount = 1;

    this.recursion_target = 1;

    this.render();
}

Display.prototype = {
    constructor: Display,
    setFog: function(max_distance){
        'use strict';
        if(!this.scene.fog){
            this.scene.fog = new THREE.Fog( SKY, 1, max_distance );
        }
        this.scene.fog.far = max_distance;
    },
    setSea: function(level){
        'use strict';
        var seaGeom = new THREE.PlaneGeometry(MAPSIZE, MAPSIZE);
        var seaMesh = new THREE.Mesh(seaGeom, new THREE.MeshBasicMaterial( { color: 0x2233AA } ) ) ;
        seaMesh.position.y = MAPSIZE / 2;
        seaMesh.position.x = MAPSIZE / 2;
        seaMesh.position.z = level;

        this.scene.add(seaMesh);
    },
    /*setSky: function(colour){
        'use strict';
        // TODO
    },*/
    updateLandscape: function(view_top, view_bottom, view_left, view_right){
        'use strict';
        console.log(view_top, view_bottom, view_left, view_right);
        this.landscape_geometry.AddArea([view_top, view_left], [view_bottom, view_right], this.recursion_target);
        this.recursion_actual = this.recursion_target;
    },
    setCameraPosition: function(arg1, arg2, arg3){
        'use strict';
        if(arg1 && arg2 && arg3){
            // x, y, z
            this.camera.position.set(arg1, arg2, arg3);
        } else if(arg1 && !arg2 && !arg3){
            // A vector.
            this.camera.position = arg1;
        }
        this.updateSettingsDisplay();
    },
    setCameraDirection: function(pan, tilt){
        'use strict';
        var look_at = new THREE.Vector3( 0, 0, 0 );
        this.camera.up = new THREE.Vector3(0,0,1);

        tilt = THREE.Math.clamp(tilt, -Math.PI / 2 + 0.01, Math.PI / 2);

        this.camera_pan = pan;
        this.camera_tilt = tilt;

        tilt += Math.PI * 2;    // Set tilt==0 to be straight ahead.

        look_at.x = this.camera.position.x + 100 * Math.cos( tilt ) * Math.sin( pan );
        look_at.y = this.camera.position.y + 100 * Math.cos( tilt ) * Math.cos( pan );
        look_at.z = this.camera.position.z + 100 * Math.sin( tilt );
        this.camera.lookAt(look_at);

        this.updateSettingsDisplay();
    },
    updateCameraPosition: function(position_diff){
        'use strict';
        this.camera.position.addVectors(this.camera.position, position_diff);
    },
    updateCameraDirection: function(pan_diff, tilt_diff){
        'use strict';
        this.setCameraDirection(this.camera_pan + pan_diff, this.camera_tilt + tilt_diff);
    },
    decodeKeys: function(){

    },
    render: function(){
        'use strict';
        // Queue up the next frame.
        requestAnimationFrame(function(){this.render();}.bind(this));

        // Stats widget. Displays fps, etc.
        stats.begin();

        mouse_move.x = mouse_position.x - last_mouse_position.x;
        mouse_move.y = mouse_position.y - last_mouse_position.y;
        last_mouse_position.x = mouse_position.x;
        last_mouse_position.y = mouse_position.y;

        this.processInput();
        
        if(this.recursion_actual !== this.recursion_target){
            console.log('updateLandscape');
            var view_top = Math.round(this.camera.position.y - this.camera.position.z);
            var view_bottom = Math.round(this.camera.position.y + this.camera.position.z);
            var view_left = Math.round(this.camera.position.x - this.camera.position.z);
            var view_right = Math.round(this.camera.position.x + this.camera.position.z);
            THREE.Math.clamp(view_top, 0, MAPSIZE);
            THREE.Math.clamp(view_bottom, 0, MAPSIZE);
            THREE.Math.clamp(view_left, 0, MAPSIZE);
            THREE.Math.clamp(view_right, 0, MAPSIZE);

            this.updateLandscape(view_top, view_bottom, view_left, view_right);
        }

        this.framecount++;

        this.renderer.render( this.scene, this.camera );

        // Stats widget. Displays fps, etc.
        stats.end();
    },
    processInput: function(){
        'use strict';
        if(mouse_click === 0){
            this.updateCameraDirection(mouse_move.x, mouse_move.y);
        }
        if(mouse_click === 2){
            this.camera.translateZ(-10000);
            this.updateSettingsDisplay();
        }

        while(key_presses.length){
            var key_press = key_presses.pop();
            
            var action_size = 1;
            if(key_press.shiftKey){
                action_size = 10;
            }

            switch(key_press.keyCode){
                case KEY_CURSOR_UP:
                    this.camera.translateY(1000 * action_size);
                    break;
                case KEY_CURSOR_DOWN:
                    this.camera.translateY(-1000 * action_size);
                    break;
                case KEY_CURSOR_LEFT:
                    this.camera.translateX(-1000 * action_size);
                    break;
                case KEY_CURSOR_RIGHT:
                    this.camera.translateX(1000 * action_size);
                    break;
                case KEY_PLUS:
                    this.camera.position.z += 1000 * action_size;
                    break;
                case KEY_MINUS:
                    this.camera.position.z -= 1000 * action_size;
                    break;
            }

            this.updateSettingsDisplay();
        }
    },
    updateSettingsDisplay: function(){
        'use strict';
        this.recursion_target = Math.round(Math.sqrt(MAPSIZE / this.camera.position.z));

        settingsWindow.setAttribute('contents', ['position.x', Math.round(this.camera.position.x)]);
        settingsWindow.setAttribute('contents', ['position.y', Math.round(this.camera.position.y)]);
        settingsWindow.setAttribute('contents', ['position.z', Math.round(this.camera.position.z)]);
        settingsWindow.setAttribute('contents', ['pan', Math.round(this.camera_pan * 180 / Math.PI)]);
        settingsWindow.setAttribute('contents', ['tilt', Math.round(this.camera_tilt * 180 / Math.PI)]);
        settingsWindow.setAttribute('contents', ['recursion', this.recursion_target]);
    }
};



window.onload = function() {
    'use strict';
    settingsWindow = document.getElementById('settingsWindow');

    var display = new Display();
    display.setFog(MAX_VIEW_DISTANCE);
    display.setSea(-1000);
    display.setCameraPosition(MAPSIZE / 2, MAPSIZE / 2, MAX_VIEW_DISTANCE / 2);

    display.setCameraDirection(0, -Math.PI / 2);

    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('mouseup', onMouseUp, false);
    window.addEventListener('keydown', onKeyPress, false);
};
