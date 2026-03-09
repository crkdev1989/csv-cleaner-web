const form = document.getElementById("clean-form");
const fileInput = document.getElementById("file");
const presetSelect = document.getElementById("preset");

const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const summaryEl = document.getElementById("summary");

const downloadCleanedEl = document.getElementById("download-cleaned");
const downloadReportEl = document.getElementById("download-report");
const downloadSummaryEl = document.getElementById("download-summary");

const filesCleanedEl = document.getElementById("files-cleaned-count");
const rowsProcessedEl = document.getElementById("rows-processed-count");

const API_BASE_URL = "https://api.crkdev.com";

function setStatus(message) {
  statusEl.textContent = `Status: ${message}`;
}

function resetResults() {
  resultsEl.style.display = "none";
  summaryEl.innerHTML = "";

  downloadCleanedEl.href = "#";
  downloadReportEl.href = "#";
  downloadSummaryEl.href = "#";
}

/* -----------------------------
   Load stats from backend
----------------------------- */

async function loadStats() {
  try {
    const res = await fetch(`${API_BASE_URL}/stats`);
    if (!res.ok) throw new Error("Failed to load stats");

    const stats = await res.json();

    filesCleanedEl.textContent =
      Number(stats.files_cleaned || 0).toLocaleString();

    rowsProcessedEl.textContent =
      Number(stats.rows_processed || 0).toLocaleString();
  } catch (err) {
    filesCleanedEl.textContent = "0";
    rowsProcessedEl.textContent = "0";
  }
}

/* Load stats when page loads */
loadStats();

/* -----------------------------
   Clean form submit
----------------------------- */

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  resetResults();

  const file = fileInput.files[0];
  const preset = presetSelect.value;

  if (!file) {
    setStatus("Please choose a file.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("preset", preset);

  try {
    setStatus("Uploading and cleaning...");

    const response = await fetch(`${API_BASE_URL}/clean`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      let message = `Request failed (${response.status})`;

      try {
        const error = await response.json();
        if (error.detail) message = error.detail;
      } catch (_) {}

      throw new Error(message);
    }

    const data = await response.json();

    const cleanedPath = encodeURIComponent(data.output_path);
    const reportPath = encodeURIComponent(data.report_path);
    const summaryPath = encodeURIComponent(data.summary_path);

    downloadCleanedEl.href =
      `${API_BASE_URL}/download/cleaned?path=${cleanedPath}`;

    downloadReportEl.href =
      `${API_BASE_URL}/download/report?path=${reportPath}`;

    downloadSummaryEl.href =
      `${API_BASE_URL}/download/summary?path=${summaryPath}`;

    summaryEl.innerHTML = `
      <p><strong>Job ID:</strong> ${data.job_id}</p>
      <p><strong>Rows Loaded:</strong> ${data.rows_loaded}</p>
      <p><strong>Rows Output:</strong> ${data.rows_output}</p>
      <p><strong>Modules:</strong> ${(data.modules || []).join(", ")}</p>
    `;

    resultsEl.style.display = "block";
    setStatus("Cleaning complete.");

    /* Refresh counters after successful clean */
    loadStats();

  } catch (err) {
    setStatus(`Error: ${err.message}`);
  }
});
