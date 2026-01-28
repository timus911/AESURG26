
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NOTES_PATH = path.join(__dirname, 'src/data/notes.json');

// Synonym / Concept Dictionary
const TAG_DICTIONARY = {
    "Face": ["Facelift", "Rhytidectomy", "Aging", "Rejuvenation", "Sagginess", "Jowls", "Volume Loss", "SMAS", "Deep Plane", "Ligaments"],
    "Breast": ["Mammaplasty", "Augmentation", "Implants", "Mastopexy", "Reduction", "Cleavage", "Ptosis", "Silicone"],
    "Rhinoplasty": ["Nose Job", "Dorsum", "Tip", "Septum", "Breathing", "Profile", "Osteotomy", "Cartilage"],
    "Eyes": ["Blepharoplasty", "Eyelid", "Bags", "Tear Trough", "Crow's Feet", "Brow Lift", "Canthopis"],
    "Body": ["Liposuction", "Contouring", "Tummy Tuck", "Abdominoplasty", "Fat Grafting", "BBL"],
    "Genital": ["Labiaplasty", "Vaginoplasty", "Rejuvenation"],
    "Injectables": ["Botox", "Fillers", "Neuromodulators", "Hyaluronic Acid", "Volume"],
    "V-Lift": ["Threads", "Vector", "Suspension", "Paraskas", "Midface"],
    "Fat": ["Grafting", "Transfer", "Lipofilling", "Nano fat", "Stem cells", "Regenerative"],
    "Scar": ["Revision", "Healing", "Keloid", "Hypertrophic", "Laser"],
    "Deep Plane": ["Ligaments", "Release", "Composite", "Vertical"],
    "Threads": ["Suspension", "Barbed", "PDO", "PLLA", "Silhouette"],
    "Laser": ["Resurfacing", "CO2", "Pigmentation", "Texture"],
    "Filler": ["Volumizing", "Contour", "Restoration"]
};

function addTags() {
    let notes = JSON.parse(fs.readFileSync(NOTES_PATH, 'utf8'));

    notes = notes.map(note => {
        let tags = new Set();

        // 1. Add Category Synonyms
        if (TAG_DICTIONARY[note.category]) {
            TAG_DICTIONARY[note.category].forEach(t => tags.add(t));
        }

        // 2. Scan content for Keywords from Dictionary
        const fullText = (
            (note.title || "") + " " +
            (note.content || "") + " " +
            (note.blocks ? note.blocks.map(b => b.content || b.caption || "").join(" ") : "")
        ).toLowerCase();

        Object.keys(TAG_DICTIONARY).forEach(key => {
            // If the key itself is in text
            if (fullText.includes(key.toLowerCase())) {
                tags.add(key);
                TAG_DICTIONARY[key].forEach(t => tags.add(t));
            }
            // Check specific terms
            TAG_DICTIONARY[key].forEach(term => {
                if (fullText.includes(term.toLowerCase())) {
                    tags.add(term);
                    tags.add(key); // Add parent category too
                }
            });
        });

        // 3. Add Speaker Name parts
        if (note.speaker) {
            note.speaker.split(" ").forEach(n => {
                if (n.length > 2) tags.add(n);
            });
        }

        note.tags = Array.from(tags);
        return note;
    });

    fs.writeFileSync(NOTES_PATH, JSON.stringify(notes, null, 2));
    console.log(`Updated ${notes.length} notes with AI tags.`);
}

addTags();
