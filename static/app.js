// ============================================================================
// NAVIGATION
// ============================================================================

function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageName + '-page').classList.add('active');
    
    // Update menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
}

// ============================================================================
// RECIPROCAL METHOD
// ============================================================================

let supportDepts = [];
let productionDepts = [];

function init() {
    supportDepts = ['Maintenance', 'Administration', 'Marketing'];
    productionDepts = ['Production', 'Painting'];
    renderDepts();
}

function renderDepts() {
    let html = '';
    supportDepts.forEach((dept, idx) => {
        html += `
            <div class="dept-item">
                <input type="text" value="${dept}" onchange="updateSupportDept(${idx}, this.value)">
                <button onclick="removeSupportDept(${idx})">✕</button>
            </div>
        `;
    });
    document.getElementById('supportDeptsList').innerHTML = html;
    
    html = '';
    productionDepts.forEach((dept, idx) => {
        html += `
            <div class="dept-item">
                <input type="text" value="${dept}" onchange="updateProductionDept(${idx}, this.value)">
                <button onclick="removeProductionDept(${idx})">✕</button>
            </div>
        `;
    });
    document.getElementById('productionDeptsList').innerHTML = html;
}

function addSupportDept() {
    supportDepts.push('Support ' + (supportDepts.length + 1));
    renderDepts();
}

function addProductionDept() {
    productionDepts.push('Production ' + (productionDepts.length + 1));
    renderDepts();
}

function updateSupportDept(idx, value) {
    supportDepts[idx] = value;
}

function updateProductionDept(idx, value) {
    productionDepts[idx] = value;
}

function removeSupportDept(idx) {
    supportDepts.splice(idx, 1);
    renderDepts();
}

function removeProductionDept(idx) {
    productionDepts.splice(idx, 1);
    renderDepts();
}

function setupCosts() {
    let html = '<div class="primary-costs">';
    
    supportDepts.forEach(dept => {
        html += `
            <div class="cost-input">
                <label>${dept}</label>
                <input type="number" id="cost-${dept}" value="100" step="0.01">
            </div>
        `;
    });
    
    productionDepts.forEach(dept => {
        html += `
            <div class="cost-input">
                <label>${dept}</label>
                <input type="number" id="cost-${dept}" value="200" step="0.01">
            </div>
        `;
    });
    
    html += '</div>';
    document.getElementById('primaryCostsSection').innerHTML = html;
    document.getElementById('step2').style.display = 'block';
    document.getElementById('step2').scrollIntoView({ behavior: 'smooth' });
}

function setupServiceUnits() {
    const allDepts = [...supportDepts, ...productionDepts];
    
    let html = '<table><thead><tr><th>Da / A</th>';
    allDepts.forEach(dept => {
        html += `<th>${dept}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    supportDepts.forEach(fromDept => {
        html += `<tr><td class="row-label">${fromDept}</td>`;
        allDepts.forEach(toDept => {
            const disabled = fromDept === toDept ? 'disabled' : '';
            const value = fromDept === toDept ? '0' : '100';
            html += `<td><input type="number" id="units-${fromDept}-${toDept}" value="${value}" ${disabled} min="0" step="1"></td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    document.getElementById('serviceUnitsSection').innerHTML = html;
    document.getElementById('step3').style.display = 'block';
    document.getElementById('step3').scrollIntoView({ behavior: 'smooth' });
}

function setupAllocationBases() {
    let html = '<div class="primary-costs">';
    
    productionDepts.forEach(dept => {
        html += `
            <div class="cost-input">
                <label>${dept} (w.u / machine hours)</label>
                <input type="number" id="base-${dept}" value="300" step="0.01">
            </div>
        `;
    });
    
    html += '</div>';
    document.getElementById('allocationBasesSection').innerHTML = html;
    document.getElementById('step4').style.display = 'block';
    document.getElementById('step4').scrollIntoView({ behavior: 'smooth' });
}

function calculateReciprocal() {
    const support_depts = {};
    const production_depts = {};
    const service_units = {};
    const allocation_bases = {};
    
    supportDepts.forEach(dept => {
        support_depts[dept] = parseFloat(document.getElementById(`cost-${dept}`).value);
    });
    
    productionDepts.forEach(dept => {
        production_depts[dept] = parseFloat(document.getElementById(`cost-${dept}`).value);
        const baseInput = document.getElementById(`base-${dept}`);
        if (baseInput && baseInput.value) {
            allocation_bases[dept] = parseFloat(baseInput.value);
        }
    });
    
    const allDepts = [...supportDepts, ...productionDepts];
    supportDepts.forEach(fromDept => {
        service_units[fromDept] = {};
        allDepts.forEach(toDept => {
            const input = document.getElementById(`units-${fromDept}-${toDept}`);
            service_units[fromDept][toDept] = parseFloat(input.value) || 0;
        });
    });
    
    fetch('/calculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            support_depts,
            production_depts,
            service_units,
            allocation_bases
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayReciprocalResults(data, support_depts, production_depts, allocation_bases);
        } else {
            alert('Errore: ' + data.error);
        }
    });
}

function displayReciprocalResults(data, support_depts, production_depts, allocation_bases) {
    let supportHTML = '';
    Object.entries(data.support_costs).forEach(([dept, cost]) => {
        const direct = support_depts[dept];
        const rate = data.support_rates[dept];
        const units = data.support_total_units[dept];
        supportHTML += `
            <div class="result-item">
                <span><strong>${dept}</strong></span>
                <span>€${cost.toFixed(2)}</span>
            </div>
            <div class="result-item" style="font-size: 0.9em; color: #666;">
                <span>Costo diretto</span>
                <span>€${direct.toFixed(2)}</span>
            </div>
            <div class="result-item" style="font-size: 0.9em; color: #666;">
                <span>Totale unità</span>
                <span>${units.toFixed(0)}</span>
            </div>
            <div class="result-item" style="font-size: 0.9em; color: #667eea; margin-bottom: 15px;">
                <span>Cost rate</span>
                <span>€${rate.toFixed(4)}/unit</span>
            </div>
        `;
    });
    document.getElementById('supportResults').innerHTML = supportHTML;
    
    let productionHTML = '';
    Object.entries(data.production_costs).forEach(([dept, cost]) => {
        const direct = production_depts[dept];
        productionHTML += `
            <div class="result-item">
                <span><strong>${dept}</strong></span>
                <span>€${cost.toFixed(2)}</span>
            </div>
            <div class="result-item" style="font-size: 0.9em; color: #666;">
                <span>Costo diretto</span>
                <span>€${direct.toFixed(2)}</span>
            </div>
            <div class="result-item" style="font-size: 0.9em; color: #666; margin-bottom: 15px;">
                <span>Allocato</span>
                <span>€${(cost - direct).toFixed(2)}</span>
            </div>
        `;
        
        if (data.production_rates[dept]) {
            productionHTML += `
                <div class="result-item" style="font-size: 0.9em; color: #667eea; margin-bottom: 15px;">
                    <span>Cost rate</span>
                    <span>€${data.production_rates[dept].toFixed(4)}/w.u</span>
                </div>
            `;
        }
    });
    document.getElementById('productionResults').innerHTML = productionHTML;
    
    let detailsHTML = '';
    Object.entries(data.production_details).forEach(([dept, details]) => {
        detailsHTML += `
            <div class="detail-section">
                <h4>${dept} - Dettaglio Allocazioni</h4>
                <div class="allocation-detail">Costo diretto: €${production_depts[dept].toFixed(2)}</div>
        `;
        details.forEach(detail => {
            detailsHTML += `
                <div class="allocation-detail">
                    Da ${detail.from}: ${detail.units} units × €${detail.rate.toFixed(4)}/unit = €${detail.allocated.toFixed(2)}
                </div>
            `;
        });
        detailsHTML += `
                <div class="allocation-detail" style="font-weight: 600; color: #667eea; margin-top: 10px;">
                    TOTALE: €${data.production_costs[dept].toFixed(2)}
                </div>
            </div>
        `;
    });
    document.getElementById('detailsSection').innerHTML = detailsHTML;
    
    document.getElementById('totalBanner').textContent = `TOTALE GENERALE: €${data.total.toFixed(2)}`;
    
    document.getElementById('reciprocalResults').style.display = 'block';
    document.getElementById('reciprocalResults').scrollIntoView({ behavior: 'smooth' });
}

// ============================================================================
// WIP VALUATION
// ============================================================================

function calculateWIP() {
    const method = document.getElementById('wipMethod').value;
    const deptName = document.getElementById('wipDeptName').value;
    const materials = parseFloat(document.getElementById('wipMaterials').value);
    const conversion = parseFloat(document.getElementById('wipConversion').value);
    const openingUnits = parseFloat(document.getElementById('wipOpeningUnits').value);
    const openingCC = parseFloat(document.getElementById('wipOpeningCC').value);
    const openingMaterials = parseFloat(document.getElementById('wipOpeningMaterials').value);
    const openingConversion = parseFloat(document.getElementById('wipOpeningConversion').value);
    const started = parseFloat(document.getElementById('wipStarted').value);
    const completed = parseFloat(document.getElementById('wipCompleted').value);
    const endingCC = parseFloat(document.getElementById('wipEndingCC').value);
    
    fetch('/calculate_wip', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            method,
            dept_name: deptName,
            materials,
            conversion,
            opening_units: openingUnits,
            opening_cc: openingCC,
            opening_materials: openingMaterials,
            opening_conversion: openingConversion,
            started,
            completed,
            ending_cc: endingCC
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayWIPResults(data);
        } else {
            alert('Errore: ' + data.error);
        }
    });
}

function displayWIPResults(data) {
    let html = `
        <div class="results-grid">
            <div class="result-card">
                <h3>📊 Physical Flow</h3>
                <div class="result-item">
                    <span>Opening WIP</span>
                    <span>${data.physical_flow.opening_wip} units</span>
                </div>
                <div class="result-item">
                    <span>Started</span>
                    <span>${data.physical_flow.started} units</span>
                </div>
                <div class="result-item">
                    <span>Completed</span>
                    <span>${data.physical_flow.completed} units</span>
                </div>
                <div class="result-item">
                    <span>Started & Completed</span>
                    <span>${data.physical_flow.started_and_completed} units</span>
                </div>
                <div class="result-item">
                    <span>Ending WIP</span>
                    <span>${data.physical_flow.ending_wip} units</span>
                </div>
            </div>
            
            <div class="result-card">
                <h3>💰 Equivalent Units</h3>
                <div class="result-item">
                    <span>Materials</span>
                    <span>${data.equivalent_units.materials.toFixed(2)} EU</span>
                </div>
                <div class="result-item">
                    <span>Conversion Costs</span>
                    <span>${data.equivalent_units.conversion.toFixed(2)} EU</span>
                </div>
            </div>
            
            <div class="result-card">
                <h3>📈 Cost per Equivalent Unit</h3>
                <div class="result-item">
                    <span>Materials</span>
                    <span>€${data.cost_per_eu.materials.toFixed(4)}/EU</span>
                </div>
                <div class="result-item">
                    <span>Conversion</span>
                    <span>€${data.cost_per_eu.conversion.toFixed(4)}/EU</span>
                </div>
                <div class="result-item">
                    <span>Total</span>
                    <span>€${data.cost_per_eu.total.toFixed(4)}/EU</span>
                </div>
            </div>
        </div>
    `;
    
    // FIFO Breakdown in 3 sections
    if (data.method === 'FIFO' && data.fifo_breakdown) {
        html += `
            <div class="detail-section" style="background: #e8f5e9; border-left-color: #4caf50;">
                <h4>1️⃣ Completing Opening WIP (${data.physical_flow.opening_wip} units)</h4>
                <div class="allocation-detail">Opening DM: €${data.fifo_breakdown.completing_opening.opening_dm.toFixed(2)}</div>
                <div class="allocation-detail">Opening CC: €${data.fifo_breakdown.completing_opening.opening_cc.toFixed(2)}</div>
                <div class="allocation-detail">Additional CC to complete: €${data.fifo_breakdown.completing_opening.additional_cc.toFixed(2)}</div>
                <div class="allocation-detail" style="font-weight: 600; color: #4caf50; margin-top: 10px; font-size: 1.1em;">
                    Total Opening WIP: €${data.fifo_breakdown.completing_opening.total.toFixed(2)}
                </div>
            </div>
            
            <div class="detail-section" style="background: #e3f2fd; border-left-color: #2196f3;">
                <h4>2️⃣ Started and Completed (${data.fifo_breakdown.started_and_completed.units} units)</h4>
                <div class="allocation-detail">
                    ${data.fifo_breakdown.started_and_completed.units} units × €${data.cost_per_eu.total.toFixed(4)}/unit
                </div>
                <div class="allocation-detail" style="font-weight: 600; color: #2196f3; margin-top: 10px; font-size: 1.1em;">
                    Total Started & Completed: €${data.fifo_breakdown.started_and_completed.cost.toFixed(2)}
                </div>
            </div>
            
            <div class="detail-section" style="background: #fff3e0; border-left-color: #ff9800;">
                <h4>3️⃣ Ending WIP (${data.fifo_breakdown.ending_wip.units} units)</h4>
                <div class="allocation-detail">DM (100%): ${data.fifo_breakdown.ending_wip.units} × €${data.cost_per_eu.materials.toFixed(4)} = €${data.fifo_breakdown.ending_wip.dm.toFixed(2)}</div>
                <div class="allocation-detail">CC (${(data.physical_flow.ending_wip > 0 ? (data.valuation.ending_wip_conversion / data.cost_per_eu.conversion / data.physical_flow.ending_wip * 100) : 0).toFixed(0)}%): ${data.fifo_breakdown.ending_wip.units} × ${(data.physical_flow.ending_wip > 0 ? (data.valuation.ending_wip_conversion / data.cost_per_eu.conversion / data.physical_flow.ending_wip) : 0).toFixed(2)} × €${data.cost_per_eu.conversion.toFixed(4)} = €${data.fifo_breakdown.ending_wip.cc.toFixed(2)}</div>
                <div class="allocation-detail" style="font-weight: 600; color: #ff9800; margin-top: 10px; font-size: 1.1em;">
                    Total Ending WIP: €${data.fifo_breakdown.ending_wip.total.toFixed(2)}
                </div>
            </div>
        `;
    } else {
        // Non-FIFO methods
        html += `
            <div class="detail-section">
                <h4>🎯 Valutazione Finale</h4>
                <div class="allocation-detail"><strong>Finished Goods (Completed Units):</strong></div>
                <div class="allocation-detail">€${data.valuation.finished_goods.toFixed(2)}</div>
                <div class="allocation-detail" style="margin-top: 15px;"><strong>Ending WIP:</strong></div>
                <div class="allocation-detail">Materials: €${data.valuation.ending_wip_materials.toFixed(2)}</div>
                <div class="allocation-detail">Conversion: €${data.valuation.ending_wip_conversion.toFixed(2)}</div>
                <div class="allocation-detail" style="font-weight: 600; color: #667eea; margin-top: 10px;">
                    Total Ending WIP: €${data.valuation.ending_wip_total.toFixed(2)}
                </div>
            </div>
        `;
    }
    
    html += `
        <div class="total-banner">
            FINISHED GOODS: €${data.valuation.finished_goods.toFixed(2)} | ENDING WIP: €${data.valuation.ending_wip_total.toFixed(2)} | TOTAL: €${data.total_costs.toFixed(2)}
        </div>
    `;
    
    document.getElementById('wipResultsContent').innerHTML = html;
    document.getElementById('wipResults').style.display = 'block';
    document.getElementById('wipResults').scrollIntoView({ behavior: 'smooth' });
}

// Initialize
init();
