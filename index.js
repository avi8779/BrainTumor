const form = document.querySelector("#prediction-form");
const imageInput = document.querySelector("#image");
const fileName = document.querySelector("#file-name");
const result = document.querySelector("#result");
const preview = document.querySelector("#preview");
const previewPlaceholder = document.querySelector("#preview-placeholder");
const previewBox = document.querySelector("#preview-box");
const submitButton = form.querySelector("button");
const progress = document.querySelector("#progress");
const progressLabel = document.querySelector("#progress-label");
const progressFill = document.querySelector("#progress-fill");
const minimumScanTime = 3200;

const apiUrl = location.protocol === "file:"
  ? "http://127.0.0.1:5000/predict"
  : "/predict";

function setResult(message, type = "") {
  result.textContent = message;
  result.className = `result ${type}`;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function setProgress(label, percent) {
  progressLabel.textContent = label;
  progressFill.style.width = `${percent}%`;
}

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  fileName.textContent = file
    ? `${file.name} (${Math.round(file.size / 1024)} KB)`
    : "No file selected";
  setResult("");
  previewBox.classList.remove("is-scanning");
  progress.classList.remove("is-visible");
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result;
    preview.hidden = false;
    previewPlaceholder.hidden = true;
  };
  reader.readAsDataURL(file);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = imageInput.files[0];
  if (!file) {
    setResult("Please choose an MRI image first.", "error");
    return;
  }

  submitButton.disabled = true;
  previewBox.classList.add("is-scanning");
  progress.classList.add("is-visible");
  setProgress("Preparing MRI scan...", 12);
  setResult("Analysing MRI image...", "loading");

  try {
    const data = new FormData();
    data.append("image", file);
    const request = fetch(apiUrl, { method: "POST", body: data });
    await wait(650);
    setProgress("Mapping image features...", 48);
    await wait(900);
    setProgress("Checking tissue patterns...", 76);
    const response = await request;
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Prediction failed.");
    await wait(Math.max(0, minimumScanTime - 1550));
    setProgress("Finalising result...", 100);
    await wait(380);
    setResult(`Prediction: ${payload.prediction}`, "success");
  } catch (error) {
    setResult(`${error.message} Start the app with: python app.py`, "error");
  } finally {
    previewBox.classList.remove("is-scanning");
    progress.classList.remove("is-visible");
    submitButton.disabled = false;
  }
});
