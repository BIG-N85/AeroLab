"use strict";

const statuses = ["Planning", "Research", "Design", "Building", "Testing", "Analyzing", "Completed"];
const demoProjects = [
    { name: "Wind Tunnel Research", description: "Compare lift and drag measurements for several wing shapes in a small wind tunnel.", status: "Research", progress: 35, deadline: "2026-11-20", demo: true },
    { name: "Aircraft CAD Development", description: "Create a 3D aircraft concept and refine its wing, fuselage, and control surfaces.", status: "Design", progress: 60, deadline: "2026-12-05", demo: true },
    { name: "Aeromodeling Project", description: "Design, build, and flight-test a lightweight model aircraft while recording each iteration.", status: "Building", progress: 72, deadline: "2026-11-12", demo: true },
    { name: "Model Rocket Stability Study", description: "Explore how center of gravity and fin size affect the stability of a model rocket.", status: "Testing", progress: 48, deadline: "2026-12-18", demo: true },
    { name: "Propeller Performance Notes", description: "Analyze thrust and current measurements for different propeller configurations.", status: "Analyzing", progress: 85, deadline: "2026-10-30", demo: true },
    { name: "Flight Logbook Prototype", description: "Plan a structured logbook for documenting test flights, observations, and results.", status: "Planning", progress: 10, deadline: "2027-01-15", demo: true }
];
let userProjects = [];
let projects = [];
let projectsLoading = true;
let projectLoadError = false;
let authInitialized = false;
let activeStatus = "All";
let currentUser = null;
let editingProjectId = null;
let selectedProject = null;
let resourceData = { tasks: [], materials: [], experiments: [] };

const grid = document.getElementById("project-grid");
const searchInput = document.getElementById("project-search");
const filtersContainer = document.getElementById("status-filters");
const emptyState = document.getElementById("empty-state");
const projectModal = document.getElementById("project-modal");
const detailsModal = document.getElementById("details-modal");
const form = document.getElementById("project-form");
const nameInput = document.getElementById("project-name");
const errorMessage = document.getElementById("form-error");
const saveProjectButton = document.getElementById("save-project-button");
const progressInput = document.getElementById("project-progress");
const progressValue = document.getElementById("progress-value");
const loadStatus = document.getElementById("project-load-status");
const loginPrompt = document.getElementById("project-login-prompt");

function formatDeadline(value) {
    if (!value) return "Not set";
    const date = new Date(value + "T12:00:00");
    return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
function escapeText(value) { return value == null || value === "" ? "Not added" : String(value); }
function mappedProject(row) {
    return { id: row.id, userId: row.user_id, name: row.title, description: row.description || "", objective: row.objective || "", status: row.status || "Planning", progress: Number.isFinite(Number(row.progress)) ? Number(row.progress) : 0, deadline: row.deadline || "", research: row.research || "", designNotes: row.design_notes || "", experiment: row.experiment || "", data: row.data || "", results: row.results || "", conclusion: row.conclusion || "", budget: Number(row.budget) || 0, demo: false };
}
function combineProjects() { projects = !authInitialized ? [] : currentUser ? [...userProjects] : [...demoProjects]; renderProjects(); }

function makeStatusFilters() {
    filtersContainer.replaceChildren();
    ["All", ...statuses].forEach((status) => {
        const button = document.createElement("button"); button.type = "button"; button.className = "filter-button";
        button.textContent = status; button.setAttribute("aria-pressed", status === activeStatus ? "true" : "false");
        button.addEventListener("click", () => { activeStatus = status; makeStatusFilters(); renderProjects(); });
        filtersContainer.appendChild(button);
    });
}

function createProjectCard(project) {
    const article = document.createElement("article"); article.className = "project-card";
    const top = document.createElement("div"); top.className = "card-top";
    const title = document.createElement("h3"); title.textContent = project.name; top.appendChild(title);
    if (project.demo) { const badge = document.createElement("span"); badge.className = "demo-badge"; badge.textContent = "DEMO / EXAMPLE"; top.appendChild(badge); }
    const description = document.createElement("p"); description.className = "project-description"; description.textContent = project.description || "No description provided.";
    const statusRow = document.createElement("div"); statusRow.className = "status-row"; statusRow.innerHTML = "<span>Status</span>";
    const statusPill = document.createElement("span"); statusPill.className = "status-pill"; statusPill.textContent = project.status; statusRow.appendChild(statusPill);
    const progressLabel = document.createElement("div"); progressLabel.className = "progress-label"; progressLabel.innerHTML = "<span>Progress</span>";
    const percent = document.createElement("strong"); percent.textContent = project.progress + "%"; progressLabel.appendChild(percent);
    const track = document.createElement("div"); track.className = "progress-track"; track.setAttribute("role", "progressbar"); track.setAttribute("aria-label", project.name + " progress"); track.setAttribute("aria-valuemin", "0"); track.setAttribute("aria-valuemax", "100"); track.setAttribute("aria-valuenow", String(project.progress));
    const fill = document.createElement("div"); fill.className = "progress-fill"; fill.style.width = project.progress + "%"; track.appendChild(fill);
    const deadline = document.createElement("div"); deadline.className = "deadline-row"; deadline.innerHTML = "<span>Deadline</span>";
    const dateText = document.createElement("strong"); dateText.textContent = formatDeadline(project.deadline); deadline.appendChild(dateText);
    const actions = document.createElement("div"); actions.className = "project-card-actions";
    const view = document.createElement("button"); view.type = "button"; view.className = "view-button"; view.textContent = "View Project"; view.addEventListener("click", () => showDetails(project)); actions.appendChild(view);
    if (!project.demo && currentUser && project.userId === currentUser.id) {
        const edit = document.createElement("button"); edit.type = "button"; edit.className = "view-button"; edit.textContent = "Edit"; edit.addEventListener("click", () => startEditProject(project));
        const remove = document.createElement("button"); remove.type = "button"; remove.className = "view-button delete-project-button"; remove.textContent = "Delete"; remove.addEventListener("click", () => deleteProject(project));
        actions.append(edit, remove);
    }
    article.append(top, description, statusRow, progressLabel, track, deadline, actions);
    return article;
}

function renderProjects() {
    const term = searchInput.value.trim().toLowerCase();
    const visible = projects.filter((project) => (project.name + " " + project.description).toLowerCase().includes(term) && (activeStatus === "All" || project.status === activeStatus));
    grid.replaceChildren(); visible.forEach((project) => grid.appendChild(createProjectCard(project)));
    if (projectsLoading || projectLoadError) {
        emptyState.hidden = true;
        return;
    }
    emptyState.hidden = visible.length > 0;
    if (visible.length === 0) {
        const filtered = Boolean(term) || activeStatus !== "All";
        const heading = document.createElement("strong");
        heading.textContent = filtered ? "No projects match your search." : currentUser ? "No projects yet." : "No example projects are available.";
        emptyState.replaceChildren(heading, document.createTextNode(filtered ? " Try another title, description, or status filter." : currentUser ? " Create your first project to start tracking its progress." : " Please try again shortly."));
    }
}

function showModal(modal) { modal.hidden = false; const control = modal.querySelector("input, textarea, select, button"); if (control) control.focus(); }
function closeModal(modal) { modal.hidden = true; }
function clearWorkflowForm() { ["project-objective", "project-research", "project-design-notes", "project-experiment", "project-data-notes", "project-results", "project-conclusion"].forEach((id) => { document.getElementById(id).value = ""; }); document.getElementById("project-budget").value = "0"; }

function startNewProject() {
    if (!currentUser) {
        if (!window.AeroLab || !window.AeroLab.isConfigured) { loginPrompt.replaceChildren(document.createTextNode("Connect Supabase in js/config.js to create and save personal projects.")); loginPrompt.hidden = false; }
        else window.AeroLab.showLoginPrompt(loginPrompt, "projects.html", "Log in to create and save personal projects.");
        return;
    }
    editingProjectId = null; form.reset(); clearWorkflowForm();
    document.getElementById("project-status").value = "Planning"; progressValue.textContent = "0%";
    document.getElementById("form-title").textContent = "Create a Project";
    document.querySelector("#project-modal .modal-header p").textContent = "Save an engineering project to your AeroLab account.";
    saveProjectButton.textContent = "Add Project"; errorMessage.textContent = ""; showModal(projectModal);
}

function startEditProject(project) {
    if (!currentUser || project.demo || project.userId !== currentUser.id) return;
    editingProjectId = project.id;
    document.getElementById("project-name").value = project.name;
    document.getElementById("project-description").value = project.description;
    document.getElementById("project-status").value = project.status;
    document.getElementById("project-deadline").value = project.deadline;
    progressInput.value = String(project.progress); progressValue.textContent = project.progress + "%";
    document.getElementById("project-objective").value = project.objective;
    document.getElementById("project-research").value = project.research;
    document.getElementById("project-design-notes").value = project.designNotes;
    document.getElementById("project-experiment").value = project.experiment;
    document.getElementById("project-data-notes").value = project.data;
    document.getElementById("project-results").value = project.results;
    document.getElementById("project-conclusion").value = project.conclusion;
    document.getElementById("project-budget").value = String(project.budget);
    document.getElementById("workflow-fields").open = true;
    document.getElementById("form-title").textContent = "Edit Project";
    document.querySelector("#project-modal .modal-header p").textContent = "Update your saved project.";
    saveProjectButton.textContent = "Save Changes"; errorMessage.textContent = ""; showModal(projectModal);
}

async function saveProject(event) {
    event.preventDefault(); errorMessage.textContent = "";
    const title = nameInput.value.trim();
    const budget = Number(document.getElementById("project-budget").value);
    if (!title) { errorMessage.textContent = "Please enter a project name."; nameInput.focus(); return; }
    if (!Number.isFinite(budget) || budget < 0) { errorMessage.textContent = "Enter a valid nonnegative budget."; document.getElementById("project-budget").focus(); return; }
    let user;
    try { user = await window.AeroLab.requireUser(); } catch (error) { errorMessage.textContent = window.AeroLab.friendlyError(error); return; }
    const payload = { title, description: document.getElementById("project-description").value.trim(), status: document.getElementById("project-status").value, deadline: document.getElementById("project-deadline").value || null, progress: Number(progressInput.value), objective: document.getElementById("project-objective").value.trim(), research: document.getElementById("project-research").value.trim(), design_notes: document.getElementById("project-design-notes").value.trim(), experiment: document.getElementById("project-experiment").value.trim(), data: document.getElementById("project-data-notes").value.trim(), results: document.getElementById("project-results").value.trim(), conclusion: document.getElementById("project-conclusion").value.trim(), budget };
    saveProjectButton.disabled = true; saveProjectButton.textContent = "Saving…";
    try {
        let query = window.AeroLab.client.from("projects");
        if (editingProjectId) query = query.update(payload).eq("id", editingProjectId).eq("user_id", user.id);
        else query = query.insert({ ...payload, user_id: user.id });
        const { data, error } = await query.select("*").single();
        if (error) throw error;
        const saved = mappedProject(data);
        if (editingProjectId) userProjects = userProjects.map((project) => project.id === saved.id ? saved : project);
        else userProjects.unshift(saved);
        combineProjects(); closeModal(projectModal); loginPrompt.hidden = true;
        if (window.AeroLab) window.AeroLab.notifyAuth(user, "PROJECT_SAVED");
    } catch (error) { errorMessage.textContent = window.AeroLab.friendlyError(error, "AeroLab could not save this project. Check your connection and database setup."); }
    finally { saveProjectButton.disabled = false; saveProjectButton.textContent = editingProjectId ? "Save Changes" : "Add Project"; }
}

async function deleteProject(project) {
    if (!currentUser || project.demo || project.userId !== currentUser.id) return;
    const button = [...grid.querySelectorAll("button")].find((item) => item.textContent === "Delete" && item.closest("article")?.querySelector("h3")?.textContent === project.name);
    if (button) { button.disabled = true; button.textContent = "Deleting…"; }
    try {
        const user = await window.AeroLab.requireUser();
        const { error } = await window.AeroLab.client.from("projects").delete().eq("id", project.id).eq("user_id", user.id);
        if (error) throw error;
        userProjects = userProjects.filter((item) => item.id !== project.id); combineProjects();
        if (selectedProject && selectedProject.id === project.id) closeModal(detailsModal);
    } catch (error) { loadStatus.textContent = window.AeroLab.friendlyError(error, "AeroLab could not delete this project."); if (button) { button.disabled = false; button.textContent = "Delete"; } }
}

async function showDetails(project) {
    selectedProject = project;
    document.getElementById("details-title").textContent = project.name;
    document.getElementById("details-description").textContent = project.description || "No description provided.";
    document.getElementById("details-status").textContent = project.status;
    document.getElementById("details-progress").textContent = project.progress + "%";
    document.getElementById("details-deadline").textContent = formatDeadline(project.deadline);
    document.getElementById("details-type").textContent = project.demo ? "Demo example" : "Your saved project";
    document.getElementById("project-workflow").hidden = project.demo || !currentUser || project.userId !== currentUser.id;
    const workflow = { "details-objective": project.objective, "details-research": project.research, "details-design": project.designNotes, "details-experiment": project.experiment, "details-data": project.data, "details-results": project.results, "details-conclusion": project.conclusion, "details-budget": "$" + Number(project.budget || 0).toFixed(2) };
    Object.entries(workflow).forEach(([id, value]) => { document.getElementById(id).textContent = escapeText(value); });
    document.getElementById("project-detail-status").textContent = "";
    resourceData = { tasks: [], materials: [], experiments: [] }; renderProjectResources();
    showModal(detailsModal);
    if (!project.demo && currentUser && project.userId === currentUser.id) await loadProjectResources(project);
}

async function loadUserProjects(user) {
    if (!window.AeroLab || !window.AeroLab.client || !user) {
        userProjects = []; projectsLoading = false; projectLoadError = Boolean(user);
        combineProjects();
        if (user) loadStatus.textContent = "Supabase is not configured; saved projects are unavailable.";
        return;
    }
    projectsLoading = true; projectLoadError = false; userProjects = []; combineProjects();
    loadStatus.textContent = "Loading your saved projects…";
    try {
        const { data, error } = await window.AeroLab.client.from("projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
        if (error) throw error;
        const actualUser = await window.AeroLab.getUser();
        if (!actualUser || actualUser.id !== user.id || !currentUser || currentUser.id !== user.id) return;
        userProjects = (data || []).map(mappedProject); projectsLoading = false; projectLoadError = false; combineProjects();
        loadStatus.textContent = "Your saved projects are shown here.";
    } catch (error) {
        if (currentUser && currentUser.id === user.id) { projectsLoading = false; projectLoadError = true; userProjects = []; combineProjects(); loadStatus.textContent = window.AeroLab.friendlyError(error, "Saved projects could not be loaded."); }
    }
}

function setUser(user) {
    const nextUser = user || null;
    const unchanged = (currentUser && nextUser && currentUser.id === nextUser.id) || (!currentUser && !nextUser);
    if (authInitialized && unchanged) return;
    authInitialized = true;
    currentUser = nextUser;
    document.getElementById("demo-project-note").hidden = Boolean(currentUser);
    loginPrompt.hidden = true;
    projectLoadError = false;
    if (!currentUser) {
        projectsLoading = false; userProjects = []; resourceData = { tasks: [], materials: [], experiments: [] }; selectedProject = null; detailsModal.hidden = true; combineProjects();
        loadStatus.textContent = window.AeroLab && window.AeroLab.isConfigured ? "Demo projects are public. Log in to save your own projects." : "Demo projects are public. Configure Supabase to enable accounts and saving.";
    } else {
        projectsLoading = true; userProjects = []; projects = []; combineProjects();
        loadStatus.textContent = "Loading your saved projects…";
        loadUserProjects(currentUser);
    }
}

function addResourceItem(list, text, control, remove) {
    const li = document.createElement("li"); const copy = document.createElement("span"); copy.appendChild(control || document.createTextNode(text));
    if (control) { const title = document.createElement("span"); title.textContent = text; control.appendChild(title); }
    li.appendChild(copy); const button = document.createElement("button"); button.type = "button"; button.textContent = "Remove"; button.addEventListener("click", remove); li.appendChild(button); list.appendChild(li); return { li, control };
}
function renderProjectResources() { renderTasks(); renderMaterials(); renderExperiments(); }
function renderTasks() {
    const list = document.getElementById("project-task-list"); list.replaceChildren();
    resourceData.tasks.forEach((task) => {
        const label = document.createElement("label"); const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = task.completed;
        const text = document.createElement("span"); text.textContent = task.title + (task.due_date ? " · due " + formatDeadline(task.due_date) : ""); label.append(checkbox, text);
        addResourceItem(list, "", label, async () => { await deleteResource("project_tasks", task.id, "tasks"); });
        checkbox.addEventListener("change", async () => {
            try { const user = await window.AeroLab.requireUser(); const { error } = await window.AeroLab.client.from("project_tasks").update({ completed: checkbox.checked }).eq("id", task.id).eq("project_id", selectedProject.id).eq("user_id", user.id); if (error) throw error; task.completed = checkbox.checked; }
            catch (error) { checkbox.checked = task.completed; document.getElementById("project-detail-status").textContent = window.AeroLab.friendlyError(error, "Task could not be updated."); }
        });
    });
}
function renderMaterials() {
    const list = document.getElementById("project-material-list"); list.replaceChildren();
    resourceData.materials.forEach((material) => {
        const label = document.createElement("label"); const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = material.purchased;
        const text = document.createElement("span"); text.textContent = material.name + " · qty " + material.quantity + " · $" + Number(material.estimated_cost).toFixed(2); label.append(checkbox, text);
        addResourceItem(list, "", label, async () => { await deleteResource("project_materials", material.id, "materials"); });
        checkbox.addEventListener("change", async () => {
            try { const user = await window.AeroLab.requireUser(); const { error } = await window.AeroLab.client.from("project_materials").update({ purchased: checkbox.checked }).eq("id", material.id).eq("project_id", selectedProject.id).eq("user_id", user.id); if (error) throw error; material.purchased = checkbox.checked; }
            catch (error) { checkbox.checked = material.purchased; document.getElementById("project-detail-status").textContent = window.AeroLab.friendlyError(error, "Material could not be updated."); }
        });
    });
}
function renderExperiments() {
    const body = document.getElementById("experimental-rows"); body.replaceChildren();
    resourceData.experiments.forEach((point) => {
        const row = document.createElement("tr"); [point.label || "Point", String(point.x_value), String(point.y_value), point.notes || ""].forEach((value) => { const cell = document.createElement("td"); cell.textContent = value; row.appendChild(cell); });
        const action = document.createElement("td"); const remove = document.createElement("button"); remove.type = "button"; remove.className = "secondary-button"; remove.textContent = "Remove"; remove.addEventListener("click", async () => deleteResource("experimental_data", point.id, "experiments")); action.appendChild(remove); row.appendChild(action); body.appendChild(row);
    });
    drawProjectGraph();
}
function drawProjectGraph() {
    const canvas = document.getElementById("project-data-canvas"); const ctx = canvas.getContext("2d"); if (!ctx) return;
    const width = Math.max(260, canvas.clientWidth); const height = Math.max(160, canvas.clientHeight); const ratio = window.devicePixelRatio || 1; canvas.width = width * ratio; canvas.height = height * ratio; ctx.setTransform(ratio,0,0,ratio,0,0); ctx.clearRect(0,0,width,height);
    const left=42,right=width-12,top=12,bottom=height-30; ctx.strokeStyle="#526a82";ctx.beginPath();ctx.moveTo(left,top);ctx.lineTo(left,bottom);ctx.lineTo(right,bottom);ctx.stroke();
    if(!resourceData.experiments.length){ctx.fillStyle="#8497ad";ctx.textAlign="center";ctx.fillText("Add points to graph project data",(left+right)/2,(top+bottom)/2);return;}
    let minX=resourceData.experiments[0].x_value,maxX=minX,minY=resourceData.experiments[0].y_value,maxY=minY;resourceData.experiments.forEach(p=>{minX=Math.min(minX,p.x_value);maxX=Math.max(maxX,p.x_value);minY=Math.min(minY,p.y_value);maxY=Math.max(maxY,p.y_value)});if(minX===maxX){minX-=1;maxX+=1}if(minY===maxY){minY-=1;maxY+=1}
    const xy=p=>({x:left+(p.x_value-minX)/(maxX-minX)*(right-left),y:bottom-(p.y_value-minY)/(maxY-minY)*(bottom-top)});ctx.strokeStyle="#4da3ff";ctx.beginPath();resourceData.experiments.forEach((p,i)=>{const q=xy(p);if(i===0)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y)});ctx.stroke();resourceData.experiments.forEach(p=>{const q=xy(p);ctx.beginPath();ctx.arc(q.x,q.y,4,0,Math.PI*2);ctx.fillStyle="#8fc6ff";ctx.fill()});
}
async function loadProjectResources(project) {
    const message = document.getElementById("project-detail-status"); message.textContent = "Loading project tasks, materials, and experimental data…";
    try {
        const user = await window.AeroLab.requireUser(); if (!selectedProject || selectedProject.id !== project.id || user.id !== project.userId) return;
        const requests = await Promise.all([
            window.AeroLab.client.from("project_tasks").select("*").eq("project_id", project.id).eq("user_id", user.id).order("created_at"),
            window.AeroLab.client.from("project_materials").select("*").eq("project_id", project.id).eq("user_id", user.id).order("created_at"),
            window.AeroLab.client.from("experimental_data").select("*").eq("project_id", project.id).eq("user_id", user.id).order("created_at")
        ]);
        const failed = requests.find((result) => result.error); if (failed) throw failed.error;
        if (!selectedProject || selectedProject.id !== project.id || !currentUser || currentUser.id !== user.id) return;
        resourceData = { tasks: requests[0].data || [], materials: requests[1].data || [], experiments: requests[2].data || [] }; renderProjectResources(); message.textContent = "";
    } catch (error) { message.textContent = window.AeroLab.friendlyError(error, "Project details could not be loaded."); }
}
async function deleteResource(table, id, key) {
    const message = document.getElementById("project-detail-status");
    try { const user = await window.AeroLab.requireUser(); const { error } = await window.AeroLab.client.from(table).delete().eq("id", id).eq("project_id", selectedProject.id).eq("user_id", user.id); if (error) throw error; resourceData[key] = resourceData[key].filter((item) => item.id !== id); renderProjectResources(); }
    catch (error) { message.textContent = window.AeroLab.friendlyError(error, "That item could not be removed."); }
}

document.getElementById("project-task-form").addEventListener("submit", async (event) => {
    event.preventDefault(); const titleInput=document.getElementById("project-task-title");const title=titleInput.value.trim();const errorNode=document.getElementById("task-error");errorNode.textContent="";if(!title){errorNode.textContent="Enter a task name.";return;}
    try {const user=await window.AeroLab.requireUser();const payload={project_id:selectedProject.id,user_id:user.id,title,due_date:document.getElementById("project-task-due").value||null};const {data,error}=await window.AeroLab.client.from("project_tasks").insert(payload).select("*").single();if(error)throw error;resourceData.tasks.push(data);event.currentTarget.reset();renderTasks();}
    catch(error){errorNode.textContent=window.AeroLab.friendlyError(error,"Task could not be saved.");}
});
document.getElementById("project-material-form").addEventListener("submit", async (event) => {
    event.preventDefault();const nameInput=document.getElementById("material-name");const name=nameInput.value.trim();const quantity=Number(document.getElementById("material-quantity").value);const cost=Number(document.getElementById("material-cost").value);const errorNode=document.getElementById("material-error");errorNode.textContent="";if(!name||!Number.isInteger(quantity)||quantity<1||!Number.isFinite(cost)||cost<0){errorNode.textContent="Enter a material name, whole-number quantity above zero, and nonnegative cost.";return;}
    try{const user=await window.AeroLab.requireUser();const payload={project_id:selectedProject.id,user_id:user.id,name,quantity,estimated_cost:cost};const {data,error}=await window.AeroLab.client.from("project_materials").insert(payload).select("*").single();if(error)throw error;resourceData.materials.push(data);event.currentTarget.reset();document.getElementById("material-quantity").value="1";document.getElementById("material-cost").value="0";renderMaterials();}
    catch(error){errorNode.textContent=window.AeroLab.friendlyError(error,"Material could not be saved.");}
});
document.getElementById("experimental-form").addEventListener("submit", async (event) => {
    event.preventDefault();const x=Number(document.getElementById("experiment-x").value);const y=Number(document.getElementById("experiment-y").value);const errorNode=document.getElementById("experimental-error");errorNode.textContent="";if(document.getElementById("experiment-x").value===""||document.getElementById("experiment-y").value===""||!Number.isFinite(x)||!Number.isFinite(y)){errorNode.textContent="Enter valid numeric X and Y values.";return;}
    try{const user=await window.AeroLab.requireUser();const payload={project_id:selectedProject.id,user_id:user.id,label:document.getElementById("experiment-label").value.trim()||null,x_value:x,y_value:y,notes:document.getElementById("experiment-notes").value.trim()||null};const {data,error}=await window.AeroLab.client.from("experimental_data").insert(payload).select("*").single();if(error)throw error;resourceData.experiments.push(data);event.currentTarget.reset();renderExperiments();}
    catch(error){errorNode.textContent=window.AeroLab.friendlyError(error,"Experimental data could not be saved.");}
});

document.getElementById("create-project-button").addEventListener("click", startNewProject);
form.addEventListener("submit", saveProject);
searchInput.addEventListener("input", renderProjects);
progressInput.addEventListener("input", () => { progressValue.textContent = progressInput.value + "%"; });
document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", () => { const modal=button.closest(".modal-backdrop");if(modal){closeModal(modal);if(modal===detailsModal)selectedProject=null;} }));
[projectModal, detailsModal].forEach((modal) => modal.addEventListener("click", (event) => { if(event.target===modal){closeModal(modal);if(modal===detailsModal)selectedProject=null;} }));
document.addEventListener("keydown", (event) => { if(event.key==="Escape"){[projectModal,detailsModal].forEach((modal)=>{if(!modal.hidden){closeModal(modal);if(modal===detailsModal)selectedProject=null;}})} });

function prepareForm() { const select=document.getElementById("project-status");statuses.forEach(status=>{const option=document.createElement("option");option.value=status;option.textContent=status;select.appendChild(option)}); }
prepareForm();makeStatusFilters();combineProjects();
if(window.AeroLab){window.addEventListener("aerolab:auth",event=>setUser(event.detail&&event.detail.user));window.AeroLab.ready.then(({user,error})=>{if(error&&!user)loadStatus.textContent=window.AeroLab.friendlyError(error,"Demo projects are available; saved projects could not be loaded.");setUser(user)});}else{loadStatus.textContent="Demo projects are public. Supabase client unavailable.";setUser(null);}
