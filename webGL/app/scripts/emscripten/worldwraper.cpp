#include <memory>
#include <unordered_set>
#include <emscripten/bind.h>

#define GLM_FORCE_RADIANS
#include "/usr/include/glm/glm.hpp"
#include "/usr/include/glm/gtx/vector_angle.hpp"

#include "/home/duncan/Working/git/game-of-tides_0.3/world.h"


Node* unordered_set_get(std::unordered_set<Node*> set, int index){
    auto node = set.begin();
    int counter = 0;
    while(node != set.end()){
        if(counter == index){
            return *node;
        }
        ++node;
        ++counter;
    }
    return NULL;
}

using namespace emscripten;


EMSCRIPTEN_BINDINGS(stl_wrappers) {
  emscripten::register_vector<std::shared_ptr<Node> >("VectorNode");
}

EMSCRIPTEN_BINDINGS(glm_vec2){
  value_object<glm::vec2>("glm_vec2")
        .field("x", &glm::vec2::x)
        .field("y", &glm::vec2::y)
        ;
}

EMSCRIPTEN_BINDINGS(unordered_set){
  function("unordered_set_get", &unordered_set_get, allow_raw_pointers());
  class_<std::unordered_set<Node*> >("unordered_set")
    .function("size", &std::unordered_set<Node*>::size)
    ;
}

EMSCRIPTEN_BINDINGS(WorldItterator) {
  class_<WorldItterator>("WorldItterator")
  .constructor<Node*, int>()
  .function("get", &WorldItterator::get, allow_raw_pointers())
  .function("reset", &WorldItterator::reset);
}

EMSCRIPTEN_BINDINGS(my_example) {
  function("CreateMapRoot", &CreateMapRoot);
  function("RaiseIslands", &RaiseIslands, allow_raw_pointers());

  class_<Node>("Node")
  .smart_ptr<std::shared_ptr<Node> >("shared_ptr<Node>")
  .property("height", &Node::height)
  .property("scenery", &Node::scenery)
  .property("coordinate", &Node::coordinate)
  .property("parents", &Node::parents)
  .property("_children", &Node::_children)
  .property("_corners", &Node::_corners)
  .property("populateProgress", &Node::populateProgress)
  .property("recursion", &Node::recursion)
  .property("terrain", &Node::terrain);
}
