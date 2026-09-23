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
                    list.sort((a, b) => {
                        if (a.pinned && !b.pinned) return -1;
                        if (!a.pinned && b.pinned) return 1;
                        return (b.updatedAt || 0) - (a.updatedAt || 0);
                    });
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
            const list = raw ? JSON.parse(raw) : [];
            list.sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return (b.updatedAt || 0) - (a.updatedAt || 0);
            });
            return list;
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
                pinned: !!chat.pinned,
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

    getContextPayload(messages, maxTurns = 20) {
        if (!Array.isArray(messages) || messages.length === 0) return [];
        const relevant = messages.slice(-maxTurns);
        return relevant.map(m => ({
            role: m.role === 'ai' ? 'assistant' : 'user',
            content: this.cleanContent(m.text || '')
        })).filter(m => m.content.length > 0);
    },

    cleanContent(text) {
        if (!text) return '';
        return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000);
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
        if (!text) return [];
        const lower = text.toLowerCase();
        const questions = [];

        // Detect selected or active language
        const langSelect = document.getElementById('langSelect');
        const uiLang = langSelect ? langSelect.value : 'Multilingual';
        const isHindi = uiLang === 'Hindi' || /[\u0900-\u097F]/.test(text);
        const isHinglish = uiLang === 'Hinglish';

        if (lower.includes('tourist') || lower.includes('foreigner') || lower.includes('visa')) {
            if (isHindi) {
                questions.push('विदेशी नागरिक या टूरिस्ट के लिए आपातकालीन हेल्पलाइन नंबर क्या हैं?');
                questions.push('यदि पासपोर्ट या वीजा खो जाए तो क्या कानूनी कदम उठाएं?');
            } else if (isHinglish) {
                questions.push('Foreign tourist ke liye emergency helpline numbers kya hain?');
                questions.push('Passport ya visa kho jaane par kya legal process hai?');
            } else {
                questions.push('What emergency helplines and legal protections exist for foreign tourists?');
                questions.push('What is the procedure if a foreign citizen loses their passport or visa?');
            }
        } else if (lower.includes('loan') || lower.includes('recovery agent') || lower.includes('recovery') || lower.includes('emi') || lower.includes('harassment') || lower.includes('threaten')) {
            if (isHindi) {
                questions.push('रिकवरी एजेंट द्वारा धमकी देने पर RBI के नियमों के तहत शिकायत कैसे करें?');
                questions.push('क्या बैंक रिकवरी एजेंट बिना नोटिस घर या दफ्तर आ सकते हैं?');
            } else if (isHinglish) {
                questions.push('Recovery agent threat kare to RBI guidelines ke under action kaise lein?');
                questions.push('Kya loan agent bina legal notice ke ghar aa sakte hain?');
            } else {
                questions.push('How to file a formal RBI Ombudsman complaint against abusive loan recovery agents?');
                questions.push('What are the strict RBI guidelines regarding recovery agent visits and calls?');
            }
        } else if (lower.includes('cyber') || lower.includes('blackmail') || lower.includes('sextortion') || lower.includes('hack') || lower.includes('whatsapp') || lower.includes('fake profile') || lower.includes('leak')) {
            if (isHindi) {
                questions.push('साइबर ब्लैकमेल या फर्जी प्रोफाइल की त्वरित शिकायत 1930 पर कैसे दर्ज करें?');
                questions.push('सोशल मीडिया से आपत्तिजनक फोटो या वीडियो हटवाने का कानूनी तरीका क्या है?');
            } else if (isHinglish) {
                questions.push('Cyber blackmail ya fake account ki 1930 portal par emergency complaint kaise karein?');
                questions.push('Social media se defamatory ya private photos remove karane ka legal process kya hai?');
            } else {
                questions.push('How can I immediately report cyber blackmail and get illegal content taken down?');
                questions.push('What evidence (IP, URLs, chat logs) is critical when filing on cybercrime.gov.in?');
            }
        } else if (lower.includes('challan') || lower.includes('traffic') || lower.includes('accident') || lower.includes('mact') || lower.includes('license') || lower.includes('vehicle')) {
            if (isHindi) {
                questions.push('सड़क दुर्घटना में MACT (दुर्घटना दावा ट्रिब्यूनल) से मुआवजा कैसे प्राप्त करें?');
                questions.push('गलत ट्रैफिक चालान को वर्चुअल कोर्ट (Virtual Court) में कैसे चुनौती दें?');
            } else if (isHinglish) {
                questions.push('Road accident me MACT tribunal se compensation claim karne ka process kya hai?');
                questions.push('Galat traffic challan ko online Virtual Court me kaise contest karein?');
            } else {
                questions.push('How do I claim insurance compensation before the Motor Accident Claims Tribunal (MACT)?');
                questions.push('How can I contest an unjustified traffic challan online in Virtual Court?');
            }
        } else if (lower.includes('domestic violence') || lower.includes('dv act') || lower.includes('498a') || lower.includes('dowry') || lower.includes('cruelty') || lower.includes('marpeet')) {
            if (isHindi) {
                questions.push('घरेलू हिंसा अधिनियम के तहत प्रोटेक्शन ऑर्डर (Protection Order) कैसे हासिल करें?');
                questions.push('महिला हेल्पलाइन नंबर 181 या 112 पर त्वरित कानूनी सहायता कैसे प्राप्त करें?');
            } else if (isHinglish) {
                questions.push('Domestic Violence Act ke tehat Protection Order aur Residence Order kaise lein?');
                questions.push('Women Helpline 181 par legal protection aur shelter support kaise milta hai?');
            } else {
                questions.push('How can a woman obtain an immediate Protection Order under the Domestic Violence Act?');
                questions.push('What interim monetary relief and residence orders are available under Section 12 DV Act?');
            }
        } else if (lower.includes('salary') || lower.includes('employer') || lower.includes('wages') || lower.includes('labour') || lower.includes('company') || lower.includes('termination')) {
            if (isHindi) {
                questions.push('बकाया वेतन और ग्रेच्युटी के लिए नियोक्ता को लीगल नोटिस कैसे भेजें?');
                questions.push('बिना नोटिस गलत तरीके से निकाले जाने पर लेबर कमिश्नर से क्या राहत मिलती है?');
            } else if (isHinglish) {
                questions.push('Unpaid salary aur severance pay ke liye employer ko Legal Notice kaise bhejein?');
                questions.push('Illegal termination ke khilaf Labour Court me complaint ka kya procedure hai?');
            } else {
                questions.push('How can I issue a formal Legal Notice to my employer for pending salary and severance?');
                questions.push('What is the procedure to file a complaint before the Labour Commissioner?');
            }
        } else if (lower.includes('cheating') || lower.includes('fraud') || lower.includes('420') || lower.includes('318') || lower.includes('1930') || lower.includes('scam')) {
            if (isHindi) {
                questions.push('बैंक में 24 घंटे के अंदर ट्रांजैक्शन चार्जबैक (Chargeback Request) कैसे दर्ज करें?');
                questions.push('धोखाधड़ी में BNS धारा 318(4) के तहत प्राथमिकी (FIR) कैसे दर्ज करवाएं?');
            } else if (isHinglish) {
                questions.push('Bank me dispute & chargeback request 24 ghante me kaise darj karein?');
                questions.push('Financial fraud me Section 318(4) BNS ke tehat FIR kaise register karwaye?');
            } else {
                questions.push('How do I submit an emergency chargeback request with my bank within 24 hours?');
                questions.push('What are the essentials of registering an FIR under Section 318(4) BNS for fraud?');
            }
        } else if (lower.includes('fir') || lower.includes('police') || lower.includes('154') || lower.includes('173') || lower.includes('thana') || lower.includes('175')) {
            if (isHindi) {
                questions.push('जीरो एफआईआर (Zero FIR) दर्ज करवाने की क्या प्रक्रिया है?');
                questions.push('यदि थाना एफआईआर दर्ज न करे तो धारा 175(3) BNSS के तहत मजिस्ट्रेट शिकायत कैसे करें?');
            } else if (isHinglish) {
                questions.push('Zero FIR kisi bhi thane me darj karwane ki legal process kya hai?');
                questions.push('Agar police FIR na likhe toh SP / Magistrate ko Section 175(3) BNSS me application kaise dein?');
            } else {
                questions.push('What is the step-by-step procedure to register a Zero FIR at any police station?');
                questions.push('What remedies exist under Section 175(3) BNSS if police refuse to register an FIR?');
            }
        } else if (lower.includes('tenant') || lower.includes('rent') || lower.includes('deposit') || lower.includes('landlord') || lower.includes('eviction')) {
            if (isHindi) {
                questions.push('मकान मालिक को सिक्योरिटी डिपॉजिट वापसी के लिए औपचारिक मांग पत्र (Demand Notice) कैसे भेजें?');
                questions.push('बिना वैध कानूनी नोटिस बेदखली (Illegal Eviction) के खिलाफ कोर्ट से स्टे ऑर्डर कैसे लें?');
            } else if (isHinglish) {
                questions.push('Landlord ko security deposit refund ke liye polite Legal Demand Notice kaise bhejein?');
                questions.push('Illegal eviction attempt ke khilaf Civil Court se injunction stay order kaise lein?');
            } else {
                questions.push('How can I draft a formal legal demand notice to recover my tenant deposit?');
                questions.push('How can a tenant obtain an injunction against unlawful eviction under Order 39 CPC?');
            }
        } else if (lower.includes('cheque') || lower.includes('138') || lower.includes('bounce') || lower.includes('negotiable')) {
            if (isHindi) {
                questions.push('चेक बाउंस होने पर 30 दिनों के भीतर कानूनी नोटिस भेजने का क्या नियम है?');
                questions.push('धारा 138 NI Act के तहत मजिस्ट्रेट कोर्ट में शिकायत दर्ज करने की समयसीमा क्या है?');
            } else if (isHinglish) {
                questions.push('Cheque bounce hone ke 30 days ke andar legal notice bhejne ka draft kaisa hota hai?');
                questions.push('Sec 138 NI Act court complaint me kya compensation aur penalty milti hai?');
            } else {
                questions.push('What are the strict timelines for issuing a statutory legal notice under Section 138 NI Act?');
                questions.push('What compensation and penalties are awarded under Section 138 NI Act proceedings?');
            }
        } else if (lower.includes('bail') || lower.includes('arrest') || lower.includes('438') || lower.includes('482') || lower.includes('custody')) {
            if (isHindi) {
                questions.push('अग्रिम जमानत (Anticipatory Bail - Sec 482 BNSS) की अर्जी किस अदालत में लगाई जाती है?');
                questions.push('गिरफ्तारी के 24 घंटे के भीतर मजिस्ट्रेट के समक्ष पेश किए जाने के अधिकार क्या हैं?');
            } else if (isHinglish) {
                questions.push('Anticipatory Bail petition Sessions Court ya High Court me kaise file karte hain?');
                questions.push('Police custody me arrestee ke fundamental legal rights (DK Basu guidelines) kya hain?');
            } else {
                questions.push('What essential grounds must be shown to secure Anticipatory Bail under Section 482 BNSS?');
                questions.push('What constitutional safeguards protect an individual during police custody and arrest?');
            }
        } else if (lower.includes('consumer') || lower.includes('defective') || lower.includes('refund') || lower.includes('service') || lower.includes('edaakhil')) {
            if (isHindi) {
                questions.push('e-Daakhil पोर्टल पर घर बैठे ऑनलाइन उपभोक्ता शिकायत कैसे दर्ज करें?');
                questions.push('दोषपूर्ण सेवा या उत्पाद के लिए मानसिक प्रताड़ना का मुआवजा कैसे क्लेम करें?');
            } else if (isHinglish) {
                questions.push('e-Daakhil portal par online consumer court complaint bina lawyer ke kaise file karein?');
                questions.push('Defective product ya deficient service ke liye kitna compensation claim kar sakte hain?');
            } else {
                questions.push('How do I file an online consumer complaint via the e-Daakhil portal without a lawyer?');
                questions.push('What compensation and refunds can be claimed for defective goods or deficient services?');
            }
        } else if (lower.includes('property') || lower.includes('stay') || lower.includes('injunction') || lower.includes('land') || lower.includes('registry') || lower.includes('kabza')) {
            if (isHindi) {
                questions.push('संपत्ति पर अवैध कब्जे के खिलाफ सिविल कोर्ट से त्वरित स्टे ऑर्डर (Order 39) कैसे प्राप्त करें?');
                questions.push('पैतृक संपत्ति में पुत्र-पुत्री के कानूनी अधिकार और बंटवारा (Partition Suit) कैसे होता है?');
            } else if (isHinglish) {
                questions.push('Property dispute me Civil Court se temporary Stay Order (Order 39 Rules 1 & 2) kaise lein?');
                questions.push('Ancestral property partition suit file karne ki step-by-step process kya hai?');
            } else {
                questions.push('How can I obtain a temporary injunction (Order 39 Rules 1 & 2 CPC) in a property dispute?');
                questions.push('What is the procedure and documentation to file a partition suit for ancestral property?');
            }
        } else if (lower.includes('divorce') || lower.includes('maintenance') || lower.includes('125') || lower.includes('144') || lower.includes('custody') || lower.includes('child')) {
            if (isHindi) {
                questions.push('आपसी सहमति से तलाक (Mutual Consent Divorce) की क्या प्रक्रिया और समयसीमा है?');
                questions.push('धारा 144 BNSS (पूर्व 125 CrPC) के तहत मासिक भरण-पोषण (Maintenance) का दावा कैसे करें?');
            } else if (isHinglish) {
                questions.push('Mutual Consent Divorce me 6-month cooling off period aur procedure kya hoti hai?');
                questions.push('Interim maintenance aur child custody claim karne ke legal grounds kya hain?');
            } else {
                questions.push('What is the procedure and timeline for Mutual Consent Divorce?');
                questions.push('How to claim monthly maintenance under Section 144 BNSS / Section 125 CrPC?');
            }
        } else if (lower.includes('will') || lower.includes('succession') || lower.includes('inheritance') || lower.includes('heir') || lower.includes('probate')) {
            if (isHindi) {
                questions.push('वारिस प्रमाण पत्र (Legal Heir Certificate) और सक्सेशन सर्टिफिकेट में क्या अंतर है?');
                questions.push('बिना वसीयत के संपत्ति के कानूनी वारिसों के बीच बंटवारे के क्या नियम हैं?');
            } else if (isHinglish) {
                questions.push('Legal Heir Certificate vs Succession Certificate: Kaunsa document kab zaroori hota hai?');
                questions.push('Agar registered Will na ho toh property divide karne ka Hindu Succession Law kya kehta hai?');
            } else {
                questions.push('What is the difference between a Legal Heir Certificate and a Succession Certificate?');
                questions.push('How is property distributed among Class-1 legal heirs if deceased died intestate?');
            }
        } else {
            // Highly dynamic, variable contextual questions tailored to specific query elements
            const hash = Math.abs(text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
            const variant = hash % 3;

            if (isHindi) {
                if (variant === 0) {
                    questions.push('क्या इस मामले में बिना कोर्ट गए कानूनी नोटिस (Legal Notice) के माध्यम से समाधान संभव है?');
                    questions.push('इस प्रक्रिया में आवश्यक साक्ष्य (Evidence) और दस्तावेजों की सूची क्या होगी?');
                } else if (variant === 1) {
                    questions.push('इस स्थिति में मध्यस्थता (Mediation / Conciliation) द्वारा समझौता कैसे किया जा सकता है?');
                    questions.push('कानूनी कार्यवाही करने की वैधानिक समयसीमा (Limitation Period) क्या है?');
                } else {
                    questions.push('क्या इस विवाद को लोक अदालत या सुलह के माध्यम से शांतिपूर्ण तरीके से सुलझाया जा सकता है?');
                    questions.push('इस मामले में मेरे अधिकारों की सुरक्षा के लिए सबसे पहला व्यावहारिक कदम क्या होना चाहिए?');
                }
            } else if (isHinglish) {
                if (variant === 0) {
                    questions.push('Kya is mamle me bina court case kiye formal Legal Notice se solution mil sakta hai?');
                    questions.push('Is situation me kaunse key documents aur proofs preserve karna zaroori hai?');
                } else if (variant === 1) {
                    questions.push('Kya is dispute ko mutual mediation ya out-of-court settlement se resolve kiya ja sakta hai?');
                    questions.push('Is mamle me legal action lene ki statutory limitation period kitni hoti hai?');
                } else {
                    questions.push('Is context me mere legal rights protect karne ke liye pehla immediate step kya hona chahiye?');
                    questions.push('Kya is dispute ke liye Lok Adalat ya free legal aid (NALSA) ka support mil sakta hai?');
                }
            } else {
                if (variant === 0) {
                    questions.push('Can this issue be resolved amicably through a formal pre-litigation Legal Notice?');
                    questions.push('What specific documentary evidence should be gathered and preserved for this?');
                } else if (variant === 1) {
                    questions.push('Is mediation or conciliation available as an alternative dispute resolution mechanism here?');
                    questions.push('What is the statutory limitation period within which legal action must be initiated?');
                } else {
                    questions.push('What is the most practical, cost-effective initial step to protect my legal interests?');
                    questions.push('Are there statutory Lok Adalat or Legal Services Authority remedies applicable here?');
                }
            }
        }
        return questions.slice(0, 2);
    }
};

// --- 6. INITIALIZATION & APP LIFECYCLE ---
document.addEventListener('DOMContentLoaded', async () => {
    await ConversationStore.init();
    await renderHistoryList();

    // Auto-restore previous consultation session so conversation context is never forgotten on refresh
    try {
        const lastActiveId = localStorage.getItem('nyayi_active_chat_id');
        if (lastActiveId) {
            const chat = await ConversationStore.get(lastActiveId);
            if (chat && chat.messages && chat.messages.length > 0) {
                await openChat(lastActiveId);
            }
        }
    } catch (e) {
        console.warn('Could not restore last active consultation:', e);
    }

    const savedTheme = localStorage.getItem('nyayi_theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        const icon = document.getElementById('themeIcon');
        if (icon) icon.className = 'fa-solid fa-sun';
    }

    // Initialize Desktop Sidebar Collapse State
    if (window.innerWidth > 768 && localStorage.getItem('nyayi_desktop_sidebar') === 'collapsed') {
        const sb = document.getElementById('sidebar-container');
        if (sb) sb.classList.add('collapsed');
    }

    // Initialize Voice Gender Persona
    const gender = localStorage.getItem('nyayi_voice_gender') || 'female';
    updateVoiceGender(gender);

    // Initialize User Email in Settings
    const userEmail = localStorage.getItem('nyayi_user_email') || '';
    const emailInput = document.getElementById('settingsUserEmail');
    if (emailInput && userEmail) emailInput.value = userEmail;

    const langSelect = document.getElementById('langSelect');
    if (langSelect) langSelect.value = aiLanguage;
    const settingsAILang = document.getElementById('settingsAILang');
    if (settingsAILang) settingsAILang.value = aiLanguage;

    // Set voice language according to stored aiLanguage
    voiceLang = (aiLanguage === 'English') ? 'en-IN' : 'hi-IN';
    const voiceBtn = document.getElementById('voiceLangBtn');
    if (voiceBtn) {
        const label = document.getElementById('voiceLangLabel');
        if (label) label.innerText = voiceLang === 'hi-IN' ? 'Hindi' : 'English';
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
        <div class="welcome-hero" id="welcomeSection" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; padding-bottom:100px;">
            <div class="welcome-ai-emblem" style="margin-bottom:24px;">
                <i class="fa-solid fa-scale-balanced"></i>
            </div>
            <h2 class="welcome-title" style="font-size:24px; font-weight:600; text-align:center; color:var(--nyayi-text);">How can I help you today, <span id="welcomeUserName">${MessageRenderer.escapeHtml(user)}</span>?</h2>
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
function appendMessage(text, role, skipScroll = false, attachments = []) {
    const box = document.getElementById('chat-box');
    if (!box) return null;

    // Immediately remove welcome section upon first message
    const hero = box.querySelector('.welcome-hero');
    if (hero) hero.remove();

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role === 'user' ? 'user-msg' : 'ai-msg'}`;

    const bodyWrapper = document.createElement('div');
    bodyWrapper.className = 'msg-body-wrapper';

    // If user message has attached documents/photos, render attachment badges
    if (role === 'user' && attachments && attachments.length > 0) {
        const attBox = document.createElement('div');
        attBox.className = 'user-msg-attachments';
        attachments.forEach(att => {
            const pill = document.createElement('div');
            pill.className = 'user-msg-att-pill';
            const iconHtml = att.isImage 
                ? (att.dataUrl ? `<img src="${att.dataUrl}" class="msg-att-img" alt="Attached evidence"/>` : '<i class="fa-solid fa-image"></i>')
                : (att.name.toLowerCase().endsWith('.pdf') ? '<i class="fa-solid fa-file-pdf" style="color:#ef4444;"></i>' : '<i class="fa-solid fa-file-lines" style="color:#38bdf8;"></i>');
            pill.innerHTML = `${iconHtml} <span>${MessageRenderer.escapeHtml(att.name)}</span> <small>(${att.size})</small>`;
            attBox.appendChild(pill);
        });
        bodyWrapper.appendChild(attBox);
    }

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
    if (!message && attachedMediaList.length === 0) return;

    // Snapshot attached files & reset tray
    const currentAttachments = [...attachedMediaList];
    attachedMediaList = [];
    renderAttachmentTray();

    input.value = '';
    autoGrowTextarea(input);
    closeComposerTools();

    // Prepare prompt payload (combining user text and attachment metadata/excerpts)
    let promptPayload = message;
    if (currentAttachments.length > 0) {
        const docNotes = currentAttachments.map(a => {
            let desc = `[Citizen Document Attachment: "${a.name}" (${a.size}, ${a.type || 'Legal Paper'})]`;
            if (a.textSnippet) {
                desc += `\nDocument Content Snippet:\n"""\n${a.textSnippet}\n"""`;
            } else if (a.isImage) {
                desc += ` (Photo/evidence scan attached by citizen for legal analysis)`;
            } else {
                desc += ` (Legal case paper / document attached by citizen for analysis)`;
            }
            return desc;
        }).join('\n\n');
        
        const userPrompt = message 
            ? `User Query/Details:\n${message}` 
            : 'Citizen attached this document for review. Please analyze it under Indian Law (BNS/BNSS/BSA), explain the legal implications, relevant sections, and recommend immediate next steps.';
        promptPayload = `${docNotes}\n\n${userPrompt}`;
    }

    const displayMessage = message || (currentAttachments.length > 0 ? `Attached ${currentAttachments.length} document${currentAttachments.length > 1 ? 's' : ''} for review` : '');

    // Create session if not active
    if (!activeChatId) {
        activeChatId = 'chat_' + Date.now();
        localStorage.setItem('nyayi_active_chat_id', activeChatId);
        const initialTitle = MemoryManager.generateMeaningfulTitle(message || (currentAttachments[0] ? currentAttachments[0].name : 'Document Review'));
        const newChat = {
            id: activeChatId,
            title: initialTitle,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: []
        };
        await ConversationStore.save(newChat);
    }

    // Append User Message with attachments
    appendMessage(displayMessage, 'user', false, currentAttachments);
    currentChatMessages.push({
        role: 'user',
        text: displayMessage,
        attachments: currentAttachments,
        timestamp: Date.now()
    });

    // Update conversation in storage
    const chatData = await ConversationStore.get(activeChatId) || {
        id: activeChatId,
        title: MemoryManager.generateMeaningfulTitle(message || (currentAttachments[0] ? currentAttachments[0].name : 'Document Review')),
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
    const historyPayload = MemoryManager.getContextPayload(currentChatMessages.slice(0, -1), 20);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: activeAbortController.signal,
            body: JSON.stringify({
                message: promptPayload,
                category: "Indian Legal Advisory",
                language: aiLanguage,
                history: historyPayload,
                email: localStorage.getItem('nyayi_user_email') || ''
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
            const previewEsc = MessageRenderer.escapeHtml(c.preview || 'Legal inquiry...');
            const pinIcon = c.pinned ? '<i class="fa-solid fa-thumbtack" style="color:#f59e0b; font-size:11px; margin-right:5px;" title="Pinned"></i>' : '';
            out += `
                <div class="history-item${isActive}" onclick="openChat('${c.id}')">
                    <div class="history-item-top">
                        <span class="history-item-title" title="${titleEsc}">${pinIcon}${titleEsc}</span>
                        <div class="history-item-actions">
                            <button type="button" class="history-action-btn" onclick="event.stopPropagation(); togglePinChat('${c.id}')" title="Pin / Unpin"><i class="fa-solid fa-thumbtack"></i></button>
                            <button type="button" class="history-action-btn" onclick="event.stopPropagation(); renameChat('${c.id}')" title="Rename"><i class="fa-solid fa-pen"></i></button>
                            <button type="button" class="history-action-btn delete" onclick="event.stopPropagation(); deleteChat('${c.id}')" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </div>
                    <div class="history-item-preview">${previewEsc}</div>
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
    localStorage.setItem('nyayi_active_chat_id', chat.id);
    currentChatMessages = chat.messages || [];

    const box = document.getElementById('chat-box');
    if (box) {
        box.innerHTML = '';
        if (currentChatMessages.length === 0) {
            renderEmptyState();
        } else {
            currentChatMessages.forEach(m => {
                appendMessage(m.text, m.role, true, m.attachments || []);
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
    localStorage.removeItem('nyayi_active_chat_id');
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

    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        const shouldOpen = typeof forceState === 'boolean' ? forceState : !sidebar.classList.contains('active');
        if (shouldOpen) {
            sidebar.classList.add('active');
            if (backdrop) backdrop.classList.add('active');
        } else {
            sidebar.classList.remove('active');
            if (backdrop) backdrop.classList.remove('active');
        }
    } else {
        // Desktop / Laptop: Smooth collapsible drawer
        const shouldCollapse = typeof forceState === 'boolean' ? !forceState : !sidebar.classList.contains('collapsed');
        if (shouldCollapse) {
            sidebar.classList.add('collapsed');
            localStorage.setItem('nyayi_desktop_sidebar', 'collapsed');
        } else {
            sidebar.classList.remove('collapsed');
            localStorage.setItem('nyayi_desktop_sidebar', 'expanded');
        }
    }
}

function toggleToolsHub() {
    const grid = document.getElementById('sidebarToolsGrid');
    const chevron = document.getElementById('toolsHubChevron');
    if (!grid) return;
    const isHidden = grid.style.display === 'none' || !grid.style.display;
    grid.style.display = isHidden ? 'grid' : 'none';
    if (chevron) {
        chevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

// Consultation Header Triple-Dot Options Menu
function toggleChatMenu(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('chatMenuDropdown');
    if (!dropdown) return;
    const isOpen = dropdown.classList.contains('active');
    dropdown.classList.toggle('active', !isOpen);
    dropdown.style.display = !isOpen ? 'block' : 'none';

    const pinText = document.getElementById('pinMenuText');
    if (pinText && activeChatId) {
        ConversationStore.get(activeChatId).then(chat => {
            if (chat && chat.pinned) {
                pinText.innerText = "Unpin Consultation";
            } else {
                pinText.innerText = "Pin Consultation";
            }
        });
    }
}

document.addEventListener('click', (e) => {
    const menu = document.getElementById('chatMenuDropdown');
    const btn = document.getElementById('chatMenuBtn');
    if (menu && menu.classList.contains('active')) {
        if (!menu.contains(e.target) && (!btn || !btn.contains(e.target))) {
            menu.classList.remove('active');
            menu.style.display = 'none';
        }
    }
});

async function shareActiveChat() {
    toggleChatMenu();
    let textToShare = "Nyayi Legal Consultation:\n";
    if (currentChatMessages.length > 0) {
        const lastMsg = currentChatMessages[currentChatMessages.length - 1];
        textToShare += `Summary: ${lastMsg.text.slice(0, 300)}...\n\nAccess on: https://ai.nyayi.in`;
    } else {
        textToShare = "Consult Indian Law, BNS 2023 & Citizen Rights on Nyayi AI: https://ai.nyayi.in";
    }

    if (navigator.share) {
        try {
            await navigator.share({ title: 'Nyayi Legal Consultation', text: textToShare, url: 'https://ai.nyayi.in' });
            return;
        } catch (err) {}
    }
    navigator.clipboard.writeText(textToShare).then(() => {
        alert("Consultation summary link copied to clipboard!");
    }).catch(() => {
        prompt("Copy consultation link:", textToShare);
    });
}

async function pinActiveChat() {
    toggleChatMenu();
    if (!activeChatId) {
        alert("Pehle koi sawal poochkar consultation shuru karein!");
        return;
    }
    const chat = await ConversationStore.get(activeChatId);
    if (!chat) return;
    chat.pinned = !chat.pinned;
    await ConversationStore.save(chat);
    await renderHistoryList();
    alert(chat.pinned ? "📌 Consultation pinned to top!" : "Consultation unpinned.");
}

async function togglePinChat(id) {
    const chat = await ConversationStore.get(id);
    if (!chat) return;
    chat.pinned = !chat.pinned;
    await ConversationStore.save(chat);
    await renderHistoryList();
}

function renameActiveChat() {
    toggleChatMenu();
    if (!activeChatId) {
        alert("Pehle consultation shuru karein!");
        return;
    }
    const modal = document.getElementById('renameModal');
    const input = document.getElementById('renameInput');
    if (modal && input) {
        ConversationStore.get(activeChatId).then(chat => {
            input.value = chat ? chat.title : '';
            modal.classList.add('active');
            input.focus();
        });
    }
}

async function confirmRenameChat() {
    const input = document.getElementById('renameInput');
    const modal = document.getElementById('renameModal');
    if (!input || !activeChatId) return;
    const newTitle = input.value.trim();
    if (!newTitle) return;

    const chat = await ConversationStore.get(activeChatId);
    if (chat) {
        chat.title = newTitle;
        await ConversationStore.save(chat);
        await renderHistoryList();
    }
    if (modal) modal.classList.remove('active');
}

function openFeedbackModal() {
    toggleChatMenu();
    const modal = document.getElementById('feedbackModal');
    if (modal) modal.classList.add('active');
}

let selectedRating = 5;
function setFeedbackRating(n) {
    selectedRating = n;
    const stars = document.querySelectorAll('#feedbackStars i');
    stars.forEach((star, idx) => {
        star.style.color = idx < n ? '#f59e0b' : '#64748b';
    });
}

function submitFeedback() {
    const alertBox = document.getElementById('feedbackAlert');
    const text = document.getElementById('feedbackText');
    if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.style.background = 'rgba(16,185,129,0.15)';
        alertBox.style.color = '#10b981';
        alertBox.innerText = `Shukriya! Aapka ${selectedRating}-Star feedback aur sujhav save ho gaya hai.`;
    }
    setTimeout(() => {
        const modal = document.getElementById('feedbackModal');
        if (modal) modal.classList.remove('active');
        if (text) text.value = '';
        if (alertBox) alertBox.style.display = 'none';
    }, 1200);
}

async function deleteActiveChat() {
    toggleChatMenu();
    if (!activeChatId) return;
    if (confirm("Kya aap sach me yeh consultation delete karna chahte hain?")) {
        await ConversationStore.delete(activeChatId);
        startNewChat();
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

// [+] Media Upload & Quick Tools Popup Drawer
let attachedMediaList = [];

function toggleComposerTools() {
    const popup = document.getElementById('composerToolsPopup');
    if (popup) popup.classList.toggle('active');
}

function closeComposerTools() {
    const popup = document.getElementById('composerToolsPopup');
    if (popup) popup.classList.remove('active');
}

// Click outside to auto-close popup drawer
document.addEventListener('click', (e) => {
    const popup = document.getElementById('composerToolsPopup');
    const btn = document.getElementById('composerToolBtn');
    if (popup && popup.classList.contains('active')) {
        if (!popup.contains(e.target) && btn && !btn.contains(e.target)) {
            closeComposerTools();
        }
    }
});

// Trigger file inputs
function triggerMediaPicker(type) {
    closeComposerTools();
    if (type === 'camera') {
        const camInput = document.getElementById('cameraUploadInput');
        if (camInput) camInput.click();
    } else if (type === 'photo') {
        const mediaInput = document.getElementById('mediaUploadInput');
        if (mediaInput) {
            mediaInput.accept = "image/*";
            mediaInput.click();
        }
    } else {
        const mediaInput = document.getElementById('mediaUploadInput');
        if (mediaInput) {
            mediaInput.accept = ".pdf,.doc,.docx,.txt,image/*";
            mediaInput.click();
        }
    }
}

// Handle File Selection (PDF, Word, Text, Images, Camera)
function handleMediaFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    if (!files || files.length === 0) return;

    files.forEach(file => {
        const id = 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const item = {
            id: id,
            name: file.name,
            size: formatBytes(file.size),
            rawSize: file.size,
            type: file.type,
            isImage: file.type.startsWith('image/'),
            dataUrl: null,
            textSnippet: ''
        };

        if (item.isImage) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                item.dataUrl = ev.target.result;
                renderAttachmentTray();
            };
            reader.readAsDataURL(file);
        } else if (file.type.includes('text') || file.name.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                item.textSnippet = (ev.target.result || '').substring(0, 3000);
            };
            reader.readAsText(file);
        }

        attachedMediaList.push(item);
    });

    renderAttachmentTray();
    e.target.value = '';
}

function formatBytes(bytes, decimals = 1) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function removeAttachment(id) {
    attachedMediaList = attachedMediaList.filter(item => item.id !== id);
    renderAttachmentTray();
}

function renderAttachmentTray() {
    const tray = document.getElementById('attachmentTray');
    if (!tray) return;

    if (attachedMediaList.length === 0) {
        tray.style.display = 'none';
        tray.innerHTML = '';
        return;
    }

    tray.style.display = 'flex';
    let html = '';
    attachedMediaList.forEach(item => {
        const icon = item.isImage 
            ? (item.dataUrl ? `<img src="${item.dataUrl}" class="tray-img-thumb" alt="Thumb"/>` : '<i class="fa-solid fa-image"></i>')
            : (item.name.toLowerCase().endsWith('.pdf') ? '<i class="fa-solid fa-file-pdf" style="color:#ef4444;"></i>' : '<i class="fa-solid fa-file-lines" style="color:#38bdf8;"></i>');
        
        html += `
            <div class="attachment-chip" id="${item.id}">
                <div class="attachment-chip-icon">${icon}</div>
                <div class="attachment-chip-meta">
                    <span class="attachment-chip-name" title="${MessageRenderer.escapeHtml(item.name)}">${MessageRenderer.escapeHtml(item.name)}</span>
                    <span class="attachment-chip-size">${item.size}</span>
                </div>
                <button type="button" class="attachment-chip-remove" onclick="removeAttachment('${item.id}')" title="Remove attachment">&times;</button>
            </div>
        `;
    });
    tray.innerHTML = html;
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
        const emailInput = document.getElementById('settingsUserEmail');
        if (emailInput) emailInput.value = localStorage.getItem('nyayi_user_email') || 'citizen@nyayi.in';
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
    const preferredGender = localStorage.getItem('nyayi_voice_gender') || 'female';
    const isMale = preferredGender === 'male';

    const hindiFemaleNames = ['google hindi', 'microsoft swara', 'swara', 'aditi', 'heera', 'lekha'];
    const hindiMaleNames = ['google hindi male', 'microsoft madhur', 'madhur', 'neerja', 'ravi', 'hemant'];

    const englishFemaleNames = ['google uk english female', 'microsoft zira', 'zira', 'samantha', 'karen', 'veena'];
    const englishMaleNames = ['google uk english male', 'microsoft david', 'david', 'george', 'rishi', 'alex', 'guy'];

    const searchNames = langCode.startsWith('hi') 
        ? (isMale ? hindiMaleNames : hindiFemaleNames)
        : (isMale ? englishMaleNames : englishFemaleNames);
    const langPrefix = langCode.startsWith('hi') ? 'hi' : 'en';

    for (const name of searchNames) {
        const found = voices.find(v => v.name.toLowerCase().includes(name));
        if (found) return found;
    }

    if (isMale) {
        const maleVoice = voices.find(v => v.lang.startsWith(langPrefix) && v.name.toLowerCase().includes('male'));
        if (maleVoice) return maleVoice;
    } else {
        const femaleVoice = voices.find(v => v.lang.startsWith(langPrefix) && (v.name.toLowerCase().includes('female') || !v.name.toLowerCase().includes('male')));
        if (femaleVoice) return femaleVoice;
    }

    const langVoice = voices.find(v => v.lang.startsWith(langPrefix));
    if (langVoice) return langVoice;
    return voices.find(v => v.lang.includes('IN')) || null;
}

function playTTS(text, onStart, onEnd) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Clean text: strip markdown links to just anchor text, remove markdown symbols
    let cleanText = text
        .replace(/<[^>]*>/g, ' ')
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        .replace(/[#\*_~\x60>]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!cleanText) return;

    const detectedLang = detectTextLanguage(cleanText);

    // Phonetic legal acronym expansion for natural Hindi enunciation
    if (detectedLang.startsWith('hi')) {
        cleanText = cleanText
            .replace(/\bFIR\b/gi, 'एफ.आई.आर.')
            .replace(/\bBNS\b/gi, 'बी.एन.एस.')
            .replace(/\bBNSS\b/gi, 'बी.एन.एस.एस.')
            .replace(/\bBSA\b/gi, 'बी.एस.ए.')
            .replace(/\bIPC\b/gi, 'आई.पी.सी.')
            .replace(/\bCrPC\b/gi, 'सी.आर.पी.सी.')
            .replace(/\bCPC\b/gi, 'सी.पी.सी.');
    }

    const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 1200));
    const isMale = (localStorage.getItem('nyayi_voice_gender') || 'female') === 'male';
    utterance.lang = detectedLang;
    // 0.88 rate is crisp, human, and avoids syllable slurring in Hindi TTS engines
    utterance.rate = detectedLang.startsWith('hi') ? 0.88 : 0.95;
    utterance.pitch = isMale ? 0.92 : 1.02;

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

// --- 16. VOICE STUDIO (DEDICATED FULL-SCREEN INTERACTIVE VOICE) ---
let isVoiceActive = false;
let isVoicePaused = false;
let isVoiceThinking = false;
let isVoiceSpeaking = false;
let voiceAccumulatedTranscript = '';
let voiceSilenceTimer = null;
let lastVoiceAnswerText = '';

function updateVoiceStudioUI(state) {
    const core = document.getElementById('voiceOrbCore');
    const icon = document.getElementById('voiceOrbIcon');
    const waveform = document.getElementById('voiceWaveform');
    const statusEl = document.getElementById('voiceStatusText');
    const modeBadge = document.getElementById('voiceLiveModeBadge');
    const pauseBtn = document.getElementById('voicePauseBtn');
    const pauseIcon = document.getElementById('voicePauseIcon');
    const pauseLabel = document.getElementById('voicePauseLabel');
    const liveDot = document.getElementById('voiceLiveDot');
    const rings = [document.getElementById('voiceRing1'), document.getElementById('voiceRing2'), document.getElementById('voiceRing3')];

    // Reset base classes
    if (core) core.className = 'voice-orb-core';
    if (waveform) waveform.className = 'voice-waveform';
    if (modeBadge) modeBadge.className = 'voice-mode-badge';
    rings.forEach(r => { if (r) r.className = r.className.replace(/\b(paused|thinking)\b/g, '').trim(); });

    switch (state) {
        case 'listening':
            if (core) core.classList.add('listening');
            if (icon) icon.className = 'fa-solid fa-microphone';
            if (waveform) waveform.classList.add('listening');
            if (modeBadge) {
                modeBadge.innerText = 'Listening';
                modeBadge.className = 'voice-mode-badge';
            }
            if (statusEl) statusEl.innerText = voiceLang === 'hi-IN' ? "न्यायी सुन रहा है... अपना सवाल बोलिए" : "Nyayi is listening... Speak your question";
            if (pauseBtn) {
                pauseBtn.className = 'voice-action-pill';
                if (pauseIcon) pauseIcon.className = 'fa-solid fa-pause';
                if (pauseLabel) pauseLabel.innerText = 'Pause';
            }
            if (liveDot) { liveDot.style.background = 'var(--nyayi-primary)'; liveDot.style.boxShadow = '0 0 10px var(--nyayi-primary)'; }
            break;

        case 'paused':
            if (core) core.classList.add('paused');
            if (icon) icon.className = 'fa-solid fa-pause';
            if (waveform) waveform.classList.add('paused');
            if (modeBadge) {
                modeBadge.innerText = 'Paused';
                modeBadge.classList.add('paused');
            }
            rings.forEach(r => { if (r) r.classList.add('paused'); });
            if (statusEl) statusEl.innerText = voiceLang === 'hi-IN' ? "माइक रुका हुआ है (Paused)। सोचने का समय लें... तैयार होने पर Resume या Send दबाएं" : "Mic paused. Take your time to think... Tap Resume or Send when ready";
            if (pauseBtn) {
                pauseBtn.className = 'voice-action-pill warning';
                if (pauseIcon) pauseIcon.className = 'fa-solid fa-play';
                if (pauseLabel) pauseLabel.innerText = 'Resume';
            }
            if (liveDot) { liveDot.style.background = '#f59e0b'; liveDot.style.boxShadow = '0 0 10px #f59e0b'; }
            break;

        case 'thinking':
            if (core) core.classList.add('thinking');
            if (icon) icon.className = 'fa-solid fa-spinner fa-spin';
            if (waveform) waveform.classList.add('thinking');
            if (modeBadge) {
                modeBadge.innerText = 'Analyzing';
                modeBadge.classList.add('thinking');
            }
            rings.forEach(r => { if (r) r.classList.add('thinking'); });
            if (statusEl) statusEl.innerText = voiceLang === 'hi-IN' ? "न्यायी कानून का विश्लेषण कर रहा है..." : "Nyayi is analyzing the legal provisions...";
            if (liveDot) { liveDot.style.background = '#38bdf8'; liveDot.style.boxShadow = '0 0 10px #38bdf8'; }
            break;

        case 'speaking':
            if (core) core.classList.add('speaking');
            if (icon) icon.className = 'fa-solid fa-volume-high';
            if (waveform) waveform.classList.add('speaking');
            if (modeBadge) {
                modeBadge.innerText = 'Speaking';
                modeBadge.className = 'voice-mode-badge';
            }
            if (statusEl) statusEl.innerText = voiceLang === 'hi-IN' ? "न्यायी बोल रहा है..." : "Nyayi is speaking legal response...";
            if (liveDot) { liveDot.style.background = '#34d399'; liveDot.style.boxShadow = '0 0 10px #34d399'; }
            break;

        case 'ready':
        default:
            if (core) core.classList.add('ready');
            if (icon) icon.className = 'fa-solid fa-microphone';
            if (waveform) waveform.classList.add('ready');
            if (modeBadge) {
                modeBadge.innerText = 'Ready';
                modeBadge.classList.add('ready');
            }
            if (statusEl) statusEl.innerText = voiceLang === 'hi-IN' ? "उत्तर पूरा हुआ। आराम से पढ़ें या 'Ask Next Question' दबाएं।" : "Answer complete. Read at your leisure or tap 'Ask Next Question'.";
            if (pauseBtn) {
                pauseBtn.className = 'voice-action-pill';
                if (pauseIcon) pauseIcon.className = 'fa-solid fa-pause';
                if (pauseLabel) pauseLabel.innerText = 'Pause';
            }
            if (liveDot) { liveDot.style.background = 'var(--nyayi-primary)'; liveDot.style.boxShadow = '0 0 10px var(--nyayi-primary)'; }
            break;
    }
}

function openVoiceAssistant() {
    closeAllModals();
    const overlay = document.getElementById('voiceOverlay');
    if (overlay) overlay.classList.add('active');
    isVoiceActive = true;
    isVoicePaused = false;
    isVoiceThinking = false;
    isVoiceSpeaking = false;
    voiceAccumulatedTranscript = '';

    // Sync gender label on button
    const gender = localStorage.getItem('nyayi_voice_gender') || 'female';
    const genderLabel = document.getElementById('voiceGenderLabel');
    if (genderLabel) genderLabel.innerText = gender === 'female' ? '👩 Female Voice' : '👨 Male Voice';

    // Sync language label
    const langLabel = document.getElementById('voiceLangLabel');
    if (langLabel) langLabel.innerText = voiceLang === 'hi-IN' ? '🌐 हिन्दी' : '🌐 English';

    const transcriptEl = document.getElementById('voiceTranscriptText');
    if (transcriptEl) {
        transcriptEl.innerText = voiceLang === 'hi-IN' ? "अपना कानूनी सवाल Hindi, English या Hinglish में बोलिए..." : "Ask your legal question in Hindi, English, or Hinglish...";
    }

    startVoiceListening();
}

function closeVoiceAssistant() {
    isVoiceActive = false;
    isVoiceThinking = false;
    isVoiceSpeaking = false;
    isVoicePaused = false;
    voiceAccumulatedTranscript = '';
    if (voiceSilenceTimer) {
        clearTimeout(voiceSilenceTimer);
        voiceSilenceTimer = null;
    }
    if (activeRecognition) {
        try {
            activeRecognition.onend = null;
            activeRecognition.onerror = null;
            activeRecognition.stop();
        } catch(e) {}
        activeRecognition = null;
    }
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    const overlay = document.getElementById('voiceOverlay');
    if (overlay) overlay.classList.remove('active');
    updateVoiceStudioUI('ready');
}

function startVoiceListening() {
    if (!isVoiceActive) return;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
        const trans = document.getElementById('voiceTranscriptText');
        if (trans) trans.innerText = "Speech Recognition aapke browser me support nahi karta. Kripya Google Chrome ya Microsoft Edge use karein.";
        return;
    }

    if (activeRecognition) {
        try {
            activeRecognition.onend = null;
            activeRecognition.onerror = null;
            activeRecognition.stop();
        } catch(e) {}
    }

    isVoicePaused = false;
    isVoiceSpeaking = false;
    isVoiceThinking = false;
    if (voiceSilenceTimer) {
        clearTimeout(voiceSilenceTimer);
        voiceSilenceTimer = null;
    }

    updateVoiceStudioUI('listening');

    activeRecognition = new SpeechRec();
    activeRecognition.lang = voiceLang || 'hi-IN';
    activeRecognition.continuous = true; // Continuous listening: does not cut off when user pauses to think!
    activeRecognition.interimResults = true;

    activeRecognition.onstart = () => {
        if (!isVoiceActive || isVoicePaused) return;
        updateVoiceStudioUI('listening');
    };

    activeRecognition.onresult = (e) => {
        if (!isVoiceActive || isVoicePaused || isVoiceThinking || isVoiceSpeaking) return;

        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
            if (e.results[i].isFinal) {
                voiceAccumulatedTranscript += (voiceAccumulatedTranscript ? ' ' : '') + e.results[i][0].transcript.trim();
            } else {
                interim += e.results[i][0].transcript;
            }
        }

        const displayTranscript = (voiceAccumulatedTranscript + (interim ? ' ' + interim : '')).trim();
        const transcriptEl = document.getElementById('voiceTranscriptText');
        if (transcriptEl && displayTranscript) {
            transcriptEl.innerText = displayTranscript;
        }

        // Reset silence timer on every spoken syllable/word
        if (voiceSilenceTimer) clearTimeout(voiceSilenceTimer);

        // Auto-submit only after 3.5s of complete silence AND substantive input
        if (displayTranscript.length > 8) {
            voiceSilenceTimer = setTimeout(() => {
                if (isVoiceActive && !isVoicePaused && !isVoiceThinking && !isVoiceSpeaking) {
                    submitVoiceTranscript();
                }
            }, 3500);
        }
    };

    activeRecognition.onerror = (e) => {
        console.warn('[Voice Recognition Error]', e.error);
        if (e.error === 'no-speech') {
            // User paused to think, do not break
            return;
        }
        if (isVoiceActive && !isVoiceSpeaking && !isVoiceThinking && !isVoicePaused) {
            const statusEl = document.getElementById('voiceStatusText');
            if (statusEl) statusEl.innerText = voiceLang === 'hi-IN' ? "सुन रहा हूँ... बोलना जारी रखें या Pause दबाएं" : "Listening... Continue speaking or tap Pause";
        }
    };

    activeRecognition.onend = () => {
        // If Chrome timed out recognition internally while user is still thinking (and not paused/thinking/speaking),
        // restart recognition silently without discarding user's transcript!
        if (isVoiceActive && !isVoicePaused && !isVoiceThinking && !isVoiceSpeaking) {
            setTimeout(() => {
                if (isVoiceActive && !isVoicePaused && !isVoiceThinking && !isVoiceSpeaking) {
                    try { activeRecognition.start(); } catch(e) {}
                }
            }, 300);
        }
    };

    try {
        activeRecognition.start();
    } catch(e) {
        console.warn('[Voice Start Error]', e);
    }
}

function toggleVoicePause() {
    if (!isVoiceActive || isVoiceThinking) return;

    if (isVoiceSpeaking) {
        // Tapping pause while Nyayi is speaking cancels speech immediately
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        isVoiceSpeaking = false;
        updateVoiceStudioUI('ready');
        return;
    }

    if (!isVoicePaused) {
        // --- PAUSE MIC ---
        isVoicePaused = true;
        if (voiceSilenceTimer) {
            clearTimeout(voiceSilenceTimer);
            voiceSilenceTimer = null;
        }
        if (activeRecognition) {
            try {
                activeRecognition.onend = null;
                activeRecognition.stop();
            } catch(e) {}
        }
        updateVoiceStudioUI('paused');
    } else {
        // --- RESUME MIC ---
        isVoicePaused = false;
        updateVoiceStudioUI('listening');
        startVoiceListening();
    }
}

function toggleVoiceMicState() {
    if (!isVoiceActive) return;
    if (isVoiceSpeaking) {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        isVoiceSpeaking = false;
        updateVoiceStudioUI('ready');
        return;
    }
    if (isVoiceThinking) return;

    // Tapping the central orb acts as Pause/Resume toggle during listening
    toggleVoicePause();
}

function clearVoiceTranscript() {
    voiceAccumulatedTranscript = '';
    if (voiceSilenceTimer) {
        clearTimeout(voiceSilenceTimer);
        voiceSilenceTimer = null;
    }
    const transcriptEl = document.getElementById('voiceTranscriptText');
    if (transcriptEl) {
        transcriptEl.innerText = voiceLang === 'hi-IN' ? "अपना कानूनी सवाल बोलिए..." : "Speak your legal question...";
    }
    if (!isVoicePaused && isVoiceActive && !isVoiceThinking && !isVoiceSpeaking) {
        startVoiceListening();
    }
}

function submitVoiceTranscript() {
    if (voiceSilenceTimer) {
        clearTimeout(voiceSilenceTimer);
        voiceSilenceTimer = null;
    }

    if (activeRecognition) {
        try {
            activeRecognition.onend = null;
            activeRecognition.stop();
        } catch(e) {}
    }

    const transcriptEl = document.getElementById('voiceTranscriptText');
    let userText = voiceAccumulatedTranscript.trim();
    if (!userText && transcriptEl) {
        userText = transcriptEl.innerText.trim();
    }

    // Filter out placeholders
    if (!userText || 
        userText.includes("Apna kanooni sawal") || 
        userText.includes("अपना कानूनी सवाल") || 
        userText.includes("Ask your legal question") ||
        userText.length < 4) {
        const statusEl = document.getElementById('voiceStatusText');
        if (statusEl) statusEl.innerText = voiceLang === 'hi-IN' ? "कृपया थोड़ा और स्पष्ट बोलें..." : "Please speak your question clearly...";
        if (!isVoicePaused) {
            setTimeout(() => { startVoiceListening(); }, 1200);
        }
        return;
    }

    handleVoiceStudioQuery(userText);
}

async function handleVoiceStudioQuery(userText) {
    if (!userText || isVoiceThinking) return;
    isVoiceThinking = true;
    isVoicePaused = false;

    if (voiceSilenceTimer) {
        clearTimeout(voiceSilenceTimer);
        voiceSilenceTimer = null;
    }
    if (activeRecognition) {
        try {
            activeRecognition.onend = null;
            activeRecognition.stop();
        } catch(e) {}
    }

    updateVoiceStudioUI('thinking');

    const responseCard = document.getElementById('voiceResponseCard');
    const responseTextEl = document.getElementById('voiceResponseText');
    if (responseCard) responseCard.style.display = 'none';

    try {
        const isHindi = voiceLang === 'hi-IN';
        const voicePrompt = isHindi
            ? `[Citizen Spoken Voice Query in HINDI. Reply strictly in clear, natural spoken HINDI in Devanagari script. Maximum 2-3 concise, complete spoken sentences suitable for speech synthesis audio. Zero English jargon]: ${userText}`
            : `[Citizen Spoken Voice Query in ENGLISH. Reply strictly in clear, natural spoken ENGLISH. Maximum 2-3 concise, complete spoken sentences suitable for speech synthesis audio]: ${userText}`;

        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: voicePrompt,
                category: "Voice Assistant",
                history: currentChatMessages.slice(-4).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
                language: isHindi ? 'Hindi' : 'English',
                email: localStorage.getItem('nyayi_user_email') || ''
            })
        });

        const data = await res.json().catch(() => ({}));
        isVoiceThinking = false;

        if (!isVoiceActive) return;

        const rawReply = data.response || data.reply || (isHindi ? "माफ करें, आपके प्रश्न पर कानूनी जानकारी प्राप्त नहीं हो सकी। कृपया दोबारा पूछें।" : "Could not retrieve legal response. Please try speaking again.");
        const cleanReply = rawReply.replace(/<[^>]*>/g, '').replace(/[#\*_`]/g, '').trim();
        lastVoiceAnswerText = cleanReply;

        if (responseCard && responseTextEl) {
            responseCard.style.display = 'block';
            responseTextEl.innerText = cleanReply;
        }

        // Silently preserve in active chat session
        if (!activeChatId) {
            activeChatId = 'chat_' + Date.now();
        }
        currentChatMessages.push({ role: 'user', text: userText, time: Date.now() });
        currentChatMessages.push({ role: 'ai', text: cleanReply, time: Date.now() });
        await ConversationStore.save({
            id: activeChatId,
            title: MemoryManager.generateMeaningfulTitle(userText),
            messages: currentChatMessages,
            updatedAt: Date.now(),
            createdAt: Date.now()
        });
        renderHistoryList();

        // Speak the legal response
        speakSpokenVoiceAnswer(cleanReply);

    } catch (err) {
        console.error('[Voice Query Error]', err);
        isVoiceThinking = false;
        const statusEl = document.getElementById('voiceStatusText');
        if (statusEl) statusEl.innerText = voiceLang === 'hi-IN' ? "त्रुटि। माइक पर टैप करके दोबारा बोलें।" : "Network error. Tap mic to try again.";
        updateVoiceStudioUI('ready');
    }
}

function speakSpokenVoiceAnswer(text) {
    if (!isVoiceActive || isVoiceMuted) {
        updateVoiceStudioUI('ready');
        return;
    }
    isVoiceSpeaking = true;
    updateVoiceStudioUI('speaking');

    playTTS(text, () => {
        if (isVoiceActive) updateVoiceStudioUI('speaking');
    }, () => {
        isVoiceSpeaking = false;
        if (!isVoiceActive) return;

        // FIXED: DO NOT automatically restart listening!
        // The answer card stays visible so the user can read at their leisure.
        // User explicitly taps 'Ask Next Question' or mic orb when ready.
        updateVoiceStudioUI('ready');
    });
}

function replayVoiceAnswer() {
    if (!lastVoiceAnswerText) {
        const responseTextEl = document.getElementById('voiceResponseText');
        if (responseTextEl && responseTextEl.innerText) {
            lastVoiceAnswerText = responseTextEl.innerText.trim();
        }
    }
    if (!lastVoiceAnswerText) return;

    if (window.speechSynthesis) window.speechSynthesis.cancel();
    speakSpokenVoiceAnswer(lastVoiceAnswerText);
}

function copyVoiceAnswer() {
    const text = lastVoiceAnswerText || (document.getElementById('voiceResponseText') ? document.getElementById('voiceResponseText').innerText : '');
    if (!text) return;

    const copyBtn = document.getElementById('voiceCopyBtn');
    navigator.clipboard.writeText(text).then(() => {
        if (copyBtn) {
            const orig = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fa-solid fa-check" style="color:var(--nyayi-primary);"></i> Copied';
            setTimeout(() => { copyBtn.innerHTML = orig; }, 2000);
        }
    }).catch(() => {
        prompt("Copy legal answer:", text);
    });
}

function askNextVoiceQuestion() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    isVoiceSpeaking = false;
    isVoiceThinking = false;
    isVoicePaused = false;
    voiceAccumulatedTranscript = '';

    const transcriptEl = document.getElementById('voiceTranscriptText');
    if (transcriptEl) {
        transcriptEl.innerText = voiceLang === 'hi-IN' ? "अपना अगला कानूनी सवाल बोलिए..." : "Ask your next legal question...";
    }

    startVoiceListening();
}

function cycleVoiceGender() {
    const current = localStorage.getItem('nyayi_voice_gender') || 'female';
    const next = current === 'female' ? 'male' : 'female';
    updateVoiceGender(next);
}

function updateVoiceGender(val) {
    localStorage.setItem('nyayi_voice_gender', val);
    const genderLabel = document.getElementById('voiceGenderLabel');
    if (genderLabel) genderLabel.innerText = val === 'female' ? '👩 Female Voice' : '👨 Male Voice';
    const select = document.getElementById('settingsVoiceGender');
    if (select) select.value = val;
}

function toggleVoiceMute() {
    isVoiceMuted = !isVoiceMuted;
    const icon = document.getElementById('voiceMuteIcon');
    if (icon) {
        icon.className = isVoiceMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
        icon.style.color = isVoiceMuted ? 'var(--nyayi-danger)' : '';
    }
    if (isVoiceMuted && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
}

function toggleVoiceLang() {
    voiceLang = voiceLang === 'hi-IN' ? 'en-IN' : 'hi-IN';
    localStorage.setItem('nyayi_voice_lang', voiceLang);
    const label = document.getElementById('voiceLangLabel');
    if (label) label.innerText = voiceLang === 'hi-IN' ? '🌐 हिन्दी' : '🌐 English';

    if (window.speechSynthesis) window.speechSynthesis.cancel();
    isVoiceSpeaking = false;
    voiceAccumulatedTranscript = '';

    const trans = document.getElementById('voiceTranscriptText');
    if (voiceLang === 'hi-IN') {
        if (trans) trans.innerText = "अपना कानूनी सवाल हिन्दी में पूछें...";
    } else {
        if (trans) trans.innerText = "Ask your legal question in English...";
    }

    if (isVoiceActive && !isVoiceThinking) {
        startVoiceListening();
    }
}

// --- 17. ACCOUNT PASSWORD CHANGE HANDLER ---
async function handleChangePassword() {
    const current = document.getElementById('currentPassInput');
    const newP = document.getElementById('newPassInput');
    const confirmP = document.getElementById('confirmPassInput');
    const alertBox = document.getElementById('changePassAlert');
    const btn = document.getElementById('changePassBtn');

    const email = localStorage.getItem('nyayi_user_email') || '';
    if (!email) {
        if (alertBox) {
            alertBox.style.display = 'block';
            alertBox.style.background = 'rgba(239,68,68,0.15)';
            alertBox.style.color = '#ef4444';
            alertBox.innerText = 'Email nahi mila. Kripya logout karke login karein.';
        }
        return;
    }

    if (!current.value || !newP.value || !confirmP.value) {
        if (alertBox) {
            alertBox.style.display = 'block';
            alertBox.style.background = 'rgba(239,68,68,0.15)';
            alertBox.style.color = '#ef4444';
            alertBox.innerText = 'Sabhi fields bharna zaroori hai.';
        }
        return;
    }

    if (newP.value.length < 6) {
        if (alertBox) {
            alertBox.style.display = 'block';
            alertBox.style.background = 'rgba(239,68,68,0.15)';
            alertBox.style.color = '#ef4444';
            alertBox.innerText = 'Naya password kam se kam 6 aksharon ka hona chahiye.';
        }
        return;
    }

    if (newP.value !== confirmP.value) {
        if (alertBox) {
            alertBox.style.display = 'block';
            alertBox.style.background = 'rgba(239,68,68,0.15)';
            alertBox.style.color = '#ef4444';
            alertBox.innerText = 'Naya password aur confirm password match nahi ho rahe.';
        }
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating Password...';

    try {
        const res = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                currentPassword: current.value,
                newPassword: newP.value
            })
        });
        const data = await res.json().catch(() => ({}));
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-key"></i> Update Password';

        if (!res.ok || !data.success) {
            if (alertBox) {
                alertBox.style.display = 'block';
                alertBox.style.background = 'rgba(239,68,68,0.15)';
                alertBox.style.color = '#ef4444';
                alertBox.innerText = data.error || 'Password update karne me truti aayi.';
            }
            return;
        }

        if (alertBox) {
            alertBox.style.display = 'block';
            alertBox.style.background = 'rgba(16,185,129,0.15)';
            alertBox.style.color = '#10b981';
            alertBox.innerText = 'Aapka password safaltapoorvak update ho gaya hai!';
        }
        current.value = '';
        newP.value = '';
        confirmP.value = '';
        setTimeout(() => { if (alertBox) alertBox.style.display = 'none'; }, 3000);

    } catch(e) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-key"></i> Update Password';
        if (alertBox) {
            alertBox.style.display = 'block';
            alertBox.style.background = 'rgba(239,68,68,0.15)';
            alertBox.style.color = '#ef4444';
            alertBox.innerText = 'Network error: Server se jud nahi sake.';
        }
    }
}

// --- 17. SETTINGS ENHANCEMENTS ---
function switchSettingsTab(tabId) {
    document.querySelectorAll(".settings-tab").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".settings-pane").forEach(pane => pane.classList.remove("active"));
    
    const clickedTab = Array.from(document.querySelectorAll(".settings-tab")).find(tab => tab.getAttribute("onclick").includes(tabId));
    if (clickedTab) clickedTab.classList.add("active");
    
    const pane = document.getElementById("settings-" + tabId);
    if (pane) pane.classList.add("active");
}

function setSpecificTheme(theme) {
    document.querySelectorAll(".theme-btn").forEach(btn => btn.classList.remove("active"));
    const btn = document.getElementById(theme === "dark" ? "themeBtnDark" : "themeBtnLight");
    if (btn) btn.classList.add("active");
    
    if (theme === "light") {
        document.body.classList.add("light-mode");
    } else {
        document.body.classList.remove("light-mode");
    }
    
    localStorage.setItem("nyayi_theme", theme);
    const icon = document.getElementById("themeIcon");
    if (icon) icon.className = theme === "light" ? "fa-solid fa-sun" : "fa-solid fa-moon";
}

function exportData() {
    ConversationStore.getAll().then(data => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const dlAnchorElem = document.createElement("a");
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "nyayi_consultations.json");
        dlAnchorElem.click();
    });
}

// --- 16. COMPREHENSIVE SETTINGS & PROFILE CONTROLLER ---
function switchSettingsTab(tabName) {
    const tabs = document.querySelectorAll('.settings-tab');
    const panes = document.querySelectorAll('.settings-pane');
    
    tabs.forEach(t => t.classList.remove('active'));
    panes.forEach(p => p.classList.remove('active'));
    
    const targetTab = Array.from(tabs).find(t => {
        const oc = t.getAttribute('onclick') || '';
        return oc.includes(tabName);
    });
    if (targetTab) targetTab.classList.add('active');
    
    const targetPane = document.getElementById('settings-' + tabName);
    if (targetPane) targetPane.classList.add('active');

    if (tabName === 'memory') {
        loadUserMemories();
    }
}

function setSpecificTheme(theme) {
    const darkBtn = document.getElementById('themeBtnDark');
    const lightBtn = document.getElementById('themeBtnLight');
    const themeIcon = document.getElementById('themeIcon');
    
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('nyayi_theme', 'dark');
        if (darkBtn) darkBtn.classList.add('active');
        if (lightBtn) lightBtn.classList.remove('active');
        if (themeIcon) themeIcon.className = 'fa-solid fa-moon';
    } else {
        document.body.classList.remove('dark-mode');
        document.body.setAttribute('data-theme', 'light');
        localStorage.setItem('nyayi_theme', 'light');
        if (lightBtn) lightBtn.classList.add('active');
        if (darkBtn) darkBtn.classList.remove('active');
        if (themeIcon) themeIcon.className = 'fa-solid fa-sun';
    }
}

// Override openTool to initialize and populate settings modal
const originalOpenTool = openTool;
openTool = function(toolId) {
    originalOpenTool(toolId);
    if (toolId === "settings") {
        const theme = localStorage.getItem("nyayi_theme") || "dark";
        setSpecificTheme(theme);
        
        const currentUser = localStorage.getItem('nyayaUser') || 'Citizen';
        const currentEmail = localStorage.getItem('nyayi_user_email') || 'user@nyayi.in';
        
        const nameInput = document.getElementById('settingsUserName');
        if (nameInput) nameInput.value = currentUser;
        
        const emailInput = document.getElementById('settingsUserEmail');
        if (emailInput) emailInput.value = currentEmail;
        
        const langSel = document.getElementById('settingsAILang');
        if (langSel) langSel.value = localStorage.getItem('nyayaLanguage') || 'Multilingual';
        
        const autoSpeakEl = document.getElementById("settingsAutoSpeak");
        if (autoSpeakEl) autoSpeakEl.checked = window.autoSpeak !== false;
        
        const sendEnter = document.getElementById("settingsSendOnEnter");
        if (sendEnter) sendEnter.checked = localStorage.getItem("nyayi_send_enter") !== "false";
        
        loadUserMemories();
        switchSettingsTab("general");
    }
};

// Save Settings and notify user
const originalSaveSettings = typeof saveSettings === 'function' ? saveSettings : function() {};
saveSettings = function() {
    originalSaveSettings();
    
    const nameInput = document.getElementById('settingsUserName');
    if (nameInput && nameInput.value.trim()) {
        const newName = nameInput.value.trim();
        localStorage.setItem('nyayaUser', newName);
        user = newName;
        const welcomeEl = document.getElementById('welcomeUserName');
        const userDisplay = document.getElementById('userDisplayName');
        if (welcomeEl) welcomeEl.innerText = newName;
        if (userDisplay) userDisplay.innerText = newName;
    }
    
    const langSelect = document.getElementById('settingsAILang');
    if (langSelect) {
        localStorage.setItem('nyayaLanguage', langSelect.value);
        aiLanguage = langSelect.value;
        const mainLangSelect = document.getElementById('langSelect');
        if (mainLangSelect) mainLangSelect.value = langSelect.value;
    }
    
    const autoSpeakEl = document.getElementById("settingsAutoSpeak");
    if (autoSpeakEl) window.autoSpeak = autoSpeakEl.checked;
    
    const sendEnter = document.getElementById("settingsSendOnEnter");
    if (sendEnter) localStorage.setItem("nyayi_send_enter", sendEnter.checked);
    
    closeAllModals();
    
    // Quick confirmation alert / notification
    const banner = document.createElement('div');
    banner.style.cssText = 'position:fixed; bottom:24px; right:24px; background:#10b981; color:#000; padding:12px 20px; border-radius:10px; font-weight:700; font-size:13px; z-index:99999; box-shadow:0 10px 25px rgba(0,0,0,0.5); display:flex; align-items:center; gap:8px; animation:fadeIn 0.3s ease;';
    banner.innerHTML = '<i class="fa-solid fa-check"></i> Preferences Saved Successfully!';
    document.body.appendChild(banner);
    setTimeout(() => { banner.remove(); }, 2500);
};

// Fix for handleInputKey
handleInputKey = function(e) {
    const sendOnEnter = localStorage.getItem("nyayi_send_enter") !== "false";
    if (e.key === "Enter" && !e.shiftKey && sendOnEnter) {
        e.preventDefault();
        sendMessage();
    }
};

// ResizeObserver for #chat-box
const chatBox = document.getElementById("chat-box");
if (chatBox && window.ResizeObserver) {
    new ResizeObserver(() => {
        if (currentChatMessages && currentChatMessages.length > 0) {
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }).observe(chatBox);
}

// --- 18. USER PERSISTENT MEMORY CONTROLLER ---
let currentUserMemories = [];

async function loadUserMemories() {
    const email = localStorage.getItem('nyayi_user_email') || '';
    if (!email) {
        renderUserMemories([]);
        return;
    }
    try {
        const res = await fetch(`/api/user/memories?email=${encodeURIComponent(email)}`);
        const data = await res.json().catch(() => ({}));
        if (data && Array.isArray(data.memories)) {
            currentUserMemories = data.memories;
        } else {
            currentUserMemories = [];
        }
    } catch (e) {
        currentUserMemories = [];
    }
    renderUserMemories(currentUserMemories);
}

function renderUserMemories(memories) {
    const container = document.getElementById('userMemoryList');
    if (!container) return;

    if (!Array.isArray(memories) || memories.length === 0) {
        container.innerHTML = `
            <div style="color:var(--nyayi-text-muted); font-size:13px; font-style:italic; padding:14px; background:var(--nyayi-surface); border:1px dashed var(--nyayi-surface-border); border-radius:var(--radius-sm); text-align:center;">
                No active memories saved yet. Add your legal profile, city/state, or preferences above so Nyayi remembers them.
            </div>
        `;
        return;
    }

    let html = '';
    memories.forEach((mem, idx) => {
        html += `
            <div class="memory-item-card">
                <div class="memory-item-text">
                    <i class="fa-solid fa-brain"></i>
                    <span>${MessageRenderer.escapeHtml(mem)}</span>
                </div>
                <button type="button" class="memory-del-btn" onclick="handleDeleteUserMemory(${idx})" title="Delete this memory">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
    });
    container.innerHTML = html;
}

async function handleAddUserMemory() {
    const input = document.getElementById('newMemoryInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const email = localStorage.getItem('nyayi_user_email') || '';
    if (!email) {
        alert('Please log in to save AI memories.');
        return;
    }

    input.value = '';
    try {
        const res = await fetch('/api/user/memories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, memory: text })
        });
        const data = await res.json().catch(() => ({}));
        if (data && Array.isArray(data.memories)) {
            currentUserMemories = data.memories;
            renderUserMemories(currentUserMemories);
        }
    } catch (e) {
        console.warn('Failed to add memory', e);
    }
}

async function handleDeleteUserMemory(idx) {
    const email = localStorage.getItem('nyayi_user_email') || '';
    if (!email) return;

    try {
        const res = await fetch('/api/user/memories', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, index: idx })
        });
        const data = await res.json().catch(() => ({}));
        if (data && Array.isArray(data.memories)) {
            currentUserMemories = data.memories;
            renderUserMemories(currentUserMemories);
        }
    } catch (e) {
        console.warn('Failed to delete memory', e);
    }
}

async function handleClearAllMemories() {
    if (!confirm('Are you sure you want to delete all stored AI memories for your account?')) return;
    const email = localStorage.getItem('nyayi_user_email') || '';
    if (!email) return;

    try {
        await fetch('/api/user/memories', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, clearAll: true })
        });
        currentUserMemories = [];
        renderUserMemories([]);
    } catch (e) {
        console.warn('Failed to clear memories', e);
    }
}

// --- 19. APP SPLASH OVERLAY DISMISS ---
function dismissAppSplash() {
    const splash = document.getElementById('appSplashOverlay');
    if (!splash) return;
    const justLoggedIn = sessionStorage.getItem('nyayi_just_logged_in');
    if (justLoggedIn) {
        sessionStorage.removeItem('nyayi_just_logged_in');
        const sub = document.getElementById('splashSubText');
        const user = localStorage.getItem('nyayaUser') || 'Citizen';
        if (sub) sub.innerText = `Welcome back, ${user}! Initializing Nyayi...`;
    }
    setTimeout(() => {
        splash.classList.add('fade-out');
        setTimeout(() => {
            splash.style.display = 'none';
        }, 500);
    }, justLoggedIn ? 900 : 650);
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', dismissAppSplash);
} else {
    dismissAppSplash();
}


