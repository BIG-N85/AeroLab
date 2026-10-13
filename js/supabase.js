(function () {
    const config = window.AEROLAB_CONFIG || {};
    const isPlaceholder = (value) => !value || /^YOUR_/i.test(value.trim());
    const isConfigured = Boolean(window.supabase && window.supabase.createClient && !isPlaceholder(config.url) && !isPlaceholder(config.anonKey));
    const client = isConfigured ? window.supabase.createClient(config.url, config.anonKey, { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } }) : null;

    function configurationError() {
        return new Error("AeroLab is not connected yet. Add the public Supabase URL and anon/publishable key in js/config.js.");
    }

    function friendlyError(error, fallback) {
        const message = String(error && error.message ? error.message : "").toLowerCase();
        const code = String(error && error.code ? error.code : "");
        if (!navigator.onLine || /fetch|network|failed to connect|load failed/.test(message)) return "A network connection is unavailable. Check your connection and try again.";
        if (/invalid login credentials|invalid email or password/.test(message)) return "The email or password is incorrect.";
        if (/already registered|user already exists|duplicate key/.test(message) || code === "23505") return "That email or entry may already exist. Check your information and try again.";
        if (/email not confirmed/.test(message)) return "Please confirm your email address before logging in.";
        if (/row-level security|permission denied|not allowed/.test(message) || code === "42501") return "AeroLab could not access that saved item. Check your sign-in and database setup.";
        return fallback || "AeroLab could not complete that request. Please try again.";
    }

    async function getUser() {
        if (!client) return null;
        const { data, error } = await client.auth.getUser();
        if (error) throw error;
        return data.user || null;
    }

    async function requireUser() {
        if (!client) throw configurationError();
        const user = await getUser();
        if (!user) {
            const error = new Error("Please log in to save personal AeroLab data.");
            error.code = "AEROLAB_LOGIN_REQUIRED";
            throw error;
        }
        return user;
    }

    function loginHref(returnPage) {
        const allowed = new Set(["projects.html", "learning.html", "college-career.html", "portfolio.html"]);
        const target = allowed.has(returnPage) ? returnPage : "projects.html";
        const inPages = window.location.pathname.split("/").includes("pages");
        return (inPages ? "login.html" : "pages/login.html") + "?redirect=" + encodeURIComponent(target);
    }

    function showLoginPrompt(container, returnPage, text) {
        if (!container) return;
        container.replaceChildren();
        const paragraph = document.createElement("p");
        paragraph.textContent = text || "Log in to save your personal AeroLab data.";
        const link = document.createElement("a");
        link.href = loginHref(returnPage);
        link.textContent = "Log in";
        link.className = "button button-primary";
        container.append(paragraph, link);
        container.hidden = false;
    }

    function notifyAuth(user, eventName) {
        window.dispatchEvent(new CustomEvent("aerolab:auth", { detail: { user: user || null, event: eventName || "STATE" } }));
    }

    const ready = client ? client.auth.getUser().then(({ data, error }) => {
        if (error) return { user: null, error };
        return { user: data.user || null, error: null };
    }).catch((error) => ({ user: null, error })) : Promise.resolve({ user: null, error: configurationError() });

    if (client) {
        client.auth.onAuthStateChange((event, session) => {
            window.setTimeout(() => notifyAuth(session && session.user, event), 0);
        });
        ready.then((result) => notifyAuth(result.user, result.error ? "ERROR" : "INITIAL"));
    }

    window.AeroLab = { client, isConfigured, ready, getUser, requireUser, loginHref, showLoginPrompt, notifyAuth, friendlyError, configurationError };
})();
