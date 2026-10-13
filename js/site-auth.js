(function () {
    const app = window.AeroLab;
    const loginLink = document.querySelector("[data-login-link]");
    const account = document.querySelector("[data-auth-account]");
    const email = document.querySelector("[data-auth-email]");
    const logoutButton = document.querySelector("[data-auth-logout]");
    const status = document.querySelector("[data-auth-status]");

    function renderAuth(user) {
        if (loginLink) loginLink.hidden = Boolean(user);
        if (account) account.hidden = !user;
        if (email) email.textContent = user ? user.email || "Account" : "";
        if (logoutButton) logoutButton.hidden = !user;
    }

    if (loginLink && app) loginLink.href = app.loginHref(document.body.dataset.returnPage || "projects.html");
    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            logoutButton.disabled = true;
            if (status) status.textContent = "Signing out…";
            try {
                if (!app || !app.client) throw app ? app.configurationError() : new Error("Authentication is unavailable.");
                const { error } = await app.client.auth.signOut();
                if (error) throw error;
                renderAuth(null);
                if (status) status.textContent = "You are logged out.";
                if (document.body.dataset.privatePage === "true") window.location.href = document.body.dataset.publicHome || "../index.html";
            } catch (error) {
                if (status) status.textContent = app ? app.friendlyError(error, "AeroLab could not sign out. Please try again.") : "AeroLab could not sign out.";
            } finally { logoutButton.disabled = false; }
        });
    }

    window.addEventListener("aerolab:auth", (event) => renderAuth(event.detail && event.detail.user));
    if (app) app.ready.then(({ user }) => renderAuth(user));
})();
