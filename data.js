// data.js

// 1. THE ENCYCLOPEDIA (Descriptions & Logic)
// data.js

// 1. FEATURES DATABASE (Descriptions & Logic)
const FEATURES_DB = {
    // FIGHTER
    "Fighting Style": {
        desc: "You adopt a particular style of fighting as your specialty (e.g., Archery, Defense, Dueling)."
    },
    "Second Wind": {
        desc: "On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level.",
        resource: { name: "Second Wind", count: 1 }
    },
    "Action Surge": {
        desc: "On your turn, you can take one additional action.",
        resource: { name: "Action Surge", count: 1 }
    },
    
    // WIZARD
    "Arcane Recovery": {
        desc: "Once per day when you finish a short rest, you can choose expended spell slots to recover.",
        resource: { name: "Arcane Recovery", count: 1 }
    },
    "Spellcasting (Wizard)": {
        desc: "You contain a spellbook with spells.",
        resource: { name: "1st Level Slots", count: 2 } // Basic logic for lvl 1
    },

    // MONK (Showing off Ki mechanics)
    "Unarmored Defense": {
        desc: "While not wearing armor and not using a shield, your AC equals 10 + DEX modifier + WIS modifier."
    },
    "Martial Arts": {
        desc: "You can use Dexterity instead of Strength for the attack and damage rolls of your unarmed strikes and monk weapons."
    },
    "Ki": {
        desc: "You have a pool of Ki points to spend on Flurry of Blows, Patient Defense, and Step of the Wind.",
        // Logic: We will set a default, but the charactermancer will override this based on level
        resource: { name: "Ki Points", count: 2 } 
    },
    "Unarmored Movement": {
        desc: "Your speed increases by 10 feet while you are not wearing armor or wielding a shield."
    }
};

// 2. THE CLASS TABLES
const GAME_DATA = {
    "Fighter": {
        hitDie: 10,
        primaryStat: "STR",
        saves: "STR, CON",
        features: {
            1: ["Fighting Style", "Second Wind"],
            2: ["Action Surge"],
            3: []
        },
        subclasses: {
            "Champion": { 3: ["Improved Critical"] }
        }
    },
    "Wizard": {
        hitDie: 6,
        primaryStat: "INT",
        saves: "INT, WIS",
        features: {
            1: ["Arcane Recovery", "Spellcasting (Wizard)"],
            2: [],
            3: []
        },
        subclasses: {
            "Evocation": { 2: ["Evocation Savant", "Sculpt Spells"] }
        }
    },
    "Monk": {
        hitDie: 8,
        primaryStat: "DEX",
        saves: "STR, DEX",
        features: {
            1: ["Unarmored Defense", "Martial Arts"],
            2: ["Ki", "Unarmored Movement"],
            3: ["Deflect Missiles"]
        },
        subclasses: {
            "Open Hand": { 3: ["Open Hand Technique"] }
        }
    }
};