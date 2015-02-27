#ifndef GAMEOFTIDES_SDL_MAP_H
#define GAMEOFTIDES_SDL_MAP_H

#include <SDL2/SDL.h>
#include <SDL2/SDL2_gfxPrimitives.h>
#include <SDL2/SDL_ttf.h>


#define GLM_FORCE_RADIANS
#include <glm/glm.hpp>
#include <glm/gtx/vector_angle.hpp>

#include "world.h"
#include "defines.h"

class View {
    public:
        View(Node* p_rootNode);
        ~View();

        int zoom;
        glm::vec2 offset;
        bool wireframe;

        bool mouseClick;
        glm::vec2 mousePos;
        bool quit;

        void ZoomIn();
        void ZoomOut();

        void PanUp();
        void PanDown();
        void PanLeft();
        void PanRight();
        
        void ToggleWireframe();

        /* Clear viewport. */
        void Clear();

        /* Read keyboard and mouse input. */
        void ParseInput();

        /* Draw the map. */
        void DrawMapFromRoot(Node* node);
        void DrawMapNode(Node* node);

        /* Draw data to Viweport. */
        void Render();

        void DrawMapCursor();

        void RenderText(const std::string &message, SDL_Color colorFG, SDL_Color colorBG, int x, int y);

    private:
        Node* _p_rootNode;
        glm::vec2 _ApplyPanOffset(glm::vec2 viewCoordinate);
        glm::vec2 _ReversePanOffset(glm::vec2 dataCoordinate);

        bool _RegisterRenderer();
        SDL_Window* window;
        SDL_Renderer* rendererMap;
        bool mapDirty;
        
        bool InsideScreenBoundary(glm::vec2 coordinate);

        TTF_Font* _RegisterFont(const std::string &fontFile, int fontSize);
        TTF_Font* _p_font;

        std::shared_ptr<Node> _mouseNode;
};


#endif  // GAMEOFTIDES_SDL_MAP_H
