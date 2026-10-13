import { createClient } from '@supabase/supabase-js';

const clientUrl = 'https://hmhbbwldajchdxjeidni.supabase.co';
const secretKey = 'sb_secret_jbW2X-5Izb0FyU-HUSSHFA_EPy9r8Yp';
const supabase = createClient(clientUrl, secretKey);

const OLD_DOMAIN = 'cctdfzdcnunkiriwqnyn.supabase.co';
const NEW_DOMAIN = 'hmhbbwldajchdxjeidni.supabase.co';

async function syncStorage() {
  console.log('🚀 Starting storage file synchronization to Client Supabase...');

  const { data: books, error } = await supabase.from('books').select('id, title, coverurl, pdfurl');
  if (error) {
    console.error('Failed to fetch books:', error);
    process.exit(1);
  }

  console.log(`📚 Found ${books.length} books to inspect.\n`);

  let coverSuccess = 0;
  let pdfSuccess = 0;

  for (let i = 0; i < books.length; i++) {
    const b = books[i];
    console.log(`[${i + 1}/${books.length}] Processing: "${b.title}" (${b.id})`);
    let newCoverUrl = b.coverurl;
    let newPdfUrl = b.pdfurl;

    // 1. Sync Cover
    if (b.coverurl && b.coverurl.includes(OLD_DOMAIN)) {
      try {
        const coverFilename = b.coverurl.split('/').pop().split('?')[0];
        const res = await fetch(b.coverurl);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          const { error: upErr } = await supabase.storage.from('covers').upload(coverFilename, buf, {
            contentType: 'image/png',
            upsert: true
          });
          if (!upErr) {
            newCoverUrl = `https://${NEW_DOMAIN}/storage/v1/object/public/covers/${coverFilename}`;
            coverSuccess++;
            console.log(`  ✓ Cover transferred -> ${coverFilename}`);
          } else {
            console.warn(`  ⚠️ Cover upload error (${b.id}):`, upErr.message);
          }
        }
      } catch (err) {
        console.warn(`  ⚠️ Cover download error (${b.id}):`, err.message);
      }
    } else if (b.coverurl && b.coverurl.includes(NEW_DOMAIN)) {
      coverSuccess++;
    }

    // 2. Sync PDF
    if (b.pdfurl && b.pdfurl.includes(OLD_DOMAIN)) {
      try {
        const pdfFilename = b.pdfurl.split('/').pop().split('?')[0];
        const res = await fetch(b.pdfurl);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          const { error: upErr } = await supabase.storage.from('pdfs').upload(pdfFilename, buf, {
            contentType: 'application/pdf',
            upsert: true
          });
          if (!upErr) {
            newPdfUrl = `https://${NEW_DOMAIN}/storage/v1/object/public/pdfs/${pdfFilename}`;
            pdfSuccess++;
            console.log(`  ✓ PDF transferred -> ${pdfFilename} (${(buf.byteLength / (1024 * 1024)).toFixed(2)} MB)`);
          } else {
            console.warn(`  ⚠️ PDF upload error (${b.id}):`, upErr.message);
          }
        }
      } catch (err) {
        console.warn(`  ⚠️ PDF download error (${b.id}):`, err.message);
      }
    } else if (b.pdfurl && b.pdfurl.includes(NEW_DOMAIN)) {
      pdfSuccess++;
    }

    // Update book row if URLs changed
    if (newCoverUrl !== b.coverurl || newPdfUrl !== b.pdfurl) {
      const { error: updateErr } = await supabase.from('books').update({
        coverurl: newCoverUrl,
        pdfurl: newPdfUrl
      }).eq('id', b.id);

      if (updateErr) {
        console.warn(`  ⚠️ Book URL update failed (${b.id}):`, updateErr.message);
      }
    }
  }

  console.log(`\n🎉 Storage sync complete!`);
  console.log(`• Covers successfully synced: ${coverSuccess}/${books.length}`);
  console.log(`• PDFs successfully synced: ${pdfSuccess}/${books.filter(b => b.pdfurl).length}`);
}

syncStorage().catch(err => {
  console.error('Fatal storage sync error:', err);
  process.exit(1);
});
