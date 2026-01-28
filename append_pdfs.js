
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NOTES_PATH = path.join(__dirname, 'src/data/notes.json');

const PDF_MAPPINGS = [
    {
        noteId: "note-1",
        file: "s00266-025-04661-x.pdf",
        caption: "Reference Article: V Plication Facelift"
    },
    {
        noteId: "note-22",
        file: "gox-11-e5499.pdf",
        caption: "Reference Article: Manzaneda Rib Reshaping"
    },
    {
        noteId: "note-13",
        file: "266_2024_Article_3901.pdf",
        caption: "Reference Article: Trick Tip Rhinoplasty"
    }
];

function appendPdfs() {
    let notes = JSON.parse(fs.readFileSync(NOTES_PATH, 'utf8'));

    PDF_MAPPINGS.forEach(mapping => {
        const note = notes.find(n => n.id === mapping.noteId);
        if (note) {
            if (!note.blocks) note.blocks = [];

            // Check if already exists to prevent duplicates
            if (!note.blocks.find(b => b.file === mapping.file)) {
                note.blocks.push({
                    type: "media_caption",
                    file: mapping.file,
                    caption: mapping.caption
                });
                console.log(`Added ${mapping.file} to ${note.title}`);
            } else {
                console.log(`Skipping ${mapping.file}, already in ${note.title}`);
            }
        } else {
            console.error(`Note ID ${mapping.noteId} not found!`);
        }
    });

    fs.writeFileSync(NOTES_PATH, JSON.stringify(notes, null, 2));
}

appendPdfs();
