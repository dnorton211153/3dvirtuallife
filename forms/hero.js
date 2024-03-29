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

        this.pV = new THREE.Vector3(); // previous velocity
        this.acceleration = {};

        this.controls = controls;
        this.name = this.template.name;
        this.selectedObject = null;

        this.addEventListeners = this.addEventListeners.bind(this);
        this.addEventListeners();

        // Actually just a starting/saved location
        this.location = this.template.location? this.template.location : { x: 0, y: 0, z: 0 };
        
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;

        this.positionHandR = new THREE.Vector3();

        // Proximity Light is used for object selection/identification
        this.proximityLight = new THREE.PointLight( 0x00ff00, 5, 250, 30 );
        
        this.balloonFloat = true; // does the balloon float upwards or has it arrived at the hovering altitude?
        this.balloonFloatStart = 0;

        this.attributes.shouldMove = true;
        this.attributes.shouldAnimate = true;

        this.party = [];
        this.partyTemplates = template.partyTemplates? template.partyTemplates: [];
        this.cacheHero();
    }

    load(callback) {

        super.load(() => {

            /** For the hero, the controls obj IS the model, which contains the gltf model */
            this.heroModel = this.model;
            this.heroModel.rotation.y = Math.PI;
            this.heroModel.position.set(0,0,0); // hero model is centered in the controls

            this.model = this.controls;

            this.model.add( this.heroModel );
            this.model.add( this.proximityLight );

            if (this.template.location) {
                this.model.position.x = this.template.location.x * multiplier;
                this.model.position.z = this.template.location.z * multiplier;
                this.model.position.y = this.determineElevationFromBase();
            }

            if (this.actions['Punch']) this.actions['Punch'].setEffectiveTimeScale(1);

            callback();

        }, undefined, function ( error ) {
            console.error( error );
        });
    }



    cacheHero(justDied = false) {
        
        if (this.model) this.updateHeroLocationFromPosition(justDied);
        if (justDied) {
            this.changeStat("health", this.getStatMax("health") * 2/3);
            let gameName = localStorage.getItem('gameName');
            if (gameName) this.sceneController.eventDepot.fire('saveGame', gameName);
        }
        localStorage.setItem('gameHeroTemplate', JSON.stringify(this.returnTemplate()));

    }

    // Calculate hero location using grid coordinates
    updateHeroLocationFromPosition(justDied) {

        var position = new THREE.Vector3();
        if (justDied) {
            position = this.sceneController.positionOfClosestStructure(this.model.position);
            // position.x = position.x - 40;// shiftTowardCenter(position.x, 4); // Causes performance leak somehow
            
        } else {
            position.copy(this.model.position);
        }

        this.location.x = position.x / multiplier,
        this.location.y = position.y / multiplier,
        this.location.z = position.z / multiplier
        
    }

    takeEffect(item) { // for items and spells

        // What is the item effect?
        let [type, change] = item.attributes.effect.split("/");

        switch (type) {

            case "scale":

                let torso = this.model.getObjectByName('Torso');
                torso.scale.x *= change;
                torso.scale.y *= change;
                torso.scale.z *= change;

                this.attributes.height *= change;
                this.changeStatBoost("strength", 2);
                this.changeStat("health", 2);
                break;

            case "mana": 
                this.fadeToAction("ThumbsUp", 0.2);
                this.changeStat(stat, change, false);
                break;

            case "poisonDamage":
            case "fireDamage":
            case "iceDamage":
            case "thunderDamage":    
            case "generalDamage":                            
                this.fadeToAction("Yes", 0.2);
                
                if (item.attributes.range) { // general attack against all in range
                    let entitiesInRange = this.sceneController.allEnemiesInRange(item.attributes.range, this.model.position);
                    entitiesInRange.forEach(entity => {
                        this.inflictDamage(entity, change, type);
                    })

                } else { // standard attack upon 'selectedObject'
                    if (this.selectedObject.alive) this.inflictDamage(this.selectedObject, change, type);
                }

                break;

            case "health":
                this.fadeToAction("Yes", 0.2);
                if (this.changeStat(type, change, false) <= 0) {
                    this.fadeToAction("Dance", 0.2);
                }

                break;
        }
    }



    useItem(item, keyString) {
        
        if (item.attributes.throwable) {
            this.launch(item.name, bodyPart);
        } else {
            this.takeEffect(item);
            if (this.removeFromInventory(item.name) == -1) this.unequip(keyString);
            
            // Sprite effects:
            if (item.attributes.sprites) {
                item.attributes.sprites.forEach(spriteConfig => {
                    this.sceneController.formFactory.addSprites(this.model, spriteConfig, null, true);
                })
            }
        }
    }

    mount(selectedObject) {

        let objectType = selectedObject.objectType;
        let objectSubtype = selectedObject.objectSubtype;
        let itemName = selectedObject.attributes.baseItemName? selectedObject.attributes.baseItemName : selectedObject.objectName;

        let data = {    
            itemName, 
            quantity: selectedObject.attributes.quantity? selectedObject.attributes.quantity : 1,
            layoutId: selectedObject.model.attributes.layoutId,
            type: objectType
        }

        // Place immediately in 'mount' equipped position
        this.sceneController.eventDepot.fire('takeItemFromSceneAndAddToInventory', data);
        this.sceneController.eventDepot.fire('removeFromInventory', itemName)
        this.sceneController.eventDepot.fire('equipItem', {bodyPart: "mount", itemName });

    }

    // e.g. this.handleMouseClick('L', shift)
    handleMouseClick(side, shift) {
        if (this.alive) {
                
            if (this.selectedObject) {

                let objectType = this.selectedObject.objectType;
                let objectSubtype = this.selectedObject.objectSubtype;
                let itemName = this.selectedObject.attributes.baseItemName? this.selectedObject.attributes.baseItemName : this.selectedObject.objectName;

                if (objectType == "friendly" && this.selectedObject.getCurrentConversation) {
                    
                    this.sceneController.eventDepot.fire('unlockControls', {});
                    this.sceneController.eventDepot.fire('modal', { type: 'dialog', title: this.selectedObject.objectName, entity: this.selectedObject, hero: this });
                
                } else if (this.selectedObject.attributes.mountable) {
                    this.mount(this.selectedObject);

                } else if (objectType == "item" || objectSubtype == "tree" || objectSubtype == "fish") {


                    let data = {
                        itemName, 
                        quantity: this.selectedObject.attributes.quantity? this.selectedObject.attributes.quantity : 1,
                        layoutId: this.selectedObject.model.attributes.layoutId,
                        type: objectType
                    }

                    // add model for temp/local items only, e.g. arrows and fruit
                    if (!data.layoutId) data.model = this.selectedObject.model;

                    if (this.selectedObject.attributes.keyCode) data.keyCode =this.selectedObject.attributes.keyCode;
                    this.sceneController.eventDepot.fire('takeItemFromSceneAndAddToInventory', data);

                } else if (objectType == "beast") {

                    if (this.selectedObject.alive) this.attack(side, shift);

                } else if (objectType == "structure") {
                    
                    if (this.watercanEquipped() && this.atWaterSource()) { 

                        let watercan = this.watercanEquipped();

                        if (watercan) {
                            if (!this.drawWater(watercan, this.selectedObject)) { // try to draw water; if it fails, remove waterSource
                                let pos = this.selectedObject.model.position;
                                this.sceneController.removeWaterSource({x: pos.x, y: pos.y, z: pos.z});

                                let parentBodyPart = watercan.parent.name;
                                this.unequip(parentBodyPart);
                                this.addToInventory(watercan.objectName, 0, 1);
                            };
                        }

                    } else {
                        var accessible = this.selectedObject.attributes.key ? this.inventory.map(el => el? el.itemName: null).includes(this.selectedObject.attributes.key) : true;
                    
                        if (accessible) {
                            let newDirection = this.selectedObject.attributes.direction == "down" ? "up" : "down";
                            let myAnimations = this.selectedObject.attributes.animations;

                            if (typeof this.selectedObject.attributes.locked == "boolean") {
                                let newLockstate = !this.selectedObject.attributes.locked; 
                                this.selectedObject.updateAttributes({locked: newLockstate, direction: newDirection, animations: myAnimations});
                            } else if (this.selectedObject.attributes.direction) { // if it has a position, alternate
                                this.selectedObject.updateAttributes({direction: newDirection, animations: myAnimations});
                            }

                            if (this.selectedObject.attributes.controls) {
                                
                                var [controlItem,animations] = this.selectedObject.attributes.controls.split(":");
                                
                                let controlled = this.sceneController.forms.find(el => el.objectName == controlItem);
                                let newDirectionControlled = controlled.attributes.direction == "down" ? "up" : "down";
                                
                                if (typeof controlled.attributes.locked == "boolean") {
                                    let newLockstateControlled = !controlled.attributes.locked; 
                                    controlled.updateAttributes({locked: newLockstateControlled, direction: newDirectionControlled, animations});
                                } else if (controlled.attributes.direction) { // if it has a position, alternate
                                    controlled.updateAttributes({direction: newDirectionControlled, animations});
                                }
                            } 
                        }
                    }

                    

                } else if ( objectType == "hero") {
                    
                    this.sceneController.eventDepot.fire('unlockControls', {});

                    let dialogData = { 
                        type: 'heroDialog', 
                        title: this.selectedObject.objectName, 
                        heroInventory: this.inventory, 
                        otherLayoutId: this.selectedObject.attributes.layoutId, 
                        socket: this.sceneController.socket, 
                        initiator: this.objectName, 
                        level: this.sceneController.level,
                        layoutId: this.attributes.layoutId
                    };

                    this.sceneController.eventDepot.fire('modal', dialogData);
                } 
            } else if (this.watercanEquipped() && this.atWaterSource()) { // no selected object

                let watercan = this.watercanEquipped();
                if (watercan) {
                    this.drawWater(watercan);
                }
                
            } else if (this.miningToolEquipped() && this.atMineralSource()) { // no selected object
                let oreName = this.atMineralSource();
                let tool = this.miningToolEquipped();
                if (tool) {
                    this.drawMinerals(tool,oreName);
                }
            }
        }
    }

    watercanEquipped() {

        if ((this.equipped.Middle2R && this.equipped.Middle2R[0] == "watercan") || (this.equipped.Middle2L && this.equipped.MiddleL[0] == "watercan")) {
            return this.model.getObjectByProperty('objectName', 'watercan');
        } else return null;
    }

    miningToolEquipped() {

        if ((this.equipped.Middle2R && this.equipped.Middle2R[0].match(/mining/i)) || (this.equipped.Middle2L && this.equipped.MiddleL[0].match(/mining/i))) {
            return this.model.getObjectByProperty('objectSubtype', 'miningTool');
        } else return null;
    }

    drawWater(watercan, selectedObject) { // return true if successful, false if not

        if (!selectedObject || selectedObject?.inventoryContains(['water'])) {

            let spriteConfig = {
                name: 'blueExplosion',
                regex: '',
                frames: 10,
                scale: 30,
                elevation: 55,
                flip: false,
                animates: true,
                time: 2
            }
            
            let wp = new THREE.Vector3();
            wp = watercan.getWorldPosition(wp);
            this.sceneController.formFactory.addSprites(watercan.model, spriteConfig, this.sceneController.scene, true, wp);
    

            this.fadeToAction('ThumbsUp', 0.2);
            this.sceneController.eventDepot.fire('addToInventory', {itemName: 'water', quantity: 4});

            if (selectedObject?.inventoryContains(['water'])) selectedObject.removeFromInventory('water');
            
            return true;
    
        } else {
            return false;
        }
        
    }

    drawMinerals(miningTool, oreName) {

        let spriteConfig = {
            name: 'hit1',
            regex: '',
            frames: 8,
            scale: 50,
            elevation: 60,
            flip: false,
            animates: true,
            time: 2
        }
        
        let wp = new THREE.Vector3();
        wp = miningTool.getWorldPosition(wp);
        this.sceneController.formFactory.addSprites(miningTool.model, spriteConfig, this.sceneController.scene, true, wp);

        this.fadeToAction('Punch', 0.2);
        this.sceneController.eventDepot.fire('addToInventory', {itemName: oreName, quantity: 1});
        
    }

    addEventListeners() {

        this.sceneController.eventDepot.addListener('descend', (data) => {
            
            if (this.balloonRide) {
                if (this.model.position.y <= this.determineElevationFromBase() + this.attributes.height) {
                    if (this.mounted) {
                        this.mounted = false;
                        this.sceneController.eventDepot.fire('dismount', data);
                    }
    
                } else {
                    this.model.position.y -= 3;
                }
    
            } else if (this.mountedUpon) {
                data.type = this.mountedUpon.objectType;
                this.sceneController.eventDepot.fire('dismount', data);
            }
        })

        // data: { vehicle: 'balloon', type: 'entity|item' }
        this.sceneController.eventDepot.addListener('dismount', (data) => {
            
            // Inch back a bit for the drop position
            this.model.translateZ(50);
            let dropData = {
                itemName: data.vehicle,
                location: this.location,
                source: "mount",
                type: data.type,
                position: new THREE.Vector3().copy(this.model.position)
            };

            this.sceneController.eventDepot.fire('dropItemToScene', dropData);

            // Move forward after drop
            this.model.translateZ(-100);
            if (this.balloonRide) this.balloonRide = false;
            this.mounted = false;
        });

        // data: { otherLayoutId: data.layoutId, otherInventory: data.heroInventory, initiator: ...}
        this.sceneController.socket.on('heroDialogNew', data => { // request for heroDialog; open modal
            
            this.sceneController.eventDepot.fire('unlockControls', {});

            let heroDialogData = { 
                type: 'heroDialog', 
                title: data.initiator,
                layoutId: this.attributes.layoutId, 
                heroInventory: this.inventory,
                otherLayoutId: data.otherLayoutId, 
                otherInventory: data.otherInventory, 
                socket: this.sceneController.socket, 
                initiator: false, 
                level: this.sceneController.level
                
            };

            this.sceneController.eventDepot.fire('modal', heroDialogData);

        });

        this.sceneController.socket.on('castSpell', data => {
            this.castSpell(data.spell, false, data.hostile);
        })

        this.sceneController.eventDepot.addListener('hotkey', (data) => { // key = number, i.e. 1 => equipped.f1key

            // Item or spell use
            let keyString = 'f' + data.key + 'key';
            let itemName = this.equipped[keyString]? this.equipped[keyString][0] : null;

            if (itemName) {
                let itemTemplate = this.sceneController.getTemplateByName(itemName);
                let itemType = itemTemplate.type;

                switch (itemType) {
                    case "spell": 
                        this.castSpell(itemTemplate);
                        break;

                    case "item": 
                        this.useItem(itemTemplate, keyString);
                        break;
                }

            }
        })

        this.sceneController.eventDepot.addListener('updateHeroLocation', data => {

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

        this.sceneController.eventDepot.addListener('halt', () => {

            this.velocity.x = 0;
            this.velocity.z = 0;

            this.moveForward = false;
            this.moveBackward = false;
            this.moveLeft = false;
            this.moveRight = false;

        })

        this.sceneController.eventDepot.addListener('swapInventoryPositions', (data) => {
            this.swapInventoryPositions(data.first, data.second);
        });

        this.sceneController.eventDepot.addListener('unequipItem', (data) => {
            this.unequip(data);
        });

        this.sceneController.eventDepot.addListener('equipItem', (data) => {
            this.equip(data.bodyPart, data.itemName, data.throwable, data.throws);
        });

        this.sceneController.eventDepot.addListener('placeItem', (data) => {
            this.addToInventory(data.itemName, data.desiredIndex);
        });

        this.sceneController.eventDepot.addListener('takeItemFromSceneAndAddToInventory', (data) => {
            this.addToInventory(data.itemName, undefined, data.quantity, data.keyCode);
        });

        this.sceneController.eventDepot.addListener('removeFromInventory', (itemName) => {
            this.removeFromInventory(itemName);
        });

        this.sceneController.eventDepot.addListener('addToInventory', (data) => {
            this.addToInventory(data.itemName, undefined, data.quantity, data.keyCode);
        });

        this.sceneController.eventDepot.addListener('dropItemToScene', (data) => {
            
            if (data.source.length < 3) {  // inventory
                this.removeFromInventory(data.itemName);
            } else { // equipped
                this.unequip(data.source);
            }
        });


        /**
         * This event is only received when shift has been pressed with the mousewheel movement;
         * If the selectedObject controls some other object, the delta will be passed along.
         */
        this.sceneController.eventDepot.addListener('wheel', (e) => {
            // if (this.selectedObject && this.selectedObject.attributes.controlsElevation) {

            //     var controlItem = this.selectedObject.attributes.controls;
            //     let controlled = this.sceneController.forms.find(el => el.objectName == controlItem);
                
            //     if (controlled.model.position.y >= (controlled.determineElevationFromBase()+controlled.attributes.elevation - 10) 
            //         && controlled.model.position.y <= controlled.attributes.elevationMax + 10) {
            //         this.selectedObject.updateAttributes({elevationChange: e.deltaY});
            //         controlled.updateAttributes({elevationChange: e.deltaY});
            //     }
            // }
        })

        this.sceneController.eventDepot.addListener('mouse0click', (shift) => { this.handleMouseClick('L', shift)} );
        this.sceneController.eventDepot.addListener('mouse2click', (shift) => { this.handleMouseClick('R', shift)} );
        this.sceneController.eventDepot.addListener('mouse1click', () => {

            if (this.alive) {

                let throws = this.equippedThrows();
                if (throws.length > 0) {
                    throws.forEach(([bodyPart,item]) => {
                        var tool;
                        // animate weapon (if applicable) and launch item
                        if (this.animatedSubforms.length > 0) {
                            tool = this.animatedSubforms.find(el => el[0] == bodyPart)[1];
                            if (tool) tool.runActiveAction(2);
                            
                            this.fadeToAction(this.launcherActions[getRndInteger(0,this.launcherActions.length-1)], 0.2);
                        } else {
                            tool = this.model.getObjectByName(bodyPart).getObjectByProperty('objectSubtype','launcher');
                        }
                        
                        setTimeout(() => {
                            this.launch(item, null, [bodyPart, tool? tool.objectName: null]);
                        }, 500);
                    })
                } else {
                    Object.entries(this.equipped).forEach(([bodyPart,value]) => {
                        if (bodyPart.indexOf('key') == -1) { // for body parts only (non-hotkey equipped)
                            let [item,throwable] = value;
                            if (throwable) {
                                this.launch(item, bodyPart);
                            }
                        }
                    })
                }
            }
        })

        this.sceneController.eventDepot.addListener('unlockControls', () => {
            this.moveForward = false;
            this.moveBackward = false;
            this.moveLeft = false;
            this.moveRight = false;
        })

        this.sceneController.eventDepot.addListener('jump', () => {
            if ( this.canJump === true ) {
                this.velocity.y += 1050;
                this.fadeToAction('Jump', 0.2)
            }
            this.canJump = false;
            this.justJumped = true;
        })

        // data: { category, nextLevel }
        this.sceneController.eventDepot.addListener('levelUp', (data) => {
            this.attributes.xpLevels[data.category] = data.nextLevel;
            this.sceneController.eventDepot.fire('statusUpdate', { message: `Advanced in ${data.category} to level ${data.nextLevel}`});
            
            // Lookup up xpLevels in gameObjects, then apply the effects:
            let effectString = this.sceneController.getTemplateByName('xpLevels')[data.category][data.nextLevel]? this.sceneController.getTemplateByName('xpLevels')[data.category][data.nextLevel].effect : `${data.category}/1`;
            let spell = this.sceneController.getTemplateByName('xpLevels')[data.category][data.nextLevel]? this.sceneController.getTemplateByName('xpLevels')[data.category][data.nextLevel].spell : null;

            var effects = effectString.split('+');
            for (var effect of effects) {
                if (effect) {
                    let [stat, change] = effect.split("/");
                    this.changeStat(stat, change, true);
                }
            }

            if (spell) {
                this.grantSpell(spell);
            }

            this.cacheHero();
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
        
        this.sceneController.eventDepot.removeListeners('updateHeroLocation');
        this.sceneController.eventDepot.removeListeners('halt');
        this.sceneController.eventDepot.removeListeners('swapInventoryPositions');
        this.sceneController.eventDepot.removeListeners('unequipItem');
        this.sceneController.eventDepot.removeListeners('equipItem');
        this.sceneController.eventDepot.removeListeners('placeItem');
        this.sceneController.eventDepot.removeListeners('takeItemFromSceneAndAddToInventory');
        this.sceneController.eventDepot.removeListeners('removeFromInventory');
        this.sceneController.eventDepot.removeListeners('addToInventory');
        this.sceneController.eventDepot.removeListeners('dropItemToScene');
        this.sceneController.eventDepot.removeListeners('mouse0click');
        this.sceneController.eventDepot.removeListeners('mouse1click');
        this.sceneController.eventDepot.removeListeners('mouse2click');
        this.sceneController.eventDepot.removeListeners('wheel');
        this.sceneController.eventDepot.removeListeners('unlockControls');
        this.sceneController.eventDepot.removeListeners('jump');
        this.sceneController.eventDepot.removeListeners('levelUp');
        this.dispose(this.model);
        callback();
    }

    /** updateHeroStats sends hero statistics out; effective is connsidered the stat */
    updateHeroStats = (stat) => {

        this.sceneController.eventDepot.fire('setHeroStatMax', { type: stat, points: this.getStatMax(stat)});
        this.sceneController.eventDepot.fire('setHeroStat', { type: stat, points: this.getEffectiveStat(stat)});
        this.sceneController.eventDepot.fire('showHeroStats', {});
        
    }

    identifySelectedForm() {

        this.proximityLight.rotation.copy(this.model.rotation);
        this.proximityLight.position.copy(this.model.position);
        this.proximityLight.translateZ(-40);
        this.proximityLight.translateY(40);

        let closest = Infinity;

        this.sceneController.forms.forEach(o => {
            let distance = o.model.position.distanceTo(this.proximityLight.position);

            if (o.attributes.contentItems) distance -= 20;
            if (o.objectType=="beast") distance -= 20; // to avoid selected friends during battle

            if (distance <= 70 && distance < closest) {
                
                if (!o.attributes.contentItems || (o.attributes.contentItems && o.attributes.locked)) {
                    
                    // a few more exclusions:
                    if (o.objectName != "floor" && !(o.attributes.stage && o.attributes.stage > 0)) {
                        closest = distance;
                        this.selectedObject = o;
                        this.sceneController.eventDepot.fire('showDescription', { objectType: o.objectType, objectName: o.objectName });
                    }
                }
            }
        })

        if (closest > 70) {
            this.selectedObject = null;
            this.sceneController.eventDepot.fire('hideDescription', {}); 
        }

    }

    move(delta) {
        if (this.alive && this.model) {

            this.pV.copy(this.velocity); // previous velocity
            this.sheltered = false; // to make weather elements invisible

            // INERTIA
            this.velocity.x -= this.velocity.x * 10.0 * delta;
            this.velocity.z -= this.velocity.z * 10.0 * delta;

            if (!this.balloonRide && !this.mountedUpon) {
                this.velocity.y -= 60; // 39.8 * 100.0 * delta; // 100.0 = mass

                // log current velocity.y
                // console.log(`${this.objectName} velocity.y: ${this.velocity.y}`);
            }

            this.direction.z = Number( this.moveBackward ) - Number( this.moveForward );
            this.direction.x = Number( this.moveRight ) - Number( this.moveLeft );
            this.direction.normalize(); // this ensures consistent movements in all directions
            
            let agility = this.getEffectiveStat('agility');

            if (this.mountedUpon && this.mountedUpon.objectType == 'friendly') {
                agility = this.mountedUpon.getEffectiveStat('agility');
            }

            if ( this.moveForward || this.moveBackward ) this.velocity.z += this.direction.z * 1000.0 * agility * delta;
            if ( this.moveLeft || this.moveRight ) this.velocity.x += this.direction.x * 1000.0 * agility * delta;

            if (this.balloonRide || (this.mountedUpon && this.mountedUpon.attributes.floats)) {
                this.velocity.z *= .7;
                this.velocity.x *= .7;
            }

            this.acceleration.x = this.velocity.x - this.pV.x;
            this.acceleration.y = this.velocity.y - this.pV.y;
            this.acceleration.z = this.velocity.z - this.pV.z;

            this.movementRaycaster.ray.origin.copy( this.model.position );
            this.rotation.copy(this.model.rotation);

            super.move(delta);

            // entity.translateY( this.mixers[uniqueId].velocity.y * delta );
            if (this.setElevation() == -1) {

                console.log(`${this.objectName} is falling!`);

                this.model.translateX( -this.velocity.x * delta );
                this.model.translateY( -this.velocity.y * delta );
                this.model.translateZ( -this.velocity.z * delta );

                this.velocity.x = 0;
                this.velocity.y = 0;
                this.velocity.z = 0;

            };
            
            this.handleStandingUpon();
            

            this.adjustPositionAndRotation();

            this.identifySelectedForm();



            /** data: { layoutId: ..., rotation: ..., velocity: ..., position: ..., level: ...} */

            let heroData = {
                layoutId: this.attributes.layoutId,
                position: this.model.position,
                rotation: this.model.rotation,
                velocity: this.velocity,
                level: this.sceneController.level
            };
            

            this.sceneController.socket.emit('updateHeroPosition', heroData);

        }

    }

    handleStandingUpon() {

        if (this.standingUpon && this.sceneController.layout.terrain.attributes.snowflakes && this.standingUpon.objectSubtype == "shelter") {
            this.sheltered = true;
        }
        
        if (this.standingUpon && this.standingUpon.attributes.routeTo && typeof this.standingUpon.attributes.routeTo.level == "number") {
            if (!this.standingUpon.attributes.locked) {
                this.sceneController.scene.removeFromScenebyLayoutId(this.attributes.layoutId);
                this.sceneController.eventDepot.fire('unlockControls', {});
                this.sceneController.eventDepot.fire('cacheLayout', {});

                let loadData = {

                    level: this.standingUpon.attributes.routeTo.level,
                    location: this.standingUpon.attributes.routeTo.location,
                }

                this.sceneController.eventDepot.fire('loadLevel', loadData);
            }
        } else if (this.standingUpon && this.standingUpon.attributes.footControls && !(typeof this.standingUpon.attributes.locked == "boolean")) {
            // Check to see if this switch/lever controls something:
            var [controlItem,animations] = this.standingUpon.attributes.footControls.split(":");
            let controlled = this.sceneController.forms.find(el => el.objectName == controlItem);
            let newDirectionControlled = controlled.attributes.direction == "down" ? "up" : "down";
            
            if (typeof controlled.attributes.locked == "boolean") {
                let newLockstateControlled = !controlled.attributes.locked; 
                controlled.updateAttributes({locked: newLockstateControlled, direction: newDirectionControlled, animations});
            } else if (controlled.attributes.direction) { // if it has a direction, alternate
                controlled.updateAttributes({direction: newDirectionControlled, animations});
            } else {
                controlled.updateAttributes({animations});
            }
        } else if (this.standingUponImmediate) { // for entryMat and exitMat, and firesteedAltar
            
            if (this.standingUponImmediate.keyCode) {
                let index = this.inventory.findIndex(el => {
                    return el != undefined && el.keyCode && el.keyCode == this.standingUponImmediate.keyCode;
                });

                if (index != -1) {
                    let controlled = this.sceneController.getFormByLayoutId(this.standingUponImmediate.controls);
                    
                    if (typeof controlled.attributes.sealed == "boolean" && controlled.attributes.sealed) { // can things be unsealed?  how?

                        // maybe put all this in an 'unseal' method for special structures
                        // like the firesteedAltar
                        let sprites = [{ 
                            name: 'flame2',  
                            regex: "sconce",
                            frames: 16,
                            scale: 2.5,
                            elevation: -.5,
                            flip: false,
                            animates: true,
                            showOnSeed: true // set to showOnSeed from this point forward
                        }];

                        controlled.updateAttributes({sealed: false, sprites });
                        if (controlled.attributes.animations) {
                            controlled.updateAttributes({animations: controlled.attributes.animations});
                        }

                        // drop the firesteed to the ground:
                        let dropData = {
                            itemName: controlled.attributes.releases,
                            position: controlled.model.position,
                            location: this.sceneController.getLocationFromPosition(controlled.model.position),
                            source: "",
                            type: "entity",
                            // attributes: {stage: entity.attributes.stage }
                        };

                        this.sceneController.eventDepot.fire('dropItemToScene', dropData);

                    } else {
                        if (controlled.attributes.animations) controlled.updateAttributes({animations: controlled.attributes.animations});
                    }
                    
                    if (controlled.attributes.sprites) controlled.attributes.sprites.forEach(spriteConfig => {
                        this.sceneController.formFactory.addSprites(controlled.model, spriteConfig, null, true);
                    })
                }

            }
        }
    }

    adjustPositionAndRotation() {

        // if (!this.balloonRide && !(this.mountedUpon && this.mountedUpon.attributes.floats)) {
            this.heroModel.position.x += (this.acceleration.x/40);
            this.heroModel.position.z += (this.acceleration.z/40);
    
            let yRotation = 0;
            if (this.acceleration.x != 0) {
                yRotation =  Math.pow(this.acceleration.x,3) * 1/10000;
                if (yRotation > .05) {
                    yRotation = .05;
                } else if (yRotation < -.05) {
                    yRotation = -.05;
                }
                this.heroModel.rotation.y -= yRotation;
            }
    
            
            // console.log(this.acceleration.x);
            if (this.heroModel.position.x > 1 || this.heroModel.position.x < -1) {
                this.heroModel.position.x -= this.heroModel.position.x / 30;
            }
            
            if (this.heroModel.position.z > 1 || this.heroModel.position.z < -1) {
                this.heroModel.position.z -= this.heroModel.position.z / 30;
            }
    
            if (this.heroModel.rotation.y > Math.PI + Math.PI/16)  {
                this.heroModel.rotation.y -= 1/100;
            } else if (this.heroModel.rotation.y < Math.PI - Math.PI/16) {
                this.heroModel.rotation.y += 1/100;
            }
    
            if (this.mountedUpon) {
    
    
                let m = this.mountedUpon.model;
                // let defaultRotation = degreesToRadians(m.attributes.rotateY);
                m.position.x += (this.acceleration.x/40);
                m.position.z += (this.acceleration.z/40);
                m.rotation.y += yRotation;
                
                if (m.position.x > 1 || m.position.x < -1) {
                    m.position.x -= m.position.x / 30;
                }
                
                if (m.position.z > 1 || m.position.z < -1) {
                    m.position.z -= m.position.z / 30;
                }
        
                if (m.rotation.y > Math.PI/16)  {
                    m.rotation.y -= 1/100;
                } else if (m.rotation.y < -Math.PI/16) {
                    m.rotation.y += 1/100;
                }
            }
        // }

        

    }

    death(local = true) {
        super.death(local);

        // drop all wares, then cache
        this.inventory.forEach(item => {

            if (item) {
                if (item.itemName == "gold" || item.itemName == "arrow" || item.itemName == "bait") {
                    if (item.quantity >= 25) {
                        for (let x = 0; x < item.quantity / 25; x++) {
                            this.sceneController.dropItemToScene({itemName: item.itemName + "25", position: this.model.position});
                        }
                    } else if (item.quantity >= 10) {
                        for (let x = 0; x < item.quantity / 10; x++) { 
                            this.sceneController.dropItemToScene({itemName: item.itemName + "10", position: this.model.position});
                        }
                    } else if (item.quantity >= 3) {
                        for (let x = 0; x < item.quantity / 3; x++) {
                            this.sceneController.dropItemToScene({itemName: item.itemName + "3", position: this.model.position});
                        }
                    } else {
                        this.sceneController.dropItemToScene({itemName: item.itemName, position: this.model.position});
                    }
                } else {
                    for (let x = 0; x < item.quantity; x++) {   

                        if (item.itemName != "water") {
                            /** data: {location ..., itemName..., } */
                            let dropData = {itemName: item.itemName, position: this.model.position};
                            if (item.keyCode) dropData.attributes = { keyCode: item.keyCode };
                            this.sceneController.dropItemToScene(dropData);

                        }
                    }
                }
            }
        });

        this.inventory = [];

        Object.values(this.equipped).forEach(item => {
            /** data: {location ..., itemName..., } */
            if (item) {
                this.unequip(item[1], true);
                this.sceneController.dropItemToScene({itemName: item[0], position: this.model.position});
            }
        });

        this.equipped = {};
        this.cacheHero(true);

        // setTimeout(() => { // pause before separation
        //     let thisModel = this.model.getObjectByProperty("objectType", "hero");
        //     thisModel.position.copy(this.model.position);
        //     this.sceneController.scene.add(thisModel);
        // }, 2000);
        
    }

    /** returns the new value */
    changeStat(stat, change, changeMax = false) {

        super.changeStat(stat, change, changeMax);

        if (change < 0) {
            // this.fadeToAction("No", 0.2);
        } else if (change > 1) {
            this.fadeToAction("Yes", 0.2);
        }
    }

    levelUpEligibility() {
        // Formula for each level up: 2^x+1
        let eligibility = [];
        Object.keys(this.attributes.xpLevels).forEach(category => {
            let nextLevel = Number(this.attributes.xpLevels[category]) + 1;
            let reqPoints = Math.pow(2, nextLevel+2);
            if (this.attributes.experience >= reqPoints) eligibility.push({
                category,
                nextLevel
            });
        })
        return eligibility;
    }

    grantSpell(spellName) {
        let spell = this.sceneController.getTemplateByName(spellName);
        if (!this.spells.map(el => el.itemName).includes(spellName)) {
            this.spells.push({
                itemName: spell.name
            });
        }
    }

    equippedThrows() {

        var throws = [];
        if (this.equipped.Middle2R && this.equipped.Middle2R[2]) {
            throws.push(['Middle2R', this.equipped.Middle2R[2]]);
        }

        if (this.equipped.Middle2L && this.equipped.Middle2L[2]) {
            throws.push(['Middle2L', this.equipped.Middle2L[2]]);
        }

        return throws;
    }

    getCurrentConversation() {
        let context = this.attributes.conversation.special;
        context.wares = this.inventory;
    }

    setElevation() {
        if (this.balloonRide) {
            
            let baseline = 500;
            if (this.balloonFloat) {
                this.model.position.y += 1;
                if (this.model.position.y >= baseline) {
                    this.balloonFloat = false;
                    this.balloonFloatStart = performance.now();
                }
            } else {
                this.model.position.y += (Math.sin((performance.now() - this.balloonFloatStart)/1000));
                if (this.model.position.y <= baseline - 200) this.balloonFloat = true;
            }

        } else if (this.mountedUpon) {

            var baseline;
            if (this.mountedUpon.attributes.floats) {

                // If floor line is above water line, dismount:
                let pondLine = this.determinePondElevation();
                let floorLine = this.determineElevationFromBase();
                baseline = pondLine + this.mountedUpon.attributes.height;
                if (floorLine > baseline) {
                    let data = {}
                    data.vehicle = this.mountedUpon.objectName;
                    data.type = this.mountedUpon.objectType;
                    this.sceneController.eventDepot.fire('dismount', data);
                } 
            } else {

                if (this.mountedUpon.objectName == 'fireSteed' && typeof this.sceneController.waterElevation == "number") {
                    baseline = Math.max(this.sceneController.waterElevation + this.mountedUpon.attributes.height, this.determineElevationFromBase() + this.mountedUpon.attributes.height);
                } else {
                    baseline = this.determineElevationFromBase() + this.mountedUpon.attributes.height;
                }
                
            }
            
            if (Math.abs(this.velocity.z) > 0.01) {
                if (this.movementStart == null) this.movementStart = performance.now();
                this.model.position.y = baseline + (2 * Math.sin((performance.now() - this.movementStart)/200));
            } else {
                this.model.position.y = baseline;
                this.movementStart = null;
            }
        
        } else {
            super.setElevation();
        }
    }

    addToParty(entity) {
        this.party.push(entity);
        this.partyTemplates.push(entity.returnTemplate());
        this.cacheHero();
    }

    removeFromParty(entity) {
        this.party = this.party.filter(el => el != entity);
        this.partyTemplates = this.partyTemplates.filter(el => el.name != entity.objectName);
        this.cacheHero();
    }
}