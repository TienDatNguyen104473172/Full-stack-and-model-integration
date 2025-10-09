# SMS Spam Classification — README

## Overview
This repository contains a **text classification baseline** for the unit’s topic **Spam/Malware Detection** using the **SMS Spam dataset** (`train.csv`, `test.csv`).  
Modeling approach: **TF‑IDF** vectorization → **Logistic Regression** (baseline) and **Random Forest** (baseline-2), with **Precision–Recall analysis** and **threshold tuning** to reduce false negatives (missed spam).

> Instructor confirmation: using the **SMS Spam dataset** for this topic is acceptable.

## Dataset & Splits (Very Important)
- **Files:** `data_final/train.csv`, `data_final/test.csv`.
- **Columns expected:**
  - `text_clean`: the SMS message (string).
  - `label`: 0 = ham/benign, 1 = spam/malware.
- **Validation vs Test**
  - **Validation set**: created **inside the notebook** by splitting `train.csv` (80/20, stratified). Used for **model selection, plotting PR curves, and choosing the probability threshold**.
  - **Test set**: `test.csv` provided separately. **Never used to train/tune**. Used only for **final evaluation** (and to compare default threshold 0.5 vs tuned threshold).

> We do **not** merge SMS with the email dataset because their formats are different (raw text vs. high‑dimensional BoW); classification is appropriate, not regression or clustering.

## Folder Structure
```
TienDatNguyen_Data_Collection_and_Processing/
├─ data_final/
│  ├─ train.csv
│  └─ test.csv
├─ notebooks/
│  └─ 01_sms_baseline.ipynb
├─ models/               # created by Cell 9
│  ├─ sms_logreg_pipeline.joblib
│  ├─ sms_logreg_threshold.json
│  └─ sms_logreg_metadata.json
└─ report/               # created by Cell 10
   ├─ classification_report_*.txt
   ├─ cm_* .png
   ├─ pr_curve_val.png
   └─ metrics_summary.csv
```

## Requirements
- Python 3.10+
- `pandas`, `numpy`, `scikit-learn`, `matplotlib`, `joblib`, `jupyter`

Install (recommended virtual env):
```bash
python -m venv .venv
.\.venv\Scriptsctivate       # Windows
pip install --upgrade pip
pip install pandas numpy scikit-learn matplotlib joblib jupyter
```

## How to Run
1) Open the notebook:
```bash
cd TienDatNguyen_Data_Collection_and_Processing\notebooks
jupyter notebook
```
2) Open **`01_sms_baseline.ipynb`** and run cells **top → bottom** in order:
- **Cell 1 – Imports & Config**  
  Imports libraries, sets `DATA_DIR = ../data_final/`, prints versions.

- **Cell 2 – Load train/test & Inspect**  
  Reads `train.csv`/`test.csv`, prints shapes/columns, previews rows, checks missing values.

- **Cell 3 – Select Columns & Split**  
  Picks `TEXT_COL` and `LABEL_COL`, validates dtypes, and splits **training/validation** (80/20, stratified). Prepares `X_test` and optional `y_test` (if labels exist in `test.csv`).

- **Cell 4 – Build & Train Baselines**  
  Two pipelines:  
  - `TFIDF(1–2 grams, 5000 feats) → LogisticRegression(max_iter=1000)`  
  - `TFIDF(1–2 grams, 5000 feats) → RandomForest(n_estimators=300, random_state=42)`  
  Trains models on **training fold** and prints metrics on **validation**; shows classification reports.

- **Cell 5 – Confusion Matrices**  
  Plots **validation** confusion matrices for both models (and **test** if labels exist).  
  Reading order (standard):  
  - Top‑left = **TN**, Top‑right = **FP**  
  - Bottom‑left = **FN**, Bottom‑right = **TP**

- **Cell 6 – Precision–Recall Curves (Validation)**  
  Plots PR curves and Average Precision (AP) for validation; used to see the trade‑off when changing the decision threshold.

- **Cell 7 – Threshold Tuning (Validation)**  
  Picks a probability threshold to achieve a **target Recall (e.g., ≥ 0.90)**. Prints metrics and plots the confusion matrix at that threshold.  
  This step is **only on validation** (no test peeking).

- **Cell 8 – Apply Tuned Threshold on Test**  
  Compares default threshold `0.5` vs **tuned threshold** chosen in Cell 7 on **test set**. Prints metrics and (if labels exist) shows two confusion matrices side‑by‑side. Saves `CHOSEN_THRESHOLD` for next cell.

- **Cell 9 – Save Artifacts** 
  Saves to `../models/`:  
  - `sms_logreg_pipeline.joblib` — the whole **Pipeline** (TF‑IDF + LogisticRegression).  
  - `sms_logreg_threshold.json` — the chosen threshold.  
  - `sms_logreg_metadata.json` — versions, columns, notes.


## Notes & Assumptions
- The notebook uses **stratified split** (80/20) for validation, ensuring the spam/ham ratio is preserved.  
- **No training or tuning on the test set**; the tuned threshold is selected **only** on validation and then **applied** to test.  
- Classification is the appropriate task; regression/clustering are **not** optimal for this dataset format.  
- Email dataset (if used later) is kept separate because of different representation; repeat the same pipeline there if needed.

## Reproducibility
- All random processes set with `random_state=42`.  
- Model, threshold, and environment metadata are saved in `models/` by **Cell 9**.
