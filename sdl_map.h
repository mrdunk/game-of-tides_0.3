#ifndef GAMEOFTIDES_SDL_MAP_H
#define GAMEOFTIDES_SDL_MAP_H

//#include "/usr/include/SDL2/SDL.h"
#include <SDL2/SDL.h>
#include <SDL2/SDL2_gfxPrimitives.h>
#include <SDL2/SDL_ttf.h>


#define GLM_FORCE_RADIANS
//#include "/usr/include/glm/glm.hpp"
//#include "/usr/include/glm/gtx/vector_angle.hpp"
#include <glm/glm.hpp>
#include <glm/gtx/vector_angle.hpp>

#include "world.h"
#include "defines.h"

class View {
    public:
        View() : zoom(1), wireframe(0){};
        int zoom;
        glm::vec2 offset;
        bool wireframe;

        void ZoomIn();
        void ZoomOut();

        void PanUp();
        void PanDown();
        void PanLeft();
        void PanRight();
        
        void ToggleWireframe();
};


bool insideScreenBoundary(glm::vec2 coordinate);
void DrawMapNode(Node* node, SDL_Renderer* renderer, View* p_view);

SDL_Texture* renderText(const std::string &message, const std::string &fontFile,
    SDL_Color color, int fontSize, SDL_Renderer *renderer);
void renderTexture(SDL_Texture *tex, SDL_Renderer *ren, int x, int y);

#endif  // GAMEOFTIDES_SDL_MAP_H
