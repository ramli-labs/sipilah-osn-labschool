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

  var ONBOARDING_TAGLINE_OLD = 'Belajar AI lewat aksi pilah sampah sekolah.';
  var ONBOARDING_TAGLINE_NEW = 'Memahami hubungan manusia dan lingkungan melalui teknologi AI.';

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

  function buildJourneyCard() {
    var card = document.createElement('div');
    card.className = 'sip-eco-card';
    card.setAttribute('data-sip-eco-journey', 'true');
    var stepsHtml = JOURNEY_STEPS.map(function (step, i) {
      var stepHtml =
        '<div class="sip-eco-journey-step">' +
          '<div class="sip-eco-journey-icon">' + step.icon + '</div>' +
          '<div class="sip-eco-journey-label">' + step.label + '</div>' +
          '<div class="sip-eco-journey-copy">' + step.copy + '</div>' +
        '</div>';
      if (i < JOURNEY_STEPS.length - 1) {
        stepHtml += '<div class="sip-eco-journey-arrow">→</div>';
      }
      return stepHtml;
    }).join('');
    card.innerHTML =
      '<div class="sip-eco-eyebrow">Ekopedagogi &middot; Waste Journey</div>' +
      '<div class="sip-eco-title">🔄 Perjalanan Sampah: Dari Konsumsi Sampai Dampaknya</div>' +
      '<p class="sip-eco-copy">Setiap sampah yang kamu foto di halaman ini punya perjalanan panjang sebelum dan sesudah keluar dari tangan kita. Memilah adalah satu titik kecil dari perjalanan yang lebih besar.</p>' +
      '<div class="sip-eco-journey-row">' + stepsHtml + '</div>';
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

  /* ─── BRANDING AWAL: ganti tagline onboarding tanpa mengubah bundle.js ─── */

  function patchOnboardingTagline() {
    var bodyText = document.body ? document.body.textContent || '' : '';
    if (bodyText.indexOf(ONBOARDING_TAGLINE_OLD) === -1) return;
    var nodes = document.querySelectorAll('div');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.childElementCount === 0 && el.textContent.trim() === ONBOARDING_TAGLINE_OLD) {
        el.textContent = ONBOARDING_TAGLINE_NEW;
      }
    }
  }

  /* ─── BOOTSTRAP ─── */

  function syncAll() {
    ensureStyles();
    mountLandingHero();
    mountAwareness();
    mountWasteData();
    mountJourney();
    patchOnboardingTagline();
    hideReflectionIfLeftPage();
  }

  window.addEventListener('load', function () {
    syncAll();
    patchPredict();
    var observer = new MutationObserver(syncAll);
    observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
  });
})();
