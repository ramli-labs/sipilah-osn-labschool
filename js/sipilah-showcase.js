(function () {
  const fmt = (value, fallback = "0") => (value == null || value === "" ? fallback : value);

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function getMetrics() {
    const project = readJSON("sipilah_project_v1", {});
    const tests = readJSON("sipilah_tests_v1", {});
    const identity = readJSON("sipilah_identity_v1", {});
    const dataset = project.datasetCount || { plastik: 0, kertas: 0, organik: 0, residu: 0 };
    const totalDataset = Object.values(dataset).reduce((sum, n) => sum + Number(n || 0), 0);
    const predictions = project.predictions || [];
    const correct = predictions.filter((item) => item && item.isCorrect).length;
    const testAccuracy = predictions.length ? Math.round((correct / predictions.length) * 100) : 0;
    const pre = tests.pre && typeof tests.pre.score === "number" ? tests.pre.score : null;
    const post = tests.post && typeof tests.post.score === "number" ? tests.post.score : null;
    const gain = pre != null && post != null ? post - pre : null;

    return {
      identity,
      dataset,
      totalDataset,
      modelReady: !!project.modelReady,
      modelAccuracy: project.accuracy || 0,
      predictions: predictions.length,
      testAccuracy,
      pre,
      post,
      gain,
    };
  }

  function buildLaporanAnalysis(metrics) {
    const parts = [];
    if (metrics.totalDataset >= 40) {
      parts.push(`Kelompok berhasil mengumpulkan ${metrics.totalDataset} foto dataset yang mencakup keempat kategori sampah sekolah. Jumlah ini memadai untuk melatih model klasifikasi yang representatif.`);
    } else if (metrics.totalDataset >= 16) {
      parts.push(`Kelompok mengumpulkan ${metrics.totalDataset} foto dataset. Dataset ini cukup untuk memulai pelatihan model; penambahan foto dapat meningkatkan akurasi lebih jauh.`);
    } else {
      parts.push(`Kelompok mengumpulkan ${metrics.totalDataset} foto dataset sampah sekolah. Menambah variasi foto pada setiap kategori akan memperkuat kemampuan model mengenali pola yang lebih beragam.`);
    }
    if (metrics.modelReady) {
      const acc = metrics.modelAccuracy || 0;
      if (acc >= 80) parts.push(`Model AI yang dilatih mencapai akurasi ${acc}%, menunjukkan kemampuan klasifikasi yang baik dalam membedakan plastik, kertas, organik, dan residu.`);
      else if (acc >= 60) parts.push(`Model AI mencapai akurasi ${acc}%, menunjukkan model mampu mempelajari pola dasar keempat kategori sampah. Penambahan foto atau penyesuaian label dapat meningkatkan hasilnya.`);
      else parts.push(`Model AI mencapai akurasi ${acc}%. Hasil ini menjadi bahan refleksi: galeri kesalahan prediksi dapat dianalisis untuk memahami pola yang perlu diperkuat.`);
    } else {
      parts.push("Model AI belum dilatih. Tahap pelatihan dapat dilanjutkan setelah dataset selesai dikumpulkan.");
    }
    if (metrics.pre != null && metrics.post != null) {
      if (metrics.gain > 0) parts.push(`Asesmen literasi AI menunjukkan peningkatan nyata: skor Pre-Test ${metrics.pre} meningkat menjadi ${metrics.post} pada Post-Test (+${metrics.gain} poin), mencerminkan penguatan pemahaman melalui pengalaman proyek langsung.`);
      else if (metrics.gain === 0) parts.push(`Skor asesmen stabil dari Pre-Test (${metrics.pre}) ke Post-Test (${metrics.post}). Refleksi lebih mendalam pada setiap tahapan dapat mengkonsolidasi pemahaman yang telah diperoleh.`);
      else parts.push(`Terdapat selisih antara Pre-Test (${metrics.pre}) dan Post-Test (${metrics.post}). Perbedaan ini menjadi bahan evaluasi: aspek mana yang perlu diperkuat agar pemahaman AI lebih solid.`);
    }
    parts.push("Proyek SIPILAH ini membuktikan bahwa pembelajaran kecerdasan artifisial dapat dilakukan secara nyata di lingkungan sekolah melalui pendekatan berbasis aksi pilah sampah yang dekat dengan keseharian siswa.");
    return parts.join(" ");
  }

  function renderLaporanModal() {
    if (document.getElementById("sip-laporan-modal")) return;
    const metrics = getMetrics();
    const identity = metrics.identity || {};
    const dataset = metrics.dataset || {};
    const date = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const kelompok = (identity.group || "").trim() || "—";
    const kelas = (identity.kelas || "").trim() || "—";
    const school = (identity.school || "").trim() || "—";
    const name = (identity.name || "").trim() || "—";
    const role = identity.role || "Siswa";
    const gainText = metrics.gain != null ? `${metrics.gain >= 0 ? "+" : ""}${metrics.gain} poin` : "—";
    const prePost = metrics.pre != null && metrics.post != null ? `${metrics.pre} → ${metrics.post}` : "— → —";
    const accuracy = metrics.modelReady ? `${metrics.modelAccuracy || 0}%` : "Belum dilatih";
    const analysis = buildLaporanAnalysis(metrics);
    const cats = ["plastik", "kertas", "organik", "residu"];
    const catColors = { plastik: "#0ea5e9", kertas: "#f59e0b", organik: "#10b981", residu: "#64748b" };
    const catLabels = { plastik: "Plastik", kertas: "Kertas", organik: "Organik", residu: "Residu" };
    const maxCat = Math.max(...cats.map((c) => dataset[c] || 0), 1);

    const style = document.createElement("style");
    style.id = "sip-laporan-style";
    style.textContent = `
      #sip-laporan-modal{position:fixed;inset:0;z-index:130;display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow-y:auto;background:rgba(15,23,42,.65);backdrop-filter:blur(10px);font-family:system-ui,-apple-system,sans-serif}
      .sip-lap-wrap{background:#fff;border-radius:20px;box-shadow:0 40px 100px -30px rgba(15,23,42,.6);max-width:780px;width:100%;margin:auto}
      .sip-lap-actions{display:flex;gap:10px;padding:12px 20px 14px;justify-content:flex-end;border-bottom:1px solid #e2e8f0;background:#f8fafc;border-radius:20px 20px 0 0}
      .sip-lap-close-btn{border:1px solid #e2e8f0;background:#fff;border-radius:10px;padding:7px 14px;font:700 12px system-ui,sans-serif;cursor:pointer;color:#64748b}
      .sip-lap-print-btn{border:0;border-radius:10px;background:#15803d;color:#fff;padding:8px 18px;font:800 13px system-ui,sans-serif;cursor:pointer}
      .sip-lap-print-btn:hover{background:#166534}
      .sip-lap-body{padding:32px 36px 28px}
      .sip-lap-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #15803d}
      .sip-lap-title{font-size:20px;font-weight:900;color:#0f172a;margin:0 0 3px}
      .sip-lap-sub{font-size:12px;color:#64748b;margin:0}
      .sip-lap-badge{font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#15803d;background:#dcfce7;border:1px solid #bbf7d0;border-radius:999px;padding:3px 8px;white-space:nowrap;margin-top:6px;display:inline-block}
      .sip-lap-identity{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-bottom:18px;background:#f8fafc;border-radius:12px;padding:12px 14px;border:1px solid #e2e8f0}
      .sip-lap-id-item{font-size:11px;color:#64748b}.sip-lap-id-item strong{color:#0f172a;font-weight:800}
      .sip-lap-section{margin-bottom:18px}
      .sip-lap-section-title{font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#15803d;margin:0 0 8px;padding-bottom:5px;border-bottom:1px solid #e2e8f0}
      .sip-lap-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
      .sip-lap-stat{border:1px solid #e2e8f0;border-radius:10px;padding:10px 8px;text-align:center;background:#fff}
      .sip-lap-stat strong{display:block;font-size:20px;font-weight:900;color:#0f172a;line-height:1}
      .sip-lap-stat span{display:block;font-size:9px;color:#64748b;font-weight:700;margin-top:3px;text-transform:uppercase;letter-spacing:.05em}
      .sip-lap-bars{display:grid;gap:7px}
      .sip-lap-bar-row{display:grid;grid-template-columns:64px 1fr 32px;align-items:center;gap:8px;font-size:11px}
      .sip-lap-bar-label{font-weight:700;color:#334155}
      .sip-lap-bar-track{height:10px;background:#f1f5f9;border-radius:999px;overflow:hidden}
      .sip-lap-bar-fill{height:100%;border-radius:999px;transition:width .4s ease}
      .sip-lap-bar-count{font-weight:800;color:#64748b;text-align:right}
      .sip-lap-prepost{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;background:#f0fdf4;border-radius:12px;padding:14px;border:1px solid #bbf7d0}
      .sip-lap-pp-box{text-align:center}
      .sip-lap-pp-box strong{display:block;font-size:28px;font-weight:900;color:#0f172a;line-height:1}
      .sip-lap-pp-box span{display:block;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-top:3px}
      .sip-lap-pp-arrow{font-size:24px;color:#15803d;font-weight:900;text-align:center}
      .sip-lap-analysis{font-size:12px;color:#334155;line-height:1.7;background:#fafbf7;border-radius:10px;padding:12px 14px;border:1px solid #e2e8f0}
      .sip-lap-steps{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}
      .sip-lap-step{border-radius:8px;background:#ecfdf5;color:#166534;text-align:center;font-size:9px;font-weight:800;padding:7px 4px;border:1px solid #bbf7d0}
      .sip-lap-footer{display:flex;align-items:center;justify-content:space-between;margin-top:16px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8}
      @media print{
        body>*:not(#sip-laporan-modal){display:none!important}
        #sip-laporan-modal{position:static!important;background:none!important;backdrop-filter:none!important;padding:0!important;overflow:visible!important;display:block!important}
        .sip-lap-wrap{box-shadow:none!important;border-radius:0!important;max-width:100%!important}
        .sip-lap-actions{display:none!important}
        .sip-lap-body{padding:20px 24px!important}
      }
    `;
    document.head.appendChild(style);

    const modal = document.createElement("div");
    modal.id = "sip-laporan-modal";
    modal.innerHTML = `
      <div class="sip-lap-wrap">
        <div class="sip-lap-actions">
          <button class="sip-lap-close-btn" id="sip-lap-close">Tutup</button>
          <button class="sip-lap-print-btn" id="sip-lap-print">🖨️ Cetak / Simpan PDF</button>
        </div>
        <div class="sip-lap-body">
          <div class="sip-lap-header">
            <div>
              <h1 class="sip-lap-title">Laporan Refleksi Pembelajaran Ekopedagogi — SIPILAH</h1>
              <p class="sip-lap-sub">Teknologi AI sebagai alat untuk memahami hubungan manusia, lingkungan, dan keberlanjutan</p>
              <span class="sip-lap-badge">Selaras Capaian Pembelajaran IPS Fase D · Kurikulum Merdeka</span>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-size:11px;font-weight:800;color:#0f172a">${date}</div>
              <div style="font-size:10px;color:#64748b;margin-top:2px">SIPILAH · Media Ajar SMP/MTs</div>
            </div>
          </div>

          <div class="sip-lap-identity">
            <div class="sip-lap-id-item">Kelompok: <strong>${kelompok}</strong></div>
            <div class="sip-lap-id-item">Sekolah: <strong>${school}</strong></div>
            <div class="sip-lap-id-item">Nama: <strong>${name}</strong> · <strong>${role}</strong></div>
            <div class="sip-lap-id-item">Kelas: <strong>${kelas}</strong></div>
          </div>

          <div class="sip-lap-section">
            <div class="sip-lap-section-title">Ringkasan Proyek</div>
            <div class="sip-lap-stats">
              <div class="sip-lap-stat"><strong>${metrics.totalDataset}</strong><span>Foto Dataset</span></div>
              <div class="sip-lap-stat"><strong>${accuracy}</strong><span>Akurasi Model</span></div>
              <div class="sip-lap-stat"><strong>${metrics.predictions}</strong><span>Uji Prediksi</span></div>
              <div class="sip-lap-stat"><strong>${gainText}</strong><span>Gain Asesmen</span></div>
            </div>
          </div>

          <div class="sip-lap-section">
            <div class="sip-lap-section-title">Dataset per Kategori</div>
            <div class="sip-lap-bars">
              ${cats.map((c) => `
                <div class="sip-lap-bar-row">
                  <span class="sip-lap-bar-label">${catLabels[c]}</span>
                  <div class="sip-lap-bar-track"><div class="sip-lap-bar-fill" style="width:${Math.round(((dataset[c] || 0) / maxCat) * 100)}%;background:${catColors[c]}"></div></div>
                  <span class="sip-lap-bar-count">${dataset[c] || 0}</span>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="sip-lap-section">
            <div class="sip-lap-section-title">Hasil Asesmen Literasi AI</div>
            <div class="sip-lap-prepost">
              <div class="sip-lap-pp-box">
                <strong>${metrics.pre != null ? metrics.pre : "—"}</strong>
                <span>Pre-Test</span>
              </div>
              <div class="sip-lap-pp-arrow">→</div>
              <div class="sip-lap-pp-box">
                <strong style="color:${metrics.gain != null && metrics.gain >= 0 ? "#15803d" : "#dc2626"}">${metrics.post != null ? metrics.post : "—"}</strong>
                <span>Post-Test</span>
              </div>
            </div>
            ${metrics.gain != null ? `<p style="margin:8px 0 0;font-size:12px;font-weight:700;text-align:center;color:${metrics.gain >= 0 ? "#15803d" : "#dc2626"}">${metrics.gain > 0 ? "🎉 Naik " + metrics.gain + " poin" : metrics.gain === 0 ? "💪 Stabil" : "📚 Turun " + Math.abs(metrics.gain) + " poin — bahan refleksi"}</p>` : ""}
          </div>

          <div class="sip-lap-section">
            <div class="sip-lap-section-title">Analisis Proyek</div>
            <p class="sip-lap-analysis">${analysis}</p>
          </div>

          <div class="sip-lap-section">
            <div class="sip-lap-section-title">Alur Belajar yang Diselesaikan</div>
            <div class="sip-lap-steps">
              ${["Eksplorasi Awal","Dataset","Latih AI","Uji Model","Analisis","Refleksi Akhir","Laporan"].map((s) => `<div class="sip-lap-step">${s}</div>`).join("")}
            </div>
          </div>

          <div class="sip-lap-footer">
            <span>SIPILAH — Media Pembelajaran Ekopedagogi Digital Berbasis AI</span>
            <span>${date}</span>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById("sip-lap-close").addEventListener("click", () => {
      modal.remove();
      const s = document.getElementById("sip-laporan-style");
      if (s) s.remove();
    });
    document.getElementById("sip-lap-print").addEventListener("click", () => window.print());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
        const s = document.getElementById("sip-laporan-style");
        if (s) s.remove();
      }
    });
  }

  function renderCertificate() {
    const metrics = getMetrics();
    const identity = metrics.identity || {};
    const group = (identity.group || "").trim();
    const name = (identity.name || "").trim();
    const role = identity.role || "Siswa";
    const kelas = (identity.kelas || "").trim();
    const school = (identity.school || "").trim();
    const date = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    const recipient = group ? `Kelompok ${group}` : (name || "Peserta SIPILAH");
    const subLine = group && name ? `${name} &nbsp;·&nbsp; ${role}` : "";
    const schoolLine = [kelas ? `Kelas ${kelas}` : "", school].filter(Boolean).join(" &nbsp;·&nbsp; ");
    const gainText = metrics.gain != null ? `${metrics.gain >= 0 ? "+" : ""}${metrics.gain} poin` : "—";
    const prePost = metrics.pre != null && metrics.post != null ? `${metrics.pre} → ${metrics.post}` : "—";
    const accuracy = metrics.modelAccuracy ? `${Math.round(metrics.modelAccuracy * 100)}%` : (metrics.modelReady ? "Selesai" : "—");

    if (document.getElementById("sip-cert-modal")) return;

    const style = document.createElement("style");
    style.id = "sip-cert-style";
    style.textContent = `
      #sip-cert-modal{position:fixed;inset:0;z-index:130;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.65);backdrop-filter:blur(10px);font-family:system-ui,-apple-system,sans-serif;padding:16px}
      .sip-cert-wrap{position:relative;background:#fff;border-radius:20px;box-shadow:0 40px 100px -30px rgba(15,23,42,.7);max-width:720px;width:100%;overflow:hidden}
      .sip-cert-close{position:absolute;right:12px;top:12px;z-index:2;border:1px solid #e2e8f0;background:#fff;border-radius:10px;width:34px;height:34px;font-size:22px;line-height:1;cursor:pointer;color:#64748b}
      .sip-cert-actions{display:flex;gap:10px;padding:14px 20px 16px;justify-content:flex-end;border-top:1px solid #e2e8f0;background:#f8fafc}
      .sip-cert-print-btn{border:0;border-radius:12px;background:#15803d;color:#fff;padding:10px 20px;font-weight:800;font-size:14px;cursor:pointer}
      .sip-cert-print-btn:hover{background:#166534}
      .sip-cert-body{padding:40px 48px 32px;background:linear-gradient(160deg,#f0fdf4 0%,#fff 45%,#f0f9ff 100%);border:6px solid transparent;background-clip:padding-box;position:relative}
      .sip-cert-body::before{content:"";position:absolute;inset:0;border-radius:0;border:3px solid #bbf7d0;pointer-events:none}
      .sip-cert-corner{position:absolute;width:32px;height:32px;border-color:#15803d;border-style:solid;opacity:.5}
      .sip-cert-corner.tl{top:10px;left:10px;border-width:3px 0 0 3px}
      .sip-cert-corner.tr{top:10px;right:10px;border-width:3px 3px 0 0}
      .sip-cert-corner.bl{bottom:10px;left:10px;border-width:0 0 3px 3px}
      .sip-cert-corner.br{bottom:10px;right:10px;border-width:0 3px 3px 0}
      .sip-cert-eyebrow{font-size:10px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#15803d;text-align:center}
      .sip-cert-title{text-align:center;font-size:22px;font-weight:900;color:#0f172a;margin:6px 0 4px;letter-spacing:-.01em}
      .sip-cert-sub{text-align:center;font-size:13px;color:#64748b;margin-bottom:24px}
      .sip-cert-divider{border:none;border-top:1px solid #e2e8f0;margin:0 0 22px}
      .sip-cert-given{text-align:center;font-size:12px;color:#64748b;letter-spacing:.08em;text-transform:uppercase;font-weight:700;margin-bottom:10px}
      .sip-cert-recipient{text-align:center;font-size:34px;font-weight:900;color:#15803d;line-height:1.1;margin-bottom:6px}
      .sip-cert-subrec{text-align:center;font-size:14px;color:#334155;font-weight:600;margin-bottom:4px}
      .sip-cert-school{text-align:center;font-size:13px;color:#64748b;margin-bottom:22px}
      .sip-cert-desc{text-align:center;font-size:14px;color:#475569;line-height:1.6;margin-bottom:24px;max-width:480px;margin-left:auto;margin-right:auto}
      .sip-cert-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:22px}
      .sip-cert-stat{border:1px solid #e2e8f0;border-radius:12px;padding:10px 6px;text-align:center;background:#fff}
      .sip-cert-stat strong{display:block;font-size:18px;font-weight:900;color:#0f172a;line-height:1}
      .sip-cert-stat span{display:block;font-size:10px;color:#64748b;font-weight:700;margin-top:3px;text-transform:uppercase;letter-spacing:.06em}
      .sip-cert-footer{display:flex;align-items:center;justify-content:space-between}
      .sip-cert-date{font-size:12px;color:#94a3b8}
      .sip-cert-badge{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#166534;background:#dcfce7;border:1px solid #bbf7d0;border-radius:999px;padding:4px 10px}
      @media print{
        body>*:not(#sip-cert-modal){display:none!important}
        #sip-cert-modal{position:static!important;background:none!important;backdrop-filter:none!important;padding:0!important;display:block!important}
        .sip-cert-wrap{box-shadow:none!important;border-radius:0!important;max-width:100%!important}
        .sip-cert-close,.sip-cert-actions{display:none!important}
        .sip-cert-body{padding:28px 36px!important}
      }
    `;
    document.head.appendChild(style);

    const modal = document.createElement("div");
    modal.id = "sip-cert-modal";
    modal.innerHTML = `
      <div class="sip-cert-wrap">
        <button class="sip-cert-close" id="sip-cert-close-btn" aria-label="Tutup">×</button>
        <div class="sip-cert-body">
          <div class="sip-cert-corner tl"></div>
          <div class="sip-cert-corner tr"></div>
          <div class="sip-cert-corner bl"></div>
          <div class="sip-cert-corner br"></div>
          <div class="sip-cert-eyebrow">SIPILAH · Media Pembelajaran Ekopedagogi Digital SMP/MTs</div>
          <h2 class="sip-cert-title">Sertifikat Penyelesaian Proyek</h2>
          <p class="sip-cert-sub">Membangun Kesadaran Ekologis dari Sekolah Sehat Menuju Sekolah Berkelanjutan</p>
          <hr class="sip-cert-divider"/>
          <div class="sip-cert-given">Diberikan kepada</div>
          <div class="sip-cert-recipient">${recipient}</div>
          ${subLine ? `<div class="sip-cert-subrec">${subLine}</div>` : ""}
          ${schoolLine ? `<div class="sip-cert-school">${schoolLine}</div>` : ""}
          <p class="sip-cert-desc">
            Telah menyelesaikan seluruh tahapan Proyek Ekopedagogi SIPILAH: Eksplorasi Awal, pengumpulan dataset sampah,
            pelabelan, proses pembelajaran berbasis data lingkungan menggunakan teknologi AI, pengujian prediksi, analisis akurasi,
            Refleksi Perubahan Pemahaman Ekologis, dan penyusunan laporan proyek.
          </p>
          <div class="sip-cert-stats">
            <div class="sip-cert-stat"><strong>${metrics.totalDataset || "—"}</strong><span>Foto Dataset</span></div>
            <div class="sip-cert-stat"><strong>${accuracy}</strong><span>Akurasi Model</span></div>
            <div class="sip-cert-stat"><strong>${prePost}</strong><span>Pre → Post Test</span></div>
            <div class="sip-cert-stat"><strong>${gainText}</strong><span>Peningkatan</span></div>
          </div>
          <div class="sip-cert-footer">
            <span class="sip-cert-date">${date}</span>
            <span class="sip-cert-badge">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Selaras Capaian Pembelajaran IPS Fase D · Kurikulum Merdeka
            </span>
          </div>
        </div>
        <div class="sip-cert-actions">
          <button class="sip-cert-print-btn" id="sip-cert-print-btn">🖨️ Cetak / Simpan PDF</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.getElementById("sip-cert-close-btn").addEventListener("click", () => {
      modal.remove();
      const s = document.getElementById("sip-cert-style");
      if (s) s.remove();
    });
    document.getElementById("sip-cert-print-btn").addEventListener("click", () => window.print());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
        const s = document.getElementById("sip-cert-style");
        if (s) s.remove();
      }
    });
  }


  function init() {
    if (document.getElementById("sip-cert-button")) return;

    const certBtn = document.createElement("button");
    certBtn.id = "sip-cert-button";
    certBtn.type = "button";
    certBtn.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:80;border:1px solid #bbf7d0;border-radius:16px;background:#f0fdf4;color:#15803d;padding:9px 14px;font:800 12px system-ui,sans-serif;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 14px -4px rgba(21,128,61,.25)";
    certBtn.innerHTML = "🏅 Sertifikat Proyek";
    certBtn.addEventListener("click", renderCertificate);
    document.body.appendChild(certBtn);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
