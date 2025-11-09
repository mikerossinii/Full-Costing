"""
Cost Accounting - Full Costing Analysis con Reciprocal Method
Analisi per Rummo
"""

import numpy as np
import pandas as pd

# ============================================================================
# DATI BASE - Costi diretti dei dipartimenti (in €M)
# ============================================================================

support_depts = {
    'HR': 4.0,
    'Administration': 5.0,
    'Accounting': 3.0,
    'IT': 3.0,
    'Marketing': 10.0
}

production_depts = {
    'Milling': 35.0,
    'Mixing & Extrusion': 45.0,
    'Drying': 30.0,
    'Packaging': 25.0
}

# ============================================================================
# MATRICE DI ALLOCAZIONE - MODIFICA QUESTI VALORI (%)
# ============================================================================
# Ogni riga rappresenta quanto % del servizio viene allocato agli altri dipartimenti
# Le righe devono sommare a 100%

allocation_matrix = {
    # Da HR a:
    'HR': {
        'HR': 0,
        'Administration': 20,
        'Accounting': 15,
        'IT': 10,
        'Marketing': 15,
        'Milling': 10,
        'Mixing & Extrusion': 10,
        'Drying': 10,
        'Packaging': 10
    },
    
    # Da Administration a:
    'Administration': {
        'HR': 10,
        'Administration': 0,
        'Accounting': 20,
        'IT': 15,
        'Marketing': 15,
        'Milling': 10,
        'Mixing & Extrusion': 10,
        'Drying': 10,
        'Packaging': 10
    },
    
    # Da Accounting a:
    'Accounting': {
        'HR': 15,
        'Administration': 20,
        'Accounting': 0,
        'IT': 10,
        'Marketing': 15,
        'Milling': 10,
        'Mixing & Extrusion': 10,
        'Drying': 10,
        'Packaging': 10
    },
    
    # Da IT a:
    'IT': {
        'HR': 10,
        'Administration': 15,
        'Accounting': 15,
        'IT': 0,
        'Marketing': 20,
        'Milling': 10,
        'Mixing & Extrusion': 10,
        'Drying': 10,
        'Packaging': 10
    },
    
    # Da Marketing a:
    'Marketing': {
        'HR': 5,
        'Administration': 10,
        'Accounting': 10,
        'IT': 5,
        'Marketing': 0,
        'Milling': 20,
        'Mixing & Extrusion': 20,
        'Drying': 15,
        'Packaging': 15
    }
}

# ============================================================================
# RISOLUZIONE SISTEMA CON RECIPROCAL METHOD
# ============================================================================

def solve_reciprocal_method():
    """
    Risolve il sistema di equazioni simultanee per il reciprocal method
    """
    
    # Lista di tutti i dipartimenti
    all_depts = list(support_depts.keys()) + list(production_depts.keys())
    support_list = list(support_depts.keys())
    production_list = list(production_depts.keys())
    
    n_support = len(support_list)
    n_total = len(all_depts)
    
    # Verifica che le percentuali sommino a 100%
    print("=" * 80)
    print("VERIFICA ALLOCAZIONI")
    print("=" * 80)
    for dept, allocations in allocation_matrix.items():
        total = sum(allocations.values())
        print(f"{dept}: {total}% {'✓' if abs(total - 100) < 0.01 else '✗ ERRORE!'}")
    print()
    
    # Costruzione del sistema di equazioni per i dipartimenti di supporto
    # X_i = Costo_diretto_i + Σ(X_j * percentuale_da_j_a_i)
    
    A = np.zeros((n_support, n_support))
    b = np.zeros(n_support)
    
    for i, dept_i in enumerate(support_list):
        # Coefficiente per X_i
        A[i, i] = 1.0
        
        # Costo diretto
        b[i] = support_depts[dept_i]
        
        # Sottrai i coefficienti per gli altri dipartimenti di supporto
        for j, dept_j in enumerate(support_list):
            if i != j:
                # Percentuale che dept_j alloca a dept_i
                pct = allocation_matrix[dept_j][dept_i] / 100.0
                A[i, j] -= pct
    
    # Risolvi il sistema
    support_total_costs = np.linalg.solve(A, b)
    
    # Crea dizionario con i costi totali dei dipartimenti di supporto
    support_costs_dict = {dept: cost for dept, cost in zip(support_list, support_total_costs)}
    
    # Calcola i costi allocati ai dipartimenti di produzione
    production_costs_dict = {}
    
    for prod_dept in production_list:
        # Costo diretto
        total_cost = production_depts[prod_dept]
        
        # Aggiungi allocazioni dai dipartimenti di supporto
        for supp_dept in support_list:
            pct = allocation_matrix[supp_dept][prod_dept] / 100.0
            allocated = support_costs_dict[supp_dept] * pct
            total_cost += allocated
        
        production_costs_dict[prod_dept] = total_cost
    
    return support_costs_dict, production_costs_dict

# ============================================================================
# STAMPA RISULTATI
# ============================================================================

def print_results():
    support_costs, production_costs = solve_reciprocal_method()
    
    print("=" * 80)
    print("COSTI TOTALI DIPARTIMENTI DI SUPPORTO (dopo reciprocal allocation)")
    print("=" * 80)
    
    for dept, cost in support_costs.items():
        direct = support_depts[dept]
        allocated = cost - direct
        print(f"{dept:20s}: €{cost:8.2f}M (Diretto: €{direct:.2f}M + Allocato: €{allocated:.2f}M)")
    
    total_support = sum(support_costs.values())
    print(f"\n{'TOTALE SUPPORT':20s}: €{total_support:8.2f}M")
    
    print("\n" + "=" * 80)
    print("COSTI TOTALI DIPARTIMENTI DI PRODUZIONE (dopo allocazione support)")
    print("=" * 80)
    
    for dept, cost in production_costs.items():
        direct = production_depts[dept]
        allocated = cost - direct
        print(f"{dept:20s}: €{cost:8.2f}M (Diretto: €{direct:.2f}M + Allocato: €{allocated:.2f}M)")
    
    total_production = sum(production_costs.values())
    print(f"\n{'TOTALE PRODUCTION':20s}: €{total_production:8.2f}M")
    
    print("\n" + "=" * 80)
    print(f"TOTALE GENERALE: €{total_production:8.2f}M")
    print("=" * 80)
    
    # Dettaglio allocazioni
    print("\n" + "=" * 80)
    print("DETTAGLIO ALLOCAZIONI AI DIPARTIMENTI DI PRODUZIONE")
    print("=" * 80)
    
    for prod_dept in production_costs.keys():
        print(f"\n{prod_dept}:")
        print(f"  Costo diretto: €{production_depts[prod_dept]:.2f}M")
        
        for supp_dept in support_costs.keys():
            pct = allocation_matrix[supp_dept][prod_dept]
            allocated = support_costs[supp_dept] * (pct / 100.0)
            print(f"  Da {supp_dept:20s}: {pct:5.1f}% × €{support_costs[supp_dept]:.2f}M = €{allocated:.2f}M")
        
        print(f"  {'TOTALE':23s}: €{production_costs[prod_dept]:.2f}M")

# ============================================================================
# ESECUZIONE
# ============================================================================

if __name__ == "__main__":
    print_results()
