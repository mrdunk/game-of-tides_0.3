//#define MAPSIZE 1000  //1800000  //3600000
//#define MAPSIZE 1800000
#define MAPSIZE 3600000

#define SCREEN_WIDTH 1200
#define SCREEN_HEIGHT 800

#define SEED_NUMBER 200

#define ISLAND_NUMBER 20
#define ISLAND_GROW  2 

#define WORLD_MARGIN 0.2     // Area round edge of map with no land.

#define PAN_STEP_SIZE 0.01

#if SCREEN_WIDTH > SCREEN_HEIGHT
#define SCREEN_SIZE  SCREEN_HEIGHT
#else
#define SCREEN_SIZE  SCREEN_WIDTH
#endif

#define DISPLAY_RATIO   ((float)SCREEN_SIZE / MAPSIZE)
