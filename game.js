/* =====================================================================
   QUEST OF SYNTAX - Core Game Logic (Exploration / RPG Mode)
   Game Edukasi Literasi TIK - Kelompok 6
   ---------------------------------------------------------------------
   Mekanik:
   - Setiap zona memiliki PETA (tile grid) yang dijelajahi pemain
     menggunakan tombol panah / WASD (atau D-pad di layar sentuh).
   - Di peta terdapat 5 monster penghadang (1 boss di antaranya).
     Menabrak monster memicu TANTANGAN berupa soal pilihan ganda.
   - Jawaban benar  -> monster kalah, +100 poin (+50 jika sempat salah).
   - Jawaban salah  -> pemain kehilangan 1 nyawa + penjelasan konsep,
                       lalu harus menjawab lagi sampai benar.
   - Nyawa (5) habis -> zona dimulai ulang dari awal.
   - Semua monster kalah -> portal terbuka; masuki portal untuk
     menyelesaikan zona.
   - Hint (-20 poin) dan bantuan 50:50 (-30 poin) tersedia sekali per soal.
   - Progres, skor, dan bintang disimpan di localStorage.
   ===================================================================== */

"use strict";

/* ---------- Konstanta ---------- */
const MAX_HP = 5;
const SCORE_CORRECT = 100;        // benar pada percobaan pertama
const SCORE_CORRECT_RETRY = 50;   // benar setelah sempat salah
const SCORE_ZONE_BONUS = 100;     // bonus menyelesaikan zona
const HINT_COST = 20;
const FIFTY_COST = 30;
const MOVE_COOLDOWN = 110;        // jeda antar langkah (ms)
const SAVE_KEY = "questOfSyntaxSaveV1";

/* ---------- Progres Tersimpan ---------- */
function defaultSave() {
  return { score: 0, unlocked: 1, stars: {}, muted: false };
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Object.assign(defaultSave(), parsed);
    }
  } catch (e) { /* abaikan data rusak */ }
  return defaultSave();
}

function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* storage penuh / diblokir */ }
}

let save = loadSave();
let soundOn = !save.muted;

/* ---------- State Permainan ---------- */
const state = {
  zoneIdx: 0,
  hp: MAX_HP,
  playerR: 1,
  playerC: 1,
  grid: [],           // 2D array tile: "#" dinding, "." lantai, "X" portal
  cells: [],          // referensi elemen DOM tiap tile
  monsters: [],       // { r, c, qIndex, isBoss, cleared }
  questions: [],      // bank soal zona aktif (urutan + pilihan teracak)
  activeMonster: null,
  wrongInZone: 0,
  wrongInQuestion: false,
  hintUsed: false,
  fiftyUsed: false,
  feedbackOpen: false,
  modalOpen: false,
  busy: false,
  lastMoveAt: 0
};

/* ---------- Utilitas ---------- */
const $ = (id) => document.getElementById(id);

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(id).classList.add("active");
  window.scrollTo(0, 0);
}

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1900);
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- Mesin Suara (Web Audio, tanpa file eksternal) ---------- */
let audioCtx = null;

function ensureAudio() {
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) { /* audio tidak tersedia */ }
}

function tone(freq, offset, dur, type, vol) {
  const t = audioCtx.currentTime + offset;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || "square";
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol || 0.06, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function sfx(name) {
  if (!soundOn) return;
  ensureAudio();
  if (!audioCtx) return;
  switch (name) {
    case "click":
      tone(520, 0, 0.06, "square", 0.05);
      break;
    case "step":
      tone(1000, 0, 0.02, "square", 0.015);
      break;
    case "bump":
      tone(120, 0, 0.12, "square", 0.06);
      break;
    case "monster":
      tone(440, 0, 0.1, "square", 0.07);
      tone(587, 0.1, 0.14, "square", 0.07);
      break;
    case "correct":
      tone(660, 0, 0.09, "square", 0.07);
      tone(880, 0.09, 0.12, "square", 0.07);
      tone(1320, 0.21, 0.16, "square", 0.06);
      break;
    case "wrong":
      tone(230, 0, 0.18, "sawtooth", 0.08);
      tone(150, 0.16, 0.28, "sawtooth", 0.08);
      break;
    case "power":
      tone(700, 0, 0.08, "triangle", 0.08);
      tone(1050, 0.08, 0.14, "triangle", 0.08);
      break;
    case "error":
      tone(180, 0, 0.12, "square", 0.07);
      tone(140, 0.12, 0.16, "square", 0.07);
      break;
    case "start":
      tone(392, 0, 0.12, "square", 0.06);
      tone(523, 0.12, 0.12, "square", 0.06);
      tone(659, 0.24, 0.2, "square", 0.06);
      break;
    case "portal":
      tone(523, 0, 0.1, "triangle", 0.08);
      tone(784, 0.1, 0.1, "triangle", 0.08);
      tone(1046, 0.2, 0.18, "triangle", 0.08);
      break;
    case "victory":
      [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, i * 0.13, 0.18, "square", 0.07));
      break;
    case "gameover":
      [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.2, 0.24, "triangle", 0.08));
      break;
  }
}

function updateSoundButtons() {
  const icon = soundOn ? "\u{1F50A}" : "\u{1F507}";
  ["btn-sound", "btn-sound-title"].forEach((id) => {
    const el = $(id);
    if (el) el.textContent = icon;
  });
}

function toggleSound() {
  soundOn = !soundOn;
  save.muted = !soundOn;
  persist();
  updateSoundButtons();
  if (soundOn) sfx("click");
}

/* ---------- Layar Judul & Intro ---------- */
const LORE_TEXT =
  "Tahun 2035. NEXUS, jaringan komputer raksasa yang mengendalikan seluruh sistem kota, terserang gelombang GLITCH misterius!\n\n" +
  "Kodenya rusak dan terpecah menjadi 4 ZONA BERBAHAYA. Di setiap zona, monster-monster glitch berkeliaran menghadang siapa pun yang mencoba lewat.\n\n" +
  "Kamu adalah PENJELAJAH DIGITAL terpilih. Jelajahi peta setiap zona, dekati monster penghadang, dan kalahkan mereka dengan menjawab tantangan:\n" +
  "1. Hutan Logika - teka-teki Boolean (AND, OR, NOT)\n" +
  "2. Kastil Algoritma - urutan langkah & flowchart\n" +
  "3. Gua Variabel - tipe data dan variabel\n" +
  "4. Menara Debugging - berburu dan membasmi bug\n\n" +
  "Kumpulkan bintang, buka portal di setiap zona, dan selamatkan NEXUS!";

let typingTimer = null;
let introTyped = false;

function typeIntro() {
  const el = $("intro-text");
  const goBtn = $("btn-intro-go");
  el.textContent = "";
  goBtn.classList.add("hidden");
  introTyped = false;

  let i = 0;
  clearInterval(typingTimer);
  typingTimer = setInterval(() => {
    if (i >= LORE_TEXT.length) {
      finishIntro();
      return;
    }
    el.textContent += LORE_TEXT[i];
    i++;
    if (i % 3 === 0) sfxTinyClick();
  }, 16);
}

function sfxTinyClick() {
  if (!soundOn || !audioCtx) return;
  if (Math.random() > 0.45) tone(1200 + Math.random() * 300, 0, 0.015, "square", 0.015);
}

function finishIntro() {
  clearInterval(typingTimer);
  $("intro-text").textContent = LORE_TEXT;
  $("btn-intro-go").classList.remove("hidden");
  introTyped = true;
}

/* ---------- Peta Zona (layar pemilihan) ---------- */
function hasProgress() {
  return save.score > 0 || save.unlocked > 1 || Object.keys(save.stars).length > 0;
}

function totalStars() {
  return Object.values(save.stars).reduce((a, b) => a + b, 0);
}

function progressFooterHTML() {
  const cleared = ZONES.filter((z) => save.stars[z.key]).length;
  return (
    "Bintang terkumpul: <strong>" + totalStars() + " / " + ZONES.length * 3 + "</strong>" +
    " &nbsp;&bull;&nbsp; Zona selesai: <strong>" + cleared + " / " + ZONES.length + "</strong>"
  );
}

function zoneNodeHTML(zone, i) {
  const unlocked = i < save.unlocked;
  const stars = save.stars[zone.key] || 0;
  const cleared = stars > 0;
  let status;
  if (cleared) status = "\u2714 SELESAI - KLIK UNTUK MAIN LAGI";
  else if (unlocked) status = "\u25B6 MAINKAN";
  else status = "\u{1F512} TERKUNCI";

  return (
    '<div class="zone-badge">ZONA ' + (i + 1) + "</div>" +
    '<div class="zone-emoji">' + zone.icon + "</div>" +
    '<div class="zone-name">' + zone.name + "</div>" +
    '<div class="zone-topic">' + zone.topic + "</div>" +
    '<div class="zone-stars">' + "\u2605".repeat(stars) + "\u2606".repeat(3 - stars) + "</div>" +
    '<div class="zone-status">' + status + "</div>"
  );
}

function renderMap() {
  const path = $("map-path");
  path.innerHTML = "";

  ZONES.forEach((zone, i) => {
    const unlocked = i < save.unlocked;
    const cleared = (save.stars[zone.key] || 0) > 0;

    const node = document.createElement("div");
    node.className = "zone-node" + (unlocked ? "" : " locked") + (cleared ? " cleared" : "");
    node.style.setProperty("--zone-color", zone.color);
    node.innerHTML = zoneNodeHTML(zone, i);

    node.addEventListener("click", () => {
      if (!unlocked) {
        toast("\u{1F512} Selesaikan zona sebelumnya dulu!");
        sfx("error");
        return;
      }
      sfx("click");
      startZone(i);
    });

    path.appendChild(node);
  });

  $("map-footer").innerHTML = progressFooterHTML();
  document.querySelectorAll(".js-score").forEach((el) => { el.textContent = save.score; });
  $("btn-continue").classList.toggle("hidden", !hasProgress());
}

/* ---------- Kelola Poin ---------- */
function addScore(amount) {
  save.score += amount;
  persist();
  document.querySelectorAll(".js-score").forEach((el) => { el.textContent = save.score; });
}

function spend(cost) {
  if (save.score < cost) {
    toast("\u26A0\uFE0F Poin tidak cukup! Kumpulkan poin dengan menjawab benar.");
    sfx("error");
    return false;
  }
  addScore(-cost);
  return true;
}

/* =====================================================================
   MODE PENJELAJAHAN: PETA, GERAK, MONSTER
   ===================================================================== */

function currentZone() { return ZONES[state.zoneIdx]; }

/* Acak urutan soal sekaligus urutan pilihan jawabannya (tiap masuk zona). */
function buildShuffledQuestions(zone) {
  return shuffle(zone.questions.slice()).map((q) => {
    const mixed = shuffle(q.options.map((opt, idx) => ({ opt: opt, correct: idx === q.answer })));
    return {
      text: q.text,
      options: mixed.map((m) => m.opt),
      answer: mixed.findIndex((m) => m.correct),
      hint: q.hint,
      explanation: q.explanation
    };
  });
}

function currentQuestion() {
  const m = state.activeMonster;
  return state.questions[m ? m.qIndex : 0];
}

function monstersLeft() {
  return state.monsters.filter((m) => !m.cleared).length;
}

function monsterElId(m) { return "monster-" + m.r + "-" + m.c; }

function updateBattleHUD() {
  /* Nyawa */
  let hearts = "";
  for (let i = 0; i < MAX_HP; i++) {
    hearts += '<span class="heart' + (i < state.hp ? "" : " lost") + '">' +
      (i < state.hp ? "\u2764\uFE0F" : "\u{1F5A4}") + "</span>";
  }
  $("battle-hearts").innerHTML = hearts;

  /* Status monster & portal */
  const left = monstersLeft();
  $("map-status").textContent = left > 0
    ? "\u{1F47E} Monster tersisa: " + left + " / " + state.monsters.length
    : "\u{1F300} Portal terbuka! Berjalanlah menuju portal.";

  document.querySelectorAll(".js-score").forEach((el) => { el.textContent = save.score; });
}

function startZone(i) {
  const zone = ZONES[i];

  state.zoneIdx = i;
  state.hp = MAX_HP;
  state.wrongInZone = 0;
  state.feedbackOpen = false;
  state.modalOpen = false;
  state.busy = false;
  state.activeMonster = null;
  state.lastMoveAt = 0;

  /* Soal + pilihan jawaban diacak ulang setiap kali zona dimulai */
  state.questions = buildShuffledQuestions(zone);

  buildGrid(zone);

  const battleEl = $("screen-battle");
  battleEl.style.backgroundImage =
    'linear-gradient(rgba(7,10,20,0.9), rgba(7,10,20,0.95)), url("' + zone.bg + '")';

  $("battle-zone-icon").textContent = zone.icon;
  $("battle-zone-name").textContent = zone.name;

  hideFeedback();
  hideQuestionModal();

  showScreen("screen-battle");

  /* Posisikan kamera langsung tanpa animasi saat zona dibuka */
  const mover = $("map-mover");
  mover.style.transition = "none";
  renderGameMap();
  updateBattleHUD();
  void mover.offsetWidth;
  mover.style.transition = "";
  sfx("start");
  toast(zone.icon + " " + zone.boss.intro);
}

function buildGrid(zone) {
  state.grid = [];
  state.monsters = [];

  zone.map.forEach((rowStr, r) => {
    const row = [];
    for (let c = 0; c < rowStr.length; c++) {
      const ch = rowStr[c];
      if (ch === "P") {
        state.playerR = r;
        state.playerC = c;
        row.push(".");
      } else if (ch >= "1" && ch <= "5") {
        const qIndex = parseInt(ch, 10) - 1;
        state.monsters.push({
          r: r,
          c: c,
          qIndex: qIndex,
          isBoss: qIndex === zone.questions.length - 1,
          cleared: false
        });
        row.push(".");
      } else if (ch === "X") {
        row.push("X");
      } else if (ch === "#") {
        row.push("#");
      } else {
        row.push(".");
      }
    }
    state.grid.push(row);
  });
}

function renderGameMap() {
  const zone = currentZone();
  const mapEl = $("game-map");
  const rows = state.grid.length;
  const cols = state.grid[0].length;

  mapEl.innerHTML = "";
  mapEl.style.gridTemplateColumns = "repeat(" + cols + ", var(--tile))";
  mapEl.style.setProperty("--floor", zone.theme.floor);
  mapEl.style.setProperty("--floor-alt", zone.theme.floorAlt);
  mapEl.style.setProperty("--wall", zone.theme.wall);

  state.cells = [];
  for (let r = 0; r < rows; r++) {
    const rowCells = [];
    for (let c = 0; c < cols; c++) {
      const tile = document.createElement("div");
      const type = state.grid[r][c];
      if (type === "#") {
        tile.className = "tile tile-wall";
        tile.innerHTML = '<span class="tile-emoji">' + zone.wallEmoji + "</span>";
      } else {
        tile.className = "tile tile-floor" + ((r + c) % 2 ? " alt" : "");
        if (type === "X") {
          tile.classList.add("tile-portal");
          tile.id = "portal-tile";
          tile.innerHTML = '<span class="portal-emoji">\u{1F300}</span>';
        }
      }
      mapEl.appendChild(tile);
      rowCells.push(tile);
    }
    state.cells.push(rowCells);
  }

  /* Monster diletakkan di dalam sel petanya */
  state.monsters.forEach((m) => {
    if (m.cleared) return;
    const el = document.createElement("div");
    el.className = "monster" + (m.isBoss ? " boss" : "");
    el.id = monsterElId(m);
    el.innerHTML = '<span class="monster-emoji">' + (m.isBoss ? zone.boss.emoji : zone.minionEmoji) + "</span>";
    state.cells[m.r][m.c].appendChild(el);
  });

  /* Pemain */
  const player = document.createElement("div");
  player.id = "player";
  player.className = "player";
  player.innerHTML = '<span class="player-emoji">\u{1F9D9}</span>';
  mapEl.appendChild(player);

  resizeTiles();
  updatePlayerPos();
}

function resizeTiles() {
  if (!state.grid.length) return;
  const cam = $("map-camera");
  const vw = Math.min(window.innerWidth - 24, 880);
  const vh = Math.max(200, Math.min(window.innerHeight - 360, 400));
  cam.style.width = vw + "px";
  cam.style.height = vh + "px";

  /* Zoom kamera: sekitar 9 kolom terlihat. Pakai lebar yang benar-benar
     tampil karena max-width: 100% bisa mempersempit jendela dari nilai style. */
  const viewW = cam.clientWidth || vw;
  const tile = Math.max(30, Math.min(96, Math.floor(viewW / 9)));
  $("game-map").style.setProperty("--tile", tile + "px");

  updatePlayerPos();
}

function updatePlayerPos() {
  const p = $("player");
  if (!p) return;
  p.style.transform =
    "translate(calc(var(--tile) * " + state.playerC + "), calc(var(--tile) * " + state.playerR + ")) " +
    "rotateX(var(--tiltNeg))";
  updateCamera();
}

/* Kamera mengikuti pemain: dunia bergeser, pemain tetap di titik jangkar. */
function updateCamera() {
  const cam = $("map-camera");
  const mover = $("map-mover");
  const mapEl = $("game-map");
  if (!cam || !mover || !mapEl || !state.grid.length) return;

  const rows = state.grid.length;
  const cols = state.grid[0].length;
  const mapCs = getComputedStyle(mapEl);
  const viewCs = getComputedStyle($("map-viewport"));
  const tile = parseFloat(mapCs.getPropertyValue("--tile")) || 40;
  const tiltDeg = parseFloat(mapCs.getPropertyValue("--tilt")) || 55;
  const persp = parseFloat(viewCs.perspective) || 1600;
  const po = (viewCs.perspectiveOrigin || "").split(" ");
  const cosT = Math.cos((tiltDeg * Math.PI) / 180);
  const sinT = Math.sin((tiltDeg * Math.PI) / 180);

  const vw = cam.clientWidth;
  const vh = cam.clientHeight;
  const ox = parseFloat(po[0]) || vw / 2;
  const oy = parseFloat(po[1]) || vh * 0.45;

  const boardW = cols * tile + 8;
  const boardH = rows * tile + 8;
  const u = (state.playerC + 0.5) * tile + 4 - boardW / 2;
  const v = (state.playerR + 0.5) * tile + 4 - boardH / 2;

  /* Proyeksi 3D pemain: rotateX lalu perspektif (k = P / (P - z)) */
  const z = v * sinT;
  const k = persp / (persp - z);
  const sx = ox + (vw / 2 + u - ox) * k;
  const sy = oy + (vh / 2 + v * cosT - oy) * k;

  /* Jangkar pemain: tengah horizontal, ~62% tinggi jendela kamera */
  let tx = vw / 2 - sx;
  let ty = vh * 0.62 - sy;

  /* Proyeksi sudut papan untuk batas geser yang akurat (bentuk trapezoid) */
  const W2 = boardW / 2;
  const H2 = boardH / 2;
  const pad = 8;
  const kF = persp / (persp + H2 * sinT);
  const kN = persp / (persp - H2 * sinT);
  const yMidOff = vh / 2 - oy;
  const yF = yMidOff * (kF - 1) - H2 * cosT * kF;
  const yN = yMidOff * (kN - 1) + H2 * cosT * kN;
  const xF = W2 * kF;
  const xN = W2 * kN;

  /* Batasi geser vertikal: tepi jendela tidak boleh melewati tepi papan */
  const tyMin = vh / 2 - yN + pad;
  const tyMax = -vh / 2 - yF - pad;
  ty = tyMin <= tyMax ? Math.max(tyMin, Math.min(tyMax, ty)) : (tyMin + tyMax) / 2;

  /* Batasi geser horizontal: sudut atas jendela harus tetap di dalam papan */
  const wTop = xF + (xN - xF) * ((-vh / 2 - ty) - yF) / (yN - yF);
  const txMax = Math.max(0, wTop - vw / 2 - pad);
  tx = Math.max(-txMax, Math.min(txMax, tx));

  mover.style.transform = "translate(" + Math.round(tx) + "px, " + Math.round(ty) + "px)";
}

function bumpPlayer() {
  const p = $("player");
  if (!p) return;
  p.classList.add("bump");
  setTimeout(() => p.classList.remove("bump"), 280);
}

function tryMove(dr, dc) {
  if (state.modalOpen || state.feedbackOpen || state.busy) return;
  const now = Date.now();
  if (now - state.lastMoveAt < MOVE_COOLDOWN) return;
  state.lastMoveAt = now;

  const nr = state.playerR + dr;
  const nc = state.playerC + dc;
  if (nr < 0 || nr >= state.grid.length || nc < 0 || nc >= state.grid[0].length) return;

  const type = state.grid[nr][nc];
  if (type === "#") {
    bumpPlayer();
    sfx("bump");
    return;
  }

  /* Ada monster di depan? Tantangan dimulai! */
  const monster = state.monsters.find((m) => !m.cleared && m.r === nr && m.c === nc);
  if (monster) {
    openQuestion(monster);
    return;
  }

  /* Portal */
  if (type === "X") {
    if (monstersLeft() === 0) {
      state.playerR = nr;
      state.playerC = nc;
      updatePlayerPos();
      zoneComplete();
    } else {
      toast("\u{1F512} Portal terkunci! Kalahkan semua monster dulu (" + monstersLeft() + " tersisa).");
      sfx("error");
    }
    return;
  }

  state.playerR = nr;
  state.playerC = nc;
  updatePlayerPos();
  sfx("step");
}

/* ---------- Tantangan (Modal Soal) ---------- */
function openQuestion(monster) {
  const zone = currentZone();
  const q = state.questions[monster.qIndex];

  state.activeMonster = monster;
  state.wrongInQuestion = false;
  state.hintUsed = false;
  state.fiftyUsed = false;
  state.modalOpen = true;

  $("q-monster-emoji").textContent = monster.isBoss ? zone.boss.emoji : zone.minionEmoji;
  $("q-monster-name").textContent = monster.isBoss
    ? "BOSS: " + zone.boss.name + " menghadang!"
    : "Monster: " + zone.minionName + " menghadang!";
  $("q-counter").textContent = (monster.qIndex + 1) + "/" + state.questions.length;
  $("question-text").textContent = q.text;

  const optionsEl = $("options");
  optionsEl.innerHTML = "";
  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerHTML =
      '<span class="opt-key">' + "ABCD"[idx] + "</span>" +
      '<span class="opt-text"></span>';
    btn.querySelector(".opt-text").textContent = opt;
    btn.addEventListener("click", () => chooseAnswer(idx, btn));
    optionsEl.appendChild(btn);
  });

  const hintBox = $("hint-box");
  hintBox.classList.add("hidden");
  hintBox.textContent = "";

  const hintBtn = $("btn-hint");
  const fiftyBtn = $("btn-fifty");
  hintBtn.disabled = false;
  fiftyBtn.disabled = false;
  hintBtn.innerHTML = "\u{1F4A1} HINT <span class=\"cost\">(-" + HINT_COST + ")</span>";
  fiftyBtn.innerHTML = "\u26A1 BANTUAN 50:50 <span class=\"cost\">(-" + FIFTY_COST + ")</span>";

  $("question-modal").classList.add("open");
  sfx("monster");
}

function hideQuestionModal() {
  $("question-modal").classList.remove("open");
  state.modalOpen = false;
  state.activeMonster = null;
}

function chooseAnswer(idx, btn) {
  if (state.feedbackOpen || state.busy) return;
  if (btn.disabled || btn.classList.contains("locked")) return;

  const q = currentQuestion();

  if (idx === q.answer) {
    btn.classList.add("correct");
    lockAllOptions();
    state.busy = true;

    const gained = state.wrongInQuestion ? SCORE_CORRECT_RETRY : SCORE_CORRECT;
    addScore(gained);
    sfx("correct");
    setTimeout(() => showFeedback(true, gained), 350);
  } else {
    btn.classList.add("wrong", "locked");
    btn.disabled = true;
    state.wrongInQuestion = true;
    state.wrongInZone++;
    state.hp--;

    const heartsEl = $("battle-hearts");
    heartsEl.style.animation = "shake 0.4s ease";
    setTimeout(() => { heartsEl.style.animation = ""; }, 450);

    sfx("wrong");
    updateBattleHUD();
    showFeedback(false, 0);
  }
}

function lockAllOptions() {
  document.querySelectorAll("#options .option-btn").forEach((b) => {
    b.classList.add("locked");
    b.disabled = true;
  });
}

/* ---------- Umpan Balik Instan + Penjelasan ---------- */
function showFeedback(correct, gained) {
  const q = currentQuestion();
  const card = $("feedback-card");
  const title = $("feedback-title");
  const text = $("feedback-text");
  const nextBtn = $("btn-feedback-next");

  state.feedbackOpen = true;

  if (correct) {
    card.classList.remove("bad");
    card.classList.add("ok");
    title.textContent = "\u2705 BENAR! +" + gained + " POIN";
    text.innerHTML = '<span class="label">PENJELASAN:</span>' + escapeHTML(q.explanation);
    nextBtn.textContent = "LANJUT \u27A1";
    nextBtn.className = "pixel-btn big green";
  } else {
    card.classList.remove("ok");
    card.classList.add("bad");
    title.textContent = state.hp > 0
      ? "\u{1F4A5} SALAH! -1 NYAWA"
      : "\u{1F480} SALAH! NYAWA HABIS...";
    text.innerHTML =
      '<span class="label">PENJELASAN:</span>' + escapeHTML(q.explanation) +
      (state.hp > 0
        ? "<br><br>Kamu harus menjawab dengan benar untuk mengalahkan monster ini! Pilih jawaban yang lain."
        : "");
    nextBtn.textContent = state.hp > 0 ? "COBA LAGI \u{1F501}" : "LANJUT \u27A1";
    nextBtn.className = "pixel-btn big " + (state.hp > 0 ? "gold" : "red");
  }

  nextBtn.onclick = () => {
    hideFeedback();
    handleFeedbackNext(correct);
  };

  $("feedback-overlay").classList.add("open");
}

function hideFeedback() {
  $("feedback-overlay").classList.remove("open");
  state.feedbackOpen = false;
}

function handleFeedbackNext(correct) {
  if (state.hp <= 0) {
    hideQuestionModal();
    failZone();
    return;
  }

  if (!correct) {
    /* tetap di modal, coba lagi soal yang sama */
    state.busy = false;
    return;
  }

  /* benar: monster kalah */
  defeatActiveMonster();
  hideQuestionModal();
  state.busy = false;
}

function defeatActiveMonster() {
  const m = state.activeMonster;
  if (!m) return;
  m.cleared = true;

  const el = document.getElementById(monsterElId(m));
  if (el) {
    el.classList.add("defeated");
    setTimeout(() => el.remove(), 600);
  }

  if (m.isBoss) toast("\u2620\uFE0F BOSS " + currentZone().boss.name + " dikalahkan!");
  sfx("power");
  updateBattleHUD();

  if (monstersLeft() === 0) {
    setTimeout(openPortal, 700);
  }
}

function openPortal() {
  const tile = $("portal-tile");
  if (tile) tile.classList.add("open");
  sfx("portal");
  toast("\u{1F300} Portal zona terbuka! Berjalanlah menuju portal untuk menyelesaikan zona.");
}

/* ---------- Zona Selesai / Gagal ---------- */
function zoneComplete() {
  state.busy = true;
  const zone = currentZone();

  const stars = state.wrongInZone === 0 ? 3 : state.wrongInZone <= 2 ? 2 : 1;
  const prevStars = save.stars[zone.key] || 0;
  const isNewRecord = stars > prevStars;
  save.stars[zone.key] = Math.max(prevStars, stars);

  addScore(SCORE_ZONE_BONUS);
  if (save.unlocked === state.zoneIdx + 1 && save.unlocked < ZONES.length) {
    save.unlocked += 1;
  }
  persist();

  sfx("victory");

  setTimeout(() => {
    state.busy = false;
    const allCleared = ZONES.every((z) => save.stars[z.key]);
    if (allCleared) renderVictoryResult();
    else renderClearResult(stars, isNewRecord);
    showScreen("screen-result");
  }, 900);
}

function failZone() {
  state.busy = true;
  sfx("gameover");
  setTimeout(() => {
    state.busy = false;
    renderFailResult();
    showScreen("screen-result");
  }, 500);
}

/* ---------- Hasil: Zona Dibersihkan ---------- */
function starsHTML(stars) {
  let html = "";
  for (let i = 0; i < 3; i++) {
    const cls = i < stars ? "star-pop" : "";
    const delay = (i * 0.18) + "s";
    html += '<span class="' + cls + '" style="animation-delay:' + delay + '">' +
      (i < stars ? "\u2B50" : "\u2606") + "</span>";
  }
  return html;
}

function renderClearResult(stars, isNewRecord) {
  const zone = currentZone();

  $("result-card").style.setProperty("--zone-color", zone.color);
  $("result-emoji").textContent = "\u{1F4A5}";
  $("result-title").textContent = "ZONA " + (state.zoneIdx + 1) + " DIBERSIHKAN!";
  $("result-stars").innerHTML = starsHTML(stars);

  let msg = "Portal berhasil dilalui! Kamu mengalahkan " + zone.boss.name +
    " beserta semua monster di " + zone.name + ". ";
  if (stars === 3) msg += "Sempurna, tanpa satu pun kesalahan!";
  else msg += "Teruskan perjuanganmu, masih ada zona yang menanti.";
  if (isNewRecord) msg += " (Rekor bintang baru!)";
  $("result-text").textContent = msg;

  $("result-stats").innerHTML =
    '<div class="stat-chip">\u2B50 SKOR: ' + save.score + "</div>" +
    '<div class="stat-chip">\u{1F494} KESALAHAN: ' + state.wrongInZone + "</div>" +
    '<div class="stat-chip">\u{1F381} BONUS: +' + SCORE_ZONE_BONUS + "</div>";

  const actions = $("result-actions");
  actions.innerHTML = "";
  const hasNext = state.zoneIdx + 1 < ZONES.length;

  if (hasNext) {
    const nextBtn = document.createElement("button");
    nextBtn.className = "pixel-btn big green";
    nextBtn.textContent = "\u27A1 ZONA BERIKUTNYA";
    nextBtn.addEventListener("click", () => { sfx("click"); startZone(state.zoneIdx + 1); });
    actions.appendChild(nextBtn);
  }

  const mapBtn = document.createElement("button");
  mapBtn.className = "pixel-btn big secondary";
  mapBtn.textContent = "\u{1F5FA} KEMBALI KE PETA";
  mapBtn.addEventListener("click", () => { sfx("click"); renderMap(); showScreen("screen-map"); });
  actions.appendChild(mapBtn);
}

/* ---------- Hasil: Zona Gagal ---------- */
function renderFailResult() {
  const zone = currentZone();

  $("result-card").style.setProperty("--zone-color", "#ff5c6c");
  $("result-emoji").textContent = "\u{1F480}";
  $("result-title").textContent = "SISTEM OVERLOAD!";
  $("result-stars").innerHTML = "";
  $("result-text").textContent =
    "Nyawamu habis! Monster-monster di " + zone.name + " masih berkeliaran. " +
    "Kamu akan memulai ulang zona ini dari titik awal. Pelajari kembali materinya, lalu coba lagi. Kegagalan adalah bagian dari belajar!";

  $("result-stats").innerHTML =
    '<div class="stat-chip">\u2B50 SKOR: ' + save.score + "</div>" +
    '<div class="stat-chip">\u{1F494} KESALAHAN: ' + state.wrongInZone + "</div>";

  const actions = $("result-actions");
  actions.innerHTML = "";

  const retryBtn = document.createElement("button");
  retryBtn.className = "pixel-btn big green";
  retryBtn.textContent = "\u{1F501} MULAI ULANG ZONA";
  retryBtn.addEventListener("click", () => { sfx("click"); startZone(state.zoneIdx); });
  actions.appendChild(retryBtn);

  const mapBtn = document.createElement("button");
  mapBtn.className = "pixel-btn big secondary";
  mapBtn.textContent = "\u{1F5FA} KEMBALI KE PETA";
  mapBtn.addEventListener("click", () => { sfx("click"); renderMap(); showScreen("screen-map"); });
  actions.appendChild(mapBtn);
}

/* ---------- Hasil: Kemenangan Akhir ---------- */
function scoreRank(score) {
  if (score >= 2000) return "\u{1F3C6} MASTER SYNTAX";
  if (score >= 1500) return "\u{1F947} AHLI LOGIKA";
  if (score >= 1000) return "\u{1F948} PENJELAJAH ANDAL";
  return "\u{1F949} PEMULA PEMBERANI";
}

function renderVictoryResult() {
  $("result-card").style.setProperty("--zone-color", "#ffd447");
  $("result-emoji").textContent = "\u{1F3C6}";
  $("result-title").textContent = "NEXUS TERSELAMATKAN!";
  $("result-stars").innerHTML = starsHTML(3);
  $("result-text").textContent =
    "Luar biasa, Penjelajah Digital! Keempat zona glitch telah dibersihkan. " +
    "Kekuatan logika dan dasar pemrogramanmu berhasil menyelamatkan sistem. " +
    "Gelar kehormatanmu: " + scoreRank(save.score) + "!";

  $("result-stats").innerHTML =
    '<div class="stat-chip">\u2B50 TOTAL SKOR: ' + save.score + "</div>" +
    '<div class="stat-chip">\u2B50 BINTANG: ' + totalStars() + " / " + ZONES.length * 3 + "</div>";

  const actions = $("result-actions");
  actions.innerHTML = "";

  const mapBtn = document.createElement("button");
  mapBtn.className = "pixel-btn big gold";
  mapBtn.textContent = "\u{1F5FA} KEMBALI KE PETA";
  mapBtn.addEventListener("click", () => { sfx("click"); renderMap(); showScreen("screen-map"); });
  actions.appendChild(mapBtn);

  const resetBtn = document.createElement("button");
  resetBtn.className = "pixel-btn big red";
  resetBtn.textContent = "\u{1F501} RESET & MAIN ULANG";
  resetBtn.addEventListener("click", () => { sfx("click"); resetProgress(); });
  actions.appendChild(resetBtn);
}

/* ---------- Fitur Bantuan: Hint & 50:50 ---------- */
function useHint() {
  if (state.feedbackOpen || state.busy || state.hintUsed || !state.modalOpen) return;
  if (!spend(HINT_COST)) return;

  state.hintUsed = true;
  const q = currentQuestion();
  const box = $("hint-box");
  box.innerHTML = '<span class="hint-label">HINT:</span>' + escapeHTML(q.hint);
  box.classList.remove("hidden");

  $("btn-hint").disabled = true;
  sfx("power");
}

function useFifty() {
  if (state.feedbackOpen || state.busy || state.fiftyUsed || !state.modalOpen) return;
  if (!spend(FIFTY_COST)) return;

  state.fiftyUsed = true;
  const q = currentQuestion();

  const candidates = [];
  document.querySelectorAll("#options .option-btn").forEach((btn, i) => {
    if (i !== q.answer && !btn.disabled && !btn.classList.contains("gone")) candidates.push(i);
  });

  shuffle(candidates);
  candidates.slice(0, 2).forEach((i) => {
    const btn = document.querySelectorAll("#options .option-btn")[i];
    btn.classList.add("gone");
    btn.disabled = true;
  });

  $("btn-fifty").disabled = true;
  sfx("power");
}

/* ---------- Reset Progres ---------- */
function resetProgress() {
  if (!window.confirm("Hapus semua progres (skor, bintang, zona terbuka) dan mulai dari awal?")) return;
  const muted = save.muted;
  save = defaultSave();
  save.muted = muted;
  persist();
  renderMap();
  toast("\u{1F9F9} Progres dihapus. Selamat memulai petualangan baru!");
}

/* ---------- Keyboard Support ---------- */
document.addEventListener("keydown", (e) => {
  const battleActive = $("screen-battle").classList.contains("active");
  if (!battleActive) return;

  if (state.feedbackOpen) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      $("btn-feedback-next").click();
    }
    return;
  }

  if (state.modalOpen) {
    const map = { "1": 0, "2": 1, "3": 2, "4": 3 };
    const idx = map[e.key];
    if (idx !== undefined) {
      const btn = document.querySelectorAll("#options .option-btn")[idx];
      if (btn && !btn.disabled) btn.click();
    }
    return;
  }

  const moves = {
    arrowup: [-1, 0], arrowdown: [1, 0], arrowleft: [0, -1], arrowright: [0, 1],
    w: [-1, 0], s: [1, 0], a: [0, -1], d: [0, 1]
  };
  const mv = moves[e.key.toLowerCase()];
  if (mv) {
    e.preventDefault();
    tryMove(mv[0], mv[1]);
  }
});

/* ---------- Inisialisasi ---------- */
function init() {
  updateSoundButtons();

  $("btn-start").addEventListener("click", () => {
    sfx("click");
    ensureAudio();
    typeIntro();
    showScreen("screen-intro");
  });

  $("btn-continue").addEventListener("click", () => {
    sfx("click");
    renderMap();
    showScreen("screen-map");
  });

  $("btn-intro-skip").addEventListener("click", () => {
    sfx("click");
    finishIntro();
  });

  $("btn-intro-go").addEventListener("click", () => {
    sfx("click");
    renderMap();
    showScreen("screen-map");
  });

  $("btn-sound").addEventListener("click", toggleSound);
  $("btn-sound-title").addEventListener("click", toggleSound);
  $("btn-reset").addEventListener("click", resetProgress);
  $("btn-hint").addEventListener("click", useHint);
  $("btn-fifty").addEventListener("click", useFifty);

  /* D-pad layar sentuh */
  const dpadMap = {
    "dpad-up": [-1, 0],
    "dpad-down": [1, 0],
    "dpad-left": [0, -1],
    "dpad-right": [0, 1]
  };
  Object.keys(dpadMap).forEach((id) => {
    $(id).addEventListener("click", () => {
      tryMove(dpadMap[id][0], dpadMap[id][1]);
    });
  });

  /* Sesuaikan ukuran tile saat jendela berubah ukuran */
  window.addEventListener("resize", () => {
    if (state.grid.length && $("screen-battle").classList.contains("active")) resizeTiles();
  });

  /* Intro text: pertahankan baris baru */
  $("intro-text").style.whiteSpace = "pre-wrap";

  renderMap();
}

document.addEventListener("DOMContentLoaded", init);
