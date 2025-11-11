// ============================================================================
// EXPORT FUNCTIONS - PDF & EXCEL
// ============================================================================

// ============================================================================
// RECIPROCAL METHOD EXPORT
// ============================================================================

function exportReciprocalToPDF() {
    if (!lastReciprocalResults) {
        alert('Nessun risultato da esportare. Calcola prima i risultati.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const data = lastReciprocalResults.data;
    const support_depts = lastReciprocalResults.support_depts;
    const production_depts = lastReciprocalResults.production_depts;
    
    // Title
    doc.setFontSize(18);
    doc.text('Reciprocal Method Analysis', 14, 20);
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString(), 14, 27);
    
    // Support Departments Table
    doc.setFontSize(14);
    doc.text('Support Departments', 14, 40);
    
    const supportData = [];
    Object.entries(data.support_costs).forEach(([dept, cost]) => {
        supportData.push([
            dept,
            '€' + support_depts[dept].toFixed(2),
            '€' + cost.toFixed(2),
            '€' + data.support_rates[dept].toFixed(4) + '/unit'
        ]);
    });
    
    doc.autoTable({
        startY: 45,
        head: [['Department', 'Direct Cost', 'Total Cost', 'Cost Rate']],
        body: supportData,
        theme: 'grid'
    });
    
    // Production Departments Table
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Production Departments', 14, finalY);
    
    const productionData = [];
    Object.entries(data.production_costs).forEach(([dept, cost]) => {
        const direct = production_depts[dept];
        productionData.push([
            dept,
            '€' + direct.toFixed(2),
            '€' + (cost - direct).toFixed(2),
            '€' + cost.toFixed(2)
        ]);
    });
    
    doc.autoTable({
        startY: finalY + 5,
        head: [['Department', 'Direct Cost', 'Allocated', 'Total Cost']],
        body: productionData,
        theme: 'grid'
    });
    
    // Total
    const finalY2 = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL: €' + data.total.toFixed(2), 14, finalY2);
    
    doc.save('reciprocal-method-analysis.pdf');
}

function exportReciprocalToExcel() {
    if (!lastReciprocalResults) {
        alert('Nessun risultato da esportare. Calcola prima i risultati.');
        return;
    }
    
    const data = lastReciprocalResults.data;
    const support_depts = lastReciprocalResults.support_depts;
    const production_depts = lastReciprocalResults.production_depts;
    
    // Support Departments Sheet
    const supportData = [
        ['Support Departments'],
        ['Department', 'Direct Cost', 'Total Cost', 'Cost Rate', 'Total Units'],
        ...Object.entries(data.support_costs).map(([dept, cost]) => [
            dept,
            support_depts[dept],
            cost,
            data.support_rates[dept],
            data.support_total_units[dept]
        ])
    ];
    
    // Production Departments Sheet
    const productionData = [
        [],
        ['Production Departments'],
        ['Department', 'Direct Cost', 'Allocated', 'Total Cost'],
        ...Object.entries(data.production_costs).map(([dept, cost]) => [
            dept,
            production_depts[dept],
            cost - production_depts[dept],
            cost
        ]),
        [],
        ['TOTAL', '', '', data.total]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([...supportData, ...productionData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reciprocal Method');
    
    XLSX.writeFile(wb, 'reciprocal-method-analysis.xlsx');
}

// ============================================================================
// WIP VALUATION EXPORT
// ============================================================================

function exportWIPToPDF() {
    if (!lastWIPResults) {
        alert('Nessun risultato da esportare. Calcola prima i risultati.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const data = lastWIPResults;
    
    // Title
    doc.setFontSize(18);
    doc.text('WIP Valuation Analysis', 14, 20);
    doc.setFontSize(10);
    doc.text('Method: ' + data.method, 14, 27);
    doc.text(new Date().toLocaleDateString(), 14, 32);
    
    // Physical Flow
    doc.setFontSize(14);
    doc.text('Physical Flow', 14, 45);
    
    const physicalData = [
        ['Opening WIP', data.physical_flow.opening_wip + ' units'],
        ['Started', data.physical_flow.started + ' units'],
        ['Completed', data.physical_flow.completed + ' units'],
        ['Ending WIP', data.physical_flow.ending_wip + ' units']
    ];
    
    doc.autoTable({
        startY: 50,
        body: physicalData,
        theme: 'grid'
    });
    
    // Equivalent Units
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Equivalent Units', 14, finalY);
    
    const euData = [
        ['Materials', data.equivalent_units.materials.toFixed(2) + ' EU'],
        ['Conversion', data.equivalent_units.conversion.toFixed(2) + ' EU']
    ];
    
    doc.autoTable({
        startY: finalY + 5,
        body: euData,
        theme: 'grid'
    });
    
    // Cost per EU
    const finalY2 = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Cost per Equivalent Unit', 14, finalY2);
    
    const costData = [
        ['Materials', '€' + data.cost_per_eu.materials.toFixed(4) + '/EU'],
        ['Conversion', '€' + data.cost_per_eu.conversion.toFixed(4) + '/EU'],
        ['Total', '€' + data.cost_per_eu.total.toFixed(4) + '/EU']
    ];
    
    doc.autoTable({
        startY: finalY2 + 5,
        body: costData,
        theme: 'grid'
    });
    
    // Valuation
    const finalY3 = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Valuation', 14, finalY3);
    
    const valuationData = [
        ['Finished Goods', '€' + data.valuation.finished_goods.toFixed(2)],
        ['Ending WIP - Materials', '€' + data.valuation.ending_wip_materials.toFixed(2)],
        ['Ending WIP - Conversion', '€' + data.valuation.ending_wip_conversion.toFixed(2)],
        ['Ending WIP - Total', '€' + data.valuation.ending_wip_total.toFixed(2)]
    ];
    
    doc.autoTable({
        startY: finalY3 + 5,
        body: valuationData,
        theme: 'grid'
    });
    
    // Total
    const finalY4 = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL COSTS: €' + data.total_costs.toFixed(2), 14, finalY4);
    
    doc.save('wip-valuation-analysis.pdf');
}

function exportWIPToExcel() {
    if (!lastWIPResults) {
        alert('Nessun risultato da esportare. Calcola prima i risultati.');
        return;
    }
    
    const data = lastWIPResults;
    
    const excelData = [
        ['WIP Valuation Analysis'],
        ['Method:', data.method],
        ['Date:', new Date().toLocaleDateString()],
        [],
        ['Physical Flow'],
        ['Opening WIP', data.physical_flow.opening_wip],
        ['Started', data.physical_flow.started],
        ['Completed', data.physical_flow.completed],
        ['Ending WIP', data.physical_flow.ending_wip],
        [],
        ['Equivalent Units'],
        ['Materials', data.equivalent_units.materials],
        ['Conversion', data.equivalent_units.conversion],
        [],
        ['Cost per Equivalent Unit'],
        ['Materials', data.cost_per_eu.materials],
        ['Conversion', data.cost_per_eu.conversion],
        ['Total', data.cost_per_eu.total],
        [],
        ['Valuation'],
        ['Finished Goods', data.valuation.finished_goods],
        ['Ending WIP - Materials', data.valuation.ending_wip_materials],
        ['Ending WIP - Conversion', data.valuation.ending_wip_conversion],
        ['Ending WIP - Total', data.valuation.ending_wip_total],
        [],
        ['TOTAL COSTS', data.total_costs]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'WIP Valuation');
    
    XLSX.writeFile(wb, 'wip-valuation-analysis.xlsx');
}

// ============================================================================
// BREAK-EVEN ANALYSIS EXPORT
// ============================================================================

function exportBreakEvenToPDF() {
    if (!lastBreakEvenResults) {
        alert('Nessun risultato da esportare. Calcola prima i risultati.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const data = lastBreakEvenResults;
    
    // Title
    doc.setFontSize(18);
    doc.text('Break-Even Analysis', 14, 20);
    doc.setFontSize(12);
    doc.text('Product: ' + data.productName, 14, 28);
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString(), 14, 34);
    
    // Input Data
    doc.setFontSize(14);
    doc.text('Input Data', 14, 47);
    
    const inputData = [
        ['Selling Price', '€' + data.sellingPrice.toFixed(2)],
        ['Variable Cost per Unit', '€' + data.variableCost.toFixed(2)],
        ['Fixed Costs', '€' + data.fixedCosts.toFixed(2)],
        ['Target Profit', '€' + data.targetProfit.toFixed(2)],
        ['Expected Sales', data.expectedSales + ' units']
    ];
    
    doc.autoTable({
        startY: 52,
        body: inputData,
        theme: 'grid'
    });
    
    // Results
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Results', 14, finalY);
    
    const resultsData = [
        ['Contribution Margin', '€' + data.contributionMargin.toFixed(2) + '/unit'],
        ['Contribution Margin Ratio', data.contributionMarginRatio.toFixed(2) + '%'],
        ['Break-Even Point (Units)', Math.ceil(data.breakEvenUnits) + ' units'],
        ['Break-Even Point (Revenue)', '€' + data.breakEvenRevenue.toFixed(2)],
        ['Units for Target Profit', Math.ceil(data.unitsForTarget) + ' units']
    ];
    
    if (data.expectedSales > 0) {
        resultsData.push(
            ['Margin of Safety', data.marginOfSafety.toFixed(0) + ' units (' + data.marginOfSafetyPercent.toFixed(2) + '%)'],
            ['Operating Leverage', data.operatingLeverage.toFixed(2)]
        );
    }
    
    doc.autoTable({
        startY: finalY + 5,
        body: resultsData,
        theme: 'grid'
    });
    
    doc.save('break-even-analysis.pdf');
}

function exportBreakEvenToExcel() {
    if (!lastBreakEvenResults) {
        alert('Nessun risultato da esportare. Calcola prima i risultati.');
        return;
    }
    
    const data = lastBreakEvenResults;
    
    const excelData = [
        ['Break-Even Analysis'],
        ['Product:', data.productName],
        ['Date:', new Date().toLocaleDateString()],
        [],
        ['Input Data'],
        ['Selling Price', data.sellingPrice],
        ['Variable Cost per Unit', data.variableCost],
        ['Fixed Costs', data.fixedCosts],
        ['Target Profit', data.targetProfit],
        ['Expected Sales', data.expectedSales],
        [],
        ['Results'],
        ['Contribution Margin', data.contributionMargin],
        ['Contribution Margin Ratio (%)', data.contributionMarginRatio],
        ['Break-Even Point (Units)', Math.ceil(data.breakEvenUnits)],
        ['Break-Even Point (Revenue)', data.breakEvenRevenue],
        ['Units for Target Profit', Math.ceil(data.unitsForTarget)]
    ];
    
    if (data.expectedSales > 0) {
        excelData.push(
            ['Margin of Safety (Units)', data.marginOfSafety],
            ['Margin of Safety (%)', data.marginOfSafetyPercent],
            ['Operating Leverage', data.operatingLeverage]
        );
    }
    
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Break-Even Analysis');
    
    XLSX.writeFile(wb, 'break-even-analysis.xlsx');
}
