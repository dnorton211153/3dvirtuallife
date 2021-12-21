export class Hero {

    // Sample empty hero:
    // {
    //     name: 'Dave',
    //     attributes: {
    //          height: 20
    //     },
    //     inventory: []
    // }

    constructor(hero, eventDepot, sceneController) {
        this.name = hero.name;
        this.gltf = hero.gltf;
        this.model = hero.model;
        this.attributes = hero.attributes;
        this.inventory = hero.inventory;
        this.eventDepot = eventDepot;
        this.controller = sceneController;

        this.addEventListeners = this.addEventListeners.bind(this);
        this.addEventListeners();

    }

    addEventListeners() {
        this.eventDepot.addListener('takeItem', (item) => {
            this.addToInventory(item);
        });

        this.eventDepot.addListener('dropItem', (item) => {
            this.removeFromInventory(item);
        });
    }

    addToInventory(itemName) {

        if (Object.keys(this.inventory).includes(itemName)) {
            this.inventory[itemName]++;
        } else {
            this.inventory[itemName] = 1;
        }
    }

    removeFromInventory(itemName) {
        if (this.inventor[itemName] > 1) {
            this.inventory[itemName]--;
        } else {
            delete this.inventory[itemName];
        }
    }

    getInventory() {
        return this.inventory;
    }

    equip(area, item) {

        this.addToBodyPart(this.model, area, item);
        
    }

    findBodyPartByName(current, name) {

        if (current.name == name ) {
            return current;
        } else {
            current.children.forEach(child => {
                return this.findBodyPartByName(child, name);
            })
        }
    }

    addToBodyPart(current, name, componentToAdd) {

        if (current.name == name ) {
            console.log(`Adding ${componentToAdd.name} to ${name}`)
            console.dir(current);
            componentToAdd.position.set(0,0,0);
            componentToAdd.rotation.y = Math.PI;
            componentToAdd.scale.copy(new THREE.Vector3( .1,.1,.1 ));
            current.add(componentToAdd);
            return current;
        } else {
            current.children.forEach(child => {
                return this.addToBodyPart(child, name, componentToAdd);
            })
        }
    }


}