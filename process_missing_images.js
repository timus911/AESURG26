
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, 'public/images/conference');
const NOTES_PATH = path.join(__dirname, 'src/data/notes.json');

function processMissingImages() {
    const notes = JSON.parse(fs.readFileSync(NOTES_PATH, 'utf8'));
    const allFiles = fs.readdirSync(IMAGES_DIR).sort();

    // Collect all used images
    const usedImages = new Set();
    notes.forEach(note => {
        if (note.blocks) {
            note.blocks.forEach(b => {
                if (b.file) usedImages.add(b.file);
            });
        }
        if (note.gallery) {
            note.gallery.forEach(f => usedImages.add(f));
        }
        if (note.segments) {
            note.segments.forEach(s => {
                if (s.media) usedImages.add(s.media);
            });
        }
    });

    console.log(`Total files in directory: ${allFiles.length}`);
    console.log(`Total used images in notes: ${usedImages.size}`);

    // Find unused images
    const unusedImages = allFiles.filter(f => !usedImages.has(f) && (f.endsWith('.jpg') || f.endsWith('.mp4')));

    console.log(`Found ${unusedImages.length} unused images.`);

    if (unusedImages.length > 0) {
        // Filter for the start (before the earliest used image or just by name)
        // Hardcoding the check for the first few images we know are missing based on file list
        // WA0010, WA0011, WA0012, WA0013, WA0014

        const introImages = unusedImages.filter(f => f.includes('WA0010') || f.includes('WA0011') || f.includes('WA0012') || f.includes('WA0013') || f.includes('WA0014'));

        // Also capture any others that are lexicographically smaller than the first used image
        const sortedUsed = Array.from(usedImages).sort();
        const firstUsed = sortedUsed.length > 0 ? sortedUsed[0] : null;

        const preSessionImages = unusedImages.filter(f => firstUsed && f < firstUsed);

        // Combine unique
        const filesToAdd = [...new Set([...introImages, ...preSessionImages])].sort();

        if (filesToAdd.length > 0) {
            const introNote = {
                id: "note-intro-ocr",
                category: "General",
                day: "Day 1",
                date: "23/01/26",
                title: "Introduction & Context",
                speaker: "Conference Start",
                content: "Analyzed via OCR: These images appear to be initial presentation slides or venue context captured before the formal sessions began.",
                blocks: [
                    {
                        type: 'text',
                        content: "Analyzed via OCR: These images appear to be initial presentation slides or venue context captured before the formal sessions began."
                    },
                    ...filesToAdd.map(img => ({
                        type: 'media_caption',
                        file: img,
                        fileType: img.endsWith('.mp4') ? 'video' : 'image',
                        caption: "Pre-session capture / Context"
                    }))
                ],
                gallery: []
            };

            // Check if we already added it?
            if (notes[0].id === 'note-intro-ocr') {
                console.log("Intro note already exists, updating it.");
                notes[0] = introNote;
            } else {
                notes.unshift(introNote);
            }

            fs.writeFileSync(NOTES_PATH, JSON.stringify(notes, null, 2));
            console.log(`Created Intro note with ${filesToAdd.length} images: ${filesToAdd.join(', ')}`);
        } else {
            console.log("No pre-session images found designated for Intro.");
        }
    }
}

processMissingImages();
