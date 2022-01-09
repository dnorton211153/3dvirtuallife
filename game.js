/**
 * Norton - 2021
 * 
 * The 'Game' is the main interface for the game.
 * 
 * It utilizes the LayoutManager to provide layout details
 * given the props (hero, level, and layouts).
 * 
 */

import { LayoutManager } from './layout/layoutManager.js';

class Game {

    constructor(heroTemplate, eventDepot) {

        // this.props = props;
        this.heroTemplate = heroTemplate;
        this.eventDepot = eventDepot;

        this.stop = this.stop.bind(this);
        this.start = this.start.bind(this);

        this.addEventListeners = this.addEventListeners.bind(this);
        this.addEventListeners();
    }

    addEventListeners() {
        this.eventDepot.addListener('loadLevel', (data) => {
            this.eventDepot.fire('unlockControls', {});
            this.stop();

            this.heroTemplate = JSON.parse(localStorage.getItem('gameHeroTemplate'));
            if (data.location) this.heroTemplate.location = data.location;

            this.heroTemplate.location.x -= 1;

            this.eventDepot.fire('startGame', {
                heroTemplate: this.heroTemplate,
                props: { level: data.level }
            })
        });
    }

    stop() {
        if (this.layoutManager) {
            this.layoutManager.shutdown(() => {
                this.layoutManager = null;
            });
        }
    }

    start(level) {

        this.layoutManager = new LayoutManager(level, this.eventDepot);
        this.layoutManager.launch(this.heroTemplate);
    }
}

function newHeroTemplate(name,height) {
    return {
        name: name,
        type: "hero",
        location: { x: 0, y: 0, z: 0 },
        attributes: {
            moves: true,
            animates: true,
            height: height,
            length: 20,
            width: 20,
            scale: 10,
            elevation: 0,
            stats: {
                health: "03/05",
                mana: "00/00",
                strength: "01/01",
                agility: "03/03"
            }
        },
        gltf: 'robot.glb',
        model: null,
        inventory: [],
        spells: [],
        equipped: {}

    }
}

export { Game, newHeroTemplate };