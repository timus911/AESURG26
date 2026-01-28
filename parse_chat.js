
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust path to where the chat file is located relative to this script
const CHAT_LOG_PATH = path.join(__dirname, '../Chat/WhatsApp Chat with Aesurge 2026 Mumbai.txt');
const OUTPUT_PATH = path.join(__dirname, 'src/data/parsed_chat.json');

function parseChat() {
    if (!fs.existsSync(CHAT_LOG_PATH)) {
        console.error(`Chat log not found at: ${CHAT_LOG_PATH}`);
        return;
    }

    const text = fs.readFileSync(CHAT_LOG_PATH, 'utf8');
    const lines = text.split('\n');

    // Regex for WhatsApp message start: dd/mm/yy, hh:mm am - Sender: 
    // Example: 23/01/26, 9:17 am - Dr. Sumit Singh Gautam: 
    const messageRegex = /^(\d{2}\/\d{2}\/\d{2}),\s(\d{1,2}:\d{2}\s?[ap]m)\s-\s([^:]+):\s?(.*)/i;

    const messages = [];
    let currentMessage = null;

    lines.forEach(line => {
        // Fix for hidden characters sometimes in WhatsApp exports
        const cleanLine = line.trim().replace(/[\u200E\u200F]/g, '');

        const match = cleanLine.match(messageRegex);

        if (match) {
            // Push previous message if exists
            if (currentMessage) {
                messages.push(currentMessage);
            }

            const [_, date, time, sender, content] = match;

            // Check for media
            let type = 'text';
            let filename = null;
            let textContent = content;

            // Media patterns
            if (content.includes('(file attached)')) {
                // Extract filename
                // Pattern: IMG-20260123-WA0015.jpg (file attached)
                const fileMatch = content.match(/(.+?)\s\(file attached\)/);
                if (fileMatch) {
                    filename = fileMatch[1];
                    // Determine type based on extension
                    if (filename.endsWith('.mp4')) type = 'video';
                    else if (filename.endsWith('.pdf')) type = 'file';
                    else type = 'image';

                    textContent = ''; // Media messages usually have filename as content, which we extracted
                }
            }

            currentMessage = {
                date,
                time,
                sender,
                type,
                filename,
                content: textContent
            };
        } else {
            // Continuation of previous message
            if (currentMessage) {
                if (currentMessage.content) {
                    currentMessage.content += '\n' + cleanLine;
                } else {
                    currentMessage.content = cleanLine;
                }
            }
        }
    });

    if (currentMessage) {
        messages.push(currentMessage);
    }

    // Filter out system messages if needed (e.g. "Messages and calls are end-to-end encrypted")
    const filteredMessages = messages.filter(m => !m.content.includes('end-to-end encrypted'));

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(filteredMessages, null, 2));
    console.log(`Parsed ${filteredMessages.length} messages.`);
}

parseChat();
