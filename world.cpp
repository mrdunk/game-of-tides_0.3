#include "world.h"


using std::vector;
using std::unordered_set;
using std::cout;
using std::endl;
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



Node::Node(Node* parent, vec2 _coordinate){
    parents.insert(parent);
    coordinate = _coordinate;
    populateProgress = NODE_UNINITIALISED;
    recursion = parent->recursion +1;
    height = 0;
}

Node::Node(){
    std::cout << "Node::Node()" << std::endl;
    populateProgress = NODE_UNINITIALISED;
    height = 0;
}

Node::~Node(){
    std::cout << "Node::~Node()" << std::endl;
}

void Node::populateChild(vec2 & lastcorner, vec2 & thiscorner, vec2 & coordinate){
    vec2 result;

    if(lastcorner.x < 0 || lastcorner.x > MAPSIZE || lastcorner.y < 0 || lastcorner.y > MAPSIZE ||
            thiscorner.x < 0 || thiscorner.x > MAPSIZE || thiscorner.y < 0 || thiscorner.y > MAPSIZE ||
            coordinate.x < 0 || coordinate.x > MAPSIZE || coordinate.y < 0 || coordinate.y > MAPSIZE){
        cout << lastcorner.x << ", " << lastcorner.y << "\t" <<
                thiscorner.x << ", " << thiscorner.y << "\t" <<
                coordinate.x << ", " << coordinate.y << "\t" << endl;
        return;
    }


    float area = (max(lastcorner.x, max(thiscorner.x, coordinate.x)) - min(lastcorner.x, min(thiscorner.x, coordinate.x))) *
                    (max(lastcorner.y, max(thiscorner.y, coordinate.y)) - min(lastcorner.y, min(thiscorner.y, coordinate.y)));

    int32_t seedNumber = SEED_NUMBER * pow((recursion +1), 5);
    seedNumber *= (area / MAPSIZE) / MAPSIZE;       // Divide like this so we don't overflow int with large MAPSIZE.

    for(int i = 0; i < seedNumber; ++i){
        result = (((float)rand() / RAND_MAX) * (lastcorner - coordinate)) + (((float)rand() / RAND_MAX) * (thiscorner - coordinate)) + coordinate;
        if(glm::orientedAngle(glm::normalize(result - thiscorner), glm::normalize(lastcorner - thiscorner)) > 0.0f &&
                result.x >= 0 && result.x < MAPSIZE && result.y >= 0 && result.y < MAPSIZE){
            _children.push_back(std::make_shared<Node>(this, result));
            cout << ".";
        }
    }
    cout << endl;
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
    cout << "c";
}

void Node::populate(){
    populate(true);
}

void Node::populate(bool setCorners){
    cout << "Node::populate()" << endl;

    // Generate children for this node if not already done.
    if(_children.empty()){
        bool first = true;
        vec2 lastcorner, thiscorner;

        for(auto corner = _corners.begin(); corner != _corners.end(); corner++){
            thiscorner = corner->get()->coordinate;

            if(!first){
                populateChild(lastcorner, thiscorner, coordinate);
            }
            first = false;

            lastcorner = thiscorner;
        }

        populateChild(_corners.back()->coordinate, _corners.front()->coordinate, coordinate);
    }

    if(setCorners){
        // Set points in neighbours.
        unordered_set<Node*> neighbours;
        for(auto corner = _corners.begin(); corner != _corners.end(); corner++){
            for(auto parent = corner->get()->parents.begin(); parent != corner->get()->parents.end(); parent++){
                if(*parent != this && neighbours.count(*parent) == 0){
                    cout << " parent" << endl;
                    neighbours.insert(*parent);
                    (*parent)->populate(false);
                }
            }
        }

        // Calculate voronoi diagram for this node and surrounding points.
        if(populateProgress != NODE_COMPLETE){
            // Get list of all points.
            vector<Point> points;
            for(auto corner = _corners.begin(); corner != _corners.end(); corner++){
                points.push_back(Point(*corner, true));
            }
            for(auto child = _children.begin(); child != _children.end(); child++){
                points.push_back(Point(*child, true));
            }

            // TODO We only need the neighbouring nodes from the nearest triangle.
            for(auto neighbour = neighbours.begin(); neighbour != neighbours.end(); neighbour++){
                for(auto corner = (*neighbour)->_corners.begin(); corner != (*neighbour)->_corners.end(); corner++){
                    points.push_back(Point(*corner, false));
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

                    cout << "  cell " << cell0.source_index() << endl;

                    // Iterate edges around Voronoi cell.
                    do{
                        if(edge->is_primary()){
                            const voronoi_diagram<double>::cell_type &cell1 = *edge->twin()->cell();

                            cout << "    edge " << cell1.source_index() << endl;

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
                                cout << endl;
                            }
                        }
                        edge = edge->next();
                    } while(edge != cell0.incident_edge());
                }
            }
            populateProgress = NODE_COMPLETE;
        }
    }
    cout << "Node::populate() -" << endl;
}

void Node::SetAboveSeaLevel(){
    height = 1;
    for(auto child = _children.begin(); child != _children.end(); child++){
        (*child)->height = 1;
        for(auto childsCorner = (*child)->_corners.begin(); childsCorner != (*child)->_corners.end(); ++childsCorner){
            for(auto childsNeghbour = (*childsCorner)->parents.begin(); childsNeghbour != (*childsCorner)->parents.end(); ++childsNeghbour){
                if(!(*(*childsNeghbour)->parents.begin())->height){
                    child->get()->height = 0;
                }
            }
        }
    }

    // Only make a corner land if all it's adjoning Nodes are land.
    for(auto corner = _corners.begin(); corner != _corners.end(); corner++){
        int cornerHeight = 1;
        for(auto parent = (*corner)->parents.begin(); parent != (*corner)->parents.end(); ++parent){
            if((*parent)->height == 0){
                cornerHeight = 0;
            }
        }
        (*corner)->height = cornerHeight;
    }
}

Node CreateMapRoot(){
    Node rootNode;
    rootNode.coordinate.x = MAPSIZE / 2;
    rootNode.coordinate.y = MAPSIZE / 2;

    rootNode.recursion = 0;
    rootNode.height = 1;

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

    std::shared_ptr<Node> cadidate;
    if(closest->recursion != recursion){
        cadidate = FindClosest(closest.get(), targetCoordinate, recursion);

        vec2 cadidateDistance = cadidate->coordinate - targetCoordinate;
        vec2 closestDistance = closest->coordinate - targetCoordinate;
        if(cadidateDistance.x * cadidateDistance.x + cadidateDistance.y * cadidateDistance.y < 
                closestDistance.x * closestDistance.x + closestDistance.y * closestDistance.y){
            return cadidate;
        }
    }
    return closest;
}

void RaiseIslands(Node* rootNode){
    cout << "RaiseIslands() " << RAND_MAX << "\t" << endl;  // rand() % MAPSIZE << "\t" << rand() % MAPSIZE << "\t" << rand() % MAPSIZE <<  endl;
    int validMapSize = MAPSIZE * (1 - (2 * WORLD_MARGIN));
    int mapMargin = (MAPSIZE - validMapSize) / 2;

    unordered_set<Node*> islandsComplete;
    for(int i = 0; i < ISLAND_NUMBER; ++i){
        vec2 islandCoordinate = {(rand() % validMapSize) + mapMargin, (rand() % validMapSize) + mapMargin};
        cout << "islandCoordinate " << islandCoordinate.x << ", " << islandCoordinate.y << endl;

        shared_ptr<Node> newIsland = FindClosest(rootNode, islandCoordinate, 1);
        _RaiseLand(newIsland.get(), &islandsComplete);
    }

    for(auto island = islandsComplete.begin(); island != islandsComplete.end(); ++island){
        (*island)->SetAboveSeaLevel();
    }
}

void _RaiseLand(Node* islandRoot, unordered_set<Node*>* p_islandsComplete){
    if(p_islandsComplete->count(islandRoot)){
        return;
    }
    if(!insideBoundary(islandRoot->coordinate)){
        return;
    }
    p_islandsComplete->insert(islandRoot);
    islandRoot->populate();
    //islandRoot->SetAboveSeaLevel();
    islandRoot->height = 1;
    for(auto corner = islandRoot->_corners.begin(); corner != islandRoot->_corners.end(); ++corner){
        for(auto parent = corner->get()->parents.begin(); parent != corner->get()->parents.end(); ++parent){
            if(&(*parent) != (Node* const*)islandRoot){
                if(rand() % 100 <= ISLAND_GROW && (*parent)->coordinate.x > (MAPSIZE * WORLD_MARGIN) && 
                        (*parent)->coordinate.y > (MAPSIZE * WORLD_MARGIN) && 
                        (*parent)->coordinate.x < (MAPSIZE * (1 - WORLD_MARGIN)) && 
                        (*parent)->coordinate.x < (MAPSIZE * (1 - WORLD_MARGIN))){
                    _RaiseLand(*parent, p_islandsComplete);
                }
            }
        }
    }
}

bool insideBoundary(vec2 coordinate){
    static long int minMargin = MAPSIZE * WORLD_MARGIN;
    static long int maxMargin = MAPSIZE - minMargin;
    cout << minMargin << ", " << maxMargin << "\t" << coordinate.x << ", " << coordinate.y << endl;
    if(coordinate.x < minMargin || coordinate.y < minMargin || coordinate.x > maxMargin || coordinate.y > maxMargin){
    //    return false;
    }
    return true;
}
