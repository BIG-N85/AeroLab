"use strict";

const pathways = [
    { name: "Aerospace Engineering", description: "Applies engineering to aircraft, spacecraft, and systems that operate in air or space.", study: ["Aerodynamics and flight mechanics", "Structures and propulsion", "Controls and systems"], careers: ["Aircraft design", "Space systems", "Flight test"] },
    { name: "Mechanical Engineering", description: "Designs and analyzes machines, structures, thermal systems, and moving parts across many industries.", study: ["Mechanics and materials", "Thermal sciences", "Design and manufacturing"], careers: ["Mechanical design", "Robotics", "Energy systems"] },
    { name: "Electrical Engineering", description: "Works with circuits, power, sensors, communications, and electronic systems.", study: ["Circuits and electronics", "Signals and communications", "Control systems"], careers: ["Avionics", "Power systems", "Instrumentation"] },
    { name: "Computer Engineering", description: "Connects hardware and software to build computing systems used in vehicles and equipment.", study: ["Digital logic", "Computer architecture", "Embedded programming"], careers: ["Flight computers", "Embedded systems", "Hardware design"] },
    { name: "Materials Engineering", description: "Studies how materials are selected, tested, processed, and improved for real applications.", study: ["Material structure and properties", "Manufacturing processes", "Testing and failure analysis"], careers: ["Aerospace materials", "Composite structures", "Quality and testing"] }
];

const skills = [
    { name: "Physics", description: "Use forces, motion, energy, and waves to explain engineering systems.", level: "Beginner", progress: 35 },
    { name: "Mathematics", description: "Build confidence with algebra, geometry, trigonometry, and later calculus.", level: "Beginner", progress: 45 },
    { name: "CAD", description: "Create dimensioned 2D sketches and 3D models of engineering parts.", level: "Beginner", progress: 20 },
    { name: "Programming", description: "Write small programs to calculate, organize, and visualize engineering data.", level: "Intermediate", progress: 30 },
    { name: "Electronics", description: "Understand circuits, sensors, measurement, and basic system connections.", level: "Intermediate", progress: 10 },
    { name: "Experimental Design", description: "Plan fair tests, identify variables, and record repeatable procedures.", level: "Intermediate", progress: 25 },
    { name: "Data Analysis", description: "Summarize measurements, graph results, and consider uncertainty.", level: "Intermediate", progress: 15 },
    { name: "Technical Communication", description: "Explain methods and results with clear writing, diagrams, and units.", level: "Advanced", progress: 10 }
];

const preparationItems = [
    ["Mathematics", "Strengthen algebra, geometry, trigonometry, and problem-solving habits."],
    ["Physics", "Explore mechanics, forces, energy, and motion."],
    ["Computer Science", "Practice programming fundamentals and logical problem solving."],
    ["CAD", "Try sketching, dimensions, constraints, and simple 3D parts."],
    ["Engineering Projects", "Plan a small project and document its design and test process."],
    ["Research", "Read about engineering questions and keep notes on sources."],
    ["Competitions", "Look into school or community challenges that fit your interests."],
    ["Technical Portfolio", "Save real project methods, measurements, designs, and results."]
];

const careers = [
    { name: "Aerospace Engineer", description: "Helps design, analyze, test, or improve aircraft and spacecraft systems.", areas: "Aircraft, spacecraft, flight systems", skills: "Physics, CAD, systems thinking, teamwork" },
    { name: "Mechanical Engineer", description: "Develops mechanical parts and systems and evaluates how they perform.", areas: "Structures, mechanisms, thermal systems", skills: "Mechanics, design, materials, analysis" },
    { name: "Flight Test Engineer", description: "Plans and analyzes tests that help evaluate aircraft performance and behavior.", areas: "Test planning, instrumentation, flight data", skills: "Data analysis, communication, safety mindset" },
    { name: "Propulsion Engineer", description: "Studies and tests systems that generate thrust or move fluids and gases.", areas: "Engines, turbines, propulsion components", skills: "Thermodynamics, fluids, measurement" },
    { name: "Aerodynamics Engineer", description: "Analyzes airflow and aerodynamic forces around vehicles and components.", areas: "Wind tunnel tests, computational analysis, design", skills: "Fluid mechanics, math, data interpretation" },
    { name: "CAD / Design Engineer", description: "Creates and revises technical models and drawings for parts and assemblies.", areas: "Digital models, drawings, design reviews", skills: "CAD, geometry, detail, communication" },
    { name: "Research Engineer", description: "Uses experiments and analysis to investigate technical questions and new ideas.", areas: "Lab testing, prototypes, technical studies", skills: "Experimental design, programming, clear writing" }
];

let collegeEntries = [];
let actionTasks = [];
let nextTaskId = 1;
let careerUser = null;
let savedSkillValues = new Map();
let careerLoading = true;
let careerLoadNumber = 0;
let careerLoadErrors = { college: false, tasks: false, skills: false };

function appendTextList(parent, items) {
    const list = document.createElement("ul");
    items.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
    });
    parent.appendChild(list);
}

function renderPathways() {
    const container = document.getElementById("pathway-grid");
    pathways.forEach((pathway) => {
        const card = document.createElement("article"); card.className = "pathway-card";
        const heading = document.createElement("h3"); heading.textContent = pathway.name;
        const description = document.createElement("p"); description.textContent = pathway.description;
        const studyTitle = document.createElement("h4"); studyTitle.textContent = "Common study areas";
        const careerTitle = document.createElement("h4"); careerTitle.textContent = "Example career areas";
        card.append(heading, description, studyTitle);
        appendTextList(card, pathway.study);
        card.appendChild(careerTitle);
        appendTextList(card, pathway.careers);
        container.appendChild(card);
    });
}

function renderSkills() {
    const container = document.getElementById("skills-grid");
    container.replaceChildren();
    skills.forEach((skill) => {
        const card = document.createElement("article"); card.className = "skill-card";
        const heading = document.createElement("h3"); heading.textContent = skill.name;
        const description = document.createElement("p"); description.textContent = skill.description;
        const meta = document.createElement("div"); meta.className = "skill-meta";
        const level = document.createElement("span"); level.textContent = "Level: " + skill.level;
        const demo = document.createElement("span"); demo.className = "demo-chip"; demo.textContent = careerLoading ? "LOADING" : careerLoadErrors.skills ? "UNAVAILABLE" : careerUser ? (savedSkillValues.has(skill.name) ? "SAVED" : "NOT SET") : "DEMO";
        meta.append(level, demo);
        const progressLine = document.createElement("div"); progressLine.className = "skill-meta";
        const progressLabel = document.createElement("span");
        const hasSavedProgress = savedSkillValues.has(skill.name);
        const currentProgress = careerLoading || careerLoadErrors.skills ? null : hasSavedProgress ? savedSkillValues.get(skill.name) : careerUser ? null : skill.progress;
        progressLabel.textContent = careerLoading ? "Loading skill progress…" : careerLoadErrors.skills ? "Progress unavailable" : careerUser ? (hasSavedProgress ? "Your progress" : "Not set") : "Example progress";
        const percent = document.createElement("strong"); percent.textContent = currentProgress === null ? "—" : currentProgress + "%";
        progressLine.append(progressLabel, percent);
        const track = document.createElement("div"); track.className = "skill-track";
        track.setAttribute("role", "progressbar"); track.setAttribute("aria-label", skill.name + (careerUser ? " saved progress" : " example progress"));
        track.setAttribute("aria-valuemin", "0"); track.setAttribute("aria-valuemax", "100"); track.setAttribute("aria-valuenow", String(currentProgress ?? 0));
        track.hidden = currentProgress === null;
        const fill = document.createElement("div"); fill.className = "skill-fill"; fill.style.width = (currentProgress ?? 0) + "%";
        track.appendChild(fill);
        card.append(heading, description, meta, progressLine, track);
        if (careerUser && !careerLoading) { const line = document.createElement("div"); line.className = "skill-meta"; const input = document.createElement("input"); input.type = "range"; input.min = "0"; input.max = "100"; input.value = String(currentProgress ?? 0); input.setAttribute("aria-label", skill.name + " proficiency"); const save = document.createElement("button"); save.type = "button"; save.className = "secondary-button"; save.textContent = "Save"; input.addEventListener("input", () => { percent.textContent = input.value + "%"; progressLabel.textContent = "Unsaved proficiency"; fill.style.width = input.value + "%"; track.hidden = false; track.setAttribute("aria-valuenow", input.value); }); save.addEventListener("click", async () => { save.disabled = true; let user; try { user = await window.AeroLab.requireUser("Sign in to save skills.", "college-career.html"); } catch (authError) { save.disabled = false; document.getElementById("career-auth-status").textContent = window.AeroLab.friendlyError(authError); return; } const { error } = await window.AeroLab.client.from("skills").upsert({ user_id: user.id, skill_name: skill.name, proficiency: Number(input.value) }, { onConflict: "user_id,skill_name" }); save.disabled = false; if (error) { let note = document.getElementById("skills-save-status"); if (note) note.textContent = window.AeroLab.friendlyError(error); } else { savedSkillValues.set(skill.name, Number(input.value)); demo.textContent = "SAVED"; progressLabel.textContent = "Your progress"; percent.textContent = input.value + "%"; track.hidden = false; let note = document.getElementById("skills-save-status"); if (note) note.textContent = skill.name + " saved."; } }); line.append(input, save); card.appendChild(line); }
        container.appendChild(card);
    });
}

function renderPreparation() {
    const container = document.getElementById("prep-list");
    const storageKey = "aerolab-preparation:" + (careerUser ? careerUser.id : "guest");
    let savedChecks = [];
    try {
        const stored = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
        if (Array.isArray(stored)) savedChecks = stored.filter((index) => Number.isInteger(index) && index >= 0 && index < preparationItems.length);
    } catch (error) {
        document.getElementById("prep-save-status").textContent = "Browser storage is unavailable; checklist changes will last until you leave this page.";
    }
    container.replaceChildren();
    preparationItems.forEach(([category, description], index) => {
        const label = document.createElement("label"); label.className = "prep-item";
        const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.id = "prep-item-" + index; checkbox.checked = savedChecks.includes(index);
        checkbox.addEventListener("change", updatePreparationProgress);
        const copy = document.createElement("span");
        const title = document.createElement("strong"); title.textContent = category;
        const detail = document.createElement("span"); detail.textContent = description;
        copy.append(title, detail);
        label.append(checkbox, copy);
        container.appendChild(label);
    });
}

function updatePreparationProgress() {
    const checkboxes = [...document.querySelectorAll("#prep-list input[type=checkbox]")];
    const checked = checkboxes.filter((checkbox) => checkbox.checked).length;
    const percent = checkboxes.length === 0 ? 0 : Math.round(checked / checkboxes.length * 100);
    document.getElementById("prep-count").textContent = checked + " of " + checkboxes.length + " areas checked";
    document.getElementById("prep-percent").textContent = percent + "%";
    const track = document.querySelector(".completion-track");
    track.setAttribute("aria-valuenow", String(percent));
    document.getElementById("prep-fill").style.width = percent + "%";
    const storageKey = "aerolab-preparation:" + (careerUser ? careerUser.id : "guest");
    const checkedIndices = checkboxes.filter((checkbox) => checkbox.checked).map((checkbox) => Number(checkbox.id.replace("prep-item-", "")));
    try {
        window.localStorage.setItem(storageKey, JSON.stringify(checkedIndices));
        document.getElementById("prep-save-status").textContent = "Saved in this browser for " + (careerUser ? "your account." : "this device.");
    } catch (error) {
        document.getElementById("prep-save-status").textContent = "Could not save to browser storage; selections will last until you leave this page.";
    }
}

function formatDate(dateValue) {
    if (!dateValue) return "Not set";
    const date = new Date(dateValue + "T12:00:00");
    return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function renderCollegeEntries() {
    const list = document.getElementById("college-list");
    const empty = document.getElementById("college-empty");
    list.replaceChildren();
    collegeEntries.forEach((entry) => {
        const card = document.createElement("article"); card.className = "saved-card";
        const header = document.createElement("div"); header.className = "card-header";
        const text = document.createElement("div");
        const title = document.createElement("h3"); title.textContent = entry.name;
        const program = document.createElement("p"); program.textContent = entry.program;
        text.append(title, program);
        const remove = document.createElement("button"); remove.type = "button"; remove.className = "remove-button"; remove.textContent = "Remove";
        remove.setAttribute("aria-label", "Remove " + entry.name + " research entry");
        remove.addEventListener("click", async () => { let user; try { user = await window.AeroLab.requireUser("Sign in to manage college research.", "college-career.html"); } catch (authError) { document.getElementById("career-auth-status").textContent = window.AeroLab.friendlyError(authError); return; } const { error } = await window.AeroLab.client.from("college_entries").delete().eq("id", entry.id).eq("user_id", user.id); if (error) { document.getElementById("college-error").textContent = window.AeroLab.friendlyError(error); return; } collegeEntries = collegeEntries.filter((item) => item.id !== entry.id); renderCollegeEntries(); });
        header.append(text, remove);
        card.appendChild(header);
        const details = [ ["Location", entry.location || "Not set"], ["Application deadline", formatDate(entry.deadline)], ["Notes", entry.notes || "No notes added."] ];
        details.forEach(([label, value]) => {
            const labelNode = document.createElement("p"); labelNode.className = "card-label"; labelNode.textContent = label;
            const valueNode = document.createElement("p"); valueNode.textContent = value;
            card.append(labelNode, valueNode);
        });
        list.appendChild(card);
    });
    empty.hidden = collegeEntries.length > 0 || careerLoading || careerLoadErrors.college;
}

document.getElementById("college-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("college-name").value.trim();
    const program = document.getElementById("college-program").value.trim();
    const error = document.getElementById("college-error");
    error.textContent = "";
    if (!name || !program) { error.textContent = "Enter both a college name and an engineering program."; (!name ? document.getElementById("college-name") : document.getElementById("college-program")).focus(); return; }
    let user; try { user = await window.AeroLab.requireUser("Sign in to save college research.", "college-career.html"); } catch (authError) { error.textContent = window.AeroLab.friendlyError(authError); window.AeroLab.showLoginPrompt(document.getElementById("career-auth-status"), "college-career.html", "Sign in to save college research and career tasks."); return; }
    const payload = { user_id: user.id, college_name: name, program, location: document.getElementById("college-location").value.trim(), application_deadline: document.getElementById("college-deadline").value || null, notes: document.getElementById("college-notes").value.trim() };
    const { data, error: saveError } = await window.AeroLab.client.from("college_entries").insert(payload).select().single();
    if (saveError) { error.textContent = window.AeroLab.friendlyError(saveError); return; }
    collegeEntries.unshift({ id: data.id, name: data.college_name, program: data.program || "", location: data.location || "", deadline: data.application_deadline || "", notes: data.notes || "" });
    event.currentTarget.reset();
    renderCollegeEntries();
});

function updateTaskProgress() {
    const done = actionTasks.filter((task) => task.completed).length;
    const percent = actionTasks.length === 0 ? null : Math.round(done / actionTasks.length * 100);
    document.getElementById("task-count").textContent = actionTasks.length + (actionTasks.length === 1 ? " task" : " tasks");
    document.getElementById("task-percent").textContent = percent === null ? "No tasks yet" : percent + "% complete";
    const track = document.querySelector(".task-track");
    track.hidden = percent === null || careerLoading || careerLoadErrors.tasks;
    document.getElementById("task-fill").style.width = (percent ?? 0) + "%";
    track.setAttribute("aria-valuenow", String(percent ?? 0));
}

function renderTasks() {
    const list = document.getElementById("task-list");
    list.replaceChildren();
    actionTasks.forEach((task) => {
        const item = document.createElement("li"); item.className = "task-item";
        const label = document.createElement("label"); label.className = "task-copy";
        const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = task.completed;
        checkbox.addEventListener("change", () => {
            (async () => { const user = await window.AeroLab.requireUser("Sign in to manage career tasks.", "college-career.html"); if (!user) { checkbox.checked = task.completed; return; } const { error } = await window.AeroLab.client.from("career_tasks").update({ completed: checkbox.checked }).eq("id", task.id).eq("user_id", user.id); if (error) { checkbox.checked = task.completed; document.getElementById("task-error").textContent = window.AeroLab.friendlyError(error); return; } task.completed = checkbox.checked; label.classList.toggle("is-done", task.completed); updateTaskProgress(); })();
        });
        const taskText = document.createElement("span"); taskText.textContent = task.text;
        label.classList.toggle("is-done", task.completed);
        label.append(checkbox, taskText);
        const remove = document.createElement("button"); remove.type = "button"; remove.className = "remove-button"; remove.textContent = "Remove";
        remove.setAttribute("aria-label", "Remove task: " + task.text);
        remove.addEventListener("click", () => {
            (async () => { let user; try { user = await window.AeroLab.requireUser("Sign in to manage career tasks.", "college-career.html"); } catch (authError) { document.getElementById("career-auth-status").textContent = window.AeroLab.friendlyError(authError); return; } const { error } = await window.AeroLab.client.from("career_tasks").delete().eq("id", task.id).eq("user_id", user.id); if (error) { document.getElementById("task-error").textContent = window.AeroLab.friendlyError(error); return; } actionTasks = actionTasks.filter((current) => current.id !== task.id); renderTasks(); })();
            document.getElementById("task-name").focus();
        });
        item.append(label, remove);
        list.appendChild(item);
    });
    document.getElementById("task-empty").hidden = actionTasks.length > 0 || careerLoading || careerLoadErrors.tasks;
    updateTaskProgress();
}

document.getElementById("task-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.getElementById("task-name");
    const text = input.value.trim();
    const error = document.getElementById("task-error");
    error.textContent = "";
    if (!text) { error.textContent = "Enter a goal or task before adding it."; input.focus(); return; }
    let user; try { user = await window.AeroLab.requireUser("Sign in to save career tasks.", "college-career.html"); } catch (authError) { error.textContent = window.AeroLab.friendlyError(authError); window.AeroLab.showLoginPrompt(document.getElementById("career-auth-status"), "college-career.html", "Sign in to save college research and career tasks."); return; }
    const { data, error: saveError } = await window.AeroLab.client.from("career_tasks").insert({ user_id: user.id, title: text }).select().single();
    if (saveError) { error.textContent = window.AeroLab.friendlyError(saveError); return; }
    actionTasks.push({ id: data.id, text: data.title, completed: data.completed });
    input.value = ""; renderTasks(); input.focus();
});
document.getElementById("use-suggestion").addEventListener("click", () => {
    const suggestion = document.getElementById("task-suggestion").value;
    if (!suggestion) return;
    document.getElementById("task-name").value = suggestion;
    document.getElementById("task-name").focus();
});

async function loadCareerData() {
    const loadNumber = ++careerLoadNumber;
    careerLoading = true; careerUser = null; collegeEntries = []; actionTasks = []; savedSkillValues = new Map();
    careerLoadErrors = { college: false, tasks: false, skills: false };
    document.getElementById("career-auth-status").textContent = "Checking your account…";
    document.querySelector(".prep-panel").hidden = true;
    document.getElementById("prep-save-status").textContent = "Checking your account…";
    document.getElementById("prep-list").replaceChildren();
    renderCollegeEntries(); renderTasks(); renderSkills();
    try { careerUser = await window.AeroLab.getUser(); }
    catch (error) {
        if (loadNumber !== careerLoadNumber) return;
        careerLoading = false; careerLoadErrors = { college: true, tasks: true, skills: true };
        document.getElementById("prep-save-status").textContent = "Account status could not be confirmed; checklist remains hidden to protect account separation.";
        document.getElementById("career-auth-status").textContent = window.AeroLab.friendlyError(error);
        renderCollegeEntries(); renderTasks(); renderSkills();
        return;
    }
    if (loadNumber !== careerLoadNumber) return;
    if (!careerUser) {
        careerLoading = false;
        renderPreparation(); updatePreparationProgress();
        document.querySelector(".prep-panel").hidden = false;
        document.getElementById("career-auth-status").textContent = "Sign in to keep personal college research and career tasks.";
        renderCollegeEntries(); renderTasks(); renderSkills();
        return;
    }
    renderPreparation(); updatePreparationProgress();
    document.querySelector(".prep-panel").hidden = false;
    const userId = careerUser.id;
    document.getElementById("career-auth-status").textContent = "Loading your saved planning data…";
    const client = window.AeroLab.client;
    const results = await Promise.all([
        client.from("college_entries").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        client.from("career_tasks").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
        client.from("skills").select("skill_name,proficiency").eq("user_id", userId)
    ]);
    if (loadNumber !== careerLoadNumber || !careerUser || careerUser.id !== userId) return;
    careerLoading = false;
    careerLoadErrors = { college: Boolean(results[0].error), tasks: Boolean(results[1].error), skills: Boolean(results[2].error) };
    const firstError = results.find((result) => result.error);
    document.getElementById("career-auth-status").textContent = firstError ? window.AeroLab.friendlyError(firstError.error) : "Your saved college research, skill progress, and career tasks.";
    if (!results[0].error) collegeEntries = (results[0].data || []).map((row) => ({ id: row.id, name: row.college_name, program: row.program || "", location: row.location || "", deadline: row.application_deadline || "", notes: row.notes || "" }));
    if (!results[1].error) actionTasks = (results[1].data || []).map((row) => ({ id: row.id, text: row.title, completed: row.completed }));
    if (!results[2].error) savedSkillValues = new Map((results[2].data || []).map((row) => [row.skill_name, row.proficiency]));
    renderCollegeEntries(); renderTasks(); renderSkills();
}
window.addEventListener("aerolab:auth", loadCareerData);
renderPathways(); renderSkills(); renderPreparation(); updatePreparationProgress(); renderCollegeEntries(); renderTasks(); loadCareerData();
