var MAPSIZE = 3600000;  // TODO move this define to seperate file that can be included everywhere.

var data_generator;
var counter = 0;

importScripts('geometries.js');
importScripts('emscripten/world.js');

/*Module['_main'] = function() {
    
}*/

self.addEventListener('message', function(e) {
  self.postMessage({counter: counter++});

  self.postMessage(e.data);

  if(!data_generator){
    if(e.data.generator_type === 'TestDataGenerator'){
      data_generator = new TestDataGenerator(e.data.width, e.data.height, e.data.resolution);
    } else if(e.data.generator_type === 'LandscapeDataGenerator'){
      data_generator = new LandscapeDataGenerator(e.data.max_recursion);
    } else {
      return;
    }
  }

  var timer = Date.now();
  var vertices_temp = [];
  var indexes_temp = [];
  var current_index = 0;
  var shape = data_generator.next();
  while(shape){
    if(shape.length >= 3){
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
    }
    shape = data_generator.next();
  }

  data_generator.reset();

  var vertices = new Float32Array(vertices_temp);
  var indexes = new Uint32Array(indexes_temp);

  var timer = Date.now() - timer;

  self.postMessage({time_spent: timer, index: current_index, vertices: vertices, indexes: indexes}, [vertices.buffer, indexes.buffer]);
}, false);



