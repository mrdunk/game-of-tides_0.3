

#include "sdl_map.h"

using glm::vec2;

void DrawMapNode(Node* node, SDL_Renderer* renderer, int zoom){
    float displayRatio = DISPLAY_RATIO * zoom;
    vec2 coordinate = node->coordinate * displayRatio;
    int x = coordinate.x;
    int y = coordinate.y;

    if(node->recursion == 1){
        SDL_SetRenderDrawColor(renderer, 0xFF, 0x00, 0x00, 0xFF );
        SDL_Rect fillRect = {x -2, y -2, 4, 4};
        SDL_RenderFillRect(renderer, &fillRect);
        //SDL_RenderDrawPoint(renderer, x, y);
    } else if(node->recursion == 2 && node->parents.size() > 1){
        SDL_SetRenderDrawColor(renderer, 0x00, 0x44, 0x00, 0xFF );
        SDL_Rect fillRect = {x -1, y -1, 3, 3};
        SDL_RenderFillRect(renderer, &fillRect);
    }

    //cout << node->coordinate.x << ", " << node->coordinate.y << "\t" << x << ", " << y << endl;

    vec2 cornerCoordinate, lastCorner;
    SDL_SetRenderDrawColor(renderer, 0x40 * node->recursion, 0x20 * node->recursion, 0xFF, 0xFF );
    bool firstLoop = true;
    int color = 0;
    for(auto corner = node->_corners.begin(); corner != node->_corners.end(); corner++){
        cornerCoordinate = corner->get()->coordinate * displayRatio;
        if(!firstLoop){
            if(node->recursion == 2){
                filledTrigonRGBA(renderer, lastCorner.x, lastCorner.y, cornerCoordinate.x, cornerCoordinate.y, coordinate.x, coordinate.y, 0x22, 0x44 + color, 0x22, 0xFF);
            }
            color += 0x08;
        }
        firstLoop = false;
        lastCorner = cornerCoordinate;

        DrawMapNode(corner->get(), renderer, zoom);
    }
    // The for() loop above doesn't close the circle. Do that now.
    if(!firstLoop){
        if(node->recursion == 2){
                filledTrigonRGBA(renderer, 
                        node->_corners.back()->coordinate.x * displayRatio, node->_corners.back()->coordinate.y * displayRatio,
                        node->_corners.front()->coordinate.x * displayRatio, node->_corners.front()->coordinate.y * displayRatio,
                        coordinate.x, coordinate.y, 0x44, 0x44 + color, 0x22, 0xFF);
        }
    }

    for(auto child = node->_children.begin(); child != node->_children.end(); child++){
        DrawMapNode(child->get(), renderer, zoom);
    }
}
