#include "sdl_map.h"

using glm::vec2;
using std::cout;
using std::endl;
using std::flush;
using std::vector;


View::View(Node* p_rootNode) : zoom(1), wireframe(0), _p_rootNode(p_rootNode), mapDirty(true) {
    offset = vec2(0.5, 0.5);
    _RegisterRenderer();
    _RegisterFont("/usr/share/fonts/truetype/freefont/FreeMono.ttf", 16);
}

View::~View(){
    SDL_DestroyRenderer(rendererMap);
    SDL_DestroyWindow(window);
    TTF_CloseFont(_p_font);
    SDL_Quit();
}

void View::ZoomIn(){
    ++zoom;
    cout << "zoom: " << zoom << endl;
    cout << "offset: " << offset.x << ", " << offset.y << endl;
    mapDirty = true;
}

void View::ZoomOut(){
    --zoom;
    if(zoom < 1){
        zoom = 1;
    }

    // These will have the effect of making sure display is within boundaries.
    PanDown();
    PanUp();
    PanLeft();
    PanRight();

    //mapDirty = true;

    cout << "zoom: " << zoom << endl;
}

void View::PanUp(){
    offset.y -= PAN_STEP_SIZE;
    if(offset.y < (0 + pow(0.5, zoom))){
        offset.y = 0 + pow(0.5, zoom);
    }

    mapDirty = true;

    cout << "offset: " << offset.x << ", " << offset.y << endl;
}

void View::PanDown(){
    offset.y += PAN_STEP_SIZE;
    if(offset.y > (1 - pow(0.5, zoom))){
       offset.y = 1 - pow(0.5, zoom);
    }

    mapDirty = true;

    cout << "offset: " << offset.x << ", " << offset.y << endl;
}

void View::PanLeft(){
    offset.x -= PAN_STEP_SIZE;
    if(offset.x < (0 + pow(0.5, zoom))){
        offset.x = 0 + pow(0.5, zoom);
    }

    mapDirty = true;

    cout << "offset: " << offset.x << ", " << offset.y << endl;
}

void View::PanRight(){
    offset.x += PAN_STEP_SIZE;   
    if(offset.x > (1 - pow(0.5, zoom))){
        offset.x = 1 - pow(0.5, zoom);
    }

    mapDirty = true;

    cout << "offset: " << offset.x << ", " << offset.y << endl;
}

void View::ToggleWireframe(){
    wireframe = !wireframe;

    mapDirty = true;
}


TTF_Font* View::_RegisterFont(const std::string &fontFile, int fontSize){
    _p_font = TTF_OpenFont(fontFile.c_str(), fontSize);
    if (_p_font == nullptr){
        cout << "Error: TTF_OpenFont: " << SDL_GetError() << endl;
    }
    return _p_font;
}

bool View::InsideScreenBoundary(glm::vec2 coordinate){
    if(coordinate.x < 0 || coordinate.y < 0 || coordinate.x > SCREEN_SIZE || coordinate.y > SCREEN_SIZE){
        return false;
    }
    return true;
}

void View::DrawMapFromRoot(Node* node){
    if(mapDirty){
        mapDirty = false;
        Clear();
        DrawMapNode(node);
    }
}

void View::DrawMapCursor(){
    static vec2 lastDataPos;
    vec2 dataPos = _ReversePanOffset(mousePos);
    if(lastDataPos != dataPos){
        // Cursor has moved.
        mapDirty = true;

        _mouseNode = FindClosest(_p_rootNode, dataPos, 4);
        lastDataPos = dataPos;
       
        cout << "recursion: " << _mouseNode.get()->recursion << "\t" << "tilesFromSea: " << _mouseNode.get()->tilesFromSea << 
            "\t" << "parents:" << _mouseNode.get()->parents.size()  << "\t" << "height: " << _mouseNode.get()->height << endl;
    }

    if(_mouseNode.get()){
        SDL_SetRenderDrawColor(rendererMap, 0xFF, 0x00, 0x00, 0xFF );
        vec2 coordinate = _ApplyPanOffset(_mouseNode.get()->coordinate);
        bool firstLoop = true;
        vec2 firstPoint, lastPoint, thisPoint;
        for(auto corner = _mouseNode.get()->_corners.begin(); corner != _mouseNode.get()->_corners.end(); ++corner){
            thisPoint = _ApplyPanOffset((*corner)->coordinate);
            if(!firstLoop){
                SDL_RenderDrawLine(rendererMap, lastPoint.x, lastPoint.y, thisPoint.x, thisPoint.y);
            } else {
                firstPoint = thisPoint;
            }
            firstLoop = false;
            lastPoint = thisPoint;

            for(auto neighbour = (*corner)->parents.begin(); neighbour != (*corner)->parents.end(); ++neighbour){
                if(*neighbour != _mouseNode.get()){
                    vec2 neighbourCoordinate = _ApplyPanOffset((*neighbour)->coordinate);
                    SDL_RenderDrawLine(rendererMap, coordinate.x, coordinate.y, neighbourCoordinate.x, neighbourCoordinate.y);
                }
            }
        }
        if(!firstLoop){
            SDL_RenderDrawLine(rendererMap, lastPoint.x, lastPoint.y, firstPoint.x, firstPoint.y);
        }

        SDL_SetRenderDrawColor(rendererMap, 0xAA, 0x00, 0x00, 0xFF );
        for(auto parent = _mouseNode.get()->parents.begin(); parent != _mouseNode.get()->parents.end(); ++parent){
            firstLoop = true;
            for(auto corner = (*parent)->_corners.begin(); corner != (*parent)->_corners.end(); ++corner){
                thisPoint = _ApplyPanOffset((*corner)->coordinate);
                if(!firstLoop){
                    SDL_RenderDrawLine(rendererMap, lastPoint.x, lastPoint.y, thisPoint.x, thisPoint.y);
                } else {
                    firstPoint = thisPoint;
                }
                firstLoop = false;
                lastPoint = thisPoint;
            }
            if(!firstLoop){
                SDL_RenderDrawLine(rendererMap, lastPoint.x, lastPoint.y, firstPoint.x, firstPoint.y);
            }
        }

        if(mouseClick){
            _mouseNode.get()->populate();
        }
    }
}

void View::DrawMapNode(Node* node){
    vec2 coordinate = _ApplyPanOffset(node->coordinate);

    if(node->terrain >= TERRAIN_SHALLOWS || node->terrain == TERRAIN_ROOT){  //node->height){
        //if(node->recursion >= 1){
        if(node->populateProgress != NODE_COMPLETE){
            vec2 cornerCoordinate, firstCorner, lastCorner;
            bool firstLoop = true;
            for(auto corner = node->_corners.begin(); corner != node->_corners.end(); corner++){
                cornerCoordinate = _ApplyPanOffset(corner->get()->coordinate);
                if(!firstLoop && (InsideScreenBoundary(coordinate) || InsideScreenBoundary(lastCorner) || InsideScreenBoundary(cornerCoordinate))){
                    filledTrigonRGBA(rendererMap, lastCorner.x, lastCorner.y, cornerCoordinate.x, cornerCoordinate.y, coordinate.x, coordinate.y,
                            //0x00, node->height / 2000, 0x00, 0xFF);
                            0x00, (node->terrain -2) * 50, 0x00, 0xFF);
                }
                firstLoop = false;
                lastCorner = cornerCoordinate;
            }
            // Close loop.
            if(!firstLoop){
                cornerCoordinate = _ApplyPanOffset(node->_corners.front()->coordinate);
                if(InsideScreenBoundary(coordinate) || InsideScreenBoundary(lastCorner) || InsideScreenBoundary(cornerCoordinate)){
                    filledTrigonRGBA(rendererMap, lastCorner.x, lastCorner.y, cornerCoordinate.x, cornerCoordinate.y, coordinate.x, coordinate.y,
                            //0x00, node->height / 2000, 0x00, 0xFF);
                            0x00, (node->terrain -2) * 50, 0x00, 0xFF);
                }
            }
        } else {
            for(auto child = node->_children.begin(); child != node->_children.end(); child++){
                DrawMapNode(child->get());
            }
            for(auto corner = node->_corners.begin(); corner != node->_corners.end(); corner++){
                DrawMapNode(corner->get());
            }
        }
    }

    // Draw debug outlines of Nodes.
    if(wireframe){
        if(node->height != 0 && node->height != MAPSIZE){
            SDL_SetRenderDrawColor(rendererMap, 0x00, 0xFF, 0xFF, 0xFF );
        } else {
            SDL_SetRenderDrawColor(rendererMap, 0x88, 0x88, 0xFF, 0xFF );
        }
        SDL_Rect fillRect = {(int)(coordinate.x -2), (int)(coordinate.y -2), 4, 4};
        SDL_RenderFillRect(rendererMap, &fillRect);

        if(node->height != 0 && node->height != MAPSIZE){
            SDL_SetRenderDrawColor(rendererMap, 0x00, 0xFF, 0xFF, 0xFF );
        } else {
            SDL_SetRenderDrawColor(rendererMap, 0x88, 0x88, 0xFF, 0xFF );
        }
        if(node->recursion >= 1){
            vec2 cornerCoordinate, firstCorner, lastCorner;
            bool firstLoop = true;
            for(auto corner = node->_corners.begin(); corner != node->_corners.end(); corner++){
                cornerCoordinate = _ApplyPanOffset(corner->get()->coordinate);
                if(!firstLoop && (InsideScreenBoundary(coordinate) || InsideScreenBoundary(lastCorner) || InsideScreenBoundary(cornerCoordinate))){
                    SDL_RenderDrawLine(rendererMap, cornerCoordinate.x, cornerCoordinate.y, lastCorner.x, lastCorner.y);
                }
                firstLoop = false;
                lastCorner = cornerCoordinate;
            }
            // Close loop.
            if(!firstLoop){
                cornerCoordinate = _ApplyPanOffset(node->_corners.front()->coordinate);
                if(InsideScreenBoundary(coordinate) || InsideScreenBoundary(lastCorner) || InsideScreenBoundary(cornerCoordinate)){
                    SDL_RenderDrawLine(rendererMap, cornerCoordinate.x, cornerCoordinate.y, lastCorner.x, lastCorner.y);
                }
            }
        }
    }
}



vec2 View::_ApplyPanOffset(vec2 viewCoordinate){
    float displayRatio = DISPLAY_RATIO * zoom;
    return ((viewCoordinate - (offset * (float)MAPSIZE)) * displayRatio) + vec2(SCREEN_SIZE/2, SCREEN_SIZE/2);
}

vec2 View::_ReversePanOffset(glm::vec2 dataCoordinate){
    float displayRatio = DISPLAY_RATIO * zoom;
    return ((dataCoordinate - vec2(SCREEN_SIZE/2, SCREEN_SIZE/2)) / displayRatio) + (offset * (float)MAPSIZE);
}


bool View::_RegisterRenderer(){
    if (SDL_Init(SDL_INIT_VIDEO) != 0){
        std::cout << "SDL_Init Error: " << SDL_GetError() << std::endl;
        return 1;
    }

    // The Program Window.
    window = SDL_CreateWindow("Hello World!", 100, 100, SCREEN_WIDTH, SCREEN_HEIGHT, SDL_WINDOW_SHOWN);
    if (window == nullptr){
        std::cout << "SDL_CreateWindow Error: " << SDL_GetError() << std::endl;
        return 1;
    }

    // Init Fonts.
    if (TTF_Init() != 0){
        std::cout << "TTF_Init: " << SDL_GetError() << std::endl;
        return 1;
    }

    //The window renderer.
    rendererMap = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED);
    if (rendererMap == nullptr){
        std::cout << "SDL_CreateWindow Error: " << SDL_GetError() << std::endl;
        return 1;
    }

    return 0;
}


void View::Render(){
    SDL_RenderPresent(rendererMap);
}

void View::ParseInput(){
        SDL_Event e;
        int mousePos_x, mousePos_y;
        mouseClick = false;
        quit = false;
        while (SDL_PollEvent(&e) != 0){
            if (e.type == SDL_QUIT){
                quit = true;
            }
            if (e.type == SDL_KEYDOWN){
                        switch( e.key.keysym.sym )
                        {
                            case SDLK_EQUALS:
                            ZoomIn();
                            break;

                            case SDLK_MINUS:
                            ZoomOut();
                            break;

                            case SDLK_UP:
                            PanUp();
                            break;

                            case SDLK_DOWN:
                            PanDown();
                            break;

                            case SDLK_LEFT:
                            PanLeft();
                            break;

                            case SDLK_RIGHT:
                            PanRight();
                            break;

                            case SDLK_SPACE:
                            ToggleWireframe();
                            break;

                            case SDLK_RETURN:
                            quit = true;
                            break;

                            default:
                            //quit = true;
                            break;
                        }
            }
            if (e.type == SDL_MOUSEBUTTONDOWN){
                mouseClick = true;
            }
            if (e.type == SDL_MOUSEMOTION){
                SDL_GetMouseState(&(mousePos_x), &(mousePos_y));
                mousePos.x = mousePos_x;
                mousePos.y = mousePos_y;
            }
        }
}

void View::Clear(){
    //Clear screen
    SDL_SetRenderDrawColor(rendererMap, 0x9F, 0x9F, 0x9F, 0xFF );
    SDL_RenderClear(rendererMap);

    //Render blue filled quad. (The sea.)
    SDL_Rect fillRect = { 0, 0, SCREEN_SIZE, SCREEN_SIZE};
    SDL_SetRenderDrawColor(rendererMap, 0x22, 0x88, 0xEE, 0xFF);        
    SDL_RenderFillRect(rendererMap, &fillRect );
}

void View::RenderText(const std::string &message, SDL_Color colorFG, SDL_Color colorBG, int x, int y){
    //We need to first render to a surface as that's what TTF_RenderText
    //returns, then load that surface into a texture
    //SDL_Surface *surf = TTF_RenderText_Blended(_p_font, message.c_str(), colorFG);
    SDL_Surface *surf = TTF_RenderText_Shaded(_p_font, message.c_str(), colorFG, colorBG);
    if (surf == nullptr){
        cout << "error: TTF_RenderText " << SDL_GetError() << endl;
        return;
    }
    SDL_Texture *texture = SDL_CreateTextureFromSurface(rendererMap, surf);
    if (texture == nullptr){
        cout << "error: CreateTexture " << SDL_GetError() << endl;
    }
    //Clean up the surface.
    SDL_FreeSurface(surf);

    // Now display it.
    SDL_Rect dst;
    dst.x = x;
    dst.y = y;
    //Query the texture to get its width and height to use
    SDL_QueryTexture(texture, NULL, NULL, &dst.w, &dst.h);
    SDL_RenderCopy(rendererMap, texture, NULL, &dst);
    SDL_DestroyTexture(texture);
}
