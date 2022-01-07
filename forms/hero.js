import { IntelligentForm } from './intelligent.js'

/**
 * The Hero is a significant extension of the
 * IntelligentForm which has hooks for all the
 * Hero interactions, saved games, etc.
 * 
 * It keeps track of its own template for caching,
 * including inventory, spells, equipped items,
 * and attributes/statistics.
 */
export class Hero extends IntelligentForm {

    constructor(template, sceneController, controls) {

        super(template, sceneController);

        this.controls = controls;
        this.inventory = this.template.inventory;
        this.attributes = this.template.attributes;
        this.spells = this.template.spells;
        this.equipped = this.template.equipped;
        this.selectedObject = null;

        this.addEventListeners = this.addEventListeners.bind(this);
        this.addEventListeners();

        // Actually just a starting/saved location
        this.location = this.template.location? this.template.location : { x: 0, y: 0, z: 0 };

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;

        this.cacheHero();

    }

    /** For the hero, the load method is completely overridden, no super.load() call */
    load(callback) {

        super.load(() => {

            /** For the hero, the controls obj IS the model, which contains the gltf model */
            let modelCopy = this.model;
            modelCopy.rotation.y = Math.PI;

            this.model = this.controls;
            this.model.add( modelCopy );

            if (this.template.location) {
                this.model.position.x = this.template.location.x * multiplier;
                this.model.position.z = this.template.location.z * multiplier;
                this.model.position.y = this.determineElevationFromBase();
            }

            if (this.equipped) {
                Object.keys(this.equipped).forEach(bodyPart => {
                    this.equip(bodyPart, this.equipped[bodyPart]);
                })
            }

            callback();

        }, undefined, function ( error ) {
            console.error( error );
        });
    }

    cacheHero() {

        localStorage.setItem('gameHeroTemplate', JSON.stringify(this.returnTemplate()));

    }

    addEventListeners() {

        this.eventDepot = this.sceneController.eventDepot;

        this.eventDepot.addListener('updateHeroLocation', data => {

            let { x, y, z } = data.location;
        
            if (data.offset) {
                z = z + (z < 0) ? 1 : -1;
                x = x + (x < 0) ? 1 : -1;
            }

            this.location.x = x;
            this.location.y = y;
            this.location.z = z;
            this.cacheHero();

        })

        this.eventDepot.addListener('halt', () => {

            this.velocity.x = 0;
            this.velocity.z = 0;

            this.moveForward = false;
            this.moveBackward = false;
            this.moveLeft = false;
            this.moveRight = false;

        })

        this.eventDepot.addListener('swapInventoryPositions', (data) => {
            this.swapInventoryPositions(data.first, data.second);
            this.cacheHero();
        });

        this.eventDepot.addListener('unequipItem', (data) => {
            this.unequip(data);
            this.cacheHero();
        });

        this.eventDepot.addListener('equipItem', (data) => {
            this.equip(data.bodyPart, data.itemName);
            this.cacheHero();
        });

        this.eventDepot.addListener('placeItem', (data) => {
            this.addToInventory(data.itemName, data.desiredIndex);
            this.cacheHero();
        });

        this.eventDepot.addListener('takeItemFromScene', (data) => {
            this.addToInventory(data.itemName);
            this.cacheHero();
        });

        this.eventDepot.addListener('removeItem', (itemName) => {
            this.removeFromInventory(itemName);
            this.cacheHero();
        });

        this.eventDepot.addListener('setHeroStat', (data) => {
            this.attributes.stats[data.type] = data.points + this.attributes.stats[data.type].substring(2);
            this.cacheHero();
        })

        this.eventDepot.addListener('setHeroStatMax', (data) => {
            this.attributes.stats[data.type] = this.attributes.stats[data.type].substring(0,3) + data.points;
            this.cacheHero();
        })

        this.eventDepot.addListener('dropItemToScene', (data) => {
            
            if (data.source.length < 3) {  // inventory
                this.removeFromInventory(data.itemName);
            } else { // equipped
                this.unequip(data.source);
            }
            this.cacheHero();
        });

        this.eventDepot.addListener('mouse0click', () => {

            if (this.selectedObject) {

                let thisObj = this.selectedObject;

                let objectName = getObjectName(thisObj);
                let objectType = getObjectType(thisObj);
                
                if (objectType == "item") {
                    this.eventDepot.fire('takeItemFromScene', {itemName: objectName, uuid: thisObj.uuid});

                } else if (objectType == "friendly") {
                    
                    // TODO: conversation
                    this.eventDepot.fire('unlockControls', {});
                    this.eventDepot.fire('modal', { name: objectName });
                
                } else if (objectType == "beast") {

                    // TODO: combat
                    this.fadeToAction("Punch", 0.2)

                } else if (objectType == "structure") {
                    
                    var accessible = thisObj.attributes.key ? 
                        this.inventory.map(el => {
                            return el? el.itemName: null;
                        }).includes(thisObj.attributes.key) :
                        true;
                    
                    if (accessible) {
                        this.updateStructureAttributes(thisObj, {unlocked: true});
                        if (this.activeAction) {
                            this.runActiveAction(0.2);
                        }
                    }
                }
            }   
        })

        this.eventDepot.addListener('unlockControls', () => {
            this.moveForward = false;
            this.moveBackward = false;
            this.moveLeft = false;
            this.moveRight = false;
        })

        this.eventDepot.addListener('jump', () => {
            if ( this.canJump === true ) {
                this.velocity.y += 350;
                this.fadeToAction('Jump', 0.2)
            }
            this.canJump = false;
            this.justJumped = true;
        })
    }

    dispose(item) {
        if (item.children.length == 0) {
            if (item.dispose) item.dispose();
            return;
        } else {
            item.children.forEach(child => {
                this.dispose(child);
            })
        }
        if (item.dispose) item.dispose();
    }

    stop(callback) {
        
        this.eventDepot.removeListeners('updateHeroLocation');
        this.eventDepot.removeListeners('swapInventoryPositions');
        this.eventDepot.removeListeners('unequipItem');
        this.eventDepot.removeListeners('equipItem');
        this.eventDepot.removeListeners('placeItem');
        this.eventDepot.removeListeners('takeItemFromScene');
        this.eventDepot.removeListeners('removeItem');
        this.eventDepot.removeListeners('dropItemToScene');
        this.eventDepot.removeListeners('mouse0click');
        this.eventDepot.removeListeners('jump');
        this.eventDepot.removeListeners('halt');
        this.dispose(this.model);
        callback();
    }

    firstInventorySlot() {
        let max = this.inventory.length;
        for (let i = 0; i < this.inventory.length; i++ ) {
            if (!this.inventory[i] || !this.inventory[i].itemName) return i;
        }
        return max;
    }
    


    addToInventory(itemName, desiredIndex) {

        var quantity;
        var itemIndex = this.inventory.map(el => el != undefined? el.itemName: null ).indexOf(itemName);
        if (itemIndex != -1) {
            quantity = this.inventory[itemIndex].quantity + 1;
        } else {

            // If desiredIndex is already defined, use the first inventory slot
            if (desiredIndex == undefined || this.inventory[desiredIndex]) {
                itemIndex = this.firstInventorySlot();
            } else itemIndex = desiredIndex;

            quantity = 1;
        }

        this.inventory[itemIndex] = {
            itemName: itemName,
            quantity: quantity
        }

        return {itemIndex, quantity};
    }

    /**
     * returns the remaining quantity
     */
    removeFromInventory(itemName) {

        let index = this.inventory.findIndex(el => {
            return el != undefined && el.itemName == itemName
        });
        
        if (this.inventory[index].quantity > 1) {
            this.inventory[index].quantity--;
            return this.inventory[index].quantity;
        } else {
            this.inventory[index] = null;
            return 0;
        }
    }

    swapInventoryPositions(first,second) {
        let temp = {...this.inventory[first]};
        let temp2 = {...this.inventory[second]};
        this.inventory[first] = temp2;
        this.inventory[second] = temp;
    }

    getInventory() {
        return this.inventory;
    }

    equip(area, itemName) {
        this.equipped[area] = itemName;
        this.sceneController.loadFormbyName(itemName, (itemGltf) => {

            let item = itemGltf.scene;
            item.position.set(0,0,0);
            item.rotation.y = Math.PI;
            item.scale.copy(new THREE.Vector3( .1,.1,.1 ));
    
            if (item.objectName == "torch") {
    
                let fireObj = this.getFire();

                // this.fireParams.Torch();
                fireObj.scale.set(.04, .01, .04);
                fireObj.translateY(.08);
                fireObj.translateZ(-.32);
                fireObj.translateX(.01);
                fireObj.rotateX(-Math.PI/5);
                fireObj.rotateZ(-Math.PI/20);

                item.add(fireObj);

                switch (area) {
                    case "Middle2R_end": 
                        item.rotation.z = -Math.PI/5;
                        break;
                    case "Middle2L_end":
                        break;
                    default:
                }

            } 
            
            this.model.getObjectByName(area).add(item);
            
        });
    }
    
    unequip(area) {
        delete this.equipped[area];
        let thisArea = this.model.getObjectByName(area);
        thisArea.children.forEach(child => {
            thisArea.remove(child);
        })
    }

    returnTemplate() {

        return {
            name: this.name,
            type: "hero",
            location: this.location,
            attributes: this.attributes,
            gltf: this.template.gltf,
            model: null,
            inventory: this.inventory,
            spells: this.spells,
            equipped: this.equipped
        }
    }

    updateHeroStats = () => {

        Object.keys(this.attributes.stats).forEach(stat => {
            
            let points = this.attributes.stats[stat].split('/')
            let cur = points[0];
            let max = points[1];

            this.eventDepot.fire('setHeroStatMax', { type: stat, points: max});
            this.eventDepot.fire('setHeroStat', { type: stat, points: cur});

        })

        this.eventDepot.fire('showHeroStats', {});
        
    }

    // Calculate hero location using grid coordinates
    updateHeroLocationFromPosition() {

        let location = {
            x: this.controller.position.x / multplier,
            y: this.controller.position.y / multplier,
            z: this.controller.position.z / multplier
        }
        this.eventDepot.fire('updateHeroLocation', { location, offset: false });

    }

    move(otherForms, delta) {
        
        let otherModels = otherForms.map(el => el.model);

        // INERTIA
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        this.velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        this.direction.z = Number( this.moveBackward ) - Number( this.moveForward );
        this.direction.x = Number( this.moveRight ) - Number( this.moveLeft );
        this.direction.normalize(); // this ensures consistent movements in all directions
        
        let agility = this.attributes.stats.agility.substring(0,2);

        if ( this.moveForward || this.moveBackward ) this.velocity.z += this.direction.z * 1000.0 * agility * delta;
        if ( this.moveLeft || this.moveRight ) this.velocity.x += this.direction.x * 1000.0 * agility * delta;

        this.movementRaycaster.ray.origin.copy( this.model.position );
        this.rotation.copy(this.model.rotation);

        super.move(otherModels, delta);

        // entity.translateY( this.mixers[uniqueId].velocity.y * delta );
        if (this.setElevation( otherModels ) == -1) {

            this.model.translateX( -this.velocity.x * delta );
            this.model.translateY( -this.velocity.y * delta );
            this.model.translateZ( -this.velocity.z * delta );

            this.velocity.x = 0;
            this.velocity.y = 0;
            this.velocity.z = 0;

        };
        
        if (this.standingUpon && this.standingUpon.attributes.routeTo && typeof this.standingUpon.attributes.routeTo.level == "number") {
            if (this.standingUpon.attributes.unlocked) {
                
                this.eventDepot.fire('cacheLayout', {});

                let loadData = {

                    level: this.standingUpon.attributes.routeTo.level,
                    location: this.standingUpon.attributes.routeTo.location,
                }

                this.eventDepot.fire('loadLevel', loadData);
            }
        }
    }
}