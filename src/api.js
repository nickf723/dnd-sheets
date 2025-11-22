// src/api.js

const BASE_URL = "https://api.open5e.com";

export const API = {
    async searchSpells(query) {
        if (query.length < 3) return [];
        try {
            const res = await fetch(`${BASE_URL}/spells/?search=${query}&limit=5`);
            const data = await res.json();
            return data.results;
        } catch (e) {
            console.error("Spell Fetch Error", e);
            return [];
        }
    },

    async searchItems(query, type) {
        if (query.length < 3) return [];
        // type = "magicitems", "weapons", or "armor"
        try {
            const res = await fetch(`${BASE_URL}/${type}/?search=${query}&limit=5`);
            const data = await res.json();
            return data.results;
        } catch (e) {
            console.error("Item Fetch Error", e);
            return [];
        }
    }
};