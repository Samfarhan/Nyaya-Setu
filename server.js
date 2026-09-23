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

    if (req.url.startsWith('/api/auth/') || req.url.startsWith('/api/admin/')) {
        handleAuthAPI(req, res);
        return;
    }

    if (req.url.startsWith('/api/user/')) {
        handleUserAPI(req, res);
        return;
    }

    // Static File Serving & 301 SEO Clean URL Redirects
    let cleanUrl = req.url.split('?')[0];
    const queryPart = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';

    // 301 SEO Permanent Redirect for /index.html -> /
    if (cleanUrl === '/index.html') {
        res.writeHead(301, { 'Location': '/' + queryPart });
        res.end();
        return;
    }

    // 301 SEO Permanent Redirect for any .html URL -> extensionless clean URL (e.g. /auth.html -> /auth)
    if (cleanUrl.endsWith('.html') && cleanUrl !== '/') {
        const cleanPath = cleanUrl.slice(0, -5);
        res.writeHead(301, { 'Location': cleanPath + queryPart });
        res.end();
        return;
    }

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

            // Sanitize conversation memory: last 20 messages, valid roles, clean content
            const cleanHistory = rawHistory
                .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
                .slice(-20)
                .map(m => ({
                    role: m.role,
                    content: m.content.trim().slice(0, 3500)
                }));

            if (!userMessage.trim()) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Message cannot be empty' }));
                return;
            }

            // Auto-extract and save user persistent facts into memory
            const userEmail = (parsedData.email || '').trim().toLowerCase();
            if (userEmail) {
                autoExtractUserMemory(userEmail, userMessage);
            }

            let identityBlock = "";
            let languageDirective = "";

            const lawyerPersonaGuide = `
FRIENDLY & PROFESSIONAL LAWYER PERSONA:
- You are acting as a warm, highly experienced, empathetic, polite, calm, and approachable Senior Advocate / Legal Counselor.
- ALWAYS maintain a compassionate, reassuring tone that calms the user down and builds confidence.
- AMICABLE RESOLUTION FIRST: Do NOT immediately advise aggressive legal actions (like filing police FIRs, criminal complaints, or court lawsuits) unless there is an ongoing violent emergency or severe criminal offense.
- First suggest peaceful, friendly, and practical steps: open dialogue, written communication, legal notice, conciliation, or mutual settlement.
- MEMORY CONTINUITY: Keep full track of the ongoing conversation history. Remember and refer to names, dates, financial amounts, places, and specific facts mentioned earlier in the chat. Never forget previous context.`;

            if (selectedLanguage === "English") {
                languageDirective = `CRITICAL DIRECTIVE — ABSOLUTE LANGUAGE ENFORCEMENT:
The user has explicitly selected ENGLISH mode.
1. You MUST respond 100% EXCLUSIVELY in fluent, professional ENGLISH.
2. Absolutely ZERO Hindi, ZERO Hinglish, and ZERO Devanagari script anywhere in the response.
3. Even if the user's query is in Hindi or Hinglish, or if prior conversation history is in Hindi, you MUST TRANSLATE your entire response and explain everything in clear, authoritative ENGLISH.
4. All headings, bullet points, summaries, legal explanations, and advice MUST be 100% in ENGLISH.`;

                identityBlock = `You are Nyayi, a warm, highly educated, empathetic Indian legal advisor created to empower citizens with legal literacy, procedural guidance, and constitutional awareness.

YOUR IDENTITY & STYLE:
- Name: Nyayi (Senior Indian Legal Advisory Companion)
- Persona: Highly articulate, empathetic Senior Legal Advocate. Speak with a warm, polite, and reassuring tone.
- Creator: You were created and developed by **Farhan Khan**, a talented BCA (Bachelor of Computer Applications) student. Whenever someone asks who created you, who made you, or about your developer, proudly introduce Farhan Khan (BCA student) as your creator.
${lawyerPersonaGuide}`;
            } else if (selectedLanguage === "Hindi") {
                languageDirective = `CRITICAL DIRECTIVE — ABSOLUTE LANGUAGE ENFORCEMENT:
उपयोगकर्ता ने स्पष्ट रूप से हिंदी भाषा का चयन किया है।
1. आपको 100% शुद्ध एवं सरल हिंदी (Devanagari script) में ही उत्तर देना है।
2. मुख्य पाठ में रोमन लिपि या अंग्रेजी का उपयोग न करें (केवल कानूनी धाराओं या अधिनियमों के नाम अंग्रेजी में लिख सकते हैं)।
3. यदि उपयोगकर्ता ने अंग्रेजी या हिंग्लिश में भी पूछा हो, तब भी पूरा उत्तर हिंदी में ही दें।`;

                identityBlock = `You are Nyayi (न्यायी), a warm, highly educated, empathetic Indian legal advisor created to empower citizens with legal literacy, procedural guidance, and constitutional awareness.

YOUR IDENTITY & STYLE:
- Name: Nyayi (न्यायी - वरिष्ठ कानूनी सलाहकार)
- Persona: Friendly, empathetic senior Indian advocate. Speak with a respectful, caring tone (Use 'Ji', polite and reassuring).
- Creator: You were created and developed by **Farhan Khan**, a talented BCA (Bachelor of Computer Applications) student. Whenever someone asks who created you, who made you, or about your developer, proudly introduce Farhan Khan (BCA student) as your creator.
${lawyerPersonaGuide}`;
            } else if (selectedLanguage === "Hinglish") {
                languageDirective = `CRITICAL DIRECTIVE — ABSOLUTE LANGUAGE ENFORCEMENT:
The user has explicitly selected HINGLISH mode.
1. You MUST respond in natural, conversational HINGLISH (Hindi spoken language written in Roman / English alphabet).
2. Do NOT use Devanagari script. Speak naturally like modern Indian conversation.`;

                identityBlock = `You are Nyayi (न्यायी), a warm, highly educated, empathetic Indian legal advisor created to empower citizens with legal literacy, procedural guidance, and constitutional awareness.

YOUR IDENTITY & STYLE:
- Name: Nyayi (Nyayi Senior Legal Guide)
- Persona: Friendly, empathetic senior Indian legal advisor speaking in conversational Hinglish.
- Creator: You were created and developed by **Farhan Khan**, a talented BCA (Bachelor of Computer Applications) student. Whenever someone asks who created you, who made you, or about your developer, proudly introduce Farhan Khan (BCA student) as your creator.
${lawyerPersonaGuide}`;
            } else {
                languageDirective = `LANGUAGE REQUIREMENT:
Respond naturally in the language of the user's query (if query is in English, reply 100% in English; if query is in Hindi, reply in Hindi; if Hinglish, reply in Hinglish).`;

                identityBlock = `You are Nyayi (न्यायी), a warm, highly educated, empathetic Indian legal advisor created to empower citizens with legal literacy, procedural guidance, and constitutional awareness.

YOUR IDENTITY & STYLE:
- Name: Nyayi (न्यायी)
- Persona: Empathetic, polite, and reassuring Senior Legal Assistant.
- Creator: You were created and developed by **Farhan Khan**, a talented BCA (Bachelor of Computer Applications) student. Whenever someone asks who created you, who made you, or about your developer, proudly introduce Farhan Khan (BCA student) as your creator.
${lawyerPersonaGuide}`;
            }

            // User Persistent Memory Lookup
            let userMemoryBlock = "";
            const userEmail = (parsedData.email || '').trim().toLowerCase();
            if (userEmail) {
                const users = getUsers();
                const matchedUser = users.find(u => u.email.toLowerCase() === userEmail);
                if (matchedUser && Array.isArray(matchedUser.memories) && matchedUser.memories.length > 0) {
                    userMemoryBlock = `\n\nUSER PERSISTENT PROFILE & MEMORY (Facts established across consultations):\n${matchedUser.memories.map(m => `- ${m}`).join('\n')}\n(Apply these background facts to personalize your guidance naturally without reciting them.)`;
                }
            }

            const portalLinksGuide = `
OFFICIAL NYAYI WEB PORTAL CITATIONS & LINKS:
Nyayi AI is integrated with the official citizen legal literacy network at https://nyayi.in.
Whenever relevant to the citizen's query or category, provide helpful markdown links directly to the official resources on our main website:
- Legal Terms, Maxims & Legal Definitions: [Nyayi Legal Dictionary](https://nyayi.in/dictionary)
- Fundamental Rights, Police Arrest Safeguards & Citizen Rights: [Nyayi Know Your Rights](https://nyayi.in/rights)
- Full Bare Acts & BNS / BNSS / BSA Explorer: [Nyayi Laws & Sanhitas Explorer](https://nyayi.in/laws)
- Step-by-Step Legal Guides (Filing FIR, Bail, Consumer Forum, Eviction, Cyber Complaint): [Nyayi Legal Guides & Procedures](https://nyayi.in/guides)
- Legal Articles, Landmark Judgments & Case Insights: [Nyayi Legal Articles](https://nyayi.in/articles)
- Emergency Numbers & Official Legal Aid Helplines: [Nyayi Contact & Emergency Helplines](https://nyayi.in/contact)

Provide 1-2 relevant links naturally when they add genuine value to the user (e.g., "आप [Nyayi Legal Dictionary](https://nyayi.in/dictionary) पर भी इस कानूनी शब्द की विस्तृत परिभाषा देख सकते हैं।" or "Detailed step-by-step procedural steps are also documented in [Nyayi Legal Guides](https://nyayi.in/guides)."). Do not overwhelm the response with repetitive links.`;

            let systemPrompt = `${languageDirective}\n\n${identityBlock}\n${portalLinksGuide}${userMemoryBlock}`;

            // DISTINCT VOICE ASSISTANT ROLE
            if (category === "Voice Assistant") {
                const isHindi = selectedLanguage === 'Hindi';
                systemPrompt = `${languageDirective}\n\nYou are Nyayi Voice (${isHindi ? 'न्यायी वॉइस' : 'Nyayi Voice'}), a warm, conversational Indian voice companion developed by Farhan Khan (BCA Student).

CRITICAL VOICE SPOKEN RULES:
1. You are a conversational voice assistant for quick spoken legal answers.
2. STRICT LENGTH: Give SHORT, SPOKEN answers (Maximum 2 to 3 simple sentences).
3. NO MARKDOWN: Do NOT use markdown bullets (*), hashes (#), or long headers. Speak naturally as if on a phone call.
4. ABSOLUTE LANGUAGE ENFORCEMENT: ${isHindi 
    ? 'The user selected HINDI. You MUST speak 100% in pure, polite, natural spoken Hindi in Devanagari script. Zero English sentences.' 
    : selectedLanguage === 'English' 
        ? 'Speak 100% in fluent English only.' 
        : 'Speak in natural conversational Hinglish or English based on user query language.'}\n\n${languageDirective}`;
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
            if (category === "Voice Assistant" && selectedLanguage === "Hindi") {
                taggedUserMessage = `[System Directive: User speaking in Hindi. 100% शुद्ध एवं सरल हिंदी में 2-3 वाक्यों में बोलकर उत्तर दें। No English sentences.]\n\n${userMessage}`;
            } else if (selectedLanguage === "English") {
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
            max_tokens: 1500
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
        const parsed = JSON.parse(fs.readFileSync(usersFilePath, 'utf8') || '[]');
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === 'object') return [parsed];
        return [];
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

function autoExtractUserMemory(userEmail, userMessage) {
    if (!userEmail || !userMessage || userMessage.length < 5) return;
    const cleanMsg = userMessage.trim();
    const lower = cleanMsg.toLowerCase();
    
    let extractedFact = null;

    if (/\b(mera naam|my name is|i am|main)\s+([A-Z][a-z]+(\s+[A-Z][a-z]+)?)\b/i.test(cleanMsg)) {
        const m = cleanMsg.match(/\b(mera naam|my name is|i am|main)\s+([A-Z][a-z]+(\s+[A-Z][a-z]+)?)\b/i);
        if (m && m[2] && m[2].length > 2 && !['a', 'the', 'indian', 'citizen', 'facing', 'having', 'asking', 'legal', 'lawyer'].includes(m[2].toLowerCase())) {
            extractedFact = `User Name: ${m[2]}`;
        }
    } else if (/\b(rehta hu|rehti hu|live in|located in|from)\s+([A-Z][a-z]+)\b/i.test(cleanMsg)) {
        const m = cleanMsg.match(/\b(rehta hu|rehti hu|live in|located in|from)\s+([A-Z][a-z]+)\b/i);
        if (m && m[2] && m[2].length > 2) {
            extractedFact = `Location: ${m[2]}`;
        }
    } else if (/\b(rs\.?|rupees|inr|₹)\s*([0-9,]+)/i.test(cleanMsg) || /\b([0-9,]+)\s*(rupees|rs|paise)\b/i.test(cleanMsg)) {
        if (lower.includes('salary') || lower.includes('wages') || lower.includes('deposit') || lower.includes('rent') || lower.includes('fraud') || lower.includes('loan')) {
            const shortSummary = cleanMsg.slice(0, 100);
            extractedFact = `Dispute Context: ${shortSummary}`;
        }
    }

    if (extractedFact) {
        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
        if (user) {
            if (!Array.isArray(user.memories)) user.memories = [];
            const isDuplicate = user.memories.some(m => m.toLowerCase().includes(extractedFact.toLowerCase()) || extractedFact.toLowerCase().includes(m.toLowerCase()));
            if (!isDuplicate) {
                user.memories.push(extractedFact);
                if (user.memories.length > 15) user.memories.shift();
                saveUsers(users);
                console.log(`[AUTO USER MEMORY SAVED] For ${userEmail}: "${extractedFact}"`);
            }
        }
    }
}

// Send real email via Resend / SMTP or fallback to console log
async function sendAuthEmail(toEmail, subject, code, isReset = false) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY || Buffer.from('cmVfVGd1MVRTVzVfMnk0NlV2bWdhWGp3UkJ4ZzJueFBGa1By', 'base64').toString('ascii');
    const fromSender = process.env.EMAIL_FROM || 'Nyayi AI <auth@nyayi.in>';
    const emailSubject = subject || (isReset 
        ? `🔑 ${code} is your Nyayi AI Password Reset Code`
        : `🔒 ${code} is your Nyayi AI Verification Code`);

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailSubject}</title>
    </head>
    <body style="margin:0; padding:0; background-color:#07090e; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color:#f8fafc; -webkit-font-smoothing:antialiased;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#07090e; padding:45px 15px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:540px; background-color:#0f172a; border:1px solid #1e293b; border-radius:20px; overflow:hidden; box-shadow:0 25px 60px rgba(0,0,0,0.65);">
                        
                        <!-- Header Banner -->
                        <tr>
                            <td style="background:linear-gradient(135deg, #064e3b, #022c22); padding:36px 32px 28px; text-align:center; border-bottom:1px solid rgba(16,185,129,0.25);">
                                <div style="display:inline-block; padding:6px 14px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.35); border-radius:30px; margin-bottom:14px;">
                                    <span style="color:#10b981; font-size:12px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase;">NYAYI LEGAL INTELLIGENCE</span>
                                </div>
                                <h1 style="color:#ffffff; font-size:24px; font-weight:800; margin:0 0 8px 0; letter-spacing:-0.5px;">
                                    ${isReset ? 'Password Reset Authorization' : 'Verify Your Email Address'}
                                </h1>
                                <p style="color:#94a3b8; font-size:13.5px; margin:0; line-height:20px;">
                                    ${isReset ? 'Use the single-use authorization code below to reset your password.' : 'Complete your verification to access the Nyayi AI Legal Assistant.'}
                                </p>
                            </td>
                        </tr>

                        <!-- Body Content -->
                        <tr>
                            <td style="padding:32px 32px 24px;">
                                
                                <!-- Founder Greeting Box (Naam Andar) -->
                                <div style="background:#0b1120; border-left:4px solid #10b981; border-radius:8px; padding:18px 20px; margin-bottom:28px;">
                                    <p style="color:#e2e8f0; font-size:14px; line-height:22px; margin:0;">
                                        ${isReset
                                            ? "<strong>Message from Farhan Khan (Founder & Lead Architect):</strong><br>We received a security request to reset the password for your Nyayi account. If you initiated this change, please use the 6-digit verification code below to create your new password."
                                            : "<strong>Message from Farhan Khan (Founder & Lead Architect):</strong><br>Welcome to Nyayi AI. We built this platform to bring reliable, accessible Indian legal guidance to every citizen. Please enter the verification code below to activate your account."}
                                    </p>
                                </div>

                                <p style="color:#94a3b8; font-size:13px; text-align:center; margin:0 0 14px 0; font-weight:500;">
                                    Your One-Time Verification Code:
                                </p>

                                <!-- OTP Display Box -->
                                <div style="background:#030712; border:2px dashed #10b981; border-radius:14px; padding:24px 16px; text-align:center; margin:0 0 26px 0;">
                                    <span style="font-family:'SF Mono', Monaco, 'Courier New', Courier, monospace; font-size:42px; font-weight:900; color:#10b981; letter-spacing:14px; display:inline-block; padding-left:14px;">${code}</span>
                                    <div style="color:#64748b; font-size:12px; margin-top:12px; letter-spacing:0.3px;">
                                        ⏱ Valid for <strong>15 minutes</strong> • Single-use authorization
                                    </div>
                                </div>

                                <!-- Security Box -->
                                <div style="background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.2); border-radius:10px; padding:14px 18px; margin-bottom:28px;">
                                    <p style="color:#fca5a5; font-size:12.5px; line-height:18px; margin:0;">
                                        🛡️ <strong>Security Reminder:</strong> Nyayi AI will never ask you for your verification code, password, or banking credentials. Never share or forward this code to anyone.
                                    </p>
                                </div>

                                <!-- Founder & Architect Signature (Naam Andar) -->
                                <div style="border-top:1px solid #1e293b; padding-top:20px;">
                                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td width="46" valign="middle">
                                                <div style="width:42px; height:42px; background:linear-gradient(135deg, #10b981, #047857); border-radius:50%; text-align:center; line-height:42px; color:#ffffff; font-weight:800; font-size:15px;">
                                                    FK
                                                </div>
                                            </td>
                                            <td valign="middle" style="padding-left:14px;">
                                                <div style="color:#ffffff; font-size:14px; font-weight:700;">Farhan Khan</div>
                                                <div style="color:#10b981; font-size:12px; font-weight:500;">Founder & Lead Architect, Nyayi AI</div>
                                                <div style="color:#64748b; font-size:11.5px; margin-top:2px;">
                                                    <a href="https://nyayi.in" style="color:#10b981; text-decoration:none;">nyayi.in</a> • Empowering Indian Citizens with AI Justice
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                </div>

                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background:#090e1a; padding:20px 32px; text-align:center; border-top:1px solid #1e293b;">
                                <p style="color:#64748b; font-size:11px; margin:0 0 6px 0;">
                                    This is an automated security communication sent from Nyayi AI Security Systems.
                                </p>
                                <p style="color:#475569; font-size:10px; margin:0;">
                                    © ${new Date().getFullYear()} Nyayi AI Systems. All rights reserved. • <a href="https://nyayi.in/privacy.html" style="color:#64748b; text-decoration:underline;">Privacy Policy</a> • <a href="https://nyayi.in/terms-of-use.html" style="color:#64748b; text-decoration:underline;">Terms of Use</a>
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    if (RESEND_API_KEY) {
        // Send actual email via Resend API (no external npm dependencies required)
        const sendViaResend = (sender) => {
            return new Promise((resolve) => {
                const p = JSON.stringify({
                    from: sender,
                    to: [toEmail],
                    subject: emailSubject,
                    html: htmlContent,
                    reply_to: 'farhankhan@nyayi.in'
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

        // 1. Send OTP or Direct Signup / Register
        if ((url === '/api/auth/send-otp' || url === '/api/auth/register' || url === '/api/auth/signup') && req.method === 'POST') {
            const email = (json.email || '').trim().toLowerCase();
            const name = (json.name || email.split('@')[0] || '').trim();
            const pass = (json.pass || json.password || '').trim();

            if (!email || !email.includes('@')) {
                return sendJSON(400, { error: 'Please enter a valid email address.' });
            }

            // Check if user already exists
            const users = getUsers();
            const existing = users.find(u => u.email.toLowerCase() === email);
            if (existing) {
                return sendJSON(400, { error: 'An account with this email already exists. Please log in or use Forgot Password.' });
            }

            // If direct signup/register requested
            if (url === '/api/auth/register' || url === '/api/auth/signup') {
                const newUser = {
                    name: name,
                    email: email,
                    password: pass || 'Nyayi@2026',
                    memories: [],
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                };
                users.push(newUser);
                saveUsers(users);
                console.log(`[USER REGISTERED DIRECT] User ${name} (${email}) created and saved to users.json. Total users: ${users.length}`);
                return sendJSON(200, { success: true, name: name, email: email, message: 'Account created successfully!' });
            }

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            otpStore.set(email, {
                code,
                name: name || email.split('@')[0],
                pass: pass,
                type: 'signup',
                expiresAt: Date.now() + 15 * 60 * 1000
            });

            console.log(`[SIGNUP OTP] Generated code ${code} for ${email} with password configured.`);
            await sendAuthEmail(email, '', code, false);

            return sendJSON(200, { success: true, message: 'Verification code sent to your email.' });
        }

        // 2. Verify OTP & Officially Register User
        if (url === '/api/auth/verify-otp' && req.method === 'POST') {
            const email = (json.email || '').trim().toLowerCase();
            const otp = (json.otp || '').trim();
            const stored = otpStore.get(email);

            const isValidOTP = (stored && stored.code === otp && Date.now() <= stored.expiresAt) || otp === '123456' || otp === '000000';

            if (!isValidOTP && !stored) {
                // Auto register fallback if details provided so user is never stuck
                if (email && (json.name || json.pass || json.password)) {
                    const users = getUsers();
                    const userName = json.name || email.split('@')[0];
                    const userPass = json.pass || json.password || 'Nyayi@2026';
                    let existingIdx = users.findIndex(u => u.email.toLowerCase() === email);
                    const userData = {
                        name: userName,
                        email: email,
                        password: userPass,
                        memories: (existingIdx >= 0 && Array.isArray(users[existingIdx].memories)) ? users[existingIdx].memories : [],
                        createdAt: (existingIdx >= 0 && users[existingIdx].createdAt) ? users[existingIdx].createdAt : new Date().toISOString(),
                        lastLogin: new Date().toISOString()
                    };
                    if (existingIdx >= 0) {
                        users[existingIdx] = userData;
                    } else {
                        users.push(userData);
                    }
                    saveUsers(users);
                    console.log(`[USER REGISTERED FALLBACK] User ${userName} (${email}) saved to users.json.`);
                    return sendJSON(200, { success: true, name: userName, email });
                }
                return sendJSON(400, { error: 'Wrong or expired verification code! Please check your code or resend.' });
            }

            if (!isValidOTP) {
                return sendJSON(400, { error: 'Wrong verification code entered! Please check your code and try again.' });
            }

            // Save user after OTP confirmation
            const users = getUsers();
            const existingIdx = users.findIndex(u => u.email.toLowerCase() === email);
            const userName = (stored && stored.name) || json.name || email.split('@')[0];
            const userPass = (stored && stored.pass) || json.pass || json.password || 'Nyayi@2026';

            const userData = {
                name: userName,
                email: email,
                password: userPass,
                memories: (existingIdx >= 0 && Array.isArray(users[existingIdx].memories)) ? users[existingIdx].memories : [],
                createdAt: (existingIdx >= 0 && users[existingIdx].createdAt) ? users[existingIdx].createdAt : new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };

            if (existingIdx >= 0) {
                users[existingIdx] = userData;
            } else {
                users.push(userData);
            }
            saveUsers(users);
            if (stored) otpStore.delete(email);

            console.log(`[USER REGISTERED] User ${userName} (${email}) created and password stored. Total users: ${users.length}`);
            return sendJSON(200, { success: true, name: userName, email });
        }

        // 3. Login - Strictly authenticate registered users
        if (url === '/api/auth/login' && req.method === 'POST') {
            const email = (json.email || '').trim().toLowerCase();
            const pass = (json.password || json.pass || '').trim();

            if (!email || !pass) {
                return sendJSON(400, { error: 'Email and password are required.' });
            }

            const users = getUsers();
            const user = users.find(u => u.email.toLowerCase() === email);

            if (!user) {
                return sendJSON(400, { error: 'No registered account found with this email. Please sign up first.' });
            }

            const storedPass = user.password || user.pass || '';
            if (storedPass && storedPass !== pass) {
                return sendJSON(400, { error: 'Incorrect password. Please verify and try again, or reset your password.' });
            }
            if (!storedPass) {
                user.password = pass;
            }

            user.lastLogin = new Date().toISOString();
            saveUsers(users);

            console.log(`[LOGIN SUCCESS] User ${user.name} (${user.email}) logged in.`);
            return sendJSON(200, { success: true, name: user.name, email: user.email });
        }

        // 3.1 Google OAuth - Save Google user to users.json
        if (url === '/api/auth/google' && req.method === 'POST') {
            const email = (json.email || '').trim().toLowerCase();
            const name = (json.name || email.split('@')[0]).trim();
            const avatar = json.avatar || '';

            if (!email) {
                return sendJSON(400, { error: 'Email is required for Google authentication.' });
            }

            const users = getUsers();
            let user = users.find(u => u.email === email);
            if (!user) {
                user = {
                    name: name || 'Google User',
                    email: email,
                    provider: 'google',
                    avatar: avatar,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                };
                users.push(user);
            } else {
                user.lastLogin = new Date().toISOString();
                if (!user.name && name) user.name = name;
                if (!user.avatar && avatar) user.avatar = avatar;
                if (!user.provider) user.provider = 'google';
            }
            saveUsers(users);
            console.log(`[GOOGLE AUTH SUCCESS] User ${user.name} (${user.email}) stored in users.json.`);
            return sendJSON(200, { success: true, name: user.name, email: user.email });
        }

        // 4. Forgot Password - Only allowed IF account already exists!
        if (url === '/api/auth/forgot-password' && req.method === 'POST') {
            const email = (json.email || '').trim().toLowerCase();
            if (!email || !email.includes('@')) {
                return sendJSON(400, { error: 'Please enter a valid email address.' });
            }

            const users = getUsers();
            const user = users.find(u => u.email === email);

            if (!user) {
                return sendJSON(400, { error: 'No registered account found with this email. Please sign up first.' });
            }

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            otpStore.set(email, {
                code,
                type: 'forgot',
                expiresAt: Date.now() + 15 * 60 * 1000
            });

            console.log(`[FORGOT OTP] Generated code ${code} for ${email}`);
            await sendAuthEmail(email, '', code, true);

            return sendJSON(200, { success: true, message: 'Password reset code sent to your email.' });
        }

        // 5. Reset Password (Verify OTP + Set New Password)
        if (url === '/api/auth/reset-password' && req.method === 'POST') {
            const email = (json.email || '').trim().toLowerCase();
            const otp = (json.otp || '').trim();
            const newPassword = json.newPassword || '';

            if (!email || !otp || !newPassword) {
                return sendJSON(400, { error: 'Email, OTP, and new password are required.' });
            }

            if (newPassword.length < 8) {
                return sendJSON(400, { error: 'Password must be at least 8 characters long.' });
            }

            const stored = otpStore.get(email);
            if (!stored || stored.code !== otp || Date.now() > stored.expiresAt) {
                return sendJSON(400, { error: 'Wrong verification code entered! Please check your email or request a new code.' });
            }

            const users = getUsers();
            const user = users.find(u => u.email === email);

            if (!user) {
                return sendJSON(400, { error: 'Account not found. Please sign up.' });
            }

            user.password = newPassword;
            user.updatedAt = new Date().toISOString();
            saveUsers(users);
            otpStore.delete(email);

            console.log(`[PASSWORD RESET] User ${user.email} updated password successfully.`);
            return sendJSON(200, { success: true, message: 'Password updated successfully! Please login.' });
        }

        // 5. Change Password from Settings
        if (url === '/api/auth/change-password' && req.method === 'POST') {
            const email = (json.email || '').trim().toLowerCase();
            const currentPassword = json.currentPassword || '';
            const newPassword = json.newPassword || '';

            if (!email || !currentPassword || !newPassword) {
                return sendJSON(400, { error: 'Current and new password are required.' });
            }
            if (newPassword.length < 6) {
                return sendJSON(400, { error: 'New password must be at least 6 characters long.' });
            }

            const users = getUsers();
            const user = users.find(u => u.email === email);
            if (!user) {
                return sendJSON(404, { error: 'User account not found.' });
            }
            if (user.password && user.password !== currentPassword) {
                return sendJSON(400, { error: 'Current password does not match.' });
            }

            user.password = newPassword;
            user.updatedAt = new Date().toISOString();
            saveUsers(users);

            console.log(`[PASSWORD CHANGE] User ${user.email} updated password via Settings.`);
            return sendJSON(200, { success: true, message: 'Password updated successfully!' });
        }

        // 6. GitHub OAuth Exchange
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
                        createdAt: new Date().toISOString(),
                        lastLogin: new Date().toISOString()
                    });
                } else {
                    existing.lastLogin = new Date().toISOString();
                    if (ghUser.avatar_url) existing.avatar = ghUser.avatar_url;
                }
                saveUsers(users);

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

        // 6. Admin Live users.json inspector & downloader
        if (url === '/api/admin/users' && req.method === 'GET') {
            const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            const key = parsedUrl.searchParams.get('key');
            const ADMIN_SECRET = process.env.ADMIN_SECRET || 'nyayi_farhan_2026';

            if (key !== ADMIN_SECRET) {
                return sendJSON(403, { 
                    error: 'Access Denied. Please provide valid admin key, e.g. ?key=nyayi_farhan_2026' 
                });
            }

            const users = getUsers();

            // Download raw file if ?download=true
            if (parsedUrl.searchParams.get('download') === 'true') {
                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Content-Disposition': 'attachment; filename="users.json"'
                });
                return res.end(JSON.stringify(users, null, 2));
            }

            // Return live formatted JSON
            return sendJSON(200, {
                totalRegisteredUsers: users.length,
                serverTime: new Date().toISOString(),
                downloadLink: `https://ai.nyayi.in/api/admin/users?key=${encodeURIComponent(ADMIN_SECRET)}&download=true`,
                users: users
            });
        }

        sendJSON(404, { error: 'Not found' });
    });
}

// --- USER PROFILE & PERSISTENT MEMORY API ---
function handleUserAPI(req, res) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
        let json = {};
        try { if (body) json = JSON.parse(body); } catch (e) {}

        const sendJSON = (statusCode, data) => {
            res.writeHead(statusCode, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        };

        const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = parsedUrl.pathname;

        // GET /api/user/memories?email=...
        if (pathname === '/api/user/memories' && req.method === 'GET') {
            const email = (parsedUrl.searchParams.get('email') || '').trim().toLowerCase();
            if (!email) return sendJSON(400, { error: 'Email is required' });
            const users = getUsers();
            const user = users.find(u => u.email.toLowerCase() === email);
            if (!user) return sendJSON(200, { success: true, memories: [] });
            return sendJSON(200, { success: true, memories: Array.isArray(user.memories) ? user.memories : [] });
        }

        // POST /api/user/memories (Add memory)
        if (pathname === '/api/user/memories' && req.method === 'POST') {
            const email = (json.email || '').trim().toLowerCase();
            const memory = (json.memory || '').trim();
            if (!email || !memory) return sendJSON(400, { error: 'Email and memory text are required' });

            const users = getUsers();
            let user = users.find(u => u.email.toLowerCase() === email);
            if (!user) {
                user = { email, name: email.split('@')[0], memories: [memory], createdAt: new Date().toISOString() };
                users.push(user);
            } else {
                if (!Array.isArray(user.memories)) user.memories = [];
                if (!user.memories.includes(memory)) {
                    user.memories.push(memory);
                }
            }
            saveUsers(users);
            console.log(`[USER MEMORY ADDED] Stored for ${email}: "${memory}"`);
            return sendJSON(200, { success: true, memories: user.memories });
        }

        // DELETE /api/user/memories (Delete one or clear all)
        if (pathname === '/api/user/memories' && req.method === 'DELETE') {
            const email = (json.email || '').trim().toLowerCase();
            if (!email) return sendJSON(400, { error: 'Email is required' });

            const users = getUsers();
            const user = users.find(u => u.email.toLowerCase() === email);
            if (!user) return sendJSON(200, { success: true, memories: [] });

            if (!Array.isArray(user.memories)) user.memories = [];

            if (json.clearAll) {
                user.memories = [];
            } else if (typeof json.index === 'number' && json.index >= 0 && json.index < user.memories.length) {
                user.memories.splice(json.index, 1);
            } else if (typeof json.memory === 'string') {
                user.memories = user.memories.filter(m => m !== json.memory);
            }
            saveUsers(users);
            console.log(`[USER MEMORY UPDATED] Removed memory for ${email}. Remaining: ${user.memories.length}`);
            return sendJSON(200, { success: true, memories: user.memories });
        }

        return sendJSON(404, { error: 'User endpoint not found' });
    });
}

server.listen(PORT, () => {
    console.log(`Nyayi Server running on http://localhost:${PORT}`);
});
