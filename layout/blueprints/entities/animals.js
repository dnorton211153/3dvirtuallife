
import { convo } from "./convo.js";
export const Animals = {

    // horse: { // default THREE demo horse
    //     name: "horse",
    //     gltf: "horse.glb",
    //     image: "horse.png",
    //     description: "Strong horse",
    //     type: "friendly",
    //     inventory: [],
    //     equipped: [],
    //     attributes: {
    //       movingAnimations: "horse_A_/2/1/1/false/false/loopRepeat",
    //       runningAnimations: "horse_A_/2/1/1/false/false/loopRepeat",
    //       mountable: true,
    //       moves: true,
    //       animates: true,
    //       height: 35,
    //       length: 50,
    //       width: 20,
    //       elevation: -10,
    //       equippedScale: 0.35,
    //       scale: 0.35,
    //       stats: {
    //         health: "4/4/0",
    //         mana: "0/0/0",
    //         strength: "0/0/0",
    //         agility: "7/7/0",
    //         defense: "5/5/0", // rock, weapon, arrow damage defense
    //         fire: "0/0/0",
    //         ice: "0/0/0",
    //         poison: "0/0/0",
    //         thunder: "0/0/0"
    //       },
    //       grants: ["gold10"]
    //     }
    //   },
    
      fireSteed: { // Lobato - special for Lava Field
        name: "fireSteed",
        gltf: "fireSteed.glb",
        image: "fireSteed.png",
        description: "Mystical fire steed",
        type: "friendly",
        subtype: "steed",
        attributes: {
          handR: "f_hoofR",
          handL: "f_hoofL",
          shouldAnimate: true,
          emissiveIntensity: 3,
          mountable: true,
          moves: true,
          animates: true,
          height: 40,
          length: 50,
          width: 20,
          elevation: 0,
          equippedScale: 30,
          scale: 30,
          stats: {
            health: "4/4/0",
            mana: "0/0/0",
            strength: "2/2/0",
            agility: "7/7/0",
            defense: "5/5/0", // rock, weapon, arrow damage defense
            fire: "10/10/0",
            ice: "0/0/0",
            poison: "0/0/0",
            thunder: "0/0/0"
          },
          grants: ["gold10"],
          sprites: [
            {
              name: "firesteed",
              regex: "sconce",
              frames: 16,
              scale: 5,
              elevation: 1,
              flip: false,
              animates: true,
              showOnSeed: true
            }
          ],
          conversation: {
            state: "loyalSubject",
            engagementState: 0,
            intro: {
              speech: "Neigh!",
              responses: [convo.wellwish]
            },
            loyalSubject: {
              speech: "Neigh!",
              responses: [convo.enlist, convo.carryon, convo.mount]
            },
            loyalFollower: {
              speech: "Neigh!",
              responses: [convo.release, convo.carryon, convo.mount]
            }
          }
        },

      },
    
      cosmichorse: {
        name: "cosmichorse",
        gltf: "cosmichorse.glb",
        image: "cosmichorse.png",
        description: "Mystical steed",
        type: "friendly",
        subtype: "steed",
        inventory: [],
        equipped: [],
        attributes: {
          handR: "f_hoofR",
          handL: "f_hoofL",
          shouldAnimate: true,
          mountable: true,
          moves: true,
          animates: true,
          height: 40,
          dialogHeight: 50,
          dialogCameraDistance: 35,
          length: 50,
          width: 20,
          elevation: 0,
          equippedScale: 30,
          scale: 30,
          stats: {
            health: "4/4/0",
            mana: "0/0/0",
            strength: "1/1/0",
            agility: "7/7/0",
            defense: "5/5/0", // rock, weapon, arrow damage defense
            fire: "10/10/0",
            ice: "0/0/0",
            poison: "0/0/0",
            thunder: "0/0/0"
          },
          conversation: {
            state: "intro",
            engagementState: 0,
            special: {
              condition: ["sunFruit"],
              speech: "<Whimpering at the sight of food>",
              responses: [convo.grant, convo.decline],
              jumpToState: "loyal" // if special condition is met
            },
            intro: {
              speech: "Neigh!",
              responses: [convo.wellwish]
            },
            loyalSubject: {
              speech: "Neigh!",
              responses: [convo.enlist, convo.carryon, convo.mount]
            },
            loyalFollower: {
              speech: "Neigh!",
              responses: [convo.release, convo.carryon, convo.mount]
            }
          }
        }
      },
    
      painthorse: {
        name: "painthorse",
        gltf: "painthorse.glb",
        image: "painthorse.png",
        description: "Mystical steed",
        type: "friendly",
        subtype: "steed",
        inventory: [],
        equipped: [],
        attributes: {
          handR: "f_hoofR",
          handL: "f_hoofL",
          shouldAnimate: true,
          mountable: true,
          moves: true,
          animates: true,
          height: 40,
          length: 50,
          width: 20,
          elevation: 0,
          equippedScale: 30,
          scale: 30,
          stats: {
            health: "4/4/0",
            mana: "0/0/0",
            strength: "1/1/0",
            agility: "1/1/0",
            defense: "5/5/0", // rock, weapon, arrow damage defense
            fire: "10/10/0",
            ice: "0/0/0",
            poison: "0/0/0",
            thunder: "0/0/0"
          },
          conversation: {
            state: "intro",
            engagementState: 0,
            special: {
              condition: ["sunFruit"],
              speech: "<Whimpering at the sight of food>",
              responses: [convo.grant, convo.decline],
              jumpToState: "loyal" // if special condition is met
            },
            intro: {
              speech: "Neigh!",
              responses: [convo.wellwish]
            },
            loyalSubject: {
              speech: "Neigh!",
              responses: [convo.enlist, convo.carryon, convo.mount]
            },
            loyalFollower: {
              speech: "Neigh!",
              responses: [convo.release, convo.carryon, convo.mount]
            }
          }
        }
      },
    
      whitehorse: {
        name: "whitehorse",
        gltf: "whitehorse.glb",
        image: "whitehorse.png",
        description: "Mystical steed",
        type: "friendly",
        subtype: "steed",
        inventory: [],
        equipped: [],
        attributes: {
          handR: "f_hoofR",
          handL: "f_hoofL",
          shouldAnimate: true,
          mountable: true,
          moves: true,
          animates: true,
          height: 40,
          length: 50,
          width: 20,
          elevation: 0,
          equippedScale: 30,
          scale: 30,
          stats: {
            health: "4/4/0",
            mana: "0/0/0",
            strength: "1/1/0",
            agility: "1/1/0",
            defense: "5/5/0", // rock, weapon, arrow damage defense
            fire: "10/10/0",
            ice: "0/0/0",
            poison: "0/0/0",
            thunder: "0/0/0"
          },
          conversation: {
            state: "intro",
            engagementState: 0,
            special: {
              condition: ["sunFruit"],
              speech: "<Whimpering at the sight of food>",
              responses: [convo.grant, convo.decline],
              jumpToState: "loyal" // if special condition is met
            },
            intro: {
              speech: "Neigh!",
              responses: [convo.wellwish]
            },
            loyalSubject: {
              speech: "Neigh!",
              responses: [convo.enlist, convo.carryon, convo.mount]
            },
            loyalFollower: {
              speech: "Neigh!",
              responses: [convo.release, convo.carryon, convo.mount]
            }
          }
        }
      },
    
      chestnuthorse: {
        name: "chestnuthorse",
        gltf: "chestnuthorse.glb",
        image: "chestnuthorse.png",
        description: "Mystical steed",
        type: "friendly",
        subtype: "steed",
        inventory: [],
        equipped: [],
        attributes: {
          handR: "f_hoofR",
          handL: "f_hoofL",
          shouldAnimate: true,
          mountable: true,
          moves: true,
          animates: true,
          height: 40,
          length: 50,
          width: 20,
          elevation: 0,
          equippedScale: 30,
          scale: 30,
          stats: {
            health: "4/4/0",
            mana: "0/0/0",
            strength: "1/1/0",
            agility: "1/1/0",
            defense: "5/5/0", // rock, weapon, arrow damage defense
            fire: "10/10/0",
            ice: "0/0/0",
            poison: "0/0/0",
            thunder: "0/0/0"
          },
          conversation: {
            state: "intro",
            engagementState: 0,
            special: {
              condition: ["sunFruit"],
              speech: "<Whimpering at the sight of food>",
              responses: [convo.grant, convo.decline],
              jumpToState: "loyal" // if special condition is met
            },
            intro: {
              speech: "Neigh!",
              responses: [convo.wellwish]
            },
            loyalSubject: {
              speech: "Neigh!",
              responses: [convo.enlist, convo.carryon, convo.mount]
            },
            loyalFollower: {
              speech: "Neigh!",
              responses: [convo.release, convo.carryon, convo.mount]
            }
          }
        }
      },
    
      blackhorse: {
        name: "blackhorse",
        gltf: "blackhorse.glb",
        image: "blackhorse.png",
        description: "Mystical steed",
        type: "friendly",
        subtype: "steed",
        inventory: [],
        equipped: [],
        attributes: {
          handR: "f_hoofR",
          handL: "f_hoofL",
          shouldAnimate: true,
          mountable: true,
          moves: true,
          animates: true,
          height: 40,
          length: 50,
          width: 20,
          elevation: 0,
          equippedScale: 30,
          scale: 30,
          stats: {
            health: "4/4/0",
            mana: "0/0/0",
            strength: "1/1/0",
            agility: "1/1/0",
            defense: "5/5/0", // rock, weapon, arrow damage defense
            fire: "10/10/0",
            ice: "0/0/0",
            poison: "0/0/0",
            thunder: "0/0/0"
          },
          conversation: {
            state: "intro",
            engagementState: 0,
            special: {
              condition: ["sunFruit"],
              speech: "<Whimpering at the sight of food>",
              responses: [convo.grant, convo.decline],
              jumpToState: "loyal" // if special condition is met
            },
            intro: {
              speech: "Neigh!",
              responses: [convo.wellwish]
            },
            loyalSubject: {
              speech: "Neigh!",
              responses: [convo.enlist, convo.carryon, convo.mount]
            },
            loyalFollower: {
              speech: "Neigh!",
              responses: [convo.release, convo.carryon, convo.mount]
            }
          }
        }
      },
    
      brownhorse: {
        name: "brownhorse",
        gltf: "brownhorse.glb",
        image: "brownhorse.png",
        description: "Mystical steed",
        type: "friendly",
        subtype: "steed",
        inventory: [],
        equipped: [],
        attributes: {
          handR: "f_hoofR",
          handL: "f_hoofL",
          shouldAnimate: true,
          mountable: true,
          moves: true,
          animates: true,
          height: 40,
          length: 50,
          width: 20,
          elevation: 0,
          equippedScale: 30,
          scale: 30,
          stats: {
            health: "4/4/0",
            mana: "0/0/0",
            strength: "1/1/0",
            agility: "1/1/0",
            defense: "5/5/0", // rock, weapon, arrow damage defense
            fire: "10/10/0",
            ice: "0/0/0",
            poison: "0/0/0",
            thunder: "0/0/0"
          },
          conversation: {
            state: "intro",
            engagementState: 0,
            special: {
              condition: ["sunFruit"],
              speech: "<Whimpering at the sight of food>",
              responses: [convo.grant, convo.decline],
              jumpToState: "loyal" // if special condition is met
            },
            intro: {
              speech: "Neigh!",
              responses: [convo.wellwish]
            },
            loyalSubject: {
              speech: "Neigh!",
              responses: [convo.enlist, convo.carryon, convo.mount]
            },
            loyalFollower: {
              speech: "Neigh!",
              responses: [convo.release, convo.carryon, convo.mount]
            }
          }
        }
      },
    
      chicken: {
        name: "chicken",
        gltf: "chicken.glb",
        image: "chicken.png",
        description: "Special chicken",
        type: "friendly",
        inventory: [],
        equipped: [],
        attributes: {
          shouldAnimate: true,
          moves: true,
          animates: true,
          height: 40,
          length: 50,
          width: 20,
          elevation: 0,
          scale: 30,
          stats: {
            health: "4/4/0",
            mana: "0/0/0",
            strength: "0/0/0",
            agility: "1/1/0",
            defense: "5/5/0", // rock, weapon, arrow damage defense
            fire: "10/10/0",
            ice: "0/0/0",
            poison: "0/0/0",
            thunder: "0/0/0"
          },
          grants: ["gold10"]
        }
      },
      pug: {
        name: "pug",
        gltf: "pug.glb",
        image: "pug.png",
        description: "Regal pug",
        type: "friendly",
        inventory: [],
        equipped: [],
        attributes: {
          handR: "front_toeR",
          handL: "front_toeL",
          moves: true,
          animates: true,
          height: 35,
          length: 30,
          width: 20,
          elevation: 0,
          equippedScale: 0.35,
          scale: 20,
          stats: {
            health: "4/4/0",
            mana: "0/0/0",
            strength: "0/0/0",
            agility: "1/1/0",
            defense: "5/5/0", // rock, weapon, arrow damage defense
            fire: "0/0/0",
            ice: "0/0/0",
            poison: "0/0/0",
            thunder: "0/0/0"
          },
          grants: ["gold10"]
        }
      },
}