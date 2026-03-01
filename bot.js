// bot.js - WhatsApp PRO bot
const { default: makeWASocket, useSingleFileAuthState, fetchLatestBaileysVersion, makeInMemoryStore } = require('@whiskeysockets/baileys');
const P = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

// session file
const { state, saveState } = useSingleFileAuthState('./session/session.json');

// in-memory store for chats
const store = makeInMemoryStore({ logger: P() });

// Create WhatsApp socket
async function startBot() {
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        version
    });

    store.bind(sock.ev);

    sock.ev.on('creds.update', saveState);

    // Listen for messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (!messages || !messages[0].message) return;
        const msg = messages[0];
        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        console.log(`Message from ${from}: ${text}`);

        // Example: auto-reply Kiswahili / English
        let reply = '';
        if (/habari|hi|hello/i.test(text)) {
            reply = 'Habari! / Hello! \n1. Menu Kiswahili\n2. Menu English';
        } else if (/1/.test(text)) {
            reply = 'Hii ni menu kwa Kiswahili:\n- A: Habari za biashara\n- B: Maelezo ya bidhaa';
        } else if (/2/.test(text)) {
            reply = 'This is the English menu:\n- A: Business info\n- B: Product details';
        } else {
            reply = 'Samahani, sielewi. / Sorry, I do not understand.';
        }

        // Send reply
        await sock.sendMessage(from, { text: reply });

        // Example: auto-forward to mfanyabiashara (replace number with your WhatsApp number)
        const mfanyabiasharaNumber = '1234567890@s.whatsapp.net';
        if (from !== mfanyabiasharaNumber) {
            await sock.sendMessage(mfanyabiasharaNumber, { text: `Forwarded message from ${from}: ${text}` });
        }
    });

    console.log('Bot imeanza... Scan QR code if first time!');
}

startBot();
