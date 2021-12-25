var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;

var cameraReach = 1200;
var cameraDistanceDefault = 200;
var cameraElevationDefault = 40;

var cameraMinimapReach = 1200;
var cameraMinimapElevationDefault = 1000;

var DUENORTH = new THREE.Vector3( 0, 0, 2000 );

var multiplier = 100;
var navbarHeight;

var WHITE = new THREE.Color('white');
var BLACK = new THREE.Color('black');

var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

var minimap = false;

/**
 * The Scene has graphical display (THREE.js), animates using requestAnimationFrame,
 * and uses controls.  It accepts an initial layout of objects to setup the layout, 
 * then updates the objects array with locations after each animation.
 */

class Scene {

    constructor(hero, length, width, terrain, background, controller) {

        this.prevTime = performance.now();

        // SceneController has access to layoutManager, which has levelBuilder
        this.controller = controller;
        this.running = true;

        this.planeWidth = width? width * multiplier : 2000;
        this.planeHeight = length? length * multiplier : 2000;

        this.hero = hero;
        this.background = background;
        this.terrain = terrain;

        this.animate = this.animate.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        this.seedObjects3D = this.seedObjects3D.bind(this);
        this.addControls = this.addControls.bind(this);
        
        this.controls = null;
        this.scene = null;
    }

    init(callback) {

        navbarHeight = document.querySelector('.navbar').clientHeight;
    
        this.camera = new THREE.PerspectiveCamera( 35, SCREEN_WIDTH / (SCREEN_HEIGHT - navbarHeight), 1, cameraReach );
        this.camera.position.set( 0, cameraElevationDefault, cameraDistanceDefault );
        
        this.scene = new THREE.Scene();

        this.addControls();
        this.addBackground();
        this.addFloor(() => {
            this.seedObjects3D();
            this.addHero3D();
            this.addLights();

            this.renderer = new THREE.WebGLRenderer( { antialias: true } );
            this.renderer.setPixelRatio( window.devicePixelRatio );
            this.renderer.setSize( SCREEN_WIDTH, (SCREEN_HEIGHT - navbarHeight));
    
    
            this.stats = new Stats();
            document.body.appendChild( this.stats.dom );
    
            this.addEventListeners();
            if (callback) callback();
        });

    }

    addControls() {
        this.controls = new THREE.PointerLockControls( this.camera );

        // MINIMAP      
        this.rendererMinimap = new THREE.WebGLRenderer( { antialias: true } );
        document.getElementById('minimap').appendChild( this.rendererMinimap.domElement );
        this.cameraMinimap = new THREE.PerspectiveCamera( 45, 1, 1, cameraMinimapReach );
        this.cameraMinimap.position.set( 0, cameraMinimapElevationDefault, 0);
        this.cameraMinimap.rotation.set( -Math.PI / 2, 0, 0 );
        this.controls.getObject().add(this.cameraMinimap);
        
        // COMPASS
        // var compassGeometry = new THREE.CylinderBufferGeometry( 0, 10, 100, 12 );
        // compassGeometry.rotateX( Math.PI / 2 );
        // var compassMaterial = new THREE.MeshNormalMaterial();
        // this.compass = new THREE.Mesh( compassGeometry, compassMaterial );

        this.controller.loader.load( '/models/3d/gltf/arrow.gltf', (gltf) => {
            this.compass = gltf.scene;
            this.compass.scale.set( 100, 100, 100 );
            this.compass.children[0].material.side = THREE.FrontSide;
            this.compass.position.set( 0, cameraMinimapElevationDefault/2, -cameraMinimapElevationDefault/10);
            this.controls.getObject().add(this.compass);
        });

        

        this.cameraBackray = new THREE.Raycaster( new THREE.Vector3( ), new THREE.Vector3( 0, 0, 1 ), 0, cameraDistanceDefault);
        this.scene.add( this.controls.getObject() );
    
        document.addEventListener( 'keydown', this.onKeyDown, false );
        document.addEventListener( 'keyup', this.onKeyUp, false );
    }

    addBackground() {

        if (this.background && this.background.length > 0) {

            // simplistic equirectangular mapping to the inverse of a sphere geometry:
            var geometry = new THREE.SphereBufferGeometry(cameraReach - 250);
            geometry.scale (-1,1,1);

            var material = new THREE.MeshBasicMaterial( {
                map: new THREE.TextureLoader().load("/models/textures/" + this.background)
            });

            this.backgroundMesh = new THREE.Mesh(geometry, material)
            this.controls.getObject().add( this.backgroundMesh );

        } else {
            this.scene.background = BLACK;
        }

        if (this.terrain.fog) this.scene.fog = new THREE.Fog( this.terrain.fogColor, 900, cameraReach );
    }

    addLights() {

        if (this.terrain.hemisphereLight) {
            var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, .75 );
            light.position.set( 0.5, 1, 0.75 );
            this.scene.add( light );
        }

        if (this.terrain.overheadPointLight) {
            this.overheadPointLight = new THREE.PointLight( 0xf37509, 20, 450, 1 );
            this.overheadPointLight.position.set( 0, 0, 0 );
            this.scene.add( this.overheadPointLight );
        }
        
        this.proximityLight = new THREE.PointLight( 0x00ff00, 2, 150, 30 );
        this.proximityLight.position.set( 0, 0, 0 );
        this.scene.add( this.proximityLight );

    }

    onKeyDown = ( event ) => {
    
        switch ( event.keyCode ) {

            case 38: // up
            case 87: // w
                moveForward = true;
                break;

            case 37: // left
            case 65: // a
                moveLeft = true;
                break;

            case 40: // down
            case 83: // s
                moveBackward = true;
                break;

            case 39: // right
            case 68: // d
                moveRight = true;
                break;

            case 32: // space
                let heroMixer = this.controller.mixers.hero;
                
                if ( heroMixer.canJump === true ) {
                    heroMixer.velocity.y += 350;
                    this.controller.fadeToAction("hero", "Jump", 0.2)
                }
                heroMixer.canJump = false;
                heroMixer.justJumped = true;
                break;

            case 73: // i
                this.controller.eventDepot.fire('modal', { type: 'inventory', title: 'Inventory' });

            case 77: // m
                minimap = !minimap;
                this.controller.eventDepot.fire('minimap', {});
        }

    };

    onKeyUp = ( event ) => {

        switch ( event.keyCode ) {

            case 38: // up
            case 87: // w
                moveForward = false;
                break;

            case 37: // left
            case 65: // a
                moveLeft = false;
                break;

            case 40: // down
            case 83: // s
                moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                moveRight = false;
                break;

        }

    };

    addHelper() {

        this.helper = new THREE.Mesh ( new THREE.SphereBufferGeometry(5), new THREE.MeshBasicMaterial({ color: 'red' }));
        this.helper.visible = false;
        this.scene.add( this.helper );

    }

    setToRenderDoubleSided(object) {

        if (object.material) {
            object.material.side = THREE.DoubleSide;
        } else {
            object.children.forEach(e => this.setToRenderDoubleSided(e)); 
        }
    }

    addFloor(callback) {

        this.controller.load(this.terrain, (gltf) => {
            this.controller.floor = gltf.scene;
            this.controller.floor.objectName = "floor";
            this.controller.floor.objectType = "floor"; 
            this.setToRenderDoubleSided(this.controller.floor);
            this.scene.add( this.controller.floor );
            this.controller.objects3D.push(this.controller.floor);
            setTimeout(() => {
                callback();
            }, 200);
        }, undefined, function ( error ) {
            console.error( error );
        });
    }

    addHero3D = () => {

        this.controller.load(this.hero, (gltf) => {
            let model = gltf.scene;
            
            this.hero.model = model;

            let controlsObj = this.controls.getObject();

            // Adjustments for hero:
            // model.position.z -= 40;
            model.position.y -= this.hero.attributes.height;
            model.rotation.y = Math.PI;


            // Set hero location:
            controlsObj.translateX( this.hero.location.x * multiplier );
            controlsObj.translateZ( this.hero.location.z * multiplier );
            controlsObj.translateY( this.controller.determineElevationGeneric(
                this.hero.location.x * multiplier, this.hero.location.z * multiplier, "hero") + this.hero.attributes.height 
            );
            
            controlsObj.attributes = this.hero.attributes;

            // this.hero.attributes.height? this.hero.attributes.height : 20 ); 
            controlsObj.add( model );
            
            this.controller.createMixer( model, gltf.animations, "hero" );
        })
    }

    /** 
     * Create 3D representation of each object:
     */ 
    seedObjects3D = () => {

        this.controller.objects.forEach(object => {

            this.controller.load(object, (gltf) => {

                let model = gltf.scene;
                model.position.x = object.location.x * multiplier;
                model.position.z = object.location.z * multiplier;
                model.position.y = this.controller.determineElevationGeneric(model.position.x, model.position.z,object.name) + object.attributes.elevation;

                if (object.attributes.animates) {
                    this.controller.createMixer( model, gltf.animations, model.uuid );
                }

                if (object.attributes.contentItems) {
                    object.attributes.contentItems.forEach(contentItem => {
                        this.controller.load(contentItem, (iGltf) => {
                            let iModel = iGltf.scene;
                            iModel.position.x = object.location.x * multiplier;
                            iModel.position.z = object.location.z * multiplier;
                            iModel.position.y = this.controller.determineElevationGeneric(model.position.x, model.position.z,object.name) + object.attributes.elevation + contentItem.attributes.elevation;
                            this.controller.objects3D.push( iModel );
                            this.scene.add( iModel );
                        })
                    });
                }

                this.controller.objects3D.push( model );
                this.scene.add( model );

            }, undefined, function ( error ) {
                console.error( error );
            });

        });
    }

    onMouseClick = (e) => {
        console.log(`Controls object:`);
        console.dir(this.controls.getObject().position);

        console.log(`Objects3D object:`);
        console.dir(this.controller.objects3D);

    }

    onMouseDown = (e) => {

        switch (e.button) {

            case 0:
                let mixers = this.controller.mixers;
                if (mixers.hero && mixers.hero.selectedObject) {

                    let thisObj = mixers.hero.selectedObject;

                    // Get the parent name/type
                    let objectName = this.controller.getObjectName(thisObj);
                    let objectType = this.controller.getObjectType(thisObj);
                    
                    // If it is an item, pick it up and add to inventory
                    if (objectType == "item") {
                        this.controller.eventDepot.fire('takeItem', {name: objectName, uuid: thisObj.uuid});
                    // If it is a friendly entity, engage the conversation
                    } else if (objectType == "friendly") {
                        
                        // TODO: Get the intersected object's properties from the level manager.
                        this.controls.unlock();
                        this.controller.eventDepot.fire('modal', { name: objectName });
                   
                    } else if (objectType == "beast") {

                        this.controller.fadeToAction("hero", "Punch", 0.2)
                        // TODO: act upon the enemy with the object in hand


                    } else if (objectType == "structure") {
                        
                        // Does this structure require a key?
                        var accessible = thisObj.attributes.key ? 
                            this.hero.inventory.map(el => el.itemName).includes(thisObj.attributes.key) :
                            true;
                        
                        if (accessible) {
                            thisObj.attributes.unlocked = true;
                            if (mixers[thisObj.uuid] && mixers[thisObj.uuid].activeAction) {
                                this.controller.runActiveAction(thisObj.uuid, 0.2);
                            }
                        }
                    }
                }
                break;
            case 1:
                break;
            case 2:
                moveForward = true;
                break;
        }
    }

    onMouseUp = (e) => {
        switch (e.button) {

            case 0:
                // this.helper.visible = false;
                break;
            case 1:
                break;
            case 2:
                moveForward = false;
                break;
        }
    }

    addEventListeners() {
        let main = document.querySelector('main');
        main.innerHTML = `<div id="blocker" style="display: block;">

        <div id="instructions" style="">
            <span style="font-size:40px">Click to play</span>
            <br>
            (W, A, S, D = Move, SPACE = Jump, MOUSE = Look around)
        </div>

        </div>`;

        this.blocker = document.getElementById( 'blocker' );
        this.instructions = document.getElementById( 'instructions' );

        this.controller.eventDepot.addListener('lockControls', () => {
            this.controls.lock();
        })

        this.controller.eventDepot.addListener('unlockControls', () => {
            this.controls.unlock();
        })

        this.instructions.addEventListener( 'click', () => {

            this.controls.lock();
        
        }, false );
        
        this.controls.addEventListener( 'lock', () => {

            this.instructions.style.display = 'none';
            this.blocker.style.display = 'none';
            document.addEventListener( 'mousedown', this.onMouseDown, false );
            document.addEventListener( 'mouseup', this.onMouseUp, false );
            document.addEventListener( 'click', this.onMouseClick, false );
        } );

        this.controls.addEventListener( 'unlock', () => {

            this.blocker.style.display = 'block';
            this.instructions.style.display = '';
            document.removeEventListener( 'mousedown', this.onMouseDown, false );
            document.removeEventListener( 'mouseup', this.onMouseUp, false );
            document.removeEventListener( 'click', this.onMouseClick, false );

        } );

        main.appendChild(this.renderer.domElement);
        window.addEventListener( 'resize', this.onWindowResize, false );
    }

    onWindowResize() {
        SCREEN_WIDTH = window.innerWidth;
        SCREEN_HEIGHT = window.innerHeight;

        this.camera.aspect = SCREEN_WIDTH / (SCREEN_HEIGHT - navbarHeight);
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( SCREEN_WIDTH, (SCREEN_HEIGHT - navbarHeight) );
    }

    getMovementRay(origin, direction) {
        return new THREE.Raycaster( origin, direction, 0, 10 );
    }

    handleMixers(delta) {
        if ( this.controller.mixers ) {

            let mixers = this.controller.mixers;
            Object.keys(mixers).forEach(key => {
                
                
                if (mixers[key].moves) {
                    mixers[key].absVelocity = Math.max(Math.abs(mixers[key].velocity.x), Math.abs(mixers[key].velocity.z));
    

                    if (mixers[key].absVelocity < .1 && (mixers[key].activeActionName == 'Walking' || mixers[key].activeActionName == 'Running')) {
                        this.controller.fadeToAction( key, 'Idle', 0.2);
                    } else if (mixers[key].absVelocity >= .1 && mixers[key].activeActionName == 'Idle') {
                        this.controller.fadeToAction( key, 'Walking', 0.2);
                    } else if (mixers[key].absVelocity >= 199 && mixers[key].activeActionName == 'Walking') {
                        this.controller.fadeToAction( key, 'Running', 0.2);
                    }
                }

                mixers[key].mixer.update( delta );
            })
        }
    }

    /**
     * This function will move an entity from one location to another.
     * Direction is relative to the entity in question
     */
    handleMovement = ( uniqueId, entity, delta ) => {

        var yAxisRotation = new THREE.Euler( 0, entity.rotation.y, 0, 'YXZ' );
        let worldDirection = new THREE.Vector3().copy(this.controller.mixers[uniqueId].direction).applyEuler( yAxisRotation );
        
        let mRaycaster = this.controller.mixers[uniqueId].movementRaycaster;
        mRaycaster.ray.origin.copy( entity.position );
        mRaycaster.ray.direction.x = - worldDirection.x;
        mRaycaster.ray.direction.z = - worldDirection.z;

        if (uniqueId != "hero") {
            
            mRaycaster.ray.direction.x = - mRaycaster.ray.direction.x;
            mRaycaster.ray.direction.z = - mRaycaster.ray.direction.z;
            mRaycaster.ray.origin.y += 20;
        }

        let movementIntersects = mRaycaster.intersectObjects(this.controller.objects3D, true).filter(el => this.controller.getRootObject3D(el.object) != entity);
        
        if (movementIntersects.length == 0) {

            entity.translateX( this.controller.mixers[uniqueId].velocity.x * delta );
            entity.translateY( this.controller.mixers[uniqueId].velocity.y * delta );
            entity.translateZ( this.controller.mixers[uniqueId].velocity.z * delta );

            if (Math.abs(entity.getWorldPosition(entity.position).x) >= this.planeHeight/2 || 
            Math.abs(entity.getWorldPosition(entity.position).z) >= this.planeWidth/2) {

                entity.translateX( -this.controller.mixers[uniqueId].velocity.x * delta );
                entity.translateY( -this.controller.mixers[uniqueId].velocity.y * delta );
                entity.translateZ( -this.controller.mixers[uniqueId].velocity.z * delta );

                if (uniqueId != "hero") {
                    entity.rotateY(Math.PI);
                }
            }
        } else {
            
            this.controller.mixers[uniqueId].velocity.x = 0;
            this.controller.mixers[uniqueId].velocity.y = 0;
            this.controller.mixers[uniqueId].velocity.z = 0;

            if (uniqueId != "hero") {
                entity.rotateY(2);
            } 
        }

        this.controller.setElevation( uniqueId, entity );

    }

    identifySelectedObject(heroObj) {

        this.proximityLight.rotation.copy(heroObj.rotation);
        this.proximityLight.position.copy(heroObj.position);
        this.proximityLight.translateZ(-40);
        this.proximityLight.translateY(-10);

        let closest = Infinity;

        this.controller.objects3D.forEach(o => {
            let distance = o.position.distanceTo(this.proximityLight.position);
            if (distance <= 50 && distance < closest) {
                // If the object is unlocked, exclude to allow selecting the contents
                if (!o.attributes.contentItems || (o.attributes.contentItems && !o.attributes.unlocked))  {
                    closest = distance;
                    this.controller.mixers.hero.selectedObject = o;
                    this.controller.eventDepot.fire('showDescription', { objectType: this.controller.getObjectType(o), objectName: this.controller.getObjectName(o) }); 
                }
            }
        })

        if (closest > 50) {
            this.controller.mixers.hero.selectedObject = null;
            this.controller.eventDepot.fire('hideDescription', {}); 
        }

    }

    handleAutoZoom = () => {
        this.cameraBackray.ray.origin.copy(this.controls.getObject().position);

        // NEEDS PITCH as well
        let cameraDirection = this.controls.getDirection(new THREE.Vector3( 0, 0, 0 ));

        this.cameraBackray.ray.direction.x = -cameraDirection.x
        this.cameraBackray.ray.direction.y = -cameraDirection.y + 0.4
        this.cameraBackray.ray.direction.z = -cameraDirection.z

        let backrayIntersections = 
            [...this.cameraBackray.intersectObject(this.controller.floor, true), 
            ...this.cameraBackray.intersectObjects(this.controller.objects3D.filter(el => el.objectType == 'structure'), true)]
        
        if (backrayIntersections[0]) {
            let distance = backrayIntersections[0].distance;
            if (distance < cameraDistanceDefault && this.camera.position.z > -5) {
                this.camera.position.z -= cameraDistanceDefault / 30;
                if (this.camera.position.y > (this.controls.getObject().position.y + 10)) this.camera.position.y -= cameraElevationDefault / 30;
            }
        } else {
            if (this.camera.position.z <= cameraDistanceDefault) {
                this.camera.position.z += cameraDistanceDefault / 100;
                if (this.camera.position.y < cameraElevationDefault) this.camera.position.y += cameraElevationDefault / 100;
            }
        }
    }
    
    // Calculate hero location using grid coordinates
    updateHeroLocation = () => {
        let { x, y, z } = this.controls.getObject().position;
        
        let zOffset = (z < 0) ? 20 : -20;
        
        this.hero.location.x = x / multiplier;
        this.hero.location.z = (z+zOffset) / multiplier;

    }

    handleHeroMovement(delta) {

        if (this.controller.mixers.hero) {

            // INERTIA
            this.controller.mixers.hero.velocity.x -= this.controller.mixers.hero.velocity.x * 10.0 * delta;
            this.controller.mixers.hero.velocity.z -= this.controller.mixers.hero.velocity.z * 10.0 * delta;
            this.controller.mixers.hero.velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

            this.controller.mixers.hero.direction.z = Number( moveForward ) - Number( moveBackward );
            this.controller.mixers.hero.direction.x = Number( moveLeft ) - Number( moveRight );
            this.controller.mixers.hero.direction.normalize(); // this ensures consistent movements in all directions
            
            if ( moveForward || moveBackward ) this.controller.mixers.hero.velocity.z -= this.controller.mixers.hero.direction.z * 1000.0 * this.hero.attributes.agility * delta;
            if ( moveLeft || moveRight ) this.controller.mixers.hero.velocity.x -= this.controller.mixers.hero.direction.x * 1000.0 * this.hero.attributes.agility * delta;

            this.identifySelectedObject(this.controls.getObject());

            this.handleMovement( "hero", this.controls.getObject(), delta );
            
            if (this.controller.mixers.hero.standingUpon && this.controller.mixers.hero.standingUpon.attributes.routeTo && typeof this.controller.mixers.hero.standingUpon.attributes.routeTo.level == "number") {
                if (this.controller.mixers.hero.standingUpon.attributes.unlocked) {
                    
                    this.updateHeroLocation();

                    this.controller.eventDepot.fire('saveLevel', {
                        hero: this.hero.basic(),
                        level: this.controller.level
                    });

                    this.controller.eventDepot.fire('loadLevel', {
                        level: this.controller.mixers.hero.standingUpon.attributes.routeTo.level,
                        location: this.controller.mixers.hero.standingUpon.attributes.routeTo.location,
                        hero: this.hero
                    });
                }
            }

            this.handleAutoZoom();

            if (this.terrain.overheadPointLight) {
                this.overheadPointLight.position.copy(this.controls.getObject().position);
                this.overheadPointLight.position.y = this.hero.attributes.height + 40;
           }
        }
    }

    handleEntityMovement(delta) {
        this.controller.objects3D.filter(el => el.objectType == 'friendly' || el.objectType == 'beast').forEach(entity => {
            
            if (this.controller.mixers[entity.uuid]) {
            
                // Make a random rotation (yaw)
                entity.rotateY(getRndInteger(-1,2)/100);
                
                // GRAVITY
                this.controller.mixers[entity.uuid].velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

                // Basic movement always in the z-axis direction for this entity
                this.controller.mixers[entity.uuid].velocity.z = getRnd(.2,entity.attributes.agility) * 100;
                this.controller.mixers[entity.uuid].velocity.x = 0; // getRndInteger(.2,entity.attributes.agility) * 100;
                
                this.controller.mixers[entity.uuid].direction.z = getRnd(-.2,.2);
                this.controller.mixers[entity.uuid].direction.x = getRnd(-.2,.2);

                this.handleMovement(entity.uuid, entity, delta);
            }
        });
    }

    animate() {
        
        requestAnimationFrame( this.animate );
        if ( this.controls.isLocked === true && this.running ) {

            this.time = performance.now();
            this.delta = ( this.time - this.prevTime ) / 1000;

            this.handleHeroMovement(this.delta);
            this.handleEntityMovement(this.delta);
            this.handleMixers(this.delta);

            if (this.backgroundMesh) this.backgroundMesh.rotation.y = -this.controls.getObject().rotation.y;

            this.prevTime = this.time;

        } else {
            this.prevTime = performance.now();
        }
        this.renderer.render( this.scene, this.camera );

        if (minimap) {

            // renderer.setViewport( 0, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT );
            // renderer.render( scene, activeCamera );
            // cameraMinimap.lookAt(this.controls.getObject().position);
            // renderer.setViewport( SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT );
            // renderer.render( scene, camera );
            this.rendererMinimap.render(this.scene, this.cameraMinimap);
            this.compass.lookAt( DUENORTH );
        }


        this.stats.update();
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

    deanimate(callback) {
        this.running = false;
        
        cancelAnimationFrame( this.animate );
        document.getElementById('minimap').firstElementChild.remove();

        this.dispose(this.scene);
        callback();
    }

    unregisterEventListeners = () => {
        this.instructions.removeEventListener( 'click', this.controls.lock, false );
        document.removeEventListener( 'keydown', this.onKeyDown, false );
        document.removeEventListener( 'keyup', this.onKeyUp, false );
        window.removeEventListener( 'resize', this.onWindowResize, false );
        this.controller.eventDepot.removeListeners('takeItem');
        this.controller.eventDepot.removeListeners('dropItem');
        this.controller.eventDepot.removeListeners('lockControls');
        this.controller.eventDepot.removeListeners('unlockControls');
    }

}

export {Scene};