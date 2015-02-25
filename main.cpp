#include <iostream>

//#include <SDL2/SDL.h>

#include "world.h"
#include "defines.h"
#include "sdl_map.h"

using std::cout;
using std::endl;

int main()
{
    std::cout << "Hello World!" << std::endl;

    Node rootMapNode = CreateMapRoot();
    RaiseIslands(&rootMapNode);
//return 0;

    if (SDL_Init(SDL_INIT_VIDEO) != 0){
        std::cout << "SDL_Init Error: " << SDL_GetError() << std::endl;
        return 1;
    }

    SDL_Window* window = SDL_CreateWindow("Hello World!", 100, 100, SCREEN_WIDTH, SCREEN_HEIGHT, SDL_WINDOW_SHOWN);
    if (window == nullptr){
        std::cout << "SDL_CreateWindow Error: " << SDL_GetError() << std::endl;
        SDL_Quit();
        return 1;
    }

    //The window renderer
    SDL_Renderer* renderer = SDL_CreateRenderer( window, -1, SDL_RENDERER_ACCELERATED );
    if (renderer == nullptr){
        std::cout << "SDL_CreateWindow Error: " << SDL_GetError() << std::endl;
        SDL_DestroyWindow(window);
        SDL_Quit();
        return 1;
    }

    SDL_Event e;
    int mouse_x, mouse_y, closest_x, closest_y;
    bool quit = false;
    bool mouseClick;
    int zoom = 1;
    while (!quit){
        mouseClick = false;
        while (SDL_PollEvent(&e)){
            if (e.type == SDL_QUIT){
                quit = true;
            }
            if (e.type == SDL_KEYDOWN){
                        switch( e.key.keysym.sym )
                        {
                            case SDLK_EQUALS:
                            ++zoom;
                            cout << "zoom: " << zoom << endl;
                            break;

                            case SDLK_MINUS:
                            --zoom;
                            if(zoom < 1){
                                zoom = 1;
                            }
                            cout << "zoom: " << zoom << endl;
                            break;

                            case SDLK_UP:
                            break;

                            case SDLK_DOWN:
                            break;

                            case SDLK_LEFT:
                            break;

                            case SDLK_RIGHT:
                            break;

                            default:
                            quit = true;
                            break;
                        }
            }
            if (e.type == SDL_MOUSEBUTTONDOWN){
                mouseClick = true;
            }
            if (e.type == SDL_MOUSEMOTION){
                SDL_GetMouseState(&mouse_x, &mouse_y);
                cout << "SDL_MOUSEMOTION " << mouse_x << "," << mouse_y << "\t" << 
                    mouse_x / DISPLAY_RATIO << "," << mouse_y / DISPLAY_RATIO << "\t" << endl;
            }
        }

        // Select nearest node to mouse pointer.
        std::shared_ptr<Node> closest = FindClosest(&rootMapNode, {mouse_x / (DISPLAY_RATIO * zoom), mouse_y / (DISPLAY_RATIO * zoom)}, 1);
        closest_x = closest->coordinate.x * DISPLAY_RATIO * zoom;
        closest_y = closest->coordinate.y * DISPLAY_RATIO * zoom;

        if(mouseClick){
            closest->populate();
            closest->SetAboveSeaLevel();
        }

        //Clear screen
        SDL_SetRenderDrawColor(renderer, 0x9F, 0x9F, 0x9F, 0xFF );
        SDL_RenderClear(renderer);

        //Render white filled quad
        SDL_Rect fillRect = { 0, 0, SCREEN_SIZE, SCREEN_SIZE};
        SDL_SetRenderDrawColor(renderer, 0x22, 0x88, 0xEE, 0xFF);        
        SDL_RenderFillRect(renderer, &fillRect );

        // Draw map.
        DrawMapNode(&rootMapNode, renderer, zoom);

        // Display cursor over nearest Node.
        SDL_SetRenderDrawColor(renderer, 0x00, 0x88, 0x00, 0xFF );
        SDL_Rect icon = {closest_x -4, closest_y -4, 8, 8};
        SDL_RenderFillRect(renderer, &icon);

        //Update screen
        SDL_RenderPresent(renderer);

        SDL_Delay(20);
    }

    SDL_DestroyRenderer(renderer);
    SDL_DestroyWindow(window);
    SDL_Quit();
}
