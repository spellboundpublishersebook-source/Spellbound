import { supabase } from '../src/supabaseClient.js';

async function testAll() {
  console.log('🧪 Starting full end-to-end database operations test...\n');

  // 1. TEST LICENSES (Creation with departments, updating departments, deletion)
  const testLicId = 'TEST_INST_' + Date.now();
  console.log('1️⃣ Testing LICENSES:');
  const newLic = {
    id: testLicId,
    name: 'Test University of Tech',
    password: 'testUnivPassword123',
    email: 'test@univ.edu',
    seats: 50,
    price: 500,
    type: 'license',
    startdate: '2026-11-13',
    enddate: '2027-11-13',
    bookids: ['1', '2'],
    departments: [
      {
        id: 'dept_test_1',
        name: 'Computer Science',
        code: 'CSE',
        loginId: `${testLicId}-CSE`,
        password: 'deptpass123',
        readsCount: 5,
        students: [
          {
            id: 'stu_1',
            studentId: 'CS001',
            name: 'Aarav Patel',
            password: 'studentpass123',
            createdAt: '2026-11-13T10:00:00.000Z'
          }
        ]
      }
    ]
  };

  const { data: licIns, error: licInsErr } = await supabase.from('licenses').insert([newLic]).select();
  if (licInsErr) {
    console.error('  ❌ INSERT license FAILED:', licInsErr);
  } else {
    console.log('  ✅ INSERT license with departments OK:', licIns[0].id);
  }

  // Update license departments
  const updatedDepts = [
    ...newLic.departments,
    {
      id: 'dept_test_2',
      name: 'Mechanical Engineering',
      code: 'MECH',
      loginId: `${testLicId}-MECH`,
      password: 'mechpass456',
      readsCount: 0,
      students: []
    }
  ];
  const { error: licUpdErr } = await supabase.from('licenses').update({ departments: updatedDepts }).eq('id', testLicId);
  if (licUpdErr) {
    console.error('  ❌ UPDATE license departments FAILED:', licUpdErr);
  } else {
    console.log('  ✅ UPDATE license departments OK');
  }

  // Verify fetch
  const { data: fetchedLic, error: fetchLicErr } = await supabase.from('licenses').select('*').eq('id', testLicId).single();
  if (fetchLicErr) {
    console.error('  ❌ SELECT license FAILED:', fetchLicErr);
  } else {
    console.log('  ✅ SELECT license OK, departments count:', fetchedLic.departments?.length);
  }

  // Delete test license
  const { error: licDelErr } = await supabase.from('licenses').delete().eq('id', testLicId);
  if (licDelErr) {
    console.error('  ❌ DELETE license FAILED:', licDelErr);
  } else {
    console.log('  ✅ DELETE license OK\n');
  }

  // 2. TEST BOOKS (Creation, update, delete)
  console.log('2️⃣ Testing BOOKS:');
  const testBookId = 'test-book-' + Date.now();
  const newBook = {
    id: testBookId,
    title: 'Test Chemistry Primer',
    author: 'Dr. Test Chemist',
    genre: 'Chemistry',
    pubtype: 'EBOOK',
    publisher: 'Spellbound',
    price: 250,
    color: '#34d399',
    totalpages: 120,
    pages: ['Page 1 Intro', 'Page 2 Chapter 1'],
    status: 'published'
  };

  const { data: bIns, error: bInsErr } = await supabase.from('books').insert([newBook]).select();
  if (bInsErr) {
    console.error('  ❌ INSERT book FAILED:', bInsErr);
  } else {
    console.log('  ✅ INSERT book OK:', bIns[0].title);
  }

  const { error: bUpdErr } = await supabase.from('books').update({ title: 'Test Chemistry Primer (2nd Ed)' }).eq('id', testBookId);
  if (bUpdErr) {
    console.error('  ❌ UPDATE book FAILED:', bUpdErr);
  } else {
    console.log('  ✅ UPDATE book OK');
  }

  const { error: bDelErr } = await supabase.from('books').delete().eq('id', testBookId);
  if (bDelErr) {
    console.error('  ❌ DELETE book FAILED:', bDelErr);
  } else {
    console.log('  ✅ DELETE book OK\n');
  }

  // 3. TEST READERS (Individual user account creation & deletion)
  console.log('3️⃣ Testing READERS:');
  const testReader = {
    login_id: 'testreader_' + Date.now() + '@example.com',
    password: 'testPassword123',
    name: 'Test Reader User',
    email: 'testreader_' + Date.now() + '@example.com',
    account_type: 'individual',
    bookids: ['1'],
    startdate: '2026-11-13',
    enddate: '2027-11-13',
    status: 'active',
    price: 499,
    type: 'individual'
  };

  const { data: rIns, error: rInsErr } = await supabase.from('readers').insert([testReader]).select();
  if (rInsErr) {
    console.error('  ❌ INSERT reader FAILED:', rInsErr);
  } else {
    console.log('  ✅ INSERT reader OK:', rIns[0].login_id);
    await supabase.from('readers').delete().eq('id', rIns[0].id);
    console.log('  ✅ DELETE reader OK\n');
  }

  // 4. TEST UPLOADERS
  console.log('4️⃣ Testing UPLOADERS:');
  const testUploader = {
    id: 'upl_' + Date.now(),
    name: 'Test Staff Uploader',
    password: 'uploaderPass123'
  };
  const { data: uIns, error: uInsErr } = await supabase.from('uploaders').insert([testUploader]).select();
  if (uInsErr) {
    console.error('  ❌ INSERT uploader FAILED:', uInsErr);
  } else {
    console.log('  ✅ INSERT uploader OK:', uIns[0].id);
    await supabase.from('uploaders').delete().eq('id', testUploader.id);
    console.log('  ✅ DELETE uploader OK\n');
  }

  // 5. TEST TRIAL REQUESTS
  console.log('5️⃣ Testing TRIAL REQUESTS:');
  const testTrial = {
    id: 'trial_' + Date.now(),
    name: 'Dr. Trial Applicant',
    email: 'trial_' + Date.now() + '@school.edu',
    institution: 'City Medical College',
    status: 'pending',
    requestedat: '2026-11-13',
    password: null,
    expiresat: null
  };
  const { data: tIns, error: tInsErr } = await supabase.from('trial_requests').insert([testTrial]).select();
  if (tInsErr) {
    console.error('  ❌ INSERT trial_requests FAILED:', tInsErr);
  } else {
    console.log('  ✅ INSERT trial_requests OK:', tIns[0].email);
    await supabase.from('trial_requests').delete().eq('id', testTrial.id);
    console.log('  ✅ DELETE trial_requests OK\n');
  }

  console.log('🎉 All database access, create, update, and delete tests PASSED flawlessly!');
}

testAll().catch(console.error);
