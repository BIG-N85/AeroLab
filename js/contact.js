"use strict";

const contactForm = document.getElementById("contact-form");
const contactStatus = document.getElementById("contact-status");

contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    contactStatus.textContent = "";
    if (!contactForm.reportValidity()) return;

    const endpointText = contactForm.dataset.formspreeEndpoint.trim();
    if (!endpointText) {
        contactStatus.textContent = "This form is not connected yet. Your message was not sent.";
        return;
    }

    let endpoint;
    try { endpoint = new URL(endpointText); }
    catch (error) { contactStatus.textContent = "The configured Formspree endpoint is invalid. Your message was not sent."; return; }
    if (endpoint.protocol !== "https:" || endpoint.hostname !== "formspree.io" || !/^\/f\/[A-Za-z0-9]+$/.test(endpoint.pathname)) {
        contactStatus.textContent = "Use the HTTPS form endpoint provided by Formspree. Your message was not sent.";
        return;
    }

    const submitButton = contactForm.querySelector("button[type=submit]");
    submitButton.disabled = true;
    submitButton.textContent = "Sending…";
    contactStatus.textContent = "Sending your message…";
    try {
        const response = await fetch(endpoint.href, { method: "POST", body: new FormData(contactForm), headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("Formspree returned HTTP " + response.status);
        contactStatus.textContent = "Your message was sent. Thank you.";
        contactForm.reset();
    } catch (error) {
        contactStatus.textContent = "AeroLab could not send your message. Please try again later.";
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Send message";
    }
});
