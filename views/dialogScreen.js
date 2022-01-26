export class DialogScreen {

    constructor(eventDepot, modal) {
        this.modal = modal;
        this.eventDepot = eventDepot;
        this.entity = null;
        this.hero = null;
        this.gameObjects = [];
        this.tab = { items: {}, totalPrice: {} } ;
        this.payment = { };
        this.acceptDisabled = true;
        this.tempSpeech = null;
        this.negotiation = false;
    }

    addDialogEvents() {

        Array.from(document.querySelectorAll('.response')).forEach(el => {
            el.addEventListener('click', e => {
                // e.target.id;
                let responseType = this.getContext().responses[e.target.id].type;
                switch (responseType) {
                    case "engage":
                        this.entity.engageConversation();
                        break;
                    case "disengage":
                        this.entity.disengageConversation();
                        break;
                    case "neutral":
                        break;
                }
                this.refresh();
            })
        })

        Array.from(document.querySelectorAll('.changeTabItem')).forEach(el => {

            el.addEventListener('click', () => {
                let [itemName,price] = el.attributes['data-item'].value.split(':');
                let quantity = Number(el.attributes['data-quantity'].value);
    
                if (quantity == "1") { // "1" or "-1"
                    this.addTabItem(itemName, price);
                } else {
                    this.removeTabItem(itemName, price);
                }

                this.refresh();
            })
        })

        Array.from(document.querySelectorAll('.changePaymentItem')).forEach(el => {
            el.addEventListener('click', () => {
                let [itemName,price] = el.attributes['data-item'].value.split(':');
                let quantity = Number(el.attributes['data-quantity'].value);
    
                if (quantity == "1") { // "1" or "-1"
                    this.addPaymentItem(itemName);
                } else {
                    this.removePaymentItem(itemName);
                }

                this.refresh();
            })
        })

        Array.from(document.querySelectorAll('.matchTab')).forEach(el => {
            el.addEventListener('click', e => {
                this.matchTab();
                this.refresh();
            })
        })

        Array.from(document.querySelectorAll('.acceptDeal')).forEach(el => {
            el.addEventListener('click', e => {

                var response;
                if (Array.from(el.classList).includes("disabled")) {
                    response = "You'll have to do better than that, my friend."
                } else {
                    response = this.acceptDeal();
                }

                this.refresh(response);
            })
        })


    }

    setCurrentEntities(entity, hero) {
        this.entity = entity;
        this.hero = hero;
    }

    reset() {
        this.acceptDisabled = true;
        this.tab = { items: {}, totalPrice: {} } ;
        this.payment = { };
        this.tempSpeech = null;
        this.negotiation = false;
    }

    refresh = (tempSpeech) => {

        if (tempSpeech) {
            this.updateSpeech(tempSpeech);
        } else this.tempSpeech = null;


        if (this.negotiation) {
            if (this.goodDeal()) {
                this.acceptDisabled = false;
                this.updateSpeech("This looks like a fair deal!");
    
            } else {
                this.updateSpeech(tempSpeech? tempSpeech: "Make me an offer.");
                this.acceptDisabled = true;
            }
        }

        let context = this.getContext();

        this.modal.loadTemplate('modal-body', "dialog", context, () => {
            this.addDialogEvents();
        });

    }

    updateSpeech(speech) {
        this.tempSpeech = speech;
    }

    /** 
     * this.tab will look like this:
     * 
     * {
     *    items: {
     *        "itemA": 2,
     *        "item2": 1
     *    },
     *    totalPrice: {
     *         "gold": 20,
     *         "crystalBall": 1
     *    }
     * }
     * 
     * this.payment resembles the totalPrice object above.
     * 
     * @param price will look like "gold/30" or "crystalBall/1"
     */
    addTabItem(itemName, price) { // always incremented by one

        let currentNumberCommitted = this.tab.items[itemName]? this.tab.items[itemName] : 0;
        if (currentNumberCommitted < this.entity.getInventoryQuantity(itemName)) {

            let [paymentItem,paymentQuantity] = price.split('/');
            
            var paymentItemTotal;

            if (this.tab.totalPrice[paymentItem]) { // increment
                paymentItemTotal  = Number(this.tab.totalPrice[paymentItem]) + Number(paymentQuantity);
            }  else { // create
                paymentItemTotal = Number(paymentQuantity);
            }

            if (this.tab.items[itemName]) { // increment
                this.tab.items[itemName] = Number(this.tab.items[itemName]) + 1;
            }  else { // create
                this.tab.items[itemName] = 1
            }

            this.tab.totalPrice[paymentItem] = paymentItemTotal;
        }
        return this.tab;
    }

    removeTabItem(itemName, price) {

        if (this.tab.items[itemName] >= 1) {

            if (this.tab.items[itemName] == 1) {
                delete this.tab.items[itemName];
            } else if (this.tab.items[itemName] > 1) {
                this.tab.items[itemName] = Number(this.tab.items[itemName]) - 1;
            }
    
            let [paymentItem,paymentQuantity] = price.split('/');
    
            if (paymentItem == 'gold') {
                this.tab.totalPrice.gold -= Number(paymentQuantity);
            } else {
                this.tab.totalPrice[paymentItem] = Number(this.tab.totalPrice[paymentItem]) - Number(paymentQuantity);
                if (this.tab.totalPrice[paymentItem] == 0) delete this.tab.totalPrice[paymentItem];
            }
        }

        return this.tab;        
    }

    addPaymentItem(itemName) { 

        let currentNumberCommitted = this.payment[itemName]? this.payment[itemName] : 0;
        if (currentNumberCommitted < this.hero.getInventoryQuantity(itemName)) {
            if (this.payment[itemName]) {
                this.payment[itemName] += 1;
            } else {
                this.payment[itemName] = 1; 
            }
        }
        this.refresh();
        return this.payment;
    }

    removePaymentItem(itemName) {
        if (this.payment[itemName] > 1) {
            this.payment[itemName] -= 1;
        } else {
            if (itemName == "gold") {
                this.payment[itemName] = 0;
            } else {
                if (this.payment[itemName]) delete this.payment[itemName];
            }
        }
        this.refresh();
        return this.payment;        
    }

    matchTab() {

        let paymentCopy = JSON.parse(JSON.stringify(this.payment));
        Object.keys(this.tab.totalPrice).forEach(itemName => {
            if (this.tab.totalPrice[itemName] <= this.hero.getInventoryQuantity(itemName)) {
                this.payment[itemName] = this.tab.totalPrice[itemName];
            } else {
                this.payment = paymentCopy;
                return false;
            }
        })
        return true;

    }

    goodDeal() {

        if (Object.keys(this.tab.items).length == 0) return false;

        let goodDeal = true;


        // this.tab.totalPrice and this.payment resemble this: 
        // {
        //    "gold": 20,   (payable with items of exchange as well)
        //    "crystalBall": 1,
        //    "bagOfGems": 2    (redeemable as gold)
        // }

        Object.keys(this.tab.totalPrice).forEach(itemName => {

            switch (itemName) {
                case "gold":

                    // check to see if the total gold value of the offer meets the price
                    var tally = 0;
                    Object.keys(this.payment).forEach(item => {
                        let quantity = Number(this.payment[item]);
                        if (item == "gold") {
                            tally += quantity;
                        } else tally += (quantity * this.entity.getGoldValue(item));
                    })
                    if (this.tab.totalPrice[itemName] > tally) goodDeal = false;
                    break;

                default: 
                    if (this.payment[itemName] == undefined || this.tab.totalPrice[itemName] > this.payment[itemName]) {
                        goodDeal = false;
                    }
            }

        })
        return goodDeal;
    }

    acceptDeal() { // item exchange
        Object.keys(this.tab.items).forEach(item => {
            this.hero.addToInventory(item, 0, this.tab.items[item]);
        });

        Object.keys(this.payment).forEach(item => {
            this.entity.addToInventory(item, 0, this.payment[item]);
        });

        // Removals
        Object.keys(this.tab.items).forEach(item => {
            for (let i = 0; i < this.tab.items[item]; i++) {
                this.entity.removeFromInventory(item);
            }
        })

        Object.keys(this.payment).forEach(item => {
            for (let i = 0; i < this.payment[item]; i++) {
                this.hero.removeFromInventory(item); 
            }
        })
        
        this.hero.cacheHero();
        // TODO: Adjust the wants of the entity
        this.reset();
        return "We have a deal!";
    }

    getContext() {
        
        if (this.gameObjects.length == 0) this.gameObjects = JSON.parse(localStorage.getItem('gameObjects'));
        let context = this.entity.getCurrentConversation();

        if (context.wares) {

            this.negotiation = true;
            var inv = context.wares;
            context.inventory = [];
            context.wants = [];

            for (let index = 0; index < inv.length; index++) {
                let objectName = inv[index] && inv[index].itemName ? inv[index].itemName : undefined;


                if (inv[index] && inv[index].price) { // if the item is valid and has a price
                    let priceString = null;


                    let [paymentItem,paymentQuantity] = inv[index].price.split('/');
    
                    if (paymentItem == "gold") {
                        priceString = "$" + paymentQuantity;
                    } else priceString = 'item';
    
                    context.inventory[index] = {
                        index: index,
                        name: objectName,
                        description: this.gameObjects[objectName].description,
                        image: this.gameObjects[objectName].image,
                        quantity: inv[index].quantity? inv[index].quantity: 1,
                        price: inv[index].price,
                        priceString
                    };
                }
            }

            // look at special conditions to determine wants
            let specialConditions = this.entity.attributes.conversation.special.condition;

            for (let index = 0; index < specialConditions.length; index++) {
                let objectName = specialConditions[index] ? specialConditions[index] : undefined;

                context.wants[index] = {
                    index: index,
                    name: objectName,
                    description: this.gameObjects[objectName].description,
                    image: this.gameObjects[objectName].image,
                    quantity: this.hero.getInventoryQuantity(objectName)
                };

            }
        }

        context.payment = this.payment;
        context.tab = this.tab;
        context.acceptDisabled = this.acceptDisabled;
        context.goldExchange = Math.floor(this.entity.getGoldValue('bagOfGems'));

        if (this.tempSpeech) {
            context.tempSpeech = this.tempSpeech;
        } else context.tempSpeech = null;

        return context;
    }

}