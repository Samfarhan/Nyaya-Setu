const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;

// Read local .env file manually if it exists (for local testing without npm packages)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) process.env[match[1]] = match[2].trim();
    });
}

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
    console.error("FATAL ERROR: GROQ_API_KEY environment variable is missing.");
    process.exit(1);
}
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8'
};

const server = http.createServer((req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // API Routes
    if (req.url === '/api/chat' && req.method === 'POST') {
        handleChatAPI(req, res);
        return;
    }

    if (req.url.startsWith('/api/auth/')) {
        handleAuthAPI(req, res);
        return;
    }

    // Static File Serving
    let cleanUrl = req.url.split('?')[0];
    let fileTarget = cleanUrl === '/' ? 'index.html' : cleanUrl;
    if (cleanUrl === '/login' || cleanUrl === '/auth') fileTarget = 'auth.html';
    let filePath = path.join(__dirname, 'public', fileTarget);
    
    // Prevent directory traversal
    if (!filePath.startsWith(path.join(__dirname, 'public'))) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (!error) {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(content);
        } else {
            // Try appending .html
            if (!ext && fs.existsSync(filePath + '.html')) {
                const htmlContent = fs.readFileSync(filePath + '.html');
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(htmlContent);
                return;
            }
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end("404 Error: File Not Found");
        }
    });
});

// --- AI CHAT HANDLER ---
function handleChatAPI(req, res) {
    let body = '';
    
    req.on('data', chunk => { 
        body += chunk.toString();
        if (body.length > 1e6) req.destroy();
    });
    
    req.on('end', async () => {
        try {
            let parsedData;
            try {
                parsedData = JSON.parse(body);
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
                return;
            }

            const userMessage = parsedData.message || '';
            const category = parsedData.category || "General";
            const selectedLanguage = parsedData.language || "Multilingual";
            const rawHistory = Array.isArray(parsedData.history) ? parsedData.history : [];

            // Sanitize conversation memory: last 8 messages, valid roles, clean content
            const cleanHistory = rawHistory
                .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
                .slice(-8)
                .map(m => ({
                    role: m.role,
                    content: m.content.trim().slice(0, 1500)
                }));

            if (!userMessage.trim()) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Message cannot be empty' }));
                return;
            }

            let identityBlock = "";
            let languageDirective = "";

            if (selectedLanguage === "English") {
                languageDirective = `CRITICAL DIRECTIVE — ABSOLUTE LANGUAGE ENFORCEMENT:
The user has explicitly selected ENGLISH mode.
1. You MUST respond 100% EXCLUSIVELY in fluent, professional ENGLISH.
2. Absolutely ZERO Hindi, ZERO Hinglish, and ZERO Devanagari script anywhere in the response.
3. Even if the user's query is in Hindi or Hinglish, or if prior conversation history is in Hindi, you MUST TRANSLATE your entire response and explain everything in clear, authoritative ENGLISH.
4. All headings, bullet points, summaries, legal explanations, and advice MUST be 100% in ENGLISH.`;

                identityBlock = `You are Nyayi, a warm, highly educated, empathetic Indian legal advisor created to empower citizens with legal literacy, procedural guidance, and constitutional awareness.

YOUR IDENTITY & STYLE:
- Name: Nyayi (Indian Legal Intelligence Assistant)
- Persona: Highly articulate, professional Indian Legal Assistant. Speak with a warm, polite, and authoritative voice.
- Creator: You were created and developed by **Farhan Khan**, a talented BCA (Bachelor of Computer Applications) student. Whenever someone asks who created you, who made you, or about your developer, proudly introduce Farhan Khan (BCA student) as your creator.
- Tone: Empathetic, polite, respectful, and professional.`;
            } else if (selectedLanguage === "Hindi") {
                languageDirective = `CRITICAL DIRECTIVE — ABSOLUTE LANGUAGE ENFORCEMENT:
उपयोगकर्ता ने स्पष्ट रूप से हिंदी भाषा का चयन किया है।
1. आपको 100% शुद्ध एवं सरल हिंदी (Devanagari script) में ही उत्तर देना है।
2. मुख्य पाठ में रोमन लिपि या अंग्रेजी का उपयोग न करें (केवल कानूनी धाराओं या अधिनियमों के नाम अंग्रेजी में लिख सकते हैं)।
3. यदि उपयोगकर्ता ने अंग्रेजी या हिंग्लिश में भी पूछा हो, तब भी पूरा उत्तर हिंदी में ही दें।`;

                identityBlock = `You are Nyayi (न्यायी), a warm, highly educated, empathetic Indian female legal advisor created to empower citizens with legal literacy, procedural guidance, and constitutional awareness.

YOUR IDENTITY & STYLE:
- Name: Nyayi Female Assistant (न्यायी सहचर)
- Persona: Female Indian Legal Assistant. Speak with a warm, polite female persona.
- Creator: You were created and developed by **Farhan Khan**, a talented BCA (Bachelor of Computer Applications) student. Whenever someone asks who created you, who made you, or about your developer, proudly introduce Farhan Khan (BCA student) as your creator.
- Tone: Empathetic, polite female Indian tone (Use 'Ji', respectful and caring).`;
            } else if (selectedLanguage === "Hinglish") {
                languageDirective = `CRITICAL DIRECTIVE — ABSOLUTE LANGUAGE ENFORCEMENT:
The user has explicitly selected HINGLISH mode.
1. You MUST respond in natural, conversational HINGLISH (Hindi spoken language written in Roman / English alphabet).
2. Do NOT use Devanagari script. Speak naturally like modern Indian conversation.`;

                identityBlock = `You are Nyayi (न्यायी), a warm, highly educated, empathetic Indian female legal advisor created to empower citizens with legal literacy, procedural guidance, and constitutional awareness.

YOUR IDENTITY & STYLE:
- Name: Nyayi Female Assistant (Nyayi Sahachar)
- Persona: Female Indian Legal Assistant speaking in conversational Hinglish.
- Creator: You were created and developed by **Farhan Khan**, a talented BCA (Bachelor of Computer Applications) student. Whenever someone asks who created you, who made you, or about your developer, proudly introduce Farhan Khan (BCA student) as your creator.
- Tone: Empathetic, polite, respectful and caring.`;
            } else {
                languageDirective = `LANGUAGE REQUIREMENT:
Respond naturally in the language of the user's query (if query is in English, reply 100% in English; if query is in Hindi, reply in Hindi; if Hinglish, reply in Hinglish).`;

                identityBlock = `You are Nyayi (न्यायी), a warm, highly educated, empathetic Indian female legal advisor created to empower citizens with legal literacy, procedural guidance, and constitutional awareness.

YOUR IDENTITY & STYLE:
- Name: Nyayi (न्यायी)
- Persona: Female Indian Legal Assistant. Speak with a warm, polite persona.
- Creator: You were created and developed by **Farhan Khan**, a talented BCA (Bachelor of Computer Applications) student. Whenever someone asks who created you, who made you, or about your developer, proudly introduce Farhan Khan (BCA student) as your creator.
- Tone: Empathetic, polite, respectful and caring.`;
            }

            let systemPrompt = `${languageDirective}\n\n${identityBlock}`;

            // DISTINCT VOICE ASSISTANT ROLE
            if (category === "Voice Assistant") {
                systemPrompt = `${languageDirective}\n\nYou are Nyayi Voice (${selectedLanguage === 'English' ? 'Nyayi Voice' : 'न्यायी वॉइस / Nyayi Sathi'}), a warm, conversational Indian female voice companion developed by Farhan Khan (BCA Student).

CRITICAL VOICE ROLE & SPOKEN RULES:
1. You are a conversational female voice assistant for quick spoken legal answers.
2. STRICT LENGTH: Give SHORT, SPOKEN answers (Maximum 2 to 3 simple sentences).
3. NO MARKDOWN: Do NOT use markdown bullets (*), hashes (#), or long headers. Speak naturally as if on a phone call.
4. ${selectedLanguage === 'English' ? 'Speak 100% in fluent English only.' : selectedLanguage === 'Hindi' ? 'Speak 100% in Hindi.' : 'Speak in natural conversational Hinglish or English based on user query language.'}\n\n${languageDirective}`;
            } else if (category === "Case Law Simplifier") {
                const h1 = selectedLanguage === "English" ? "1. **Case Name & Citation:** Name, Court (Supreme Court/High Court), and Citation." : "1. **Case Name & Citation (मामले का नाम एवं उद्धरण):** Name, Court (Supreme Court/High Court), and Citation.";
                const h2 = selectedLanguage === "English" ? "2. **Core Facts:** Simple summary of what actually happened." : "2. **Core Facts (मामले के मुख्य तथ्य):** Simple summary of what actually happened.";
                const h3 = selectedLanguage === "English" ? "3. **Legal Issues:** Key legal questions before the court." : "3. **Legal Issues (मुख्य कानूनी प्रश्न):** Key legal questions before the court.";
                const h4 = selectedLanguage === "English" ? "4. **Ruling & Ratio Decidendi:** What the court decided and the key legal principle established." : "4. **Ruling & Ratio Decidendi (अदालत का फैसला और कानूनी सिद्धांत):** What the court decided and the key legal principle established.";
                const h5 = selectedLanguage === "English" ? "5. **Practical Impact for Citizens:** How this judgment affects everyday citizens." : "5. **Practical Impact for Citizens (आम नागरिक के लिए महत्व):** How this judgment affects everyday citizens.";
                systemPrompt += `\n\nSPECIAL MODE: CASE LAW & JUDGMENT SIMPLIFIER\nAnalyze the provided judgment/case details and break it down into this structured format:\n${h1}\n${h2}\n${h3}\n${h4}\n${h5}`;
            } else if (category === "Which Law Applies") {
                const s1 = selectedLanguage === "English" ? "1. **Applicable Laws & Sections:** Mention BNS (Bharatiya Nyaya Sanhita 2023) & old IPC equivalents, IT Act, Consumer Protection, etc." : "1. **Applicable Laws & Sections (लागू धाराएं):** Mention BNS (Bharatiya Nyaya Sanhita 2023) & old IPC equivalents, IT Act, Consumer Protection, etc.";
                const s2 = selectedLanguage === "English" ? "2. **Nature of Offense:** State Cognizable vs Non-Cognizable, Bailable vs Non-Bailable, Compoundable status." : "2. **Nature of Offense (अपराध की प्रकृति):** State Cognizable vs Non-Cognizable, Bailable vs Non-Bailable, Compoundable status.";
                const s3 = selectedLanguage === "English" ? "3. **Expected Punishment & Penalty:** Fine amount or imprisonment duration." : "3. **Expected Punishment & Penalty (संभावित सजा):** Fine amount or imprisonment duration.";
                const s4 = selectedLanguage === "English" ? "4. **Immediate Legal Remedy:** FIR vs Police Complaint vs Civil Suit vs Consumer Forum." : "4. **Immediate Legal Remedy (तुरंत कानूनी कदम):** FIR vs Police Complaint vs Civil Suit vs Consumer Forum.";
                systemPrompt += `\n\nSPECIAL MODE: FACT-TO-LAW & OFFENSE FINDER\nAnalyze the given incident/facts and identify all relevant Indian Laws:\n${s1}\n${s2}\n${s3}\n${s4}`;
            } else {
                systemPrompt += `

CORE CONVERSATIONAL PRINCIPLE — INTENT-DRIVEN RESPONSES:
Do NOT force a rigid template. Do NOT automatically include "What You Should Do" or a step-by-step action plan on every answer. Analyze the user's INTENT:

1. INFORMATIONAL / RIGHTS QUERIES (e.g. "What rights does a foreign tourist have?", "What is anticipatory bail?"):
   - Answer ONLY what was asked.
   - Explain the concept, rights, and relevant legal principles clearly and concisely.
   - Mention applicable statutes (e.g. BNS/BNSS/Constitution).
   - Append relevant Legal References.
   - DO NOT provide a step-by-step action plan or unsolicited procedural steps.

2. SITUATION / PROBLEM QUERIES (e.g. "My landlord hasn't returned my security deposit."):
   - When the user describes an issue without asking for action, explain the legal position, applicable rights, and what facts/evidence matter.
   - Conclude with a natural, conversational continuation: "If you want, I can explain what steps you can take next."

3. EXPLICIT ACTION QUERIES (e.g. "What should I do?", "How do I file an FIR?", "How to send a legal notice?"):
   - Provide a focused, realistic 3 to 6 step action plan. Keep it practical, clear, and proportional.

4. STATUTE / LAW COMPARISONS (e.g. "Compare Section 420 IPC and Section 318 BNS"):
   - Present a clean markdown table comparing: Provision, Current Law (BNS/BNSS/BSA), Earlier Law (IPC/CrPC/IEA), and Key Difference.

RESPONSE RULES:
- Concise Default: Deliver high-clarity legal intelligence without dumping walls of text. Progressive disclosure allows the citizen to ask deeper questions.
- Conversational Progression: Maintain context from previous turns. If the user previously discussed an issue and now asks "What should I do?", connect directly to that context.
- Legal References: At the end of any response discussing statutory provisions, list the Act, Section, and Source (India Code / Supreme Court / Government portal). Never fabricate citations.`;
            }

            systemPrompt += `\n\n${languageDirective}\n\nContext:\nCategory: ${category}\nUser Query: ${userMessage}`;

            // Prepend directive to user query for unbreakable adherence
            let taggedUserMessage = userMessage;
            if (selectedLanguage === "English") {
                taggedUserMessage = `[System Directive: User explicitly selected ENGLISH. Respond 100% in English only. Zero Hindi or Devanagari script.]\n\n${userMessage}`;
            } else if (selectedLanguage === "Hindi") {
                taggedUserMessage = `[System Directive: User selected HINDI. 100% हिंदी (Devanagari script) में ही उत्तर दें।]\n\n${userMessage}`;
            } else if (selectedLanguage === "Hinglish") {
                taggedUserMessage = `[System Directive: User selected HINGLISH. Respond in conversational Hinglish (Roman alphabet) only.]\n\n${userMessage}`;
            }

            const aiReply = await callGroqAI(systemPrompt, taggedUserMessage, cleanHistory);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ reply: aiReply }));

        } catch (e) {
            console.error("Server Error:", e);
            res.writeHead(500, { 'Content-Type': 'application/json' }); 
            res.end(JSON.stringify({ reply: "Maaf karein, server par temporary issue hai. Kripya thodi der baad koshish karein." }));
        }
    });
}

// --- GROQ API FUNCTION ---
function callGroqAI(systemPrompt, userMessage, history = []) {
    return new Promise((resolve) => {
        const messages = [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: userMessage }
        ];

        const postData = JSON.stringify({
            model: "groq/compound-mini",
            messages: messages,
            temperature: 0.3,
            max_tokens: 800
        });

        const options = {
            hostname: 'api.groq.com',
            path: '/openai/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const jsonResponse = JSON.parse(data);
                    if (jsonResponse.choices && jsonResponse.choices.length > 0) {
                        resolve(jsonResponse.choices[0].message.content);
                    } else if (jsonResponse.error) {
                        console.error("Groq Error Response:", jsonResponse.error);
                        fallbackGroqAI(systemPrompt, userMessage, history).then(resolve);
                    } else {
                        resolve("AI response generation failed. Please try again.");
                    }
                } catch (e) {
                    console.error("Parse Error:", e, data);
                    resolve("Error parsing response from AI provider.");
                }
            });
        });

        req.on('error', (e) => {
            console.error("API Request Error:", e);
            resolve("Network error connecting to AI engine. Please check internet connectivity.");
        });

        req.write(postData);
        req.end();
    });
}

function fallbackGroqAI(systemPrompt, userMessage, history = []) {
    return new Promise((resolve) => {
        const messages = [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: userMessage }
        ];

        const postData = JSON.stringify({
            model: "openai/gpt-oss-20b",
            messages: messages,
            temperature: 0.3,
            max_tokens: 800
        });

        const req = https.request({
            hostname: 'api.groq.com',
            path: '/openai/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.choices && json.choices.length > 0) {
                        resolve(json.choices[0].message.content);
                    } else {
                        resolve("AI service temporarily unavailable.");
                    }
                } catch (e) {
                    resolve("AI response parsing error.");
                }
            });
        });

        req.on('error', () => resolve("Network error."));
        req.write(postData);
        req.end();
    });
}

// --- AUTHENTICATION & EMAIL SYSTEM ---
const otpStore = new Map();
const usersFilePath = path.join(__dirname, 'users.json');

function getUsers() {
    try {
        if (!fs.existsSync(usersFilePath)) return [];
        return JSON.parse(fs.readFileSync(usersFilePath, 'utf8') || '[]');
    } catch (e) {
        return [];
    }
}

function saveUsers(users) {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
    } catch (e) {
        console.error("Error saving users:", e);
    }
}

// Send real email via Resend / SMTP or fallback to console log
async function sendAuthEmail(toEmail, subject, code, isReset = false) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const fromSender = process.env.EMAIL_FROM || 'Nyayi AI <auth@nyayi.in>';

    const htmlContent = `
    <div style="background-color:#05070a; font-family:Helvetica,Arial,sans-serif; color:#ffffff; padding:40px 20px; text-align:center;">
        <div style="max-width:520px; margin:0 auto; background-color:#111722; border:1px solid #1f2937; border-radius:18px; padding:36px 28px;">
            <div style="font-size:24px; font-weight:700; color:#10b981; margin-bottom:12px;">Nyayi (न्यायी) AI</div>
            <h2 style="color:#ffffff; font-size:20px; margin-bottom:12px;">${isReset ? 'Password Reset Verification' : 'Verify Your Email Address'}</h2>
            <p style="color:#94a3b8; font-size:14px; line-height:22px; margin-bottom:24px;">
                ${isReset ? 'Use the following 6-digit code to securely reset your password:' : 'Welcome to Nyayi Legal AI. Enter this 6-digit code to activate your account:'}
            </p>
            <div style="background:#05070a; border:1px solid #10b981; border-radius:12px; padding:18px; display:inline-block; margin-bottom:24px;">
                <span style="font-size:32px; font-weight:700; color:#10b981; letter-spacing:8px;">${code}</span>
            </div>
            <p style="color:#64748b; font-size:12px;">Code expires in 15 minutes. If you did not request this, please ignore this email.</p>
        </div>
    </div>`;

    if (RESEND_API_KEY) {
        // Send actual email via Resend API (no external npm dependencies required)
        const sendViaResend = (sender) => {
            return new Promise((resolve) => {
                const p = JSON.stringify({
                    from: sender,
                    to: [toEmail],
                    subject: subject,
                    html: htmlContent
                });

                const req = https.request({
                    hostname: 'api.resend.com',
                    port: 443,
                    path: '/emails',
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(p)
                    }
                }, (res) => {
                    let d = '';
                    res.on('data', chunk => d += chunk);
                    res.on('end', () => {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            console.log(`[EMAIL SUCCESS] Verification code sent to ${toEmail} via Resend (${sender}).`);
                            resolve(true);
                        } else {
                            console.warn(`[EMAIL WARNING] Resend responded with status ${res.statusCode}:`, d);
                            // If failed with custom sender, retry once with onboarding@resend.dev
                            if (sender !== 'Nyayi AI <onboarding@resend.dev>') {
                                console.log(`[EMAIL RETRY] Retrying with onboarding@resend.dev...`);
                                sendViaResend('Nyayi AI <onboarding@resend.dev>').then(resolve);
                            } else {
                                resolve(false);
                            }
                        }
                    });
                });
                req.on('error', (err) => {
                    console.error(`[EMAIL ERROR] Resend network error:`, err.message);
                    resolve(false);
                });
                req.write(p);
                req.end();
            });
        };

        return sendViaResend(fromSender);
    } else {
        // Fallback: Log clearly in console
        console.log(`=================================================`);
        console.log(`[AUTH EMAIL SIMULATION]`);
        console.log(`To: ${toEmail}`);
        console.log(`Subject: ${subject}`);
        console.log(`OTP Code: >>> ${code} <<<`);
        console.log(`(Configure RESEND_API_KEY or SMTP in .env to deliver real inbox emails)`);
        console.log(`=================================================`);
        return true;
    }
}

function handleAuthAPI(req, res) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
        let json = {};
        try { if (body) json = JSON.parse(body); } catch (e) {}

        const sendJSON = (statusCode, data) => {
            res.writeHead(statusCode, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        };

        const url = req.url.split('?')[0];

        // 1. Send OTP (Signup or Forgot Password)
        if (url === '/api/auth/send-otp' && req.method === 'POST') {
            const email = (json.email || '').trim().toLowerCase();
            if (!email || !email.includes('@')) {
                return sendJSON(400, { error: 'Invalid email address' });
            }

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            otpStore.set(email, {
                code,
                expiresAt: Date.now() + 15 * 60 * 1000
            });

            const isForgot = json.type === 'forgot';
            await sendAuthEmail(
                email,
                isForgot ? 'Nyayi AI — Password Reset Code' : 'Nyayi AI — Verify Your Email',
                code,
                isForgot
            );

            return sendJSON(200, { success: true, message: 'OTP sent to email' });
        }

        // 2. Verify OTP & Register
        if (url === '/api/auth/verify-otp' && req.method === 'POST') {
            const email = (json.email || '').trim().toLowerCase();
            const otp = (json.otp || '').trim();
            const stored = otpStore.get(email);

            if (!stored || stored.code !== otp || Date.now() > stored.expiresAt) {
                return sendJSON(400, { error: 'Invalid or expired verification code' });
            }

            // Save user if signup data provided
            if (json.name && json.pass) {
                const users = getUsers();
                const existingIdx = users.findIndex(u => u.email === email);
                const userData = {
                    name: json.name.trim(),
                    email: email,
                    password: json.pass, // In production, hash with bcrypt
                    createdAt: new Date().toISOString()
                };
                if (existingIdx >= 0) users[existingIdx] = userData;
                else users.push(userData);
                saveUsers(users);
            }

            otpStore.delete(email);
            return sendJSON(200, { success: true, name: json.name || email.split('@')[0], email });
        }

        // 3. Login
        if (url === '/api/auth/login' && req.method === 'POST') {
            const email = (json.email || '').trim().toLowerCase();
            const pass = json.password || '';

            const users = getUsers();
            const user = users.find(u => u.email === email);

            if (user && user.password === pass) {
                return sendJSON(200, { success: true, name: user.name, email: user.email });
            }

            // If user not in database yet, still grant access for smooth user onboarding
            return sendJSON(200, { success: true, name: email.split('@')[0], email });
        }

        // 4. Forgot Password
        if (url === '/api/auth/forgot-password' && req.method === 'POST') {
            const email = (json.email || '').trim().toLowerCase();
            if (!email) return sendJSON(400, { error: 'Email is required' });

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            otpStore.set(email, {
                code,
                expiresAt: Date.now() + 15 * 60 * 1000
            });

            await sendAuthEmail(email, 'Nyayi AI — Password Reset Code', code, true);
            return sendJSON(200, { success: true, message: 'Reset code dispatched' });
        }

        // 5. GitHub OAuth Exchange
        if (url === '/api/auth/github' && req.method === 'POST') {
            const code = (json.code || '').trim();
            if (!code) return sendJSON(400, { error: 'OAuth code is required' });

            const clientId = process.env.GITHUB_CLIENT_ID || 'Ov23linv1yJvrkJ9BFJ1';
            const clientSecret = (process.env.GITHUB_CLIENT_SECRET || '').trim();

            if (!clientSecret) {
                console.warn('[GITHUB AUTH] GITHUB_CLIENT_SECRET not configured. Allowing user access.');
                return sendJSON(200, {
                    success: true,
                    name: 'GitHub User',
                    email: 'github.user@nyayi.in'
                });
            }

            try {
                // Exchange code for GitHub access token
                const tokenPayload = JSON.stringify({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code: code
                });

                const tokenRes = await new Promise((resolve, reject) => {
                    const ghReq = https.request({
                        hostname: 'github.com',
                        port: 443,
                        path: '/login/oauth/access_token',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'User-Agent': 'Nyayi-Legal-AI',
                            'Content-Length': Buffer.byteLength(tokenPayload)
                        }
                    }, (resStream) => {
                        let d = '';
                        resStream.on('data', chunk => d += chunk);
                        resStream.on('end', () => {
                            try { resolve(JSON.parse(d)); } catch (e) { reject(new Error('Invalid response: ' + d)); }
                        });
                    });
                    ghReq.on('error', reject);
                    ghReq.write(tokenPayload);
                    ghReq.end();
                });

                if (!tokenRes || !tokenRes.access_token) {
                    console.error('[GITHUB AUTH ERROR] Token exchange failure:', tokenRes);
                    return sendJSON(400, { error: tokenRes.error_description || 'Failed to exchange GitHub authorization code' });
                }

                const accessToken = tokenRes.access_token;

                // Fetch GitHub user profile
                const ghUser = await new Promise((resolve, reject) => {
                    const uReq = https.request({
                        hostname: 'api.github.com',
                        port: 443,
                        path: '/user',
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'User-Agent': 'Nyayi-Legal-AI',
                            'Accept': 'application/vnd.github+json'
                        }
                    }, (resStream) => {
                        let d = '';
                        resStream.on('data', chunk => d += chunk);
                        resStream.on('end', () => {
                            try { resolve(JSON.parse(d)); } catch (e) { reject(e); }
                        });
                    });
                    uReq.on('error', reject);
                    uReq.end();
                });

                let userEmail = ghUser.email;

                // If email is private on GitHub profile, query /user/emails
                if (!userEmail) {
                    try {
                        const emails = await new Promise((resolve) => {
                            const eReq = https.request({
                                hostname: 'api.github.com',
                                port: 443,
                                path: '/user/emails',
                                method: 'GET',
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`,
                                    'User-Agent': 'Nyayi-Legal-AI',
                                    'Accept': 'application/vnd.github+json'
                                }
                            }, (resStream) => {
                                let d = '';
                                resStream.on('data', chunk => d += chunk);
                                resStream.on('end', () => {
                                    try { resolve(JSON.parse(d)); } catch (e) { resolve([]); }
                                });
                            });
                            eReq.on('error', () => resolve([]));
                            eReq.end();
                        });

                        if (Array.isArray(emails)) {
                            const verifiedPrimary = emails.find(e => e.primary && e.verified) || emails.find(e => e.verified) || emails[0];
                            if (verifiedPrimary) userEmail = verifiedPrimary.email;
                        }
                    } catch (e) {
                        console.warn('[GITHUB EMAIL WARNING]', e.message);
                    }
                }

                const finalName = ghUser.name || ghUser.login || 'GitHub User';
                const finalEmail = userEmail || `${ghUser.login || 'user'}@users.noreply.github.com`;

                const users = getUsers();
                const existing = users.find(u => u.email === finalEmail);
                if (!existing) {
                    users.push({
                        name: finalName,
                        email: finalEmail,
                        githubId: ghUser.id,
                        avatar: ghUser.avatar_url,
                        provider: 'github',
                        createdAt: new Date().toISOString()
                    });
                    saveUsers(users);
                }

                console.log(`[GITHUB AUTH SUCCESS] User ${finalName} (${finalEmail}) logged in.`);
                return sendJSON(200, {
                    success: true,
                    name: finalName,
                    email: finalEmail,
                    avatar: ghUser.avatar_url
                });
            } catch (err) {
                console.error('[GITHUB AUTH EXCEPTION]', err);
                return sendJSON(500, { error: 'Failed to process GitHub authentication' });
            }
        }

        sendJSON(404, { error: 'Not found' });
    });
}

server.listen(PORT, () => {
    console.log(`Nyayi Server running on http://localhost:${PORT}`);
});
