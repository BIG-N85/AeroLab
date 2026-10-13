"use strict";

let homeMetricLoadNumber = 0;
async function updateHomeMetrics() {
    const loadNumber = ++homeMetricLoadNumber;
    const metrics = { projects: "—", learning: "—", skills: "—" };
    const status = document.querySelector("[data-home-status]");
    if (status) status.textContent = "Loading account metrics…";
    let user;
    try { user = await window.AeroLab.getUser(); }
    catch (error) {
        if (loadNumber === homeMetricLoadNumber) {
            updateMetricNodes(metrics);
            if (status) status.textContent = window.AeroLab.friendlyError(error);
        }
        return;
    }
    if (!user) {
        if (loadNumber !== homeMetricLoadNumber) return;
        updateMetricNodes(metrics);
        if (status) status.textContent = window.AeroLab.isConfigured ? "Sign in to view your account metrics." : "Account metrics are available after Supabase setup.";
        return;
    }
    try {
        const client = window.AeroLab.client;
        const [projects, learning, skills] = await Promise.all([
            client.from("projects").select("id,status", { count: "exact" }).eq("user_id", user.id),
            client.from("learning_progress").select("progress").eq("user_id", user.id),
            client.from("skills").select("id", { count: "exact" }).eq("user_id", user.id)
        ]);
        if (loadNumber !== homeMetricLoadNumber || user.id !== (await window.AeroLab.getUser())?.id) return;
        if (!projects.error) metrics.projects = String((projects.data || []).filter((item) => item.status !== "Completed").length);
        if (!learning.error) {
            const rows = learning.data || [];
            metrics.learning = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.progress, 0) / rows.length) + "%" : "—";
        }
        if (!skills.error) metrics.skills = String(skills.count ?? (skills.data || []).length);
        updateMetricNodes(metrics);
        const requestError = [projects, learning, skills].find((result) => result.error);
        if (status) status.textContent = requestError ? window.AeroLab.friendlyError(requestError.error) : "Your account metrics are up to date.";
    } catch (error) {
        if (loadNumber !== homeMetricLoadNumber) return;
        updateMetricNodes(metrics);
        if (status) status.textContent = window.AeroLab.friendlyError(error);
    }
}
function updateMetricNodes(metrics) {
    Object.entries(metrics).forEach(([key, value]) => {
        const node = document.querySelector('[data-home-metric="' + key + '"]');
        if (node) node.textContent = value;
    });
}
window.addEventListener("aerolab:auth", updateHomeMetrics);
updateHomeMetrics();
