/* global Module */


// TODO Move these defines into their own source file.
var MAPSIZE = 3600000;

//var TERRAIN_UNDEFINED = 0;
//var TERRAIN_SEA = 1;
//var TERRAIN_SHALLOWS = 2;
var TERRAIN_SHORE = 3;
//var TERRAIN_LAND = 4;
//var TERRAIN_ROOT = 99;


function LandscapeDataGenerator(){
  "use strict";
  this.rootNode = new Module.CreateMapRoot();
  Module.RaiseIslands(this.rootNode);

  this.worldItterator = new Module.WorldItterator(this.rootNode);

  this.reset();
}

LandscapeDataGenerator.prototype = {
  constructor: LandscapeDataGenerator,
  next: function(){
    "use strict";
    var node = this.worldItterator.get();
    while(node){
        var shape = this.tileShape(node);
        if(shape.length > 3){
            return shape;
        }
        node = this.worldItterator.get();
    }
  },
  reset: function(){
    "use strict";
    this.worldItterator.reset();

    this.open_list = [];
    this.closed_set = {};
    this.completed_nodes = {};
  },
  setRecursion: function(recursion){
    "use strict";
    this.worldItterator.setRecursion(recursion);
  },
  tileShape: function(node){
    "use strict";
    if(!node){
        return;
    }

    var return_list = [];

    if(typeof this.completed_nodes[[node.coordinate.x, node.coordinate.y]] === 'object'){
        // Already have this node.
        // These nodes are corners who's multiple parents each try to draw them. Silly parents.
        return;
    }

    if(node.terrain >= TERRAIN_SHORE){
      return_list.push([node.coordinate.x, MAPSIZE - node.coordinate.y, node.height]);
      for(var cornerIndex = 0; cornerIndex < node._corners.size(); ++cornerIndex){
        var cornerNode = node._corners.get(cornerIndex);
        if(cornerNode.height > MAPSIZE){
          // Something has gone very wrong with this node so just bail.
          return;
        }
        
        return_list.push([cornerNode.coordinate.x, MAPSIZE - cornerNode.coordinate.y, cornerNode.height]);
      }
    }

    this.completed_nodes[[node.coordinate.x, MAPSIZE - node.coordinate.y].toString()] = true;
    return return_list;
  }
};

function TestDataGenerator(width, height, point_density){
    "use strict";
    this.width = width;
    this.height = height;
    this.point_density = point_density;
}

TestDataGenerator.prototype = {
    constructor: TestDataGenerator,
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
        var z = 10000;

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

