# Come Deployare l'App Online (GRATIS)

## Opzione 1: Render (Consigliato - Più Semplice)

### Step 1: Crea un account su Render
1. Vai su https://render.com
2. Registrati gratuitamente (puoi usare GitHub)

### Step 2: Carica il codice su GitHub
1. Crea un repository su GitHub
2. Carica questi file:
   - `cost_accounting_app.py`
   - `templates/index.html`
   - `requirements.txt`
   - `Procfile`
   - `runtime.txt`

### Step 3: Deploy su Render
1. Nel dashboard di Render, clicca "New +" → "Web Service"
2. Connetti il tuo repository GitHub
3. Configura:
   - **Name**: cost-accounting (o quello che vuoi)
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn cost_accounting_app:app`
   - **Plan**: Free
4. Clicca "Create Web Service"

Render farà il deploy automaticamente! Ti darà un URL tipo:
`https://cost-accounting-xxxx.onrender.com`

⚠️ **Nota**: Il piano gratuito di Render mette l'app in "sleep" dopo 15 minuti di inattività. Il primo caricamento dopo il sleep può richiedere 30-60 secondi.

---

## Opzione 2: Railway

### Step 1: Crea un account su Railway
1. Vai su https://railway.app
2. Registrati con GitHub

### Step 2: Deploy
1. Clicca "New Project" → "Deploy from GitHub repo"
2. Seleziona il tuo repository
3. Railway rileverà automaticamente che è un'app Flask
4. Il deploy partirà automaticamente

Ti darà un URL tipo: `https://cost-accounting.up.railway.app`

---

## Opzione 3: Heroku (Richiede carta di credito anche per piano free)

### Step 1: Installa Heroku CLI
```bash
brew install heroku/brew/heroku  # Mac
```

### Step 2: Login e Deploy
```bash
heroku login
heroku create cost-accounting-app
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

---

## Opzione 4: PythonAnywhere (Più Complesso ma Sempre Gratis)

1. Vai su https://www.pythonanywhere.com
2. Crea un account gratuito
3. Vai su "Web" → "Add a new web app"
4. Scegli Flask
5. Carica i file manualmente
6. Configura il WSGI file

---

## File Necessari per il Deploy

✅ `cost_accounting_app.py` - Backend Flask
✅ `templates/index.html` - Frontend
✅ `requirements.txt` - Dipendenze Python
✅ `Procfile` - Comando per avviare l'app
✅ `runtime.txt` - Versione Python

## Consiglio

**Usa Render** - È il più semplice e veloce. Basta connettere GitHub e fa tutto automaticamente.

Una volta deployato, condividi il link con chiunque e potranno usare l'app da qualsiasi dispositivo!
