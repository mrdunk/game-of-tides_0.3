#include "world.h"


using std::vector;
using std::unordered_set;
using std::cout;
using std::endl;
using std::flush;
using glm::vec2;
using boost::polygon::voronoi_diagram;
using std::max;
using std::min;
using std::shared_ptr;

namespace boost {
namespace polygon {

template <>
struct geometry_concept<Point> {
  typedef point_concept type;
};

template <>
struct point_traits<Point> {
  typedef int coordinate_type;

  static inline coordinate_type get(
      const Point& point, orientation_2d orient) {
    return (orient == HORIZONTAL) ? point.a : point.b;
  }
};

}  // polygon
}  // boost


// http://www.cse.yorku.ca/~oz/hash.html
uint32_t HashFunction(const int a, const int b, const int c, const int d){

    int input[4];
    input[0] = a;
    input[1] = b;
    input[2] = c;
    input[3] = d;

    return MurmurHashNeutral2(static_cast<void*>(input), 16, HASHSALT);
}

// http://www.blackpawn.com/texts/pointinpoly/
bool isInTriangle(vec2 A, vec2 B, vec2 C, vec2 P){
    // Compute vectors        
    vec2 v0 = C - A;
    vec2 v1 = B - A;
    vec2 v2 = P - A;

    // Compute dot products
    float dot00 = glm::dot(v0, v0);
    float dot01 = glm::dot(v0, v1);
    float dot02 = glm::dot(v0, v2);
    float dot11 = glm::dot(v1, v1);
    float dot12 = glm::dot(v1, v2);

    // Compute barycentric coordinates
    float invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    float u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    float v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    // Check if point is in triangle
    return (u >= 0) && (v >= 0) && (u + v < 1);
}


Node::Node(Node* parent, vec2 _coordinate){
    parents.insert(parent);
    coordinate = _coordinate;
    populateProgress = NODE_UNINITIALISED;
    recursion = parent->recursion +1;
    height = 0;
    tilesFromSea = -1;
    terrain = TERRAIN_UNDEFINED;
}

Node::Node(){
    //std::cout << "Node::Node()" << std::endl;
    populateProgress = NODE_UNINITIALISED;
    height = 0;
    tilesFromSea = -1;
    terrain = TERRAIN_UNDEFINED;
}

Node::~Node(){
    //std::cout << "Node::~Node()" << std::endl;
}

void Node::populateChildren(){
    if(_children.empty()){
        //if(!recursion || IsShore()){
        if(!recursion || terrain == TERRAIN_SHORE){
            // Populate with all children.
            bool first = true;
            vec2 lastcorner, thiscorner;

            for(auto corner = _corners.begin(); corner != _corners.end(); corner++){
                thiscorner = corner->get()->coordinate;

                if(!first){
                    populateChildrenSection(lastcorner, thiscorner);
                }
                first = false;

                lastcorner = thiscorner;
            }

            populateChildrenSection(_corners.back()->coordinate, _corners.front()->coordinate);
        } else {
            // Single child Node with same centre coordinate as parent.
            _children.push_back(std::make_shared<Node>(this, coordinate));
        }
    }
}

void Node::populateChildrenSection(vec2 & lastcorner, vec2 & thiscorner){
    vec2 result;
    int resultHash;
    unordered_set<int> alreadyInserted;

    if(lastcorner.x < 0 || lastcorner.x > MAPSIZE || lastcorner.y < 0 || lastcorner.y > MAPSIZE ||
            thiscorner.x < 0 || thiscorner.x > MAPSIZE || thiscorner.y < 0 || thiscorner.y > MAPSIZE ||
            coordinate.x < 0 || coordinate.x > MAPSIZE || coordinate.y < 0 || coordinate.y > MAPSIZE){
        return;
    }

    int32_t seedNumber;
    if(recursion){
        // Recursing through shoreline levels.
        float area = (max(lastcorner.x, max(thiscorner.x, coordinate.x)) - min(lastcorner.x, min(thiscorner.x, coordinate.x))) *
            (max(lastcorner.y, max(thiscorner.y, coordinate.y)) - min(lastcorner.y, min(thiscorner.y, coordinate.y)));

        float expectedArea = MAPSIZE * (MAPSIZE / pow(SHORE_DEPTH, (recursion -1))) / SEED_NUMBER;

        seedNumber = SHORE_DEPTH * area / expectedArea;
    } else {
        // Initial layout.
        seedNumber = SEED_NUMBER;
    }

    for(int i = 0; i < seedNumber; ++i){
        //result = (((float)HashFunction(1000, i, coordinate.x, coordinate.y) / UINT32_MAX) * (lastcorner - coordinate)) + 
        //         (((float)HashFunction(2000, i, coordinate.x, coordinate.y) / UINT32_MAX) * (thiscorner - coordinate)) + coordinate;
        
        // Does using "coordinate" as the seed for multiple populateChildrenSection() make shapes regular?
        result.x = (((float)HashFunction(1000, i, coordinate.x, coordinate.y) / UINT32_MAX) * (lastcorner.x - coordinate.x)) +  
                 (((float)HashFunction(2000, i, coordinate.x, coordinate.y) / UINT32_MAX) * (thiscorner.x - coordinate.x)) + coordinate.x;
        result.y = (((float)HashFunction(3000, i, coordinate.x, coordinate.y) / UINT32_MAX) * (lastcorner.y - coordinate.y)) +  
                 (((float)HashFunction(4000, i, coordinate.x, coordinate.y) / UINT32_MAX) * (thiscorner.y - coordinate.y)) + coordinate.y;

        resultHash = (int)result.x ^ (int)result.y;  // Used to make sure there are no duplicates.
        if(glm::orientedAngle(glm::normalize(result - thiscorner), glm::normalize(lastcorner - thiscorner)) > 0.0f &&
                result.x >= 0 && result.x < MAPSIZE && result.y >= 0 && result.y < MAPSIZE &&
                alreadyInserted.count(resultHash) == 0){
            alreadyInserted.insert(resultHash);
            _children.push_back(std::make_shared<Node>(this, result));
        }
    }
}

void Node::insertCorner(std::shared_ptr<Node> newCorner){
    vec2 v_newCorner = newCorner->coordinate - coordinate;
    vec2 v_corner;
    auto corner = _corners.begin();
    for( ; corner != _corners.end(); ++corner){
        v_corner = corner->get()->coordinate - coordinate;
        if(v_corner == v_newCorner){
            // Already have this corner.
            return;
        }
        if(v_newCorner.x == 0 && v_corner.x == 0){
            if(v_newCorner.y < v_corner.y){
                break;
            }
        }
        if(v_newCorner.x >= 0 && v_corner.x < 0){
            break;
        }
        if((v_newCorner.x >= 0 && v_corner.x >= 0) || (v_newCorner.x < 0 && v_corner.x < 0)){
            if((v_newCorner.x * v_corner.y - v_newCorner.y * v_corner.x) > 0){
                break;
            }
        }
    }
    _corners.insert(corner, newCorner);
}

void Node::populate(){
    //cout << "Node::populate()" << endl;

    populateChildren();

    if(populateProgress != NODE_COMPLETE){
        // Make sure neighbours have children populated.
        unordered_set<Node*> allNeighbours;
        for(auto neighbour = neighbours.begin(); neighbour != neighbours.end(); neighbour++){
            if(*neighbour != this){
                (*neighbour)->populateChildren();
                allNeighbours.insert(*neighbour);
                for(auto neighboursNeighbour = (*neighbour)->neighbours.begin(); neighboursNeighbour != (*neighbour)->neighbours.end(); neighboursNeighbour++){
                    if(*neighboursNeighbour != this){
                        (*neighboursNeighbour)->populateChildren();
                        allNeighbours.insert(*neighboursNeighbour);
                    }
                }
            }
        }

        // Calculate voronoi diagram for this node and surrounding points.
        // Get list of all points.
        vector<Point> points;                   // Voronoi code needs vector as input.
        unordered_set<Node*> trackAddedPoints;  // Checking "points" vector for duplicates too timeconsuming so track added Nodes in an unordered_set as well.

        for(auto corner = _corners.begin(); corner != _corners.end(); corner++){
            points.push_back(Point(*corner, true));
            trackAddedPoints.insert(corner->get());
        }
        for(auto child = _children.begin(); child != _children.end(); child++){
            points.push_back(Point(*child, true));
        }

        for(auto neighbour = allNeighbours.begin(); neighbour != allNeighbours.end(); neighbour++){
            for(auto corner = (*neighbour)->_corners.begin(); corner != (*neighbour)->_corners.end(); corner++){
                if(trackAddedPoints.count(corner->get()) == 0){     // Corners may be shared with another Node so make sure it hasn't been done already.
                    points.push_back(Point(*corner, false));
                    trackAddedPoints.insert(corner->get());
                }
            }
            for(auto child = (*neighbour)->_children.begin(); child != (*neighbour)->_children.end(); child++){
                points.push_back(Point(*child, false));
            }
            if((*neighbour)->populateProgress == NODE_UNINITIALISED){
                (*neighbour)->populateProgress = NODE_PARTIAL;
            }
        }

        // Build voronoi diagram
        voronoi_diagram<double> vd;
        construct_voronoi(points.begin(), points.end(), &vd);

        for(voronoi_diagram<double>::const_cell_iterator it = vd.cells().begin(); it != vd.cells().end(); ++it){
            // Only save everything if this child is inside parent Node (rather than one of the adjacent nodes).
            if(points[it->source_index()].primary){
                const voronoi_diagram<double>::cell_type &cell0 = *it;
                const voronoi_diagram<double>::edge_type *edge = cell0.incident_edge();
                std::shared_ptr<Node> workingNode = points[cell0.source_index()].p_node;

                //cout << "  cell " << cell0.source_index() << endl;

                // Iterate edges around Voronoi cell.
                do{
                    if(edge->is_primary()){
                        //const voronoi_diagram<double>::cell_type &cell1 = *edge->twin()->cell();
                        //cout << "    edge " << cell1.source_index() << endl;

                        if(edge->is_finite()){
                            auto newCorner = std::make_shared<Node>(workingNode.get(), vec2(edge->vertex0()->x(), edge->vertex0()->y()));

                            const voronoi_diagram<double>::edge_type *rotateEdge = edge;
                            do {
                                // Set every cell adjacent to this corner as a parent of the new corner.
                                newCorner->parents.insert(points[rotateEdge->cell()->source_index()].p_node.get());

                                // Set the new corner as a corner of every adjacent cell.
                                points[rotateEdge->cell()->source_index()].p_node->insertCorner(newCorner);

                                rotateEdge = rotateEdge->rot_next();
                            } while (rotateEdge != edge);
                            //cout << endl;
                        }
                    }
                    edge = edge->next();
                } while(edge != cell0.incident_edge());
            }
        }
        calculateChildrensNeighbours();
        populateProgress = NODE_COMPLETE;

        // For recursion == 0, we set terrain type elsewhere so we can genrate land masses.
        if(recursion > 0){
            SetTerrain();
        }
    }
    //cout << "Node::populate() -" << endl;
}

void Node::SetTerrain(){
    _SetTerrainCorners();
    _SetTerrainChildren();
}

void Node::_SetTerrainCorners(){
    for(auto corner = _corners.begin(); corner != _corners.end(); corner++){
        (*corner)->terrain = TERRAIN_LAND;
        for(auto parent = (*corner)->parents.begin(); parent != (*corner)->parents.end(); ++parent){
            if((*parent)->terrain <= TERRAIN_SHALLOWS){
                (*corner)->terrain = TERRAIN_SHALLOWS;
                break;
            }
        }
        if((*corner)->terrain == TERRAIN_LAND){
            for(auto neighbour = (*corner)->neighbours.begin(); neighbour != (*corner)->neighbours.end(); ++neighbour){
                for(auto neighboursParent = (*neighbour)->parents.begin(); neighboursParent != (*neighbour)->parents.end(); ++neighboursParent){
                    if((*neighboursParent)->terrain <= TERRAIN_SHALLOWS){
                        (*corner)->terrain = TERRAIN_SHORE;
                        break;
                    }
                }
            }
        }
    }
}

void Node::_SetTerrainChildren(){
    for(auto child = _children.begin(); child != _children.end(); child++){
        if((*child)->terrain == TERRAIN_UNDEFINED){
            (*child)->terrain = TERRAIN_LAND;
            for(auto neighbour = (*child)->neighbours.begin(); neighbour != (*child)->neighbours.end(); ++neighbour){
                if((*neighbour)->terrain == TERRAIN_UNDEFINED && (*neighbour)->parents.size() > 1){
                    // A neghbour is a corner of a tile too far away to have been calculated yet. Calculate it's corners now.
                    for(auto neighboursParent = (*neighbour)->parents.begin(); neighboursParent != (*neighbour)->parents.end(); ++neighboursParent){
                        (*neighboursParent)->_SetTerrainCorners();
                    }
                }
                if((*neighbour)->parents.size() > 1){
                    // neighbour is a corner. Query it directly.
                    if((*neighbour)->terrain <= TERRAIN_SHALLOWS){
                        (*child)->terrain = TERRAIN_SHALLOWS;
                        break;
                    }
                } else {
                    // neighbour is a child. Query it's parent.
                    if((*(*neighbour)->parents.begin())->terrain <= TERRAIN_SHALLOWS){
                        (*child)->terrain = TERRAIN_SHALLOWS;
                        break;
                    }
                }
            }
        }
    }

    // TODO this could be rolled into the previous for loop.
    std::unordered_set<Node*> tempary_shore_list;
    for(auto child = _children.begin(); child != _children.end(); child++){
        for(auto neighbour = (*child)->neighbours.begin(); neighbour != (*child)->neighbours.end(); ++neighbour){
            for(auto neighboursParent = (*neighbour)->parents.begin(); neighboursParent != (*neighbour)->parents.end(); ++neighboursParent){
                if((*neighboursParent) == this){    // neighbour is in sme parent tile.
                    if((*neighbour)->parents.size() == 1){  // Trust corners to be ok already.
                        if((*child)->terrain == TERRAIN_SHALLOWS && (*neighbour)->terrain == TERRAIN_LAND){
                            tempary_shore_list.insert(*neighbour);
                        }
                    }
                }
            }
        }
    }
    for(auto shore = tempary_shore_list.begin(); shore != tempary_shore_list.end(); ++ shore){
        (*shore)->terrain = TERRAIN_SHORE;
    }

    for(auto child = _children.begin(); child != _children.end(); child++){
        for(auto neighbour = (*child)->neighbours.begin(); neighbour != (*child)->neighbours.end(); ++neighbour){
            for(auto neighboursParent = (*neighbour)->parents.begin(); neighboursParent != (*neighbour)->parents.end(); ++neighboursParent){
                if((*neighboursParent) == this){    // neighbour is in sme parent tile.
                    if((*child)->terrain == TERRAIN_SHALLOWS && (*neighbour)->terrain == TERRAIN_LAND){
                        if((*child)->parents.size() == 1){
//                            (*child)->terrain = TERRAIN_SHORE;
                        }
                    }
                }
            }
        }
    }

/*    tempary_shore_list.clear();
    for(auto child = _children.begin(); child != _children.end(); child++){
        for(auto neighbour = (*child)->neighbours.begin(); neighbour != (*child)->neighbours.end(); ++neighbour){
            for(auto neighboursParent = (*neighbour)->parents.begin(); neighboursParent != (*neighbour)->parents.end(); ++neighboursParent){
                if((*neighboursParent) == this){    // neighbour is in sme parent tile.
                    if((*neighbour)->parents.size() == 1){  // Trust corners to be ok already.
                        if((*child)->terrain == TERRAIN_SHORE && (*neighbour)->terrain == TERRAIN_LAND){
                            tempary_shore_list.insert(*neighbour);
                        }
                        if((*child)->terrain == TERRAIN_SHALLOWS && (*neighbour)->terrain == TERRAIN_LAND){
                            tempary_shore_list.insert(*neighbour);
                        }
                        if((*child)->terrain == TERRAIN_LAND && (*neighbour)->terrain == TERRAIN_SHALLOWS){
                            tempary_shore_list.insert(child->get());
                        }
                    }
                }
            }
        }
    }
    for(auto shore = tempary_shore_list.begin(); shore != tempary_shore_list.end(); ++ shore){
        (*shore)->terrain = TERRAIN_SHORE;
    }*/
}

/*void Node::SetAboveSeaLevel(){
    //height = MAPSIZE;
    for(auto child = _children.begin(); child != _children.end(); child++){
        child->get()->height = MAPSIZE;
        for(auto childsNeghbour = (*child)->neighbours.begin(); childsNeghbour != (*child)->neighbours.end(); ++childsNeghbour){
            if(!(*(*childsNeghbour)->parents.begin())->height){
                child->get()->height = 0;
            }
        }
    }

    // Only make a corner land if all it's adjoning Nodes are land.
    for(auto corner = _corners.begin(); corner != _corners.end(); corner++){
        int cornerHeight = MAPSIZE;
        for(auto parent = (*corner)->parents.begin(); parent != (*corner)->parents.end(); ++parent){
            if((*parent)->height == 0){
                cornerHeight = 0;
            }
        }
        (*corner)->height = cornerHeight;
    }
}

bool Node::IsShore(){
    if(height == 0){
        return true;
    }
    if(populateProgress == NODE_COMPLETE){
        // NODE_COMPLETE so corners have been fully calculated.
        for(auto corner = _corners.begin(); corner != _corners.end(); corner++){
            if((*corner)->height == 0){
                // One corner is in the sea so this is shore.
                return true;
            }
        }
    } else {
        for(auto neighbour = neighbours.begin(); neighbour != neighbours.end(); neighbour++){
            if((*neighbour)->height == 0){
                // neighbour is probably sea... but it might be the uncompleted child of a parent land tile.
                for(auto neighbourParent = (*neighbour)->parents.begin(); neighbourParent != (*neighbour)->parents.end(); ++neighbourParent){
                    if((*neighbourParent)->populateProgress == NODE_COMPLETE){
                        return true;
                    }
                    if((*neighbourParent)->height == 0){
                        return true;
                    }
                }
            }
        }
    }
    return false;
}*/

Node* Node::LowestNeighbour(){
    Node* lowest;
    int neighbourHeight = MAPSIZE;
    for(auto corner = _corners.begin(); corner != _corners.end(); corner++){
        for(auto neighbour = (*corner)->parents.begin(); neighbour != (*corner)->parents.end(); ++neighbour){
            if(*neighbour != this){
                bool neighbourParentSea = false;
                for(auto neighbourParent = (*neighbour)->parents.begin(); neighbourParent != (*neighbour)->parents.end(); ++neighbourParent){
                    if((*neighbourParent)->populateProgress == NODE_COMPLETE){
                        neighbourParentSea = true;
                    }
                }
                if((*neighbour)->height < neighbourHeight && neighbourParentSea && (*neighbour)->tilesFromSea < tilesFromSea){
                    lowest = *neighbour;
                    neighbourHeight = (*neighbour)->height;
                }
            }
        }
    }
    return lowest;
}

bool Node::isInside(vec2 point){
    vec2 firstCorner, lastCorner, thisCorner;
    bool firstLoop = true;
    for(auto corner = _corners.begin(); corner != _corners.end(); corner++){
        thisCorner = (*corner)->coordinate;
        if(!firstLoop){
            if(isInTriangle(coordinate, lastCorner, thisCorner, point)){
                return true;
            }
        } else {
            firstCorner = thisCorner;
        }
        firstLoop = false;
        lastCorner = thisCorner;
    }
    if(isInTriangle(coordinate, lastCorner, firstCorner, point)){
        return true;
    }
    return false;
}

void Node::calculateNeighbours(){
    for(auto corner = _corners.begin(); corner != _corners.end(); corner++){
        for(auto neighbour = (*corner)->parents.begin(); neighbour != (*corner)->parents.end(); ++neighbour){
            if(*neighbour != this){
                neighbours.insert(*neighbour);
            }
        }
    }
}

void Node::calculateChildrensNeighbours(){
    for(auto child = _children.begin(); child != _children.end(); child++){
        (*child)->calculateNeighbours();
    }
    for(auto corner = _corners.begin(); corner != _corners.end(); corner++){
        (*corner)->calculateNeighbours();
    }
}

bool Node::isEdge(){
    if(parents.size() > 1){
        // this is a corner which by definition is an outer edge.
        return true;
    }
    for(auto neighbour = neighbours.begin(); neighbour != neighbours.end(); ++neighbour){
        for(auto neighboursParent = (*neighbour)->parents.begin(); neighboursParent != (*neighbour)->parents.end(); ++neighboursParent){
            if(*(parents.begin()) != *((*neighboursParent)->parents.begin())){
                // Neighbour belongs to a different parent.
                return true;
            }
        }
    }
    return false;
}


Node CreateMapRoot(){
    Node rootNode;
    rootNode.coordinate.x = MAPSIZE / 2;
    rootNode.coordinate.y = MAPSIZE / 2;

    rootNode.recursion = 0;
    rootNode.height = MAPSIZE;
    rootNode.terrain = TERRAIN_ROOT;

    vec2 tl = {0, 0};
    auto p_tl = std::make_shared<Node>(&rootNode, tl);

    vec2 tr = {MAPSIZE, 0};
    auto p_tr = std::make_shared<Node>(&rootNode, tr);

    vec2 bl = {0, MAPSIZE};
    auto p_bl = std::make_shared<Node>(&rootNode, bl);

    vec2 br = {MAPSIZE, MAPSIZE};
    auto p_br = std::make_shared<Node>(&rootNode, br);

    rootNode._corners.clear();
    rootNode._corners.push_back(p_tl);
    rootNode._corners.push_back(p_tr);
    rootNode._corners.push_back(p_br);
    rootNode._corners.push_back(p_bl);

    rootNode.populate();

    return rootNode;
}

inline int mapToScreenWidth(int x){
    //long long int _x =  (long long int)x * SCREEN_WIDTH;
    //return _x / MAPSIZE;
    return x * SCREEN_WIDTH / MAPSIZE;
}

inline int mapToScreenHeight(int y){
    return y * SCREEN_HEIGHT / MAPSIZE;
}


std::shared_ptr<Node> FindClosest(Node* startNode, glm::vec2 targetCoordinate, int recursion){
    std::shared_ptr<Node> closest;

    int distance = 2 * MAPSIZE;
    bool firstLoop = true;
    int tmpDistance;
    for(auto child = startNode->_children.begin(); child != startNode->_children.end(); ++child){
        //cout << " child ";
        if(firstLoop){
            closest = *child;
            distance = glm::distance(targetCoordinate, child->get()->coordinate);
        } else {
            tmpDistance = glm::distance(targetCoordinate, child->get()->coordinate);
            if(tmpDistance < distance){
                distance = tmpDistance;
                closest = *child;
            }
        }
        firstLoop = false;
    }
    for(auto corner = startNode->_corners.begin(); corner != startNode->_corners.end(); ++corner){
        //cout << " corner ";
        tmpDistance = glm::distance(targetCoordinate, corner->get()->coordinate);
        if(tmpDistance < distance){
            distance = tmpDistance;
            closest = *corner;
        }
    }

    if(closest->recursion != recursion && !closest->_children.empty() && !closest->_corners.empty()){
        std::shared_ptr<Node> cadidate = FindClosest(closest.get(), targetCoordinate, recursion);

        vec2 cadidateDistance = cadidate->coordinate - targetCoordinate;
        vec2 closestDistance = closest->coordinate - targetCoordinate;
        if(cadidateDistance.x * cadidateDistance.x + cadidateDistance.y * cadidateDistance.y < 
                closestDistance.x * closestDistance.x + closestDistance.y * closestDistance.y){
            return cadidate;
        }
    }
    return closest;
}

bool insideBoundary(vec2 coordinate){
    static long int minMargin = MAPSIZE * WORLD_MARGIN;
    static long int maxMargin = MAPSIZE - minMargin;
    if(coordinate.x < minMargin || coordinate.y < minMargin || coordinate.x > maxMargin || coordinate.y > maxMargin){
        return false;
    }
    return true;
}

/* Pick some random points as seed points for islands. */
void RaiseIslands(Node* rootNode){
    cout << "RaiseIslands() " << "\t" << endl;
    int validMapSize = MAPSIZE * (1 - (2 * WORLD_MARGIN));
    int mapMargin = (MAPSIZE - validMapSize) / 2;

    unordered_set<Node*> islandsComplete;
    for(int i = 0; i < ISLAND_NUMBER; ++i){
        vec2 islandCoordinate = {(HashFunction(1, i, HASHSALT, HASHSALT) % validMapSize) + mapMargin, (HashFunction(2, i, HASHSALT, HASHSALT) % validMapSize) + mapMargin};
        cout << "islandCoordinate " << islandCoordinate.x << ", " << islandCoordinate.y << endl;

        shared_ptr<Node> newIsland = FindClosest(rootNode, islandCoordinate, 1);
        _RaiseLand(newIsland.get(), &islandsComplete);
    }

    // Set initial terrain types.
    _SetTerrain(rootNode);

    // Generate more detail.
    for(auto island = islandsComplete.begin(); island != islandsComplete.end(); ++island){
        (*island)->populate();
    }
}

/* Extend Islands created in RaiseIslands. */
void _RaiseLand(Node* islandRoot, unordered_set<Node*>* p_islandsComplete){
    if(p_islandsComplete->count(islandRoot)){
        return;
    }
    if(!insideBoundary(islandRoot->coordinate)){
        return;
    }

    islandRoot->terrain = TERRAIN_LAND;
    p_islandsComplete->insert(islandRoot);
    islandRoot->height = MAPSIZE;
    int counter = 0;
    for(auto corner = islandRoot->_corners.begin(); corner != islandRoot->_corners.end(); ++corner){
        for(auto parent = corner->get()->parents.begin(); parent != corner->get()->parents.end(); ++parent){
            if(&(*parent) != (Node* const*)islandRoot){
                if(HashFunction(1, ++counter, (*parent)->coordinate.x, (*parent)->coordinate.y) % 100 <= ISLAND_GROW && 
                        (*parent)->coordinate.x > (MAPSIZE * WORLD_MARGIN) && 
                        (*parent)->coordinate.y > (MAPSIZE * WORLD_MARGIN) && 
                        (*parent)->coordinate.x < (MAPSIZE * (1 - WORLD_MARGIN)) && 
                        (*parent)->coordinate.x < (MAPSIZE * (1 - WORLD_MARGIN))){
                    _RaiseLand(*parent, p_islandsComplete);
                }
            }
        }
    }
}

void _SetTerrain(Node* islandRoot){
    unordered_set<Node*> closed_set;
    vector<Node*> working_set;
    Node* starting_node = FindClosest(islandRoot, {0,0}, 1).get();
    starting_node->terrain = TERRAIN_SEA;

    // Flood fill the Ocean.
    working_set.push_back(starting_node);
    while(working_set.size()){
        Node* working_node = working_set.back();
        working_set.pop_back();
        for(auto neighbour = working_node->neighbours.begin(); neighbour != working_node->neighbours.end(); ++neighbour){
            if((*neighbour)->terrain <= TERRAIN_SEA && closed_set.find(*neighbour) == closed_set.end()){
                cout << "*" << flush;
                closed_set.insert(*neighbour);
                working_set.push_back(*neighbour);
                (*neighbour)->terrain = TERRAIN_SEA;
            } else if((*neighbour)->terrain == TERRAIN_LAND){
                (*neighbour)->terrain = TERRAIN_SHORE;
            }
        }
    }
    cout << endl;

    // Now any remaining undefined nodes are Land.
    closed_set.clear();
    working_set.clear();
    working_set.push_back(starting_node);
    while(working_set.size()){
        Node* working_node = working_set.back();
        working_set.pop_back();
        for(auto neighbour = working_node->neighbours.begin(); neighbour != working_node->neighbours.end(); ++neighbour){
            if(closed_set.find(*neighbour) == closed_set.end()){
                cout << "#" << flush;
                closed_set.insert(*neighbour);
                working_set.push_back(*neighbour);
                if((*neighbour)->terrain == TERRAIN_UNDEFINED){
                    (*neighbour)->terrain = TERRAIN_LAND;
                }
            }
        }
    }
    cout << endl;
}

/*void PopulateShore(unordered_set<Node*> target_set){

    for(auto node = target_set.begin(); node != target_set.end(); ++node){
        (*node)->populate();
        for(auto child = (*node)->_children.begin(); child != (*node)->_children.end(); ++ child){
            //working_set.insert(*node);
            
        }
    }
}

void DistanceFromShore(Node* startNode){
    unordered_set<Node*> seedset;
    seedset.insert(startNode);
    
    unordered_set<Node*> shore = _DistanceFromShore(seedset);

    unordered_set<Node*> shore2 = _DistanceFromShore(shore);

    // TODO this just for fun...
    for(auto shoreNode = shore2.begin(); shoreNode != shore2.end(); ++shoreNode){
        if((*shoreNode)->tilesFromSea > 0){
            (*shoreNode)->populate();
            //(*shoreNode)->SetAboveSeaLevel();
        }
    }
    unordered_set<Node*> shore3 = _DistanceFromShore(shore2);
    cout << "DistanceFromShore() -" << endl;
}

unordered_set<Node*> _DistanceFromShore(unordered_set<Node*> seedset){
    unordered_set<Node*> openset, closedset, workingset, lastworkingset;

    for(auto seedNode = seedset.begin(); seedNode != seedset.end(); ++seedNode){
        for(auto child = (*seedNode)->_children.begin(); child != (*seedNode)->_children.end(); ++child){
            if((*child)->height){
                if((*child)->IsShore()){
                    closedset.insert(child->get());
                    (*child)->tilesFromSea = 1;
                } else {
                    openset.insert(child->get());
                }
            }
            for(auto corner = (*seedNode)->_corners.begin(); corner != (*seedNode)->_corners.end(); ++corner){
                if((*corner)->height){
                    if((*corner)->IsShore()){
                        closedset.insert(corner->get());
                        (*corner)->tilesFromSea = 1;
                    } else {
                        openset.insert(corner->get());
                    }
                }
            }
        }
    }

    lastworkingset.insert(closedset.begin(), closedset.end());
    unsigned int opensetsize = 0;
    while(opensetsize != openset.size()){   // Make sure opensetsize is changing. ie, we are not stalled.
        opensetsize = openset.size();
        cout << openset.size() << " " << closedset.size() << endl;

        for(auto node = lastworkingset.begin(); node != lastworkingset.end(); ++node){
            Node* lowestNeighbour = (*node)->LowestNeighbour();
            (*node)->height = lowestNeighbour->height + glm::distance((*node)->coordinate, lowestNeighbour->coordinate);

            for(auto corner = (*node)->_corners.begin(); corner != (*node)->_corners.end(); ++corner){
                for(auto neighbour = corner->get()->parents.begin(); neighbour != corner->get()->parents.end(); ++neighbour){
                    if((openset.count(*neighbour) || workingset.count(*neighbour)) && *neighbour != *node){
                        if(closedset.count(*neighbour) == 0){
                            openset.erase(*neighbour);
                            workingset.insert(*neighbour);
                            if((*neighbour)->tilesFromSea < (*node)->tilesFromSea +1){
                                (*neighbour)->tilesFromSea = (*node)->tilesFromSea +1;
                            }
                        }
                    }
                }
            }
        }
        closedset.insert(workingset.begin(), workingset.end());
        swap(lastworkingset, workingset);
        workingset.clear();
    }

    for(auto node = lastworkingset.begin(); node != lastworkingset.end(); ++node){
        Node* lowestNeighbour = (*node)->LowestNeighbour();
        (*node)->height = lowestNeighbour->height + glm::distance((*node)->coordinate, lowestNeighbour->coordinate);
        cout << (*node)->height << "\t";
    }
    cout << endl;
    
    cout << " ** " << openset.size() << "\t" << closedset.size() << endl;

    return closedset;
}*/

