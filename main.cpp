#include <iostream>
#include <chrono>

//#include <SDL2/SDL.h>

#include "world.h"
#include "defines.h"
#include "sdl_map.h"

using std::cout;
using std::endl;

int main()
{
    std::cout << "Hello World!" << std::endl;

    //The frames per second timer
    std::chrono::high_resolution_clock::time_point timerEnd, timerStart = std::chrono::high_resolution_clock::now();
    float fps = 0;
    int fpsSecondTotal = 0;
    int time = 0;

    // Generate map data.
    Node rootMapNode = CreateMapRoot();
    RaiseIslands(&rootMapNode);
    DistanceFromShore(&rootMapNode);

    //return 0;

    // This is the viewport and code to render the map.
    View view(&rootMapNode);

    view.quit = false;
    while (!view.quit){
        view.ParseInput();
        view.DrawMapCursor();
        view.DrawMapFromRoot(&rootMapNode);    
        view.RenderText("FPS: " + std::to_string(fps), { 255, 255, 255, 255 }, { 10, 10, 30, 255 }, 10, 10);
        view.Render();

        //Calculate and correct fps
        timerEnd = std::chrono::high_resolution_clock::now();
        time += std::chrono::duration<double, std::milli>(timerEnd - timerStart).count();
        fpsSecondTotal++;
        if(time > 1000){
            fps = (float)fpsSecondTotal * 1000 / time;
            time = 0;
            fpsSecondTotal = 0;
            cout << fps << endl;
        }

        timerStart = timerEnd;
    }
}
