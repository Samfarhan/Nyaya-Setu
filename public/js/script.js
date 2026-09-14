// =========================================================
// NYAYI (न्यायी) — PREMIUM INDIAN LEGAL INTELLIGENCE CLIENT
// Architecture: IndexedDB Store • Multi-Turn Context Memory
// Document-Style Legal Parser • Isolated Table System
// Minimal State Engine • Voice Engine • 100% Feature Intact
// Developed by Farhan Khan (BCA Student)
// =========================================================

// --- 1. APPLICATION STATE ---
let activeChatId = null;
let currentChatMessages = [];
let user = localStorage.getItem('nyayaUser') || "Citizen";
let aiLanguage = localStorage.getItem('nyayaLanguage') || 'Multilingual';
let activeAbortController = null;
let isGenerating = false;

// Voice Assistant state
let voiceLang = 'hi-IN';
let isVoiceQuery = false;
let autoSpeak = true;
let activeRecognition = null;
let isVoiceMuted = false;
let activeStatuteFilter = 'all';

// --- 2. STATUTORY DATABASES (100% PRESERVED & COMPLETE) ---

// A. Penal Law: IPC to BNS Database (Bharatiya Nyaya Sanhita, 2023)
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

// B. Procedural Law: CrPC to BNSS Database (Bharatiya Nagarik Suraksha Sanhita, 2023)
const BNSS_DATABASE = {
    '154': { bnss: 'Section 173(1) BNSS', title: 'FIR Registration & Mandatory Zero FIR (प्राथमिकी)', old: 'Section 154 CrPC', category: 'Criminal Procedure', details: 'Zero FIR mandatory across any police station regardless of jurisdiction. E-FIR permitted with signature verification within 3 days.', nature: 'Cognizable Offences' },
    '41A': { bnss: 'Section 35(3) BNSS', title: 'Notice of Appearance Before Police (गिरफ्तारी से पूर्व नोटिस)', old: 'Section 41A CrPC', category: 'Arrest Safeguards', details: 'Offences punishable up to 7 years imprisonment require mandatory prior notice before arrest, subject to SP approval.', nature: 'Arrest Protection' },
    '438': { bnss: 'Section 482 BNSS', title: 'Anticipatory Bail (अग्रिम जमानत)', old: 'Section 438 CrPC', category: 'Bail & Liberty', details: 'Applied before Sessions Court or High Court in anticipation of arrest in non-bailable offences.', nature: 'Constitutional Liberty' },
    '437': { bnss: 'Section 480 BNSS', title: 'Bail in Non-Bailable Cases by Magistrate (जमानत नियम)', old: 'Section 437 CrPC', category: 'Bail & Liberty', details: 'Magisterial power to grant bail in non-bailable offences with special leniency for women, sick, or aged persons.', nature: 'Judicial Discretion' },
    '161': { bnss: 'Section 180 BNSS', title: 'Examination of Witnesses by Police (गवाहों के बयान)', old: 'Section 161 CrPC', category: 'Investigation', details: 'Audio-video electronic recording of witness statements now recognized as official procedural evidence.', nature: 'Evidence Recording' },
    '164': { bnss: 'Section 183 BNSS', title: 'Confessions & Statements Recorded by Magistrate (मजिस्ट्रेट के समक्ष बयान)', old: 'Section 164 CrPC', category: 'Judicial Evidence', details: 'Mandatory audio-video recording for sexual offenses statements before Judicial Magistrate.', nature: 'Direct Judicial Evidence' },
    '167': { bnss: 'Section 187 BNSS', title: 'Police Custody Remand Procedure (रिमांड प्रक्रिया)', old: 'Section 167 CrPC', category: 'Custody & Remand', details: 'Police custody remand of up to 15 days can now be granted in parts across initial 40 or 60 days of detention.', nature: 'Judicial Remand' },
    '173': { bnss: 'Section 193 BNSS', title: 'Police Final Report / Charge-Sheet (चार्जशीट समयसीमा)', old: 'Section 173(2) CrPC', category: 'Investigation Timeline', details: 'Investigation must be concluded within 90 days in heinous offences; 60 days in other cases.', nature: 'Trial Stage' },
    '125': { bnss: 'Section 144 BNSS', title: 'Maintenance for Wives, Children & Parents (भरण-पोषण)', old: 'Section 125 CrPC', category: 'Social Justice', details: 'Summary remedy for maintenance claims of wife, minor children, or elderly parents.', nature: 'Civil-Criminal Remedy' }
};

// C. Evidence Law: IEA to BSA Database (Bharatiya Sakshya Adhiniyam, 2023)
const BSA_DATABASE = {
    '65B': { bsa: 'Section 63 BSA', title: 'Admissibility of Electronic Records / Certificates (डिजिटल साक्ष्य)', old: 'Section 65B Indian Evidence Act', category: 'Digital Evidence', details: 'Electronic records (WhatsApp, emails, CCTV, server logs, mobile screenshots) have status of primary document. Certificate mandatory per Section 63(4).', significance: 'Cyber & Digital Law' },
    '25': { bsa: 'Section 23 BSA', title: 'Confession to Police Officer Inadmissible (पुलिस के सामने कबूलनामा)', old: 'Section 25 Indian Evidence Act', category: 'Confession Rules', details: 'Confession made to a police officer cannot be proved against accused, protecting against custodial coercion.', significance: 'Trial Protection' },
    '27': { bsa: 'Section 23(2) BSA', title: 'Discovery of Fact Pursuant to Information (बरामदगी पंचनामा)', old: 'Section 27 Indian Evidence Act', category: 'Recovery of Evidence', details: 'Only that portion of information which leads distinctly to discovery of a weapon/fact is admissible.', significance: 'Forensic Linkage' },
    '113B': { bsa: 'Section 118 BSA', title: 'Presumption as to Dowry Death (दहेज मृत्यु की उपधारणा)', old: 'Section 113B Evidence Act', category: 'Legal Presumptions', details: 'Court shall presume dowry death if harassment for dowry soon before death is established.', significance: 'Women Rights' },
    '114A': { bsa: 'Section 119 BSA', title: 'Presumption of Absence of Consent in Rape Cases (सहमति न होने की उपधारणा)', old: 'Section 114A Evidence Act', category: 'Sexual Offenses Evidence', details: 'Where sexual intercourse is proved and victim states lack of consent, court shall presume absence of consent.', significance: 'Victim Protection' }
};

// D. Civil Procedure Law: CPC Database (Code of Civil Procedure, 1908)
const CPC_DATABASE = {
    'Order 39': { cpc: 'Order 39 Rules 1 & 2 CPC', title: 'Temporary Injunction / Stay Order (अस्थाई स्थगनादेश)', subject: 'Property & Injunctions', requirements: '1. Prima facie case, 2. Irreparable injury, 3. Balance of convenience in favor of plaintiff.', remedy: 'Immediate stay on demolition, alienation, or eviction.' },
    'Section 89': { cpc: 'Section 89 CPC', title: 'Settlement through Lok Adalat & Mediation (सुलह एवं मध्यस्थता)', subject: 'Alternative Dispute Resolution', requirements: 'Consent or court referral for dispute resolution outside court trials.', remedy: 'Fast, fee-refunded amicable final settlement.' },
    'Order 7 Rule 11': { cpc: 'Order 7 Rule 11 CPC', title: 'Rejection of Plaint (मुकदमा खारिज करने की अर्जी)', subject: 'Civil Defense', requirements: 'Plaint discloses no cause of action, barred by limitation, or undervalued.', remedy: 'Dismissal of vexatious lawsuit before full trial.' },
    'Order 8 Rule 1': { cpc: 'Order 8 Rule 1 CPC', title: 'Written Statement Timeline (लिखित बयान की समयसीमा)', subject: 'Defendant Defense', requirements: 'Must file Written Statement within 30 days of summons service (extendable up to 90 days).', remedy: 'Preserves defendant right to dispute claims.' },
    'Section 9': { cpc: 'Section 9 CPC', title: 'Courts to Try All Civil Suits (सिविल अदालतों का अधिकार क्षेत्र)', subject: 'Jurisdiction', requirements: 'Civil courts have jurisdiction to try all suits of a civil nature unless expressly barred.', remedy: 'Foundation for property, tenancy, contract, and tort suits.' }
};

// E. Traffic Fine Database (Motor Vehicles Act)
const TRAFFIC_FINES = {
    'helmet': { section: 'Section 194D MVA', penalty: '₹1,000 + 3 Months License Suspension', note: 'Both rider and pillion must wear BIS-certified helmets.' },
    'seatbelt': { section: 'Section 194B MVA', penalty: '₹1,000 fine', note: 'Applicable for all front and rear seat passengers.' },
    'speeding': { section: 'Section 183 MVA', penalty: '₹1,000 - ₹2,000 (LMV) / ₹2,000 - ₹4,000 (HMV)', note: 'Repeat offence may lead to license impounding.' },
    'redlight': { section: 'Section 184 MVA', penalty: '₹1,000 - ₹5,000 or 6 Months - 1 Year Jail', note: 'Classified under dangerous driving category.' },
    'drinkdrive': { section: 'Section 185 MVA', penalty: '₹10,000 fine or up to 6 months jail (1st Offense)', note: 'Blood alcohol limit is 30mg per 100ml. Second offense: ₹15,000 or 2 years jail.' },
    'license': { section: 'Section 181 MVA', penalty: '₹5,000 fine + Vehicle Impounding', note: 'Driving without valid license is non-compoundable in several states.' },
    'insurance': { section: 'Section 196 MVA', penalty: '₹2,000 fine or up to 3 months jail (1st Offense)', note: 'Second offense: ₹4,000 fine. Third-party insurance mandatory.' },
    'phone': { section: 'Section 184(c) MVA', penalty: '₹1,000 - ₹5,000 fine', note: 'Handheld devices strictly prohibited while driving.' },
    'emergency': { section: 'Section 194E MVA', penalty: '₹10,000 fine + 6 months jail', note: 'Failing to give way to ambulance, fire service, or emergency vehicles.' }
};

// --- 3. PERSISTENT CONVERSATION STORE (IndexedDB + Dual Storage) ---
const ConversationStore = {
    dbName: 'nyayi_legal_db',
    dbVersion: 2,
    storeName: 'consultations',
    db: null,

    async init() {
        return new Promise((resolve) => {
            if (!window.indexedDB) {
                console.warn('IndexedDB not supported, falling back to localStorage');
                resolve(false);
                return;
            }
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onerror = () => resolve(false);
            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(true);
            };
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('updatedAt', 'updatedAt', { unique: false });
                }
            };
        });
    },

    async getAll() {
        if (!this.db) return this.getAllFromStorage();
        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const req = store.getAll();
                req.onsuccess = () => {
                    const list = req.result || [];
                    list.sort((a, b) => b.updatedAt - a.updatedAt);
                    resolve(list);
                };
                req.onerror = () => resolve(this.getAllFromStorage());
            } catch (err) {
                resolve(this.getAllFromStorage());
            }
        });
    },

    async get(id) {
        if (!this.db) return this.getFromStorage(id);
        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const req = store.get(id);
                req.onsuccess = () => resolve(req.result || this.getFromStorage(id));
                req.onerror = () => resolve(this.getFromStorage(id));
            } catch (err) {
                resolve(this.getFromStorage(id));
            }
        });
    },

    async save(chat) {
        this.saveToStorage(chat);
        if (!this.db) return true;
        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                store.put(chat);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            } catch (err) {
                resolve(false);
            }
        });
    },

    async delete(id) {
        this.deleteFromStorage(id);
        if (!this.db) return true;
        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                store.delete(id);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            } catch (err) {
                resolve(false);
            }
        });
    },

    getAllFromStorage() {
        try {
            const raw = localStorage.getItem('nyayi_conversations_meta');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    getFromStorage(id) {
        try {
            const raw = localStorage.getItem('nyayi_chat_' + id);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    saveToStorage(chat) {
        try {
            localStorage.setItem('nyayi_chat_' + chat.id, JSON.stringify(chat));
            const list = this.getAllFromStorage().filter(c => c.id !== chat.id);
            list.unshift({
                id: chat.id,
                title: chat.title,
                preview: chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].text.slice(0, 70) : '',
                updatedAt: chat.updatedAt,
                createdAt: chat.createdAt
            });
            localStorage.setItem('nyayi_conversations_meta', JSON.stringify(list));
        } catch (e) {}
    },

    deleteFromStorage(id) {
        try {
            localStorage.removeItem('nyayi_chat_' + id);
            const list = this.getAllFromStorage().filter(c => c.id !== id);
            localStorage.setItem('nyayi_conversations_meta', JSON.stringify(list));
        } catch (e) {}
    },

    async clearAll() {
        try {
            localStorage.removeItem('nyayi_conversations_meta');
            const keys = Object.keys(localStorage);
            keys.forEach(k => { if (k.startsWith('nyayi_chat_')) localStorage.removeItem(k); });
        } catch (e) {}
        if (!this.db) return true;
        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                store.clear();
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            } catch (err) {
                resolve(false);
            }
        });
    }
};

// --- 4. CONTEXT MEMORY & TITLE GENERATOR ---
const MemoryManager = {
    generateMeaningfulTitle(query) {
        if (!query) return 'Legal Consultation';
        const q = query.trim();
        const lower = q.toLowerCase();

        if (lower.includes('tourist') || lower.includes('foreigner') || lower.includes('foreign')) {
            return 'Foreign Tourist Rights';
        }
        if (lower.includes('salary') || lower.includes('wages') || lower.includes('employer') || lower.includes('labour')) {
            return 'Salary & Employment Rights';
        }
        if (lower.includes('consumer') || lower.includes('defective') || lower.includes('refund')) {
            return 'Consumer Protection Claim';
        }
        if (lower.includes('cyber') || lower.includes('fraud') || lower.includes('1930') || lower.includes('scam')) {
            return 'Cyber Fraud Recovery';
        }
        if (lower.includes('fir') || lower.includes('police') || lower.includes('thana')) {
            return 'Police FIR Guidance';
        }
        if (lower.includes('tenant') || lower.includes('rent') || lower.includes('landlord') || lower.includes('deposit')) {
            return 'Tenancy & Deposit Dispute';
        }
        if (lower.includes('property') || lower.includes('stay') || lower.includes('order 39')) {
            return 'Property Dispute & Injunction';
        }
        if (lower.includes('bail') || lower.includes('arrest') || lower.includes('438')) {
            return 'Bail & Arrest Safeguards';
        }
        if (lower.includes('cheque') || lower.includes('138') || lower.includes('bounce')) {
            return 'Section 138 Cheque Notice';
        }
        if (lower.includes('challan') || lower.includes('traffic') || lower.includes('fine')) {
            return 'Traffic Fine & Challan';
        }
        if (lower.includes('divorce') || lower.includes('maintenance') || lower.includes('125') || lower.includes('144')) {
            return 'Family Law & Maintenance';
        }

        let clean = q.replace(/^[\s,?.!]+|[\s,?.!]+$/g, '');
        const firstClause = clean.split(/[,?.;\n]/)[0].trim();
        if (firstClause.length > 5 && firstClause.length <= 36) {
            return firstClause.charAt(0).toUpperCase() + firstClause.slice(1);
        }
        return clean.slice(0, 32).trim() + (clean.length > 32 ? '...' : '');
    },

    getContextPayload(messages, maxTurns = 8) {
        if (!Array.isArray(messages) || messages.length === 0) return [];
        const relevant = messages.slice(-maxTurns);
        return relevant.map(m => ({
            role: m.role === 'ai' ? 'assistant' : 'user',
            content: this.cleanContent(m.text || '')
        })).filter(m => m.content.length > 0);
    },

    cleanContent(text) {
        if (!text) return '';
        return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 800);
    }
};

// --- 5. STRUCTURED LEGAL RESPONSE PARSER & MARKDOWN RENDERER ---
const MessageRenderer = {
    escapeHtml(text) {
        if (!text) return '';
        return text.replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
    },

    parseMarkdownTables(text) {
        const tableRegex = new RegExp('((?:^[ \\t]*\\|[^\\r\\n]+\\|[ \\t]*(?:\\r?\\n|$))+)', 'gm');
        return text.replace(tableRegex, (match) => {
            const lines = match.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.startsWith('|') && l.endsWith('|'));
            if (lines.length < 2) return match;

            const headerLine = lines[0];
            const separatorLine = lines[1];
            if (!separatorLine.includes('---') && !separatorLine.includes('-|-')) return match;

            const parseRow = (line) => line.slice(1, -1).split('|').map(c => c.trim());
            const headers = parseRow(headerLine);
            const dataRows = lines.slice(2).map(parseRow);

            let html = '<div class="table-wrapper"><table class="nyayi-table"><thead><tr>';
            headers.forEach(h => {
                html += '<th>' + h + '</th>';
            });
            html += '</tr></thead><tbody>';
            dataRows.forEach(row => {
                html += '<tr>';
                row.forEach(cell => {
                    html += '<td>' + (cell || '') + '</td>';
                });
                html += '</tr>';
            });
            html += '</tbody></table></div>';
            return html;
        });
    },

    formatLegalResponse(rawText) {
        if (!rawText) return '';
        let text = rawText;

        // Parse markdown tables first (so table pipes aren't disrupted)
        text = this.parseMarkdownTables(text);

        // Bold & Headings
        text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // External links with security attributes
        text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, 
            '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--nyayi-primary); font-weight:600;">$1 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px;"></i></a>'
        );

        // Lists
        text = text.replace(/^\* (.*$)/gim, '<li>$1</li>');
        text = text.replace(/^- (.*$)/gim, '<li>$1</li>');
        text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // Line breaks (preserving existing HTML elements)
        text = text.replace(/\n/g, '<br>');
        text = text.replace(/<br><\/li>/g, '</li>');
        text = text.replace(/<br><li>/g, '<li>');
        text = text.replace(/<br><div class="table-wrapper">/g, '<div class="table-wrapper">');
        text = text.replace(/<\/div><br>/g, '</div>');

        // Section: Short Answer / Summary Box
        text = text.replace(/<b>(Short Answer|संक्षिप्त उत्तर):<\/b>(.*?)(?=(<b>|<br><br>|$))/i,
            '<div class="legal-summary-box"><b><i class="fa-solid fa-scale-balanced" style="color:var(--nyayi-primary); margin-right:6px;"></i> Short Answer:</b>$2</div>'
        );

        // Section: What the Law Says
        text = text.replace(/<b>(What the Law Says|कानूनी प्रावधान|Applicable Indian Laws):<\/b>/gi,
            '<div style="margin-top:14px; font-weight:700; color:var(--nyayi-text);"><i class="fa-solid fa-book-bookmark" style="color:var(--nyayi-primary); margin-right:6px;"></i> What the Law Says:</div>'
        );

        // Section: What You Should Do / Action Steps
        text = text.replace(/<b>(What You Should Do|कार्रवाई योजना|Step-by-Step Action Plan):<\/b>/gi,
            '<div style="margin-top:14px; font-weight:700; color:var(--nyayi-text);"><i class="fa-solid fa-list-check" style="color:var(--nyayi-primary); margin-right:6px;"></i> What You Should Do:</div>'
        );

        // Section: Important Points / Cautions
        text = text.replace(/<b>(Important Points|Important Precaution|महत्वपूर्ण बातें):<\/b>/gi,
            '<div style="margin-top:14px; font-weight:700; color:var(--nyayi-warning);"><i class="fa-solid fa-triangle-exclamation" style="margin-right:6px;"></i> Important Points:</div>'
        );

        // Section: Legal References block
        text = text.replace(/<b>(Legal References|कानूनी संदर्भ):<\/b>/gi,
            '<div class="legal-references-header"><i class="fa-solid fa-scale-balanced"></i> Legal References & Statutes</div>'
        );

        // Interactive Statute Pills
        text = text.replace(/\b(BNS Section [0-9]+(\([0-9]+\))?|BNS [0-9]+|Section [0-9]+(\([0-9]+\))? BNS)/gi, 
            '<span class="statute-pill" onclick="quickConvert(\'$1\')"><i class="fa-solid fa-scale-balanced"></i> $1</span>'
        );
        text = text.replace(/\b(BNSS Section [0-9]+(\([0-9]+\))?|BNSS [0-9]+|Section [0-9]+(\([0-9]+\))? BNSS)/gi, 
            '<span class="statute-pill" onclick="quickConvert(\'$1\')"><i class="fa-solid fa-list-check"></i> $1</span>'
        );
        text = text.replace(/\b(BSA Section [0-9]+|Section [0-9]+ BSA|Section 65B|Section 63 BSA)/gi, 
            '<span class="statute-pill" onclick="quickConvert(\'$1\')"><i class="fa-solid fa-file-shield"></i> $1</span>'
        );
        text = text.replace(/\b(Order 39|Order 7 Rule 11|Order 8 Rule 1|Section 89 CPC)/gi, 
            '<span class="statute-pill" onclick="quickConvert(\'$1\')"><i class="fa-solid fa-building-shield"></i> $1</span>'
        );

        // Append subtle statutory reference note & disclaimer
        text += '<div class="legal-disclaimer-note"><i class="fa-solid fa-circle-info"></i> Nyayi provides general legal information, not a substitute for advice from a qualified lawyer.</div>';

        return text;
    },

    generateFollowUpQuestions(text) {
        const questions = [];
        const lower = text.toLowerCase();

        if (lower.includes('tourist') || lower.includes('foreigner')) {
            questions.push('What should a tourist do if detained or harassed?');
            questions.push('Which embassy or helpline assists foreign citizens?');
        } else if (lower.includes('salary') || lower.includes('employer') || lower.includes('wages')) {
            questions.push('What legal notice can I send for unpaid salary?');
            questions.push('How to file a complaint before Labour Commissioner?');
        } else if (lower.includes('cheating') || lower.includes('fraud') || lower.includes('420') || lower.includes('318') || lower.includes('1930')) {
            questions.push('Bank me transaction chargeback request kaise karein?');
            questions.push('Cyber Crime Helpline 1930 complaint follow-up process kya hai?');
        } else if (lower.includes('fir') || lower.includes('police') || lower.includes('154') || lower.includes('173')) {
            questions.push('Zero FIR darj karwane ka exact step-by-step procedure batao.');
            questions.push('Agar police FIR na likhe toh Magistrate ko complaint kaise karein?');
        } else if (lower.includes('tenant') || lower.includes('rent') || lower.includes('deposit') || lower.includes('landlord')) {
            questions.push('What legal steps can I take to recover my security deposit?');
            questions.push('Landlord ko formal demand notice kaise bhejein?');
        } else if (lower.includes('cheque') || lower.includes('138') || lower.includes('bounce')) {
            questions.push('Section 138 notice bhejne ke baad court me complaint kab darj hoti hai?');
        } else if (lower.includes('bail') || lower.includes('arrest') || lower.includes('438')) {
            questions.push('Anticipatory bail petition me kaunse documents anivarya hain?');
        } else {
            // General conversational follow-up
            if (!lower.includes('what you should do') && !lower.includes('step-by-step')) {
                questions.push('What steps should I take next?');
            }
        }
        return questions.slice(0, 2);
    }
};

// --- 6. INITIALIZATION & APP LIFECYCLE ---
document.addEventListener('DOMContentLoaded', async () => {
    await ConversationStore.init();
    await renderHistoryList();

    const savedTheme = localStorage.getItem('nyayi_theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        const icon = document.getElementById('themeIcon');
        if (icon) icon.className = 'fa-solid fa-sun';
    }

    const langSelect = document.getElementById('langSelect');
    if (langSelect) langSelect.value = aiLanguage;
    const settingsAILang = document.getElementById('settingsAILang');
    if (settingsAILang) settingsAILang.value = aiLanguage;

    // Set voice language according to stored aiLanguage
    voiceLang = (aiLanguage === 'English') ? 'en-IN' : 'hi-IN';
    const voiceBtn = document.getElementById('voiceLangBtn');
    if (voiceBtn) {
        voiceBtn.innerText = voiceLang === 'hi-IN' ? '🌐 Hindi (हि)' : '🌐 English (En)';
    }

    updateWelcomeUserName();

    const input = document.getElementById('userInput');
    if (input) {
        autoGrowTextarea(input);
        input.focus();
    }

    // Keyboard handling & mobile viewport resize
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            const box = document.getElementById('chat-box');
            if (box && currentChatMessages.length > 0) {
                box.scrollTop = box.scrollHeight;
            }
        });
    }

    // Touch swipe for mobile sidebar drawer
    let touchStartX = 0;
    let touchEndX = 0;
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchEndX - touchStartX;
        if (diff > 80 && touchStartX < 40) toggleSidebar(true);
        else if (diff < -80) toggleSidebar(false);
    }, { passive: true });
});

function updateWelcomeUserName() {
    const el = document.getElementById('welcomeUserName');
    if (el) el.innerText = user;
}

// --- 7. EMPTY / WELCOME STATE ---
function renderEmptyState() {
    const box = document.getElementById('chat-box');
    if (!box) return;

    box.innerHTML = `
        <div class="welcome-hero" id="welcomeSection">
            <div class="welcome-ai-emblem">
                <i class="fa-solid fa-scale-balanced"></i>
            </div>
            <h1 class="welcome-title">Namaste, <span id="welcomeUserName">${MessageRenderer.escapeHtml(user)}</span> 👋</h1>
            <h2 class="welcome-subtitle">How can Nyayi help you today?</h2>
            <p class="welcome-tagline">Understand Indian law, rights and procedures in simple language.</p>
            
            <!-- 4 Lightweight Quick Suggestions -->
            <div class="domain-cards-grid">
                <div class="domain-card" onclick="askSuggestion('Mera online financial cyber fraud ho gaya hai, paise wapas kaise paayein? 1930 helpline kaise kaam karti hai?')">
                    <div class="domain-card-header">
                        <span class="domain-card-title"><i class="fa-solid fa-shield-halved"></i> Cyber Fraud</span>
                    </div>
                    <p class="domain-card-desc">Recover money & report fraud</p>
                </div>

                <div class="domain-card" onclick="askSuggestion('Police station me FIR darj karwane ka process kya hai aur agar police FIR likhne se mana kare toh kya adhikar hain?')">
                    <div class="domain-card-header">
                        <span class="domain-card-title"><i class="fa-solid fa-file-circle-check"></i> Police / FIR</span>
                    </div>
                    <p class="domain-card-desc">FIR process & rights</p>
                </div>

                <div class="domain-card" onclick="askSuggestion('Property ya tenancy dispute me legal rights aur civil stay order (Order 39) ke niyam samjhao.')">
                    <div class="domain-card-header">
                        <span class="domain-card-title"><i class="fa-solid fa-house-chimney-user"></i> Property</span>
                    </div>
                    <p class="domain-card-desc">Property dispute guidance</p>
                </div>

                <div class="domain-card" onclick="askSuggestion('IPC Section 420, 302, 376 aur nayi BNS provisions me kya antar hai? Kaunsi dhara lagu hogi?')">
                    <div class="domain-card-header">
                        <span class="domain-card-title"><i class="fa-solid fa-scale-balanced"></i> BNS / IPC</span>
                    </div>
                    <p class="domain-card-desc">Compare provisions</p>
                </div>
            </div>
        </div>
    `;
    box.scrollTop = 0;
}

const SUGGESTION_QUERIES = {
    cyber: {
        en: "I have been a victim of online financial cyber fraud. How can I recover my money and how does the 1930 helpline work?",
        hi: "Mera online financial cyber fraud ho gaya hai, paise wapas kaise paayein? 1930 helpline kaise kaam karti hai?"
    },
    fir: {
        en: "What is the complete procedure for lodging an FIR at a police station, and what are my legal rights if police refuse to register it?",
        hi: "Police station me FIR darj karwane ka process kya hai aur agar police FIR likhne se mana kare toh kya adhikar hain?"
    },
    property: {
        en: "Explain legal rights and civil temporary stay order procedure (Order 39 Rules 1 & 2 CPC) in property and tenancy disputes.",
        hi: "Property ya tenancy dispute me legal rights aur civil stay order (Order 39) ke niyam samjhao."
    },
    bns: {
        en: "What are the differences between IPC Sections 420, 302, 376 and the new Bharatiya Nyaya Sanhita (BNS 2023) provisions?",
        hi: "IPC Section 420, 302, 376 aur nayi BNS provisions me kya antar hai? Kaunsi dhara lagu hogi?"
    }
};

function askSuggestion(keyOrText) {
    let text = keyOrText;
    if (SUGGESTION_QUERIES[keyOrText]) {
        text = (aiLanguage === 'English') 
            ? SUGGESTION_QUERIES[keyOrText].en 
            : SUGGESTION_QUERIES[keyOrText].hi;
    }
    const input = document.getElementById('userInput');
    if (input) {
        input.value = text;
        autoGrowTextarea(input);
        sendMessage();
    }
}

// --- 8. MESSAGE THREAD & RENDERING ---
function appendMessage(text, role, skipScroll = false) {
    const box = document.getElementById('chat-box');
    if (!box) return null;

    // Immediately remove welcome section upon first message
    const hero = box.querySelector('.welcome-hero');
    if (hero) hero.remove();

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role === 'user' ? 'user-msg' : 'ai-msg'}`;

    const bodyWrapper = document.createElement('div');
    bodyWrapper.className = 'msg-body-wrapper';

    if (role === 'ai') {
        const headerDiv = document.createElement('div');
        headerDiv.className = 'msg-header';
        headerDiv.innerHTML = '<i class="fa-solid fa-scale-balanced"></i> <span>Nyayi Legal Response</span>';
        bodyWrapper.appendChild(headerDiv);
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'msg-content';
    
    if (role === 'user') {
        contentDiv.innerHTML = MessageRenderer.escapeHtml(text).replace(/\n/g, '<br>');
    } else {
        contentDiv.innerHTML = MessageRenderer.formatLegalResponse(text);
    }
    bodyWrapper.appendChild(contentDiv);

    // AI Message Tools & Follow-up Suggestions
    if (role === 'ai') {
        const cleanForAudio = text.replace(/<[^>]*>/g, '').replace(/[\[\]\*#_]/g, '');
        
        // Follow-up Suggestions
        const followups = MessageRenderer.generateFollowUpQuestions(text);
        if (followups.length > 0) {
            const followupWrap = document.createElement('div');
            followupWrap.className = 'followup-suggestions';
            followups.forEach(q => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'followup-pill';
                btn.innerHTML = `<i class="fa-solid fa-reply"></i> ${MessageRenderer.escapeHtml(q)}`;
                btn.onclick = () => askSuggestion(q);
                followupWrap.appendChild(btn);
            });
            contentDiv.appendChild(followupWrap);
        }

        // Action Toolbar: Listen, Copy, Share, Regenerate
        const toolsDiv = document.createElement('div');
        toolsDiv.className = 'msg-tools';
        toolsDiv.innerHTML = `
            <button type="button" class="tool-pill" onclick="speakMessage(this, decodeURIComponent('${encodeURIComponent(cleanForAudio)}'))" title="Listen to spoken response">
                <i class="fa-solid fa-volume-high"></i> Listen
            </button>
            <button type="button" class="tool-pill" onclick="copyMessageText(this, decodeURIComponent('${encodeURIComponent(cleanForAudio)}'))" title="Copy response text">
                <i class="fa-regular fa-copy"></i> Copy
            </button>
            <button type="button" class="tool-pill" onclick="shareResponse(decodeURIComponent('${encodeURIComponent(cleanForAudio)}'))" title="Share legal guidance">
                <i class="fa-solid fa-share-nodes"></i> Share
            </button>
            <button type="button" class="tool-pill" onclick="regenerateLastResponse()" title="Regenerate this answer">
                <i class="fa-solid fa-arrows-rotate"></i> Regenerate
            </button>
        `;
        bodyWrapper.appendChild(toolsDiv);
    }

    msgDiv.appendChild(bodyWrapper);
    box.appendChild(msgDiv);

    if (!skipScroll) {
        if (role === 'ai') {
            setTimeout(() => {
                msgDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
        } else {
            msgDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }

    return msgDiv;
}

// --- 9. LOADING & ERROR STATES (MINIMAL, NO BOUNCING) ---
function showThinkingIndicator() {
    removeThinkingIndicator();
    const box = document.getElementById('chat-box');
    if (!box) return;

    const hero = box.querySelector('.welcome-hero');
    if (hero) hero.remove();

    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'message ai-msg';
    indicator.innerHTML = `
        <div class="msg-body-wrapper">
            <div class="minimal-loading-state">
                <div class="minimal-spinner"></div>
                <span>Nyayi is preparing your answer...</span>
            </div>
        </div>
    `;
    box.appendChild(indicator);
    indicator.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function removeThinkingIndicator() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
}

function showChatError(message, canRetry = true) {
    removeThinkingIndicator();
    const box = document.getElementById('chat-box');
    if (!box) return;

    const errDiv = document.createElement('div');
    errDiv.className = 'message ai-msg';
    errDiv.innerHTML = `
        <div class="msg-body-wrapper">
            <div class="chat-error-card">
                <div class="chat-error-info">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <span>${MessageRenderer.escapeHtml(message || "Something went wrong. Nyayi couldn't complete that response.")}</span>
                </div>
                ${canRetry ? '<button type="button" class="retry-btn" onclick="regenerateLastResponse()">Try Again</button>' : ''}
            </div>
        </div>
    `;
    box.appendChild(errDiv);
    errDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

// --- 10. CHAT SEND & API SERVICE ---
async function sendMessage() {
    const input = document.getElementById('userInput');
    if (!input || isGenerating) return;

    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    autoGrowTextarea(input);

    closeComposerTools();

    // Create session if not active
    if (!activeChatId) {
        activeChatId = 'chat_' + Date.now();
        const initialTitle = MemoryManager.generateMeaningfulTitle(message);
        const newChat = {
            id: activeChatId,
            title: initialTitle,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: []
        };
        await ConversationStore.save(newChat);
    }

    // Append User Message
    appendMessage(message, 'user');
    currentChatMessages.push({ role: 'user', text: message, timestamp: Date.now() });

    // Update conversation in storage
    const chatData = await ConversationStore.get(activeChatId) || {
        id: activeChatId,
        title: MemoryManager.generateMeaningfulTitle(message),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: []
    };
    chatData.messages = currentChatMessages;
    chatData.updatedAt = Date.now();
    await ConversationStore.save(chatData);
    await renderHistoryList();

    // Setup Generation State & AbortController
    isGenerating = true;
    updateSendButtonState(true);
    showThinkingIndicator();

    activeAbortController = new AbortController();
    const historyPayload = MemoryManager.getContextPayload(currentChatMessages.slice(0, -1), 8);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: activeAbortController.signal,
            body: JSON.stringify({
                message: message,
                category: "Indian Legal Advisory",
                language: aiLanguage,
                history: historyPayload
            })
        });

        removeThinkingIndicator();

        if (!response.ok) {
            throw new Error('API request failed with status ' + response.status);
        }

        const data = await response.json();
        const replyText = data.reply || "Aapke prashna par kanooni jaankari taiyar nahi ho saki. Kripya punah prayas karein.";

        appendMessage(replyText, 'ai');
        currentChatMessages.push({ role: 'ai', text: replyText, timestamp: Date.now() });

        chatData.messages = currentChatMessages;
        chatData.updatedAt = Date.now();
        await ConversationStore.save(chatData);

        if (isVoiceQuery && autoSpeak && !isVoiceMuted) {
            const cleanText = replyText.replace(/<[^>]*>/g, '').replace(/[\[\]\*#_]/g, '');
            playTTS(cleanText);
        }
        isVoiceQuery = false;

    } catch (err) {
        removeThinkingIndicator();
        if (err.name === 'AbortError') {
            console.log('Response generation cancelled by citizen.');
        } else {
            console.error('Chat API Error:', err);
            showChatError("Nyayi couldn't complete that response. Please check your connection and try again.");
        }
    } finally {
        isGenerating = false;
        activeAbortController = null;
        updateSendButtonState(false);
    }
}

function stopGeneration() {
    if (activeAbortController) {
        activeAbortController.abort();
        activeAbortController = null;
    }
    isGenerating = false;
    removeThinkingIndicator();
    updateSendButtonState(false);
}

function handleSendOrStop() {
    if (isGenerating) {
        stopGeneration();
    } else {
        sendMessage();
    }
}

function updateSendButtonState(generating) {
    const btn = document.getElementById('sendBtn');
    const icon = document.getElementById('sendBtnIcon');
    if (!btn || !icon) return;

    if (generating) {
        btn.classList.add('stop');
        btn.title = "Stop Generating";
        icon.className = "fa-solid fa-stop";
    } else {
        btn.classList.remove('stop');
        btn.title = "Send Message";
        icon.className = "fa-solid fa-paper-plane";
    }
}

function regenerateLastResponse() {
    if (isGenerating || currentChatMessages.length === 0) return;

    let lastUserMessage = null;
    for (let i = currentChatMessages.length - 1; i >= 0; i--) {
        if (currentChatMessages[i].role === 'user') {
            lastUserMessage = currentChatMessages[i].text;
            break;
        }
    }

    if (!lastUserMessage) return;

    const input = document.getElementById('userInput');
    if (input) {
        input.value = lastUserMessage;
        sendMessage();
    }
}

function handleInputKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function autoGrowTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
}

// --- 11. DATE-GROUPED HISTORY SYSTEM ---
async function renderHistoryList() {
    const listContainer = document.getElementById('historyList');
    if (!listContainer) return;

    const consultations = await ConversationStore.getAll();
    if (consultations.length === 0) {
        listContainer.innerHTML = '<div style="font-size:12px; color:var(--nyayi-text-muted); padding:10px 8px; text-align:center;">No previous consultations</div>';
        return;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const prev7DaysStart = todayStart - (7 * 86400000);

    const groups = {
        today: [],
        yesterday: [],
        prev7: [],
        older: []
    };

    consultations.forEach(c => {
        const time = c.updatedAt || c.createdAt || Date.now();
        if (time >= todayStart) groups.today.push(c);
        else if (time >= yesterdayStart) groups.yesterday.push(c);
        else if (time >= prev7DaysStart) groups.prev7.push(c);
        else groups.older.push(c);
    });

    let html = '';

    const renderGroup = (title, items) => {
        if (items.length === 0) return '';
        let out = `<div class="history-group-header">${title}</div>`;
        items.forEach(c => {
            const isActive = c.id === activeChatId ? ' active' : '';
            const titleEsc = MessageRenderer.escapeHtml(c.title || 'Legal Consultation');
            out += `
                <div class="history-item${isActive}" onclick="openChat('${c.id}')">
                    <span class="history-item-title" title="${titleEsc}">${titleEsc}</span>
                    <div class="history-item-actions">
                        <button type="button" class="history-action-btn" onclick="event.stopPropagation(); renameChat('${c.id}')" title="Rename"><i class="fa-solid fa-pen"></i></button>
                        <button type="button" class="history-action-btn delete" onclick="event.stopPropagation(); deleteChat('${c.id}')" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
            `;
        });
        return out;
    };

    html += renderGroup('Today', groups.today);
    html += renderGroup('Yesterday', groups.yesterday);
    html += renderGroup('Previous 7 Days', groups.prev7);
    html += renderGroup('Older', groups.older);

    listContainer.innerHTML = html;
}

async function filterHistory(query) {
    const listContainer = document.getElementById('historyList');
    if (!listContainer) return;

    if (!query || !query.trim()) {
        renderHistoryList();
        return;
    }

    const q = query.toLowerCase().trim();
    const consultations = await ConversationStore.getAll();
    const filtered = consultations.filter(c => (c.title || '').toLowerCase().includes(q));

    if (filtered.length === 0) {
        listContainer.innerHTML = '<div style="font-size:12px; color:var(--nyayi-text-muted); padding:10px 8px; text-align:center;">No matching consultations</div>';
        return;
    }

    let html = '<div class="history-group-header">Search Results</div>';
    filtered.forEach(c => {
        const isActive = c.id === activeChatId ? ' active' : '';
        const titleEsc = MessageRenderer.escapeHtml(c.title || 'Legal Consultation');
        html += `
            <div class="history-item${isActive}" onclick="openChat('${c.id}')">
                <span class="history-item-title" title="${titleEsc}">${titleEsc}</span>
                <div class="history-item-actions">
                    <button type="button" class="history-action-btn delete" onclick="event.stopPropagation(); deleteChat('${c.id}')" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `;
    });
    listContainer.innerHTML = html;
}

async function openChat(id) {
    const chat = await ConversationStore.get(id);
    if (!chat) return;

    activeChatId = chat.id;
    currentChatMessages = chat.messages || [];

    const box = document.getElementById('chat-box');
    if (box) {
        box.innerHTML = '';
        if (currentChatMessages.length === 0) {
            renderEmptyState();
        } else {
            currentChatMessages.forEach(m => {
                appendMessage(m.text, m.role, true);
            });
            box.scrollTop = box.scrollHeight;
        }
    }

    await renderHistoryList();
    toggleSidebar(false);
}

async function renameChat(id) {
    const chat = await ConversationStore.get(id);
    if (!chat) return;

    const newTitle = prompt("Enter consultation title:", chat.title || "Legal Consultation");
    if (newTitle && newTitle.trim()) {
        chat.title = newTitle.trim();
        chat.updatedAt = Date.now();
        await ConversationStore.save(chat);
        await renderHistoryList();
    }
}

async function deleteChat(id) {
    if (!confirm("Are you sure you want to delete this legal consultation?")) return;
    await ConversationStore.delete(id);
    if (activeChatId === id) {
        startNewChat();
    } else {
        await renderHistoryList();
    }
}

function startNewChat() {
    activeChatId = null;
    currentChatMessages = [];
    renderEmptyState();
    renderHistoryList();
    toggleSidebar(false);
    const input = document.getElementById('userInput');
    if (input) {
        input.value = '';
        autoGrowTextarea(input);
        input.focus();
    }
}

async function clearHistory() {
    if (!confirm("Clear all consultation history on this device?")) return;
    await ConversationStore.clearAll();
    startNewChat();
}

async function clearAllLocalData() {
    if (!confirm("Reset all local settings and conversation history? This cannot be undone.")) return;
    await ConversationStore.clearAll();
    localStorage.removeItem('nyayaUser');
    localStorage.removeItem('nyayaLanguage');
    localStorage.removeItem('nyayi_theme');
    location.reload();
}

// --- 12. NAVIGATION & WORKSPACE CONTROLS ---
function toggleSidebar(forceState) {
    const sidebar = document.getElementById('sidebar-container');
    const backdrop = document.getElementById('overlayBackdrop');
    if (!sidebar) return;

    const shouldOpen = typeof forceState === 'boolean' ? forceState : !sidebar.classList.contains('active');
    if (shouldOpen) {
        sidebar.classList.add('active');
        if (backdrop) backdrop.classList.add('active');
    } else {
        sidebar.classList.remove('active');
        if (backdrop) backdrop.classList.remove('active');
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('nyayi_theme', isLight ? 'light' : 'dark');
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.className = isLight ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
}

function changeAILanguage(lang) {
    aiLanguage = lang;
    localStorage.setItem('nyayaLanguage', lang);
    const sel = document.getElementById('langSelect');
    if (sel) sel.value = lang;
    const settingsSel = document.getElementById('settingsAILang');
    if (settingsSel) settingsSel.value = lang;

    // Synchronize voice recognition language
    voiceLang = (lang === 'English') ? 'en-IN' : 'hi-IN';
    const voiceBtn = document.getElementById('voiceLangBtn');
    if (voiceBtn) {
        voiceBtn.innerText = voiceLang === 'hi-IN' ? '🌐 Hindi (हि)' : '🌐 English (En)';
    }
}

function switchBottomNav(tab) {
    document.querySelectorAll('.bottom-nav-item').forEach(item => item.classList.remove('active'));
    
    if (tab === 'chat') {
        const item = document.querySelector('.bottom-nav-item:nth-child(1)');
        if (item) item.classList.add('active');
        startNewChat();
    } else if (tab === 'tools') {
        const item = document.querySelector('.bottom-nav-item:nth-child(2)');
        if (item) item.classList.add('active');
        toggleComposerTools();
    } else if (tab === 'voice') {
        const item = document.querySelector('.bottom-nav-item:nth-child(3)');
        if (item) item.classList.add('active');
        openVoiceAssistant();
    } else if (tab === 'history') {
        const item = document.querySelector('.bottom-nav-item:nth-child(4)');
        if (item) item.classList.add('active');
        toggleSidebar(true);
    } else if (tab === 'sos') {
        triggerSOS();
    }
}

// [+] Quick Tools Popup Drawer
function toggleComposerTools() {
    const popup = document.getElementById('composerToolsPopup');
    if (popup) popup.classList.toggle('active');
}

function closeComposerTools() {
    const popup = document.getElementById('composerToolsPopup');
    if (popup) popup.classList.remove('active');
}

// --- 13. LEGAL TOOLS & MODAL DISPATCHER ---
function openTool(toolId) {
    closeAllModals();
    closeComposerTools();
    toggleSidebar(false);
    
    let modalId = 'modal-' + toolId;
    if (toolId === 'settings') {
        modalId = 'settingsModal';
        const nameInput = document.getElementById('settingsUserName');
        if (nameInput) nameInput.value = user;
        const langSel = document.getElementById('settingsAILang');
        if (langSel) langSel.value = aiLanguage;
    }

    const target = document.getElementById(modalId);
    if (target) {
        target.classList.add('active');
        const input = target.querySelector('input, textarea');
        if (input) setTimeout(() => input.focus(), 100);
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

// Save Settings
function saveSettings() {
    const nameInput = document.getElementById('settingsUserName');
    const langSelect = document.getElementById('settingsAILang');

    if (nameInput && nameInput.value.trim()) {
        user = nameInput.value.trim();
        localStorage.setItem('nyayaUser', user);
        updateWelcomeUserName();
    }

    if (langSelect) {
        changeAILanguage(langSelect.value);
    }

    closeAllModals();
}

// --- 14. TOOL 1-8 LOGIC & COMPUTATIONS ---

// Tool 5: BNS / Statute Converter
function convertSection() {
    const input = document.getElementById('bnsInput').value.trim().toUpperCase();
    const resultDiv = document.getElementById('bnsResult');
    if (!resultDiv) return;

    if (!input) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<span style="color:var(--nyayi-danger);">Kripya koi Dhara (Section) number likhein.</span>';
        return;
    }

    const cleanInput = input.replace(/^(IPC|BNS|BNSS|CRPC|BSA|IEA|CPC|ORDER|RULE|SECTION|DHARA)\s*/i, '').trim();

    let foundMatch = null;
    let category = '';

    if (BNS_DATABASE[cleanInput]) {
        foundMatch = BNS_DATABASE[cleanInput];
        category = 'Penal Law (IPC to BNS)';
    } else if (BNSS_DATABASE[cleanInput]) {
        foundMatch = BNSS_DATABASE[cleanInput];
        category = 'Criminal Procedure (CrPC to BNSS)';
    } else if (BSA_DATABASE[cleanInput]) {
        foundMatch = BSA_DATABASE[cleanInput];
        category = 'Evidence Law (IEA to BSA)';
    } else if (CPC_DATABASE[input] || CPC_DATABASE['Order ' + cleanInput]) {
        foundMatch = CPC_DATABASE[input] || CPC_DATABASE['Order ' + cleanInput];
        category = 'Civil Law (CPC)';
    }

    resultDiv.style.display = 'block';

    if (foundMatch) {
        let content = `
            <div style="background:var(--nyayi-surface-2); border:1px solid var(--nyayi-surface-border); border-radius:var(--radius-sm); padding:12px;">
                <div style="font-size:11px; text-transform:uppercase; color:var(--nyayi-primary); font-weight:700; margin-bottom:4px;">${category}</div>
                <h4 style="color:var(--nyayi-text); margin-bottom:6px;">${foundMatch.title || input}</h4>
        `;
        if (foundMatch.bns) content += `<p><b>Naya BNS Pravdhan:</b> ${foundMatch.bns}</p>`;
        if (foundMatch.bnss) content += `<p><b>Naya BNSS Pravdhan:</b> ${foundMatch.bnss}</p>`;
        if (foundMatch.bsa) content += `<p><b>Naya BSA Pravdhan:</b> ${foundMatch.bsa}</p>`;
        if (foundMatch.punishment) content += `<p><b>Saja (Punishment):</b> ${foundMatch.punishment}</p>`;
        if (foundMatch.bailable) content += `<p><b>Bail Type:</b> ${foundMatch.bailable} | <b>Cognizable:</b> ${foundMatch.cognizable}</p>`;
        if (foundMatch.details) content += `<p style="margin-top:6px; font-size:12.5px; color:var(--nyayi-text-secondary);">${foundMatch.details}</p>`;
        if (foundMatch.remedy) content += `<p style="margin-top:6px; font-size:12.5px; color:var(--nyayi-text-secondary);"><b>Remedy:</b> ${foundMatch.remedy}</p>`;
        content += '</div>';
        resultDiv.innerHTML = content;
    } else {
        resultDiv.innerHTML = `
            <div style="background:var(--nyayi-surface-2); border:1px solid var(--nyayi-surface-border); border-radius:var(--radius-sm); padding:12px; font-size:13px; color:var(--nyayi-text-secondary);">
                Section "${MessageRenderer.escapeHtml(input)}" database me exact match nahi hua.<br>
                Aap isey sidhe chat me puch sakte hain: <button type="button" class="chip" style="margin-top:6px;" onclick="closeAllModals(); askSuggestion('Section ${MessageRenderer.escapeHtml(input)} ke naye kanooni niyam samjhao')">Ask AI in Chat</button>
            </div>
        `;
    }
}

function quickConvert(section) {
    openTool('bns');
    const input = document.getElementById('bnsInput');
    if (input) {
        input.value = section;
        convertSection();
    }
}

function setStatuteFilter(filter) {
    activeStatuteFilter = filter;
}

// Tool 6: Traffic Fine Calculator
function calculateFine() {
    const sel = document.getElementById('fineViolation');
    const resultDiv = document.getElementById('fineResult');
    if (!sel || !resultDiv) return;

    const data = TRAFFIC_FINES[sel.value];
    resultDiv.style.display = 'block';

    if (data) {
        resultDiv.innerHTML = `
            <div style="background:var(--nyayi-surface-2); border:1px solid var(--nyayi-surface-border); border-radius:var(--radius-sm); padding:12px;">
                <div style="font-size:11px; text-transform:uppercase; color:var(--nyayi-primary); font-weight:700; margin-bottom:4px;">${data.section}</div>
                <h3 style="color:var(--nyayi-danger); font-size:18px; margin-bottom:4px;">${data.penalty}</h3>
                <p style="font-size:13px; color:var(--nyayi-text-secondary);">${data.note}</p>
            </div>
        `;
    }
}

// Tool 7: Legal Notice Drafter
function generateLegalNotice() {
    const draftType = document.getElementById('draftType').value;
    const sender = document.getElementById('senderName').value.trim() || '[Sender Name]';
    const recipient = document.getElementById('recipientName').value.trim() || '[Recipient Name]';
    const details = document.getElementById('draftDetails').value.trim() || 'Amount / Transaction details';
    const resultDiv = document.getElementById('draftResult');

    resultDiv.style.display = 'block';

    let noticeText = '';
    const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    if (draftType === 'cheque') {
        noticeText = `FORMAL STATUTORY DEMAND NOTICE
(Under Section 138 of the Negotiable Instruments Act, 1881)

Date: ${today}

TO:
${recipient}

FROM:
${sender}

SUBJECT: STATUTORY DEMAND NOTICE FOR DISHONOUR OF CHEQUE UNDER SECTION 138 NEGOTIABLE INSTRUMENTS ACT, 1881.

Sir/Madam,

Under instructions and on behalf of my client / the undersigned (${sender}), I hereby serve upon you this Statutory Demand Notice:

1. That in discharge of your legally enforceable debt/liability, you issued cheque(s) in favor of the undersigned with the following details: ${details}.
2. That upon presentation to the bank within its validity period, the said cheque was dishonoured and returned unpaid with the reason 'Funds Insufficient' / 'Payment Stopped' vide Bank Return Memo.
3. You are hereby called upon to pay the entire cheque amount of ${details} within 15 (FIFTEEN) DAYS of the receipt of this notice, failing which appropriate criminal proceedings under Section 138 of the Negotiable Instruments Act, 1881 shall be initiated against you before the Competent Judicial Magistrate, at your sole risk and costs.

Yours faithfully,
${sender}`;
    } else {
        noticeText = `LEGAL NOTICE
Date: ${today}

TO: ${recipient}
FROM: ${sender}
SUBJECT: LEGAL DEMAND NOTICE REGARDING ${details}

Sir/Madam,
I hereby give you notice that:
1. That regarding ${details}, you have failed to fulfill your legal commitments toward ${sender}.
2. You are hereby called upon to resolve the dispute and pay all dues within 15 days of this notice, failing which legal proceedings shall be initiated.

Yours sincerely,
${sender}`;
    }

    resultDiv.innerHTML = `
        <div style="background:var(--nyayi-surface-2); border:1px solid var(--nyayi-surface-border); border-radius:var(--radius-sm); padding:12px; margin-top:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:12px; font-weight:600; color:var(--nyayi-primary);">Draft Generated</span>
                <button type="button" class="tool-pill" onclick="copyMessageText(this, decodeURIComponent('${encodeURIComponent(noticeText)}'))"><i class="fa-regular fa-copy"></i> Copy Draft</button>
            </div>
            <textarea class="modal-textarea" rows="8" readonly style="font-family:var(--nyayi-font-mono); font-size:12px;">${MessageRenderer.escapeHtml(noticeText)}</textarea>
        </div>
    `;
}

// Tool 1: Analyze Facts to Law
async function analyzeFactsToLaw() {
    const input = document.getElementById('factlaw-input').value.trim();
    const resultDiv = document.getElementById('factlaw-result');

    if (!input) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<span style="color:var(--nyayi-danger);">Kripya ghatna ka vivran likhein.</span>';
        return;
    }

    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<div style="color:var(--nyayi-primary);"><i class="fa-solid fa-spinner fa-spin"></i> Facts ka kanooni vishleshan ho raha hai...</div>';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: input, category: "Fact to Law Analyzer" })
        });
        const data = await response.json();
        resultDiv.innerHTML = MessageRenderer.formatLegalResponse(data.reply || "Analysis complete.");
    } catch (e) {
        resultDiv.innerHTML = '<span style="color:var(--nyayi-danger);">Analysis me samasya aayi. Kripya punah prayas karein.</span>';
    }
}

// FIR Wizard Navigation
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

// Case Law Simplifier
async function simplifyCaseLaw() {
    const input = document.getElementById('casesimplifier-input').value.trim();
    const resultDiv = document.getElementById('casesimplifier-result');

    if (!input) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<span style="color:var(--nyayi-danger);">Kripya kisi Case Law ka naam, citation ya judgment text paste karein.</span>';
        return;
    }

    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<div style="color:var(--nyayi-primary);"><i class="fa-solid fa-spinner fa-spin"></i> Judgment aur Ratio Decidendi simplify ki ja rahi hai...</div>';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: input, category: "Case Law Simplifier" })
        });
        const data = await response.json();
        resultDiv.innerHTML = MessageRenderer.formatLegalResponse(data.reply || "Simplification complete.");
    } catch (e) {
        resultDiv.innerHTML = '<span style="color:var(--nyayi-danger);">Case Law analysis me samasya aayi. Kripya punah prayas karein.</span>';
    }
}

// Filter Legal Updates
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

// SOS Emergency Alert
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

// --- 15. SPEECH SYNTHESIS ENGINE (TTS) ---
function detectTextLanguage(text) {
    const devanagari = (text.match(/[\u0900-\u097F]/g) || []).length;
    const latin = (text.match(/[a-zA-Z]/g) || []).length;
    if (devanagari > latin * 0.3) return 'hi-IN';
    if (latin > devanagari) return 'en-IN';
    return voiceLang || 'hi-IN';
}

function selectBestVoice(voices, langCode) {
    const hindiNames = ['google hindi', 'microsoft swara', 'swara', 'aditi', 'heera', 'lekha'];
    const englishNames = ['google uk english female', 'microsoft zira', 'zira', 'samantha', 'karen', 'veena'];
    const searchNames = langCode.startsWith('hi') ? hindiNames : englishNames;
    const langPrefix = langCode.startsWith('hi') ? 'hi' : 'en';

    for (const name of searchNames) {
        const found = voices.find(v => v.name.toLowerCase().includes(name));
        if (found) return found;
    }
    const femaleVoice = voices.find(v => v.lang.startsWith(langPrefix) && !v.name.toLowerCase().includes('male'));
    if (femaleVoice) return femaleVoice;
    const langVoice = voices.find(v => v.lang.startsWith(langPrefix));
    if (langVoice) return langVoice;
    return voices.find(v => v.lang.includes('IN')) || null;
}

function playTTS(text, onStart, onEnd) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/[#\*_~\x60>\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) return;

    const detectedLang = detectTextLanguage(cleanText);
    const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 1200));
    utterance.lang = detectedLang;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const applyVoiceAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            const best = selectBestVoice(voices, detectedLang);
            if (best) utterance.voice = best;
        }
        if (onStart) utterance.onstart = onStart;
        if (onEnd) utterance.onend = onEnd;
        utterance.onerror = () => { if (onEnd) onEnd(); };
        window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
        applyVoiceAndSpeak();
    } else {
        window.speechSynthesis.onvoiceschanged = applyVoiceAndSpeak;
        setTimeout(applyVoiceAndSpeak, 300);
    }
}

function speakMessage(btn, text) {
    if (!('speechSynthesis' in window)) {
        alert("Aapke browser me text-to-speech support uplabdh nahi hai.");
        return;
    }

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        if (btn) btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Listen';
        return;
    }

    if (btn) btn.innerHTML = '<i class="fa-solid fa-circle-stop" style="color:var(--nyayi-danger);"></i> Stop';

    playTTS(text, null, () => {
        if (btn) btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Listen';
    });
}

function copyMessageText(btn, text) {
    navigator.clipboard.writeText(text).then(() => {
        if (btn) {
            const orig = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check" style="color:var(--nyayi-primary);"></i> Copied';
            setTimeout(() => { btn.innerHTML = orig; }, 2000);
        }
    }).catch(() => {
        prompt("Copy text:", text);
    });
}

function shareResponse(text) {
    if (navigator.share) {
        navigator.share({
            title: 'Nyayi Legal Guidance',
            text: text.slice(0, 500) + '...\n\n(Consult Nyayi at https://nyayi.in)'
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert("Kanooni jaankari clipboard par copy ho gayi hai!");
        });
    }
}

// --- 16. VOICE ASSISTANT MODAL (SPEECH RECOGNITION) ---
function openVoiceAssistant() {
    closeAllModals();
    const overlay = document.getElementById('voiceOverlay');
    if (overlay) overlay.classList.add('active');

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
        const trans = document.getElementById('voiceTranscriptText');
        if (trans) trans.innerText = "Speech Recognition aapke browser me support nahi karta. Kripya Chrome ya Edge use karein.";
        return;
    }

    if (activeRecognition) {
        try { activeRecognition.stop(); } catch(e) {}
    }

    activeRecognition = new SpeechRec();
    activeRecognition.lang = voiceLang;
    activeRecognition.continuous = false;
    activeRecognition.interimResults = true;

    const statusEl = document.getElementById('voiceStatusText');
    const transcriptEl = document.getElementById('voiceTranscriptText');

    activeRecognition.onstart = () => {
        if (statusEl) statusEl.innerText = "Nyayi sun raha hai... Boliye";
    };

    activeRecognition.onresult = (e) => {
        const transcript = Array.from(e.results)
            .map(r => r[0].transcript)
            .join('');
        if (transcriptEl) transcriptEl.innerText = transcript;
    };

    activeRecognition.onerror = (e) => {
        if (statusEl) statusEl.innerText = "Awaaz pehchanne me truti aayi: " + e.error;
    };

    activeRecognition.onend = () => {
        if (transcriptEl && transcriptEl.innerText && transcriptEl.innerText !== "Boliye, Nyayi sun raha hai...") {
            const finalQuery = transcriptEl.innerText.trim();
            closeVoiceAssistant();
            const input = document.getElementById('userInput');
            if (input) {
                input.value = finalQuery;
                isVoiceQuery = true;
                sendMessage();
            }
        } else {
            if (statusEl) statusEl.innerText = "Kuch sunayi nahi diya. Kripya punah bole.";
        }
    };

    try {
        activeRecognition.start();
    } catch(e) {}
}

function closeVoiceAssistant() {
    if (activeRecognition) {
        try { activeRecognition.stop(); } catch(e) {}
        activeRecognition = null;
    }
    const overlay = document.getElementById('voiceOverlay');
    if (overlay) overlay.classList.remove('active');
}

function toggleVoiceRecognition() {
    if (activeRecognition) {
        closeVoiceAssistant();
    } else {
        openVoiceAssistant();
    }
}

function toggleVoiceMute() {
    isVoiceMuted = !isVoiceMuted;
    const btn = document.getElementById('voiceMuteBtn');
    if (btn) {
        btn.innerHTML = isVoiceMuted 
            ? '<i class="fa-solid fa-volume-xmark" style="color:var(--nyayi-danger);"></i> Audio Muted' 
            : '<i class="fa-solid fa-volume-high"></i> Voice Audio';
    }
    if (isVoiceMuted && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
}

function stopVoiceAssistant() {
    closeVoiceAssistant();
}

function toggleVoiceLang() {
    voiceLang = voiceLang === 'hi-IN' ? 'en-IN' : 'hi-IN';
    const btn = document.getElementById('voiceLangBtn');
    if (btn) {
        btn.innerText = voiceLang === 'hi-IN' ? '🌐 Hindi (हि)' : '🌐 English (En)';
    }
    if (activeRecognition) {
        closeVoiceAssistant();
        openVoiceAssistant();
    }
}
