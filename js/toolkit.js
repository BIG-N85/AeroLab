"use strict";

// AeroLab Toolkit: small educational calculators with no external libraries.
const STANDARD_GRAVITY = 9.80665;
const toolPanels = document.querySelectorAll(".tool-panel");

function readNumber(id) {
    const input = document.getElementById(id);
    if (input.value.trim() === "") return null;
    const value = Number(input.value);
    return Number.isFinite(value) ? value : null;
}

function showResult(id, label, lines) {
    const box = document.getElementById(id);
    box.replaceChildren();
    const caption = document.createElement("span");
    caption.className = "result-label";
    caption.textContent = label;
    box.appendChild(caption);
    lines.forEach((line) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = line;
        box.appendChild(paragraph);
    });
    box.hidden = false;
}

function clearResult(resultId, errorId) {
    document.getElementById(resultId).hidden = true;
    document.getElementById(errorId).textContent = "";
}

function setError(id, message) {
    document.getElementById(id).textContent = message;
}

function readable(value) {
    if (Object.is(value, -0)) value = 0;
    return Number(value.toPrecision(6)).toString();
}

// Open one tool panel and bring it into view.
document.querySelectorAll("[data-open-tool]").forEach((button) => {
    button.addEventListener("click", () => {
        const selected = document.getElementById("panel-" + button.dataset.openTool);
        toolPanels.forEach((panel) => { panel.hidden = panel !== selected; });
        selected.scrollIntoView({ behavior: "smooth", block: "start" });
        const firstInput = selected.querySelector("input");
        if (firstInput) firstInput.focus({ preventScroll: true });
        if (button.dataset.openTool === "graph") drawGraph();
    });
});
document.querySelectorAll(".close-tool").forEach((button) => {
    button.addEventListener("click", () => { button.closest(".tool-panel").hidden = true; });
});

// Rocket equation: ideal delta-v = Isp * g0 * ln(initial mass / final mass).
document.getElementById("form-rocket").addEventListener("submit", (event) => {
    event.preventDefault();
    clearResult("result-rocket", "error-rocket");
    const isp = readNumber("isp");
    const initialMass = readNumber("mass-initial");
    const finalMass = readNumber("mass-final");
    if (isp === null || initialMass === null || finalMass === null) {
        setError("error-rocket", "Enter a number in each field."); return;
    }
    if (isp <= 0 || finalMass <= 0 || initialMass <= 0) {
        setError("error-rocket", "Specific impulse and both masses must be greater than zero."); return;
    }
    if (initialMass <= finalMass) {
        setError("error-rocket", "Initial mass must be greater than final mass."); return;
    }
    const deltaV = isp * STANDARD_GRAVITY * Math.log(initialMass / finalMass);
    if (!Number.isFinite(deltaV)) { setError("error-rocket", "These values are too large to calculate safely. Try smaller values."); return; }
    showResult("result-rocket", "Calculated ideal delta-v", [readable(deltaV) + " m/s"]);
});

// Basic velocity change: a negative result means the final velocity is lower.
document.getElementById("form-delta").addEventListener("submit", (event) => {
    event.preventDefault();
    clearResult("result-delta", "error-delta");
    const initial = readNumber("velocity-initial");
    const final = readNumber("velocity-final");
    if (initial === null || final === null) { setError("error-delta", "Enter a valid number in both velocity fields."); return; }
    const deltaV = final - initial;
    if (!Number.isFinite(deltaV)) { setError("error-delta", "The velocity change is outside the calculator range."); return; }
    showResult("result-delta", "Velocity change (Δv)", [readable(deltaV) + " m/s"]);
});
document.getElementById("form-delta").addEventListener("reset", () => {
    window.setTimeout(() => clearResult("result-delta", "error-delta"), 0);
});

// Projectile is launched and lands at ground level; solve the vertical motion quadratic.
document.getElementById("form-projectile").addEventListener("submit", (event) => {
    event.preventDefault();
    clearResult("result-projectile", "error-projectile");
    const speed = readNumber("launch-speed");
    const angle = readNumber("launch-angle");
    const height = readNumber("launch-height");
    if (speed === null || angle === null || height === null) { setError("error-projectile", "Enter a valid number in each field."); return; }
    if (speed < 0 || height < 0 || angle < 0 || angle > 90) { setError("error-projectile", "Speed and height must be nonnegative; angle must be from 0 to 90 degrees."); return; }
    const radians = angle * Math.PI / 180;
    const vx = speed * Math.cos(radians);
    const vy = speed * Math.sin(radians);
    const time = (vy + Math.sqrt(vy * vy + 2 * STANDARD_GRAVITY * height)) / STANDARD_GRAVITY;
    const range = vx * time;
    const maxHeight = height + (vy * vy) / (2 * STANDARD_GRAVITY);
    if (![vx, vy, time, range, maxHeight].every(Number.isFinite)) { setError("error-projectile", "These values are too large to calculate safely. Try smaller values."); return; }
    showResult("result-projectile", "Idealized trajectory", [
        "Horizontal velocity: " + readable(vx) + " m/s",
        "Vertical velocity: " + readable(vy) + " m/s",
        "Time of flight: " + readable(time) + " s",
        "Horizontal range: " + readable(range) + " m",
        "Maximum height: " + readable(maxHeight) + " m"
    ]);
});

// Resolve each vector into components, then sum them.
document.getElementById("form-vectors").addEventListener("submit", (event) => {
    event.preventDefault();
    clearResult("result-vectors", "error-vectors");
    const a = readNumber("a-mag"), aAngle = readNumber("a-angle");
    const b = readNumber("b-mag"), bAngle = readNumber("b-angle");
    if ([a, aAngle, b, bAngle].some((value) => value === null)) { setError("error-vectors", "Enter a valid number in each field."); return; }
    if (a < 0 || b < 0) { setError("error-vectors", "Vector magnitudes cannot be negative."); return; }
    const ax = a * Math.cos(aAngle * Math.PI / 180), ay = a * Math.sin(aAngle * Math.PI / 180);
    const bx = b * Math.cos(bAngle * Math.PI / 180), by = b * Math.sin(bAngle * Math.PI / 180);
    const rx = ax + bx, ry = ay + by;
    const magnitude = Math.hypot(rx, ry);
    const direction = magnitude === 0 ? null : (Math.atan2(ry, rx) * 180 / Math.PI + 360) % 360;
    if (![ax, ay, bx, by, rx, ry, magnitude].every(Number.isFinite) || (direction !== null && !Number.isFinite(direction))) { setError("error-vectors", "These values are too large to calculate safely. Try smaller values."); return; }
    showResult("result-vectors", "Vector components and resultant", [
        "Ax: " + readable(ax) + " N   |   Ay: " + readable(ay) + " N",
        "Bx: " + readable(bx) + " N   |   By: " + readable(by) + " N",
        "Resultant X: " + readable(rx) + " N   |   Resultant Y: " + readable(ry) + " N",
        "Resultant magnitude: " + readable(magnitude) + " N",
        "Resultant angle: " + (direction === null ? "undefined (zero resultant)" : readable(direction) + "° from +X")
    ]);
});

// Simplified lift equation; a negative lift coefficient gives a negative signed result.
document.getElementById("form-aero").addEventListener("submit", (event) => {
    event.preventDefault();
    clearResult("result-aero", "error-aero");
    const density = readNumber("air-density"), speed = readNumber("air-speed");
    const area = readNumber("wing-area"), coefficient = readNumber("lift-coefficient");
    if ([density, speed, area, coefficient].some((value) => value === null)) { setError("error-aero", "Enter a valid number in each field."); return; }
    if (density <= 0 || speed < 0 || area <= 0) { setError("error-aero", "Air density and reference area must be positive; velocity cannot be negative."); return; }
    const lift = 0.5 * density * speed * speed * area * coefficient;
    if (!Number.isFinite(lift)) { setError("error-aero", "These values are too large to calculate safely. Try smaller values."); return; }
    showResult("result-aero", "Simplified lift estimate", [readable(lift) + " N"]);
});

// Experimental data table and canvas graph.
let graphStorageKey = "aerolab-toolkit-graph:v1:guest";
let dataPoints = [];
const canvas = document.getElementById("data-canvas");
const pointRows = document.getElementById("point-rows");
const emptyPoints = document.getElementById("empty-points");
const canvasContext = canvas.getContext("2d");

function saveGraphData() {
    try {
        window.localStorage.setItem(graphStorageKey, JSON.stringify({
            xLabel: document.getElementById("x-label").value,
            yLabel: document.getElementById("y-label").value,
            points: dataPoints
        }));
        document.getElementById("graph-save-status").textContent = "Graph data is saved in this browser.";
    } catch (error) {
        document.getElementById("graph-save-status").textContent = "Browser storage is unavailable; graph data will last until you leave this page.";
    }
}

function loadGraphData() {
    dataPoints = [];
    document.getElementById("x-label").value = "X";
    document.getElementById("y-label").value = "Y";
    try {
        const saved = JSON.parse(window.localStorage.getItem(graphStorageKey) || "null");
        if (!saved || typeof saved !== "object") return;
        if (typeof saved.xLabel === "string") document.getElementById("x-label").value = saved.xLabel.slice(0, 40);
        if (typeof saved.yLabel === "string") document.getElementById("y-label").value = saved.yLabel.slice(0, 40);
        if (Array.isArray(saved.points)) {
            dataPoints = saved.points.filter((point) => point && Number.isFinite(point.x) && Number.isFinite(point.y) && Math.abs(point.x) <= 1e100 && Math.abs(point.y) <= 1e100).slice(0, 1000);
        }
    } catch (error) {
        document.getElementById("graph-save-status").textContent = "Saved graph data could not be read; you can still start a new graph.";
    }
}

function activateGraphStorage(user) {
    graphStorageKey = "aerolab-toolkit-graph:v1:" + (user && user.id ? user.id : "guest");
    loadGraphData();
    renderData();
}

function drawGraph() {
    if (!canvasContext) return;
    const width = Math.max(300, canvas.clientWidth);
    const height = Math.max(220, canvas.clientHeight);
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvasContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    canvasContext.clearRect(0, 0, width, height);
    const left = 58, right = width - 18, top = 20, bottom = height - 48;
    const plotWidth = right - left, plotHeight = bottom - top;
    canvasContext.strokeStyle = "#526a82";
    canvasContext.lineWidth = 1;
    canvasContext.beginPath();
    canvasContext.moveTo(left, top); canvasContext.lineTo(left, bottom); canvasContext.lineTo(right, bottom);
    canvasContext.stroke();
    canvasContext.fillStyle = "#8497ad";
    canvasContext.font = "12px Arial";
    canvasContext.textAlign = "center";
    canvasContext.fillText(document.getElementById("x-label").value.trim() || "X", left + plotWidth / 2, height - 8);
    canvasContext.save();
    canvasContext.translate(15, top + plotHeight / 2);
    canvasContext.rotate(-Math.PI / 2);
    canvasContext.fillText(document.getElementById("y-label").value.trim() || "Y", 0, 0);
    canvasContext.restore();
    if (dataPoints.length === 0) {
        canvasContext.fillStyle = "#8497ad";
        canvasContext.fillText("Add data points to draw a graph", left + plotWidth / 2, top + plotHeight / 2);
        return;
    }
    let minX = dataPoints[0].x, maxX = dataPoints[0].x;
    let minY = dataPoints[0].y, maxY = dataPoints[0].y;
    dataPoints.forEach((point) => {
        minX = Math.min(minX, point.x); maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y); maxY = Math.max(maxY, point.y);
    });
    if (minX === maxX) { const pad = minX === 0 ? 1 : Math.max(Math.abs(minX) * 0.08, Number.MIN_VALUE); minX -= pad; maxX += pad; }
    if (minY === maxY) { const pad = minY === 0 ? 1 : Math.max(Math.abs(minY) * 0.08, Number.MIN_VALUE); minY -= pad; maxY += pad; }
    const padX = (maxX - minX) * 0.08;
    const padY = (maxY - minY) * 0.08;
    minX -= padX; maxX += padX; minY -= padY; maxY += padY;
    const pointToCanvas = (point) => ({
        x: left + ((point.x - minX) / (maxX - minX)) * plotWidth,
        y: bottom - ((point.y - minY) / (maxY - minY)) * plotHeight
    });
    canvasContext.strokeStyle = "#4da3ff";
    canvasContext.lineWidth = 2;
    canvasContext.beginPath();
    dataPoints.forEach((point, index) => {
        const position = pointToCanvas(point);
        if (index === 0) canvasContext.moveTo(position.x, position.y);
        else canvasContext.lineTo(position.x, position.y);
    });
    canvasContext.stroke();
    dataPoints.forEach((point) => {
        const position = pointToCanvas(point);
        canvasContext.beginPath();
        canvasContext.arc(position.x, position.y, 4, 0, Math.PI * 2);
        canvasContext.fillStyle = "#8fc6ff";
        canvasContext.fill();
    });
    canvasContext.fillStyle = "#8497ad";
    canvasContext.font = "11px Arial";
    canvasContext.textAlign = "left";
    canvasContext.fillText(readable(minX), left, bottom + 17);
    canvasContext.textAlign = "right";
    canvasContext.fillText(readable(maxX), right, bottom + 17);
    canvasContext.textAlign = "right";
    canvasContext.fillText(readable(minY), left - 7, bottom);
    canvasContext.fillText(readable(maxY), left - 7, top + 4);
}

function renderData() {
    pointRows.replaceChildren();
    dataPoints.forEach((point, index) => {
        const row = document.createElement("tr");
        const numberCell = document.createElement("td"); numberCell.textContent = String(index + 1);
        const xCell = document.createElement("td"); xCell.textContent = readable(point.x);
        const yCell = document.createElement("td"); yCell.textContent = readable(point.y);
        const actionCell = document.createElement("td");
        const removeButton = document.createElement("button");
        removeButton.type = "button"; removeButton.className = "remove-point-button"; removeButton.textContent = "Remove";
        removeButton.setAttribute("aria-label", "Remove data point " + (index + 1));
        removeButton.addEventListener("click", () => { dataPoints.splice(index, 1); renderData(); });
        actionCell.appendChild(removeButton);
        row.append(numberCell, xCell, yCell, actionCell);
        pointRows.appendChild(row);
    });
    emptyPoints.hidden = dataPoints.length > 0;
    drawGraph();
    saveGraphData();
}

document.getElementById("form-point").addEventListener("submit", (event) => {
    event.preventDefault();
    const x = readNumber("point-x"), y = readNumber("point-y");
    const message = document.getElementById("error-point");
    if (x === null || y === null) { message.textContent = "Enter a valid number for both X and Y."; return; }
    if (Math.abs(x) > 1e100 || Math.abs(y) > 1e100) { message.textContent = "Use X and Y values between −1 × 10¹⁰⁰ and 1 × 10¹⁰⁰ so the graph scale stays usable."; return; }
    message.textContent = "";
    dataPoints.push({ x, y });
    event.currentTarget.reset();
    renderData();
    document.getElementById("point-x").focus();
});
document.getElementById("clear-points").addEventListener("click", () => {
    dataPoints = [];
    document.getElementById("error-point").textContent = "";
    renderData();
});
document.getElementById("x-label").addEventListener("input", () => { drawGraph(); saveGraphData(); });
document.getElementById("y-label").addEventListener("input", () => { drawGraph(); saveGraphData(); });
window.addEventListener("resize", drawGraph);
if (window.AeroLab && window.AeroLab.ready) {
    window.AeroLab.ready.then(({ user }) => activateGraphStorage(user)).catch(() => activateGraphStorage(null));
    window.addEventListener("aerolab:auth", (event) => activateGraphStorage(event.detail && event.detail.user));
} else {
    activateGraphStorage(null);
}
