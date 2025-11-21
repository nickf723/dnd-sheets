// main.js

// --- CONFIG & STATE ---
const STATS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
let globalData = { name: "", inventory: "" };

// Default empty state
let formsData = {
    "form_1": { 
        name: "Base Form", 
        stats: [10,10,10,10,10,10], 
        saves: "", 
        features: "", 
        hpCurr: 10, hpMax: 10, ac: 10, init: 0, spd: "30",
        resources: [] 
    }
};
let currentFormId = "form_1";

// --- INITIALIZATION ---
// This waits for the HTML to be ready before running
window.onload = () => {
    try {
        loadAll(); // Try to load from LocalStorage
        renderStats(); // Draw the stat inputs
        updateUI(); // Fill the inputs with data
        initCharactermancer(); // Setup the dropdowns
        console.log("System initialized successfully.");
    } catch (e) {
        console.error("Startup Error:", e);
    }
};

// --- RENDERING STATS ---
function renderStats() {
    const container = document.getElementById('stats-container');
    container.innerHTML = '';
    STATS.forEach((stat, i) => {
        container.innerHTML += `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; background: rgba(255,255,255,0.05); padding: 5px; border-radius: 4px;">
            <strong style="width: 40px; font-size: 0.9rem;">${stat}</strong>
            <span id="mod-${i}" style="font-weight: bold; color: var(--accent); font-size: 1.1rem; width: 30px; text-align: center;">+0</span>
            <input type="number" id="score-${i}" value="10" oninput="updateStats(); saveCurrentForm()" style="width: 50px; text-align: center; background: rgba(0,0,0,0.3); border: 1px solid #444; color: white; border-radius: 4px;">
        </div>`;
    });
}

function updateStats() {
    STATS.forEach((_, i) => {
        const input = document.getElementById(`score-${i}`);
        const val = parseInt(input.value) || 10;
        const mod = Math.floor((val - 10) / 2);
        document.getElementById(`mod-${i}`).innerText = (mod >= 0 ? "+" : "") + mod;
    });
}

function renderResources(resources) {
    const container = document.getElementById('resources-container');
    container.innerHTML = '';
    if(!resources) return;

    resources.forEach((res, idx) => {
        let bubbles = '';
        for(let i=0; i<res.total; i++) {
            // Check if this specific bubble is filled
            const isFilled = (res.filled && res.filled[i] === true) ? 'filled' : '';
            bubbles += `<div class="bubble ${isFilled}" onclick="toggleRes(${idx}, ${i})"></div>`;
        }
        
        container.innerHTML += `
        <div class="resource-row">
            <input value="${res.name}" oninput="updateResName(${idx}, this.value)" style="width: 120px; background: transparent; border: none; color: #ccc; font-size: 0.8rem;">
            <div class="bubbles">${bubbles}</div>
        </div>`;
    });
}

// --- FORM SWITCHING ---
function switchForm(formId) {
    currentFormId = formId;
    updateUI();
}

function createNewForm() {
    const name = prompt("New Form Name:", "Transformed State");
    if (!name) return;
    const newId = "form_" + Date.now();
    // Deep copy the current form to use as a template, or start fresh
    // For now, let's clone the basic structure
    formsData[newId] = { 
        name: name, 
        stats: [10,10,10,10,10,10], 
        saves: "", features: "", 
        hpCurr: 10, hpMax: 10, ac: 10, init: 0, spd: "30",
        resources: []
    };
    switchForm(newId);
    saveAll();
}

function updateUI() {
    // 1. Update Dropdown
    const select = document.getElementById('form-selector');
    select.innerHTML = '';
    Object.keys(formsData).forEach(key => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.text = formsData[key].name;
        if(key === currentFormId) opt.selected = true;
        select.appendChild(opt);
    });

    // 2. Update Fields
    const data = formsData[currentFormId];
    document.getElementById('class-badge').innerText = data.name;
    document.getElementById('saves').innerHTML = data.saves || "";
    document.getElementById('features').innerHTML = data.features || "";
    document.getElementById('hp-curr').value = data.hpCurr;
    document.getElementById('hp-max').value = data.hpMax;
    document.getElementById('ac').value = data.ac;
    document.getElementById('init').value = data.init;
    document.getElementById('spd').value = data.spd;
    
    // 3. Update Stats
    if(data.stats) {
        data.stats.forEach((val, i) => document.getElementById(`score-${i}`).value = val);
        updateStats();
    }

    // 4. Update Resources
    renderResources(data.resources || []);
    updateHPUI();

    // 2. Update Death Saves Visuals
    const ds = formsData[currentFormId].deathSaves || {};
    // Loop through s1..s3 and f1..f3
    ['s', 'f'].forEach(type => {
        for(let i=1; i<=3; i++) {
            const el = document.getElementById(`ds-${type}${i}`);
            if(ds[`${type}${i}`]) {
                el.classList.add(type === 's' ? 'success' : 'fail');
            } else {
                el.classList.remove('success', 'fail');
            }
        }
    });
    renderSpells();
    renderInventory();

    document.getElementById('currency-gp').value = globalData.gp || 0;
    document.getElementById('currency-sp').value = globalData.sp || 0;
    document.getElementById('currency-cp').value = globalData.cp || 0;
}


// --- RESOURCE LOGIC ---
function toggleRes(resIdx, bubbleIdx) {
    const res = formsData[currentFormId].resources[resIdx];
    if(!res.filled) res.filled = []; // Ensure array exists
    res.filled[bubbleIdx] = !res.filled[bubbleIdx]; // Toggle boolean
    updateUI();
    saveAll();
}
function updateResName(idx, val) {
    formsData[currentFormId].resources[idx].name = val;
    saveAll();
}
function addResource() {
    if(!formsData[currentFormId].resources) formsData[currentFormId].resources = [];
    formsData[currentFormId].resources.push({name: "New", total: 3, filled: [true,true,true]});
    updateUI();
    saveAll();
}

// --- CHARACTERMANCER ---
function initCharactermancer() {
    const classSelect = document.getElementById('mancer-class');
    classSelect.innerHTML = ''; // clear
    Object.keys(GAME_DATA).forEach(cls => {
        const opt = document.createElement('option');
        opt.value = cls; opt.text = cls;
        classSelect.appendChild(opt);
    });
    updateSubclassOptions();
}

function openCharactermancer() {
    document.getElementById('mancer-modal').style.display = 'flex';
}
function closeCharactermancer() {
    document.getElementById('mancer-modal').style.display = 'none';
}

function updateSubclassOptions() {
    const cls = document.getElementById('mancer-class').value;
    const subSelect = document.getElementById('mancer-subclass');
    subSelect.innerHTML = '<option value="">-- None --</option>';
    
    if (GAME_DATA[cls] && GAME_DATA[cls].subclasses) {
        Object.keys(GAME_DATA[cls].subclasses).forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub; opt.text = sub;
            subSelect.appendChild(opt);
        });
    }
}

function applyCharactermancer() {
    const clsName = document.getElementById('mancer-class').value;
    const level = parseInt(document.getElementById('mancer-level').value);
    const clsData = GAME_DATA[clsName];

    if (!clsData) return;

    const currentForm = formsData[currentFormId];
    if(!currentForm.resources) currentForm.resources = [];

    let featureHTML = `<h3 style="border-bottom:1px solid #444; padding-bottom:5px;">${clsName} (Lvl ${level})</h3>`;

    // Helper to add feature
    const addFeat = (key) => {
        const dbEntry = FEATURES_DB[key];
        if (dbEntry) {
            featureHTML += `
            <details class="feature-item">
                <summary>${key}</summary>
                <p>${dbEntry.desc}</p>
            </details>`;
            
            // Resource Logic
            if (dbEntry.resource) {
                let count = dbEntry.resource.count;
                
                // Special: Ki Points Logic (Count = Level)
                if (key === "Ki") count = level;

                // Check if exists
                const exists = currentForm.resources.find(r => r.name === dbEntry.resource.name);
                if (!exists) {
                    currentForm.resources.push({
                        name: dbEntry.resource.name,
                        total: count,
                        filled: Array(count).fill(true)
                    });
                }
            }
        } else {
            featureHTML += `<div>• ${key}</div>`;
        }
    };

    // 1. Loop Levels
    for(let i=1; i<=level; i++) {
        if(clsData.features[i]) {
            clsData.features[i].forEach(feat => addFeat(feat));
        }
    }
    
    // 2. Subclass
    const subName = document.getElementById('mancer-subclass').value;
    if (subName && clsData.subclasses[subName]) {
        featureHTML += `<h4>${subName}</h4>`;
        const subData = clsData.subclasses[subName];
        Object.keys(subData).forEach(lvl => {
            if(parseInt(lvl) <= level) {
                subData[lvl].forEach(feat => addFeat(feat));
            }
        });
    }

    currentForm.features = featureHTML;
    currentForm.saves = clsData.saves;
    
    // Simple HP Calc
    const conMod = Math.floor((parseInt(document.getElementById('score-2').value) - 10)/2);
    const avgHP = (clsData.hitDie / 2) + 1;
    currentForm.hpMax = (clsData.hitDie + conMod) + ((avgHP + conMod) * (level - 1));

    updateUI();
    saveAll();
    closeCharactermancer();
}

// --- STORAGE ---
function saveGlobal() {
    globalData.name = document.getElementById('global-name').value;
    globalData.inventory = document.getElementById('global-inventory').innerHTML;
    globalData.gp = document.getElementById('currency-gp').value;
    globalData.sp = document.getElementById('currency-sp').value;
    globalData.cp = document.getElementById('currency-cp').value;
    saveAll();
}

function saveCurrentForm() {
    const form = formsData[currentFormId];
    form.stats = STATS.map((_, i) => document.getElementById(`score-${i}`).value);
    form.saves = document.getElementById('saves').innerHTML;
    form.features = document.getElementById('features').innerHTML;
    form.hpCurr = document.getElementById('hp-curr').value;
    form.hpMax = document.getElementById('hp-max').value;
    form.ac = document.getElementById('ac').value;
    form.init = document.getElementById('init').value;
    form.spd = document.getElementById('spd').value;
    saveAll();
}

function saveAll() {
    const bundle = { global: globalData, forms: formsData, active: currentFormId };
    localStorage.setItem('dnd_meta_v5', JSON.stringify(bundle));
}

function loadAll() {
    const raw = localStorage.getItem('dnd_meta_v5');
    if(raw) {
        const data = JSON.parse(raw);
        globalData = data.global;
        formsData = data.forms;
        currentFormId = data.active || "form_1";
    }
    document.getElementById('global-name').value = globalData.name;
    document.getElementById('global-inventory').innerHTML = globalData.inventory;
}

// --- HP LOGIC ---
function updateHPUI() {
    const curr = parseInt(document.getElementById('hp-curr').value) || 0;
    const max = parseInt(document.getElementById('hp-max').value) || 1;
    
    // Update Text Overlay
    document.getElementById('hp-display-curr').innerText = curr;
    document.getElementById('hp-display-max').innerText = max;

    // Update Bar Width
    const pct = Math.max(0, Math.min(100, (curr / max) * 100));
    const bar = document.getElementById('hp-bar');
    bar.style.width = pct + "%";

    // Update Color based on percentage
    bar.className = 'hp-fill'; // reset
    if (pct < 25) bar.classList.add('danger');
    else if (pct < 50) bar.classList.add('warning');
}

function modHP(amount) {
    const input = document.getElementById('hp-curr');
    let val = parseInt(input.value) || 0;
    input.value = val + amount;
    updateHPUI();
    saveCurrentForm();
}

// --- REST MECHANIC ---
function takeLongRest() {
    if(!confirm("Take a Long Rest? This will heal you and reset resources.")) return;
    
    const form = formsData[currentFormId];
    
    // 1. Heal to Max
    document.getElementById('hp-curr').value = form.hpMax;
    form.hpCurr = form.hpMax;
    
    // 2. Reset Death Saves
    form.deathSaves = { s1: false, s2: false, s3: false, f1: false, f2: false, f3: false };

    // 3. Refill ALL Resources (Bubbles)
    if(form.resources) {
        form.resources.forEach(res => {
            res.filled = Array(res.total).fill(true);
        });
    }

    updateUI();
    saveAll();
    alert("You feel refreshed!");
}

// --- DEATH SAVES ---
function toggleDS(type, index) {
    const form = formsData[currentFormId];
    if(!form.deathSaves) form.deathSaves = {};
    
    const key = type + index; // e.g., "s1" or "f2"
    form.deathSaves[key] = !form.deathSaves[key];
    
    updateUI();
    saveAll();
}

// --- TAB LOGIC ---
function openTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    // Show Target
    const targetContent = (tabName === 'main') ? document.getElementById('tab-main') : document.getElementById(`tab-${tabName}`);
    targetContent.classList.add('active');
    
    // Highlight Button (simple logic for demo)
    const buttons = document.querySelectorAll('.tab-btn');
    if(tabName === 'main') buttons[0].classList.add('active');
    if(tabName === 'spells') buttons[1].classList.add('active');
    if(tabName === 'inventory') buttons[2].classList.add('active');
}

// --- API INTERACTION (Open5e) ---
let searchTimeout;

function searchAPI(query, type) {
    const resultsBox = document.getElementById('spell-results');
    if(query.length < 3) {
        resultsBox.style.display = 'none';
        return;
    }

    // Debounce (wait for typing to stop)
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        resultsBox.innerHTML = '<div style="padding:10px;">Searching the weave...</div>';
        resultsBox.style.display = 'block';

        try {
            // Fetch from Open5e
            const response = await fetch(`https://api.open5e.com/spells/?search=${query}&limit=5`);
            const data = await response.json();
            
            resultsBox.innerHTML = '';
            if(data.results.length === 0) {
                resultsBox.innerHTML = '<div style="padding:10px;">No spells found.</div>';
            }

            data.results.forEach(spell => {
                const div = document.createElement('div');
                div.className = 'result-item';
                div.innerHTML = `<span>${spell.name}</span> <span style="font-size:0.8rem; color:#aaa;">${spell.level} ${spell.school}</span>`;
                div.onclick = () => addSpellToBook(spell);
                resultsBox.appendChild(div);
            });

        } catch (e) {
            console.error(e);
            resultsBox.innerHTML = '<div style="padding:10px; color:red;">Connection failed.</div>';
        }
    }, 500); // 500ms delay
}

// --- SPELLBOOK LOGIC ---
function addSpellToBook(spellData) {
    const form = formsData[currentFormId];
    if(!form.spells) form.spells = [];

    // Avoid duplicates
    if(form.spells.find(s => s.slug === spellData.slug)) {
        alert("You already know this spell!");
        return;
    }

    // Save minimal data to keep file small
    form.spells.push({
        name: spellData.name,
        level: spellData.level,
        school: spellData.school,
        range: spellData.range,
        desc: spellData.desc,
        slug: spellData.slug
    });

    document.getElementById('spell-results').style.display = 'none';
    document.getElementById('spell-search').value = '';
    renderSpells();
    saveAll();
}

function renderSpells() {
    const container = document.getElementById('spellbook-container');
    const form = formsData[currentFormId];
    container.innerHTML = '';

    if(!form.spells || form.spells.length === 0) {
        container.innerHTML = '<div style="color:#888; text-align:center; padding:20px;">Your Grimoire is empty.</div>';
        return;
    }

    // Sort by Level
    form.spells.sort((a, b) => {
        // Handle "Cantrip" vs "1st Level" sorting
        const getLvl = (lvl) => lvl === "Cantrip" ? 0 : parseInt(lvl.charAt(0));
        return getLvl(a.level) - getLvl(b.level);
    });

    form.spells.forEach((spell, index) => {
        const div = document.createElement('div');
        div.className = 'spell-card';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="this.nextElementSibling.open = !this.nextElementSibling.open">
                <strong>${spell.name}</strong>
                <button class="btn btn-danger" style="padding:2px 6px; font-size:0.6rem;" onclick="event.stopPropagation(); removeSpell(${index})">X</button>
            </div>
            <details>
                <summary class="spell-level">${spell.level} • ${spell.school}</summary>
                <div class="spell-meta">Range: ${spell.range}</div>
                <p style="font-size:0.9rem; white-space:pre-wrap; margin-top:5px; color:#ccc;">${spell.desc}</p>
            </details>
        `;
        container.appendChild(div);
    });
}

function removeSpell(index) {
    if(!confirm("Remove this spell from your memory?")) return;
    formsData[currentFormId].spells.splice(index, 1);
    renderSpells();
    saveAll();
}

// --- INVENTORY API LOGIC ---
let invSearchTimeout;

function searchInventory(query) {
    const type = document.getElementById('inv-search-type').value;
    const resultsBox = document.getElementById('inv-results');
    
    if(query.length < 3) {
        resultsBox.style.display = 'none';
        return;
    }

    clearTimeout(invSearchTimeout);
    invSearchTimeout = setTimeout(async () => {
        resultsBox.innerHTML = '<div style="padding:10px;">Forging request...</div>';
        resultsBox.style.display = 'block';

        try {
            // Open5e has different endpoints: /magicitems/, /weapons/, /armor/
            const response = await fetch(`https://api.open5e.com/${type}/?search=${query}&limit=5`);
            const data = await response.json();
            
            resultsBox.innerHTML = '';
            if(data.results.length === 0) {
                resultsBox.innerHTML = '<div style="padding:10px;">No items found.</div>';
            }

            data.results.forEach(item => {
                const div = document.createElement('div');
                div.className = 'result-item';
                // Display formatting based on type
                let subtitle = item.type || item.category || "Item";
                div.innerHTML = `<span>${item.name}</span> <span style="font-size:0.8rem; color:#aaa;">${subtitle}</span>`;
                div.onclick = () => addItemToInventory(item, type);
                resultsBox.appendChild(div);
            });

        } catch (e) {
            console.error(e);
            resultsBox.innerHTML = '<div style="padding:10px; color:red;">API Error.</div>';
        }
    }, 500);
}

function addItemToInventory(itemData, type) {
    const form = formsData[currentFormId];
    if(!form.inventory) form.inventory = [];

    // Normalize Data (APIs have different field names)
    const cleanItem = {
        name: itemData.name,
        type: type,
        desc: itemData.desc || itemData.description || "No description.",
        // Weapons have damage, Armor has ac_string, Magic Items have rarity
        damage: itemData.damage_dice ? `${itemData.damage_dice} ${itemData.damage_type}` : null,
        ac: itemData.ac_string || null,
        rarity: itemData.rarity || null,
        properties: itemData.properties ? itemData.properties.join(', ') : null
    };

    form.inventory.push(cleanItem);

    document.getElementById('inv-results').style.display = 'none';
    document.getElementById('inv-search').value = '';
    renderInventory();
    saveAll();
}

function renderInventory() {
    const container = document.getElementById('inventory-list');
    const form = formsData[currentFormId];
    container.innerHTML = '';

    if(!form.inventory || form.inventory.length === 0) {
        return; 
    }

    form.inventory.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'item-card';
        
        // Build the stats line dynamically
        let statsHTML = '';
        if(item.damage) statsHTML += `<span style="color:#ff5252">⚔ ${item.damage}</span>`;
        if(item.ac) statsHTML += `<span style="color:#448aff">🛡 ${item.ac}</span>`;
        if(item.rarity) statsHTML += `<span style="color:#e040fb">✨ ${item.rarity}</span>`;

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="this.nextElementSibling.open = !this.nextElementSibling.open">
                <strong>${item.name}</strong>
                <button class="btn btn-danger" style="padding:2px 6px; font-size:0.6rem;" onclick="event.stopPropagation(); removeItem(${index})">X</button>
            </div>
            <details>
                <summary class="item-meta">${item.type}</summary>
                <div class="item-stats">${statsHTML}</div>
                <p style="font-size:0.9rem; white-space:pre-wrap; margin-top:5px; color:#ccc;">${item.desc}</p>
            </details>
        `;
        container.appendChild(div);
    });
}

function removeItem(index) {
    if(!confirm("Discard this item?")) return;
    formsData[currentFormId].inventory.splice(index, 1);
    renderInventory();
    saveAll();
}

// --- DATA EXPORT / IMPORT (SOUL LINK) ---
function exportData() {
    const dataStr = localStorage.getItem('dnd_meta_v5');
    if(!dataStr) { alert("No data to save!"); return; }
    
    const blob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `character_${globalData.name || 'unnamed'}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function importData(input) {
    const file = input.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const json = JSON.parse(e.target.result);
            // Basic validation
            if(!json.forms || !json.global) throw new Error("Invalid Character File");
            
            localStorage.setItem('dnd_meta_v5', JSON.stringify(json));
            location.reload(); // Reload to apply changes
        } catch(err) {
            alert("Error loading file: " + err.message);
        }
    };
    reader.readAsText(file);
}