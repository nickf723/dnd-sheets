// src/ui.js
import { Store, state } from './store.js';

export const UI = {
    
    init() {
        // Set up initial listeners or static UI elements if needed
    },

    updateAll() {
        const form = Store.getActiveForm();
        const global = state.global;

        // 1. Global Header
        setValue('global-name', global.name);
        setHTML('global-inventory', global.inventory);
        setValue('currency-gp', global.gp);
        setValue('currency-sp', global.sp);
        setValue('currency-cp', global.cp);

        // 2. Form Specifics
        setText('class-badge', form.name);
        setHTML('saves', form.saves);
        setHTML('features', form.features);
        
        // 3. Combat Numbers
        setValue('hp-curr', form.hpCurr);
        setValue('hp-max', form.hpMax);
        setValue('ac', form.ac);
        setValue('init', form.init);
        setValue('spd', form.spd);
        
        // 4. Form Selector
        renderFormSelector();

        // 5. Complex Renders
        renderStats(form.stats);
        renderHPBar(form.hpCurr, form.hpMax);
        renderResources(form.resources);
        renderDeathSaves(form.deathSaves);
        renderSpells(form.spells);
        renderInventory(form.inventory);
    }
};

// --- HELPER FUNCTIONS ---
function setValue(id, val) { 
    const el = document.getElementById(id);
    if(el) el.value = val || ""; 
}
function setHTML(id, val) { 
    const el = document.getElementById(id);
    if(el) el.innerHTML = val || ""; 
}
function setText(id, val) { 
    const el = document.getElementById(id);
    if(el) el.innerText = val || ""; 
}

function renderFormSelector() {
    const select = document.getElementById('form-selector');
    select.innerHTML = '';
    Object.keys(state.forms).forEach(key => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.text = state.forms[key].name;
        if(key === state.activeFormId) opt.selected = true;
        select.appendChild(opt);
    });
}

function renderStats(stats) {
    if(!stats) return;
    stats.forEach((val, i) => {
        const el = document.getElementById(`score-${i}`);
        if(el) el.value = val;
        const mod = Math.floor((val - 10) / 2);
        const modEl = document.getElementById(`mod-${i}`);
        if(modEl) modEl.innerText = (mod >= 0 ? "+" : "") + mod;
    });
}

function renderHPBar(curr, max) {
    const pct = Math.max(0, Math.min(100, (curr / max) * 100));
    const bar = document.getElementById('hp-bar');
    if(!bar) return;
    
    bar.style.width = pct + "%";
    bar.className = 'hp-fill';
    if (pct < 25) bar.classList.add('danger');
    else if (pct < 50) bar.classList.add('warning');
    
    const currText = document.getElementById('hp-display-curr');
    const maxText = document.getElementById('hp-display-max');
    if(currText) currText.innerText = curr;
    if(maxText) maxText.innerText = max;
}

function renderResources(resources) {
    const container = document.getElementById('resources-container');
    container.innerHTML = '';
    if(!resources) return;
    
    resources.forEach((res, idx) => {
        let bubbles = '';
        for(let i=0; i<res.total; i++) {
            const isFilled = (res.filled && res.filled[i]) ? 'filled' : '';
            // Note: We use data attributes to handle clicks in main.js
            bubbles += `<div class="bubble ${isFilled}" data-action="toggle-res" data-res="${idx}" data-bub="${i}"></div>`;
        }
        container.innerHTML += `
        <div class="resource-row">
            <input value="${res.name}" data-action="rename-res" data-res="${idx}" class="res-input" style="width:120px; background:transparent; border:none; color:#ccc;">
            <div class="bubbles">${bubbles}</div>
        </div>`;
    });
}

function renderDeathSaves(ds) {
    ds = ds || {};
    ['s', 'f'].forEach(type => {
        for(let i=1; i<=3; i++) {
            const el = document.getElementById(`ds-${type}${i}`);
            if(!el) return;
            el.className = 'ds-circle'; // reset
            if(ds[`${type}${i}`]) el.classList.add(type === 's' ? 'success' : 'fail');
            // Add data attributes for main.js logic
            el.dataset.action = "toggle-ds";
            el.dataset.type = type;
            el.dataset.idx = i;
        }
    });
}

function renderSpells(spells) {
    const container = document.getElementById('spellbook-container');
    container.innerHTML = '';
    if(!spells || spells.length === 0) {
        container.innerHTML = '<div style="color:#666; text-align:center; padding:20px">Grimoire Empty</div>';
        return;
    }
    // (Sort logic omitted for brevity, but goes here)
    spells.forEach((spell, idx) => {
        const div = document.createElement('div');
        div.className = 'spell-card';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <strong>${spell.name}</strong>
                <button class="btn btn-danger" data-action="del-spell" data-idx="${idx}" style="padding:0 5px; font-size:0.6rem;">X</button>
            </div>
            <div style="font-size:0.8rem; color:#aaa">${spell.level}</div>
        `;
        container.appendChild(div);
    });
}

function renderInventory(inv) {
    const container = document.getElementById('inventory-list');
    container.innerHTML = '';
    if(!inv || inv.length === 0) return;

    inv.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerHTML = `
             <div style="display:flex; justify-content:space-between;">
                <strong>${item.name}</strong>
                <button class="btn btn-danger" data-action="del-item" data-idx="${idx}" style="padding:0 5px; font-size:0.6rem;">X</button>
            </div>
            <div class="item-meta">${item.type}</div>
        `;
        container.appendChild(div);
    });
}