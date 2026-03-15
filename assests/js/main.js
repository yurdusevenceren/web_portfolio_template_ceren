// =============================================================
//  BudgetBuddy — assests/js/main.js
//  API istemcisi + tüm sayfa mantığı
// =============================================================
'use strict';

/* ── API İstemcisi ─────────────────────────────────────────── */
const API = {
  BASE: '/api',
  token: () => localStorage.getItem('bb_token'),

  async req(path, opts = {}) {
    const res = await fetch(this.BASE + path, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token() ? { Authorization: `Bearer ${this.token()}` } : {}),
        ...(opts.headers || {}),
      },
    });
    if (res.status === 401) {
      localStorage.removeItem('bb_token');
      window.location.href = '/pages/giris.html';
      return;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.hata || 'Bir hata oluştu.');
    return data;
  },

  get:  (p)    => API.req(p),
  post: (p, b) => API.req(p, { method: 'POST',   body: JSON.stringify(b) }),
  put:  (p, b) => API.req(p, { method: 'PUT',    body: JSON.stringify(b) }),
  del:  (p)    => API.req(p, { method: 'DELETE' }),
};

/* ── Yardımcılar ───────────────────────────────────────────── */
const para  = n => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
const tarih = s => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(s));

function toast(msg, tip = 'basari') {
  const el = document.createElement('div');
  el.className = `toast ${tip}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3000);
}

function animatePara(id, hedef) {
  const el = document.getElementById(id);
  if (!el) return;
  let s = null; const d = 900;
  const step = ts => {
    if (!s) s = ts;
    const t = Math.min((ts - s) / d, 1);
    el.textContent = para((1 - Math.pow(1 - t, 3)) * hedef);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* Modal yardımcısı */
function modalAc(id)  { document.getElementById(id)?.classList.add('open'); }
function modalKapat(id) { document.getElementById(id)?.classList.remove('open'); }

/* ── Auth Koruma ───────────────────────────────────────────── */
function authKontrol() {
  const koruma = ['index.html', '', 'project.html', 'about.html'];
  const sayfa  = location.pathname.split('/').pop() || '';
  if (koruma.includes(sayfa) && !API.token()) {
    location.href = '/pages/giris.html';
  }
}

/* ── Sayfa Tespiti ─────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  authKontrol();
  const sayfa = location.pathname.split('/').pop() || 'index.html';

  /* Aktif nav */
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href.endsWith(sayfa)) a.classList.add('active');
  });

  /* Çıkış */
  document.getElementById('btn-cikis')?.addEventListener('click', async () => {
    try { await API.post('/auth/cikis'); } catch (_) {}
    localStorage.removeItem('bb_token');
    location.href = '/pages/giris.html';
  });

  if (sayfa === 'index.html' || sayfa === '') initIndex();
  if (sayfa === 'project.html')               initProject();
  if (sayfa === 'about.html')                 initAbout();
  if (sayfa === 'contact.html')               initContact();
  if (sayfa === 'giris.html')                 initGiris();
  if (sayfa === 'kayit.html')                 initKayit();
});

/* ════════════════════════════════════════════════════════════
   INDEX.HTML — Ana Panel
════════════════════════════════════════════════════════════ */
async function initIndex() {
  try {
    const [ozet, txRes] = await Promise.all([
      API.get('/reports/ozet'),
      API.get('/transactions?limit=5'),
    ]);
    animatePara('bakiye-tutar', ozet.net_bakiye   || 0);
    animatePara('gelir-tutar',  ozet.bu_ay_gelir  || 0);
    animatePara('gider-tutar',  ozet.bu_ay_gider  || 0);
    renderSonIslemler(txRes?.islemler || []);
  } catch (err) {
    console.error('Panel yüklenemedi:', err.message);
  }
}

function renderSonIslemler(list) {
  const el = document.getElementById('son-islemler');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = '<p style="padding:1.5rem;color:var(--text2);font-family:var(--mono);font-size:.85rem">Henüz işlem yok.</p>';
    return;
  }
  el.innerHTML = list.map(t => `
    <div class="tx-item">
      <div class="tx-ico" style="background:${t.renk||'#6c63ff'}1a">${t.kategori_ikon||'💸'}</div>
      <div class="tx-info">
        <strong>${t.baslik}</strong>
        <span>${t.kategori||'Genel'} • ${tarih(t.tarih)}</span>
      </div>
      <span class="tx-amt ${t.tur==='gelir'?'pos':'neg'}">${t.tur==='gelir'?'+':'-'}${para(t.tutar)}</span>
    </div>`).join('');
}

/* ════════════════════════════════════════════════════════════
   PROJECT.HTML — İşlemler / Projeler
════════════════════════════════════════════════════════════ */
async function initProject() {
  await yukleKategoriler('form-kat', 'filtre-kat');
  await statGuncelle();
  await renderIslemler();

  /* Modal */
  document.getElementById('btn-ekle')?.addEventListener('click', () => modalAc('m-islem'));
  document.getElementById('m-kapat')?.addEventListener('click', () => modalKapat('m-islem'));
  document.getElementById('m-islem')?.addEventListener('click', e => {
    if (e.target.id === 'm-islem') modalKapat('m-islem');
  });

  /* Form gönder */
  document.getElementById('form-islem')?.addEventListener('submit', async e => {
    e.preventDefault();
    const fd   = new FormData(e.target);
    const btn  = e.target.querySelector('[type=submit]');
    btn.disabled = true; btn.textContent = 'Kaydediliyor…';
    try {
      await API.post('/transactions', {
        baslik:      fd.get('baslik'),
        tutar:       parseFloat(fd.get('tutar')),
        tur:         fd.get('tur'),
        category_id: fd.get('category_id') || null,
        tarih:       fd.get('tarih'),
        aciklama:    fd.get('aciklama') || null,
      });
      modalKapat('m-islem');
      e.target.reset();
      setToday('islem-tarih');
      await renderIslemler();
      await statGuncelle();
      toast('İşlem eklendi ✓');
    } catch (err) { toast(err.message, 'hata'); }
    btn.disabled = false; btn.textContent = 'Kaydet';
  });

  /* Filtreler */
  ['filtre-tur','filtre-kat'].forEach(id =>
    document.getElementById(id)?.addEventListener('change', renderIslemler)
  );

  setToday('islem-tarih');
}

async function renderIslemler() {
  const tbody = document.getElementById('tx-tbody');
  if (!tbody) return;

  const tur = document.getElementById('filtre-tur')?.value || '';
  const kat = document.getElementById('filtre-kat')?.value || '';
  let url   = '/transactions?limit=60';
  if (tur && tur !== 'hepsi') url += `&tur=${tur}`;
  if (kat && kat !== 'hepsi') url += `&kategori=${kat}`;

  try {
    const { islemler } = await API.get(url);
    if (!islemler.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2.5rem;color:var(--text2)">İşlem bulunamadı.</td></tr>`;
      return;
    }
    tbody.innerHTML = islemler.map(t => `
      <tr>
        <td style="font-family:var(--mono);font-size:.8rem;color:var(--text2)">${tarih(t.tarih)}</td>
        <td><strong>${t.baslik}</strong></td>
        <td><span class="badge badge-p">${t.kategori_ikon||''} ${t.kategori||'—'}</span></td>
        <td class="tx-amt ${t.tur==='gelir'?'pos':'neg'}">${t.tur==='gelir'?'+':'-'}${para(t.tutar)}</td>
        <td>
          <button class="btn btn-sec" style="padding:.35rem .75rem;font-size:.78rem"
            onclick="silIslem('${t.id}')">Sil</button>
        </td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--danger);padding:1.5rem">${err.message}</td></tr>`;
  }
}

async function silIslem(id) {
  if (!confirm('Bu işlemi silmek istediğinize emin misiniz?')) return;
  try {
    await API.del(`/transactions/${id}`);
    await renderIslemler();
    await statGuncelle();
    toast('İşlem silindi.');
  } catch (err) { toast(err.message, 'hata'); }
}

async function statGuncelle() {
  try {
    const o = await API.get('/reports/ozet');
    const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = typeof v === 'number' ? para(v) : v; };
    s('stat-bakiye',  o.net_bakiye);
    s('stat-gelir',   o.toplam_gelir);
    s('stat-gider',   o.toplam_gider);
    s('stat-sayi',    o.islem_sayisi);
  } catch (_) {}
}

async function yukleKategoriler(...ids) {
  try {
    const { kategoriler } = await API.get('/categories');
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      kategoriler.forEach(k => {
        const o = document.createElement('option');
        o.value = k.id; o.textContent = `${k.ikon} ${k.ad}`;
        el.appendChild(o);
      });
    });
  } catch (_) {}
}

/* ════════════════════════════════════════════════════════════
   ABOUT.HTML — Profil / Hakkında
════════════════════════════════════════════════════════════ */
async function initAbout() {
  try {
    const { kullanici } = await API.get('/auth/ben');
    const adEl = document.getElementById('profil-ad');
    const emailEl = document.getElementById('profil-email');
    if (adEl) adEl.textContent = `${kullanici.ad} ${kullanici.soyad}`;
    if (emailEl) emailEl.textContent = kullanici.email;

    const o = await API.get('/reports/ozet');
    const s = (id, v) => { const el = document.getElementById(id); if(el) el.textContent = v; };
    s('profil-islem',  o.islem_sayisi);
    s('profil-bakiye', para(o.net_bakiye));
    s('profil-gelir',  para(o.toplam_gelir));
    s('profil-gider',  para(o.toplam_gider));
  } catch (err) { console.error(err.message); }

  /* Şifre değiştir formu */
  document.getElementById('form-sifre')?.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (fd.get('yeni') !== fd.get('yeni2')) return toast('Şifreler eşleşmiyor!', 'hata');
    try {
      await API.put('/auth/sifre', { eskiSifre: fd.get('eski'), yeniSifre: fd.get('yeni') });
      toast('Şifre güncellendi ✓');
      e.target.reset();
    } catch (err) { toast(err.message, 'hata'); }
  });
}

/* ════════════════════════════════════════════════════════════
   CONTACT.HTML — İletişim / Destek
════════════════════════════════════════════════════════════ */
function initContact() {
  document.getElementById('form-mesaj')?.addEventListener('submit', async e => {
    e.preventDefault();
    const fd  = new FormData(e.target);
    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true; btn.textContent = 'Gönderiliyor…';
    try {
      await API.post('/contact', {
        konu:   fd.get('konu'),
        mesaj:  fd.get('mesaj'),
        email:  fd.get('email'),
      });
      toast('Mesajınız iletildi ✓');
      e.target.reset();
    } catch (err) { toast(err.message, 'hata'); }
    btn.disabled = false; btn.textContent = 'Gönder';
  });
}

/* ════════════════════════════════════════════════════════════
   GİRİŞ
════════════════════════════════════════════════════════════ */
function initGiris() {
  document.getElementById('form-giris')?.addEventListener('submit', async e => {
    e.preventDefault();
    const fd  = new FormData(e.target);
    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true; btn.textContent = 'Giriş yapılıyor…';
    try {
      const { token } = await API.post('/auth/giris', {
        email: fd.get('email'), sifre: fd.get('sifre'),
      });
      localStorage.setItem('bb_token', token);
      location.href = '/index.html';
    } catch (err) {
      toast(err.message, 'hata');
      btn.disabled = false; btn.textContent = 'Giriş Yap';
    }
  });
}

/* ════════════════════════════════════════════════════════════
   KAYIT
════════════════════════════════════════════════════════════ */
function initKayit() {
  document.getElementById('form-kayit')?.addEventListener('submit', async e => {
    e.preventDefault();
    const fd  = new FormData(e.target);
    if (fd.get('sifre') !== fd.get('sifre2')) return toast('Şifreler eşleşmiyor!', 'hata');
    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true; btn.textContent = 'Oluşturuluyor…';
    try {
      const { token } = await API.post('/auth/kayit', {
        ad: fd.get('ad'), soyad: fd.get('soyad'),
        email: fd.get('email'), sifre: fd.get('sifre'),
      });
      localStorage.setItem('bb_token', token);
      location.href = '/index.html';
    } catch (err) {
      toast(err.message, 'hata');
      btn.disabled = false; btn.textContent = 'Hesap Oluştur';
    }
  });
}

/* ── Yardımcı: Bugünü date input'a yaz ────────────────────── */
function setToday(id) {
  const el = document.getElementById(id);
  if (el) el.valueAsDate = new Date();
}

/* Global erişim */
window.silIslem = silIslem;
window.modalAc  = modalAc;
window.modalKapat = modalKapat;
window.API  = API;
window.para = para;

