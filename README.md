# Cost Accounting - Reciprocal Method

App web per risolvere esercizi di cost accounting con il metodo reciproco (simultaneous equations).

## Installazione

### 1. Installa Python
Assicurati di avere Python 3.7+ installato sul tuo computer.

### 2. Crea un ambiente virtuale
```bash
python3 -m venv venv
```

### 3. Attiva l'ambiente virtuale

**Su Mac/Linux:**
```bash
source venv/bin/activate
```

**Su Windows:**
```bash
venv\Scripts\activate
```

### 4. Installa le dipendenze
```bash
pip install flask numpy
```

## Avvio dell'applicazione

1. Attiva l'ambiente virtuale (vedi sopra)
2. Esegui:
```bash
python cost_accounting_app.py
```

3. Apri il browser e vai su: `http://localhost:5000`

## Come usare l'app

1. **Step 1:** Definisci i dipartimenti di supporto e produzione
2. **Step 2:** Inserisci i costi primari di allocazione
3. **Step 3:** Inserisci le unità di servizio rese tra dipartimenti
4. **Step 4:** (Opzionale) Inserisci le basi di allocazione per calcolare i cost rates
5. Clicca su "Calcola Risultati"

L'app risolverà automaticamente le equazioni simultanee e ti mostrerà:
- Costi totali per ogni dipartimento
- Cost rates per unità
- Dettaglio completo delle allocazioni

## Struttura dei file

```
.
├── cost_accounting_app.py    # Backend Flask
├── templates/
│   └── index.html            # Frontend
└── README.md                 # Questo file
```

## Troubleshooting

Se hai problemi con l'installazione di numpy su Mac, prova:
```bash
pip install --upgrade pip
pip install numpy
```
