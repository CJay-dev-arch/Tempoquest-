/* =========================================
   1. WEB AUDIO SYNTHESIZER (No external MP3s needed)
   ========================================= */
const AudioEngine = {
    ctx: null,
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    playNote(freq = 440, duration = 0.25, type = 'triangle') {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    playSuccess() {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((n, i) => setTimeout(() => this.playNote(n, 0.2, 'sine'), i * 90));
    },
    playOops() {
        this.playNote(220, 0.3, 'sawtooth');
        setTimeout(() => this.playNote(196, 0.35, 'sawtooth'), 150);
    }
};

/* =========================================
   2. CURRICULUM & SUBJECTS DATA (All 12 Topics)
   ========================================= */
const SUBJECTS = [
    { id: 'math', name: 'Math', icon: '➕', category: 'stem', color: '#FF7675', desc: 'Rhythm equations & beat fractions' },
    { id: 'counting', name: 'Counting', icon: '🔢', category: 'stem', color: '#FD79A8', desc: 'Count drumbeats & tempo steps' },
    { id: 'science', name: 'Science', icon: '🧪', category: 'stem', color: '#00B894', desc: 'Sound waves, nature & space jams' },
    { id: 'stem', name: 'STEM', icon: '🚀', category: 'stem', color: '#0984E3', desc: 'Coding loops & musical machines' },
    { id: 'reading', name: 'Reading', icon: '📖', category: 'literacy', color: '#6C5CE7', desc: 'Sing-along stories & lyric clues' },
    { id: 'writing', name: 'Writing', icon: '✍️', category: 'literacy', color: '#A29BFE', desc: 'Songwriting & sentence builders' },
    { id: 'spelling', name: 'Spelling', icon: '🔤', category: 'literacy', color: '#00CEC9', desc: 'Tap the syllable beats to spell' },
    { id: 'music', name: 'Music', icon: '🎹', category: 'arts', color: '#FDCB6E', desc: 'Melody memory, pitch & rhythm' },
    { id: 'culture', name: 'Culture', icon: '🌍', category: 'arts', color: '#E17055', desc: 'World instruments & global rhythms' },
    { id: 'manners', name: 'Manners', icon: '🤝', category: 'sel', color: '#55EFC4', desc: 'Kindness choruses & polite choices' },
    { id: 'emotions', name: 'Emotions', icon: '💛', category: 'sel', color: '#FAB1A0', desc: 'Major & minor mood melodies' },
    { id: 'selfawareness', name: 'Self Awareness', icon: '🧘', category: 'sel', color: '#81ECEC', desc: 'Mindful breathing & focus beats' }
];

// Interchangeable Mini-Game Mechanics
const GAME_MECHANICS = [
    { id: 'melody-match', name: 'Melody Match Pads' },
    { id: 'rhythm-builder', name: 'Lyric & Beat Sequencer' }
];

// Adaptive Question Bank per Subject & Level
const QUESTION_BANK = {
    math: [
        { q: "Play the pad that equals: 2 beats + 3 beats!", options: ["4", "5", "6", "3"], ans: 1, hint: "Count 2 claps, then 3 more!" },
        { q: "A measure has 8 beats. We played 3. How many left?", options: ["5", "4", "6", "3"], ans: 0, hint: "8 minus 3 equals..." },
        { q: "Multiply the tempo: 3 groups of 4 beats!", options: ["7", "10", "12", "16"], ans: 2, hint: "4 + 4 + 4!" }
    ],
    counting: [
        { q: "Listen to Bop's drum! How many notes did you hear?", playCount: 4, options: ["2", "4", "5", "3"], ans: 1, hint: "Count along with each beep!" },
        { q: "Which number comes right after 19 in our countdown?", options: ["18", "21", "20", "29"], ans: 2, hint: "18, 19, ...!" }
    ],
    spelling: [
        { q: "Tap the missing letters to complete the musical word: R H _ T H M", options: ["Y", "I", "E", "A"], ans: 0, hint: "It sounds like 'ri-thum'!" },
        { q: "Spell the word for a happy song tune: M E L _ D Y", options: ["A", "O", "U", "I"], ans: 1, hint: "Mel-O-dy!" }
    ],
    emotions: [
        { q: "A bright, fast major chord usually sounds...", options: ["Sleepy", "Happy & Excited", "Grumpy", "Scared"], ans: 1, hint: "Listen to the sunny sound!" },
        { q: "If a friend feels left out of the band, what is the best move?", options: ["Ignore them", "Invite them to play an instrument", "Laugh", "Walk away"], ans: 1, hint: "Music is better together!" }
    ],
    manners: [
        { q: "Someone shares their headphones with you. What lyric fits best?", options: ["Give me that!", "Thank you so much!", "Whatever", "Mine now"], ans: 1, hint: "Gratitude makes great harmony!" }
    ],
    selfawareness: [
        { q: "Before a big solo, your heart beats fast. How do you steady your tempo?", options: ["Take 3 slow deep breaths", "Yell loudly", "Run away", "Give up"], ans: 0, hint: "Slow breaths slow down your heart rhythm!" }
    ],
    science: [
        { q: "How does sound travel to your ears?", options: ["Invisible vibrations (waves)", "Magic dust", "Light beams", "Gravity"], ans: 0, hint: "Feel your throat hum when you sing!" }
    ],
    stem: [
        { q: "In coding, repeating a drumbeat 4 times is called a...", options: ["Bug", "Loop", "Glitch", "Screen"], ans: 1, hint: "It goes around and around!" }
    ],
    reading: [
        { q: "'The purple cat played a jazzy saxophone.' What instrument did the cat play?", options: ["Drums", "Saxophone", "Guitar", "Flute"], ans: 1, hint: "Read the last word of the lyric!" }
    ],
    writing: [
        { q: "Which sentence has the right punctuation to end an exciting song?", options: ["We won the concert!", "We won the concert,", "we won the concert", "We won? the concert"], ans: 0, hint: "Exciting sentences end with an exclamation mark!" }
    ],
    music: [
        { q: "Which note is higher in pitch?", options: ["Low Bass Drum", "High Bird Whistle", "They are the same", "Silence"], ans: 1, hint: "Think of a tiny bird singing high in a tree!" }
    ],
    culture: [
        { q: "The Djembe is a famous goblet-shaped drum originating from...", options: ["West Africa", "Antarctica", "Mars", "The Moon"], ans: 0, hint: "Played with bare hands in rich rhythmic traditions!" }
    ]
};

/* =========================================
   3. STATE MANAGEMENT & LOCAL STORAGE
   ========================================= */
let state = {
    profiles: JSON.parse(localStorage.getItem('tq_profiles')) || [
        { id: 'demo1', name: 'Maya', age: '7-9', avatar: '🦄', stars: 12, streak: 3, dailyGoal: 3, completedToday: 1, mastery: {} }
    ],
    currentUser: null,
    activeSubject: null,
    activeMechanicIndex: 0,
    placementStep: 0,
    placementScore: 0
};

function saveState() {
    localStorage.setItem('tq_profiles', JSON.stringify(state.profiles));
}

function updateMascot(text, playTone = true) {
    const speech = document.getElementById('mascotSpeech');
    speech.innerHTML = text;
    if (playTone) AudioEngine.playNote(587.33, 0.12, 'sine');
}

/* =========================================
   4. VIEW ROUTING & PROFILE SYSTEM
   ========================================= */
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
}

function renderProfiles() {
    const grid = document.getElementById('profileGrid');
    grid.innerHTML = '';
    state.profiles.forEach(profile => {
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.innerHTML = `
            <div class="profile-avatar-emoji">${profile.avatar}</div>
            <h3>${profile.name}</h3>
            <small>Ages ${profile.age} • ⭐ ${profile.stars}</small>
        `;
        card.onclick = () => loginUser(profile.id);
        grid.appendChild(card);
    });
}

document.getElementById('newProfileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('playerNameInput').value.trim();
    const age = document.getElementById('ageGroupSelect').value;
    if (!name) return;

    const avatars = ['🦊', '🚀', '🐼', '🎸', '🦖', '🐬'];
    const newProfile = {
        id: 'user_' + Date.now(),
        name,
        age,
        avatar: avatars[Math.floor(Math.random() * avatars.length)],
        stars: 0,
        streak: 1,
        dailyGoal: 3,
        completedToday: 0,
        mastery: {}, // stores level & xp per subject
        tested: false
    };

    SUBJECTS.forEach(s => newProfile.mastery[s.id] = { level: 1, xp: 0 });
    state.profiles.push(newProfile);
    saveState();
    document.getElementById('playerNameInput').value = '';
    loginUser(newProfile.id);
});

function loginUser(id) {
    state.currentUser = state.profiles.find(p => p.id === id);
    // Ensure mastery object exists for older demo profiles
    SUBJECTS.forEach(s => {
        if (!state.currentUser.mastery[s.id]) {
            state.currentUser.mastery[s.id] = { level: 1, xp: 0 };
        }
    });

    document.getElementById('userControls').classList.remove('hidden');
    updateHeaderStats();

    if (!state.currentUser.tested) {
        startPlacementTest();
    } else {
        loadDashboard();
    }
}

document.getElementById('btnLogout').onclick = () => {
    state.currentUser = null;
    document.getElementById('userControls').classList.add('hidden');
    renderProfiles();
    showView('viewLogin');
    updateMascot("See you soon! Who wants to play next?");
};

function updateHeaderStats() {
    if (!state.currentUser) return;
    document.getElementById('starCount').textContent = state.currentUser.stars;
    document.getElementById('streakCount').textContent = state.currentUser.streak;
}

/* =========================================
   5. ADAPTIVE PLACEMENT TEST
   ========================================= */
const PLACEMENT_QUESTIONS = [
    { q: "1. Rhythm Check: If you clap 2 times, then 2 more times, how many claps?", opts: ["3 Claps", "4 Claps", "5 Claps"], ans: 1 },
    { q: "2. Word Beat: Which word rhymes with 'SONG'?", opts: ["Strong", "Star", "Beat"], ans: 0 },
    { q: "3. Emotion Check: How do you feel when you learn a cool new skill?", opts: ["Proud & Happy!", "Bored", "Sleepy"], ans: 0 }
];

function startPlacementTest() {
    state.placementStep = 0;
    state.placementScore = 0;
    showView('viewPlacement');
    updateMascot(`Welcome, <strong>${state.currentUser.name}</strong>! Let's do a 3-question soundcheck to tune your starting level!`);
    renderPlacementQuestion();
}

function renderPlacementQuestion() {
    const qObj = PLACEMENT_QUESTIONS[state.placementStep];
    const box = document.getElementById('placementQuizBox');
    box.innerHTML = `
        <h3 style="margin: 20px 0;">${qObj.q}</h3>
        <div class="beat-pads">
            ${qObj.opts.map((opt, idx) => `
                <button class="pad-btn pad-${idx}" onclick="answerPlacement(${idx})">${opt}</button>
            `).join('')}
        </div>
    `;
}

window.answerPlacement = function(idx) {
    const qObj = PLACEMENT_QUESTIONS[state.placementStep];
    if (idx === qObj.ans) {
        state.placementScore++;
        AudioEngine.playSuccess();
    } else {
        AudioEngine.playNote(330, 0.2);
    }

    state.placementStep++;
    if (state.placementStep < PLACEMENT_QUESTIONS.length) {
        renderPlacementQuestion();
    } else {
        // Set starting level based on placement score
        const startLevel = state.placementScore >= 2 ? 2 : 1;
        SUBJECTS.forEach(s => state.currentUser.mastery[s.id].level = startLevel);
        state.currentUser.tested = true;
        saveState();
        updateMascot(`Awesome soundcheck! I tuned your worlds to <strong>Level ${startLevel}</strong>. Pick any subject to begin!`);
        loadDashboard();
    }
};

/* =========================================
   6. PERSONALIZED DASHBOARD & CONTINUOUS GOALS
   ========================================= */
function loadDashboard(filter = 'all') {
    showView('viewDashboard');
    updateGoalBanner();

    const grid = document.getElementById('subjectsGrid');
    grid.innerHTML = '';

    const filtered = filter === 'all' ? SUBJECTS : SUBJECTS.filter(s => s.category === filter);

    filtered.forEach(subj => {
        const m = state.currentUser.mastery[subj.id];
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.style.borderBottomColor = subj.color;
        card.innerHTML = `
            <div>
                <div class="subject-top">
                    <span class="subject-icon">${subj.icon}</span>
                    <span class="mastery-pill">Level ${m.level}</span>
                </div>
                <h3>${subj.name}</h3>
                <p>${subj.desc}</p>
            </div>
            <div>
                <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                    <span>Evolution Progress</span>
                    <span>${m.xp}%</span>
                </div>
                <div class="mini-bar">
                    <div class="mini-bar-fill" style="width: ${m.xp}%;"></div>
                </div>
            </div>
        `;
        card.onclick = () => launchMiniGame(subj.id);
        grid.appendChild(card);
    });
}

function updateGoalBanner() {
    const u = state.currentUser;
    const pct = Math.min(100, Math.round((u.completedToday / u.dailyGoal) * 100));
    document.getElementById('goalProgressText').textContent = `${u.completedToday} / ${u.dailyGoal} Mini-Games`;
    document.getElementById('goalProgressBar').style.width = `${pct}%`;

    const nextTierBtn = document.getElementById('btnNextTier');
    const statusText = document.getElementById('evolutionStatus');

    if (u.completedToday >= u.dailyGoal) {
        statusText.textContent = "🎉 Daily Goal Crushed! Bonus Encore Mode active — keep evolving!";
        nextTierBtn.classList.remove('hidden');
    } else {
        statusText.textContent = "Every song boosts your mastery. Hit your goal to unlock Encore Boosts!";
        nextTierBtn.classList.add('hidden');
    }
}

document.getElementById('btnNextTier').onclick = () => {
    state.currentUser.dailyGoal += 2;
    saveState();
    updateGoalBanner();
    AudioEngine.playSuccess();
    updateMascot("Woohoo! Stretch goal unlocked! There is always more cool stuff to master!");
};

// Filter pills
document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.onclick = () => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        loadDashboard(pill.dataset.filter);
    };
});

/* =========================================
   7. INTERCHANGEABLE MUSIC MINI-GAME ENGINE
   ========================================= */
function launchMiniGame(subjectId) {
    state.activeSubject = SUBJECTS.find(s => s.id === subjectId);
    const m = state.currentUser.mastery[subjectId];

    showView('viewGame');
    document.getElementById('activeSubjectBadge').textContent = `${state.activeSubject.icon} ${state.activeSubject.name}`;
    document.getElementById('activeLevelBadge').textContent = `Level ${m.level}`;

    renderGameStage();
}

document.getElementById('btnSwitchMechanic').onclick = () => {
    state.activeMechanicIndex = (state.activeMechanicIndex + 1) % GAME_MECHANICS.length;
    AudioEngine.playNote(659.25, 0.15);
    renderGameStage();
};

document.getElementById('btnBackToHub').onclick = () => {
    loadDashboard();
    updateMascot("Pick another world whenever you're ready!");
};

function renderGameStage() {
    const subj = state.activeSubject;
    const m = state.currentUser.mastery[subj.id];
    const mechanic = GAME_MECHANICS[state.activeMechanicIndex];

    // Pick question matching level (loops seamlessly for continuous evolution)
    const pool = QUESTION_BANK[subj.id] || QUESTION_BANK.math;
    const qData = pool[(m.level - 1) % pool.length];

    updateMascot(`Playing <strong>${mechanic.name}</strong> for ${subj.name}! Need a clue? Click me!`);
    document.getElementById('mascotAvatar').onclick = () => updateMascot(`💡 Hint: ${qData.hint}`);

    const arena = document.getElementById('gameArena');
    const freqs = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5

    if (mechanic.id === 'melody-match') {
        arena.innerHTML = `
            <span class="badge-tag">🎹 Mode: Melody Match Pads</span>
            <h2 style="margin: 18px 0;">${qData.q}</h2>
            ${qData.playCount ? `<button class="btn-secondary" onclick="playBeatSequence(${qData.playCount})">🔊 Hear Bop's Drum (${qData.playCount} beats)</button>` : ''}
            <div class="beat-pads">
                ${qData.options.map((opt, idx) => `
                    <button class="pad-btn pad-${idx}" onclick="submitAnswer(${idx}, ${qData.ans}, ${freqs[idx]})">
                        🎵 ${opt}
                    </button>
                `).join('')}
            </div>
        `;
        if (qData.playCount) setTimeout(() => playBeatSequence(qData.playCount), 400);
    } else {
        // Interchangeable Mechanic #2: Rhythm Sequencer Cards
        arena.innerHTML = `
            <span class="badge-tag">🥁 Mode: Rhythm Track Builder</span>
            <h2 style="margin: 18px 0;">Drop the right beat tile onto the track!</h2>
            <p style="font-size:1.15rem; margin-bottom:20px;"><strong>${qData.q}</strong></p>
            <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
                ${qData.options.map((opt, idx) => `
                    <button class="btn-outline" style="border-width:3px; font-size:1.1rem; padding:18px 26px;" 
                        onclick="submitAnswer(${idx}, ${qData.ans}, ${freqs[idx]})">
                        💿 Track ${idx + 1}: ${opt}
                    </button>
                `).join('')}
            </div>
        `;
    }
}

window.playBeatSequence = function(count) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => AudioEngine.playNote(440, 0.15, 'square'), i * 350);
    }
};

window.submitAnswer = function(chosenIdx, correctIdx, noteFreq) {
    AudioEngine.playNote(noteFreq, 0.25);

    if (chosenIdx === correctIdx) {
        setTimeout(() => AudioEngine.playSuccess(), 200);
        const u = state.currentUser;
        const m = u.mastery[state.activeSubject.id];

        // Continuous Evolution Logic: Never stops improving
        u.stars += 5;
        u.completedToday += 1;
        m.xp += 50;
        if (m.xp >= 100) {
            m.level += 1;
            m.xp = 0;
        }

        saveState();
        updateHeaderStats();
        updateMascot(`🎉 <strong>Harmony Achieved!</strong> You leveled up ${state.activeSubject.name} to <strong>Level ${m.level}</strong>! Ready for the next verse?`);

        // Automatically advance to next challenge for continuous learning
        setTimeout(() => {
            document.getElementById('activeLevelBadge').textContent = `Level ${m.level}`;
            renderGameStage();
        }, 1400);
    } else {
        setTimeout(() => AudioEngine.playOops(), 200);
        updateMascot("Almost! That note was a little flat. Try another pad or click me for a hint!");
    }
};

/* =========================================
   8. GOAL MODAL CONTROLS
   ========================================= */
const goalModal = document.getElementById('goalModal');
document.getElementById('btnOpenGoal').onclick = () => goalModal.classList.remove('hidden');
document.getElementById('btnCloseGoal').onclick = () => {
    goalModal.classList.add('hidden');
    updateGoalBanner();
};

document.querySelectorAll('.goal-choice').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.goal-choice').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (state.currentUser) {
            state.currentUser.dailyGoal = parseInt(btn.dataset.goal, 10);
            saveState();
        }
    };
});

// Initialize App
renderProfiles();