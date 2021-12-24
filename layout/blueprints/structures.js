import {Items} from './items.js'

export const Structures = {
    
    shed: {
        name: 'shed',
        gltf: 'sceneHouse.gltf',
        description: 'Wooden Shed with a locked door',
        type: 'structure',
        location: { x: 0, y: 0, z: 0},
        attributes: {
            animates: false,
            scale: 100,
            elevation: 0,
        }
    
    },

    grate: {
        name: 'grate',
        gltf: 'grate.gltf',
        description: 'Locked rusty iron grate',
        type: 'structure',
        location: { x: 5, y: 0, z: 5},
        attributes: {
            animates: true,
            key: 'keyToShed',
            scale: 100,
            elevation: 1,
            routeTo: { level: 1, location: { x: 16, y: 0, z: 4 } },
        }
    
    },

    archway: {
        name: 'archway',
        gltf: 'archway.gltf',
        description: 'Dark gothic archway leading upstairs',
        type: 'structure',
        location: { x: 16, y: 0, z: 4 },
        attributes: {
            animates: false,
            scale: 100,
            elevation: 1,
            routeTo: { level: 0, location: { x: 5, y: 0, z: 5} },
            unlocked: true
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
    
    ancientChest: {
        name: 'ancientChest',
        gltf: 'chest.glb',
        description: 'An old but sturdy wooden chest',
        type: 'structure',

        attributes: {
            scale: 60,
            elevation: 0,
            animates: true,
            key: 'keyToChest',
            contentItems: [
                Items.crystalBall
            ]
        }
    }
}

