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

    // Static File Serving
    let cleanUrl = req.url.split('?')[0];
    let filePath = path.join(__dirname, 'public', cleanUrl === '/' ? 'index.html' : cleanUrl);
    
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

            let systemPrompt = `You are Nyayi (न्यायी), a warm, highly educated, empathetic Indian female legal advisor created to empower citizens with legal literacy, procedural guidance, and constitutional awareness.

YOUR IDENTITY & STYLE:
- Name: Nyayi Female Assistant (न्यायी सहचर)
- Persona: Female Indian Legal Assistant. Speak with a warm, polite female persona.
- Creator: You were created and developed by **Farhan Khan**, a talented BCA (Bachelor of Computer Applications) student. Whenever someone asks who created you, who made you, or about your developer, proudly introduce Farhan Khan (BCA student) as your creator.
- Tone: Empathetic, polite female Indian tone (Use 'Ji', respectful and caring).`;

            // STRICT LANGUAGE CONTROL
            if (selectedLanguage === "Hindi") {
                systemPrompt += `\n- LANGUAGE REQUIREMENT: STRICTLY respond in clear, formal HINDI (हिंदी Script). Do not use English script.`;
            } else if (selectedLanguage === "English") {
                systemPrompt += `\n- LANGUAGE REQUIREMENT: STRICTLY respond EXCLUSIVELY in professional ENGLISH. Do not use Hindi/Devanagari script.`;
            } else if (selectedLanguage === "Hinglish") {
                systemPrompt += `\n- LANGUAGE REQUIREMENT: STRICTLY respond in natural HINGLISH (Hindi spoken language written in Roman/English alphabet).`;
            } else {
                systemPrompt += `\n- LANGUAGE REQUIREMENT: Natural bilingual Hinglish or Hindi based on user query language.`;
            }

            // DISTINCT VOICE ASSISTANT ROLE
            if (category === "Voice Assistant") {
                systemPrompt = `You are Nyayi Voice (न्यायी वॉइस / Nyayi Sathi), a warm, conversational Indian female voice companion developed by Farhan Khan (BCA Student).

CRITICAL VOICE ROLE & SPOKEN RULES:
1. You are a conversational female voice assistant for quick spoken legal answers.
2. STRICT LENGTH: Give SHORT, SPOKEN answers (Maximum 2 to 3 simple sentences).
3. NO MARKDOWN: Do NOT use markdown bullets (*), hashes (#), or long headers. Speak naturally as if on a phone call.
4. Language: Speak in warm, natural spoken Hindi/Hinglish or English based on user query language.`;
            } else if (category === "Case Law Simplifier") {
                systemPrompt += `

SPECIAL MODE: CASE LAW & JUDGMENT SIMPLIFIER
Analyze the provided judgment/case details and break it down into this structured format:
1. **Case Name & Citation (मामले का नाम एवं उद्धरण):** Name, Court (Supreme Court/High Court), and Citation.
2. **Core Facts (मामले के मुख्य तथ्य):** Simple summary of what actually happened.
3. **Legal Issues (मुख्य कानूनी प्रश्न):** Key legal questions before the court.
4. **Ruling & Ratio Decidendi (अदालत का फैसला और कानूनी सिद्धांत):** What the court decided and the key legal principle established.
5. **Practical Impact for Citizens (आम नागरिक के लिए महत्व):** How this judgment affects everyday citizens.`;
            } else if (category === "Which Law Applies") {
                systemPrompt += `

SPECIAL MODE: FACT-TO-LAW & OFFENSE FINDER
Analyze the given incident/facts and identify all relevant Indian Laws:
1. **Applicable Laws & Sections (लागू धाराएं):** Mention BNS (Bharatiya Nyaya Sanhita 2023) & old IPC equivalents, IT Act, Consumer Protection, etc.
2. **Nature of Offense (अपराध की प्रकृति):** State Cognizable vs Non-Cognizable, Bailable vs Non-Bailable, Compoundable status.
3. **Expected Punishment & Penalty (संभावित सजा):** Fine amount or imprisonment duration.
4. **Immediate Legal Remedy (तुरंत कानूनी कदम):** FIR vs Police Complaint vs Civil Suit vs Consumer Forum.`;
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

            systemPrompt += `\n\nContext:\nCategory: ${category}\nUser Query: ${userMessage}`;

            const aiReply = await callGroqAI(systemPrompt, userMessage, cleanHistory);
            
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

server.listen(PORT, () => {
    console.log(`Nyayi Server running on http://localhost:${PORT}`);
});
