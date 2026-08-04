# Brain Tumour Classifier

A Flask web application that classifies uploaded brain MRI images using a trained machine-learning model. The interface includes an MRI preview, animated scan sequence, progress updates, and a prediction result.

> This project is for educational and research use only. It is not a medical device and must not be used as a substitute for clinical diagnosis.

## Features

- Upload MRI images in common image formats
- Preview the selected image before analysis
- Animated analysis flow with progress feedback
- Brain tumour classification result returned by a Flask API
- Large model artifacts stored with Git LFS

## Project structure

```text
.
|-- app.py                  # Flask application and prediction endpoint
|-- index.html              # Web interface
|-- index.js                # Upload, scan animation, and API request logic
|-- brain_tumor_model.pkl   # Trained classifier (Git LFS)
|-- scaler.pkl              # Feature scaler (Git LFS)
|-- label_encoder.pkl       # Class-label encoder (Git LFS)
|-- BrainTumorDataset/      # Dataset files
`-- Model.ipynb             # Model-training notebook
```

## Requirements

- Python 3.10 or later
- Git LFS

Install the Python packages:

```bash
pip install flask opencv-python joblib numpy scikit-image scikit-learn
```

## Setup

The model files use Git LFS. Clone the repository and download the LFS files:

```bash
git clone https://github.com/avi8779/BrainTumor.git
cd BrainTumor
git lfs install
git lfs pull
```

## Run locally

Start the Flask application:

```bash
python app.py
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your browser. Click the scan preview panel to select an MRI image, then choose **Analyse image**.

## API

### `POST /predict`

Send an image using the `image` form-data field.

Example response:

```json
{
  "prediction": "no tumor"
}
```

## Model pipeline

The backend resizes each image to 128 x 128 pixels, extracts HOG, Local Binary Pattern, and GLCM features, scales them, and passes them to the saved classifier.
