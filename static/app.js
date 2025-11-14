// ============================================================================
// NAVIGATION
// ============================================================================

function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

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
    
    // Close mobile menu if open
    if (window.innerWidth <= 768) {
        toggleMobileMenu();
    }
}

// ============================================================================
// RECIPROCAL METHOD
// ============================================================================

let supportDepts = [];
let productionDepts = [];
let lastReciprocalResults = null;
let lastWIPResults = null;

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
    // Save results for language switching
    lastReciprocalResults = { data, support_depts, production_depts, allocation_bases };
    
    // Display support departments in original order
    let supportHTML = '';
    supportDepts.forEach(dept => {
        if (data.support_costs[dept]) {
            const cost = data.support_costs[dept];
            const direct = support_depts[dept];
            const rate = data.support_rates[dept];
            const units = data.support_total_units[dept];
            supportHTML += `
                <div class="result-item">
                    <span><strong>${dept}</strong></span>
                    <span>€${cost.toFixed(6)}</span>
                </div>
                <div class="result-item" style="font-size: 0.9em; color: #666;">
                    <span data-i18n="directCost">${t('directCost')}</span>
                    <span>€${direct.toFixed(6)}</span>
                </div>
                <div class="result-item" style="font-size: 0.9em; color: #666;">
                    <span data-i18n="totalUnits">${t('totalUnits')}</span>
                    <span>${units.toFixed(0)}</span>
                </div>
                <div class="result-item" style="font-size: 0.9em; color: #667eea; margin-bottom: 15px;">
                    <span data-i18n="costRate">${t('costRate')}</span>
                    <span>€${rate.toFixed(6)}/${t('unit')}</span>
                </div>
            `;
        }
    });
    document.getElementById('supportResults').innerHTML = supportHTML;
    
    // Display production departments in original order
    let productionHTML = '';
    productionDepts.forEach(dept => {
        if (data.production_costs[dept]) {
            const cost = data.production_costs[dept];
            const direct = production_depts[dept];
            productionHTML += `
                <div class="result-item">
                    <span><strong>${dept}</strong></span>
                    <span>€${cost.toFixed(6)}</span>
                </div>
                <div class="result-item" style="font-size: 0.9em; color: #666;">
                    <span data-i18n="directCost">${t('directCost')}</span>
                    <span>€${direct.toFixed(6)}</span>
                </div>
                <div class="result-item" style="font-size: 0.9em; color: #666; margin-bottom: 15px;">
                    <span data-i18n="allocated">${t('allocated')}</span>
                    <span>€${(cost - direct).toFixed(6)}</span>
                </div>
            `;
            
            if (data.production_rates[dept]) {
                productionHTML += `
                    <div class="result-item" style="font-size: 0.9em; color: #667eea; margin-bottom: 15px;">
                        <span data-i18n="costRate">${t('costRate')}</span>
                        <span>€${data.production_rates[dept].toFixed(6)}/w.u</span>
                    </div>
                `;
            }
        }
    });
    document.getElementById('productionResults').innerHTML = productionHTML;
    
    // Display details in original order
    let detailsHTML = '';
    productionDepts.forEach(dept => {
        if (data.production_details[dept]) {
            const details = data.production_details[dept];
            detailsHTML += `
                <div class="detail-section">
                    <h4>${dept} - ${t('allocationDetails')}</h4>
                    <div class="allocation-detail">${t('directCost')}: €${production_depts[dept].toFixed(6)}</div>
            `;
            details.forEach(detail => {
                detailsHTML += `
                    <div class="allocation-detail">
                        Da ${detail.from}: ${detail.units} ${t('units')} × €${detail.rate.toFixed(6)}/${t('unit')} = €${detail.allocated.toFixed(6)}
                    </div>
                `;
            });
            detailsHTML += `
                    <div class="allocation-detail" style="font-weight: 600; color: #667eea; margin-top: 10px;">
                        ${t('total').toUpperCase()}: €${data.production_costs[dept].toFixed(6)}
                    </div>
                </div>
            `;
        }
    });
    document.getElementById('detailsSection').innerHTML = detailsHTML;
    
    document.getElementById('totalBanner').textContent = `${t('totalGeneral').toUpperCase()}: €${data.total.toFixed(6)}`;
    
    // Add procedimento section
    const procedimentoHTML = generateReciprocalProcedimento(data, support_depts, production_depts);
    detailsHTML += `
        <button class="procedimento-toggle" onclick="toggleProcedimento('reciprocal')">
            📖 <span data-i18n="showProcedimento">${t('showProcedimento') || 'Mostra Procedimento'}</span>
        </button>
        <div id="reciprocal-procedimento" class="procedimento-content">
            ${procedimentoHTML}
        </div>
    `;
    document.getElementById('detailsSection').innerHTML = detailsHTML;
    
    document.getElementById('reciprocalResults').style.display = 'block';
    document.getElementById('reciprocalResults').scrollIntoView({ behavior: 'smooth' });
}

function generateReciprocalProcedimento(data, support_depts, production_depts) {
    let html = `<h3 style="color: #667eea; margin-bottom: 20px;">📚 ${t('procedimento') || 'Procedimento di Calcolo'}</h3>`;
    
    // Step 1: Setup
    html += `
        <div class="step">
            <div class="step-title">1️⃣ ${t('setupSystem') || 'Impostazione del Sistema'}</div>
            <div class="calculation">
                ${t('reciprocalExplanation') || 'Il metodo reciproco risolve un sistema di equazioni simultanee per allocare i costi dei dipartimenti di supporto, considerando i servizi reciproci tra loro.'}
            </div>
        </div>
    `;
    
    // Step 2: Equations
    html += `
        <div class="step">
            <div class="step-title">2️⃣ ${t('simultaneousEquations') || 'Equazioni Simultanee'}</div>
    `;
    
    supportDepts.forEach(dept => {
        if (data.support_costs[dept]) {
            html += `<div class="formula">X_${dept} = €${support_depts[dept].toFixed(2)}`;
            
            // Add allocations from other support departments
            supportDepts.forEach(otherDept => {
                if (otherDept !== dept && data.support_total_units[otherDept] > 0) {
                    const units = data.production_details[Object.keys(data.production_details)[0]]?.find(d => d.from === otherDept)?.units || 0;
                    // This is simplified - in reality we'd need the actual service units matrix
                    html += ` + (proporzione da ${otherDept})`;
                }
            });
            
            html += `</div>`;
        }
    });
    
    html += `</div>`;
    
    // Step 3: Solution
    html += `
        <div class="step">
            <div class="step-title">3️⃣ ${t('systemSolution') || 'Soluzione del Sistema'}</div>
    `;
    
    supportDepts.forEach(dept => {
        if (data.support_costs[dept]) {
            html += `
                <div class="calculation">
                    <strong>${dept}:</strong><br>
                    ${t('directCost')}: €${support_depts[dept].toFixed(6)}<br>
                    ${t('totalCost')}: €${data.support_costs[dept].toFixed(6)}<br>
                    ${t('totalUnits')}: ${data.support_total_units[dept]}<br>
                    ${t('costRate')}: €${data.support_rates[dept].toFixed(6)}/${t('unit')}
                </div>
                <div class="formula">
                    Rate = €${data.support_costs[dept].toFixed(6)} ÷ ${data.support_total_units[dept]} = €${data.support_rates[dept].toFixed(6)}/${t('unit')}
                </div>
            `;
        }
    });
    
    html += `</div>`;
    
    // Step 4: Allocation to Production
    html += `
        <div class="step">
            <div class="step-title">4️⃣ ${t('allocationToProduction') || 'Allocazione ai Dipartimenti di Produzione'}</div>
    `;
    
    productionDepts.forEach(dept => {
        if (data.production_costs[dept]) {
            html += `
                <div class="calculation">
                    <strong>${dept}:</strong><br>
                    ${t('directCost')}: €${production_depts[dept].toFixed(6)}
                </div>
            `;
            
            if (data.production_details[dept]) {
                data.production_details[dept].forEach(detail => {
                    html += `
                        <div class="formula">
                            + ${detail.from}: ${detail.units} ${t('units')} × €${detail.rate.toFixed(6)} = €${detail.allocated.toFixed(6)}
                        </div>
                    `;
                });
            }
            
            html += `
                <div class="calculation" style="font-weight: 600; color: #4caf50; margin-top: 10px;">
                    = ${t('total')}: €${data.production_costs[dept].toFixed(6)}
                </div>
            `;
        }
    });
    
    html += `</div>`;
    
    return html;
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
    // Save results for language switching
    lastWIPResults = data;
    
    let html = `
        <div class="results-grid">
            <div class="result-card">
                <h3>📊 ${t('physicalFlow')}</h3>
                <div class="result-item">
                    <span data-i18n="openingWIPLabel">${t('openingWIPLabel')}</span>
                    <span>${data.physical_flow.opening_wip} ${t('units')}</span>
                </div>
                <div class="result-item">
                    <span data-i18n="started">${t('started')}</span>
                    <span>${data.physical_flow.started} ${t('units')}</span>
                </div>
                <div class="result-item">
                    <span data-i18n="completed">${t('completed')}</span>
                    <span>${data.physical_flow.completed} ${t('units')}</span>
                </div>
                <div class="result-item">
                    <span data-i18n="startedCompleted">${t('startedCompleted')}</span>
                    <span>${data.physical_flow.started_and_completed} ${t('units')}</span>
                </div>
                <div class="result-item">
                    <span data-i18n="endingWIP">${t('endingWIP')}</span>
                    <span>${data.physical_flow.ending_wip} ${t('units')}</span>
                </div>
            </div>
            
            <div class="result-card">
                <h3>💰 ${t('equivalentUnits')}</h3>
                <div class="result-item">
                    <span data-i18n="materials">${t('materials')}</span>
                    <span>${data.equivalent_units.materials.toFixed(2)} EU</span>
                </div>
                <div class="result-item">
                    <span data-i18n="conversionCosts">${t('conversionCosts')}</span>
                    <span>${data.equivalent_units.conversion.toFixed(2)} EU</span>
                </div>
            </div>
            
            <div class="result-card">
                <h3>📈 ${t('costPerEU')}</h3>
                <div class="result-item">
                    <span data-i18n="materials">${t('materials')}</span>
                    <span>€${data.cost_per_eu.materials.toFixed(4)}/EU</span>
                </div>
                <div class="result-item">
                    <span>Conversion</span>
                    <span>€${data.cost_per_eu.conversion.toFixed(4)}/EU</span>
                </div>
                <div class="result-item">
                    <span data-i18n="total">${t('total')}</span>
                    <span>€${data.cost_per_eu.total.toFixed(4)}/EU</span>
                </div>
            </div>
        </div>
    `;
    
    // FIFO Breakdown in 3 sections
    if (data.method === 'FIFO' && data.fifo_breakdown) {
        html += `
            <div class="detail-section" style="background: #e8f5e9; border-left-color: #4caf50;">
                <h4>1️⃣ ${t('completingOpeningWIP')} (${data.physical_flow.opening_wip} ${t('units')})</h4>
                <div class="allocation-detail">${t('openingDM')}: €${data.fifo_breakdown.completing_opening.opening_dm.toFixed(2)}</div>
                <div class="allocation-detail">${t('openingCC')}: €${data.fifo_breakdown.completing_opening.opening_cc.toFixed(2)}</div>
                <div class="allocation-detail">${t('additionalCC')}: €${data.fifo_breakdown.completing_opening.additional_cc.toFixed(2)}</div>
                <div class="allocation-detail" style="font-weight: 600; color: #4caf50; margin-top: 10px; font-size: 1.1em;">
                    ${t('totalOpeningWIP')}: €${data.fifo_breakdown.completing_opening.total.toFixed(2)}
                </div>
            </div>
            
            <div class="detail-section" style="background: #e3f2fd; border-left-color: #2196f3;">
                <h4>2️⃣ ${t('startedAndCompleted')} (${data.fifo_breakdown.started_and_completed.units} ${t('units')})</h4>
                <div class="allocation-detail">
                    ${data.fifo_breakdown.started_and_completed.units} ${t('units')} × €${data.cost_per_eu.total.toFixed(4)}/${t('unit')}
                </div>
                <div class="allocation-detail" style="font-weight: 600; color: #2196f3; margin-top: 10px; font-size: 1.1em;">
                    ${t('totalStartedCompleted')}: €${data.fifo_breakdown.started_and_completed.cost.toFixed(2)}
                </div>
            </div>
            
            <div class="detail-section" style="background: #fff3e0; border-left-color: #ff9800;">
                <h4>3️⃣ ${t('endingWIPSection')} (${data.fifo_breakdown.ending_wip.units} ${t('units')})</h4>
                <div class="allocation-detail">DM (100%): ${data.fifo_breakdown.ending_wip.units} × €${data.cost_per_eu.materials.toFixed(4)} = €${data.fifo_breakdown.ending_wip.dm.toFixed(2)}</div>
                <div class="allocation-detail">CC (${(data.physical_flow.ending_wip > 0 ? (data.valuation.ending_wip_conversion / data.cost_per_eu.conversion / data.physical_flow.ending_wip * 100) : 0).toFixed(0)}%): ${data.fifo_breakdown.ending_wip.units} × ${(data.physical_flow.ending_wip > 0 ? (data.valuation.ending_wip_conversion / data.cost_per_eu.conversion / data.physical_flow.ending_wip) : 0).toFixed(2)} × €${data.cost_per_eu.conversion.toFixed(4)} = €${data.fifo_breakdown.ending_wip.cc.toFixed(2)}</div>
                <div class="allocation-detail" style="font-weight: 600; color: #ff9800; margin-top: 10px; font-size: 1.1em;">
                    ${t('totalEndingWIP')}: €${data.fifo_breakdown.ending_wip.total.toFixed(2)}
                </div>
            </div>
        `;
    } else {
        // Non-FIFO methods
        html += `
            <div class="detail-section">
                <h4>🎯 Valutazione Finale</h4>
                <div class="allocation-detail"><strong>${t('finishedGoods')} (${t('completed')} ${t('units')}):</strong></div>
                <div class="allocation-detail">€${data.valuation.finished_goods.toFixed(2)}</div>
                <div class="allocation-detail" style="margin-top: 15px;"><strong>${t('endingWIP')}:</strong></div>
                <div class="allocation-detail">${t('materials')}: €${data.valuation.ending_wip_materials.toFixed(2)}</div>
                <div class="allocation-detail">Conversion: €${data.valuation.ending_wip_conversion.toFixed(2)}</div>
                <div class="allocation-detail" style="font-weight: 600; color: #667eea; margin-top: 10px;">
                    ${t('totalEndingWIP')}: €${data.valuation.ending_wip_total.toFixed(2)}
                </div>
            </div>
        `;
    }
    
    html += `
        <div class="total-banner">
            ${t('finishedGoods').toUpperCase()}: €${data.valuation.finished_goods.toFixed(2)} | ${t('endingWIP').toUpperCase()}: €${data.valuation.ending_wip_total.toFixed(2)} | TOTAL: €${data.total_costs.toFixed(2)}
        </div>
    `;
    
    // Add procedimento
    html += `
        <button class="procedimento-toggle" onclick="toggleProcedimento('wip')">
            📖 <span data-i18n="showProcedimento">${t('showProcedimento') || 'Mostra Procedimento'}</span>
        </button>
        <div id="wip-procedimento" class="procedimento-content">
            ${generateWIPProcedimento(data)}
        </div>
    `;
    
    document.getElementById('wipResultsContent').innerHTML = html;
    document.getElementById('wipResults').style.display = 'block';
    document.getElementById('wipResults').scrollIntoView({ behavior: 'smooth' });
}

function generateWIPProcedimento(data) {
    let html = `<h3 style="color: #667eea; margin-bottom: 20px;">📚 ${t('procedimento') || 'Procedimento di Calcolo'}</h3>`;
    
    // Step 1: Physical Flow
    html += `
        <div class="step">
            <div class="step-title">1️⃣ ${t('physicalFlow')}</div>
            <div class="calculation">
                ${t('openingWIPLabel')}: ${data.physical_flow.opening_wip} ${t('units')}<br>
                ${t('started')}: ${data.physical_flow.started} ${t('units')}<br>
                ${t('completed')}: ${data.physical_flow.completed} ${t('units')}
            </div>
            <div class="formula">
                ${t('endingWIP')} = ${data.physical_flow.opening_wip} + ${data.physical_flow.started} - ${data.physical_flow.completed} = ${data.physical_flow.ending_wip} ${t('units')}
            </div>
        </div>
    `;
    
    // Step 2: Equivalent Units
    html += `
        <div class="step">
            <div class="step-title">2️⃣ ${t('equivalentUnits')} (${data.method})</div>
            <div class="calculation">
                <strong>${t('materials')}:</strong> ${data.equivalent_units.materials.toFixed(2)} EU<br>
                <strong>${t('conversionCosts')}:</strong> ${data.equivalent_units.conversion.toFixed(2)} EU
            </div>
        </div>
    `;
    
    // Step 3: Cost per EU
    html += `
        <div class="step">
            <div class="step-title">3️⃣ ${t('costPerEU')}</div>
            <div class="formula">
                ${t('materials')}: Cost ÷ EU = €${data.cost_per_eu.materials.toFixed(4)}/EU
            </div>
            <div class="formula">
                Conversion: Cost ÷ EU = €${data.cost_per_eu.conversion.toFixed(4)}/EU
            </div>
            <div class="calculation" style="font-weight: 600; margin-top: 10px;">
                ${t('total')}: €${data.cost_per_eu.total.toFixed(4)}/EU
            </div>
        </div>
    `;
    
    // Step 4: Valuation
    if (data.method === 'FIFO' && data.fifo_breakdown) {
        html += `
            <div class="step">
                <div class="step-title">4️⃣ ${t('valuation')} - FIFO</div>
                
                <div class="calculation"><strong>a) ${t('completingOpeningWIP')}:</strong></div>
                <div class="formula">
                    ${t('openingDM')}: €${data.fifo_breakdown.completing_opening.opening_dm.toFixed(2)}<br>
                    ${t('openingCC')}: €${data.fifo_breakdown.completing_opening.opening_cc.toFixed(2)}<br>
                    ${t('additionalCC')}: €${data.fifo_breakdown.completing_opening.additional_cc.toFixed(2)}<br>
                    = €${data.fifo_breakdown.completing_opening.total.toFixed(2)}
                </div>
                
                <div class="calculation"><strong>b) ${t('startedAndCompleted')}:</strong></div>
                <div class="formula">
                    ${data.fifo_breakdown.started_and_completed.units} ${t('units')} × €${data.cost_per_eu.total.toFixed(4)} = €${data.fifo_breakdown.started_and_completed.cost.toFixed(2)}
                </div>
                
                <div class="calculation"><strong>c) ${t('endingWIPSection')}:</strong></div>
                <div class="formula">
                    DM: €${data.fifo_breakdown.ending_wip.dm.toFixed(2)}<br>
                    CC: €${data.fifo_breakdown.ending_wip.cc.toFixed(2)}<br>
                    = €${data.fifo_breakdown.ending_wip.total.toFixed(2)}
                </div>
            </div>
        `;
    }
    
    html += `
        <div class="step">
            <div class="step-title">5️⃣ ${t('finalValuation') || 'Valutazione Finale'}</div>
            <div class="calculation">
                <strong>${t('finishedGoods')}:</strong> €${data.valuation.finished_goods.toFixed(2)}<br>
                <strong>${t('endingWIP')}:</strong> €${data.valuation.ending_wip_total.toFixed(2)}
            </div>
            <div class="formula">
                ${t('total')}: €${data.valuation.finished_goods.toFixed(2)} + €${data.valuation.ending_wip_total.toFixed(2)} = €${data.total_costs.toFixed(2)}
            </div>
        </div>
    `;
    
    return html;
}

// ============================================================================
// BREAK-EVEN ANALYSIS
// ============================================================================

let lastBreakEvenResults = null;
let breakEvenChart = null;

function updateBreakEvenChart() {
    const sellingPrice = parseFloat(document.getElementById('beSellingPrice').value) || 0;
    const variableCost = parseFloat(document.getElementById('beVariableCost').value) || 0;
    const fixedCosts = parseFloat(document.getElementById('beFixedCosts').value) || 0;
    const expectedSales = parseFloat(document.getElementById('beExpectedSales').value) || 0;
    
    if (sellingPrice <= 0 || variableCost < 0 || fixedCosts < 0) return;
    
    const contributionMargin = sellingPrice - variableCost;
    if (contributionMargin <= 0) return;
    
    const breakEvenUnits = fixedCosts / contributionMargin;
    
    // Generate data points for the chart
    const maxUnits = Math.max(breakEvenUnits * 2, expectedSales * 1.2, 100);
    const dataPoints = [];
    const step = maxUnits / 50;
    
    for (let units = 0; units <= maxUnits; units += step) {
        const revenue = units * sellingPrice;
        const totalCost = fixedCosts + (units * variableCost);
        dataPoints.push({
            units: Math.round(units),
            revenue: revenue,
            totalCost: totalCost,
            profit: revenue - totalCost
        });
    }
    
    // Create or update chart
    const ctx = document.getElementById('breakEvenChart');
    if (!ctx) return;
    
    if (breakEvenChart) {
        breakEvenChart.destroy();
    }
    
    breakEvenChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dataPoints.map(d => d.units),
            datasets: [
                {
                    label: t('revenue') || 'Revenue',
                    data: dataPoints.map(d => d.revenue),
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 3,
                    tension: 0.1,
                    fill: false
                },
                {
                    label: t('totalCost') || 'Total Cost',
                    data: dataPoints.map(d => d.totalCost),
                    borderColor: '#f44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    borderWidth: 3,
                    tension: 0.1,
                    fill: false
                },
                {
                    label: t('fixedCosts') || 'Fixed Costs',
                    data: dataPoints.map(() => fixedCosts),
                    borderColor: '#ff9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                title: {
                    display: true,
                    text: t('breakEvenChart') || 'Break-Even Analysis',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': €' + context.parsed.y.toFixed(2);
                        }
                    }
                },
                annotation: {
                    annotations: {
                        breakEvenLine: {
                            type: 'line',
                            xMin: breakEvenUnits,
                            xMax: breakEvenUnits,
                            borderColor: '#667eea',
                            borderWidth: 3,
                            borderDash: [10, 5],
                            label: {
                                display: true,
                                content: 'Break-Even: ' + Math.ceil(breakEvenUnits) + ' units',
                                position: 'start',
                                backgroundColor: '#667eea',
                                color: 'white',
                                font: { weight: 'bold' }
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: t('units') || 'Units',
                        font: { weight: 'bold' }
                    },
                    ticks: {
                        callback: function(value) {
                            return Math.round(value);
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '€',
                        font: { weight: 'bold' }
                    },
                    ticks: {
                        callback: function(value) {
                            return '€' + value.toLocaleString();
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function calculateBreakEven() {
    const productName = document.getElementById('beProductName').value;
    const sellingPrice = parseFloat(document.getElementById('beSellingPrice').value);
    const variableCost = parseFloat(document.getElementById('beVariableCost').value);
    const fixedCosts = parseFloat(document.getElementById('beFixedCosts').value);
    const targetProfit = parseFloat(document.getElementById('beTargetProfit').value) || 0;
    const expectedSales = parseFloat(document.getElementById('beExpectedSales').value) || 0;
    
    // Update chart
    updateBreakEvenChart();
    
    // Calculate contribution margin
    const contributionMargin = sellingPrice - variableCost;
    const contributionMarginRatio = (contributionMargin / sellingPrice) * 100;
    
    // Calculate break-even point
    const breakEvenUnits = fixedCosts / contributionMargin;
    const breakEvenRevenue = breakEvenUnits * sellingPrice;
    
    // Calculate units needed for target profit
    const unitsForTarget = (fixedCosts + targetProfit) / contributionMargin;
    
    // Calculate margin of safety
    let marginOfSafety = 0;
    let marginOfSafetyPercent = 0;
    let operatingLeverage = 0;
    
    if (expectedSales > 0) {
        marginOfSafety = expectedSales - breakEvenUnits;
        marginOfSafetyPercent = (marginOfSafety / expectedSales) * 100;
        
        // Operating leverage = Contribution Margin / Operating Income
        const totalContribution = contributionMargin * expectedSales;
        const operatingIncome = totalContribution - fixedCosts;
        if (operatingIncome > 0) {
            operatingLeverage = totalContribution / operatingIncome;
        }
    }
    
    const results = {
        productName,
        sellingPrice,
        variableCost,
        fixedCosts,
        targetProfit,
        expectedSales,
        contributionMargin,
        contributionMarginRatio,
        breakEvenUnits,
        breakEvenRevenue,
        unitsForTarget,
        marginOfSafety,
        marginOfSafetyPercent,
        operatingLeverage
    };
    
    displayBreakEvenResults(results);
}

let baseScenario = null;

function displayBreakEvenResults(data) {
    lastBreakEvenResults = data;
    baseScenario = data; // Save base scenario for sensitivity analysis
    
    let html = `
        <div class="results-grid">
            <div class="result-card">
                <h3>💰 ${t('contributionMargin')}</h3>
                <div class="result-item">
                    <span>${t('contributionMargin')}</span>
                    <span>€${data.contributionMargin.toFixed(2)}/${t('unit')}</span>
                </div>
                <div class="result-item">
                    <span>${t('contributionMarginRatio')}</span>
                    <span>${data.contributionMarginRatio.toFixed(2)}%</span>
                </div>
            </div>
            
            <div class="result-card">
                <h3>🎯 Break-Even Point</h3>
                <div class="result-item">
                    <span>${t('breakEvenUnits')}</span>
                    <span>${Math.ceil(data.breakEvenUnits)} ${t('units')}</span>
                </div>
                <div class="result-item">
                    <span>${t('breakEvenRevenue')}</span>
                    <span>€${data.breakEvenRevenue.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="result-card">
                <h3>📈 ${t('targetAnalysis')}</h3>
                <div class="result-item">
                    <span>${t('unitsForTarget')}</span>
                    <span>${Math.ceil(data.unitsForTarget)} ${t('units')}</span>
                </div>
                <div class="result-item">
                    <span>${t('targetProfit')}</span>
                    <span>€${data.targetProfit.toFixed(2)}</span>
                </div>
            </div>
        </div>
    `;
    
    if (data.expectedSales > 0) {
        html += `
            <div class="detail-section">
                <h4>🛡️ ${t('marginOfSafety')}</h4>
                <div class="allocation-detail">${t('expectedSales')}: ${data.expectedSales} ${t('units')}</div>
                <div class="allocation-detail">Break-Even: ${Math.ceil(data.breakEvenUnits)} ${t('units')}</div>
                <div class="allocation-detail" style="font-weight: 600; color: #667eea; margin-top: 10px;">
                    ${t('marginOfSafety')}: ${data.marginOfSafety.toFixed(0)} ${t('units')} (${data.marginOfSafetyPercent.toFixed(2)}%)
                </div>
                <div class="allocation-detail" style="font-weight: 600; color: #667eea; margin-top: 10px;">
                    ${t('operatingLeverage')}: ${data.operatingLeverage.toFixed(2)}
                </div>
            </div>
        `;
    }
    
    html += `
        <div class="total-banner">
            ${data.productName.toUpperCase()} | Break-Even: ${Math.ceil(data.breakEvenUnits)} ${t('units')} | €${data.breakEvenRevenue.toFixed(2)}
        </div>
        
        <button class="procedimento-toggle" onclick="toggleProcedimento('breakeven')">
            📖 <span data-i18n="showProcedimento">${t('showProcedimento') || 'Mostra Procedimento'}</span>
        </button>
        <div id="breakeven-procedimento" class="procedimento-content">
            ${generateBreakEvenProcedimento(data)}
        </div>
    `;
    
    document.getElementById('breakEvenResultsContent').innerHTML = html;
    document.getElementById('breakEvenResults').style.display = 'block';
    document.getElementById('sensitivitySection').style.display = 'block';
    
    // Reset sliders
    document.getElementById('fcSlider').value = 0;
    document.getElementById('vcSlider').value = 0;
    document.getElementById('priceSlider').value = 0;
    document.getElementById('fcValue').textContent = '0%';
    document.getElementById('vcValue').textContent = '0%';
    document.getElementById('priceValue').textContent = '0%';
    
    // Initialize sensitivity analysis
    updateSensitivity();
    
    document.getElementById('breakEvenResults').scrollIntoView({ behavior: 'smooth' });
}

function generateBreakEvenProcedimento(data) {
    let html = `<h3 style="color: #667eea; margin-bottom: 20px;">📚 ${t('procedimento') || 'Procedimento di Calcolo'}</h3>`;
    
    // Step 1: Input Data
    html += `
        <div class="step">
            <div class="step-title">1️⃣ ${t('inputData') || 'Dati di Input'}</div>
            <div class="calculation">
                ${t('sellingPrice')}: €${data.sellingPrice.toFixed(2)}<br>
                ${t('variableCostPerUnit')}: €${data.variableCost.toFixed(2)}<br>
                ${t('fixedCosts')}: €${data.fixedCosts.toFixed(2)}
            </div>
        </div>
    `;
    
    // Step 2: Contribution Margin
    html += `
        <div class="step">
            <div class="step-title">2️⃣ ${t('contributionMargin')}</div>
            <div class="formula">
                CM = ${t('sellingPrice')} - ${t('variableCostPerUnit')}<br>
                CM = €${data.sellingPrice.toFixed(2)} - €${data.variableCost.toFixed(2)} = €${data.contributionMargin.toFixed(2)}
            </div>
            <div class="calculation">
                ${t('contributionMarginRatio')}: (€${data.contributionMargin.toFixed(2)} ÷ €${data.sellingPrice.toFixed(2)}) × 100 = ${data.contributionMarginRatio.toFixed(2)}%
            </div>
        </div>
    `;
    
    // Step 3: Break-Even Point
    html += `
        <div class="step">
            <div class="step-title">3️⃣ Break-Even Point</div>
            <div class="formula">
                BEP (${t('units')}) = ${t('fixedCosts')} ÷ ${t('contributionMargin')}<br>
                BEP = €${data.fixedCosts.toFixed(2)} ÷ €${data.contributionMargin.toFixed(2)} = ${data.breakEvenUnits.toFixed(2)} ${t('units')}
            </div>
            <div class="formula">
                BEP (${t('revenue')}) = BEP ${t('units')} × ${t('sellingPrice')}<br>
                BEP = ${Math.ceil(data.breakEvenUnits)} × €${data.sellingPrice.toFixed(2)} = €${data.breakEvenRevenue.toFixed(2)}
            </div>
        </div>
    `;
    
    // Step 4: Target Profit
    if (data.targetProfit > 0) {
        html += `
            <div class="step">
                <div class="step-title">4️⃣ ${t('unitsForTarget')}</div>
                <div class="formula">
                    ${t('units')} = (${t('fixedCosts')} + ${t('targetProfit')}) ÷ ${t('contributionMargin')}<br>
                    ${t('units')} = (€${data.fixedCosts.toFixed(2)} + €${data.targetProfit.toFixed(2)}) ÷ €${data.contributionMargin.toFixed(2)}<br>
                    = ${Math.ceil(data.unitsForTarget)} ${t('units')}
                </div>
            </div>
        `;
    }
    
    // Step 5: Margin of Safety
    if (data.expectedSales > 0) {
        html += `
            <div class="step">
                <div class="step-title">5️⃣ ${t('marginOfSafety')}</div>
                <div class="formula">
                    MoS = ${t('expectedSales')} - BEP<br>
                    MoS = ${data.expectedSales} - ${Math.ceil(data.breakEvenUnits)} = ${data.marginOfSafety.toFixed(0)} ${t('units')}
                </div>
                <div class="calculation">
                    MoS % = (${data.marginOfSafety.toFixed(0)} ÷ ${data.expectedSales}) × 100 = ${data.marginOfSafetyPercent.toFixed(2)}%
                </div>
                <div class="formula">
                    ${t('operatingLeverage')} = ${data.operatingLeverage.toFixed(2)}
                </div>
            </div>
        `;
    }
    
    return html;
}

function updateSensitivity() {
    if (!baseScenario) return;
    
    const fcChange = parseFloat(document.getElementById('fcSlider').value);
    const vcChange = parseFloat(document.getElementById('vcSlider').value);
    const priceChange = parseFloat(document.getElementById('priceSlider').value);
    
    // Update slider value displays
    document.getElementById('fcValue').textContent = (fcChange > 0 ? '+' : '') + fcChange + '%';
    document.getElementById('vcValue').textContent = (vcChange > 0 ? '+' : '') + vcChange + '%';
    document.getElementById('priceValue').textContent = (priceChange > 0 ? '+' : '') + priceChange + '%';
    
    // Calculate new values
    const newFixedCosts = baseScenario.fixedCosts * (1 + fcChange / 100);
    const newVariableCost = baseScenario.variableCost * (1 + vcChange / 100);
    const newSellingPrice = baseScenario.sellingPrice * (1 + priceChange / 100);
    
    // Calculate new break-even
    const newContributionMargin = newSellingPrice - newVariableCost;
    const newBreakEvenUnits = newFixedCosts / newContributionMargin;
    const newBreakEvenRevenue = newBreakEvenUnits * newSellingPrice;
    
    // Calculate margin of safety if expected sales exist
    let newMarginOfSafety = 0;
    let newMarginOfSafetyPercent = 0;
    let mosChange = 0;
    
    if (baseScenario.expectedSales > 0) {
        newMarginOfSafety = baseScenario.expectedSales - newBreakEvenUnits;
        newMarginOfSafetyPercent = (newMarginOfSafety / baseScenario.expectedSales) * 100;
        
        if (baseScenario.marginOfSafety > 0) {
            mosChange = ((newMarginOfSafety - baseScenario.marginOfSafety) / baseScenario.marginOfSafety * 100);
        }
    }
    
    // Calculate changes
    const bepChange = ((newBreakEvenUnits - baseScenario.breakEvenUnits) / baseScenario.breakEvenUnits * 100);
    const cmChange = ((newContributionMargin - baseScenario.contributionMargin) / baseScenario.contributionMargin * 100);
    
    // Interpretation
    let interpretation = '';
    if (Math.abs(bepChange) < 1) {
        interpretation = t('sensitivityLow');
    } else if (Math.abs(bepChange) < 10) {
        interpretation = t('sensitivityModerate');
    } else if (Math.abs(bepChange) < 25) {
        interpretation = t('sensitivityHigh');
    } else {
        interpretation = t('sensitivityVeryHigh');
    }
    
    if (bepChange > 0) {
        interpretation += '. ' + t('bepIncreased') + '.';
    } else if (bepChange < 0) {
        interpretation += '. ' + t('bepDecreased') + '.';
    }
    
    // Add margin of safety interpretation if applicable
    if (baseScenario.expectedSales > 0) {
        interpretation += '<br><br><strong>' + t('marginOfSafety') + ':</strong> ';
        if (mosChange > 10) {
            interpretation += t('mosImproved') || 'Il margine di sicurezza è migliorato significativamente. L\'azienda ha più cuscinetto prima di andare in perdita.';
        } else if (mosChange > 0) {
            interpretation += t('mosSlightlyImproved') || 'Il margine di sicurezza è leggermente migliorato.';
        } else if (mosChange > -10) {
            interpretation += t('mosSlightlyWorse') || 'Il margine di sicurezza è leggermente peggiorato.';
        } else {
            interpretation += t('mosWorse') || 'Il margine di sicurezza è peggiorato significativamente. L\'azienda è più vicina al punto di pareggio e quindi più a rischio.';
        }
        
        if (newMarginOfSafetyPercent < 10) {
            interpretation += ' ⚠️ ' + (t('mosWarning') || 'Attenzione: margine molto basso!');
        } else if (newMarginOfSafetyPercent > 30) {
            interpretation += ' ✅ ' + (t('mosGood') || 'Margine di sicurezza confortevole.');
        }
    }
    
    // Display results in table
    const html = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; background: white; border-radius: 8px; overflow: hidden;">
                <thead>
                    <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                        <th style="padding: 12px; text-align: left;">${t('scenario') || 'Scenario'}</th>
                        <th style="padding: 12px; text-align: right;">${t('fixedCosts')}</th>
                        <th style="padding: 12px; text-align: right;">${t('variableCostPerUnit')}</th>
                        <th style="padding: 12px; text-align: right;">${t('sellingPrice')}</th>
                        <th style="padding: 12px; text-align: right;">${t('contributionMargin')}</th>
                        <th style="padding: 12px; text-align: right;">BEP (${t('units')})</th>
                        ${baseScenario.expectedSales > 0 ? `<th style="padding: 12px; text-align: right;">${t('marginOfSafety')}</th>` : ''}
                    </tr>
                </thead>
                <tbody>
                    <tr style="background: #f8f9fa;">
                        <td style="padding: 12px; font-weight: 600;">${t('baseScenario') || 'Base'}</td>
                        <td style="padding: 12px; text-align: right;">€${baseScenario.fixedCosts.toFixed(2)}</td>
                        <td style="padding: 12px; text-align: right;">€${baseScenario.variableCost.toFixed(2)}</td>
                        <td style="padding: 12px; text-align: right;">€${baseScenario.sellingPrice.toFixed(2)}</td>
                        <td style="padding: 12px; text-align: right;">€${baseScenario.contributionMargin.toFixed(2)}</td>
                        <td style="padding: 12px; text-align: right;">${Math.ceil(baseScenario.breakEvenUnits)}</td>
                        ${baseScenario.expectedSales > 0 ? `<td style="padding: 12px; text-align: right;">${baseScenario.marginOfSafety.toFixed(0)} (${baseScenario.marginOfSafetyPercent.toFixed(1)}%)</td>` : ''}
                    </tr>
                    <tr style="background: white;">
                        <td style="padding: 12px; font-weight: 600; color: #667eea;">${t('newScenario') || 'New'}</td>
                        <td style="padding: 12px; text-align: right; color: ${fcChange !== 0 ? '#667eea' : 'inherit'}; font-weight: ${fcChange !== 0 ? '600' : 'normal'};">
                            €${newFixedCosts.toFixed(2)}
                            ${fcChange !== 0 ? '<br><small style="color: ' + (fcChange > 0 ? '#f44336' : '#4caf50') + ';">(' + (fcChange > 0 ? '+' : '') + fcChange + '%)</small>' : ''}
                        </td>
                        <td style="padding: 12px; text-align: right; color: ${vcChange !== 0 ? '#667eea' : 'inherit'}; font-weight: ${vcChange !== 0 ? '600' : 'normal'};">
                            €${newVariableCost.toFixed(2)}
                            ${vcChange !== 0 ? '<br><small style="color: ' + (vcChange > 0 ? '#f44336' : '#4caf50') + ';">(' + (vcChange > 0 ? '+' : '') + vcChange + '%)</small>' : ''}
                        </td>
                        <td style="padding: 12px; text-align: right; color: ${priceChange !== 0 ? '#667eea' : 'inherit'}; font-weight: ${priceChange !== 0 ? '600' : 'normal'};">
                            €${newSellingPrice.toFixed(2)}
                            ${priceChange !== 0 ? '<br><small style="color: ' + (priceChange > 0 ? '#4caf50' : '#f44336') + ';">(' + (priceChange > 0 ? '+' : '') + priceChange + '%)</small>' : ''}
                        </td>
                        <td style="padding: 12px; text-align: right; font-weight: 600;">
                            €${newContributionMargin.toFixed(2)}
                            <br><small style="color: ${cmChange > 0 ? '#4caf50' : '#f44336'};">(${cmChange > 0 ? '+' : ''}${cmChange.toFixed(1)}%)</small>
                        </td>
                        <td style="padding: 12px; text-align: right; font-weight: 600; color: #667eea;">
                            ${Math.ceil(newBreakEvenUnits)}
                            <br><small style="color: ${bepChange < 0 ? '#4caf50' : '#f44336'};">(${bepChange > 0 ? '+' : ''}${bepChange.toFixed(1)}%)</small>
                        </td>
                        ${baseScenario.expectedSales > 0 ? `
                        <td style="padding: 12px; text-align: right; font-weight: 600;">
                            ${newMarginOfSafety.toFixed(0)} (${newMarginOfSafetyPercent.toFixed(1)}%)
                            <br><small style="color: ${mosChange > 0 ? '#4caf50' : '#f44336'};">(${mosChange > 0 ? '+' : ''}${mosChange.toFixed(1)}%)</small>
                        </td>` : ''}
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="detail-section" style="margin-top: 20px; background: #e3f2fd; border-left-color: #2196f3;">
            <h4>📊 ${t('interpretation')}</h4>
            <div class="allocation-detail" style="font-size: 1.05em; line-height: 1.6;">
                ${interpretation}
            </div>
        </div>
    `;
    
    document.getElementById('sensitivityResults').innerHTML = html;
}

function toggleProcedimento(module) {
    const element = document.getElementById(module + '-procedimento');
    if (element) {
        element.classList.toggle('active');
    }
}

// Initialize
init();

// Initialize break-even chart when page loads
setTimeout(() => {
    if (document.getElementById('breakEvenChart')) {
        updateBreakEvenChart();
    }
}, 500);

// Listen for language changes
window.addEventListener('languageChanged', () => {
    // Regenerate reciprocal results if they exist
    if (lastReciprocalResults) {
        displayReciprocalResults(
            lastReciprocalResults.data,
            lastReciprocalResults.support_depts,
            lastReciprocalResults.production_depts,
            lastReciprocalResults.allocation_bases
        );
    }
    
    // Regenerate WIP results if they exist
    if (lastWIPResults) {
        displayWIPResults(lastWIPResults);
    }
    
    // Regenerate Break-Even results if they exist
    if (lastBreakEvenResults) {
        displayBreakEvenResults(lastBreakEvenResults);
    }
    
    // Update break-even chart with new language
    if (breakEvenChart) {
        updateBreakEvenChart();
    }
    
    // Update sensitivity analysis with new language
    if (baseScenario && document.getElementById('sensitivitySection').style.display !== 'none') {
        updateSensitivity();
    }
});
