const ICONS = {
    success: '<svg class="result__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m9 11 3 3L22 4"/></svg>',
    warning: '<svg class="result__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    error:   '<svg class="result__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>'
};

// DOM order must match for collectAbiturGrades() to work correctly (LK first, then GK)
const FIELD_ORDER = [
    "biologySem3", "biologySem4", "biologySem5", "biologySem6",
    "germanSem3",  "germanSem4",  "germanSem5",  "germanSem6",
    "mathSem3",    "mathSem4",    "mathSem5",    "mathSem6",
    "englishSem3", "englishSem4", "englishSem5", "englishSem6",
    "artSem3",     "artSem4",
    "geographySem5", "geographySem6",
    "historySem3", "historySem4", "historySem5", "historySem6",
    "biologyExam", "germanExam", "mathExam", "englishExam", "historyExam"
];

const LK_NAMES = [
    "biologySem3", "biologySem4", "biologySem5", "biologySem6",
    "germanSem3",  "germanSem4",  "germanSem5",  "germanSem6"
];

const MANDATORY_GK_NAMES = [
    "englishSem3", "englishSem4", "englishSem5", "englishSem6",
    "mathSem3",    "mathSem4",    "mathSem5",    "mathSem6",
    "historySem3", "historySem4", "historySem5", "historySem6"
];

const OPTIONAL_GK_NAMES = ["artSem3", "artSem4", "geographySem5", "geographySem6"];

const GRADE_NAMES = {
    0:  "0 Punkte — ungenügend (6)",
    1:  "1 Punkt — mangelhaft minus (5−)",
    2:  "2 Punkte — mangelhaft (5)",
    3:  "3 Punkte — mangelhaft plus (5+)",
    4:  "4 Punkte — ausreichend minus (4−)",
    5:  "5 Punkte — ausreichend (4)",
    6:  "6 Punkte — ausreichend plus (4+)",
    7:  "7 Punkte — befriedigend minus (3−)",
    8:  "8 Punkte — befriedigend (3)",
    9:  "9 Punkte — befriedigend plus (3+)",
    10: "10 Punkte — gut minus (2−)",
    11: "11 Punkte — gut (2)",
    12: "12 Punkte — gut plus (2+)",
    13: "13 Punkte — sehr gut minus (1−)",
    14: "14 Punkte — sehr gut (1)",
    15: "15 Punkte — sehr gut plus (1+)"
};

const FIELD_LABELS = {
    biologySem3: "Bio S3",   biologySem4: "Bio S4",   biologySem5: "Bio S5",   biologySem6: "Bio S6",
    germanSem3:  "Deu S3",   germanSem4:  "Deu S4",   germanSem5:  "Deu S5",   germanSem6:  "Deu S6",
    mathSem3:    "Mat S3",   mathSem4:    "Mat S4",   mathSem5:    "Mat S5",   mathSem6:    "Mat S6",
    englishSem3: "Eng S3",   englishSem4: "Eng S4",   englishSem5: "Eng S5",   englishSem6: "Eng S6",
    artSem3:     "Kun S3",   artSem4:     "Kun S4",
    geographySem5: "Erd S5", geographySem6: "Erd S6",
    historySem3: "Ges S3",   historySem4: "Ges S4",   historySem5: "Ges S5",   historySem6: "Ges S6",
    biologyExam: "Bio Abi",  germanExam:  "Deu Abi",  mathExam:    "Mat Abi",
    englishExam: "Eng Abi",  historyExam: "Ges Abi"
};

// Abiturdurchschnittsnote nach APO-WbK Anlage 8: N = 5 2/3 - P/180, auf eine Nachkommastelle
// ABGESCHNITTEN (nicht gerundet) - daher die 18-Punkte-Baender der Tabelle; bester Wert 1,0.
const NOTE_BASIS = 17 / 3;

function abiNote(punkte) {
    return Math.max(1.0, Math.floor((NOTE_BASIS - punkte / 180) * 10 + 1e-9) / 10);
}

// Kleinste Gesamtpunktzahl, die laut Anlage 8 noch die Note `note` ergibt.
// Untergrenze 300, weil Block I (200) und Block II (100) zusammen nicht weniger zulassen.
function punkteFuerNote(note) {
    return Math.max(300, Math.floor(180 * (NOTE_BASIS - note - 0.1) + 1e-9) + 1);
}

const STORAGE_KEY = "abi-rechner-grades-v1";
const SLOT_KEY = i => `abi-rechner-slot-${i}`;

let currentPointsBlockI = 0;
let currentTotalPoints = 0;

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('#gradeForm input[type="number"]').forEach(input => {
        input.addEventListener("input", onInput);
        input.addEventListener("keydown", onKeyDown);
        input.addEventListener("focus", e => updateGradeHint(e.target));
        input.addEventListener("blur", () => hideGradeHint());
    });

    document.querySelectorAll('#gradeForm input[type="checkbox"][data-group]').forEach(cb => {
        cb.addEventListener("change", handleCheckboxChange);
    });

    document.getElementById("resetButton").addEventListener("click", resetForm);
    document.getElementById("printButton").addEventListener("click", () => window.print());
    document.getElementById("shareButton").addEventListener("click", shareLink);
    document.getElementById("targetGrade").addEventListener("input", updateTargetOutput);

    document.querySelectorAll(".slot-save").forEach(btn => {
        btn.addEventListener("click", () => saveSlot(+btn.dataset.slot));
    });
    document.querySelectorAll(".slot-load").forEach(btn => {
        btn.addEventListener("click", () => loadSlot(+btn.dataset.slot));
    });
    document.querySelectorAll(".slot-clear").forEach(btn => {
        btn.addEventListener("click", () => clearSlot(+btn.dataset.slot));
    });

    // Sticky result bar via IntersectionObserver
    const stickyResult = document.getElementById("stickyResult");
    const resultArea = document.getElementById("resultArea");
    const observer = new IntersectionObserver(([entry]) => {
        const visible = resultArea.style.display !== "none" && !entry.isIntersecting;
        stickyResult.classList.toggle("sticky--visible", visible);
    }, { threshold: 0 });
    observer.observe(resultArea);

    const fromHash = decodeHashGrades();
    if (fromHash) {
        applyState(fromHash);
        history.replaceState(null, "", location.pathname + location.search);
    } else {
        loadStoredState();
    }

    loadScenarios();
    updateProgress();
    if (anyInputFilled()) calculate();
});

function onInput(e) {
    updateGradeHint(e.target);
    updateProgress();
    calculate();
    saveState();
    if (e.target.value.length >= 2) focusNext(e.target);
}

function onKeyDown(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        focusNext(e.target);
    }
}

function focusNext(current) {
    const inputs = Array.from(document.querySelectorAll('#gradeForm input[type="number"]:not(.hidden)'));
    const idx = inputs.indexOf(current);
    if (idx >= 0 && idx < inputs.length - 1) inputs[idx + 1].focus();
}

function handleCheckboxChange() {
    const checkbox = this;
    const group = checkbox.dataset.group;
    const targetEl = document.getElementById(checkbox.dataset.target);

    if (checkbox.checked) {
        if (targetEl) targetEl.classList.remove("hidden");
        document.querySelectorAll(`input[type="checkbox"][data-group="${group}"]`).forEach(other => {
            if (other !== checkbox) {
                other.checked = false;
                const otherTarget = document.getElementById(other.dataset.target);
                if (otherTarget) otherTarget.classList.add("hidden");
            }
        });
    } else {
        if (targetEl) targetEl.classList.add("hidden");
    }

    updateProgress();
    calculate();
    saveState();
}

function calculate() {
    const allInputs = Array.from(document.querySelectorAll('#gradeForm input[type="number"]'));
    const visibleInputs = allInputs.filter(i => !i.classList.contains("hidden"));

    clearStates(allInputs);

    const validation = validateGrades(visibleInputs);
    if (!validation.ok) {
        if (validation.zeroInputs) validation.zeroInputs.forEach(el => el.classList.add("is-zero"));
        if (validation.tone !== "neutral") showResult(validation);
        else hideResult();
        return;
    }

    const group1Checked = Array.from(document.querySelectorAll('input[type="checkbox"][data-group="group1"]'))
        .some(cb => cb.checked);
    if (!group1Checked) {
        showResult({ tone: "warning", message: 'Bitte w&auml;hle als <span class="highlight">3.&nbsp;bzw.&nbsp;4.&nbsp;Abiturfach</span> entweder Mathematik oder Englisch aus.' });
        return;
    }

    LK_NAMES.forEach(n => byEl(n).classList.add("is-included"));
    const LKGrades = LK_NAMES.map(byVal);

    const GKGrades = collectGKGrades(LKGrades);
    const abiturGrades = collectAbiturGrades();

    markDeficits(allInputs);

    const deficitsLK = countDeficits(LKGrades);
    const deficitsGK = countDeficits(GKGrades);
    const totalDeficits = deficitsLK + deficitsGK;

    if (totalDeficits > 5) {
        const deficitList = getIncludedDeficitList();
        showResult({ tone: "error", message: `Du hast in den einzubringenden Kursen insgesamt mehr als <span class="highlight">f&uuml;nf Defizite</span>. Damit w&auml;rst du nicht zur Abiturpr&uuml;fung zugelassen.` +
            (deficitList ? `<div class="result__deficits">Defizite: ${deficitList}</div>` : "") });
        return;
    }
    if (deficitsLK > 3) {
        const deficitList = getIncludedDeficitList();
        showResult({ tone: "error", message: `Du hast im Leistungskursbereich mehr als <span class="highlight">drei Defizite</span>. Damit w&auml;rst du nicht zur Abiturpr&uuml;fung zugelassen.` +
            (deficitList ? `<div class="result__deficits">Defizite: ${deficitList}</div>` : "") });
        return;
    }

    const pointsLK = 2 * LKGrades.reduce((a, b) => a + b, 0);
    const pointsGK = GKGrades.reduce((a, b) => a + b, 0);
    const pointsBlockI = Math.round(((pointsLK + pointsGK) / (2 * LKGrades.length + GKGrades.length)) * 40);
    currentPointsBlockI = pointsBlockI;

    if (pointsBlockI < 200) {
        showResult({ tone: "error", message: `Du hast in Block&nbsp;I mit <span class="highlight">${pointsBlockI}&thinsp;Punkten</span> weniger als <span class="highlight">200&thinsp;Punkte</span> erreicht. Damit w&auml;rst du nicht zur Abiturpr&uuml;fung zugelassen.` });
        return;
    }

    document.querySelectorAll('input[name$="Exam"]:not(.hidden)').forEach(i => i.classList.add("is-included"));

    const pointsBlockII = 5 * abiturGrades.reduce((a, b) => a + b, 0);

    if (pointsBlockII < 100) {
        showResult({ tone: "error", message: `Du hast in den Abiturpr&uuml;fungen mit <span class="highlight">${pointsBlockII}&thinsp;Punkten</span> weniger als <span class="highlight">100&thinsp;Punkte</span> (Block&nbsp;II) erreicht. M&uuml;ndliche Nachpr&uuml;fungen sind ggf. m&ouml;glich.` });
        return;
    }

    // abiturGrades order (DOM order): [biologyExam, germanExam, math|englishExam, historyExam]
    const deficitsAbiLK = countDeficits(abiturGrades.slice(0, 2));
    const deficitsAbiGK = countDeficits(abiturGrades.slice(2));

    if (deficitsAbiLK >= 2) {
        showResult({ tone: "error", message: `Du hast in den <span class="highlight">Leistungskursen</span> im Abiturbereich ${deficitsAbiLK}&thinsp;Defizite. Damit h&auml;ttest du die Abiturpr&uuml;fung nicht bestanden. M&uuml;ndliche Nachpr&uuml;fungen sind ggf. m&ouml;glich.` });
        return;
    }
    if (deficitsAbiGK >= 2) {
        showResult({ tone: "error", message: `Du hast in den <span class="highlight">Grundkursen</span> im Abiturbereich ${deficitsAbiGK}&thinsp;Defizite. Damit h&auml;ttest du die Abiturpr&uuml;fung nicht bestanden. M&uuml;ndliche Nachpr&uuml;fungen sind ggf. m&ouml;glich.` });
        return;
    }

    const totalPoints = pointsBlockI + pointsBlockII;
    currentTotalPoints = totalPoints;
    const avgAbitur = abiNote(totalPoints);
    const avgStr = avgAbitur.toFixed(1).replace(".", ",");

    const deficitListSem = getIncludedDeficitList(false);
    const targetHint = buildTargetHint(totalPoints);

    const breakdown = {
        rows: [
            { label: "Block I &mdash; Schulleistungen", formula: `${LKGrades.length} LK-Sem. &times;2 + ${GKGrades.length} GK-Sem. &times;1`, points: pointsBlockI },
            { label: "Block II &mdash; Abiturpr&uuml;fungen", formula: `(${abiturGrades.join(" + ")}) &times; 5`, points: pointsBlockII }
        ],
        total: totalPoints
    };

    showResult({
        tone: "success",
        schnitt: avgStr,
        message: `Abiturschnitt: <span class="highlight">${avgStr}</span> &middot; Gesamtpunkte: <span class="highlight">${totalPoints}</span>` +
            (deficitListSem ? `<div class="result__deficits">Defizite: ${deficitListSem}</div>` : "") +
            targetHint,
        breakdown
    });

    showTargetSection();
    updateTargetOutput();
}

function collectGKGrades(LKGrades) {
    MANDATORY_GK_NAMES.forEach(n => byEl(n).classList.add("is-included"));
    const mandatoryGrades = MANDATORY_GK_NAMES.map(byVal);

    const weightedSum = 2 * LKGrades.reduce((a, b) => a + b, 0) + mandatoryGrades.reduce((a, b) => a + b, 0);
    const currentAvg = weightedSum / (2 * LKGrades.length + mandatoryGrades.length);

    const deficitsLK = countDeficits(LKGrades);
    const deficitsGK = countDeficits(mandatoryGrades);
    const includeAll = (deficitsLK + deficitsGK) >= 5;

    const allGKGrades = [...mandatoryGrades];
    OPTIONAL_GK_NAMES.forEach(name => {
        const v = byVal(name);
        if (includeAll || v > currentAvg) {
            allGKGrades.push(v);
            byEl(name).classList.add("is-included");
        }
    });

    return allGKGrades;
}

function collectAbiturGrades() {
    return Array.from(document.querySelectorAll('input[name$="Exam"]'))
        .filter(i => !i.classList.contains("hidden"))
        .map(i => parseInt(i.value, 10));
}

function validateGrades(visibleInputs) {
    const zeroInputs = [];
    for (const input of visibleInputs) {
        const value = parseInt(input.value, 10);
        if (isNaN(value)) {
            return { ok: false, tone: "neutral", message: "" };
        }
        if (value < 0 || value > 15) {
            return { ok: false, tone: "error", message: 'Die Noten m&uuml;ssen zwischen <span class="highlight">0</span> und <span class="highlight">15</span> liegen.' };
        }
        if (value === 0 && !input.name.endsWith("Exam")) {
            zeroInputs.push(input);
        }
    }
    if (zeroInputs.length > 0) {
        return { ok: false, tone: "error", message: 'Mindestens ein Semesterkurs wurde mit <span class="highlight">0&thinsp;Punkten</span> abgeschlossen. Damit w&auml;re eine Zulassung zur Abiturpr&uuml;fung nicht m&ouml;glich.', zeroInputs };
    }
    return { ok: true };
}

function clearStates(inputs) {
    inputs.forEach(i => i.classList.remove("is-included", "is-deficit", "is-zero"));
}

function markDeficits(inputs) {
    inputs.forEach(input => {
        const v = parseInt(input.value, 10);
        if (v >= 1 && v <= 4) input.classList.add("is-deficit");
    });
}

function countDeficits(grades) {
    return grades.filter(g => g <= 4).length;
}

function byEl(name) {
    return document.getElementsByName(name)[0];
}

function byVal(name) {
    return parseInt(byEl(name).value, 10);
}

function getIncludedDeficitList(includeExams = true) {
    const selector = includeExams
        ? 'input[type="number"].is-included.is-deficit'
        : 'input[type="number"].is-included.is-deficit:not([name$="Exam"])';
    const deficits = Array.from(document.querySelectorAll(selector));
    if (!deficits.length) return "";
    return deficits.map(i => `${FIELD_LABELS[i.name] || i.name}&thinsp;(${i.value})`).join(", ");
}

function buildTargetHint(totalPoints) {
    const currentAvg = abiNote(totalPoints);
    const nextTarget = parseFloat((currentAvg - 0.1).toFixed(1));
    if (nextTarget < 1.0) return "";
    const neededTotal = punkteFuerNote(nextTarget);
    const diff = neededTotal - totalPoints;
    if (diff <= 0) return "";
    const punkteStr = diff === 1 ? "Punkt" : "Punkte";
    return `<div class="result__hint">Noch <strong>${diff}&thinsp;${punkteStr}</strong> mehr f&uuml;r einen Schnitt von <strong>${nextTarget.toFixed(1).replace(".", ",")}</strong>.</div>`;
}

function updateProgress() {
    const visible = Array.from(document.querySelectorAll('#gradeForm input[type="number"]:not(.hidden)'));
    const filled = visible.filter(i => i.value !== "").length;
    const total = visible.length;
    const pct = total > 0 ? (filled / total) * 100 : 0;
    document.getElementById("progressFill").style.width = pct + "%";
    document.getElementById("progressText").textContent = `${filled} von ${total} Feldern ausgefüllt`;
}

function showTargetSection() {
    document.getElementById("targetSection").classList.add("target--visible");
}

function hideTargetSection() {
    document.getElementById("targetSection").classList.remove("target--visible");
    document.getElementById("targetOutput").innerHTML = "";
}

function updateTargetOutput() {
    const outputEl = document.getElementById("targetOutput");
    const rawVal = document.getElementById("targetGrade").value.replace(",", ".");
    const val = parseFloat(rawVal);
    if (isNaN(val) || val < 1.0 || val > 4.0) {
        outputEl.innerHTML = "";
        return;
    }
    const neededTotal = punkteFuerNote(val);
    if (currentTotalPoints >= neededTotal) {
        outputEl.innerHTML = `<span class="target-achieved">Ziel bereits erreicht ✓</span>`;
        return;
    }
    const neededBlockII = neededTotal - currentPointsBlockI;
    if (neededBlockII <= 0) {
        outputEl.innerHTML = `<span class="target-achieved">Ziel bereits erreicht ✓</span>`;
        return;
    }
    const neededAvgPerExam = neededBlockII / 5 / 4;
    if (neededAvgPerExam > 15) {
        outputEl.innerHTML = `<span class="target-impossible">Mit Block&thinsp;I allein nicht mehr erreichbar.</span>`;
        return;
    }
    outputEl.innerHTML = `<strong>${Math.ceil(neededBlockII)}&thinsp;Punkte</strong> in Block&thinsp;II n&ouml;tig (⌀&thinsp;${neededAvgPerExam.toFixed(1).replace(".", ",")}/15 pro Pr&uuml;fung)`;
}

function showResult({ tone, schnitt, message, breakdown }) {
    const area = document.getElementById("resultArea");
    area.classList.remove("result--success", "result--warning", "result--error");
    if (tone === "success") area.classList.add("result--success");
    else if (tone === "warning") area.classList.add("result--warning");
    else if (tone === "error") area.classList.add("result--error");

    area.dataset.schnitt = schnitt || "";

    let html = (ICONS[tone] || "") + message;
    if (breakdown) {
        const rowsHtml = breakdown.rows.map(r =>
            `<tr><td>${r.label}</td><td>${r.formula}</td><td>${r.points}</td></tr>`
        ).join("");
        html += `<table class="breakdown"><tbody>${rowsHtml}</tbody><tfoot><tr><td>Gesamt</td><td></td><td>${breakdown.total}</td></tr></tfoot></table>`;
    }

    area.innerHTML = html;
    area.style.display = "block";

    // Update sticky bar
    const sticky = document.getElementById("stickyResult");
    if (tone === "success" && schnitt) {
        sticky.style.color = "var(--success-text)";
        sticky.innerHTML = `Abiturschnitt: <strong>${schnitt}</strong> &middot; ${breakdown ? breakdown.total + "&thinsp;Punkte" : ""}`;
    } else if (tone === "warning") {
        sticky.style.color = "var(--warning-text)";
        sticky.textContent = "Bitte Abiturfach wählen";
    } else if (tone === "error") {
        sticky.style.color = "var(--danger-text)";
        sticky.textContent = "Nicht bestanden / Fehler";
    } else {
        sticky.textContent = "";
    }
}

function hideResult() {
    const area = document.getElementById("resultArea");
    area.style.display = "none";
    area.classList.remove("result--success", "result--warning", "result--error");
    area.dataset.schnitt = "";
    document.getElementById("stickyResult").classList.remove("sticky--visible");
    hideTargetSection();
}

function resetForm() {
    hideResult();
    document.getElementById("gradeForm").reset();
    document.querySelectorAll(".exam-field").forEach(i => i.classList.add("hidden"));
    clearStates(document.querySelectorAll('#gradeForm input[type="number"]'));
    hideGradeHint();
    updateProgress();
    currentPointsBlockI = 0;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
}

function saveState() {
    const state = getCurrentState();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function getCurrentState() {
    const state = { grades: {}, checkboxes: {} };
    document.querySelectorAll('#gradeForm input[type="number"]').forEach(i => {
        if (i.value !== "") state.grades[i.name] = i.value;
    });
    document.querySelectorAll('input[type="checkbox"][data-group]').forEach(cb => {
        if (cb.checked) state.checkboxes[cb.name] = true;
    });
    return state;
}

function loadStoredState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        applyState(JSON.parse(raw));
    } catch {}
}

function applyState(state) {
    if (state.grades) {
        Object.entries(state.grades).forEach(([k, v]) => {
            const el = document.getElementsByName(k)[0];
            if (el) el.value = v;
        });
    }
    if (state.checkboxes) {
        Object.entries(state.checkboxes).forEach(([k, checked]) => {
            if (!checked) return;
            const el = document.getElementsByName(k)[0];
            if (!el) return;
            el.checked = true;
            const targetEl = document.getElementById(el.dataset.target);
            if (targetEl) targetEl.classList.remove("hidden");
        });
    }
}

function anyInputFilled() {
    return Array.from(document.querySelectorAll('#gradeForm input[type="number"]')).some(i => i.value !== "") ||
           Array.from(document.querySelectorAll('input[type="checkbox"]')).some(i => i.checked);
}

// ── Scenario slots ─────────────────────────────────────────

function saveSlot(i) {
    const state = getCurrentState();
    const nameEl = document.querySelector(`.scenario-slot[data-slot="${i}"] .scenario-slot__name`);
    state.name = nameEl?.value || "";
    const area = document.getElementById("resultArea");
    state.schnitt = area.dataset.schnitt || null;
    try { localStorage.setItem(SLOT_KEY(i), JSON.stringify(state)); } catch {}
    updateSlotUI(i, state);
    showToast(`„${state.name || "Szenario"}" gespeichert`);
}

function loadSlot(i) {
    try {
        const raw = localStorage.getItem(SLOT_KEY(i));
        if (!raw) return;
        const state = JSON.parse(raw);
        document.getElementById("gradeForm").reset();
        document.querySelectorAll(".exam-field").forEach(el => el.classList.add("hidden"));
        clearStates(document.querySelectorAll('#gradeForm input[type="number"]'));
        applyState(state);
        updateProgress();
        calculate();
        saveState();
        const nameEl = document.querySelector(`.scenario-slot[data-slot="${i}"] .scenario-slot__name`);
        showToast(`„${nameEl?.value || "Szenario"}" geladen`);
    } catch {}
}

function clearSlot(i) {
    try { localStorage.removeItem(SLOT_KEY(i)); } catch {}
    updateSlotUI(i, null);
}

function updateSlotUI(i, data) {
    const slot = document.querySelector(`.scenario-slot[data-slot="${i}"]`);
    if (!slot) return;
    const gradeEl = slot.querySelector(".scenario-slot__grade");
    const loadBtn = slot.querySelector(".slot-load");
    const clearBtn = slot.querySelector(".slot-clear");
    const hasSomething = data && (
        Object.keys(data.grades || {}).length > 0 ||
        Object.keys(data.checkboxes || {}).length > 0
    );
    if (hasSomething) {
        slot.classList.add("slot--filled");
        gradeEl.textContent = data.schnitt ? `Schnitt ${data.schnitt}` : "Gespeichert";
        loadBtn.disabled = false;
        clearBtn.disabled = false;
    } else {
        slot.classList.remove("slot--filled");
        gradeEl.textContent = "Leer";
        loadBtn.disabled = true;
        clearBtn.disabled = true;
    }
}

function loadScenarios() {
    for (let i = 0; i < 3; i++) {
        try {
            const raw = localStorage.getItem(SLOT_KEY(i));
            const data = raw ? JSON.parse(raw) : null;
            updateSlotUI(i, data);
            if (data?.name) {
                const nameEl = document.querySelector(`.scenario-slot[data-slot="${i}"] .scenario-slot__name`);
                if (nameEl) nameEl.value = data.name;
            }
        } catch {
            updateSlotUI(i, null);
        }
    }
}

// ── URL sharing ────────────────────────────────────────────

function encodeHashGrades() {
    const grades = FIELD_ORDER.map(name => {
        const el = document.getElementsByName(name)[0];
        if (!el || el.value === "" || el.classList.contains("hidden")) return "x";
        const n = parseInt(el.value, 10);
        return (isNaN(n) || n < 0 || n > 15) ? "x" : n.toString(16);
    }).join("");

    const cbCode = document.getElementsByName("mathAbitur")[0]?.checked ? "1" :
                   document.getElementsByName("englishAbitur")[0]?.checked ? "2" : "0";
    return grades + cbCode;
}

function decodeHashGrades() {
    const m = location.hash.match(/g=([0-9a-fx]{29}[012])/i);
    if (!m) return null;
    const code = m[1].toLowerCase();
    const state = { grades: {}, checkboxes: {} };

    for (let i = 0; i < 29; i++) {
        const c = code[i];
        if (c === "x") continue;
        const n = parseInt(c, 16);
        if (!isNaN(n) && n >= 0 && n <= 15) state.grades[FIELD_ORDER[i]] = String(n);
    }

    const cbCode = code[29];
    if (cbCode === "1") state.checkboxes["mathAbitur"] = true;
    else if (cbCode === "2") state.checkboxes["englishAbitur"] = true;

    return (Object.keys(state.grades).length || Object.values(state.checkboxes).some(v => v)) ? state : null;
}

function shareLink() {
    const url = `${location.origin}${location.pathname}#g=${encodeHashGrades()}`;
    if (navigator.share) {
        navigator.share({ title: "Abitur-Rechner", url }).catch(() => {});
        return;
    }
    const fallback = () => {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); showToast("Link kopiert"); } catch { showToast("Konnte Link nicht kopieren"); }
        document.body.removeChild(ta);
    };
    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url).then(() => showToast("Link kopiert"), fallback);
    } else {
        fallback();
    }
}

// ── UI helpers ─────────────────────────────────────────────

function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("toast--visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("toast--visible"), 2200);
}

function updateGradeHint(input) {
    const v = parseInt(input.value, 10);
    const hint = document.getElementById("gradeHint");
    if (!isNaN(v) && v >= 0 && v <= 15) {
        hint.textContent = GRADE_NAMES[v];
        hint.classList.add("grade-hint--visible");
    } else {
        hideGradeHint();
    }
}

function hideGradeHint() {
    document.getElementById("gradeHint").classList.remove("grade-hint--visible");
}
