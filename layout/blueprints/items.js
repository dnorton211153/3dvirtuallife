export const Items = {
    keyToShed: {
        name: 'keyToShed',
        gltf: 'key.gltf',
        image: 'keyCopper.png',
        description: 'A rusty old key with faint engravings',
        type: 'item',
        attributes: {
            animates: false,
            scale: 100,
            elevation: 20
        }
    },
    keyToChest: {
        name: 'keyToChest',
        gltf: 'key.gltf',
        image: 'keyGolden.png',
        description: 'A small golden key',
        type: 'item',
        attributes: {
            animates: false,
            scale: 50,
            elevation: 10
        }
    },
    bagOfGems: {
        name: 'bagOfGems',
        gltf: 'bagOfGems.glb',
        image: 'bagOfGems.png',
        description: 'A small velvet bag full of gems',
        type: 'item',
        attributes: {

            animates: false,
            scale: 100,
            elevation: 10
        }
    },
    bluepotion: {
        name: 'bluepotion',
        gltf: 'bluepotion.glb',
        image: 'bluepotion.png',
        description: 'A glowing blue mana potion',
        type: 'item',
        attributes: {
            animates: false,
            scale: 5,
            elevation: 10,
            effect: "mana/+2"
        }
    },
    greenpotion: {
        name: 'greenpotion',
        gltf: 'greenpotion.glb',
        image: 'greenpotion.png',
        description: 'A bubbling green potion',
        type: 'item',
        attributes: {
            animates: false,
            scale: 5,
            elevation: 10,
            effect: "damage/-2"
        }
    },
    redpotion: {
        name: 'redpotion',
        gltf: 'redpotion.glb',
        image: 'redpotion.png',
        description: 'A gleaming red life potion',
        type: 'item',
        attributes: {
            animates: false,
            scale: 5,
            elevation: 10,
            effect: "health/+2"
        }
    },
    smallSword: {
        name: 'smallSword',
        gltf: 'broadsword.glb',
        image: 'broadsword.png',
        description: 'A metallic blade, strong yet flexible',
        type: 'item',
        attributes: {
            equippable: ['handR', 'handL'],
            animates: false,
            scale: 100,
            elevation: 20
        } 
    },
    torch: {
        name: 'torch',
        gltf: 'torch.glb',
        image: 'broadsword.png',
        description: 'A simple wooden torch',
        type: 'item',
        attributes: {
            equippable: ['handR', 'handL'],
            animates: false,
            scale: 100,
            elevation: 5
        } 
    },
    mace: {
        name: 'mace',
        gltf: 'mace.glb',
        image: 'mace.png',
        description: 'A metallic mace',
        type: 'item',
        attributes: {
            equippable: ['handR', 'handL'],
            animates: false,
            scale: 100,
            elevation: 0
        } 
    },
    crystalBall: {
        name: 'crystalBall',
        gltf: 'crystalball.glb',
        image: 'crystalBall.png',
        description: 'A gleaming ball of crystal',
        type: 'item',
        attributes: {
            animates: false,
            scale: 50,
            elevation: 30
        }
    },



}