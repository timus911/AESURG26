
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PARSED_CHAT_PATH = path.join(__dirname, 'src/data/parsed_chat.json');
const NOTES_PATH = path.join(__dirname, 'src/data/notes.json');
const IMAGES_DIR = path.join(__dirname, 'src/assets/images/conference');

const DATE_TO_DAY = {
    "23/01/26": "Day 1",
    "24/01/26": "Day 2",
    "25/01/26": "Day 3",
    "26/01/26": "Day 4"
};

function reconstructNotes() {
    const chatMessages = JSON.parse(fs.readFileSync(PARSED_CHAT_PATH, 'utf8'));
    const currentNotes = JSON.parse(fs.readFileSync(NOTES_PATH, 'utf8'));

    // Get all available images in the folder to assign "orphaned" images later if needed
    // But for now, we rely on the specific mentions in the notes + the chat log flow.

    const expandedNotes = [];

    currentNotes.forEach((note, noteIdx) => {
        let noteBlocks = [];
        let noteGallery = [];

        // 1. Process Manual Segments (Primary Source of Truth)
        if (note.segments) {
            note.segments.forEach(seg => {
                if (seg.text) {
                    noteBlocks.push({ type: 'text', content: seg.text });
                }
                if (seg.media) {
                    // Check if it's an image or video
                    const isVideo = seg.media.endsWith('.mp4');
                    const isFile = seg.media.endsWith('.pdf');
                    const type = isVideo ? 'video' : isFile ? 'file' : 'image';

                    // In the manual JSON, "text" is often a caption for the media below it, OR a standalone paragraph.
                    // The manual structure pairs text and media in one object sometimes.
                    if (seg.text && seg.media) {
                        // Convert previous text block to caption if it was just added?
                        // Or create a media_caption block directly.
                        // Let's remove the last text block if it matches seg.text (it was just added)
                        // and combine it.
                        noteBlocks.pop();
                        noteBlocks.push({
                            type: 'media_caption',
                            file: seg.media,
                            fileType: type,
                            caption: seg.text
                        });
                    } else {
                        // Standalone media in segments
                        noteBlocks.push({
                            type: 'media_caption',
                            file: seg.media,
                            fileType: type,
                            caption: null
                        });
                    }
                }
            });
        }

        // 2. Speaker Splitting Logic
        let finalNotesToAdd = [];
        const parenContentMatch = note.title.match(/\(([^)]+)\)/);
        let splitOccurred = false;

        if (parenContentMatch) {
            const insideParens = parenContentMatch[1];
            if (insideParens.includes("&") || insideParens.toLowerCase().includes(" and ")) {
                const names = insideParens.split(/&|and/).map(n => n.trim());
                if (names.length > 1) {
                    splitOccurred = true;
                    const mainTitle = note.title.replace(/\([^)]+\)/, "").trim();
                    names.forEach((name, idx) => {
                        finalNotesToAdd.push({
                            ...note,
                            id: `${note.id}-${idx}`,
                            day: DATE_TO_DAY[note.date] || "Unknown Day",
                            title: `${mainTitle} (${name})`,
                            speaker: name,
                            blocks: noteBlocks, // Shared content
                            gallery: noteGallery, // Shared gallery (currently empty, relies on blocks)
                            segments: undefined // Remove legacy
                        });
                    });
                }
            }
        }

        if (!splitOccurred) {
            let speaker = "";
            if (parenContentMatch) speaker = parenContentMatch[1];

            finalNotesToAdd.push({
                ...note,
                day: DATE_TO_DAY[note.date] || "Unknown Day",
                speaker: speaker,
                blocks: noteBlocks,
                gallery: noteGallery,
                segments: undefined
            });
        }

        // 3. Populate Gallery with leftover images in the "Gap" between notes?
        // The user complained about "bulk of images at the start".
        // And "no photo within text block" -> solved by using `blocks` derived from segments.

        // We aren't doing the "auto-assign all images" logic here because it was creating mess.
        // We stick to what is explicitly in the JSON + what we can infer.
        // BUT, the JSON `segments` already have the images mapped! 
        // So the images SHOULD appear in the blocks now.

        expandedNotes.push(...finalNotesToAdd);
    });

    fs.writeFileSync(NOTES_PATH, JSON.stringify(expandedNotes, null, 2));
    console.log("Notes reconstructed with explicit blocks derived from segments.");
}

reconstructNotes();
