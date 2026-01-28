
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NOTES_PATH = path.join(__dirname, 'src/data/notes.json');
const IMAGES_DIR = path.join(__dirname, 'src/assets/images/conference');

// Map dates to Days
const DATE_TO_DAY = {
    "23/01/26": "Day 1",
    "24/01/26": "Day 2",
    "25/01/26": "Day 3",
    "26/01/26": "Day 4"
};

function processNotes() {
    console.log("Reading notes from:", NOTES_PATH);
    const rawNotes = JSON.parse(fs.readFileSync(NOTES_PATH, 'utf8'));
    const allFiles = fs.readdirSync(IMAGES_DIR).filter(f => !f.endsWith('.pdf')).sort();
    // Exclude PDFs from the "gallery" flow usually, unless they are treated as slides? 
    // The user said "photos", so let's stick to images/videos.

    console.log(`Found ${allFiles.length} media files.`);

    // 1. Determine the "start image" for each note
    const notesWithStart = rawNotes.map(note => {
        let startImage = null;
        if (note.segments) {
            const mediaFiles = note.segments
                .filter(s => s.media && !s.media.endsWith('.pdf'))
                .map(s => s.media);
            if (mediaFiles.length > 0) {
                mediaFiles.sort();
                startImage = mediaFiles[0];
            }
        }
        return { ...note, startImage };
    });

    // 2. Sort notes by start image
    // Notes without images are tricky. We'll leave them in mutually relative order.
    // If Note A has img1, Note B has no img, Note C has img2.
    // We'll trust the JSON order for now, but use images to define boundaries.

    // Actually, we must rely on the provided JSON order as primary, 
    // because some notes might be "Intro" or "Lunch" without photos.

    // 3. Assign Images
    const expandedNotes = [];

    for (let i = 0; i < notesWithStart.length; i++) {
        const currentNote = notesWithStart[i];
        let noteImages = [];

        // Logic: 
        // If THIS note has a start image, it claims everything from that image...
        // ...until the start image of the NEXT note that HAS a start image.

        if (currentNote.startImage) {
            const startIndex = allFiles.indexOf(currentNote.startImage);

            if (startIndex !== -1) {
                // Find the next note that HAS a start image
                let nextStartImage = null;
                for (let j = i + 1; j < notesWithStart.length; j++) {
                    if (notesWithStart[j].startImage) {
                        nextStartImage = notesWithStart[j].startImage;
                        break;
                    }
                }

                let endIndex = allFiles.length;
                if (nextStartImage) {
                    const nextIndex = allFiles.indexOf(nextStartImage);
                    if (nextIndex !== -1) {
                        endIndex = nextIndex;
                    }
                }

                // If this is the VERY FIRST note with an image, 
                // check if there are images BEFORE it that need to be included?
                // Maybe strict "startImage" is better to avoid garbage.
                // But user said "show all photos after one note".

                noteImages = allFiles.slice(startIndex, endIndex);
            }
        }

        // 4. Consolidate Content
        let combinedContent = "";
        if (currentNote.segments) {
            combinedContent = currentNote.segments.map(s => s.text).filter(t => t).join("\n\n");
        }

        // 5. Split Speakers
        // Example: "Male Facial Aesthetics (Lina Triana & Rukmini Rednam)"
        let finalNotesToAdd = [];

        // Check for " & " or " and " inside parens or distinct structure
        // We'll regex for `(Speaker A & Speaker B)` or similar
        const parenContentMatch = currentNote.title.match(/\(([^)]+)\)/);
        let splitOccurred = false;

        if (parenContentMatch) {
            const insideParens = parenContentMatch[1];
            if (insideParens.includes("&") || insideParens.toLowerCase().includes(" and ")) {
                const names = insideParens.split(/&|and/).map(n => n.trim());
                if (names.length > 1) {
                    splitOccurred = true;
                    const mainTitle = currentNote.title.replace(/\([^)]+\)/, "").trim();

                    names.forEach((name, idx) => {
                        finalNotesToAdd.push({
                            id: `${currentNote.id}-${idx}`,
                            category: currentNote.category,
                            date: currentNote.date,
                            day: DATE_TO_DAY[currentNote.date] || "Unknown Day",
                            // Speaker A gets the whole gallery? 
                            // "Make separate notes for 2 speakers. don't merge them."
                            // If they presented together, maybe they share the gallery.
                            gallery: noteImages,
                            content: combinedContent, // Duplicating content as we can't easily split text
                            title: `${mainTitle} (${name})`,
                            speaker: name
                        });
                    });
                }
            }
        }

        if (!splitOccurred) {
            // Try to extract speaker from parens if single
            let speaker = "";
            if (parenContentMatch) {
                speaker = parenContentMatch[1];
            }

            finalNotesToAdd.push({
                id: currentNote.id,
                category: currentNote.category,
                date: currentNote.date,
                day: DATE_TO_DAY[currentNote.date] || "Unknown Day",
                gallery: noteImages,
                content: combinedContent,
                title: currentNote.title,
                speaker: speaker
            });
        }

        expandedNotes.push(...finalNotesToAdd);
    }

    fs.writeFileSync(NOTES_PATH, JSON.stringify(expandedNotes, null, 2));
    console.log(`Processed ${rawNotes.length} notes into ${expandedNotes.length} notes.`);
}

processNotes();
