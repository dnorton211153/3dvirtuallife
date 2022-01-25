import { Scene } from '/scene/scene.js';
import { FormFactory } from '/forms/formFactory.js';

/**
 * SceneController has a Scene object for graphical display, and keeps track
 * of movements and placement within the scene for object interactions, etc.
 * 
 * SceneController receives the summarized version of the layout as defined
 * by the LayoutManager, containing only the information needed for the UI.
 * 
 * Also has utilities for handling 3D objects, interfacing with the Scene.
 * 
 * Provides utilities to manage the scene state, for saving and loading.
 *  
 */

export class SceneController {

    constructor(heroTemplate, layout, eventDepot, allObjects) {
        
        // layout is shared by SceneController and LayoutManager
        this.layout = layout;
        this.heroTemplate = heroTemplate;
        this.eventDepot = eventDepot;
        this.allObjects = allObjects;

        this.formFactory = new FormFactory(this);
        this.loader = new THREE.GLTFLoader();

        this.forms = [];

        // Structure models tracked for basic collisions
        this.structureModels = [];

        // Entities tracked for combat/convo/collision
        this.entities = [];
        
        this.scene = null;
        this.floor = null;

        this.sprites = [];
        this.projectiles = [];

        this.clock = new THREE.Clock();
        this.refractor = null;

        // Bindings:
        this.addEventListeners = this.addEventListeners.bind(this);
        this.deanimateScene = this.deanimateScene.bind(this);
        this.takeItemFromScene = this.takeItemFromScene.bind(this);
        this.dropItemToScene = this.dropItemToScene.bind(this);
        this.seedForms = this.seedForms.bind(this);
        
        this.addEventListeners();
    }

    animateScene() {

        this.scene = new Scene(this);
        this.scene.init(() => {
            this.addFloor(() => {
                this.addWater(() => {
                    this.addLights();
                    this.addHero(() => {
                        this.seedForms(() => {
                            this.scene.animate();
                        });
                    });
                });
            });
        });
    }

    addWater(callback) {
        if (this.layout.terrain.attributes.water) {
            this.refractor = null;
            this.waterElevation = this.layout.terrain.attributes.water.elevation;
            this.water = this.formFactory.newForm("water", this.layout.terrain.attributes.water);
            this.water.load(() => {
                this.addToScene(this.water, false);
                callback();
            });
        } else {
            callback();
        }
    }

    addToScene(form, addToForms = true) {
        
        /* Hero is special case already added to scene via controls */
        if (form.objectType != "hero") this.scene.add( form.model );

        if (addToForms) this.forms.push( form );

        if (form.objectType == "hero" || form.objectType == "friendly" || form.objectType == "beast") {
            this.entities.push( form );
        } else if (form.objectType == "floor" || form.objectType == "structure") {
            this.structureModels.push ( form.model );
        }
    }

    addFloor(callback) {

        this.floor = this.formFactory.newForm("floor", this.layout.terrain);
        this.floor.load(() => {
            this.formFactory.addSconces(this.floor.model);
            if (this.layout.terrain.attributes.borderTrees) {
                this.formFactory.addBorderTrees(this.scene, this.floor.model);
            }
            this.addToScene(this.floor);
            setTimeout(() => {
                callback();
            }, 500);
        });
    }

    addLights() {

        if (this.layout.terrain.attributes.light.sunLight) {
            
            var shadowConfig = {

                shadowCameraVisible: false,
                shadowCameraNear: 750,
                shadowCameraFar: 4000,
                shadowCameraFov: 90,
                shadowBias: - 0.008
    
            };

            var sunLight = new THREE.SpotLight( 0xffffff, 2, 0, Math.PI / 2 );
            sunLight.position.set( 500, 800, 500);

            sunLight.castShadow = true;

            sunLight.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( shadowConfig.shadowCameraFov, 1, shadowConfig.shadowCameraNear, shadowConfig.shadowCameraFar ) );
            sunLight.shadow.bias = shadowConfig.shadowBias;

            this.scene.add (sunLight );

            if (shadowConfig.shadowCameraVisible) {
                var shadowCameraHelper = new THREE.CameraHelper( sunLight.shadow.camera );
                shadowCameraHelper.visible = shadowConfig.shadowCameraVisible;

                this.scene.add( shadowCameraHelper );
            }
        }

        if (this.layout.terrain.attributes.light.overheadPointLight) {
            this.overheadPointLight = new THREE.PointLight( 0xf37509, 5, 350, 3 );
            this.overheadPointLight.position.set( 0, 0, 0 );
            this.scene.add( this.overheadPointLight );
        }
    }

    addHero(callback) {

        this.hero = this.formFactory.newForm("hero", this.heroTemplate, this.scene.controls.getObject());
        
        this.hero.load(() => {

            this.addToScene( this.hero );

            this.eventDepot.fire('halt', {});
            this.eventDepot.fire('updateHeroLocation', { location: this.hero.location, offset: true });
            
            Object.keys(this.hero.attributes.stats).forEach(stat => {
                this.hero.updateHeroStats(stat);
            })

            callback();

        })
    }

    seedForms(callback) {
        this.layout.items.forEach(({name,location,attributes},index) => {
            let item = this.getObjectByName(name);
            if (location) item.location = location;
            if (attributes) item.attributes = {...item.attributes, ...attributes};
            this.seedForm(item, true).then(form => {
                this.layout.items[index].uuid = form.model.uuid;
            });
        });

        this.layout.structures.forEach(({name,location,attributes}, index) => {
            let structure = this.getObjectByName(name);
            if (location) structure.location = location;
            if (attributes) structure.attributes = {...structure.attributes, ...attributes};
            this.seedForm(structure, true).then(form => {
                this.layout.structures[index].uuid = form.model.uuid;
            });
        });

        this.layout.entities.forEach(({name,location,attributes}, index) => {
            let entity = this.getObjectByName(name);
            if (location) entity.location = location;
            if (attributes) entity.attributes = {...entity.attributes, ...attributes};
            this.seedForm(entity, true).then(form => {
                this.layout.entities[index].uuid = form.model.uuid;
            });
        });

        this.eventDepot.fire('cacheLayout', {});
        callback();
    }

    /** 
     * Load model of each form and add to scene.
     */ 
    seedForm(formTemplate) {

        var form;
        if (formTemplate.attributes.moves) {
            form = this.formFactory.newForm("artificial", formTemplate);
        } else if (formTemplate.attributes.animates) {
            form = this.formFactory.newForm("animated", formTemplate);
        } else {
            form = this.formFactory.newForm("standard", formTemplate);
        }

        return new Promise((resolve,reject) => {
            form.load(() => {

                if (form.attributes.sprites) {
                    form.attributes.sprites.forEach(spriteConfig => {
                        this.formFactory.addSpritesGeneric(form.model, spriteConfig.name, spriteConfig.regex, spriteConfig.frames, spriteConfig.scale, spriteConfig.elevation, spriteConfig.flip);
                    })
                }

                this.addToScene(form);

                if (form.attributes.contentItems) {
                    form.attributes.contentItems.forEach(contentItemName => {
                        let contentItem = this.getObjectByName(contentItemName);
                        contentItem.location = { x: 0, y: 20, z: 0 };
                        this.loadFormbyName(contentItem.name, (contentForm) => {

                            contentForm.model.position.x = form.model.position.x;
                            contentForm.model.position.z = form.model.position.z;
                            contentForm.model.position.y = form.model.position.y + contentItem.attributes.elevation;
                            contentForm.attributes.contained = true;
                            this.addToScene(contentForm);
                        })
                        resolve(form);

                    });
                } else {
                    resolve(form);
                }
    
            });
                
        })
    }



    handleMovement(delta) {

        if (this.hero) this.hero.move(delta);
        if (this.hero) this.hero.animate(delta);
        
        this.forms.forEach(form => {
            if (form.attributes.moves) {
                form.move(delta);
            }

            if (form.attributes.animates) {
                form.animate(delta);
            }
    
        })

        if (this.refractor) {
            this.refractor.material.uniforms[ "time" ].value += this.clock.getDelta();
        }

        if (this.overheadPointLight) {
            let controlsObject = this.scene.controls.getObject();
            this.overheadPointLight.position.copy(controlsObject.position);
            this.overheadPointLight.rotation.copy(controlsObject.rotation);
            this.overheadPointLight.position.y = controlsObject.position.y + 60;
            this.overheadPointLight.translateZ(-80);
        }

        if (this.hero && this.scene) this.scene.handleAutoZoom();

    }

    deanimateScene(callback) {

        this.eventDepot.removeListener('takeItemFromScene', 'bound takeItemFromScene');
        this.eventDepot.removeListener('dropItemToScene', 'bound dropItemToScene');

        if (this.hero) this.hero.stop(() => {
            this.hero = null;
        });

        if (this.scene) {
            this.scene.unregisterEventListeners();
            this.scene.deanimate(() => {
            });
        }

        if (this.forms) this.forms.forEach(form => {
            if (form.model.dispose) form.model.dispose();
        })

        callback();
    }

    getObjectByName(name) {
        return this.allObjects[name];
    }

    /** data: {itemName: ..., uuid: ...} */
    takeItemFromScene(data) {

        this.scene.removeFromScenebyUUID(data.uuid);
        this.forms = this.forms.filter(el => {
            return el.model.uuid != data.uuid;
        });

        this.eventDepot.fire('removeItemFromLayout', data.uuid);
    }

    /** data: {location ..., itemName..., } */
    dropItemToScene(data) {
        
        let itemTemplate = this.getObjectByName(data.itemName);
        this.seedForm(itemTemplate, true).then(form => {

            form.model.position.copy(this.hero.model.position);
            form.model.position.y = this.hero.determineElevationFromBase();

            data.uuid = form.model.uuid;
            this.eventDepot.fire('addItemToLayout', data);
        })
    }

    addEventListeners() {

        this.eventDepot.addListener('takeItemFromScene', this.takeItemFromScene);
        this.eventDepot.addListener('dropItemToScene', this.dropItemToScene);
        
        this.eventDepot.addListener('querySC', (data) => {
        
            let {key, queryName, args} = data;
            let response = null;
        
            switch (queryName) {
                case 'getHeroCoordinates':
                    response = { 
                        x: this.hero.model.position.x.toFixed(2),
                        y: this.hero.model.position.y.toFixed(2),
                        z: this.hero.model.position.z.toFixed(2)
                    }
                    break;
            }
            
            this.eventDepot.fire('SCResponse' + key, response);
        })

    }

    loadFormbyName(formName, callback) {

        let formTemplate = this.getObjectByName(formName);
        this.seedForm(formTemplate).then(form => {
            callback(form);
        })
    }

    allFriendliesInRange(range, position) { 
        var response = [];
        this.entities.filter(el => el.objectType != "beast").forEach(entity => {
            if (position.distanceTo(entity.model.position) < range) {
                response.push(entity);
            }
        })
        return response;
    }

    allEnemiesInRange(range, position) {
        var response = [];
        this.entities.filter(el => el.objectType == "beast").forEach(entity => {
            console.log(`distanceTo ${entity.objectName} is ${position.distanceTo(entity.model.position)}`);
            
            // apply height
            let enemyPosition = new THREE.Vector3();
            enemyPosition.copy(entity.model.position);
            enemyPosition.y += entity.attributes.height;
            
            if (position.distanceTo(enemyPosition) < range) {
                console.log(`in range`)
                response.push(entity);
            }
        })
        return response;
    }

    addToProjectiles(item) {

        // Starting direction
        let direction = this.scene.controls.getDirection(new THREE.Vector3( 0, 0, 0 ));
        direction.y += item.attributes.throwableAttributes.pitch;
        
        this.projectiles.push( {
            item,
            direction,
            velocity: new THREE.Vector3(),
            distanceTraveled: 0
        } );
        this.scene.add( item.model );
    }

}