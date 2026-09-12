// ===================================================
// NyayaSetu Pro (न्याय सेतु) - Core Client Script
// Developed by Farhan Khan (BCA Student)
// ===================================================

let chats = JSON.parse(localStorage.getItem('nyayaChats')) || [];
let activeChatId = null;
let user = localStorage.getItem('nyayaUser') || "Citizen";

// Voice Assistant & Language state
let voiceLang = 'hi-IN'; // default Hindi
let isVoiceQuery = false; // flag to auto-speak response
let autoSpeak = true; // auto-speak AI response after voice query
let activeRecognition = null;
let aiLanguage = localStorage.getItem('nyayaLanguage') || 'Multilingual';

// IPC to BNS Database (Comprehensive Official Mapping)
const BNS_DATABASE = {
    '420': { bns: 'Section 318(4)', title: 'Cheating (धोखाधड़ी / छल)', punishment: 'Up to 7 years imprisonment + Fine', bailable: 'Non-Bailable', cognizable: 'Cognizable' },
    '302': { bns: 'Section 103(1)', title: 'Murder (हत्या)', punishment: 'Death or Life Imprisonment + Fine', bailable: 'Non-Bailable', cognizable: 'Cognizable' },
    '307': { bns: 'Section 109', title: 'Attempt to Murder (हत्या का प्रयास)', punishment: 'Up to 10 years / Life Imprisonment + Fine', bailable: 'Non-Bailable', cognizable: 'Cognizable' },
    '376': { bns: 'Section 64', title: 'Rape (बलात्कार)', punishment: 'Rigorous Imprisonment 10 yrs to Life', bailable: 'Non-Bailable', cognizable: 'Cognizable' },
    '378': { bns: 'Section 303(1)', title: 'Theft (चोरी)', punishment: 'Up to 3 years or Fine or Community Service', bailable: 'Non-Bailable', cognizable: 'Cognizable' },
    '379': { bns: 'Section 303(2)', title: 'Theft Punishment (चोरी की सजा)', punishment: 'Up to 3 years imprisonment or Fine', bailable: 'Non-Bailable', cognizable: 'Cognizable' },
    '392': { bns: 'Section 309(4)', title: 'Robbery (लूट)', punishment: 'Rigorous Imprisonment up to 10 years', bailable: 'Non-Bailable', cognizable: 'Cognizable' },
    '498A': { bns: 'Section 85 / 86', title: 'Husband/Relatives Cruelty (दहेज उत्पीड़न / क्रूरता)', punishment: 'Up to 3 years imprisonment + Fine', bailable: 'Non-Bailable', cognizable: 'Cognizable' },
    '506': { bns: 'Section 351(2)', title: 'Criminal Intimidation (जान से मारने या धमकाने का अपराध)', punishment: 'Up to 2 years or 7 years if threat to cause death', bailable: 'Bailable / Non-Bailable', cognizable: 'Non-Cognizable / Cognizable' },
    '120B': { bns: 'Section 61(2)', title: 'Criminal Conspiracy (आपराधिक षड्यंत्र)', punishment: 'Same as the offense conspired', bailable: 'Depends on offense', cognizable: 'Depends on offense' },
    '144': { bns: 'Section 189(2)', title: 'Unlawful Assembly with Deadly Weapon (घातक हथियार से उपद्रव)', punishment: 'Up to 2 years or Fine', bailable: 'Bailable', cognizable: 'Cognizable' },
    '279': { bns: 'Section 281', title: 'Rash Driving on Public Way (लापरवाही से तेज गाड़ी चलाना)', punishment: 'Up to 6 months or ₹1,000 fine', bailable: 'Bailable', cognizable: 'Cognizable' },
    '323': { bns: 'Section 115(2)', title: 'Voluntarily Causing Hurt (मारपीट / चोट पहुंचाना)', punishment: 'Up to 1 year or ₹1,000 fine', bailable: 'Bailable', cognizable: 'Non-Cognizable' },
    '354': { bns: 'Section 74', title: 'Outraging Modesty of Woman (महिला से छेड़छाड़)', punishment: '1 to 5 years imprisonment + Fine', bailable: 'Non-Bailable', cognizable: 'Cognizable' },
    '406': { bns: 'Section 316', title: 'Criminal Breach of Trust (अमानत में खयानत)', punishment: 'Up to 3 years or Fine', bailable: 'Non-Bailable', cognizable: 'Cognizable' },
    '468': { bns: 'Section 338', title: 'Forgery for Purpose of Cheating (फर्जी कागजात बनाना)', punishment: 'Up to 7 years + Fine', bailable: 'Non-Bailable', cognizable: 'Cognizable' },
    '304A': { bns: 'Section 106(1)', title: 'Death by Negligence (लापरवाही से मौत)', punishment: 'Up to 5 years + Fine', bailable: 'Bailable', cognizable: 'Cognizable' }
};

// Traffic Violations Detail
const TRAFFIC_FINES = {
    'helmet': { title: 'Driving Without Helmet', fine: '₹1,000', section: 'Section 194D MVA', penalty: 'License Disqualification for 3 months' },
    'seatbelt': { title: 'Driving Without Seatbelt', fine: '₹1,000', section: 'Section 194B MVA', penalty: 'Applicable to driver and front/rear passengers' },
    'license': { title: 'Driving Without Valid License', fine: '₹5,000', section: 'Section 181 MVA', penalty: 'Vehicle may be impounded; Juvenile driving fine ₹25,000' },
    'drunk': { title: 'Drunk Driving (Alcohol > 30mg/100ml)', fine: '₹10,000', section: 'Section 185 MVA', penalty: 'Up to 6 months imprisonment; Repeat offense: ₹15,000 / 2 yrs jail' },
    'speed': { title: 'Over Speeding', fine: '₹1,000 (LMV) / ₹2,000 (Medium/Heavy)', section: 'Section 183 MVA', penalty: 'Impounding of driving license on repeat offense' },
    'phone': { title: 'Mobile Phone Usage While Driving', fine: '₹1,000 to ₹5,000', section: 'Section 184(c) MVA', penalty: 'Can lead to license suspension' },
    'insurance': { title: 'Driving Uninsured Vehicle', fine: '₹2,000', section: 'Section 196 MVA', penalty: 'Imprisonment up to 3 months or fine; Repeat ₹4,000' },
    'redlight': { title: 'Jumping Red Light (Dangerous Driving)', fine: '₹1,000 to ₹5,000', section: 'Section 184 MVA', penalty: 'License seizure for 3 months' },
    'triple': { title: 'Triple Riding on Two-Wheeler', fine: '₹1,000', section: 'Section 194C MVA', penalty: 'License disqualification for 3 months' },
    'emergency': { title: 'Not Giving Way to Emergency Vehicles (Ambulance/Fire)', fine: '₹10,000', section: 'Section 194E MVA', penalty: 'Imprisonment up to 6 months' }
};

// =========================================
// 1. INITIALIZATION
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    // Pre-warm SpeechSynthesis voices
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }

    // Restore selected AI language dropdown
    const langSelectEl = document.getElementById('langSelect');
    if (langSelectEl) {
        langSelectEl.value = aiLanguage;
    }

    // Restore dark mode
    if (localStorage.getItem('nyayaTheme') === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeIcon(true);
    }

    // Restore settings
    const savedName = localStorage.getItem('nyayaUser');
    if (savedName && document.getElementById('userNameInput')) {
        document.getElementById('userNameInput').value = savedName;
    }
    const savedContact = localStorage.getItem('nyayaEmergencyContact');
    if (savedContact && document.getElementById('userEmergencyContact')) {
        document.getElementById('userEmergencyContact').value = savedContact;
    }

    // Initialize session
    if (chats.length === 0) {
        startNewChat();
    } else {
        openChat(chats[0].id);
    }

    // Modal background click to close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeAllModals();
        });
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
            closeVoiceAssistant();
        }
        // Alt+V or Ctrl+Shift+V for Voice Assistant
        if ((e.altKey && e.key.toLowerCase() === 'v') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'v')) {
            e.preventDefault();
            openVoiceAssistant();
        }
    });

    // Swipe gesture to open/close sidebar on touch devices
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchEndX - touchStartX;
        if (diff > 80 && touchStartX < 40) {
            // Swipe right from left edge → open sidebar
            toggleSidebar(true);
        } else if (diff < -80) {
            // Swipe left → close sidebar
            toggleSidebar(false);
        }
    }, { passive: true });
});

// =========================================
// 2. CHAT ENGINE & UI
// =========================================

function renderEmptyState() {
    const box = document.getElementById('chat-box');
    box.innerHTML = `
        <div class="welcome-hero">
            <div class="welcome-badge-icon">
                <i class="fa-solid fa-scale-balanced"></i>
            </div>
            <h1 class="gradient-text">Namaste, ${escapeHtml(user)} Ji</h1>
            <p>Nyayi (न्यायी) me aapka swagat hai. Indian Penal Code, BNS 2023, Police FIR, Traffic Challan ya Consumer rights par turant vishwasniya kanooni margdarshan prapt karein.</p>
            
            <div class="suggestion-chips">
                <button class="chip" onclick="askSuggestion('Mera online cyber fraud ho gaya hai, paise wapas kaise paayein?')">
                    <i class="fa-solid fa-shield-halved"></i> Cyber Fraud Recovery (1930)
                </button>
                <button class="chip" onclick="askSuggestion('Agar police station me FIR likhne se inkar karein toh kya karein?')">
                    <i class="fa-solid fa-file-circle-check"></i> Police FIR Na Likhe Toh Kya Karein?
                </button>
                <button class="chip" onclick="askSuggestion('IPC Section 420 aur BNS me kya antar hai?')">
                    <i class="fa-solid fa-right-left"></i> IPC 420 vs BNS 318
                </button>
                <button class="chip" onclick="askSuggestion('Tenant rent nahi de raha hai, legal notice kaise bhein?')">
                    <i class="fa-solid fa-house-chimney-user"></i> Tenant & Property Dispute
                </button>
            </div>
        </div>
    `;
    box.scrollTop = 0;
}

function askSuggestion(text) {
    document.getElementById('userInput').value = text;
    sendMessage();
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}

function formatMessage(text) {
    if (!text) return '';
    
    // Bold **text**
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    // Headings
    formatted = formatted.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    formatted = formatted.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    formatted = formatted.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Video Guide link card
    formatted = formatted.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, 
        `<a href="$2" target="_blank" rel="noopener noreferrer" class="video-card">
            <i class="fa-brands fa-youtube"></i>
            <span>$1</span>
            <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:11px; margin-left:auto;"></i>
        </a>`
    );

    // List bullets
    formatted = formatted.replace(/^\* (.*$)/gim, '<li>$1</li>');
    formatted = formatted.replace(/^- (.*$)/gim, '<li>$1</li>');

    // Wrap consecutive <li> into <ul>
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    // Clean multiple <br> inside lists
    formatted = formatted.replace(/<br><\/li>/g, '</li>');
    formatted = formatted.replace(/<br><li>/g, '<li>');

    return formatted;
}

function smoothScrollToBottom() {
    const box = document.getElementById('chat-box');
    if (!box) return;
    box.scrollTo({
        top: box.scrollHeight,
        behavior: 'smooth'
    });
}

function appendMessage(text, role, skipScroll = false) {
    const box = document.getElementById('chat-box');
    
    // Remove welcome hero if present
    const hero = box.querySelector('.welcome-hero');
    if (hero) hero.remove();

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role === 'user' ? 'user-msg' : 'ai-msg'}`;

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.innerHTML = role === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-scale-balanced"></i>';

    const bodyWrapper = document.createElement('div');
    bodyWrapper.className = 'msg-body-wrapper';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'msg-content';
    contentDiv.innerHTML = role === 'user' ? escapeHtml(text).replace(/\n/g, '<br>') : formatMessage(text);

    bodyWrapper.appendChild(contentDiv);

    if (role === 'ai') {
        const cleanForAudio = text.replace(/\[.*?\]\(.*?\)/g, '').replace(/[\*#_]/g, '');
        const toolsDiv = document.createElement('div');
        toolsDiv.className = 'msg-tools';
        toolsDiv.innerHTML = `
            <button class="tool-pill" onclick="speakMessage(this, decodeURIComponent('${encodeURIComponent(cleanForAudio)}'))">
                <i class="fa-solid fa-volume-high"></i> Listen
            </button>
            <button class="tool-pill" onclick="copyMessageText(this, decodeURIComponent('${encodeURIComponent(cleanForAudio)}'))">
                <i class="fa-regular fa-copy"></i> Copy
            </button>
            <button class="tool-pill" onclick="shareResponse(decodeURIComponent('${encodeURIComponent(cleanForAudio)}'))">
                <i class="fa-solid fa-share-nodes"></i> Share
            </button>
        `;
        bodyWrapper.appendChild(toolsDiv);
    }

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(bodyWrapper);
    box.appendChild(msgDiv);
    
    if (!skipScroll) {
        if (role === 'ai') {
            // Align the START of the AI message with top of screen so user reads from beginning!
            setTimeout(() => {
                msgDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 60);
        } else {
            msgDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }
}

function showTypingIndicator() {
    removeTypingIndicator();
    const box = document.getElementById('chat-box');
    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'message ai-msg';
    indicator.innerHTML = `
        <div class="msg-avatar"><i class="fa-solid fa-scale-balanced"></i></div>
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    box.appendChild(indicator);
    smoothScrollToBottom();
}

function removeTypingIndicator() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
}

// =========================================
// 3. SEND MESSAGE & API CALL
// =========================================
async function sendMessage() {
    const input = document.getElementById('userInput');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';

    // Append user message
    appendMessage(text, 'user');

    let currentChat = chats.find(c => c.id === activeChatId);
    if (!currentChat) {
        currentChat = { id: Date.now().toString(), title: text.slice(0, 30), messages: [] };
        chats.unshift(currentChat);
        activeChatId = currentChat.id;
    } else if (currentChat.messages.length === 0) {
        currentChat.title = text.slice(0, 32);
    }

    currentChat.messages.push({ role: 'user', text: text });
    saveData();
    loadHistory();

    showTypingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, category: "Indian Legal Advisory", language: aiLanguage })
        });

        removeTypingIndicator();

        if (!response.ok) {
            throw new Error('Server returned status: ' + response.status);
        }

        const data = await response.json();
        const reply = data.reply || "Maaf karein, AI se uttar lene me samasya aayi.";

        appendMessage(reply, 'ai');
        currentChat.messages.push({ role: 'ai', text: reply });
        saveData();

        // Auto speak response if triggered by voice assistant
        autoSpeakResponse(reply);

    } catch (err) {
        console.error("Chat API error:", err);
        removeTypingIndicator();
        appendMessage("Network issue: Server se sampark nahi ho pa raha hai. Kripya check karein ki server run kar raha hai.", 'ai');
    }
}

function handleEnter(e) {
    if (e.key === 'Enter') sendMessage();
}

// =========================================
// 4. CHAT SESSIONS & HISTORY
// =========================================
function startNewChat() {
    const newId = Date.now().toString();
    chats.unshift({
        id: newId,
        title: "New Consultation",
        messages: []
    });
    saveData();
    openChat(newId);
    if (window.innerWidth <= 768) {
        toggleSidebar(false);
    }
}

function openChat(chatId) {
    activeChatId = chatId;
    const box = document.getElementById('chat-box');
    box.innerHTML = '';

    const chat = chats.find(c => c.id === chatId);
    if (chat && chat.messages.length > 0) {
        chat.messages.forEach(m => appendMessage(m.text, m.role, true));
        box.scrollTop = 0; // Start viewing from top when opening chat history
    } else {
        renderEmptyState();
    }

    loadHistory();
}

function loadHistory() {
    const list = document.getElementById('historyList');
    if (!list) return;
    list.innerHTML = '';

    chats.forEach(chat => {
        const item = document.createElement('div');
        item.className = `history-item ${chat.id === activeChatId ? 'active' : ''}`;
        item.innerHTML = `<i class="fa-regular fa-message"></i> <span style="flex:1; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(chat.title || "Consultation")}</span>`;
        item.onclick = () => {
            openChat(chat.id);
            if (window.innerWidth <= 768) toggleSidebar(false);
        };
        list.appendChild(item);
    });
}

function clearHistory() {
    if (confirm("Kya aap apni consultation history clear karna chahte hain?")) {
        chats = [];
        saveData();
        startNewChat();
    }
}

function saveData() {
    localStorage.setItem('nyayaChats', JSON.stringify(chats));
    localStorage.setItem('nyayaUser', user);
}

// =========================================
// 5. MODAL MANAGEMENT
// =========================================
function openTool(toolName) {
    closeAllModals();
    if (window.innerWidth <= 768) toggleSidebar(false);

    const modalMap = {
        'fir': 'modal-fir',
        'bns': 'modal-bns',
        'fine': 'modal-fine',
        'drafter': 'modal-drafter',
        'lawyer': 'modal-lawyer',
        'videos': 'modal-videos',
        'settings': 'settingsModal',
        'factlaw': 'modal-factlaw',
        'firwizard': 'modal-firwizard',
        'casesimplifier': 'modal-casesimplifier',
        'updates': 'modal-updates'
    };

    const targetId = modalMap[toolName];
    if (targetId) {
        const modal = document.getElementById(targetId);
        if (modal) modal.classList.add('active');
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    const sos = document.getElementById('sosOverlay');
    if (sos) sos.classList.remove('active');
}

// =========================================
// 6. LEGAL TOOL FEATURES
// =========================================

// A. IPC <-> BNS Converter
function convertSection() {
    const input = document.getElementById('ipc-input');
    const resultDiv = document.getElementById('bns-result');
    const query = input.value.trim().toUpperCase().replace(/[^0-9A-Z]/g, '');

    if (!query) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<span style="color:#ef4444;">Kripya koi IPC Dhara (Section) darj karein. (jaise 420, 302, 376, 506)</span>';
        return;
    }

    const hit = BNS_DATABASE[query];
    resultDiv.style.display = 'block';

    if (hit) {
        resultDiv.innerHTML = `
            <div style="background:var(--primary-light); padding:12px; border-radius:10px; border-left:4px solid var(--primary); margin-bottom:12px;">
                <div style="font-size:13px; color:var(--text-muted);">Purani IPC: <b>Section ${query}</b></div>
                <div style="font-size:18px; font-weight:800; color:var(--primary-dark); margin:4px 0;">Nayi BNS: ${hit.bns}</div>
                <div style="font-weight:700; font-size:14px; margin-bottom:8px;">${hit.title}</div>
            </div>
            <div style="font-size:13.5px; line-height:1.7;">
                <div>⚖️ <b>Punishment:</b> ${hit.punishment}</div>
                <div>🔒 <b>Bailability:</b> ${hit.bailable}</div>
                <div>🚨 <b>Nature:</b> ${hit.cognizable}</div>
            </div>
            <button class="modal-btn" style="margin-top:14px; font-size:13px; padding:10px;" onclick="askSuggestion('Mujhe IPC ${query} aur BNS ${hit.bns} ke baare me vistrit legal advice chahiye.')">
                <i class="fa-solid fa-robot"></i> Ask NyayaSetu AI for Detailed Analysis
            </button>
        `;
    } else {
        resultDiv.innerHTML = `
            <p style="color:var(--text-muted); margin-bottom:10px;">Section ${escapeHtml(query)} fast-database me nahi mili.</p>
            <button class="modal-btn" onclick="askSuggestion('IPC Section ${query} ko Bharatiya Nyaya Sanhita (BNS) me kya kahte hain aur iski poori jankari dein.')">
                <i class="fa-solid fa-magnifying-glass"></i> Search in NyayaSetu AI Law Engine
            </button>
        `;
    }
}

// B. Traffic Fine Calculator
function calculateFine() {
    const type = document.getElementById('fine-type').value;
    const resultDiv = document.getElementById('fine-result');
    const fineInfo = TRAFFIC_FINES[type];

    if (fineInfo) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div style="background:var(--primary-light); padding:14px; border-radius:12px; border-left:4px solid var(--primary);">
                <div style="font-size:13px; color:var(--text-muted);">${fineInfo.section}</div>
                <div style="font-size:22px; font-weight:800; color:#ef4444; margin:4px 0;">Challan: ${fineInfo.fine}</div>
                <div style="font-weight:700; font-size:14px; margin-bottom:6px;">${fineInfo.title}</div>
                <div style="font-size:13px; color:var(--text-main);">${fineInfo.penalty}</div>
            </div>
            <div style="margin-top:14px; display:flex; gap:10px;">
                <a href="https://echallan.parivahan.gov.in" target="_blank" class="lawyer-call-btn" style="background:#111827; color:#fff; flex:1; justify-content:center;">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Pay on eChallan Parivahan
                </a>
            </div>
        `;
    }
}

// C. FIR Generator
function generateFIR() {
    const name = document.getElementById('fir-name').value.trim() || "शिकायतकर्ता / Complainant";
    const police = document.getElementById('fir-police').value.trim() || "थाना प्रभारी (SHO)";
    const accused = document.getElementById('fir-accused').value.trim() || "अज्ञात / Opponent";
    const incident = document.getElementById('fir-incident').value.trim();
    const resultDiv = document.getElementById('fir-result');

    if (!incident) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<span style="color:#ef4444;">Kripya ghatna ka vivran (incident details) darj karein.</span>';
        return;
    }

    const today = new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const draft = `सेवा में,
श्रीमान थाना प्रभारी महोदय,
${police}।

विषय: प्रथम सूचना रिपोर्ट (FIR) दर्ज कराने हेतु प्रार्थना पत्र।

महोदय,
सविनय निवेदन है कि मैं ${name}, इस प्रार्थना पत्र के माध्यम से निम्नलिखित घटना की सूचना दर्ज कराना चाहता/चाहती हूँ:

1. यह कि आरोपी/विपक्षी का विवरण: ${accused}
2. घटना का संपूर्ण विवरण:
${incident}

3. अतः श्रीमान जी से सविनय प्रार्थना है कि उक्त घटना का संज्ञान लेते हुए भारतीय न्याय संहिता (BNS) / सुसंगत धाराओं के अंतर्गत प्रथम सूचना रिपोर्ट (FIR) दर्ज कर उचित कानूनी कार्रवाई करने की कृपा करें।

दिनांक: ${today}
प्रार्थी / प्रार्थिनी: ${name}
हस्ताक्षर: __________________`;

    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <b><i class="fa-solid fa-file-check"></i> Prepared FIR Application Draft:</b>
            <button class="tool-pill" onclick="copyTextToClipboard(\`${encodeURIComponent(draft)}\`, this)">
                <i class="fa-regular fa-copy"></i> Copy Draft
            </button>
        </div>
        <pre style="white-space:pre-wrap; font-family:inherit; background:var(--sidebar-bg); padding:14px; border-radius:10px; border:1px solid var(--border); font-size:13px; line-height:1.6;">${escapeHtml(draft)}</pre>
        <button class="modal-btn" style="margin-top:12px; font-size:13px; padding:10px;" onclick="window.print()">
            <i class="fa-solid fa-print"></i> Print / Save PDF
        </button>
    `;
}

// D. Legal Notice Generator
function generateLegalNotice() {
    const type = document.getElementById('notice-type').value;
    const sender = document.getElementById('notice-sender').value.trim() || "[Your Full Name & Address]";
    const receiver = document.getElementById('notice-receiver').value.trim() || "[Recipient / Opponent Name & Address]";
    const amount = document.getElementById('notice-amount').value.trim() || "₹[Amount]";
    const resultDiv = document.getElementById('notice-result');
    const today = new Date().toLocaleDateString('en-GB');

    let noticeText = '';

    if (type === 'cheque') {
        noticeText = `REGISTERED A.D. / SPEED POST
LEGAL DEMAND NOTICE UNDER SECTION 138 OF NEGOTIABLE INSTRUMENTS ACT, 1881

Date: ${today}

TO:
${receiver}

FROM:
${sender}

Sir / Madam,

Under instructions and on behalf of my client, I hereby serve upon you this Statutory Legal Notice under Section 138 of the Negotiable Instruments Act, 1881:

1. That you issued Cheque for an amount of ${amount} in discharge of your legally enforceable debt and liability.
2. That upon presentation in the bank, the said cheque was returned unpaid / dishonored with the remark "Funds Insufficient / Exceeds Arrangement".
3. That despite verbal requests, you have deliberately failed to make the payment.

NOW THEREFORE, through this notice, you are hereby called upon to pay the entire amount of ${amount} within 15 (FIFTEEN) DAYS of the receipt of this notice, failing which appropriate criminal proceedings under Section 138 of the Negotiable Instruments Act and Section 318 of Bharatiya Nyaya Sanhita (BNS) will be initiated against you at your sole risk and costs.

Yours faithfully,
${sender}`;
    } else {
        noticeText = `LEGAL NOTICE FOR SETTLEMENT OF DISPUTE

Date: ${today}

TO:
${receiver}

FROM:
${sender}

Subject: Formal Legal Notice regarding Claim / Disputed Amount of ${amount}.

Sir / Madam,

Please take notice that you are in serious breach of obligations regarding the subject matter:
1. You have defaulted in your commitments/payments towards my client amounting to ${amount}.
2. Despite repeated reminders, the outstanding dues have not been cleared.

You are hereby called upon to settle and pay the full sum of ${amount} within 15 days of receiving this notice, failing which legal proceedings (Civil Suit / Criminal Complaint) will be initiated against you before the appropriate Court of Law.

Sincerely,
${sender}`;
    }

    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <b><i class="fa-solid fa-scale-balanced"></i> Advocate Standard Legal Notice:</b>
            <button class="tool-pill" onclick="copyTextToClipboard(\`${encodeURIComponent(noticeText)}\`, this)">
                <i class="fa-regular fa-copy"></i> Copy Notice
            </button>
        </div>
        <pre style="white-space:pre-wrap; font-family:inherit; background:var(--sidebar-bg); padding:14px; border-radius:10px; border:1px solid var(--border); font-size:13px; line-height:1.6;">${escapeHtml(noticeText)}</pre>
        <button class="modal-btn" style="margin-top:12px; font-size:13px; padding:10px;" onclick="window.print()">
            <i class="fa-solid fa-print"></i> Print Notice
        </button>
    `;
}

// E. NEW: Which Law Applies (Fact-to-Law Analyzer)
async function analyzeFactsToLaw() {
    const input = document.getElementById('factlaw-input').value.trim();
    const resultDiv = document.getElementById('factlaw-result');

    if (!input) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<span style="color:#ef4444;">Kripya apni ghatna ke mukhya tathya (facts) darj karein.</span>';
        return;
    }

    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<div style="color:var(--primary-dark);"><i class="fa-solid fa-spinner fa-spin"></i> Kanooni dharaon aur BNS ki janch ki ja rahi hai...</div>';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: input, category: "Which Law Applies" })
        });
        const data = await response.json();
        resultDiv.innerHTML = formatMessage(data.reply || "Analysis complete.");
    } catch (e) {
        resultDiv.innerHTML = '<span style="color:#ef4444;">Analysis me samasya aayi. Kripya punah prayas karein.</span>';
    }
}

// F. NEW: FIR 6-Step Wizard Navigation
function goToFIRStep(stepNum) {
    for (let i = 1; i <= 6; i++) {
        const content = document.getElementById('firStep' + i);
        const btn = document.getElementById('stepBtn' + i);
        if (content) content.classList.remove('active');
        if (btn) btn.classList.remove('active');
    }
    const targetContent = document.getElementById('firStep' + stepNum);
    const targetBtn = document.getElementById('stepBtn' + stepNum);
    if (targetContent) targetContent.classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');
}

// G. NEW: Case Law & Judgment Simplifier
async function simplifyCaseLaw() {
    const input = document.getElementById('casesimplifier-input').value.trim();
    const resultDiv = document.getElementById('casesimplifier-result');

    if (!input) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<span style="color:#ef4444;">Kripya kisi Case Law ka naam, citation ya judgment text paste karein.</span>';
        return;
    }

    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<div style="color:var(--primary-dark);"><i class="fa-solid fa-spinner fa-spin"></i> Judgment aur Ratio Decidendi simplify ki ja rahi hai...</div>';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: input, category: "Case Law Simplifier" })
        });
        const data = await response.json();
        resultDiv.innerHTML = formatMessage(data.reply || "Simplification complete.");
    } catch (e) {
        resultDiv.innerHTML = '<span style="color:#ef4444;">Case Law analysis me samasya aayi. Kripya punah prayas karein.</span>';
    }
}

// H. NEW: Filter Legal Updates
function filterLegalUpdates(cat, btn) {
    document.querySelectorAll('.update-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    document.querySelectorAll('.update-card').forEach(card => {
        if (cat === 'all' || card.getAttribute('data-cat') === cat) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// I. SOS Emergency System
function triggerSOS() {
    closeAllModals();
    const sosOverlay = document.getElementById('sosOverlay');
    if (sosOverlay) {
        sosOverlay.classList.add('active');
        if ('vibrate' in navigator) navigator.vibrate([300, 100, 300, 100, 500]);
    }
}

function stopSOS() {
    const sosOverlay = document.getElementById('sosOverlay');
    if (sosOverlay) sosOverlay.classList.remove('active');
}

let isVoiceMuted = false;

// =========================================
// 7. RELIABLE SPEECH SYNTHESIS ENGINE (TTS)
// =========================================
function playTTS(text, onStart, onEnd) {
    if (isVoiceMuted) return;
    const synth = window.speechSynthesis;
    if (!synth) {
        alert("Speech Synthesis is not supported in your browser.");
        return;
    }

    // Force unlock audio queue
    synth.cancel();
    if (synth.paused) synth.resume();

    setTimeout(() => {
        // Strip HTML, markdown formatting, URL cards
        const cleanText = text
            .replace(/<[^>]*>/g, ' ')
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
            .replace(/[\*#_`~]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = voiceLang || 'hi-IN';
        utterance.rate = 0.95;
        utterance.pitch = 1.15; // Natural female pitch

        const speakNow = () => {
            const voices = synth.getVoices();
            if (voices.length > 0) {
                // Priority to Female Indian/Hindi voices
                const femaleVoice = voices.find(v => (v.lang.includes('hi') || v.lang.includes('IN') || v.lang.includes('en')) && (
                    v.name.toLowerCase().includes('female') ||
                    v.name.toLowerCase().includes('woman') ||
                    v.name.toLowerCase().includes('swara') ||
                    v.name.toLowerCase().includes('aditi') ||
                    v.name.toLowerCase().includes('google hindi') ||
                    v.name.toLowerCase().includes('heera') ||
                    v.name.toLowerCase().includes('zira') ||
                    v.name.toLowerCase().includes('veena')
                )) || voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));

                if (femaleVoice) utterance.voice = femaleVoice;
            }

            if (onStart) utterance.onstart = onStart;
            if (onEnd) {
                utterance.onend = onEnd;
                utterance.onerror = onEnd;
            }

            synth.resume();
            synth.speak(utterance);
        };

        if (synth.getVoices().length > 0) {
            speakNow();
        } else {
            synth.onvoiceschanged = speakNow;
            setTimeout(speakNow, 150);
        }
    }, 100);
}

function speakMessage(btn, text) {
    const synth = window.speechSynthesis;
    if (!synth) return alert("Speech Synthesis not supported by this browser.");

    if (synth.speaking) {
        synth.cancel();
        btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Listen';
        return;
    }

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Playing...';

    playTTS(
        text,
        () => {
            btn.innerHTML = '<i class="fa-solid fa-stop"></i> Stop';
        },
        () => {
            btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Listen';
        }
    );
}

function autoSpeakResponse(text) {
    if (isVoiceQuery && autoSpeak) {
        isVoiceQuery = false;
        playTTS(text);
    }
}

// =========================================
// 8. VOICE ASSISTANT SYSTEM
// =========================================
function openVoiceAssistant() {
    closeAllModals();
    const overlay = document.getElementById('voiceOverlay');
    if (!overlay) return;

    overlay.classList.add('active');
    document.getElementById('voiceStatus').innerText = '🎤 Listening... Speak now';
    document.getElementById('voiceTranscript').innerText = '';
    
    const respBox = document.getElementById('voiceResponseBox');
    if (respBox) {
        respBox.style.display = 'none';
        respBox.innerHTML = '';
    }

    document.getElementById('voiceMicBtn').classList.add('listening');

    // Auto start recognition
    setTimeout(() => {
        startVoiceRecognition();
    }, 300);
}

function closeVoiceAssistant() {
    const overlay = document.getElementById('voiceOverlay');
    if (overlay) overlay.classList.remove('active');

    const micBtn = document.getElementById('voiceMicBtn');
    if (micBtn) micBtn.classList.remove('listening');

    if (activeRecognition) {
        try { activeRecognition.stop(); } catch (e) {}
        activeRecognition = null;
    }

    if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
}

function toggleVoiceMute() {
    isVoiceMuted = !isVoiceMuted;
    const btn = document.getElementById('voiceMuteBtn');
    const icon = document.getElementById('voiceMuteIcon');
    const label = document.getElementById('voiceMuteLabel');

    if (isVoiceMuted) {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (btn) btn.classList.add('muted');
        if (icon) icon.className = 'fa-solid fa-volume-xmark';
        if (label) label.innerText = 'Unmute Audio';
        document.getElementById('voiceStatus').innerText = '🔇 Audio Muted';
    } else {
        if (btn) btn.classList.remove('muted');
        if (icon) icon.className = 'fa-solid fa-volume-high';
        if (label) label.innerText = 'Mute Audio';
        document.getElementById('voiceStatus').innerText = '🔊 Audio Unmuted';
    }
}

function stopVoiceAssistant() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (activeRecognition) {
        try { activeRecognition.stop(); } catch (e) {}
        activeRecognition = null;
    }
    document.getElementById('voiceMicBtn').classList.remove('listening');
    document.getElementById('voiceStatus').innerText = '⏹️ Stopped. (Tap mic to speak)';
}

function toggleVoiceRecognition() {
    if (activeRecognition) {
        try { activeRecognition.stop(); } catch(e) {}
        activeRecognition = null;
        document.getElementById('voiceMicBtn').classList.remove('listening');
    }
    openVoiceAssistant();
}

function startVoiceRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
        document.getElementById('voiceStatus').innerText = '❌ Speech Recognition not supported in this browser.';
        return;
    }

    if (activeRecognition) {
        try { activeRecognition.stop(); } catch(e) {}
    }

    const recognition = new SpeechRec();
    activeRecognition = recognition;
    recognition.lang = voiceLang;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
        document.getElementById('voiceStatus').innerText = '🎤 Listening... Speak now';
        document.getElementById('voiceMicBtn').classList.add('listening');
    };

    recognition.onresult = async (e) => {
        let transcript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
            transcript += e.results[i][0].transcript;
        }
        document.getElementById('voiceTranscript').innerText = `"${transcript}"`;

        const isFinalResult = e.results[e.results.length - 1].isFinal;

        if (isFinalResult) {
            document.getElementById('voiceStatus').innerText = '⚡ Processing legal guidance...';
            document.getElementById('voiceMicBtn').classList.remove('listening');

            const respBox = document.getElementById('voiceResponseBox');
            if (respBox) {
                respBox.style.display = 'block';
                respBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...';
            }

            // Append to chat background
            appendMessage(transcript, 'user');

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: transcript, category: "Voice Assistant", language: aiLanguage })
                });

                const data = await response.json();
                const reply = data.reply || "Maaf karein, AI se response lene me samasya aayi.";

                if (respBox) {
                    respBox.innerHTML = formatMessage(reply);
                }

                // Append to chat background
                appendMessage(reply, 'ai');

                document.getElementById('voiceStatus').innerText = '🔊 Assistant Speaking... (Tap mic to speak again)';

                // Play female voice TTS
                playTTS(reply, null, () => {
                    document.getElementById('voiceStatus').innerText = 'Tap mic to speak again';
                });

            } catch (err) {
                console.error("Voice Assistant Fetch Error:", err);
                if (respBox) respBox.innerHTML = '<span style="color:#ef4444;">Network issue connecting to assistant.</span>';
                document.getElementById('voiceStatus').innerText = 'Tap mic to try again';
            }
        }
    };

    recognition.onerror = (err) => {
        console.warn("Speech recognition error:", err);
        document.getElementById('voiceStatus').innerText = 'Tap mic to try speaking again';
        document.getElementById('voiceMicBtn').classList.remove('listening');
        activeRecognition = null;
    };

    recognition.onend = () => {
        document.getElementById('voiceMicBtn').classList.remove('listening');
        activeRecognition = null;
    };

    recognition.start();
}

function toggleVoiceLang() {
    if (voiceLang === 'hi-IN') {
        voiceLang = 'en-IN';
        document.getElementById('voiceLangLabel').innerText = 'English (en-IN)';
    } else {
        voiceLang = 'hi-IN';
        document.getElementById('voiceLangLabel').innerText = 'हिंदी (hi-IN)';
    }
    // Restart recognition if active
    if (document.getElementById('voiceOverlay').classList.contains('active')) {
        startVoiceRecognition();
    }
}

function toggleMic() {
    openVoiceAssistant();
}

function copyMessageText(btn, text) {
    navigator.clipboard.writeText(text).then(() => {
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check" style="color:var(--primary);"></i> Copied';
        setTimeout(() => btn.innerHTML = originalHtml, 2000);
    });
}

function copyTextToClipboard(encodedText, btn) {
    const decoded = decodeURIComponent(encodedText);
    navigator.clipboard.writeText(decoded).then(() => {
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check" style="color:var(--primary);"></i> Copied!';
            setTimeout(() => btn.innerHTML = original, 2000);
        }
    });
}

function shareResponse(text) {
    if (navigator.share) {
        navigator.share({
            title: 'NyayaSetu Legal Guidance',
            text: text,
            url: window.location.href
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(text);
        alert('Legal guidance copied to clipboard!');
    }
}

// =========================================
// 9. BOTTOM NAV & UI HELPERS
// =========================================
function switchBottomNav(tab) {
    document.querySelectorAll('.bottom-nav-item').forEach(item => item.classList.remove('active'));
    
    if (tab === 'home') {
        const homeBtn = document.getElementById('bottomNavHome');
        if (homeBtn) homeBtn.classList.add('active');
        toggleSidebar(false);
        closeAllModals();
    } else if (tab === 'tools') {
        const toolsBtn = document.getElementById('bottomNavTools');
        if (toolsBtn) toolsBtn.classList.add('active');
        toggleSidebar(true);
    } else if (tab === 'history') {
        const historyBtn = document.getElementById('bottomNavHistory');
        if (historyBtn) historyBtn.classList.add('active');
        toggleSidebar(true);
    }
}

function toggleSidebar(forceState) {
    const sidebar = document.getElementById('sidebar-container');
    const backdrop = document.getElementById('overlayBackdrop');
    if (!sidebar) return;

    if (typeof forceState === 'boolean') {
        if (forceState) {
            sidebar.classList.add('active');
            if (backdrop) backdrop.classList.add('active');
        } else {
            sidebar.classList.remove('active');
            if (backdrop) backdrop.classList.remove('active');
        }
    } else {
        sidebar.classList.toggle('active');
        if (backdrop) backdrop.classList.toggle('active');
    }
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('nyayaTheme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
}

function changeAILanguage(langVal) {
    aiLanguage = langVal;
    localStorage.setItem('nyayaLanguage', langVal);
}

function saveSettings() {
    const nameVal = document.getElementById('userNameInput').value.trim();
    const contactVal = document.getElementById('userEmergencyContact').value.trim();

    if (nameVal) {
        user = nameVal;
        localStorage.setItem('nyayaUser', user);
    }
    if (contactVal) {
        localStorage.setItem('nyayaEmergencyContact', contactVal);
    }

    closeAllModals();
    alert("Settings saved successfully!");
    
    // Refresh welcome hero if on empty state
    const currentChat = chats.find(c => c.id === activeChatId);
    if (!currentChat || currentChat.messages.length === 0) {
        renderEmptyState();
    }
}
