(function () {
    const app = window.AeroLab;
    const message = document.getElementById("auth-message");
    const loginPanel = document.getElementById("login-panel");
    const signupPanel = document.getElementById("signup-panel");
    const signedInPanel = document.getElementById("signed-in-panel");
    const forms = document.getElementById("auth-forms");
    const configHelp = document.getElementById("config-help");

    function showMessage(text, kind) {
        message.textContent = text;
        message.className = "auth-message" + (kind ? " " + kind : "");
    }

    function setBusy(form, busy, label) {
        if (!form) return;
        const button = form.querySelector("button[type=submit]");
        if (!button) return;
        button.disabled = busy;
        button.textContent = busy ? label : form.id === "login-form" ? "Login" : "Sign Up";
    }

    function getRedirectTarget() {
        const target = new URLSearchParams(window.location.search).get("redirect");
        const allowed = new Set(["projects.html", "learning.html", "college-career.html", "portfolio.html"]);
        return allowed.has(target) ? target : "projects.html";
    }

    function showSignedIn(user) {
        forms.hidden = true;
        signedInPanel.hidden = false;
        document.getElementById("signed-in-email").textContent = user.email || "Your AeroLab account is active.";
    }

    document.querySelectorAll("[data-show-signup]").forEach((button) => button.addEventListener("click", () => { loginPanel.hidden = true; signupPanel.hidden = false; document.getElementById("signup-name").focus(); showMessage("", ""); }));
    document.querySelectorAll("[data-show-login]").forEach((button) => button.addEventListener("click", () => { signupPanel.hidden = true; loginPanel.hidden = false; document.getElementById("login-email").focus(); showMessage("", ""); }));

    document.getElementById("login-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        if (!email || !password) { showMessage("Enter both your email and password.", "error"); return; }
        if (!app || !app.client) { configHelp.hidden = false; showMessage(app ? app.friendlyError(app.configurationError()) : "Authentication is unavailable.", "error"); return; }
        setBusy(form, true, "Logging in…");
        try {
            const { error } = await app.client.auth.signInWithPassword({ email, password });
            if (error) throw error;
            showMessage("Login successful. Opening your AeroLab workspace…", "success");
            window.location.href = getRedirectTarget();
        } catch (error) { showMessage(app.friendlyError(error, "AeroLab could not log you in. Check your details and try again."), "error"); }
        finally { setBusy(form, false); }
    });

    document.getElementById("signup-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const fullName = document.getElementById("signup-name").value.trim();
        const email = document.getElementById("signup-email").value.trim();
        const password = document.getElementById("signup-password").value;
        const confirm = document.getElementById("signup-confirm").value;
        if (!fullName || !email || !password || !confirm) { showMessage("Complete all sign-up fields.", "error"); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showMessage("Enter a valid email address.", "error"); return; }
        if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) { showMessage("Use at least 8 characters, including a letter and a number.", "error"); return; }
        if (password !== confirm) { showMessage("The passwords do not match.", "error"); return; }
        if (!app || !app.client) { configHelp.hidden = false; showMessage(app ? app.friendlyError(app.configurationError()) : "Authentication is unavailable.", "error"); return; }
        setBusy(form, true, "Creating account…");
        try {
            const redirectUrl = /^https?:$/.test(window.location.protocol) ? window.location.href.split("?")[0] : undefined;
            const options = { data: { full_name: fullName } };
            if (redirectUrl) options.emailRedirectTo = redirectUrl;
            const { data, error } = await app.client.auth.signUp({ email, password, options });
            if (error) throw error;
            if (data.session && data.user) {
                showMessage("Account created and signed in. Opening your workspace…", "success");
                window.location.href = getRedirectTarget();
            } else {
                showMessage("Your sign-up request was received. If email confirmation is enabled, check your inbox and verify your address before logging in.", "success");
                document.getElementById("login-email").value = email;
                signupPanel.hidden = true; loginPanel.hidden = false;
            }
        } catch (error) { showMessage(app.friendlyError(error, "AeroLab could not create your account. Check your information and try again."), "error"); }
        finally { setBusy(form, false); }
    });

    window.addEventListener("aerolab:auth", (event) => {
        if (event.detail && event.detail.user) showSignedIn(event.detail.user);
        else { forms.hidden = false; signedInPanel.hidden = true; }
    });
    if (!app || !app.isConfigured) { configHelp.hidden = false; showMessage("The Supabase public configuration is not set yet. You can view public AeroLab pages, but accounts are not connected.", "error"); }
    else app.ready.then(({ user, error }) => { if (user) showSignedIn(user); else if (error) showMessage(app.friendlyError(error), "error"); });
})();




