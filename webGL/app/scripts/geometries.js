var TERRAIN_UNDEFINED = 0;
var TERRAIN_SEA = 1;
var TERRAIN_SHALLOWS = 2;
var TERRAIN_SHORE = 3;
var TERRAIN_LAND = 4;
var TERRAIN_ROOT = 99;

function LandscapeDataGenerator(max_recursion){
  "use strict";
  this.max_recursion = max_recursion;
  this.reset();

  this.rootNode = Module.CreateMapRoot();
  Module.RaiseIslands(this.rootNode);
}

LandscapeDataGenerator.prototype = {
  constructor: LandscapeDataGenerator,
  next: function(){
    "use strict";
    if(!this.open_list.length){
        if(!this.closed_set[[this.rootNode.coordinate.x, this.rootNode.coordinate.y, this.rootNode.recursion]]){
            this.closed_set[[this.rootNode.coordinate.x, this.rootNode.coordinate.y, this.rootNode.recursion]] = true;
            this.open_list.push(this.rootNode);
        }
    }
    while(this.open_list.length){
        var working_node = this.open_list.pop();
        if(working_node.populateProgress === 2 && this.max_recursion > working_node.recursion){
            for(var child_itterator = 0; child_itterator < working_node._children.size(); ++child_itterator){
                var child = working_node._children.get(child_itterator);
                if(!this.closed_set[[child.coordinate.x, child.coordinate.y, child.recursion]]){
                    this.closed_set[[child.coordinate.x, child.coordinate.y, child.recursion]] = true;
                    this.open_list.push(child);
                }
            }
            for(var corner_itterator = 0; corner_itterator < working_node._corners.size(); ++corner_itterator){
                var corner = working_node._corners.get(corner_itterator);
                if(!this.closed_set[[corner.coordinate.x, corner.coordinate.y, corner.recursion]]){
                    this.closed_set[[corner.coordinate.x, corner.coordinate.y, corner.recursion]] = true;
                    this.open_list.push(corner);
                }
            }
        } else {
            var tile = this.tileShape(working_node);
            if(tile){ return tile; }
        }
    }

  },
  reset: function(){
    "use strict";
    this.open_list = [];
    this.closed_set = {};
    this.completed_nodes = {};
  },
  tileShape: function(node){
    "use strict";
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
}

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

