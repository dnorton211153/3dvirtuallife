export const Buildings = {
  houseLarge: {
    name: "houseLarge",
    gltf: "houseLarge2.glb",
    image: "houseLarge.png",
    description: "Large house",
    type: "structure",
    subtype: "shelter",
    attributes: {
      transparentWindows: true,
      animates: true,
      scale: 140,
      elevation: 0,
      sprites: [
        {
          name: "fireplace",
          regex: "fireplace",
          frames: 8,
          scale: 16,
          elevation: 1,
          flip: false,
          animates: true,
          showOnSeed: true
        }
      ],
      animations: "DoorAction/1/autoRestore"
    }
  },

  houseMedium: {
    name: "houseMedium",
    gltf: "houseMedium.glb",
    image: "houseMedium.png",
    description: "Medium house",
    type: "structure",
    subtype: "shelter",
    attributes: {
      transparentWindows: true,
      animates: true,
      scale: 140,
      elevation: 0,
      sprites: [
        {
          name: "fireplace",
          regex: "fireplace",
          frames: 8,
          scale: 16,
          elevation: 1,
          flip: false,
          animates: true,
          showOnSeed: true
        }
      ],
      animations: "DoorAction/1/autoRestore"
    }
  },

  houseSmall: {
    name: "houseSmall",
    gltf: "houseSmall.glb",
    image: "houseSmall.png",
    description: "Large house",
    type: "structure",
    subtype: "shelter",
    attributes: {
      transparentWindows: true,
      animates: true,
      scale: 140,
      elevation: 0,
      sprites: [
        {
          name: "fireplace",
          regex: "fireplace",
          frames: 8,
          scale: 16,
          elevation: 1,
          flip: false,
          animates: true,
          showOnSeed: true
        }
      ],
      animations: "DoorAction/1/autoRestore"
    }
  },

  tavernShop: {
    name: "tavernShop",
    gltf: "tavernShop2.glb",
    description: "Tavern and shop",
    type: "structure",
    subtype: "shelter",
    attributes: {
      transparentWindows: true,
      animates: true,
      scale: 35,
      elevation: 0
    }
  },

  vikingShop: {
    name: "vikingShop",
    gltf: "vikingShop.glb",
    description: "Humble abode of a troubled family",
    type: "structure",
    subtype: "shelter",
    attributes: {
      animates: true,
      transparentWindows: true,
      scale: 30,
      elevation: 0,
      sprites: [
        {
          name: "fireplace",
          regex: "fireplace",
          frames: 8,
          scale: 16,
          elevation: 1,
          flip: false,
          animates: true,
          showOnSeed: true
        }
      ]
    }
  },

  tavern: {
    name: "tavern",
    gltf: "tavern.glb",
    description: "Old-fashioned tavern and shop",
    type: "structure",
    subtype: "shelter",
    attributes: {
      animates: false,
      scale: 20,
      elevation: 0
    }
  },
  shed: {
    name: "shed",
    gltf: "sceneHouse.glb",
    description: "Mighty regal castle",
    type: "structure",
    attributes: {
      animates: true,
      direction: "down",
      scale: 100,
      elevation: -6,
      sprites: [
        {
          name: "Fount",
          regex: "fount",
          frames: 10,
          scale: 5,
          elevation: 1,
          flip: false,
          animates: true,
          showOnSeed: true
        }
      ]
    }
  },

  barnHouse: {
    name: "barnHouse",
    gltf: "barnHouse.glb",
    description: "Playhouse Jamal",
    type: "structure",
    attributes: {
      animates: false,
      scale: 200,
      elevation: 0
    }
  },

  well: {
    name: "well",
    gltf: "Well.glb",
    description: "Ancient Well",
    type: "structure",
    inventory: [
      { itemName: "water", quantity: 100 }
    ],
    attributes: {
      multipleSimultanousActions: true,
      animates: true,
      direction: "up",
      scale: 20,
      elevation: 0,
      animations: "Cylinder.006Action.001/1//concurrent///addWaterSource+Cylinder.007Action/1//concurrent+KeyAction/1//concurrent"
      // [animationName,timeScale,autoRestore,concurrent,loopRepeat,downCallback,upCallback] = animation.split('/');
    }
  }
};
