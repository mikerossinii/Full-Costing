# Cost Accounting Tools

Web application for solving cost accounting exercises with multiple methods and analysis tools.

## Features

- **Reciprocal Method**: Solve simultaneous equations for support department cost allocation
- **WIP Valuation**: Calculate Work in Process valuation using FIFO, LIFO, or Average Cost methods
- **Break-Even Analysis**: Analyze contribution margin and break-even points
- **Variance Analysis**: Calculate and analyze budget variances (Sales, Direct Materials, Direct Labor)
- **ABC Costing**: Activity-Based Costing analysis with department and customer management
- **Multi-language Support**: Available in Italian, English, Spanish, French, and Catalan
- **Export Functionality**: Export results to PDF and Excel

## Installation

### 1. Install Python
Make sure you have Python 3.11+ installed on your computer.

### 2. Create a virtual environment
```bash
python3 -m venv venv
```

### 3. Activate the virtual environment

**On Mac/Linux:**
```bash
source venv/bin/activate
```

**On Windows:**
```bash
venv\Scripts\activate
```

### 4. Install dependencies
```bash
pip install -r requirements.txt
```

## Running the Application Locally

1. Activate the virtual environment (see above)
2. Run:
```bash
python cost_accounting_app.py
```

3. Open your browser and go to: `http://localhost:5000`

## Deployment on Render

See [DEPLOY.md](DEPLOY.md) for detailed deployment instructions.

## Project Structure

```
.
├── cost_accounting_app.py    # Flask backend
├── templates/
│   └── index.html            # Main HTML template
├── static/
│   ├── app.js                # Main JavaScript logic
│   ├── translations.js       # Multi-language translations
│   ├── export.js             # PDF/Excel export functionality
│   └── LogoRummo.jpg         # Logo image
├── requirements.txt          # Python dependencies
├── runtime.txt               # Python version for deployment
├── Procfile                  # Render deployment configuration
└── README.md                 # This file
```

## Technologies Used

- **Backend**: Flask, NumPy
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Charts**: Chart.js
- **Export**: jsPDF, html2canvas, SheetJS
- **Deployment**: Gunicorn, Render

## License

Educational project for Cost Accounting I course at Pompeu Fabra University (AY 2025-2026)
