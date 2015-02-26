

#include "sdl_map.h"

using glm::vec2;
using std::cout;
using std::endl;



void View::ZoomIn(){
    ++zoom;
    offset += vec2(SCREEN_SIZE /2, SCREEN_SIZE /2);
    cout << "zoom: " << zoom << endl;
    cout << "offset: " << offset.x << ", " << offset.y << endl;
}

void View::ZoomOut(){
    --zoom;
    if(zoom < 1){
        zoom = 1;
    }
    offset -= vec2(SCREEN_SIZE /2, SCREEN_SIZE /2);

    // These will have the effect of making sure display is within boundaries.
    PanDown();
    PanUp();
    PanLeft();
    PanRight();

    cout << "zoom: " << zoom << endl;
}

void View::PanUp(){
    offset.y -= PAN_STEP_SIZE;
    if(offset.y < 0){
        offset.y = 0;
    }
    cout << "offset: " << offset.x << ", " << offset.y << endl;
}

void View::PanDown(){
    offset.y += PAN_STEP_SIZE;
    if(offset.y > (SCREEN_SIZE * (zoom -1))){
        offset.y = (SCREEN_SIZE * (zoom -1));
    }
    cout << "offset: " << offset.x << ", " << offset.y << endl;
}

void View::PanLeft(){
    offset.x -= PAN_STEP_SIZE;
    if(offset.x < 0){
        offset.x = 0;
    }
    cout << "offset: " << offset.x << ", " << offset.y << endl;
}

void View::PanRight(){
    offset.x += PAN_STEP_SIZE;   
    if(offset.x > (SCREEN_SIZE * (zoom -1))){
        offset.x = (SCREEN_SIZE * (zoom -1));
    }
    cout << "offset: " << offset.x << ", " << offset.y << endl;
}

void View::ToggleWireframe(){
    wireframe = !wireframe;
}

bool insideScreenBoundary(vec2 coordinate, View* p_view){
    if(coordinate.x < 0 || coordinate.y < 0 || coordinate.x > SCREEN_SIZE || coordinate.y > SCREEN_SIZE){
        return false;
    }
    return true;
}

vec2 applyPanOffset(vec2 coordinate, View* p_view){
    return coordinate - p_view->offset;
}

void DrawMapNode(Node* node, SDL_Renderer* renderer, View* p_view){
    float displayRatio = DISPLAY_RATIO * p_view->zoom;
    vec2 coordinate = node->coordinate * displayRatio;
    coordinate = applyPanOffset(coordinate, p_view);
    int x = coordinate.x;
    int y = coordinate.y;

    // Not Root Node and not in display window.
    if(node->recursion && !insideScreenBoundary(coordinate, p_view)){
        return;
    }

    if(p_view->wireframe){
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
    }

    //cout << node->coordinate.x << ", " << node->coordinate.y << "\t" << x << ", " << y << endl;

    if(node->height){
        vec2 cornerCoordinate, lastCorner;
        bool firstLoop = true;
        int color = 0;
        for(auto corner = node->_corners.begin(); corner != node->_corners.end(); corner++){
            cornerCoordinate = applyPanOffset(corner->get()->coordinate * displayRatio, p_view);
            if(!firstLoop && insideScreenBoundary(lastCorner, p_view) && insideScreenBoundary(cornerCoordinate, p_view)){
                if(node->recursion >= 2){
                    filledTrigonRGBA(renderer, lastCorner.x, lastCorner.y, cornerCoordinate.x, cornerCoordinate.y, coordinate.x, coordinate.y,
                        0x22, 0x44 + color, 0x22, 0xFF);
                    if(p_view->wireframe){
                        SDL_SetRenderDrawColor(renderer, 0xFF, 0, 0, 0);
                        SDL_RenderDrawLine(renderer, lastCorner.x, lastCorner.y, cornerCoordinate.x, cornerCoordinate.y);
                    }
                }
                color += 0x08;
            }
            firstLoop = false;
            lastCorner = cornerCoordinate;

            DrawMapNode(corner->get(), renderer, p_view);
        }
        // The for() loop above doesn't close the circle. Do that now.
        if(!firstLoop){
            if(node->recursion >= 2){
                cornerCoordinate = applyPanOffset(node->_corners.front()->coordinate * displayRatio, p_view);
                filledTrigonRGBA(renderer, cornerCoordinate.x, cornerCoordinate.y,
                        lastCorner.x, lastCorner.y, coordinate.x, coordinate.y, 0x44, 0x44 + color, 0x22, 0xFF);
                if(p_view->wireframe){
                    SDL_SetRenderDrawColor(renderer, 0xFF, 0, 0, 0);
                    SDL_RenderDrawLine(renderer, cornerCoordinate.x, cornerCoordinate.y, lastCorner.x, lastCorner.y);
                }
            }
        }

        for(auto child = node->_children.begin(); child != node->_children.end(); child++){
            DrawMapNode(child->get(), renderer, p_view);
        }
    }
}


/**
* From: http://www.willusher.io/sdl2%20tutorials/2013/12/18/lesson-6-true-type-fonts-with-sdl_ttf/
*
* Render the message we want to display to a texture for drawing
* @param message The message we want to display
* @param fontFile The font we want to use to render the text
* @param color The color we want the text to be
* @param fontSize The size we want the font to be
* @param renderer The renderer to load the texture in
* @return An SDL_Texture containing the rendered message, or nullptr if something went wrong
*/
SDL_Texture* renderText(const std::string &message, const std::string &fontFile,
    SDL_Color color, int fontSize, SDL_Renderer *renderer)
{
    //Open the font
    // TODO Do Not open this every call. Open it once at start.
    TTF_Font *font = TTF_OpenFont(fontFile.c_str(), fontSize);
    if (font == nullptr){
        cout << "error: TTF_OpenFont " << SDL_GetError() << endl;
        return nullptr;
    }   
    //We need to first render to a surface as that's what TTF_RenderText
    //returns, then load that surface into a texture
    SDL_Surface *surf = TTF_RenderText_Blended(font, message.c_str(), color);
    if (surf == nullptr){
        TTF_CloseFont(font);
        cout << "error: TTF_RenderText " << SDL_GetError() << endl;
        return nullptr;
    }
    SDL_Texture *texture = SDL_CreateTextureFromSurface(renderer, surf);
    if (texture == nullptr){
        cout << "error: CreateTexture " << SDL_GetError() << endl;
    }
    //Clean up the surface and font
    SDL_FreeSurface(surf);
    TTF_CloseFont(font);
    return texture;
}

/**
* From: http://www.willusher.io/sdl2%20tutorials/2013/08/17/lesson-2-dont-put-everything-in-main/
*
* Draw an SDL_Texture to an SDL_Renderer at position x, y, preserving
* the texture's width and height
* @param tex The source texture we want to draw
* @param ren The renderer we want to draw to
* @param x The x coordinate to draw to
* @param y The y coordinate to draw to
*/
void renderTexture(SDL_Texture *tex, SDL_Renderer *ren, int x, int y){
    //Setup the destination rectangle to be at the position we want
    SDL_Rect dst;
    dst.x = x;
    dst.y = y;
    //Query the texture to get its width and height to use
    SDL_QueryTexture(tex, NULL, NULL, &dst.w, &dst.h);
    SDL_RenderCopy(ren, tex, NULL, &dst);
}
