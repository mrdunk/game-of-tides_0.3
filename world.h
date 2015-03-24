#ifndef GAMEOFTIDES_WORLD_H
#define GAMEOFTIDES_WORLD_H

#include <iostream>
#include <stdint.h>
#include <vector>
#include <unordered_set>
#include <memory>
#include <algorithm>    // std::min, std::max
#include <math.h>       /* pow */


#define GLM_FORCE_RADIANS
#include "/usr/include/glm/glm.hpp"
#include "/usr/include/glm/gtx/vector_angle.hpp"
//#include <glm/glm.hpp>
//#include <glm/gtx/vector_angle.hpp>

//#include "/usr/include/boost/polygon/voronoi.hpp"
#include "boost/polygon/voronoi.hpp"

#include <stdlib.h>     /* srand, rand */

#include "defines.h"


#define NODE_UNINITIALISED 0
#define NODE_PARTIAL 1
#define NODE_COMPLETE 2

#define TERRAIN_UNDEFINED 0
#define TERRAIN_SEA 1
#define TERRAIN_SHALLOWS 2
#define TERRAIN_SHORE 3
#define TERRAIN_LAND 4
#define TERRAIN_ROOT 99

unsigned int MurmurHashNeutral2 ( const void * key, int len, unsigned int seed );


/* An area of the map.
 * Reffered to a "cell" on the voronoi diagram. */
class Node {
    public:
        /* Coordinates of Node from {0,0} at top left. */
        glm::vec2 coordinate;

        /* Parents of this Node.
         * Regular children will only have one parent but corners may have multiple. */
        std::unordered_set<Node*> parents;

        /* */
        std::unordered_set<Node*> neighbours;

        /* Corners of a Node.
         * These are reffered to as "vertexes" on a voronoi diagram and are end points of voronoi "edges"
         * or the meeting points of voronoi "cells".
         * 
         * These corners are used as Nodes allong with te children for the next layer down of recusion.*/
        std::vector<std::shared_ptr<Node> > _corners;

        /* The Nodes on the next layer of recursion down. */
        std::vector<std::shared_ptr<Node> > _children;

        /* Track whether we have calculated the corners for this Node yet.
         * values:
         *  NODE_UNINITIALISED: Node empty. Corners set. Children not generated.
         *  NODE_PARTIAL: Children generated. 
         *  NODE_COMPLETE: Children's corners generated. */
        int populateProgress;

        /* How deeply recused this node is.
         * The root Node == 0.
         * The root Nodes children and corners have recursion == 1. etc. */
        int recursion;

        /* Height above sea level. */
        int height;

        int scenery;

        /* TERRAIN_SEA, TERRAIN_SHORE, etc. */
        int terrain;

        Node();
        Node(Node* parent, glm::vec2 coordinate);

        ~Node();

        void populate();

        /* Test if point is inside this tile. */
        bool isInside(glm::vec2 point);

        void SetTerrain();
    private:
        /* Corners must be inserted in order so we can travese thm in order when drawing a Node.
         * This method inerts them in clockwise rotation with straight up being the lowest posible. */
        void insertCorner(std::shared_ptr<Node> newCorner);

        void _SetTerrainCorners();
        void _SetTerrainChildren();

        void populateChildren();
        void populateChildrenSection(Node* lastnode, Node* thisnode);

        void calculateNeighbours();
        void calculateChildrensNeighbours();
};


/* Data type to pass to construct_voronoi(). */
struct Point {
    int a;
    int b;
    bool primary;   // Is this entry related to the Node we are working on or is is a nearby neighbour?
    std::shared_ptr<Node> p_node;   // Pointer to actual Node so we can reference it later.
    Point(std::shared_ptr<Node> _p_node, bool _primary) : a(_p_node->coordinate.x), b(_p_node->coordinate.y), primary(_primary), p_node(_p_node) {}
};

/* Generate first map Node. */
Node CreateMapRoot();

void RaiseIslands(Node* rootNode);
void _RaiseLand(Node* islandRoot, std::unordered_set<Node*>* islands);

/* Set terrain to TERRAIN_SEA or TERRAIN_LAND during initial CreateMapRoot(). */
void _SetTerrain(Node* rootNode);


bool insideBoundary(glm::vec2 coordinate);

std::shared_ptr<Node> FindClosest(Node* rootNode, glm::vec2 targetCoordinate, int recursion);

uint32_t HashFunction(const int a, const int b, const int c, const int d);

#endif  // GAMEOFTIDES_WORLD_H
