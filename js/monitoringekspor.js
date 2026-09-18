// ============================================================
// monitoringekspor.js — MONITORING GDFG
// Halaman: Monitoring Ekspor
// Tab: Summary (data dari sheet ANTRIAN) | Input Planning
// ============================================================

// ── State ────────────────────────────────────────────────────
var _mekFilterMode  = 'date';   // 'date' | 'week'
var _mekSummaryData = [];

// ── Inisialisasi halaman ─────────────────────────────────────
// ── Responsive: compact mode untuk mobile portrait ───────────
function _mekApplyResponsive() {
  var isMobile = window.innerWidth <= 768;
  var page = document.getElementById('monitoringEksporPage');
  if (!page) return;

  // Toolbar padding — semua div yang punya padding inline
  var toolbars = page.querySelectorAll(
    '#mekSummaryPane > div, #mekPaneCapaian > div, ' +
    '#mekInputPane > div, #mekPlanningPane > div, #mekEmailPanel > div'
  );
  toolbars.forEach(function(el) {
    if (!el.dataset.origPad) el.dataset.origPad = el.style.padding || '';
    if (isMobile) {
      // Kurangi padding toolbar
      var p = el.style.padding;
      if (p && (p.indexOf('10px 14px') >= 0 || p.indexOf('12px 14px') >= 0)) {
        el.style.padding = '6px 10px';
      } else if (p && p.indexOf('8px 14px') >= 0) {
        el.style.padding = '5px 8px';
      }
    } else {
      // Restore
      if (el.dataset.origPad !== undefined) el.style.padding = el.dataset.origPad;
    }
  });

  // Cards capaian — 6 cards jadi 3 kolom di mobile
  var capGrid = page.querySelector('.mek-card-grid');
  if (capGrid) {
    capGrid.style.gridTemplateColumns = isMobile
      ? 'repeat(3,1fr)'
      : 'repeat(6,1fr)';  // default 6 kolom di desktop
  }
}

// ── Auto refresh Monitoring Ekspor ───────────────────────────
var _mekAutoRefreshTimer = null;
var _mekAutoRefreshSecs  = 20;
var _mekAutoRefreshCount = 0;

function mekStartAutoRefresh() {
  mekStopAutoRefresh();
  _mekAutoRefreshCount = _mekAutoRefreshSecs;
  _mekUpdateRefreshLabel();
  _mekAutoRefreshTimer = setInterval(function() {
    _mekAutoRefreshCount--;
    _mekUpdateRefreshLabel();
    if (_mekAutoRefreshCount <= 0) {
      _mekAutoRefreshCount = _mekAutoRefreshSecs;
      _mekAutoRefreshData();  // seamless — tidak re-render tabel
    }
  }, 1000);
}

function mekStopAutoRefresh() {
  if (_mekAutoRefreshTimer) { clearInterval(_mekAutoRefreshTimer); _mekAutoRefreshTimer = null; }
}

function _mekUpdateRefreshLabel() {
  var el = document.getElementById('mekRefreshCountdown');
  if (el) el.textContent = _mekAutoRefreshCount + 's';
}

function mekRefreshData() {
  // Reset cache supaya reload dari GAS
  _mekCapEmailLastFrom = ''; _mekCapEmailLastTo = '';
  mekLoadCapaian();
}

function _mekAutoRefreshData() {
  // Auto refresh — seamless: skip kalau popup terbuka
  var overlay = document.getElementById('mekCardDetailOverlay');
  if (overlay && overlay.style.display !== 'none') return;  // popup terbuka, skip

  // Update data di background tanpa re-render kalau popup row detail terbuka
  var _from = ((document.getElementById('mekCapFrom')||{}).value||'');
  var _to   = ((document.getElementById('mekCapTo')||{}).value||'');
  if (!_from || !_to) return;  // tidak ada filter aktif, skip

  // Reload data dari GAS tanpa re-render (update cache saja)
  _mekCapEmailLastFrom = ''; _mekCapEmailLastTo = '';
  API.run('getMekCapaianEmail', { from: _from, to: _to, viewMode: 'plan' }, function(res) {
    if (!res || !res.success) return;
    _mekCapEmailData    = res.data || [];
    _mekCapEmailSummary = res.summaryByDate || {};
    _mekCapEmailLastFrom = _from;
    _mekCapEmailLastTo   = _to;
    // Re-render hanya summary cards (tidak re-render tabel)
    _mekRefreshCardsOnly();
  });
}

function _mekRefreshCardsOnly() {
  // Update cards tanpa re-render tabel
  var from = ((document.getElementById('mekCapFrom')||{}).value||'');
  var to   = ((document.getElementById('mekCapTo')||{}).value||'');
  var skuF   = ((document.getElementById('mekCapSku')   ||{}).value||'').toLowerCase().trim();
  var tujF   = ((document.getElementById('mekCapTujuan')||{}).value||'').toLowerCase().trim();
  var plantF = ((document.getElementById('mekCapPlant') ||{}).value||'').trim().toUpperCase();

  var _tc=0,_kc=0,_lc=0,_dc=0,_ss={},_planMap={},_capMap={};
  _mekCapEmailData.forEach(function(r){
    if (from && r.planTgl < from) return;
    if (to   && r.planTgl > to)   return;
    if (skuF   && (r.sku||'').toLowerCase().indexOf(skuF)<0 && (r.nama||'').toLowerCase().indexOf(skuF)<0) return;
    if (tujF   && (r.tujuan||'').toLowerCase().indexOf(tujF)<0) return;
    if (plantF && !_mekMatchPlant(r.plant, plantF, r)) return;
    var _key = (r.noSo && r.noSo !== 'undefined' ? r.noSo : ('sku:'+r.sku)) + '|' + r.sku + '|' + r.planTgl;
    if(!_ss[_key] && r.isFirstRow){
      _ss[_key]=true;
      var jml = r.jumlahCont || r.planCont || 0;
      _tc += jml; _planMap[_key]=jml; _capMap[_key]=jml;
    }
  });
  _mekCapEmailData.forEach(function(r){
    if (from && r.planTgl < from) return;
    if (to   && r.planTgl > to)   return;
    if (skuF   && (r.sku||'').toLowerCase().indexOf(skuF)<0 && (r.nama||'').toLowerCase().indexOf(skuF)<0) return;
    if (tujF   && (r.tujuan||'').toLowerCase().indexOf(tujF)<0) return;
    if (plantF && !_mekMatchPlant(r.plant, plantF, r)) return;
    var _key = (r.noSo && r.noSo !== 'undefined' ? r.noSo : ('sku:'+r.sku)) + '|' + r.sku + '|' + r.planTgl;
    if (!_capMap[_key] || _capMap[_key] <= 0) return;
    if(r.status==='keluar')  { _kc++; _capMap[_key]--; }
    else if(r.status==='loading'){ _lc++; _capMap[_key]--; }
    else if(r.status==='daftar' ){ _dc++; _capMap[_key]--; }
  });
  var _dtg=_kc+_lc+_dc, _bc=Math.max(0,_tc-_dtg);
  _mekSetCard('mekCapCardTotal',_tc);
  _mekSetCard('mekCapCardDatang',_dtg);
  _mekSetCard('mekCapCardKeluar',_kc);
  _mekSetCard('mekCapCardDaftar',_lc+_dc);
  _mekSetCard('mekCapCardBelum',_bc);
  var _pe=document.getElementById('mekCapCardPct');
  if(_pe) _pe.textContent=_tc?Math.round(_kc/_tc*100)+'%':'—';
}

function mekInitPage() {
  var today  = new Date();
  var yyyy   = today.getFullYear();
  var mm     = String(today.getMonth() + 1).padStart(2, '0');
  var dd     = String(today.getDate()).padStart(2, '0');
  var ymd    = yyyy + '-' + mm + '-' + dd;

  // Default: range week ini (Senin - Minggu)
  var dow    = today.getDay(); // 0=Minggu, 1=Senin, ...
  var diffMon = (dow === 0) ? -6 : 1 - dow;  // jarak ke Senin
  var monday  = new Date(today); monday.setDate(today.getDate() + diffMon);
  var sunday  = new Date(monday); sunday.setDate(monday.getDate() + 6);
  function _fmt(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  var ymFrom = _fmt(monday);
  var ymTo   = _fmt(sunday);

  var elFrom = document.getElementById('mekFilterFrom');
  var elTo   = document.getElementById('mekFilterTo');
  if (elFrom && !elFrom.value) elFrom.value = ymFrom;
  if (elTo   && !elTo.value)   elTo.value   = ymTo;

  var elYear = document.getElementById('mekFilterWeekYear');
  if (elYear && !elYear.value) elYear.value = yyyy;

  // Default Capaian Planning: selalu set ke week ini saat init
  var efCap = document.getElementById('mekCapFrom'); if (efCap) efCap.value = ymFrom;
  var etCap = document.getElementById('mekCapTo');   if (etCap) etCap.value = ymTo;

  mekSwitchFilterMode('date');
  mekSwitchTab('summary');
  mekSwitchSumView();
  _mekApplyResponsive();
  window.addEventListener('resize', _mekApplyResponsive);
  window.addEventListener('orientationchange', function(){ setTimeout(_mekApplyResponsive, 300); });
  mekStartAutoRefresh();
  mekCapSwitchMode('email');
  _mekInitPlanningWa();
}

// ════════════════════════════════════════════════════════════
// FILTER MODE — Tanggal / Week
// ════════════════════════════════════════════════════════════
function mekSwitchFilterMode(mode) {
  _mekFilterMode = mode;
  var btnDate = document.getElementById('mekBtnFilterDate');
  var btnWeek = document.getElementById('mekBtnFilterWeek');
  var divDate = document.getElementById('mekFilterModeDate');
  var divWeek = document.getElementById('mekFilterModeWeek');
  var infoEl  = document.getElementById('mekWeekFilterInfo');

  if (btnDate) btnDate.classList.toggle('active', mode === 'date');
  if (btnWeek) btnWeek.classList.toggle('active', mode === 'week');
  if (divDate) divDate.style.display = mode === 'date' ? '' : 'none';
  if (divWeek) divWeek.style.display = mode === 'week' ? '' : 'none';
  if (infoEl)  infoEl.style.display  = 'none';
}

function _mekGetISOWeekRange(week, year) {
  var jan4 = new Date(Date.UTC(year, 0, 4));
  var dow  = jan4.getUTCDay() || 7;
  var mondayW1 = new Date(jan4);
  mondayW1.setUTCDate(jan4.getUTCDate() - (dow - 1));
  var monday = new Date(mondayW1);
  monday.setUTCDate(mondayW1.getUTCDate() + (week - 1) * 7);
  var sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { from: monday.toISOString().slice(0, 10), to: sunday.toISOString().slice(0, 10) };
}

// Hitung ISO week number dari string "YYYY-MM-DD"
function _mekDateToISOWeek(ymd) {
  if (!ymd) return 0;
  var d = new Date(ymd + 'T00:00:00Z');
  var day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function _mekFmtTglDisplay(ymd) {
  if (!ymd) return '';
  var p = ymd.split('-');
  return p[2] + '/' + p[1] + '/' + p[0];
}

function mekApplyWeekFilter() {
  var wFrom = parseInt((document.getElementById('mekFilterWeekFrom') || {}).value) || 0;
  var wTo   = parseInt((document.getElementById('mekFilterWeekTo')   || {}).value) || wFrom;
  var year  = parseInt((document.getElementById('mekFilterWeekYear') || {}).value) || new Date().getFullYear();

  if (!wFrom) { showToast('Isi nomor Week', 'warning'); return; }
  if (wFrom > wTo) { showToast('Week dari harus ≤ Week sampai', 'warning'); return; }

  var rangeFrom = _mekGetISOWeekRange(wFrom, year);
  var rangeTo   = _mekGetISOWeekRange(wTo,   year);
  var from = rangeFrom.from;
  var to   = rangeTo.to;

  var elFrom = document.getElementById('mekFilterFrom'); if (elFrom) elFrom.value = from;
  var elTo   = document.getElementById('mekFilterTo');   if (elTo)   elTo.value   = to;

  // Sync No.Pol / No.DOC / Tujuan dari field week ke date supaya mekLoadSummary baca dari satu tempat
  var nopolW  = (document.getElementById('mekFilterSkuW')   || {}).value || '';
  var nodocW  = (document.getElementById('mekFilterNoDocW') || {}).value || '';
  var destW   = (document.getElementById('mekFilterDestW')  || {}).value || '';
  var elNopol = document.getElementById('mekFilterNopol');  if (elNopol) elNopol.value = nopolW;
  var elNoDoc = document.getElementById('mekFilterNoDoc');  if (elNoDoc) elNoDoc.value = nodocW;
  var elDest  = document.getElementById('mekFilterDest');   if (elDest)  elDest.value  = destW;

  var infoTxt = document.getElementById('mekWeekFilterInfoText');
  if (infoTxt) infoTxt.innerText =
    'Week ' + wFrom + (wFrom !== wTo ? ' – Week ' + wTo : '') + ' ' + year +
    ' = ' + _mekFmtTglDisplay(from) + ' s/d ' + _mekFmtTglDisplay(to);
  var infoEl = document.getElementById('mekWeekFilterInfo');
  if (infoEl) infoEl.style.display = 'block';

  mekLoadSummary();
}

function mekResetFilter() {
  var today  = new Date();
  var yyyy   = today.getFullYear();
  var mm     = String(today.getMonth() + 1).padStart(2, '0');
  var dd     = String(today.getDate()).padStart(2, '0');
  var ymFrom = yyyy + '-' + mm + '-01';
  var ymd    = yyyy + '-' + mm + '-' + dd;

  ['mekFilterFrom',ymFrom,'mekFilterTo',ymd].forEach(function(_,i,a){ if(i%2===0){ var e=document.getElementById(a[i]); if(e)e.value=a[i+1]; } });
  ['mekFilterSku','mekFilterNopol','mekFilterNoDoc','mekFilterDest',
   'mekFilterWeekFrom','mekFilterWeekTo','mekFilterSkuW','mekFilterNoDocW','mekFilterDestW']
    .forEach(function(id){ var e=document.getElementById(id); if(e) e.value=''; });
  var ii = document.getElementById('mekWeekFilterInfo'); if (ii) ii.style.display = 'none';
}

// ── Tab switching ─────────────────────────────────────────────
function mekSwitchTab(tab) {
  var panes = { summary: 'mekSummaryPane', input: 'mekInputPane', planning: 'mekPlanningPane', stock: 'mekStockPane', reserved: 'mekReservedPane' };
  var tabs  = { summary: 'mekTabSummary',  input: 'mekTabInput',  planning: 'mekTabPlanning',  stock: 'mekTabStock',  reserved: 'mekTabReserved'  };
  var ac = '#1a3a5c';

  Object.keys(panes).forEach(function(t) {
    var pane = document.getElementById(panes[t]);
    var btn  = document.getElementById(tabs[t]);
    if (pane) {
      if (t === tab) {
        pane.style.opacity = '0'; pane.style.display = 'flex'; pane.style.flexDirection = 'column';
        pane.style.transition = 'opacity .2s ease';
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ pane.style.opacity = '1'; }); });
      } else {
        pane.style.display = 'none';
      }
    }
    if (btn) {
      btn.style.color = t===tab ? ac : '#718096';
      btn.style.borderBottomColor = t===tab ? ac : 'transparent';
    }
  });

  var bsEl = document.getElementById('btnMekSummary'); if (bsEl) bsEl.style.background = tab==='summary'?'rgba(255,255,255,.35)':'rgba(255,255,255,.2)';
  var biEl = document.getElementById('btnMekInput');   if (biEl) biEl.style.background = tab==='input'?'rgba(255,255,255,.35)':'rgba(255,255,255,.2)';
}

// ════════════════════════════════════════════════════════════
// TAB KESIAPAN STOCK — cross-check planning ekspor yang belum
// close (week ini + sisa week sebelumnya) vs stok BinLoc saat ini
// ════════════════════════════════════════════════════════════
var _mekStockData = [];  // hasil mentah dari backend (belum difilter)
var _mekStockView = [];  // hasil setelah filter SKU/Tujuan diterapkan — yang dipakai popup detail

function mekLoadStockReadiness() {
  var list  = document.getElementById('mekStockList');
  var empty = document.getElementById('mekStockEmpty');
  var load  = document.getElementById('mekStockLoading');
  if (!list) return;
  list.innerHTML = '';
  empty.style.display = 'none';
  load.style.display  = 'block';

  API.run('getMekStockReadiness', {}, function(res) {
    load.style.display = 'none';
    if (!res || !res.success) {
      list.innerHTML = '<div style="text-align:center;padding:30px;color:#c53030;">Gagal memuat: ' + _mekEsc((res&&res.message)||'Error') + '</div>';
      return;
    }
    _mekStockData = res.data || [];
    _mekRenderStockReadiness();
  }, function(err) {
    load.style.display = 'none';
    list.innerHTML = '<div style="text-align:center;padding:30px;color:#c53030;">Gagal memuat: ' + _mekEsc(err&&err.message||err) + '</div>';
  });
}

function _mekRenderStockReadiness() {
  var list  = document.getElementById('mekStockList');
  var empty = document.getElementById('mekStockEmpty');
  var raw   = _mekStockData || [];

  var skuF    = ((document.getElementById('mekStockFilterSku')    ||{}).value||'').toLowerCase().trim();
  var noSoF   = ((document.getElementById('mekStockFilterNoSo')   ||{}).value||'').toLowerCase().trim();
  var tujuanF = ((document.getElementById('mekStockFilterTujuan') ||{}).value||'').toLowerCase().trim();
  var plantF  = ((document.getElementById('mekStockFilterPlant')  ||{}).value||'').toLowerCase().trim();

  var data = raw;

  // Filter SKU/Nama — cocokkan kode atau nama, tidak mengubah angka
  if (skuF) {
    data = data.filter(function(d){
      return (d.sku||'').toLowerCase().indexOf(skuF) >= 0 || (d.nama||'').toLowerCase().indexOf(skuF) >= 0;
    });
  }

  // Filter No. SO / Tujuan / Plant — cuma hitung kebutuhan dari baris planning yang cocok,
  // "Tersedia" tetap total stok fisik (barangnya generik, bisa dikirim ke mana saja)
  if (noSoF || tujuanF || plantF) {
    data = data.map(function(d){
      var detailF = (d.detail||[]).filter(function(x){
        if (noSoF   && (x.noSo||'').toLowerCase().indexOf(noSoF) < 0)     return false;
        if (tujuanF && (x.tujuan||'').toLowerCase().indexOf(tujuanF) < 0) return false;
        if (plantF === '__no_plant__') {
          if ((x.plant||'').trim()) return false;
        } else if (plantF && (x.plant||'').toLowerCase().indexOf(plantF) < 0) {
          return false;
        }
        return true;
      });
      if (!detailF.length) return null;
      var butuhF = detailF.reduce(function(s,x){ return s + (x.sisaQty||0); }, 0);
      var selisihF = d.tersedia - butuhF;
      var allClosedF = detailF.every(function(x){ return x.closed; });
      return { sku: d.sku, nama: d.nama, butuh: butuhF, tersedia: d.tersedia,
               selisih: selisihF, cukup: selisihF >= 0, allClosed: allClosedF, detail: detailF, binDetail: d.binDetail };
    }).filter(function(d){ return d; });
    data.sort(function(a,b){
      if (a.cukup !== b.cukup) return a.cukup ? 1 : -1;
      return a.selisih - b.selisih;
    });
  }

  _mekStockView = data;

  var kurang = data.filter(function(d){ return !d.cukup; });
  var closed = data.filter(function(d){ return d.cukup && d.allClosed; });
  var cukup  = data.filter(function(d){ return d.cukup && !d.allClosed; });
  var cardK = document.getElementById('mekStockCardKurang'); if (cardK) cardK.textContent = kurang.length;
  var cardC = document.getElementById('mekStockCardCukup');  if (cardC) cardC.textContent = cukup.length;
  var cardX = document.getElementById('mekStockCardClosed'); if (cardX) cardX.textContent = closed.length;

  if (!data.length) {
    list.innerHTML = '';
    empty.style.display = 'block';
    empty.innerHTML = (skuF || noSoF || tujuanF || plantF)
      ? '<i class="fas fa-filter" style="font-size:32px;display:block;margin-bottom:8px;opacity:.4;"></i>Tidak ada SKU yang cocok dengan filter'
      : '<i class="fas fa-inbox" style="font-size:32px;display:block;margin-bottom:8px;opacity:.4;"></i>Tidak ada planning yang belum close';
    return;
  }
  empty.style.display = 'none';

  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;">';
  data.forEach(function(d, idx) {
    var badgeBg, badgeFg, badgeTx, borderC, dim;
    if (d.allClosed) {
      badgeBg = '#e2e8f0'; badgeFg = '#4a5568'; badgeTx = 'Sudah Closed';
      borderC = '#e2e8f0'; dim = 'opacity:.65;';
    } else if (d.cukup) {
      badgeBg = '#c6f6d5'; badgeFg = '#276749'; badgeTx = 'Cukup';
      borderC = '#e2e8f0'; dim = '';
    } else {
      badgeBg = '#fed7d7'; badgeFg = '#c53030'; badgeTx = 'Kurang ' + Math.abs(d.selisih).toLocaleString('id-ID');
      borderC = '#feb2b2'; dim = '';
    }
    html += '<div onclick="_mekShowStockDetail(' + idx + ')" style="cursor:pointer;background:#fff;border:1px solid ' + borderC + ';border-radius:10px;overflow:hidden;' + dim + '">'
      + '<div style="padding:10px 14px;border-bottom:1px solid #f0f4f8;display:flex;justify-content:space-between;align-items:center;gap:8px;">'
      + '<div style="min-width:0;"><div style="font-size:13px;font-weight:800;color:#2d3748;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _mekEsc(d.sku) + '</div>'
      + '<div style="font-size:11px;color:#718096;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _mekEsc(d.nama||'-') + '</div></div>'
      + '<span style="flex-shrink:0;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;background:' + badgeBg + ';color:' + badgeFg + ';">' + badgeTx + '</span>'
      + '</div>'
      + '<div style="padding:10px 14px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;text-align:center;">'
      + '<div><div style="font-size:10px;color:#a0aec0;">Kebutuhan</div><div style="font-size:14px;font-weight:700;color:#2d3748;">' + d.butuh.toLocaleString('id-ID') + '</div></div>'
      + '<div><div style="font-size:10px;color:#a0aec0;">Tersedia</div><div style="font-size:14px;font-weight:700;color:#2d3748;">' + d.tersedia.toLocaleString('id-ID') + '</div></div>'
      + '<div><div style="font-size:10px;color:#a0aec0;">Selisih</div><div style="font-size:14px;font-weight:700;color:' + (d.cukup?'#276749':'#c53030') + ';">' + (d.selisih>=0?'+':'') + d.selisih.toLocaleString('id-ID') + '</div></div>'
      + '</div>'
      + '</div>';
  });
  html += '</div>';
  list.innerHTML = html;
}

function _mekShowStockDetail(idx) {
  var d = (_mekStockView||[])[idx];
  if (!d) return;
  window._mekStockDetailCur = d;

  var html =
    '<div id="mekStockDetailOverlay" onclick="if(event.target===this) _mekCloseStockDetail()" ' +
    'style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;animation:mekFadeIn .18s ease forwards;">' +
      '<div style="background:#fff;border-radius:12px;max-width:560px;width:100%;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden;animation:mekSlideUp .22s ease forwards;">' +
        '<div style="background:#2c5282;color:#fff;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">' +
          '<div style="font-weight:700;font-size:14px;">' + _mekEsc(d.sku) + ' — ' + _mekEsc(d.nama||'-') + '</div>' +
          '<button onclick="_mekCloseStockDetail()" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;line-height:1;">&times;</button>' +
        '</div>' +
        '<div style="display:flex;background:#f7fafc;border-bottom:1px solid #e2e8f0;flex-shrink:0;">' +
          '<button id="mekStockDetailTabButuh" onclick="_mekStockDetailSwitch(\'butuh\')" style="flex:1;padding:9px;border:none;background:none;font-size:12px;font-weight:700;cursor:pointer;color:#2b6cb0;border-bottom:3px solid #2b6cb0;transition:color .15s,border-color .15s;">Kebutuhan (Planning)</button>' +
          '<button id="mekStockDetailTabTersedia" onclick="_mekStockDetailSwitch(\'tersedia\')" style="flex:1;padding:9px;border:none;background:none;font-size:12px;font-weight:700;cursor:pointer;color:#718096;border-bottom:3px solid transparent;transition:color .15s,border-color .15s;">Tersedia (BinLoc)</button>' +
        '</div>' +
        '<div style="position:relative;overflow:auto;flex:1;">' +
          '<div id="mekStockDetailPaneButuh" style="padding:12px 18px;transition:opacity .18s ease;"></div>' +
          '<div id="mekStockDetailPaneTersedia" style="padding:12px 18px;display:none;transition:opacity .18s ease;"></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  var existing = document.getElementById('mekStockDetailOverlay');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', html);

  _mekStockDetailRenderButuh(d);
  _mekStockDetailRenderTersedia(d);
}

function _mekStockDetailRenderButuh(d) {
  var pane = document.getElementById('mekStockDetailPaneButuh');
  if (!pane) return;
  // Yang belum close ditaruh di atas, yang sudah closed di bawah
  var sorted = (d.detail||[]).slice().sort(function(a,b){
    if (!!a.closed !== !!b.closed) return a.closed ? 1 : -1;
    return 0;
  });
  var rows = sorted.map(function(x){
    var dim = x.closed ? 'opacity:.55;' : '';
    var badge = x.closed
      ? '<span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:#e2e8f0;color:#4a5568;">CLOSED</span>'
      : '<span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:#fed7d7;color:#c53030;">BELUM</span>';
    return '<tr style="' + dim + '">'
      + '<td style="padding:6px 8px;font-size:11px;">' + x.week + '</td>'
      + '<td style="padding:6px 8px;font-size:11px;">' + _mekEsc(_mekFmtTglDisplay(x.tanggal)) + '</td>'
      + '<td style="padding:6px 8px;font-size:11px;">' + _mekEsc(x.noSo||'-') + '</td>'
      + '<td style="padding:6px 8px;font-size:11px;">' + _mekEsc(x.tujuan||'-') + '</td>'
      + '<td style="padding:6px 8px;font-size:11px;">' + _mekEsc(x.plant||'-') + '</td>'
      + '<td style="padding:6px 8px;font-size:11px;">' + _mekEsc(x.source||'-') + '</td>'
      + '<td style="padding:6px 8px;font-size:11px;text-align:center;">' + x.sisaCont + '/' + x.jumlahCont + '</td>'
      + '<td style="padding:6px 8px;font-size:11px;text-align:right;font-weight:700;">' + x.sisaQty.toLocaleString('id-ID') + '</td>'
      + '<td style="padding:6px 8px;font-size:11px;text-align:center;">' + badge + '</td>'
      + '</tr>';
  }).join('');

  pane.innerHTML =
    '<div style="font-size:11px;color:#718096;margin-bottom:10px;">Rincian planning yang menyumbang kebutuhan SKU ini — termasuk yang sudah closed (ditandai abu-abu, tidak ikut dihitung ke Kebutuhan):</div>' +
    '<table style="width:100%;border-collapse:collapse;">' +
      '<thead><tr style="border-bottom:2px solid #e2e8f0;">' +
        '<th style="padding:6px 8px;font-size:10px;text-align:left;color:#718096;">WEEK</th>' +
        '<th style="padding:6px 8px;font-size:10px;text-align:left;color:#718096;">TANGGAL</th>' +
        '<th style="padding:6px 8px;font-size:10px;text-align:left;color:#718096;">NO. SO</th>' +
        '<th style="padding:6px 8px;font-size:10px;text-align:left;color:#718096;">TUJUAN</th>' +
        '<th style="padding:6px 8px;font-size:10px;text-align:left;color:#718096;">PLANT</th>' +
        '<th style="padding:6px 8px;font-size:10px;text-align:left;color:#718096;">SOURCE</th>' +
        '<th style="padding:6px 8px;font-size:10px;text-align:center;color:#718096;">SISA CONT</th>' +
        '<th style="padding:6px 8px;font-size:10px;text-align:right;color:#718096;">QTY KRT</th>' +
        '<th style="padding:6px 8px;font-size:10px;text-align:center;color:#718096;">STATUS</th>' +
      '</tr></thead>' +
      '<tbody>' + (rows || '<tr><td colspan="9" style="padding:14px;text-align:center;color:#a0aec0;font-size:11px;">Tidak ada rincian</td></tr>') + '</tbody>' +
    '</table>';
}

function _mekStockDetailRenderTersedia(d) {
  var pane = document.getElementById('mekStockDetailPaneTersedia');
  if (!pane) return;
  var bins = d.binDetail || [];
  var rows = bins.map(function(b){
    return '<tr>'
      + '<td style="padding:6px 8px;font-size:11px;font-weight:700;">' + _mekEsc(b.binLoc||'-') + '</td>'
      + '<td style="padding:6px 8px;font-size:11px;">' + _mekEsc(b.tipe||'-') + '</td>'
      + '<td style="padding:6px 8px;font-size:11px;">' + _mekEsc(b.prodate||'-') + '</td>'
      + '<td style="padding:6px 8px;font-size:11px;">' + _mekEsc(b.quotation||'-') + '</td>'
      + '<td style="padding:6px 8px;font-size:11px;text-align:right;font-weight:700;color:#276749;">' + b.karton.toLocaleString('id-ID') + '</td>'
      + '</tr>';
  }).join('');

  pane.innerHTML =
    '<div style="font-size:11px;color:#718096;margin-bottom:10px;">Posisi stok SKU ini di BinLoc sekarang (diurut dari prodate paling lama):</div>' +
    '<table style="width:100%;border-collapse:collapse;">' +
      '<thead><tr style="border-bottom:2px solid #e2e8f0;">' +
        '<th style="padding:6px 8px;font-size:10px;text-align:left;color:#718096;">BIN LOKASI</th>' +
        '<th style="padding:6px 8px;font-size:10px;text-align:left;color:#718096;">TIPE</th>' +
        '<th style="padding:6px 8px;font-size:10px;text-align:left;color:#718096;">PRODATE</th>' +
        '<th style="padding:6px 8px;font-size:10px;text-align:left;color:#718096;">QUOTATION</th>' +
        '<th style="padding:6px 8px;font-size:10px;text-align:right;color:#718096;">KARTON</th>' +
      '</tr></thead>' +
      '<tbody>' + (rows || '<tr><td colspan="5" style="padding:14px;text-align:center;color:#a0aec0;font-size:11px;">Tidak ada stok di BinLoc</td></tr>') + '</tbody>' +
      (bins.length ? '<tfoot><tr style="border-top:2px solid #e2e8f0;"><td colspan="4" style="padding:6px 8px;font-size:11px;font-weight:700;text-align:right;">Total</td><td style="padding:6px 8px;font-size:12px;font-weight:800;text-align:right;color:#276749;">' + d.tersedia.toLocaleString('id-ID') + '</td></tr></tfoot>' : '') +
    '</table>';
}

function _mekStockDetailSwitch(view) {
  var pB = document.getElementById('mekStockDetailPaneButuh');
  var pT = document.getElementById('mekStockDetailPaneTersedia');
  var tB = document.getElementById('mekStockDetailTabButuh');
  var tT = document.getElementById('mekStockDetailTabTersedia');
  if (!pB || !pT) return;

  var showT = view === 'tersedia';
  // Fade-out lalu fade-in supaya transisinya halus, bukan langsung tukar
  [pB, pT].forEach(function(p){ p.style.opacity = '0'; });
  setTimeout(function(){
    pB.style.display = showT ? 'none' : 'block';
    pT.style.display = showT ? 'block' : 'none';
    requestAnimationFrame(function(){
      pB.style.opacity = '1';
      pT.style.opacity = '1';
    });
  }, 120);

  if (tB) { tB.style.color = showT ? '#718096' : '#2b6cb0'; tB.style.borderBottomColor = showT ? 'transparent' : '#2b6cb0'; }
  if (tT) { tT.style.color = showT ? '#2b6cb0' : '#718096'; tT.style.borderBottomColor = showT ? '#2b6cb0' : 'transparent'; }
}

function _mekCloseStockDetail() {
  var el = document.getElementById('mekStockDetailOverlay');
  if (el) el.remove();
}

// ════════════════════════════════════════════════════════════
// TAB RESERVED VIEW — Peta 3D (data sama seperti Kesiapan Stock,
// cuma disusun ulang per lokasi BinLoc lewat action getMekReservedMap)
// ════════════════════════════════════════════════════════════
var _mekReservedData = null;
var _mekRvShowAll = false; // toggle "Tampilkan semua stock (lokal + ekspor)"

function mekRvToggleShowAll(checked) {
  _mekRvShowAll = !!checked;
  mekLoadReservedView();
}

function mekLoadReservedView() {
  var loadEl = document.getElementById('mekRvLoading');
  if (loadEl) loadEl.style.display = 'block';
  // Fire struktur rak (getMekBinCap3D) PARALEL bareng data reservasi, bukan
  // nunggu data reservasi selesai dulu — mode 3D/3D Aktual butuh dua-duanya,
  // jadi kalau serial (satu abis satu) loading-nya numpuk 2x round-trip GAS.
  _mekRvLoadGroupsThen(function(){});
  API.run('getMekReservedMap', { showAll: _mekRvShowAll }, function(res) {
    if (loadEl) loadEl.style.display = 'none';
    if (!res || !res.success) {
      var listEl = document.getElementById('mekRvList');
      if (listEl) listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#c53030;font-size:12px;">Gagal memuat data: ' + _mekEsc((res && res.message) || 'unknown') + '</div>';
      return;
    }
    _mekReservedData = res;
    _mekRenderReservedView(res);
  }, function(err) {
    if (loadEl) loadEl.style.display = 'none';
    var listEl = document.getElementById('mekRvList');
    if (listEl) listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#c53030;font-size:12px;">Gagal memuat data (koneksi)</div>';
  });
}

function _mekReservedWaitTier(h) {
  if (h == null) return 'unknown';
  if (h > 24) return 'gt24';
  if (h >= 12) return 'h12_24';
  if (h >= 4)  return 'h4_12';
  return 'lt4';
}

function _mekReservedFmtHours(h) {
  if (h == null) return '-';
  var d = Math.floor(h / 24), r = Math.round(h % 24);
  return d > 0 ? (d + 'd ' + r + 'h') : (Math.round(h) + 'h');
}

// ── Peta 2D Simple & 2D Aktual — diadaptasi dari app BinLoc (koordinat rak
// fisik asli, PETA2D_CELLS/PETA2D_TBINS/PETA2D_LABELS untuk Aktual,
// PETA_MAP_ROWS untuk Simple), warna di-swap ke status reservasi ──
var _mekRvBinAgg = {};
var _mekRvMode = '3d';

var MEKRV_MAP_ROWS = [
  {rows:[{l:'A',max:28}]}, null,
  {rows:[{l:'B',max:25},{l:'C',max:25}]}, null,
  {rows:[{l:'D',max:25},{l:'E',max:25}]}, null,
  {rows:[{l:'F',max:25},{l:'G',max:32}]}, null,
  {rows:[{l:'H',max:35}]}, null,
  {rows:[{l:'I',max:43}]}
];

var MEKRV2D_LABELS = [{r:4,c:4,label:"A"},{r:8,c:4,label:"B"},{r:9,c:4,label:"C"},{r:13,c:4,label:"D"},{r:14,c:4,label:"E"},{r:18,c:4,label:"F"},{r:19,c:4,label:"G"},{r:23,c:4,label:"H"},{r:27,c:4,label:"I"}];

var MEKRV2D_CELLS = [{r:4,c:6,bin:"A1"},{r:4,c:7,bin:"A2"},{r:4,c:8,bin:"A3"},{r:4,c:9,bin:"A4"},{r:4,c:10,bin:"A5"},{r:4,c:11,bin:"A6"},{r:4,c:12,bin:"A7"},{r:4,c:13,bin:"A8"},{r:4,c:14,bin:"A9"},{r:4,c:15,bin:"A10"},{r:4,c:16,bin:"A11"},{r:4,c:17,bin:"A12"},{r:4,c:18,bin:"A13"},{r:4,c:19,bin:"A14"},{r:4,c:20,bin:"A15"},{r:4,c:21,bin:"A16"},{r:4,c:22,bin:"A17"},{r:4,c:23,bin:"A18"},{r:4,c:24,bin:"A19"},{r:4,c:25,bin:"A20"},{r:4,c:26,bin:"A21"},{r:4,c:27,bin:"A22"},{r:4,c:28,bin:"A23"},{r:4,c:29,bin:"A24"},{r:4,c:30,bin:"A25"},{r:4,c:31,bin:"A26"},{r:4,c:32,bin:"A27"},{r:4,c:33,bin:"A28"},{r:8,c:6,bin:"B1"},{r:8,c:7,bin:"B2"},{r:8,c:8,bin:"B3"},{r:8,c:9,bin:"B4"},{r:8,c:10,bin:"B5"},{r:8,c:11,bin:"B6"},{r:8,c:12,bin:"B7"},{r:8,c:13,bin:"B8"},{r:8,c:14,bin:"B9"},{r:8,c:15,bin:"B10"},{r:8,c:16,bin:"B11"},{r:8,c:17,bin:"B12"},{r:8,c:18,bin:"B13"},{r:8,c:19,bin:"B14"},{r:8,c:20,bin:"B15"},{r:8,c:21,bin:"B16"},{r:8,c:22,bin:"B17"},{r:8,c:23,bin:"B18"},{r:8,c:24,bin:"B19"},{r:8,c:25,bin:"B20"},{r:8,c:26,bin:"B21"},{r:8,c:27,bin:"B22"},{r:8,c:28,bin:"B23"},{r:8,c:29,bin:"B24"},{r:8,c:30,bin:"B25"},{r:9,c:6,bin:"C1"},{r:9,c:7,bin:"C2"},{r:9,c:8,bin:"C3"},{r:9,c:9,bin:"C4"},{r:9,c:10,bin:"C5"},{r:9,c:11,bin:"C6"},{r:9,c:12,bin:"C7"},{r:9,c:13,bin:"C8"},{r:9,c:14,bin:"C9"},{r:9,c:15,bin:"C10"},{r:9,c:16,bin:"C11"},{r:9,c:17,bin:"C12"},{r:9,c:18,bin:"C13"},{r:9,c:19,bin:"C14"},{r:9,c:20,bin:"C15"},{r:9,c:21,bin:"C16"},{r:9,c:22,bin:"C17"},{r:9,c:23,bin:"C18"},{r:9,c:24,bin:"C19"},{r:9,c:25,bin:"C20"},{r:9,c:26,bin:"C21"},{r:9,c:27,bin:"C22"},{r:9,c:28,bin:"C23"},{r:9,c:29,bin:"C24"},{r:9,c:30,bin:"C25"},{r:13,c:6,bin:"D1"},{r:13,c:7,bin:"D2"},{r:13,c:8,bin:"D3"},{r:13,c:9,bin:"D4"},{r:13,c:10,bin:"D5"},{r:13,c:11,bin:"D6"},{r:13,c:12,bin:"D7"},{r:13,c:13,bin:"D8"},{r:13,c:14,bin:"D9"},{r:13,c:15,bin:"D10"},{r:13,c:16,bin:"D11"},{r:13,c:17,bin:"D12"},{r:13,c:18,bin:"D13"},{r:13,c:19,bin:"D14"},{r:13,c:20,bin:"D15"},{r:13,c:21,bin:"D16"},{r:13,c:22,bin:"D17"},{r:13,c:23,bin:"D18"},{r:13,c:24,bin:"D19"},{r:13,c:25,bin:"D20"},{r:13,c:26,bin:"D21"},{r:13,c:27,bin:"D22"},{r:13,c:28,bin:"D23"},{r:13,c:29,bin:"D24"},{r:13,c:30,bin:"D25"},{r:14,c:6,bin:"E1"},{r:14,c:7,bin:"E2"},{r:14,c:8,bin:"E3"},{r:14,c:9,bin:"E4"},{r:14,c:10,bin:"E5"},{r:14,c:11,bin:"E6"},{r:14,c:12,bin:"E7"},{r:14,c:13,bin:"E8"},{r:14,c:14,bin:"E9"},{r:14,c:15,bin:"E10"},{r:14,c:16,bin:"E11"},{r:14,c:17,bin:"E12"},{r:14,c:18,bin:"E13"},{r:14,c:19,bin:"E14"},{r:14,c:20,bin:"E15"},{r:14,c:21,bin:"E16"},{r:14,c:22,bin:"E17"},{r:14,c:23,bin:"E18"},{r:14,c:24,bin:"E19"},{r:14,c:25,bin:"E20"},{r:14,c:26,bin:"E21"},{r:14,c:27,bin:"E22"},{r:14,c:28,bin:"E23"},{r:14,c:29,bin:"E24"},{r:14,c:30,bin:"E25"},{r:18,c:6,bin:"F1"},{r:18,c:7,bin:"F2"},{r:18,c:8,bin:"F3"},{r:18,c:9,bin:"F4"},{r:18,c:10,bin:"F5"},{r:18,c:11,bin:"F6"},{r:18,c:12,bin:"F7"},{r:18,c:13,bin:"F8"},{r:18,c:14,bin:"F9"},{r:18,c:15,bin:"F10"},{r:18,c:16,bin:"F11"},{r:18,c:17,bin:"F12"},{r:18,c:18,bin:"F13"},{r:18,c:19,bin:"F14"},{r:18,c:20,bin:"F15"},{r:18,c:21,bin:"F16"},{r:18,c:22,bin:"F17"},{r:18,c:23,bin:"F18"},{r:18,c:24,bin:"F19"},{r:18,c:25,bin:"F20"},{r:18,c:26,bin:"F21"},{r:18,c:27,bin:"F22"},{r:18,c:28,bin:"F23"},{r:18,c:29,bin:"F24"},{r:18,c:30,bin:"F25"},{r:19,c:6,bin:"G1"},{r:19,c:7,bin:"G2"},{r:19,c:8,bin:"G3"},{r:19,c:9,bin:"G4"},{r:19,c:10,bin:"G5"},{r:19,c:11,bin:"G6"},{r:19,c:12,bin:"G7"},{r:19,c:13,bin:"G8"},{r:19,c:14,bin:"G9"},{r:19,c:15,bin:"G10"},{r:19,c:16,bin:"G11"},{r:19,c:17,bin:"G12"},{r:19,c:18,bin:"G13"},{r:19,c:19,bin:"G14"},{r:19,c:20,bin:"G15"},{r:19,c:21,bin:"G16"},{r:19,c:22,bin:"G17"},{r:19,c:23,bin:"G18"},{r:19,c:24,bin:"G19"},{r:19,c:25,bin:"G20"},{r:19,c:26,bin:"G21"},{r:19,c:27,bin:"G22"},{r:19,c:28,bin:"G23"},{r:19,c:29,bin:"G24"},{r:19,c:30,bin:"G25"},{r:19,c:34,bin:"G26"},{r:19,c:35,bin:"G27"},{r:19,c:36,bin:"G28"},{r:19,c:37,bin:"G29"},{r:19,c:38,bin:"G30"},{r:19,c:39,bin:"G31"},{r:19,c:40,bin:"G32"},{r:23,c:6,bin:"H1"},{r:23,c:7,bin:"H2"},{r:23,c:8,bin:"H3"},{r:23,c:9,bin:"H4"},{r:23,c:10,bin:"H5"},{r:23,c:11,bin:"H6"},{r:23,c:12,bin:"H7"},{r:23,c:13,bin:"H8"},{r:23,c:14,bin:"H9"},{r:23,c:15,bin:"H10"},{r:23,c:16,bin:"H11"},{r:23,c:17,bin:"H12"},{r:23,c:18,bin:"H13"},{r:23,c:19,bin:"H14"},{r:23,c:20,bin:"H15"},{r:23,c:21,bin:"H16"},{r:23,c:22,bin:"H17"},{r:23,c:23,bin:"H18"},{r:23,c:24,bin:"H19"},{r:23,c:25,bin:"H20"},{r:23,c:26,bin:"H21"},{r:23,c:27,bin:"H22"},{r:23,c:28,bin:"H23"},{r:23,c:29,bin:"H24"},{r:23,c:30,bin:"H25"},{r:23,c:31,bin:"H26"},{r:23,c:32,bin:"H27"},{r:23,c:33,bin:"H28"},{r:23,c:34,bin:"H29"},{r:23,c:35,bin:"H30"},{r:23,c:36,bin:"H31"},{r:23,c:37,bin:"H32"},{r:23,c:38,bin:"H33"},{r:23,c:39,bin:"H34"},{r:23,c:40,bin:"H35"},{r:27,c:6,bin:"I1"},{r:27,c:7,bin:"I2"},{r:27,c:8,bin:"I3"},{r:27,c:9,bin:"I4"},{r:27,c:10,bin:"I5"},{r:27,c:11,bin:"I6"},{r:27,c:12,bin:"I7"},{r:27,c:13,bin:"I8"},{r:27,c:14,bin:"I9"},{r:27,c:15,bin:"I10"},{r:27,c:16,bin:"I11"},{r:27,c:17,bin:"I12"},{r:27,c:18,bin:"I13"},{r:27,c:19,bin:"I14"},{r:27,c:20,bin:"I15"},{r:27,c:21,bin:"I16"},{r:27,c:22,bin:"I17"},{r:27,c:23,bin:"I18"},{r:27,c:24,bin:"I19"},{r:27,c:25,bin:"I20"},{r:27,c:26,bin:"I21"},{r:27,c:27,bin:"I22"},{r:27,c:28,bin:"I23"},{r:27,c:29,bin:"I24"},{r:27,c:30,bin:"I25"},{r:27,c:31,bin:"I26"},{r:27,c:32,bin:"I27"},{r:27,c:33,bin:"I28"},{r:27,c:34,bin:"I29"},{r:27,c:35,bin:"I30"},{r:27,c:36,bin:"I31"},{r:27,c:37,bin:"I32"},{r:27,c:38,bin:"I33"},{r:27,c:39,bin:"I34"},{r:27,c:40,bin:"I35"},{r:27,c:41,bin:"I36"},{r:27,c:42,bin:"I37"},{r:27,c:43,bin:"I38"},{r:27,c:44,bin:"I39"},{r:27,c:45,bin:"I40"},{r:27,c:46,bin:"I41"},{r:27,c:47,bin:"I42"},{r:27,c:48,bin:"I43"}];

var MEKRV2D_TBINS = [{num:1,r1:5,r2:5,c1:6,c2:30},{num:9,r1:5,r2:6,c1:33,c2:33},{num:2,r1:7,r2:7,c1:6,c2:30},{num:10,r1:7,r2:8,c1:33,c2:33},{num:19,r1:8,r2:9,c1:31,c2:31},{num:11,r1:9,r2:10,c1:33,c2:33},{num:3,r1:10,r2:10,c1:6,c2:30},{num:12,r1:11,r2:12,c1:33,c2:33},{num:4,r1:12,r2:12,c1:6,c2:30},{num:20,r1:13,r2:14,c1:5,c2:5},{num:18,r1:13,r2:14,c1:31,c2:31},{num:13,r1:13,r2:14,c1:33,c2:33},{num:5,r1:15,r2:15,c1:6,c2:30},{num:14,r1:15,r2:16,c1:33,c2:33},{num:6,r1:17,r2:17,c1:6,c2:30},{num:15,r1:17,r2:18,c1:33,c2:33},{num:21,r1:18,r2:19,c1:5,c2:5},{num:17,r1:18,r2:19,c1:31,c2:31},{num:16,r1:19,r2:19,c1:33,c2:33},{num:7,r1:20,r2:20,c1:6,c2:30},{num:8,r1:22,r2:22,c1:6,c2:30},{num:22,r1:23,r2:23,c1:5,c2:5},{num:23,r1:24,r2:24,c1:6,c2:8},{num:24,r1:24,r2:24,c1:10,c2:12},{num:25,r1:24,r2:24,c1:14,c2:16},{num:26,r1:24,r2:24,c1:18,c2:20},{num:27,r1:24,r2:24,c1:22,c2:24},{num:28,r1:24,r2:24,c1:26,c2:28},{num:29,r1:24,r2:24,c1:30,c2:32},{num:30,r1:24,r2:24,c1:34,c2:36},{num:31,r1:24,r2:24,c1:38,c2:40},{num:32,r1:24,r2:24,c1:42,c2:42},{num:33,r1:24,r2:24,c1:44,c2:44},{num:34,r1:24,r2:24,c1:45,c2:45},{num:35,r1:24,r2:24,c1:46,c2:46},{num:36,r1:24,r2:24,c1:47,c2:47}];

function _mekRvColorClass(agg) {
  if (!agg || agg.totalKarton <= 0) return 'mekrv-empty';
  if (agg.totalReserved <= 0) return 'mekrv-avail';
  return agg.hasLongWait ? 'mekrv-longwait' : 'mekrv-reserved';
}

function mekRvSetMode(mode) {
  _mekRvMode = mode;
  ['simple','aktual','3d','aktual3d'].forEach(function(m){
    var btn = document.getElementById('mekRvMode' + m.charAt(0).toUpperCase() + m.slice(1) + 'Btn');
    if (btn) { btn.classList.toggle('active', m === mode); btn.style.color = m===mode?'#1a3a5c':'#718096'; }
  });
  document.getElementById('mekRv2dSimpleWrap').style.display = mode === 'simple' ? 'block' : 'none';
  document.getElementById('mekRv2dAktualWrap').style.display = mode === 'aktual' ? 'block' : 'none';
  document.getElementById('mekRv3dWrap').style.display       = mode === '3d'     ? 'block' : 'none';
  document.getElementById('mekRv3dAktualWrap').style.display = mode === 'aktual3d' ? 'block' : 'none';
  var chipsEl = document.getElementById('mekRvAktual3dChips');
  if (chipsEl) chipsEl.style.display = mode === 'aktual3d' ? 'flex' : 'none';
  mekRvRenderCurrentMode();
}

function mekRvRenderCurrentMode() {
  if (!_mekReservedData) return;
  if (_mekRvMode === 'simple')        _mekRvRenderSimple();
  else if (_mekRvMode === 'aktual')   _mekRvRenderAktual();
  else if (_mekRvMode === 'aktual3d') _mekRvRenderAktual3D();
  else if (typeof window.mekReserved3DRender === 'function') {
    var longWaitBins = {};
    Object.keys(_mekRvBinAgg).forEach(function(k){ if (_mekRvBinAgg[k].hasLongWait) longWaitBins[k] = true; });
    // Butuh struktur rak (getMekBinCap3D) buat nyusun posisi kubus yang bener
    // — sama cache-nya (_mekRvGroups) dipakai bareng sama mode "3D Aktual",
    // jadi kalau udah ke-load duluan gak nge-fetch dua kali.
    _mekRvLoadGroupsThen(function(){
      window.mekReserved3DRender(_mekReservedData.cells || [], longWaitBins, _mekRvGroups || []);
    });
  }
}

function _mekRvCellTitle(agg, bin) {
  if (!agg) return bin + ': kosong';
  var t = bin + ': ' + agg.totalKarton.toLocaleString('id-ID') + ' krt';
  if (agg.totalReserved > 0) t += ' (reserved ' + agg.totalReserved.toLocaleString('id-ID') + ')';
  return t;
}

function _mekRvRenderSimple() {
  var wrap = document.getElementById('mekRv2dSimpleWrap');
  if (!wrap) return;
  var html = '';
  MEKRV_MAP_ROWS.forEach(function(rowDef){
    if (!rowDef) { html += '<div class="mekrv-gap"></div>'; return; }
    rowDef.rows.forEach(function(r){
      html += '<div class="mekrv-row"><div class="mekrv-rowlabel">' + r.l + '</div>';
      for (var n = 1; n <= r.max; n++) {
        var bin = r.l + n;
        var agg = _mekRvBinAgg[bin];
        html += '<div class="mekrv-cell-simple ' + _mekRvColorClass(agg) + '" title="' + _mekEsc(_mekRvCellTitle(agg, bin)) + '">' + n + '</div>';
      }
      html += '</div>';
    });
  });
  wrap.innerHTML = html;
}

function _mekRvRenderAktual() {
  var wrap = document.getElementById('mekRv2dAktualWrap');
  if (!wrap) return;
  var html = '<div class="mekrv2d-grid">';
  MEKRV2D_LABELS.forEach(function(l){
    html += '<div class="mekrv2d-label" style="grid-row:' + l.r + ';grid-column:' + l.c + ';">' + l.label + '</div>';
  });
  MEKRV2D_CELLS.forEach(function(cell){
    var agg = _mekRvBinAgg[cell.bin];
    var num = cell.bin.replace(/^[A-Z]+/, '');
    html += '<div class="mekrv2d-cell ' + _mekRvColorClass(agg) + '" style="grid-row:' + cell.r + ';grid-column:' + cell.c + ';" title="' + _mekEsc(_mekRvCellTitle(agg, cell.bin)) + '">' + num + '</div>';
  });
  MEKRV2D_TBINS.forEach(function(tb){
    var bin = 'T' + tb.num;
    var agg = _mekRvBinAgg[bin];
    html += '<div class="mekrv2d-cell ' + _mekRvColorClass(agg) + '" style="grid-row:' + tb.r1 + ' / span ' + (tb.r2-tb.r1+1) + ';grid-column:' + tb.c1 + ' / span ' + (tb.c2-tb.c1+1) + ';font-size:8px;" title="' + _mekEsc(_mekRvCellTitle(agg, bin)) + '">' + bin + '</div>';
  });
  html += '</div>';
  wrap.innerHTML = html;
}

// ── Peta 3D Aktual — port geometri isometrik SVG dari app BinLoc (referensi
// index BinLoc versi terbaru yang dikirim user). Konstanta tata letak di
// bawah ini (T_BIN_DATA/BORDER_POINTS/LAYOUT_ORDER/MIRRORED/gShiftOffset dkk)
// adalah koordinat FISIK gudang asli hasil tuning manual di app BinLoc —
// disalin apa adanya (gudangnya sama persis dgn BinLoc), bukan hasil hitung
// dari data kita. Yang beda cuma sumber data (data reservasi kita, bukan
// _petaData BinLoc) dan warna (status reservasi: hijau/oranye/merah, bukan
// tipe/bulan prodate) — pipeline gambarnya (proyeksi iso, kubus, rangka rak)
// sama persis dengan BinLoc.
var MEKP3D_TILE_W = 30, MEKP3D_TILE_H = 17;
var MEKP3D_LEVEL_H = Math.sqrt(Math.pow(MEKP3D_TILE_W/2, 2) + Math.pow(MEKP3D_TILE_H/2, 2)) * 1.12;
function mekp3dIsoProject(x, y, z) {
  return { x: (x - y) * (MEKP3D_TILE_W / 2), y: (x + y) * (MEKP3D_TILE_H / 2) - z * MEKP3D_LEVEL_H };
}
function mekp3dShadeColor(hex, percent) {
  var num = parseInt(hex.slice(1), 16);
  var r = Math.max(0, Math.min(255, (num >> 16) + percent));
  var g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + percent));
  var b = Math.max(0, Math.min(255, (num & 0xff) + percent));
  return '#' + ((1<<24) + (r<<16) + (g<<8) + b).toString(16).slice(1);
}
var MEKP3D_COLOR_AVAILABLE = '#10b981';
var MEKP3D_COLOR_WAITING   = '#f59e0b';
var MEKP3D_COLOR_LONGWAIT  = '#ef4444';
var MEKP3D_RACK_COLOR = '#1e3a8a';
var MEKP3D_RACK_WIDTH = 3;

function mekp3dColorInfo(hexOrEmpty) {
  var navy = '#1e293b';
  if (!hexOrEmpty) return { color: '#bfe3f0', opacity: 0.14, strokeColor: navy, strokeOp: 0.9 };
  return { color: hexOrEmpty, opacity: 1, strokeColor: navy, strokeOp: 1 };
}

function mekp3dCubePolygons(x, y, z, colorInfo, drawFlags) {
  var isFilled = colorInfo.opacity === 1;
  var s = isFilled ? 0.94 : 1;
  var pad = (1 - s) / 2;
  var x0 = x + pad, x1 = x + 1 - pad;
  var y0 = y + pad, y1 = y + 1 - pad;
  var z0 = z + 0.06, z1 = z + 1;

  var p = {};
  p.top_fl = mekp3dIsoProject(x0, y0, z1);
  p.top_fr = mekp3dIsoProject(x1, y0, z1);
  p.top_bl = mekp3dIsoProject(x0, y1, z1);
  p.top_br = mekp3dIsoProject(x1, y1, z1);
  p.bot_fl = mekp3dIsoProject(x0, y0, z0);
  p.bot_fr = mekp3dIsoProject(x1, y0, z0);
  p.bot_bl = mekp3dIsoProject(x0, y1, z0);
  p.bot_br = mekp3dIsoProject(x1, y1, z0);
  function pts(arr) { return arr.map(function(pt){ return pt.x.toFixed(1)+','+pt.y.toFixed(1); }).join(' '); }

  var shadeTop = colorInfo.color;
  var shadeX   = mekp3dShadeColor(colorInfo.color, -55);
  var shadeY   = mekp3dShadeColor(colorInfo.color, -22);
  var strokeColor = isFilled ? '#000' : colorInfo.strokeColor;
  var strokeOp    = isFilled ? 1 : colorInfo.strokeOp;
  var strokeW     = isFilled ? 0.5 : 2.3;

  var faces = [];
  if (drawFlags.top)   faces.push({ pts: pts([p.top_fl,p.top_fr,p.top_br,p.top_bl]), fill: shadeTop, op: colorInfo.opacity, stroke: strokeColor, strokeOp: strokeOp, strokeW: strokeW });
  if (drawFlags.faceX) faces.push({ pts: pts([p.top_fr,p.top_br,p.bot_br,p.bot_fr]), fill: shadeX,   op: colorInfo.opacity, stroke: strokeColor, strokeOp: strokeOp, strokeW: strokeW });
  if (drawFlags.faceY) faces.push({ pts: pts([p.top_bl,p.top_br,p.bot_br,p.bot_bl]), fill: shadeY,   op: colorInfo.opacity, stroke: strokeColor, strokeOp: strokeOp, strokeW: strokeW });

  var cartonPolys = [];
  var cartonLines = [];
  var PALLET_COLOR = '#946d1c';
  var palletT = 0.12;
  function lerpZ(zt) { return z0 + (z1 - z0) * zt; }

  if (isFilled && drawFlags.faceX) {
    var fxBL = mekp3dIsoProject(x1, y0, lerpZ(0)), fxBR = mekp3dIsoProject(x1, y1, lerpZ(0));
    var fxPalletTop1 = mekp3dIsoProject(x1, y0, lerpZ(palletT)), fxPalletTop2 = mekp3dIsoProject(x1, y1, lerpZ(palletT));
    cartonPolys.push({ pts: pts([fxBL, fxBR, fxPalletTop2, fxPalletTop1]), fill: PALLET_COLOR });
    [0.12, 0.4, 0.68].forEach(function(t) {
      cartonLines.push({ p1: mekp3dIsoProject(x1, y0, lerpZ(t)), p2: mekp3dIsoProject(x1, y1, lerpZ(t)) });
    });
    [0.26, 0.54, 0.84].forEach(function(tBot, i) {
      var tTop = [0.4, 0.68, 1][i];
      cartonLines.push({ p1: mekp3dIsoProject(x1, (y0+y1)/2, lerpZ(tBot)), p2: mekp3dIsoProject(x1, (y0+y1)/2, lerpZ(tTop)) });
    });
  }
  if (isFilled && drawFlags.faceY) {
    var fyBL = mekp3dIsoProject(x0, y1, lerpZ(0)), fyBR = mekp3dIsoProject(x1, y1, lerpZ(0));
    var fyPalletTop1 = mekp3dIsoProject(x0, y1, lerpZ(palletT)), fyPalletTop2 = mekp3dIsoProject(x1, y1, lerpZ(palletT));
    cartonPolys.push({ pts: pts([fyBL, fyBR, fyPalletTop2, fyPalletTop1]), fill: PALLET_COLOR });
    [0.12, 0.4, 0.68].forEach(function(t) {
      cartonLines.push({ p1: mekp3dIsoProject(x0, y1, lerpZ(t)), p2: mekp3dIsoProject(x1, y1, lerpZ(t)) });
    });
    [0.26, 0.54, 0.84].forEach(function(tBot, i) {
      var tTop = [0.4, 0.68, 1][i];
      cartonLines.push({ p1: mekp3dIsoProject((x0+x1)/2, y1, lerpZ(tBot)), p2: mekp3dIsoProject((x0+x1)/2, y1, lerpZ(tTop)) });
    });
  }
  if (isFilled && drawFlags.top) {
    [1/3, 2/3].forEach(function(t) {
      var yA = y0 + (y1-y0)*t;
      cartonLines.push({ p1: mekp3dIsoProject(x0, yA, z1), p2: mekp3dIsoProject(x1, yA, z1) });
      var xA = x0 + (x1-x0)*t;
      cartonLines.push({ p1: mekp3dIsoProject(xA, y0, z1), p2: mekp3dIsoProject(xA, y1, z1) });
    });
  }

  var edges = [];
  if (isFilled) {
    edges = [
      { p1: p.bot_bl, p2: p.top_bl, w: MEKP3D_RACK_WIDTH },
      { p1: p.bot_br, p2: p.top_br, w: MEKP3D_RACK_WIDTH },
      { p1: p.bot_fr, p2: p.top_fr, w: MEKP3D_RACK_WIDTH }
    ];
    var levelGanjil = (z % 2) === 1;
    var depthGanjil = (y % 2) === 1;
    var miringKiri = levelGanjil !== depthGanjil;
    var decorP1 = miringKiri ? p.top_fr : p.top_br;
    var decorP2 = miringKiri ? p.bot_br : p.bot_fr;
    edges.push({ p1: decorP1, p2: decorP2, w: 1.4 });
  }

  return { faces: faces, edges: edges, cartonPolys: cartonPolys, cartonLines: cartonLines };
}

// Data bin T (area non-racking) & garis tepi luar gudang — koordinat fisik
// asli, sama persis dengan app BinLoc.
var MEKP3D_T_BIN_DATA = [
  {num:1, x:0, w:25, rowMid:5.9, thick:0.9},
  {num:2, x:0, w:25, rowMid:7.1, thick:0.9},
  {num:4, x:0, w:25, rowMid:12.15, thick:0.9},
  {num:5, x:0, w:25, rowMid:15.12, thick:0.9},
  {num:6, x:0, w:25, rowMid:16.3, thick:0.9},
  {num:7, x:0, w:25, rowMid:20.2, thick:0.9},
  {num:8, x:0, w:25, rowMid:21.35, thick:0.9},
  {num:9, x:27, w:1, rowMid:6, thick:4},
  {num:10, x:27, w:1, rowMid:7.4, thick:5},
  {num:11, x:27, w:1, rowMid:9.1, thick:5},
  {num:12, x:27, w:1, rowMid:10.8, thick:5},
  {num:13, x:27, w:1, rowMid:12.5, thick:5},
  {num:14, x:27, w:1, rowMid:14.2, thick:5},
  {num:15, x:27, w:1, rowMid:16, thick:5},
  {num:16, x:27, w:1, rowMid:19.1, thick:3},
  {num:17, x:25, w:1, rowMid:17, thick:3},
  {num:18, x:25, w:1, rowMid:13, thick:5},
  {num:19, x:25, w:1, rowMid:8.5, thick:5},
  {num:20, x:-1, w:1, rowMid:13, thick:5},
  {num:21, x:-1, w:1, rowMid:17.7, thick:5},
  {num:22, x:-1, w:1, rowMid:22, thick:4},
  {num:23, x:0, w:3, rowMid:23.7, thick:0.9},
  {num:24, x:4, w:3, rowMid:23.7, thick:0.9},
  {num:25, x:8, w:3, rowMid:23.7, thick:0.9},
  {num:26, x:12, w:3, rowMid:23.7, thick:0.9},
  {num:27, x:16, w:3, rowMid:23.7, thick:0.9},
  {num:28, x:20, w:3, rowMid:23.7, thick:0.9},
  {num:29, x:24, w:3, rowMid:23.7, thick:0.9},
  {num:30, x:28, w:3, rowMid:23.7, thick:0.9},
  {num:31, x:32, w:3, rowMid:23.7, thick:0.9},
  {num:32, x:36, w:1.2, rowMid:23.7, thick:0.9},
  {num:33, x:37.2, w:1.2, rowMid:23.7, thick:0.9},
  {num:34, x:38.4, w:1.2, rowMid:23.7, thick:0.9},
  {num:35, x:39.6, w:1.2, rowMid:23.7, thick:0.9},
  {num:36, x:40.8, w:1.2, rowMid:23.7, thick:0.9},
  {num:3, x:0, w:25, rowMid:11, thick:0.9}
];
var MEKP3D_BORDER_POINTS = [
  {x:-2, y:4}, {x:28.3, y:4}, {x:28.3, y:18.5}, {x:36.5, y:18.5},
  {x:36.5, y:23.5}, {x:43.5, y:23.5}, {x:43.5, y:27}, {x:-2, y:27}
];
var MEKP3D_T_ROW_MIN = 4, MEKP3D_T_ROW_MAX = 27;

// ── State & loader struktur rak (getMekBinCap3D — udah ada di backend) ──
var _mekRvGroups = null;
var _mekRvGroupsPending = null; // array callback lagi nunggu, null = gak ada request in-flight
var _mekRvSelectedRack = 'ALL';
var _mekRvLongWaitSkus = {};

function _mekRvLoadGroupsThen(cb) {
  // Udah pernah sukses dapet groups beneran (bukan gagal/kosong) — langsung pakai cache.
  if (_mekRvGroups && _mekRvGroups.length) { cb(); return; }
  // Ada request lagi jalan (dipicu dari tempat lain) — numpang antri, jangan fetch dobel.
  if (_mekRvGroupsPending) { _mekRvGroupsPending.push(cb); return; }
  _mekRvGroupsPending = [cb];
  function flush() {
    var cbs = _mekRvGroupsPending || [];
    _mekRvGroupsPending = null;
    cbs.forEach(function(fn){ fn(); });
  }
  API.run('getMekBinCap3D', {}, function(res){
    _mekRvGroups = (res && res.success && res.groups) ? res.groups : [];
    flush();
  }, function(){ _mekRvGroups = []; flush(); });
}

function mekRvSelectAktual3dRack(bin) {
  _mekRvSelectedRack = bin;
  _mekRvRenderAktual3DBody();
}

// Susun ulang data.cells jadi binMap {binLoc: {items:[{units,color}]}} — tiap
// baris BinLoc (SKU/prodate) dipecah jadi maks 2 "sub-item" virtual: bagian
// yang udah reserved (oranye/merah) dan bagian yang masih available (hijau),
// proporsional ke jumlah slot fisik (pallet + pecahan) baris itu. Ini yang
// menggantikan p3dColorForItem(item) versi BinLoc (yang mewarnai 1 warna per
// item berdasar tipe/bulan prodate) — di sini warnanya status reservasi.
function _mekAktual3dBuildBinMap() {
  var binMap = {};
  ((_mekReservedData && _mekReservedData.cells) || []).forEach(function(c){
    var bin = c.binLoc; if (!bin) return;
    if (!binMap[bin]) binMap[bin] = { items: [] };
    var units = (c.palletNum||0) + (c.pecahanCount||0);
    if (units <= 0 && c.karton > 0) units = 1; // pengaman — data pallet/pecahan kosong tapi ada karton
    if (units <= 0) return;
    var karton = c.karton || 0;
    var reservedKarton = Math.min(c.reservedKarton||0, karton);
    var reservedUnits = karton > 0 ? Math.round(units * (reservedKarton / karton)) : 0;
    if (reservedUnits > units) reservedUnits = units;
    if (reservedUnits < 0) reservedUnits = 0;
    var availableUnits = units - reservedUnits;
    var isLongWait = !!_mekRvLongWaitSkus[c.sku];
    if (reservedUnits > 0) binMap[bin].items.push({ units: reservedUnits, color: isLongWait ? MEKP3D_COLOR_LONGWAIT : MEKP3D_COLOR_WAITING });
    if (availableUnits > 0) binMap[bin].items.push({ units: availableUnits, color: MEKP3D_COLOR_AVAILABLE });
  });
  return binMap;
}

function _mekRvRenderAktual3D() {
  var wrap = document.getElementById('mekRv3dAktualWrap');
  if (!wrap) return;
  wrap.innerHTML = '<div style="padding:40px;text-align:center;color:#a0aec0;font-size:12px"><i class="fas fa-spinner fa-spin"></i> Memuat struktur rak...</div>';
  _mekRvLoadGroupsThen(function(){ _mekRvRenderAktual3DBody(); });
}

function _mekRvRenderAktual3DBody() {
  var wrap = document.getElementById('mekRv3dAktualWrap');
  var chipsEl = document.getElementById('mekRvAktual3dChips');
  if (!wrap) return;
  if (!_mekRvGroups || !_mekRvGroups.length) {
    if (chipsEl) chipsEl.innerHTML = '';
    wrap.innerHTML = '<div style="padding:40px;text-align:center;color:#a0aec0;font-size:12px">Belum ada data LEVEL/DEPTH di BIN_CAP kolom I-L</div>';
    return;
  }
  var uniqueLetters = [];
  _mekRvGroups.forEach(function(g){ if (g.bin !== 'T' && uniqueLetters.indexOf(g.bin) === -1) uniqueLetters.push(g.bin); });
  if (chipsEl) {
    var allChips = ['ALL'].concat(uniqueLetters).concat(['T']);
    chipsEl.innerHTML = allChips.map(function(letter){
      var sel = letter === _mekRvSelectedRack;
      var label = letter === 'T' ? 'Bin T' : letter;
      return '<div onclick="mekRvSelectAktual3dRack(\'' + letter + '\')" style="padding:6px 12px;border-radius:8px;cursor:pointer;font-size:11px;font-weight:800;'
        + (sel ? 'background:#1a3a5c;color:#fff;' : 'background:#f7fafc;color:#718096;border:1px solid #e2e8f0;')
        + '">' + label + '</div>';
    }).join('');
  }
  if (_mekRvSelectedRack === 'ALL') _mekAktual3dRenderAll(uniqueLetters);
  else if (_mekRvSelectedRack === 'T') _mekAktual3dRenderTOnly();
  else _mekAktual3dRenderRack(_mekRvSelectedRack);
}

// ── Render SEMUA rak sekaligus (overview) — tata letak fisik presisi,
// diadaptasi dari petaRender3DAll() BinLoc. ──
function _mekAktual3dRenderAll(allLetters) {
  var LAYOUT_ORDER = ['A','B','C','D','E','F','G','H','I'].filter(function(l){ return allLetters.indexOf(l) !== -1; });
  var MIRRORED = ['B','D','F','H','I'];
  var AISLE_GAP = 5, BACK_GAP = 1.2;
  var GAP_AFTER = { 'A':'aisle', 'B':'back', 'C':'aisle', 'D':'back', 'E':'aisle', 'F':'back', 'G':'aisle', 'H':'aisle' };

  var wrap = document.getElementById('mekRv3dAktualWrap');
  if (!wrap) return;

  function maxDepthOfRack(letter) {
    var segs = _mekRvGroups.filter(function(g){ return g.bin === letter; });
    return Math.max.apply(null, segs.map(function(s){ return s.depth; }));
  }
  function maxLevelOfRack(letter) {
    var segs = _mekRvGroups.filter(function(g){ return g.bin === letter; });
    return Math.max.apply(null, segs.map(function(s){ return s.level; }));
  }

  var rackMeta = {};
  var cursor = 0;
  LAYOUT_ORDER.forEach(function(letter, idx) {
    var depth = maxDepthOfRack(letter);
    if (idx > 0) {
      var gapType = GAP_AFTER[LAYOUT_ORDER[idx-1]] || 'aisle';
      cursor += (gapType === 'aisle') ? AISLE_GAP : BACK_GAP;
    }
    var yStart = cursor, yEnd = cursor + depth;
    rackMeta[letter] = { yStart: yStart, yEnd: yEnd, depth: depth, mirrored: MIRRORED.indexOf(letter) !== -1 };
    cursor = yEnd;
  });
  var globalMaxY = cursor;
  var globalMaxX = Math.max.apply(null, LAYOUT_ORDER.map(function(l){
    var segs = _mekRvGroups.filter(function(g){ return g.bin === l; });
    var o = Math.min.apply(null, segs.map(function(s){return s.rowFrom;}));
    return Math.max.apply(null, segs.map(function(s){ return s.rowTo - o + 1; }));
  }));
  var globalMaxZ = Math.max.apply(null, LAYOUT_ORDER.map(maxLevelOfRack));

  function localToGlobalY(letter, localY) {
    var m = rackMeta[letter];
    return m.mirrored ? (m.yEnd - localY) : (m.yStart + localY);
  }

  function computeScreenXForRow(letter, rowNum) {
    var s = _mekRvGroups.filter(function(g){ return g.bin === letter; });
    var o = Math.min.apply(null, s.map(function(x){return x.rowFrom;}));
    var mR = Math.max.apply(null, s.map(function(x){return x.rowTo;}));
    var nR = mR - o + 1;
    var rev = MIRRORED.indexOf(letter) !== -1;
    var xi = rev ? (mR - rowNum) : (rowNum - o);
    return rev ? (nR - 1 - xi) : xi;
  }
  var gShiftOffset = 0;
  if (allLetters.indexOf('G') !== -1 && allLetters.indexOf('H') !== -1) {
    var gShiftCandidate = computeScreenXForRow('H', 29) - computeScreenXForRow('G', 26);
    if (isFinite(gShiftCandidate) && Math.abs(gShiftCandidate) <= 20) gShiftOffset = gShiftCandidate;
  }

  var binMap = _mekAktual3dBuildBinMap();

  var allCubes = [];
  var allFrameLines = [];
  var allLabels = [];
  var allFloorRects = [];

  LAYOUT_ORDER.forEach(function(letter) {
    var segs = _mekRvGroups.filter(function(g){ return g.bin === letter; }).sort(function(a,b){return a.rowFrom-b.rowFrom;});
    var origin = Math.min.apply(null, segs.map(function(s){return s.rowFrom;}));
    var maxRow = Math.max.apply(null, segs.map(function(s){return s.rowTo;}));
    var nxR = maxRow - origin + 1;
    var isRev = MIRRORED.indexOf(letter) !== -1;
    function rowNumFor(xi) { return isRev ? (maxRow - xi) : (origin + xi); }
    function screenX(xi) {
      var base = isRev ? (nxR - 1 - xi) : xi;
      if (letter === 'G' && rowNumFor(xi) >= 26) base += gShiftOffset;
      return base;
    }
    function segFor(rowNum) {
      for (var i=0;i<segs.length;i++) if (rowNum>=segs[i].rowFrom && rowNum<=segs[i].rowTo) return segs[i];
      return null;
    }
    var nyByXR = [], nzByXR = [];
    for (var xi0=0; xi0<nxR; xi0++) {
      var seg = segFor(rowNumFor(xi0));
      nyByXR[xi0] = seg ? seg.depth : 0;
      nzByXR[xi0] = seg ? seg.level : 0;
    }

    var yOffsetByX = [];
    var mainSegDepth = segs.length ? segs[0].depth : 0;
    for (var xiO=0; xiO<nxR; xiO++) {
      var thisRow = rowNumFor(xiO);
      var needsFrontAlign = (letter === 'D' && thisRow === 25) || (letter === 'G' && thisRow >= 26);
      var rawOffset = needsFrontAlign ? Math.max(0, mainSegDepth - nyByXR[xiO]) : 0;
      yOffsetByX[xiO] = (isFinite(rawOffset) && rawOffset <= 10) ? rawOffset : 0;
    }

    var filledSetR = {}, slotColorR = {};
    for (var xi=0; xi<nxR; xi++) {
      var rowNum = rowNumFor(xi);
      var binCode = letter + rowNum;
      var nyL = nyByXR[xi], nzL = nzByXR[xi];
      var offY = yOffsetByX[xi] || 0;
      var info = binMap[binCode];
      var order = [];
      for (var z=nzL-1; z>=0; z--) for (var y=nyL-1; y>=0; y--) order.push([offY+y,z]);
      var slotPtr = 0;
      if (info && info.items && info.items.length) {
        info.items.forEach(function(subItem) {
          var units = subItem.units, col = subItem.color;
          for (var u=0; u<units && slotPtr<order.length; u++, slotPtr++) {
            var yz = order[slotPtr][0]+'_'+order[slotPtr][1];
            filledSetR[xi+'_'+yz] = true;
            slotColorR[xi+'_'+yz] = col;
          }
        });
      }
    }
    function existsAtR(x,y,z){ if(x<0||x>=nxR) return false; var off=yOffsetByX[x]||0; return y>=off && y<off+nyByXR[x] && z>=0 && z<nzByXR[x]; }
    function isFilledAtR(x,y,z){ if(!existsAtR(x,y,z)) return false; return !!filledSetR[x+'_'+y+'_'+z]; }

    var maxNyR = 0;
    for (var mi=0; mi<nyByXR.length; mi++) { var top = (yOffsetByX[mi]||0) + nyByXR[mi]; if (top > maxNyR) maxNyR = top; }
    var maxNzR = nzByXR.length ? Math.max.apply(null, nzByXR) : 0;
    for (var z2=0; z2<maxNzR; z2++) {
      for (var y2=0; y2<maxNyR; y2++) {
        for (var x2=0; x2<nxR; x2++) {
          if (!existsAtR(x2,y2,z2)) continue;
          if (!isFilledAtR(x2,y2,z2)) continue;
          var gYraw = localToGlobalY(letter, y2);
          var gY = isRev ? (gYraw - 1) : gYraw;
          var drawTop = !isFilledAtR(x2,y2,z2+1);
          var cInfo = mekp3dColorInfo(slotColorR[x2+'_'+y2+'_'+z2]);
          allCubes.push({ x:screenX(x2), y:gY, z:z2, colorInfo:cInfo, drawTop:drawTop });
        }
      }
    }

    function postSegObscuredOwn(sx, fy, fzL, xi) {
      return isFilledAtR(xi, fy-1, fzL) || isFilledAtR(xi, fy, fzL);
    }
    function zigSegObscuredOwn(xi, fy2, fzz) {
      return isFilledAtR(xi, fy2, fzz) || isFilledAtR(xi, fy2, fzz+1) ||
             isFilledAtR(xi, fy2+1, fzz) || isFilledAtR(xi, fy2+1, fzz+1);
    }
    for (var xiF=0; xiF<nxR; xiF++) {
      var offF = yOffsetByX[xiF] || 0;
      var depthF = nyByXR[xiF] || 0;
      var levelF = nzByXR[xiF] || 0;
      var sxLeft = screenX(xiF), sxRight = screenX(xiF) + 1;
      for (var fy=offF; fy<=offF+depthF; fy++) {
        var gYp = localToGlobalY(letter, fy);
        for (var fzL=0; fzL<levelF; fzL++) {
          if (postSegObscuredOwn(sxLeft, fy, fzL, xiF)) continue;
          allFrameLines.push({ type:'post', x:sxLeft,  y:gYp, z0:fzL, z1:fzL+1 });
          allFrameLines.push({ type:'post', x:sxRight, y:gYp, z0:fzL, z1:fzL+1 });
        }
      }
      for (var fy2=offF; fy2<offF+depthF; fy2++) {
        for (var fzz=0; fzz<levelF; fzz++) {
          if (zigSegObscuredOwn(xiF, fy2, fzz)) continue;
          var flip = fzz % 2 === 0;
          var gYa = localToGlobalY(letter, fy2), gYb = localToGlobalY(letter, fy2+1);
          var fromZ = flip ? fzz : fzz+1, toZ = flip ? fzz+1 : fzz;
          allFrameLines.push({ type:'zigzag', x:sxLeft,  ya:gYa, yb:gYb, za:fromZ, zb:toZ });
          allFrameLines.push({ type:'zigzag', x:sxRight, ya:gYa, yb:gYb, za:fromZ, zb:toZ });
        }
      }
    }
    for (var xi3=0; xi3<nxR; xi3++) {
      var offFront = (yOffsetByX[xi3]||0) + (nyByXR[xi3] || 0);
      var offBack  = (yOffsetByX[xi3]||0);
      var frontGY = localToGlobalY(letter, offFront);
      var backGY  = localToGlobalY(letter, offBack);
      var lp = mekp3dIsoProject(screenX(xi3) + 0.5, frontGY, 0);
      allLabels.push({ x: lp.x, y: lp.y + 11, text: rowNumFor(xi3) });
      var sX = screenX(xi3);
      allFloorRects.push({
        p1: mekp3dIsoProject(sX, Math.min(frontGY,backGY), 0),
        p2: mekp3dIsoProject(sX+1, Math.min(frontGY,backGY), 0),
        p3: mekp3dIsoProject(sX+1, Math.max(frontGY,backGY), 0),
        p4: mekp3dIsoProject(sX, Math.max(frontGY,backGY), 0)
      });
    }
  });

  var minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
  [0,globalMaxX].forEach(function(bx){ [0,globalMaxY].forEach(function(by){ [0,globalMaxZ].forEach(function(bz){
    var p = mekp3dIsoProject(bx,by,bz);
    if (p.x<minX) minX=p.x; if (p.x>maxX) maxX=p.x;
    if (p.y<minY) minY=p.y; if (p.y>maxY) maxY=p.y;
  }); }); });
  var pad = 120;
  var w = maxX-minX+pad*2, h = maxY-minY+pad*2;
  var svgParts = [];
  svgParts.push('<svg viewBox="'+(minX-pad)+' '+(minY-pad)+' '+w+' '+h+'" style="display:block;width:100%;height:auto;">');

  var tBorderPathPts = MEKP3D_BORDER_POINTS.map(function(p) {
    var yProp = (p.y - MEKP3D_T_ROW_MIN) / (MEKP3D_T_ROW_MAX - MEKP3D_T_ROW_MIN);
    return mekp3dIsoProject(p.x, yProp * globalMaxY, 0);
  });
  var floorPts = tBorderPathPts.map(function(p){ return p.x.toFixed(1)+','+p.y.toFixed(1); }).join(' ');
  svgParts.push('<polygon points="'+floorPts+'" fill="#dde3ea" stroke="#94a3b8" stroke-width="1.5"/>');
  var tBorderD = 'M' + tBorderPathPts.map(function(p){ return p.x.toFixed(1)+','+p.y.toFixed(1); }).join(' L') + ' Z';
  svgParts.push('<path d="'+tBorderD+'" fill="none" stroke="#0f766e" stroke-width="3.5" stroke-linejoin="round"/>');
  allFloorRects.forEach(function(r) {
    var pts = [r.p1, r.p2, r.p3, r.p4].map(function(p){ return p.x.toFixed(1)+','+p.y.toFixed(1); }).join(' ');
    svgParts.push('<polygon points="'+pts+'" fill="#6b7280"/>');
  });

  var tBinCubes3D = [];
  MEKP3D_T_BIN_DATA.forEach(function(t) {
    var yProp = (t.rowMid - MEKP3D_T_ROW_MIN) / (MEKP3D_T_ROW_MAX - MEKP3D_T_ROW_MIN);
    var yPos = yProp * globalMaxY;
    var areaPts = [
      mekp3dIsoProject(t.x, yPos, 0), mekp3dIsoProject(t.x+t.w, yPos, 0),
      mekp3dIsoProject(t.x+t.w, yPos+t.thick, 0), mekp3dIsoProject(t.x, yPos+t.thick, 0)
    ].map(function(p){ return p.x.toFixed(1)+','+p.y.toFixed(1); }).join(' ');
    svgParts.push('<polygon points="'+areaPts+'" fill="#6b7280"/>');
    var tCode = 'T' + t.num;
    var tInfo = binMap[tCode];
    if (!tInfo || !tInfo.items || !tInfo.items.length) return;
    var alongX = t.w >= t.thick;
    var maxFit = Math.max(1, Math.floor(alongX ? t.w : t.thick));
    var slotPtr = 0;
    tInfo.items.forEach(function(subItem) {
      var units = subItem.units, col = subItem.color;
      for (var u = 0; u < units && slotPtr < maxFit; u++, slotPtr++) {
        if (alongX) tBinCubes3D.push({ x:t.x+slotPtr, y:yPos, color:col });
        else tBinCubes3D.push({ x:t.x, y:yPos+slotPtr, color:col });
      }
    });
  });

  var combined = allCubes.map(function(c){ return { rtype:'cube', x:c.x, y:c.y, z:c.z, colorInfo:c.colorInfo, drawTop:c.drawTop, depth: c.x+c.y-c.z+0.9 }; });
  tBinCubes3D.forEach(function(tc) {
    combined.push({ rtype:'tbin', x:tc.x, y:tc.y, color:tc.color, depth: tc.x+tc.y-0+0.9 });
  });
  allFrameLines.forEach(function(fl) {
    if (fl.type === 'post') {
      combined.push({ rtype:'post', x:fl.x, y:fl.y, z0:fl.z0, z1:fl.z1, depth: fl.x + fl.y - fl.z0 - 0.5 });
    } else {
      combined.push({ rtype:'zigzag', x:fl.x, ya:fl.ya, yb:fl.yb, za:fl.za, zb:fl.zb, depth: fl.x + (fl.ya+fl.yb)/2 - (fl.za+fl.zb)/2 - 0.5 });
    }
  });
  combined.sort(function(a,b){ return a.depth - b.depth; });

  combined.forEach(function(item) {
    if (item.rtype === 'tbin') {
      var tResult = mekp3dCubePolygons(item.x, item.y, 0, mekp3dColorInfo(item.color), { top:true, faceX:true, faceY:true });
      tResult.faces.forEach(function(f) {
        svgParts.push('<polygon points="'+f.pts+'" fill="'+f.fill+'" fill-opacity="'+f.op+'" stroke="#000" stroke-opacity="1" stroke-width="0.5"/>');
      });
      tResult.cartonPolys.forEach(function(cp){ svgParts.push('<polygon points="'+cp.pts+'" fill="'+cp.fill+'"/>'); });
      tResult.cartonLines.forEach(function(cl){ svgParts.push('<line x1="'+cl.p1.x.toFixed(1)+'" y1="'+cl.p1.y.toFixed(1)+'" x2="'+cl.p2.x.toFixed(1)+'" y2="'+cl.p2.y.toFixed(1)+'" stroke="#000" stroke-width="0.5"/>'); });
      return;
    }
    if (item.rtype === 'post') {
      var pb = mekp3dIsoProject(item.x, item.y, item.z0), pt2 = mekp3dIsoProject(item.x, item.y, item.z1);
      svgParts.push('<line x1="'+pb.x.toFixed(1)+'" y1="'+pb.y.toFixed(1)+'" x2="'+pt2.x.toFixed(1)+'" y2="'+pt2.y.toFixed(1)+'" stroke="'+MEKP3D_RACK_COLOR+'" stroke-width="'+MEKP3D_RACK_WIDTH+'"/>');
      return;
    }
    if (item.rtype === 'zigzag') {
      var za = mekp3dIsoProject(item.x, item.ya, item.za), zb = mekp3dIsoProject(item.x, item.yb, item.zb);
      svgParts.push('<line x1="'+za.x.toFixed(1)+'" y1="'+za.y.toFixed(1)+'" x2="'+zb.x.toFixed(1)+'" y2="'+zb.y.toFixed(1)+'" stroke="'+MEKP3D_RACK_COLOR+'" stroke-width="1.6"/>');
      return;
    }
    var result = mekp3dCubePolygons(item.x, item.y, item.z, item.colorInfo, { top:item.drawTop, faceX:true, faceY:true });
    result.faces.forEach(function(f) {
      svgParts.push('<polygon points="'+f.pts+'" fill="'+f.fill+'" fill-opacity="'+f.op+'" stroke="'+f.stroke+'" stroke-opacity="'+f.strokeOp+'" stroke-width="'+f.strokeW+'"/>');
    });
    result.cartonPolys.forEach(function(cp){ svgParts.push('<polygon points="'+cp.pts+'" fill="'+cp.fill+'"/>'); });
    result.cartonLines.forEach(function(cl){ svgParts.push('<line x1="'+cl.p1.x.toFixed(1)+'" y1="'+cl.p1.y.toFixed(1)+'" x2="'+cl.p2.x.toFixed(1)+'" y2="'+cl.p2.y.toFixed(1)+'" stroke="#000" stroke-width="0.5"/>'); });
    result.edges.forEach(function(e){ svgParts.push('<line x1="'+e.p1.x.toFixed(1)+'" y1="'+e.p1.y.toFixed(1)+'" x2="'+e.p2.x.toFixed(1)+'" y2="'+e.p2.y.toFixed(1)+'" stroke="'+MEKP3D_RACK_COLOR+'" stroke-width="'+e.w+'"/>');});
  });

  LAYOUT_ORDER.forEach(function(letter) {
    var m = rackMeta[letter];
    var pos = mekp3dIsoProject(0, m.yStart, globalMaxZ);
    svgParts.push('<text x="'+(pos.x-14).toFixed(1)+'" y="'+(pos.y-4).toFixed(1)+'" font-size="16" font-weight="900" fill="#111827" font-family="Georgia, serif">'+letter+'</text>');
  });
  allLabels.forEach(function(l) {
    svgParts.push('<text x="'+l.x.toFixed(1)+'" y="'+l.y.toFixed(1)+'" font-size="7" font-weight="700" fill="#475569" text-anchor="middle" font-family="monospace">'+l.text+'</text>');
  });

  svgParts.push('</svg>');
  wrap.innerHTML = '<div style="padding:6px 4px 10px;font-size:10px;color:#a0aec0;">Semua rak — tampilan overview (pilih 1 rak di atas buat lihat detail per-posisi)</div>'
    + '<div style="background:#fff;border-radius:12px;padding:12px;width:100%;box-sizing:border-box;overflow-x:auto;">' + svgParts.join('') + '</div>';
}

// ── Tampilan khusus Bin T saja (area non-racking) — diadaptasi dari
// petaRender3DTOnly() BinLoc. ──
function _mekAktual3dRenderTOnly() {
  var LAYOUT_ORDER = ['A','B','C','D','E','F','G','H','I'];
  var AISLE_GAP = 5, BACK_GAP = 1.2;
  var GAP_AFTER = { 'A':'aisle', 'B':'back', 'C':'aisle', 'D':'back', 'E':'aisle', 'F':'back', 'G':'aisle', 'H':'aisle' };

  var wrap = document.getElementById('mekRv3dAktualWrap');
  if (!wrap) return;

  function maxDepthOfRack(letter) {
    var segs = _mekRvGroups.filter(function(g){ return g.bin === letter; });
    if (!segs.length) return 0;
    return Math.max.apply(null, segs.map(function(s){ return s.depth; }));
  }
  var cursor = 0;
  LAYOUT_ORDER.forEach(function(letter, idx) {
    var depth = maxDepthOfRack(letter);
    if (idx > 0) {
      var gapType = GAP_AFTER[LAYOUT_ORDER[idx-1]] || 'aisle';
      cursor += (gapType === 'aisle') ? AISLE_GAP : BACK_GAP;
    }
    cursor += depth;
  });
  var globalMaxY = cursor;

  var binMap = _mekAktual3dBuildBinMap();

  var bPts = MEKP3D_BORDER_POINTS.map(function(p) {
    var yProp = (p.y - MEKP3D_T_ROW_MIN) / (MEKP3D_T_ROW_MAX - MEKP3D_T_ROW_MIN);
    return mekp3dIsoProject(p.x, yProp * globalMaxY, 0);
  });
  var minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
  bPts.forEach(function(p){ if(p.x<minX)minX=p.x; if(p.x>maxX)maxX=p.x; if(p.y<minY)minY=p.y; if(p.y>maxY)maxY=p.y; });
  var pad = 60;
  var w = maxX-minX+pad*2, h = maxY-minY+pad*2;
  var svgParts = ['<svg viewBox="'+(minX-pad)+' '+(minY-pad)+' '+w+' '+h+'" style="display:block;width:100%;height:auto;">'];

  var floorPts = bPts.map(function(p){ return p.x.toFixed(1)+','+p.y.toFixed(1); }).join(' ');
  svgParts.push('<polygon points="'+floorPts+'" fill="#dde3ea" stroke="#94a3b8" stroke-width="1.5"/>');
  var borderD = 'M' + bPts.map(function(p){ return p.x.toFixed(1)+','+p.y.toFixed(1); }).join(' L') + ' Z';
  svgParts.push('<path d="'+borderD+'" fill="none" stroke="#0f766e" stroke-width="3.5" stroke-linejoin="round"/>');

  var tCombined = [];
  MEKP3D_T_BIN_DATA.forEach(function(t) {
    var yProp = (t.rowMid - MEKP3D_T_ROW_MIN) / (MEKP3D_T_ROW_MAX - MEKP3D_T_ROW_MIN);
    var yPos = yProp * globalMaxY;
    var areaPts = [
      mekp3dIsoProject(t.x, yPos, 0), mekp3dIsoProject(t.x+t.w, yPos, 0),
      mekp3dIsoProject(t.x+t.w, yPos+t.thick, 0), mekp3dIsoProject(t.x, yPos+t.thick, 0)
    ].map(function(p){ return p.x.toFixed(1)+','+p.y.toFixed(1); }).join(' ');
    svgParts.push('<polygon points="'+areaPts+'" fill="#6b7280"/>');
    var tCode = 'T' + t.num;
    var tInfo = binMap[tCode];
    if (!tInfo || !tInfo.items || !tInfo.items.length) return;
    var alongX = t.w >= t.thick;
    var maxFit = Math.max(1, Math.floor(alongX ? t.w : t.thick));
    var slotPtr = 0;
    tInfo.items.forEach(function(subItem) {
      var units = subItem.units, col = subItem.color;
      for (var u = 0; u < units && slotPtr < maxFit; u++, slotPtr++) {
        if (alongX) tCombined.push({ x:t.x+slotPtr, y:yPos, color:col });
        else tCombined.push({ x:t.x, y:yPos+slotPtr, color:col });
      }
    });
  });
  tCombined.sort(function(a,b){ return (a.x+a.y) - (b.x+b.y); });
  tCombined.forEach(function(item) {
    var r = mekp3dCubePolygons(item.x, item.y, 0, mekp3dColorInfo(item.color), { top:true, faceX:true, faceY:true });
    r.faces.forEach(function(f) {
      svgParts.push('<polygon points="'+f.pts+'" fill="'+f.fill+'" fill-opacity="'+f.op+'" stroke="#000" stroke-opacity="1" stroke-width="0.5"/>');
    });
    r.cartonPolys.forEach(function(cp){ svgParts.push('<polygon points="'+cp.pts+'" fill="'+cp.fill+'"/>'); });
    r.cartonLines.forEach(function(cl){ svgParts.push('<line x1="'+cl.p1.x.toFixed(1)+'" y1="'+cl.p1.y.toFixed(1)+'" x2="'+cl.p2.x.toFixed(1)+'" y2="'+cl.p2.y.toFixed(1)+'" stroke="#000" stroke-width="0.5"/>'); });
  });

  MEKP3D_T_BIN_DATA.forEach(function(t) {
    var yProp = (t.rowMid - MEKP3D_T_ROW_MIN) / (MEKP3D_T_ROW_MAX - MEKP3D_T_ROW_MIN);
    var yPos = yProp * globalMaxY;
    var lp = mekp3dIsoProject(t.x + t.w/2, yPos + 0.45, 0.25);
    svgParts.push('<text x="'+lp.x.toFixed(1)+'" y="'+lp.y.toFixed(1)+'" font-size="7" font-weight="800" fill="#334155" text-anchor="middle" font-family="monospace">T'+t.num+'</text>');
  });

  svgParts.push('</svg>');
  wrap.innerHTML = '<div style="padding:6px 4px 10px;font-size:10px;color:#a0aec0;">Bin Tambahan saja — rak utama disembunyikan</div>'
    + '<div style="background:#fff;border-radius:12px;padding:12px;width:100%;box-sizing:border-box;overflow-x:auto;">' + svgParts.join('') + '</div>';
}

// ── Detail 1 rak (dipilih dari chip) — diadaptasi dari petaRender3D() BinLoc.
// Beda dari versi BinLoc: gak ada mode klik-pilih-posisi (popup), diganti
// tooltip native browser (<title> di tiap kubus) biar lebih sederhana. ──
function _mekAktual3dRenderRack(binLetter) {
  var segments = (_mekRvGroups || []).filter(function(g) { return g.bin === binLetter; });
  var wrap = document.getElementById('mekRv3dAktualWrap');
  if (!wrap) return;
  if (!segments.length) { wrap.innerHTML = '<div style="padding:40px;text-align:center;color:#a0aec0;font-size:12px">Rak tidak ditemukan</div>'; return; }
  segments.sort(function(a, b) { return a.rowFrom - b.rowFrom; });

  var origin = Math.min.apply(null, segments.map(function(s){ return s.rowFrom; }));
  var maxRow = Math.max.apply(null, segments.map(function(s){ return s.rowTo; }));
  var nx = maxRow - origin + 1;

  var P3D_REVERSED_BINS = ['B','D','F','H','I'];
  var isReversed = P3D_REVERSED_BINS.indexOf(binLetter) !== -1;
  function rowNumFor(xi) { return isReversed ? (maxRow - xi) : (origin + xi); }

  function segmentFor(rowNum) {
    for (var i = 0; i < segments.length; i++) {
      if (rowNum >= segments[i].rowFrom && rowNum <= segments[i].rowTo) return segments[i];
    }
    return null;
  }

  var nyByX = [], nzByX = [];
  var maxNy = 1, maxNz = 1;
  for (var xi0 = 0; xi0 < nx; xi0++) {
    var seg = segmentFor(rowNumFor(xi0));
    var ny_x = seg ? seg.depth : 0;
    var nz_x = seg ? seg.level : 0;
    nyByX[xi0] = ny_x;
    nzByX[xi0] = nz_x;
    if (ny_x > maxNy) maxNy = ny_x;
    if (nz_x > maxNz) maxNz = nz_x;
  }
  var ny = maxNy;
  var nz = maxNz;

  var binMap = _mekAktual3dBuildBinMap();

  var filledSet = {};
  var slotColor = {};
  var hoverInfo = {}; // xi -> binCode, buat title tooltip
  for (var xi = 0; xi < nx; xi++) {
    var rowNum   = rowNumFor(xi);
    var binCode  = binLetter + rowNum;
    var ny_local = nyByX[xi], nz_local = nzByX[xi];
    var info = binMap[binCode];
    hoverInfo[xi] = binCode;

    var order = [];
    for (var z = nz_local - 1; z >= 0; z--) {
      for (var y = ny_local - 1; y >= 0; y--) {
        order.push([y, z]);
      }
    }

    var slotPtr = 0;
    if (info && info.items && info.items.length) {
      info.items.forEach(function(subItem) {
        var units = subItem.units, col = subItem.color;
        for (var u = 0; u < units && slotPtr < order.length; u++, slotPtr++) {
          var yz = order[slotPtr][0] + '_' + order[slotPtr][1];
          filledSet[xi + '_' + yz] = true;
          slotColor[xi + '_' + yz] = col;
        }
      });
    }
  }

  function existsAt(x, y, z) {
    if (x < 0 || x >= nx) return false;
    return y >= 0 && y < nyByX[x] && z >= 0 && z < nzByX[x];
  }
  function isFilledAt(x, y, z) {
    if (!existsAt(x, y, z)) return false;
    return !!filledSet[x + '_' + y + '_' + z];
  }

  var cubes = [];
  for (var z2 = 0; z2 < nz; z2++) {
    for (var y2 = 0; y2 < ny; y2++) {
      for (var x2 = 0; x2 < nx; x2++) {
        if (!existsAt(x2, y2, z2)) continue;
        if (!isFilledAt(x2, y2, z2)) continue; // slot kosong — gak digambar (gak ada mode klik-pilih di versi ini)
        var drawTop = !isFilledAt(x2, y2, z2+1);
        var cInfo = mekp3dColorInfo(slotColor[x2+'_'+y2+'_'+z2]);
        cubes.push({ x:x2, y:y2, z:z2, colorInfo: cInfo, drawTop:drawTop, binIdx:x2 });
      }
    }
  }
  cubes.sort(function(a, b) { return (a.x + a.y - a.z) - (b.x + b.y - b.z); });

  var minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
  for (var bbx=0; bbx<=nx; bbx++) for (var bby=0; bby<=ny; bby++) for (var bbz=0; bbz<=nz; bbz++) {
    var p = mekp3dIsoProject(bbx, bby, bbz);
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
  }
  var labelSpace = 26;
  var pad = 90;
  var w = maxX - minX + pad*2;
  var h = maxY - minY + pad*2 + labelSpace;

  var svgParts = [];
  svgParts.push('<svg viewBox="'+(minX-pad)+' '+(minY-pad)+' '+w+' '+h+'" style="display:block;width:100%;height:auto;">');

  var floorPad = 0.15;
  var floorPts = [
    mekp3dIsoProject(-floorPad, -floorPad, 0), mekp3dIsoProject(nx+floorPad, -floorPad, 0),
    mekp3dIsoProject(nx+floorPad, ny+floorPad, 0), mekp3dIsoProject(-floorPad, ny+floorPad, 0)
  ].map(function(p){ return p.x.toFixed(1)+','+p.y.toFixed(1); }).join(' ');
  svgParts.push('<polygon points="'+floorPts+'" fill="#dde3ea" stroke="#94a3b8" stroke-width="1.5"/>');

  function depthAtBoundary(bx) {
    var a = bx > 0 ? (nyByX[bx-1] || 0) : 0;
    var b = bx < nx ? (nyByX[bx] || 0) : 0;
    return Math.max(a, b);
  }
  function levelAtBoundary(bx) {
    var a = bx > 0 ? (nzByX[bx-1] || 0) : 0;
    var b = bx < nx ? (nzByX[bx] || 0) : 0;
    return Math.max(a, b);
  }
  var renderList = cubes.slice();
  for (var fx = 0; fx <= nx; fx++) {
    var fDepth = depthAtBoundary(fx), fLevel = levelAtBoundary(fx);
    for (var fy = 0; fy <= fDepth; fy++) {
      for (var fzL = 0; fzL < fLevel; fzL++) {
        renderList.push({ frameType:'post', fx:fx, fy:fy, fzL:fzL, depth: fx + fy - fzL - 0.5 });
      }
    }
    for (var fy2 = 0; fy2 < fDepth; fy2++) {
      for (var fzz = 0; fzz < fLevel; fzz++) {
        renderList.push({ frameType:'zigzag', fx:fx, fy2:fy2, fzz:fzz, depth: fx + fy2 - fzz - 0.5 });
      }
    }
  }
  renderList.forEach(function(item) {
    if (item.frameType) return;
    item.depth = (item.x + item.y - item.z) + 0.9;
  });
  renderList.sort(function(a, b) { return a.depth - b.depth; });

  renderList.forEach(function(item) {
    if (item.frameType === 'post') {
      var fpBot = mekp3dIsoProject(item.fx, item.fy, item.fzL), fpTop = mekp3dIsoProject(item.fx, item.fy, item.fzL+1);
      svgParts.push('<line x1="'+fpBot.x.toFixed(1)+'" y1="'+fpBot.y.toFixed(1)+'" x2="'+fpTop.x.toFixed(1)+'" y2="'+fpTop.y.toFixed(1)+'" stroke="'+MEKP3D_RACK_COLOR+'" stroke-width="'+MEKP3D_RACK_WIDTH+'"/>');
      return;
    }
    if (item.frameType === 'zigzag') {
      var fflip = item.fzz % 2 === 0;
      var ffrom = fflip ? mekp3dIsoProject(item.fx, item.fy2, item.fzz)   : mekp3dIsoProject(item.fx, item.fy2, item.fzz+1);
      var fto   = fflip ? mekp3dIsoProject(item.fx, item.fy2+1, item.fzz+1) : mekp3dIsoProject(item.fx, item.fy2+1, item.fzz);
      svgParts.push('<line x1="'+ffrom.x.toFixed(1)+'" y1="'+ffrom.y.toFixed(1)+'" x2="'+fto.x.toFixed(1)+'" y2="'+fto.y.toFixed(1)+'" stroke="'+MEKP3D_RACK_COLOR+'" stroke-width="'+MEKP3D_RACK_WIDTH+'"/>');
      return;
    }
    var c = item;
    var binCode = hoverInfo[c.binIdx] || '';
    var agg = _mekRvBinAgg[binCode];
    var titleTxt = _mekRvCellTitle(agg, binCode);
    var result = mekp3dCubePolygons(c.x, c.y, c.z, c.colorInfo, { top:c.drawTop, faceX:true, faceY:true });
    result.faces.forEach(function(f) {
      svgParts.push('<polygon points="'+f.pts+'" fill="'+f.fill+'" fill-opacity="'+f.op+'" stroke="'+f.stroke+'" stroke-opacity="'+f.strokeOp+'" stroke-width="'+f.strokeW+'"><title>' + _mekEsc(titleTxt) + '</title></polygon>');
    });
    result.cartonPolys.forEach(function(cp) {
      svgParts.push('<polygon points="'+cp.pts+'" fill="'+cp.fill+'" style="pointer-events:none;"/>');
    });
    result.cartonLines.forEach(function(cl) {
      svgParts.push('<line x1="'+cl.p1.x.toFixed(1)+'" y1="'+cl.p1.y.toFixed(1)+'" x2="'+cl.p2.x.toFixed(1)+'" y2="'+cl.p2.y.toFixed(1)+'" stroke="#000" stroke-width="0.5" style="pointer-events:none;"/>');
    });
    result.edges.forEach(function(e) {
      svgParts.push('<line x1="'+e.p1.x.toFixed(1)+'" y1="'+e.p1.y.toFixed(1)+'" x2="'+e.p2.x.toFixed(1)+'" y2="'+e.p2.y.toFixed(1)+'" stroke="'+MEKP3D_RACK_COLOR+'" stroke-width="'+e.w+'" style="pointer-events:none;"/>');
    });
  });

  for (var lx = 0; lx < nx; lx++) {
    var lp = mekp3dIsoProject(lx + 0.5, ny, 0);
    svgParts.push('<text x="'+lp.x.toFixed(1)+'" y="'+(lp.y+13).toFixed(1)+'" font-size="9" font-weight="700" fill="#475569" text-anchor="middle" font-family="monospace">'+rowNumFor(lx)+'</text>');
  }

  var blockLabelPos = mekp3dIsoProject(0, 0, nz);
  var blX = blockLabelPos.x - 55.0, blY = blockLabelPos.y + 25.96;
  svgParts.push('<text x="0" y="0" font-size="50" font-weight="900" fill="#111827" font-family="Georgia, serif" transform="translate('+blX.toFixed(1)+' '+blY.toFixed(1)+') rotate(-29) skewX(-31)">'+binLetter+'</text>');

  svgParts.push('</svg>');

  var infoBar = '<div style="padding:6px 4px 10px;font-size:10px;color:#a0aec0;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">'
      + '<span>Rak <b style="color:#2d3748">' + binLetter + '</b> · ' + nx + ' posisi · ' + nz + ' level × ' + ny + ' depth</span>'
      + '<span>'
        + '<span style="display:inline-block;width:9px;height:9px;background:'+MEKP3D_COLOR_AVAILABLE+';border-radius:2px;margin-right:3px;"></span>Available&nbsp; '
        + '<span style="display:inline-block;width:9px;height:9px;background:'+MEKP3D_COLOR_WAITING+';border-radius:2px;margin-right:3px;"></span>Reserved&nbsp; '
        + '<span style="display:inline-block;width:9px;height:9px;background:'+MEKP3D_COLOR_LONGWAIT+';border-radius:2px;margin-right:3px;"></span>Reserved &gt;24h'
      + '</span>'
    + '</div>'
  + '</div>';

  wrap.innerHTML = infoBar
    + '<div style="background:#fff;border-radius:12px;padding:12px;width:100%;box-sizing:border-box;">'
      + svgParts.join('')
    + '</div>';
}

function _mekRenderReservedView(data) {
  var s = data.summary || {};
  document.getElementById('mekRvKpiTotal').textContent     = (s.totalStock||0).toLocaleString('id-ID');
  document.getElementById('mekRvKpiAvailable').textContent = (s.available||0).toLocaleString('id-ID');
  document.getElementById('mekRvKpiReserved').textContent  = (s.reserved||0).toLocaleString('id-ID');
  document.getElementById('mekRvKpiPct').textContent       = (s.reservedPct!=null ? s.reservedPct.toFixed(1) : '0.0') + '%';
  document.getElementById('mekRvKpiContainer').textContent = (s.containerWaiting||0);
  document.getElementById('mekRvKpiLongest').textContent   = s.longestWaitingLabel || '-';

  var rows = (data.rows || []).map(function(r){ r.tier = _mekReservedWaitTier(r.waitHours); return r; });
  _mekRvRowsRaw = rows; // simpan mentah — dipakai _mekRvApplyRowFilter buat filter list

  // Lokasi yang punya reservasi >24 jam — dipakai buat warna merah di peta
  // (dicocokkan via SKU yang sama, karena cell BinLoc gak nyimpen waitHours langsung)
  var longWaitSkus = {};
  rows.forEach(function(r){ if (r.tier === 'gt24') longWaitSkus[r.sku] = true; });
  _mekRvLongWaitSkus = longWaitSkus; // dipakai juga sama render 3D Aktual

  // Agregasi per lokasi BinLoc — dipakai bareng oleh 2D Simple, 2D Aktual & 3D
  var agg = {};
  (data.cells || []).forEach(function(c){
    var key = c.binLoc || '?';
    if (!agg[key]) agg[key] = { binLoc: key, totalKarton: 0, totalReserved: 0, totalAvailable: 0, hasLongWait: false, items: [] };
    agg[key].totalKarton    += c.karton || 0;
    agg[key].totalReserved  += c.reservedKarton || 0;
    agg[key].totalAvailable += c.availableKarton || 0;
    agg[key].items.push({ sku: c.sku, nama: c.nama, karton: c.karton });
    if (longWaitSkus[c.sku] && c.reservedKarton > 0) agg[key].hasLongWait = true;
  });
  _mekRvBinAgg = agg;

  // Render peta sesuai mode yang lagi aktif
  mekRvRenderCurrentMode();

  // List rows (kena filter kalau ada filter aktif)
  _mekRvApplyRowFilter();
}

// ── Filter list "Reserved Stock Monitoring" — sama pola kaya Kesiapan Stock.
// Cuma mem-filter tabel di bawah; peta 3D/2D tetap nampilin semua lokasi. ──
var _mekRvRowsRaw = [];

function _mekRvApplyRowFilter() {
  var raw = _mekRvRowsRaw || [];
  var skuF    = ((document.getElementById('mekRvFilterSku')    ||{}).value||'').toLowerCase().trim();
  var noSoF   = ((document.getElementById('mekRvFilterNoSo')   ||{}).value||'').toLowerCase().trim();
  var tujuanF = ((document.getElementById('mekRvFilterTujuan') ||{}).value||'').toLowerCase().trim();
  var plantF  = ((document.getElementById('mekRvFilterPlant')  ||{}).value||'').toLowerCase().trim();
  var agingF  = ((document.getElementById('mekRvFilterAging')  ||{}).value||'').trim();

  var rows = raw.filter(function(r){
    if (skuF && (r.sku||'').toLowerCase().indexOf(skuF) < 0 && (r.nama||'').toLowerCase().indexOf(skuF) < 0) return false;
    if (noSoF && (r.noSo||'').toLowerCase().indexOf(noSoF) < 0) return false;
    if (tujuanF && (r.tujuan||'').toLowerCase().indexOf(tujuanF) < 0) return false;
    if (plantF === '__no_plant__') {
      if ((r.plant||'').trim()) return false;
    } else if (plantF && (r.plant||'').toLowerCase().indexOf(plantF) < 0) {
      return false;
    }
    if (agingF && r.tier !== agingF) return false;
    return true;
  });
  _mekRvRenderRowsList(rows, !!(skuF || noSoF || tujuanF || plantF || agingF));
}

function _mekRvRenderRowsList(rows, filterActive) {
  var listEl  = document.getElementById('mekRvList');
  var emptyEl = document.getElementById('mekRvEmpty');
  if (!listEl || !emptyEl) return;
  if (!rows.length) {
    listEl.innerHTML = '';
    emptyEl.style.display = 'block';
    emptyEl.innerHTML = filterActive
      ? '<i class="fas fa-filter" style="font-size:32px;display:block;margin-bottom:8px;opacity:.4;"></i>Tidak ada yang cocok dengan filter'
      : '<i class="fas fa-check-circle" style="font-size:32px;display:block;margin-bottom:8px;opacity:.4;"></i>Tidak ada stock yang di-reserve saat ini';
    return;
  }
  emptyEl.style.display = 'none';
  listEl.innerHTML = rows.map(function(r){
    var isLong = r.tier === 'gt24';
    var badgeBg = isLong ? '#fed7d7' : '#feebc8';
    var badgeFg = isLong ? '#c53030' : '#c05621';
    var badgeTx = isLong ? 'Delay' : 'Waiting';
    return '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;margin-bottom:8px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px;">'
        + '<div style="min-width:0;"><div style="font-weight:800;font-size:13px;color:#2d3748;">' + _mekEsc(r.sku||'-') + '</div>'
        + '<div style="font-size:11px;color:#718096;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _mekEsc(r.nama||'-') + '</div></div>'
        + '<span style="flex-shrink:0;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;background:' + badgeBg + ';color:' + badgeFg + ';">' + badgeTx + '</span>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;color:#718096;">'
        + '<div>Qty Reserved: <b style="color:#2d3748;">' + (r.qtyReserved||0).toLocaleString('id-ID') + '</b></div>'
        + '<div>No. SO: <b style="color:#2d3748;">' + _mekEsc(r.noSo||'-') + '</b></div>'
        + '<div>Waiting: <b style="color:' + (isLong?'#c53030':'#c05621') + ';">' + _mekReservedFmtHours(r.waitHours) + '</b></div>'
        + '<div>Tujuan: <b style="color:#2d3748;">' + _mekEsc(r.tujuan||'-') + '</b></div>'
      + '</div>'
    + '</div>';
  }).join('');
}

// ════════════════════════════════════════════════════════════
// TAB PLANNING — baca dan edit PLANNING_EKSPOR (source EMAIL)
// ════════════════════════════════════════════════════════════
var _mekPlanningData = [];

var _MEK_PLAN_COLS = [
  {key:'week',        label:'WEEK',           ro:true},  // read-only, dihitung otomatis
  {key:'keterangan',  label:'KETERANGAN'},
  {key:'so',          label:'SO'},
  {key:'qt',          label:'QT'},
  {key:'negara',      label:'NEGARA'},
  {key:'sku',         label:'KODE'},
  {key:'nama',        label:'MATERIAL'},
  {key:'stuffingDate',label:'STUFFING DATE'},
  {key:'plant',       label:'STUFFING PLANT'},
  {key:'jumlahCont',  label:'QTY CONT', right:true, ro:true},
  {key:'qty',         label:'QTY KRT',  right:true},
  {key:'ready',       label:'READY/NOT'},
  {key:'email',       label:'EMAIL'},
  {key:'rsvCrt',      label:'RSV CRT', right:true},
  {key:'poSto',       label:'PO STO/PO INT'},
  {key:'doSto',       label:'DO STO/DO INT'},
  {key:'note',        label:'NOTE'}
];

function mekLoadPlanningTab() {
  var wFrom = parseInt((document.getElementById('mekPlanWeekFrom')||{}).value||'') || 0;
  var wTo   = parseInt((document.getElementById('mekPlanWeekTo')  ||{}).value||'') || wFrom;
  var year  = parseInt((document.getElementById('mekPlanYear')    ||{}).value||'') || new Date().getFullYear();
  if (!wFrom) { showToast('Isi week terlebih dahulu.', 'warning'); return; }

  var tbody = document.getElementById('mekPlanningTbody');
  var empty = document.getElementById('mekPlanningEmpty');
  var cnt   = document.getElementById('mekPlanRowCount');
  if (tbody) tbody.innerHTML = '<tr><td colspan="17" style="text-align:center;padding:30px;color:#a0aec0;">Memuat...</td></tr>';
  if (empty) empty.style.display = 'none';

  API.run('getMekEmailPlanning', { weekFrom: wFrom, weekTo: wTo, year: year }, function(res) {
    if (!res || !res.success) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="17" style="text-align:center;padding:30px;color:#fc8181;">Gagal: '+(res&&res.message?res.message:'error')+'</td></tr>';
      return;
    }
    _mekPlanningData = res.data || [];
    if (cnt) { cnt.textContent = _mekPlanningData.length + ' baris'; cnt.style.display = _mekPlanningData.length ? '' : 'none'; }
    if (!_mekPlanningData.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = '';
      return;
    }
    _mekRenderPlanningTab(_mekPlanningData);
  });
}

function _mekRenderPlanningTab(data) {
  var tbody = document.getElementById('mekPlanningTbody');
  if (!tbody) return;

  var ES = 'outline:none;padding:5px 6px;font-size:12px;white-space:nowrap;cursor:text;' +
           'min-width:60px;display:block;border-radius:4px;transition:background .15s;';

  tbody.innerHTML = data.map(function(r, i) {
    // Class baris berdasarkan status antrian (CSS handle warna)
    var rowCls = r._status === 'done'    ? 'plan-done' :
                 r._status === 'partial' ? 'plan-pending' :
                 r._status === 'pending' ? 'plan-pending' : '';

    var cells = _MEK_PLAN_COLS.map(function(col) {
      var val = r[col.key] !== undefined ? String(r[col.key]) : '';
      var td;
      if (col.ro) {
        td = '<td style="text-align:center;background:#f8fafc;color:#718096;font-size:11px;font-weight:700;padding:5px 8px;">' + _mekEsc(val) + '</td>';
      } else {
        td = '<td><span contenteditable="true"';
        td += ' data-row="'+i+'" data-col="'+col.key+'"';
        td += ' style="'+ES+(col.right?'text-align:right;':'')+'color:#2d3748;"';
        td += ' onblur="_mekPlanCellEdit('+i+',\''+col.key+'\',this.innerText.trim())"';
        td += ' onkeydown="if(event.key===String.fromCharCode(13)){event.preventDefault();this.blur();}">';
        td += _mekEsc(val) + '</span></td>';
      }
      return td;
    }).join('');

    return '<tr class="'+rowCls+'">' +
      '<td style="text-align:center;color:#a0aec0;font-size:11px;font-weight:700;background:#f8fafc;">' + (i+1) + '</td>' +
      cells +
      '<td style="text-align:center;">' +
        '<button onclick="_mekSavePlanningRow('+i+')" class="btn-simpan">Simpan</button>' +
      '</td>' +
      '</tr>';
  }).join('');
}

function _mekPlanCellEdit(rowIdx, colKey, val) {
  if (_mekPlanningData[rowIdx]) {
    _mekPlanningData[rowIdx][colKey] = val;
    _mekPlanningData[rowIdx]._dirty = true;
  }
}

function _mekSavePlanningRow(rowIdx) {
  var r = _mekPlanningData[rowIdx];
  if (!r) return;
  var status = document.getElementById('mekPlanSaveStatus');
  if (status) status.textContent = 'Menyimpan baris '+(rowIdx+1)+'...';

  // Kumpulkan QTY semua container dari baris yang sama (rowIdx di sheet)
  var qtyKrtAll = _mekPlanningData
    .filter(function(row){ return row._rowIdx === r._rowIdx; })
    .sort(function(a,b){ return a._contIdx - b._contIdx; })
    .map(function(row){ return String(row.qty||''); });

  var fields = Object.assign({}, r, { qtyKrtAll: qtyKrtAll });

  API.run('updateMekEmailPlanningRow', { rowIdx: r._rowIdx, fields: fields }, function(res) {
    if (res && res.success) {
      _mekPlanningData[rowIdx]._dirty = false;
      if (status) status.textContent = 'Baris '+(rowIdx+1)+' tersimpan ✓';
      setTimeout(function(){ if(status) status.textContent=''; }, 3000);
    } else {
      var msg = res && res.message ? res.message : 'error';
      showToast('Gagal simpan: '+msg, 'error');
      if (status) status.textContent = '';
    }
  });
}

// ── Helper: hapus angka 0 di depan (untuk No. DOC) ───────────
// "00123456" → "123456", "0001A" → "1A", "AB001" → "AB001" (tidak diubah jika non-numerik di depan)
// Helper filter plant — support ALL, JAYANTI 2, __NO_PLAN__ (tanpa planning)
function _mekMatchPlant(plant, plantF, r) {
  if (!plantF) return true; // All
  if (plantF === '__NO_PLAN__') {
    // Tanpa planning = baris yang tidak ter-assign ke SO/planning manapun (SKU kosong)
    // isPendingan tidak cukup karena pendingan tgl masih punya planning
    return !r || !(r.sku||'').trim();
  }
  var p = (plant||'').toUpperCase();
  return p.indexOf(plantF.toUpperCase()) >= 0;
}

function _mekStripLeadingZero(s) {
  var str = String(s || '').trim();
  // Hapus semua 0 di depan, tapi sisakan minimal 1 karakter
  return str.replace(/^0+(?=\S)/, '');
}

// ════════════════════════════════════════════════════════════
// TAB SUMMARY — baca dari sheet ANTRIAN
// Kolom yang ditampilkan:
//   D = No Pol, E = Ekspedisi, F = No DOC, I = Tujuan,
//   L = Waktu Daftar, P = Waktu Keluar
// ════════════════════════════════════════════════════════════
function mekLoadSummary() {
  var from  = (document.getElementById('mekFilterFrom')   || {}).value || '';
  var to    = (document.getElementById('mekFilterTo')     || {}).value || '';
  var nopol = ((document.getElementById('mekFilterNopol') || {}).value || '').trim().toLowerCase();
  var nodoc = ((document.getElementById('mekFilterNoDoc') || {}).value || '').trim();
  var dest  = ((document.getElementById('mekFilterDest')  || {}).value || '').trim().toLowerCase();

  // Strip leading zeros dari input pencarian No. DOC
  // "00123" → "123", sehingga cocok dengan data yang juga sudah di-strip
  var nodocStripped = _mekStripLeadingZero(nodoc).toLowerCase();

  var tbody = document.getElementById('mekSumTbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:50px;color:#a0aec0;">' +
    '<i class="fas fa-spinner fa-spin" style="font-size:24px;"></i></td></tr>';

  API.run('getMekAntrianData', { from: from, to: to }, function (res) {
    if (!res || !res.success) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#fc8181;">' +
        '<i class="fas fa-exclamation-triangle" style="font-size:24px;display:block;margin-bottom:8px;"></i>' +
        'Gagal memuat data: ' + (res && res.message ? res.message : 'Unknown error') + '</td></tr>';
      return;
    }
    var data = res.data || [];

    // Filter lokal — semua pakai strip-leading-zero untuk No. DOC
    if (nopol)         data = data.filter(function (r) { return (r.nopol  || '').toLowerCase().indexOf(nopol) >= 0; });
    if (nodocStripped) data = data.filter(function (r) { return _mekStripLeadingZero(r.noDoc || '').toLowerCase().indexOf(nodocStripped) >= 0; });
    if (dest)          data = data.filter(function (r) { return (r.tujuan || '').toLowerCase().indexOf(dest)  >= 0; });

    // Sort by waktuDaftar ascending (tanggal terkecil duluan)
    data.sort(function(a,b){
      var ta = a.waktuDaftar || '';
      var tb = b.waktuDaftar || '';
      return ta < tb ? -1 : ta > tb ? 1 : 0;
    });
    _mekSummaryData = data;
    _mekRenderSummaryTable(data);
    _mekRenderSummaryCards(data);

    var countEl = document.getElementById('mekSumRowCount');
    if (countEl) countEl.textContent = data.length + ' DATA';
  }, function () {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#fc8181;">Koneksi gagal. Coba lagi.</td></tr>';
  });
}

function _mekRenderSummaryCards(data) {
  var totalTruck = data.length;
  var dests      = {};
  var ekspeds    = {};
  var sudahKeluar = 0;

  data.forEach(function (r) {
    if (r.tujuan)    dests[r.tujuan]       = 1;
    if (r.ekspedisi) ekspeds[r.ekspedisi]  = 1;
    if (r.waktuKeluar && String(r.waktuKeluar).trim()) sudahKeluar++;
  });

  _mekSetCard('mekCardTruck',   totalTruck);
  _mekSetCard('mekCardDest',    Object.keys(dests).length);
  _mekSetCard('mekCardEksp',    Object.keys(ekspeds).length);
  _mekSetCard('mekCardKeluar',  sudahKeluar);
}

function _mekSetCard(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = _mekFmt(val);
}

function _mekFmt(n) { return Number(n).toLocaleString('id-ID'); }

function _mekRenderSummaryTable(data) {
  var tbody = document.getElementById('mekSumTbody');
  if (!tbody) return;
  if (!data || !data.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:50px;color:#a0aec0;font-size:13px;">' +
      '<i class="fas fa-truck" style="font-size:32px;display:block;margin-bottom:12px;opacity:.2;"></i>' +
      'Tidak ada data pada rentang ini</td></tr>';
    return;
  }

  var rows = '';
  data.forEach(function (r, i) {
    var keluar    = r.waktuKeluar && String(r.waktuKeluar).trim();
    var statusTxt = keluar ? 'KELUAR' : 'ANTRIAN';
    var statusSty = keluar
      ? 'background:#c6f6d5;color:#276749;'
      : 'background:#fefcbf;color:#744210;';

    rows += '<tr>' +
      '<td style="text-align:center;color:#a0aec0;font-size:11px;font-weight:700;">' + (i+1) + '</td>' +
      '<td><b style="font-size:12px;">' + _mekEsc(r.nopol || '-') + '</b></td>' +
      '<td>' + _mekEsc(r.ekspedisi || '-') + '</td>' +
      '<td>' + _mekEsc(_mekStripLeadingZero(r.noDoc) || '-') + '</td>' +
      '<td>' + _mekEsc(r.tujuan || '-') + '</td>' +
      '<td style="white-space:nowrap;color:#4a5568;">' + _mekEsc(r.waktuDaftar || '-') + '</td>' +
      '<td style="white-space:nowrap;color:#4a5568;">' + _mekEsc(r.waktuKeluar || '-') + '</td>' +
      '<td style="text-align:center;">' +
        '<span style="padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;' + statusSty + '">' +
        statusTxt + '</span>' +
      '</td>' +
      '</tr>';
  });
  tbody.innerHTML = rows;
}

function _mekEsc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/'/g,'&#39;').replace(/"/g,'&quot;');
}

// ════════════════════════════════════════════════════════════
// DOWNLOAD PDF — print tabel dengan warna
// ════════════════════════════════════════════════════════════
function _mekPrintTable(tableId, title, subtitle) {
  var tbl = document.getElementById(tableId);
  if (!tbl) { showToast('Tidak ada data untuk di-download.', 'warning'); return; }
  var rows = tbl.querySelectorAll('tbody tr');
  if (!rows.length) { showToast('Tidak ada data.', 'warning'); return; }

  var css = [
    '* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }',
    'body { font-family: Arial, sans-serif; font-size: 10px; margin: 0; padding: 8px; }',
    'h2 { font-size: 13px; margin: 0 0 2px; color: #1a3a5c; }',
    'p  { font-size: 10px; margin: 0 0 6px; color: #718096; }',
    'table { width: 100%; table-layout: auto; border-collapse: collapse; }',
    'th { background: #1a3a5c !important; color: #fff !important; padding: 4px 5px; font-size: 9px; text-align: left; border: 1px solid #2d4a6a; white-space: normal; word-break: break-word; }',
    'td { padding: 3px 5px; font-size: 9px; border: 1px solid #e2e8f0; vertical-align: middle; white-space: normal !important; word-break: break-word; }',
    'tr:nth-child(even) td { background: #f7fafc !important; }',
    'span[style*="background:#c6f6d5"] { background: #c6f6d5 !important; color: #276749 !important; border-radius: 8px; padding: 1px 6px; }',
    'span[style*="background:#fed7d7"] { background: #fed7d7 !important; color: #c53030 !important; border-radius: 8px; padding: 1px 6px; }',
    'span[style*="background:#feebc8"] { background: #feebc8 !important; color: #744210 !important; border-radius: 8px; padding: 1px 6px; }',
    'span[style*="background:#bee3f8"] { background: #bee3f8 !important; color: #2b6cb0 !important; border-radius: 8px; padding: 1px 6px; }',
    'span[style*="background:#f6d860"] { background: #f6d860 !important; color: #744210 !important; border-radius: 8px; padding: 1px 6px; }',
    'tr[style*="background:#1a3a5c"] td { background: #1a3a5c !important; color: #fff !important; }',
    'tr[style*="background:#276749"] td { background: #276749 !important; color: #fff !important; }',
    'tr[style*="background:#2d4a6a"] td { background: #2d4a6a !important; color: #bee3f8 !important; }',
    'tr[style*="background:#2d6a4f"] td { background: #2d6a4f !important; color: #d8f3dc !important; }',
    'tr[style*="background:#fffff0"] td { background: #fffff0 !important; }',
    'tr[style*="background:#fff5f5"] td { background: #fff5f5 !important; }',
    '@media print { @page { size: A4 landscape; margin: 6mm; } }'
  ].join('\n');

  var now = new Date();
  var tglPrint = ('0'+now.getDate()).slice(-2)+'/'+('0'+(now.getMonth()+1)).slice(-2)+'/'+now.getFullYear()+
    ' '+('0'+now.getHours()).slice(-2)+':'+('0'+now.getMinutes()).slice(-2);

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<title>' + title + '</title>' +
    '<style>' + css + '</style></head><body>' +
    '<h2>' + title + '</h2>' +
    '<p>' + (subtitle||'') + ' &nbsp;|&nbsp; Dicetak: ' + tglPrint + '</p>' +
    tbl.outerHTML +
    '</body></html>';

  var win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { showToast('Popup diblokir browser. Izinkan popup untuk halaman ini.', 'error'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(function() { win.print(); }, 500);
}

function mekDownloadAllPdf() {
  var from = (document.getElementById('mekFilterFrom')||{}).value||'';
  var to   = (document.getElementById('mekFilterTo')||{}).value||'';
  var sub  = from && to ? _mekFmtTglDisplay(from) + ' s/d ' + _mekFmtTglDisplay(to) : 'Semua Periode';
  _mekPrintTable('mekSumTbl', 'Data Antrian Ekspor', sub);
}

function mekDownloadCapaianPdf() {
  var from = (document.getElementById('mekCapFrom')||{}).value||'';
  var to   = (document.getElementById('mekCapTo')||{}).value||'';
  var mode = { all:'Capaian', email:'Detail' };
  var modeStr = mode[window._mekCapMode||'all'] || '';
  var sub  = (from && to ? _mekFmtTglDisplay(from) + ' s/d ' + _mekFmtTglDisplay(to) : 'Semua Periode') +
    (modeStr ? ' — ' + modeStr : '');
  _mekPrintTable('mekCapTbl', 'Capaian Planning Ekspor', sub);
}

function mekToggleCapDownloadMenu() {
  var menu = document.getElementById('mekCapDownloadMenu');
  if (!menu) return;
  var isOpen = menu.style.display !== 'none';
  menu.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    setTimeout(function() {
      document.addEventListener('click', function _close(e) {
        var wrap = document.getElementById('mekCapDownloadWrap');
        if (wrap && !wrap.contains(e.target)) {
          menu.style.display = 'none';
          document.removeEventListener('click', _close);
        }
      });
    }, 10);
  }
}

function mekDownloadCapaianExcel() {
  var from = (document.getElementById('mekCapFrom')||{}).value||'';
  var to   = (document.getElementById('mekCapTo')||{}).value||'';
  var mode = { all:'Capaian', email:'Detail' };
  var modeStr = mode[window._mekCapMode||'all'] || '';
  var sub = (from && to ? _mekFmtTglDisplay(from) + ' s/d ' + _mekFmtTglDisplay(to) : 'Semua Periode') +
    (modeStr ? ' - ' + modeStr : '');
  _mekExportTableExcel('mekCapTbl', 'Capaian Planning Ekspor', sub);
}

// ════════════════════════════════════════════════════════════
// DOWNLOAD PDF
// ════════════════════════════════════════════════════════════
function mekDownloadPdf() {
  var data = _mekSummaryData;
  if (!data || !data.length) { showToast('Tidak ada data untuk di-download.', 'warning'); return; }

  var from = (document.getElementById('mekFilterFrom') || {}).value || '';
  var to   = (document.getElementById('mekFilterTo')   || {}).value || '';
  var periodeTxt = from && to ? _mekFmtTglDisplay(from) + ' s/d ' + _mekFmtTglDisplay(to) : 'Semua Periode';

  var rows = data.map(function (r, i) {
    var keluar = r.waktuKeluar && String(r.waktuKeluar).trim();
    return '<tr>' +
      '<td style="text-align:center;">' + (i+1) + '</td>' +
      '<td><b>' + _mekEsc(r.nopol||'-') + '</b></td>' +
      '<td>' + _mekEsc(r.ekspedisi||'-') + '</td>' +
      '<td>' + _mekEsc(_mekStripLeadingZero(r.noDoc)||'-') + '</td>' +
      '<td>' + _mekEsc(r.tujuan||'-') + '</td>' +
      '<td>' + _mekEsc(r.waktuDaftar||'-') + '</td>' +
      '<td>' + _mekEsc(r.waktuKeluar||'-') + '</td>' +
      '<td style="text-align:center;">' + (keluar?'KELUAR':'ANTRIAN') + '</td>' +
      '</tr>';
  }).join('');

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Monitoring Ekspor</title>' +
    '<style>body{font-family:Arial,sans-serif;font-size:11px;margin:20px;}' +
    'h2{font-size:14px;margin:0 0 2px;}p{margin:0 0 10px;font-size:10px;color:#666;}' +
    'table{width:100%;border-collapse:collapse;}' +
    'th{background:#1a3a5c;color:#fff;padding:6px 8px;font-size:10px;text-align:left;border:1px solid #0f2027;}' +
    'td{padding:5px 8px;border:1px solid #e2e8f0;vertical-align:middle;}' +
    'tr:nth-child(even)td{background:#f7fafc;}' +
    '@media print{body{margin:10px;}}</style></head><body>' +
    '<h2><i>Monitoring Ekspor — Data Antrian</i></h2>' +
    '<p>Periode: ' + periodeTxt + ' &nbsp;|&nbsp; Total: ' + data.length + ' kendaraan &nbsp;|&nbsp; Dicetak: ' + new Date().toLocaleString('id-ID') + '</p>' +
    '<table><thead><tr>' +
    '<th style="width:28px;">#</th><th>No. Pol</th><th>Ekspedisi</th><th>No. DOC</th>' +
    '<th>Tujuan</th><th>Waktu Daftar</th><th>Waktu Keluar</th><th>Status</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>' +
    '<script>window.onload=function(){window.print();}<\/script></body></html>';

  var win = window.open('', '_blank');
  if (!win) { showToast('Popup diblokir. Izinkan popup di browser.', 'error'); return; }
  win.document.write(html);
  win.document.close();
}

// ════════════════════════════════════════════════════════════
// DOWNLOAD EXCEL (CSV → .xls via data URI)
// ════════════════════════════════════════════════════════════
function mekDownloadExcel() {
  var data = _mekSummaryData;
  if (!data || !data.length) { showToast('Tidak ada data untuk di-download.', 'warning'); return; }

  var from = (document.getElementById('mekFilterFrom') || {}).value || '';
  var to   = (document.getElementById('mekFilterTo')   || {}).value || '';

  // BOM + header
  var BOM = '\uFEFF';
  var header = ['No','No. Pol','Ekspedisi','No. DOC','Tujuan','Waktu Daftar','Waktu Keluar','Status'];
  var csvRows = [header.join('\t')];

  data.forEach(function (r, i) {
    var keluar = r.waktuKeluar && String(r.waktuKeluar).trim();
    csvRows.push([
      i + 1,
      r.nopol       || '',
      r.ekspedisi   || '',
      _mekStripLeadingZero(r.noDoc || ''),
      r.tujuan      || '',
      r.waktuDaftar || '',
      r.waktuKeluar || '',
      keluar ? 'KELUAR' : 'ANTRIAN'
    ].map(function(v){ return '"' + String(v).replace(/"/g,'""') + '"'; }).join('\t'));
  });

  var content  = BOM + csvRows.join('\r\n');
  var blob     = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8' });
  var url      = URL.createObjectURL(blob);
  var filename = 'Monitoring_Ekspor_' + (from || 'all') + '_' + (to || 'all') + '.xls';

  var a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  showToast('File Excel berhasil diunduh.', 'success');
}

// ── Export tabel dari DOM ke Excel (universal) ───────────────
function _mekExportTableExcel(tableId, title, subtitle) {
  var tbl = document.getElementById(tableId);
  if (!tbl) { showToast('Tidak ada data.', 'warning'); return; }
  var rows = tbl.querySelectorAll('tr');
  if (!rows.length) { showToast('Tidak ada data.', 'warning'); return; }

  // Kumpulkan CSS computed style semua cell supaya format ikut
  // Pendekatan: clone tabel, inline semua style, wrap dalam HTML lengkap
  var clone = tbl.cloneNode(true);

  // Inline style dari computed style per cell
  var srcCells = tbl.querySelectorAll('th,td');
  var dstCells = clone.querySelectorAll('th,td');
  srcCells.forEach(function(src, i) {
    var cs  = window.getComputedStyle(src);
    var dst = dstCells[i];
    if (!dst) return;
    dst.style.backgroundColor = cs.backgroundColor;
    dst.style.color            = cs.color;
    dst.style.fontWeight       = cs.fontWeight;
    dst.style.textAlign        = cs.textAlign;
    dst.style.fontSize         = '9pt';
    dst.style.padding          = '3px 6px';
    dst.style.border           = '1px solid #d0d0d0';
    dst.style.whiteSpace       = 'nowrap';
    // Hapus elemen interaktif (button, input) dari clone
    dst.querySelectorAll('button,input').forEach(function(el){ el.remove(); });
  });

  clone.style.borderCollapse = 'collapse';
  clone.style.width          = '100%';
  clone.style.fontFamily     = 'Calibri, Arial, sans-serif';

  var html =
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
           'xmlns:x="urn:schemas-microsoft-com:office:excel" ' +
           'xmlns="http://www.w3.org/TR/REC-html40">' +
    '<head><meta charset="UTF-8">' +
    '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>' +
    '<x:ExcelWorksheet><x:Name>Data</x:Name>' +
    '<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>' +
    '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->' +
    '</head><body>' +
    '<h3 style="font-family:Calibri,Arial;font-size:13pt;margin:0 0 2px;">' + title + '</h3>' +
    (subtitle ? '<p style="font-family:Calibri,Arial;font-size:9pt;color:#718096;margin:0 0 8px;">' + subtitle + '</p>' : '') +
    clone.outerHTML +
    '</body></html>';

  var blob     = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  var url      = URL.createObjectURL(blob);
  var filename = (title||'export').replace(/[^a-zA-Z0-9_]/g,'_') + '_' + new Date().toISOString().slice(0,10) + '.xls';
  var a        = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
  showToast('File Excel berhasil diunduh.', 'success');
}

// ════════════════════════════════════════════════════════════
// TAB INPUT PLANNING — Parser teks WA
// ════════════════════════════════════════════════════════════

// State hasil parse
var _mekParsedRows = [];

// ── Inisialisasi (dipanggil mekInitPage) ─────────────────────
function _mekInitPlanningWa() {
  _mekParsedRows = [];
  _mekSiRows     = [];
  _mekEmailRows  = [];
  _mekPlanMode   = 'email';
  var ta = document.getElementById('mekWaTextarea');
  if (ta) ta.value = '';
  var tj = document.getElementById('mekWaTujuan');
  if (tj) { tj.value = ''; tj.style.borderColor = '#fc8181'; tj.style.background = '#fff5f5'; }
  _mekRenderPreview([]);
  mekSwitchPlanMode('wa');

  // Set tahun default
  var elYear = document.getElementById('mekWaYear');
  if (elYear && !elYear.value) elYear.value = new Date().getFullYear();
}

// ── Parse tombol ─────────────────────────────────────────────
function mekParseWa() {
  var ta     = document.getElementById('mekWaTextarea');
  var tujuan = ((document.getElementById('mekWaTujuan') || {}).value || '').trim();

  if (!ta || !ta.value.trim()) { showToast('Textarea kosong, paste dulu teks WA-nya.', 'warning'); return; }
  if (!tujuan) {
    showToast('Tujuan wajib diisi sebelum Parse!', 'error');
    var el = document.getElementById('mekWaTujuan');
    if (el) { el.focus(); el.style.borderColor = '#fc8181'; el.style.background = '#fff5f5'; }
    return;
  }

  var rows = _mekParseWaText(ta.value, tujuan);
  _mekParsedRows = rows;
  _mekRenderPreview(rows);

  var ct = document.getElementById('mekParseCount');
  if (ct) ct.textContent = rows.length + ' baris';

  if (rows.length) {
    showToast(rows.length + ' baris berhasil di-parse!', 'success');
    // Di mobile: otomatis pindah ke tab preview
    var toggle = document.getElementById('mekMobilePaneToggle');
    if (toggle && toggle.style.display !== 'none') mekMobilePane('preview');
  } else {
    showToast('Tidak ada data yang bisa di-parse. Periksa format teks.', 'warning');
  }
}

function mekClearWa() {
  var ta = document.getElementById('mekWaTextarea');
  if (ta) ta.value = '';
  var tj = document.getElementById('mekWaTujuan');
  if (tj) { tj.value = ''; tj.style.borderColor = '#fc8181'; tj.style.background = '#fff5f5'; }
  _mekParsedRows = [];
  _mekRenderPreview([]);
  var ct = document.getElementById('mekParseCount');
  if (ct) ct.textContent = '0 baris';
}

// ── Inti parser teks WA ──────────────────────────────────────
function _mekParseWaText(raw, tujuan) {
  var lines = raw.split('\n').map(function(l){ return l.trim(); });

  // ── 1. Deteksi week & tahun ──────────────────────────────
  // Dari input manual override, atau scan teks "week XX" / "week ke-XX"
  var overrideWeek = parseInt((document.getElementById('mekWaWeek') || {}).value) || 0;
  var overrideYear = parseInt((document.getElementById('mekWaYear') || {}).value) || 0;

  var detectedWeek = overrideWeek;
  var detectedYear = overrideYear || new Date().getFullYear();

  if (!detectedWeek) {
    for (var i = 0; i < lines.length; i++) {
      var wm = lines[i].match(/week\s*(?:ke[-\s]?)?\s*(\d{1,2})/i);
      if (wm) { detectedWeek = parseInt(wm[1]); break; }
    }
  }

  // ── 2. Map nama bulan → nomor ────────────────────────────
  var BULAN = {
    jan:'01', feb:'02', mar:'03', apr:'04', mei:'05', may:'05',
    jun:'06', jul:'07', agu:'08', aug:'08', sep:'09', okt:'10', oct:'10',
    nov:'11', des:'12', dec:'12'
  };

  function parseTanggal(str) {
    // Format: "11 Jun", "08 Jun", "10 Jun", "11 Jun 2025" dll
    // Juga handle angka saja jika ada konteks bulan sebelumnya
    var s = str.trim();
    var m = s.match(/^(\d{1,2})\s+([A-Za-z]{2,4})(?:\s+(\d{4}))?/);
    if (m) {
      var tgl  = ('0' + m[1]).slice(-2);
      var bKey = m[2].toLowerCase().substring(0, 3);
      var bln  = BULAN[bKey];
      if (!bln) return null;
      var yr   = m[3] ? m[3] : String(detectedYear);
      return yr + '-' + bln + '-' + tgl;
    }
    return null;
  }

  // ── 3. Scan baris per baris ──────────────────────────────
  var results = [];
  var curSku  = '';
  var curItem = '';
  var curKesanggupan = '';

  for (var li = 0; li < lines.length; li++) {
    var line = lines[li];
    if (!line) continue;

    // Bersihkan karakter unicode aneh (tanda bullet, zero-width space, dll)
    line = line.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '').trim();
    if (!line) continue;

    // SKU
    var skuM = line.match(/^sku\s*[:：]\s*(\S+)/i);
    if (skuM) {
      curSku  = skuM[1].trim();
      curItem = '';
      curKesanggupan = '';
      continue;
    }

    // ITEM
    var itemM = line.match(/^item\s*[:：]\s*(.+)/i);
    if (itemM) {
      curItem = itemM[1].trim();
      continue;
    }

    // Kesanggupan total (baris informatif, simpan sebagai catatan)
    var kesM = line.match(/^kesanggupan\s+(.+)/i);
    if (kesM) {
      curKesanggupan = kesM[1].trim();
      continue;
    }

    // Baris tanggal: "11 Jun : 3 cont" atau "11 Jun : 3 cont (catatan...)"
    // Juga handle "- 1 cont pm lama ..." sebagai catatan sub-baris → skip (bukan baris tanggal)
    if (/^[-•⁠*]/.test(line)) continue; // baris bullet → skip

    var tglLineM = line.match(/^(\d{1,2}\s+[A-Za-z]{2,4}(?:\s+\d{4})?)\s*[:：]\s*(.+)/i);
    if (tglLineM) {
      var tglStr = parseTanggal(tglLineM[1]);
      var rest   = tglLineM[2].trim();

      // Ambil jumlah cont: angka pertama sebelum "cont"
      var contM  = rest.match(/(\d+(?:[.,]\d+)?)\s*cont/i);
      var jumlah = contM ? contM[1].replace(',', '.') : '';

      // Ambil keterangan dalam kurung jika ada: "1 cont (tidak full qty container)"
      var ketM   = rest.match(/\(([^)]+)\)/);
      var ket    = ketM ? ketM[1].trim() : '';

      if (tglStr && curSku) {
        results.push({
          week:    detectedWeek ? String(detectedWeek) : '',
          tanggal: tglStr,
          sku:     curSku,
          nama:    curItem,
          jumlah:  jumlah,
          tujuan:  tujuan || '',
          ket:     ket,
          source:  'WA'
        });
      }
      continue;
    }
  }

  return results;
}

// ── Render tabel preview ─────────────────────────────────────
function _mekRenderPreview(rows) {
  var tbody = document.getElementById('mekPreviewTbody');
  if (!tbody) return;

  if (!rows || !rows.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:50px;color:#a0aec0;font-size:12px;">' +
      '<i class="fas fa-magic" style="font-size:28px;display:block;margin-bottom:10px;opacity:.2;"></i>' +
      'Paste teks WA lalu klik <b>Parse</b></td></tr>';
    return;
  }

  var html = '';
  rows.forEach(function(r, i) {
    html += '<tr>' +
      '<td style="text-align:center;color:#a0aec0;font-size:11px;font-weight:700;background:#f8fafc;">' + (i+1) + '</td>' +
      '<td style="text-align:center;">' +
        (r.week ? '<span style="background:#ebf8ff;color:#2b6cb0;border-radius:10px;padding:1px 8px;font-size:11px;font-weight:700;">W' + r.week + '</span>' : '<span style="color:#cbd5e0;">—</span>') +
      '</td>' +
      '<td style="white-space:nowrap;font-size:12px;">' + _mekEsc(_mekFmtTglDisplay(r.tanggal) || r.tanggal) + '</td>' +
      '<td><b style="font-size:12px;">' + _mekEsc(r.sku) + '</b></td>' +
      '<td style="font-size:12px;">' + _mekEsc(r.nama) + '</td>' +
      '<td style="text-align:right;font-weight:700;font-size:13px;">' + _mekEsc(r.jumlah || '—') + '</td>' +
      '<td style="font-size:12px;font-weight:600;color:#276749;">' + _mekEsc(r.tujuan || '—') + '</td>' +
      '<td style="font-size:11px;color:#718096;">' + _mekEsc(r.ket) + '</td>' +
      '<td style="text-align:center;">' +
        '<button onclick="_mekDeletePreviewRow(' + i + ')" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:11px;padding:3px 5px;">' +
        '<i class="fas fa-times"></i></button>' +
      '</td>' +
      '</tr>';
  });
  tbody.innerHTML = html;
}

function _mekDeletePreviewRow(idx) {
  _mekParsedRows.splice(idx, 1);
  _mekRenderPreview(_mekParsedRows);
  var ct = document.getElementById('mekParseCount');
  if (ct) ct.textContent = _mekParsedRows.length + ' baris';
}

// ── Simpan ke GAS ────────────────────────────────────────────
function mekSavePlanning() {
  var rows;
  if (_mekPlanMode === 'si') {
    rows = _mekSiRows;
  } else if (_mekPlanMode === 'email') {
    rows = _mekEmailInputMode === 'manual' ? _mekCollectManualRows() : _mekEmailRows;
  } else {
    rows = _mekParsedRows;
  }
  if (!rows || !rows.length) {
    var msg = _mekPlanMode === 'si'    ? 'Belum ada data SI. Upload PDF dulu.'
            : _mekPlanMode === 'email' ? (_mekEmailInputMode === 'manual' ? 'Isi tabel dulu.' : 'Belum ada data Email. Upload file dulu.')
            : 'Belum ada data. Parse dulu teks WA-nya.';
    showToast(msg, 'warning'); return;
  }

  var btnId = _mekPlanMode === 'si'    ? 'mekSiBtnSave'
            : _mekPlanMode === 'email' ? 'mekEmailBtnSave'
            : 'mekBtnSave';
  var btn = document.getElementById(btnId);
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...'; }

  // Fill down: baris lanjutan ambil week/tanggal/noSo/jumlah/tujuan dari baris pertama grup
  var lastFirst = null;
  var filledRows = rows.map(function(r) {
    if (r._isFirst !== false) { lastFirst = r; return r; }
    return Object.assign({}, r, {
      week:    lastFirst ? lastFirst.week    : r.week,
      tanggal: lastFirst ? lastFirst.tanggal : r.tanggal,
      noSo:    lastFirst ? lastFirst.noSo    : r.noSo,
      jumlah:  lastFirst ? lastFirst.jumlah  : r.jumlah,
      tujuan:  lastFirst ? lastFirst.tujuan  : r.tujuan,
      ket:     lastFirst ? lastFirst.ket     : r.ket,
    });
  });

  // Kirim weekOverride untuk Email (update logic di GAS)
  var weekOverride = '';
  if (_mekPlanMode === 'email') {
    weekOverride = ((document.getElementById('mekEmailWeek')||{}).value||'').trim();
  }

  var cleanRows = filledRows.map(function(r) {
    function san(v) {
      if (!v && v !== 0) return '';
      return String(v).replace(/[\r\n\t]/g,' ').replace(/[\x00-\x1f\x7f]/g,'').trim();
    }
    return { week:san(r.week), tanggal:san(r.tanggal), sku:san(r.sku), nama:san(r.nama),
      jumlah:san(r.jumlah)||'1', tujuan:san(r.tujuan), ket:san(r.ket),
      noSo:san(r.noSo), source:san(r.source)||'EMAIL',
      _isFirst:r._isFirst, _groupSize:r._groupSize };
  });
  API.run('saveMekPlanningData', { rows: cleanRows, weekOverride: weekOverride }, function (res) {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Simpan'; }
    if (res && res.success) {
      showToast(res.message || 'Berhasil disimpan!', 'success');
      if      (_mekPlanMode === 'si')    { _mekSiRows=[]; _mekRenderSiPreview([]); var dz=document.getElementById('mekSiDropZone'),rw=document.getElementById('mekSiResultWrap'); if(dz)dz.style.display=''; if(rw)rw.style.display='none'; var ct=document.getElementById('mekSiParseCount'); if(ct)ct.style.display='none'; }
      else if (_mekPlanMode === 'email') { mekClearEmail(); }
      else                               { mekClearWa(); }
    } else {
      showToast('Gagal: ' + (res && res.message ? res.message : 'error'), 'error');
    }
  }, function () {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Simpan'; }
    showToast('Koneksi gagal. Coba lagi.', 'error');
  });
}

// ════════════════════════════════════════════════════════════
// MOBILE PANE TOGGLE (paste ↔ preview)
// ════════════════════════════════════════════════════════════
function mekMobilePane(pane) {
  var pasteEl   = document.getElementById('mekPastePanel');
  var previewEl = document.getElementById('mekPreviewPanel');
  var tabPaste  = document.getElementById('mekMobileTabPaste');
  var tabPrev   = document.getElementById('mekMobileTabPreview');
  if (!pasteEl || !previewEl) return;

  var ac = '#1a3a5c';
  var in_ = '#718096';

  if (pane === 'paste') {
    pasteEl.style.display   = 'flex';
    previewEl.style.display = 'none';
    if (tabPaste) { tabPaste.style.color  = ac;  tabPaste.style.borderBottomColor  = ac; }
    if (tabPrev)  { tabPrev.style.color   = in_; tabPrev.style.borderBottomColor   = 'transparent'; }
    // Fokus textarea supaya keyboard muncul
    setTimeout(function(){ var ta = document.getElementById('mekWaTextarea'); if(ta) ta.focus(); }, 100);
  } else {
    pasteEl.style.display   = 'none';
    previewEl.style.display = 'flex';
    if (tabPaste) { tabPaste.style.color  = in_; tabPaste.style.borderBottomColor  = 'transparent'; }
    if (tabPrev)  { tabPrev.style.color   = ac;  tabPrev.style.borderBottomColor   = ac; }
  }
}

// ════════════════════════════════════════════════════════════
// TOGGLE MODE: WA / SI
// ════════════════════════════════════════════════════════════
var _mekPlanMode   = 'wa';  // 'wa' | 'si'
var _mekSiRows     = [];    // baris hasil parse SI
var _mekStdCache   = null;  // cache sheet STD {nama_lower: {sku, nama}}

// ── Load STD dari GAS sekali, cache di browser ───────────────
function _mekLoadStd(callback) {
  if (_mekStdCache) { callback(_mekStdCache); return; }
  API.run('getStandarPalet', {}, function(res) {
    _mekStdCache = {};
    ((res && res.data) || []).forEach(function(r) {
      var key = String(r.nama || '').toLowerCase().trim();
      if (key) _mekStdCache[key] = { sku: String(r.sku || ''), nama: String(r.nama || '') };
    });
    callback(_mekStdCache);
  }, function() { _mekStdCache = {}; callback({}); });
}

// ── Fuzzy match nama item SI ke sheet STD ────────────────────
// Strategi: tokenize kedua string → hitung token yang overlap → pilih skor tertinggi
function _mekFuzzyMatchStd(itemText, stdCache) {
  if (!itemText || !stdCache || !Object.keys(stdCache).length) return null;

  function normalize(s) {
    return s.toLowerCase()
      .replace(/\([^)]*\)/g, ' ')   // hapus kata dalam kurung: (BISCUITS) → spasi
      .replace(/[^a-z0-9\s]/g, ' ')  // hapus simbol lain
      .replace(/\s+/g, ' ').trim();
  }
  function tokenize(s) { return normalize(s).split(' ').filter(Boolean); }

  var qRaw    = tokenize(itemText);           // token dari PDF (tanpa kata kurung)
  var qFull   = itemText.toLowerCase()        // juga coba dengan kata kurung dipertahankan
    .replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim().split(' ').filter(Boolean);

  if (!qRaw.length) return null;

  var best = null, bestScore = 0;
  Object.keys(stdCache).forEach(function(key) {
    var kTokens = tokenize(key);
    if (!kTokens.length) return;

    // Skor 1: query tanpa kurung vs STD
    var hit1 = qRaw.filter(function(t){ return kTokens.indexOf(t) >= 0; }).length;
    var s1   = hit1 / Math.max(qRaw.length, kTokens.length);

    // Skor 2: query lengkap vs STD (token STD yg match di query)
    var hit2 = kTokens.filter(function(t){ return qFull.indexOf(t) >= 0; }).length;
    var s2   = hit2 / Math.max(qFull.length, kTokens.length);

    // Skor 3: berapa % token STD yang ada di query (recall)
    var recall = hit2 / kTokens.length;

    // Ambil skor terbaik dari ketiga cara
    var score = Math.max(s1, s2, recall * 0.9);
    if (score > bestScore) { bestScore = score; best = stdCache[key]; }
  });

  // Threshold 35% — lebih rendah karena sudah ada 3 cara hitung
  return bestScore >= 0.55 ? best : null;
}

// ════════════════════════════════════════════════════════════
// TOGGLE MODE: WA / SI
// ════════════════════════════════════════════════════════════
function mekSwitchPlanMode(mode) {
  mode = 'email';  // hanya email tersisa
  _mekPlanMode = mode;
  var waPanel    = document.getElementById('mekWaPanel');
  var siPanel    = document.getElementById('mekSiPanel');
  var emailPanel = document.getElementById('mekEmailPanel');
  var btnWa      = document.getElementById('mekPlanModeWa');
  var btnSi      = document.getElementById('mekPlanModeSi');
  var btnEmail   = document.getElementById('mekPlanModeEmail');
  var ac = '#1a3a5c', in_ = '#718096';

  if (waPanel)    waPanel.style.display    = mode === 'wa'    ? 'flex' : 'none';
  if (siPanel)    siPanel.style.display    = mode === 'si'    ? 'flex' : 'none';
  if (emailPanel) emailPanel.style.display = mode === 'email' ? 'flex' : 'none';

  [btnWa, btnSi, btnEmail].forEach(function(btn, i) {
    if (!btn) return;
    var isActive = (i===0&&mode==='wa')||(i===1&&mode==='si')||(i===2&&mode==='email');
    btn.style.color            = isActive ? ac  : in_;
    btn.style.borderBottomColor = isActive ? ac : 'transparent';
  });

  if (mode === 'si') {
    _mekLoadStd(function(){});
    document.addEventListener('paste', _mekGlobalSiPaste);
    setTimeout(function() {
      var dz = document.getElementById('mekSiDropZone');
      if (dz && dz.style.display !== 'none') { dz.setAttribute('tabindex','0'); dz.focus(); }
    }, 100);
  } else {
    document.removeEventListener('paste', _mekGlobalSiPaste);
  }

  if (mode === 'email') {
    _mekLoadStd(function(){});
    document.addEventListener('paste', _mekGlobalEmailPaste);
    var elYear = document.getElementById('mekEmailYear');
    if (elYear && !elYear.value) elYear.value = new Date().getFullYear();
    setTimeout(function() {
      var dz = document.getElementById('mekEmailDropZone');
      if (dz && dz.style.display !== 'none') { dz.setAttribute('tabindex','0'); dz.focus(); }
    }, 100);
  } else {
    document.removeEventListener('paste', _mekGlobalEmailPaste);
  }
}

function _mekGlobalSiPaste(e) {
  if (_mekPlanMode !== 'si') return;
  var tag = (e.target && e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  var items = (e.clipboardData || {}).items;
  if (!items) return;
  var hasImage = false;
  for (var i = 0; i < items.length; i++) {
    if (items[i].type && items[i].type.indexOf('image') === 0) { hasImage = true; break; }
  }
  if (!hasImage) return;
  mekHandleSiPaste(e);
}

// ════════════════════════════════════════════════════════════
// BY EMAIL — Upload/paste tabel planning dari email
// Format kolom: KETERANGAN|SO|QT|NEGARA|KODE(SKU)|MATERIAL|STUFFING DATE|QTY|STUFFING PLANT|NOTE
// 1 baris = 1 container
// ════════════════════════════════════════════════════════════
var _mekEmailRows = [];

function _mekGlobalEmailPaste(e) {
  if (_mekPlanMode !== 'email') return;
  var tag = (e.target && e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  var items = (e.clipboardData || {}).items;
  if (!items) return;
  for (var i = 0; i < items.length; i++) {
    if (items[i].type && items[i].type.indexOf('image') === 0) {
      mekHandleEmailPaste(e); return;
    }
  }
}

function mekHandleEmailPaste(e) {
  if (_mekEmailInputMode === 'manual') return;
  var tag = (e.target && e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || e.target.contentEditable === 'true') return;
  var items = (e.clipboardData || e.originalEvent && e.originalEvent.clipboardData || {}).items;
  if (!items) return;
  for (var i = 0; i < items.length; i++) {
    if (items[i].type && items[i].type.indexOf('image') === 0) {
      e.preventDefault();
      var file  = items[i].getAsFile();
      var ext   = file.type.split('/')[1] || 'png';
      var named = new File([file], 'email_' + Date.now() + '.' + ext, { type: file.type });
      mekHandleEmailFiles([named]);
      return;
    }
  }
}

function mekHandleEmailFiles(files) {
  if (!files || !files.length) return;
  var ALLOWED = ['application/pdf','image/png','image/jpeg','image/jpg','image/webp','image/gif'];
  var fileArr = Array.from(files).filter(function(f){
    return ALLOWED.indexOf(f.type) >= 0 || /\.(pdf|png|jpg|jpeg|webp|gif)$/i.test(f.name);
  });
  if (!fileArr.length) { showToast('Pilih file PDF atau gambar.', 'error'); return; }

  var dz = document.getElementById('mekEmailDropZone');
  var rw = document.getElementById('mekEmailResultWrap');
  if (dz) dz.style.display = 'none';
  if (rw) rw.style.display = 'block';

  var log = document.getElementById('mekEmailFileLog');
  if (log) log.innerHTML = '';
  _mekEmailRows = [];

  _mekLoadStd(function(stdCache) {
    var done = 0;
    fileArr.forEach(function(file) {
      _mekAddEmailLog(file.name, 'loading');
      var isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      if (isPdf) {
        _mekReadPdfText(file, function(text) {
          if (!text) { _mekUpdateEmailLog(file.name,'error','Gagal baca PDF'); done++; if(done===fileArr.length)_mekFinalizeEmail(); return; }
          _mekUpdateEmailLog(file.name,'parsing','Parsing tabel...');
          var rows = _mekParseEmailTable(text, stdCache);
          _mekEmailRows = _mekEmailRows.concat(rows);
          _mekUpdateEmailLog(file.name, rows.length?'ok':'warn', rows.length?rows.length+' baris':'Tidak ada data');
          done++; if(done===fileArr.length) _mekFinalizeEmail();
        });
      } else {
        _mekUpdateEmailLog(file.name,'parsing','OCR...');
        _mekFileToBase64(file, function(b64, mime) {
          if (!b64) { _mekUpdateEmailLog(file.name,'error','Gagal baca gambar'); done++; if(done===fileArr.length)_mekFinalizeEmail(); return; }
          _mekOcrImage({b64:b64, mime:mime}, function(ocrText) {
            if (!ocrText) { _mekUpdateEmailLog(file.name,'warn','OCR gagal'); done++; if(done===fileArr.length)_mekFinalizeEmail(); return; }
            var rows = _mekParseEmailTable(ocrText, stdCache);
            _mekEmailRows = _mekEmailRows.concat(rows);
            _mekUpdateEmailLog(file.name, rows.length?'ok':'warn', rows.length?rows.length+' baris':'Tidak ada data');
            done++; if(done===fileArr.length) _mekFinalizeEmail();
          });
        });
      }
    });
  });
}

// ======================================================
// MANUAL INPUT TABLE
// ======================================================
var _mekEmailInputMode = 'upload';

function mekEmailSwitchMode(mode) {
  _mekEmailInputMode = mode;
  var up  = document.getElementById('mekEmailUploadPanel');
  var man = document.getElementById('mekEmailManualPanel');
  var btnU = document.getElementById('mekEmailModeUpload');
  var btnM = document.getElementById('mekEmailModeManual');
  if (!up || !man) return;
  if (mode === 'upload') {
    up.style.display=''; man.style.display='none';
    if(btnU){btnU.style.color='#1a3a5c';btnU.style.borderBottomColor='#1a3a5c';}
    if(btnM){btnM.style.color='#718096';btnM.style.borderBottomColor='transparent';}
  } else {
    up.style.display='none'; man.style.display='';
    if(btnM){btnM.style.color='#1a3a5c';btnM.style.borderBottomColor='#1a3a5c';}
    if(btnU){btnU.style.color='#718096';btnU.style.borderBottomColor='transparent';}
    var tbody = document.getElementById('mekEmailManualTbody');
    if (tbody && !tbody.rows.length) mekEmailManualAddRow();
  // Apply SISTEM TABEL OK
  if (typeof _STOKInit === 'function') {
    _STOKInit({
      tblId:    'mekEmailManualTbl',
      tbodyId:  'mekEmailManualTbody',
      cols:     _MEK_MAN_COLS,
      autoCols: {},
      selClass: 'stok-sel',
      onAfterPaste: function(tr) {
        // Update nomor baris setelah paste
        var rows = document.getElementById('mekEmailManualTbody').rows;
        Array.from(rows).forEach(function(r, i){ if(r.cells[0]) r.cells[0].textContent = i+1; });
      }
    });
  }
  }
}

var _MEK_MAN_COLS = ['keterangan','so','qt','negara','kode','material','stuffing_date','qty','plant','ready','email','rsv_crt','po_sto','do_sto','note'];

function mekEmailManualAddRow(vals) {
  var tbody = document.getElementById('mekEmailManualTbody');
  if (!tbody) return;
  var idx = tbody.rows.length;
  var tr = document.createElement('tr');
  tr.dataset.idx = idx;
  var tdNum = document.createElement('td');
  tdNum.style.cssText = 'text-align:center;color:#a0aec0;font-size:11px;font-weight:700;background:#f8fafc;';
  tdNum.textContent = idx + 1;
  tr.appendChild(tdNum);
  _MEK_MAN_COLS.forEach(function(col, ci) {
    var td = document.createElement('td');
    td.contentEditable = 'true';
    td.dataset.col = col;
    td.style.cssText = 'outline:none;padding:5px 6px;font-size:12px;min-width:60px;white-space:nowrap;cursor:text;';
    td.style.textAlign = (col==='qty'||col==='rsv_crt') ? 'right' : 'left';
    if (vals && vals[col] !== undefined) td.textContent = vals[col];
    td.addEventListener('focus', function(){ td.style.background='#fffde7'; });
    td.addEventListener('blur',  function(){ td.style.background=''; });
    td.addEventListener('paste', function(e) {
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text');
      if (!text) return;
      var lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(Boolean);
      if (lines.length===1 && lines[0].indexOf('\t')<0) { document.execCommand('insertText',false,lines[0]); return; }
      lines.forEach(function(line, li) {
        var cellVals = line.split('\t');
        var targetRow;
        if (li===0) { targetRow=tr; }
        else { while(tbody.rows.length<=idx+li) mekEmailManualAddRow(); targetRow=tbody.rows[idx+li]; }
        cellVals.forEach(function(val,vi){
          var colIdx=ci+vi;
          if(colIdx>=_MEK_MAN_COLS.length) return;
          var cell=targetRow.querySelector('[data-col="'+_MEK_MAN_COLS[colIdx]+'"]');
          if(cell) cell.textContent=val.trim();
        });
      });
    });
    tr.appendChild(td);
  });
  var tdDel = document.createElement('td');
  tdDel.style.cssText = 'text-align:center;padding:2px;';
  var btn = document.createElement('button');
  btn.innerHTML = '<i class="fas fa-times"></i>';
  btn.style.cssText = 'background:none;border:none;color:#fc8181;cursor:pointer;font-size:11px;padding:3px 5px;';
  btn.onclick = function(){ tr.parentNode.removeChild(tr); Array.from(tbody.rows).forEach(function(r,i){r.cells[0].textContent=i+1;}); };
  tdDel.appendChild(btn);
  tr.appendChild(tdDel);
  tbody.appendChild(tr);
}

function mekEmailManualClear() {
  var tbody = document.getElementById('mekEmailManualTbody');
  if (tbody) tbody.innerHTML = '';
  mekEmailManualAddRow();
}

function _mekCollectManualRows() {
  var tbody = document.getElementById('mekEmailManualTbody');
  if (!tbody) return [];
  var weekOverride = parseInt((document.getElementById('mekEmailWeek')||{}).value||'')||0;
  var MONTHS = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,mei:5,agu:8,ags:8,okt:10,des:12};
  function parseTgl(s) {
    if (!s) return '';
    s = String(s).trim();
    var m = s.match(/^(\d{1,2})[\/.\-]([A-Za-z]{3})[\/.\-](\d{2,4})$/);
    if (m) { var mon=MONTHS[(m[2]||'').toLowerCase()]||0; if(!mon)return ''; var yr=m[3].length===2?'20'+m[3]:m[3]; return yr+'-'+('0'+mon).slice(-2)+'-'+('0'+m[1]).slice(-2); }
    var m2 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m2) return m2[3]+'-'+('0'+m2[2]).slice(-2)+'-'+('0'+m2[1]).slice(-2);
    return '';
  }
  function weekFromTgl(ymd) {
    if (!ymd) return '';
    var d=new Date(ymd+'T00:00:00Z'); var day=d.getUTCDay()||7;
    d.setUTCDate(d.getUTCDate()+4-day);
    var y0=new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return String(Math.ceil(((d-y0)/86400000+1)/7));
  }
  var rows = [];
  Array.from(tbody.rows).forEach(function(tr) {
    function g(col){ var el=tr.querySelector('[data-col="'+col+'"]'); return el?el.textContent.trim():''; }
    var so=g('so').replace(/\D/g,''), kode=g('kode').replace(/\D/g,'');
    if (!so && !kode) return;

    var tgl=parseTgl(g('stuffing_date'));
    var wk=weekOverride?String(weekOverride):weekFromTgl(tgl);
    var qty=parseInt(g('qty').replace(/\D/g,''))||0;

    // Baris SO kosong = barang tambahan dari container sebelumnya
    if (!so && kode && rows.length > 0) {
      var prev = rows[rows.length-1];
      // Hitung ITEM index (ITEM2, ITEM3, dst)
      var itemIdx = 2;
      while (prev.ket.indexOf('ITEM'+itemIdx+':') >= 0) itemIdx++;
      var itemStr = 'ITEM'+itemIdx+':'+kode+'|'+g('material')+'|'+(qty||'');
      prev.ket = prev.ket + ' | ' + itemStr;
      return;
    }

    var extra=[g('ready'),g('email'),g('rsv_crt'),g('po_sto'),g('do_sto'),g('note')]
      .map(function(v,i){var L=['READY','EMAIL','RSV','PO','DO','NOTE'];return v?L[i]+':'+v:'';}).filter(Boolean).join(' | ');
    var negara=g('negara').toUpperCase();
    var noQt=g('qt').replace(/\D/g,'');
    var soQtStr=[so?'SO:'+so:'',noQt?'QT:'+noQt:''].filter(Boolean).join(' | ');
    var qtyStr   = qty ? 'QTY_KRT:'+qty : '';
    var plantStr = g('plant') ? 'PLANT:'+g('plant').trim() : '';
    var ket=[soQtStr,g('keterangan'),extra,qtyStr,plantStr].filter(Boolean).join(' | ');
    rows.push({ week:wk, tanggal:tgl, sku:kode, nama:g('material'),
      jumlah:'1', tujuan:negara, ket:ket, noSo:so, qtyKrt:qty,
      source:'EMAIL', _isFirst:true, _groupSize:1 });
  });
  return rows;
}

// ======================================================
// CAPAIAN EMAIL - load dan render
// ======================================================
var _mekCapEmailData    = [];
var _mekCapEmailRowData = [];  // data per baris untuk popup detail
var _mekDitolakData     = {};  // rowidx → [{nopol,noContainer,waktuDaftar,waktuDitolak}] — untuk popup ditolak
var _mekCapEmailSummary = {};
var _mekCapEmailView    = 'plan';
var _mekCapEmailLastFrom = '';
var _mekCapEmailLastTo   = '';
var _mekCapEmailLastView = '';  // 'plan' | 'aktual'

function mekCapEmailSwitchView(view) {
  _mekCapEmailView = view;
  var btnP = document.getElementById('mekCapEmailByPlan');
  var btnA = document.getElementById('mekCapEmailByAktual');
  if (btnP) btnP.classList.toggle('active', view === 'plan');
  if (btnA) btnA.classList.toggle('active', view === 'aktual');
  // Re-render dari data yang sudah ada — tidak perlu reload GAS
  if (!_mekCapEmailData || !_mekCapEmailData.length) {
    mekLoadCapaian(); return;
  }
  var sku    = ((document.getElementById('mekCapSku')   ||{}).value||'').toLowerCase().trim();
  var doc    = ((document.getElementById('mekCapDoc')   ||{}).value||'').trim();
  var tujuan = ((document.getElementById('mekCapTujuan')||{}).value||'').toLowerCase().trim();
  if (view === 'aktual') {
    _mekRenderCapaianEmailAktual(_mekCapEmailData);
  } else {
    _mekRenderCapaianEmail(_mekCapEmailData, sku, doc, tujuan);
  }
}

// Badge status Capaian Planning
function _mekCapBadge(status, raw) {
  var r = (raw||status||'').toUpperCase();
  var sp = function(bg,cl,txt){ return '<span style="background:'+bg+';color:'+cl+';border-radius:8px;padding:2px 8px;font-size:10px;font-weight:700;">'+txt+'</span>'; };
  if (status==='keluar'  || r==='KELUAR')           return sp('#c6f6d5','#276749','Keluar');
  if (status==='gabung')                             return sp('#bee3f8','#2c5282','Digabung');
  if (status==='ditolak' || r==='DITOLAK')           return sp('#e53e3e','#fff','Ditolak');
  if (r==='TREATMENT')                               return sp('#d6bcfa','#44337a','Treatment');
  if (r==='MENUNGGU_SPM' || r==='MENUNGGU SPM')      return sp('#fefcbf','#744210','Menunggu SPE');
  if (r==='ANTRIAN')                                 return sp('#e2e8f0','#4a5568','Antrian');
  if (r==='START_LOADING' || r==='FINISH_LOADING')   return sp('#feebc8','#744210','Loading');
  if (status==='loading')                            return sp('#feebc8','#744210','Loading');
  if (status==='daftar')                             return sp('#bee3f8','#2b6cb0','Daftar');
  return sp('#fed7d7','#c53030','Belum');
}

function _mekRenderCapaianEmail(data, skuFilter, docFilter, tujFilter) {
  var tbody = document.getElementById('mekCapTbody');
  if (!tbody) return;
  if (!data || !data.length) {
    tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;padding:40px;color:#a0aec0;">Tidak ada data.</td></tr>';
    return;
  }
  skuFilter = (skuFilter||'').toLowerCase();
  docFilter = _mekStripLeadingZero(docFilter||'');
  tujFilter = (tujFilter||'').toLowerCase();

  var plantFilter  = ((document.getElementById('mekCapPlant')||{}).value||'').trim().toUpperCase();
  var statusFilter = mekGetStatusFilter('');

  var filtered = data;
  if (skuFilter || docFilter || tujFilter || plantFilter) {
    var validKey = {};
    data.forEach(function(r) {
      var k = (r.noSo && r.noSo !== 'undefined' ? r.noSo : 'sku:'+r.sku)+'|'+r.planTgl;
      var skuOk   = !skuFilter   || (r.sku||'').toLowerCase().indexOf(skuFilter)>=0 || (r.nama||'').toLowerCase().indexOf(skuFilter)>=0;
      var docOk   = !docFilter   || _mekStripLeadingZero(r.noSo||'').toLowerCase().indexOf(docFilter.toLowerCase())>=0;
      var tujOk   = !tujFilter   || (r.tujuan||'').toLowerCase().indexOf(tujFilter.toLowerCase())>=0;
      var plantOk = !plantFilter || _mekMatchPlant(r.plant, plantFilter, r);
      if (skuOk && docOk && tujOk && plantOk) validKey[k] = true;
    });
    filtered = data.filter(function(r){
      var k = (r.noSo && r.noSo !== 'undefined' ? r.noSo : 'sku:'+r.sku)+'|'+r.planTgl;
      return validKey[k];
    });
  }

  // Filter status per baris
  if (statusFilter.length && statusFilter.length < 4) {
    filtered = filtered.filter(function(r){ return _mekMatchStatus(r.status, statusFilter); });
  }

  _mekCapEmailRowData = [];
  var byDate={}, dateOrder=[];
  filtered.forEach(function(r){
    if (!byDate[r.planTgl]){byDate[r.planTgl]=[];dateOrder.push(r.planTgl);}
    byDate[r.planTgl].push(r);
  });
  dateOrder=dateOrder.filter(function(d,i){return dateOrder.indexOf(d)===i;});

  var CS='border-bottom:1px solid #e2e8f0;padding:6px 8px;font-size:12px;';
  var html='';

  dateOrder.forEach(function(planTgl){
    var rows=byDate[planTgl];
    // Hitung summary per tanggal dari rows yang sudah filtered
    var sum = {total:0, keluar:0, loading:0, daftar:0, belum:0, pendingan:0, gabung:0};
    rows.forEach(function(r){
      sum.total++;
      if(r.status==='keluar') sum.keluar++;
      else if(r.status==='gabung') sum.gabung++;   // sudah selesai (tergabung ke container lain) — TIDAK dihitung belum
      else if(r.status==='loading'||r.status==='daftar') sum.loading++;
      else sum.belum++;
      if(r.isPendingan) sum.pendingan++;
    });
    // % keluar: gabung dihitung sebagai "selesai" juga (bukan cuma status keluar literal)
    var pct = sum.total ? Math.round((sum.keluar+sum.gabung)/sum.total*100) : 0;

    html+='<tr style="background:#1a3a5c;"><td colspan="15" style="padding:0;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;color:#fff;font-size:12px;font-weight:700;flex-wrap:wrap;gap:4px;">' +
      '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
      '<span style="margin-right:4px;">' + _mekFmtTglDisplay(planTgl) + '</span>' +
      '<span style="background:rgba(255,255,255,.15);border-radius:10px;padding:2px 10px;font-size:11px;">Total: '+sum.total+' truk</span>' +
      '<span style="background:#48bb78;border-radius:10px;padding:2px 10px;font-size:11px;">' + sum.keluar + ' keluar</span>' +
      ((sum.loading+sum.daftar)?'<span style="background:#ed8936;border-radius:10px;padding:2px 10px;font-size:11px;">'+(sum.loading+sum.daftar)+' proses</span>':'') +
      (sum.belum?'<span style="background:#fc8181;border-radius:10px;padding:2px 10px;font-size:11px;">'+sum.belum+' belum</span>':'') +
      (sum.pendingan?'<span style="background:#f6d860;color:#744210;border-radius:10px;padding:2px 10px;font-size:11px;">'+sum.pendingan+' pendingan</span>':'') +
      (sum.gabung?'<span style="background:#bee3f8;color:#2c5282;border-radius:10px;padding:2px 10px;font-size:11px;">'+sum.gabung+' digabung</span>':'') +
      '</div>' +
      '<span style="font-size:11px;opacity:.8;white-space:nowrap;">'+pct+'% keluar</span>' +
      '</div></td></tr>';

    html+='<tr style="background:#2d4a6a;color:#bee3f8;font-size:11px;font-weight:700;">' +
      '<th style="padding:5px 8px;width:30px;">#</th><th style="padding:5px 8px;">NO SO</th>' +
      '<th style="padding:5px 8px;">SKU</th><th style="padding:5px 8px;">Nama Item</th>' +
      '<th style="padding:5px 8px;text-align:right;">Plan</th><th style="padding:5px 8px;">Tujuan</th>' +
      '<th style="padding:5px 8px;white-space:nowrap;">No Pol</th><th style="padding:5px 8px;white-space:nowrap;">No Container</th><th style="padding:5px 8px;white-space:nowrap;">Ekspedisi</th>' +
      '<th style="padding:5px 8px;">Waktu Daftar</th><th style="padding:5px 8px;">Proses Loading</th>' +
      '<th style="padding:5px 8px;">Waktu Keluar</th><th style="padding:5px 8px;">Status</th>' +
      '<th style="padding:5px 8px;">Tgl Aktual</th><th style="padding:5px 8px;">Keterangan</th></tr>';


    var rowNum=0;
    rows.forEach(function(r){
      // Tampilkan semua baris termasuk yang belum datang

      if(r.isFirstRow) rowNum++;
      var isPend=r.isPendingan;
      var isMaju=r.isMaju;
      var bg=isPend?'background:#fffff0;':(isMaju?'background:#f0fff4;':(r.status==='belum'?'background:#fff5f5;':''));
      var badge = _mekCapBadge(r.status, r.statusRaw);
      var ket = isPend ? '<span style="background:#f6d860;color:#744210;border-radius:6px;padding:1px 7px;font-size:10px;font-weight:700;margin-right:3px;">Delay dari tgl '+_mekFmtTglDisplay(r.pendinganDari)+'</span>'
              : isMaju ? '<span style="background:#c6f6d5;color:#276749;border-radius:6px;padding:1px 7px;font-size:10px;font-weight:700;margin-right:3px;">Tarik maju dari tgl '+_mekFmtTglDisplay(r.majuDari)+'</span>'
              : '';
      if (r.outOfPlanWeek) ket += '<span style="background:#e9d8fd;color:#553c9a;border-radius:6px;padding:1px 7px;font-size:10px;font-weight:700;">Dikirim di luar planning week '+r.outOfPlanWeek+'</span>';
      var noSoClean  = _mekStripLeadingZero(r.noSo||'');
      var hasDoc = !!noSoClean && !!(r.nopol||'').trim() && r.status !== 'belum';
      // ── Tandai Digabung — untuk baris "Belum" yang sebenarnya sudah dikirim tergabung
      // dalam container SKU lain di SO yang sama (1 truk bawa >1 SKU) ──
      if (r.status === 'gabung' && r.mergeInfo) {
        ket += '<span style="background:#bee3f8;color:#2c5282;border-radius:6px;padding:1px 7px;font-size:10px;font-weight:700;margin-right:3px;">Digabung dgn '+_mekEsc(r.mergeInfo.container||r.mergeInfo.nopol||'-')+'</span>'
             + '<button onclick="event.stopPropagation();mekShowMergePopup(\''+_mekEsc(noSoClean)+'\',\''+_mekEsc(r.sku||'')+'\',\''+_mekEsc(r.planTgl||r.tanggal||'')+'\')" title="Ubah/batalkan penggabungan" style="background:none;border:none;color:#a0aec0;cursor:pointer;padding:1px 3px;font-size:11px;">✏️</button>';
      } else if (r.isFirstRow && r.status === 'belum' && noSoClean) {
        ket += '<button onclick="event.stopPropagation();mekShowMergePopup(\''+_mekEsc(noSoClean)+'\',\''+_mekEsc(r.sku||'')+'\',\''+_mekEsc(r.planTgl||r.tanggal||'')+'\')" style="background:#edf2f7;border:1px solid #cbd5e0;color:#4a5568;cursor:pointer;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600;">🔗 Tandai Digabung</button>';
      }
      var editBtn = hasDoc
        ? '<button onclick="event.stopPropagation();mekStartEditRow(this,\''+_mekEsc(noSoClean)+'\',\''+_mekEsc(r.nopol||'')+'\',\''+_mekEsc(r.tglDaftar||'')+'\',\''+_mekEsc(r.nopol||'')+'\',\''+_mekEsc(r.noContainer||'')+'\',\''+_mekEsc(r.ekspedisi||'')+'\')" title="Edit No Pol / No Container / Ekspedisi" style="background:none;border:none;color:#a0aec0;cursor:pointer;padding:2px 4px;font-size:11px;">✏️</button>'
        : '';
      _mekCapEmailRowData.push({sku:r.sku,nama:r.nama,qty:r.qty||'',qt:r.qt||'',keterangan:r.keterangan||'',note:r.note||'',items:r.items||[]});
      var ditolakBadge = '';
      if (r.isFirstRow && r.ditolakList && r.ditolakList.length) {
        _mekDitolakData[_mekCapEmailRowData.length-1] = r.ditolakList;
        ditolakBadge = '<span onclick="event.stopPropagation();mekShowDitolakPopup('+(_mekCapEmailRowData.length-1)+')" title="Ada container ditolak, klik untuk detail" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#e53e3e;margin-left:5px;cursor:pointer;vertical-align:middle;"></span>';
      }
      html+='<tr style="'+bg+';cursor:pointer;" data-rowidx="'+(_mekCapEmailRowData.length-1)+'" onclick="mekShowRowDetail(this)">' +
        '<td style="'+CS+'text-align:center;color:#a0aec0;" data-edit-btn>'+( r.isFirstRow ? rowNum+'<br>'+editBtn : editBtn)+'</td>' +
        '<td style="'+CS+'font-weight:600;color:#2b6cb0;">'+(r.isFirstRow?(_mekEsc(r.noSo||'—')+ditolakBadge):'')+  '</td>' +
        '<td style="'+CS+'font-weight:700;">'+_mekEsc(r.sku||'')+'</td>' +
        '<td style="'+CS+'">'+_mekEsc(r.nama||'')+'</td>' +
        '<td style="'+CS+'text-align:right;font-weight:700;">'+(r.isFirstRow&&r.planCont?r.planCont:'')+'</td>' +
        '<td style="'+CS+'color:#276749;font-weight:600;">'+(r.isFirstRow?_mekEsc(r.tujuan||''):'')+'</td>' +
        '<td style="'+CS+'font-weight:600;" data-field="nopol">'+_mekEsc(r.nopol||'\u2014')+'</td>' +
        '<td style="'+CS+'font-size:11px;color:#4a5568;" data-field="noContainer">'+_mekEsc(r.noContainer||'\u2014')+'</td>' +
        '<td style="'+CS+'" data-field="ekspedisi">'+_mekEsc(r.ekspedisi||'\u2014')+'</td>' +
        '<td style="'+CS+'">'+_mekEsc(r.waktuDaftar||'\u2014')+'</td>' +
        '<td style="'+CS+'">'+_mekEsc(r.prosesLoading||'\u2014')+'</td>' +
        '<td style="'+CS+'">'+_mekEsc(r.waktuKeluar||'\u2014')+'</td>' +
        '<td style="'+CS+'">'+badge+'</td>' +
        '<td style="'+CS+'font-size:11px;color:#718096;">'+_mekEsc(r.tglDaftar?_mekFmtTglDisplay(r.tglDaftar):'\u2014')+'</td>' +
        '<td style="'+CS+'">'+ket+'</td>' +
        '</tr>';
    });
  });

  tbody.innerHTML = html;

  // Update summary cards (By Planning email)
  // Update summary cards (By Planning) — dari filtered supaya ikut filter aktif
  var nopolFilter = ((document.getElementById('mekCapNopol')||{}).value||'').toLowerCase().trim();
  var _tc=0,_kc=0,_lc=0,_dc=0,_gc=0,_ss={};
  var _planMap={}, _capMap={};
  // Pass 1: hitung totalCont dan init cap
  filtered.forEach(function(r){
    var _key = (r.noSo && r.noSo !== 'undefined' ? r.noSo : ('sku:'+r.sku)) + '|' + r.sku + '|' + r.planTgl;
    if(!_ss[_key] && r.isFirstRow){
      _ss[_key]=true;
      var jml = r.jumlahCont || r.planCont || 0;
      _tc += jml;
      _planMap[_key] = jml;
      _capMap[_key]  = jml;  // slot tersedia
    }
  });
  // Pass 2: hitung kc/lc/dc/gc dengan cap max jumlahCont per planning
  filtered.forEach(function(r){
    var _key = (r.noSo && r.noSo !== 'undefined' ? r.noSo : ('sku:'+r.sku)) + '|' + r.sku + '|' + r.planTgl;
    if (nopolFilter && (r.nopol||'').toLowerCase().indexOf(nopolFilter)<0) return;
    if (!_capMap[_key] || _capMap[_key] <= 0) return;  // sudah penuh, tidak hitung
    if(r.status==='keluar')  { _kc++; _capMap[_key]--; }
    else if(r.status==='gabung'){ _gc++; _capMap[_key]--; } // sudah selesai (tergabung) — jangan ikut "belum"
    else if(r.status==='loading'){ _lc++; _capMap[_key]--; }
    else if(r.status==='daftar' ){ _dc++; _capMap[_key]--; }
  });
  var _dtg = _kc+_lc+_dc+_gc;
  var _bc  = Math.max(0, _tc - _dtg);
  _mekSetCard('mekCapCardTotal',_tc);
  _mekSetCard('mekCapCardDatang',_dtg);
  _mekSetCard('mekCapCardKeluar',_kc);
  _mekSetCard('mekCapCardDaftar',_lc+_dc);
  _mekSetCard('mekCapCardBelum',_bc);
  var _cardGabung = document.getElementById('mekCapCardGabung');
  if(_cardGabung) _cardGabung.textContent = _gc;
  var _pe=document.getElementById('mekCapCardPct');
  if(_pe) _pe.textContent=_tc?Math.round((_kc+_gc)/_tc*100)+'%':'—';
}

// ======================================================
// ── Parser tabel Email ───────────────────────────────────────
// Header kolom: KETERANGAN|SO|QT|NEGARA|KODE|MATERIAL|STUFFING DATE|QTY|STUFFING PLANT|NOTE
// Deteksi header dulu, lalu parse baris per baris
var _MEK_EMAIL_COLS = ['keterangan','so','qt','negara','kode','material','stuffing_date','qty','plant','note'];

function _mekParseEmailTable(text, stdCache) {
  if (!text) return [];

  // ── Debug: tampilkan teks mentah OCR di file log ─────────
  console.log('[MEK-EMAIL RAW TEXT]\n' + text.slice(0, 1000));
  var logEl = document.getElementById('mekEmailFileLog');
  if (logEl) {
    var dbg = document.createElement('details');
    dbg.style.cssText = 'margin:6px 0;padding:6px;background:#fffff0;border:1px solid #f6d860;border-radius:8px;font-size:11px;';
    dbg.innerHTML = '<summary style="cursor:pointer;font-weight:700;color:#744210;">📧 Teks yang terbaca OCR (klik untuk buka)</summary>' +
      '<pre style="white-space:pre-wrap;word-break:break-all;max-height:200px;overflow:auto;margin:6px 0;padding:8px;background:#fff;border-radius:6px;font-size:10px;line-height:1.4;">' +
      text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').slice(0, 3000) + '</pre>';
    logEl.appendChild(dbg);
  }

  var lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n')
    .map(function(l){ return l.trim(); }).filter(Boolean);

  var rows = [];
  var weekOverride = parseInt((document.getElementById('mekEmailWeek')||{}).value||'') || 0;
  var yearOverride = parseInt((document.getElementById('mekEmailYear')||{}).value||'') || new Date().getFullYear();

  // Bulan map
  var MONTHS = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,mei:5,agu:8,ags:8,okt:10,des:12};

  function parseTgl(s) {
    if (!s) return '';
    s = String(s).trim();
    // dd-Mon-yy atau dd-Mon-yyyy: "08-Jun-26"
    var m = s.match(/^(\d{1,2})[\/\-.]([A-Za-z]{3})[\/\-.](\d{2,4})$/);
    if (m) {
      var mon = MONTHS[(m[2]||'').toLowerCase()] || 0;
      if (!mon) return '';
      var yr  = m[3].length === 2 ? '20' + m[3] : m[3];
      return yr + '-' + ('0'+mon).slice(-2) + '-' + ('0'+m[1]).slice(-2);
    }
    // dd/mm/yyyy
    var m2 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m2) return m2[3]+'-'+('0'+m2[2]).slice(-2)+'-'+('0'+m2[1]).slice(-2);
    return '';
  }

  // Cari header baris: harus ada kata STUFFING dan SO dan KODE/MATERIAL
  var headerIdx = -1;
  for (var h = 0; h < Math.min(lines.length, 10); h++) {
    var lup = lines[h].toUpperCase();
    if ((lup.indexOf('STUFFING') >= 0 || lup.indexOf('KODE') >= 0) &&
        (lup.indexOf('SO') >= 0 || lup.indexOf('MATERIAL') >= 0)) {
      headerIdx = h; break;
    }
  }
  // Jika header tidak ditemukan, coba parse buta (asumsi urutan kolom standar)
  var colMap = { keterangan:0, so:1, qt:2, negara:3, kode:4, material:5, stuffing_date:6, qty:7, plant:8, note:9 };

  if (headerIdx >= 0) {
    // Parse kolom dari header baris — pisah oleh tab atau multiple spaces
    var headers = lines[headerIdx].split(/\t+|\s{2,}/).map(function(s){ return s.trim().toLowerCase(); });
    headers.forEach(function(h, i) {
      if (/keterangan/.test(h))    colMap.keterangan   = i;
      else if (/^so$/.test(h))     colMap.so           = i;
      else if (/^qt$/.test(h))     colMap.qt           = i;
      else if (/negara/.test(h))   colMap.negara        = i;
      else if (/kode/.test(h))     colMap.kode          = i;
      else if (/material/.test(h)) colMap.material      = i;
      else if (/stuffing.*date|tanggal.*stuffing/.test(h)) colMap.stuffing_date = i;
      else if (/^qty$/.test(h))    colMap.qty           = i;
      else if (/plant|stuffing.*plant/.test(h)) colMap.plant = i;
      else if (/note|catatan/.test(h)) colMap.note      = i;
    });
  }

  // ── Pendekatan 2: parse baris per baris dengan regex pattern ─
  // Lebih robust untuk OCR yang tidak menghasilkan tab/spasi ganda konsisten
  // Pola per field:
  //   SO  = angka 9-12 digit (misal 102167393)
  //   QT  = angka 9-12 digit berbeda dari SO
  //   KODE = angka 6 digit (misal 421919, 422053)
  //   STUFFING DATE = dd-Mon-yy atau dd-Mon-yyyy
  //   QTY = angka 3-4 digit (1700, 1154, 1152)
  //   PLANT = JAYANTI 1/2/3, TANGERANG, dll
  //   NEGARA = kata INDIA/VIETNAM/MALAYSIA/CHINA dll
  //   MATERIAL = deskripsi produk uppercase panjang
  //   KETERANGAN = teks di awal baris (sebelum SO) atau kosong
  //   CANCEL = ada kata CANCEL di mana saja

  var NEGARA_LIST = ['INDIA','VIETNAM','MALAYSIA','CHINA','PHILIPPINES','MYANMAR',
                     'THAILAND','SINGAPORE','CAMBODIA','BANGLADESH','AFRICA','AUSTRALIA'];

  var dataStart = headerIdx >= 0 ? headerIdx + 1 : 0;

  for (var i = dataStart; i < lines.length; i++) {
    var line = lines[i];
    if (!line || line.length < 10) continue;
    // Skip baris yang pure header
    if (/^(keterangan|so|qt|negara|kode|material|stuffing|note)/i.test(line.trim())) continue;

    // 1. Cari SO (angka 9-12 digit, biasanya mulai 10/11/12)
    var soMatch = line.match(/\b(1\d{8,11})\b/g);
    if (!soMatch || soMatch.length < 1) continue;
    var so = soMatch[0];
    var qt = soMatch.length >= 2 ? soMatch[1] : '';

    // 2. Cari KODE (angka 6 digit, biasanya 4xxxxx)
    var kodeMatch = line.match(/\b([34]\d{5})\b/);
    var kode = kodeMatch ? kodeMatch[1] : '';

    // 3. Cari STUFFING DATE (dd-Mon-yy/yyyy)
    var tglMatch = line.match(/\b(\d{1,2})[\/\-]([A-Za-z]{3})[\/\-](\d{2,4})\b/);
    var tglRaw   = tglMatch ? tglMatch[0] : '';
    var tgl      = parseTgl(tglRaw);

    // 4. Cari QTY (angka 3-4 digit setelah tanggal, atau standalone)
    var qty = '';
    if (tglRaw) {
      var afterDate = line.slice(line.indexOf(tglRaw) + tglRaw.length);
      var qtyM = afterDate.match(/\b(\d{3,5})\b/);
      if (qtyM) qty = qtyM[1];
    }

    // 5. Cari NEGARA
    var negara = '';
    for (var n = 0; n < NEGARA_LIST.length; n++) {
      if (line.toUpperCase().indexOf(NEGARA_LIST[n]) >= 0) { negara = NEGARA_LIST[n]; break; }
    }

    // 6. Cari PLANT (JAYANTI 1/2/3 atau nama plant lain)
    var plantMatch = line.match(/\b(JAYANTI\s*\d|TANGERANG|KEJAYAN|CIBITUNG|BEKASI)\b/i);
    var plant = plantMatch ? plantMatch[0].trim() : '';

    // 7. Deteksi CANCEL
    var isCancel = /\bCANCEL\b/i.test(line);

    // 8. Ambil MATERIAL — panjang, uppercase, setelah KODE
    var material = '';
    if (kode) {
      var afterKode = line.slice(line.indexOf(kode) + kode.length).trim();
      // Material sampai sebelum tanggal atau sampai akhir baris sebelum angka qty/plant
      var matEnd = tglRaw ? afterKode.indexOf(tglRaw) : afterKode.length;
      if (matEnd < 0) matEnd = afterKode.length;
      material = afterKode.slice(0, matEnd)
        .replace(/^[A-Z]{2,}\s+/, '') // hapus negara di depan kalau ada
        .replace(/\s+/g, ' ').trim();
    }
    if (!material) {
      // Fallback: ambil uppercase panjang yang bukan angka
      var matMatch = line.match(/([A-Z][A-Z\s\d().\-]{10,}[A-Z\d])/);
      if (matMatch) material = matMatch[1].replace(/\s+/g,' ').trim();
    }

    // 9. KETERANGAN = teks sebelum SO (di kiri baris)
    var soIdx = line.indexOf(so);
    var ket   = soIdx > 2 ? line.slice(0, soIdx).replace(/\s+/g,' ').trim() : '';

    // Skip kalau tidak ada data minimal
    if (!so && !kode && !material) continue;

    var week = weekOverride
      ? String(weekOverride)
      : (tgl ? String(_mekDateToISOWeek(tgl)) : '');

    // Fuzzy match SKU
    var sku = kode && /^\d{5,6}$/.test(kode) ? kode : '';
    if (!sku && material && stdCache) {
      var matchStd = _mekFuzzyMatchStd(material, stdCache);
      if (matchStd) sku = matchStd.sku;
    }

    var source  = isCancel ? 'EMAIL_CANCEL' : 'EMAIL';
    var ketFull = [ket, (plant||'')].filter(function(s){ return s && s.length > 2; }).join(' | ');
    // Jangan duplikasi plant ke keterangan kalau sama persis
    if (ketFull === plant) ketFull = ket;

    rows.push({
      week:    week,
      tanggal: tgl,
      sku:     sku,
      nama:    material,
      jumlah:  '1',
      tujuan:  negara || '',
      ket:     ketFull,
      source:  source,
      _so:    so,
      _qt:    qt,
      _qty:   qty,
      _plant: plant,
      _cancel: isCancel
    });
  }
  return rows;
}

function _mekFinalizeEmail() {
  _mekRenderEmailPreview(_mekEmailRows);
  var ct = document.getElementById('mekEmailParseCount');
  if (ct) { ct.textContent = _mekEmailRows.length + ' baris'; ct.style.display = ''; }
  var clr = document.getElementById('mekEmailBtnClear');
  if (clr) clr.style.display = '';
  if (_mekEmailRows.length) showToast(_mekEmailRows.length + ' baris berhasil di-parse!', 'success');
  var fi = document.getElementById('mekEmailFileInput'); if (fi) fi.value = '';
}

function _mekRenderEmailPreview(rows) {
  var tbody = document.getElementById('mekEmailPreviewTbody');
  if (!tbody) return;
  if (!rows || !rows.length) {
    tbody.innerHTML = '<tr><td colspan="13" style="text-align:center;padding:40px;color:#a0aec0;">Tidak ada data</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(function(r, i) {
    var cancelStyle = r._cancel ? 'text-decoration:line-through;color:#9b2c2c;opacity:.7;' : '';
    var cancelBadge = r._cancel
      ? '<span style="background:#fed7d7;color:#9b2c2c;border-radius:8px;padding:1px 7px;font-size:10px;font-weight:700;margin-left:4px;">CANCEL</span>'
      : '';
    return '<tr style="' + (r._cancel ? 'background:#fff5f5;' : '') + '">' +
      '<td style="text-align:center;color:#a0aec0;font-size:11px;background:#f8fafc;">' + (i+1) + '</td>' +
      '<td style="text-align:center;">' + (r.week ? '<span style="background:#fefcbf;color:#744210;border-radius:10px;padding:1px 8px;font-size:11px;font-weight:700;">W'+r.week+'</span>' : '—') + '</td>' +
      '<td style="white-space:nowrap;font-size:12px;' + cancelStyle + '">' + _mekEsc(_mekFmtTglDisplay(r.tanggal)||r.tanggal||'—') + '</td>' +
      '<td><b style="font-size:12px;' + cancelStyle + '">' + _mekEsc(r.sku||'—') + '</b></td>' +
      '<td style="font-size:12px;' + cancelStyle + '">' + _mekEsc(r.nama||'—') + '</td>' +
      '<td style="font-size:12px;">' + _mekEsc(r.tujuan||'—') + '</td>' +
      '<td style="font-size:11px;font-family:monospace;color:#6b46c1;">' + _mekEsc(r._so||'—') + '</td>' +
      '<td style="font-size:11px;color:#718096;">' + _mekEsc(r._qt||'—') + '</td>' +
      '<td style="text-align:right;font-size:12px;">' + _mekEsc(r._qty||'—') + '</td>' +
      '<td style="font-size:11px;">' + _mekEsc(r._plant||'—') + '</td>' +
      '<td style="font-size:11px;color:#718096;">' + _mekEsc(r.ket||'—') + cancelBadge + '</td>' +
      '<td style="text-align:center;">' + (r._cancel
        ? '<span style="background:#fed7d7;color:#9b2c2c;border-radius:12px;padding:2px 8px;font-size:11px;font-weight:700;">CANCEL</span>'
        : '<span style="background:#c6f6d5;color:#276749;border-radius:12px;padding:2px 8px;font-size:11px;font-weight:700;">AKTIF</span>') +
      '</td>' +
      '<td style="text-align:center;"><button onclick="_mekDeleteEmailRow('+i+')" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:11px;padding:3px 5px;"><i class="fas fa-times"></i></button></td>' +
      '</tr>';
  }).join('');
}

function _mekDeleteEmailRow(idx) {
  _mekEmailRows.splice(idx, 1);
  _mekRenderEmailPreview(_mekEmailRows);
  var ct = document.getElementById('mekEmailParseCount');
  if (ct) ct.textContent = _mekEmailRows.length + ' baris';
}

function mekClearEmail() {
  _mekEmailRows = [];
  var dz  = document.getElementById('mekEmailDropZone');
  var rw  = document.getElementById('mekEmailResultWrap');
  var ct  = document.getElementById('mekEmailParseCount');
  var clr = document.getElementById('mekEmailBtnClear');
  var log = document.getElementById('mekEmailFileLog');
  if (dz)  dz.style.display  = '';
  if (rw)  rw.style.display  = 'none';
  if (ct)  ct.style.display  = 'none';
  if (clr) clr.style.display = 'none';
  if (log) log.innerHTML     = '';
  var tbody = document.getElementById('mekEmailPreviewTbody');
  if (tbody) tbody.innerHTML = '';
}

// ── File log Email ───────────────────────────────────────────
function _mekAddEmailLog(name, state) {
  var log = document.getElementById('mekEmailFileLog'); if (!log) return;
  var icons  = {loading:'fa-spinner fa-spin',parsing:'fa-robot',ok:'fa-check-circle',warn:'fa-exclamation-circle',error:'fa-times-circle'};
  var colors = {loading:'#a0aec0',parsing:'#2b6cb0',ok:'#276749',warn:'#744210',error:'#9b2c2c'};
  var div = document.createElement('div');
  div.id = 'mekEmailLog_'+name.replace(/[^a-z0-9]/gi,'_');
  div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px;border-bottom:1px solid #f0f0f0;';
  div.innerHTML = '<i class="fas '+(icons[state]||'fa-file')+'" style="color:'+(colors[state]||'#a0aec0')+';width:14px;"></i>'+
    '<span style="flex:1;font-weight:600;color:#2d3748;">'+_mekEsc(name)+'</span>'+
    '<span id="mekEmailLogMsg_'+name.replace(/[^a-z0-9]/gi,'_')+'" style="color:'+(colors[state]||'#a0aec0')+';font-size:11px;">'+state+'</span>';
  log.appendChild(div);
}

function _mekUpdateEmailLog(name, state, msg) {
  var icons  = {loading:'fa-spinner fa-spin',parsing:'fa-robot',ok:'fa-check-circle',warn:'fa-exclamation-circle',error:'fa-times-circle'};
  var colors = {loading:'#a0aec0',parsing:'#2b6cb0',ok:'#276749',warn:'#744210',error:'#9b2c2c'};
  var el  = document.getElementById('mekEmailLog_'+name.replace(/[^a-z0-9]/gi,'_')); if (!el) return;
  var ico = el.querySelector('i');
  var msgEl = document.getElementById('mekEmailLogMsg_'+name.replace(/[^a-z0-9]/gi,'_'));
  if (ico)   { ico.className = 'fas '+(icons[state]||'fa-file'); ico.style.color = colors[state]||'#a0aec0'; }
  if (msgEl) { msgEl.textContent = msg||state; msgEl.style.color = colors[state]||'#a0aec0'; }
}

// ════════════════════════════════════════════════════════════
// PANEL SI — Upload PDF atau Gambar (screenshot)
// ════════════════════════════════════════════════════════════

function mekHandleSiFiles(files) {
  if (!files || !files.length) return;

  // Tujuan boleh kosong — akan auto-fill dari DESTINATION di SI
  var tujuan = ((document.getElementById('mekSiTujuan') || {}).value || '').trim();

  var dz = document.getElementById('mekSiDropZone');
  var rw = document.getElementById('mekSiResultWrap');
  if (dz) dz.style.display = 'none';
  if (rw) rw.style.display = 'block';

  _mekSiRows = [];
  var fileLog = document.getElementById('mekSiFileLog');
  if (fileLog) fileLog.innerHTML = '';

  var ALLOWED = ['application/pdf','image/png','image/jpeg','image/jpg','image/webp','image/gif'];
  var fileArr = Array.from(files).filter(function(f){
    return ALLOWED.indexOf(f.type) >= 0 || /\.(pdf|png|jpg|jpeg|webp|gif)$/i.test(f.name);
  });
  if (!fileArr.length) { showToast('Pilih file PDF atau gambar (PNG/JPG/WEBP).', 'error'); return; }

  // Preload STD dulu, baru proses file
  _mekLoadStd(function(stdCache) {
    var done = 0;
    fileArr.forEach(function(file) {
      _mekAddSiFileStatus(file.name, 'loading');
      var isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

      if (isPdf) {
        _mekReadPdfText(file, function(text) {
          if (!text) {
            _mekUpdateSiFileStatus(file.name, 'error', 'Gagal baca PDF');
            done++; if (done === fileArr.length) _mekFinalizeSiRows();
            return;
          }
          _mekUpdateSiFileStatus(file.name, 'parsing', 'Menganalisis...');
          _mekParseSiText(text, null, tujuan, stdCache, function(rows, detectedTujuan) {
            _mekSiRows = _mekSiRows.concat(rows);
            if (detectedTujuan) _mekAutoFillTujuan(detectedTujuan);
            _mekUpdateSiFileStatus(file.name, rows.length ? 'ok' : 'warn',
              rows.length ? rows.length + ' baris' : 'Tidak ada data');
            done++; if (done === fileArr.length) _mekFinalizeSiRows();
          });
        });
      } else {
        _mekUpdateSiFileStatus(file.name, 'parsing', 'Menganalisis gambar...');
        _mekFileToBase64(file, function(b64, mimeType) {
          if (!b64) {
            _mekUpdateSiFileStatus(file.name, 'error', 'Gagal baca gambar');
            done++; if (done === fileArr.length) _mekFinalizeSiRows();
            return;
          }
          _mekParseSiText(null, {b64:b64, mime:mimeType}, tujuan, stdCache, function(rows, detectedTujuan) {
            _mekSiRows = _mekSiRows.concat(rows);
            if (detectedTujuan) _mekAutoFillTujuan(detectedTujuan);
            _mekUpdateSiFileStatus(file.name, rows.length ? 'ok' : 'warn',
              rows.length ? rows.length + ' baris' : 'Tidak ada data');
            done++; if (done === fileArr.length) _mekFinalizeSiRows();
          });
        });
      }
    });
  });
}

// ── Paste gambar via Ctrl+V di panel SI ─────────────────────
function mekHandleSiPaste(e) {
  var items = (e.clipboardData || e.originalEvent && e.originalEvent.clipboardData || {}).items;
  if (!items) return;

  var imageItem = null;
  for (var i = 0; i < items.length; i++) {
    if (items[i].type && items[i].type.indexOf('image') === 0) {
      imageItem = items[i];
      break;
    }
  }
  if (!imageItem) return; // bukan gambar, biarkan event berjalan normal

  e.preventDefault();
  var file = imageItem.getAsFile();
  if (!file) return;

  // Beri nama file untuk log
  var ext  = file.type.split('/')[1] || 'png';
  var named = new File([file], 'screenshot_' + Date.now() + '.' + ext, { type: file.type });
  mekHandleSiFiles([named]);
}

// ── Helper: file → base64 ────────────────────────────────────
function _mekFileToBase64(file, callback) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var dataUrl = e.target.result;
    var b64 = dataUrl.split(',')[1];
    callback(b64, file.type || 'image/jpeg');
  };
  reader.onerror = function() { callback(null, null); };
  reader.readAsDataURL(file);
}

// ── Auto-fill field Tujuan dari hasil parse ──────────────────
// Ambil kata terakhir yang berarti negara/kota (setelah koma atau kata terakhir)
function _mekAutoFillTujuan(dest) {
  var el = document.getElementById('mekSiTujuan');
  if (!el || el.value.trim()) return; // sudah diisi manual, jangan overwrite
  if (!dest) return;

  // Ekstrak: "TG. PRIOK, JKT - KATTUPALLI, INDIA" → "India"
  var dParts = dest.trim().split(/[,\-]\s*/);
  var last   = dParts[dParts.length - 1].trim().toUpperCase();

  el.value = last;
  el.style.borderColor = '#68d391';
  el.style.background  = '#f0fff4';
  showToast('Tujuan otomatis terisi: ' + last, 'success');
}
function _mekReadPdfText(file, callback) {
  if (!window.pdfjsLib) {
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = function() {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      _mekExtractPdfText(file, callback);
    };
    s.onerror = function() { callback(null); };
    document.head.appendChild(s);
  } else {
    _mekExtractPdfText(file, callback);
  }
}

function _mekExtractPdfText(file, callback) {
  var reader = new FileReader();
  reader.onload = function(e) {
    pdfjsLib.getDocument({ data: new Uint8Array(e.target.result) }).promise
    .then(function(pdf) {
      var ps = [];
      for (var p = 1; p <= pdf.numPages; p++) ps.push(pdf.getPage(p));
      return Promise.all(ps);
    })
    .then(function(pages) {
      return Promise.all(pages.map(function(page) {
        return page.getTextContent().then(function(tc) {
          // Sort item berdasarkan posisi Y (baris) lalu X (kolom kiri ke kanan)
          // PDF.js koordinat Y: makin besar = makin ke atas, jadi kita balik (negatif)
          var items = tc.items.slice().sort(function(a, b) {
            var ay = Math.round(a.transform[5] / 5) * 5; // snap ke grid 5pt
            var by = Math.round(b.transform[5] / 5) * 5;
            if (ay !== by) return by - ay; // Y besar = atas = duluan
            return a.transform[4] - b.transform[4]; // X kecil = kiri = duluan
          });
          // Gabungkan dengan newline kalau Y berubah signifikan (beda baris)
          var lines = [];
          var curY = null;
          var curLine = [];
          items.forEach(function(it) {
            if (!it.str.trim()) return; // skip spasi kosong
            var y = Math.round(it.transform[5] / 3) * 3;
            if (curY === null) curY = y;
            if (Math.abs(y - curY) > 3) {
              // Baris baru
              if (curLine.length) lines.push(curLine.join(' '));
              curLine = [it.str];
              curY = y;
            } else {
              curLine.push(it.str);
            }
          });
          if (curLine.length) lines.push(curLine.join(' '));
          return lines.join('\n');
        });
      }));
    })
    .then(function(texts) { callback(texts.join('\n')); })
    .catch(function() { callback(null); });
  };
  reader.onerror = function() { callback(null); };
  reader.readAsArrayBuffer(file);
}

// ── Parse SI via Claude API (text atau image) ────────────────
function _mekParseSiText(text, image, tujuan, stdCache, callback) {
  var weekOverride = ((document.getElementById('mekSiWeek') || {}).value || '').trim();

  // ── Jika gambar: OCR dulu dengan Tesseract.js, lalu parse teks ──
  if (image && !text) {
    _mekOcrImage(image, function(ocrText) {
      if (!ocrText || ocrText.length < 20) { callback([]); return; }
      // DEBUG: tampilkan teks OCR di console agar bisa dicek
      console.log('[MEK-OCR RAW TEXT]\n' + ocrText);
      _mekParseSiText(ocrText, null, tujuan, stdCache, callback);
    });
    return;
  }

  // ── Parse teks SI dengan regex ─────────────────────────────
  if (!text) { callback([]); return; }

  console.log('[MEK-PARSE INPUT TEXT]\n' + text.slice(0, 500));
  var result = _mekRegexParseSi(text, weekOverride);
  console.log('[MEK-PARSE RESULT]', JSON.stringify(result));
  if (!result) { callback([], ''); return; }

  var tgl        = result.tanggal;
  var noSo       = result.noSo;
  var jumlahCont = result.jumlahCont;
  var dest       = result.destination;

  // Week: dari override input, atau hitung otomatis dari tanggal stuffing
  var week = weekOverride || '';
  if (!week && tgl) {
    var w = _mekDateToISOWeek(tgl);
    if (w) week = String(w);
  }

  // Tujuan pendek: ambil kata terakhir setelah koma/dash terakhir → UPPERCASE
  // "TG. PRIOK, JKT - KATTUPALLI, INDIA" → "INDIA"
  // "CAT LAI, HO CHI MINH - VIETNAM" → "VIETNAM"
  var destShort = dest;
  if (dest) {
    var dParts = dest.split(/[,\-]\s*/);
    destShort = dParts[dParts.length - 1].trim().toUpperCase();
  }

  // Deduplikasi sudah dilakukan di _mekRegexParseSi
  var uniqueItems = result.items;

  var finalTujuan = tujuan || destShort;
  var rows = uniqueItems.map(function(it, idx) {
    var match  = _mekFuzzyMatchStd(it.desc, stdCache);
    var sku    = match ? match.sku  : '';
    var nama   = it.desc;  // selalu pakai nama dari PDF/SI
    var qtyStr = String(it.qty || '') + (it.unit ? ' ' + it.unit : '');
    var isFirst = (idx === 0);
    return {
      week:       isFirst ? week    : '',
      tanggal:    isFirst ? tgl     : '',
      sku:        sku,
      noSo:       isFirst ? noSo   : '',
      nama:       nama,
      jumlah:     isFirst ? String(jumlahCont) : '',
      tujuan:     isFirst ? finalTujuan : '',
      ket:        isFirst ? (noSo ? 'SO:' + noSo + (dest ? ' | ' + dest : '') : dest) : '',
      _qtyKar:    qtyStr,
      _noSo:      noSo,
      _desc:      it.desc,
      _isFirst:   isFirst,
      _groupSize: uniqueItems.length,
      source:     'SI'
    };
  });

  callback(rows, destShort);
}

// ── Regex parser untuk teks SI (format PT. Mayora Indah) ─────
function _mekRegexParseSi(text, weekOverride) {
  if (!text) return null;

  // Normalisasi whitespace, hapus karakter zero-width
  var t = text.replace(/[\u200B-\u200D\uFEFF]/g, '')
              .replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 1. Tanggal stuffing — berbagai format
  var tanggal = '';
  var _MONTHS = {january:1,february:2,march:3,april:4,may:5,june:6,
                 july:7,august:8,september:9,october:10,november:11,december:12};

  // Format: "STUFFING : JAYANTI 2/KITE 05.06.2026" atau "Stuffing Date : 06 June 2026"
  var stuffM = t.match(/(?:STUFFING|Stuffing\s*Date)\s*[:：]\s*[^\n]*?(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/i);
  if (!stuffM) {
    // "Stuffing Date : 06 June 2026" (bulan nama)
    var stuffText = t.match(/(?:STUFFING|Stuffing\s*Date)\s*[:：]\s*[^\n]*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
    if (stuffText) {
      var mNum = _MONTHS[(stuffText[2]||'').toLowerCase()] || 0;
      if (mNum) tanggal = stuffText[3]+'-'+('0'+mNum).slice(-2)+'-'+('0'+stuffText[1]).slice(-2);
    }
  }
  if (!tanggal && stuffM) {
    tanggal = stuffM[3] + '-' + ('0'+stuffM[2]).slice(-2) + '-' + ('0'+stuffM[1]).slice(-2);
  }
  // Fallback: ETD atau Stuffing Date sebagai tanggal kalau semua gagal
  if (!tanggal) {
    var etdM = t.match(/\bETD\s*[:：]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
    if (etdM) {
      var mNum2 = _MONTHS[(etdM[2]||'').toLowerCase()] || 0;
      if (mNum2) tanggal = etdM[3]+'-'+('0'+mNum2).slice(-2)+'-'+('0'+etdM[1]).slice(-2);
    }
  }
  // Fallback: cari tanggal standalone dd.MM.yyyy
  if (!tanggal) {
    var tglM = t.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);
    if (tglM) tanggal = tglM[3]+'-'+('0'+tglM[2]).slice(-2)+'-'+('0'+tglM[1]).slice(-2);
  }

  // 2. NO SO: beberapa format:
  //    "SO : 102167499" — format biasa
  //    "SO\n010260500842" — PDF 2-kolom (label kiri, nilai kanan, sort by Y)
  var noSo = '';
  var soM = t.match(/\bSO\s*[:：]\s*(\d+)/i);
  if (soM) {
    noSo = soM[1].trim();
  } else {
    // Format 2-kolom: cari label SO, lalu pasangkan dengan nilai di blok label-value
    // Pattern: [ETD, Plant Stuffing, Liner, Quotation, SO] + [val1, val2, val3, val4, val5]
    var lblBlock = t.match(/((?:(?:ETD|Plant\s*Stuffing|Liner|Quotation|SO|EO\s*Portal)\s*\n)+)/i);
    if (lblBlock) {
      var labels = lblBlock[0].trim().split(/\n/).map(function(s){return s.trim();}).filter(Boolean);
      var soLabelIdx = -1;
      labels.forEach(function(l,i){ if (/^SO$/i.test(l)) soLabelIdx = i; });
      if (soLabelIdx >= 0) {
        // Ambil nilai-nilai setelah blok label — urutan sama dengan label
        var afterBlock = t.slice(t.indexOf(lblBlock[0]) + lblBlock[0].length);
        var vals = afterBlock.split(/\n/).map(function(s){return s.trim();}).filter(Boolean);
        if (vals[soLabelIdx]) noSo = vals[soLabelIdx].replace(/\D/g,'').slice(0, 15);
      }
    }
    // Fallback: cari angka 9+ digit setelah kata SO dalam 300 char, ambil terakhir
    if (!noSo) {
      var soIdx = t.search(/\bSO\b/i);
      if (soIdx >= 0) {
        var nums = t.slice(soIdx, soIdx+300).match(/\d{9,}/g);
        if (nums) noSo = nums[nums.length - 1]; // angka terakhir = SO (bukan Quotation)
      }
    }
  }

  // 3. NO. CONT — berbagai pola:
  //    "NO. CONT : 2X40HC CONTAINER"
  //    "2X40HC CONTAINER"
  //    "2 X 40HC CONTAINER"
  //    "2X40' CONTAINER"
  //    "NO CONT : 2 X 40HC"
  var jumlahCont = 0;

  // Pola 1: label "NO. CONT : 2X40HC" atau "NO CONT : 2X40HC"
  var contLabel = t.match(/NO\.?\s*CONT\s*[:：]\s*(\d+)\s*[xX×]/i);
  if (contLabel) jumlahCont = parseInt(contLabel[1]) || 0;

  // Pola 2: "Jumlah Container : 1XCONTAINER" atau "Jumlah Container 1XCONTAINER" (titik dua optional)
  if (!jumlahCont) {
    var contJml = t.match(/Jumlah\s*Container\s*[:：]?\s*(\d+)/i);
    if (contJml) jumlahCont = parseInt(contJml[1]) || 0;
  }

  // Pola 3: "NXhh HC CONTAINER", "2X40HC CONTAINER", "1XCONTAINER 40 HC FT"
  if (!jumlahCont) {
    var contHc = t.match(/(\d+)\s*[xX×]\s*(?:CONTAINER\s+)?\d*['"]?\s*(?:HC|GP|OT|FR|RF|FT)/i);
    if (contHc) jumlahCont = parseInt(contHc[1]) || 0;
  }

  // Pola 4: "N CONTAINER" saja
  if (!jumlahCont) {
    var contSimple = t.match(/(\d+)\s*(?:UNIT\s*)?CONTAINER/i);
    if (contSimple) jumlahCont = parseInt(contSimple[1]) || 0;
  }

  // 4. DESTINATION
  var dest = '';
  var destMatches = t.match(/DESTINATION\s*[:：]\s*([^\n]+)/gi);
  if (destMatches) {
    for (var d = destMatches.length - 1; d >= 0; d--) {
      var dv = destMatches[d].replace(/^DESTINATION\s*[:：]\s*/i, '').trim();
      if (dv.length > 2) { dest = dv; break; }
    }
  }

  // 5. Items dari tabel: pola "NO  QTY  UNIT  DESCRIPTION"
  // Kumpulkan RAW dulu, lalu deduplikasi berdasarkan desc
  var rawItems = [];

  function _cleanDesc(raw) {
    return raw.trim().replace(/\s+/g, ' ')
              .replace(/\s+[\d.,]+\s+[\d.,]+\s*$/, '')
              .replace(/\s*\d+[.,]\d+\s*$/, '')
              .trim();
  }
  function _normKey(s) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 25);
  }

  // Pattern item: nomor baris + optional kolom extra (DO Portal) + qty + unit + desc
  // Handle: "1  1.250  KAR  ROMA..." dan "1  01195/DO-SHP/05/2026/MYOR  1.250  KAR  ROMA..."
  var itemRegex = /(?:^|\n)\s*\d+\s+(?:\S+\/\S+\s+)?(\d[\d.,]*)\s+(CAR|KAR|CTN|PCS|BOX|SET|UNIT|KG|PC)\s+([^\n]+)/gi;
  var im;
  while ((im = itemRegex.exec(t)) !== null) {
    var qty  = parseFloat(im[1].replace(/\./g,'').replace(',','.')) || 0;
    var unit = im[2].toUpperCase();
    var desc = _cleanDesc(im[3]);
    if (desc.length > 3) rawItems.push({ qty: qty, unit: unit, desc: desc });
  }

  if (!rawItems.length) {
    var looseRegex = /(?:^|\n)\s*\d+\s+(?:\S+\/\S+\s+)?(\d[\d.,]*)\s+(\w{2,5})\s+([A-Z][A-Z\s\d().\/]+)/gm;
    while ((im = looseRegex.exec(t)) !== null) {
      var qty2  = parseFloat(im[1].replace(/\./g,'').replace(',','.')) || 0;
      var unit2 = im[2].toUpperCase();
      var desc2 = _cleanDesc(im[3]);
      if (desc2.length > 5 && qty2 > 0) rawItems.push({ qty: qty2, unit: unit2, desc: desc2 });
    }
  }

  // Cek apakah semua baris item identik (format SI lama: 1 item repeat N kali = N cont)
  var freqMap = {}, firstItem = {};
  rawItems.forEach(function(it) {
    var k = _normKey(it.desc);
    if (!freqMap[k]) { freqMap[k] = 0; firstItem[k] = it; }
    freqMap[k]++;
  });
  var uniqueDescCount = Object.keys(freqMap).length;

  var items;
  if (uniqueDescCount === 1 && rawItems.length > 1) {
    // Format lama: semua baris identik → tampilkan SEMUA baris (masing-masing = 1 item)
    // jumlahCont total dari header, tidak dipecah per baris
    if (!jumlahCont) jumlahCont = rawItems.length;
    items = rawItems; // tampilkan semua, tidak deduplikasi
  } else {
    // Format multi-item: tiap baris = item berbeda
    // Deduplikasi hanya kalau desc PERSIS sama (handle OCR baca baris 2x)
    var seenExact = {};
    items = [];
    rawItems.forEach(function(it) {
      if (!seenExact[it.desc]) { seenExact[it.desc] = true; items.push({ qty: it.qty, unit: it.unit, desc: it.desc }); }
    });
  }

  if (!tanggal && !noSo && !items.length) return null;

  return {
    tanggal:     tanggal,
    noSo:        noSo,
    jumlahCont:  jumlahCont,
    destination: dest,
    items:       items
  };
}

// ── OCR gambar via GAS (Gemini/Drive) ─────────────────────
function _mekOcrImage(image, callback) {
  if (!image || !image.b64) { callback(null); return; }
  var logs = document.querySelectorAll('[id^="mekEmailLogMsg_"],[id^="mekSiLogMsg_"]');
  function setLog(msg) { if (logs.length) logs[logs.length-1].textContent = msg; }
  setLog('OCR via GAS...');
  _mekResizeImgB64(image.b64, image.mime, 1200, function(b64r, mimer) {
    console.log('[MEK-OCR] size:', Math.round(b64r.length/1024), 'KB');
    API.run('ocrImageEmail', { b64: b64r, mimeType: mimer }, function(res) {
      if (res && res.success && res.text && res.text.trim().length > 5) {
        setLog('OCR selesai');
        callback(res.text);
      } else {
        var msg = (res && res.message) ? res.message : 'OCR gagal';
        setLog(msg);
        showToast('OCR gagal: ' + msg, 'error');
        callback(null);
      }
    });
  });
}

// Resize gambar via Canvas sebelum kirim ke GAS
function _mekResizeImgB64(b64, mime, maxPx, cb) {
  try {
    var img = new Image();
    img.onload = function() {
      var w = img.width, h = img.height;
      var s = Math.min(1, maxPx / Math.max(w, h, 1));
      var cv = document.createElement('canvas');
      cv.width = Math.round(w*s); cv.height = Math.round(h*s);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      var out = cv.toDataURL('image/jpeg', 0.85);
      cb(out.split(',')[1], 'image/jpeg');
    };
    img.onerror = function() { cb(b64, mime); };
    img.src = 'data:' + mime + ';base64,' + b64;
  } catch(e) { cb(b64, mime); }
}

// ── Finalize: render tabel SI ────────────────────────────────
function _mekFinalizeSiRows() {
  _mekRenderSiPreview(_mekSiRows);
  var ct = document.getElementById('mekSiParseCount');
  if (ct) { ct.textContent = _mekSiRows.length + ' baris'; ct.style.display = ''; }
  if (_mekSiRows.length) showToast(_mekSiRows.length + ' baris dari SI berhasil di-parse!', 'success');
  var cb = document.getElementById('mekSiClearBtn'); if (cb) cb.style.display = '';
  var fi = document.getElementById('mekSiFileInput'); if (fi) fi.value = '';
}

function _mekRenderSiPreview(rows) {
  var tbody = document.getElementById('mekSiPreviewTbody');
  if (!tbody) return;
  if (!rows || !rows.length) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:30px;color:#a0aec0;">Tidak ada data</td></tr>';
    return;
  }
  // Hitung nomor grup untuk penomoran baris pertama
  var groupNums = [], gNum = 0;
  rows.forEach(function(r) { if (r._isFirst !== false || r._groupSize === undefined) gNum++; groupNums.push(gNum); });

  var ES = 'outline:none;min-width:40px;display:inline-block;border-radius:4px;padding:1px 3px;transition:background .15s;cursor:text;';

  tbody.innerHTML = rows.map(function(r, i) {
    var skuOk   = r.sku && r.sku !== r._desc;
    var isFirst = r._isFirst !== false;
    var contStyle = !isFirst ? 'border-left:3px solid #bee3f8;' : '';
    var skuColor  = skuOk ? '#2d3748' : '#e53e3e';
    var skuVal    = _mekEsc(r.sku || '');
    var namaVal   = _mekEsc(r.nama || '');
    var warnIcon  = !skuOk
      ? '<i class="fas fa-exclamation-triangle" style="color:#f6ad55;font-size:10px;margin-left:3px;" title="Isi SKU manual"></i>'
      : '';

    return '<tr style="' + (!isFirst ? 'background:#f7faff;' : '') + '">' +
      '<td style="text-align:center;color:#a0aec0;font-size:11px;font-weight:700;background:#f8fafc;' + contStyle + '">' + (isFirst ? groupNums[i] : '') + '</td>' +
      '<td style="text-align:center;">' +
        (isFirst ? (r.week ? '<span style="background:#ebf8ff;color:#2b6cb0;border-radius:10px;padding:1px 8px;font-size:11px;font-weight:700;">W'+r.week+'</span>' : '<span style="color:#cbd5e0;">—</span>') : '') +
      '</td>' +
      '<td style="white-space:nowrap;font-size:12px;">' + (isFirst ? _mekEsc(_mekFmtTglDisplay(r.tanggal)||r.tanggal) : '') + '</td>' +
      '<td style="font-size:12px;font-weight:600;color:#2d3748;">' + (isFirst ? _mekEsc(r.noSo||'—') : '') + '</td>' +
      '<td data-idx="'+i+'" data-field="sku" contenteditable="true" ' +
        'style="'+ES+'font-size:12px;font-weight:700;color:'+skuColor+';" ' +
        'onblur="_mekSiEditCell(' + i + ',\'sku\',this.innerText.trim())" ' +
        'onkeydown="if(event.key===\'Enter\'){event.preventDefault();this.blur();}" ' +
        'title="Klik untuk edit SKU">' + skuVal + '</td>' +
      (skuOk ? '<td style="display:none"></td>' : '<td style="padding:0;vertical-align:middle;">' + warnIcon + '</td>') +
      '<td data-idx="'+i+'" data-field="nama" contenteditable="true" ' +
        'style="'+ES+'font-size:12px;" ' +
        'onblur="_mekSiEditCell(' + i + ',\'nama\',this.innerText.trim())" ' +
        'onkeydown="if(event.key===\'Enter\'){event.preventDefault();this.blur();}" ' +
        'title="Klik untuk edit nama">' + namaVal + '</td>' +
      '<td style="text-align:right;font-weight:700;font-size:13px;">' + (isFirst ? _mekEsc(r.jumlah||'—') : '') + '</td>' +
      '<td style="font-size:12px;font-weight:600;color:#276749;">' + (isFirst ? _mekEsc(r.tujuan||'—') : '') + '</td>' +
      '<td style="font-size:11px;color:#718096;">' + (isFirst ? _mekEsc(r.ket) : '') + '</td>' +
      '<td style="text-align:center;">' +
        (isFirst ? '<button onclick="_mekDeleteSiGroup('+i+')" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:11px;padding:3px 5px;"><i class="fas fa-times"></i></button>' : '') +
      '</td>' +
      '</tr>';
  }).join('');
}

// Update _mekSiRows saat cell di-edit langsung di tabel
function _mekSiEditCell(idx, field, val) {
  if (!_mekSiRows[idx]) return;
  if (!val || val === _mekSiRows[idx][field]) return; // tidak ada perubahan
  _mekSiRows[idx][field] = val;
  // Kalau SKU diisi, hapus warning — re-render ringan hanya update style cell yg bersangkutan
  // (tidak perlu re-render seluruh tabel)
}

function _mekDeleteSiGroup(idx) {
  // Hapus baris pertama + semua baris lanjutan (baris setelahnya yang _isFirst=false)
  var end = idx + 1;
  while (end < _mekSiRows.length && _mekSiRows[end]._isFirst === false) end++;
  _mekSiRows.splice(idx, end - idx);
  // Re-tandai _isFirst untuk grup berikutnya (tidak berubah, splice sudah benar)
  _mekRenderSiPreview(_mekSiRows);
  var ct = document.getElementById('mekSiParseCount');
  if (ct) ct.textContent = _mekSiRows.length + ' baris';
}

function mekSiClear() {
  _mekSiRows = [];
  var dz = document.getElementById('mekSiDropZone');
  var rw = document.getElementById('mekSiResultWrap');
  var ct = document.getElementById('mekSiParseCount');
  var cb = document.getElementById('mekSiClearBtn');
  var fi = document.getElementById('mekSiFileInput');
  if (dz) dz.style.display = '';
  if (rw) rw.style.display = 'none';
  if (ct) { ct.textContent = '0 baris'; ct.style.display = 'none'; }
  if (cb) cb.style.display = 'none';
  if (fi) fi.value = '';
  var fl = document.getElementById('mekSiFileLog'); if (fl) fl.innerHTML = '';
  var tb = document.getElementById('mekSiPreviewTbody'); if (tb) tb.innerHTML = '';
  // Reset field Tujuan dan Week
  var tj = document.getElementById('mekSiTujuan');
  if (tj) { tj.value = ''; tj.style.borderColor = '#fc8181'; tj.style.background = '#fff5f5'; }
  var wk = document.getElementById('mekSiWeek');
  if (wk) wk.value = '';
}

function _mekDeleteSiRow(idx) {
  _mekSiRows.splice(idx, 1);
  _mekRenderSiPreview(_mekSiRows);
  var ct = document.getElementById('mekSiParseCount');
  if (ct) ct.textContent = _mekSiRows.length + ' baris';
}

// ── File status log ──────────────────────────────────────────
function _mekAddSiFileStatus(name, state) {
  var log = document.getElementById('mekSiFileLog'); if (!log) return;
  var icons  = { loading:'fa-spinner fa-spin', parsing:'fa-robot', ok:'fa-check-circle', warn:'fa-exclamation-circle', error:'fa-times-circle' };
  var colors = { loading:'#a0aec0', parsing:'#2b6cb0', ok:'#276749', warn:'#744210', error:'#9b2c2c' };
  var id = 'mekSiLog_' + name.replace(/[^a-z0-9]/gi,'_');
  var div = document.createElement('div');
  div.id = id;
  div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px;border-bottom:1px solid #f0f0f0;';
  div.innerHTML = '<i class="fas '+(icons[state]||'fa-file')+'" style="color:'+(colors[state]||'#a0aec0')+';width:14px;"></i>' +
    '<span style="flex:1;font-weight:600;color:#2d3748;">'+_mekEsc(name)+'</span>' +
    '<span id="mekSiLogMsg_'+name.replace(/[^a-z0-9]/gi,'_')+'" style="color:'+(colors[state]||'#a0aec0')+';font-size:11px;">'+state+'</span>';
  log.appendChild(div);
}

function _mekUpdateSiFileStatus(name, state, msg) {
  var icons  = { loading:'fa-spinner fa-spin', parsing:'fa-robot', ok:'fa-check-circle', warn:'fa-exclamation-circle', error:'fa-times-circle' };
  var colors = { loading:'#a0aec0', parsing:'#2b6cb0', ok:'#276749', warn:'#744210', error:'#9b2c2c' };
  var el  = document.getElementById('mekSiLog_'+name.replace(/[^a-z0-9]/gi,'_')); if (!el) return;
  var ico = el.querySelector('i');
  var msgEl = document.getElementById('mekSiLogMsg_'+name.replace(/[^a-z0-9]/gi,'_'));
  if (ico) { ico.className = 'fas '+(icons[state]||'fa-file'); ico.style.color = colors[state]||'#a0aec0'; }
  if (msgEl) { msgEl.textContent = msg||state; msgEl.style.color = colors[state]||'#a0aec0'; }
}

// ════════════════════════════════════════════════════════════
// CAPAIAN PLANNING — init tanggal default (dulu ada toggle All/
// Capaian di sini, All sudah dihapus karena tidak dipakai lagi)
// ════════════════════════════════════════════════════════════
function mekSwitchSumView(view) {
  // Init tanggal default capaian saat pertama dibuka
  var today  = new Date();
  var yyyy   = today.getFullYear();
  var mm     = String(today.getMonth()+1).padStart(2,'0');
  var dd     = String(today.getDate()).padStart(2,'0');
  var elFrom = document.getElementById('mekCapFrom');
  var elTo   = document.getElementById('mekCapTo');
  if (elFrom && !elFrom.value) elFrom.value = yyyy+'-'+mm+'-01';
  if (elTo   && !elTo.value)   elTo.value   = yyyy+'-'+mm+'-'+dd;
}

// ════════════════════════════════════════════════════════════
// CAPAIAN PLANNING
// ════════════════════════════════════════════════════════════
function mekLoadCapaian() {
  var from   = (document.getElementById('mekCapFrom')    || {}).value || '';
  var to     = (document.getElementById('mekCapTo')      || {}).value || '';
  var sku    = ((document.getElementById('mekCapSku')    || {}).value || '').trim().toLowerCase();
  var nopol  = ((document.getElementById('mekCapNopol')  || {}).value || '').trim().toLowerCase();
  var plant  = ((document.getElementById('mekCapPlant')  || {}).value || '').trim().toUpperCase();
  var doc    = _mekStripLeadingZero(((document.getElementById('mekCapDoc') || {}).value || '').trim());
  var tujuan = ((document.getElementById('mekCapTujuan') || {}).value || '').trim().toLowerCase();

  var tbody = document.getElementById('mekCapTbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:40px;color:#a0aec0;">' +
    '<i class="fas fa-spinner fa-spin" style="font-size:22px;"></i></td></tr>';

  // Sembunyikan/tampilkan thead dan toggle email
  var thead = document.getElementById('mekCapThead');
  if (thead) thead.style.display = _mekCapMode === 'email' ? 'none' : '';
  var emailToggle = document.getElementById('mekCapEmailViewToggle');
  if (emailToggle) emailToggle.style.display = _mekCapMode === 'email' ? '' : 'none';

  if (_mekCapMode === 'email') {
    // Kalau from/to sama dan data sudah ada → re-render lokal (tidak ke GAS)
    // Cache: reload hanya kalau from/to berubah (viewMode tidak pengaruhi data dari GAS)
    var _sameRange = (_mekCapEmailData.length > 0 &&
                      _mekCapEmailLastFrom === from && _mekCapEmailLastTo === to);
    if (_sameRange) {
      if (_mekCapEmailView === 'aktual') {
        _mekRenderCapaianEmailAktual(_mekCapEmailData);
      } else {
        _mekRenderCapaianEmail(_mekCapEmailData, sku, doc, tujuan);
      }
      return;
    }
    _mekCapEmailLastFrom = from;
    _mekCapEmailLastTo   = to;
    API.run('getMekCapaianEmail', { from: from, to: to, viewMode: 'plan' }, function(res) {
      if (!res || !res.success) {
        tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;padding:30px;color:#fc8181;">Gagal: '+(res&&res.message?res.message:'error')+'</td></tr>';
        return;
      }
      _mekCapEmailData = res.data || [];
      _mekCapEmailSummary = res.summaryByDate || {};
      if (_mekCapEmailView === 'aktual') {
        _mekRenderCapaianEmailAktual(_mekCapEmailData);
      } else {
        _mekRenderCapaianEmail(_mekCapEmailData, sku, doc, tujuan);
      }
    });
    return;
  }

  API.run('getMekCapaianPlanning', { from: from, to: to, mode: _mekCapMode }, function(res) {
    if (!res || !res.success) {
      tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;padding:30px;color:#fc8181;">Gagal: ' +
        (res && res.message ? res.message : 'error') + '</td></tr>';
      return;
    }
    var data = res.data || [];
    var sfx  = (document.getElementById('mekCapFilterWeek') && document.getElementById('mekCapFilterWeek').style.display !== 'none') ? 'W' : '';
    var statusF = mekGetStatusFilter(sfx);

    // Filter teks per grup planning (cek di isFirstRow)
    if (sku || doc || tujuan || nopol || plant) {
      var planKeys = {};
      data.forEach(function(r) {
        if (!r.isFirstRow) return;
        var skuOk   = !sku    || (r.sku||'').toLowerCase().indexOf(sku)>=0 || (r.nama||'').toLowerCase().indexOf(sku)>=0;
        var docOk   = !doc    || _mekStripLeadingZero(r.noDoc||'').indexOf(doc)>=0;
        var tujOk   = !tujuan || (r.tujuan||'').toLowerCase().indexOf(tujuan)>=0;
        var nopolOk = !nopol  || (r.nopol||'').toLowerCase().indexOf(nopol)>=0;
        var plantOk = !plant  || _mekMatchPlant(r.stuffingPlant||r.plant, plant, r);
        if (skuOk && docOk && tujOk && nopolOk && plantOk) planKeys[r._planKey] = true;
        else planKeys[r._planKey] = planKeys[r._planKey] || false;
      });
      data = data.filter(function(r){ return planKeys[r._planKey]; });
    }

    // Filter status per baris (terpisah dari filter teks)
    if (statusF.length) {
      data = data.filter(function(r){ return _mekMatchStatus(r.status, statusF); });
    }

    _mekCapData = data;
    _mekRenderCapaian(data, _mekCapFilter);
  }, function() {
    tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;padding:30px;color:#fc8181;">Koneksi gagal.</td></tr>';
  });
}

var _mekCapData   = [];
var _mekBySkuLastState = null;
var _mekCapFilter = 'all';  // 'all' | 'datang' | 'belum'
var _mekCapMode   = 'email';  // 'all' | 'wa' | 'si' | 'email' (default: Detail)

function mekCapSwitchMode(mode) {
  _mekCapEmailLastFrom = ''; _mekCapEmailLastTo = ''; _mekCapEmailLastView = '';
  _mekCapMode = mode;
  ['mekCapModeAll','mekCapModeWA','mekCapModeSI','mekCapModeEmail'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('active',
      (mode==='all'   && id==='mekCapModeAll')   ||
      (mode==='wa'    && id==='mekCapModeWA')    ||
      (mode==='si'    && id==='mekCapModeSI')    ||
      (mode==='email' && id==='mekCapModeEmail'));
  });
  mekLoadCapaian();
}

// ── Helper badge status ──────────────────────────────────────
function _mekCapStatusBadge(status, raw) {
  var r = (raw||'').toUpperCase();
  if (status === 'keluar')
    return '<span style="background:#c6f6d5;color:#276749;border-radius:8px;padding:2px 8px;font-size:10px;font-weight:700;">Keluar</span>';
  if (r === 'DITOLAK')
    return '<span style="background:#fed7d7;color:#9b2c2c;border-radius:8px;padding:2px 8px;font-size:10px;font-weight:700;">Ditolak</span>';
  if (r === 'ANTRIAN')
    return '<span style="background:#e2e8f0;color:#4a5568;border-radius:8px;padding:2px 8px;font-size:10px;font-weight:700;">Antrian</span>';
  if (r === 'MENUNGGU_SPM')
    return '<span style="background:#d6bcfa;color:#553c9a;border-radius:8px;padding:2px 8px;font-size:10px;font-weight:700;">Menunggu SPE</span>';
  if (r === 'TREATMENT')
    return '<span style="background:#fefcbf;color:#744210;border-radius:8px;padding:2px 8px;font-size:10px;font-weight:700;">Treatment</span>';
  if (status === 'loading')
    return '<span style="background:#feebc8;color:#744210;border-radius:8px;padding:2px 8px;font-size:10px;font-weight:700;">Loading</span>';
  if (status === 'daftar')
    return '<span style="background:#bee3f8;color:#2b6cb0;border-radius:8px;padding:2px 8px;font-size:10px;font-weight:700;">Daftar</span>';
  return '<span style="background:#fed7d7;color:#c53030;border-radius:8px;padding:2px 8px;font-size:10px;font-weight:700;">Belum</span>';
}

// ── Render By Aktual — grup per tanggal aktual masuk ─────────
function _mekRenderCapaianEmailAktual(data) {
  var tbody = document.getElementById('mekCapTbody');
  if (!tbody) return;
  if (!data || !data.length) {
    tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;padding:40px;color:#a0aec0;">Tidak ada data.</td></tr>';
    return;
  }

  // Ambil semua filter aktif
  var skuFilterA   = ((document.getElementById('mekCapSku')   ||{}).value||'').toLowerCase().trim();
  var docFilterA   = _mekStripLeadingZero(((document.getElementById('mekCapDoc')||{}).value||'').trim());
  var nopolFilterA = ((document.getElementById('mekCapNopol') ||{}).value||'').toLowerCase().trim();
  var tujFilterA   = ((document.getElementById('mekCapTujuan')||{}).value||'').toLowerCase().trim();
  var plantFilterA = ((document.getElementById('mekCapPlant') ||{}).value||'').trim().toUpperCase();
  var statusFilterA = mekGetStatusFilter('');

  // Filter data sebelum render
  if (skuFilterA || docFilterA || nopolFilterA || tujFilterA || plantFilterA || statusFilterA.length) {
    data = data.filter(function(r){
      var skuOk    = !skuFilterA   || (r.sku||'').toLowerCase().indexOf(skuFilterA)>=0  || (r.nama||'').toLowerCase().indexOf(skuFilterA)>=0;
      var docOk    = !docFilterA   || _mekStripLeadingZero(r.noSo||'').toLowerCase().indexOf(docFilterA.toLowerCase())>=0;
      var nopolOk  = !nopolFilterA || (r.nopol||'').toLowerCase().indexOf(nopolFilterA)>=0;
      var tujOk    = !tujFilterA   || (r.tujuan||'').toLowerCase().indexOf(tujFilterA)>=0;
      var plantOk  = !plantFilterA || _mekMatchPlant(r.plant, plantFilterA, r);
      var statusOk = _mekMatchStatus(r.status, statusFilterA);
      return skuOk && docOk && nopolOk && tujOk && plantOk && statusOk;
    });
  }

  _mekCapEmailRowData = [];
  // Group per tanggal aktual (tglDaftar), skip baris belum
  var byAktual = {}, aktualOrder = [];
  data.forEach(function(r) {
    if (r.status === 'belum' || !r.tglDaftar) return;  // skip belum dan yang belum daftar
    if (!byAktual[r.tglDaftar]) { byAktual[r.tglDaftar] = []; aktualOrder.push(r.tglDaftar); }
    byAktual[r.tglDaftar].push(r);
  });
  aktualOrder = aktualOrder.filter(function(d,i){ return aktualOrder.indexOf(d)===i; }).sort();

  var CS = 'border-bottom:1px solid #e2e8f0;padding:6px 8px;font-size:12px;';
  var html = '';

  aktualOrder.forEach(function(aktualTgl) {
    var rows = byAktual[aktualTgl];
    var keluar  = rows.filter(function(r){ return r.status==='keluar'; }).length;
    var loading = rows.filter(function(r){ return r.status==='loading'; }).length;
    var daftar  = rows.filter(function(r){ return r.status==='daftar'; }).length;
    var pend    = rows.filter(function(r){ return r.isPendingan; }).length;

    // Header tanggal aktual
    html += '<tr style="background:#276749;">' +
      '<td colspan="15" style="padding:8px 12px;color:#fff;font-size:12px;font-weight:700;">' +
        '<span style="margin-right:12px;">' + _mekFmtTglDisplay(aktualTgl) + '</span>' +
        '<span style="background:rgba(255,255,255,.15);border-radius:10px;padding:2px 10px;font-size:11px;margin-right:6px;">Total: '+rows.length+' truk</span>' +
        (keluar  ? '<span style="background:#48bb78;border-radius:10px;padding:2px 10px;font-size:11px;margin-right:6px;">'+keluar+' keluar</span>' : '') +
        (loading+daftar ? '<span style="background:#ed8936;border-radius:10px;padding:2px 10px;font-size:11px;margin-right:6px;">'+(loading+daftar)+' proses</span>' : '') +
        (pend ? '<span style="background:#f6d860;color:#744210;border-radius:10px;padding:2px 10px;font-size:11px;">'+pend+' pendingan</span>' : '') +
      '</td></tr>';

    // Header kolom
    html += '<tr style="background:#2d6a4f;color:#d8f3dc;font-size:11px;font-weight:700;">' +
      '<th style="padding:5px 8px;width:30px;">#</th>' +
      '<th style="padding:5px 8px;">NO SO</th>' +
      '<th style="padding:5px 8px;">SKU</th>' +
      '<th style="padding:5px 8px;">Nama Item</th>' +
      '<th style="padding:5px 8px;text-align:right;">Plan</th>' +
      '<th style="padding:5px 8px;">Tgl Plan</th>' +
      '<th style="padding:5px 8px;">No Pol</th>' +
      '<th style="padding:5px 8px;">No Container</th>' +
      '<th style="padding:5px 8px;">Ekspedisi</th>' +
      '<th style="padding:5px 8px;">Waktu Daftar</th>' +
      '<th style="padding:5px 8px;">Proses Loading</th>' +
      '<th style="padding:5px 8px;">Waktu Keluar</th>' +
      '<th style="padding:5px 8px;">Status</th>' +
      '<th style="padding:5px 8px;">Tujuan</th>' +
      '<th style="padding:5px 8px;">Keterangan</th>' +
      '</tr>';

    // Group per SO — SO sama hanya tampil info di baris pertama
    var seenSo = {}, rowNum = 0;
    rows.forEach(function(r) {
      var isFirstSo = !seenSo[r.noSo];
      if (isFirstSo) { seenSo[r.noSo] = 0; rowNum++; }
      seenSo[r.noSo]++;

      var isPend = r.isPendingan;
      var bg = isPend ? 'background:#fffff0;' : '';

      var badge = _mekCapBadge(r.status, r.statusRaw);

      var ket = isPend
        ? '<span style="background:#f6d860;color:#744210;border-radius:6px;padding:1px 7px;font-size:10px;font-weight:700;">Pendingan tgl '+_mekFmtTglDisplay(r.pendinganDari)+'</span>'
        : '';
      if (r.outOfPlanWeek) ket += '<span style="background:#e9d8fd;color:#553c9a;border-radius:6px;padding:1px 7px;font-size:10px;font-weight:700;">Dikirim di luar planning week '+r.outOfPlanWeek+'</span>';

      var noSoCleanP = _mekStripLeadingZero(r.noSo||'');
      var hasDocP = !!noSoCleanP && !!(r.nopol||'').trim() && r.status !== 'belum';
      var editBtnP = hasDocP
        ? '<button onclick="event.stopPropagation();mekStartEditRow(this,\''+_mekEsc(noSoCleanP)+'\',\''+_mekEsc(r.nopol||'')+'\',\''+_mekEsc(r.tglDaftar||'')+'\',\''+_mekEsc(r.nopol||'')+'\',\''+_mekEsc(r.noContainer||'')+'\',\''+_mekEsc(r.ekspedisi||'')+'\')" title="Edit No Pol / No Container / Ekspedisi" style="background:none;border:none;color:#a0aec0;cursor:pointer;padding:2px 4px;font-size:11px;">✏️</button>'
        : '';
      _mekCapEmailRowData.push({sku:r.sku,nama:r.nama,qty:r.qty||'',qt:r.qt||'',keterangan:r.keterangan||'',note:r.note||'',items:r.items||[]});
      html += '<tr style="'+bg+';cursor:pointer;" data-rowidx="'+(_mekCapEmailRowData.length-1)+'" onclick="mekShowRowDetail(this)">' +
        '<td style="'+CS+'text-align:center;color:#a0aec0;font-size:11px;font-weight:700;background:#f8fafc;" data-edit-btn>'+(isFirstSo ? rowNum+'<br>'+editBtnP : editBtnP)+'</td>' +
        '<td style="'+CS+'font-weight:600;color:#2b6cb0;">'+(isFirstSo ? _mekEsc(r.noSo||'—') : '')+'</td>' +
        '<td style="'+CS+'font-weight:700;">'+(isFirstSo ? _mekEsc(r.sku||'') : '')+'</td>' +
        '<td style="'+CS+'">'+(isFirstSo ? _mekEsc(r.nama||'') : '')+'</td>' +
        '<td style="'+CS+'text-align:right;font-weight:700;">'+(isFirstSo && r.planCont ? r.planCont : '')+'</td>' +
        '<td style="'+CS+'font-size:11px;color:#718096;">'+(isFirstSo ? _mekFmtTglDisplay(r.planTgl) : '')+'</td>' +
        '<td style="'+CS+'font-weight:600;" data-field="nopol">'+_mekEsc(r.nopol||'—')+'</td>' +
        '<td style="'+CS+'font-size:11px;color:#4a5568;" data-field="noContainer">'+_mekEsc(r.noContainer||'—')+'</td>' +
        '<td style="'+CS+'" data-field="ekspedisi">'+_mekEsc(r.ekspedisi||'—')+'</td>' +
        '<td style="'+CS+'">'+_mekEsc(r.waktuDaftar||'—')+'</td>' +
        '<td style="'+CS+'">'+_mekEsc(r.prosesLoading||'—')+'</td>' +
        '<td style="'+CS+'">'+_mekEsc(r.waktuKeluar||'—')+'</td>' +
        '<td style="'+CS+'">'+badge+'</td>' +
        '<td style="'+CS+'color:#276749;font-weight:600;">'+_mekEsc(r.tujuan||'')+'</td>' +
        '<td style="'+CS+'">'+ket+'</td>' +
        '</tr>';
    });
  });

  tbody.innerHTML = html;

  // Update summary cards — pakai _mekCapEmailData (semua, termasuk belum)
  // supaya totalCont sama dengan By Planning
  var totalC=0, keluarC=0, loadingC=0, daftarC=0, belumC=0;
  var seenSo3={};
  var _aktFrom = ((document.getElementById('mekCapFrom')||{}).value||'');
  var _aktTo   = ((document.getElementById('mekCapTo')||{}).value||'');

  var _planMap3={}, _capMap3={};
  // Pass 1: totalCont
  _mekCapEmailData.forEach(function(r){
    if (_aktFrom && r.planTgl < _aktFrom) return;
    if (_aktTo   && r.planTgl > _aktTo)   return;
    if (tujFilterA   && (r.tujuan||'').toLowerCase().indexOf(tujFilterA)<0) return;
    if (plantFilterA && !_mekMatchPlant(r.plant, plantFilterA, r)) return;
    if (skuFilterA   && (r.sku||'').toLowerCase().indexOf(skuFilterA)<0 && (r.nama||'').toLowerCase().indexOf(skuFilterA)<0) return;
    var _k3 = (r.noSo && r.noSo !== 'undefined' ? r.noSo : ('sku:'+r.sku)) + '|' + r.sku + '|' + r.planTgl;
    if(!seenSo3[_k3] && r.isFirstRow){
      seenSo3[_k3]=true;
      var jml3 = r.jumlahCont || r.planCont || 0;
      totalC += jml3;
      _planMap3[_k3] = jml3;
      _capMap3[_k3]  = jml3;
    }
  });
  // Pass 2: kc/lc/dc dengan cap
  _mekCapEmailData.forEach(function(r){
    if (_aktFrom && r.planTgl < _aktFrom) return;
    if (_aktTo   && r.planTgl > _aktTo)   return;
    if (tujFilterA   && (r.tujuan||'').toLowerCase().indexOf(tujFilterA)<0) return;
    if (plantFilterA && !_mekMatchPlant(r.plant, plantFilterA, r)) return;
    if (skuFilterA   && (r.sku||'').toLowerCase().indexOf(skuFilterA)<0 && (r.nama||'').toLowerCase().indexOf(skuFilterA)<0) return;
    var _k3 = (r.noSo && r.noSo !== 'undefined' ? r.noSo : ('sku:'+r.sku)) + '|' + r.sku + '|' + r.planTgl;
    if (!_capMap3[_k3] || _capMap3[_k3] <= 0) return;
    if(r.status==='keluar')  { keluarC++;  _capMap3[_k3]--; }
    else if(r.status==='loading'){ loadingC++; _capMap3[_k3]--; }
    else if(r.status==='daftar' ){ daftarC++;  _capMap3[_k3]--; }
  });
  var datangC  = keluarC+loadingC+daftarC;
  var belumReal = Math.max(0, totalC - datangC);
  _mekSetCard('mekCapCardTotal',  totalC);
  _mekSetCard('mekCapCardDatang', datangC);
  _mekSetCard('mekCapCardKeluar', keluarC);
  _mekSetCard('mekCapCardDaftar', loadingC+daftarC);
  _mekSetCard('mekCapCardBelum',  belumReal);
  var pctEl3=document.getElementById('mekCapCardPct');
  if(pctEl3) pctEl3.textContent = totalC ? Math.round(keluarC/totalC*100)+'%' : '—';
}

// ── Modal detail card capaian ────────────────────────────────
function mekShowRowDetail(trEl) {
  // Data disimpan di variable saat render - ambil dari _mekCapEmailRowData
  var idx = trEl ? parseInt(trEl.dataset.rowidx) : -1;
  var d = (idx >= 0 && _mekCapEmailRowData[idx]) ? _mekCapEmailRowData[idx] : null;
  if (!d) return;

  // Pakai overlay yang sama dengan card detail
  var overlay = document.getElementById('mekCardDetailOverlay');
  var title   = document.getElementById('mekCardDetailTitle');
  var thead   = document.getElementById('mekCardDetailThead');
  var tbody   = document.getElementById('mekCardDetailTbody');
  var count   = document.getElementById('mekCardDetailCount');
  if (!overlay) return;

  title.textContent = 'Detail Baris';
  thead.innerHTML = '';
  count.textContent = '';

  var rows = [
    {label:'SKU / Kode',    val: d.sku},
    {label:'Nama Barang',   val: d.nama},
    {label:'QTY Karton',    val: d.qty  || '—'},
    {label:'QT (Quotation)',val: d.qt   || '—'},
    {label:'Keterangan',    val: d.keterangan || '—'},
    {label:'Note',          val: d.note || '—'},
  ];

  // Tambah barang tambahan (ITEM2, ITEM3 dst)
  var itemRows = '';
  if (d.items && d.items.length) {
    itemRows = '<tr><td colspan="2" style="padding:6px 16px;font-size:11px;font-weight:800;color:#1a3a5c;background:#ebf8ff;letter-spacing:.5px;">BARANG LAIN DALAM CONTAINER</td></tr>';
    d.items.forEach(function(it, i) {
      var bg = i%2===0?'':'background:#f8fafc;';
      itemRows += '<tr style="'+bg+'">' +
        '<td style="padding:8px 16px;font-size:11px;color:#718096;white-space:nowrap;">SKU '+_mekEsc(it.sku)+'</td>' +
        '<td style="padding:8px 16px;font-size:12px;color:#2d3748;font-weight:600;">'+_mekEsc(it.nama)+(it.qty?' <span style="color:#744210;font-size:11px;">('+it.qty+' krt)</span>':'')+'</td>' +
        '</tr>';
    });
  }

  tbody.innerHTML = rows.map(function(r, i) {
    return '<tr style="'+(i%2===0?'':'background:#f8fafc;')+'">' +
      '<td style="padding:10px 16px;font-size:11px;font-weight:700;color:#718096;white-space:nowrap;width:140px;">'+r.label+'</td>' +
      '<td style="padding:10px 16px;font-size:13px;color:#2d3748;font-weight:600;">'+_mekEsc(r.val)+'</td>' +
      '</tr>';
  }).join('') + itemRows;

  // Sembunyikan btnBar untuk popup baris
  var bb = document.getElementById('mekCardDetailBtnBar');
  if (bb) bb.style.display = 'none';

  overlay.classList.remove('show');
  overlay.style.display = 'flex';
  void overlay.offsetWidth;
  overlay.classList.add('show');
}

// ── Popup info truk DITOLAK per SO ──────────────────────────────
// ── Popup "Tandai Digabung" — SO yang sama, container sudah keluar tapi
// SKU lain masih tercatat "Belum" karena sebenarnya digabung ke container itu ──
function mekShowMergePopup(noSo, sku, planTgl) {
  var src = (_mekCapMode === 'email') ? _mekCapEmailData : _mekCapData;

  // Pengaman: kalau planTgl yang dikirim dari tombol kosong (baris asalnya belum ke-set),
  // cari otomatis dari baris LAIN manapun di SO+SKU yang sama yang tanggalnya terisi.
  if (!planTgl) {
    (src || []).some(function(r) {
      var rNoSo = _mekStripLeadingZero(r.noSo || '');
      if (rNoSo === noSo && (r.sku||'') === sku) {
        var t = r.planTgl || r.tanggal || '';
        if (t) { planTgl = t; return true; }
      }
      return false;
    });
  }
  // Fallback terakhir: SO yang sama saja (tanpa syarat SKU) — kalau tetap tidak ketemu
  if (!planTgl) {
    (src || []).some(function(r) {
      var rNoSo = _mekStripLeadingZero(r.noSo || '');
      if (rNoSo === noSo) {
        var t = r.planTgl || r.tanggal || '';
        if (t) { planTgl = t; return true; }
      }
      return false;
    });
  }

  // Ambil semua container lain yang sudah ada NO POL / NO CONTAINER di SO+TANGGAL PLANNING
  // yang sama persis — supaya kalau SO yang sama muncul lagi di planning minggu lain,
  // tidak ketuker kandidatnya.
  var candidates = [];
  var seen = {};
  (src || []).forEach(function(r) {
    var rNoSo = _mekStripLeadingZero(r.noSo || '');
    if (rNoSo !== noSo) return;
    if ((r.planTgl||r.tanggal||'') !== (planTgl||'')) return;
    if (!r.nopol && !r.noContainer) return;
    var key = (r.nopol||'') + '|' + (r.noContainer||'');
    if (seen[key]) return;
    seen[key] = true;
    candidates.push({ nopol: r.nopol || '', container: r.noContainer || '', sku: r.sku || '' });
  });

  var options = candidates.map(function(c, i) {
    return '<option value="'+i+'">'+_mekEsc(c.nopol||'-')+' / '+_mekEsc(c.container||'-')+' (SKU '+_mekEsc(c.sku)+')</option>';
  }).join('');

  var html =
    '<div id="mekMergeOverlay" onclick="if(event.target===this) mekCloseMergePopup()" ' +
    'style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;">' +
      '<div style="background:#fff;border-radius:12px;max-width:440px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden;">' +
        '<div style="background:#2c5282;color:#fff;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;">' +
          '<div style="font-weight:700;font-size:14px;"><i class="fas fa-link" style="margin-right:8px;"></i>Tandai Container Digabung</div>' +
          '<button onclick="mekCloseMergePopup()" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;line-height:1;">&times;</button>' +
        '</div>' +
        '<div style="padding:18px;">' +
          '<div style="font-size:12px;color:#718096;margin-bottom:12px;">SO <b>'+_mekEsc(noSo)+'</b> (planning '+_mekEsc(_mekFmtTglDisplay(planTgl))+') — SKU <b>'+_mekEsc(sku)+'</b> tercatat "Belum", tapi sebenarnya sudah dikirim tergabung di container SKU lain. Pilih container yang jadi tujuan gabungnya:</div>' +
          (candidates.length
            ? '<select id="mekMergeSelect" style="width:100%;padding:8px 10px;border:2px solid #e2e8f0;border-radius:8px;font-size:13px;margin-bottom:10px;">'+options+'</select>'
            : '<div style="font-size:12px;color:#c53030;margin-bottom:10px;">Belum ada container lain tercatat di SO ini. Isi manual di bawah.</div>'
          ) +
          '<input id="mekMergeManualNopol" placeholder="No Pol (kalau pilih manual)" style="width:100%;padding:8px 10px;border:2px solid #e2e8f0;border-radius:8px;font-size:13px;margin-bottom:8px;" '+(candidates.length?'value=""':'')+'>' +
          '<input id="mekMergeManualContainer" placeholder="No Container (kalau pilih manual)" style="width:100%;padding:8px 10px;border:2px solid #e2e8f0;border-radius:8px;font-size:13px;margin-bottom:8px;">' +
          '<textarea id="mekMergeCatatan" placeholder="Catatan (opsional)" style="width:100%;padding:8px 10px;border:2px solid #e2e8f0;border-radius:8px;font-size:13px;min-height:50px;margin-bottom:14px;"></textarea>' +
          '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
            '<button onclick="mekCloseMergePopup()" style="padding:8px 16px;border-radius:8px;border:1px solid #cbd5e0;background:#fff;color:#4a5568;cursor:pointer;font-size:12px;font-weight:600;">Batal</button>' +
            '<button id="mekMergeSaveBtn" onclick="mekSaveMergeOverride(\''+_mekEsc(noSo)+'\',\''+_mekEsc(sku)+'\',\''+_mekEsc(planTgl||'')+'\')" style="padding:8px 16px;border-radius:8px;border:none;background:#2c5282;color:#fff;cursor:pointer;font-size:12px;font-weight:700;">Simpan</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  var existing = document.getElementById('mekMergeOverlay');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', html);
  window._mekMergeCandidates = candidates;
}

function mekCloseMergePopup() {
  var el = document.getElementById('mekMergeOverlay');
  if (el) el.remove();
}

function mekSaveMergeOverride(noSo, sku, planTgl) {
  var sel = document.getElementById('mekMergeSelect');
  var candidates = window._mekMergeCandidates || [];
  var nopol = '', container = '';
  if (sel && candidates[sel.value]) {
    nopol = candidates[sel.value].nopol;
    container = candidates[sel.value].container;
  }
  var manualNopol = (document.getElementById('mekMergeManualNopol')||{}).value || '';
  var manualContainer = (document.getElementById('mekMergeManualContainer')||{}).value || '';
  if (manualNopol.trim())     nopol = manualNopol.trim();
  if (manualContainer.trim()) container = manualContainer.trim();

  if (!nopol && !container) {
    showToast('Pilih container atau isi manual dulu', 'error');
    return;
  }
  if (!planTgl) {
    showToast('Tanggal planning tidak diketahui — tidak bisa disimpan', 'error');
    return;
  }

  var catatan = (document.getElementById('mekMergeCatatan')||{}).value || '';
  var btn = document.getElementById('mekMergeSaveBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }

  API.run('saveMekMergeOverride', {
    noSo: noSo, sku: sku, tanggalPlanning: planTgl, mergedIntoNopol: nopol, mergedIntoContainer: container, catatan: catatan
  }, function(res) {
    if (res && res.success) {
      showToast('Berhasil ditandai digabung', 'success');
      mekCloseMergePopup();
      if (typeof mekLoadCapaian === 'function') mekLoadCapaian();
    } else {
      showToast('Gagal: '+(res ? res.message : 'Gagal menyimpan'), 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Simpan'; }
    }
  }, function(err) {
    showToast('Koneksi gagal: '+err.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Simpan'; }
  });
}

function mekShowDitolakPopup(rowidx) {
  var list = _mekDitolakData[rowidx] || [];
  if (!list.length) return;

  var rows = list.map(function(d, i) {
    return '<tr style="' + (i % 2 === 0 ? '' : 'background:#f8fafc;') + '">' +
      '<td style="padding:8px 10px;border-bottom:1px solid #fed7d7;font-weight:600;">' + _mekEsc(d.nopol || '\u2014') + '</td>' +
      '<td style="padding:8px 10px;border-bottom:1px solid #fed7d7;">' + _mekEsc(d.noContainer || '\u2014') + '</td>' +
      '<td style="padding:8px 10px;border-bottom:1px solid #fed7d7;">' + _mekEsc(d.waktuDaftar || '\u2014') + '</td>' +
      '<td style="padding:8px 10px;border-bottom:1px solid #fed7d7;color:#e53e3e;font-weight:600;">' + _mekEsc(d.waktuDitolak || '\u2014') + '</td>' +
      '</tr>';
  }).join('');

  var html =
    '<div id="mekDitolakOverlay" onclick="if(event.target===this) mekCloseDitolakPopup()" ' +
    'style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;">' +
      '<div style="background:#fff;border-radius:12px;max-width:600px;width:100%;max-height:80vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">' +
        '<div style="background:#e53e3e;color:#fff;padding:14px 18px;border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:space-between;">' +
          '<div style="font-weight:700;font-size:14px;"><i class="fas fa-ban" style="margin-right:8px;"></i>Container Ditolak (' + list.length + ')</div>' +
          '<button onclick="mekCloseDitolakPopup()" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;line-height:1;">&times;</button>' +
        '</div>' +
        '<div style="padding:0 18px 18px;">' +
          '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:14px;">' +
            '<thead><tr style="background:#fff5f5;">' +
              '<th style="padding:8px 10px;text-align:left;color:#9b2c2c;">No Pol</th>' +
              '<th style="padding:8px 10px;text-align:left;color:#9b2c2c;">No Container</th>' +
              '<th style="padding:8px 10px;text-align:left;color:#9b2c2c;">Jam Masuk</th>' +
              '<th style="padding:8px 10px;text-align:left;color:#9b2c2c;">Jam Ditolak</th>' +
            '</tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>';

  var existing = document.getElementById('mekDitolakOverlay');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', html);
}

function mekCloseDitolakPopup() {
  var el = document.getElementById('mekDitolakOverlay');
  if (el) el.remove();
}


function mekShowCardDetail(type) {
  var overlay = document.getElementById('mekCardDetailOverlay');
  var title   = document.getElementById('mekCardDetailTitle');
  var thead   = document.getElementById('mekCardDetailThead');
  var tbody   = document.getElementById('mekCardDetailTbody');
  var count   = document.getElementById('mekCardDetailCount');
  if (!overlay) return;

  var from = (document.getElementById('mekCapFrom')||{}).value||'';
  var to   = (document.getElementById('mekCapTo')||{}).value||'';

  // Popup hanya support mode email untuk sekarang
  // Mode Capaian (WA/SI) pakai _mekCapData dengan struktur berbeda
  var _srcData;
  if (_mekCapMode === 'email') {
    _srcData = _mekCapEmailData;
  } else {
    // Normalisasi _mekCapData ke format yang sama dengan _mekCapEmailData
    _srcData = _mekCapData.map(function(r){
      return {
        planTgl:    r.tanggal || r.tgl || '',
        noSo:       r.noSo || '',
        sku:        r.sku  || '',
        nama:       r.nama || '',
        tujuan:     r.tujuan || '',
        plant:      r.stuffingPlant || '',
        qty:        r.qty || '',
        jumlahCont: r._jumlahCont || r.jumlahCont || 0,
        planCont:   r._jumlahCont || 0,
        isFirstRow: !r._dupKey,
        status:     r.status || 'belum',
        statusRaw:  r.statusRaw || '',
        nopol:      r.nopol || ''
      };
    });
  }

  // Ambil filter aktif
  var skuF   = ((document.getElementById('mekCapSku')   ||{}).value||'').toLowerCase().trim();
  var docF   = _mekStripLeadingZero(((document.getElementById('mekCapDoc')||{}).value||'').trim());
  var tujF   = ((document.getElementById('mekCapTujuan')||{}).value||'').toLowerCase().trim();
  var plantF = ((document.getElementById('mekCapPlant') ||{}).value||'').trim().toUpperCase();
  var nopolF = ((document.getElementById('mekCapNopol') ||{}).value||'').toLowerCase().trim();

  // Filter data sesuai type + filter aktif
  var data = _srcData.filter(function(r){
    if (from && r.planTgl < from) return false;
    if (to   && r.planTgl > to)   return false;
    // Apply filter aktif
    if (skuF   && (r.sku||'').toLowerCase().indexOf(skuF)<0 && (r.nama||'').toLowerCase().indexOf(skuF)<0) return false;
    if (docF   && _mekStripLeadingZero(r.noSo||'').toLowerCase().indexOf(docF.toLowerCase())<0) return false;
    if (tujF   && (r.tujuan||'').toLowerCase().indexOf(tujF)<0) return false;
    if (plantF && !_mekMatchPlant(r.plant, plantF, r)) return false;
    if (nopolF && (r.nopol||'').toLowerCase().indexOf(nopolF)<0) return false;
    // Filter by type
    if (type === 'keluar')  return r.status === 'keluar';
    if (type === 'proses')  return r.status === 'loading' || r.status === 'daftar';
    if (type === 'datang')  return r.status === 'keluar' || r.status === 'loading' || r.status === 'daftar';
    if (type === 'belum')   return r.status === 'belum';
    return true; // total
  });

  // Hitung sisa container per SO+SKU+planTgl untuk card Belum
  var sisaMap = {};
  if (type === 'belum' || type === 'total') {
    // Pakai semua data dalam range (termasuk yg keluar) untuk hitung sisa
    _srcData.filter(function(r){
      if (from && r.planTgl < from) return false;
      if (to   && r.planTgl > to)   return false;
      if (skuF   && (r.sku||'').toLowerCase().indexOf(skuF)<0 && (r.nama||'').toLowerCase().indexOf(skuF)<0) return false;
      if (tujF   && (r.tujuan||'').toLowerCase().indexOf(tujF)<0) return false;
      if (plantF && !_mekMatchPlant(r.plant, plantF, r)) return false;
      return true;
    }).forEach(function(r){
      if (from && r.planTgl < from) return;
      if (to   && r.planTgl > to)   return;
      var k = r.noSo+'|'+r.sku+'|'+r.planTgl;
      if (!sisaMap[k]) sisaMap[k] = { plan:0, datang:0 };
      if (r.isFirstRow) sisaMap[k].plan += (r.jumlahCont||r.planCont||0);
      // Datang = keluar + loading + daftar (semua yang sudah ada di antrian)
      if (r.status==='keluar' || r.status==='loading' || r.status==='daftar') sisaMap[k].datang++;
    });
  }

  // Deduplikasi per SO+SKU+planTgl untuk tampilan
  var seen = {}, rows = [];
  data.forEach(function(r){  // deduplikasi
    var k = r.noSo+'|'+r.sku+'|'+r.planTgl;
    if (type === 'belum') {
      // Untuk belum: tampilkan per planning, hitung sisa container
      if (!seen[k]) {
        seen[k] = true;
        var sisa = sisaMap[k] ? Math.max(0, sisaMap[k].plan - sisaMap[k].datang) : (r.jumlahCont||0);
        rows.push({ planTgl:r.planTgl, noSo:r.noSo, sku:r.sku, nama:r.nama,
                    tujuan:r.tujuan, plant:r.plant, qtyKrt:r.qty||'',
                    plan:r.jumlahCont||r.planCont||0, sisa:sisa });
      }
    } else {
      rows.push(r);
    }
  });

  var TITLES = { total:'Total Planning', datang:'Total Kedatangan', keluar:'Sudah Keluar', proses:'Masih Proses', belum:'Belum Datang' };
  title.textContent = TITLES[type] || '';

  // Tambah tombol By Tujuan untuk card belum dan total
  var btnBar = document.getElementById('mekCardDetailBtnBar');
  if (btnBar) {
    // Semua card tampilkan tombol Detail dan By Tujuan
    btnBar.innerHTML =
      '<button id="mekCardDetailBtnDetail" onclick="mekCardDetailSetView(&quot;detail&quot;)" ' +
      'style="padding:4px 12px;border-radius:6px;border:1.5px solid #2b6cb0;background:#2b6cb0;color:#fff;font-size:11px;font-weight:700;cursor:pointer;margin-right:6px;">Detail</button>' +
      '<button id="mekCardDetailBtnTujuan" onclick="mekCardDetailSetView(&quot;tujuan&quot;)" ' +
      'style="padding:4px 12px;border-radius:6px;border:1.5px solid #e2e8f0;background:#fff;color:#4a5568;font-size:11px;font-weight:700;cursor:pointer;">By Tujuan</button>';
    btnBar.style.display = '';
  }

  // Simpan rows dan type untuk dipakai saat switch view
  window._mekCardDetailRows = rows;
  window._mekCardDetailType = type;
  window._mekCardDetailView = 'detail';

  // Show overlay dulu supaya popup muncul meski rows kosong
  overlay.classList.remove('show');
  overlay.style.display = 'flex';
  void overlay.offsetWidth;
  overlay.classList.add('show');

  _mekCardDetailRender(rows, type, 'detail');
}

function mekCardDetailSetView(view) {
  var rows = window._mekCardDetailRows || [];
  var type = window._mekCardDetailType || 'belum';
  // Update style tombol
  var btnD = document.getElementById('mekCardDetailBtnDetail');
  var btnT = document.getElementById('mekCardDetailBtnTujuan');
  if (btnD) { btnD.style.background = view==='detail' ? '#2b6cb0' : '#fff'; btnD.style.color = view==='detail' ? '#fff' : '#4a5568'; btnD.style.borderColor = view==='detail' ? '#2b6cb0' : '#e2e8f0'; }
  if (btnT) { btnT.style.background = view==='tujuan' ? '#2b6cb0' : '#fff'; btnT.style.color = view==='tujuan' ? '#fff' : '#4a5568'; btnT.style.borderColor = view==='tujuan' ? '#2b6cb0' : '#e2e8f0'; }
  _mekCardDetailRender(rows, type, view);
}

function _mekCardDetailRender(rows, type, view) {
  var overlay = document.getElementById('mekCardDetailOverlay');
  var thead   = document.getElementById('mekCardDetailThead');
  var tbody   = document.getElementById('mekCardDetailTbody');
  var count   = document.getElementById('mekCardDetailCount');
  if (!thead || !tbody) return;

  window._mekCardDetailView = view;

  var filtered = rows; // filter plant sudah diterapkan di tabel utama

  var skuF   = ((document.getElementById('mekCapSku')   ||{}).value||'').toLowerCase().trim();
  var tujF   = ((document.getElementById('mekCapTujuan')||{}).value||'').toLowerCase().trim();
  var plantF = ((document.getElementById('mekCapPlant') ||{}).value||'').trim().toUpperCase();
  var _srcData = (_mekCapMode === 'email') ? _mekCapEmailData : _mekCapData;

  if (view === 'tujuan') {
    var tujMap = {};
    var seenPlan = {};  // untuk total planning - hitung jumlahCont sekali per planning

    // ── Ambil semua data (bukan rows yg sudah difilter status) untuk hitung planCont ──
    // Pakai _srcData supaya planCont per tujuan lengkap termasuk semua status
    var allForPlan = _srcData.filter(function(r){
      var from2 = (document.getElementById('mekCapFrom')||{}).value||'';
      var to2   = (document.getElementById('mekCapTo')||{}).value||'';
      if (from2 && r.planTgl < from2) return false;
      if (to2   && r.planTgl > to2)   return false;
      if (skuF   && (r.sku||'').toLowerCase().indexOf(skuF)<0 && (r.nama||'').toLowerCase().indexOf(skuF)<0) return false;
      if (tujF   && (r.tujuan||'').toLowerCase().indexOf(tujF)<0) return false;
      if (plantF && !_mekMatchPlant(r.plant, plantF, r)) return false;
      return true;
    });

    // Hitung planCont per tujuan dari semua data
    allForPlan.forEach(function(r){
      var tuj = r.tujuan || '—';
      if (!tujMap[tuj]) tujMap[tuj] = { tujuan: tuj, planCont: 0, val: 0 };
      var pk = (r.noSo||r.sku||'')+'|'+(r.sku||'')+'|'+(r.planTgl||'');
      if (!seenPlan[pk] && r.isFirstRow) {
        seenPlan[pk] = true;
        tujMap[tuj].planCont += (r.jumlahCont || r.planCont || 0);
      }
    });

    // Hitung val per tujuan dari filtered (sudah difilter status + plant)
    filtered.forEach(function(r) {
      var tuj = r.tujuan || '—';
      if (!tujMap[tuj]) tujMap[tuj] = { tujuan: tuj, planCont: 0, val: 0 };
      if (type === 'belum') {
        tujMap[tuj].val += (r.sisa !== undefined ? r.sisa : (r.plan || 0));
      } else {
        tujMap[tuj].val += 1;
      }
    });

    var tujRows = Object.values(tujMap).sort(function(a,b){ return b.planCont - a.planCont; });

    var col2lbl = type==='belum'  ? 'SISA'   : type==='total'  ? 'TOTAL CONT' :
                  type==='keluar' ? 'KELUAR'  : type==='proses' ? 'PROSES'     : 'DATANG';
    var showVal  = (type !== 'total');

    thead.innerHTML = '<tr>' +
      '<th style="padding:7px 12px;text-align:left;">TUJUAN</th>' +
      '<th style="padding:7px 12px;text-align:right;">PLAN CONT</th>' +
      (showVal ? '<th style="padding:7px 12px;text-align:right;">'+col2lbl+'</th>' : '') +
      '</tr>';

    tbody.innerHTML = tujRows.map(function(r, i) {
      var bg = i%2===0?'':'background:#f8fafc;';
      var valColor = type==='belum'  ? 'color:#c53030;' :
                     type==='keluar' ? 'color:#276749;' :
                     type==='proses' ? 'color:#c05621;' :
                     type==='datang' ? 'color:#553c9a;' : 'color:#2d3748;';
      return '<tr style="'+bg+'">' +
        '<td style="padding:8px 12px;font-weight:700;color:#276749;">'+_mekEsc(r.tujuan)+'</td>' +
        '<td style="padding:8px 12px;text-align:right;font-weight:600;color:#2d3748;">'+r.planCont+'</td>' +
        (showVal ? '<td style="padding:8px 12px;text-align:right;font-weight:800;font-size:14px;'+valColor+'">'+(r.val||0)+'</td>' : '') +
        '</tr>';
    }).join('');

    if (count) count.textContent = tujRows.length + ' tujuan';
    return;
  }

  // View detail (default)
  if (type === 'belum') {
    thead.innerHTML = '<tr>' +
      '<th style="padding:7px 10px;text-align:left;">TGL PLANNING</th>' +
      '<th style="padding:7px 10px;text-align:left;">NO SO</th>' +
      '<th style="padding:7px 10px;text-align:left;">KODE</th>' +
      '<th style="padding:7px 10px;text-align:left;">MATERIAL</th>' +
      '<th style="padding:7px 10px;text-align:right;">QTY KRT</th>' +
      '<th style="padding:7px 10px;text-align:right;">CONT</th>' +
      '<th style="padding:7px 10px;text-align:right;">SISA</th>' +
      '<th style="padding:7px 10px;text-align:left;">TUJUAN</th>' +
      '<th style="padding:7px 10px;text-align:left;">STUFFING</th>' +
      '</tr>';
    tbody.innerHTML = filtered.slice().sort(function(a,b){ return a.planTgl < b.planTgl ? -1 : 1; })
      .map(function(r,i){
        var bg = i%2===0?'':'background:#f8fafc;';
        return '<tr style="'+bg+'">' +
          '<td style="padding:6px 10px;">'+_mekFmtTglDisplay(r.planTgl)+'</td>' +
          '<td style="padding:6px 10px;font-weight:600;color:#2b6cb0;">'+_mekEsc(r.noSo||'—')+'</td>' +
          '<td style="padding:6px 10px;">'+_mekEsc(r.sku)+'</td>' +
          '<td style="padding:6px 10px;max-width:180px;">'+_mekEsc(r.nama)+'</td>' +
          '<td style="padding:6px 10px;text-align:right;color:#744210;font-weight:600;">'+(r.qtyKrt||'—')+'</td>' +
          '<td style="padding:6px 10px;text-align:right;">'+r.plan+'</td>' +
          '<td style="padding:6px 10px;text-align:right;font-weight:700;color:#c53030;">'+r.sisa+'</td>' +
          '<td style="padding:6px 10px;color:#276749;font-weight:600;">'+_mekEsc(r.tujuan||'—')+'</td>' +
          '<td style="padding:6px 10px;">'+_mekEsc(r.plant||'—')+'</td>' +
          '</tr>';
      }).join('');
  } else {
    thead.innerHTML = '<tr>' +
      '<th style="padding:7px 10px;text-align:left;">TGL PLANNING</th>' +
      '<th style="padding:7px 10px;text-align:left;">NO SO</th>' +
      '<th style="padding:7px 10px;text-align:left;">KODE</th>' +
      '<th style="padding:7px 10px;text-align:left;">MATERIAL</th>' +
      '<th style="padding:7px 10px;text-align:right;">QTY KRT</th>' +
      '<th style="padding:7px 10px;text-align:right;">CONT</th>' +
      '<th style="padding:7px 10px;text-align:left;">TUJUAN</th>' +
      '<th style="padding:7px 10px;text-align:left;">STATUS</th>' +
      '</tr>';
    tbody.innerHTML = filtered.slice().sort(function(a,b){ return a.planTgl < b.planTgl ? -1 : 1; })
      .map(function(r,i){
        var bg = i%2===0?'':'background:#f8fafc;';
        return '<tr style="'+bg+'">' +
          '<td style="padding:6px 10px;">'+_mekFmtTglDisplay(r.planTgl)+'</td>' +
          '<td style="padding:6px 10px;font-weight:600;color:#2b6cb0;">'+_mekEsc(r.noSo||'—')+'</td>' +
          '<td style="padding:6px 10px;">'+_mekEsc(r.sku||'')+'</td>' +
          '<td style="padding:6px 10px;max-width:180px;">'+_mekEsc(r.nama||'')+'</td>' +
          '<td style="padding:6px 10px;text-align:right;color:#744210;font-weight:600;">'+(r.qty||'—')+'</td>' +
          '<td style="padding:6px 10px;text-align:right;">'+(r.jumlahCont||r.planCont||'')+'</td>' +
          '<td style="padding:6px 10px;color:#276749;font-weight:600;">'+_mekEsc(r.tujuan||'—')+'</td>' +
          '<td style="padding:6px 10px;">'+_mekCapBadge(r.status, r.statusRaw)+'</td>' +
          '</tr>';
      }).join('');
  }

  count.textContent = filtered.length + ' baris';
  overlay.classList.remove('show');
  overlay.style.display = 'flex';
  void overlay.offsetWidth;
  overlay.classList.add('show');
}  // end _mekCardDetailRender

// ════════════════════════════════════════════════════════════
// INLINE EDIT — No Pol, No Container, Ekspedisi
// ════════════════════════════════════════════════════════════
var _mekEditActive = null; // { noSo, nopolMatch, tglDaftar, tr, origMap }

function mekStartEditRow(btn, noSo, nopolMatch, tglDaftar, nopol, noContainer, ekspedisi) {
  if (_mekEditActive) mekCancelEditRow();

  var tr = btn.closest('tr');
  if (!tr) return;

  var cells = tr.querySelectorAll('td');
  var origMap = {};
  cells.forEach(function(td, i){ origMap[i] = td.innerHTML; });

  _mekEditActive = { noSo: noSo, nopolMatch: nopolMatch, tglDaftar: tglDaftar, tr: tr, origMap: origMap };

  btn.parentElement.innerHTML =
    '<button onclick="mekSaveEditRow()" title="Simpan" style="background:#276749;border:none;color:#fff;border-radius:4px;padding:3px 7px;font-size:11px;cursor:pointer;margin-right:2px;">✓</button>' +
    '<button onclick="mekCancelEditRow()" title="Batal" style="background:#c53030;border:none;color:#fff;border-radius:4px;padding:3px 7px;font-size:11px;cursor:pointer;">✗</button>';

  tr.querySelectorAll('td[data-field]').forEach(function(td){
    var field = td.getAttribute('data-field');
    var val = field==='nopol' ? nopol : field==='noContainer' ? noContainer : ekspedisi;
    td.innerHTML = '<input type="text" value="'+_mekEsc(val||'')+'" '+
      'style="width:100%;box-sizing:border-box;border:1px solid #4299e1;border-radius:4px;padding:2px 5px;font-size:11px;font-family:inherit;" '+
      'onclick="event.stopPropagation()" data-field="'+field+'">';
  });

  tr.onclick = null;
}

function mekSaveEditRow() {
  if (!_mekEditActive) return;
  var tr         = _mekEditActive.tr;
  var noSo       = _mekEditActive.noSo;
  var nopolMatch = _mekEditActive.nopolMatch;
  var tglDaftar  = _mekEditActive.tglDaftar;

  var nopol = '', noContainer = '', ekspedisi = '';
  tr.querySelectorAll('input[data-field]').forEach(function(inp){
    var f = inp.getAttribute('data-field');
    if (f==='nopol')       nopol       = inp.value.trim();
    if (f==='noContainer') noContainer = inp.value.trim();
    if (f==='ekspedisi')   ekspedisi   = inp.value.trim();
  });

  tr.querySelectorAll('input').forEach(function(i){ i.disabled=true; });
  tr.querySelectorAll('button').forEach(function(b){ b.disabled=true; });

  API.updateMekAntrianRow(
    { noSo: noSo, nopolMatch: nopolMatch, tglDaftar: tglDaftar, nopol: nopol, noContainer: noContainer, ekspedisi: ekspedisi },
    function(res) {
      if (!res || !res.success) {
        showToast('Gagal simpan: '+(res&&res.message||'error'), 'error');
        mekCancelEditRow();
        return;
      }
      function _upd(arr) {
        arr.forEach(function(r){
          var rSo = _mekStripLeadingZero(r.noSo||'') || _mekStripLeadingZero(r.noDoc||'');
          if (rSo !== noSo) return;
          if ((r.nopol||'').trim() !== nopolMatch) return;
          if (nopol)       r.nopol       = nopol;
          r.noContainer = noContainer;
          if (ekspedisi)   r.ekspedisi   = ekspedisi;
        });
      }
      _upd(_mekCapData      || []);
      _upd(_mekCapEmailData || []);

      tr.onclick = function(){ mekShowRowDetail(this); };
      var nopolFinal = nopol || nopolMatch;
      _mekEditActive = null;

      tr.querySelectorAll('td[data-field]').forEach(function(td){
        var f = td.getAttribute('data-field');
        var val = f==='nopol' ? nopolFinal : f==='noContainer' ? noContainer : ekspedisi;
        td.innerHTML = _mekEsc(val||'—');
      });
      var editTd = tr.querySelector('td[data-edit-btn]');
      if (editTd) {
        var noSoE = _mekEsc(noSo), nopolE = _mekEsc(nopolFinal);
        var ncE = _mekEsc(noContainer), ekspE = _mekEsc(ekspedisi||nopolMatch);
        editTd.innerHTML = (editTd.innerHTML.match(/^\d+/) ? editTd.innerHTML.match(/^\d+/)[0]+'<br>' : '') +
          '<button onclick="event.stopPropagation();mekStartEditRow(this,\''+noSoE+'\',\''+nopolE+'\',\''+nopolE+'\',\''+ncE+'\',\''+ekspE+'\')" '+
          'title="Edit" style="background:none;border:none;color:#a0aec0;cursor:pointer;padding:2px 4px;font-size:11px;">✏️</button>';
      }
      showToast('Berhasil disimpan', 'success');
    },
    function(err) {
      showToast('Gagal simpan: '+String(err), 'error');
      mekCancelEditRow();
    }
  );
}

function mekCancelEditRow() {
  if (!_mekEditActive) return;
  var tr      = _mekEditActive.tr;
  var origMap = _mekEditActive.origMap;
  var cells   = tr.querySelectorAll('td');
  cells.forEach(function(td, i){
    if (origMap[i] !== undefined) td.innerHTML = origMap[i];
  });
  tr.onclick = function(){ mekShowRowDetail(this); };
  _mekEditActive = null;
}

function mekCardDetailDownload(fmt) {
  var type  = window._mekCardDetailType || 'total';
  var view  = window._mekCardDetailView || 'detail';
  var TITLES = { total:'Total Planning', datang:'Total Kedatangan', keluar:'Sudah Keluar', proses:'Masih Proses', belum:'Belum Datang' };
  var plantVal = ((document.getElementById('mekCapPlant')||{}).value||'');
  var plantSuffix = plantVal === '__NO_PLAN__' ? ' — Tanpa Planning' : plantVal ? ' — '+plantVal : '';
  var title  = (TITLES[type] || type) + plantSuffix;
  var sub    = (view === 'tujuan' ? 'By Tujuan — ' : '') +
    ((document.getElementById('mekCapFrom')||{}).value||'') + ' s/d ' +
    ((document.getElementById('mekCapTo')||{}).value||'');

  if (fmt === 'pdf') {
    _mekPrintCardDetail(title, sub);
  } else {
    _mekExportCardDetailExcel(title, sub);
  }
}

function _mekPrintCardDetail(title, subtitle) {
  var tbl = document.getElementById('mekCardDetailTable');
  if (!tbl) return;
  var css = [
    '* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }',
    'body { font-family: Arial, sans-serif; font-size: 10px; margin: 0; padding: 8px; }',
    'h2 { font-size: 13px; margin: 0 0 2px; color: #1a3a5c; }',
    'p  { font-size: 10px; margin: 0 0 6px; color: #718096; }',
    'table { width: 100%; table-layout: auto; border-collapse: collapse; }',
    'th { background: #2d4a6a !important; color: #fff !important; padding: 4px 6px; font-size: 9px; text-align: left; border: 1px solid #2d4a6a; white-space: normal; word-break: break-word; }',
    'td { padding: 3px 6px; font-size: 9px; border: 1px solid #e2e8f0; vertical-align: middle; white-space: normal !important; word-break: break-word; }',
    'tr:nth-child(even) td { background: #f7fafc !important; }',
    '@media print { @page { size: A4 landscape; margin: 6mm; } }'
  ].join('\n');

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' + css + '</style></head><body>' +
    '<h2>' + title + '</h2>' +
    (subtitle ? '<p>' + subtitle + '</p>' : '') +
    tbl.outerHTML +
    '</body></html>';

  var w = window.open('','_blank','width=900,height=600');
  if (!w) { showToast('Pop-up diblokir browser, izinkan pop-up dulu.', 'warning'); return; }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(function(){ w.print(); w.close(); }, 400);
}

function _mekExportCardDetailExcel(title, subtitle) {
  var tbl = document.getElementById('mekCardDetailTable');
  if (!tbl) return;
  var clone = tbl.cloneNode(true);
  var srcCells = tbl.querySelectorAll('th,td');
  var dstCells = clone.querySelectorAll('th,td');
  srcCells.forEach(function(src, i){
    var cs  = window.getComputedStyle(src);
    var dst = dstCells[i];
    if (!dst) return;
    dst.style.backgroundColor = cs.backgroundColor;
    dst.style.color            = cs.color;
    dst.style.fontWeight       = cs.fontWeight;
    dst.style.textAlign        = cs.textAlign;
    dst.style.fontSize         = '9pt';
    dst.style.padding          = '3px 6px';
    dst.style.border           = '1px solid #d0d0d0';
    dst.style.whiteSpace       = 'nowrap';
    dst.querySelectorAll('button,input').forEach(function(el){ el.remove(); });
  });
  clone.style.borderCollapse = 'collapse';
  clone.style.width          = '100%';
  clone.style.fontFamily     = 'Calibri, Arial, sans-serif';

  var html =
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
           'xmlns:x="urn:schemas-microsoft-com:office:excel" ' +
           'xmlns="http://www.w3.org/TR/REC-html40">' +
    '<head><meta charset="UTF-8">' +
    '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>' +
    '<x:ExcelWorksheet><x:Name>Data</x:Name>' +
    '<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>' +
    '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->' +
    '</head><body>' +
    '<h3 style="font-family:Calibri,Arial;font-size:13pt;margin:0 0 2px;">' + title + '</h3>' +
    (subtitle ? '<p style="font-family:Calibri,Arial;font-size:9pt;color:#718096;margin:0 0 8px;">' + subtitle + '</p>' : '') +
    clone.outerHTML +
    '</body></html>';

  var blob     = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  var url      = URL.createObjectURL(blob);
  var filename = title.replace(/[^a-zA-Z0-9_]/g,'_') + '_' + new Date().toISOString().slice(0,10) + '.xls';
  var a        = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
  showToast('File Excel berhasil diunduh.', 'success');
}

function mekCloseCardDetail() {
  var overlay = document.getElementById('mekCardDetailOverlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  setTimeout(function(){ overlay.style.display = 'none'; }, 180);
}

// ════════════════════════════════════════════════════════════
// STATUS FILTER DROPDOWN (multi-select)
// ════════════════════════════════════════════════════════════
function mekToggleStatusDropdown(sfx) {
  sfx = sfx || '';
  var menu = document.getElementById('mekCapStatusMenu' + sfx);
  if (!menu) return;
  var isOpen = menu.style.display !== 'none';
  // Tutup semua dropdown status dulu
  ['','W'].forEach(function(s){
    var m = document.getElementById('mekCapStatusMenu'+s);
    if (m) m.style.display = 'none';
  });
  if (!isOpen) menu.style.display = 'block';
}

// Tutup dropdown kalau klik di luar
document.addEventListener('click', function(e) {
  ['','W'].forEach(function(sfx){
    var wrap = document.getElementById('mekCapStatusWrap'+sfx);
    var menu = document.getElementById('mekCapStatusMenu'+sfx);
    if (wrap && menu && !wrap.contains(e.target)) menu.style.display = 'none';
  });
});

function mekGetStatusFilter(sfx) {
  sfx = sfx || '';
  var menuId = 'mekCapStatusMenu' + sfx;
  var menu = document.getElementById(menuId);
  if (!menu) return [];
  var checked = [];
  menu.querySelectorAll('input[type="checkbox"][value]').forEach(function(cb){
    if (cb.checked) checked.push(cb.value);
  });
  return checked; // kosong = all
}

var _mekStatusChanging = false;

function mekStatusFilterChange(sfx) {
  if (_mekStatusChanging) { console.log('[STATUS] blocked'); return; }
  sfx = sfx || '';
  var checked = mekGetStatusFilter(sfx);
  console.log('[STATUS] sfx='+sfx+' checked='+JSON.stringify(checked)+' mode='+_mekCapMode+' emailView='+_mekCapEmailView+' capData='+(_mekCapData||[]).length+' emailData='+(_mekCapEmailData||[]).length);
  var allCb   = document.getElementById('mekCapStatusAll' + sfx);
  var label   = document.getElementById('mekCapStatusLabel' + sfx);
  var allStatuses = ['keluar','loading','daftar','belum'];

  // Sinkron checkbox "Semua" tanpa trigger onchange-nya
  _mekStatusChanging = true;
  if (allCb) allCb.checked = (checked.length === 0 || checked.length === allStatuses.length);
  _mekStatusChanging = false;

  // Update label tombol
  if (label) {
    if (!checked.length || checked.length === allStatuses.length) {
      label.textContent = 'All';
    } else {
      label.textContent = checked.map(function(v){
        return v === 'daftar' ? 'Daftar' : v.charAt(0).toUpperCase() + v.slice(1);
      }).join(', ');
    }
  }

  // Re-render langsung dari data yang sudah ada (tanpa re-fetch)
  if (_mekCapMode !== 'email') {
    // Mode all/wa/si (By Planning non-email)
    var data = (_mekCapData || []).slice();
    if (checked.length && checked.length < allStatuses.length) {
      data = data.filter(function(r){ return _mekMatchStatus(r.status, checked); });
    }
    _mekRenderCapaian(data, _mekCapFilter);
  } else if (_mekCapEmailView === 'plan') {
    // Mode email By Planning — filter dari _mekCapEmailData
    var data2 = (_mekCapEmailData || []).slice();
    if (checked.length && checked.length < allStatuses.length) {
      data2 = data2.filter(function(r){ return _mekMatchStatus(r.status, checked); });
    }
    var skuF2 = ((document.getElementById('mekCapSku')||{}).value||'').trim().toLowerCase();
    var docF2 = _mekStripLeadingZero(((document.getElementById('mekCapDoc')||{}).value||'').trim());
    var tujF2 = ((document.getElementById('mekCapTujuan')||{}).value||'').trim().toLowerCase();
    _mekRenderCapaianEmail(data2, skuF2, docF2, tujF2);
  } else {
    // Mode email By Aktual
    _mekRenderCapaianEmailAktual(_mekCapEmailData);
  }
}

function mekStatusAllChange(sfx) {
  if (_mekStatusChanging) return;
  sfx = sfx || '';
  _mekStatusChanging = true;
  var menu = document.getElementById('mekCapStatusMenu' + sfx);
  if (menu) {
    menu.querySelectorAll('input[type="checkbox"][value]').forEach(function(cb){
      cb.checked = false;
    });
  }
  _mekStatusChanging = false;
  var label = document.getElementById('mekCapStatusLabel' + sfx);
  if (label) label.textContent = 'All';

  // Re-render dengan semua status (reset ke all)
  if (_mekCapMode !== 'email') {
    _mekRenderCapaian((_mekCapData || []).slice(), _mekCapFilter);
  } else if (_mekCapEmailView === 'plan') {
    var skuF = ((document.getElementById('mekCapSku')||{}).value||'').trim().toLowerCase();
    var docF = _mekStripLeadingZero(((document.getElementById('mekCapDoc')||{}).value||'').trim());
    var tujF = ((document.getElementById('mekCapTujuan')||{}).value||'').trim().toLowerCase();
    _mekRenderCapaianEmail((_mekCapEmailData||[]).slice(), skuF, docF, tujF);
  } else {
    _mekRenderCapaianEmailAktual(_mekCapEmailData);
  }
}

// Helper: cek apakah row lolos filter status
function _mekMatchStatus(rowStatus, statusFilter) {
  if (!statusFilter || !statusFilter.length) return true; // all
  return statusFilter.indexOf(rowStatus || 'belum') >= 0;
}

// Reset status filter ke All
function _mekResetStatusFilter(sfx) {
  sfx = sfx || '';
  var menu = document.getElementById('mekCapStatusMenu' + sfx);
  if (!menu) return;
  menu.querySelectorAll('input[type="checkbox"][value]').forEach(function(cb){ cb.checked = false; });
  var allCb = document.getElementById('mekCapStatusAll' + sfx);
  if (allCb) allCb.checked = true;
  var label = document.getElementById('mekCapStatusLabel' + sfx);
  if (label) label.textContent = 'All';
}
// ════════════════════════════════════════════════════════════
function _mekSumQtyKrt(v) {
  // v bisa berupa "1154", "1154,1078" (multi container), atau angka
  if (!v) return 0;
  var parts = String(v).split(',');
  var total = 0;
  parts.forEach(function(p){ total += Number(String(p).trim()) || 0; });
  return total;
}
function _mekExtractQtyKrt(ket) {
  // KET bisa berisi QTY_KRT:1154 atau QTY_KRT:1154,2300 (multi container)
  var m = String(ket||'').match(/QTY_KRT:([^|]+)/);
  if (!m) return 0;
  return _mekSumQtyKrt(m[1]);
}

function mekShowBySkuDetail() {
  var overlay = document.getElementById('mekCardDetailOverlay');
  var title   = document.getElementById('mekCardDetailTitle');
  var thead   = document.getElementById('mekCardDetailThead');
  var tbody   = document.getElementById('mekCardDetailTbody');
  var count   = document.getElementById('mekCardDetailCount');
  var btnBar  = document.getElementById('mekCardDetailBtnBar');
  if (!overlay) return;

  var from = (document.getElementById('mekCapFrom')||{}).value||'';
  var to   = (document.getElementById('mekCapTo')||{}).value||'';

  // Sumber data tergantung mode aktif (sama seperti mekShowCardDetail)
  var _srcData;
  var isEmailMode = (_mekCapMode === 'email');
  if (isEmailMode) {
    _srcData = _mekCapEmailData;
  } else {
    _srcData = (_mekCapData||[]).map(function(r){
      return {
        planTgl:    r.tanggal || r.tgl || '',
        noSo:       r.noSo || '',
        sku:        r.sku  || '',
        nama:       r.nama || '',
        tujuan:     r.tujuan || '',
        ket:        r.ket || '',
        jumlahCont: r._jumlahCont || r.jumlahCont || 0,
        isFirstRow: !!r.isFirstRow,
        status:     r.status || 'belum'
      };
    });
  }

  // Filter aktif yang sama dengan tabel utama
  var skuF   = ((document.getElementById('mekCapSku')   ||{}).value||'').toLowerCase().trim();
  var tujF   = ((document.getElementById('mekCapTujuan')||{}).value||'').toLowerCase().trim();
  var plantF = ((document.getElementById('mekCapPlant') ||{}).value||'').trim().toUpperCase();

  var filtered = _srcData.filter(function(r){
    if (from && r.planTgl < from) return false;
    if (to   && r.planTgl > to)   return false;
    if (skuF   && (r.sku||'').toLowerCase().indexOf(skuF)<0 && (r.nama||'').toLowerCase().indexOf(skuF)<0) return false;
    if (tujF   && (r.tujuan||'').toLowerCase().indexOf(tujF)<0) return false;
    if (plantF && !_mekMatchPlant(r.plant, plantF, r)) return false;
    return true;
  });

  // Rekap per SKU — Termuat & Belum dihitung dalam satuan KARTON (krt),
  // bukan jumlah truk/container.
  // Pendekatan: tiap planning (noSo+sku+planTgl) punya daftar qty krt per
  // container, urut sesuai urutan kemunculan baris realisasi-nya (1:1 dengan
  // urutan truk yang di-assign backend). Baris ke-N dalam grup → qty krt ke-N.
  var skuMap = {};
  var groupRowIdx  = {};   // pk → counter urutan baris realisasi dalam grup
  var groupQtyArr  = {};   // pk → array qty krt per container [krt1, krt2, ...]
  var groupQtyUsed = {};   // pk → total krt yang sudah ke-assign ke truk

  filtered.forEach(function(r){
    var pk = (r.noSo||r.sku||'') + '|' + (r.sku||'') + '|' + (r.planTgl||'');
    if (groupQtyArr[pk] === undefined) {
      var qtyStr = isEmailMode ? (r.qty||'') : '';
      if (!isEmailMode) {
        // mode planning: qty krt ada di field ket baris pertama
        var mket = String(r.ket||'').match(/QTY_KRT:([^|]+)/);
        qtyStr = mket ? mket[1] : '';
      }
      groupQtyArr[pk]  = qtyStr ? String(qtyStr).split(',').map(function(x){ return Number(String(x).trim())||0; }) : [];
      groupQtyUsed[pk] = 0;
      groupRowIdx[pk]  = 0;
    }
  });

  filtered.forEach(function(r){
    var key = r.sku || '—';
    if (!skuMap[key]) {
      skuMap[key] = { sku: r.sku||'—', nama: r.nama||'', planCont: 0, termuatCont: 0, qtyKrt: 0, termuat: 0, belum: 0 };
    }
    var m = skuMap[key];
    var pk = (r.noSo||r.sku||'') + '|' + (r.sku||'') + '|' + (r.planTgl||'');

    // Plan cont + total qty karton dihitung sekali per planning (baris pertama)
    if (r.isFirstRow) {
      m.planCont += (r.jumlahCont || 0);
      m.qtyKrt   += (groupQtyArr[pk]||[]).reduce(function(a,b){ return a+b; }, 0);
    }

    // Index krt tetap jalan buat SEMUA truk terdaftar (keluar/loading/daftar)
    // supaya urutan angka di QTY_KRT tetap nempel ke truk yang benar --
    // tapi yang dihitung ke "Termuat" cuma yang status-nya sudah KELUAR.
    if (r.status === 'keluar' || r.status === 'loading' || r.status === 'daftar') {
      var idx = groupRowIdx[pk]++;
      var krt = (groupQtyArr[pk]||[])[idx] || 0;
      if (r.status === 'keluar') {
        groupQtyUsed[pk] += krt;
        m.termuat     += krt;
        m.termuatCont += 1;
      }
    }
  });

  // Belum (krt) = total qty krt planning - krt yang sudah termuat, per grup
  filtered.forEach(function(r){
    var pk = (r.noSo||r.sku||'') + '|' + (r.sku||'') + '|' + (r.planTgl||'');
    if (!r.isFirstRow) return;
    var key = r.sku || '—';
    var m = skuMap[key];
    if (!m) return;
    var totalKrt  = (groupQtyArr[pk]||[]).reduce(function(a,b){ return a+b; }, 0);
    var sisaKrt   = Math.max(0, totalKrt - (groupQtyUsed[pk]||0));
    m.belum += sisaKrt;
  });

  // Sisa Cont = container yang belum ada truknya (plan cont - termuat cont)
  Object.keys(skuMap).forEach(function(k){
    var m = skuMap[k];
    m.sisaCont = Math.max(0, m.planCont - m.termuatCont);
  });

  var rows = Object.values(skuMap).sort(function(a,b){ return b.planCont - a.planCont; });

  // Simpan state filter saat ini supaya tombol "Kembali" di popup FIFO bisa restore
  _mekBySkuLastState = { rows: rows };
  _mekBySkuRows = rows;

  title.textContent = 'Capaian By SKU';
  if (btnBar) btnBar.style.display = 'none';

  thead.innerHTML = '<tr>' +
    '<th style="padding:7px 10px;text-align:left;">SKU</th>' +
    '<th style="padding:7px 10px;text-align:left;">NAMA</th>' +
    '<th style="padding:7px 10px;text-align:right;">PLAN CONT</th>' +
    '<th style="padding:7px 10px;text-align:right;">SISA CONT</th>' +
    '<th style="padding:7px 10px;text-align:right;">QTY KRT</th>' +
    '<th style="padding:7px 10px;text-align:right;">TERMUAT (KRT)</th>' +
    '<th style="padding:7px 10px;text-align:right;">BELUM (KRT)</th>' +
    '</tr>';

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#a0aec0;">Tidak ada data</td></tr>';
  } else {
    tbody.innerHTML = rows.map(function(r, i){
      var bg = i%2===0 ? '' : 'background:#f8fafc;';
      return '<tr style="'+bg+'">' +
        '<td style="padding:7px 10px;font-weight:700;color:#2b6cb0;">'+_mekEsc(r.sku)+'</td>' +
        '<td style="padding:7px 10px;max-width:200px;color:#2b6cb0;text-decoration:underline;cursor:pointer;" onclick="mekShowBinFifoDetailByIdx('+i+')" title="Lihat posisi rak (FIFO)">'+_mekEsc(r.nama)+'</td>' +
        '<td style="padding:7px 10px;text-align:right;font-weight:600;">'+r.planCont+'</td>' +
        '<td style="padding:7px 10px;text-align:right;font-weight:700;color:#c05621;">'+(r.sisaCont ? r.sisaCont.toLocaleString('id-ID') : '—')+'</td>' +
        '<td style="padding:7px 10px;text-align:right;color:#744210;font-weight:600;">'+(r.qtyKrt ? r.qtyKrt.toLocaleString('id-ID') : '—')+'</td>' +
        '<td style="padding:7px 10px;text-align:right;font-weight:700;color:#276749;">'+(r.termuat ? r.termuat.toLocaleString('id-ID') : '—')+'</td>' +
        '<td style="padding:7px 10px;text-align:right;font-weight:700;color:#c53030;">'+(r.belum ? r.belum.toLocaleString('id-ID') : '—')+'</td>' +
        '</tr>';
    }).join('');
  }

  if (count) {
    count.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
        '<span>' + rows.length + ' SKU</span>' +
        '<span style="font-size:10px;color:#a0aec0;font-style:italic;">*Container yang sudah daftar terhitung selesai (termuat). Klik nama barang untuk lihat posisi rak (FIFO).</span>' +
      '</div>';
  }

  overlay.classList.remove('show');
  overlay.style.display = 'flex';
  void overlay.offsetWidth;
  overlay.classList.add('show');
}

// ════════════════════════════════════════════════════════════
// BY SKU → klik nama barang → posisi rak BinLoc (FIFO)
// ════════════════════════════════════════════════════════════
function mekBackToBySkuDetail() {
  // Render ulang konten By SKU dari state yang tersimpan (tanpa re-fetch)
  if (!_mekBySkuLastState) { mekShowBySkuDetail(); return; }
  var title  = document.getElementById('mekCardDetailTitle');
  var thead  = document.getElementById('mekCardDetailThead');
  var tbody  = document.getElementById('mekCardDetailTbody');
  var count  = document.getElementById('mekCardDetailCount');
  var btnBar = document.getElementById('mekCardDetailBtnBar');
  var rows   = _mekBySkuLastState.rows;
  _mekBySkuRows = rows;

  title.textContent = 'Capaian By SKU';
  if (btnBar) btnBar.style.display = 'none';

  thead.innerHTML = '<tr>' +
    '<th style="padding:7px 10px;text-align:left;">SKU</th>' +
    '<th style="padding:7px 10px;text-align:left;">NAMA</th>' +
    '<th style="padding:7px 10px;text-align:right;">PLAN CONT</th>' +
    '<th style="padding:7px 10px;text-align:right;">SISA CONT</th>' +
    '<th style="padding:7px 10px;text-align:right;">QTY KRT</th>' +
    '<th style="padding:7px 10px;text-align:right;">TERMUAT (KRT)</th>' +
    '<th style="padding:7px 10px;text-align:right;">BELUM (KRT)</th>' +
    '</tr>';

  tbody.innerHTML = rows.map(function(r, i){
    var bg = i%2===0 ? '' : 'background:#f8fafc;';
    return '<tr style="'+bg+'">' +
      '<td style="padding:7px 10px;font-weight:700;color:#2b6cb0;">'+_mekEsc(r.sku)+'</td>' +
      '<td style="padding:7px 10px;max-width:200px;color:#2b6cb0;text-decoration:underline;cursor:pointer;" onclick="mekShowBinFifoDetailByIdx('+i+')" title="Lihat posisi rak (FIFO)">'+_mekEsc(r.nama)+'</td>' +
      '<td style="padding:7px 10px;text-align:right;font-weight:600;">'+r.planCont+'</td>' +
      '<td style="padding:7px 10px;text-align:right;font-weight:700;color:#c05621;">'+(r.sisaCont ? r.sisaCont.toLocaleString('id-ID') : '—')+'</td>' +
      '<td style="padding:7px 10px;text-align:right;color:#744210;font-weight:600;">'+(r.qtyKrt ? r.qtyKrt.toLocaleString('id-ID') : '—')+'</td>' +
      '<td style="padding:7px 10px;text-align:right;font-weight:700;color:#276749;">'+(r.termuat ? r.termuat.toLocaleString('id-ID') : '—')+'</td>' +
      '<td style="padding:7px 10px;text-align:right;font-weight:700;color:#c53030;">'+(r.belum ? r.belum.toLocaleString('id-ID') : '—')+'</td>' +
      '</tr>';
  }).join('');

  if (count) {
    count.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
        '<span>' + rows.length + ' SKU</span>' +
        '<span style="font-size:10px;color:#a0aec0;font-style:italic;">*Container yang sudah daftar terhitung selesai (termuat). Klik nama barang untuk lihat posisi rak (FIFO).</span>' +
      '</div>';
  }
}

var _mekBySkuRows = [];

function mekShowBinFifoDetailByIdx(idx) {
  var r = _mekBySkuRows[idx];
  if (!r) return;
  mekShowBinFifoDetail(r.sku, r.nama, r.belum || 0);
}

function mekShowBinFifoDetail(sku, nama, qtyBelumKrt) {
  var title  = document.getElementById('mekCardDetailTitle');
  var thead  = document.getElementById('mekCardDetailThead');
  var tbody  = document.getElementById('mekCardDetailTbody');
  var count  = document.getElementById('mekCardDetailCount');
  var btnBar = document.getElementById('mekCardDetailBtnBar');

  title.textContent = 'Posisi Rak — ' + sku;

  // Tombol kembali
  if (btnBar) {
    btnBar.style.display = 'block';
    btnBar.innerHTML = '<button onclick="mekBackToBySkuDetail()" style="background:#edf2f7;border:1px solid #cbd5e0;color:#2d3748;border-radius:6px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;">' +
      '<i class="fas fa-arrow-left"></i> Kembali ke By SKU</button>';
  }

  thead.innerHTML = '<tr>' +
    '<th style="padding:7px 10px;text-align:left;">BIN</th>' +
    '<th style="padding:7px 10px;text-align:left;">TIPE</th>' +
    '<th style="padding:7px 10px;text-align:left;">PRODATE</th>' +
    '<th style="padding:7px 10px;text-align:left;">QUOTATION</th>' +
    '<th style="padding:7px 10px;text-align:right;">STOK (KRT)</th>' +
    '<th style="padding:7px 10px;text-align:right;">DIAMBIL (KRT)</th>' +
    '</tr>';

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#a0aec0;"><i class="fas fa-spinner fa-spin"></i> Memuat posisi rak...</td></tr>';
  if (count) count.innerHTML = '';

  if (!qtyBelumKrt || qtyBelumKrt <= 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#a0aec0;">Tidak ada qty sisa yang perlu dicari (Belum = 0)</td></tr>';
    return;
  }

  API.getBinFifoAllocation(sku, qtyBelumKrt, function(res) {
    if (!res || !res.success) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#c53030;">Gagal memuat data BinLoc'+(res&&res.message?': '+_mekEsc(res.message):'')+'</td></tr>';
      return;
    }
    var allocs = res.allocations || [];
    if (!allocs.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#a0aec0;">Stok tidak ditemukan di BinLoc untuk SKU ini</td></tr>';
    } else {
      tbody.innerHTML = allocs.map(function(a, i){
        var bg = i%2===0 ? '' : 'background:#f8fafc;';
        return '<tr style="'+bg+'">' +
          '<td style="padding:7px 10px;font-weight:700;color:#2b6cb0;">'+_mekEsc(a.binLoc)+'</td>' +
          '<td style="padding:7px 10px;">'+_mekEsc(a.tipe)+'</td>' +
          '<td style="padding:7px 10px;">'+_mekEsc(a.prodate)+'</td>' +
          '<td style="padding:7px 10px;color:#718096;">'+_mekEsc(a.quotation||'—')+'</td>' +
          '<td style="padding:7px 10px;text-align:right;">'+a.stokKrt.toLocaleString('id-ID')+'</td>' +
          '<td style="padding:7px 10px;text-align:right;font-weight:700;color:#276749;">'+a.ambilKrt.toLocaleString('id-ID')+'</td>' +
          '</tr>';
      }).join('');
    }

    var footNote = res.fulfilled
      ? '<span style="color:#276749;">✓ Kebutuhan '+qtyBelumKrt.toLocaleString('id-ID')+' krt terpenuhi dari '+allocs.length+' rak</span>'
      : '<span style="color:#c53030;">⚠ Stok kurang '+res.kurang.toLocaleString('id-ID')+' krt dari kebutuhan '+qtyBelumKrt.toLocaleString('id-ID')+' krt</span>';

    if (count) {
      count.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
          '<span>'+footNote+'</span>' +
          '<span style="font-size:10px;color:#a0aec0;font-style:italic;">Urutan FIFO — PRODATE paling tua diambil duluan</span>' +
        '</div>';
    }
  }, function(err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#c53030;">Gagal memuat: '+_mekEsc(String(err))+'</td></tr>';
  });
}

function mekCapSetFilter(f) {
  _mekCapFilter = f;
  var btns = ['mekCapFAll','mekCapFDatang','mekCapFBelum'];
  btns.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('active', id === 'mekCapF' + (f==='all'?'All':f==='datang'?'Datang':'Belum'));
  });
  _mekRenderCapaian(_mekCapData, f);
}

function mekCapSwitchFilterMode(mode) {
  var divDate = document.getElementById('mekCapFilterDate');
  var divWeek = document.getElementById('mekCapFilterWeek');
  var btnDate = document.getElementById('mekCapBtnDate');
  var btnWeek = document.getElementById('mekCapBtnWeek');
  var info    = document.getElementById('mekCapWeekInfo');
  if (divDate) divDate.style.display = mode === 'date' ? '' : 'none';
  if (divWeek) divWeek.style.display = mode === 'week' ? '' : 'none';
  if (btnDate) btnDate.classList.toggle('active', mode === 'date');
  if (btnWeek) btnWeek.classList.toggle('active', mode === 'week');
  if (info)    info.style.display = 'none';
}

function mekCapApplyWeek() {
  var wFrom = parseInt((document.getElementById('mekCapWeekFrom') || {}).value) || 0;
  var wTo   = parseInt((document.getElementById('mekCapWeekTo')   || {}).value) || wFrom;
  var year  = parseInt((document.getElementById('mekCapWeekYear') || {}).value) || new Date().getFullYear();
  if (!wFrom) { showToast('Isi nomor Week', 'warning'); return; }
  if (wFrom > wTo) { showToast('Week dari harus ≤ Week sampai', 'warning'); return; }
  var rf = _mekGetISOWeekRange(wFrom, year);
  var rt = _mekGetISOWeekRange(wTo,   year);
  var ef  = document.getElementById('mekCapFrom'); if (ef)  ef.value  = rf.from;
  var et  = document.getElementById('mekCapTo');   if (et)  et.value  = rt.to;
  var es  = document.getElementById('mekCapSku');    if (es)  es.value  = (document.getElementById('mekCapSkuW')||{}).value||'';
  var ed  = document.getElementById('mekCapDoc');    if (ed)  ed.value  = (document.getElementById('mekCapDocW')||{}).value||'';
  var enp = document.getElementById('mekCapNopol');  if (enp) enp.value = (document.getElementById('mekCapNopolW')||{}).value||'';
  var etj = document.getElementById('mekCapTujuan'); if (etj) etj.value = (document.getElementById('mekCapTujuanW')||{}).value||'';
  var epl = document.getElementById('mekCapPlant');  if (epl) epl.value = (document.getElementById('mekCapPlantW')||{}).value||'';
  var infoTxt = document.getElementById('mekCapWeekInfoText');
  if (infoTxt) infoTxt.innerText = 'Week '+wFrom+(wFrom!==wTo?' – Week '+wTo:'')+' '+year+' = '+_mekFmtTglDisplay(rf.from)+' s/d '+_mekFmtTglDisplay(rt.to);
  var info = document.getElementById('mekCapWeekInfo'); if (info) info.style.display='block';
  mekLoadCapaian();
}

function mekResetCapaian() {
  ['mekCapSku','mekCapDoc','mekCapNopol','mekCapPlant','mekCapTujuan','mekCapSkuW','mekCapDocW','mekCapNopolW','mekCapPlantW','mekCapTujuanW',
   'mekCapFrom','mekCapTo','mekCapWeekFrom','mekCapWeekTo','mekCapYear'
  ].forEach(function(id){
    var el=document.getElementById(id); if(el) el.value='';
  });
  // Reset ke week ini
  var today2=new Date(), dow2=today2.getDay(), diffM2=(dow2===0)?-6:1-dow2;
  var mon2=new Date(today2); mon2.setDate(today2.getDate()+diffM2);
  var sun2=new Date(mon2);   sun2.setDate(mon2.getDate()+6);
  var ef=document.getElementById('mekCapFrom'); if(ef) ef.value=mon2.getFullYear()+'-'+String(mon2.getMonth()+1).padStart(2,'0')+'-'+String(mon2.getDate()).padStart(2,'0');
  var et=document.getElementById('mekCapTo');   if(et) et.value=sun2.getFullYear()+'-'+String(sun2.getMonth()+1).padStart(2,'0')+'-'+String(sun2.getDate()).padStart(2,'0');
  var info=document.getElementById('mekCapWeekInfo'); if(info) info.style.display='none';
  // Reset status filter
  _mekResetStatusFilter('');
  _mekResetStatusFilter('W');
}

function _mekRenderCapaian(data, statusFilter) {
  var tbody  = document.getElementById('mekCapTbody');
  var ctEl   = document.getElementById('mekCapRowCount');
  if (!tbody) return;
  statusFilter = statusFilter || 'all';

  // Hitung summary — totalCont dari planning, status dari tiap baris realisasi
  var totalCont=0, keluarCont=0, daftarCont=0, loadingCont=0, belumCont=0;
  var seenPlanKey = {};
  data.forEach(function(r) {
    // Total planning: hitung dari _jumlahCont baris pertama per planKey
    if (!seenPlanKey[r._planKey]) {
      seenPlanKey[r._planKey] = true;
      totalCont += (r._jumlahCont || 0);
    }
    // Status per baris aktual
    if      (r.status === 'keluar')  keluarCont++;
    else if (r.status === 'loading') loadingCont++;
    else if (r.status === 'daftar')  daftarCont++;
    else                             belumCont++;
  });
  var datangCont = keluarCont + loadingCont + daftarCont;
  var belumReal  = Math.max(0, totalCont - datangCont);  // belum = planning - datang
  var pct = totalCont > 0 ? Math.round((keluarCont/totalCont)*100) : 0;

  _mekSetCard('mekCapCardTotal',   totalCont);
  _mekSetCard('mekCapCardDatang',  datangCont);
  _mekSetCard('mekCapCardKeluar',  keluarCont);
  _mekSetCard('mekCapCardDaftar',  loadingCont + daftarCont);
  _mekSetCard('mekCapCardBelum',   belumReal);
  var pctEl = document.getElementById('mekCapCardPct');
  if (pctEl) pctEl.textContent = totalCont ? (Math.round(keluarCont/totalCont*100) + '%') : '—';
  if (ctEl)  ctEl.textContent  = data.length + ' data';

  // Filter tampilan
  var filtered = data;
  if (statusFilter === 'datang') {
    // Tampilkan hanya planning yang punya minimal 1 realisasi + semua baris realisasinya
    var keysWithRealisasi = {};
    data.forEach(function(r){ if(r.status!=='belum') keysWithRealisasi[r._planKey]=true; });
    filtered = data.filter(function(r){ return keysWithRealisasi[r._planKey]; });
  } else if (statusFilter === 'belum') {
    // Tampilkan hanya planning yang semua barisnya belum
    var keysWithRealisasi2 = {};
    data.forEach(function(r){ if(r.status!=='belum') keysWithRealisasi2[r._planKey]=true; });
    filtered = data.filter(function(r){ return !keysWithRealisasi2[r._planKey]; });
  }

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;padding:40px;color:#a0aec0;">' +
      '<i class="fas fa-box-open" style="font-size:28px;display:block;margin-bottom:8px;opacity:.2;"></i>Tidak ada data</td></tr>';
    return;
  }

  var STATUS = {
    keluar:  { label:'✅ Keluar',  bg:'#c6f6d5', color:'#276749' },
    loading: { label:'🔄 Loading', bg:'#e9d8fd', color:'#6b46c1' },
    daftar:  { label:'🚛 Daftar',  bg:'#bee3f8', color:'#2b6cb0' },
    belum:   { label:'⏳ Belum',   bg:'#fed7d7', color:'#9b2c2c' },
    cancel:  { label:'❌ Cancel',  bg:'#e2e8f0', color:'#718096' }
  };

  var rows = '';
  filtered.forEach(function(r, i) {
    var st  = STATUS[r.status] || STATUS.belum;
    var srcUp = (r.source||'').toUpperCase();
    var src = srcUp === 'SI'
      ? '<span style="background:#e9d8fd;color:#6b46c1;border-radius:8px;padding:1px 7px;font-size:10px;font-weight:700;">SI</span>'
      : srcUp === 'WA'
        ? '<span style="background:#c6f6d5;color:#276749;border-radius:8px;padding:1px 7px;font-size:10px;font-weight:700;">WA</span>'
        : srcUp === 'EMAIL'
          ? '<span style="background:#fefcbf;color:#744210;border-radius:8px;padding:1px 7px;font-size:10px;font-weight:700;">EMAIL</span>'
          : srcUp === 'EMAIL_CANCEL'
            ? '<span style="background:#e2e8f0;color:#9b2c2c;border-radius:8px;padding:1px 7px;font-size:10px;font-weight:700;text-decoration:line-through;">CANCEL</span>'
            : '';

    // Border atas tebal untuk setiap baris pertama planning baru
    var borderTop = r.isFirstRow && i > 0 ? 'border-top:2px solid #e2e8f0;' : '';

    rows += '<tr style="' + borderTop + '">' +
      '<td style="text-align:center;color:#a0aec0;font-size:11px;background:#f8fafc;' + borderTop + '">' + (i+1) + '</td>' +
      // Kolom planning — hanya diisi di baris pertama
      '<td style="white-space:nowrap;font-size:12px;' + borderTop + '">' + (r.tanggal ? _mekEsc(_mekFmtTglDisplay(r.tanggal)) : '') + '</td>' +
      '<td style="' + borderTop + '"><b style="font-size:12px;">' + _mekEsc(r.sku||'') + '</b></td>' +
      '<td style="font-size:12px;' + borderTop + '">' + _mekEsc(r.nama||'') + '</td>' +
      '<td style="text-align:right;font-weight:700;' + borderTop + '">' + (r.jumlahCont !== null ? r.jumlahCont : '') + '</td>' +
      '<td style="font-size:12px;' + borderTop + '">' + _mekEsc(r.tujuan||'') + '</td>' +
      // Kolom realisasi — semua baris
      '<td style="font-size:11px;font-family:monospace;color:#6b46c1;">' + _mekEsc(r.noDoc||'—') + '</td>' +
      '<td style="font-size:12px;">' + _mekEsc(r.nopol||'—') + '</td>' +
      '<td style="white-space:nowrap;font-size:11px;color:#4a5568;">' + _mekEsc(r.waktuDaftar||'—') + '</td>' +
      '<td style="white-space:nowrap;font-size:11px;color:#4a5568;">' + _mekEsc(r.prosesLoading||'—') + '</td>' +
      '<td style="white-space:nowrap;font-size:11px;color:#4a5568;">' + _mekEsc(r.waktuKeluar||'—') + '</td>' +
      '<td style="text-align:center;"><span style="padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;background:'+st.bg+';color:'+st.color+';">'+st.label+'</span></td>' +
      '<td style="text-align:center;">' + src + '</td>' +
      '</tr>';
  });
  tbody.innerHTML = rows;
}

// ════════════════════════════════════════════════════════════
// DOWNLOAD MENU TOGGLE
// ════════════════════════════════════════════════════════════
function mekToggleDownloadMenu() {
  var menu = document.getElementById('mekDownloadMenu');
  if (!menu) return;
  var isOpen = menu.style.display !== 'none';
  menu.style.display = isOpen ? 'none' : 'block';

  if (!isOpen) {
    // Tutup saat klik di luar
    setTimeout(function () {
      document.addEventListener('click', _mekCloseDownloadMenu);
    }, 10);
  }
}

function _mekCloseDownloadMenu(e) {
  var wrap = document.getElementById('mekDownloadWrap');
  if (wrap && !wrap.contains(e.target)) {
    var menu = document.getElementById('mekDownloadMenu');
    if (menu) menu.style.display = 'none';
    document.removeEventListener('click', _mekCloseDownloadMenu);
  }
}
