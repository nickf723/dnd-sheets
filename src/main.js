// src/main.js
import { Store, state } from './store.js';
import { UI } from './ui.js';
import { API } from './api.js';

// We need to grab GAME_DATA from the global scope (since data.js is loaded via script tag)
// Or if you moved data.js to src, import it. For now, we assume it's global.
const GAME_DATA = window.GAME_DATA || {};
const FEATURES_DB = window.FEATURES_DB || {};

// --- INIT ---
window.onload = () => {
    Store.load();
    UI.updateAll();
    setupGlobalListeners();
    initCharactermancer(); // Prepare the dropdowns
};

// --- 1. GLOBAL EXPORTS (The "Glue" for HTML buttons) ---
window.switchForm = (id) => {
    Store.switchForm(id);
    UI.updateAll();
    Store.save();
};

window.saveGlobal = () => {
    const g = state.global;
    g.name = document.getElementById('global-name').value;
    g.gp = document.getElementById('currency-gp').value;
    g.sp = document.getElementById('currency-sp').value;
    g.cp = document.getElementById('currency-cp').value;
    g.inventory = document.getElementById('global-inventory').innerHTML;
    Store.save();
};

window.saveCurrentForm = () => {
    const f = Store.getActiveForm();
    // Scrape inputs
    f.ac = document.getElementById('ac').value;
    f.init = document.getElementById('init').value;
    f.spd = document.getElementById('spd').value;
    f.features = document.getElementById('features').innerHTML;
    f.saves = document.getElementById('saves').innerHTML;
    
    // Stats
    [0,1,2,3,4,5].forEach(i => f.stats[i] = document.getElementById(`score-${i}`).value);
    
    Store.save();
    UI.updateAll(); 
};

window.createNewForm = () => {
    const name = prompt("Name?");
    if(name) { Store.createForm(name); UI.updateAll(); }
};

// --- 2. UI LOGIC EXPORTS (Tabs, Rest, HP) ---

window.openTab = (tabName) => {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    // Show Target
    const targetContent = (tabName === 'main') ? document.getElementById('tab-main') : document.getElementById(`tab-${tabName}`);
    if(targetContent) targetContent.classList.add('active');
    
    // Update buttons visually (simple index match for demo)
    const buttons = document.querySelectorAll('.tab-btn');
    if(tabName === 'main' && buttons[0]) buttons[0].classList.add('active');
    if(tabName === 'spells' && buttons[1]) buttons[1].classList.add('active');
    if(tabName === 'inventory' && buttons[2]) buttons[2].classList.add('active');
};

window.modHP = (amount) => {
    const f = Store.getActiveForm();
    let val = parseInt(f.hpCurr) || 0;
    f.hpCurr = val + amount;
    Store.save();
    UI.updateAll();
};

window.takeLongRest = () => {
    if(!confirm("Long Rest? Reset HP and Resources?")) return;
    const f = Store.getActiveForm();
    f.hpCurr = f.hpMax;
    f.deathSaves = {}; // Clear death saves
    
    // Refill resources
    if(f.resources) {
        f.resources.forEach(r => r.filled.fill(true));
    }
    Store.save();
    UI.updateAll();
};

window.addResource = () => {
    const f = Store.getActiveForm();
    f.resources.push({ name: "New", total: 3, filled: [true, true, true] });
    Store.save();
    UI.updateAll();
};

window.exportData = () => {
    const json = Store.exportJSON();
    const blob = new Blob([json], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `character_${state.global.name || 'hero'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

window.importData = (input) => {
    const file = input.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            Store.importJSON(e.target.result);
            UI.updateAll();
        } catch(err) { alert("Load failed: " + err); }
    };
    reader.readAsText(file);
};


// --- 3. CHARACTERMANCER EXPORTS ---

window.openCharactermancer = () => {
    document.getElementById('mancer-modal').style.display = 'flex';
};
window.closeCharactermancer = () => {
    document.getElementById('mancer-modal').style.display = 'none';
};

function initCharactermancer() {
    const classSelect = document.getElementById('mancer-class');
    if(!classSelect) return;
    classSelect.innerHTML = '';
    // Using global GAME_DATA from data.js
    Object.keys(GAME_DATA).forEach(cls => {
        const opt = document.createElement('option');
        opt.value = cls; opt.text = cls;
        classSelect.appendChild(opt);
    });
    
    // Attach listener for subclass updates
    classSelect.onchange = () => {
        const cls = classSelect.value;
        const subSelect = document.getElementById('mancer-subclass');
        subSelect.innerHTML = '<option value="">-- None --</option>';
        if (GAME_DATA[cls] && GAME_DATA[cls].subclasses) {
            Object.keys(GAME_DATA[cls].subclasses).forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub; opt.text = sub;
                subSelect.appendChild(opt);
            });
        }
    };
    // Trigger once
    classSelect.onchange();
}

window.applyCharactermancer = () => {
    const clsName = document.getElementById('mancer-class').value;
    const level = parseInt(document.getElementById('mancer-level').value);
    const subName = document.getElementById('mancer-subclass').value;
    
    const clsData = GAME_DATA[clsName];
    if (!clsData) return;

    const f = Store.getActiveForm();
    
    // 1. Build Features HTML
    let html = `<h3 style="border-bottom:1px solid #444;">${clsName} ${level}</h3>`;
    
    // Helper
    const add = (key) => {
        const db = FEATURES_DB[key];
        if(db) {
            html += `<details class="feature-item"><summary>${key}</summary><p>${db.desc}</p></details>`;
            if(db.resource) {
                const count = (key === "Ki") ? level : db.resource.count;
                // Add resource if missing
                if(!f.resources.find(r => r.name === db.resource.name)) {
                    f.resources.push({ 
                        name: db.resource.name, 
                        total: count, 
                        filled: Array(count).fill(true) 
                    });
                }
            }
        } else {
            html += `<div>• ${key}</div>`;
        }
    };

    // Class Features
    for(let i=1; i<=level; i++) {
        if(clsData.features[i]) clsData.features[i].forEach(add);
    }
    // Subclass Features
    if(subName && clsData.subclasses[subName]) {
        html += `<h4>${subName}</h4>`;
        const subData = clsData.subclasses[subName];
        Object.keys(subData).forEach(lvl => {
            if(parseInt(lvl) <= level) subData[lvl].forEach(add);
        });
    }

    f.features = html;
    f.saves = clsData.saves;

    // HP Calc
    const conMod = Math.floor((parseInt(document.getElementById('score-2').value) - 10)/2);
    const avg = (clsData.hitDie / 2) + 1;
    f.hpMax = (clsData.hitDie + conMod) + ((avg + conMod) * (level - 1));
    f.hpCurr = f.hpMax;

    Store.save();
    UI.updateAll();
    window.closeCharactermancer();
};


// --- 4. EVENT LISTENERS (Search, etc) ---
function setupGlobalListeners() {
    // ... (Same as previous step: Click delegation for bubbles, delete buttons) ...
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const action = target.dataset.action;
        if (!action) return;

        const f = Store.getActiveForm();

        if (action === 'toggle-res') {
            const resIdx = target.dataset.res;
            const bubIdx = target.dataset.bub;
            const res = f.resources[resIdx];
            res.filled[bubIdx] = !res.filled[bubIdx];
            Store.save();
            UI.updateAll();
        }
        
        if (action === 'toggle-ds') {
            const key = target.dataset.type + target.dataset.idx;
            f.deathSaves = f.deathSaves || {};
            f.deathSaves[key] = !f.deathSaves[key];
            Store.save();
            UI.updateAll();
        }

        if (action === 'del-spell') {
            if(confirm("Forget spell?")) {
                f.spells.splice(target.dataset.idx, 1);
                Store.save();
                UI.updateAll();
            }
        }

        if (action === 'del-item') {
            if(confirm("Drop item?")) {
                f.inventory.splice(target.dataset.idx, 1);
                Store.save();
                UI.updateAll();
            }
        }
    });

    // Search Listeners
    setupSearch('spell-search', async (q) => {
        const results = await API.searchSpells(q);
        renderSearchResults('spell-results', results, (item) => {
            // Normalize spell data structure
            const spellObj = {
                name: item.name,
                level: item.level,
                school: item.school,
                desc: item.desc,
                range: item.range
            };
            Store.getActiveForm().spells.push(spellObj);
            Store.save();
            UI.updateAll();
        });
    });

    setupSearch('inv-search', async (q) => {
        const type = document.getElementById('inv-search-type').value;
        const results = await API.searchItems(q, type);
        renderSearchResults('inv-results', results, (item) => {
            // Normalize item data
            const itemObj = {
                name: item.name,
                type: type,
                desc: item.desc || item.description || "",
                damage: item.damage_dice ? `${item.damage_dice} ${item.damage_type}` : null,
                ac: item.ac_string || null,
                rarity: item.rarity || null
            };
            Store.getActiveForm().inventory.push(itemObj);
            Store.save();
            UI.updateAll();
        });
    });
}

// Helper
let timeout;
function setupSearch(id, callback) {
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('keyup', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => callback(e.target.value), 500);
    });
}

function renderSearchResults(containerId, results, onAdd) {
    const con = document.getElementById(containerId);
    if(!con) return;
    con.innerHTML = '';
    
    if(results.length === 0) {
        con.style.display = 'none';
        return;
    }
    con.style.display = 'block';

    results.forEach(r => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerText = r.name;
        div.onclick = () => { 
            onAdd(r); 
            con.style.display = 'none'; 
            // clear input
            const input = con.previousElementSibling.querySelector('input') || con.previousElementSibling; 
            if(input) input.value = '';
        };
        con.appendChild(div);
    });
}