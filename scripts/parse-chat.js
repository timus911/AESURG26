
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHAT_FILE = path.join(__dirname, '../public/data/WhatsApp Chat with Aesurge 2026 Mumbai.txt');
const OUTPUT_FILE = path.join(__dirname, '../src/data/notes.json');

const CATEGORIES = {
    'Face': ['face', 'facelift', 'smas', 'deep plane', 'threads', 'neck', 'chin', 'temple', 'brow', 'lift', 'macs', 'midface', 'aging'],
    'Breast': ['breast', 'implant', 'mastopexy', 'reduction', 'augmentation', 'cleavage', 'nipple', 'imf', 'pec', 'gland', 'dual plane'],
    'Rhinoplasty': ['rhinoplasty', 'nose', 'rib', 'dorsal', 'tip', 'alar', 'septum', 'osteotomy'],
    'Eyes': ['bleph', 'eyelid', 'orbital', 'tear trough', 'canthopexy', 'canthoplasty', 'eye'],
    'Body': ['lipo', 'bbl', 'tummy', 'abdominoplasty', 'gluteal', 'fat', 'suction', 'waist'],
    'Genital': ['vaginoplasty', 'labia', 'hymen', 'vaginal'],
    'Injectables': ['filler', 'botox', 'toxin', 'profhilo', 'booster', 'juvederm', 'restylane'],
};

function determineCategory(text) {
    const lowerText = text.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORIES)) {
        if (keywords.some(k => lowerText.includes(k))) {
            return category;
        }
    }
    return 'Other';
}

function parseChat() {
    const content = fs.readFileSync(CHAT_FILE, 'utf-8');
    // Regex to match message start: 23/01/26, 9:17 am - Sender:
    const messageRegex = /^(\d{2}\/\d{2}\/\d{2}), (\d{1,2}:\d{2}\s?[ap]m) - ([^:]+): (.*)/;

    const lines = content.split('\n');
    const messages = [];

    let currentBuffer = [];

    // Clean parsing of lines
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        const match = line.match(messageRegex);
        if (match) {
            // New message
            const [_, date, time, sender, text] = match;

            // Fix for "file attached"
            let cleanText = text;
            let media = null;
            let mediaType = null;

            if (text.includes('(file attached)')) {
                const mediaMatch = text.match(/(IMG-[\w-]+\.jpg|VID-[\w-]+\.mp4|[\w-]+\.pdf)/);
                if (mediaMatch) {
                    media = mediaMatch[0];
                    cleanText = text.replace(mediaMatch[0], '').replace('(file attached)', '').trim();
                    if (media.endsWith('.mp4')) mediaType = 'video';
                    else if (media.endsWith('.jpg')) mediaType = 'image';
                    else mediaType = 'file';
                }
            }

            messages.push({
                id: messages.length + 1,
                date,
                time,
                sender,
                text: cleanText,
                media,
                mediaType,
                timestamp: new Date().getTime() // Placeholder, we rely on index mostly
            });
        } else {
            // Continuation of previous message
            if (messages.length > 0) {
                const lastMsg = messages[messages.length - 1];
                // Check if it's a system message or just text
                if (!line.match(/^\d{2}\/\d{2}\/\d{2}/)) {
                    lastMsg.text += '\n' + line;
                }
            }
        }
    }

    // Grouping logic:
    // Cluster messages if they are close in time (same minute or within 5 mins) OR if the same sender continues speaking.
    // We will create "Notes" which contain multiple "Segments".

    const notes = [];
    let currentNote = null;

    messages.forEach((msg, index) => {
        // Skip system messages "You created group", etc.
        if (!msg.sender) return;

        // Heuristic: Start new note if:
        // 1. First message
        // 2. Sender changes (maybe?) - actually Dr Sumit is the main one.
        // 3. Time gap > 10 minutes
        // 4. Specific keywords that look like titles (e.g. All caps line, or "Dr. Name")

        // Let's implement Time Gap logic primarily
        // We treat the "time" string simply for now.

        // Better heuristic: Just look for Speaker change or "Title" like entries.
        // For now, let's just dump loosely.

        // Let's try to detect "Headings" - often Dr Sumit types a name "Dr. X"
        const isPotentialTitle = msg.text.length < 50 && /^[A-Z][a-zA-Z\s\.]*$/.test(msg.text) && !msg.media;

        // Calculate category
        const category = determineCategory(msg.text);

        if (!currentNote || isPotentialTitle || (category !== 'Other' && currentNote.category === 'Other')) {
            // Start new note
            if (currentNote && currentNote.segments.length > 0) {
                notes.push(currentNote);
            }

            currentNote = {
                id: `note-${notes.length}`,
                category: category,
                title: isPotentialTitle ? msg.text : `Note from ${msg.date}`,
                segments: []
            };
        }

        // Improve category if we find a better one in the flow
        if (currentNote.category === 'Other' && category !== 'Other') {
            currentNote.category = category;
        }

        currentNote.segments.push({
            text: msg.text,
            media: msg.media,
            mediaType: msg.mediaType,
            sender: msg.sender,
            time: msg.time
        });
    });

    if (currentNote && currentNote.segments.length > 0) {
        notes.push(currentNote);
    }

    // Post-process: Merge small notes if they seem related? 
    // For now, raw output is safer.

    // Ensure output dir exists
    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(notes, null, 2));
    console.log(`Parsed ${messages.length} messages into ${notes.length} notes.`);
}

parseChat();
