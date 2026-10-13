"use strict";

// Entries are kept in this page's memory only and represent information the user enters.
let portfolioEntries = [];
let nextEntryId = 1;
let editingEntryId = null;
let lastDetailsTrigger = null;
let portfolioUser = null;
let portfolioLoading = true;
let portfolioLoadError = false;

const entryForm = document.getElementById("portfolio-form");
const formPanel = document.getElementById("portfolio-form-panel");
const grid = document.getElementById("portfolio-grid");
const emptyState = document.getElementById("portfolio-empty");
const detailsModal = document.getElementById("details-modal");

function formatEntryDate(value) {
    if (!value) return "Not set";
    const date = new Date(value + "T12:00:00");
    return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function addMeta(card, label, value, isFull) {
    const item = document.createElement("div");
    item.className = "meta-item" + (isFull ? " full" : "");
    const labelNode = document.createElement("span"); labelNode.textContent = label;
    const valueNode = document.createElement("p"); valueNode.textContent = value || "Not added yet";
    item.append(labelNode, valueNode);
    card.appendChild(item);
}

function renderPortfolio() {
    grid.replaceChildren();
    portfolioEntries.forEach((entry) => {
        const card = document.createElement("article"); card.className = "portfolio-card";
        const top = document.createElement("div"); top.className = "card-top";
        const title = document.createElement("h2"); title.textContent = entry.title;
        const status = document.createElement("span"); status.className = "status-chip"; status.textContent = entry.status;
        top.append(title, status);
        const description = document.createElement("p"); description.className = "portfolio-description"; description.textContent = entry.description;
        const metadata = document.createElement("div"); metadata.className = "portfolio-meta";
        addMeta(metadata, "Skills", entry.skills, false);
        addMeta(metadata, "Date", formatEntryDate(entry.date), false);
        addMeta(metadata, "Results", entry.results, true);
        const actions = document.createElement("div"); actions.className = "card-actions";
        const detailsButton = document.createElement("button"); detailsButton.type = "button"; detailsButton.className = "details-button"; detailsButton.textContent = "View Details";
        detailsButton.addEventListener("click", () => openDetails(entry, detailsButton));
        const editButton = document.createElement("button"); editButton.type = "button"; editButton.className = "edit-button"; editButton.textContent = "Edit";
        editButton.addEventListener("click", () => editEntry(entry));
        const deleteButton = document.createElement("button"); deleteButton.type = "button"; deleteButton.className = "delete-button"; deleteButton.textContent = "Delete";
        deleteButton.setAttribute("aria-label", "Delete portfolio project " + entry.title);
        deleteButton.addEventListener("click", () => {
            portfolioEntries = portfolioEntries.filter((item) => item.id !== entry.id);
            if (editingEntryId === entry.id) closeForm();
            renderPortfolio();
            document.getElementById("toggle-form").focus();
        });
        actions.append(detailsButton, editButton, deleteButton);
        card.append(top, description, metadata, actions);
        grid.appendChild(card);
    });
    emptyState.hidden = portfolioEntries.length > 0 || portfolioLoading || portfolioLoadError;
}

function showForm() {
    formPanel.hidden = false;
    formPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("entry-title").focus({ preventScroll: true });
}

async function startNewEntry() {
    let user; try { user = await window.AeroLab.getUser(); } catch (error) { document.getElementById("portfolio-auth-status").textContent = window.AeroLab.friendlyError(error); return; }
    if (!user) { window.AeroLab.showLoginPrompt(document.getElementById("portfolio-auth-status"), "portfolio.html", "Sign in before adding a portfolio project."); return; }
    entryForm.reset();
    editingEntryId = null;
    document.getElementById("form-title").textContent = "Add a Portfolio Project";
    document.querySelector(".form-heading p").textContent = "Record real work and results in your own words.";
    document.getElementById("save-entry").textContent = "Save Project";
    document.getElementById("form-error").textContent = "";
    showForm();
}

function closeForm() {
    formPanel.hidden = true;
    entryForm.reset();
    editingEntryId = null;
    document.getElementById("form-error").textContent = "";
    document.getElementById("toggle-form").focus();
}

function editEntry(entry) {
    editingEntryId = entry.id;
    document.getElementById("entry-title").value = entry.title;
    document.getElementById("entry-description").value = entry.description;
    document.getElementById("entry-status").value = entry.status;
    document.getElementById("entry-skills").value = entry.skills;
    document.getElementById("entry-date").value = entry.date;
    document.getElementById("entry-results").value = entry.results;
    document.getElementById("entry-details").value = entry.technicalDetails;
    document.getElementById("form-title").textContent = "Edit Portfolio Project";
    document.querySelector(".form-heading p").textContent = "Update the details of this project.";
    document.getElementById("save-entry").textContent = "Save Changes";
    document.getElementById("form-error").textContent = "";
    showForm();
}

function openDetails(entry, trigger) {
    lastDetailsTrigger = trigger;
    document.getElementById("details-title").textContent = entry.title;
    document.getElementById("details-description").textContent = entry.description;
    document.getElementById("details-status").textContent = entry.status;
    document.getElementById("details-skills").textContent = entry.skills || "Not added yet";
    document.getElementById("details-date").textContent = formatEntryDate(entry.date);
    document.getElementById("details-results").textContent = entry.results || "Not added yet";
    document.getElementById("details-technical").textContent = entry.technicalDetails || "Not added yet";
    detailsModal.hidden = false;
    detailsModal.querySelector("[data-close-details]").focus();
}

function closeDetails() {
    detailsModal.hidden = true;
    if (lastDetailsTrigger) lastDetailsTrigger.focus();
}

document.getElementById("toggle-form").addEventListener("click", startNewEntry);
document.getElementById("close-form").addEventListener("click", closeForm);
document.getElementById("cancel-form").addEventListener("click", closeForm);

entryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = document.getElementById("entry-title").value.trim();
    const description = document.getElementById("entry-description").value.trim();
    const error = document.getElementById("form-error");
    error.textContent = "";
    if (!title || !description) {
        error.textContent = "Enter both a project title and a short description.";
        (!title ? document.getElementById("entry-title") : document.getElementById("entry-description")).focus();
        return;
    }
    const updatedEntry = {
        title,
        description,
        status: document.getElementById("entry-status").value,
        skills: document.getElementById("entry-skills").value.trim(),
        date: document.getElementById("entry-date").value,
        results: document.getElementById("entry-results").value.trim(),
        technicalDetails: document.getElementById("entry-details").value.trim()
    };
    let user; try { user = await window.AeroLab.requireUser("Sign in to save portfolio projects.", "portfolio.html"); } catch (authError) { error.textContent = window.AeroLab.friendlyError(authError); return; }
    const row = { user_id: user.id, title: updatedEntry.title, description: updatedEntry.description, status: updatedEntry.status, skills: updatedEntry.skills, project_date: updatedEntry.date || null, results: updatedEntry.results, technical_details: updatedEntry.technicalDetails };
    const saveButton = document.getElementById("save-entry"); saveButton.disabled = true;
    const result = editingEntryId === null
        ? await window.AeroLab.client.from("portfolio_projects").insert(row).select().single()
        : await window.AeroLab.client.from("portfolio_projects").update(row).eq("id", editingEntryId).eq("user_id", user.id).select().single();
    saveButton.disabled = false;
    if (result.error) { error.textContent = window.AeroLab.friendlyError(result.error); return; }
    const saved = mapPortfolioRow(result.data);
    if (editingEntryId === null) portfolioEntries.unshift(saved);
    else { const index = portfolioEntries.findIndex((entry) => entry.id === editingEntryId); if (index !== -1) portfolioEntries[index] = saved; }
    renderPortfolio(); formPanel.hidden = true; entryForm.reset(); editingEntryId = null;
    document.getElementById("toggle-form").focus();
});

document.querySelectorAll("[data-close-details]").forEach((button) => button.addEventListener("click", closeDetails));
detailsModal.addEventListener("click", (event) => { if (event.target === detailsModal) closeDetails(); });
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        if (!detailsModal.hidden) closeDetails();
        if (!formPanel.hidden) closeForm();
    }
});

function mapPortfolioRow(row) { return { id: row.id, title: row.title, description: row.description || "", status: row.status || "Planning", skills: row.skills || "", date: row.project_date || "", results: row.results || "", technicalDetails: row.technical_details || "" }; }
let portfolioLoadNumber = 0;
async function loadPortfolio() {
    const loadNumber = ++portfolioLoadNumber;
    const status = document.getElementById("portfolio-auth-status");
    portfolioEntries = []; portfolioLoading = true; portfolioLoadError = false; renderPortfolio();
    try { portfolioUser = await window.AeroLab.getUser(); } catch (error) { if (loadNumber === portfolioLoadNumber) { portfolioUser = null; portfolioLoading = false; portfolioLoadError = true; status.textContent = window.AeroLab.friendlyError(error); renderPortfolio(); } return; }
    if (loadNumber !== portfolioLoadNumber) return;
    if (!portfolioUser) { portfolioLoading = false; status.textContent = "Sign in to save and view your portfolio projects."; document.getElementById("toggle-form").disabled = false; }
    else {
        status.textContent = "Loading your saved portfolio…";
        try {
            const { data, error } = await window.AeroLab.client.from("portfolio_projects").select("*").eq("user_id", portfolioUser.id).order("created_at", { ascending: false });
            if (loadNumber !== portfolioLoadNumber) return;
            if (error) { portfolioLoadError = true; status.textContent = window.AeroLab.friendlyError(error); }
            else if (portfolioUser && portfolioUser.id === (await window.AeroLab.getUser())?.id) { portfolioEntries = (data || []).map(mapPortfolioRow); status.textContent = "Your private portfolio entries."; }
            portfolioLoading = false;
        } catch (error) { if (loadNumber !== portfolioLoadNumber) return; portfolioLoading = false; portfolioLoadError = true; status.textContent = window.AeroLab.friendlyError(error); }
    }
    if (!portfolioUser && !formPanel.hidden) formPanel.hidden = true;
    detailsModal.hidden = true; renderPortfolio();
}
window.addEventListener("aerolab:auth", loadPortfolio);
renderPortfolio(); loadPortfolio();
