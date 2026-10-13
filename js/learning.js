"use strict";

// These sample percentages are illustrative only and are not saved user progress.
const topics = [
    {
        name: "Aerodynamics", difficulty: "Beginner", progress: 25,
        description: "Learn how air moves around objects and how aerodynamic forces affect flight.",
        overview: "Aerodynamics studies how air flows around an object and the forces that flow can create. It helps explain how aircraft, gliders, and other vehicles move through the air.",
        concepts: ["Lift and drag", "Airflow and pressure differences", "Angle of attack", "Airfoils and wing shape"],
        recommendations: ["Sketch airflow over a simple wing cross-section.", "Compare how changing angle of attack can affect lift and drag.", "Learn why drag increases as speed increases."],
        questions: ["What is the difference between lift and drag?", "What can happen when angle of attack becomes too large?", "How can wing shape change airflow?"]
    },
    {
        name: "Propulsion", difficulty: "Intermediate", progress: 0,
        description: "Explore how engines produce thrust and how energy moves a vehicle forward.",
        overview: "Propulsion is the study of producing thrust to move a vehicle. Aerospace propulsion topics connect forces, energy, airflow, and momentum.",
        concepts: ["Thrust", "Newton's third law", "Mass flow and exhaust velocity", "Propellers, jet engines, and rockets"],
        recommendations: ["Compare how a propeller and a jet engine accelerate air.", "Review Newton's laws and momentum conservation.", "Learn the difference between fuel energy and useful thrust."],
        questions: ["What force does an engine produce to move a vehicle?", "How does expelled mass create an opposite reaction?", "How are propeller and jet propulsion alike and different?"]
    },
    {
        name: "Aircraft Design", difficulty: "Intermediate", progress: 10,
        description: "See how wings, fuselages, stability, and mission goals shape an aircraft concept.",
        overview: "Aircraft design brings requirements, aerodynamics, structures, propulsion, and control together. Designers make trade-offs based on what the aircraft needs to do.",
        concepts: ["Design requirements", "Wing planform and aspect ratio", "Stability and control", "Weight and performance trade-offs"],
        recommendations: ["Identify the mission and constraints before choosing a shape.", "Learn what the horizontal and vertical stabilizers do.", "Compare how wing size affects lift, drag, and structure."],
        questions: ["Why should designers define a mission first?", "What is one role of a tail surface?", "Why can improving one design feature create a trade-off?"]
    },
    {
        name: "CAD & 3D Design", difficulty: "Beginner", progress: 0,
        description: "Build accurate digital parts and assemblies using sketches, dimensions, and constraints.",
        overview: "Computer-aided design (CAD) lets engineers create and revise digital models. A careful model can help communicate dimensions and fit before anything is manufactured.",
        concepts: ["2D sketches and constraints", "Dimensions and units", "Extrudes, revolves, and patterns", "Parts and assemblies"],
        recommendations: ["Practice fully dimensioning a simple sketch.", "Learn how a sketch feature becomes a 3D solid.", "Use consistent units and name important features clearly."],
        questions: ["Why are dimensions important in a CAD sketch?", "What is an assembly used to show?", "Why should units be checked before modeling?"]
    },
    {
        name: "Experimental Engineering", difficulty: "Intermediate", progress: 65,
        description: "Plan fair tests, collect measurements, estimate uncertainty, and interpret results.",
        overview: "Experimental engineering uses measurements to answer a question. Good experiments control variables, record methods, and consider uncertainty before drawing conclusions.",
        concepts: ["Independent and dependent variables", "Control variables", "Measurement uncertainty", "Repeat trials and data analysis"],
        recommendations: ["Write a testable question and prediction.", "Change one main variable while keeping other conditions consistent.", "Record units and repeat measurements when practical."],
        questions: ["Why should a test control other variables?", "What does uncertainty tell you about a measurement?", "How can repeated trials improve confidence?"]
    },
    {
        name: "Physics & Mathematics", difficulty: "Beginner", progress: 40,
        description: "Use forces, motion, vectors, algebra, and graphs to describe engineering systems.",
        overview: "Physics and math provide tools for describing motion and forces. Equations and graphs help turn observations into predictions that can be checked.",
        concepts: ["Newton's laws", "Velocity and acceleration", "Vectors and components", "Units, ratios, and graph interpretation"],
        recommendations: ["Practice rearranging equations before substituting numbers.", "Resolve angled vectors into horizontal and vertical components.", "Check units and signs to catch calculation mistakes."],
        questions: ["How is acceleration related to net force?", "What makes a vector different from a scalar?", "Why are units useful when checking an equation?"]
    },
    {
        name: "Programming", difficulty: "Beginner", progress: 20,
        description: "Use code to automate calculations, organize data, and build interactive engineering tools.",
        overview: "Programming helps engineers repeat calculations consistently, visualize data, and make useful interfaces. Clear logic and careful testing matter as much as syntax.",
        concepts: ["Variables and data types", "Conditionals and loops", "Functions", "Input validation and debugging"],
        recommendations: ["Break a problem into small steps before writing code.", "Use functions for calculations that repeat.", "Test normal, boundary, and invalid inputs."],
        questions: ["What is a variable used for?", "When might a conditional be useful?", "Why should a program check user input?"]
    },
    {
        name: "Aerospace Materials", difficulty: "Advanced", progress: 0,
        description: "Compare material strength, weight, temperature limits, and durability for aerospace uses.",
        overview: "Aerospace materials must meet performance needs while handling loads and environments. Engineers compare properties and manufacturing constraints instead of choosing by strength alone.",
        concepts: ["Strength-to-weight ratio", "Stiffness and fatigue", "Temperature and corrosion", "Composites, alloys, and material trade-offs"],
        recommendations: ["Learn the difference between strength and stiffness.", "Compare material density alongside mechanical properties.", "Explore why inspection and fatigue life matter for structures."],
        questions: ["Why does low mass matter in aerospace structures?", "How is stiffness different from strength?", "Why might a material choice involve trade-offs?"]
    }
];

const questions = [
    { prompt: "If an object has a nonzero net force, what happens to its motion?", options: ["It accelerates in the direction of the net force", "It must stop immediately", "Its mass becomes zero"], answer: 0, explanation: "Newton's second law says net force causes acceleration in the direction of that force." },
    { prompt: "Which force acts opposite an object's motion through air?", options: ["Drag", "Weight", "Normal force"], answer: 0, explanation: "Drag is an aerodynamic force that resists motion through a fluid such as air." },
    { prompt: "In ideal projectile motion with no air resistance, what happens to horizontal velocity?", options: ["It stays constant", "It steadily increases because of gravity", "It becomes zero at the top"], answer: 0, explanation: "Gravity acts vertically, so there is no horizontal acceleration in this model." },
    { prompt: "At the highest point of an upward projectile's path, what is its vertical velocity?", options: ["Zero for an instant", "At its largest upward value", "Always equal to its horizontal velocity"], answer: 0, explanation: "The projectile momentarily stops moving upward before its vertical motion reverses." },
    { prompt: "What explains the forward thrust from a vehicle that pushes mass backward?", options: ["Newton's third law", "Conservation of temperature", "The law of reflection"], answer: 0, explanation: "The backward push on the air or exhaust has an equal and opposite reaction on the vehicle." }
];

const topicGrid = document.getElementById("topics-grid");
const searchInput = document.getElementById("topic-search");
const difficultyFilter = document.getElementById("difficulty-filter");
const emptyState = document.getElementById("topic-empty");
const studyPanel = document.getElementById("study-panel");
let lastStudyButton = null;
let learningUser = null;
let savedLearning = new Map();
let learningLoading = true;
let learningLoadNumber = 0;

function updateProgressSummary() {
    const recorded = topics.filter((topic) => Number.isInteger(topic.progress));
    const overall = recorded.length ? Math.round(recorded.reduce((sum, topic) => sum + topic.progress, 0) / recorded.length) : null;
    const started = recorded.filter((topic) => topic.progress > 0).length;
    const completed = recorded.filter((topic) => topic.progress === 100).length;
    const display = overall === null ? "—" : overall + "%";
    document.getElementById("overall-percent").textContent = display;
    document.getElementById("overall-label").textContent = display;
    document.getElementById("topics-started").textContent = String(started);
    document.getElementById("topics-completed").textContent = String(completed);
    const bar = document.getElementById("overall-fill");
    bar.parentElement.hidden = overall === null;
    bar.style.width = (overall ?? 0) + "%";
    bar.parentElement.setAttribute("aria-valuenow", String(overall ?? 0));
    const summaryLabel = document.querySelector(".overall-line span");
    summaryLabel.textContent = learningLoading ? "Loading saved progress…" : overall === null ? "No progress recorded yet" : learningUser ? "Average across topics with saved progress" : "Example progress across all topic areas";
}
function openStudyGuide(topic, button) {
    lastStudyButton = button;
    document.getElementById("study-title").textContent = topic.name;
    document.getElementById("study-overview").textContent = topic.overview;
    fillList("study-concepts", topic.concepts);
    fillList("study-recommendations", topic.recommendations);
    fillList("study-questions", topic.questions);
    studyPanel.hidden = false;
    studyPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    document.getElementById("study-title").focus({ preventScroll: true });
}

function fillList(elementId, items) {
    const list = document.getElementById(elementId);
    list.replaceChildren();
    items.forEach((item) => {
        const listItem = document.createElement("li");
        listItem.textContent = item;
        list.appendChild(listItem);
    });
}

function createTopicCard(topic, index) {
    const card = document.createElement("article");
    card.className = "topic-card";
    const heading = document.createElement("h2");
    heading.id = "topic-title-" + index;
    heading.textContent = topic.name;
    const description = document.createElement("p");
    description.textContent = topic.description;
    const meta = document.createElement("div");
    meta.className = "topic-meta";
    const level = document.createElement("span"); level.textContent = "Difficulty";
    const badge = document.createElement("span"); badge.className = "difficulty"; badge.textContent = topic.difficulty;
    meta.append(level, badge);
    const progressRow = document.createElement("div");
    progressRow.className = "topic-progress";
    const progressLabel = document.createElement("span"); progressLabel.textContent = learningLoading ? "Loading…" : learningUser ? (topic.progress === null ? "Not recorded" : "Your progress") : "Demo progress";
    const percentage = document.createElement("strong"); percentage.textContent = topic.progress === null ? "—" : topic.progress + "%";
    progressRow.append(progressLabel, percentage);
    const track = document.createElement("div");
    track.className = "topic-track";
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-label", topic.name + (learningUser ? " saved progress" : " demo progress"));
    track.setAttribute("aria-valuemin", "0"); track.setAttribute("aria-valuemax", "100"); track.setAttribute("aria-valuenow", String(topic.progress ?? 0));
    track.hidden = topic.progress === null || learningLoading;
    const fill = document.createElement("div"); fill.className = "topic-fill"; fill.style.width = (topic.progress ?? 0) + "%";
    track.appendChild(fill);
    const saveRow = document.createElement("div"); saveRow.className = "learning-save-row";
    const range = document.createElement("input"); range.type = "range"; range.min = "0"; range.max = "100"; range.value = String(topic.progress ?? 0); range.setAttribute("aria-label", topic.name + " progress percentage"); range.disabled = !learningUser || learningLoading;
    const rangeValue = document.createElement("span"); rangeValue.textContent = topic.progress === null ? "Not set" : topic.progress + "%";
    const saveButton = document.createElement("button"); saveButton.type = "button"; saveButton.className = "study-button"; saveButton.textContent = "Save Progress"; saveButton.disabled = !learningUser || learningLoading; saveRow.hidden = learningLoading || !learningUser;
    range.addEventListener("input", () => { rangeValue.textContent = range.value + "%"; percentage.textContent = range.value + "%"; progressLabel.textContent = "Unsaved progress"; fill.style.width = range.value + "%"; track.hidden = false; track.setAttribute("aria-valuenow", range.value); });
    saveButton.addEventListener("click", async () => { if (!learningUser) { window.AeroLab.showLoginPrompt(document.getElementById("learning-save-status"), "learning.html", "Sign in to save learning progress."); return; } saveButton.disabled = true; const status = document.getElementById("learning-save-status"); status.textContent = "Saving…"; const value = Number(range.value); const { error } = await window.AeroLab.client.from("learning_progress").upsert({ user_id: learningUser.id, topic: topic.name, progress: value }, { onConflict: "user_id,topic" }); saveButton.disabled = false; if (error) { status.textContent = window.AeroLab.friendlyError(error); return; } topic.progress = value; savedLearning.set(topic.name, value); progressLabel.textContent = "Your progress"; percentage.textContent = value + "%"; rangeValue.textContent = value + "%"; track.hidden = false; fill.style.width = value + "%"; updateProgressSummary(); status.textContent = "Progress saved."; });
    saveRow.append(range, rangeValue, saveButton);
    const button = document.createElement("button");
    button.type = "button"; button.className = "study-button"; button.textContent = "Study Topic";
    button.setAttribute("aria-describedby", heading.id);
    button.addEventListener("click", () => openStudyGuide(topic, button));
    card.append(heading, description, meta, progressRow, track, saveRow, button);
    return card;
}

function renderTopics() {
    const term = searchInput.value.trim().toLowerCase();
    const difficulty = difficultyFilter.value;
    const matching = topics.filter((topic) => {
        const searchableText = [topic.name, topic.description, topic.overview, ...topic.concepts].join(" ").toLowerCase();
        return searchableText.includes(term) && (difficulty === "All" || topic.difficulty === difficulty);
    });
    topicGrid.replaceChildren();
    matching.forEach((topic) => topicGrid.appendChild(createTopicCard(topic, topics.indexOf(topic))));
    emptyState.hidden = matching.length > 0;
}

function renderQuestions() {
    const questionList = document.getElementById("question-list");
    const answers = Array(questions.length).fill(null);
    questionList.replaceChildren();
    questions.forEach((question, questionIndex) => {
        const fieldset = document.createElement("fieldset");
        fieldset.className = "question-card";
        const legend = document.createElement("legend");
        legend.textContent = (questionIndex + 1) + ". " + question.prompt;
        fieldset.appendChild(legend);
        const options = document.createElement("div"); options.className = "question-options";
        question.options.forEach((optionText, optionIndex) => {
            const label = document.createElement("label"); label.className = "answer-option";
            const input = document.createElement("input");
            input.type = "radio"; input.name = "question-" + questionIndex; input.value = String(optionIndex);
            input.addEventListener("change", () => {
                answers[questionIndex] = optionIndex;
                const feedback = fieldset.querySelector(".answer-feedback");
                const correct = optionIndex === question.answer;
                feedback.className = "answer-feedback " + (correct ? "correct" : "incorrect");
                feedback.textContent = (correct ? "Correct. " : "Not quite. The correct answer is “" + question.options[question.answer] + ".” ") + question.explanation;
                const answeredCount = answers.filter((answer) => answer !== null).length;
                const score = answers.reduce((sum, answer, index) => sum + (answer === questions[index].answer ? 1 : 0), 0);
                document.getElementById("quiz-score").textContent = score + " / " + questions.length + " correct · " + answeredCount + " answered";
            });
            const text = document.createElement("span"); text.textContent = optionText;
            label.append(input, text);
            options.appendChild(label);
        });
        const feedback = document.createElement("p"); feedback.className = "answer-feedback"; feedback.setAttribute("aria-live", "polite");
        fieldset.append(options, feedback);
        questionList.appendChild(fieldset);
    });
}

searchInput.addEventListener("input", renderTopics);
difficultyFilter.addEventListener("change", renderTopics);
document.getElementById("close-study").addEventListener("click", () => {
    studyPanel.hidden = true;
    if (lastStudyButton) lastStudyButton.focus();
});

async function loadLearningProgress() {
    const loadNumber = ++learningLoadNumber;
    const status = document.getElementById("learning-save-status");
    const note = document.getElementById("learning-data-note");
    const loginLink = document.querySelector("[data-learning-login]");
    learningLoading = true;
    topics.forEach((topic) => { topic.progress = null; });
    updateProgressSummary(); renderTopics();
    try { learningUser = await window.AeroLab.getUser(); }
    catch (error) {
        if (loadNumber === learningLoadNumber) { learningUser = null; learningLoading = false; note.textContent = "Progress could not be loaded."; status.textContent = window.AeroLab.friendlyError(error); updateProgressSummary(); renderTopics(); }
        return;
    }
    if (loadNumber !== learningLoadNumber) return;
    if (!learningUser) {
        topics.forEach((topic) => { topic.progress = topic.demoProgress; });
        learningLoading = false; note.textContent = "DEMO VALUES · Example progress only; not your saved progress.";
        loginLink.hidden = false; status.textContent = "";
    } else {
        loginLink.hidden = true; note.textContent = "Loading your saved progress…";
        const loadedUserId = learningUser.id;
        const { data, error } = await window.AeroLab.client.from("learning_progress").select("topic,progress").eq("user_id", loadedUserId);
        if (loadNumber !== learningLoadNumber || !learningUser || learningUser.id !== loadedUserId) return;
        learningLoading = false;
        if (error) {
            topics.forEach((topic) => { topic.progress = null; });
            note.textContent = "Saved progress is unavailable."; status.textContent = window.AeroLab.friendlyError(error);
        } else {
            const byTopic = new Map((data || []).map((row) => [row.topic, row.progress]));
            topics.forEach((topic) => { topic.progress = byTopic.has(topic.name) ? byTopic.get(topic.name) : null; });
            note.textContent = data && data.length ? "Your saved progress · Changes are stored in your AeroLab account." : "No learning progress recorded yet. Set a topic value and save it to begin.";
            status.textContent = "";
        }
    }
    updateProgressSummary(); renderTopics();
}
topics.forEach((topic) => { topic.demoProgress = topic.progress; topic.progress = null; });
window.addEventListener("aerolab:auth", loadLearningProgress);
updateProgressSummary(); renderTopics(); renderQuestions(); loadLearningProgress();
