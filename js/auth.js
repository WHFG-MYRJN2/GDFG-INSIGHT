// ============================================================
// auth.js — MONITORING GDFG
// Registrasi, sesi, hak akses per halaman & tab, halaman Admin.
// Dimuat SETELAH semua js lain (setelah kpi.js) di index.html.
// Backend: Code.gs (verifyLogin, registerUser, getAuthSession, admin*).
// ============================================================
var AUTH = (function () {

  // ──────────────────────────────────────────────────────────
  // REGISTRY halaman & tab — satu-satunya tempat yang perlu diubah
  // kalau ada halaman/tab baru. id tab = id yang dipakai fungsi
  // switch-nya. sel = selector tombol tab yang disembunyikan bila
  // tab tidak diizinkan.
  // ──────────────────────────────────────────────────────────
  var REG = [
    { id: 'dashboard', label: 'Kapasitas', menu: 'menuDashboard', tabs: [
      { id: 'summary',   label: 'Summary',   sel: '.g-tab[onclick*="showTab(\'summary\')"]' },
      { id: 'lokal',     label: 'Lokal',     sel: '.g-tab[onclick*="showTab(\'lokal\')"]' },
      { id: 'ekspor',    label: 'Ekspor',    sel: '.g-tab[onclick*="showTab(\'ekspor\')"]' },
      { id: 'gdfg',      label: 'GDFG',      sel: '.g-tab[onclick*="showTab(\'gdfg\')"]' },
      { id: 'analytics', label: 'Analytics', sel: '.g-tab[onclick*="showTab(\'analytics\')"]' }
    ] },
    { id: 'inputPage', label: 'Input Data Kapasitas', menu: null, hideSel: '.gdrm-header-btns .btn-hdr[onclick*="inputPage"]', tabs: [] },
    { id: 'realisasiPage', label: 'Realisasi', menu: 'menuRealisasi', tabs: [
      { id: 'summaryReal',       label: 'Summary',               sel: '.real-tab[onclick*="switchRealTab(\'summaryReal\'"]' },
      { id: 'planningReal',      label: 'Planning',              sel: '.real-tab[onclick*="switchRealTab(\'planningReal\'"]' },
      { id: 'inputReal',         label: 'Input Realisasi',       sel: '.real-tab[onclick*="switchRealTab(\'inputReal\'"]' },
      { id: 'directReal',        label: 'Input Planning Direct', sel: '.real-tab[onclick*="switchRealTab(\'directReal\'"]' },
      { id: 'mdcReal',           label: 'Input Planning MDC',    sel: '.real-tab[onclick*="switchRealTab(\'mdcReal\'"]' },
      { id: 'hasilProduksiReal', label: 'Input Hasil Produksi',  sel: '.real-tab[onclick*="switchRealTab(\'hasilProduksiReal\'"]' }
    ] },
    { id: 'opnamePage', label: 'Stock Opname', menu: 'menuOpname', tabs: [
      { id: 'input',    label: 'Input',               sel: '#btnOpInput' },
      { id: 'view',     label: 'Riwayat',             sel: '#btnOpView' },
      { id: 'fifoview', label: 'Picking List FIFO',   sel: '#btnOpFifoView' },
      { id: 'qtview',   label: 'Riwayat QT Ready',    sel: '#btnOpQtView' }
    ] },
    { id: 'rdcPage', label: 'Monitoring RDC', menu: 'menuRdc', tabs: [
      { id: 'summary', label: 'Summary',    sel: '#rdcTabSummary' },
      { id: 'input',   label: 'Input Data', sel: '#rdcTabInput, #btnRdcInput' }
    ] },
    { id: 'stockJalurPage', label: 'Stock Jalur', menu: 'menuStockJalur', tabs: [
      { id: 'input',  label: 'Input',  sel: '#btnSjInput' },
      { id: 'output', label: 'Output', sel: '#btnSjOutput' },
      { id: 'rekap',  label: 'Rekap',  sel: '#btnSjRekap' }
    ] },
    { id: 'binLocPage', label: 'Bin Loc', menu: 'menuBinLoc', tabs: [
      { id: 'current',  label: 'Stok Saat Ini',      sel: '#blTab-current' },
      { id: 'movement', label: 'Riwayat Movement',   sel: '#blTab-movement' },
      { id: 'map',      label: 'Peta Kapasitas',     sel: '#blTab-map' }
    ] },
    { id: 'monitoringEksporPage', label: 'Monitoring Outbound', menu: 'menuMonitoringEkspor', tabs: [
      { id: 'summary',  label: 'Summary',         sel: '#mekTabSummary' },
      { id: 'input',    label: 'Input Planning',  sel: '#mekTabInput' },
      { id: 'planning', label: 'Planning',        sel: '#mekTabPlanning' },
      { id: 'stock',    label: 'Kesiapan Stock',  sel: '#mekTabStock' },
      { id: 'reserved', label: 'Reserved View',   sel: '#mekTabReserved' }
    ] },
    { id: 'kpiPage', label: 'KPI', menu: 'menuKpi', tabs: [
      { id: 'ritase',  label: 'Ritase/Day',    sel: '#kpiTabRitase' },
      { id: 'stay',    label: 'Waktu Stay',    sel: '#kpiTabStay' },
      { id: 'loading', label: 'Waktu Loading', sel: '#kpiTabLoading' },
      { id: 'kembali', label: 'Waktu Kembali', sel: '#kpiTabKembali' },
      { id: 'input',   label: 'Input Data',    sel: '#kpiTabInput' }
    ] },
    { id: 'appsPage', label: 'Aplikasi', menu: 'menuApps', tabs: [] }
  ];
  var HOME_ORDER = ['dashboard', 'realisasiPage', 'opnamePage', 'rdcPage', 'stockJalurPage', 'binLocPage', 'monitoringEksporPage', 'kpiPage', 'appsPage'];

  var _s = null; // sesi dari server: {user,nama,role(level lama),roleKey,roleLabel,penuh,kelolaUser,pages,tabs,token}

  function _reg(id) { for (var i = 0; i < REG.length; i++) if (REG[i].id === id) return REG[i]; return null; }

  // ── cek akses ─────────────────────────────────────────────
  function ready() { return !!_s; }
  function canPage(page) {
    if (page === 'adminPage') return !!(_s && _s.kelolaUser);
    if (!_s) return false;
    if (_s.penuh) return true;
    return (_s.pages || []).indexOf(page) >= 0;
  }
  function canTab(page, tab) {
    if (!canPage(page)) return false;
    if (_s.penuh) return true;
    var t = (_s.tabs || {})[page];
    return !t || t.indexOf(tab) >= 0;
  }
  function firstTab(page) {
    var r = _reg(page); if (!r) return null;
    for (var i = 0; i < r.tabs.length; i++) if (canTab(page, r.tabs[i].id)) return r.tabs[i].id;
    return null;
  }
  function homePage() {
    for (var i = 0; i < HOME_ORDER.length; i++) if (canPage(HOME_ORDER[i])) return HOME_ORDER[i];
    return (_s && _s.kelolaUser) ? 'adminPage' : null;
  }
  function session() { return _s; }
  function setSession(s) { _s = s || null; }

  // ── terapkan ke tampilan ──────────────────────────────────
  function apply() {
    REG.forEach(function (r) {
      var pageOk = canPage(r.id);
      // Hanya MENYEMBUNYIKAN (tidak pernah menampilkan ulang) supaya tidak menimpa
      // pembatasan lama di applyRoleRestrictions().
      if (!pageOk && r.menu) { var m = document.getElementById(r.menu); if (m) m.style.display = 'none'; }
      if (!pageOk && r.hideSel) document.querySelectorAll(r.hideSel).forEach(function (el) { el.style.display = 'none'; });
      (r.tabs || []).forEach(function (t) {
        var ok = canTab(r.id, t.id);
        document.querySelectorAll(t.sel).forEach(function (el) { if (!ok) el.style.display = 'none'; });
      });
    });
    var ma = document.getElementById('menuAdmin');
    if (ma) ma.style.display = (_s && _s.kelolaUser) ? '' : 'none';
    var who = document.getElementById('headerUsername');
    if (who && _s) { who.textContent = (_s.nama || _s.user) + ' · ' + (_s.roleLabel || _s.roleKey || ''); who.style.display = ''; }
    if (_s && _s.kelolaUser) refreshBadge();
  }

  // Bungkus fungsi pindah-tab tiap halaman: kalau tab diminta tidak diizinkan
  // (termasuk tab default yang dibuka programatik), arahkan ke tab pertama yang boleh.
  var TAB_FUNCS = [
    { page: 'dashboard',            fn: 'showTab' },
    { page: 'realisasiPage',        fn: 'switchRealTab', btnArg: 1, btnSel: function (id) { return document.querySelector('.real-tab[onclick*="switchRealTab(\'' + id + '\'"]'); } },
    { page: 'opnamePage',           fn: 'switchOpnameTab' },
    { page: 'opnamePage',           fn: '_doSwitchOpnameTab' },
    { page: 'rdcPage',              fn: 'rdcSwitchTab' },
    { page: 'stockJalurPage',       fn: 'sjSwitchTab' },
    { page: 'binLocPage',           fn: 'blSwitchTab' },
    { page: 'monitoringEksporPage', fn: 'mekSwitchTab' },
    { page: 'kpiPage',              fn: 'kpiSwitchTab' }
  ];
  function wrapTabFuncs() {
    TAB_FUNCS.forEach(function (cfg) {
      var orig = window[cfg.fn];
      if (typeof orig !== 'function' || orig._authWrapped) return;
      var w = function () {
        var a = Array.prototype.slice.call(arguments);
        var id = a[0];
        if (_s && !_s.penuh && !canTab(cfg.page, id)) {
          var alt = firstTab(cfg.page);
          if (!alt || alt === id) return;
          a[0] = alt;
          if (cfg.btnArg !== undefined && cfg.btnSel) a[cfg.btnArg] = cfg.btnSel(alt) || a[cfg.btnArg];
        }
        return orig.apply(this, a);
      };
      w._authWrapped = true;
      window[cfg.fn] = w;
    });
  }

  // Tab default tiap halaman bisa saja tidak diizinkan → panggil fungsi pindah-tab
  // (yang sudah dibungkus) supaya diarahkan ke tab pertama yang boleh.
  var DEF_TAB = { kpiPage: 'input' };
  function ensureDefault(page) {
    if (!_s || _s.penuh) return;
    var r = _reg(page); if (!r || !r.tabs.length) return;
    var def = DEF_TAB[page] || r.tabs[0].id;
    if (canTab(page, def)) return;
    for (var i = 0; i < TAB_FUNCS.length; i++) {
      if (TAB_FUNCS[i].page === page) {
        var fn = window[TAB_FUNCS[i].fn];
        if (typeof fn === 'function') { fn(def); }
        return;
      }
    }
  }

  // ── UI: daftar / login ────────────────────────────────────
  function _el(id) { return document.getElementById(id); }
  function showRegister() {
    var lb = document.querySelector('#loginWrap .login-box'), rb = _el('registerBox');
    if (lb) lb.style.display = 'none'; if (rb) rb.style.display = '';
    var m = _el('registerMsg'); if (m) m.style.display = 'none';
  }
  function showLogin() {
    var lb = document.querySelector('#loginWrap .login-box'), rb = _el('registerBox');
    if (rb) rb.style.display = 'none'; if (lb) lb.style.display = '';
  }
  function _regMsg(msg, ok) {
    var m = _el('registerMsg'); if (!m) return;
    m.textContent = msg; m.style.display = 'block';
    m.style.background = ok ? '#f0fff4' : '#fee'; m.style.color = ok ? '#276749' : '#c53030';
    m.style.border = '1px solid ' + (ok ? '#9ae6b4' : '#fc8181');
  }
  function doRegister() {
    var u = (_el('regUsername').value || '').trim().toLowerCase();
    var p = _el('regPassword').value || '';
    var p2 = _el('regPassword2').value || '';
    var n = (_el('regNama').value || '').trim();
    var b = (_el('regBagian').value || '').trim();
    if (!u || !p || !n || !b) { _regMsg('Semua kolom wajib diisi.', false); return; }
    if (!/^[a-z0-9._-]{3,30}$/.test(u)) { _regMsg('Username 3-30 karakter: huruf, angka, titik, strip, underscore.', false); return; }
    if (p.length < 6) { _regMsg('Password minimal 6 karakter.', false); return; }
    if (p !== p2) { _regMsg('Konfirmasi password tidak sama.', false); return; }
    var btn = _el('btnRegister');
    if (btn) { btn.disabled = true; btn.textContent = 'Mengirim...'; }
    API.run('registerUser', { username: u, password: p, nama: n, bagian: b }, function (res) {
      if (btn) { btn.disabled = false; btn.textContent = 'Kirim Pendaftaran'; }
      if (res && res.success) {
        _regMsg(res.message || 'Pendaftaran terkirim. Tunggu persetujuan admin.', true);
        ['regUsername', 'regPassword', 'regPassword2', 'regNama', 'regBagian'].forEach(function (id) { _el(id).value = ''; });
      } else _regMsg((res && res.message) || 'Pendaftaran gagal.', false);
    }, function () {
      if (btn) { btn.disabled = false; btn.textContent = 'Kirim Pendaftaran'; }
      _regMsg('Koneksi gagal. Coba lagi.', false);
    });
  }

  // ──────────────────────────────────────────────────────────
  // HALAMAN ADMIN
  // ──────────────────────────────────────────────────────────
  var _ad = { users: [], roles: [], levels: [], me: '', tab: 'pending', editing: null };
  var LEVEL_LABEL = {
    admin:   'admin — boleh input/ubah (Opname & Stock Jalur penuh)',
    viewer:  'viewer — hanya lihat (tombol input disembunyikan)',
    visitor: 'visitor — viewer + kolom Opname dibatasi',
    owner:   'owner — admin + asisten Karina'
  };
  function _esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

  function adminInit() { adminReload(); }

  function adminReload() {
    var body = _el('admBody'); if (body) body.innerHTML = '<div class="adm-empty"><i class="fas fa-spinner fa-spin"></i> Memuat...</div>';
    API.run('adminGetData', {}, function (res) {
      if (!res || !res.success) { if (body) body.innerHTML = '<div class="adm-empty" style="color:#c53030;">' + _esc((res && res.message) || 'Gagal memuat data') + '</div>'; return; }
      _ad.users = res.users || []; _ad.roles = res.roles || []; _ad.levels = res.levels || []; _ad.me = res.me || '';
      _renderBadge(); adminRender();
    });
  }

  function refreshBadge() {
    API.run('adminGetData', {}, function (res) {
      if (res && res.success) { _ad.users = res.users || []; _ad.roles = res.roles || []; _ad.me = res.me || ''; _renderBadge(); }
    });
  }
  function _renderBadge() {
    var n = _ad.users.filter(function (u) { return u.status === 'PENDING'; }).length;
    var m = _el('menuAdmin'); if (!m) return;
    var b = m.querySelector('.adm-badge');
    if (!b) { b = document.createElement('span'); b.className = 'adm-badge'; m.appendChild(b); }
    b.textContent = n; b.style.display = n ? 'inline-block' : 'none';
    var tb = _el('admTabPendingCount'); if (tb) tb.textContent = n ? ' (' + n + ')' : '';
  }

  function adminTab(t) { _ad.tab = t; adminRender(); }

  function _roleOptions(sel) {
    return _ad.roles.map(function (r) {
      return '<option value="' + _esc(r.role) + '"' + (r.role === sel ? ' selected' : '') + '>' + _esc(r.label) + '</option>';
    }).join('');
  }

  function adminRender() {
    ['pending', 'users', 'roles'].forEach(function (t) {
      var b = _el('admTab-' + t); if (b) b.classList.toggle('active', _ad.tab === t);
    });
    var body = _el('admBody'); if (!body) return;
    if (_ad.tab === 'pending') body.innerHTML = _renderPending();
    else if (_ad.tab === 'users') body.innerHTML = _renderUsers();
    else body.innerHTML = _renderRoles();
  }

  function _renderPending() {
    var list = _ad.users.filter(function (u) { return u.status === 'PENDING' || u.status === 'DITOLAK'; });
    if (!list.length) return '<div class="adm-empty">Tidak ada pendaftar yang menunggu.</div>';
    if (!_ad.roles.length) return '<div class="adm-empty">Buat minimal 1 role dulu di tab Role.</div>';
    return list.map(function (u) {
      var rejected = u.status === 'DITOLAK';
      return '<div class="adm-card">'
        + '<div class="adm-card-top"><div><div class="adm-name">' + _esc(u.nama) + '</div>'
        + '<div class="adm-sub">@' + _esc(u.username) + ' · ' + _esc(u.bagian) + ' · daftar ' + _esc(u.didaftar) + '</div></div>'
        + (rejected ? '<span class="adm-pill adm-pill-red">DITOLAK</span>' : '<span class="adm-pill adm-pill-amber">MENUNGGU</span>') + '</div>'
        + '<div class="adm-row"><select id="admRole-' + _esc(u.username) + '" class="adm-input">' + _roleOptions('') + '</select>'
        + '<button class="adm-btn adm-btn-ok" onclick="AUTH.approve(\'' + _esc(u.username) + '\')">Setujui</button>'
        + (rejected ? '' : '<button class="adm-btn adm-btn-bad" onclick="AUTH.reject(\'' + _esc(u.username) + '\')">Tolak</button>')
        + '</div></div>';
    }).join('');
  }

  function _renderUsers() {
    var list = _ad.users.filter(function (u) { return u.status === 'AKTIF' || u.status === 'NONAKTIF'; });
    if (!list.length) return '<div class="adm-empty">Belum ada pengguna aktif.</div>';
    return list.map(function (u) {
      var me = u.username === _ad.me;
      return '<div class="adm-card">'
        + '<div class="adm-card-top"><div><div class="adm-name">' + _esc(u.nama) + (me ? ' <span class="adm-pill adm-pill-blue">Anda</span>' : '') + '</div>'
        + '<div class="adm-sub">@' + _esc(u.username) + ' · ' + _esc(u.bagian) + (u.loginTerakhir ? ' · login terakhir ' + _esc(u.loginTerakhir) : '') + '</div></div>'
        + '<span class="adm-pill ' + (u.status === 'AKTIF' ? 'adm-pill-green' : 'adm-pill-gray') + '">' + _esc(u.status) + '</span></div>'
        + '<div class="adm-row">'
        + '<select id="admURole-' + _esc(u.username) + '" class="adm-input">' + _roleOptions(u.role) + '</select>'
        + '<select id="admUStatus-' + _esc(u.username) + '" class="adm-input" style="max-width:130px;">'
        + '<option value="AKTIF"' + (u.status === 'AKTIF' ? ' selected' : '') + '>Aktif</option>'
        + '<option value="NONAKTIF"' + (u.status === 'NONAKTIF' ? ' selected' : '') + '>Nonaktif</option></select>'
        + '<button class="adm-btn adm-btn-ok" onclick="AUTH.saveUser(\'' + _esc(u.username) + '\')">Simpan</button>'
        + '<button class="adm-btn" onclick="AUTH.resetPw(\'' + _esc(u.username) + '\')">Reset Password</button>'
        + (me ? '' : '<button class="adm-btn adm-btn-bad" onclick="AUTH.delUser(\'' + _esc(u.username) + '\')">Hapus</button>')
        + '</div></div>';
    }).join('');
  }

  function _roleSummary(r) {
    if (r.penuh) return 'Akses penuh ke semua halaman & tab';
    if (!r.pages.length) return 'Belum ada halaman';
    return r.pages.map(function (p) {
      var rg = _reg(p), name = rg ? rg.label : p, t = (r.tabs || {})[p];
      return _esc(name) + (t && rg ? ' (' + t.length + '/' + rg.tabs.length + ' tab)' : '');
    }).join(', ');
  }
  function _renderRoles() {
    var head = '<div style="margin-bottom:12px;"><button class="adm-btn adm-btn-ok" onclick="AUTH.editRole(null)"><i class="fas fa-plus"></i> Tambah Role</button></div>';
    if (!_ad.roles.length) return head + '<div class="adm-empty">Belum ada role.</div>';
    return head + _ad.roles.map(function (r) {
      var n = _ad.users.filter(function (u) { return u.role === r.role; }).length;
      return '<div class="adm-card"><div class="adm-card-top"><div><div class="adm-name">' + _esc(r.label) + ' <span class="adm-sub">(' + _esc(r.role) + ')</span></div>'
        + '<div class="adm-sub">' + _roleSummary(r) + '</div></div>'
        + '<div>' + (r.kelolaUser ? '<span class="adm-pill adm-pill-blue">Kelola user</span> ' : '') + '<span class="adm-pill adm-pill-gray">' + n + ' user</span></div></div>'
        + '<div class="adm-row"><button class="adm-btn" onclick="AUTH.editRole(\'' + _esc(r.role) + '\')">Edit</button>'
        + (r.role === 'owner' ? '' : '<button class="adm-btn adm-btn-bad" onclick="AUTH.delRole(\'' + _esc(r.role) + '\')">Hapus</button>') + '</div></div>';
    }).join('');
  }

  function _done(res, okMsg) {
    if (res && res.authError) return;
    showToast((res && res.success ? '✅ ' : '❌ ') + ((res && res.message) || okMsg || ''), res && res.success ? 'success' : 'error');
    if (res && res.success) adminReload();
  }
  function approve(u) {
    var sel = _el('admRole-' + u); if (!sel || !sel.value) { showToast('Pilih role dulu', 'error'); return; }
    API.run('adminApproveUser', { username: u, role: sel.value }, _done);
  }
  function reject(u) { if (!confirm('Tolak pendaftaran ' + u + '?')) return; API.run('adminRejectUser', { username: u }, _done); }
  function saveUser(u) {
    API.run('adminUpdateUser', { username: u, role: _el('admURole-' + u).value, status: _el('admUStatus-' + u).value }, _done);
  }
  function resetPw(u) {
    var p = prompt('Password baru untuk ' + u + ' (minimal 6 karakter):');
    if (p == null) return;
    API.run('adminResetPassword', { username: u, newPass: p }, _done);
  }
  function delUser(u) { if (!confirm('Hapus akun ' + u + ' secara permanen?')) return; API.run('adminDeleteUser', { username: u }, _done); }
  function delRole(r) { if (!confirm('Hapus role ' + r + '?')) return; API.run('adminDeleteRole', { roleKey: r }, _done); }

  // ── editor role ───────────────────────────────────────────
  function editRole(key) {
    var r = null;
    if (key) _ad.roles.forEach(function (x) { if (x.role === key) r = x; });
    _ad.editing = key || null;
    var def = r || { role: '', label: '', penuh: false, kelolaUser: false, level: 'viewer', pages: [], tabs: {} };
    _el('rolKey').value = def.role; _el('rolKey').disabled = !!r;
    _el('rolLabel').value = def.label;
    _el('rolPenuh').checked = !!def.penuh;
    _el('rolKelola').checked = !!def.kelolaUser;
    var lv = ['admin', 'viewer', 'visitor', 'owner'];
    if (lv.indexOf(def.level) < 0) lv.push(def.level);
    _el('rolLevel').innerHTML = lv.map(function (l) { return '<option value="' + l + '"' + (l === def.level ? ' selected' : '') + '>' + _esc(LEVEL_LABEL[l] || l) + '</option>'; }).join('');
    var tree = REG.map(function (g) {
      var pOn = def.penuh || def.pages.indexOf(g.id) >= 0;
      var restricted = (def.tabs || {})[g.id];
      var tabs = g.tabs.map(function (t) {
        var on = pOn && (!restricted || restricted.indexOf(t.id) >= 0);
        return '<label class="adm-chk adm-tab"><input type="checkbox" data-page="' + g.id + '" data-tab="' + t.id + '"' + (on ? ' checked' : '') + ' onchange="AUTH.treeChanged(this)"> ' + _esc(t.label) + '</label>';
      }).join('');
      return '<div class="adm-tree-page"><label class="adm-chk adm-page"><input type="checkbox" data-pagebox="' + g.id + '"' + (pOn ? ' checked' : '') + ' onchange="AUTH.treeChanged(this)"> ' + _esc(g.label) + '</label>'
        + (tabs ? '<div class="adm-tabs">' + tabs + '</div>' : '') + '</div>';
    }).join('');
    _el('rolTree').innerHTML = tree;
    _togglePenuh();
    _el('admRoleModal').style.display = 'flex';
  }
  function _togglePenuh() {
    var on = _el('rolPenuh').checked;
    _el('rolTree').style.opacity = on ? '.45' : '1';
    _el('rolTree').style.pointerEvents = on ? 'none' : '';
  }
  function treeChanged(el) {
    if (el === _el('rolPenuh')) { _togglePenuh(); return; }
    var box = _el('rolTree');
    if (el.hasAttribute('data-pagebox')) {
      var pid = el.getAttribute('data-pagebox');
      box.querySelectorAll('input[data-page="' + pid + '"]').forEach(function (c) { c.checked = el.checked; });
    } else {
      var p = el.getAttribute('data-page');
      var tabs = box.querySelectorAll('input[data-page="' + p + '"]');
      var any = false; tabs.forEach(function (c) { if (c.checked) any = true; });
      var pb = box.querySelector('input[data-pagebox="' + p + '"]');
      if (pb) pb.checked = any;
    }
  }
  function closeRole() { _el('admRoleModal').style.display = 'none'; }
  function saveRole() {
    var key = (_el('rolKey').value || '').trim().toLowerCase();
    var label = (_el('rolLabel').value || '').trim();
    if (!key || !label) { showToast('Kode dan nama role wajib diisi', 'error'); return; }
    var penuh = _el('rolPenuh').checked, pages = [], tabs = {};
    if (!penuh) {
      REG.forEach(function (g) {
        var pb = _el('rolTree').querySelector('input[data-pagebox="' + g.id + '"]');
        if (!pb || !pb.checked) return;
        pages.push(g.id);
        if (g.tabs.length) {
          var all = _el('rolTree').querySelectorAll('input[data-page="' + g.id + '"]'), sel = [];
          all.forEach(function (c) { if (c.checked) sel.push(c.getAttribute('data-tab')); });
          if (!sel.length) { pages.pop(); return; }
          if (sel.length < g.tabs.length) tabs[g.id] = sel;
        }
      });
      if (!pages.length) { showToast('Pilih minimal 1 halaman, atau centang Akses penuh', 'error'); return; }
    }
    var role = { role: key, label: label, penuh: penuh, kelolaUser: _el('rolKelola').checked, level: _el('rolLevel').value, pages: pages, tabs: tabs };
    API.run('adminSaveRole', { role: role }, function (res) {
      if (res && res.success) closeRole();
      _done(res);
    });
  }

  return {
    // akses
    ready: ready, canPage: canPage, canTab: canTab, firstTab: firstTab, homePage: homePage, session: session, setSession: setSession,
    apply: apply, ensureDefault: ensureDefault, wrapTabFuncs: wrapTabFuncs, refreshBadge: refreshBadge,
    // daftar
    showRegister: showRegister, showLogin: showLogin, doRegister: doRegister,
    // admin
    adminInit: adminInit, adminReload: adminReload, adminTab: adminTab,
    approve: approve, reject: reject, saveUser: saveUser, resetPw: resetPw, delUser: delUser,
    editRole: editRole, saveRole: saveRole, closeRole: closeRole, delRole: delRole, treeChanged: treeChanged
  };
})();

function adminInit() { AUTH.adminInit(); }
AUTH.wrapTabFuncs();
