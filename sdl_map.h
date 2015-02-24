#ifndef GAMEOFTIDES_SDL_MAP_H
#define GAMEOFTIDES_SDL_MAP_H

//#include "/usr/include/SDL2/SDL.h"
#include <SDL2/SDL.h>
#include <SDL2/SDL2_gfxPrimitives.h>

#define GLM_FORCE_RADIANS
//#include "/usr/include/glm/glm.hpp"
//#include "/usr/include/glm/gtx/vector_angle.hpp"
#include <glm/glm.hpp>
#include <glm/gtx/vector_angle.hpp>

#include "world.h"
#include "defines.h"

void DrawMapNode(Node* node, SDL_Renderer* renderer);


#endif  // GAMEOFTIDES_SDL_MAP_H
