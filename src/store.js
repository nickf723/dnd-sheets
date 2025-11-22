// src/store.js

// Default State
const DEFAULT_FORM = {
    name: "Base Form",
    stats: [10,10,10,10,10,10],
    saves: "", features: "",
    hpCurr: 10, hpMax: 10, ac: 10, init: 0, spd: "30",
    resources: [], inventory: [], spells: [],
    deathSaves: {}
};

export const state = {
    global: { name: "", inventory: "", gp:0, sp:0, cp:0 },
    forms: { "form_1": JSON.parse(JSON.stringify(DEFAULT_FORM)) }, // Deep copy
    activeFormId: "form_1"
};

export const Store = {
    // Get the currently active form data
    getActiveForm() {
        return state.forms[state.activeFormId];
    },

    // Switch the active form
    switchForm(id) {
        if (state.forms[id]) {
            state.activeFormId = id;
        }
    },

    // Create a new form
    createForm(name) {
        const newId = "form_" + Date.now();
        // Clone default structure
        state.forms[newId] = JSON.parse(JSON.stringify(DEFAULT_FORM));
        state.forms[newId].name = name;
        state.activeFormId = newId;
        this.save();
    },

    // Save to LocalStorage
    save() {
        localStorage.setItem('dnd_meta_v6', JSON.stringify(state));
    },

    // Load from LocalStorage
    load() {
        const raw = localStorage.getItem('dnd_meta_v6');
        if (raw) {
            const data = JSON.parse(raw);
            state.global = data.global;
            state.forms = data.forms;
            state.activeFormId = data.active || "form_1";
        }
    },
    
    // Export as JSON file
    exportJSON() {
        return JSON.stringify(state, null, 2);
    },
    
    // Import JSON data
    importJSON(jsonString) {
        const data = JSON.parse(jsonString);
        if(!data.forms) throw new Error("Invalid Save File");
        state.global = data.global;
        state.forms = data.forms;
        state.activeFormId = data.active;
        this.save();
    }
};