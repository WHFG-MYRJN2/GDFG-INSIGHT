function blInitPage() {
    if (!_blData.length) blLoadData(false);
    blStartAutoRefresh();
  }

  function blLoadData(showSpinner) {
    if (_blLoading) return;
    _blLoading = true;
    if (showSpinner) {
      document.getElementById('blTblWrap').innerHTML = '<div class="bl-empty"><i class="fas fa-spinner fa-spin"></i>Memuat data...</div>';
    }
    // Load BIN_CURRENT dan STD list paralel
    var binDone = false, stdDone = false;
    var binRows = [], stdMap = {};

    function tryRender() {
      if (!binDone || !stdDone) return;
      _blLoading = false;
      _blData   = binRows;
      _blStdMap = stdMap;
      blApplyFilter();
      blUpdateSummary();
      var now = new Date();
      document.getElementById('blLastRefresh').textContent =
        'Terakhir refresh: ' + now.toLocaleTimeString('id-ID');
      _blCountdown = _blInterval;
    }

    google.script.run
      .withSuccessHandler(function(rows) { binRows = rows || []; binDone = true; tryRender(); })
      .withFailureHandler(function() { binDone = true; tryRender(); })
      .getBinCurrent(null);

    google.script.run
      .withSuccessHandler(function(list) {
        stdMap = {};
        (list || []).forEach(function(s) { stdMap[s.kode] = s.std; });
        stdDone = true; tryRender();
      })
      .withFailureHandler(function() { stdDone = true; tryRender(); })
      .getBinSkuStdList();
  }

  function blStartAutoRefresh() {
    if (_blTimer) clearInterval(_blTimer);
    _blCountdown = _blInterval;
    _blTimer = setInterval(function() {
      var pg = document.getElementById('binLocPage');
      if (!pg || pg.style.display === 'none') return;
      _blCountdown--;
      document.getElementById('blAutoInfo').textContent = 'Auto-refresh: ' + _blCountdown + 's';
      if (_blCountdown <= 0) blLoadData(false);
    }, 1000);
  }

  function blApplyFilter() {
    var tipe = document.getElementById('blFilterTipe').value;
    var sku  = (document.getElementById('blFilterSku').value || '').toLowerCase().trim();
    var bin  = (document.getElementById('blFilterBin').value || '').toLowerCase().trim();
    _blFiltered = _blData.filter(function(r) {
      if (tipe && r.tipe !== tipe) return false;
      if (sku  && !r.skuKode.toLowerCase().includes(sku) && !r.skuNama.toLowerCase().includes(sku)) return false;
      if (bin  && !r.binLoc.toLowerCase().includes(bin)) return false;
      return true;
    });
    blRenderTable();
  }

  function blUpdateSummary() {
    var totalBin = {}, totalPallet = 0, lokalPallet = 0, eksporPallet = 0;
    var noStdSkus = {};
    _blData.forEach(function(r) {
      totalBin[r.binLoc] = true;
      totalPallet  += r.pallet;
      if (r.tipe === 'LOKAL')  lokalPallet  += r.pallet;
      if (r.tipe === 'EKSPOR') eksporPallet += r.pallet;
      if (!_blStdMap[r.skuKode]) noStdSkus[r.skuKode] = r.skuNama;
    });
    document.getElementById('blCardTotal').textContent  = Object.keys(totalBin).length;
    document.getElementById('blCardPallet').textContent = totalPallet.toLocaleString('id-ID');
    document.getElementById('blCardLokal').textContent  = lokalPallet.toLocaleString('id-ID');
    document.getElementById('blCardEkspor').textContent = eksporPallet.toLocaleString('id-ID');

    // Banner SKU tanpa STD
    var warnEl  = document.getElementById('blStdWarn');
    var listEl  = document.getElementById('blStdWarnList');
    var noStdArr = Object.keys(noStdSkus);
    if (noStdArr.length) {
      listEl.innerHTML = noStdArr.map(function(k) {
        return '<span style="background:#fef3c7;border:1px solid #f6e05e;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700">'
          + k + ' — ' + noStdSkus[k] + '</span>';
      }).join('');
      warnEl.style.display = 'block';
    } else {
      warnEl.style.display = 'none';
    }
  }

  function blRenderTable() {
    var wrap = document.getElementById('blTblWrap');
    document.getElementById('blRowCount').textContent =
      'Menampilkan ' + _blFiltered.length + ' dari ' + _blData.length + ' record';
    if (!_blFiltered.length) {
      wrap.innerHTML = '<div class="bl-empty"><i class="fas fa-search"></i>Tidak ada data yang cocok</div>';
      return;
    }
    var html = '<table class="bl-tbl"><thead><tr>'
      + '<th>BIN LOC</th><th>SKU</th><th>NAMA BARANG</th><th>TIPE</th>'
      + '<th>PRODATE</th><th style="text-align:right">PALLET</th>'
      + '<th style="text-align:right">PECAHAN</th><th style="text-align:right">KARTON</th>'
      + '<th>QUOTATION</th><th>LAST UPDATE</th><th>OPERATOR</th>'
      + '</tr></thead><tbody>';
    _blFiltered.forEach(function(r) {
      var tc      = r.tipe === 'LOKAL' ? 'lokal' : 'ekspor';
      var hasStd  = !!_blStdMap[r.skuKode];
      var stdWarn = !hasStd ? ' <span title="STD belum diisi" style="color:#b7791f;font-size:11px">⚠️</span>' : '';
      html += '<tr' + (!hasStd ? ' style="background:#fffbeb"' : '') + '>'
        + '<td><span class="bin-badge">' + _blEsc(r.binLoc) + '</span></td>'
        + '<td style="font-weight:700;color:#2b6cb0">' + _blEsc(r.skuKode) + stdWarn + '</td>'
        + '<td>' + _blEsc(r.skuNama) + '</td>'
        + '<td><span class="tipe-badge ' + tc + '">' + r.tipe + '</span></td>'
        + '<td>' + _blEsc(r.prodate) + '</td>'
        + '<td style="text-align:right"><span class="pallet-val">' + r.pallet + '</span></td>'
        + '<td style="text-align:right;color:#718096">' + (r.pecahan || 0) + '</td>'
        + '<td style="text-align:right;font-weight:700;color:#2b6cb0">' + (r.karton || '—') + '</td>'
        + '<td>' + _blEsc(r.quotation) + '</td>'
        + '<td style="font-size:11px;color:#718096">' + _blEsc(r.lastUpdate) + '</td>'
        + '<td>' + _blEsc(r.operator) + '</td>'
        + '</tr>';
    });
    html += '</tbody></table>';
    wrap.innerHTML = html;
  }

  function blSwitchTab(tab) {
    ['current','movement','map'].forEach(function(t) {
      var btn  = document.getElementById('blTab-' + t);
      var pane = document.getElementById('blPane-' + t);
      btn.classList.toggle('active', t === tab);
      if (t === tab) {
        pane.style.display = '';
        // Retrigger animation
        pane.classList.remove('bl-pane');
        void pane.offsetWidth;
        pane.classList.add('bl-pane');
      } else {
        pane.style.display = 'none';
      }
    });
    document.getElementById('blRefreshBtn').style.display = tab === 'current' ? '' : 'none';
    document.getElementById('blPdfBtn').style.display     = tab === 'current' ? '' : 'none';
    document.getElementById('blAutoInfo').style.display   = tab === 'current' ? '' : 'none';
    if (tab === 'movement' && !document.getElementById('blMovFrom').value) {
      var now  = new Date();
      var from = new Date(now); from.setDate(now.getDate() - 6);
      var pad  = function(n){ return String(n).padStart(2,'0'); };
      document.getElementById('blMovTo').value   = now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());
      document.getElementById('blMovFrom').value = from.getFullYear()+'-'+pad(from.getMonth()+1)+'-'+pad(from.getDate());
    }
    if (tab === 'map') { blRenderMap(); }
  }

  // ── Kapasitas per bin ──
  // ── Default kapasitas config ──
  var BL_CAP_DEFAULT = [
    { letter:'A', from:1,  to:28, cap:36 },
    { letter:'B', from:1,  to:25, cap:30 },
    { letter:'C', from:1,  to:25, cap:30 },
    { letter:'D', from:1,  to:25, cap:24 },
    { letter:'E', from:1,  to:25, cap:18 },
    { letter:'F', from:1,  to:25, cap:24 },
    { letter:'G', from:1,  to:25, cap:30 },
    { letter:'G', from:26, to:32, cap:24 },
    { letter:'H', from:1,  to:35, cap:36 },
    { letter:'I', from:1,  to:17, cap:12 },
    { letter:'I', from:18, to:31, cap:18 },
    { letter:'I', from:32, to:43, cap:24 }
  ];

  var _blCapConfig = null;

  function blCapLoad() {
    if (_blCapConfig) return _blCapConfig;
    try {
      var saved = localStorage.getItem('bl_cap_config');
      if (saved) { _blCapConfig = JSON.parse(saved); return _blCapConfig; }
    } catch(e) {}
    _blCapConfig = JSON.parse(JSON.stringify(BL_CAP_DEFAULT));
    return _blCapConfig;
  }

  function blMapCapacity(binLoc) {
    var m = binLoc.match(/^([A-Z]+)(\d+)$/);
    if (!m) return 0;
    var L = m[1], n = parseInt(m[2]);
    var cfg = blCapLoad();
    for (var i = 0; i < cfg.length; i++) {
      var c = cfg[i];
      if (c.letter === L && n >= c.from && n <= c.to) return c.cap;
    }
    return 0;
  }

  function blCapOpenModal() {
    var cfg = blCapLoad();
    blCapRenderRows(cfg);
    var overlay = document.getElementById('blCapOverlay');
    overlay.style.display = 'flex';
    overlay.style.background = 'rgba(0,0,0,0)';
    document.getElementById('blCapModal').style.animation = 'blPopIn .25s cubic-bezier(.34,1.56,.64,1)';
    setTimeout(function(){ overlay.style.background = 'rgba(0,0,0,.45)'; overlay.style.transition = 'background .22s'; }, 10);
  }

  function blCapCloseModal() {
    var overlay = document.getElementById('blCapOverlay');
    document.getElementById('blCapModal').style.animation = 'blPopOut .18s ease forwards';
    overlay.style.transition = 'background .18s';
    overlay.style.background = 'rgba(0,0,0,0)';
    setTimeout(function(){ overlay.style.display = 'none'; overlay.style.transition = ''; }, 190);
  }

  function blCapRenderRows(cfg) {
    var tbody = document.getElementById('blCapTbody');
    tbody.innerHTML = '';
    cfg.forEach(function(c, idx) {
      var tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #f0f4f8';
      tr.innerHTML =
        '<td style="padding:6px 8px"><input class="bl-cap-inp" style="text-transform:uppercase;width:52px" maxlength="2" value="' + c.letter + '" data-idx="' + idx + '" data-field="letter" oninput="this.value=this.value.toUpperCase()"></td>'
      + '<td style="padding:6px 8px"><input class="bl-cap-inp" style="width:58px" type="number" min="1" value="' + c.from + '" data-idx="' + idx + '" data-field="from"></td>'
      + '<td style="padding:6px 8px"><input class="bl-cap-inp" style="width:58px" type="number" min="1" value="' + c.to + '" data-idx="' + idx + '" data-field="to"></td>'
      + '<td style="padding:6px 8px"><input class="bl-cap-inp" style="width:68px;font-weight:800;color:#2b6cb0" type="number" min="1" value="' + c.cap + '" data-idx="' + idx + '" data-field="cap"></td>'
      + '<td style="padding:6px 8px"><button class="bl-cap-del" onclick="blCapDelRow(' + idx + ')">✕</button></td>';
      tbody.appendChild(tr);
    });
  }

  function blCapReadRows() {
    var inputs = document.querySelectorAll('#blCapTbody input');
    var temp = {};
    inputs.forEach(function(inp) {
      var idx   = inp.getAttribute('data-idx');
      var field = inp.getAttribute('data-field');
      if (!temp[idx]) temp[idx] = {};
      temp[idx][field] = field === 'letter' ? inp.value.trim().toUpperCase() : (parseInt(inp.value) || 0);
    });
    return Object.keys(temp).sort(function(a,b){return a-b;}).map(function(k){ return temp[k]; });
  }

  function blCapAddRow() {
    var cfg = blCapReadRows();
    cfg.push({ letter:'', from:1, to:1, cap:24 });
    blCapRenderRows(cfg);
    // Focus pada input letter baris baru
    var rows = document.querySelectorAll('#blCapTbody tr');
    var lastRow = rows[rows.length - 1];
    if (lastRow) lastRow.querySelector('input').focus();
  }

  function blCapDelRow(idx) {
    var cfg = blCapReadRows();
    cfg.splice(idx, 1);
    blCapRenderRows(cfg);
  }

  function blCapSave() {
    var cfg = blCapReadRows().filter(function(c){ return c.letter && c.from && c.to && c.cap; });
    if (!cfg.length) { showToast('⚠️ Tidak ada konfigurasi yang valid'); return; }
    try { localStorage.setItem('bl_cap_config', JSON.stringify(cfg)); } catch(e) {}
    _blCapConfig = cfg;
    blCapCloseModal();
    blRenderMap();
    showToast('✅ Kapasitas disimpan', 'success');
  }

  function blCapReset() {
    if (!confirm('Reset ke kapasitas default?')) return;
    _blCapConfig = JSON.parse(JSON.stringify(BL_CAP_DEFAULT));
    try { localStorage.removeItem('bl_cap_config'); } catch(e) {}
    blCapRenderRows(_blCapConfig);
  }



  function blMapColorClass(used, cap) {
    if (!cap || used === 0) return 'cap-empty';
    var pct = used / cap * 100;
    if (pct < 50)  return 'cap-green';
    if (pct < 75)  return 'cap-yellow';
    if (pct < 100) return 'cap-orange';
    return 'cap-red';
  }

  // Rows: letter = baris, number = kolom (horizontal layout)
  // Grup dipisah dengan gap visual
  var BL_MAP_ROWS = [
    { grp: true,  rows: [{ l:'A', max:28 }] },
    { gap: true },
    { grp: true,  rows: [{ l:'B', max:25 }, { l:'C', max:25 }] },
    { gap: true },
    { grp: true,  rows: [{ l:'D', max:25 }, { l:'E', max:25 }] },
    { gap: true },
    { grp: true,  rows: [{ l:'F', max:25 }, { l:'G', max:32 }] },
    { gap: true },
    { grp: true,  rows: [{ l:'H', max:35 }] },
    { gap: true },
    { grp: true,  rows: [{ l:'I', max:43 }] }
  ];
  var BL_MAP_MAX_COL = 43;

  function blRenderMap() {
    if (!_blData.length) {
      document.getElementById('blMapWrap').innerHTML =
        '<div class="bl-empty" style="padding:40px;text-align:center;color:#a0aec0">Muat data Stok terlebih dahulu (tab Stok Saat Ini → Refresh)</div>';
      return;
    }

    // Agregasi per bin: pallet efektif = pallet + 1 jika ada pecahan
    var binMap = {};
    _blData.forEach(function(r) {
      var k = r.binLoc;
      if (!binMap[k]) binMap[k] = { used:0, items:[] };
      binMap[k].used += r.pallet + (r.pecahan > 0 ? 1 : 0);
      binMap[k].items.push(r);
    });

    // Header angka 1..BL_MAP_MAX_COL
    var hdrHtml = '<div class="bl-map-num-hdr">';
    for (var n = 1; n <= BL_MAP_MAX_COL; n++) {
      var cls = (n % 5 === 0) ? ' class="tick"' : '';
      hdrHtml += '<span' + cls + '>' + (n % 5 === 0 ? n : '') + '</span>';
    }
    hdrHtml += '</div>';

    var html = hdrHtml;

    BL_MAP_ROWS.forEach(function(entry) {
      if (entry.gap) { html += '<div class="bl-map-gap"></div>'; return; }
      html += '<div class="bl-map-row-group">';
      entry.rows.forEach(function(rowDef) {
        html += '<div class="bl-map-row">';
        html += '<div class="bl-map-row-lbl">' + rowDef.l + '</div>';
        for (var n = 1; n <= BL_MAP_MAX_COL; n++) {
          if (n > rowDef.max) {
            html += '<div class="bl-map-void"></div>';
            continue;
          }
          var bin  = rowDef.l + n;
          var cap  = blMapCapacity(bin);
          var info = binMap[bin] || { used:0, items:[] };
          var used = info.used;
          var cls  = blMapColorClass(used, cap);
          var pct  = cap ? Math.round(used/cap*100) : 0;
          var tip  = bin + ': ' + used + '/' + cap + ' plt (' + pct + '%)';
          html += '<div class="bl-map-cell ' + cls + '" title="' + tip + '" onclick="blMapShowPopup(\'' + bin + '\')">'
               + n
               + '</div>';
        }
        html += '</div>'; // bl-map-row
      });
      html += '</div>'; // bl-map-row-group
    });

    document.getElementById('blMapWrap').innerHTML = html;
    document.getElementById('blMapUpdated').textContent =
      'Data: ' + new Date().toLocaleTimeString('id-ID');

    // ── Lain-lain: bin yang tidak ada di racking standar ──
    var llBins = Object.keys(binMap).filter(function(k) { return blMapCapacity(k) === 0; });
    var llEl   = document.getElementById('blMapLainlain');
    var llBody = document.getElementById('blMapLainlainBody');
    var llCnt  = document.getElementById('blMapLainlainCount');
    if (llBins.length) {
      llBins.sort();
      llCnt.textContent = llBins.length + ' lokasi';
      var llHtml = '<div class="bl-ll-grid">';
      llBins.forEach(function(loc) {
        var info     = binMap[loc];
        var skuCount = info.items.length;
        var skuNames = info.items.slice(0,2).map(function(i){ return i.skuNama||i.skuKode; }).join(', ')
                     + (skuCount > 2 ? '…' : '');
        llHtml += '<div class="bl-ll-card" onclick="blMapShowPopup(\'' + _blEsc(loc) + '\')">'
               + '<div class="bl-ll-loc">📍 ' + _blEsc(loc) + '</div>'
               + '<div class="bl-ll-pallet">' + info.used + ' plt efektif</div>'
               + '<div class="bl-ll-items">' + skuCount + ' SKU · ' + _blEsc(skuNames) + '</div>'
               + '</div>';
      });
      llHtml += '</div>';
      llBody.innerHTML = llHtml;
      llEl.style.display = '';
    } else {
      llEl.style.display = 'none';
    }
  }

  function blMapShowPopup(bin) {
    var cap   = blMapCapacity(bin);
    var items = [];
    var totalUsed = 0;
    _blData.forEach(function(r) {
      if (r.binLoc === bin) {
        items.push(r);
        totalUsed += r.pallet + (r.pecahan > 0 ? 1 : 0);
      }
    });
    var pct = cap ? Math.round(totalUsed/cap*100) : 0;
    var capColor = blMapColorClass(totalUsed, cap);
    var txtColors = { 'cap-empty':'rgba(255,255,255,.6)','cap-green':'#9ae6b4','cap-yellow':'#fefcbf','cap-orange':'#fbd38d','cap-red':'#feb2b2' };
    var isLainlain = cap === 0;

    document.getElementById('blMapPopupTitle').textContent = isLainlain ? '📍 ' + bin : '📦 Rack ' + bin;
    document.getElementById('blMapPopupCap').innerHTML = isLainlain
      ? '<span style="color:rgba(255,255,255,.7)">Lokasi lain-lain · ' + totalUsed + ' pallet efektif</span>'
      : 'Kapasitas: <b style="color:' + (txtColors[capColor]||'#fff') + '">'
        + totalUsed + ' / ' + cap + ' pallet efektif (' + pct + '%)</b>';

    var body = '';
    if (!items.length) {
      body = '<div class="bl-pop-empty"><i class="fas fa-inbox" style="font-size:28px;margin-bottom:8px;display:block"></i>Rack kosong</div>';
    } else {
      items.sort(function(a,b){ return String(a.prodate).localeCompare(String(b.prodate)); });
      var totalRealPlt = 0;
      body = '<table class="bl-pop-tbl"><thead><tr>'
           + '<th>SKU</th><th>Nama Barang</th><th>Tipe</th>'
           + '<th style="text-align:right">Pallet</th><th style="text-align:right">Pecahan (ktn)</th>'
           + '<th style="text-align:right">Efektif</th><th>Prodate</th><th>Quotation</th><th>Karton</th>'
           + '</tr></thead><tbody>';
      items.forEach(function(r) {
        var tc     = r.tipe==='LOKAL' ? '#276749' : '#6b46c1';
        var eff    = r.pallet + (r.pecahan > 0 ? 1 : 0);
        var plt    = r.pallet    || 0;
        var pec    = r.pecahan   || 0;
        var ktn    = r.totalKarton || 0;
        var std    = plt > 0 ? Math.round((ktn - pec) / plt) : 0;
        var ktnStr = std > 0
          ? plt + 'p@' + std + (pec > 0 ? ' + ' + pec : '') + ' (' + ktn + ')'
          : (ktn > 0 ? ktn + ' ktn' : '—');
        totalRealPlt += r.pallet;
        body += '<tr>'
          + '<td style="font-weight:700;color:#2b6cb0">' + _blEsc(r.skuKode) + '</td>'
          + '<td>' + _blEsc(r.skuNama) + '</td>'
          + '<td style="font-weight:700;font-size:10px;color:' + tc + '">' + r.tipe + '</td>'
          + '<td style="text-align:right;font-weight:800;color:#2b6cb0">' + r.pallet + '</td>'
          + '<td style="text-align:right;color:#718096">' + pec + '</td>'
          + '<td style="text-align:right;font-weight:800;color:#553c9a">' + eff + '</td>'
          + '<td style="font-size:11px;color:#718096">' + _blFmtDate(r.prodate) + '</td>'
          + '<td style="font-size:11px;color:#6b46c1;font-weight:700">' + (r.quotation ? _blEsc(r.quotation) : '<span style="color:#cbd5e0">—</span>') + '</td>'
          + '<td style="font-size:11px;font-weight:700;color:#2b6cb0;white-space:nowrap">' + ktnStr + '</td>'
          + '</tr>';
      });
      body += '<tr style="background:#f7fafc;font-weight:800">'
            + '<td colspan="3" style="text-align:right;font-size:11px;color:#718096">TOTAL PALLET AKTUAL</td>'
            + '<td style="text-align:right;color:#2b6cb0">' + totalRealPlt + '</td>'
            + '<td></td>'
            + '<td style="text-align:right;color:#553c9a">' + totalUsed + '</td>'
            + '<td colspan="3"></td></tr>';
      body += '</tbody></table>';
      body += '<div style="font-size:10px;color:#a0aec0;margin-top:8px;padding:0 2px">* Efektif = pallet + 1 jika ada pecahan</div>';
    }
    document.getElementById('blMapPopupBody').innerHTML = body;
    document.getElementById('blMapOverlay').classList.add('show');
  }

  function blMapClosePopup() {
    var overlay = document.getElementById('blMapOverlay');
    overlay.classList.add('hiding');
    setTimeout(function() {
      overlay.classList.remove('show', 'hiding');
    }, 180);
  }

    function blMovLoad() {
    var filters = {
      to:   document.getElementById('blMovTo').value,
      bin:  document.getElementById('blMovBin').value.trim(),
      sku:  document.getElementById('blMovSku').value.trim(),
      tipe: document.getElementById('blMovTipe').value,
      aksi: document.getElementById('blMovAksi').value
    };
    var wrap = document.getElementById('blMovTblWrap');
    wrap.innerHTML = '<div class="bl-empty" style="padding:60px 20px;text-align:center;color:#a0aec0"><i class="fas fa-spinner fa-spin" style="font-size:30px;margin-bottom:12px;display:block"></i>Memuat...</div>';
    document.getElementById('blMovRowCount').textContent = '';
    google.script.run
      .withSuccessHandler(function(rows) { blMovRender(rows || []); })
      .withFailureHandler(function(e)    { wrap.innerHTML = '<div class="bl-empty" style="padding:40px;text-align:center;color:#e53e3e">❌ Gagal memuat: ' + (e.message||'error') + '</div>'; })
      .getBinMovement(filters);
  }

  function blMovRender(rows) {
    var wrap = document.getElementById('blMovTblWrap');
    document.getElementById('blMovRowCount').textContent = 'Menampilkan ' + rows.length + ' transaksi';
    if (!rows.length) {
      wrap.innerHTML = '<div class="bl-empty" style="padding:60px 20px;text-align:center;color:#a0aec0"><i class="fas fa-search" style="font-size:40px;margin-bottom:12px;display:block"></i>Tidak ada data</div>';
      return;
    }
    var h = '<table class="bl-mov-tbl"><thead><tr>'
      + '<th>TIMESTAMP</th><th>AKSI</th><th>BIN LOC</th><th>BIN TUJUAN</th>'
      + '<th>SKU</th><th>NAMA BARANG</th><th>TIPE</th>'
      + '<th style="text-align:right">PALLET</th><th style="text-align:right">PECAHAN</th><th style="text-align:right">KARTON</th>'
      + '<th>PRODATE</th><th>QUOTATION</th><th>OPERATOR</th><th>KETERANGAN</th>'
      + '</tr></thead><tbody>';
    rows.forEach(function(r) {
      var tc  = r.tipe === 'LOKAL' ? 'lokal' : 'ekspor';
      var ac  = r.aksi === 'MASUK' ? 'masuk' : r.aksi === 'KELUAR' ? 'keluar' : 'pindah';
      h += '<tr>'
        + '<td style="font-size:11px;white-space:nowrap;color:#718096">' + _blEsc(r.timestamp) + '</td>'
        + '<td><span class="aksi-badge ' + ac + '">' + r.aksi + '</span></td>'
        + '<td><span class="bin-badge">' + _blEsc(r.binLoc) + '</span></td>'
        + '<td>' + (r.binTujuan ? '<span class="bin-badge" style="opacity:.7">' + _blEsc(r.binTujuan) + '</span>' : '—') + '</td>'
        + '<td style="font-weight:700;color:#2b6cb0">' + _blEsc(r.skuKode) + '</td>'
        + '<td>' + _blEsc(r.skuNama) + '</td>'
        + '<td><span class="tipe-badge ' + tc + '">' + r.tipe + '</span></td>'
        + '<td style="text-align:right"><span class="pallet-val">' + r.pallet + '</span></td>'
        + '<td style="text-align:right;color:#718096">' + (r.pecahan || 0) + '</td>'
        + '<td style="text-align:right;font-weight:700;color:#2b6cb0">' + (r.totalKarton || '—') + '</td>'
        + '<td>' + _blEsc(r.prodate) + '</td>'
        + '<td style="font-size:11px">' + _blEsc(r.quotation) + '</td>'
        + '<td>' + _blEsc(r.operator) + '</td>'
        + '<td class="ket-cell">' + _blEsc(r.keterangan) + '</td>'
        + '</tr>';
    });
    h += '</tbody></table>';
    wrap.innerHTML = h;
  }


  function blPrintPDF() {
    if (!_blFiltered.length) { alert('Tidak ada data untuk dicetak.'); return; }
    var now  = new Date().toLocaleString('id-ID');
    var tipe = document.getElementById('blFilterTipe').value || 'Semua';
    var total = _blFiltered.reduce(function(s,r){ return s+r.pallet; }, 0);
    var rows = _blFiltered.map(function(r) {
      var warn = !_blStdMap[r.skuKode] ? ' ⚠️' : '';
      return '<tr><td>'+_blEsc(r.binLoc)+'</td><td>'+_blEsc(r.skuKode)+warn+'</td>'
        +'<td>'+_blEsc(r.skuNama)+'</td><td>'+r.tipe+'</td>'
        +'<td>'+_blEsc(r.prodate)+'</td>'
        +'<td style="text-align:right">'+r.pallet+'</td>'
        +'<td style="text-align:right">'+(r.karton||'—')+'</td>'
        +'<td>'+_blEsc(r.quotation)+'</td><td>'+_blEsc(r.lastUpdate)+'</td></tr>';
    }).join('');
    var win = window.open('','_blank');
    win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bin Loc Report</title>'
      +'<style>body{font-family:Arial,sans-serif;font-size:11px;margin:16px}'
      +'h2{margin:0 0 4px;font-size:14px}p{margin:0 0 10px;color:#666;font-size:11px}'
      +'table{width:100%;border-collapse:collapse}'
      +'th{background:#1a3a5c;color:#fff;padding:6px 8px;text-align:left;font-size:10px}'
      +'td{padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:11px}'
      +'tr:nth-child(even)td{background:#f7fafc}'
      +'.footer{margin-top:12px;font-size:10px;color:#999;border-top:1px solid #e2e8f0;padding-top:6px}'
      +'@media print{@page{size:A4 landscape;margin:12mm}}</style></head><body>'
      +'<h2>📍 Bin Loc Monitoring Report</h2>'
      +'<p>Tipe: '+tipe+' &nbsp;|&nbsp; Dicetak: '+now+' &nbsp;|&nbsp; '+_blFiltered.length+' record &nbsp;|&nbsp; Total Pallet: '+total+'</p>'
      +'<table><thead><tr><th>BIN LOC</th><th>SKU</th><th>NAMA BARANG</th><th>TIPE</th>'
      +'<th>PRODATE</th><th>PALLET</th><th>KARTON</th><th>QUOTATION</th><th>LAST UPDATE</th></tr></thead>'
      +'<tbody>'+rows+'</tbody>'
      +'<tfoot><tr><td colspan="5" style="font-weight:700;text-align:right">TOTAL PALLET</td>'
      +'<td style="font-weight:800;color:#2b6cb0;text-align:right">'+total+'</td>'
      +'<td colspan="3"></td></tr></tfoot>'
      +'</table><div class="footer">Bin Loc Monitoring — '+now+'</div>'
      +'</body></html>');
    win.document.close();
    setTimeout(function(){ win.print(); }, 400);
  }

  function _blEsc(v){ return v ? String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;') : '—'; }
function _blFmtDate(v) {
  if (!v) return '—';
  var s = String(v);
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[3]+'/'+m[2]+'/'+m[1];
  var d = new Date(v);
  if (!isNaN(d.getTime())) return ('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2)+'/'+d.getFullYear();
  return s.slice(0,10);
}
