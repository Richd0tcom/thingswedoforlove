import kaboom from "kaboom";


const tileSize = 12;
const replies = [
    "Omo E be like say you miss road o.\n\nLets try this again",
    "I know the game is a bit buggy,\nso try to go slowly okay?",
    "Big head.\nWe need to stop meeting like this😂",
    "Ha ha, really funny.\n\nOya stop.",
    "Are you enjoying this?\n\nIs this fun for you?",
    "You're making me sad ☹️",
    "After all we've been through\n\nin this Tinubu regime?",
    "Fine, Have fun being alone 💔",
  ];

export const k = kaboom({
    global: true,
    touchToMouse: true,
    canvas: document.getElementById("game"),
    debug: true,
    // width: 840,
    // height: 480
});

k.loadSprite("spriteSheet", './ffspritesheet.png', {
    sliceX: 39,
    sliceY: 31,
    anims: {
        "idle-down": 936,

        //fem sprite
        "walk-down": { from: 960, to: 963, loop: true, speed: 8 },
        "idle-side": 999,
        "walk-side": { from: 999, to: 1002, loop: true, speed: 8 },
        "idle-up": 1038,
        "walk-up": { from: 1038, to: 1041, loop: true, speed: 8 },
        "fem-idle-down": 960,
        "fem-idle-side": 1077
    }
})

k.loadSprite("map", "./lmap.png");
k.setBackground(k.Color.fromHex("#6de5e3"));
k.loadSprite("hillHouseBg", "./hillHouseBg.png");
k.loadSprite("rightHouseBg", "./akvalinside.png");

let rightHouseVisits = 0; // Counts how many times the right house was entered

// ======================================================================
// Main Game Scene ("game")
// ======================================================================

scene("game", async () => {
    const mapData = await (await fetch("./akvalmap-1.json")).json();
    const layers = mapData.layers;

    const map = k.add([k.sprite("map"), k.pos(), k.scale(1), ]);

    // --- Add the Player ---
    const player = add([
        k.sprite("spriteSheet", { anim: "fem-idle-down" }),
        pos(400,250),
        area({
            shape: new k.Rect(k.vec2(0, -3), 16, 16),
          }),        // for collision detection
        k.anchor("center"),
        k.scale(1.5),
        k.body(),
        "player"
    ]);

    const collisionLayer = layers.find((layer) => layer.name === "collision");

    if (collisionLayer) {
        // Tiled JSON stores tile IDs in "data" as a flat array in row-major order.
        collisionLayer.data.forEach((tileId, i) => {
            // If tileId is 0, there is no tile (and no collision)
            if (tileId !== 0) {
                // Calculate x,y position from index (assuming collisionLayer.width is set)
                const x = (i % collisionLayer.width) * tileSize;
                const y = Math.floor(i / collisionLayer.width) * tileSize;
                // Add an invisible, solid collider for each collision tile
                k.add([
                    k.rect(tileSize, tileSize),
                    k.pos(x, y),
                    k.area(),
                    k.body({ isStatic: true }),
                    // k.outline(1, '#000000'),
                    k.opacity(0),
                ]);
            }
        });
    } else {
        console.warn("No collision layer named 'collision' found in your Tiled map.");
    }

    // --- Player Movement ---
    const moveSpeed = 50;
    k.onKeyDown("left", () => {
        console.log('left')
        player.flipX = true;
        player.play("walk-side")
        player.move(-moveSpeed, 0);
    });
    k.onKeyDown("right", () => {
        console.log('right')
        player.flipX = false;
        player.play("walk-side")
        player.move(moveSpeed, 0);
    });
    k.onKeyDown("up", () => {
        console.log('up')
        player.play("walk-up")

        player.move(0, -moveSpeed);
    });
    k.onKeyDown("down", () => {
        player.play("walk-down")
        player.move(0, moveSpeed);
    });

    // for phones
    k.onMouseDown((mouseBtn) => {
        if (mouseBtn !== "left") return;
    
        const worldMousePos = k.toWorld(k.mousePos());
        console.log('player-seepd', moveSpeed)
        player.moveTo(worldMousePos, moveSpeed);
    
        const mouseAngle = player.pos.angle(worldMousePos);
    
        const lowerBound = 50;
        const upperBound = 125;
    
        if (
          mouseAngle > lowerBound &&
          mouseAngle < upperBound &&
          player.curAnim() !== "walk-up"
        ) {
          player.play("walk-up");
          player.direction = "up";
          return;
        }
    
        if (
          mouseAngle < -lowerBound &&
          mouseAngle > -upperBound &&
          player.curAnim() !== "walk-down"
        ) {
          player.play("walk-down");
          player.direction = "down";
          return;
        }
    
        if (Math.abs(mouseAngle) > upperBound) {
          player.flipX = false;
          if (player.curAnim() !== "walk-side") player.play("walk-side");
          player.direction = "right";
          return;
        }
    
        if (Math.abs(mouseAngle) < lowerBound) {
          player.flipX = true;
          if (player.curAnim() !== "walk-side") player.play("walk-side");
          player.direction = "left";
          return;
        }
      });

    // triggers for scene changes
    add([
        rect(32, 32),
        pos(324, 135), 
        area(),
        k.body({ isStatic: true }),
        opacity(0),
        "hillHouseZone",
    ]);

    add([
        rect(30, 32),
        pos(574, 219), 
        area(),
        k.body({ isStatic: true }),
        "rightHouseZone",
        opacity(0),
    ]);
    add([
        k.text('WILL YOU BE MY VALENTINE ?', { size: 16, }),
        k.pos(320, 0), 
        k.color(0,0,0)
    ]);

    add([
        k.text('YES', { size: 16 }),
        k.pos(324, 120), 
        k.color(0,0,0)
    ]);

    add([
        k.text('NO', { size: 16  }),
        k.pos(574, 200), 
        k.color(0,0,0)
    ]);

    // --- Trigger House Scenes on Collision ---
    player.onCollide("hillHouseZone", () => {
        go("hillHouse");
    });

    player.onCollide("rightHouseZone", () => {
        rightHouseVisits++;
        go("rightHouse", { visit: rightHouseVisits });
    });

    // --- Camera Follows the Player ---
    camPos(player.pos);
    player.onUpdate(() => {
        camPos(player.pos);
    });
});

// ======================================================================
//  YES House Scene ("hillHouse")
// ======================================================================

scene("hillHouse", () => {
    k.setBackground(k.Color.fromHex("#2c1e2f"));
    k.add([
        k.sprite("hillHouseBg"),
        k.pos(),
        scale(
            
        ),
    ]);
    const player = add([
        k.sprite("spriteSheet", { anim: "idle-down" }),
        pos(400,300), 
        area(),        
        k.anchor("center"),
        k.scale(3),
        k.body(),
        "someone"
    ]);
    add([
        k.sprite("spriteSheet", { anim: "fem-idle-down" }),
        pos(415,300), 
        area(),        
        k.anchor("center"),
        k.scale(3),
        k.body(),
        "someone2"
    ]);

    camPos(player.pos);

    add([
        k.text('I love you Pookie!!', { size: 30, font: 'monospace' }),
        k.color(k.Color.fromHex("#ffffff")),
        k.pos(250, 150), //resize based on screen size
    ]);

    // Instruction text to exit the scene
    add([
        text("Press Space or \nTap to return to the island", { size: 16 }),
        pos(350, height() - (height()/5)),
        k.anchor("center"),
    ]);

    // Listen for key press or touch to go back to the main game scene
    onKeyPress("space", () => {
        go("game");
        k.setBackground(k.Color.fromHex("#6de5e3"));
    });
    onTouchStart(() => {
        go("game");
        k.setBackground(k.Color.fromHex("#6de5e3"));
    });
});

// ======================================================================
// NO House Scene ("rightHouse")
// ======================================================================

scene("rightHouse", ({ visit }) => {
    k.setBackground(k.Color.fromHex("#2c1e2f"));

    add([
        sprite("rightHouseBg"),
        k.pos(k.width()/10, k.height()/10),
        scale(
           1.5,1.5
        ),
    ]);
    
    const npc = add([
        k.sprite("spriteSheet", { anim: "idle-down" }),
        pos(450,250), 
        area(),        
        k.anchor("center"),
        k.scale(3),
        k.body(),
        "npc"
    ]);

  add([
        k.sprite("spriteSheet", { anim: "idle-up" }),
        pos(450, 450), 
        area(),       
        k.anchor("center"),
        k.scale(3),
        k.body(),
        "player"
    ])

    camPos(npc.pos);

    // Choose dialog based on how many times the house has been visited
    let dialog = replies[visit - 1] || replies[replies.length - 1];

    // Display the dialog text
    add([
        k.text(dialog, { size: 16, }),
        k.pos(320, 200),
        // color(0,0,0) 
    ]);

    // Instruction text to exit the scene
    add([
        text("Press Space or Tap to exit", { size: 12 }),
        pos(350, 0),
        
    ]);

    onKeyPress("space", () => {
        go("game");
        k.setBackground(k.Color.fromHex("#6de5e3"));
    });
    onTouchStart(() => {
        go("game");
        k.setBackground(k.Color.fromHex("#6de5e3"));
    });
});

// ======================================================================
// Start the Game
// ======================================================================

k.go("game");