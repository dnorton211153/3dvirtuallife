var camera, scene, renderer, 
    helper, proximityLight;

var mixers = {};
var actions = {};

var states = [ 'Idle', 'Walking', 'Running', 'Dance', 'Death', 'Sitting', 'Standing' ];
var emotes = [ 'Jump', 'Yes', 'No', 'Wave', 'Punch', 'ThumbsUp' ];

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;

var downRaycasterTestLength = 250;

var prevTime = performance.now();

// var vertex = new THREE.Vector3();
// var color = new THREE.Color();
var multiplier = 100;

var navbarHeight;

var WHITE = new THREE.Color('white');
var BLACK = new THREE.Color('black');
/**
 * The Scene has graphical display (THREE.js), animates using requestAnimationFrame,
 * and uses controls.  It accepts an initial layout of objects to setup the layout, 
 * then updates the objects array with locations after each animation.
 */

class Scene {

    constructor(hero, height, width, terrain, objects, background, controller) {

        // SceneController has access to layoutBuilder, which has levelManager
        this.controller = controller;
        
        this.planeWidth = width? width * multiplier * 1.1 : 2000;
        this.planeHeight = height? height * multiplier * 1.1 : 2000;

        this.hero = hero;
        this.emissives = [];
        this.objects = objects;
        this.background = background;
        this.terrain = terrain;

        // objects3D is used for raycast intersections
        this.objects3D = [];

        this.controls = null;

        this.animate = this.animate.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        this.seedObjects3D = this.seedObjects3D.bind(this);
        this.addControls = this.addControls.bind(this);
    }

    init() {

        navbarHeight = document.querySelector('.navbar').clientHeight;
        camera = new THREE.PerspectiveCamera( 35, window.innerWidth / (window.innerHeight - navbarHeight), 1, 1400 );
    
        camera.position.set( 0, 50, 250 );
        scene = new THREE.Scene();


        this.addBackground();
        this.addLights();
        this.addControls();
        this.addFloor(() => {
            this.seedObjects3D();
            this.addHero3D();
        });
        
        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, (window.innerHeight - navbarHeight));
        
        this.downRaycasterGeneric = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, downRaycasterTestLength);

        this.addEventListeners();
    }

    addBackground() {

        // BACKGROUND - EQUIRECT thanks to Paul Debevec! 
        if (this.background && this.background.length > 0) {

            // var textureLoader = new THREE.TextureLoader();
            // var textureEquirec, backgroundMesh;

            // textureEquirec = textureLoader.load( "/models/textures/" + this.background );
            // textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
            // textureEquirec.encoding = THREE.sRGBEncoding;

            // // Materials
            // var equirectShader = THREE.ShaderLib[ "equirect" ];
            // var equirectMaterial = new THREE.ShaderMaterial( {
            //     fragmentShader: equirectShader.fragmentShader,
            //     vertexShader: equirectShader.vertexShader,
            //     uniforms: equirectShader.uniforms,
            //     depthWrite: false,
            //     side: THREE.BackSide
            // } );

            // equirectMaterial.uniforms[ "tEquirect" ].value = textureEquirec;

            // Object.defineProperty( equirectMaterial, 'map', {

            //     get: function () {
            //         return this.uniforms.tEquirect.value;
            //     }
            // } );

            // backgroundMesh = new THREE.Mesh( new THREE.BoxBufferGeometry( this.planeWidth, 400, this.planeHeight ), equirectMaterial );
            // backgroundMesh.position.y = this.planeHeight/2;

            // More simplistic equirectangular mapping to the inverse of a sphere geometry:
            var geometry = new THREE.SphereBufferGeometry(this.planeHeight);
            geometry.scale (-1,.5,1);

            var material = new THREE.MeshBasicMaterial( {
                map: new THREE.TextureLoader().load("/models/textures/" + this.background)
            });

            var backgroundMesh = new THREE.Mesh(geometry, material)
            
            scene.add( backgroundMesh );

        } else {
            scene.background = new THREE.Color( 'white' );
        }

        scene.fog = new THREE.Fog( 'white', 0, 750 );
    }

    addLights() {
        var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, .75 );
        light.position.set( 0.5, 1, 0.75 );
        scene.add( light );

        proximityLight = new THREE.PointLight( 0x00ff00, 2, 50, 2 );
        proximityLight.position.set( 0, 0, 0 );
        scene.add( proximityLight );

    }

    addControls() {
        this.controls = new THREE.PointerLockControls( camera );

        scene.add( this.controls.getObject() );


        var onKeyDown = ( event ) => {
    
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
                    if ( mixers.hero.canJump === true ) {
                        mixers.hero.velocity.y += 350;
                        this.fadeToAction("hero", "Jump", 0.2)
                    }
                    mixers.hero.canJump = false;
                    mixers.hero.justJumped = true;
                    break;

                case 73: // i
                    this.controller.eventDepot.fire('modal', { type: 'inventory', title: 'Inventory' });
            }
    
        };
    
        var onKeyUp = ( event ) => {
    
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
    
        document.addEventListener( 'keydown', onKeyDown, false );
        document.addEventListener( 'keyup', onKeyUp, false );
    }

    addHelper() {

        helper = new THREE.Mesh ( new THREE.SphereBufferGeometry(5), new THREE.MeshBasicMaterial({ color: 'red' }));
        helper.visible = false;
        scene.add( helper );

    }

    addFloor(callback) {

        var loader = new THREE.GLTFLoader();
        loader.load( '/models/3d/gltf/' + this.terrain.gltf, (gltf) => {
        
            this.floor = gltf.scene;
            this.floor.scale.x = this.terrain.scale;
            this.floor.scale.y = this.terrain.scale * .2;
            this.floor.scale.z = this.terrain.scale;
            scene.add( this.floor );
            callback();
        
        }, undefined, function ( error ) {
        
            console.error( error );
        
        } );
    }

    addHero3D = () => {
        var loader = new THREE.GLTFLoader();
        loader.load( '/models/3d/gltf/' + this.hero.gltf, (gltf) => {
        
            let model = gltf.scene;
            
            model.scale.x = this.hero.attributes.scale;
            model.scale.y = this.hero.attributes.scale;
            model.scale.z = this.hero.attributes.scale;
           
            // model.position.z -= 40;
            model.position.y -= this.hero.attributes.height;
            model.rotation.y = Math.PI;

            this.controls.getObject().attributes = this.hero.attributes;
            this.controls.getObject().add( model );

            this.createGUI( model, gltf.animations, "hero" );
        
        }, undefined, function ( error ) {
        
            console.error( error );
        
        } );
    }

    determineElevationGeneric(x,z, uniqueId) {
        this.downRaycasterGeneric.ray.origin.x = x;
        this.downRaycasterGeneric.ray.origin.z = z;
        this.downRaycasterGeneric.ray.origin.y = downRaycasterTestLength - 1;

        // DEBUG for 'Cannot read property 'distance'...
        if (! this.downRaycasterGeneric.intersectObject(this.floor, true)[0]) {
            console.dir(this.floor);
            console.log(`${uniqueId} = ${x},${z}`);
        }
        return this.downRaycasterGeneric.ray.origin.y - this.downRaycasterGeneric.intersectObject(this.floor, true)[0].distance;
    }

    /** 
     * Create 3D representation of each object:
     */ 
    seedObjects3D = () => {

        // Set hero location:
        this.controls.getObject().translateX( this.hero.location.x * multiplier );
        this.controls.getObject().translateZ( this.hero.location.z * multiplier );
        this.controls.getObject().translateY( this.hero.attributes.height? this.hero.attributes.height : 20 ); 
            // this.determineElevation(this.controls.getObject().position.x, this.controls.getObject().position.z) + this.hero.attributes.height );

        this.objects.forEach(object => {

            // var loader = new THREE.ObjectLoader();
            var loader = new THREE.GLTFLoader();
            loader.load( '/models/3d/gltf/' + object.gltf, (gltf) => {
            
                let model = gltf.scene;

                model.scale.x = object.attributes.scale;
                model.scale.y = object.attributes.scale;
                model.scale.z = object.attributes.scale;

                model.objectName = object.name;
                model.objectType = object.type;
                model.attributes = object.attributes;
                
                model.position.x = object.location.x * multiplier + getRndInteger(-20,20);
                model.position.z = object.location.z * multiplier + getRndInteger(-20,20);
                model.position.y = this.determineElevationGeneric(model.position.x, model.position.z,object.name) + object.attributes.elevation;

                if (object.attributes.animates) {
                    this.createGUI( model, gltf.animations, model.uuid );
                }

                this.objects3D.push( model );
                scene.add( model );


            }, undefined, function ( error ) {
            
                console.error( error );
            
            } );
        }, this)

    }

    onMouseClick = (e) => {
        // DEBUGs
        console.log(`Controls object:`);
        console.dir(this.controls.getObject().position);
    }

    getObjectName = (obj) => {
        if (obj.objectName) {
            return obj.objectName;
        } else if (obj.parent == null) {
            return null;
        } else {
            return this.getObjectName(obj.parent);
        }
    }

    getObjectType = (obj) => {
        if (obj.objectType) {
            return obj.objectType;
        } else if (obj.parent == null) {
            return null;
        } else {
            return this.getObjectType(obj.parent);
        }
    }

    onMouseDown = (e) => {

        switch (e.button) {

            case 0:
                if (mixers.hero.selectedObject) {

                    let thisObj = mixers.hero.selectedObject;

                    // Get the parent name/type
                    let objectName = this.getObjectName(thisObj);
                    let objectType = this.getObjectType(thisObj);
                    
                    // If it is an item, pick it up and add to inventory
                    if (objectType == "item") {
                        
                        this.controller.eventDepot.fire('takeItem', objectName);
                        this.objects3D = this.objects3D.filter(el => {
                            return el.objectName != objectName;
                        }); 

                        scene.remove(scene.children.find(el => el.objectName == objectName));

                    // If it is a friendly entity, engage the conversation
                    } else if (objectType == "friendly") {
                        
                        // TODO: Get the intersected object's properties from the level manager.
                        this.controls.unlock();
                        this.controller.eventDepot.fire('modal', { name: objectName });
                   
                    } else if (objectType == "beast") {

                        this.fadeToAction("hero", "Punch", 0.2)
                        // TODO: act upon the enemy with the object in hand


                    } else if (objectType == "structure") {


                        mixers[thisObj.uuid].activeAction.reset();
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
                // helper.visible = false;
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

        var blocker = document.getElementById( 'blocker' );
        var instructions = document.getElementById( 'instructions' );

        this.controller.eventDepot.addListener('lockControls', () => {
            this.controls.lock();
        })

        this.controller.eventDepot.addListener('unlockControls', () => {
            this.controls.unlock();
        })

        instructions.addEventListener( 'click', () => {

            this.controls.lock();
        
        }, false );

        this.controls.addEventListener( 'lock', () => {

            instructions.style.display = 'none';
            blocker.style.display = 'none';
            document.addEventListener( 'mousedown', this.onMouseDown, false );
            document.addEventListener( 'mouseup', this.onMouseUp, false );
            document.addEventListener( 'click', this.onMouseClick, false );
        } );

        this.controls.addEventListener( 'unlock', () => {

            blocker.style.display = 'block';
            instructions.style.display = '';
            document.removeEventListener( 'mousedown', this.onMouseDown, false );
            document.removeEventListener( 'mouseup', this.onMouseUp, false );
            document.removeEventListener( 'click', this.onMouseClick, false );

        } );

        main.appendChild(renderer.domElement);
        window.addEventListener( 'resize', this.onWindowResize, false );
    }

    onWindowResize() {
        camera.aspect = window.innerWidth / (window.innerHeight - navbarHeight);
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, (window.innerHeight - navbarHeight) );
    }

    getMovementRay(origin, direction) {
        return new THREE.Raycaster( origin, direction, 0, 10 );
    }

    addToEmissives(obj) {
        if (!this.emissives.map(el => el.object).includes(obj)) {
            this.emissives.push({object: obj, timeLeft: 30});
        }
    }

    handleEmissives() {

        this.emissives.forEach(obj => {
            obj.object.object.material.emissive = WHITE;

            if (obj.timeLeft > 0) {
                obj.timeLeft --;
            } else {
                obj.object.object.material.emissive = BLACK;
            }
        });

        this.emissives.filter(el => el.timeLeft > 0);
    }

    /**
     * Animation mixer based on webgl/THREE demo with robot.
     * Each entity will have his own mixer;
     */
    createGUI = (model, animations, uniqueId) => {

        var thisMixer = new THREE.AnimationMixer( model );

        animations.forEach(animation => {

            var action = thisMixer.clipAction( animation );

            if ( emotes.indexOf( animation.name ) >= 0 || states.indexOf( animation.name ) >= 4 ) {
                action.clampWhenFinished = true;
                action.loop = THREE.LoopOnce;
            }
            actions[ uniqueId + animation.name ] = action;
        });

        var mixerObj = { 
        
            name: model.objectName, 
            mixer: thisMixer,
            activeActionName: 'Idle',
            activeAction: actions[Object.keys(actions)[0]],
            previousActionName: '',
            previousAction: null,
            absVelocity: 0,
            direction: new THREE.Vector3(),
            velocity: new THREE.Vector3(),
            downRaycaster: new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, downRaycasterTestLength ),
            movementRaycaster: new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, 0, 0 ), 0, 10 ),
            onObject: false,
            justJumped: false,
            canJump: true,
            selectedObject: null

        };

        mixers[uniqueId] = mixerObj;

        // DEFAULT:
        if (mixerObj.activeAction) mixerObj.activeAction.play();

    }

    fadeToAction = ( uuid, actionName, duration ) => {
        
        // Get the mixer for this uuid:
        let thisMixer = mixers[uuid];

        if ( thisMixer.activeActionName !== actionName ) {

            let newAction = actions[ uuid + actionName ];

            thisMixer.previousActionName = thisMixer.activeActionName;
            thisMixer.previousAction = thisMixer.activeAction;
            thisMixer.activeActionName = actionName;
            thisMixer.activeAction = newAction;

            thisMixer.previousAction.fadeOut( duration );

            thisMixer.activeAction
                .reset()
                .setEffectiveTimeScale( 1 )
                .setEffectiveWeight( 1 )
                .fadeIn( duration )
                .play();

            const restoreState = () => {
                thisMixer.mixer.removeEventListener('finished', restoreState );
                this.fadeToAction( uuid, thisMixer.previousActionName, 0.1 );
            }
    
            // After fadeToAction ({emote}, {seconds}), fadeToAction ({state}, {seconds}) again
            if (emotes.includes(actionName)) {
                thisMixer.mixer.addEventListener( 'finished', restoreState );
            }
        }
    }
    
    handleMixers(delta) {
        if ( mixers ) {
            Object.keys(mixers).forEach(key => {
                mixers[key].mixer.update( delta );

                mixers[key].absVelocity = Math.max(Math.abs(mixers[key].velocity.x), Math.abs(mixers[key].velocity.z));

                if (mixers[key].absVelocity < .1 && mixers[key].activeActionName == 'Walking') {
                    this.fadeToAction( key, 'Idle', 0.2);
                } else if (mixers[key].absVelocity >= .1 && mixers[key].activeActionName == 'Idle') {
                    this.fadeToAction( key, 'Walking', 0.2);
                }
            })
        }
    }

    determineElevation(uniqueId, entity) {

        let thisMixer = mixers[uniqueId];
        let downRaycaster = thisMixer.downRaycaster;
        downRaycaster.ray.origin.copy(entity.position);
        downRaycaster.ray.origin.y = downRaycasterTestLength - 1;


        var intersections = downRaycaster.intersectObjects( this.objects3D, true ).filter(el => {
            return this.getObjectName(el.object) != entity.objectName;
        });

        if (thisMixer.justJumped || thisMixer.onObject) {
            thisMixer.onObject = intersections.length > 0;
        }

        // Accomodate for hero height (special case due to controls object)
        var elevation = (uniqueId == "hero") ? this.hero.attributes.height : 0;

        if ( thisMixer.onObject === true ) {
            elevation += (downRaycaster.ray.origin.y - intersections[0].distance);
        } else {
            // DEBUG for 'Cannot read property 'distance'...
            if (! downRaycaster.intersectObject(this.floor, true)[0]) {
                console.log(entity.objectName);
                console.dir(entity.position);

            }
            elevation += (downRaycaster.ray.origin.y - downRaycaster.intersectObject(this.floor, true)[0].distance);
        }
        

        return elevation;
    }

    /**
     * This function will move an entity from one location to another.
     * Direction is relative to the entity in question
     */
    handleMovement = ( uniqueId, entity, delta ) => {

        let thisMixer = mixers[uniqueId];

        var yAxisRotation = new THREE.Euler( 0, entity.rotation.y, 0, 'YXZ' );
        let worldDirection = new THREE.Vector3().copy(thisMixer.direction).applyEuler( yAxisRotation );
        
        let mRaycaster = thisMixer.movementRaycaster;
        mRaycaster.ray.origin.copy( entity.position );
        mRaycaster.ray.direction.x = - worldDirection.x;
        mRaycaster.ray.direction.z = - worldDirection.z;

        // Only perform the translation if I will not invade another.
        let movementIntersects = mRaycaster.intersectObjects(this.objects3D, true).filter(el => el != entity);
        
        if (movementIntersects.length == 0) {
            
            entity.translateX( thisMixer.velocity.x * delta );
            entity.translateY( thisMixer.velocity.y * delta );
            entity.translateZ( thisMixer.velocity.z * delta );

            if (Math.abs(entity.getWorldPosition(entity.position).x) >= this.planeHeight/2 || 
            Math.abs(entity.getWorldPosition(entity.position).z) >= this.planeWidth/2) {
                entity.translateX( -thisMixer.velocity.x * delta );
                entity.translateY( -thisMixer.velocity.y * delta );
                entity.translateZ( -thisMixer.velocity.z * delta );

                if (uniqueId != "hero") {
                    entity.rotateY(1);
                }
            }
        } else {
            // console.dir(intersects);
        }

        let elevation = this.determineElevation( uniqueId, entity );

        // if (uniqueId == "hero") {
        //     console.log(`Elevation: ${elevation}`);
        //     console.log(`entity.position.y: ${entity.position.y}`);
        //     console.log(`entity.attributes.elevation: ${entity.attributes.elevation}`);
        // }
        
        // If onObject or onGround:
        if (thisMixer.onObject || entity.position.y <= (elevation + entity.attributes.elevation)) {
            entity.position.y = (elevation + entity.attributes.elevation);
            thisMixer.velocity.y = Math.max( 0, thisMixer.velocity.y );
            thisMixer.canJump = true;
            thisMixer.justJumped = false;
        } 
    }

    identifySelectedObject(heroObj) {

        proximityLight.rotation.copy(heroObj.rotation);
        proximityLight.position.copy(heroObj.position);
        proximityLight.translateZ(-40);
        proximityLight.translateY(-10);

        let closest = Infinity;

        this.objects3D.forEach(o => {
            let distance = o.position.distanceTo(proximityLight.position);
            if (distance <= 50 && distance < closest) {
                closest = distance;
                mixers.hero.selectedObject = o;
                this.controller.eventDepot.fire('showDescription', { objectType: this.getObjectType(o), objectName: this.getObjectName(o) }); 
            }
        })

        if (closest > 50) {
            mixers.hero.selectedObject = null;
            this.controller.eventDepot.fire('hideDescription', {}); 
        }

        // console.log(closest);

    }

    handleHeroMovement(delta) {

        if (mixers.hero) {

            let thisMixer = mixers.hero;

            let heroObj = this.controls.getObject();
            thisMixer.downRaycaster.ray.origin.copy( heroObj.position );

            // INERTIA
            thisMixer.velocity.x -= thisMixer.velocity.x * 10.0 * delta;
            thisMixer.velocity.z -= thisMixer.velocity.z * 10.0 * delta;
            thisMixer.velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

            thisMixer.direction.z = Number( moveForward ) - Number( moveBackward );
            thisMixer.direction.x = Number( moveLeft ) - Number( moveRight );
            thisMixer.direction.normalize(); // this ensures consistent movements in all directions
            
            if ( moveForward || moveBackward ) thisMixer.velocity.z -= thisMixer.direction.z * 1000.0 * delta;
            if ( moveLeft || moveRight ) thisMixer.velocity.x -= thisMixer.direction.x * 1000.0 * delta;

            this.identifySelectedObject(heroObj);

            this.handleMovement( "hero", heroObj, delta );
        }
    }

    handleEntityMovement(delta) {
        this.objects3D.filter(el => el.objectType == 'friendly' || el.objectType == 'beast').forEach(entity => {
            
            if (mixers[entity.uuid]) {
            
                // Make a random rotation (yaw)
                entity.rotateY(getRndInteger(-1,2)/100);
                
                // GRAVITY
                mixers[entity.uuid].velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

                // Basic movement always in the z-axis direction for this entity
                mixers[entity.uuid].velocity.z = getRndInteger(.2,entity.attributes.agility) * 100;
                this.handleMovement(entity.uuid, entity, delta);
            }
        });
    }

    animate() {
        
        requestAnimationFrame( this.animate );
        if ( this.controls.isLocked === true ) {

            var time = performance.now();
            var delta = ( time - prevTime ) / 1000;

            this.handleHeroMovement(delta);
            this.handleEntityMovement(delta);
            this.handleMixers(delta);

            prevTime = time;

        } else {
            prevTime = performance.now();
        }
        renderer.render( scene, camera );
    }
}

export {Scene};