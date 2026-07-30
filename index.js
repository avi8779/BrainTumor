const form = document.querySelector("#prediction-form");
const imageInput = document.querySelector("#image");
const fileName = document.querySelector("#file-name");
const result = document.querySelector("#result");
const preview = document.querySelector("#preview");
const previewPlaceholder = document.querySelector("#preview-placeholder");
const submitButton = form.querySelector("button");

const apiUrl = location.protocol === "file:"
  ? "http://127.0.0.1:5000/predict"
  : "/predict";

function setResult(message, type = "") {
  result.textContent = message;
  result.className = `result ${type}`;
}

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  fileName.textContent = file
    ? `${file.name} (${Math.round(file.size / 1024)} KB)`
    : "No file selected";
  setResult("");
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
  setResult("Analysing MRI image...", "loading");

  try {
    const data = new FormData();
    data.append("image", file);
    const response = await fetch(apiUrl, { method: "POST", body: data });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Prediction failed.");
    setResult(`Prediction: ${payload.prediction}`, "success");
  } catch (error) {
    setResult(`${error.message} Start the app with: python app.py`, "error");
  } finally {
    submitButton.disabled = false;
  }
});
