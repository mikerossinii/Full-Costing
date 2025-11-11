// ============================================================================
// EXPORT FUNCTIONS - PDF & EXCEL (Screenshot-based)
// ============================================================================

// Export entire page to PDF with visual styling
async function exportPageToPDF(pageId) {
    const element = document.getElementById(pageId);
    if (!element) {
        alert('Pagina non trovata');
        return;
    }
    
    // Show loading indicator
    const originalCursor = document.body.style.cursor;
    document.body.style.cursor = 'wait';
    
    try {
        // Temporarily hide export buttons for cleaner screenshot
        const exportButtons = element.querySelectorAll('.export-buttons');
        exportButtons.forEach(btn => btn.style.display = 'none');
        
        // Capture the page as canvas
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#f5f7fa',
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight
        });
        
        // Restore export buttons
        exportButtons.forEach(btn => btn.style.display = '');
        
        // Convert canvas to PDF
        const { jsPDF } = window.jspdf;
        const imgData = canvas.toDataURL('image/png');
        
        // Calculate PDF dimensions
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        
        const doc = new jsPDF('p', 'mm', 'a4');
        let position = 0;
        
        // Add image to PDF (handle multiple pages if needed)
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            doc.addPage();
            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        // Get page title for filename
        const title = element.querySelector('h1')?.textContent.trim() || 'export';
        const filename = title.toLowerCase().replace(/\s+/g, '-') + '-' + new Date().toISOString().split('T')[0] + '.pdf';
        
        doc.save(filename);
        
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        alert('Errore durante l\'esportazione PDF. Riprova.');
    } finally {
        document.body.style.cursor = originalCursor;
    }
}

// Export page data to Excel
async function exportPageToExcel(pageId) {
    const element = document.getElementById(pageId);
    if (!element) {
        alert('Pagina non trovata');
        return;
    }
    
    try {
        const title = element.querySelector('h1')?.textContent.trim() || 'Export';
        const data = [];
        
        // Add title
        data.push([title]);
        data.push(['Date: ' + new Date().toLocaleDateString()]);
        data.push([]);
        
        // Extract data from sections
        const sections = element.querySelectorAll('.section');
        sections.forEach(section => {
            const sectionTitle = section.querySelector('.section-title')?.textContent.trim();
            if (sectionTitle) {
                data.push([sectionTitle]);
                data.push([]);
            }
            
            // Extract input fields
            const inputs = section.querySelectorAll('.cost-input');
            inputs.forEach(input => {
                const label = input.querySelector('label')?.textContent.trim();
                const value = input.querySelector('input, select')?.value;
                if (label && value) {
                    data.push([label, value]);
                }
            });
            
            // Extract tables
            const tables = section.querySelectorAll('table');
            tables.forEach(table => {
                const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
                if (headers.length > 0) {
                    data.push([]);
                    data.push(headers);
                }
                
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const cells = Array.from(row.querySelectorAll('td')).map(td => {
                        const input = td.querySelector('input');
                        return input ? input.value : td.textContent.trim();
                    });
                    if (cells.length > 0) {
                        data.push(cells);
                    }
                });
            });
            
            data.push([]);
        });
        
        // Extract results
        const results = element.querySelectorAll('.result-card');
        results.forEach(card => {
            const cardTitle = card.querySelector('h3')?.textContent.trim();
            if (cardTitle) {
                data.push([cardTitle]);
            }
            
            const items = card.querySelectorAll('.result-item');
            items.forEach(item => {
                const spans = item.querySelectorAll('span');
                if (spans.length >= 2) {
                    data.push([spans[0].textContent.trim(), spans[1].textContent.trim()]);
                }
            });
            data.push([]);
        });
        
        // Extract detail sections
        const details = element.querySelectorAll('.detail-section');
        details.forEach(detail => {
            const detailTitle = detail.querySelector('h4')?.textContent.trim();
            if (detailTitle) {
                data.push([detailTitle]);
            }
            
            const allocations = detail.querySelectorAll('.allocation-detail');
            allocations.forEach(alloc => {
                data.push([alloc.textContent.trim()]);
            });
            data.push([]);
        });
        
        // Extract total banner
        const banner = element.querySelector('.total-banner');
        if (banner) {
            data.push([]);
            data.push([banner.textContent.trim()]);
        }
        
        // Create workbook and save
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        
        const filename = title.toLowerCase().replace(/\s+/g, '-') + '-' + new Date().toISOString().split('T')[0] + '.xlsx';
        XLSX.writeFile(wb, filename);
        
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('Errore durante l\'esportazione Excel. Riprova.');
    }
}
