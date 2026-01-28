
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PARSED_CHAT_PATH = path.join(__dirname, 'src/data/parsed_chat.json');
const NOTES_PATH = path.join(__dirname, 'src/data/notes.json');

function alignImages() {
    const chat = JSON.parse(fs.readFileSync(PARSED_CHAT_PATH, 'utf8'));
    let notes = JSON.parse(fs.readFileSync(NOTES_PATH, 'utf8'));

    // 1. Clean up previous valid/invalid splits
    // Remove "Dr. Ghorbha", "Intro", "Facelift" notes to start fresh for this specific section
    notes = notes.filter(n => !["note-ghorba", "note-intro-ocr", "note-intro-extracted", "note-facelift-uncat"].includes(n.id));

    // 2. Find Key Anchors
    // User Rule: "V lift paraskas" is the split point.
    const vLiftStartIndex = chat.findIndex(m => m.content && m.content.toLowerCase().includes("v lift paraskas"));

    if (vLiftStartIndex === -1) {
        console.error("CRITICAL: Could not find 'V lift paraskas' anchor in chat.");
        return;
    }
    console.log(`Anchor 'V lift paraskas' found at index ${vLiftStartIndex}`);

    // 3. Define Standard Notes Mappings (Post-V-Lift)
    const mappings = [
        // Note: V-Lift is handled specially below
        { id: "note-2", keywords: ["AM Lift", "Ajay Mahajan"], date: "23/01/26" },
        { id: "note-3", keywords: ["Nora Nugent"], date: "23/01/26" },
        { id: "note-4", keywords: ["Sanjay Parashar"], date: "23/01/26" },
        { id: "note-5", keywords: ["Chiara Botti", "Electric"], date: "23/01/26" },
        { id: "note-6", keywords: ["Francisco Villegas", "Inverted"], date: "23/01/26" },
        { id: "note-7", keywords: ["Wolfgang Funk", "PRESTO"], date: "23/01/26" },
        { id: "note-8", keywords: ["TM Lin"], date: "23/01/26" },
        { id: "note-9", keywords: ["Chest Masculinization"], date: "23/01/26" },
        { id: "note-10", keywords: ["Avdoshenko"], date: "23/01/26" },
        { id: "note-11", keywords: ["Male to Female"], date: "23/01/26" },
        { id: "note-12", keywords: ["Cranial Bone"], date: "23/01/26" },
        { id: "note-13", keywords: ["Modified Nasal"], date: "23/01/26" },
        // Day 2
        { id: "note-17", keywords: ["Devinder Singh"], date: "24/01/26" },
        { id: "note-18", keywords: ["Osvaldo"], date: "24/01/26" },
        { id: "note-19", keywords: ["Nora Nugent", "Secondary"], date: "24/01/26" },
        { id: "note-20", keywords: ["Abeer"], date: "24/01/26" }
    ];

    const findMatch = (mapping) => {
        return chat.findIndex((msg, idx) => {
            if (!msg.content) return false;
            // Only look forward from V-Lift start to avoid false positives? 
            // Actually, global search is safer but let's filter by date if needed.
            if (mapping.date && msg.date !== mapping.date) return false;
            const text = msg.content.toLowerCase();
            return mapping.keywords.every(k => text.includes(k.toLowerCase()));
        });
    };

    // Build Anchor Map
    const anchorMap = {};
    anchorMap["note-facelift-uncat"] = 0;
    anchorMap["note-1"] = vLiftStartIndex; // V-Lift starts here

    mappings.forEach(m => {
        const idx = findMatch(m);
        if (idx !== -1) {
            anchorMap[m.id] = idx;
        }
    });

    // Create the "Facelift" note
    const faceliftNote = {
        id: "note-facelift-uncat",
        category: "General",
        title: "Facelift (Uncategorized)",
        day: "Day 1",
        date: "23/01/26",
        speaker: "",
        content: "Images captured before the V-Lift presentation.",
        blocks: [],
        gallery: []
    };
    notes.unshift(faceliftNote); // Put at top

    // Sort Mappings
    // Include note-facelift-uncat and note-1 in the sorted list to handle ranges
    const allIds = ["note-facelift-uncat", "note-1", ...mappings.map(m => m.id)];

    // Sort these IDs by their start index
    const sortedIds = allIds
        .filter(id => anchorMap[id] !== undefined)
        .sort((a, b) => anchorMap[a] - anchorMap[b]);

    // Process Ranges
    sortedIds.forEach((noteId, i) => {
        const noteIndex = notes.findIndex(n => n.id === noteId);
        if (noteIndex === -1) return;

        const note = notes[noteIndex];
        const startIndex = anchorMap[noteId];
        const nextId = sortedIds[i + 1];
        const endIndex = nextId ? anchorMap[nextId] : chat.length;

        const slice = chat.slice(startIndex, endIndex);
        const validImages = slice
            .filter(m => m.type === 'image' || m.type === 'video')
            .map(m => m.filename)
            .filter(f => f);
        const uniqueImages = [...new Set(validImages)];

        console.log(`Note ${note.title}: ${uniqueImages.length} images (${startIndex}-${endIndex})`);

        if (uniqueImages.length >= 0) {
            // Updated Blocks logic:
            // For V-Lift (note-1), we must be careful NOT to include block images that are NOT in uniqueImages.
            if (note.blocks) {
                note.blocks = note.blocks.filter(b => {
                    if (b.type === 'media_caption' || b.type === 'image_caption') {
                        return uniqueImages.includes(b.file);
                    }
                    return true;
                });
            }

            // Gallery
            const attachedFiles = new Set();
            if (note.blocks) {
                note.blocks.forEach(b => {
                    if (b.file) attachedFiles.add(b.file);
                });
            }
            const galleryFiles = uniqueImages.filter(f => !attachedFiles.has(f));
            note.gallery = galleryFiles;
        }
    });

    fs.writeFileSync(NOTES_PATH, JSON.stringify(notes, null, 2));
    console.log("Alignment Complete. Facelift/V-Lift split applied.");
}

alignImages();
