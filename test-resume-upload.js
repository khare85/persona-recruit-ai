const fs = require('fs');
const path = require('path');

// Create a simple test PDF file
const testPdf = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test Resume) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000206 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n287\n%%EOF'
);

// Write test PDF
fs.writeFileSync(path.join(__dirname, 'test-resume.pdf'), testPdf);

console.log('Test resume PDF created successfully');
console.log('Now you can test the resume upload functionality in the browser');
console.log('1. Go to the candidate dashboard');
console.log('2. Upload the test-resume.pdf file');
console.log('3. Check browser console for debugging logs');