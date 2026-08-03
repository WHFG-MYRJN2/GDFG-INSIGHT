// ============================================================
// app.js — MONITORING GDFG
// Global state, login, logout, sidebar, routing, toast
// ============================================================

// ============================================================
// GLOBAL STATE
// ============================================================
var lokalChartData       = null;
var eksporChartData      = null;
var _skuNamaMap          = {};
var _skuDataMap          = {};
var _opnameNamaMap       = {};
var _currentUser         = '';
var _userRole            = 'admin';
var divisiChartData      = null;
var lokalChartInstance   = null;
var eksporChartInstance  = null;
var lokalChartHInstance  = null;
var eksporChartHInstance = null;
var divisiPieInstance    = null;
var eksporDivisiPieInstance = null;
var currentView          = 'horizontal';

// ============================================================
// LOGIN
// ============================================================
function toggleShowPassword() {
  var inpHide = document.getElementById('password');
  var inpShow = document.getElementById('passwordVisible');
  var ico     = document.getElementById('eyeIcon');
  if (!inpHide || !inpShow) return;
  var isHidden = inpHide.style.display !== 'none';
  if (isHidden) {
    inpShow.value        = inpHide.value;
    inpHide.style.display = 'none';
    inpShow.style.display = '';
    inpShow.focus();
    if (ico) ico.className = 'fas fa-eye-slash';
  } else {
    inpHide.value        = inpShow.value;
    inpShow.style.display = 'none';
    inpHide.style.display = '';
    inpHide.focus();
    if (ico) ico.className = 'fas fa-eye';
  }
}

function login(){
  var u   = document.getElementById("username").value.trim();
  var pwEl = document.getElementById("password"); var pwElV = document.getElementById("passwordVisible"); var p = (pwEl&&pwEl.style.display!=="none"?pwEl:pwElV).value;
  var btn = document.querySelector(".btn-login");
  if(!u || !p){
    showLoginError("Username dan password tidak boleh kosong.");
    return;
  }
  document.getElementById("loginMsg").style.display = "none";

  // Loading state di tombol
  btn.classList.add("loading");
  btn.innerHTML = '<span class="btn-spinner"></span> Memuat...';

  API.run('verifyLogin', { username: u, password: p }, function(res){
    if(res && res.success){
      _currentUser = u;
      _userRole    = res.role || 'admin';
      API.setToken(res.token);
      var remember = document.getElementById('loginRemember') && document.getElementById('loginRemember').checked;
      var sess = JSON.stringify({ user: u, role: _userRole, ts: Date.now(), token: res.token });
      try { if(remember) localStorage.setItem('gdfgSession', sess); } catch(e){}
      try { sessionStorage.removeItem('gdfgLoggedOut'); } catch(e){}
      _patternLoaded = false;
      _patternCache  = null;
      document.getElementById("loginWrap").style.display = "none";
      document.getElementById("dashboard").style.display = "block";
      applyRoleRestrictions(_userRole);
      refreshData();
      _patternLoadAsync(function(){});
    } else {
      btn.classList.remove("loading");
      btn.innerHTML = "Login";
      showLoginError((res&&res.message) || "Login gagal.");
    }
  });
}

function showLoginError(msg) {
  var el          = document.getElementById('loginMsg');
  el.innerText    = msg;
  el.style.display = 'block';
}

function handleAuthExpired() {
  try { localStorage.removeItem('gdfgSession'); } catch(e){}
  var dash = document.getElementById('dashboard');
  var lw   = document.getElementById('loginWrap');
  if (dash) dash.style.display = 'none';
  if (lw)   lw.style.display   = 'flex';
  showLoginError('Sesi kadaluarsa, silakan login ulang.');
}

function logout() {
  try { localStorage.removeItem('gdfgSession'); } catch(e) {}
  try { sessionStorage.setItem('gdfgLoggedOut', '1'); } catch(e) {}
  API.clearToken();
  _currentUser   = '';
  _userRole      = 'admin';
  _patternLoaded = false;
  _patternCache  = null;
  document.getElementById('dashboard').style.display  = 'none';
  document.getElementById('loginWrap').style.display  = 'flex';
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  document.getElementById('loginMsg').style.display = 'none';
  var btn = document.querySelector('.btn-login');
  if (btn) { btn.classList.remove('loading'); btn.innerHTML = 'Login'; }
}

// ============================================================
// ROLE-BASED ACCESS CONTROL
// ============================================================
function applyRoleRestrictions(role){
  var isAdmin   = (role === 'admin');
  var isViewer  = (role === 'viewer' || role === 'visitor');
  var isVisitor = (role === 'visitor');
  var isPPIC    = (role === 'ppic');
  var isOwner   = (role === 'owner');

  // ── Tampilkan Karina hanya untuk owner ──
  var karinaFloat = document.getElementById('karinaFloat');
  if (karinaFloat) karinaFloat.style.display = isOwner ? 'block' : 'none';
  // ── PPIC: hanya Monitoring Ekspor ──
  if (isPPIC) {
    try {
      ['menuDashboard','menuRealisasi','menuOpname','menuRdc',
       'menuStockJalur','menuBinLoc','menuApps','menuKarina','menuKpi'].forEach(function(id){
        var el = document.getElementById(id); if (el) el.style.display = 'none';
      });
      ['dashboard','realisasiPage','opnamePage','rdcPage',
       'stockJalurPage','binLocPage','appsPage','karinaPage','kpiPage'].forEach(function(id){
        var el = document.getElementById(id); if (el) el.style.display = 'none';
      });
      setTimeout(function(){ if(typeof showPage==='function') showPage('monitoringEksporPage'); }, 300);
    } catch(e) { console.warn('PPIC restrict error:', e); }
    return;
  }

  function hide(id){ var el=document.getElementById(id); if(el) el.style.display='none'; }
  function hideEl(el){ if(el) el.style.display='none'; }
  function hideAll(sel){ document.querySelectorAll(sel).forEach(function(el){el.style.display='none';}); }

  if(isViewer){
    // ── Kapasitas: sembunyikan tombol Input Data & Spreadsheet ──────
    document.querySelectorAll('.gdrm-header-btns .btn-hdr').forEach(function(btn){
      if(btn.getAttribute('onclick') && (
        btn.getAttribute('onclick').indexOf('inputPage')>=0 ||
        btn.getAttribute('onclick').indexOf('updateStock')>=0
      )) btn.style.display='none';
    });

    // ── Realisasi SPE: hanya tampilkan Summary & Planning ────────────
    document.querySelectorAll('.real-tab').forEach(function(btn){
      var oc = btn.getAttribute('onclick')||'';
      if(oc.indexOf('summaryReal')<0 && oc.indexOf('planningReal')<0){
        btn.style.display='none';
      }
    });

    // ── Stock Opname: sembunyikan tombol Input & Setting PIN ─────────
    hide('btnOpInput');
    // Setting PIN button (fa-shield-alt)
    document.querySelectorAll('#opnamePage .btn-hdr').forEach(function(btn){
      if(btn.getAttribute('onclick') && btn.getAttribute('onclick').indexOf('_psOpen')>=0)
        btn.style.display='none';
    });

    // ── RDC: sembunyikan tab Input Data ─────────────────────────────
    hide('rdcTabInput');
    hide('btnRdcInput');

    // ── Stock Jalur: sembunyikan tombol Input & Output ───────────────
    hide('btnSjInput');
    hide('btnSjOutput');
  }

  // ── Default tab setelah login untuk viewer/visitor ──────────────────
  if(isViewer){
    // Stock Opname → langsung ke Riwayat (tanpa PIN)
    setTimeout(function(){
      _doSwitchOpnameTab('view');
    }, 500);

    // Stock Jalur → langsung ke Rekap (tanpa PIN)
    setTimeout(function(){
      sjSwitchTab('rekap');
    }, 500);
  }

  // ── Visitor: kolom tabel Stock Opname dibatasi 4 kolom ──────────────
  if(isVisitor){
    window._visitorMode = true;
  }
}

function _isVisitorColVisible(colKey) {
  if (!window._visitorMode) return true;
  var allowed = ['no', 'sku', 'item', 'fisik'];
  return allowed.indexOf(String(colKey).toLowerCase()) >= 0;
}

// ============================================================
// SIDEBAR
// ============================================================
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
  document.getElementById('sidebarOverlay').classList.toggle('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('active');
  document.getElementById('sidebarOverlay').classList.remove('active');
}

// ============================================================
// ROUTING — SHOW PAGE
// ============================================================
function showPage(page) {
  // Push ke history agar tombol back HP kembali ke halaman sebelumnya
  if (window.history && window.history.pushState) {
    window.history.pushState({ page: page }, '', '#' + page);
  }
  _opDragging = false;
  if (page !== 'opnamePage')   _opClearSel();
  if (page !== 'inputPage')    _inResetSel();

  var pages = ['dashboard','inputPage','realisasiPage','opnamePage','rdcPage','stockJalurPage','binLocPage','appsPage','monitoringEksporPage','kpiPage'];
  pages.forEach(function (p) {
    var el = document.getElementById(p);
    if (!el) return;
    el.style.display = 'none';
    el.classList.remove('page-enter');
  });

  if (page !== 'realisasiPage') hideStickyFooter();

  var target = document.getElementById(page);
  target.style.display = page === 'monitoringEksporPage' ? 'flex' : 'block';
  if (page === 'monitoringEksporPage') target.style.flexDirection = 'column';
  requestAnimationFrame(function () { target.classList.add('page-enter'); });
  closeSidebar();

  // Update sidebar active
  document.getElementById('menuDashboard').classList.toggle('active-page',  page === 'dashboard');
  document.getElementById('menuRealisasi').classList.toggle('active-page',  page === 'realisasiPage');
  document.getElementById('menuOpname').classList.toggle('active-page',     page === 'opnamePage');
  document.getElementById('menuRdc').classList.toggle('active-page',        page === 'rdcPage');
  document.getElementById('menuStockJalur').classList.toggle('active-page', page === 'stockJalurPage');
  document.getElementById('menuBinLoc').classList.toggle('active-page',            page === 'binLocPage');
  document.getElementById('menuMonitoringEkspor').classList.toggle('active-page',  page === 'monitoringEksporPage');
  document.getElementById('menuApps').classList.toggle('active-page',              page === 'appsPage');
  var menuKpiEl = document.getElementById('menuKpi'); if (menuKpiEl) menuKpiEl.classList.toggle('active-page', page === 'kpiPage');

  // Page-specific init
  if (page === 'dashboard') {
    updateLastRefresh();
    loadTanggalHistoryThenHariIni();
  }
  if (page === 'inputPage')    initEmptyRows(30);
  if (page === 'opnamePage')   { initOpnamePage(); switchOpnameTab('input'); }
  if (page === 'rdcPage')      rdcInitPage();
  if (page === 'stockJalurPage') sjInitPage();
  if (page === 'binLocPage')           blInitPage();
  if (page === 'monitoringEksporPage') mekInitPage();
  if (page === 'kpiPage') kpiInitPage();
  if (page === 'realisasiPage') {
    initRealForm();
    var today   = new Date();
    var yyyy    = today.getFullYear();
    var mm      = String(today.getMonth() + 1).padStart(2, '0');
    var dd      = String(today.getDate()).padStart(2, '0');
    var todayStr = yyyy + '-' + mm + '-' + dd;
    document.getElementById('filterFrom').value = todayStr;
    document.getElementById('filterTo').value   = todayStr;
    switchFilterMode('date');
    loadSummaryReal();
  }
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function showToast(msg, type) {
  var t       = document.getElementById('toast');
  t.innerText = msg;
  t.className = 'toast ' + (type || '');
  t.classList.add('show');
  setTimeout(function () { t.classList.remove('show'); }, 3000);
}

// ============================================================
// REFRESH DATA (Dashboard)
// ============================================================
function refreshData() {
  var sel = document.getElementById('kapasitasTanggalSelect');
  if (sel) sel.value = '';
  updateLastRefresh();
  // Gabung jadi 1 request — ambil semua tanggal sekaligus lalu load terkini
  loadTanggalHistoryThenHariIni();
}

function loadTanggalHistoryThenHariIni() {
  var today = (function(){
    var t=new Date();
    return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  })();

  // Step 1: Ambil daftar tanggal saja (scan dari bawah, cepat)
  API.run('getHistoryTanggals', {}, function(res) {
    var tanggals = (res && res.success && res.tanggals) ? res.tanggals : [];

    // Isi dropdown
    var sel = document.getElementById('kapasitasTanggalSelect');
    if (sel) {
      var cur = sel.value;
      while (sel.options.length > 1) sel.remove(1);
      tanggals.forEach(function(tgl) {
        var opt = document.createElement('option');
        opt.value = tgl;
        var parts = tgl.split('-');
        opt.textContent = parts.length===3 ? parts[2]+'-'+parts[1]+'-'+parts[0] : tgl;
        sel.appendChild(opt);
      });
      if (cur) sel.value = cur;
    }

    // Tentukan tanggal yang di-load (terbaru = index 0)
    var tglToLoad = today;
    if (tanggals.length && tanggals.indexOf(today) < 0) {
      tglToLoad = tanggals[0];
    }

    // Update Last Update label
    var luEl = document.getElementById('lastUpdateValue');
    if (luEl && tglToLoad) {
      var p = tglToLoad.split('-');
      luEl.innerText = p.length===3 ? p[2]+'/'+p[1]+'/'+p[0] : tglToLoad;
    }

    // Update select value
    if (sel) {
      if (tglToLoad !== today) {
        var found = false;
        for (var i=0; i<sel.options.length; i++) {
          if (sel.options[i].value===tglToLoad) { found=true; sel.value=tglToLoad; break; }
        }
        if (!found) sel.value = '';
      } else {
        sel.value = '';
      }
    }

    // Step 2: Load data hanya untuk tanggal terpilih
    if (typeof _loadKapasitasByTgl === 'function') {
      _loadKapasitasByTgl(tglToLoad);
    }
  });
}

// ============================================================
// SHOW TAB (Dashboard tabs: Summary/Lokal/Ekspor/GDFG)
// ============================================================
function showTab(tabId) {
  document.querySelectorAll('.g-tab').forEach(function (t) { t.classList.remove('active'); });
  document.querySelectorAll('.g-tab-pane').forEach(function (c) { c.classList.remove('active'); });
  var tab = document.querySelector(".g-tab[onclick*='" + tabId + "']");
  if (tab) tab.classList.add('active');
  var content = document.getElementById(tabId);
  if (content) content.classList.add('active');
  if (tabId === 'summary') {
    // Hanya render kalau data sudah ada
    if (lokalChartData || eksporChartData) {
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          if      (currentView === 'chart')      renderCharts();
          else if (currentView === 'horizontal') renderChartsHorizontal();
          else if (currentView === 'pie')        renderPieChart();
          else                                   renderTableView();
        });
      });
    }
  }
}

// ============================================================
// SWITCH VIEW (Chart/Table/Pie/Trend)
// ============================================================
function switchView(view) {
  currentView = view;

  var tbl = document.getElementById('viewTable');
  tbl.classList.remove('visible');

  document.getElementById('btnToggleChart').classList.toggle('active',      view === 'chart');
  document.getElementById('btnToggleHorizontal').classList.toggle('active', view === 'horizontal');
  document.getElementById('btnToggleTable').classList.toggle('active',      view === 'table');
  document.getElementById('btnTogglePie').classList.toggle('active',        view === 'pie');
  document.getElementById('btnToggleTrend').classList.toggle('active',      view === 'trend');


  document.getElementById('viewChart').style.display      = (view === 'chart')      ? 'grid'  : 'none';
  document.getElementById('viewHorizontal').style.display = (view === 'horizontal') ? 'grid'  : 'none';
  document.getElementById('viewPie').style.display        = (view === 'pie')        ? 'flex'  : 'none';
  document.getElementById('viewTrend').style.display      = (view === 'trend')      ? 'block' : 'none';

  if (view === 'table') {
    tbl.style.display = 'grid';
    renderTableView();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { tbl.classList.add('visible'); });
    });
  } else {
    tbl.style.display = 'none';
  }

  // rAF supaya browser sempat layout canvas sebelum Chart.js render
  if (view === 'chart' || view === 'horizontal' || view === 'pie' || view === 'trend') {
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        if      (view === 'chart')      renderCharts();
        else if (view === 'horizontal') renderChartsHorizontal();
        else if (view === 'pie')        renderPieChart();
        else if (view === 'trend')      initTrendView();
      });
    });
  }
}

// ============================================================
// UPDATE LAST REFRESH — tidak lagi fetch GAS, cukup timestamp lokal
// (Last Update dari sheet sudah ditampilkan di label tanggal history)
// ============================================================
function updateLastRefresh() {
  // Tidak perlu fetch GAS — last update ditampilkan dari tanggal history kapasitas
}

// ============================================================
// APPS PAGE
// ============================================================
function _openApp(url) {
  window.open(url, '_blank');
}

// ============================================================
// BACK BUTTON HANDLER (tombol back HP)
// ============================================================
window._lastPage = 'dashboard';

// Handle tombol back — kembali ke halaman sebelumnya
window.addEventListener('popstate', function(event) {
  if (event.state && event.state.page) {
    // Ada state — navigasi ke halaman tersebut tanpa push history baru
    window._lastPage = null; // sementara null agar pushState tidak double
    showPage(event.state.page);
    window._lastPage = event.state.page;
  } else {
    // Tidak ada state — artinya sudah di halaman paling awal
    // Push state kosong agar tidak keluar app, kembali ke dashboard
    showPage('dashboard');
    window.history.pushState({ page: 'dashboard' }, '', '');
    window._lastPage = 'dashboard';
  }
});

// Push initial state saat pertama load (agar ada state awal)
window.addEventListener('load', function() {
  window.history.replaceState({ page: 'dashboard' }, '', '');
  window._lastPage = 'dashboard';
});

// ============================================================
// BACK BUTTON INTERCEPT
// ============================================================
window.addEventListener('popstate', function(e) {
  if (e.state && e.state.page) {
    // Kembali ke halaman sebelumnya tanpa push history baru
    var page = e.state.page;
    var pages = ['dashboard','inputPage','realisasiPage','opnamePage',
                 'rdcPage','stockJalurPage','binLocPage','appsPage','monitoringEksporPage'];
    pages.forEach(function(p) {
      var el = document.getElementById(p);
      if (el) { el.style.display = 'none'; el.classList.remove('page-enter'); }
    });
    var target = document.getElementById(page);
    if (target) {
      target.style.display = 'block';
      requestAnimationFrame(function() { target.classList.add('page-enter'); });
    }
    closeSidebar();
  } else {
    // Tidak ada state — tutup sidebar kalau terbuka, atau biarkan browser keluar
    var sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('active')) {
      closeSidebar();
      // Push dummy state agar back berikutnya bisa keluar
      window.history.pushState(null, '', window.location.href);
    }
  }
});

// Push initial state saat pertama load
window.addEventListener('load', function() {
  if (window.history && window.history.pushState) {
    window.history.replaceState({ page: 'dashboard' }, '', '#dashboard');
  }
});

// ── Session persistence ───────────────────────────────────────
function _restoreSession() {
  try {
    if (sessionStorage.getItem('gdfgLoggedOut')) return false;
    var sess = localStorage.getItem('gdfgSession');
    if (!sess) return false;
    var data = JSON.parse(sess);
    if (Date.now() - data.ts > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem('gdfgSession');
      return false;
    }
    if (!data.token) {
      // sesi lama dari sebelum patch auth -- token tidak ada, paksa login ulang
      localStorage.removeItem('gdfgSession');
      return false;
    }
    _currentUser = data.user;
    _userRole    = data.role || 'admin';
    API.setToken(data.token);
    document.getElementById("loginWrap").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    applyRoleRestrictions(_userRole);
    loadTanggalHistoryThenHariIni();
    return true;
  } catch(e) { return false; }
}
window.addEventListener('load', function(){ setTimeout(_restoreSession, 100); });

// ── KARINA AI ─────────────────────────────────────────────────
function karinaToggle() {
  var popup = document.getElementById('karinaChatPopup');
  var badge = document.getElementById('karinaBadge');
  if (!popup) return;
  var isOpen = popup.classList.contains('open');
  if (isOpen) {
    // Tutup dengan animasi
    popup.classList.add('closing');
    popup.classList.remove('open');
    setTimeout(function(){
      popup.classList.remove('closing');
      popup.style.display = 'none';
    }, 220);
  } else {
    // Buka — set display dulu, lalu force reflow, lalu add class
    if (badge) badge.style.display = 'none';
    popup.style.display = 'flex';
    void popup.offsetHeight;  // force reflow sekali saja
    popup.classList.add('open');
    // Welcome message
    var area = document.getElementById('karinaChatArea');
    if (area && !area.hasChildNodes()) _kaAddWelcome();
    setTimeout(function(){
      var input = document.getElementById('karinaInput');
      if (input) input.focus();
    }, 230);
  }
}

var _kaDataFetched = false;  // flag supaya fetch hanya 1x

function _kaAddWelcome() {
  _kaAddMessage('Halo! Saya Karina 👋\n\nSaya siap membantu pertanyaan seputar gudang GDFG — kapasitas, ekspor, antrian truk, BinLoc, dan lainnya.\n\nData akan diambil otomatis saat Anda bertanya. Silakan ketik pertanyaan Anda!', 'assistant');
}

function _kaFetchDataIfNeeded(callback) {
  if (_kaDataFetched) { callback(); return; }
  // Tambah pesan loading sementara
  var area = document.getElementById('karinaChatArea');
  var loadEl = document.createElement('div');
  loadEl.id = 'karinaLoadMsg';
  loadEl.style.cssText = 'font-size:11px;color:#a0aec0;text-align:center;padding:4px;';
  loadEl.textContent = 'Mengambil data gudang...';
  if (area) area.appendChild(loadEl);

  API.run('getKarinaSummary', {}, function(res) {
    // Hapus loading
    var el = document.getElementById('karinaLoadMsg');
    if (el && el.parentNode) el.parentNode.removeChild(el);

    if (res && res.success && res.data) {
      var d = res.data;
      var eks = d.eksporWeekIni || {};
      var kap = d.kapasitas || {};
      var ant = d.antrianHariIni || {};
      // Tambah data ke system prompt untuk sesi ini
      _kaDataContext = [
        'DATA GUDANG TERKINI (' + d.tanggal + '):',
        '',
        '📦 KAPASITAS GUDANG:',
        '  - Total pallet: ' + (kap.total||0) + ' / ' + (kap.kapasitasGudang||5800),
        '  - Lokal: ' + (kap.lokal||0) + ' pallet (' + (kap.persentaseLokal||0) + '%)',
        '  - Ekspor: ' + (kap.ekspor||0) + ' pallet (' + (kap.persentaseEkspor||0) + '%)',
        '  - GDFG: ' + (kap.gdfg||0) + ' pallet',
        '',
        '🚢 CAPAIAN EKSPOR WEEK INI (' + (eks.weekRange||'-') + '):',
        '  - Total planning: ' + (eks.totalPlanning||0) + ' container',
        '  - Sudah keluar: ' + (eks.sudahKeluar||0) + ' container (' + (eks.pctCapaian||0) + '%)',
        '  - Masih proses: ' + (eks.masihProses||0) + ' container',
        '  - Belum datang: ' + (eks.belumDatang||0) + ' container',
      ];
      // Tambah by tujuan
      if (eks.byTujuan) {
        _kaDataContext.push('  - Per tujuan:');
        Object.keys(eks.byTujuan).forEach(function(t) {
          var bt = eks.byTujuan[t];
          _kaDataContext.push('    · ' + t + ': plan=' + bt.plan + ', keluar=' + bt.keluar);
        });
      }
      _kaDataContext.push('');
      _kaDataContext.push('🚛 ANTRIAN TRUK HARI INI:');
      _kaDataContext.push('  - Menunggu: ' + (ant.menunggu||0) + ' truk');
      _kaDataContext.push('  - Sedang muat: ' + (ant.sedangMuat||0) + ' truk');
      _kaDataContext.push('  - Sudah keluar: ' + (ant.sudahKeluar||0) + ' truk');
      _kaDataContext.push('  - Ditolak: ' + (ant.ditolak||0) + ' truk');
      _kaDataContext.push('  - Total: ' + (ant.total||0) + ' truk');
      _kaDataContext.push('');

      // BinLoc
      var bin = d.binLoc || {};
      if (bin.totalPallet !== undefined) {
        _kaDataContext.push('BIN LOC (lokasi pallet di gudang):');
        _kaDataContext.push('  - Total pallet terlacak: ' + bin.totalPallet);
        _kaDataContext.push('  - Pallet Lokal: ' + bin.totalPalletLokal);
        _kaDataContext.push('  - Pallet Ekspor: ' + bin.totalPalletEkspor);
        _kaDataContext.push('  - Jumlah SKU: ' + bin.jumlahSku);
        _kaDataContext.push('');
      }
      // Top SKU Ekspor
      var topSku = d.topSkuEkspor || [];
      if (topSku.length) {
        _kaDataContext.push('TOP SKU EKSPOR (berdasarkan pallet):');
        topSku.forEach(function(s, i) {
          _kaDataContext.push('  ' + (i+1) + '. ' + s.nama + ' (' + s.sku + '): ' + s.pallet + ' pallet');
        });
        _kaDataContext.push('');
      }
      // Stock Opname
      var op = d.stockOpname || {};
      if (op.lastOpnameLokal) {
        _kaDataContext.push('STOCK OPNAME:');
        _kaDataContext.push('  - Opname Lokal terakhir: ' + op.lastOpnameLokal + ' (' + op.totalRowsLokal + ' baris)');
        _kaDataContext.push('  - Opname Ekspor terakhir: ' + op.lastOpnameEkspor + ' (' + op.totalRowsEkspor + ' baris)');
        _kaDataContext.push('');
      }
      _kaDataContext.push('Last update data: ' + (d.lastUpdate||'-'));

      var msg = 'Data gudang berhasil dimuat!\n\n';
      msg += 'Total Pallet: ' + (kap.total||0) + ' / ' + (kap.kapasitasGudang||7096) + ' (' + (kap.persentaseTotal||0) + '%)\n';
      msg += 'Lokal: ' + (kap.lokal||0) + ' pallet (' + (kap.persentaseLokal||0) + '% dari kap ' + (kap.kapasitasLokal||5800) + ')\n';
      msg += 'Ekspor: ' + (kap.ekspor||0) + ' pallet (' + (kap.persentaseEkspor||0) + '% dari kap ' + (kap.kapasitasEkspor||1296) + ')\n';
      msg += 'Ekspor week ini: ' + (eks.sudahKeluar||0) + '/' + (eks.totalPlanning||0) + ' container keluar (' + (eks.pctCapaian||0) + '%)\n';
      msg += 'Antrian hari ini: ' + (ant.total||0) + ' truk (' + (ant.sedangMuat||0) + ' muat, ' + (ant.sudahKeluar||0) + ' keluar)\n';
      if (bin.totalPallet) msg += 'BinLoc: ' + bin.totalPallet + ' pallet terlacak (' + bin.jumlahSku + ' SKU)\n';
      msg += '\nApa yang ingin Anda ketahui?';
      _kaDataFetched = true;
    }
    callback();
  });
}

var _kaDataContext = [];
var _kaHistory = [];

var _kaSystemPrompt = [
  'Kamu adalah Karina (Knowledge-based Administrative Resource & Inventory Network AI), ',
  'asisten AI untuk sistem manajemen gudang GDFG (Finished Goods) milik PT Mars Indonesia.',
  '',
  'SISTEM GDFG terdiri dari beberapa halaman/modul:',
  '1. KAPASITAS — stok pallet GDI2+GDIN (lokal), EKSPOR, GDFG dari HISTORY KAPASITAS. Cap: Lokal 5800, Ekspor 1296, Total 7096.',
  '2. REALISASI — realisasi SPE (Surat Perintah Ekspor) per shift (1/2/3) dan tim per tanggal.',
  '3. STOCK OPNAME — opname fisik vs SAP untuk lokal, ekspor, FIFO wafer/biskuit, QT Ready.',
  '4. MONITORING RDC — jadwal dan realisasi pengiriman ke RDC: waktu muat, durasi, rute, ekspedisi.',
  '5. STOCK JALUR — kartu stock produksi per SKU: output shift 1/2/3, sisa stok, pengiriman keluar.',
  '6. BIN LOC — lokasi pallet di dalam gudang: bin location, SKU, prodate, quotation, pallet.',
  '7. MONITORING EKSPOR — planning container ekspor vs realisasi antrian truk per SO/tujuan/tanggal.',
  '8. SISTEM ANTRIAN GDFG — antrian truk semua jenis (lokal/ekspor/MDC). ',
  '   Status: ANTRIAN=menunggu, START_LOADING/FINISH_LOADING=sedang muat, ',
  '   MENUNGGU_SPM/TREATMENT=proses dokumen/fumigasi, KELUAR=sudah keluar, DITOLAK=ditolak.',
  '   Field: tanggal, no_pol, eksp, nodoc, jenis, tujuan, status, waktu_daftar, waktu_keluar.',
  '   Summary dari tool: total, antrian, muat, prosesDokumen, keluar, ditolak.',
  '9. BINLOC APP — tracking pallet di gudang: bin location, SKU, prodate, quotation, karton, pecahan.',
  '',
  'STATUS TRUK ANTRIAN: ANTRIAN=menunggu, START_LOADING/FINISH_LOADING=sedang muat, ',
  'MENUNGGU_SPM=menunggu surat, TREATMENT=fumigasi, DITOLAK=ditolak, KELUAR=sudah berangkat.',
  '',
  'KONVERSI WEEK NUMBER (ISO 8601, Senin=hari pertama):',
  '  Week 23=01-07 Jun 2026, Week 24=08-14 Jun 2026, Week 25=15-21 Jun 2026,',
  '  Week 26=22-28 Jun 2026, Week 27=29 Jun-05 Jul 2026.',
  'Saat user sebut week N -> hitung from=Senin, to=Minggu, panggil tool dengan tanggal tepat.',
  '',
  'CARA MENJAWAB:',
  '- Selalu gunakan tool untuk ambil data real-time sebelum menjawab pertanyaan data.',
  '- Jawab dalam Bahasa Indonesia yang ramah dan profesional.',
  '- Data numerik tampilkan dengan jelas: angka, satuan, persentase.',
  '- Kalau ada beberapa tool relevan, panggil paralel.',
  'Hari ini: ' + new Date().toISOString().substring(0,10)
].join('\n');

function kaSend() {
  var input = document.getElementById('karinaInput');
  if (!input) return;
  var msg = (input.value || '').trim();
  if (!msg) return;
  input.value = '';
  _kaAddMessage(msg, 'user');
  var qp = document.getElementById('karinaQuickPrompts');
  if (qp) qp.style.display = 'none';
  // Fetch data gudang dulu kalau belum (hanya 1x per session)
  _kaFetchDataIfNeeded(function() {
    _kaCallAPI(msg);
  });
}

function kaSendQuick(msg) {
  var input = document.getElementById('karinaInput');
  if (input) input.value = msg;
  kaSend();
}

function _kaAddMessage(text, role) {
  var area = document.getElementById('karinaChatArea');
  if (!area) return;
  var isUser = role === 'user';
  var time = new Date().toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit'});
  var wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:10px;align-items:flex-start;' + (isUser ? 'flex-direction:row-reverse;' : '');
  if (!isUser) {
    var avatar = document.createElement('div');
    avatar.style.cssText = 'width:32px;height:32px;background:linear-gradient(135deg,#1a3a5c,#2d6a4f);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
    avatar.innerHTML = '<i class="fas fa-robot" style="color:#f6ad55;font-size:13px;"></i>';
    wrap.appendChild(avatar);
  }
  var bubble = document.createElement('div');
  bubble.style.cssText = isUser
    ? 'background:linear-gradient(135deg,#1a3a5c,#2d4a6a);color:#fff;border-radius:14px 4px 14px 14px;padding:10px 14px;max-width:80%;box-shadow:0 2px 8px rgba(0,0,0,.1);'
    : 'background:#fff;border-radius:4px 14px 14px 14px;padding:12px 14px;max-width:80%;box-shadow:0 2px 8px rgba(0,0,0,.06);';
  var content = document.createElement('div');
  content.style.cssText = 'font-size:13px;line-height:1.6;white-space:pre-wrap;' + (isUser ? 'color:#fff;' : 'color:#2d3748;');
  content.textContent = text;
  bubble.appendChild(content);
  var timeEl = document.createElement('div');
  timeEl.style.cssText = 'font-size:10px;margin-top:4px;' + (isUser ? 'color:rgba(255,255,255,.5);text-align:right;' : 'color:#a0aec0;');
  timeEl.textContent = (isUser ? 'Kamu' : 'Karina') + ' • ' + time;
  bubble.appendChild(timeEl);
  wrap.appendChild(bubble);
  area.appendChild(wrap);
  area.scrollTop = area.scrollHeight;
}

function _kaAddTyping() {
  var area = document.getElementById('karinaChatArea');
  if (!area) return null;
  var wrap = document.createElement('div');
  wrap.id = 'karinaTyping';
  wrap.style.cssText = 'display:flex;gap:10px;align-items:flex-start;';
  wrap.innerHTML = '<div style="width:32px;height:32px;background:linear-gradient(135deg,#1a3a5c,#2d6a4f);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-robot" style="color:#f6ad55;font-size:13px;"></i></div><div style="background:#fff;border-radius:4px 14px 14px 14px;padding:12px 14px;box-shadow:0 2px 8px rgba(0,0,0,.06);"><div style="display:flex;gap:4px;align-items:center;height:16px;"><span style="width:6px;height:6px;background:#a0aec0;border-radius:50%;animation:kaTypeDot 1.2s infinite 0s;"></span><span style="width:6px;height:6px;background:#a0aec0;border-radius:50%;animation:kaTypeDot 1.2s infinite .2s;"></span><span style="width:6px;height:6px;background:#a0aec0;border-radius:50%;animation:kaTypeDot 1.2s infinite .4s;"></span></div></div>';
  area.appendChild(wrap);
  area.scrollTop = area.scrollHeight;
  return wrap;
}

async function _kaCallAPI(userMsg) {
  var btn = document.getElementById('karinaSendBtn');
  if (btn) btn.disabled = true;
  _kaHistory.push({ role: 'user', content: userMsg });
  var typing = _kaAddTyping();
  try {
    var response = await fetch('https://insight.gdfg-app.online/karina', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'gemini',
        model: 'gemini-2.5-flash-lite',
        max_tokens: 1000,
        token: API.getToken(),
        system: _kaSystemPrompt + (_kaDataContext.length ? '\n\n' + _kaDataContext.join('\n') : ''),
        messages: _kaHistory
      })
    });
    var data = await response.json();
    var reply = (data.content && data.content[0] && data.content[0].text) || 'Maaf, terjadi kesalahan.';
    if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
    _kaAddMessage(reply, 'assistant');
    _kaHistory.push({ role: 'assistant', content: reply });
    if (_kaHistory.length > 20) _kaHistory = _kaHistory.slice(-20);
  } catch(e) {
    if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
    _kaAddMessage('Maaf, tidak bisa terhubung ke Karina. (' + e.message + ')', 'assistant');
  }
  if (btn) btn.disabled = false;
}
