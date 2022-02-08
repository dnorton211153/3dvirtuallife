import { baselineHeroTemplates } from '/models/baselineHeroTemplates.js'

var props = { level: 0, layouts: [] }

export class CharacterScreen {
 
    constructor(eventDepot, modal) {

        this.eventDepot = eventDepot;
        this.modal = modal;

        this.selectedTemplate = 0;
        this.heroTemplates = this.getBaselineHeroTemplates();
        this.heroTemplate = null;
        this.currentModel = null;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 75, 2/3, 0.25, 100 );
        this.renderer = new THREE.WebGLRenderer( { antialias: true } );

        this.loader = new THREE.GLTFLoader();
        this.animationId = null;
        this.cylinder = null;

        // lights

        var light = new THREE.HemisphereLight( 0xffffff, 0x444444 );
        light.position.set( 0, 20, 0 );
        this.scene.add( light );

        light = new THREE.DirectionalLight( 0xffffff );
        light.position.set( 0, 20, 10 );
        this.scene.add( light );

    }

    /** 
     * Combine the newHeroTemplate with baselineHeroTemplates. 
     */
    getBaselineHeroTemplates = () => {

        let templates = [];
        baselineHeroTemplates.forEach(template => {
            let newTemplate = newHeroTemplate();
            newTemplate.attributes = {...newTemplate.attributes, ...template.attributes};
            newTemplate.type = template.type;
            newTemplate.gltf = template.gltf;
            newTemplate.png = template.png;
            newTemplate.description = template.description;
            templates.push(newTemplate);
        })
        return templates;
    }


    initialize = () => {
        handleGet('/listSavedHeroes', (response) => {
            let savedHeroes = JSON.parse(response).map(el => JSON.parse(el));
            this.heroTemplates = [...this.heroTemplates, ...savedHeroes];
            this.refresh();
        });
    }

    /**
     * Re-loads the character page with the selected heroTemplate,
     * then re-adds the events.  Called after next/back clicks.
     */
    refresh = () => {
        this.heroTemplate = this.heroTemplates[this.selectedTemplate];
        this.modal.loadTemplate('modal-body', "character", this.heroTemplate, () => {
            this.addCharacterScreenEvents();
            if (this.heroTemplate) this.updateCanvas();
        });
    }

    updateCanvas = () => {

        // stop the existing animation cycle
        if (this.animationId) cancelAnimationFrame( this.animationId );
        
        // Re-add the playerPreview panel
        let playerPreview = document.getElementById('playerPreview');
        playerPreview.appendChild( this.renderer.domElement );
        
        this.scene.remove( this.currentModel );
        this.scene.dispose();
        this.render();

        // Which model to add to the scene?
        this.loader.load( '/models/3d/gltf/' + this.heroTemplate.gltf, (gltf) => {
            this.currentModel = gltf.scene;
            
            // // cylinder for testing; replace with hero glb
            // var geometry = new THREE.CylinderGeometry( 5, 5, 20, 32 );
            // var material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
            // this.cylinder = new THREE.Mesh( geometry, material );
            
            // this.currentModel.scale.x = this.heroTemplate.attributes.scale;
            // this.currentModel.scale.y = this.heroTemplate.attributes.scale;
            // this.currentModel.scale.z = this.heroTemplate.attributes.scale;
            
            this.scene.add( this.currentModel ); // (  );this.cylinder
            this.camera.position.z = 6;
            this.camera.position.y = 2;

        })
    }

    /**
     * Recursive method which renders the scene in the canvas.
     */
    render = () => {

        // if (this.cylinder) {
        //     this.cylinder.rotation.x += 0.01;
        //     this.cylinder.rotation.y += 0.01;
        // }

        if (this.currentModel) this.currentModel.rotation.y += 0.01;

        this.animationId = requestAnimationFrame( this.render );
        this.renderer.render( this.scene, this.camera );

    }

    /** 
     * getInitialContext queries the server for saved heroes under this user account,
     * updates "this.heroTemplates" array, and returns this.heroTemplates[0].
     */
    getInitialContext() {


    }

    /**
     * Add events to buttons 
     */
    addCharacterScreenEvents() {
        
        document.getElementById('next').addEventListener('click', () => {
            this.selectedTemplate++;
            if (this.selectedTemplate >= this.heroTemplates.length) this.selectedTemplate = 0;
            if (this.heroTemplate) this.refresh();
        });

        document.getElementById('back').addEventListener('click', () => {
            this.selectedTemplate--;
            if (this.selectedTemplate < 0 ) this.selectedTemplate = this.heroTemplates.length - 1;
            if (this.heroTemplate) this.refresh();
        });

        document.getElementById('startLevel').addEventListener('click', (e) => {
            e.preventDefault();

            this.heroTemplate = this.heroTemplates[this.selectedTemplate];

            this.heroTemplate.name = document.getElementById('name').value;
            this.heroTemplate.attributes.height = Number(document.getElementById('height').value);

            handleGet('/listActiveGames', (response) => {

                let activeGames = JSON.parse(response);
                if (Object.keys(activeGames).length > 0) { // if there are games

                    /** 
                     * TODO (future): allow creation of new game namespace.
                     * For now only one namespace is allowed ('/') so the
                     * only option is to join game.
                     */
                    this.eventDepot.fire('closeModal', {});
                    this.eventDepot.fire('joinGame', { heroTemplate: this.heroTemplate, activeGames });

                } else { // no games, so start a new one
                    
                    let namespace = '/';
                    this.eventDepot.fire('closeModal', {});
                    this.eventDepot.fire('startLevel', { heroTemplate: this.heroTemplate, props, namespace });
                }
            });
        });

        document.getElementById('joinGame').addEventListener('click', (e) => {
            
            e.preventDefault();

            this.heroTemplate.name = document.getElementById('name').value;
            this.heroTemplate.gltf = this.heroTemplates[this.selectedTemplate].gltf;
            this.heroTemplate.attributes.stats = {...this.heroTemplate.attributes.stats, ...this.heroTemplates[this.selectedTemplate].attributes.stats }
            this.heroTemplate.attributes.height = Number(document.getElementById('height').value);

            handleGet('/listActiveGames', (response) => {

                let activeGames = JSON.parse(response);
                if (Object.keys(activeGames).length > 0) { // if there are games
            
                    this.eventDepot.fire('closeModal', {});
                    this.eventDepot.fire('joinGame', { heroTemplate: this.heroTemplate, activeGames });

                } else { // no games to join, so notify and start new game

                    let namespace = '/';
                    alert('No games to join!  Starting new game.');
                    this.eventDepot.fire('closeModal', {});
                    this.eventDepot.fire('startLevel', { heroTemplate: this.heroTemplate, props, namespace });
                }
            });

        });
    }
}


function newHeroTemplate(name,height) {
    return {
        name: 'new',
        type: 'hero',
        subtype: 'local',
        location: { x: 0, y: 0, z: 0 },
        attributes: {
            moves: true,
            animates: true,
            height: 20,
            length: 20,
            width: 20,
            scale: 10,
            elevation: 0,
            experience: 0,
            stats: {
                health: "3/5/0",  // min/max/boost
                mana: "10/10/0",
                strength: "1/1/0",
                agility: "3/3/0",
                defense: "0/0/0"
            },
            xpLevels: {
                health: 0,
                mana: 0,
                strength: 0,
                agility: 0,
                defense: 0
            }
        },
        gltf: 'robot.glb',
        model: null,
        inventory: [],
        spells: [
            {"itemName":"healSpell"},
            {"itemName":"healAllSpell"},
            {"itemName":"poisonSpell"},
            {"itemName":"poisonProjectileSpell"},
            {"itemName":"fireProjectileSpell"},
            {"itemName":"iceProjectileSpell"},
        ],
        equipped: {},
        conversation: {
            conversationState: "intro",
            engagementState: 0,
            special: {
                speech: "Most esteemed greetings to you, my friend!  Let's trade.",
                action: 'showWares'
            }
        },
    }
}