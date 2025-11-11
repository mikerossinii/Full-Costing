"""
Web App per Cost Accounting - Reciprocal Method (Generic)
"""

from flask import Flask, render_template, request, jsonify
import numpy as np

app = Flask(__name__)

def solve_reciprocal_method(support_depts, production_depts, service_units, allocation_bases=None):
    """
    Risolve il sistema di equazioni simultanee per il reciprocal method
    
    Args:
        support_depts: dict con costi primari dei dipartimenti di supporto
        production_depts: dict con costi primari dei dipartimenti di produzione
        service_units: dict di dict con le unità di servizio rese tra dipartimenti
        allocation_bases: dict con le basi di allocazione per i dipartimenti di produzione (opzionale)
    """
    support_list = list(support_depts.keys())
    production_list = list(production_depts.keys())
    all_depts = support_list + production_list
    
    n_support = len(support_list)
    
    # Calcola i totali delle unità di servizio per ogni dipartimento di supporto
    total_units = {}
    for supp_dept in support_list:
        total = sum(service_units[supp_dept].values())
        total_units[supp_dept] = total
    
    # Costruzione del sistema di equazioni simultanee
    # X_i = Primary_Cost_i + Σ(X_j * (units_from_j_to_i / total_units_j))
    A = np.zeros((n_support, n_support))
    b = np.zeros(n_support)
    
    for i, dept_i in enumerate(support_list):
        A[i, i] = 1.0
        b[i] = support_depts[dept_i]
        
        for j, dept_j in enumerate(support_list):
            if i != j:
                # Proporzione di servizio che dept_j fornisce a dept_i
                units_to_i = service_units[dept_j].get(dept_i, 0)
                proportion = units_to_i / total_units[dept_j] if total_units[dept_j] > 0 else 0
                A[i, j] -= proportion
    
    # Risolvi il sistema
    support_total_costs = np.linalg.solve(A, b)
    support_costs_dict = {dept: float(cost) for dept, cost in zip(support_list, support_total_costs)}
    
    # Calcola i cost rates per unità per ogni dipartimento di supporto
    cost_rates = {}
    for supp_dept in support_list:
        if total_units[supp_dept] > 0:
            cost_rates[supp_dept] = support_costs_dict[supp_dept] / total_units[supp_dept]
        else:
            cost_rates[supp_dept] = 0
    
    # Calcola i costi allocati ai dipartimenti di produzione
    production_costs_dict = {}
    production_details = {}
    
    for prod_dept in production_list:
        total_cost = production_depts[prod_dept]
        details = []
        
        for supp_dept in support_list:
            units = service_units[supp_dept].get(prod_dept, 0)
            allocated = cost_rates[supp_dept] * units
            total_cost += allocated
            
            details.append({
                'from': supp_dept,
                'units': units,
                'rate': cost_rates[supp_dept],
                'allocated': allocated
            })
        
        production_costs_dict[prod_dept] = float(total_cost)
        production_details[prod_dept] = details
    
    # Calcola i cost rates per i dipartimenti di produzione (se fornite le basi)
    production_rates = {}
    if allocation_bases:
        for prod_dept in production_list:
            base = allocation_bases.get(prod_dept, 0)
            if base > 0:
                production_rates[prod_dept] = production_costs_dict[prod_dept] / base
            else:
                production_rates[prod_dept] = 0
    
    return {
        'support_costs': support_costs_dict,
        'support_rates': cost_rates,
        'support_total_units': total_units,
        'production_costs': production_costs_dict,
        'production_rates': production_rates,
        'production_details': production_details
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.json
    
    support_depts = data['support_depts']
    production_depts = data['production_depts']
    service_units = data['service_units']
    allocation_bases = data.get('allocation_bases', {})
    
    try:
        results = solve_reciprocal_method(
            support_depts, production_depts, service_units, allocation_bases
        )
        
        results['success'] = True
        results['total'] = sum(results['production_costs'].values())
        
        return jsonify(results)
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/calculate_wip', methods=['POST'])
def calculate_wip():
    data = request.json
    
    try:
        method = data['method']
        materials = data['materials']
        conversion = data['conversion']
        opening_units = data['opening_units']
        opening_cc = data['opening_cc'] / 100.0
        opening_materials = data['opening_materials']
        opening_conversion = data['opening_conversion']
        started = data['started']
        completed = data['completed']
        ending_cc = data['ending_cc'] / 100.0
        
        # Calculate ending WIP units
        ending_wip = opening_units + started - completed
        
        # Calculate equivalent units based on method
        if method == 'FIFO':
            # FIFO: separate opening WIP work from current period work
            eu_materials = completed - opening_units + (ending_wip * 1.0)
            eu_conversion = (opening_units * (1 - opening_cc)) + (completed - opening_units) + (ending_wip * ending_cc)
            
            # Cost per EU (only current period costs)
            cost_per_eu_materials = materials / eu_materials
            cost_per_eu_conversion = conversion / eu_conversion
            
            # Valuation
            finished_goods = opening_materials + opening_conversion + \
                           (opening_units * (1 - opening_cc) * cost_per_eu_conversion) + \
                           ((completed - opening_units) * (cost_per_eu_materials + cost_per_eu_conversion))
            
        elif method == 'AVG':
            # Average: combine opening WIP with current period
            total_materials_cost = opening_materials + materials
            total_conversion_cost = opening_conversion + conversion
            
            eu_materials = completed + ending_wip
            eu_conversion = completed + (ending_wip * ending_cc)
            
            cost_per_eu_materials = total_materials_cost / eu_materials
            cost_per_eu_conversion = total_conversion_cost / eu_conversion
            
            finished_goods = completed * (cost_per_eu_materials + cost_per_eu_conversion)
            
        else:  # LIFO
            # LIFO: assume most recent costs go to completed units
            eu_materials = completed + ending_wip
            eu_conversion = completed + (ending_wip * ending_cc)
            
            cost_per_eu_materials = materials / started
            cost_per_eu_conversion = conversion / (started + (opening_units * opening_cc))
            
            finished_goods = completed * (cost_per_eu_materials + cost_per_eu_conversion)
        
        # Ending WIP valuation
        ending_wip_materials = ending_wip * cost_per_eu_materials
        ending_wip_conversion = ending_wip * ending_cc * cost_per_eu_conversion
        ending_wip_total = ending_wip_materials + ending_wip_conversion
        
        # Total costs
        total_costs = opening_materials + opening_conversion + materials + conversion
        
        return jsonify({
            'success': True,
            'method': method,
            'physical_flow': {
                'opening_wip': opening_units,
                'started': started,
                'completed': completed,
                'ending_wip': ending_wip
            },
            'equivalent_units': {
                'materials': float(eu_materials),
                'conversion': float(eu_conversion)
            },
            'cost_per_eu': {
                'materials': float(cost_per_eu_materials),
                'conversion': float(cost_per_eu_conversion),
                'total': float(cost_per_eu_materials + cost_per_eu_conversion)
            },
            'valuation': {
                'finished_goods': float(finished_goods),
                'ending_wip_materials': float(ending_wip_materials),
                'ending_wip_conversion': float(ending_wip_conversion),
                'ending_wip_total': float(ending_wip_total)
            },
            'total_costs': float(total_costs)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

if __name__ == '__main__':
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
