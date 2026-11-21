// src/utils/excelExport.js
// Standalone, zero-dependency XLSX & CSV generator for browser environments.

function getCrc32Table() {
  if (getCrc32Table.table) return getCrc32Table.table;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  getCrc32Table.table = table;
  return table;
}

function crc32(bytes) {
  const table = getCrc32Table();
  let crc = 0 ^ (-1);
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

const textEncoder = new TextEncoder();

/**
 * Creates a valid uncompressed (Store mode 0) PKZIP archive in pure JavaScript.
 * Supported natively by Microsoft Excel, Apple Numbers, Google Drive, and LibreOffice.
 */
function createZipUint8Array(files) {
  const fileEntries = files.map((f) => {
    const nameBytes = textEncoder.encode(f.name);
    const contentBytes = typeof f.content === 'string' ? textEncoder.encode(f.content) : f.content;
    const crc = crc32(contentBytes);
    return { nameBytes, contentBytes, crc, size: contentBytes.length };
  });

  let cdStart = 0;
  fileEntries.forEach((f) => {
    cdStart += 30 + f.nameBytes.length + f.size;
  });

  let totalSize = cdStart;
  fileEntries.forEach((f) => {
    totalSize += 46 + f.nameBytes.length;
  });
  totalSize += 22; // EOCD

  const out = new Uint8Array(totalSize);
  const view = new DataView(out.buffer);

  let currentLocalOffset = 0;
  let currentCdOffset = cdStart;

  fileEntries.forEach((f) => {
    // Local File Header (30 + nameLen + size)
    view.setUint32(currentLocalOffset, 0x04034b50, true);
    view.setUint16(currentLocalOffset + 4, 20, true);
    view.setUint16(currentLocalOffset + 6, 0, true);
    view.setUint16(currentLocalOffset + 8, 0, true); // 0 = uncompressed store
    view.setUint16(currentLocalOffset + 10, 0, true);
    view.setUint16(currentLocalOffset + 12, 0, true);
    view.setUint32(currentLocalOffset + 14, f.crc, true);
    view.setUint32(currentLocalOffset + 18, f.size, true);
    view.setUint32(currentLocalOffset + 22, f.size, true);
    view.setUint16(currentLocalOffset + 26, f.nameBytes.length, true);
    view.setUint16(currentLocalOffset + 28, 0, true);
    out.set(f.nameBytes, currentLocalOffset + 30);
    out.set(f.contentBytes, currentLocalOffset + 30 + f.nameBytes.length);

    // Central Directory Header (46 + nameLen)
    view.setUint32(currentCdOffset, 0x02014b50, true);
    view.setUint16(currentCdOffset + 4, 20, true);
    view.setUint16(currentCdOffset + 6, 20, true);
    view.setUint16(currentCdOffset + 8, 0, true);
    view.setUint16(currentCdOffset + 10, 0, true);
    view.setUint16(currentCdOffset + 12, 0, true);
    view.setUint16(currentCdOffset + 14, 0, true);
    view.setUint32(currentCdOffset + 16, f.crc, true);
    view.setUint32(currentCdOffset + 20, f.size, true);
    view.setUint32(currentCdOffset + 24, f.size, true);
    view.setUint16(currentCdOffset + 28, f.nameBytes.length, true);
    view.setUint16(currentCdOffset + 30, 0, true);
    view.setUint16(currentCdOffset + 32, 0, true);
    view.setUint16(currentCdOffset + 34, 0, true);
    view.setUint16(currentCdOffset + 36, 0, true);
    view.setUint32(currentCdOffset + 38, 0, true);
    view.setUint32(currentCdOffset + 42, currentLocalOffset, true);
    out.set(f.nameBytes, currentCdOffset + 46);

    currentLocalOffset += 30 + f.nameBytes.length + f.size;
    currentCdOffset += 46 + f.nameBytes.length;
  });

  const cdSize = currentCdOffset - cdStart;

  // End of Central Directory Record (22 bytes)
  view.setUint32(currentCdOffset, 0x06054b50, true);
  view.setUint16(currentCdOffset + 4, 0, true);
  view.setUint16(currentCdOffset + 6, 0, true);
  view.setUint16(currentCdOffset + 8, fileEntries.length, true);
  view.setUint16(currentCdOffset + 10, fileEntries.length, true);
  view.setUint32(currentCdOffset + 12, cdSize, true);
  view.setUint32(currentCdOffset + 16, cdStart, true);
  view.setUint16(currentCdOffset + 20, 0, true);

  return out;
}

function escapeXml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Builds a valid .xlsx spreadsheet binary.
 * @param {Array<{ collegeName: string, collegeId: string, deptName: string, deptCode: string, loginId: string, password: string }>} rows
 * @returns {Blob}
 */
export function buildXlsxBlob(rows) {
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Department Credentials" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><name val="Calibri"/><sz val="11"/></font>
    <font><b/><color rgb="FF000000"/><name val="Calibri"/><sz val="11"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF5F23B"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/></border>
    <border>
      <left style="thin"><color rgb="FFCCCCCC"/></left>
      <right style="thin"><color rgb="FFCCCCCC"/></left>
      <top style="thin"><color rgb="FFCCCCCC"/></top>
      <bottom style="thin"><color rgb="FFCCCCCC"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
  </cellXfs>
</styleSheet>`;

  // Build Sheet Rows
  let sheetRowsXml = '';

  // Row 1: Styled Header
  sheetRowsXml += `<row r="1" ht="24" customHeight="1">
    <c r="A1" t="inlineStr" s="1"><is><t>College Name</t></is></c>
    <c r="B1" t="inlineStr" s="1"><is><t>College ID</t></is></c>
    <c r="C1" t="inlineStr" s="1"><is><t>Department Name</t></is></c>
    <c r="D1" t="inlineStr" s="1"><is><t>Department Code</t></is></c>
    <c r="E1" t="inlineStr" s="1"><is><t>Department Login ID</t></is></c>
    <c r="F1" t="inlineStr" s="1"><is><t>Password</t></is></c>
  </row>`;

  rows.forEach((r, idx) => {
    const rowNum = idx + 2;
    sheetRowsXml += `<row r="${rowNum}" ht="20" customHeight="1">
      <c r="A${rowNum}" t="inlineStr" s="2"><is><t>${escapeXml(r.collegeName)}</t></is></c>
      <c r="B${rowNum}" t="inlineStr" s="2"><is><t>${escapeXml(r.collegeId)}</t></is></c>
      <c r="C${rowNum}" t="inlineStr" s="2"><is><t>${escapeXml(r.deptName)}</t></is></c>
      <c r="D${rowNum}" t="inlineStr" s="2"><is><t>${escapeXml(r.deptCode)}</t></is></c>
      <c r="E${rowNum}" t="inlineStr" s="2"><is><t>${escapeXml(r.loginId)}</t></is></c>
      <c r="F${rowNum}" t="inlineStr" s="2"><is><t>${escapeXml(r.password)}</t></is></c>
    </row>`;
  });

  const sheet1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="28" customWidth="1"/>
    <col min="2" max="2" width="18" customWidth="1"/>
    <col min="3" max="3" width="28" customWidth="1"/>
    <col min="4" max="4" width="18" customWidth="1"/>
    <col min="5" max="5" width="24" customWidth="1"/>
    <col min="6" max="6" width="22" customWidth="1"/>
  </cols>
  <sheetData>
    ${sheetRowsXml}
  </sheetData>
</worksheet>`;

  const files = [
    { name: '[Content_Types].xml', content: contentTypesXml },
    { name: '_rels/.rels', content: relsXml },
    { name: 'xl/workbook.xml', content: workbookXml },
    { name: 'xl/_rels/workbook.xml.rels', content: workbookRelsXml },
    { name: 'xl/styles.xml', content: stylesXml },
    { name: 'xl/worksheets/sheet1.xml', content: sheet1Xml }
  ];

  const zipBytes = createZipUint8Array(files);
  return new Blob([zipBytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

/**
 * Builds a CSV string with UTF-8 BOM so Excel opens it with correct formatting.
 */
function buildCsvContent(rows) {
  const headers = ['College Name', 'College ID', 'Department Name', 'Department Code', 'Department Login ID', 'Password'];
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const lines = [
    headers.map(escapeCsv).join(','),
    ...rows.map((r) => [
      escapeCsv(r.collegeName),
      escapeCsv(r.collegeId),
      escapeCsv(r.deptName),
      escapeCsv(r.deptCode),
      escapeCsv(r.loginId),
      escapeCsv(r.password)
    ].join(','))
  ];

  return '\uFEFF' + lines.join('\r\n');
}

/**
 * Generates rows array from an institution license object.
 */
export function extractDeptRows(license) {
  if (!license) return [];
  const depts = Array.isArray(license.departments) ? license.departments : [];
  const rows = [];

  // Optional first row: Institution Master Login
  if (license.id && license.password) {
    rows.push({
      collegeName: license.name || 'Institution',
      collegeId: license.id,
      deptName: 'Master Account (All Departments)',
      deptCode: 'MAIN',
      loginId: license.id,
      password: license.password || ''
    });
  }

  depts.forEach((d) => {
    rows.push({
      collegeName: license.name || 'Institution',
      collegeId: license.id || '',
      deptName: d.name || 'Department',
      deptCode: d.code || '',
      loginId: d.loginId || '',
      password: d.password || ''
    });
  });

  return rows;
}

/**
 * Download Excel (.xlsx) for a single college and its departments.
 */
export function downloadCollegeDepartmentsXlsx(license) {
  const rows = extractDeptRows(license);
  if (rows.length === 0) {
    alert('No departments found for this institution.');
    return;
  }
  const blob = buildXlsxBlob(rows);
  const safeName = (license.name || license.id || 'College').replace(/[^a-zA-Z0-9_-]/g, '_');
  triggerDownload(blob, `${safeName}_Department_Credentials.xlsx`);
}

/**
 * Download CSV (.csv) for a single college and its departments.
 */
export function downloadCollegeDepartmentsCsv(license) {
  const rows = extractDeptRows(license);
  if (rows.length === 0) {
    alert('No departments found for this institution.');
    return;
  }
  const csvStr = buildCsvContent(rows);
  const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
  const safeName = (license.name || license.id || 'College').replace(/[^a-zA-Z0-9_-]/g, '_');
  triggerDownload(blob, `${safeName}_Department_Credentials.csv`);
}

/**
 * Download combined Excel (.xlsx) for all institutions and their departments.
 */
export function downloadAllCollegesDepartmentsXlsx(licenses) {
  const allRows = [];
  (licenses || []).forEach((lic) => {
    const rows = extractDeptRows(lic);
    allRows.push(...rows);
  });

  if (allRows.length === 0) {
    alert('No colleges or departments found to export.');
    return;
  }

  const blob = buildXlsxBlob(allRows);
  const dateStr = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `All_Colleges_Department_Credentials_${dateStr}.xlsx`);
}

/**
 * Sanitize cell content against CSV/Excel Formula Injection (CWE-1236)
 */
function sanitizeExcelCell(val) {
  if (val === null || val === undefined) return '';
  const s = String(val).trim();
  if (/^[=+\-@\t\r]/.test(s)) {
    return `'${s}`;
  }
  return s;
}

/**
 * Builds a valid .xlsx spreadsheet binary for student details.
 * @param {Array<{ collegeName: string, collegeId: string, deptName: string, deptCode: string, studentName: string, studentId: string, phone: string, password: string, createdAt: string, activeReads: number }>} rows
 * @returns {Blob}
 */
export function buildStudentsXlsxBlob(rows) {
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Student Details" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><name val="Calibri"/><sz val="11"/></font>
    <font><b/><color rgb="FFFFFFFF"/><name val="Calibri"/><sz val="11"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1E3A8A"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/></border>
    <border>
      <left style="thin"><color rgb="FFCCCCCC"/></left>
      <right style="thin"><color rgb="FFCCCCCC"/></left>
      <top style="thin"><color rgb="FFCCCCCC"/></top>
      <bottom style="thin"><color rgb="FFCCCCCC"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
  </cellXfs>
</styleSheet>`;

  let sheetRowsXml = '';

  // Row 1: Header
  sheetRowsXml += `<row r="1" ht="26" customHeight="1">
    <c r="A1" t="inlineStr" s="1"><is><t>College Name</t></is></c>
    <c r="B1" t="inlineStr" s="1"><is><t>College ID</t></is></c>
    <c r="C1" t="inlineStr" s="1"><is><t>Department Name</t></is></c>
    <c r="D1" t="inlineStr" s="1"><is><t>Department Code</t></is></c>
    <c r="E1" t="inlineStr" s="1"><is><t>Student Full Name</t></is></c>
    <c r="F1" t="inlineStr" s="1"><is><t>Student Roll No / ID</t></is></c>
    <c r="G1" t="inlineStr" s="1"><is><t>Phone Number</t></is></c>
    <c r="H1" t="inlineStr" s="1"><is><t>Password</t></is></c>
    <c r="I1" t="inlineStr" s="1"><is><t>Registered Date</t></is></c>
    <c r="J1" t="inlineStr" s="1"><is><t>Active Reads</t></is></c>
  </row>`;

  rows.forEach((r, idx) => {
    const rowNum = idx + 2;
    sheetRowsXml += `<row r="${rowNum}" ht="20" customHeight="1">
      <c r="A${rowNum}" t="inlineStr" s="2"><is><t>${escapeXml(sanitizeExcelCell(r.collegeName))}</t></is></c>
      <c r="B${rowNum}" t="inlineStr" s="2"><is><t>${escapeXml(sanitizeExcelCell(r.collegeId))}</t></is></c>
      <c r="C${rowNum}" t="inlineStr" s="2"><is><t>${escapeXml(sanitizeExcelCell(r.deptName))}</t></is></c>
      <c r="D${rowNum}" t="inlineStr" s="2"><is><t>${escapeXml(sanitizeExcelCell(r.deptCode))}</t></is></c>
      <c r="E${rowNum}" t="inlineStr" s="2"><is><t>${escapeXml(sanitizeExcelCell(r.studentName))}</t></is></c>
      <c r="F${rowNum}" t="inlineStr" s="2"><is><t>${escapeXml(sanitizeExcelCell(r.studentId))}</t></is></c>
      <c r="G${rowNum}" t="inlineStr" s="2"><is><t>${escapeXml(sanitizeExcelCell(r.phone))}</t></is></c>
      <c r="H${rowNum}" t="inlineStr" s="2"><is><t>${escapeXml(sanitizeExcelCell(r.password))}</t></is></c>
      <c r="I${rowNum}" t="inlineStr" s="2"><is><t>${escapeXml(sanitizeExcelCell(r.createdAt))}</t></is></c>
      <c r="J${rowNum}" t="inlineStr" s="2"><is><t>${escapeXml(String(r.activeReads ?? 0))}</t></is></c>
    </row>`;
  });

  const sheet1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="28" customWidth="1"/>
    <col min="2" max="2" width="18" customWidth="1"/>
    <col min="3" max="3" width="28" customWidth="1"/>
    <col min="4" max="4" width="18" customWidth="1"/>
    <col min="5" max="5" width="26" customWidth="1"/>
    <col min="6" max="6" width="22" customWidth="1"/>
    <col min="7" max="7" width="20" customWidth="1"/>
    <col min="8" max="8" width="20" customWidth="1"/>
    <col min="9" max="9" width="22" customWidth="1"/>
    <col min="10" max="10" width="16" customWidth="1"/>
  </cols>
  <sheetData>
    ${sheetRowsXml}
  </sheetData>
</worksheet>`;

  const files = [
    { name: '[Content_Types].xml', content: contentTypesXml },
    { name: '_rels/.rels', content: relsXml },
    { name: 'xl/workbook.xml', content: workbookXml },
    { name: 'xl/_rels/workbook.xml.rels', content: workbookRelsXml },
    { name: 'xl/styles.xml', content: stylesXml },
    { name: 'xl/worksheets/sheet1.xml', content: sheet1Xml }
  ];

  const zipBytes = createZipUint8Array(files);
  return new Blob([zipBytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

/**
 * Extracts student rows from all licenses/institutions.
 */
export function extractAllStudentRows(licenses) {
  const rows = [];
  (licenses || []).forEach((lic) => {
    const depts = Array.isArray(lic.departments) ? lic.departments : [];
    depts.forEach((d) => {
      const students = Array.isArray(d.students) ? d.students : [];
      students.forEach((s) => {
        const reads = s.customizations?.readingProgress
          ? Object.keys(s.customizations.readingProgress).length
          : 0;
        rows.push({
          collegeName: lic.name || 'Institution',
          collegeId: lic.id || '',
          deptName: d.name || 'Department',
          deptCode: d.code || '',
          studentName: s.name || '',
          studentId: s.studentId || s.id || '',
          phone: s.phone || '',
          password: s.password || '',
          createdAt: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A',
          activeReads: reads
        });
      });
    });
  });
  return rows;
}

/**
 * Download combined Excel (.xlsx) of ALL students across all colleges and departments.
 */
export function downloadAllStudentsXlsx(licenses) {
  const rows = extractAllStudentRows(licenses);
  if (rows.length === 0) {
    alert('No student profiles registered across any department or institution yet.');
    return;
  }
  const blob = buildStudentsXlsxBlob(rows);
  const dateStr = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `All_Registered_Students_Details_${dateStr}.xlsx`);
}

/**
 * Download Excel (.xlsx) of students for a specific department.
 */
export function downloadDeptStudentsXlsx(license, dept) {
  if (!dept || !Array.isArray(dept.students) || dept.students.length === 0) {
    alert('No student profiles registered under this department.');
    return;
  }
  const rows = dept.students.map((s) => {
    const reads = s.customizations?.readingProgress
      ? Object.keys(s.customizations.readingProgress).length
      : 0;
    return {
      collegeName: license?.name || 'Institution',
      collegeId: license?.id || '',
      deptName: dept.name || 'Department',
      deptCode: dept.code || '',
      studentName: s.name || '',
      studentId: s.studentId || s.id || '',
      phone: s.phone || '',
      password: s.password || '',
      createdAt: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A',
      activeReads: reads
    };
  });
  const blob = buildStudentsXlsxBlob(rows);
  const safeDept = (dept.code || dept.name || 'Department').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeCollege = (license?.name || license?.id || 'College').replace(/[^a-zA-Z0-9_-]/g, '_');
  triggerDownload(blob, `${safeCollege}_${safeDept}_Students.xlsx`);
}
