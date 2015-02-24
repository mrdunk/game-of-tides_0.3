

#include "sdl_map.h"

using glm::vec2;

void DrawMapNode(Node* node, SDL_Renderer* renderer){
    vec2 coordinate = node->coordinate * DISPLAY_RATIO;
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
    for(auto corner = node->_corners.begin(); corner != node->_corners.end(); corner++){
        cornerCoordinate = corner->get()->coordinate * DISPLAY_RATIO;
        if(!firstLoop){
            if(node->recursion == 2){
                if(lastCorner.x >= 0 && lastCorner.x <= SCREEN_SIZE && lastCorner.y >= 0 && lastCorner.y <= SCREEN_SIZE &&
                        cornerCoordinate.x >= 0 && cornerCoordinate.x <= SCREEN_SIZE && cornerCoordinate.y >= 0 && cornerCoordinate.y <= SCREEN_SIZE && 
                        coordinate.x >= 0 && coordinate.x <= SCREEN_SIZE && coordinate.y >= 0 && coordinate.y <= SCREEN_SIZE){
                    filledTrigonRGBA(renderer, lastCorner.x, lastCorner.y, cornerCoordinate.x, cornerCoordinate.y, coordinate.x, coordinate.y, 0x22, 0xAA, 0x22, 0xFF);
                }
            //} else {
            //    filledTrigonRGBA(renderer, lastCorner.x, lastCorner.y, cornerCoordinate.x, cornerCoordinate.y, coordinate.x, coordinate.y, 0x11, 0x66, 0xEE, 0xFF);
            }
        }
        firstLoop = false;
        lastCorner = cornerCoordinate;

        DrawMapNode(corner->get(), renderer);
    }
    // The for() loop above doesn't close the circle. Do that now.
    if(node->_corners.size()){
        if(node->recursion == 2){
            if(lastCorner.x >= 0 && lastCorner.x <= SCREEN_SIZE && lastCorner.y >= 0 && lastCorner.y <= SCREEN_SIZE &&
                    cornerCoordinate.x >= 0 && cornerCoordinate.x <= SCREEN_SIZE && cornerCoordinate.y >= 0 && cornerCoordinate.y <= SCREEN_SIZE && 
                    coordinate.x >= 0 && coordinate.x <= SCREEN_SIZE && coordinate.y >= 0 && coordinate.y <= SCREEN_SIZE){
                filledTrigonRGBA(renderer, lastCorner.x, lastCorner.y,
                        node->_corners.front()->coordinate.x * DISPLAY_RATIO, node->_corners.front()->coordinate.y * DISPLAY_RATIO,
                        coordinate.x, coordinate.y, 0x77, 0xAA, 0x55, 0xFF);
            }
        //} else {
        //    filledTrigonRGBA(renderer, lastCorner.x, lastCorner.y,
        //            node->_corners.front()->coordinate.x * DISPLAY_RATIO, node->_corners.front()->coordinate.y * DISPLAY_RATIO,
        //            coordinate.x, coordinate.y, 0x11, 0x66, 0xEE, 0xFF);
        }
    }

    for(auto child = node->_children.begin(); child != node->_children.end(); child++){
        DrawMapNode(child->get(), renderer);
    }
}
