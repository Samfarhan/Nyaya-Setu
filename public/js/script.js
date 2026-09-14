// =========================================================
// NYAYI PRO (न्यायी) — CORE CLIENT APPLICATION SCRIPT
// Architecture: IndexedDB Store • Multi-Turn Context Memory
// Date-Grouped History • Structured Legal Parser • Voice Engine
// Developed by Farhan Khan (BCA Student)
// =========================================================

// --- 1. APPLICATION STATE ---
let activeChatId = null;
let currentChatMessages = [];
let user = localStorage.getItem('nyayaUser') || "Citizen";
let aiLanguage = localStorage.getItem('nyayaLanguage') || 'Multilingual';
let activeAbortController = null;
let isGenerating = false;
let thinkingInterval = null;

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
    '156': { bnss: 'Section 175(3) BNSS', title: 'Magistrate Direction for FIR (156(3) Application)', old: 'Section 156(3) CrPC', category: 'Court Direction', details: 'Power of Judicial Magistrate to direct police to register FIR and submit investigation report.', nature: 'Judicial Remedy' },
    '161': { bnss: 'Section 180 BNSS', title: 'Police Examination of Witnesses (गवाहों के बयान)', old: 'Section 161 CrPC', category: 'Investigation', details: 'Police statement recording. Audio-video electronic recording permitted under new law.', nature: 'Investigation Procedure' },
    '164': { bnss: 'Section 183 BNSS', title: 'Magistrate Recording of Confessions & Statements', old: 'Section 164 CrPC', category: 'Judicial Statement', details: 'Statements and confessions recorded by Magistrate. Mandatory audio-video recording in sexual offences.', nature: 'Admissible Evidence' },
    '167': { bnss: 'Section 187 BNSS', title: 'Police Custody & Remand (पुलिस कस्टडी रिमांड)', old: 'Section 167 CrPC', category: 'Remand & Custody', details: '15-day police custody can be taken in parts across the first 40 or 60 days of the total detention period.', nature: 'Custody Powers' },
    '173': { bnss: 'Section 193 BNSS', title: 'Police Final Report / Charge-Sheet (आरोप पत्र)', old: 'Section 173 CrPC', category: 'Investigation Conclusion', details: 'Police report submission within 60/90 days. Police must inform victim of investigation progress within 90 days.', nature: 'Final Report' },
    '41A': { bnss: 'Section 35(3) BNSS', title: 'Notice of Appearance before Police Officer (Arrest Safeguards)', old: 'Section 41A CrPC', category: 'Arrest Protection', details: 'For offences punishable with less than 7 years imprisonment, notice of appearance is mandatory before arresting accused.', nature: 'Citizen Safeguard' },
    '437': { bnss: 'Section 480 BNSS', title: 'Regular Bail in Non-Bailable Offences by Magistrate', old: 'Section 437 CrPC', category: 'Bail Law', details: 'Conditions under which Magistrate court can release accused on bail in non-bailable offences.', nature: 'Discretionary Bail' },
    '438': { bnss: 'Section 482 BNSS', title: 'Anticipatory Bail (अग्रिम जमानत)', old: 'Section 438 CrPC', category: 'Pre-Arrest Bail', details: 'Application to Sessions Court or High Court for bail in anticipation of arrest in non-bailable offence.', nature: 'Protective Liberty' },
    '439': { bnss: 'Section 483 BNSS', title: 'Special Powers of High Court & Sessions Court on Bail', old: 'Section 439 CrPC', category: 'High Court Bail', details: 'Powers of Sessions and High Courts to grant regular bail or cancel bail granted by subordinate courts.', nature: 'Superior Court Powers' },
    '482': { bnss: 'Section 528 BNSS', title: 'Inherent Powers of High Court (Quashing of FIR / Proceedings)', old: 'Section 482 CrPC', category: 'High Court Jurisdiction', details: 'High Court power to quash malicious, fake, or compromise FIRs to prevent abuse of process of court.', nature: 'Inherent Justice' },
    '125': { bnss: 'Section 144 BNSS', title: 'Maintenance for Wives, Children & Parents (भरण-पोषण)', old: 'Section 125 CrPC', category: 'Maintenance & Family', details: 'Summary remedy for grant of monthly maintenance to deserted wives, minor children, and senior parents.', nature: 'Social Welfare Remedy' },
    '197': { bnss: 'Section 218 BNSS', title: 'Sanction for Prosecution of Public Servants & Police', old: 'Section 197 CrPC', category: 'Official Sanction', details: 'Government sanction required before prosecuting public servants for acts done in discharge of official duty.', nature: 'Sanction Requirement' }
};

// C. Law of Evidence: IEA to BSA Database (Bharatiya Sakshya Adhiniyam, 2023)
const BSA_DATABASE = {
    '65B': { bsa: 'Section 63 BSA', title: 'Admissibility of Electronic Records / Certificates (डिजिटल साक्ष्य)', old: 'Section 65B Evidence Act', category: 'Electronic Evidence', details: 'Electronic records, cloud logs, emails, and phone chats directly admissible. Standardized schedule certificate for hash integrity.', significance: 'Digital Records as Primary Evidence' },
    '25': { bsa: 'Section 23(1) BSA', title: 'Confession to Police Officer Not Admissible (पुलिस को दिया बयान)', old: 'Section 25 Evidence Act', category: 'Confession Law', details: 'No confession made to a police officer shall be proved against a person accused of any offence.', significance: 'Protection Against Coercion' },
    '27': { bsa: 'Section 23(2) BSA', title: 'Information Leading to Discovery of Fact / Weapon (बरामदगी)', old: 'Section 27 Evidence Act', category: 'Discovery Rule', details: 'So much of confession that distinctly leads to the discovery of a physical fact/weapon is admissible.', significance: 'Recovery Exception' },
    '32': { bsa: 'Section 26 BSA', title: 'Dying Declarations & Statements of Deceased Persons (मृत्युपूर्व कथन)', old: 'Section 32(1) Evidence Act', category: 'Dying Declaration', details: 'Statements made by a person as to cause of their death are admissible even without cross-examination.', significance: 'High Evidentiary Value' },
    '45': { bsa: 'Section 39 BSA', title: 'Opinions of Experts (Cyber Forensics & Digital Analysts)', old: 'Section 45 Evidence Act', category: 'Expert Testimony', details: 'Expert testimony expanded to include certified digital forensic examiners, cryptographers, and data analysts.', significance: 'Modern Scientific Proof' },
    '114A': { bsa: 'Section 119 BSA', title: 'Presumption of Absence of Consent in Certain Rape Cases', old: 'Section 114A Evidence Act', category: 'Legal Presumption', details: 'Where sexual intercourse is proved and victim states she did not consent, court shall presume absence of consent.', significance: 'Victim Protection Presumption' },
    '133': { bsa: 'Section 138 BSA', title: 'Accomplice Evidence & Approver Testimony (सह-अपराधी की गवाही)', old: 'Section 133 Evidence Act', category: 'Approver Evidence', details: 'An accomplice shall be a competent witness against an accused person; conviction not illegal merely because uncorroborated.', significance: 'Approver Evidence Standard' }
};

// D. Civil Procedure Code (CPC 1908) Database
const CPC_DATABASE = {
    'ORDER39': { cpc: 'Order XXXIX Rules 1 & 2 CPC', title: 'Temporary Injunctions & Interlocutory Stay Orders (स्टे ऑर्डर)', category: 'Civil Injunction', details: 'Urgent stay orders on property, construction, demolition, or contract. Requires 3 tests: Prima Facie Case, Balance of Convenience, and Irreparable Injury.', significance: 'Property & Civil Protection' },
    'ORDER7': { cpc: 'Order VII Rule 11 CPC', title: 'Rejection of Plaint (मुकदमा खारिज करने का आवेदन)', category: 'Pleading Defense', details: 'Plaint rejected where it discloses no cause of action, is undervalued, or barred by any law (e.g. Limitation Act).', significance: 'Preliminary Dismissal' },
    'ORDER8': { cpc: 'Order VIII Rule 1 CPC', title: 'Written Statement by Defendant (प्रतिवाद पत्र / W.S.)', category: 'Civil Defense', details: 'Defendant must file Written Statement within 30 days of summons, extendable up to 90 days (120 days in Commercial Courts).', significance: 'Defense Pleading Deadline' },
    'ORDER21': { cpc: 'Order XXI CPC', title: 'Execution of Decrees and Court Orders (डिक्री का निष्पादन)', category: 'Decree Enforcement', details: 'Execution procedure to realize monetary decrees, auction attached property, or recover physical possession of land.', significance: 'Enforcing Court Verdict' },
    'SEC89': { cpc: 'Section 89 CPC', title: 'Settlement of Disputes Outside Court (Mediation & Lok Adalat)', category: 'ADR & Mediation', details: 'Court referral of civil disputes to Arbitration, Conciliation, Judicial Settlement, Lok Adalat, or Mediation.', significance: 'Amicable Dispute Resolution' },
    'SEC96': { cpc: 'Section 96 CPC', title: 'First Appeal from Original Civil Decree (प्रथम अपील)', category: 'Civil Appeals', details: 'Statutory right to challenge trial court civil decree on both questions of fact and questions of law before District Court / High Court.', significance: 'Appellate Remedy' },
    'SEC100': { cpc: 'Section 100 CPC', title: 'Second Appeal to High Court (द्वितीय अपील)', category: 'High Court Appeal', details: 'Second appeal to High Court lies strictly on a Substantial Question of Law (कानून का सारभूत प्रश्न).', significance: 'Substantial Law Question Only' },
    'SEC115': { cpc: 'Section 115 CPC', title: 'Civil Revision to High Court (सिविल रिवीजन)', category: 'Revisionary Jurisdiction', details: 'High Court power to correct jurisdictional errors of subordinate courts where no regular appeal lies.', significance: 'Jurisdictional Correction' },
    'SEC9': { cpc: 'Section 9 CPC', title: 'Courts to Try All Civil Suits Unless Barred (दीवानी क्षेत्राधिकार)', category: 'Civil Jurisdiction', details: 'Civil courts have jurisdiction to try all suits of a civil nature unless expressly or impliedly barred by statute.', significance: 'Fundamental Civil Court Power' }
};

// E. Traffic Violations Detail
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

// --- 3. CONVERSATION STORE (INDEXEDDB + LOCALSTORAGE HYBRID) ---
const ConversationStore = {
    db: null,
    dbName: 'nyayi_legal_db',
    storeName: 'conversations',

    async init() {
        return new Promise((resolve) => {
            if (!('indexedDB' in window)) {
                resolve(false);
                return;
            }
            try {
                const request = indexedDB.open(this.dbName, 1);
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                        store.createIndex('updatedAt', 'updatedAt', { unique: false });
                    }
                };
                request.onsuccess = (e) => {
                    this.db = e.target.result;
                    this.migrateLegacyStorage().then(() => resolve(true));
                };
                request.onerror = () => resolve(false);
            } catch (err) {
                resolve(false);
            }
        });
    },

    async migrateLegacyStorage() {
        try {
            const legacy = localStorage.getItem('nyayaChats');
            if (legacy) {
                const parsed = JSON.parse(legacy);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const allCurrent = await this.getAll();
                    if (allCurrent.length === 0) {
                        for (const chat of parsed) {
                            await this.save({
                                id: chat.id || Date.now().toString(),
                                title: chat.title || 'Legal Consultation',
                                messages: chat.messages || [],
                                createdAt: chat.id ? parseInt(chat.id) || Date.now() : Date.now(),
                                updatedAt: Date.now()
                            });
                        }
                    }
                }
            }
        } catch (e) {}
    },

    async getAll() {
        if (!this.db) {
            const raw = localStorage.getItem('nyayaChats');
            return raw ? JSON.parse(raw) : [];
        }
        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const req = store.getAll();
                req.onsuccess = () => {
                    const items = req.result || [];
                    items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
                    resolve(items);
                };
                req.onerror = () => resolve([]);
            } catch (err) {
                resolve([]);
            }
        });
    },

    async get(id) {
        if (!this.db) {
            const all = await this.getAll();
            return all.find(c => c.id === id) || null;
        }
        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const req = store.get(id);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => resolve(null);
            } catch (err) {
                resolve(null);
            }
        });
    },

    async save(chat) {
        chat.updatedAt = Date.now();
        if (!chat.createdAt) chat.createdAt = Date.now();

        try {
            const all = await this.getAll();
            const idx = all.findIndex(c => c.id === chat.id);
            if (idx >= 0) all[idx] = chat;
            else all.unshift(chat);
            localStorage.setItem('nyayaChats', JSON.stringify(all));
        } catch (e) {}

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
        try {
            const all = await this.getAll();
            const filtered = all.filter(c => c.id !== id);
            localStorage.setItem('nyayaChats', JSON.stringify(filtered));
        } catch (e) {}

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

    async clearAll() {
        localStorage.removeItem('nyayaChats');
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
    // Generates meaningful, non-generic title from first user query
    generateMeaningfulTitle(query) {
        if (!query) return 'Legal Consultation';
        const q = query.trim();

        // Check common legal keywords
        const lower = q.toLowerCase();
        if (lower.includes('cyber') || lower.includes('fraud') || lower.includes('1930') || lower.includes('scam')) {
            return 'Cyber Fraud Recovery';
        }
        if (lower.includes('fir') || lower.includes('police') || lower.includes('thana')) {
            return 'Police FIR Guidance';
        }
        if (lower.includes('tenant') || lower.includes('rent') || lower.includes('landlord') || lower.includes('deposit')) {
            return 'Tenancy & Rent Dispute';
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

        // Clean first sentence / clause
        let clean = q.replace(/^[\s,?.!]+|[\s,?.!]+$/g, '');
        const firstClause = clean.split(/[,?.;\n]/)[0].trim();
        if (firstClause.length > 5 && firstClause.length <= 36) {
            return firstClause.charAt(0).toUpperCase() + firstClause.slice(1);
        }
        return clean.slice(0, 32).trim() + (clean.length > 32 ? '...' : '');
    },

    // Extracts sliding window of previous turns for /api/chat
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

// --- 5. STRUCTURED LEGAL RESPONSE PARSER ---
const MessageRenderer = {
    escapeHtml(text) {
        if (!text) return '';
        return text.replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
    },

    formatLegalResponse(rawText) {
        if (!rawText) return '';
        let text = rawText;

        // Bold & Headings
        text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // External links with security rel
        text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, 
            '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--primary); font-weight:600;">$1 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px;"></i></a>'
        );

        // List bullets
        text = text.replace(/^\* (.*$)/gim, '<li>$1</li>');
        text = text.replace(/^- (.*$)/gim, '<li>$1</li>');
        text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // Line breaks
        text = text.replace(/\n/g, '<br>');
        text = text.replace(/<br><\/li>/g, '</li>');
        text = text.replace(/<br><li>/g, '<li>');

        // Dynamic Sectioning: Short Answer
        text = text.replace(/<b>(Short Answer|संक्षिप्त उत्तर):<\/b>(.*?)(?=(<b>|<br><br>|$))/i,
            '<div class="legal-summary-box"><b><i class="fa-solid fa-bolt" style="color:var(--primary); margin-right:6px;"></i> Short Answer:</b>$2</div>'
        );

        // Dynamic Sectioning: What the Law Says
        text = text.replace(/<b>(What the Law Says|कानूनी प्रावधान|Applicable Indian Laws):<\/b>/gi,
            '<div style="margin-top:10px; font-weight:700; color:var(--primary);"><i class="fa-solid fa-book-bookmark"></i> What the Law Says:</div>'
        );

        // Dynamic Sectioning: What You Should Do / Action Steps
        text = text.replace(/<b>(What You Should Do|कार्रवाई योजना|Step-by-Step Action Plan):<\/b>/gi,
            '<div style="margin-top:10px; font-weight:700; color:var(--primary);"><i class="fa-solid fa-list-check"></i> What You Should Do:</div>'
        );

        // Dynamic Sectioning: Important Points / Cautions
        text = text.replace(/<b>(Important Points|Important Precaution|महत्वपूर्ण बातें):<\/b>/gi,
            '<div style="margin-top:10px; font-weight:700; color:var(--accent-amber);"><i class="fa-solid fa-triangle-exclamation"></i> Important Points:</div>'
        );

        // Statute Pill Replacement (using backticks)
        text = text.replace(/\b(BNS Section [0-9]+(\([0-9]+\))?|BNS [0-9]+|Section [0-9]+(\([0-9]+\))? BNS)/gi, 
            `<span class="statute-pill" onclick="quickConvert('$1')"><i class="fa-solid fa-scale-balanced"></i> $1</span>`
        );
        text = text.replace(/\b(BNSS Section [0-9]+(\([0-9]+\))?|BNSS [0-9]+|Section [0-9]+(\([0-9]+\))? BNSS)/gi, 
            `<span class="statute-pill" onclick="quickConvert('$1')"><i class="fa-solid fa-list-check"></i> $1</span>`
        );
        text = text.replace(/\b(BSA Section [0-9]+|Section [0-9]+ BSA|Section 65B|Section 63 BSA)/gi, 
            `<span class="statute-pill" onclick="quickConvert('$1')"><i class="fa-solid fa-file-shield"></i> $1</span>`
        );
        text = text.replace(/\b(Order 39|Order 7 Rule 11|Order 8 Rule 1|Section 89 CPC)/gi, 
            `<span class="statute-pill" onclick="quickConvert('$1')"><i class="fa-solid fa-building-shield"></i> $1</span>`
        );

        return text;
    },

    generateFollowUpQuestions(text) {
        const questions = [];
        const lower = text.toLowerCase();

        if (lower.includes('cheating') || lower.includes('fraud') || lower.includes('420') || lower.includes('318') || lower.includes('1930')) {
            questions.push('Bank me transaction chargeback request kaise karein?');
            questions.push('Cyber Crime Helpline 1930 complaint follow-up process kya hai?');
        } else if (lower.includes('fir') || lower.includes('police') || lower.includes('154') || lower.includes('173')) {
            questions.push('Zero FIR darj karwane ka exact step-by-step procedure batao.');
            questions.push('Agar police FIR na likhe toh SP ko letter kaise bhein?');
        } else if (lower.includes('tenant') || lower.includes('rent') || lower.includes('order 39') || lower.includes('stay')) {
            questions.push('Civil court me Stay Order (Order 39) lene ki zaroori shartein kya hain?');
            questions.push('Tenant ko Legal Eviction Notice bhejne ka format samjhao.');
        } else if (lower.includes('bail') || lower.includes('arrest') || lower.includes('438') || lower.includes('482')) {
            questions.push('Anticipatory Bail (अग्रिम जमानत) lene me kitna samay lagta hai?');
            questions.push('Police arrest karte waqt citizen ke 5 zaroori adhikar kya hain?');
        } else {
            questions.push('Is mamle me kaunse zaroori saboot (evidence) ikattha karne chahiye?');
            questions.push('Kya is mamle me bina thane gaye seedhe magistrate ke paas ja sakte hain?');
        }

        return questions.slice(0, 2);
    }
};

// --- 6. INITIALIZATION & LIFECYCLE ---
document.addEventListener('DOMContentLoaded', async () => {
    // Pre-warm SpeechSynthesis voices
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }

    // Initialize IndexedDB Storage
    await ConversationStore.init();

    // Restore selected AI language dropdown
    const langSelectEl = document.getElementById('langSelect');
    if (langSelectEl) langSelectEl.value = aiLanguage;

    // Restore dark mode
    if (localStorage.getItem('nyayaTheme') === 'light') {
        document.body.classList.add('light-mode');
        updateThemeIcon(false);
    } else {
        document.body.classList.remove('light-mode');
        updateThemeIcon(true);
    }

    // Restore user settings
    const savedName = localStorage.getItem('nyayaUser');
    if (savedName) {
        user = savedName;
        const nameInput = document.getElementById('userNameInput');
        if (nameInput) nameInput.value = user;
        updateWelcomeUserName();
    }
    const savedContact = localStorage.getItem('nyayaEmergencyContact');
    if (savedContact && document.getElementById('userEmergencyContact')) {
        document.getElementById('userEmergencyContact').value = savedContact;
    }

    // Load active conversation
    const allChats = await ConversationStore.getAll();
    if (allChats.length === 0) {
        await startNewChat();
    } else {
        await openChat(allChats[0].id);
    }

    // Modal click backdrop to close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeAllModals();
        });
    });

    // Close composer tools on outside click
    document.addEventListener('click', (e) => {
        const popup = document.getElementById('composerToolsPopup');
        const btn = document.getElementById('composerToolBtn');
        if (popup && popup.classList.contains('active')) {
            if (!popup.contains(e.target) && !btn.contains(e.target)) {
                popup.classList.remove('active');
            }
        }
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
            closeVoiceAssistant();
            const popup = document.getElementById('composerToolsPopup');
            if (popup) popup.classList.remove('active');
        }
        if ((e.altKey && e.key.toLowerCase() === 'v') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'v')) {
            e.preventDefault();
            openVoiceAssistant();
        }
    });

    // Touch swipe gesture for mobile drawer
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
        <div class="welcome-hero">
            <div class="welcome-ai-emblem">
                <i class="fa-solid fa-scale-balanced"></i>
            </div>
            <h1 class="welcome-title">Namaste, <span id="welcomeUserName">${MessageRenderer.escapeHtml(user)}</span> 👋</h1>
            <h2 class="welcome-subtitle">How can Nyayi help you today?</h2>
            <p class="welcome-tagline">Understand Indian law, rights and legal procedures in simple language.</p>
            
            <div class="domain-cards-grid">
                <div class="domain-card" onclick="askSuggestion('Mera online financial cyber fraud ho gaya hai, paise wapas kaise paayein? 1930 helpline kaise kaam karti hai?')">
                    <div class="domain-card-header">
                        <span class="domain-card-title"><i class="fa-solid fa-shield-halved"></i> Cyber Fraud</span>
                        <span class="domain-badge cyan">1930 Helpline</span>
                    </div>
                    <p class="domain-card-desc">Money lost online? Know what to do next.</p>
                </div>

                <div class="domain-card" onclick="askSuggestion('Police station me FIR darj karwane ka process kya hai aur agar police FIR likhne se mana kare toh kya adhikar hain?')">
                    <div class="domain-card-header">
                        <span class="domain-card-title"><i class="fa-solid fa-file-circle-check"></i> Police FIR</span>
                        <span class="domain-badge amber">Zero FIR</span>
                    </div>
                    <p class="domain-card-desc">Need help understanding the FIR process?</p>
                </div>

                <div class="domain-card" onclick="askSuggestion('Property ya tenancy dispute me legal rights aur civil stay order (Order 39) ke niyam samjhao.')">
                    <div class="domain-card-header">
                        <span class="domain-card-title"><i class="fa-solid fa-house-chimney-user"></i> Property Dispute</span>
                        <span class="domain-badge purple">Civil Rights</span>
                    </div>
                    <p class="domain-card-desc">Understand your rights in a property dispute.</p>
                </div>

                <div class="domain-card" onclick="askSuggestion('IPC Section 420, 302, 376 aur nayi BNS provisions me kya antar hai? Kaunsi dhara lagu hogi?')">
                    <div class="domain-card-header">
                        <span class="domain-card-title"><i class="fa-solid fa-gavel"></i> BNS / IPC</span>
                        <span class="domain-badge">BNS 2023</span>
                    </div>
                    <p class="domain-card-desc">Compare old and new criminal law provisions.</p>
                </div>
            </div>

            <div class="suggestion-chips">
                <button class="chip" onclick="askSuggestion('Anticipatory bail lene ki prakriya aur Section 482 BNSS samjhao.')">
                    <i class="fa-solid fa-handcuffs"></i> Anticipatory Bail Guide
                </button>
                <button class="chip" onclick="askSuggestion('Motor Vehicle Act ke tehat bina helmet aur bina insurance challan fine kitna hai?')">
                    <i class="fa-solid fa-calculator"></i> Traffic Challan Fines
                </button>
                <button class="chip" onclick="askSuggestion('Cheque bounce hone par Section 138 NI Act ka legal notice kaise bhein?')">
                    <i class="fa-solid fa-file-signature"></i> Cheque Bounce Notice
                </button>
            </div>
        </div>
    `;
    box.scrollTop = 0;
}

function askSuggestion(text) {
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
    
    if (role === 'user') {
        contentDiv.innerHTML = MessageRenderer.escapeHtml(text).replace(/\n/g, '<br>');
    } else {
        contentDiv.innerHTML = MessageRenderer.formatLegalResponse(text);
        
        // Legal Trust & Advocate Guidance Callout
        const calloutDiv = document.createElement('div');
        calloutDiv.className = 'advocate-callout';
        calloutDiv.innerHTML = '<i class="fa-solid fa-circle-info"></i> <span><b>Kanooni Salah:</b> Nyayi AI kanooni jaankari pradan karta hai. Adalat me vakalatnama aur mudde ke liye verified advocate se paramarsh karein.</span>';
        contentDiv.appendChild(calloutDiv);
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
            <button class="tool-pill" onclick="speakMessage(this, decodeURIComponent('${encodeURIComponent(cleanForAudio)}'))" title="Listen to spoken response">
                <i class="fa-solid fa-volume-high"></i> Listen
            </button>
            <button class="tool-pill" onclick="copyMessageText(this, decodeURIComponent('${encodeURIComponent(cleanForAudio)}'))" title="Copy response text">
                <i class="fa-regular fa-copy"></i> Copy
            </button>
            <button class="tool-pill" onclick="shareResponse(decodeURIComponent('${encodeURIComponent(cleanForAudio)}'))" title="Share legal guidance">
                <i class="fa-solid fa-share-nodes"></i> Share
            </button>
            <button class="tool-pill" onclick="regenerateLastResponse()" title="Regenerate this answer">
                <i class="fa-solid fa-arrows-rotate"></i> Regenerate
            </button>
        `;
        bodyWrapper.appendChild(toolsDiv);
    }

    msgDiv.appendChild(avatar);
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

// --- 9. THINKING & GENERATION STATES ---
function showThinkingIndicator() {
    removeThinkingIndicator();
    const box = document.getElementById('chat-box');
    if (!box) return;

    const stages = [
        "Analyzing legal statutes & facts...",
        "Cross-referencing BNS 2023 & BNSS remedies...",
        "Synthesizing citizen action plan..."
    ];
    let stageIdx = 0;

    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'message ai-msg';
    indicator.innerHTML = `
        <div class="msg-avatar"><i class="fa-solid fa-scale-balanced"></i></div>
        <div class="typing-indicator">
            <div class="thinking-pulse-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
            <span id="thinkingStatusText">${stages[0]}</span>
        </div>
    `;
    box.appendChild(indicator);
    smoothScrollToBottom();

    thinkingInterval = setInterval(() => {
        stageIdx = (stageIdx + 1) % stages.length;
        const textEl = document.getElementById('thinkingStatusText');
        if (textEl) textEl.innerText = stages[stageIdx];
    }, 2000);
}

function removeThinkingIndicator() {
    if (thinkingInterval) {
        clearInterval(thinkingInterval);
        thinkingInterval = null;
    }
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
}

function setGeneratingState(generating) {
    isGenerating = generating;
    const sendBtn = document.getElementById('sendBtn');
    const sendIcon = document.getElementById('sendBtnIcon');
    if (!sendBtn || !sendIcon) return;

    if (generating) {
        sendBtn.classList.add('stop-mode');
        sendBtn.title = 'Stop Generating';
        sendIcon.className = 'fa-solid fa-stop';
    } else {
        sendBtn.classList.remove('stop-mode');
        sendBtn.title = 'Send Message';
        sendIcon.className = 'fa-solid fa-paper-plane';
    }
}

function handleSendOrStop() {
    if (isGenerating) stopGeneration();
    else sendMessage();
}

function stopGeneration() {
    if (activeAbortController) {
        activeAbortController.abort();
        activeAbortController = null;
    }
    removeThinkingIndicator();
    setGeneratingState(false);
}

// --- 10. COMPOSER & QUICK TOOLS POPUP ---
function toggleComposerTools() {
    const popup = document.getElementById('composerToolsPopup');
    if (popup) popup.classList.toggle('active');
}

function autoGrowTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 130) + 'px';
}

function handleInputKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function smoothScrollToBottom() {
    const box = document.getElementById('chat-box');
    if (!box) return;
    box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
}

// --- 11. SEND MESSAGE & API ORCHESTRATION ---
async function sendMessage() {
    const input = document.getElementById('userInput');
    const text = input ? input.value.trim() : '';
    if (!text || isGenerating) return;

    input.value = '';
    autoGrowTextarea(input);

    const popup = document.getElementById('composerToolsPopup');
    if (popup) popup.classList.remove('active');

    // Append user message
    appendMessage(text, 'user');

    // Retrieve or initialize conversation in store
    let currentChat = await ConversationStore.get(activeChatId);
    if (!currentChat) {
        const newId = 'conv_' + Date.now();
        currentChat = {
            id: newId,
            title: MemoryManager.generateMeaningfulTitle(text),
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        activeChatId = newId;
    } else if (currentChat.messages.length === 0 || currentChat.title === 'Legal Consultation' || currentChat.title === 'New Consultation') {
        currentChat.title = MemoryManager.generateMeaningfulTitle(text);
    }

    currentChat.messages.push({
        id: 'msg_' + Date.now(),
        role: 'user',
        text: text,
        timestamp: Date.now()
    });
    currentChatMessages = currentChat.messages;
    await ConversationStore.save(currentChat);
    await loadHistory();

    // Prepare multi-turn contextual history payload
    const contextHistory = MemoryManager.getContextPayload(currentChat.messages.slice(0, -1));

    // Initiate AI Generation
    setGeneratingState(true);
    showThinkingIndicator();
    activeAbortController = new AbortController();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                category: "Indian Legal Advisory",
                language: aiLanguage,
                history: contextHistory
            }),
            signal: activeAbortController.signal
        });

        removeThinkingIndicator();
        setGeneratingState(false);

        if (!response.ok) {
            throw new Error('Server returned status: ' + response.status);
        }

        const data = await response.json();
        const reply = data.reply || "Maaf karein, AI se uttar lene me samasya aayi.";

        appendMessage(reply, 'ai');
        currentChat.messages.push({
            id: 'msg_' + Date.now(),
            role: 'ai',
            text: reply,
            timestamp: Date.now()
        });
        currentChatMessages = currentChat.messages;
        await ConversationStore.save(currentChat);

        // Auto-speak response if triggered by voice assistant
        autoSpeakResponse(reply);

    } catch (err) {
        removeThinkingIndicator();
        setGeneratingState(false);

        if (err.name === 'AbortError') {
            appendMessage("Response generation was stopped.", 'ai');
        } else {
            console.error("Chat API error:", err);
            appendMessage("Network issue: Server se sampark nahi ho pa raha hai. Kripya check karein ki internet chal raha hai.", 'ai');
        }
    } finally {
        activeAbortController = null;
    }
}

async function regenerateLastResponse() {
    if (isGenerating) return;
    const currentChat = await ConversationStore.get(activeChatId);
    if (!currentChat || currentChat.messages.length === 0) return;

    let lastUserQuery = '';
    for (let i = currentChat.messages.length - 1; i >= 0; i--) {
        if (currentChat.messages[i].role === 'user') {
            lastUserQuery = currentChat.messages[i].text;
            break;
        }
    }
    if (!lastUserQuery) return;

    if (currentChat.messages[currentChat.messages.length - 1].role === 'ai') {
        currentChat.messages.pop();
    }

    const input = document.getElementById('userInput');
    if (input) {
        input.value = lastUserQuery;
        sendMessage();
    }
}

// --- 12. CHAT SESSIONS & DATE-GROUPED HISTORY ---
async function startNewChat() {
    const newId = 'conv_' + Date.now();
    const newChat = {
        id: newId,
        title: "Legal Consultation",
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    await ConversationStore.save(newChat);
    await openChat(newId);
    if (window.innerWidth <= 768) toggleSidebar(false);
}

async function openChat(chatId) {
    activeChatId = chatId;
    const box = document.getElementById('chat-box');
    if (!box) return;
    box.innerHTML = '';

    const chat = await ConversationStore.get(chatId);
    if (chat && chat.messages.length > 0) {
        currentChatMessages = chat.messages;
        chat.messages.forEach(m => appendMessage(m.text, m.role, true));
        box.scrollTop = 0;
    } else {
        currentChatMessages = [];
        renderEmptyState();
    }

    await loadHistory();
}

async function renameChat(chatId, event) {
    if (event) event.stopPropagation();
    const chat = await ConversationStore.get(chatId);
    if (!chat) return;

    const newTitle = prompt("Enter new consultation title:", chat.title || "Consultation");
    if (newTitle && newTitle.trim()) {
        chat.title = newTitle.trim();
        await ConversationStore.save(chat);
        await loadHistory();
    }
}

async function deleteChat(chatId, event) {
    if (event) event.stopPropagation();
    await ConversationStore.delete(chatId);
    const all = await ConversationStore.getAll();
    if (all.length > 0) {
        await openChat(all[0].id);
    } else {
        await startNewChat();
    }
}

async function clearHistory() {
    if (confirm("Kya aap apni saari consultation history clear karna chahte hain?")) {
        await ConversationStore.clearAll();
        await startNewChat();
    }
}

async function clearLocalData() {
    if (confirm("WARNING: This will delete ALL saved conversations and reset local settings. Proceed?")) {
        await ConversationStore.clearAll();
        localStorage.clear();
        closeAllModals();
        alert("All local data cleared successfully.");
        window.location.reload();
    }
}

// Date Grouping Helper
function categorizeByDate(timestamp) {
    const now = new Date();
    const date = new Date(timestamp || Date.now());
    
    // Reset hours to compare calendar days
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const diffDays = Math.round((today - target) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return 'Previous 7 Days';
    return 'Older';
}

async function loadHistory(filterText = '') {
    const list = document.getElementById('historyList');
    if (!list) return;
    list.innerHTML = '';

    const chats = await ConversationStore.getAll();
    const filtered = filterText ? chats.filter(c => (c.title || '').toLowerCase().includes(filterText.toLowerCase())) : chats;

    if (filtered.length === 0) {
        list.innerHTML = '<div style="padding:10px 12px; font-size:11.5px; color:var(--text-muted);">No consultations found</div>';
        return;
    }

    // Group chats into Today, Yesterday, Previous 7 Days, Older
    const groups = {
        'Today': [],
        'Yesterday': [],
        'Previous 7 Days': [],
        'Older': []
    };

    filtered.forEach(chat => {
        const cat = categorizeByDate(chat.updatedAt || chat.createdAt);
        groups[cat].push(chat);
    });

    ['Today', 'Yesterday', 'Previous 7 Days', 'Older'].forEach(groupName => {
        const items = groups[groupName];
        if (items.length === 0) return;

        const header = document.createElement('div');
        header.className = 'history-group-header';
        header.innerText = groupName;
        list.appendChild(header);

        items.forEach(chat => {
            const item = document.createElement('div');
            item.className = `history-item ${chat.id === activeChatId ? 'active' : ''}`;
            item.innerHTML = `
                <i class="fa-regular fa-message" style="font-size:11.5px; color:var(--text-muted);"></i>
                <span class="history-item-title">${MessageRenderer.escapeHtml(chat.title || "Consultation")}</span>
                <div class="history-item-actions">
                    <i class="fa-solid fa-pen history-action-btn" title="Rename" onclick="renameChat('${chat.id}', event)"></i>
                    <i class="fa-solid fa-trash-can history-action-btn delete-btn" title="Delete" onclick="deleteChat('${chat.id}', event)"></i>
                </div>
            `;
            item.onclick = () => {
                openChat(chat.id);
                if (window.innerWidth <= 768) toggleSidebar(false);
            };
            list.appendChild(item);
        });
    });
}

function filterHistory(query) {
    loadHistory(query.trim());
}

// --- 13. MODAL MANAGEMENT (PRESERVED) ---
function openTool(toolName) {
    closeAllModals();
    if (window.innerWidth <= 768) toggleSidebar(false);

    const modalMap = {
        'bns': 'modal-bns',
        'fine': 'modal-fine',
        'drafter': 'modal-drafter',
        'lawyer': 'modal-lawyer',
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
    const popup = document.getElementById('composerToolsPopup');
    if (popup) popup.classList.remove('active');
}

// --- 14. STATUTORY TOOLS & SEARCH ENGINES (PRESERVED) ---
function setStatuteFilter(statute, btn) {
    activeStatuteFilter = statute;
    document.querySelectorAll('.conv-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    convertSection();
}

function quickConvert(val) {
    openTool('bns');
    const input = document.getElementById('ipc-input');
    if (input) {
        input.value = val;
        convertSection();
    }
}

function convertSection() {
    const input = document.getElementById('ipc-input');
    const resultDiv = document.getElementById('bns-result');
    if (!input || !resultDiv) return;

    const raw = input.value.trim();
    const query = raw.toUpperCase().replace(/[^0-9A-Z]/g, '');

    if (!raw) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<span style="color:#ef4444; font-size:13px;">Kripya koi Dhara (Section), Order ya Keyword darj karein (e.g. 302, 420, 154, 438, 65B, Order 39, Zero FIR).</span>';
        return;
    }

    resultDiv.style.display = 'block';
    let resultsHtml = '';
    let matchesCount = 0;

    // BNS Check
    if (activeStatuteFilter === 'all' || activeStatuteFilter === 'bns') {
        const bnsHit = BNS_DATABASE[query] || Object.values(BNS_DATABASE).find(x => x.bns.toUpperCase().includes(query) || x.title.toLowerCase().includes(raw.toLowerCase()));
        if (bnsHit) {
            matchesCount++;
            resultsHtml += `
                <div style="background:var(--card-bg); border:1px solid var(--border); border-left:3px solid #dc2626; padding:12px 14px; border-radius:10px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="font-size:10px; font-weight:800; background:#fee2e2; color:#dc2626; padding:2px 7px; border-radius:4px;">PENAL LAW (BNS 2023)</span>
                        <span style="font-size:11.5px; color:var(--text-muted);">IPC: <b>${query}</b></span>
                    </div>
                    <div style="font-size:15px; font-weight:800; color:var(--text-main); margin-bottom:2px;">Nayi BNS: ${bnsHit.bns}</div>
                    <div style="font-weight:700; font-size:13px; color:var(--primary); margin-bottom:6px;">${bnsHit.title}</div>
                    <div style="font-size:12.5px; line-height:1.55; color:var(--text-main);">
                        <div>⚖️ <b>Saza:</b> ${bnsHit.punishment}</div>
                        <div>🔒 <b>Bailability:</b> ${bnsHit.bailable} • 🚨 <b>Nature:</b> ${bnsHit.cognizable}</div>
                    </div>
                    <button class="modal-btn" style="margin-top:8px; font-size:12px; padding:7px 12px;" onclick="closeAllModals(); askSuggestion('Mujhe BNS ${bnsHit.bns} (purani IPC ${query}) ke baare me vistrit kanooni jankari dein.')">
                        <i class="fa-solid fa-robot"></i> Research BNS ${bnsHit.bns} with AI
                    </button>
                </div>
            `;
        }
    }

    // BNSS Check
    if (activeStatuteFilter === 'all' || activeStatuteFilter === 'bnss') {
        const bnssHit = BNSS_DATABASE[query] || Object.values(BNSS_DATABASE).find(x => x.bnss.toUpperCase().includes(query) || x.title.toLowerCase().includes(raw.toLowerCase()) || (x.old && x.old.toUpperCase().includes(query)));
        if (bnssHit) {
            matchesCount++;
            resultsHtml += `
                <div style="background:var(--card-bg); border:1px solid var(--border); border-left:3px solid #16a34a; padding:12px 14px; border-radius:10px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="font-size:10px; font-weight:800; background:#dcfce7; color:#16a34a; padding:2px 7px; border-radius:4px;">PROCEDURE (BNSS 2023)</span>
                        <span style="font-size:11.5px; color:var(--text-muted);">CrPC: <b>${bnssHit.old || query}</b></span>
                    </div>
                    <div style="font-size:15px; font-weight:800; color:var(--text-main); margin-bottom:2px;">Nayi BNSS: ${bnssHit.bnss}</div>
                    <div style="font-weight:700; font-size:13px; color:var(--primary); margin-bottom:6px;">${bnssHit.title}</div>
                    <p style="font-size:12.5px; line-height:1.55; color:var(--text-main); margin-bottom:6px;">${bnssHit.details}</p>
                    <div style="font-size:11.5px; color:var(--text-muted);">📂 <b>Category:</b> ${bnssHit.category} • 📌 ${bnssHit.nature}</div>
                    <button class="modal-btn" style="margin-top:8px; font-size:12px; padding:7px 12px;" onclick="closeAllModals(); askSuggestion('BNSS Section ${bnssHit.bnss} (CrPC ${bnssHit.old}) ke tehat kanooni prakriya aur adhikar samjhein.')">
                        <i class="fa-solid fa-robot"></i> Research BNSS Procedure with AI
                    </button>
                </div>
            `;
        }
    }

    // BSA Check
    if (activeStatuteFilter === 'all' || activeStatuteFilter === 'bsa') {
        const bsaHit = BSA_DATABASE[query] || Object.values(BSA_DATABASE).find(x => x.bsa.toUpperCase().includes(query) || x.title.toLowerCase().includes(raw.toLowerCase()) || (x.old && x.old.toUpperCase().includes(query)));
        if (bsaHit) {
            matchesCount++;
            resultsHtml += `
                <div style="background:var(--card-bg); border:1px solid var(--border); border-left:3px solid #0f766e; padding:12px 14px; border-radius:10px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="font-size:10px; font-weight:800; background:#ccfbf1; color:#0f766e; padding:2px 7px; border-radius:4px;">EVIDENCE (BSA 2023)</span>
                        <span style="font-size:11.5px; color:var(--text-muted);">IEA: <b>${bsaHit.old || query}</b></span>
                    </div>
                    <div style="font-size:15px; font-weight:800; color:var(--text-main); margin-bottom:2px;">Nayi BSA: ${bsaHit.bsa}</div>
                    <div style="font-weight:700; font-size:13px; color:var(--primary); margin-bottom:6px;">${bsaHit.title}</div>
                    <p style="font-size:12.5px; line-height:1.55; color:var(--text-main); margin-bottom:6px;">${bsaHit.details}</p>
                    <div style="font-size:11.5px; color:var(--text-muted);">💡 <b>Key Rule:</b> ${bsaHit.significance}</div>
                    <button class="modal-btn" style="margin-top:8px; font-size:12px; padding:7px 12px;" onclick="closeAllModals(); askSuggestion('Bharatiya Sakshya Adhiniyam me ${bsaHit.bsa} ke tehat saboot pramanit karne ke niyam samjhao.')">
                        <i class="fa-solid fa-robot"></i> Research BSA Evidence Rules with AI
                    </button>
                </div>
            `;
        }
    }

    // CPC Check
    if (activeStatuteFilter === 'all' || activeStatuteFilter === 'cpc') {
        const cpcHit = CPC_DATABASE[query] || CPC_DATABASE[raw.replace(/\s+/g, '').toUpperCase()] || Object.values(CPC_DATABASE).find(x => x.cpc.toUpperCase().includes(raw.toUpperCase()) || x.title.toLowerCase().includes(raw.toLowerCase()));
        if (cpcHit) {
            matchesCount++;
            resultsHtml += `
                <div style="background:var(--card-bg); border:1px solid var(--border); border-left:3px solid #7e22ce; padding:12px 14px; border-radius:10px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="font-size:10px; font-weight:800; background:#f3e8ff; color:#7e22ce; padding:2px 7px; border-radius:4px;">CIVIL (CPC 1908)</span>
                        <span style="font-size:11.5px; color:var(--text-muted);">Civil Code</span>
                    </div>
                    <div style="font-size:15px; font-weight:800; color:var(--text-main); margin-bottom:2px;">${cpcHit.cpc}</div>
                    <div style="font-weight:700; font-size:13px; color:var(--primary); margin-bottom:6px;">${cpcHit.title}</div>
                    <p style="font-size:12.5px; line-height:1.55; color:var(--text-main); margin-bottom:6px;">${cpcHit.details}</p>
                    <div style="font-size:11.5px; color:var(--text-muted);">⚖️ <b>Litigation Standard:</b> ${cpcHit.significance}</div>
                    <button class="modal-btn" style="margin-top:8px; font-size:12px; padding:7px 12px;" onclick="closeAllModals(); askSuggestion('Civil Procedure Code (CPC) me ${cpcHit.cpc} ke tehat case jeetne ki strategy samjhao.')">
                        <i class="fa-solid fa-robot"></i> Research CPC Civil Procedure with AI
                    </button>
                </div>
            `;
        }
    }

    if (matchesCount > 0) {
        resultDiv.innerHTML = resultsHtml;
    } else {
        resultDiv.innerHTML = `
            <div style="padding:14px; background:var(--bg-body); border-radius:10px; text-align:center;">
                <p style="color:var(--text-muted); font-size:12.5px; margin-bottom:8px;">"${MessageRenderer.escapeHtml(raw)}" quick index me nahi mila.</p>
                <button class="modal-btn" onclick="closeAllModals(); askSuggestion('${MessageRenderer.escapeHtml(raw)} ke bare me BNS, BNSS, BSA aur CPC ke tehat complete legal analysis provide karein.')">
                    <i class="fa-solid fa-magnifying-glass"></i> Deep Search in Nyayi AI Law Engine
                </button>
            </div>
        `;
    }
}

// Traffic Fine Calculator
function calculateFine() {
    const type = document.getElementById('fine-type').value;
    const resultDiv = document.getElementById('fine-result');
    const fineInfo = TRAFFIC_FINES[type];

    if (fineInfo) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div style="background:var(--primary-light); padding:12px 14px; border-radius:10px; border-left:3px solid var(--primary);">
                <div style="font-size:12px; color:var(--text-muted);">${fineInfo.section}</div>
                <div style="font-size:20px; font-weight:800; color:#ef4444; margin:3px 0;">Challan: ${fineInfo.fine}</div>
                <div style="font-weight:700; font-size:13.5px; margin-bottom:4px;">${fineInfo.title}</div>
                <div style="font-size:12.5px; color:var(--text-main);">${fineInfo.penalty}</div>
            </div>
            <div style="margin-top:12px; display:flex; gap:8px;">
                <a href="https://echallan.parivahan.gov.in" target="_blank" class="lawyer-call-btn" style="background:#111827; color:#fff; flex:1; justify-content:center;">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Pay on eChallan Parivahan
                </a>
            </div>
        `;
    }
}

// Legal Notice Drafter
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
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <b><i class="fa-solid fa-scale-balanced"></i> Advocate Standard Legal Notice:</b>
            <button class="tool-pill" onclick="copyTextToClipboard(\`${encodeURIComponent(noticeText)}\`, this)">
                <i class="fa-regular fa-copy"></i> Copy Notice
            </button>
        </div>
        <pre style="white-space:pre-wrap; font-family:inherit; background:var(--sidebar-bg); padding:12px; border-radius:8px; border:1px solid var(--border); font-size:12.5px; line-height:1.55;">${MessageRenderer.escapeHtml(noticeText)}</pre>
        <button class="modal-btn" style="margin-top:10px; font-size:12.5px; padding:8px;" onclick="window.print()">
            <i class="fa-solid fa-print"></i> Print Notice
        </button>
    `;
}

// Which Law Applies (Fact-to-Law Analyzer)
async function analyzeFactsToLaw() {
    const input = document.getElementById('factlaw-input').value.trim();
    const resultDiv = document.getElementById('factlaw-result');

    if (!input) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<span style="color:#ef4444;">Kripya apni ghatna ke mukhya tathya (facts) darj karein.</span>';
        return;
    }

    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<div style="color:var(--primary);"><i class="fa-solid fa-spinner fa-spin"></i> Kanooni dharaon aur BNS ki janch ki ja rahi hai...</div>';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: input, category: "Which Law Applies" })
        });
        const data = await response.json();
        resultDiv.innerHTML = MessageRenderer.formatLegalResponse(data.reply || "Analysis complete.");
    } catch (e) {
        resultDiv.innerHTML = '<span style="color:#ef4444;">Analysis me samasya aayi. Kripya punah prayas karein.</span>';
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
        resultDiv.innerHTML = '<span style="color:#ef4444;">Kripya kisi Case Law ka naam, citation ya judgment text paste karein.</span>';
        return;
    }

    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<div style="color:var(--primary);"><i class="fa-solid fa-spinner fa-spin"></i> Judgment aur Ratio Decidendi simplify ki ja rahi hai...</div>';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: input, category: "Case Law Simplifier" })
        });
        const data = await response.json();
        resultDiv.innerHTML = MessageRenderer.formatLegalResponse(data.reply || "Simplification complete.");
    } catch (e) {
        resultDiv.innerHTML = '<span style="color:#ef4444;">Case Law analysis me samasya aayi. Kripya punah prayas karein.</span>';
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
    if (isVoiceMuted) { if (onEnd) onEnd(); return; }
    const synth = window.speechSynthesis;
    if (!synth) { if (onEnd) onEnd(); return; }

    synth.cancel();
    if (synth.paused) synth.resume();

    setTimeout(() => {
        let cleanText = text
            .replace(/<[^>]*>/g, ' ')
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
            .replace(/[\*#_`~|]/g, '')
            .replace(/\bhttps?:\/\/\S+/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (!cleanText) { if (onEnd) onEnd(); return; }
        if (cleanText.length > 800) {
            cleanText = cleanText.substring(0, 800) + '... aur adhik jaankari ke liye text padhein.';
        }

        const detectedLang = detectTextLanguage(cleanText);
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = detectedLang;
        utterance.rate = detectedLang.startsWith('hi') ? 0.92 : 0.95;
        utterance.pitch = 1.12;

        const speakNow = () => {
            const voices = synth.getVoices();
            if (voices.length > 0) {
                const bestVoice = selectBestVoice(voices, detectedLang);
                if (bestVoice) utterance.voice = bestVoice;
            }
            if (onStart) utterance.onstart = onStart;
            if (onEnd) { utterance.onend = onEnd; utterance.onerror = onEnd; }
            synth.resume();
            synth.speak(utterance);
        };

        if (synth.getVoices().length > 0) { speakNow(); }
        else { synth.onvoiceschanged = speakNow; setTimeout(speakNow, 200); }
    }, 120);
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
        () => { btn.innerHTML = '<i class="fa-solid fa-stop"></i> Stop'; },
        () => { btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Listen'; }
    );
}

function autoSpeakResponse(text) {
    if (isVoiceQuery && autoSpeak) {
        isVoiceQuery = false;
        playTTS(text);
    }
}

// --- 16. VOICE ASSISTANT SYSTEM (PRESERVED) ---
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
                    respBox.innerHTML = MessageRenderer.formatLegalResponse(reply);
                }

                appendMessage(reply, 'ai');

                document.getElementById('voiceStatus').innerText = '🔊 Assistant Speaking... (Tap mic to speak again)';

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
    if (document.getElementById('voiceOverlay').classList.contains('active')) {
        startVoiceRecognition();
    }
}

function toggleMic() {
    openVoiceAssistant();
}

// --- 17. UTILITIES & CLIPBOARD ---
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
            title: 'Nyayi Legal Guidance',
            text: text,
            url: window.location.href
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(text);
        alert('Legal guidance copied to clipboard!');
    }
}

// --- 18. NAVIGATION & UI CONTROLS ---
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
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('nyayaTheme', isLight ? 'light' : 'dark');
    updateThemeIcon(!isLight);
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
        updateWelcomeUserName();
    }
    if (contactVal) {
        localStorage.setItem('nyayaEmergencyContact', contactVal);
    }

    closeAllModals();
    alert("Settings saved successfully!");
    
    if (currentChatMessages.length === 0) {
        renderEmptyState();
    }
}
