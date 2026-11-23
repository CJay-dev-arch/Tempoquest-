/* =========================================
   0. SUPABASE CLIENT & CLOUD SYNC
   ========================================= */
const SUPABASE_URL = 'https://qdysogystxbjfcioevqg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tEQoueWMbK05j-zewiKQ_w_nIh1VwDd';

const supabaseClient = (
    window.supabase &&
    SUPABASE_URL.startsWith('https://') &&
    !SUPABASE_ANON_KEY.startsWith('YOUR_')
) ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

let isCloudSynced = false;

function setCloudBadge(synced) {
    isCloudSynced = synced;
    const badge = document.getElementById('cloudStatus');
    if (!badge) return;
    badge.textContent = synced ? '☁️ Supabase' : '☁️ Local';
    badge.classList.toggle('synced', synced);
}

function serializeExplorer(p) {
    return {
        id: p.id,
        name: p.name,
        age: p.age,
        avatar: p.avatar,
        stars: p.stars,
        streak: p.streak,
        daily_goal: p.dailyGoal,
        completed_today: p.completedToday,
        tested: Boolean(p.tested),
        unlocked_wardrobe: p.unlockedWardrobe || [],
        mastery: p.mastery || {}
    };
}

function hydrateExplorer(row) {
    const base = defaultMastery(1);
    if (row.mastery && typeof row.mastery === 'object') {
        Object.keys(row.mastery).forEach(k => {
            if (base[k]) base[k] = row.mastery[k];
        });
    }
    return {
        id: row.id,
        name: row.name,
        age: row.age || '7-9',
        avatar: row.avatar || '🌟',
        stars: Number(row.stars ?? 0),
        streak: Number(row.streak ?? 1),
        dailyGoal: Number(row.daily_goal ?? 3),
        completedToday: Number(row.completed_today ?? 0),
        tested: Boolean(row.tested),
        unlockedWardrobe: Array.isArray(row.unlocked_wardrobe) ? row.unlocked_wardrobe : [],
        mastery: base
    };
}

async function syncExplorerToSupabase(profile) {
    if (!supabaseClient || !profile) return;
    const { error } = await supabaseClient
        .from('explorers')
        .upsert(serializeExplorer(profile), { onConflict: 'id' });
    if (error) {
        console.warn('Supabase sync skipped/failed:', error.message);
        setCloudBadge(false);
    } else {
        setCloudBadge(true);
    }
}

async function loadExplorersFromSupabase() {
    if (!supabaseClient) {
        setCloudBadge(false);
        return;
    }
    const { data, error } = await supabaseClient
        .from('explorers')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.warn('Supabase load error:', error.message);
        setCloudBadge(false);
        return;
    }

    setCloudBadge(true);
    if (data && data.length > 0) {
        appState.profiles = data.map(hydrateExplorer);
        if (!appState.profiles.some(p => p.id === appState.activeId)) {
            appState.activeId = appState.profiles[0].id;
        }
        saveApp();
    } else {
        // Seed initial profiles into Supabase on first run
        for (const p of appState.profiles) {
            await syncExplorerToSupabase(p);
        }
    }
}

/* =========================================
   1. WEB AUDIO SYNTHESIZER
   ========================================= */
const AudioEngine = {
    ctx: null,
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    tone(freq = 440, dur = 0.22, type = 'triangle') {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + dur);
    },
    win() {
        [523.25, 659.25, 783.99, 1046.5].forEach((n, i) => {
            setTimeout(() => this.tone(n, 0.18, 'sine'), i * 85);
        });
    },
    tryAgain() {
        this.tone(233.08, 0.22, 'sawtooth');
    }
};

/* =========================================
   2. ALL 12 SUBJECTS, SONGS & ITEMS
   ========================================= */
const SUBJECTS = [
    { id: 'math', name: 'Math', icon: '➕', stage: 'k', desc: 'Beat addition & pattern math' },
    { id: 'counting', name: 'Counting', icon: '🔢', stage: 'prek', desc: 'Steady drum counting & steps' },
    { id: 'science', name: 'Science', icon: '🔬', stage: 'g2', desc: 'Sound waves, space & nature' },
    { id: 'stem', name: 'STEM', icon: '🤖', stage: 'g2', desc: 'Rhythm loops & coding logic' },
    { id: 'reading', name: 'Reading', icon: '📖', stage: 'prek', desc: 'Phonics rhymes & lyric clues' },
    { id: 'writing', name: 'Writing', icon: '✍️', stage: 'k', desc: 'Sentence melody & song lines' },
    { id: 'spelling', name: 'Spelling', icon: '🔤', stage: 'k', desc: 'Syllable beats & letter tiles' },
    { id: 'music', name: 'Music', icon: '🎹', stage: 'prek', desc: 'Pitch, scales & chord grooves' },
    { id: 'culture', name: 'Culture', icon: '🌍', stage: 'g2', desc: 'World drums & global songs' },
    { id: 'manners', name: 'Manners', icon: '🤝', stage: 'prek', desc: 'Kindness choruses & sharing' },
    { id: 'emotions', name: 'Emotions', icon: '💛', stage: 'k', desc: 'Happy & calm musical moods' },
    { id: 'selfawareness', name: 'Self Awareness', icon: '🧘', stage: 'g2', desc: 'Mindful breaths & focus beats' }
];

const QUEST_BANK = {
    math: [
        { q: "3 beats + 2 beats makes how many beats?", opts: ["4", "5", "6", "2"], ans: 1, hint: "Count 3 taps and add 2 more." },
        { q: "Two bars of 4 beats equal...", opts: ["6", "8", "10", "12"], ans: 1, hint: "4 + 4!" }
    ],
    counting: [
        { q: "Which number comes right after 7 in our count-up?", opts: ["6", "8", "9", "10"], ans: 1, hint: "5, 6, 7, ...!" }
    ],
    science: [
        { q: "What makes the sound waves you hear?", opts: ["Vibrations", "Shadows", "Magnets", "Clouds"], ans: 0, hint: "Strings and drums vibrate!" }
    ],
    stem: [
        { q: "Repeating a beat pattern 4 times is a...", opts: ["Loop", "Eraser", "Pause", "Folder"], ans: 0, hint: "In code, it loops around!" }
    ],
    reading: [
        { q: "Which word rhymes with 'CAT' in our verse?", opts: ["Hat", "Drum", "Star", "Jump"], ans: 0, hint: "Listen to the ending sound: -at." }
    ],
    writing: [
        { q: "How should an excited song line end?", opts: ["!", ",", "?", "nothing"], ans: 0, hint: "Exclamation mark brings the energy!" }
    ],
    spelling: [
        { q: "Complete the musical word: B _ A T", opts: ["E", "O", "U", "I"], ans: 0, hint: "B - E - A - T!" }
    ],
    music: [
        { q: "Which pitch sounds higher?", opts: ["Bird whistle", "Deep bass drum", "Quiet room", "Heavy thud"], ans: 0, hint: "High notes soar up!" }
    ],
    culture: [
        { q: "A djembe drum is most closely tied to...", opts: ["West Africa", "Antarctica", "Deep space", "Glaciers"], ans: 0, hint: "Hand-played goblet drum tradition." }
    ],
    manners: [
        { q: "Someone passes you the tambourine. What do you say?", opts: ["Thank you!", "Give it now!", "No way", "Move"], ans: 0, hint: "Polite words keep the band happy." }
    ],
    emotions: [
        { q: "A bouncy, upbeat melody usually feels...", opts: ["Cheerful", "Sleepy", "Angry", "Scary"], ans: 0, hint: "Upbeat rhythm = upbeat mood!" }
    ],
    selfawareness: [
        { q: "Feeling wiggly before a turn? Try...", opts: ["3 slow breaths", "Shouting", "Hiding", "Quitting"], ans: 0, hint: "Slow breathing steadies your rhythm." }
    ]
};

const SONGS = [
    { id: 'abc', title: 'The ABC Groove', lyric: 'A-B-C-D sing with me, E-F-G clap to the beat!' },
    { id: 'calm', title: 'Balloon Breath Jam', lyric: 'Breathe in slow like a giant balloon, breathe out smooth like a gentle tune.' },
    { id: 'yet', title: 'The Magic Word YET', lyric: 'I cannot play that chord... YET! Keep practicing and you will get!' }
];

const WARDROBE_ITEMS = [
    { id: 'hat', name: 'Star Cap', icon: '🧢', cost: 10 },
    { id: 'crown', name: 'Beat Crown', icon: '👑', cost: 25 },
    { id: 'glasses', name: 'Cool Shades', icon: '🕶️', cost: 15 },
    { id: 'mic', name: 'Pop Mic', icon: '🎤', cost: 20 }
];

/* =========================================
   3. STATE & STORAGE
   ========================================= */
const STORAGE_KEY = 'melody_minds_unified_v1';

function defaultMastery(level = 1) {
    const map = {};
    SUBJECTS.forEach(s => { map[s.id] = { level, xp: 0 }; });
    return map;
}

let appState = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    activeId: 'leo',
    profiles: [
        {
            id: 'leo',
            name: 'Leo',
            age: '7-9',
            avatar: '🦁',
            stars: 65,
            streak: 4,
            dailyGoal: 3,
            completedToday: 1,
            tested: true,
            unlockedWardrobe: ['hat'],
            mastery: defaultMastery(1)
        }
    ],
    questSubjectId: 'math',
    questStyle: 'pads',
    placementStep: 0,
    placementScore: 0
};

function saveApp(profileToSync = null) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    const target = profileToSync || currentExplorer();
    if (target) {
        syncExplorerToSupabase(target);
    }
}

function currentExplorer() {
    return appState.profiles.find(p => p.id === appState.activeId) || appState.profiles[0];
}

function sayMascot(html) {
    document.getElementById('mascotSpeech').innerHTML = html;
}

/* =========================================
   4. NAVIGATION & HEADER
   ========================================= */
function switchTab(tabName) {
    document.getElementById('viewPlacement').classList.add('hidden');
    document.getElementById('viewQuest').classList.add('hidden');
    document.querySelectorAll('.tab-panel').forEach(el => el.classList.add('hidden'));
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => switchTab(btn.dataset.tab);
});
document.getElementById('brandHome').onclick = () => switchTab('classroom');

function refreshHUD() {
    const u = currentExplorer();
    document.getElementById('streakCount').textContent = `${u.streak}d`;
    document.getElementById('starCount').textContent = u.stars;
    document.getElementById('activeExplorerName').textContent = u.name;

    const pct = Math.min(100, Math.round((u.completedToday / u.dailyGoal) * 100));
    document.getElementById('goalProgressBar').style.width = `${pct}%`;
    document.getElementById('goalBannerTitle').textContent =
        `Today's Learning Jam: ${u.completedToday} / ${u.dailyGoal} Mini-Games`;

    const encoreBtn = document.getElementById('btnEncoreBoost');
    const subText = document.getElementById('goalBannerSub');
    if (u.completedToday >= u.dailyGoal) {
        subText.textContent = '🎉 Goal Reached! Encore Mode active — keep leveling up past your goal!';
        encoreBtn.classList.remove('hidden');
    } else {
        subText.textContent = 'Every quest grows your mastery. Hit your goal to unlock Encore Boosts!';
        encoreBtn.classList.add('hidden');
    }
}

document.getElementById('btnEncoreBoost').onclick = () => {
    const u = currentExplorer();
    u.dailyGoal += 2;
    u.stars += 10;
    saveApp(u);
    refreshHUD();
    AudioEngine.win();
    sayMascot(`Encore unlocked! +10 ⭐ bonus and a new stretch goal of <strong>${u.dailyGoal}</strong>!`);
};

/* =========================================
   5. PLACEMENT SOUNDCHECK & PROFILES
   ========================================= */
const PLACEMENT_STEPS = [
    { q: "1. Rhythm Check: Clap 2 times, then 1 more time. Total claps?", opts: ["2", "3", "4"], ans: 1 },
    { q: "2. Rhyme Check: Which word rhymes with 'SING'?", opts: ["Ring", "Drum", "Book"], ans: 0 },
    { q: "3. Feeling Check: How do you feel trying a new skill?", opts: ["Curious!", "Scared to try", "Done forever"], ans: 0 }
];

function startPlacement() {
    appState.placementStep = 0;
    appState.placementScore = 0;
    document.querySelectorAll('.tab-panel').forEach(el => el.classList.add('hidden'));
    document.getElementById('viewQuest').classList.add('hidden');
    document.getElementById('viewPlacement').classList.remove('hidden');
    renderPlacementStep();
}

function renderPlacementStep() {
    const item = PLACEMENT_STEPS[appState.placementStep];
    const box = document.getElementById('placementBox');
    box.innerHTML = `
        <h3>${item.q}</h3>
        <div class="option-grid">
            ${item.opts.map((opt, idx) => `
                <button class="pad-option pad-${idx}" onclick="pickPlacement(${idx})">${opt}</button>
            `).join('')}
        </div>
    `;
}

window.pickPlacement = function(idx) {
    const item = PLACEMENT_STEPS[appState.placementStep];
    if (idx === item.ans) {
        appState.placementScore++;
        AudioEngine.tone(659.25, 0.18, 'sine');
    } else {
        AudioEngine.tone(330, 0.18, 'triangle');
    }
    appState.placementStep++;
    if (appState.placementStep < PLACEMENT_STEPS.length) {
        renderPlacementStep();
    } else {
        const u = currentExplorer();
        const startLvl = appState.placementScore >= 2 ? 2 : 1;
        u.mastery = defaultMastery(startLvl);
        u.tested = true;
        saveApp(u);
        renderSubjectsGrid();
        switchTab('classroom');
        sayMascot(`Soundcheck complete, <strong>${u.name}</strong>! Subjects tuned to <strong>Level ${startLvl}</strong>!`);
    }
};

/* =========================================
   6. CLASSROOM ABC, SUBJECTS & QUEST STAGE
   ========================================= */
function renderABC() {
    const grid = document.getElementById('abcGrid');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    grid.innerHTML = '';
    letters.forEach((ch, idx) => {
        const btn = document.createElement('button');
        btn.className = 'abc-key';
        btn.textContent = ch;
        btn.onclick = () => {
            const freq = 261.63 * Math.pow(2, (idx % 12) / 12);
            AudioEngine.tone(freq, 0.22, 'sine');
            sayMascot(`<strong>${ch}</strong> says "${ch.toLowerCase()}" — sing it out!`);
        };
        grid.appendChild(btn);
    });
}

function renderQuickSubjects() {
    const box = document.getElementById('quickSubjectsList');
    box.innerHTML = '';
    SUBJECTS.slice(0, 6).forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'tile-btn';
        btn.innerHTML = `<strong>${s.icon} ${s.name}</strong><span>${s.desc}</span>`;
        btn.onclick = () => openQuest(s.id);
        box.appendChild(btn);
    });
}

function renderSubjectsGrid(stageFilter = 'all') {
    const u = currentExplorer();
    const grid = document.getElementById('allSubjectsGrid');
    grid.innerHTML = '';

    const list = stageFilter === 'all' ? SUBJECTS : SUBJECTS.filter(s => s.stage === stageFilter);
    list.forEach(s => {
        const m = u.mastery[s.id] || { level: 1, xp: 0 };
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.innerHTML = `
            <div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:1.7rem;">${s.icon}</span>
                    <span class="badge-pill">Lvl ${m.level}</span>
                </div>
                <h3 style="margin-top:8px;">${s.name}</h3>
                <p class="muted" style="font-size:0.85rem;">${s.desc}</p>
            </div>
            <div>
                <small style="font-weight:800;">Mastery XP: ${m.xp}%</small>
                <div class="mini-bar"><div class="mini-bar-fill" style="width:${m.xp}%;"></div></div>
            </div>
        `;
        card.onclick = () => openQuest(s.id);
        grid.appendChild(card);
    });
}

document.querySelectorAll('#stagePills .filter-pill').forEach(pill => {
    pill.onclick = () => {
        document.querySelectorAll('#stagePills .filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        renderSubjectsGrid(pill.dataset.stage);
    };
});

function openQuest(subjectId) {
    appState.questSubjectId = subjectId;
    const subj = SUBJECTS.find(s => s.id === subjectId);
    const u = currentExplorer();
    const m = u.mastery[subjectId] || { level: 1, xp: 0 };

    document.querySelectorAll('.tab-panel').forEach(el => el.classList.add('hidden'));
    document.getElementById('viewPlacement').classList.add('hidden');
    document.getElementById('viewQuest').classList.remove('hidden');

    document.getElementById('questSubjectLabel').textContent = `${subj.icon} ${subj.name}`;
    document.getElementById('questLevelLabel').textContent = `Level ${m.level}`;
    renderQuestArena();
}

document.getElementById('btnBackFromQuest').onclick = () => switchTab('map');

document.getElementById('btnSwapStyle').onclick = () => {
    appState.questStyle = appState.questStyle === 'pads' ? 'sequencer' : 'pads';
    AudioEngine.tone(587.33, 0.15, 'triangle');
    renderQuestArena();
};

function renderQuestArena() {
    const subj = SUBJECTS.find(s => s.id === appState.questSubjectId);
    const u = currentExplorer();
    const m = u.mastery[subj.id];
    const pool = QUEST_BANK[subj.id] || QUEST_BANK.math;
    const item = pool[(m.level - 1) % pool.length];
    const arena = document.getElementById('questArena');
    const freqs = [261.63, 329.63, 392.0, 523.25];

    const modeLabel = appState.questStyle === 'pads' ? '🎹 Melody Pads' : '🎛️ Beat Sequencer';
    arena.innerHTML = `
        <span class="badge-pill">${modeLabel}</span>
        <h2 style="margin:14px 0;">${item.q}</h2>
        <button class="btn-outline btn-small" onclick="sayMascot('💡 Hint: ${item.hint.replace(/'/g, '')}')">💡 Ask Hint</button>
        <div class="option-grid">
            ${item.opts.map((opt, i) => `
                <button class="pad-option pad-${i}" onclick="submitQuestAnswer(${i}, ${item.ans}, ${freqs[i]})">
                    ${appState.questStyle === 'pads' ? '🎵' : '🥁'} ${opt}
                </button>
            `).join('')}
        </div>
    `;
}

window.submitQuestAnswer = function(chosen, correct, freq) {
    AudioEngine.tone(freq, 0.22, 'sine');
    const u = currentExplorer();
    const m = u.mastery[appState.questSubjectId];

    if (chosen === correct) {
        setTimeout(() => AudioEngine.win(), 150);
        u.stars += 10;
        u.completedToday += 1;
        m.xp += 50;
        if (m.xp >= 100) {
            m.level += 1;
            m.xp = 0;
        }
        saveApp(u);
        refreshHUD();
        renderSubjectsGrid();
        document.getElementById('questLevelLabel').textContent = `Level ${m.level}`;
        sayMascot(`⭐ +10 Stars! ${u.name} is now <strong>Level ${m.level}</strong>!`);
        setTimeout(renderQuestArena, 900);
    } else {
        AudioEngine.tryAgain();
        sayMascot('Not quite that note—try another tile or tap <strong>Ask Hint</strong>!');
    }
};

/* =========================================
   7. XYLOPHONE, DJ, JUKEBOX & WARDROBE
   ========================================= */
const NOTES = [
    { label: 'C5', freq: 523.25, color: '#FF7675' },
    { label: 'D5', freq: 587.33, color: '#FF9F43' },
    { label: 'E5', freq: 659.25, color: '#FDCB6E' },
    { label: 'F5', freq: 698.46, color: '#00B894' },
    { label: 'G5', freq: 783.99, color: '#00CEC9' },
    { label: 'A5', freq: 880.0,  color: '#0984E3' },
    { label: 'B5', freq: 987.77, color: '#6C5CE7' },
    { label: 'C6', freq: 1046.5, color: '#FD79A8' }
];
let composition = [];

function renderXylophone() {
    const container = document.getElementById('xyloKeys');
    container.innerHTML = '';
    NOTES.forEach((n, idx) => {
        const btn = document.createElement('button');
        btn.className = 'xylo-key';
        btn.style.background = n.color;
        btn.innerHTML = `<span>${idx + 1}</span><small>${n.label}</small>`;
        btn.onclick = () => {
            AudioEngine.tone(n.freq, 0.28, 'sine');
            composition.push(n.label);
            document.getElementById('xyloReadout').textContent =
                `My Composition: ${composition.slice(-16).join(' · ')}`;
        };
        container.appendChild(btn);
    });
}

window.addEventListener('keydown', e => {
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= 8) {
        const n = NOTES[num - 1];
        AudioEngine.tone(n.freq, 0.28, 'sine');
        composition.push(n.label);
        document.getElementById('xyloReadout').textContent =
            `My Composition: ${composition.slice(-16).join(' · ')}`;
    }
});

document.getElementById('btnClearXylo').onclick = () => {
    composition = [];
    document.getElementById('xyloReadout').textContent = 'My Composition: Tap keys or press 1–8...';
};

document.querySelectorAll('[data-song]').forEach(btn => {
    btn.onclick = () => {
        const seq = btn.dataset.song === 'twinkle' ? [0,0,4,4,5,5,4] : [0,1,2,3,4,5,6,7];
        seq.forEach((i, step) => setTimeout(() => AudioEngine.tone(NOTES[i].freq, 0.2, 'sine'), step * 240));
    };
});

function renderDJ() {
    const pads = [
        { name: 'Kick', freq: 110, type: 'sine' },
        { name: 'Snare', freq: 220, type: 'square' },
        { name: 'Hi-Hat', freq: 880, type: 'triangle' },
        { name: 'Synth', freq: 440, type: 'sawtooth' }
    ];
    const box = document.getElementById('djPads');
    box.innerHTML = '';
    pads.forEach(p => {
        const b = document.createElement('button');
        b.className = 'dj-pad';
        b.textContent = `🥁 ${p.name}`;
        b.onclick = () => AudioEngine.tone(p.freq, 0.16, p.type);
        box.appendChild(b);
    });
}

let grooveTimer = null;
document.getElementById('btnToggleGroove').onclick = function() {
    if (grooveTimer) {
        clearInterval(grooveTimer);
        grooveTimer = null;
        this.textContent = '🔁 Start Backing Groove';
    } else {
        let step = 0;
        grooveTimer = setInterval(() => {
            AudioEngine.tone(step % 2 === 0 ? 130.81 : 196.0, 0.14, 'triangle');
            step++;
        }, 420);
        this.textContent = '⏹ Stop Groove';
    }
};

function renderJukebox() {
    const list = document.getElementById('jukeboxList');
    list.innerHTML = '';
    SONGS.forEach(s => {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `<strong>${s.title}</strong><br><button class="btn-secondary btn-small" style="margin-top:8px;">▶ Play</button>`;
        card.querySelector('button').onclick = () => {
            document.getElementById('lyricStage').textContent = `🎶 "${s.lyric}"`;
            AudioEngine.win();
        };
        list.appendChild(card);
    });
}

function renderWardrobe() {
    const u = currentExplorer();
    const grid = document.getElementById('wardrobeGrid');
    grid.innerHTML = '';
    WARDROBE_ITEMS.forEach(item => {
        const owned = u.unlockedWardrobe.includes(item.id);
        const div = document.createElement('div');
        div.className = 'wardrobe-item';
        div.innerHTML = `
            <div style="font-size:2rem;">${item.icon}</div>
            <strong>${item.name}</strong>
            <p class="muted">${owned ? 'Unlocked ✅' : `⭐ ${item.cost}`}</p>
            <button class="btn-small ${owned ? 'btn-outline' : 'btn-primary'}">${owned ? 'Wear' : 'Unlock'}</button>
        `;
        div.querySelector('button').onclick = () => {
            if (owned) {
                sayMascot(`${u.name} put on <strong>${item.icon} ${item.name}</strong>!`);
            } else if (u.stars >= item.cost) {
                u.stars -= item.cost;
                u.unlockedWardrobe.push(item.id);
                saveApp(u);
                refreshHUD();
                renderWardrobe();
                AudioEngine.win();
            } else {
                sayMascot(`Need <strong>${item.cost} ⭐</strong>—finish a quick quest to earn more!`);
            }
        };
        grid.appendChild(div);
    });
}

/* =========================================
   8. MODALS & MASCOT
   ========================================= */
document.getElementById('btnGoalModal').onclick = () => document.getElementById('goalModal').classList.remove('hidden');
document.getElementById('btnSaveGoal').onclick = () => {
    document.getElementById('goalModal').classList.add('hidden');
    refreshHUD();
};
document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const u = currentExplorer();
        u.dailyGoal = parseInt(btn.dataset.goal, 10);
        saveApp(u);
    };
});

document.getElementById('btnExplorerModal').onclick = async () => {
    await loadExplorersFromSupabase();
    const list = document.getElementById('explorerList');
    list.innerHTML = '';
    appState.profiles.forEach(p => {
        const b = document.createElement('button');
        b.className = p.id === appState.activeId ? 'btn-primary btn-small' : 'btn-outline btn-small';
        b.textContent = `${p.avatar} ${p.name}`;
        b.onclick = () => {
            appState.activeId = p.id;
            saveApp(p);
            document.getElementById('explorerModal').classList.add('hidden');
            refreshHUD();
            renderSubjectsGrid();
            renderWardrobe();
            if (!p.tested) startPlacement();
        };
        list.appendChild(b);
    });
    document.getElementById('explorerModal').classList.remove('hidden');
};

document.getElementById('btnCloseExplorerModal').onclick = () => {
    document.getElementById('explorerModal').classList.add('hidden');
};

document.getElementById('createExplorerForm').onsubmit = async e => {
    e.preventDefault();
    const name = document.getElementById('newExplorerName').value.trim();
    const age = document.getElementById('newExplorerAge').value;
    if (!name) return;
    const newId = 'exp_' + Date.now();
    const created = {
        id: newId,
        name,
        age,
        avatar: '🌟',
        stars: 15,
        streak: 1,
        dailyGoal: 3,
        completedToday: 0,
        tested: false,
        unlockedWardrobe: [],
        mastery: defaultMastery(1)
    };
    appState.profiles.push(created);
    appState.activeId = newId;
    document.getElementById('newExplorerName').value = '';
    saveApp(created);
    document.getElementById('explorerModal').classList.add('hidden');
    refreshHUD();
    startPlacement();
};

document.getElementById('btnParentModal').onclick = () => {
    const u = currentExplorer();
    document.getElementById('parentStatsBody').innerHTML = `
        <p><strong>Explorer:</strong> ${u.avatar} ${u.name} (Ages ${u.age})</p>
        <p><strong>Stars:</strong> ⭐ ${u.stars} | <strong>Streak:</strong> 🔥 ${u.streak} days</p>
        <p><strong>Today's Quests:</strong> ${u.completedToday} / ${u.dailyGoal}</p>
        <p><strong>Storage Mode:</strong> ${isCloudSynced ? 'Connected to Supabase' : 'Local browser fallback'}</p>
    `;
    document.getElementById('parentModal').classList.remove('hidden');
};
document.getElementById('btnCloseParentModal').onclick = () => {
    document.getElementById('parentModal').classList.add('hidden');
};

function openToolModal(title, html) {
    document.getElementById('toolModalTitle').textContent = title;
    document.getElementById('toolModalBody').innerHTML = html;
    document.getElementById('toolModal').classList.remove('hidden');
}
document.getElementById('btnCloseToolModal').onclick = () => {
    document.getElementById('toolModal').classList.add('hidden');
};

document.getElementById('openBeatTapper').onclick = () => {
    let score = 0;
    openToolModal('🥁 Beat Tapper (+25 ⭐ at 50 pts)', `
        <p class="muted">Tap the drum pad to build your rhythm score!</p>
        <h2 id="tapScore" style="margin:14px 0;">Score: 0</h2>
        <button class="btn-accent" id="tapDrumBtn">🥁 TAP BEAT (+10)</button>
    `);
    document.getElementById('tapDrumBtn').onclick = () => {
        score += 10;
        AudioEngine.tone(146.83, 0.15, 'triangle');
        document.getElementById('tapScore').textContent = `Score: ${score}`;
        if (score === 50) {
            const u = currentExplorer();
            u.stars += 25;
            u.completedToday += 1;
            saveApp(u);
            refreshHUD();
            AudioEngine.win();
            sayMascot('🎉 50 points! You earned <strong>+25 ⭐</strong>!');
        }
    };
};

document.getElementById('openAnimalMatch').onclick = () => {
    openToolModal('🦉 Animal Orchestra Match', `
        <p class="muted">Pick the instrument that fits each friend:</p>
        <div class="option-grid">
            <button class="pad-option pad-0" onclick="AudioEngine.win(); sayMascot('🦁 Lion loves the deep Bass!');">🦁 Lion → Bass</button>
            <button class="pad-option pad-1" onclick="AudioEngine.win(); sayMascot('🐦 Bird loves the high Flute!');">🐦 Bird → Flute</button>
        </div>
    `);
};

document.getElementById('openSongMaker').onclick = () => {
    openToolModal('🎤 Song Maker', `
        <input id="rhymeWord" placeholder="Type a word (e.g. jump, sing, star)..." style="width:100%; padding:10px; border-radius:10px; border:2px solid #DFE6E9;">
        <button class="btn-primary btn-small" style="margin-top:10px;" id="genRhymeBtn">Make Rhyme</button>
        <p id="rhymeOut" style="margin-top:12px; font-weight:800;"></p>
    `);
    document.getElementById('genRhymeBtn').onclick = () => {
        const w = document.getElementById('rhymeWord').value.trim() || 'beat';
        document.getElementById('rhymeOut').textContent = `🎵 "Tap to the ${w}, move your feet, learning with music is super sweet!"`;
        AudioEngine.tone(523.25, 0.2, 'sine');
    };
};

document.getElementById('openStorybook').onclick = () => {
    openToolModal('📖 Musical Storybook', `
        <p>Once upon a beat, a curious explorer found a glowing xylophone in the forest. Every note planted a bright musical flower—and the higher they climbed, the braver their song became!</p>
    `);
};

document.getElementById('mascotAvatar').onclick = () => {
    AudioEngine.tone(659.25, 0.16, 'sine');
    sayMascot('Tip: Tap <strong>All 12 Subjects</strong> and hit <strong>Swap Game Style</strong> inside any quest!');
};

// Boot (local first for instant render, then hydrate from Supabase)
refreshHUD();
renderABC();
renderQuickSubjects();
renderSubjectsGrid();
renderXylophone();
renderDJ();
renderJukebox();
renderWardrobe();

loadExplorersFromSupabase().then(() => {
    refreshHUD();
    renderSubjectsGrid();
    renderWardrobe();
});
