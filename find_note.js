
import fs from 'fs';
const notes = JSON.parse(fs.readFileSync('src/data/notes.json', 'utf8'));
const term = "Manzaneda";
const found = notes.find(n => JSON.stringify(n).toLowerCase().includes(term.toLowerCase()) || JSON.stringify(n).toLowerCase().includes("manzenada"));
console.log(found ? found.id + ": " + found.title : "Not Found");
