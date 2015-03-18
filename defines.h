//#define MAPSIZE 1000  //1800000  //3600000
//#define MAPSIZE 1800000
#define MAPSIZE 3600000

#define HASHSALT 1112223334

#define SCREEN_WIDTH 1200
#define SCREEN_HEIGHT 800

#define SEED_NUMBER 50
#define SHORE_DEPTH 200        // Must be large enough that corners do not overlap. ever. 70 seems good.

#define ISLAND_NUMBER 40
#define ISLAND_GROW 20

#define WORLD_MARGIN 0.10     // Area round edge of map with no land.

#define PAN_STEP_SIZE 0.01

#if SCREEN_WIDTH > SCREEN_HEIGHT
#define SCREEN_SIZE  SCREEN_HEIGHT
#else
#define SCREEN_SIZE  SCREEN_WIDTH
#endif

#define DISPLAY_RATIO   ((float)SCREEN_SIZE / MAPSIZE)
