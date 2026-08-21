/*
 * SIPILAH — Lapisan Ekopedagogi v1.0
 * Media Pembelajaran Ekopedagogi Digital Berbasis AI — OSN IPS 2026
 *
 * Fitur:
 *  1. Environmental Awareness — kartu "Dari Sekolah Sehat Menuju Sekolah
 *     Berkelanjutan" di halaman Beranda.
 *  2. Waste Journey — visual perjalanan sampah di halaman Dataset Sampah.
 *  3. Ecological Reflection — dampak lingkungan + pertanyaan refleksi/kritis
 *     setelah AI mengenali kategori sampah.
 *  4. Sustainable Action — komitmen aksi nyata siswa ("Satu perubahan saya
 *     untuk bumi"), digabung dalam panel yang sama dengan Ecological
 *     Reflection.
 *
 * Cara kerja: hanya menambah elemen DOM baru dan membaca/menulis kunci
 * localStorage BARU (berawalan "sipilah_eco_"). Tidak mengubah bundle.js,
 * model AI, alur training/dataset, maupun skema localStorage yang sudah
 * ada (sipilah_identity_v1, sipilah_project_v1, sipilah_tests_v1, dst).
 * Prediksi AI dibaca lewat window.SipML.predict yang sudah diekspos
 * bundle.js — fungsi aslinya tetap dipanggil apa adanya (bukan diganti).
 */

(function () {
  'use strict';

  /* ─── KONFIGURASI KONTEN ─── */

  var CATEGORY_INFO = {
    Plastik: {
      color: '#0ea5e9',
      dampak:
        'Sampah plastik butuh ratusan tahun untuk terurai. Di kota, plastik yang tidak terkelola bisa menyumbat saluran air dan memicu banjir, lalu pecah menjadi mikroplastik yang mencemari sungai dan laut.',
      reflect: 'Apakah penggunaan barang plastik ini bisa dikurangi atau diganti?',
      critical: 'Siapa yang paling merasakan dampak jika plastik ini berakhir di selokan atau sungai kota?',
    },
    Kertas: {
      color: '#f59e0b',
      dampak:
        'Produksi kertas memakai banyak pohon dan air. Kabar baiknya, kertas relatif mudah didaur ulang jika dipisahkan sejak awal, sehingga bisa menekan laju penebangan hutan.',
      reflect: 'Apa kebiasaan kecil yang bisa mengurangi pemakaian kertas di sekolah?',
      critical: 'Bagaimana kebiasaan konsumsi kertas di sekolah kita bisa memengaruhi hutan jauh di luar kota?',
    },
    Organik: {
      color: '#10b981',
      dampak:
        'Jika dibuang begitu saja ke TPA, sampah organik membusuk tanpa oksigen dan menghasilkan gas metana — gas rumah kaca yang efeknya jauh lebih kuat dari CO2. Padahal sampah organik bisa diolah jadi kompos.',
      reflect: 'Apakah sisa makanan ini bisa diolah menjadi kompos di sekolah?',
      critical: 'Siapa yang seharusnya bertanggung jawab mengelola sisa makanan kantin sekolah kita?',
    },
    Residu: {
      color: '#64748b',
      dampak:
        'Residu adalah sampah campuran yang sulit didaur ulang. Biasanya berakhir di TPA atau dibakar, dan bisa mencemari tanah, air, serta udara di sekitar kota.',
      reflect: 'Apakah barang ini bisa diganti dengan sesuatu yang lebih mudah didaur ulang?',
      critical: 'Mengapa kota kita masih menghasilkan banyak sampah residu yang sulit dikelola?',
    },
  };

  var ACTION_CHOICES = [
    { key: 'botol', icon: '🧴', label: 'Membawa botol minum sendiri' },
    { key: 'plastik', icon: '🚫', label: 'Mengurangi plastik sekali pakai' },
    { key: 'pilah', icon: '♻️', label: 'Memilah sampah di rumah/sekolah' },
    { key: 'ajak', icon: '🤝', label: 'Mengajak teman untuk peduli' },
  ];

  var JOURNEY_STEPS = [
    { icon: '🛍️', label: 'Konsumsi manusia', copy: 'Kita membeli, memakai, dan menghabiskan barang setiap hari.' },
    { icon: '🗑️', label: 'Sampah', copy: 'Barang yang sudah tidak dipakai menjadi sampah — sisa dari pilihan konsumsi kita.' },
    { icon: '🗂️', label: 'Pemilahan', copy: 'Sampah dipisah menurut jenisnya: plastik, kertas, organik, residu.' },
    { icon: '♻️', label: 'Pengelolaan', copy: 'Sampah yang terpilah bisa didaur ulang, dikompos, atau diproses lebih lanjut.' },
    { icon: '🌍', label: 'Dampak lingkungan', copy: 'Cara kita mengelola sampah menentukan kualitas tanah, air, udara, dan iklim kota kita.' },
  ];

  var SDG_CARDS = [
    {
      number: 4,
      color: '#C5192D',
      title: 'Pendidikan Berkualitas',
      copy: 'SIPILAH menghadirkan pembelajaran AI yang kontekstual: siswa membangun dataset, melatih model, menguji prediksi, dan merefleksikan dampaknya — memadukan literasi digital dan literasi ekologis dalam satu pengalaman belajar IPS.',
    },
    {
      number: 11,
      color: '#FD9D24',
      title: 'Kota dan Komunitas Berkelanjutan',
      copy: 'Sekolah adalah bagian dari kota. Dengan memahami perjalanan sampah dan memilahnya, siswa SMP Labschool Jakarta ikut menjaga ruang hidup bersama agar kota menjadi lebih layak huni dan berkelanjutan.',
    },
    {
      number: 12,
      color: '#BF8B2E',
      title: 'Konsumsi dan Produksi Bertanggung Jawab',
      copy: 'Setiap foto sampah yang diambil siswa adalah jejak konsumsi sehari-hari. SIPILAH mengajak siswa mengurangi, memilah, dan mempertanggungjawabkan pola konsumsi mereka.',
    },
  ];

  var WASTE_DATA_CATEGORIES = [
    { key: 'plastik', label: 'Plastik', color: '#0ea5e9' },
    { key: 'kertas', label: 'Kertas', color: '#f59e0b' },
    { key: 'organik', label: 'Organik', color: '#10b981' },
    { key: 'residu', label: 'Residu', color: '#64748b' },
  ];

  var IPS_IDENTITY = 'SIPILAH mengintegrasikan kajian IPS melalui pemahaman hubungan manusia dengan lingkungan.';

  var IPS_PERSPECTIVES = [
    { icon: '📍', label: 'Geografi', copy: 'Hubungan aktivitas manusia dengan kondisi lingkungan.' },
    { icon: '👥', label: 'Sosiologi', copy: 'Perilaku sosial dan budaya sekolah dalam menjaga lingkungan.' },
    { icon: '💰', label: 'Ekonomi', copy: 'Pola konsumsi manusia yang menghasilkan sampah.' },
    { icon: '📜', label: 'Sejarah', copy: 'Perubahan hubungan manusia dengan sumber daya alam.' },
  ];

  var RESEARCH_QUESTION = 'Bagaimana teknologi digital dapat membantu siswa memahami hubungan antara perilaku manusia dan keberlanjutan lingkungan?';

  var IMPACT_STEPS = [
    { icon: '🔍', label: 'Mengetahui masalah', copy: 'Siswa menyadari sampah sekolah sebagai persoalan nyata, bukan sekadar tugas kebersihan.' },
    { icon: '🧠', label: 'Memahami dampak', copy: 'Siswa mempelajari akibat tiap kategori sampah terhadap lingkungan dan kota tempat mereka tinggal.' },
    { icon: '🤖', label: 'Menggunakan teknologi', copy: 'Siswa memakai AI untuk mengumpulkan, melatih, dan menguji klasifikasi sampah secara langsung.' },
    { icon: '🌱', label: 'Melakukan perubahan perilaku', copy: 'Siswa mengambil komitmen dan aksi nyata untuk mengurangi dampak lingkungan dari kebiasaan mereka.' },
  ];

  /* Peta rebranding label KKA → Ekopedagogi. Urutan PENTING: frasa/kalimat
     panjang & spesifik harus lebih dulu dari kata pendek generik ("KKA" saja),
     supaya penggantian tidak "termakan" duluan oleh aturan yang lebih umum. */
  var REBRANDING_MAP = [
    ['Belajar AI lewat aksi pilah sampah sekolah.', 'Memahami hubungan manusia dan lingkungan melalui teknologi AI.'],
    ['Uji pemahaman awalmu tentang AI, dataset, dan pemilahan sampah — sebelum mulai proyek.',
      'Uji pemahaman awal siswa tentang hubungan manusia, lingkungan, sampah, dan perilaku berkelanjutan — sebelum mulai proyek.'],
    ['Uji pemahaman akhirmu setelah menyelesaikan 4 pertemuan SIPILAH.',
      'Lihat perubahan pemahaman ekologis siswa setelah menyelesaikan 4 pertemuan SIPILAH.'],
    ['Pre-Test SIPILAH', 'Eksplorasi Awal Kesadaran Ekologis'],
    ['Post-Test SIPILAH', 'Refleksi Perubahan Pemahaman Ekologis'],
    ['Computer Vision adalah cabang KKA yang membuat komputer dapat “melihat” gambar. Dalam SIPILAH, model belajar membedakan plastik, kertas, organik, dan residu.',
      'Teknologi AI dalam SIPILAH membantu mengenali pola visual pada foto sampah — sebagai alat bantu, bukan tujuan utama. Yang lebih penting adalah bagaimana siswa memahami hubungan manusia, lingkungan, dan keberlanjutan lewat proses ini.'],
    ['Belajar Kecerdasan Artifisial melalui aksi pilah sampah sekolah. Laporan ini dihasilkan otomatis berdasarkan data dataset dan pengujian model.',
      'Memahami hubungan manusia dan lingkungan melalui teknologi AI. Laporan ini dihasilkan otomatis dari proses pembelajaran ekopedagogi dan refleksi siswa.'],
    ['Disusun selaras Capaian Pembelajaran KKA fase D (kelas 7–9).', 'Disusun selaras pendekatan ekopedagogi dan Capaian Pembelajaran IPS fase D (kelas 7–9).'],
    ['pembelajaran KKA tidak meninggalkan mereka', 'pembelajaran ekopedagogi tidak meninggalkan mereka'],
    ['sampah dan AI sama pentingnya untuk semua siswa', 'lingkungan dan keberlanjutan sama pentingnya untuk semua siswa'],
    ['Sistem Pemilahan Sampah berbasis KKA', 'Media Pembelajaran Ekopedagogi Digital Berbasis AI'],
    ['Media Ajar KKA · SMP', 'Media Pembelajaran Ekopedagogi Digital · SMP'],
    ['Perjalanan belajar KKA', 'Perjalanan Belajar Ekopedagogi'],
    ['Hubungkan KKA dengan aksi nyata.', 'Hubungkan pembelajaran ekopedagogi dengan aksi nyata.'],
    ['Kompetensi KKA', 'Kompetensi yang Dilatih'],
    ['KKA · Web Offline', 'Ekopedagogi Digital · Web Offline'],
    ['Computer Vision', 'Teknologi AI Pendukung'],
    ['Computational Thinking', 'Kesadaran Ekologis'],
    ['KKA', 'Ekopedagogi Digital'],
  ];

  var ECO_THROTTLE_MS = 6000;

  /* ─── PENYIMPANAN LOKAL (namespace baru, tidak menyentuh kunci lama) ─── */

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* Storage penuh bukan hal fatal untuk fitur refleksi ini. */
    }
  }

  function logEco(type, title, detail) {
    if (typeof window.SipProjectLog === 'function') {
      window.SipProjectLog(type, title, detail);
    }
  }

  function saveCommitment(category, choices) {
    var list = readJSON('sipilah_eco_commitment_v1', []);
    if (!Array.isArray(list)) list = [];
    list.unshift({ category: category || null, choices: choices, ts: Date.now() });
    writeJSON('sipilah_eco_commitment_v1', list.slice(0, 100));
    logEco(
      'eco-action',
      'Komitmen Aksi Berkelanjutan',
      'Satu perubahan untuk bumi: ' + choices.join(', ') + (category ? ' (dipicu dari kategori ' + category + ')' : '')
    );
    return list.length;
  }

  /* ─── GAYA VISUAL (konsisten dengan kartu SIPILAH lain) ─── */

  var STYLE_CSS = [
    '.sip-eco-card{margin-top:24px;border:1px solid rgba(187,247,208,.85);background:linear-gradient(135deg,#f8fffb 0%,#f0f9ff 55%,#fffdf0 100%);border-radius:24px;padding:24px;box-shadow:0 18px 45px -32px rgba(15,23,42,.34);font-family:system-ui,-apple-system,sans-serif}',
    '.sip-eco-eyebrow{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#166534}',
    '.sip-eco-title{margin-top:6px;font-size:24px;line-height:1.15;font-weight:900;color:#0f172a}',
    '.sip-eco-copy{margin-top:10px;max-width:760px;color:#475569;font-size:14px;line-height:1.65}',
    '.sip-eco-points{margin-top:16px;display:grid;gap:10px}',
    '.sip-eco-point{display:flex;gap:10px;align-items:flex-start;border:1px solid rgba(226,232,240,.9);background:rgba(255,255,255,.78);border-radius:14px;padding:12px 14px}',
    '.sip-eco-point b{flex-shrink:0;width:22px;height:22px;border-radius:999px;background:#15803d;color:#fff;font-size:12px;font-weight:800;display:grid;place-items:center}',
    '.sip-eco-point span{color:#334155;font-size:13.5px;line-height:1.55}',
    '.sip-eco-footnote{margin-top:14px;font-size:12.5px;color:#64748b;line-height:1.55;border-top:1px dashed #d1fae5;padding-top:12px}',

    '.sip-eco-journey-row{margin-top:18px;display:flex;flex-wrap:wrap;align-items:stretch;gap:0;justify-content:space-between}',
    '.sip-eco-journey-step{flex:1 1 150px;min-width:130px;background:rgba(255,255,255,.85);border:1px solid rgba(226,232,240,.9);border-radius:16px;padding:14px 12px;text-align:center}',
    '.sip-eco-journey-icon{font-size:26px;line-height:1}',
    '.sip-eco-journey-label{margin-top:8px;font-size:13px;font-weight:800;color:#0f172a}',
    '.sip-eco-journey-copy{margin-top:4px;font-size:11.5px;color:#64748b;line-height:1.45}',
    '.sip-eco-journey-arrow{flex:0 0 auto;display:flex;align-items:center;justify-content:center;width:28px;font-size:18px;color:#15803d;font-weight:900}',
    '@media (max-width:720px){.sip-eco-journey-row{flex-direction:column}.sip-eco-journey-arrow{width:auto;height:20px;transform:rotate(90deg)}}',

    '.sip-eco-reflect-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.28);z-index:84;opacity:0;pointer-events:none;transition:opacity .25s ease}',
    '.sip-eco-reflect-backdrop[data-open="1"]{opacity:1;pointer-events:auto}',
    '.sip-eco-reflect-panel{position:fixed;left:16px;right:16px;bottom:16px;max-width:440px;margin:0 auto;background:#ffffff;border-radius:22px;box-shadow:0 24px 60px -20px rgba(15,23,42,.45);border:1px solid #e2e8f0;z-index:85;max-height:min(82vh,640px);overflow-y:auto;transform:translateY(24px);opacity:0;pointer-events:none;transition:transform .25s ease,opacity .25s ease}',
    '.sip-eco-reflect-panel[data-open="1"]{transform:translateY(0);opacity:1;pointer-events:auto}',
    '.sip-eco-reflect-head{position:sticky;top:0;background:#fff;padding:16px 18px 10px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:10px}',
    '.sip-eco-reflect-kicker{font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#166534}',
    '.sip-eco-reflect-label{margin-top:4px;font-size:19px;font-weight:900}',
    '.sip-eco-reflect-conf{margin-top:2px;font-size:12px;color:#64748b}',
    '.sip-eco-reflect-close{flex-shrink:0;width:28px;height:28px;border-radius:999px;border:1px solid #e2e8f0;background:#f8fafc;color:#475569;font-size:14px;cursor:pointer;line-height:1}',
    '.sip-eco-reflect-body{padding:14px 18px 18px}',
    '.sip-eco-reflect-block{margin-top:12px}',
    '.sip-eco-reflect-block h4{margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#0f172a}',
    '.sip-eco-reflect-block p{margin:0;font-size:13.5px;line-height:1.55;color:#334155}',
    '.sip-eco-reflect-q{margin-top:6px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:9px 11px;font-size:13px;color:#0f172a;font-style:italic}',
    '.sip-eco-action-title{margin-top:16px;font-size:14px;font-weight:900;color:#0f172a}',
    '.sip-eco-action-sub{margin-top:2px;font-size:12px;color:#64748b}',
    '.sip-eco-action-grid{margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.sip-eco-action-chip{display:flex;align-items:center;gap:6px;border:1px solid #e2e8f0;border-radius:12px;padding:8px 10px;font-size:12px;font-weight:700;color:#334155;cursor:pointer;user-select:none}',
    '.sip-eco-action-chip input{margin:0}',
    '.sip-eco-action-chip[data-checked="1"]{border-color:#15803d;background:#f0fdf4;color:#166534}',
    '.sip-eco-action-save{margin-top:12px;width:100%;border:0;border-radius:14px;background:#15803d;color:#fff;font-weight:800;font-size:13.5px;padding:11px;cursor:pointer}',
    '.sip-eco-action-save:disabled{opacity:.55;cursor:not-allowed}',
    '.sip-eco-action-status{margin-top:8px;font-size:12px;color:#166534;font-weight:700;min-height:14px}',

    '.sip-eco-hero{background:linear-gradient(135deg,var(--sp-primary-700,#166534) 0%,var(--sp-primary,#15803d) 55%,#0ea472 100%);border:none;box-shadow:0 22px 50px -22px rgba(21,128,61,.55)}',
    '.sip-eco-hero .sip-eco-eyebrow{color:#dcfce7}',
    '.sip-eco-hero-title{margin-top:6px;font-size:28px;line-height:1.15;font-weight:900;color:#fff}',
    '.sip-eco-hero .sip-eco-copy{color:rgba(255,255,255,.88);max-width:720px}',
    '.sip-eco-hero-badges{margin-top:16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}',
    '.sip-eco-hero-badge{font-size:12.5px;font-weight:800;padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.16);color:#fff;border:1px solid rgba(255,255,255,.35)}',
    '.sip-eco-hero-badge-alt{background:#facc15;color:#713f12;border-color:transparent}',
    '.sip-eco-hero-arrow{color:#fff;font-weight:900;font-size:16px}',
    '.sip-eco-hero-cta{margin-top:18px;border:0;border-radius:14px;background:#fff;color:#166534;font-weight:900;font-size:13.5px;padding:11px 18px;cursor:pointer}',

    '.sip-eco-waste-total{margin-top:4px;font-size:13px;color:#475569}',
    '.sip-eco-waste-total strong{color:#0f172a}',
    '.sip-eco-waste-bars{margin-top:14px;display:grid;gap:10px}',
    '.sip-eco-waste-row{display:grid;grid-template-columns:90px 1fr 42px;align-items:center;gap:10px}',
    '.sip-eco-waste-label{font-size:12.5px;font-weight:800}',
    '.sip-eco-waste-track{height:12px;border-radius:999px;background:#e2e8f0;overflow:hidden}',
    '.sip-eco-waste-fill{height:100%;border-radius:999px;min-width:3px;transition:width .5s ease}',
    '.sip-eco-waste-count{font-size:12px;font-weight:800;color:#0f172a;text-align:right;font-variant-numeric:tabular-nums}',
    '.sip-eco-waste-empty{margin-top:12px;font-size:13px;color:#64748b;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:12px;padding:12px}',
    '@media (max-width:420px){.sip-eco-waste-row{grid-template-columns:64px 1fr 36px}}',

    '.sip-eco-page-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:88;opacity:0;pointer-events:none;transition:opacity .25s ease}',
    '.sip-eco-page-backdrop[data-open="1"]{opacity:1;pointer-events:auto}',
    '.sip-eco-page-panel{position:fixed;left:50%;top:50%;transform:translate(-50%,calc(-50% + 16px));width:min(720px,92vw);max-height:86vh;overflow-y:auto;background:#fff;border-radius:24px;box-shadow:0 30px 80px -20px rgba(15,23,42,.5);z-index:89;opacity:0;pointer-events:none;transition:opacity .25s ease,transform .25s ease;font-family:system-ui,-apple-system,sans-serif}',
    '.sip-eco-page-panel[data-open="1"]{opacity:1;pointer-events:auto;transform:translate(-50%,-50%)}',
    '.sip-eco-page-head{position:sticky;top:0;background:#fff;padding:22px 24px 12px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;gap:12px}',
    '.sip-eco-page-title{margin-top:4px;font-size:22px;font-weight:900;color:#0f172a}',
    '.sip-eco-page-body{padding:18px 24px 26px}',
    '.sip-eco-sdg-grid{display:grid;gap:14px}',
    '.sip-eco-sdg-card{border:1px solid #e2e8f0;border-left-width:6px;border-radius:16px;padding:16px 18px;background:#f8fafc}',
    '.sip-eco-sdg-badge{display:inline-block;color:#fff;font-size:11px;font-weight:900;letter-spacing:.05em;padding:4px 10px;border-radius:999px}',
    '.sip-eco-sdg-title{margin-top:8px;font-size:16px;font-weight:900;color:#0f172a}',
    '.sip-eco-sdg-copy{margin-top:6px;font-size:13.5px;line-height:1.6;color:#475569}',

    '.sip-eco-ips-grid{margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px}',
    '.sip-eco-ips-item{border:1px solid rgba(226,232,240,.9);background:rgba(255,255,255,.78);border-radius:14px;padding:14px}',
    '.sip-eco-ips-icon{font-size:20px;line-height:1}',
    '.sip-eco-ips-label{margin-top:6px;font-size:13.5px;font-weight:900;color:#0f172a}',
    '.sip-eco-ips-copy{margin-top:4px;font-size:12.5px;color:#64748b;line-height:1.5}',
    '@media (max-width:560px){.sip-eco-ips-grid{grid-template-columns:1fr}}',

    '.sip-eco-quote-card{border-left:5px solid #15803d}',
    '.sip-eco-quote-mark{font-size:40px;line-height:1;color:#bbf7d0;font-weight:900;font-family:Georgia,serif}',
    '.sip-eco-quote-text{margin-top:-6px;font-size:19px;line-height:1.5;font-weight:800;color:#0f172a;max-width:720px}',
  ].join('\n');

  function ensureStyles() {
    if (document.getElementById('sip-eco-style')) return;
    var style = document.createElement('style');
    style.id = 'sip-eco-style';
    style.textContent = STYLE_CSS;
    document.head.appendChild(style);
  }

  /* ─── 1. ENVIRONMENTAL AWARENESS (Beranda) ─── */

  function isHomeVisible() {
    var main = document.querySelector('main');
    if (!main) return false;
    var text = main.textContent || '';
    return text.indexOf('Beranda') >= 0 && text.indexOf('Mulai Proyek') >= 0 && text.indexOf('SIPILAH') >= 0;
  }

  function buildAwarenessCard() {
    var card = document.createElement('div');
    card.className = 'sip-eco-card';
    card.setAttribute('data-sip-eco-awareness', 'true');
    card.innerHTML =
      '<div class="sip-eco-eyebrow">Ekopedagogi &middot; Masalah Lingkungan Perkotaan</div>' +
      '<div class="sip-eco-title">🌱 Dari Sekolah Sehat Menuju Sekolah Berkelanjutan</div>' +
      '<p class="sip-eco-copy">Sebelum masuk ke dataset dan model AI, mari pahami dulu mengapa sampah sekolah adalah persoalan yang lebih besar dari sekadar kebersihan.</p>' +
      '<div class="sip-eco-points">' +
        '<div class="sip-eco-point"><b>1</b><span>Sampah bukan hanya masalah kebersihan. Sampah adalah petunjuk tentang bagaimana kita hidup, mengonsumsi, dan membuang.</span></div>' +
        '<div class="sip-eco-point"><b>2</b><span>Sampah merupakan hasil interaksi manusia dengan lingkungan — setiap barang yang kita pakai punya jejak dari alam dan akan kembali ke alam.</span></div>' +
        '<div class="sip-eco-point"><b>3</b><span>Perilaku manusia memengaruhi keberlanjutan. Sekolah yang sehat perlu tumbuh menjadi sekolah yang berkelanjutan: peduli hari ini, bertanggung jawab untuk masa depan.</span></div>' +
      '</div>' +
      '<div class="sip-eco-footnote">Inilah inti Ilmu Pengetahuan Sosial (IPS): memahami hubungan manusia, ruang, dan lingkungan sebagai satu sistem yang saling memengaruhi.</div>';
    return card;
  }

  function mountAwareness() {
    var existing = document.querySelector('[data-sip-eco-awareness]');
    if (!isHomeVisible()) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;
    var content = document.querySelector('main > div.flex-1') || document.querySelector('main');
    if (!content) return;
    content.appendChild(buildAwarenessCard());
  }

  /* ─── 1B. LANDING HERO — "Dari Sekolah Sehat Menuju Sekolah Berkelanjutan" ─── */

  function buildLandingHero() {
    var card = document.createElement('div');
    card.className = 'sip-eco-card sip-eco-hero';
    card.setAttribute('data-sip-eco-landing', 'true');
    card.innerHTML =
      '<div class="sip-eco-eyebrow">SMP Labschool Jakarta &middot; Transformasi Budaya Sekolah</div>' +
      '<div class="sip-eco-hero-title">Dari Sekolah Sehat Menuju Sekolah Berkelanjutan</div>' +
      '<p class="sip-eco-copy">SMP Labschool Jakarta telah membangun budaya Sekolah Sehat yang kuat. Kini, SIPILAH menjadi langkah nyata untuk melangkah lebih jauh: mengembangkan budaya baru — Sekolah Berkelanjutan — tempat teknologi AI, kesadaran lingkungan, dan aksi siswa berjalan bersama.</p>' +
      '<div class="sip-eco-hero-badges">' +
        '<span class="sip-eco-hero-badge">🏫 Sekolah Sehat</span>' +
        '<span class="sip-eco-hero-arrow">→</span>' +
        '<span class="sip-eco-hero-badge sip-eco-hero-badge-alt">🌱 Sekolah Berkelanjutan</span>' +
      '</div>' +
      '<button type="button" class="sip-eco-hero-cta">🌍 Lihat Kontribusi SIPILAH terhadap SDGs</button>';
    var cta = card.querySelector('.sip-eco-hero-cta');
    if (cta) cta.addEventListener('click', openSdgPage);
    return card;
  }

  function mountLandingHero() {
    var existing = document.querySelector('[data-sip-eco-landing]');
    if (!isHomeVisible()) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;
    var content = document.querySelector('main > div.flex-1') || document.querySelector('main');
    if (!content) return;
    content.appendChild(buildLandingHero());
  }

  /* ─── 1C. IPS PERSPECTIVE CARD (Beranda) ─── */

  function buildIpsCard() {
    var card = document.createElement('div');
    card.className = 'sip-eco-card';
    card.setAttribute('data-sip-eco-ips', 'true');
    var itemsHtml = IPS_PERSPECTIVES.map(function (item) {
      return (
        '<div class="sip-eco-ips-item">' +
          '<div class="sip-eco-ips-icon">' + item.icon + '</div>' +
          '<div class="sip-eco-ips-label">' + item.label + '</div>' +
          '<div class="sip-eco-ips-copy">' + item.copy + '</div>' +
        '</div>'
      );
    }).join('');
    card.innerHTML =
      '<div class="sip-eco-eyebrow">Landasan Keilmuan</div>' +
      '<div class="sip-eco-title">🧭 Mengapa SIPILAH Termasuk Kajian IPS?</div>' +
      '<p class="sip-eco-copy"><strong>' + IPS_IDENTITY + '</strong> Masalah sampah sekolah bukan hanya soal teknologi — ia bisa dibaca lewat empat sudut pandang Ilmu Pengetahuan Sosial sekaligus.</p>' +
      '<div class="sip-eco-ips-grid">' + itemsHtml + '</div>';
    return card;
  }

  function mountIpsCard() {
    var existing = document.querySelector('[data-sip-eco-ips]');
    if (!isHomeVisible()) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;
    var content = document.querySelector('main > div.flex-1') || document.querySelector('main');
    if (!content) return;
    content.appendChild(buildIpsCard());
  }

  /* ─── 1D. RESEARCH QUESTION CARD (Beranda) ─── */

  function buildResearchQuestionCard() {
    var card = document.createElement('div');
    card.className = 'sip-eco-card sip-eco-quote-card';
    card.setAttribute('data-sip-eco-research', 'true');
    card.innerHTML =
      '<div class="sip-eco-eyebrow">Pertanyaan Utama</div>' +
      '<div class="sip-eco-quote-mark">&ldquo;</div>' +
      '<div class="sip-eco-quote-text">' + RESEARCH_QUESTION + '</div>';
    return card;
  }

  function mountResearchQuestion() {
    var existing = document.querySelector('[data-sip-eco-research]');
    if (!isHomeVisible()) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;
    var content = document.querySelector('main > div.flex-1') || document.querySelector('main');
    if (!content) return;
    content.appendChild(buildResearchQuestionCard());
  }

  /* ─── 1E. IMPACT JOURNEY CARD (Beranda) — "Dari Kesadaran Menjadi Aksi" ─── */

  function buildImpactJourneyCard() {
    var card = document.createElement('div');
    card.className = 'sip-eco-card';
    card.setAttribute('data-sip-eco-impact', 'true');
    card.innerHTML =
      '<div class="sip-eco-eyebrow">Narasi Penelitian</div>' +
      '<div class="sip-eco-title">🚀 Dari Kesadaran Menjadi Aksi</div>' +
      '<p class="sip-eco-copy">SIPILAH mengajak siswa bergerak dari sekadar tahu menjadi benar-benar berubah, lewat empat tahap sederhana.</p>' +
      buildStepFlowHtml(IMPACT_STEPS);
    return card;
  }

  function mountImpactJourney() {
    var existing = document.querySelector('[data-sip-eco-impact]');
    if (!isHomeVisible()) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;
    var content = document.querySelector('main > div.flex-1') || document.querySelector('main');
    if (!content) return;
    content.appendChild(buildImpactJourneyCard());
  }

  /* ─── 2. WASTE JOURNEY (Dataset Sampah) ─── */

  function isDatasetVisible() {
    var text = document.body ? document.body.innerText || '' : '';
    return text.indexOf('Dataset Sampah') >= 0 && text.indexOf('SIPILAH') >= 0;
  }

  function findDatasetHost() {
    var title = Array.prototype.slice.call(document.querySelectorAll('h1, h2, h3, div')).find(function (el) {
      return (el.textContent || '').trim() === 'Dataset Sampah';
    });
    if (title) {
      return title.closest('.space-y-6, main, [class*="space-y"]') || title.parentElement;
    }
    var main = document.querySelector('main');
    return main ? main.querySelector('[class*="space-y"]') || main : null;
  }

  function buildStepFlowHtml(steps) {
    return '<div class="sip-eco-journey-row">' + steps.map(function (step, i) {
      var stepHtml =
        '<div class="sip-eco-journey-step">' +
          '<div class="sip-eco-journey-icon">' + step.icon + '</div>' +
          '<div class="sip-eco-journey-label">' + step.label + '</div>' +
          '<div class="sip-eco-journey-copy">' + step.copy + '</div>' +
        '</div>';
      if (i < steps.length - 1) {
        stepHtml += '<div class="sip-eco-journey-arrow">→</div>';
      }
      return stepHtml;
    }).join('') + '</div>';
  }

  function buildJourneyCard() {
    var card = document.createElement('div');
    card.className = 'sip-eco-card';
    card.setAttribute('data-sip-eco-journey', 'true');
    card.innerHTML =
      '<div class="sip-eco-eyebrow">Ekopedagogi &middot; Waste Journey</div>' +
      '<div class="sip-eco-title">🔄 Perjalanan Sampah: Dari Konsumsi Sampai Dampaknya</div>' +
      '<p class="sip-eco-copy">Setiap sampah yang kamu foto di halaman ini punya perjalanan panjang sebelum dan sesudah keluar dari tangan kita. Memilah adalah satu titik kecil dari perjalanan yang lebih besar.</p>' +
      buildStepFlowHtml(JOURNEY_STEPS);
    return card;
  }

  function mountJourney() {
    var existing = document.querySelector('[data-sip-eco-journey]');
    if (!isDatasetVisible()) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;
    var host = findDatasetHost();
    if (!host) return;
    var card = buildJourneyCard();
    var qualityCard = document.getElementById('sip-dataset-quality-card');
    if (qualityCard && qualityCard.parentElement === host) {
      host.insertBefore(card, qualityCard);
    } else {
      var anchor = host.firstElementChild && host.firstElementChild.nextSibling ? host.firstElementChild.nextSibling : host.firstChild;
      host.insertBefore(card, anchor);
    }
  }

  /* ─── 2B. DATA SAMPAH SEKOLAH KAMI (Beranda) ─── */

  var _wasteDataLastFetch = 0;
  var _wasteDataFetching = false;

  function buildWasteDataCard() {
    var card = document.createElement('div');
    card.className = 'sip-eco-card';
    card.setAttribute('data-sip-eco-waste-data', 'true');
    card.innerHTML =
      '<div class="sip-eco-eyebrow">Observasi Lapangan</div>' +
      '<div class="sip-eco-title">📊 Data Sampah Sekolah Kami</div>' +
      '<p class="sip-eco-copy">Data di bawah ini berasal langsung dari foto yang dikumpulkan siswa di Dataset Sampah — bukan data simulasi.</p>' +
      '<div class="sip-eco-waste-total" id="sip-eco-waste-total">Memuat data observasi&hellip;</div>' +
      '<div class="sip-eco-waste-bars" id="sip-eco-waste-bars"></div>';
    return card;
  }

  function renderWasteDataCounts(card, counts) {
    var totalEl = card.querySelector('#sip-eco-waste-total');
    var barsEl = card.querySelector('#sip-eco-waste-bars');
    var total = WASTE_DATA_CATEGORIES.reduce(function (sum, cat) { return sum + (counts[cat.key] || 0); }, 0);

    if (!total) {
      if (totalEl) totalEl.textContent = 'Belum ada data observasi.';
      if (barsEl) {
        barsEl.innerHTML = '<div class="sip-eco-waste-empty">Yuk mulai kumpulkan foto sampah di halaman Dataset Sampah supaya data ini terisi dari observasi asli sekolah kita.</div>';
      }
      return;
    }

    if (totalEl) totalEl.innerHTML = 'Total <strong>' + total + ' foto</strong> sampah terkumpul dari observasi langsung di sekolah.';
    var max = Math.max.apply(Math, WASTE_DATA_CATEGORIES.map(function (cat) { return counts[cat.key] || 0; }));
    if (barsEl) {
      barsEl.innerHTML = WASTE_DATA_CATEGORIES.map(function (cat) {
        var count = counts[cat.key] || 0;
        var width = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0;
        return (
          '<div class="sip-eco-waste-row">' +
            '<div class="sip-eco-waste-label" style="color:' + cat.color + '">' + cat.label + '</div>' +
            '<div class="sip-eco-waste-track"><div class="sip-eco-waste-fill" style="width:' + width + '%;background:' + cat.color + '"></div></div>' +
            '<div class="sip-eco-waste-count">' + count + '</div>' +
          '</div>'
        );
      }).join('');
    }
  }

  function mountWasteData() {
    var existing = document.querySelector('[data-sip-eco-waste-data]');
    if (!isHomeVisible()) {
      if (existing) existing.remove();
      return;
    }

    var card = existing;
    if (!card) {
      var content = document.querySelector('main > div.flex-1') || document.querySelector('main');
      if (!content) return;
      card = buildWasteDataCard();
      content.appendChild(card);
    }

    if (!window.SipDB || typeof window.SipDB.getCounts !== 'function') return;
    var now = Date.now();
    if (_wasteDataFetching || (now - _wasteDataLastFetch) < 3000) return;
    _wasteDataFetching = true;
    window.SipDB.getCounts()
      .then(function (counts) {
        _wasteDataLastFetch = Date.now();
        renderWasteDataCounts(card, counts || {});
      })
      .catch(function () {})
      .finally(function () {
        _wasteDataFetching = false;
      });
  }

  /* ─── 3 & 4. ECOLOGICAL REFLECTION + SUSTAINABLE ACTION (Uji Model) ─── */

  function isTestVisible() {
    var text = document.body ? document.body.innerText || '' : '';
    return text.indexOf('Uji Model dengan Foto Baru') >= 0 && text.indexOf('Foto Uji') >= 0;
  }

  function ensureReflectShell() {
    var panel = document.getElementById('sip-eco-reflect-panel');
    if (panel) return panel;

    var backdrop = document.createElement('div');
    backdrop.id = 'sip-eco-reflect-backdrop';
    backdrop.className = 'sip-eco-reflect-backdrop';
    backdrop.addEventListener('click', closeReflection);
    document.body.appendChild(backdrop);

    panel = document.createElement('div');
    panel.id = 'sip-eco-reflect-panel';
    panel.className = 'sip-eco-reflect-panel';
    document.body.appendChild(panel);
    return panel;
  }

  function closeReflection() {
    var panel = document.getElementById('sip-eco-reflect-panel');
    var backdrop = document.getElementById('sip-eco-reflect-backdrop');
    if (panel) panel.removeAttribute('data-open');
    if (backdrop) backdrop.removeAttribute('data-open');
  }

  function renderActionChips(container, category) {
    var selected = {};
    var chipsHtml = ACTION_CHOICES.map(function (choice) {
      return (
        '<label class="sip-eco-action-chip" data-choice="' + choice.key + '">' +
          '<input type="checkbox" value="' + choice.key + '"/>' +
          '<span>' + choice.icon + ' ' + choice.label + '</span>' +
        '</label>'
      );
    }).join('');

    container.innerHTML =
      '<div class="sip-eco-action-title">🌍 Satu Perubahan Saya untuk Bumi</div>' +
      '<div class="sip-eco-action-sub">Pilih minimal satu komitmen yang bisa kamu mulai minggu ini.</div>' +
      '<div class="sip-eco-action-grid">' + chipsHtml + '</div>' +
      '<button type="button" class="sip-eco-action-save" disabled>Simpan Komitmen</button>' +
      '<div class="sip-eco-action-status"></div>';

    var chips = Array.prototype.slice.call(container.querySelectorAll('.sip-eco-action-chip'));
    var saveBtn = container.querySelector('.sip-eco-action-save');
    var status = container.querySelector('.sip-eco-action-status');

    chips.forEach(function (chip) {
      var input = chip.querySelector('input');
      chip.addEventListener('click', function (event) {
        if (event.target !== input) input.checked = !input.checked;
        var key = chip.getAttribute('data-choice');
        if (input.checked) {
          selected[key] = true;
          chip.setAttribute('data-checked', '1');
        } else {
          delete selected[key];
          chip.removeAttribute('data-checked');
        }
        saveBtn.disabled = Object.keys(selected).length === 0;
      });
    });

    saveBtn.addEventListener('click', function () {
      var choices = Object.keys(selected);
      if (!choices.length) return;
      var total = saveCommitment(category, choices);
      status.textContent = 'Komitmenmu tersimpan! Total komitmen tercatat: ' + total + '.';
      saveBtn.disabled = true;
    });
  }

  function showReflection(result) {
    if (!result || !result.label || !CATEGORY_INFO[result.label]) return;
    ensureStyles();
    var info = CATEGORY_INFO[result.label];
    var panel = ensureReflectShell();

    panel.innerHTML =
      '<div class="sip-eco-reflect-head">' +
        '<div>' +
          '<div class="sip-eco-reflect-kicker">Refleksi Ekologis</div>' +
          '<div class="sip-eco-reflect-label" style="color:' + info.color + '">AI mengenali: ' + result.label + '</div>' +
          '<div class="sip-eco-reflect-conf">Keyakinan ' + Math.round(result.confidence || 0) + '%</div>' +
        '</div>' +
        '<button type="button" class="sip-eco-reflect-close" aria-label="Tutup">✕</button>' +
      '</div>' +
      '<div class="sip-eco-reflect-body">' +
        '<div class="sip-eco-reflect-block">' +
          '<h4>Dampak Lingkungan</h4>' +
          '<p>' + info.dampak + '</p>' +
        '</div>' +
        '<div class="sip-eco-reflect-block">' +
          '<h4>Pertanyaan Refleksi</h4>' +
          '<div class="sip-eco-reflect-q">' + info.reflect + '</div>' +
        '</div>' +
        '<div class="sip-eco-reflect-block">' +
          '<h4>Pertanyaan Kritis</h4>' +
          '<div class="sip-eco-reflect-q">' + info.critical + '</div>' +
        '</div>' +
        '<div id="sip-eco-action-slot"></div>' +
      '</div>';

    panel.querySelector('.sip-eco-reflect-close').addEventListener('click', closeReflection);
    renderActionChips(panel.querySelector('#sip-eco-action-slot'), result.label);

    logEco('eco-reflection', 'Refleksi Ekologis: ' + result.label, 'AI mengenali kategori ' + result.label + ' dengan keyakinan ' + Math.round(result.confidence || 0) + '%.');

    requestAnimationFrame(function () {
      panel.setAttribute('data-open', '1');
      var backdrop = document.getElementById('sip-eco-reflect-backdrop');
      if (backdrop) backdrop.setAttribute('data-open', '1');
    });
  }

  function hideReflectionIfLeftPage() {
    if (isTestVisible()) return;
    closeReflection();
  }

  var _lastEcoLabel = null;
  var _lastEcoTs = 0;

  function maybeShowReflection(result) {
    if (!isTestVisible()) return;
    if (!result || !result.label || !CATEGORY_INFO[result.label]) return;
    var now = Date.now();
    var sameLabel = result.label === _lastEcoLabel;
    if (sameLabel && (now - _lastEcoTs) < ECO_THROTTLE_MS) return;
    _lastEcoLabel = result.label;
    _lastEcoTs = now;
    showReflection(result);
  }

  function patchPredict() {
    if (!window.SipML || typeof window.SipML.predict !== 'function') {
      setTimeout(patchPredict, 400);
      return;
    }
    if (window.SipML._sipEcoPatched) return;
    window.SipML._sipEcoPatched = true;

    var originalPredict = window.SipML.predict.bind(window.SipML);
    window.SipML.predict = function () {
      var args = arguments;
      var promise = originalPredict.apply(window.SipML, args);
      if (promise && typeof promise.then === 'function') {
        promise.then(function (result) {
          try {
            maybeShowReflection(result);
          } catch (e) {
            /* Refleksi tidak boleh mengganggu alur prediksi asli. */
          }
        }).catch(function () {});
      }
      return promise;
    };
  }

  /* ─── HALAMAN: "Kontribusi SIPILAH terhadap SDGs" (overlay, tanpa router baru) ─── */

  function ensureSdgPageShell() {
    var panel = document.getElementById('sip-eco-page-panel');
    if (panel) return panel;

    var backdrop = document.createElement('div');
    backdrop.id = 'sip-eco-page-backdrop';
    backdrop.className = 'sip-eco-page-backdrop';
    backdrop.addEventListener('click', closeSdgPage);
    document.body.appendChild(backdrop);

    panel = document.createElement('div');
    panel.id = 'sip-eco-page-panel';
    panel.className = 'sip-eco-page-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Kontribusi SIPILAH terhadap SDGs');
    document.body.appendChild(panel);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeSdgPage();
    });

    return panel;
  }

  function closeSdgPage() {
    var panel = document.getElementById('sip-eco-page-panel');
    var backdrop = document.getElementById('sip-eco-page-backdrop');
    if (panel) panel.removeAttribute('data-open');
    if (backdrop) backdrop.removeAttribute('data-open');
  }

  function openSdgPage() {
    ensureStyles();
    var panel = ensureSdgPageShell();

    var cardsHtml = SDG_CARDS.map(function (sdg) {
      return (
        '<div class="sip-eco-sdg-card" style="border-left-color:' + sdg.color + '">' +
          '<span class="sip-eco-sdg-badge" style="background:' + sdg.color + '">SDG ' + sdg.number + '</span>' +
          '<div class="sip-eco-sdg-title">' + sdg.title + '</div>' +
          '<p class="sip-eco-sdg-copy">' + sdg.copy + '</p>' +
        '</div>'
      );
    }).join('');

    panel.innerHTML =
      '<div class="sip-eco-page-head">' +
        '<div>' +
          '<div class="sip-eco-reflect-kicker">Kontribusi Global</div>' +
          '<div class="sip-eco-page-title">🌍 Kontribusi SIPILAH terhadap SDGs</div>' +
          '<p class="sip-eco-copy" style="margin-top:8px;max-width:640px">SIPILAH dirancang agar aksi kecil di sekolah — memilah sampah, melatih AI, dan merefleksikan dampaknya — terhubung dengan agenda pembangunan berkelanjutan dunia.</p>' +
        '</div>' +
        '<button type="button" class="sip-eco-reflect-close" aria-label="Tutup">✕</button>' +
      '</div>' +
      '<div class="sip-eco-page-body"><div class="sip-eco-sdg-grid">' + cardsHtml + '</div></div>';

    var closeBtn = panel.querySelector('.sip-eco-reflect-close');
    if (closeBtn) closeBtn.addEventListener('click', closeSdgPage);

    logEco('eco-sdgs', 'Membuka Kontribusi SDGs', 'Siswa membuka ringkasan kontribusi SIPILAH terhadap SDG 4, 11, dan 12.');

    requestAnimationFrame(function () {
      panel.setAttribute('data-open', '1');
      var backdrop = document.getElementById('sip-eco-page-backdrop');
      if (backdrop) backdrop.setAttribute('data-open', '1');
    });
  }

  /* ─── REBRANDING LABEL: ganti teks KKA/AI-sentris di dalam bundle.js
     lewat penulisan ulang text node, tanpa menyentuh bundle.js maupun
     logika/komponennya. Aman untuk teks campuran (mis. kalimat yang
     sebagian di dalam tag <i>) karena bekerja di level text node. ─── */

  function patchRebranding() {
    if (!document.body) return;
    var bodyText = document.body.textContent || '';
    var mightHaveTargets = false;
    for (var c = 0; c < REBRANDING_MAP.length; c++) {
      if (bodyText.indexOf(REBRANDING_MAP[c][0]) !== -1) { mightHaveTargets = true; break; }
    }
    if (!mightHaveTargets) return;

    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var value = node.nodeValue;
      if (!value) continue;
      for (var i = 0; i < REBRANDING_MAP.length; i++) {
        var oldStr = REBRANDING_MAP[i][0];
        if (value.indexOf(oldStr) !== -1) {
          value = value.split(oldStr).join(REBRANDING_MAP[i][1]);
        }
      }
      if (value !== node.nodeValue) node.nodeValue = value;
    }
  }

  /* ─── BAGIAN 2 & 3: EKSPLORASI AWAL & REFLEKSI PERUBAHAN (Pre/Post-Test) ───
     bundle.js menyimpan SATU pool berisi 20 soal (p_all) lalu mengacak dan
     mengambil 10 untuk Pre-Test MAUPUN Post-Test (komponen quiz yang sama,
     dibedakan lewat prop "kind"). Karena logika acak & skor sepenuhnya ada
     di bundle.js dan tidak boleh disentuh, pendekatan yang aman adalah:
     menuliskan ULANG teks (topik, pertanyaan, 4 opsi) pada elemen yang
     sedang dirender — persis di INDEKS opsi yang sama dengan aslinya — agar
     logika "correct" (berbasis indeks, bukan teks) tetap bekerja seperti
     semula. Setiap soal asli (20) punya dua versi pengganti: "pretest"
     (eksploratif/dasar) dan "posttest" (reflektif/analitis lebih tinggi).
     Karena bundle.js mengacak 10 dari 20 secara acak murni, distribusi
     kategori A/B/C/D pada satu sesi mendekati rata-rata rasio pool
     (bukan dijamin persis di setiap sesi) — lihat catatan di ringkasan. */

  var QUIZ_BANK = [
    // Kategori A — Hubungan Manusia dan Lingkungan (asal id1-6)
    {
      originalQ: 'Apa yang dilakukan kecerdasan artifisial dalam SIPILAH?',
      pretest: {
        topic: 'Hubungan Manusia & Lingkungan',
        q: 'Aktivitas manusia dapat memengaruhi lingkungan karena...',
        opts: [
          'Manusia hidup terpisah dari alam sehingga aktivitasnya tidak pernah berdampak pada lingkungan',
          'Setiap kegiatan manusia—makan, membeli, membuang—melibatkan sumber daya dan berdampak pada lingkungan',
          'Lingkungan hanya dipengaruhi oleh bencana alam, bukan oleh kebiasaan manusia sehari-hari',
          'Alam selalu mampu memulihkan dirinya sendiri tanpa bergantung pada perilaku manusia',
        ],
      },
      posttest: {
        topic: 'Perubahan Cara Berpikir',
        q: 'Setelah menggunakan SIPILAH, siswa mampu memahami bahwa masalah sampah sekolah sebenarnya adalah cerminan dari...',
        opts: [
          'Kesalahan yang sepenuhnya dibuat oleh petugas kebersihan sekolah',
          'Pola perilaku dan kebiasaan warga sekolah dalam berinteraksi dengan lingkungan',
          'Kekurangan jumlah tempat sampah yang tersedia di sekolah',
          'Hal yang memang sudah semestinya dan tidak mungkin lagi diubah',
        ],
      },
    },
    {
      originalQ: 'Apa yang dimaksud dengan dataset seimbang?',
      pretest: {
        topic: 'Hubungan Manusia & Lingkungan',
        q: 'Sampah yang menumpuk di lingkungan sekolah paling banyak disebabkan oleh...',
        opts: [
          'Perubahan cuaca yang terjadi secara musiman di lingkungan sekolah',
          'Jumlah siswa yang belajar di sekolah tersebut setiap harinya',
          'Kebiasaan konsumsi dan cara warga sekolah membuang barang sehari-hari',
          'Letak sekolah yang berada jauh dari pusat kota besar',
        ],
      },
      posttest: {
        topic: 'Perubahan Cara Berpikir',
        q: 'Dibandingkan sebelum menggunakan SIPILAH, cara pandang siswa terhadap foto sampah yang mereka kumpulkan seharusnya berubah menjadi...',
        opts: [
          'Sekadar tugas sekolah untuk mengumpulkan foto sebanyak-banyaknya tanpa makna lain',
          'Kegiatan sekolah biasa yang sama sekali tidak berhubungan dengan kehidupan nyata',
          'Bukti nyata dari kebiasaan konsumsi dan pembuangan sampah di sekolah sendiri',
          'Sekadar bahan mentah untuk melatih sebuah program komputer di sekolah',
        ],
      },
    },
    {
      originalQ: 'Mengapa label foto harus benar?',
      pretest: {
        topic: 'Hubungan Manusia & Lingkungan',
        q: 'Mengapa hubungan manusia dan lingkungan penting dipelajari dalam IPS?',
        opts: [
          'Karena IPS hanya mempelajari peristiwa sejarah pada masa lampau',
          'Karena kehidupan manusia tidak bisa dipisahkan dari ruang dan lingkungannya',
          'Karena lingkungan dianggap sepenuhnya terpisah dari kehidupan sosial masyarakat',
          'Karena hanya ilmuwan di bidang alam yang perlu mempelajarinya',
        ],
      },
      posttest: {
        topic: 'Perubahan Cara Berpikir',
        q: 'Setelah menyelesaikan proyek SIPILAH, siswa diharapkan menyadari bahwa memahami masalah lingkungan membutuhkan...',
        opts: [
          'Hanya pengetahuan teknologi semata tanpa pemahaman sosial apa pun',
          'Perpaduan cara pandang IPS (manusia-lingkungan) dan kemampuan menganalisis data',
          'Hafalan istilah-istilah ilmiah semata tanpa perlu dipahami maknanya',
          'Keputusan yang diambil sepihak oleh satu orang saja',
        ],
      },
    },
    {
      originalQ: 'Apa yang dilakukan AI saat "dilatih"?',
      pretest: {
        topic: 'Hubungan Manusia & Lingkungan',
        q: 'Salah satu contoh interaksi manusia dengan lingkungan di sekolah adalah...',
        opts: [
          'Siswa belajar di kelas tanpa pernah menghasilkan sampah apa pun',
          'Sekolah beroperasi setiap hari tanpa menggunakan sumber daya apa pun',
          'Siswa membeli jajanan yang bungkusnya menjadi sampah setelah selesai dipakai',
          'Guru mengajar di kelas tanpa memakai alat tulis apa pun',
        ],
      },
      posttest: {
        topic: 'Perubahan Cara Berpikir',
        q: 'Proses mengumpulkan dan mengamati foto sampah dalam SIPILAH mengajarkan siswa bahwa pemahaman yang baik tentang suatu masalah lingkungan diperoleh melalui...',
        opts: [
          'Menebak-nebak jawaban begitu saja tanpa didukung data apa pun',
          'Mengabaikan pola yang sebenarnya muncul dari kenyataan di lapangan',
          'Belajar dari pengamatan nyata secara berulang untuk menemukan pola',
          'Menyalin pendapat orang lain begitu saja tanpa pernah memverifikasinya',
        ],
      },
    },
    {
      originalQ: 'Mengapa kita uji model dengan gambar BARU (di luar dataset latih)?',
      pretest: {
        topic: 'Hubungan Manusia & Lingkungan',
        q: 'Ruang (tempat) memengaruhi jenis sampah yang dihasilkan sekolah karena...',
        opts: [
          'Setiap sekolah pasti menghasilkan jenis dan jumlah sampah yang sama persis',
          'Lingkungan sekitar sekolah, misalnya dekat kantin atau pasar, memengaruhi jenis sampah yang muncul',
          'Ruang atau lokasi sekolah tidak berpengaruh apa pun pada kegiatan manusia',
          'Sampah hanya dihasilkan di lingkungan rumah, sama sekali bukan di sekolah',
        ],
      },
      posttest: {
        topic: 'Perubahan Cara Berpikir',
        q: 'Mengapa penting menguji pemahaman kita dengan situasi lingkungan yang belum pernah kita temui sebelumnya, bukan hanya yang sudah kita pelajari?',
        opts: [
          'Agar kita terlihat jauh lebih pintar di mata orang lain',
          'Untuk mengetahui apakah pemahaman bisa diterapkan pada situasi lingkungan baru',
          'Karena cara ini sebenarnya tidak memiliki manfaat apa pun',
          'Supaya proses belajar bisa cepat selesai tanpa banyak usaha',
        ],
      },
    },
    {
      originalQ: 'Akurasi model 80% artinya...',
      pretest: {
        topic: 'Hubungan Manusia & Lingkungan',
        q: 'Jika banyak sekolah di suatu kota tidak mengelola sampah dengan baik, dampaknya adalah...',
        opts: [
          'Tidak akan ada dampak apa pun karena sekolah bukan bagian dari kota',
          'Kualitas lingkungan kota, seperti air, tanah, dan udara, bisa ikut menurun',
          'Kota justru akan otomatis menjadi lebih bersih dengan sendirinya',
          'Dampaknya hanya akan dirasakan oleh satu sekolah itu saja',
        ],
      },
      posttest: {
        topic: 'Perubahan Cara Berpikir',
        q: 'Jika hasil refleksi menunjukkan pemahaman siswa belum sepenuhnya tepat, sikap yang tepat setelah proyek SIPILAH adalah...',
        opts: [
          'Berhenti belajar sama sekali karena merasa sudah gagal',
          'Menjadikan kekeliruan sebagai bahan refleksi untuk memperbaiki pemahaman',
          'Menyalahkan sistem penilaian yang dianggap tidak adil baginya',
          'Mengabaikan begitu saja hasil evaluasi yang sudah didapatkan',
        ],
      },
    },
    // Kategori B — Sampah dan Keberlanjutan (asal id7-12)
    {
      originalQ: 'Kulit pisang masuk kategori sampah...',
      pretest: {
        topic: 'Sampah & Keberlanjutan',
        q: 'Mengapa pemilahan sampah penting dilakukan?',
        opts: [
          'Supaya tumpukan sampah terlihat lebih rapi di tempat pembuangan',
          'Agar petugas kebersihan sekolah bisa bekerja jauh lebih cepat',
          'Agar sampah dapat diproses sesuai jenisnya sehingga lebih mudah didaur ulang',
          'Karena aturan sekolah mewajibkannya tanpa alasan lingkungan yang jelas',
        ],
      },
      posttest: {
        topic: 'Hubungan Perilaku & Lingkungan',
        q: 'Setelah proyek SIPILAH, siswa memahami bahwa tindakan memilah sampah bermakna penting karena...',
        opts: [
          'Hanya membuat tempat sampah sekolah terlihat lebih rapi',
          'Merupakan formalitas tugas sekolah semata tanpa makna lain',
          'Langkah nyata yang menghubungkan perilaku individu dengan lingkungan bersama',
          'Tidak memiliki manfaat apa pun dalam jangka panjang',
        ],
      },
    },
    {
      originalQ: 'Tisu basah bekas pakai masuk kategori...',
      pretest: {
        topic: 'Sampah & Keberlanjutan',
        q: 'Sampah organik yang tidak dipilah dan berakhir di TPA dapat menyebabkan...',
        opts: [
          'Tanah di sekitar TPA menjadi lebih subur secara otomatis',
          'Tidak akan menimbulkan dampak apa pun bagi lingkungan sekitarnya',
          'Pembusukan yang menghasilkan gas metana, salah satu penyumbang pemanasan global',
          'Sampah tersebut lambat laun berubah wujud menjadi plastik',
        ],
      },
      posttest: {
        topic: 'Hubungan Perilaku & Lingkungan',
        q: "Pemahaman siswa tentang sampah organik yang tidak terkelola berubah setelah SIPILAH, dari sekadar 'sampah basah' menjadi...",
        opts: [
          'Sesuatu yang sebenarnya tidak penting untuk terus dipikirkan',
          'Jenis sampah yang paling mudah untuk diabaikan begitu saja',
          'Sumber gas rumah kaca yang berkontribusi pada perubahan iklim global',
          'Jenis sampah yang justru paling berharga di antara semuanya',
        ],
      },
    },
    {
      originalQ: 'Memecah masalah besar (pilah sampah sekolah) menjadi langkah-langkah kecil disebut...',
      pretest: {
        topic: 'Sampah & Keberlanjutan',
        q: 'Konsep keberlanjutan (sustainability) berarti...',
        opts: [
          'Menggunakan sumber daya alam sebanyak-banyaknya demi generasi saat ini',
          'Memenuhi kebutuhan saat ini tanpa merusak kemampuan generasi mendatang memenuhi kebutuhannya',
          'Menghentikan sama sekali seluruh kegiatan produksi dan konsumsi manusia',
          'Sebuah konsep yang hanya berlaku bagi negara-negara maju di dunia',
        ],
      },
      posttest: {
        topic: 'Hubungan Perilaku & Lingkungan',
        q: 'Hubungan sebab-akibat antara perilaku manusia dan lingkungan yang dipelajari lewat SIPILAH menunjukkan bahwa...',
        opts: [
          'Lingkungan pada dasarnya sama sekali tidak dipengaruhi oleh perilaku manusia',
          'Kebiasaan kecil yang dilakukan berulang oleh banyak orang dapat berdampak besar',
          'Hanya industri-industri besar sajalah yang benar-benar memengaruhi lingkungan sekitar',
          'Perilaku individu tidak pernah berpengaruh secara signifikan pada apa pun',
        ],
      },
    },
    {
      originalQ: 'Jika model sering keliru pada kategori kertas, langkah perbaikan yang TEPAT?',
      pretest: {
        topic: 'Sampah & Keberlanjutan',
        q: 'Jika sekolah ingin mengurangi jumlah sampah residu (sulit didaur ulang), langkah paling tepat adalah...',
        opts: [
          'Membiarkannya saja karena sampah residu dianggap tidak berbahaya',
          'Membakar seluruh sampah residu tersebut di halaman sekolah',
          'Mengurangi penggunaan barang sekali pakai dan memilah sampah sejak awal',
          'Menambah jumlah tempat sampah tanpa disertai dengan pemilahan',
        ],
      },
      posttest: {
        topic: 'Hubungan Perilaku & Lingkungan',
        q: 'Jika suatu kota memiliki banyak sekolah yang menerapkan pemilahan sampah seperti SIPILAH, dampak jangka panjang bagi kota tersebut adalah...',
        opts: [
          'Tidak akan terjadi perubahan yang berarti sama sekali',
          'Kota tersebut akan menjadi jauh lebih padat penduduknya',
          'Beban sampah residu di kota berkurang dan kesadaran warga meningkat',
          'Sekolah-sekolah tersebut justru kehilangan banyak waktu belajar di kelas',
        ],
      },
    },
    {
      originalQ: 'Dalam SIPILAH, model AI bisa mengenali jenis sampah karena...',
      pretest: {
        topic: 'Sampah & Keberlanjutan',
        q: 'Sampah kertas berbeda dari sampah plastik dalam hal keberlanjutan karena...',
        opts: [
          'Kertas sama sekali tidak berasal dari sumber daya alam',
          'Kertas lebih cepat terurai dan lebih mudah didaur ulang',
          'Plastik pada dasarnya selalu jauh lebih ramah lingkungan',
          'Kertas dan plastik sama-sama sama sekali tidak bisa didaur ulang',
        ],
      },
      posttest: {
        topic: 'Hubungan Perilaku & Lingkungan',
        q: 'Setelah menggunakan SIPILAH, siswa memahami bahwa memilah sampah kertas berkaitan langsung dengan upaya...',
        opts: [
          'Menambah jumlah sampah yang menumpuk di sekolah',
          'Mengurangi tekanan terhadap penebangan pohon melalui proses daur ulang',
          'Membuat harga kertas menjadi jauh lebih mahal',
          'Menghentikan sepenuhnya seluruh penggunaan kertas di sekolah',
        ],
      },
    },
    {
      originalQ: 'Dataset yang baik untuk melatih AI klasifikasi sampah harus...',
      pretest: {
        topic: 'Sampah & Keberlanjutan',
        q: 'Praktik memilah sampah di sekolah adalah bentuk kontribusi terhadap...',
        opts: [
          'Sekadar menambah pekerjaan siswa tanpa manfaat yang jelas',
          'Kegiatan yang hanya berlaku dan relevan di negara lain',
          'Upaya keberlanjutan lingkungan yang dimulai dari lingkup terkecil, yaitu sekolah',
          'Aturan sekolah semata yang tidak berkaitan dengan lingkungan',
        ],
      },
      posttest: {
        topic: 'Hubungan Perilaku & Lingkungan',
        q: 'Kebiasaan memilah sampah yang dibangun di sekolah paling tepat dipahami sebagai...',
        opts: [
          'Kegiatan satu kali yang selesai begitu saja setelah proyek berakhir',
          'Aturan sekolah yang tidak berkaitan dengan kehidupan siswa di luar sekolah',
          'Budaya berkelanjutan yang idealnya terus dibawa ke rumah dan masyarakat',
          'Tanggung jawab yang hanya dimiliki oleh petugas kebersihan sekolah',
        ],
      },
    },
    // Kategori C — Perilaku Ramah Lingkungan (asal id13-16)
    {
      originalQ: 'Saat melabeli foto sampah, yang paling penting adalah...',
      pretest: {
        topic: 'Perilaku Ramah Lingkungan',
        q: 'Contoh perilaku ramah lingkungan yang bisa dilakukan siswa sehari-hari adalah...',
        opts: [
          'Membeli minuman dalam kemasan sekali pakai setiap harinya',
          'Membawa botol minum sendiri untuk mengurangi sampah plastik',
          'Membuang sampah sembarangan asal supaya lebih cepat selesai',
          'Menggunakan kertas sebanyak-banyaknya tanpa memikirkan dampaknya',
        ],
      },
      posttest: {
        topic: 'Dampak Konsumsi',
        q: 'Setelah SIPILAH, siswa memahami bahwa mengurangi penggunaan plastik sekali pakai adalah bentuk tindakan yang berkaitan langsung dengan...',
        opts: [
          'Menambah variasi jajanan yang dijual di kantin sekolah',
          'Menekan jumlah sampah yang dihasilkan dari kebiasaan konsumsi sehari-hari',
          'Meningkatkan angka penjualan produk berkemasan di kantin',
          'Membuat suasana kantin sekolah menjadi jauh lebih ramai',
        ],
      },
    },
    {
      originalQ: 'Transfer Learning mempercepat pelatihan AI karena...',
      pretest: {
        topic: 'Perilaku Ramah Lingkungan',
        q: 'Mengapa kebiasaan kecil seperti membawa bekal dari rumah bisa berdampak besar bagi lingkungan?',
        opts: [
          'Karena kebiasaan tersebut sebenarnya tidak ada hubungannya dengan sampah',
          'Karena jika dilakukan banyak siswa rutin, sampah kemasan berkurang signifikan',
          'Karena membawa bekal sendiri selalu jauh lebih mahal biayanya',
          'Karena kebiasaan ini hanya berlaku dan berdampak bagi satu orang saja',
        ],
      },
      posttest: {
        topic: 'Dampak Konsumsi',
        q: 'Kesadaran tentang dampak konsumsi yang dibangun lewat SIPILAH mengajarkan bahwa setiap barang yang dibeli siswa...',
        opts: [
          'Sama sekali tidak memiliki hubungan dengan sampah yang dihasilkan',
          'Pada akhirnya akan menjadi sampah yang harus dikelola lingkungan',
          'Selalu bersifat ramah lingkungan tanpa syarat apa pun',
          'Tidak perlu lagi dipikirkan dampaknya bagi lingkungan sekitar',
        ],
      },
    },
    {
      originalQ: 'Mengapa model diuji dengan foto yang BERBEDA dari dataset latih?',
      pretest: {
        topic: 'Perilaku Ramah Lingkungan',
        q: 'Sikap yang sebaiknya dimiliki siswa ketika melihat sampah berserakan di sekolah adalah...',
        opts: [
          'Mengabaikannya begitu saja karena dianggap bukan tanggung jawabnya',
          'Menyalahkan petugas kebersihan sekolah tanpa ikut bertindak apa pun',
          'Ikut peduli dengan memungut atau melaporkannya agar segera dikelola',
          'Menambah sampah di tempat itu karena dianggap sudah kotor',
        ],
      },
      posttest: {
        topic: 'Dampak Konsumsi',
        q: 'Setelah memahami dampak konsumsi lewat SIPILAH, langkah paling tepat yang bisa diambil siswa adalah...',
        opts: [
          'Terus mengonsumsi seperti biasa tanpa ada perubahan apa pun',
          'Menyalahkan produsen sepenuhnya tanpa melakukan introspeksi diri sendiri',
          'Mulai memilih dan mengurangi konsumsi barang yang sulit terurai',
          'Berhenti sama sekali menggunakan barang apa pun setiap harinya',
        ],
      },
    },
    {
      originalQ: "Jika akurasi uji model SIPILAH-mu adalah 65%, artinya...",
      pretest: {
        topic: 'Perilaku Ramah Lingkungan',
        q: 'Perilaku ramah lingkungan di sekolah paling baik dibangun melalui...',
        opts: [
          'Pemberian hukuman yang berat bagi siapa pun yang melanggar',
          'Larangan yang diberlakukan tanpa disertai penjelasan yang jelas',
          'Kebiasaan dan budaya sekolah yang konsisten, bukan sekadar aturan sesaat',
          'Kegiatan seremonial yang hanya dilakukan sekali dalam setahun',
        ],
      },
      posttest: {
        topic: 'Dampak Konsumsi',
        q: 'Dampak konsumsi yang dipelajari melalui SIPILAH paling tepat dipahami sebagai hubungan antara...',
        opts: [
          'Harga sebuah barang dan kualitas kemasan yang digunakan',
          'Jumlah uang saku siswa dan nilai pelajaran di sekolah',
          'Pilihan konsumsi individu dan jumlah sampah yang ditanggung lingkungan',
          'Merek suatu produk dan tingkat popularitasnya di sekolah',
        ],
      },
    },
    // Kategori D — SDGs dan Pembangunan Berkelanjutan (asal id17-20)
    {
      originalQ: 'Sedotan plastik minuman yang sudah terpakai termasuk kategori sampah...',
      pretest: {
        topic: 'SDGs & Pembangunan Berkelanjutan',
        q: 'SDGs (Sustainable Development Goals) adalah agenda global yang bertujuan untuk...',
        opts: [
          'Menghentikan seluruh proses pembangunan di semua negara di dunia',
          'Memaksimalkan keuntungan ekonomi semata tanpa memperhatikan kondisi lingkungan',
          'Mewujudkan pembangunan yang seimbang antara aspek sosial, ekonomi, dan lingkungan',
          'Berfokus hanya pada kepentingan negara-negara maju di dunia',
        ],
      },
      posttest: {
        topic: 'Tindakan Keberlanjutan',
        q: 'Setelah menyelesaikan SIPILAH, tindakan keberlanjutan yang paling tepat dilakukan siswa di sekolah adalah...',
        opts: [
          'Menunggu pihak sekolah bertindak tanpa keterlibatan siswa sama sekali',
          'Menganggap proyek sudah selesai begitu laporan dikumpulkan ke guru',
          'Mempraktikkan dan mengajak orang lain melakukan pemilahan sampah secara konsisten',
          'Membandingkan sekolah sendiri dengan sekolah lain tanpa disertai aksi nyata',
        ],
      },
    },
    {
      originalQ: 'Kertas HVS bekas coretan yang kering dan bersih termasuk kategori...',
      pretest: {
        topic: 'SDGs & Pembangunan Berkelanjutan',
        q: 'Kegiatan memilah sampah di sekolah paling berkaitan dengan tujuan SDG nomor...',
        opts: [
          'SDG 1 - Mengentaskan Kemiskinan di Segala Bentuk',
          'SDG 2 - Mengakhiri Kelaparan dan Ketahanan Pangan',
          'SDG 6 - Air Bersih dan Sanitasi Layak untuk Semua',
          'SDG 12 - Konsumsi dan Produksi yang Bertanggung Jawab',
        ],
      },
      posttest: {
        topic: 'Tindakan Keberlanjutan',
        q: "Komitmen aksi seperti 'membawa botol minum sendiri' yang diambil siswa setelah SIPILAH paling berkaitan dengan tujuan...",
        opts: [
          'Sekadar menambah satu barang bawaan baru ke sekolah',
          'Mengikuti tren yang sedang populer tanpa alasan tertentu',
          'Menghemat uang jajan semata tanpa tujuan lain',
          'Konsumsi dan produksi yang bertanggung jawab, sesuai SDG 12',
        ],
      },
    },
    {
      originalQ: 'Abstraksi dalam proyek SIPILAH ditunjukkan dengan...',
      pretest: {
        topic: 'SDGs & Pembangunan Berkelanjutan',
        q: "SDG 11 tentang 'Kota dan Komunitas Berkelanjutan' berkaitan dengan sekolah karena...",
        opts: [
          'Sekolah dianggap sama sekali tidak termasuk bagian dari kota',
          'Sekolah adalah bagian dari komunitas kota yang menentukan kualitas ruang hidup',
          'SDG 11 hanya berlaku bagi pemerintah kota, bukan sekolah',
          'Sekolah tidak memiliki pengaruh apa pun terhadap lingkungan kota',
        ],
      },
      posttest: {
        topic: 'Tindakan Keberlanjutan',
        q: 'Tindakan keberlanjutan yang dibangun siswa di sekolah, jika dilakukan konsisten oleh banyak sekolah, dapat berkontribusi pada terciptanya...',
        opts: [
          'Sekolah-sekolah yang semakin terisolasi dari lingkungan kota',
          'Komunitas kota yang lebih layak huni dan berkelanjutan',
          'Persaingan antar sekolah yang tidak sehat satu sama lain',
          'Beban tambahan baru yang harus ditanggung pemerintah kota',
        ],
      },
    },
    {
      originalQ: 'Aksi nyata yang paling relevan setelah menyelesaikan proyek SIPILAH adalah...',
      pretest: {
        topic: 'SDGs & Pembangunan Berkelanjutan',
        q: 'Pembangunan berkelanjutan penting dipelajari siswa sejak dini karena...',
        opts: [
          'Agar siswa kelak dapat menjadi pejabat pemerintah di kotanya',
          'Karena topik ini sebenarnya tidak berkaitan dengan kehidupan siswa',
          'Siswa adalah generasi yang akan merasakan dampak keputusan lingkungan hari ini',
          'Karena topik ini akan diujikan di semua mata pelajaran sekolah',
        ],
      },
      posttest: {
        topic: 'Tindakan Keberlanjutan',
        q: 'Puncak dari perjalanan belajar SIPILAH—dari kesadaran hingga aksi—adalah siswa mampu...',
        opts: [
          'Menghafal seluruh istilah lingkungan yang telah dipelajari',
          'Menyelesaikan seluruh soal ujian tanpa satu pun kesalahan',
          'Mengubah kesadaran menjadi kebiasaan dan tindakan nyata yang berkelanjutan',
          'Mendapatkan nilai tertinggi di antara seluruh teman sekelas',
        ],
      },
    },
  ];

  function findQuizEntry(originalText) {
    for (var i = 0; i < QUIZ_BANK.length; i++) {
      if (QUIZ_BANK[i].originalQ === originalText) return QUIZ_BANK[i];
    }
    return null;
  }

  function isPreTestVisible() {
    var text = document.body ? document.body.innerText || '' : '';
    return text.indexOf('Eksplorasi Awal Kesadaran Ekologis') >= 0 || text.indexOf('Pre-Test SIPILAH') >= 0;
  }

  function isPostTestVisible() {
    var text = document.body ? document.body.innerText || '' : '';
    return text.indexOf('Refleksi Perubahan Pemahaman Ekologis') >= 0 || text.indexOf('Post-Test SIPILAH') >= 0;
  }

  function patchRunningQuestion(kind) {
    var qEls = document.querySelectorAll('.text-xl.md\\:text-2xl.font-bold.text-slate-900.leading-snug');
    for (var q = 0; q < qEls.length; q++) {
      var qEl = qEls[q];
      var originalText = qEl.textContent.trim();
      var entry = findQuizEntry(originalText);
      if (!entry) continue;
      var content = entry[kind];

      var card = qEl.parentElement;
      if (card) {
        var headerRow = card.querySelector('.flex.items-center.gap-2.mb-3');
        var topicSpan = headerRow ? headerRow.querySelector('span') : null;
        if (topicSpan) topicSpan.textContent = content.topic;

        var optsContainer = card.querySelector('.mt-5.space-y-2\\.5');
        if (optsContainer) {
          var optTexts = optsContainer.querySelectorAll('button .font-semibold.leading-snug');
          for (var i = 0; i < optTexts.length && i < content.opts.length; i++) {
            optTexts[i].textContent = content.opts[i];
          }
        }
      }
      qEl.textContent = content.q;
    }
  }

  function patchResultReview(kind) {
    var qEls = document.querySelectorAll('.font-semibold.text-slate-800.mt-0\\.5');
    for (var q = 0; q < qEls.length; q++) {
      var qEl = qEls[q];
      var originalText = qEl.textContent.trim();
      var entry = findQuizEntry(originalText);
      if (!entry) continue;
      var content = entry[kind];

      var headerBlock = qEl.parentElement;
      var metaEl = headerBlock ? headerBlock.querySelector('.text-xs.font-bold.uppercase.tracking-wider.text-slate-500') : null;
      if (metaEl) {
        var metaMatch = /^(Soal\s*\d+)/.exec(metaEl.textContent.trim());
        if (metaMatch) metaEl.textContent = metaMatch[1] + ' · ' + content.topic;
      }

      var row = headerBlock ? headerBlock.parentElement : null;
      var expandedWrap = row && row.parentElement ? row.parentElement.querySelector('.pl-14') : null;
      if (expandedWrap) {
        var optSpans = expandedWrap.querySelectorAll(':scope > div > span:not([class])');
        for (var i = 0; i < optSpans.length && i < content.opts.length; i++) {
          optSpans[i].textContent = content.opts[i];
        }
      }
      qEl.textContent = content.q;
    }
  }

  function patchQuizScreen() {
    if (isPreTestVisible()) {
      patchRunningQuestion('pretest');
      patchResultReview('pretest');
    } else if (isPostTestVisible()) {
      patchRunningQuestion('posttest');
      patchResultReview('posttest');
    }
  }

  var _quizClickBound = false;

  function bindQuizClickListener() {
    if (_quizClickBound) return;
    _quizClickBound = true;
    document.addEventListener('click', function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(patchQuizScreen);
      });
    });
  }

  /* ─── BOOTSTRAP ─── */

  function syncAll() {
    ensureStyles();
    mountLandingHero();
    mountResearchQuestion();
    mountIpsCard();
    mountAwareness();
    mountImpactJourney();
    mountWasteData();
    mountJourney();
    patchRebranding();
    patchQuizScreen();
    hideReflectionIfLeftPage();
  }

  window.addEventListener('load', function () {
    syncAll();
    patchPredict();
    bindQuizClickListener();
    var observer = new MutationObserver(syncAll);
    observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
  });
})();
