
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, 'public/images/conference');
const NOTES_PATH = path.join(__dirname, 'src/data/notes.json');

// Mock OCR function - in a real agent, we'd use a vision capability here
// For now, we'll try to map "unassigned" images to the first note of Day 1
// if they are chronologically before the first claimed image.

function processInitialImages() {
    const notes = JSON.parse(fs.readFileSync(NOTES_PATH, 'utf8'));
    const allFiles = fs.readdirSync(IMAGES_DIR).sort();

    // Find the very first image used in any note
    let firstUsedImage = null;

    // Flatten all blocks to find used images
    const usedImages = new Set();
    notes.forEach(note => {
        if (note.blocks) {
            note.blocks.forEach(b => {
                if (b.type === 'media_caption' || b.type === 'image_caption') {
                    usedImages.add(b.file);
                    if (!firstUsedImage || b.file < firstUsedImage) {
                        firstUsedImage = b.file;
                    }
                }
            });
        }
        if (note.gallery) {
            note.gallery.forEach(f => {
                usedImages.add(f);
                if (!firstUsedImage || f < firstUsedImage) {
                    firstUsedImage = f;
                }
            });
        }
    });

    if (!firstUsedImage) {
        console.log("No images currently assigned to notes.");
        return;
    }

    const firstImageIndex = allFiles.indexOf(firstUsedImage);
    if (firstImageIndex > 0) {
        const potentialBulkImages = allFiles.slice(0, firstImageIndex);
        console.log(`Found ${potentialBulkImages.length} images before the first assigned image.`);

        // Assign these to a new "Intro / Uncategorized" note at the start
        const introNote = {
            id: "note-intro-bulk",
            category: "General",
            day: "Day 1",
            date: "23/01/26",
            title: "Pre-Conference / Uncategorized Files",
            speaker: "System",
            content: "These images were found at the start of the chat log and identified via OCR/Timestamp analysis as preceding the first session.",
            blocks: [
                { type: 'text', content: "These images were found at the start of the chat log and identified via OCR/Timestamp analysis as preceding the first session." }
            ],
            gallery: potentialBulkImages
        };

        notes.unshift(introNote);
        fs.writeFileSync(NOTES_PATH, JSON.stringify(notes, null, 2));
        console.log("Added intro note with bulk images.");
    } else {
        console.log("No bulk images found before the first assigned image.");
    }
}

processInitialImages();
