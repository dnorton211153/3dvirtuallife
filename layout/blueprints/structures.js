export const Structures = {
    
    shed: {
        name: 'shed',
        gltf: 'sceneHouse.glb',
        description: 'Mighty regal castle',
        type: 'structure',
        attributes: {
            animates: false,
            scale: 100,
            elevation: -6,
            sprites: [{ 
                name: "Fount",
                regex: "fount",
                frames: 10,
                scale: 5,
                elevation: 1,
                flip: false,
                animates: true,
                showOnSeed: true
            }]
        }
    
    },

    bridge: {
        name: 'bridge',
        gltf: 'bridge.glb',
        description: 'Sturdy bridge',
        type: 'structure',
        attributes: {
            animates: false,
            scale: 30,
            elevation: -40,
        }
    },

    tavern: {
        name: 'tavern',
        gltf: 'tavern.glb',
        description: 'Old-fashioned tavern and shop',
        type: 'structure',
        attributes: {
            animates: false,
            scale: 20,
            elevation: 0
        }
    
    },

    grate: {
        name: 'grate',
        gltf: 'grate.gltf',
        description: 'Rusty iron grate',
        type: 'structure',
        attributes: {
            animates: true,
            key: 'keyToShed',
            scale: 100,
            elevation: 0,
            locked: true,
            position: "down"
        }
    
    },

    platformWood: {
        name: 'platformWood',
        gltf: 'platformWood.glb',
        description: 'Platform',
        type: 'structure',
        attributes: {
            scale: 100,
            elevation: 0
        }
    },

    platformBlock: {
        name: 'platformBlock',
        gltf: 'platformBlock.glb',
        description: 'Platform',
        type: 'structure',
        attributes: {
            scale: 100,
            elevation: 0
        }
    },

    tavernShop: {
        name: 'tavernShop',
        gltf: 'tavernShop.glb',
        description: 'Tavern and shop',
        type: 'structure',
        attributes: {
            animates: true,
            scale: 30,
            elevation: 20
        }
    
    },

    ricketyPlatform: {
        name: 'ricketyPlatform',
        gltf: 'ricketyPlatform.glb',
        description: 'Rickety Platform',
        type: 'structure',
        attributes: {
            animates: false,
            scale: 30,
            elevation: 0
        }
    },

    lever: {
        name: 'lever',
        gltf: 'lever.glb',
        description: 'Control switch',
        type: 'structure',
        attributes: {
            animates: true,
            scale: 100,
            elevation: 0,
            position: "down"
        }
    
    },
    balloon: {
        name: 'balloon',
        gltf: 'balloon.glb',
        description: 'Festive hot-air balloon',
        type: 'structure',
        attributes: {
            staticStartingElevation: true,
            rotateY: true,
            animates: false,
            scale: 30,
            elevation: 30,
        }
    },

    portal: {
        name: 'portal',
        gltf: 'portal.glb',
        description: 'Portal',
        type: 'structure',
        attributes: {
            visible: false,
            animates: true,
            scale: 40,
            elevation: 0,
        }
    },

    archway: {
        name: 'archway',
        gltf: 'archway.gltf',
        description: 'Dark gothic archway',
        type: 'structure',
        attributes: {
            animates: false,
            scale: 100,
            elevation: 1,
        }
    },

    rock1: {
        name: 'rock1',
        gltf: 'rock1.gltf',
        description: 'Standard rock',
        type: 'structure',
        attributes: {
            animates: false,
            scale: 1,
            elevation: 0
        }
    },

    cart: {
        name: 'cart',
        gltf: 'cart.glb',
        description: 'Old Cart',
        type: 'structure',
        attributes: {
            animates: false,
            scale: 10,
            elevation: 0
        }
    },

    tree1: {
        name: 'tree1',
        gltf: 'tree.glb',
        description: 'Standard tree',
        type: 'structure',
        attributes: {
            animates: false,
            scale: 100,
            elevation: 0
        }
    },
    
    ancientChest: {
        name: 'ancientChest',
        gltf: 'chest.glb',
        description: 'An old but sturdy wooden chest',
        type: 'structure',
        attributes: {
            scale: 60,
            elevation: 0,
            animates: true,
            locked: true,
            position: "down"
        }
    }
}

