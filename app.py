"""Flask API for the trained brain-tumour image classifier."""

from pathlib import Path

import cv2
import joblib
import numpy as np
from flask import Flask, jsonify, request, send_from_directory
from skimage.feature import graycomatrix, graycoprops, hog, local_binary_pattern


BASE_DIR = Path(__file__).resolve().parent
MODEL = joblib.load(BASE_DIR / "brain_tumor_model.pkl")
SCALER = joblib.load(BASE_DIR / "scaler.pkl")
LABEL_ENCODER = joblib.load(BASE_DIR / "label_encoder.pkl")
IMG_SIZE = 128

app = Flask(__name__, static_folder=str(BASE_DIR))


@app.after_request
def allow_local_frontend(response):
    """Allow index.html to call the local API when opened directly."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response


def extract_features(image_bytes: bytes) -> np.ndarray:
    """Reproduce the image-feature pipeline used in Model.ipynb."""
    data = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("The uploaded file is not a readable image.")

    image = cv2.resize(image, (IMG_SIZE, IMG_SIZE))
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    hog_features = hog(
        gray,
        orientations=9,
        pixels_per_cell=(8, 8),
        cells_per_block=(2, 2),
        block_norm="L2-Hys",
        feature_vector=True,
    )

    radius = 2
    points = 8 * radius
    lbp = local_binary_pattern(gray, points, radius, method="uniform")
    lbp_features, _ = np.histogram(
        lbp.ravel(), bins=np.arange(0, points + 3), range=(0, points + 2)
    )
    lbp_features = lbp_features.astype(float)
    lbp_features /= lbp_features.sum() + 1e-7

    glcm = graycomatrix(
        gray, distances=[1], angles=[0], levels=256, symmetric=True, normed=True
    )
    # These property selections intentionally match the saved notebook model.
    glcm_features = np.array(
        [
            graycoprops(glcm, "contrast")[0, 0],
            graycoprops(glcm, "dissimilarity")[0, 0],
            graycoprops(glcm, "dissimilarity")[0, 0],
            graycoprops(glcm, "homogeneity")[0, 0],
            graycoprops(glcm, "energy")[0, 0],
            graycoprops(glcm, "correlation")[0, 0],
        ]
    )
    return np.concatenate((hog_features, lbp_features, glcm_features)).reshape(1, -1)


@app.get("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/index.js")
def frontend_script():
    return send_from_directory(BASE_DIR, "index.js")


@app.post("/predict")
def predict():
    image = request.files.get("image")
    if image is None or not image.filename:
        return jsonify(error="Upload an MRI image using the 'image' field."), 400

    try:
        features = extract_features(image.read())
        if features.shape[1] != MODEL.n_features_in_:
            raise ValueError("Image features do not match the trained model.")
        prediction = MODEL.predict(SCALER.transform(features))[0]
        label = LABEL_ENCODER.inverse_transform([prediction])[0]
        return jsonify(prediction=str(label).replace("notumor", "no tumor"))
    except ValueError as error:
        return jsonify(error=str(error)), 400
    except Exception:
        app.logger.exception("Prediction failed")
        return jsonify(error="Unable to process this image."), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
