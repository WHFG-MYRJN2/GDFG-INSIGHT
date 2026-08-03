function initRealForm(){
      // Set tanggal hari ini jika kosong
      if(!document.getElementById('realTanggal').value){
        var today = new Date();
        var dd = String(today.getDate()).padStart(2,'0');
        var mm = String(today.getMonth()+1).padStart(2,'0');
        document.getElementById('realTanggal').value = today.getFullYear()+'-'+mm+'-'+dd;
      }
      hitungTotal();
    }

    function hitungTotal(){
      var tujuans = ['MDC','MT','LK','Sub','Ekspor'];
      var totalSpe = 0, totalKrt = 0;
      tujuans.forEach(function(ch){
        totalSpe += Number(document.getElementById('r'+ch+'_spe').value)||0;
        totalKrt += Number(document.getElementById('r'+ch+'_krt').value)||0;
      });
      document.getElementById('totalSPE').innerText = totalSpe.toLocaleString('id-ID');
      document.getElementById('totalKRT').innerText = totalKrt.toLocaleString('id-ID');

      // Total planning
      var plantujuans = ['MDC','MT','LK','Sub','Ekspor'];
      var planTotal = 0;
      plantujuans.forEach(function(ch){
        planTotal += Number(document.getElementById('plan'+ch).value)||0;
      });
      document.getElementById('planTotal').value = planTotal || '';
    }

    function getReal(){
      return {
        tanggal:    document.getElementById('realTanggal').value,
        admin:      document.getElementById('realAdmin').value.trim(),
        shiftNo:    document.getElementById('realShiftNo').value,
        shiftTim:   document.getElementById('realShiftTim').value,
        planMDC:    Number(document.getElementById('planMDC').value)||0,
        planMT:     Number(document.getElementById('planMT').value)||0,
        planLK:     Number(document.getElementById('planLK').value)||0,
        planSub:    Number(document.getElementById('planSub').value)||0,
        planEkspor: Number(document.getElementById('planEkspor').value)||0,
        planTotal:  Number(document.getElementById('planTotal').value)||0,
        rMDC_spe:   Number(document.getElementById('rMDC_spe').value)||0,
        rMDC_krt:   Number(document.getElementById('rMDC_krt').value)||0,
        rMT_spe:    Number(document.getElementById('rMT_spe').value)||0,
        rMT_krt:    Number(document.getElementById('rMT_krt').value)||0,
        rLK_spe:    Number(document.getElementById('rLK_spe').value)||0,
        rLK_krt:    Number(document.getElementById('rLK_krt').value)||0,
        rSub_spe:   Number(document.getElementById('rSub_spe').value)||0,
        rSub_krt:   Number(document.getElementById('rSub_krt').value)||0,
        rEkspor_spe:Number(document.getElementById('rEkspor_spe').value)||0,
        rEkspor_krt:Number(document.getElementById('rEkspor_krt').value)||0,
        totalSpe:   Number(document.getElementById('totalSPE').innerText.replace(/\./g,''))||0,
        totalKrt:   Number(document.getElementById('totalKRT').innerText.replace(/\./g,''))||0,
        catatan:    document.getElementById('realCatatan').value.trim(),
        cMDC_do:    Number(document.getElementById('cMDC_do').value)||0,
        cMDC_ket:   document.getElementById('cMDC_ket').value.trim(),
        cMT_do:     Number(document.getElementById('cMT_do').value)||0,
        cMT_ket:    document.getElementById('cMT_ket').value.trim(),
        cLK_do:     Number(document.getElementById('cLK_do').value)||0,
        cLK_ket:    document.getElementById('cLK_ket').value.trim(),
        cSub_do:    Number(document.getElementById('cSub_do').value)||0,
        cSub_ket:   document.getElementById('cSub_ket').value.trim(),
        cEkspor_do: Number(document.getElementById('cEkspor_do').value)||0,
        cEkspor_ket:document.getElementById('cEkspor_ket').value.trim(),
      };
    }

    function validateReal(d){
      var errs = [];
      if(!d.tanggal)  errs.push('Tanggal');
      if(!d.admin)    errs.push('Nama Admin');
      if(!d.shiftNo)  errs.push('Shift (1/2/3)');
      if(!d.shiftTim) errs.push('Tim (A/B/C)');
      return errs;
    }

    function resetRealForm(){
      ['planMDC','planMT','planLK','planSub','planEkspor','planTotal',
       'rMDC_spe','rMDC_krt','rMT_spe','rMT_krt','rLK_spe','rLK_krt',
       'rSub_spe','rSub_krt','rEkspor_spe','rEkspor_krt'].forEach(function(id){
        document.getElementById(id).value = '';
      });
      document.getElementById('realAdmin').value = '';
      document.getElementById('realShiftNo').value = '';
      document.getElementById('realShiftTim').value = '';
      document.getElementById('realCatatan').value = '';
      document.getElementById('totalSPE').innerText = '0';
      document.getElementById('totalKRT').innerText = '0';
      ['cMDC_do','cMDC_ket','cMT_do','cMT_ket','cLK_do','cLK_ket',
       'cSub_do','cSub_ket','cEkspor_do','cEkspor_ket'].forEach(function(id){
        document.getElementById(id).value = '';
      });
    }

    function saveRealisasi(){
      var d    = getReal();
      var errs = validateReal(d);
      if(errs.length > 0){
        showToast('⚠️ Wajib diisi: '+errs.join(', '), 'error');
        return;
      }
      var btn = document.querySelector('.btn-add-row[onclick="saveRealisasi()"]');
      if(btn){ btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...'; }

      function resetBtn(){
        if(btn){ btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Simpan Shift'; }
      }

      var row = [
        d.tanggal, d.admin, d.shiftNo, d.shiftTim,
        d.planMDC, d.planMT, d.planLK, d.planSub, d.planEkspor, d.planTotal,
        d.rMDC_spe, d.rMDC_krt, d.rMT_spe, d.rMT_krt,
        d.rLK_spe, d.rLK_krt, d.rSub_spe, d.rSub_krt,
        d.rEkspor_spe, d.rEkspor_krt, d.totalSpe, d.totalKrt,
        d.catatan,
        d.cMDC_do, d.cMDC_ket, d.cMT_do, d.cMT_ket,
        d.cLK_do, d.cLK_ket, d.cSub_do, d.cSub_ket,
        d.cEkspor_do, d.cEkspor_ket
      ];
      google.script.run
        .withSuccessHandler(function(res){
          if(res.duplicate){
            resetBtn();
            if(confirm('Data Shift '+d.shiftNo+' (Tim '+d.shiftTim+') tanggal '+d.tanggal+' sudah ada. Overwrite?')){
              if(btn){ btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...'; }
              google.script.run
                .withSuccessHandler(function(r2){
                  resetBtn();
                  showToast('✅ '+r2.message, 'success');
                  resetRealForm(); initRealForm();
                })
                .withFailureHandler(function(){ resetBtn(); showToast('❌ Gagal menyimpan', 'error'); })
                .saveRealisasiData(row, true);
            }
          } else {
            resetBtn();
            showToast('✅ '+res.message, 'success');
            resetRealForm(); initRealForm();
          }
        })
        .withFailureHandler(function(){ resetBtn(); showToast('❌ Gagal menyimpan', 'error'); })
        .saveRealisasiData(row, false);
    }

    function switchRealTab(tab, btn){
      document.querySelectorAll('.real-tab').forEach(function(t){ t.classList.remove('active'); });
      document.querySelectorAll('.real-pane').forEach(function(p){ p.classList.remove('active'); p.style.display=''; });
      if(tab === 'planningReal'){ initPlanningTab(); }
      hideStickyFooter();
      btn.classList.add('active');
      document.getElementById(tab).classList.add('active');
      if(tab === 'summaryReal') loadSummaryReal();
      if(tab === 'directReal' && directRowCount === 0){
        initDirect(30);
        // Set default tanggal: hari ini s/d +3
        var td = new Date();
        var tdStr = td.toISOString().slice(0,10);
        var te = new Date(td); te.setDate(te.getDate()+3);
        var teStr = te.toISOString().slice(0,10);
        document.getElementById('directFrom').value = tdStr;
        document.getElementById('directTo').value   = teStr;
      }
      if(tab === 'mdcReal' && mdcRowCount === 0){
        var td2 = new Date();
        var tdStr2 = td2.toISOString().slice(0,10);
        var te2 = new Date(td2); te2.setDate(te2.getDate()+6);
        var teStr2 = te2.toISOString().slice(0,10);
        document.getElementById('mdcFrom').value = tdStr2;
        document.getElementById('mdcTo').value   = teStr2;
        applyMdcRange(); // generate kolom tanggal + init 30 baris
        _bindMdcEvents();
      }
    }

    function switchRealView(view){ /* deprecated */ }


    // ── Filter mode: Tanggal / Week ───────────────────────────
    var currentFilterMode = 'date';

    function switchFilterMode(mode){
      currentFilterMode = mode;
      document.getElementById('btnFilterMode_date').classList.toggle('active', mode==='date');
      document.getElementById('btnFilterMode_week').classList.toggle('active', mode==='week');
      document.getElementById('filterModeDate').style.display = mode==='date' ? '' : 'none';
      document.getElementById('filterModeWeek').style.display = mode==='week' ? '' : 'none';
      document.getElementById('weekFilterInfo').style.display  = 'none';
    }

    function getISOWeekRange(week, year){
      // ISO week: week 1 = minggu yang mengandung Kamis pertama
      var jan4 = new Date(Date.UTC(year, 0, 4));
      var dow  = jan4.getUTCDay() || 7; // Sun=0→7, Mon=1...Sat=6
      var mondayW1 = new Date(jan4);
      mondayW1.setUTCDate(jan4.getUTCDate() - (dow - 1));
      var monday = new Date(mondayW1);
      monday.setUTCDate(mondayW1.getUTCDate() + (week - 1) * 7);
      var sunday = new Date(monday);
      sunday.setUTCDate(monday.getUTCDate() + 6);
      return {
        from: monday.toISOString().slice(0,10),
        to:   sunday.toISOString().slice(0,10)
      };
    }

    function applyWeekFilter(){
      var wFrom = parseInt(document.getElementById('filterWeekFrom').value) || 0;
      var wTo   = parseInt(document.getElementById('filterWeekTo').value)   || wFrom;
      var year  = parseInt(document.getElementById('filterWeekYear').value) || new Date().getFullYear();
      if(!wFrom){ showToast('Isi nomor Week','warning'); return; }
      if(wFrom > wTo){ showToast('Week dari harus ≤ Week sampai','warning'); return; }

      var rangeFrom = getISOWeekRange(wFrom, year);
      var rangeTo   = getISOWeekRange(wTo,   year);
      var from = rangeFrom.from;
      var to   = rangeTo.to;

      // Set ke filter tanggal
      document.getElementById('filterFrom').value = from;
      document.getElementById('filterTo').value   = to;

      // Info
      var info = document.getElementById('weekFilterInfo');
      document.getElementById('weekFilterInfoText').innerText =
        'Week '+wFrom+(wFrom!==wTo?' – Week '+wTo:'')+' '+year+' = '+
        formatTglDisplay(from)+' s/d '+formatTglDisplay(to);
      info.style.display = 'block';

      applyFilter();
    }

    function applyFilter(){
      if(currentSumView === 'direct'){
        loadDirectSimple();
      } else if(currentSumView === 'directdetail'){
        loadDirectSummary();
      } else if(currentSumView === 'mdc'){
        loadMDCSummary();
      } else if(currentSumView === 'mdcdetail'){
        loadMDCDetail();
      } else {
        loadSummaryReal();
      }
    }

    function loadSummaryReal(){
      var from = document.getElementById('filterFrom').value;
      var to   = document.getElementById('filterTo').value;
      // Jika kosong semua → default hari ini
      if(!from && !to){
        var today = new Date();
        var yyyy = today.getFullYear();
        var mm   = String(today.getMonth()+1).padStart(2,'0');
        var dd   = String(today.getDate()).padStart(2,'0');
        from = yyyy+'-'+mm+'-'+dd;
        document.getElementById('filterFrom').value = from;
      }
      // Jika hanya from → to = from (hanya 1 hari)
      if(from && !to){
        to = from;
        document.getElementById('filterTo').value = to;
      }
      document.getElementById('realSummaryBody').innerHTML = "<div class='spinner' style='margin:20px auto;'></div>";
      google.script.run
        .withSuccessHandler(function(res){
          window.realSummaryData = res.data || [];
          renderSummaryReal(window.realSummaryData);
        })
        .withFailureHandler(function(){
          document.getElementById('realSummaryBody').innerHTML = "<p style='text-align:center;color:#e53e3e;padding:20px'>Gagal memuat data.</p>";
        })
        .getRealisasiData(from, to);
    }

    var currentSumView = 'realisasi'; // 'realisasi'|'detail'|'direct'|'directdetail'

    var _rekapSubMode  = 'detail'; // 'detail' | 'grafik'
    var _rekapDayFilter = 'all';   // 'all' | 'weekday' | 'weekend'
    var _rekapGrafikTujuan = 'ALL'; // 'ALL'|'MDC'|'MT'|'LK'|'SUB'|'EXP'

    function switchRekapDayFilter(f){
      _rekapDayFilter = f;
      ['all','weekday','weekend'].forEach(function(s){
        var btn = document.getElementById('btnRekapDay_'+s);
        if(btn) btn.classList.toggle('active', s===f);
      });
      var body = document.getElementById('realSummaryBody');
      body.style.opacity = '0';
      setTimeout(function(){
        if(window.realSummaryData) renderRekapView(window.realSummaryData, currentSumView);
        body.style.opacity = '1';
      }, 120);
    }

    function switchRekapSub(sub){
      _rekapSubMode = sub;
      ['detail','grafik'].forEach(function(s){
        var btn = document.getElementById('btnRekapSub_'+s);
        if(btn) btn.classList.toggle('active', s===sub);
      });
      var body = document.getElementById('realSummaryBody');
      body.style.opacity = '0';
      setTimeout(function(){
        if(window.realSummaryData) renderRekapView(window.realSummaryData, currentSumView);
        body.style.opacity = '1';
      }, 120);
    }

    function switchRekapGrafikTujuan(t){
      _rekapGrafikTujuan = t;
      var body = document.getElementById('realSummaryBody');
      body.style.opacity = '0';
      setTimeout(function(){
        if(window.realSummaryData) renderRekapGrafik(window.realSummaryData, currentSumView);
        body.style.opacity = '1';
      }, 120);
    }

    function switchSumView(v){
      if(currentSumView === v) return;
      currentSumView = v;

      // Reset semua tombol
      ['realisasi','detail','direct','directdetail','mdc','mdcdetail','rekapTim','rekapShift'].forEach(function(n){
        var btn = document.getElementById('btnSumView_'+n);
        if(btn) btn.classList.remove('active');
      });
      if(v === 'realisasi' || v === 'detail'){
        document.getElementById('btnSumView_'+v).classList.add('active');
      }
      if(v === 'direct' || v === 'directdetail' || v === 'mdc' || v === 'mdcdetail'){
        document.getElementById('btnSumView_'+v).classList.add('active');
      }
      if(v === 'rekapTim' || v === 'rekapShift'){
        document.getElementById('btnSumView_'+v).classList.add('active');
      }

      // Show/hide sub-toggle
      var subWrap = document.getElementById('rekapSubToggleWrap');
      if(subWrap) subWrap.style.display = (v==='rekapTim'||v==='rekapShift') ? '' : 'none';
      var dayWrap = document.getElementById('rekapDayFilterWrap');
      if(dayWrap) dayWrap.style.display = (v==='rekapTim'||v==='rekapShift') ? '' : 'none';

      hideStickyFooter();
      var body = document.getElementById('realSummaryBody');
      body.style.transition = 'opacity .15s ease';
      body.style.opacity = '0';
      setTimeout(function(){
        if(v === 'direct'){
          loadDirectSimple();
        } else if(v === 'directdetail'){
          loadDirectSummary();
        } else if(v === 'mdc'){
          loadMDCSummary();
        } else if(v === 'mdcdetail'){
          loadMDCDetail();
        } else if(v === 'rekapTim' || v === 'rekapShift'){
          if(window.realSummaryData) renderRekapView(window.realSummaryData, v);
        } else {
          if(window.realSummaryData) renderSummaryReal(window.realSummaryData);
        }
        body.style.opacity = '1';
      }, 150);
    }

    function renderRealisasiView(data){
      var body = document.getElementById('realSummaryBody');
      if(!data || data.length === 0){
        body.innerHTML = "<p style='text-align:center;color:#a0aec0;padding:30px;font-size:13px;'>"
          +"<i class='fas fa-inbox' style='font-size:28px;display:block;margin-bottom:8px;'></i>Tidak ada data.</p>";
        return;
      }

      // Kelompokkan per tanggal
      var byDate = {}, dateOrder = [];
      data.forEach(function(r){
        var tgl = r[0];
        if(!byDate[tgl]){ byDate[tgl] = []; dateOrder.push(tgl); }
        byDate[tgl].push(r);
      });
      dateOrder.sort();

      var totalSpe = 0, totalKrt = 0;
      var cardsHtml = '';

      dateOrder.forEach(function(tgl){
        var rows = byDate[tgl].slice().sort(function(a,b){ return Number(a[2])-Number(b[2]); });

        // Planning — ambil dari shift terakhir yg planning > 0
        var planRow = null;
        for(var pi=rows.length-1; pi>=0; pi--){
          if((Number(rows[pi][9])||0) > 0){ planRow = rows[pi]; break; }
        }
        if(!planRow) planRow = rows[rows.length-1];
        var planTotal = Number(planRow[9])||0;

        // Grand total hari
        var daySpe = 0, dayKrt = 0;
        rows.forEach(function(r){ daySpe += Number(r[20])||0; dayKrt += Number(r[21])||0; });
        totalSpe += daySpe; totalKrt += dayKrt;

        // Persentase capaian
        var pct    = planTotal > 0 ? Math.round(daySpe / planTotal * 100) : null;
        var pctCls = pct === null ? '' : (pct >= 100 ? 'good' : pct >= 80 ? 'warn' : 'low');
        var pctHtml = pct !== null
          ? "<span class='rview-pct "+pctCls+"'>"+pct+"%</span>" : '';

        // Shift rows
        var shiftsHtml = '';
        rows.forEach(function(r){
          var sNo     = Number(r[2]);
          var spe     = Number(r[20])||0;
          var krt     = Number(r[21])||0;
          var catatan = String(r[22]||'').trim();
          var dotHtml = catatan ? "<span class='catatan-dot' title='Ada catatan'></span>" : '';
          var clickCls = catatan ? ' clickable' : '';
          var _cdMeta = 'Shift '+sNo+' Tim '+r[3]+' — '+r[1];
          var _cdData = JSON.stringify({meta:_cdMeta, cat:catatan});
          var clickAttr = catatan
            ? " data-cd='"+_cdData.replace(/&/g,'&amp;').replace(/'/g,'&#39;')+"' onclick=\"_opCdClick(this)\""
            : '';
          shiftsHtml += "<div class='rview-shift-row"+clickCls+"'"+clickAttr+">"
            +"<div class='rview-shift-label'>"
            +  "Shift "+sNo
            +  " <span class='stim'>Tim "+r[3]+"</span>"
            +  " "+dotHtml
            +"</div>"
            +"<div class='rview-shift-nums'>"
            +  fmtN(spe)+" SPE"
            +  "<span class='krt-val'>"+fmtN(krt)+" Krt</span>"
            +"</div>"
            +"</div>";
        });

        cardsHtml += "<div class='rview-card'>"
          // Header
          +"<div class='rview-card-head'>"
          +  "<div class='rview-card-title'>"
          +    "<i class='fas fa-calendar-day' style='opacity:.75'></i>"
          +    namaHari(tgl)+", "+fmtTgl(tgl)
          +  "</div>"
          +  "<div class='rview-card-badge'>"+rows.length+" shift</div>"
          +"</div>"
          // Planning
          +"<div class='rview-plan-row'>"
          +  "<span class='rview-plan-label'><i class='fas fa-bullseye' style='margin-right:5px;color:#e53e3e'></i>Plan</span>"
          +  "<span class='rview-plan-val'>"+fmtN(planTotal)+" DO</span>"
          +  pctHtml
          +"</div>"
          // Shifts
          +"<div class='rview-shifts'>"+shiftsHtml+"</div>"
          // Grand total
          +"<div class='rview-grand'>"
          +  "<div class='rview-grand-label'><i class='fas fa-sigma' style='margin-right:4px'></i>Total Hari</div>"
          +  "<div class='rview-grand-nums'>"
          +    fmtN(daySpe)+" SPE"
          +    "<span class='sep'>/</span>"
          +    "<span class='krt-part'>"+fmtN(dayKrt)+" Krt</span>"
          +  "</div>"
          +"</div>"
          +"</div>";
      });

      // Grid class sesuai jumlah hari
      var gridCls = 'rview-grid';
      if(dateOrder.length === 1)      gridCls += ' single';
      else if(dateOrder.length === 2) gridCls += ' double';

      var html = "<div class='"+gridCls+"' style='margin-bottom:6px;'>"+cardsHtml+"</div>";

      // Total rentang (hanya muncul jika > 1 hari)
      if(dateOrder.length > 1){
        html += "<div class='rview-total-bar'>"
          +"<div>"
          +  "<div class='rview-total-label'><i class='fas fa-layer-group' style='margin-right:5px'></i>Total "+dateOrder.length+" Hari</div>"
          +  "<div class='rview-total-nums'>"+fmtN(totalSpe)+" SPE<span class='krt-part'>/ "+fmtN(totalKrt)+" Krt</span></div>"
          +"</div>"
          +"</div>";
      }

      body.innerHTML = "<div style='animation:fadeIn .25s ease both'>"+html+"</div>";
      hideStickyFooter(); // Realisasi tidak pakai floating footer
    }

    function resetFilterReal(){
      document.getElementById('filterFrom').value = '';
      document.getElementById('filterTo').value   = '';
      loadSummaryReal();
    }

    // Helper: format angka ribuan id-ID

    function fmtPct(p){ var s=(Math.round(p*10)/10).toString(); return s.replace(/\.0$/,'')+"%"; }

    // Helper: nama hari Indonesia
    function namaHari(tgl){
      var hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
      var d = new Date(tgl);
      return hari[d.getDay()];
    }

    // Helper: format tanggal dd/mm/yyyy
    function fmtTgl(tgl){
      if(!tgl) return '-';
      var p = tgl.split('-');
      if(p.length === 3) return p[2]+'/'+p[1]+'/'+p[0];
      return tgl;
    }

    // Helper: render kategori chips
    // cats = [{label, spe, krt}], style = 'day'|'total'
    function renderCatChips(cats, style){
      var totalKrt = cats.reduce(function(s,c){ return s + (c.krt||0); }, 0);
      return cats.map(function(c){
        if(!c.spe && !c.krt) return '';
        if(style === 'total'){
          var pct = totalKrt > 0 ? Math.round(c.krt/totalKrt*100) : 0;
          return "<div class='rtotal-chip'>"
            +"<span class='clabel'>"+c.label+"</span>"
            +"<span class='cval'>"+fmtN(c.spe)+" SPE</span>"
            +"<span style='color:rgba(255,255,255,.2)'>/</span>"
            +"<span style='color:#f6e05e;font-weight:600'>"+fmtN(c.krt)+" Krt</span>"
            +"<span style='color:#f6e05e;font-size:11px;margin-left:4px;font-weight:800'>"+pct+"%</span>"
            +"</div>";
        }
        return "<div class='rcat-chip'>"
          +"<span class='clabel'>"+c.label+"</span>"
          +"<span class='csep'>·</span>"
          +"<span class='cval'>"+fmtN(c.spe)+" SPE</span>"
          +"<span class='csep'>/</span>"
          +"<span style='color:#744210;font-weight:600'>"+fmtN(c.krt)+" Krt</span>"
          +"</div>";
      }).join('');
    }


    function renderRekapView(data, viewMode){
      var body = document.getElementById('realSummaryBody');
      if(!data || data.length === 0){
        body.innerHTML = "<p style='text-align:center;color:#a0aec0;padding:30px;font-size:13px;'><i class='fas fa-inbox' style='font-size:28px;display:block;margin-bottom:8px;'></i>Tidak ada data.</p>";
        return;
      }

      // ── Filter weekday / weekend ──
      function isWeekend(tgl){
        if(!tgl) return false;
        var d = new Date(tgl);
        var day = d.getDay();
        return day === 0 || day === 6; // 0=Minggu, 6=Sabtu
      }
      if(_rekapDayFilter === 'weekday'){
        data = data.filter(function(r){ return !isWeekend(r[0]); });
      } else if(_rekapDayFilter === 'weekend'){
        data = data.filter(function(r){ return isWeekend(r[0]); });
      }
      if(!data.length){
        body.innerHTML = "<p style='text-align:center;color:#a0aec0;padding:30px;font-size:13px;'><i class='fas fa-calendar-times' style='font-size:28px;display:block;margin-bottom:8px;'></i>Tidak ada data untuk filter ini.</p>";
        return;
      }

      if(_rekapSubMode === 'grafik'){
        renderRekapGrafik(data, viewMode);
        return;
      }

      // ── MODE DETAIL ──
      var byGroup = {}, groupOrder = [];
      var groupKey = viewMode === 'rekapShift' ? 2 : 3;
      data.forEach(function(r){
        var key = String(r[groupKey]||'-').trim();
        if(!byGroup[key]){ byGroup[key]=[]; groupOrder.push(key); }
        byGroup[key].push(r);
      });
      if(viewMode==='rekapShift') groupOrder.sort(function(a,b){return Number(a)-Number(b);});
      else groupOrder.sort();

      function sumCol(rows,idx){return rows.reduce(function(s,r){return s+(Number(r[idx])||0);},0);}
      function fmt(v){return v>0?v.toLocaleString('id-ID'):'-';}
      function fmtAvg(v){return v>0?Math.round(v).toLocaleString('id-ID'):'-';}
      function countDays(rows){var d={};rows.forEach(function(r){if(r[0])d[String(r[0])]=1;});var n=0;for(var k in d)n++;return n||1;}
      var tujuan=['MDC','MT','LK','SUB','EXP'];
      var speIdx={MDC:10,MT:12,LK:14,SUB:16,EXP:18};
      var krtIdx={MDC:11,MT:13,LK:15,SUB:17,EXP:19};

      var allDays={};
      data.forEach(function(r){if(r[0])allDays[String(r[0])]=1;});
      var totalDays=0;for(var d in allDays)totalDays++;if(!totalDays)totalDays=1;
      var gt={spe:0,krt:0},gtT={};
      tujuan.forEach(function(t){gtT[t]={spe:0,krt:0};});
      var groupStats=[];
      groupOrder.forEach(function(key){
        var rows=byGroup[key];
        var spe=sumCol(rows,20),krt=sumCol(rows,21),days=totalDays;
        gt.spe+=spe;gt.krt+=krt;
        var ts={};tujuan.forEach(function(t){ts[t]={spe:sumCol(rows,speIdx[t]),krt:sumCol(rows,krtIdx[t])};gtT[t].spe+=ts[t].spe;gtT[t].krt+=ts[t].krt;});
        groupStats.push({key:key,spe:spe,krt:krt,days:days,ts:ts});
      });
      var maxKrt=Math.max.apply(null,groupStats.map(function(g){return g.krt;}));

      var html='<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:16px;">';
      // Metric card 1: Total Karton (KRT / SPE)
      html+='<div style="background:#f7fafc;border-radius:8px;padding:12px 14px;">';
      html+='<div style="font-size:11px;color:#718096;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;">Total Karton</div>';
      html+='<div style="font-size:22px;font-weight:700;color:#2d3748;">'+fmt(gt.krt)+'<span style="font-size:13px;font-weight:500;color:#a0aec0;margin-left:4px;">KRT</span></div>';
      html+='<div style="font-size:13px;color:#718096;margin-top:2px;">'+fmt(gt.spe)+' SPE</div>';
      html+='</div>';
      // Metric card 2: Rata-rata harian
      html+='<div style="background:#f7fafc;border-radius:8px;padding:12px 14px;">';
      html+='<div style="font-size:11px;color:#718096;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;">Rata-rata harian</div>';
      html+='<div style="font-size:22px;font-weight:700;color:#c05621;">'+fmtAvg(gt.krt/totalDays)+'<span style="font-size:13px;font-weight:500;color:#e8a87c;margin-left:4px;">KRT</span></div>';
      html+='<div style="font-size:13px;color:#718096;margin-top:2px;">'+fmtAvg(gt.spe/totalDays)+' SPE</div>';
      html+='</div>';
      // Metric card 3: Hari aktif
      html+='<div style="background:#f7fafc;border-radius:8px;padding:12px 14px;">';
      html+='<div style="font-size:11px;color:#718096;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;">Hari aktif</div>';
      html+='<div style="font-size:22px;font-weight:700;color:#2d3748;">'+totalDays+'<span style="font-size:13px;font-weight:500;color:#a0aec0;margin-left:4px;">hari</span></div>';
      html+='</div>';
      html+='</div>';

      var TIM_MEMBERS = { 'A':'RIZAL & SEHAB', 'B':'ARIF & FERRY', 'C':'DIAR & FIRMAN' };
      function timLabel(key) {
        var m = TIM_MEMBERS[key];
        return key + (m ? ' <span style="font-size:11px;font-weight:500;color:#a0aec0;">(' + m + ')</span>' : '');
      }

      html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:10px;">';
      groupStats.forEach(function(g){
        var pct=maxKrt>0?Math.round(g.krt/maxKrt*100):0;
        var avg=g.krt/totalDays;
        var avgSpe=g.spe/totalDays;
        html+='<div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">';
        // Header
        html+='<div style="padding:11px 16px;border-bottom:1px solid #f0f4f8;display:flex;justify-content:space-between;align-items:center;">';
        html+='<span style="font-size:15px;font-weight:700;color:#2d3748;">'+timLabel(g.key)+'</span>';
        html+='<span style="font-size:12px;color:#a0aec0;">'+totalDays+' hari</span></div>';
        html+='<div style="padding:14px 16px;">';
        // Total Karton row
        html+='<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px;">';
        html+='<span style="font-size:12px;color:#718096;">Total Karton</span>';
        html+='<span style="font-size:14px;font-weight:700;color:#2d3748;">'+fmt(g.krt)+' KRT / '+fmt(g.spe)+' SPE</span></div>';
        // Rata-rata harian row
        html+='<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">';
        html+='<span style="font-size:12px;color:#718096;">Rata-rata harian</span>';
        html+='<span style="font-size:13px;font-weight:700;color:#c05621;">'+fmtAvg(avg)+' KRT / '+fmtAvg(avgSpe)+' SPE</span></div>';
        // Bar
        html+='<div style="height:5px;background:#edf2f7;border-radius:3px;margin-bottom:12px;overflow:hidden;"><div style="height:5px;width:'+pct+'%;background:#1e3a5f;border-radius:3px;"></div></div>';
        // Tujuan grid
        html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">';
        tujuan.forEach(function(t){
          html+='<div style="background:#f7fafc;border-radius:6px;padding:8px 10px;">';
          html+='<div style="font-size:11px;color:#a0aec0;margin-bottom:4px;font-weight:600;">'+t+'</div>';
          html+='<div style="font-size:13px;font-weight:700;color:#2d3748;">'+fmt(g.ts[t].krt)+' KRT</div>';
          html+='<div style="font-size:11px;color:#718096;margin-top:1px;">'+fmt(g.ts[t].spe)+' SPE</div>';
          html+='</div>';
        });
        html+='</div></div></div>';
      });
      html+='</div>';
      body.innerHTML = html;
    }


    function renderRekapGrafik(data, viewMode){
      var body = document.getElementById('realSummaryBody');
      var groupKey = viewMode === 'rekapShift' ? 2 : 3;

      // Kolom KRT per tujuan
      var _krtIdxMap = {MDC:11, MT:13, LK:15, SUB:17, EXP:19};
      var _tujuanCol = (_rekapGrafikTujuan === 'ALL') ? 21 : (_krtIdxMap[_rekapGrafikTujuan] || 21);

      // Kumpulkan tanggal unik dan grup unik
      var allDaysSet = {}, allDays = [];
      var byGroup = {}, groupOrder = [];
      data.forEach(function(r){
        var tgl = String(r[0]||'').trim();
        var key = String(r[groupKey]||'-').trim();
        if(tgl && !allDaysSet[tgl]){ allDaysSet[tgl]=1; allDays.push(tgl); }
        if(!byGroup[key]){ byGroup[key]={}; groupOrder.push(key); }
        if(!byGroup[key][tgl]) byGroup[key][tgl]=0;
        byGroup[key][tgl] += Number(r[_tujuanCol])||0;
      });
      allDays.sort();
      if(viewMode==='rekapShift') groupOrder.sort(function(a,b){return Number(a)-Number(b);});
      else groupOrder.sort();

      // Cek minimal 2 tanggal
      if(allDays.length < 2){
        body.innerHTML = '<div style="text-align:center;padding:40px 20px;">'
          +'<i class="fas fa-chart-line" style="font-size:32px;color:#cbd5e0;display:block;margin-bottom:12px;"></i>'
          +'<p style="color:#718096;font-size:13px;font-weight:600;">Harus lebih dari 1 tanggal untuk menampilkan grafik</p>'
          +'<p style="color:#a0aec0;font-size:11px;margin-top:4px;">Perluas rentang tanggal filter dan cari ulang</p>'
          +'</div>';
        return;
      }

      // Warna per group
      var PALETTE = ['#2563eb','#dc2626','#16a34a','#9333ea','#d97706','#0891b2'];
      function fmt(v){return v>0?v.toLocaleString('id-ID'):'-';}
      function fmtAvg(v){return v>0?Math.round(v).toLocaleString('id-ID'):'-';}

      // Legend
      var _TIM_MEMBERS = { 'A':'RIZAL & SEHAB', 'B':'ARIF & FERRY', 'C':'DIAR & FIRMAN' };
      var legendHtml = '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:10px;">';
      groupOrder.forEach(function(key,i){
        var members = _TIM_MEMBERS[key];
        legendHtml += '<span style="display:flex;align-items:center;gap:5px;font-size:11px;color:#4a5568;">'
          +'<span style="width:12px;height:3px;border-radius:2px;background:'+PALETTE[i%PALETTE.length]+';display:inline-block;"></span>'
          + key
          + (members ? ' <span style="color:#a0aec0;font-size:10px;">(' + members + ')</span>' : '')
          +'</span>';
      });
      legendHtml += '</div>';

      // Datasets line chart
      var lineDatasets = groupOrder.map(function(key,i){
        var memberLabel = _TIM_MEMBERS[key] ? key + ' (' + _TIM_MEMBERS[key] + ')' : key;
        return {
          label: memberLabel,
          data: allDays.map(function(tgl){ return byGroup[key][tgl]||0; }),
          borderColor: PALETTE[i%PALETTE.length],
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0
        };
      });

      // Rata-rata per group (bar chart)
      var avgData = groupOrder.map(function(key){
        var vals = allDays.map(function(tgl){ return byGroup[key][tgl]||0; });
        var total = vals.reduce(function(s,v){return s+v;},0);
        return Math.round(total / allDays.length);
      });

      var html = '<div style="margin-bottom:20px;">';
      // Filter tujuan
      var _tujuanList = ['ALL','MDC','MT','LK','SUB','EXP'];
      var _tujuanColors = {ALL:'#2d3748',MDC:'#2563eb',MT:'#dc2626',LK:'#16a34a',SUB:'#9333ea',EXP:'#d97706'};
      html += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;align-items:center;">';
      html += '<span style="font-size:11px;color:#718096;font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-right:2px;">Tujuan:</span>';
      _tujuanList.forEach(function(t){
        var isActive = _rekapGrafikTujuan === t;
        var col = _tujuanColors[t] || '#2d3748';
        var bg  = isActive ? col : '#f7fafc';
        var fc  = isActive ? '#fff' : '#4a5568';
        var bd  = isActive ? col : '#e2e8f0';
        html += '<button onclick="switchRekapGrafikTujuan(\''+t+'\')" style="'
          +'padding:4px 12px;border-radius:20px;border:1px solid '+bd+';background:'+bg+';color:'+fc+';'
          +'font-size:11px;font-weight:700;cursor:pointer;transition:all .15s;">'
          +t+'</button>';
      });
      html += '</div>';
      // Label tujuan untuk judul chart
      var _tujuanLabel = _rekapGrafikTujuan === 'ALL' ? 'All Tujuan' : _rekapGrafikTujuan;
      // Line chart (tanpa label di titik)
      html += '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:14px;">';
      html += '<div style="font-size:11px;color:#718096;margin-bottom:8px;">KRT harian per '+(viewMode==='rekapShift'?'Shift':'TIM')+' — <span style="font-weight:700;color:#2d3748;">'+_tujuanLabel+'</span></div>';
      html += legendHtml;
      html += '<div style="position:relative;height:220px;"><canvas id="rekapLineChart"></canvas></div>';
      html += '</div>';
      // Bar chart
      html += '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;">';
      html += '<div style="font-size:11px;color:#718096;margin-bottom:8px;">Rata-rata KRT per hari — <span style="font-weight:700;color:#2d3748;">'+_tujuanLabel+'</span></div>';
      html += '<div style="position:relative;height:160px;"><canvas id="rekapBarChart"></canvas></div>';
      html += '</div>';
      html += '</div>';

      body.innerHTML = html;

      setTimeout(function(){
        // Destroy old charts
        if(window._rekapLineChart) window._rekapLineChart.destroy();
        if(window._rekapBarChart)  window._rekapBarChart.destroy();

        // Register datalabels plugin jika belum
        if(window.ChartDataLabels && Chart.registry && !Chart.registry.plugins.get('datalabels')){
          Chart.register(ChartDataLabels);
        }

        // Line chart — tampilkan nilai di setiap titik
        var lctx = document.getElementById('rekapLineChart');
        if(lctx){
          window._rekapLineChart = new Chart(lctx, {
            type: 'line',
            data: { labels: allDays, datasets: lineDatasets },
            options: {
              responsive: true, maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                datalabels: { display: false },
                tooltip: {
                  mode: 'index',
                  intersect: false,
                  callbacks: {
                    title: function(items){ return items[0].label; },
                    label: function(item){
                      var val = Math.round(item.raw).toLocaleString('id-ID');
                      return ' ' + item.dataset.label + ': ' + val + ' KRT';
                    }
                  }
                }
              },
              layout: { padding: { top: 8 } },
              scales: {
                x: { grid: { color: 'rgba(128,128,128,0.08)' }, ticks: { font: { size: 10 }, maxRotation: 45 } },
                y: { grid: { color: 'rgba(128,128,128,0.08)' }, ticks: { font: { size: 10 }, callback: function(v){ return v>=1000?(v/1000).toFixed(1)+'k':v; } } }
              }
            }
          });
        }

        // Bar chart — tampilkan nilai di atas bar
        var bctx = document.getElementById('rekapBarChart');
        if(bctx){
          window._rekapBarChart = new Chart(bctx, {
            type: 'bar',
            data: {
              labels: groupOrder.map(function(k){ return _TIM_MEMBERS[k] ? k+'\n('+_TIM_MEMBERS[k]+')' : k; }),
              datasets: [{
                label: 'Rata-rata KRT/hari',
                data: avgData,
                backgroundColor: groupOrder.map(function(_,i){ return PALETTE[i%PALETTE.length]; }),
                borderRadius: 4,
                borderSkipped: false
              }]
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                datalabels: {
                  anchor: 'end', align: 'top',
                  font: { size: 11, weight: '700' },
                  color: function(ctx){ return PALETTE[ctx.dataIndex%PALETTE.length]; },
                  formatter: function(v){ return Math.round(v).toLocaleString('id-ID'); }
                }
              },
              layout: { padding: { top: 24 } },
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                y: { grid: { color: 'rgba(128,128,128,0.08)' }, ticks: { font: { size: 10 }, callback: function(v){ return v>=1000?(v/1000).toFixed(1)+'k':v; } } }
              }
            }
          });
        }
      }, 50);
    }

    function renderSummaryReal(data){
      window.realSummaryData = data;
      if(currentSumView === 'detail'){
        renderDetailView(data);
      } else {
        renderRealisasiView(data);
      }
    }

    function renderDetailView(data){
      var body = document.getElementById('realSummaryBody');
      if(!data || data.length === 0){
        body.innerHTML = "<p style='text-align:center;color:#a0aec0;padding:30px;font-size:13px;'>"
          +"<i class='fas fa-inbox' style='font-size:28px;display:block;margin-bottom:8px;'></i>Tidak ada data.</p>";
        return;
      }

      // Kolom: [0]tgl [1]admin [2]shiftNo [3]tim
      // [4]planMDC [5]planMT [6]planLK [7]planSub [8]planExp [9]planTotal
      // [10]speMDC [11]krtMDC [12]speMT [13]krtMT [14]speLK [15]krtLK
      // [16]speSub [17]krtSub [18]speExp [19]krtExp [20]totalSpe [21]totalKrt

      // Kelompokkan per tanggal
      var byDate = {};
      var dateOrder = [];
      data.forEach(function(r){
        var tgl = r[0];
        if(!byDate[tgl]){ byDate[tgl] = []; dateOrder.push(tgl); }
        byDate[tgl].push(r);
      });
      dateOrder.sort();

      // Akumulator grand total keseluruhan
      var gt = { spe:0, krt:0, mdc_spe:0, mdc_krt:0, mt_spe:0, mt_krt:0,
                 lk_spe:0, lk_krt:0, sub_spe:0, sub_krt:0, exp_spe:0, exp_krt:0,
                 plan:0, mdc_plan:0, mt_plan:0, lk_plan:0, sub_plan:0, exp_plan:0 };

      var html = '';

      var _gtByDate = {};
      dateOrder.forEach(function(tgl){
        var rows = byDate[tgl].slice().sort(function(a,b){ return Number(a[2])-Number(b[2]); });

        // Ambil planning dari shift terakhir yang planning-nya tidak kosong
        // (carry forward: jika shift kosong planning, pakai planning shift sebelumnya)
        var planRow = null;
        for(var pi = rows.length-1; pi >= 0; pi--){
          if((Number(rows[pi][9])||0) > 0){
            planRow = rows[pi];
            break;
          }
        }
        // Fallback: jika semua shift tidak ada planning, pakai shift terakhir
        if(!planRow) planRow = rows[rows.length-1];
        var plan = {
          total: planRow[9], mdc: planRow[4], mt: planRow[5],
          lk: planRow[6], sub: planRow[7], exp: planRow[8]
        };

        // Grand total hari ini
        var dayGt = { spe:0, krt:0, mdc_spe:0, mdc_krt:0, mt_spe:0, mt_krt:0,
                      lk_spe:0, lk_krt:0, sub_spe:0, sub_krt:0, exp_spe:0, exp_krt:0 };
        rows.forEach(function(r){
          dayGt.spe     += Number(r[20])||0; dayGt.krt     += Number(r[21])||0;
          dayGt.mdc_spe += Number(r[10])||0; dayGt.mdc_krt += Number(r[11])||0;
          dayGt.mt_spe  += Number(r[12])||0; dayGt.mt_krt  += Number(r[13])||0;
          dayGt.lk_spe  += Number(r[14])||0; dayGt.lk_krt  += Number(r[15])||0;
          dayGt.sub_spe += Number(r[16])||0; dayGt.sub_krt += Number(r[17])||0;
          dayGt.exp_spe += Number(r[18])||0; dayGt.exp_krt += Number(r[19])||0;
        });
        // Simpan snapshot per tanggal untuk pendingan tanggal terakhir
        _gtByDate[tgl] = { dayGt: dayGt, plan: plan };

        // Tambah ke total keseluruhan
        Object.keys(dayGt).forEach(function(k){ gt[k] = (gt[k]||0) + (dayGt[k]||0); });
        gt.plan     += Number(plan.total)||0;
        gt.mdc_plan += Number(plan.mdc)||0;
        gt.mt_plan  += Number(plan.mt)||0;
        gt.lk_plan  += Number(plan.lk)||0;
        gt.sub_plan += Number(plan.sub)||0;
        gt.exp_plan += Number(plan.exp)||0;

        // Warna shift
        var shiftColors = ['s1','s2','s3'];

        // -------------------------------------------------------
        // Pre-scan rows untuk planning tertinggi (kumulatif %)
        // Pre-scan: planKumulatif total & per tujuan = planning dari shift terakhir yg ada plan
        var planKumulatif = 0;
        var planKumCat = {mdc:0,mt:0,lk:0,sub:0,exp:0};
        rows.forEach(function(r){
          var p=Number(r[9])||0;
          if(p>0){
            planKumulatif = p;
            planKumCat = {
              mdc:Number(r[4])||0, mt:Number(r[5])||0, lk:Number(r[6])||0,
              sub:Number(r[7])||0, exp:Number(r[8])||0
            };
          }
        });

        // planEfektif[sNo] = planning berlaku (carry-forward jika 0)
        var _lastP = 0, planEfektif = {};
        rows.forEach(function(r){
          var s=Number(r[2]), p=Number(r[9])||0;
          if(p>0) _lastP=p;
          planEfektif[s] = _lastP;
        });

        // Build shift rows HTML
        var shiftsHtml = '';
        var cumRealSebelum = 0;
        var cumRealTotal   = 0;
        var cumCatSeb = {mdc:0,mt:0,lk:0,sub:0,exp:0};
        var lastCatPlanObj = {mdc:0,mt:0,lk:0,sub:0,exp:0};

        rows.forEach(function(r){
          var sNo     = Number(r[2]);
          var sCls    = shiftColors[sNo-1] || '';
          var catatan = String(r[22] || '').trim();
          var hasCat  = catatan.length > 0;
          var cats = [
            {label:'MDC', spe:r[10], krt:r[11]},
            {label:'MT',  spe:r[12], krt:r[13]},
            {label:'LK',  spe:r[14], krt:r[15]},
            {label:'Sub', spe:r[16], krt:r[17]},
            {label:'Exp', spe:r[18], krt:r[19]}
          ];
          var shiftSpe = Number(r[20])||0;
          var rawPlan  = Number(r[9])||0;
          if(rawPlan>0) lastCatPlanObj = {
            mdc:Number(r[4])||0, mt:Number(r[5])||0, lk:Number(r[6])||0,
            sub:Number(r[7])||0, exp:Number(r[8])||0
          };

          // === 1. KINERJA SHIFT ===
          // Shift 1: real1 / plan1 (null jika plan=0)
          // Shift N: realN / (planEfektif[N] - cumRealSebelum)
          var kinerjaDenom;
          if(sNo === 1){
            kinerjaDenom = rawPlan > 0 ? rawPlan : 0;
          } else {
            kinerjaDenom = Math.max(0, (planEfektif[sNo]||0) - cumRealSebelum);
          }
          var pctKinerja = (kinerjaDenom > 0) ? (shiftSpe / kinerjaDenom * 100) : null;

          // === 2. KUMULATIF ===
          // (realS1+...+realSN) / planKumulatif
          cumRealTotal += shiftSpe;
          var pctKumul = planKumulatif > 0 ? (cumRealTotal / planKumulatif * 100) : null;

          // Render 2 badge
          function pctBadge(pct, label){
            var col = pct===null?'#a0aec0':pct>=100?'#68d391':pct>=80?'#f6e05e':'#fc8181';
            var bg  = pct===null?'rgba(160,174,192,.1)':pct>=100?'rgba(104,211,145,.15)':pct>=80?'rgba(246,224,94,.15)':'rgba(252,129,129,.15)';
            var str = pct===null?'—':pct.toFixed(1)+'%';
            return "<span style='display:inline-flex;flex-direction:column;align-items:center;"
              +"padding:2px 7px;border-radius:10px;background:"+bg+";margin-left:3px;'>"
              +"<span style='font-size:9px;color:#a0aec0;font-weight:600;line-height:1.2;'>"+label+"</span>"
              +"<span style='font-size:12px;font-weight:800;color:"+col+";line-height:1.3;'>"+str+"</span>"
              +"</span>";
          }
          var pctHtml = pctBadge(pctKinerja,'Kinerja') + pctBadge(pctKumul,'Kumulatif');

          // catsData untuk popup — sisa per tujuan (kinerja shift)
          var catDefs = [
            {label:'MDC', pk:4,  sk:10, kk:11, c:'mdc'},
            {label:'MT',  pk:5,  sk:12, kk:13, c:'mt'},
            {label:'LK',  pk:6,  sk:14, kk:15, c:'lk'},
            {label:'Sub', pk:7,  sk:16, kk:17, c:'sub'},
            {label:'Exp', pk:8,  sk:18, kk:19, c:'exp'}
          ];
          // planKumulatif per tujuan = planEfektif[lastShift] per tujuan
          var catsData = catDefs.map(function(cd){
            var effCatPlan = (Number(r[cd.pk])||0) > 0 ? (Number(r[cd.pk])||0) : (lastCatPlanObj[cd.c]||0);
            var sisaCat    = sNo===1 ? effCatPlan : Math.max(0, effCatPlan - cumCatSeb[cd.c]);
            // planKumul per tujuan = dari pre-scan shift terakhir yang ada planning
            var catKumul   = planKumCat[cd.c] || effCatPlan;
            return {label:cd.label, plan:sisaCat, planKumul:catKumul, spe:Number(r[cd.sk])||0, krt:Number(r[cd.kk])||0};
          });

          // Update akumulasi SETELAH hitung persentase
          cumRealSebelum    += shiftSpe;
          cumCatSeb.mdc     += Number(r[10])||0;
          cumCatSeb.mt      += Number(r[12])||0;
          cumCatSeb.lk      += Number(r[14])||0;
          cumCatSeb.sub     += Number(r[16])||0;
          cumCatSeb.exp     += Number(r[18])||0;

          var _meta = 'Shift '+sNo+' Tim '+r[3]+' — '+r[1];
          // Cancel DO per tujuan: kolom [23-32]
          // [23]catatan [24]cMDC_do [25]cMDC_ket [26]cMT_do [27]cMT_ket
          // [28]cLK_do  [29]cLK_ket [30]cSub_do  [31]cSub_ket [32]cExp_do [33]cExp_ket
          var _cancel = [
            {label:'MDC', do:Number(r[24])||0, ket:String(r[25]||'').trim()},
            {label:'MT',  do:Number(r[26])||0, ket:String(r[27]||'').trim()},
            {label:'LK',  do:Number(r[28])||0, ket:String(r[29]||'').trim()},
            {label:'Sub', do:Number(r[30])||0, ket:String(r[31]||'').trim()},
            {label:'Exp', do:Number(r[32])||0, ket:String(r[33]||'').trim()}
          ].filter(function(c){ return c.do > 0 || c.ket; });
          var _allData = JSON.stringify({meta:_meta, cat:catatan, sp:kinerjaDenom,
            ss:shiftSpe, sk:Number(r[21])||0, cats:catsData, pk:planKumulatif, cancel:_cancel});
          var clickAttr = "data-shift='"+_allData.replace(/&/g,'&amp;').replace(/'/g,'&#39;')+"'"            +" onclick=\"_opShiftClick(this)\""            +" class='rshift-row "+sCls+(hasCat?' rshift-has-catatan':'')+" rshift-clickable' style='cursor:pointer;'";
          shiftsHtml += "<div "+clickAttr+">"
            +"<div class='rshift-header'>"
            +  "<div class='rshift-label'>Shift "+sNo+" <span class='stim'>Tim "+r[3]+"</span>"
            +    "<span style='font-size:11px;color:#718096;font-weight:500'>— "+r[1]+"</span>"
            +    (hasCat ? "<span class='catatan-dot' title='Ada catatan'></span>" : "")
            +  "</div>"
            +  "<div style='display:flex;align-items:center;gap:2px;'>"
            +    pctHtml
            +    "<div class='rshift-total' style='margin-left:6px;'>"+fmtN(shiftSpe)+" SPE / "+fmtN(Number(r[21]))+" Krt</div>"
            +  "</div>"
            +"</div>"
            +"<div class='rshift-cats'>"+renderCatChips(cats,'day')+"</div>"
            +"</div>";
        });

        // Planning chips
        var planTotalNum = Number(plan.total)||0;
        var planChips = [
          ['MDC',plan.mdc],['MT',plan.mt],['LK',plan.lk],
          ['Sub',plan.sub],['Exp',plan.exp]
        ].map(function(p){
          return "<div class='rday-plan-chip'><span>"+p[0]+"</span>"+(Number(p[1])||0)+" DO</div>";
        }).join('');

        // Grand total hari - cats
        var dayCats = [
          {label:'MDC', spe:dayGt.mdc_spe, krt:dayGt.mdc_krt},
          {label:'MT',  spe:dayGt.mt_spe,  krt:dayGt.mt_krt},
          {label:'LK',  spe:dayGt.lk_spe,  krt:dayGt.lk_krt},
          {label:'Sub', spe:dayGt.sub_spe, krt:dayGt.sub_krt},
          {label:'Exp', spe:dayGt.exp_spe, krt:dayGt.exp_krt}
        ];

        html += "<div class='rday-block'>"
          // Header hari
          +"<div class='rday-header'>"
          +  "<div class='rday-title'><i class='fas fa-calendar-day' style='margin-right:7px;opacity:.8'></i>"
          +    namaHari(tgl)+", "+fmtTgl(tgl)+"</div>"
          +  "<div class='rday-badge'>"+rows.length+" shift</div>"
          +"</div>"
          // Planning
          +"<div class='rday-plan'>"
          +  "<span class='rday-plan-label'><i class='fas fa-clipboard-list' style='margin-right:4px'></i>Planning</span>"
          +  "<div class='rday-plan-chip' style='background:linear-gradient(135deg,#0f2027,#2c5364);color:#fff;border-color:transparent;font-size:13px;padding:3px 13px;'>"
          +    "<span style='color:rgba(255,255,255,.65);margin-right:3px'>Total</span>"
          +    fmtN(Number(plan.total)||0)+" DO"
          +  "</div>"
          +  "<span style='color:#cbd5e0;margin:0 2px'>|</span>"
          +  planChips
          +"</div>"
          // Shift rows
          +"<div class='rday-shifts'>"+shiftsHtml+"</div>"
          // Grand total hari
          // Hitung pendingan per tujuan
          var pendTotal = planTotalNum - dayGt.spe;
          var pendItems2 = [
            {lbl:'MDC',val:(Number(plan.mdc)||0)-dayGt.mdc_spe, plan:Number(plan.mdc)||0},
            {lbl:'MT', val:(Number(plan.mt)||0) -dayGt.mt_spe,  plan:Number(plan.mt)||0},
            {lbl:'LK', val:(Number(plan.lk)||0) -dayGt.lk_spe,  plan:Number(plan.lk)||0},
            {lbl:'Sub',val:(Number(plan.sub)||0)-dayGt.sub_spe, plan:Number(plan.sub)||0},
            {lbl:'Exp',val:(Number(plan.exp)||0)-dayGt.exp_spe, plan:Number(plan.exp)||0}
          ];
          var pendChipsHtml = pendItems2.filter(function(x){ return x.plan > 0; }).map(function(x){
            var col  = x.val <= 0 ? '#276749' : '#9b2c2c';
            var bg   = x.val <= 0 ? '#f0fff4' : '#fff5f5';
            var bdr  = x.val <= 0 ? '#9ae6b4' : '#feb2b2';
            var real = x.plan - x.val;
            var pct  = x.plan > 0 ? (real / x.plan * 100).toFixed(1) : null;
            return "<span style='display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:10px;"
                   +"background:"+bg+";color:"+col+";border:1px solid "+bdr+";font-size:11px;font-weight:700;'>"
                   +"<span style='opacity:.65;font-weight:500;margin-right:2px;'>"+x.lbl+"</span>"
                   +(x.val>0?'-':'+')+Math.abs(x.val)+" DO"
                   +(pct!==null?" <span style='font-size:10px;opacity:.8;'>"+fmtPct(parseFloat(pct))+"</span>":"")
                   +"</span>";
          }).join('');
          var pendKurang = pendItems2.filter(function(x){ return x.plan>0 && x.val>0; }).reduce(function(s,x){ return s+x.val; },0);
          var pendPct    = planTotalNum > 0 ? pendKurang/planTotalNum*100 : null;
          var pendingSection = planTotalNum > 0
            ? "<div style='margin-top:8px;padding-top:8px;border-top:1px dashed #e2e8f0;'>"
              +"<span style='font-size:11px;font-weight:700;color:#4a5568;text-transform:uppercase;letter-spacing:.4px;margin-right:8px;'>Pending DO</span>"
              +"<span style='font-size:13px;font-weight:800;color:"+(pendKurang>0?'#9b2c2c':'#276749')+";'>"
              +(pendKurang>0?'-':'')+pendKurang+" DO</span>"
              +(pendPct!==null?" <span style='font-size:11px;font-weight:700;color:#718096;'>"+fmtPct(pendPct)+" pending</span>":"")
              +(pendChipsHtml?"<div style='display:flex;flex-wrap:wrap;gap:4px;margin-top:5px;'>"+pendChipsHtml+"</div>":"")
              +"</div>" : "";


          // Cancel DO MDC hari ini (r[24] = cancelMDC per shift)
          var dayCancelMDC = 0;
          rows.forEach(function(r){ dayCancelMDC += Number(r[24])||0; });
          var dayTotalPlanning = dayGt.spe + dayCancelMDC;

                    html += "<div class='rday-grand'>"
            +"<div class='rday-grand-title'><i class='fas fa-sigma' style='margin-right:6px'></i>Grand Total Hari Ini</div>"
            +"<div class='rday-grand-nums' style='display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;'>"
            +"<span>"+fmtN(dayGt.spe)+" SPE <span style='color:#a0aec0;font-weight:400;font-size:12px'>/</span> <span style='font-size:13px;color:#744210'>"+fmtN(dayGt.krt)+" Krt</span></span>"
            +(planTotalNum > 0
              ? "<span style='font-size:12px;font-weight:800;padding:2px 10px;border-radius:20px;border:1.5px solid;"
                +((dayGt.spe/planTotalNum*100)>=100
                  ? "color:#276749;background:#f0fff4;border-color:#9ae6b4;"
                  : (dayGt.spe/planTotalNum*100)>=80
                  ? "color:#744210;background:#fffff0;border-color:#fbd38d;"
                  : "color:#9b2c2c;background:#fff5f5;border-color:#feb2b2;")
                +"'>"+fmtPct(dayGt.spe/planTotalNum*100)+"</span>"
              : "")
            +"</div>"
            +"<div class='rday-grand-cats'>"+renderCatChips(dayCats,'day')+"</div>"
            +pendingSection
            +(dayCancelMDC>0
              ? "<div style='margin-top:8px;padding-top:8px;border-top:1px dashed #e2e8f0;display:flex;flex-wrap:wrap;align-items:center;gap:8px;'>"
                +"<span style='font-size:11px;font-weight:700;color:#4a5568;text-transform:uppercase;letter-spacing:.4px;'>Cancel DO</span>"
                +"<span style='font-size:13px;font-weight:800;color:#e53e3e;'>"+fmtN(dayCancelMDC)+" mobil</span>"
                +"<span style='font-size:11px;color:#718096;'>&rarr; Total Planning: <strong>"+fmtN(dayTotalPlanning)+" mobil</strong></span>"
                +"</div>"
              : "")
            +"</div>"
            +"</div>";
      });

            // Block total keseluruhan (hanya tampil jika lebih dari 1 hari)
      if(dateOrder.length > 1){
        var totalCats = [
          {label:'MDC', spe:gt.mdc_spe, krt:gt.mdc_krt},
          {label:'MT',  spe:gt.mt_spe,  krt:gt.mt_krt},
          {label:'LK',  spe:gt.lk_spe,  krt:gt.lk_krt},
          {label:'Sub', spe:gt.sub_spe, krt:gt.sub_krt},
          {label:'Exp', spe:gt.exp_spe, krt:gt.exp_krt}
        ];
        html += "<div class='rtotal-block'>"
          +"<div class='rtotal-title'><i class='fas fa-layer-group'></i> Total "+dateOrder.length+" Hari</div>"
          +"<div style='display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:6px;'>"
          +  "<div class='rtotal-nums'>"+fmtN(gt.spe)+" SPE <span style='color:rgba(255,255,255,.3);font-weight:300;font-size:16px'>/</span> <span style='color:#f6e05e;font-size:18px'>"+fmtN(gt.krt)+" Krt</span></div>"
          +  (gt.plan > 0
            ? "<span style='font-size:12px;font-weight:800;padding:2px 10px;border-radius:20px;border:1.5px solid;"
              + ((gt.spe/gt.plan*100)>=100
                ? "color:#276749;background:#f0fff4;border-color:#9ae6b4;"
                : (gt.spe/gt.plan*100)>=80
                ? "color:#744210;background:#fffff0;border-color:#fbd38d;"
                : "color:#9b2c2c;background:#fff5f5;border-color:#feb2b2;")
              + "'>"+fmtPct(gt.spe/gt.plan*100)+"</span>"
            : "")
          +"</div>"
          +"<div style='font-size:12px;color:rgba(255,255,255,.55);margin-bottom:8px;'>"
          +  "<i class='fas fa-clipboard-list' style='margin-right:5px'></i>Total Planning: "
          +  "<strong style='color:rgba(255,255,255,.9)'>"+fmtN(gt.plan)+" DO</strong>"
          +"</div>"
          +"<div class='rtotal-cats'>"+renderCatChips(totalCats,'total')+"</div>"
          +(function(){
            // Pendingan dari tanggal terakhir yang ada data
            var _lastTgl = dateOrder[dateOrder.length-1];
            var _lastSnap = _gtByDate[_lastTgl] || {};
            var _lastDayGt  = _lastSnap.dayGt || {};
            var _lastPlan   = _lastSnap.plan   || {};
            var _lastPlanTotal = Number(_lastPlan.total)||0;
            var _lastSpe = _lastDayGt.spe||0;
            var gtPendItems = [
              {lbl:'MDC',val:(Number(_lastPlan.mdc)||0)-(_lastDayGt.mdc_spe||0), plan:Number(_lastPlan.mdc)||0},
              {lbl:'MT', val:(Number(_lastPlan.mt)||0) -(_lastDayGt.mt_spe||0),  plan:Number(_lastPlan.mt)||0},
              {lbl:'LK', val:(Number(_lastPlan.lk)||0) -(_lastDayGt.lk_spe||0),  plan:Number(_lastPlan.lk)||0},
              {lbl:'Sub',val:(Number(_lastPlan.sub)||0)-(_lastDayGt.sub_spe||0), plan:Number(_lastPlan.sub)||0},
              {lbl:'Exp',val:(Number(_lastPlan.exp)||0)-(_lastDayGt.exp_spe||0), plan:Number(_lastPlan.exp)||0}
            ];
            var gtPendKurang = (_lastPlanTotal>0 ? _lastPlanTotal-_lastSpe : 0);
            var _pendLabel = 'Pending DO ('+formatTglDisplay(_lastTgl)+')';
            if(_lastPlanTotal<=0) return '';
            var chips = gtPendItems.filter(function(x){ return x.plan>0; }).map(function(x){
              var col = x.val>0?'#fc8181':'#68d391';
              var sign = x.val>0?'-':'+';
              return "<span style='background:rgba(255,255,255,.1);border-radius:12px;padding:2px 8px;font-size:11px;font-weight:700;color:"+col+";margin-right:4px;'>"+x.lbl+" "+sign+Math.abs(x.val)+" DO</span>";
            }).join('');
            var pendCol = gtPendKurang>0?'#fc8181':'#68d391';
            var pendSign = gtPendKurang>0?'-':'+';
            return "<div style='margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.1);'>"              +"<span style='font-size:11px;font-weight:700;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.4px;margin-right:8px;'>"+_pendLabel+"</span>"              +"<span style='font-size:13px;font-weight:800;color:"+pendCol+";'>"+pendSign+Math.abs(gtPendKurang)+" DO</span>"              +(chips?"<div style='margin-top:5px;'>"+chips+"</div>":"")              +"</div>";
          })()
          +"</div>";
      }

      body.innerHTML = "<div style='animation:fadeIn .25s ease both'>"+html+"</div>";

      // Update floating footer
      var from2 = document.getElementById('filterFrom').value;
      var to2   = document.getElementById('filterTo').value;
      var periodeDetail = (from2 ? formatTglDisplay(from2) : '') + (to2 && to2!==from2 ? ' s/d '+formatTglDisplay(to2) : '');
      updateStickyFooterDetail({
        totalSpe:  gt.spe,
        totalKrt:  gt.krt,
        planTotal: gt.plan,
        mdcSpe:    gt.mdc_spe, mdcKrt: gt.mdc_krt, mdcPlan: gt.mdc_plan,
        mtSpe:     gt.mt_spe,  mtKrt:  gt.mt_krt,  mtPlan:  gt.mt_plan,
        lkSpe:     gt.lk_spe,  lkKrt:  gt.lk_krt,  lkPlan:  gt.lk_plan,
        subSpe:    gt.sub_spe, subKrt: gt.sub_krt,  subPlan: gt.sub_plan,
        expSpe:    gt.exp_spe, expKrt: gt.exp_krt,  expPlan: gt.exp_plan,
        nHari:     dateOrder.length,
        periode:   periodeDetail
      });
    }
    function _opShiftClick(el){
      try {
        var d = JSON.parse(el.dataset.shift);
        showShiftDetail(d.meta, d.cat, d.sp, d.ss, d.sk, d.cats, d.pk, d.cancel||[]);
      } catch(e){ console.error('_opShiftClick parse error', e); }
    }

    function showShiftDetail(meta, catatan, planTotal, realSpe, realKrt, cats, planKumul, cancelList){
      // cats = [{label, plan (kinerja denom), planKumul, spe, krt}]
      document.getElementById('catatanMeta').innerText = meta;

      function pctBgBar(p){ return p===null?'#a0aec0':p>=100?'#48bb78':p>=80?'#f6ad55':'#fc8181'; }
      function pctStr(p)  { return p===null?'—':p.toFixed(1)+'%'; }
      function twoBadge(pK, pKum){
        function badge(p, lbl){
          var col = p===null?'#718096':p>=100?'#22543d':p>=80?'#7b4f12':'#9b2c2c';
          var bg  = p===null?'#edf2f7':p>=100?'#f0fff4':p>=80?'#fffff0':'#fff5f5';
          var bdr = p===null?'#cbd5e0':p>=100?'#9ae6b4':p>=80?'#fbd38d':'#feb2b2';
          return '<span style="display:inline-flex;flex-direction:column;align-items:center;'
            +'padding:2px 8px;border-radius:8px;background:'+bg+';border:1px solid '+bdr+';margin-right:4px;">'
            +'<span style="font-size:9px;color:#718096;font-weight:600;line-height:1.2;">'+lbl+'</span>'
            +'<span style="font-size:13px;font-weight:800;color:'+col+';">'+pctStr(p)+'</span>'
            +'</span>';
        }
        return badge(pK,'Kinerja')+badge(pKum,'Kumulatif');
      }

      var html = '<div class="shift-detail-grid">';

      // Kartu total
      var pK   = planTotal > 0 ? realSpe/planTotal*100 : null;
      var pKum = (planKumul||0) > 0 ? realSpe/planKumul*100 : pK;
      var barW = pK !== null ? Math.min(pK,100).toFixed(1) : 0;
      html += '<div class="shift-detail-card" style="grid-column:1/-1;background:#edf2f7;">'
            + '<div class="shift-detail-label">Total Realisasi</div>'
            + '<div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin-bottom:6px;">'
            + twoBadge(pK, pKum)
            + '</div>'
            + '<div class="shift-detail-bar-wrap"><div class="shift-detail-bar" style="width:'+barW+'%;background:'+pctBgBar(pK)+';"></div></div>'
            + '<div style="font-size:12px;color:#2d3748;font-weight:600;margin-top:4px;">'
            +   realSpe+' SPE &nbsp;·&nbsp; Karton: '+realKrt.toLocaleString('id-ID')
            +   (planTotal>0?' &nbsp;·&nbsp; Plan: '+planTotal+' DO':'')
            + '</div>'
            + '</div>';

      // Kartu per tujuan
      cats.forEach(function(cat){
        var p   = Number(cat.plan)||0;
        var pKm = Number(cat.planKumul)||0;
        var s   = Number(cat.spe)||0;
        var k   = Number(cat.krt)||0;
        var cpK  = p>0   ? s/p*100   : null;
        var cpKm = pKm>0 ? s/pKm*100 : cpK;
        var cBar = cpK !== null ? Math.min(cpK,100).toFixed(1) : 0;
        html += '<div class="shift-detail-card">'
              + '<div class="shift-detail-label">'+cat.label+'</div>'
              + '<div style="display:flex;align-items:center;flex-wrap:wrap;gap:3px;margin-bottom:5px;">'
              + twoBadge(cpK, cpKm)
              + '</div>'
              + '<div class="shift-detail-bar-wrap"><div class="shift-detail-bar" style="width:'+cBar+'%;background:'+pctBgBar(cpK)+';"></div></div>'
              + '<div class="shift-detail-nums" style="margin-top:4px;">'
              +   '<span style="color:#1a202c;font-weight:700;">'+s+' SPE</span>'
              +   (p>0?'<span style="font-size:11px;color:#718096;font-weight:600;">'+p+' DO</span>':'')
              + '</div>'
              + (k>0?'<div style="font-size:11px;color:#4a5568;margin-top:2px;">'+k.toLocaleString('id-ID')+' Krt</div>':'')
              + '</div>';
      });
      html += '</div>';

      // Catatan
      if(catatan && catatan.trim()){
        html += '<div class="shift-catatan-box">'
              + '<div style="font-size:10px;font-weight:800;color:#9c4221;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">'
              + '<i class="fas fa-sticky-note" style="margin-right:4px;"></i>Catatan</div>'
              + '<span style="color:#7b341e;font-size:13px;font-weight:500;">'+escHtml(catatan)+'</span>'
              + '</div>';
      }

      
      // Cancel DO (hanya tampil jika ada)
      if(cancelList && cancelList.length > 0){
        var cancelHtml = '';
        cancelList.forEach(function(c){
          if(!c.do && !c.ket) return;
          cancelHtml += '<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;padding-bottom:6px;border-bottom:1px dashed #fed7d7;">'
            + '<span style="background:#fc8181;color:#fff;font-size:10px;font-weight:800;padding:2px 7px;border-radius:10px;white-space:nowrap;">'+escHtml(c.label)+'</span>'
            + '<div>'
            + (c.do>0?'<div style="font-weight:700;color:#9b2c2c;font-size:13px;">'+c.do+' DO cancel</div>':'')
            + (c.ket?'<div style="font-size:12px;color:#742a2a;margin-top:2px;">'+escHtml(c.ket)+'</div>':'')
            + '</div></div>';
        });
        if(cancelHtml){
          html += '<div class="shift-catatan-box" style="background:#fff5f5;border-left:3px solid #fc8181;margin-top:8px;">'
            + '<div style="font-size:10px;font-weight:800;color:#9b2c2c;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">'
            + '<i class="fas fa-times-circle" style="margin-right:4px;"></i>Cancel DO</div>'
            + cancelHtml
            + '</div>';
        }
      }

      document.getElementById('catatanBody').innerHTML = html;
      document.getElementById('catatanOverlay').classList.add('active');
    }

    function _opCdClick(el){
      try{
        var d=JSON.parse(el.dataset.cd);
        showCatatanPopup(d.meta, d.cat);
      }catch(e){ console.error('_opCdClick',e); }
    }

    // Legacy wrapper (untuk renderRealisasiView yang masih pakai showCatatanPopup)
    function showCatatanPopup(meta, catatan){
      document.getElementById('catatanMeta').innerText = meta;
      document.getElementById('catatanBody').innerHTML =
        '<div class="shift-catatan-box">'+escHtml(catatan)+'</div>';
      document.getElementById('catatanOverlay').classList.add('active');
    }

    function closeCatatanPopup(e){
      if(!e || e.target === document.getElementById('catatanOverlay')){
        var overlay = document.getElementById('catatanOverlay');
        overlay.classList.remove('active');
      }
    }


    // =============================================
    // PLANNING DIRECT (FDOS)
    // =============================================
    var directDateCols = [];   // array label tanggal
    var directRowCount = 0;
    var _dirSel = {r1:-1,c1:-1,r2:-1,c2:-1};
    var _dirDragging = false;

    var directInputMode = 'date'; // 'date' | 'week'

    function switchDirectInputMode(mode){
      directInputMode = mode;
      var btnD = document.getElementById('dInputMode_date');
      var btnW = document.getElementById('dInputMode_week');
      document.getElementById('dInputDate').style.display = mode==='date'?'flex':'none';
      document.getElementById('dInputWeek').style.display = mode==='week'?'flex':'none';
      var on  = 'background:linear-gradient(135deg,#0f2027,#2c5364);color:#fff;padding:5px 14px;border-radius:20px;border:none;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;';
      var off = 'background:transparent;color:#4a5568;padding:5px 14px;border-radius:20px;border:none;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;';
      btnD.style.cssText = mode==='date'?on:off;
      btnW.style.cssText = mode==='week'?on:off;
    }

    function applyDirectRange(){
      // Mode week: hitung Senin-Kamis lalu set 4 kolom langsung
      if(directInputMode === 'week'){
        var wn = parseInt(document.getElementById('directWeekNum').value);
        var wy = parseInt(document.getElementById('directWeekYear').value) || new Date().getFullYear();
        if(!wn){ showToast('⚠️ Isi nomor week dulu','error'); return; }
        var jan4 = new Date(Date.UTC(wy,0,4));
        var dow  = jan4.getUTCDay()||7;
        var mon  = new Date(jan4); mon.setUTCDate(jan4.getUTCDate()-(dow-1)+(wn-1)*7);
        directDateCols = [];
        for(var di=0;di<4;di++){
          var dd = new Date(mon); dd.setUTCDate(mon.getUTCDate()+di);
          var p = dd.toISOString().slice(0,10).split('-');
          directDateCols.push(p[2]+'/'+p[1]+'/'+p[0].slice(2));
          if(di===0) document.getElementById('directFrom').value = dd.toISOString().slice(0,10);
          if(di===3) document.getElementById('directTo').value   = dd.toISOString().slice(0,10);
        }
        renderDirectHeader();
        return;
      }
      var from = document.getElementById('directFrom').value;
      var to   = document.getElementById('directTo').value;
      if(!from || !to){
        showToast('⚠️ Pilih rentang tanggal terlebih dahulu', 'error'); return;
      }
      if(from > to){
        showToast('⚠️ Tanggal awal tidak boleh lebih besar dari tanggal akhir', 'error'); return;
      }
      // Generate array tanggal dari from sampai to
      var dates = [];
      var cur   = new Date(from+'T00:00:00Z');
      var end   = new Date(to+'T00:00:00Z');
      while(cur <= end){
        var dd = String(cur.getUTCDate()).padStart(2,'0');
        var mm = String(cur.getUTCMonth()+1).padStart(2,'0');
        var yy = String(cur.getUTCFullYear()).slice(2);
        dates.push(dd+'/'+mm+'/'+yy);
        cur.setUTCDate(cur.getUTCDate()+1);
      }
      if(dates.length > 14){
        if(!confirm('Rentang menghasilkan '+dates.length+' kolom. Lanjutkan?')) return;
      }
      // Reset tabel dengan kolom baru
      directDateCols = dates;
      directRowCount = 0;
      renderDirectHeader();
      document.getElementById('directTbody').innerHTML = '';
      document.getElementById('directTfoot').innerHTML = '';
      for(var i = 0; i < 30; i++) addDirectRow('','','');
      updateDirectCount();
      showToast('✅ '+dates.length+' kolom tanggal dibuat ('+dates[0]+' – '+dates[dates.length-1]+')', 'success');
    }

    function _dirClearSel(){
      document.querySelectorAll('#directTable .dir-sel').forEach(function(el){ el.classList.remove('dir-sel'); });
      _dirSel={r1:-1,c1:-1,r2:-1,c2:-1};
    }
    function _dirApplySel(){
      document.querySelectorAll('#directTable .dir-sel').forEach(function(el){ el.classList.remove('dir-sel'); });
      var trs=Array.from(document.querySelectorAll('#directTbody tr'));
      var r1=Math.min(_dirSel.r1,_dirSel.r2),r2=Math.max(_dirSel.r1,_dirSel.r2);
      var c1=Math.min(_dirSel.c1,_dirSel.c2),c2=Math.max(_dirSel.c1,_dirSel.c2);
      for(var r=r1;r<=r2;r++){
        if(!trs[r]) continue;
        for(var cc=c1;cc<=c2;cc++){ if(trs[r].cells[cc]) trs[r].cells[cc].classList.add('dir-sel'); }
      }
    }
    function _dirCopyBlock(){
      var trs=Array.from(document.querySelectorAll('#directTbody tr'));
      var r1=Math.min(_dirSel.r1,_dirSel.r2),r2=Math.max(_dirSel.r1,_dirSel.r2);
      var c1=Math.min(_dirSel.c1,_dirSel.c2),c2=Math.max(_dirSel.c1,_dirSel.c2);
      var lines=[];
      for(var r=r1;r<=r2;r++){
        if(!trs[r]) continue;
        var cells=[];
        for(var cc=c1;cc<=c2;cc++){ var td=trs[r].cells[cc]; cells.push(td?td.innerText.trim():''); }
        lines.push(cells.join('	'));
      }
      var txt=lines.join('\n');
      try{ navigator.clipboard.writeText(txt); }catch(ex){}
      showToast('\uD83D\uDCCB '+(r2-r1+1)+' baris disalin','success');
    }
    function _bindDirectEvents(){
      var tbl=document.getElementById('directTable');
      if(!tbl||tbl._dirBound) return;
      tbl._dirBound=true;
      // Mousedown: drag=blok, klik=anchor
      tbl.addEventListener('mousedown',function(e){
        var td=e.target.closest('td');
        if(!td||!td.closest('#directTbody')) return;
        if(e.target.tagName==='BUTTON'||e.target.closest('button')) return;
        var tr=td.closest('tr');
        var trs=Array.from(document.querySelectorAll('#directTbody tr'));
        var ri=trs.indexOf(tr), ci=td.cellIndex;
        var sx=e.clientX,sy=e.clientY;
        if(e.shiftKey&&_dirSel.r1>=0){ _dirSel.r2=ri;_dirSel.c2=ci;_dirApplySel();e.preventDefault();return; }
        _dirSel={r1:ri,c1:ci,r2:ri,c2:ci};
        var moved=false;
        function onMove(ev){
          if(!moved&&(Math.abs(ev.clientX-sx)>4||Math.abs(ev.clientY-sy)>4)){
            moved=true;_dirDragging=true;
            if(document.activeElement&&document.activeElement.closest('#directTbody')) document.activeElement.blur();
            _dirApplySel();
          }
          if(moved){
            var ov=ev.target.closest('td');
            if(ov&&ov.closest('#directTbody')){ _dirSel.r2=trs.indexOf(ov.closest('tr'));_dirSel.c2=ov.cellIndex;_dirApplySel(); }
            ev.preventDefault();
          }
        }
        function onUp(){
          document.removeEventListener('mousemove',onMove);
          document.removeEventListener('mouseup',onUp);
          _dirDragging=false;
          if(moved) tbl.focus(); else _dirSel={r1:ri,c1:ci,r2:ri,c2:ci};
        }
        document.addEventListener('mousemove',onMove);
        document.addEventListener('mouseup',onUp);
      });
      // focusin → overwrite flag + clear sel
      tbl.addEventListener('focusin',function(e){
        var td=e.target.closest('td[contenteditable="true"]');
        if(td && td.closest('#directTbody')){
          td._dirOverwrite=true;
          if(!_dirDragging) _dirClearSel();
        }
      });
      tbl.addEventListener('input',function(e){ var td=e.target.closest('td'); if(td) td._dirOverwrite=false; });
      // keydown: arrow, delete, overwrite, ctrl+c
      document.addEventListener('keydown',function(e){
        var dp=document.getElementById('directReal');
        if(!dp||!dp.classList.contains('active')) return;
        var ae=document.activeElement;
        // Ctrl+C
        if((e.ctrlKey||e.metaKey)&&e.key==='c'){
          if(_dirSel.r1>=0){
            var hasBSel=window.getSelection()&&window.getSelection().toString().length>0;
            if(!hasBSel){ e.preventDefault();_dirCopyBlock(); }
          }
          return;
        }
        // Delete/Backspace blok
        if((e.key==='Delete'||e.key==='Backspace')&&_dirSel.r1>=0){
          var inEdit=ae&&ae.contentEditable==='true'&&ae.closest('#directTbody');
          var multi=Math.abs(_dirSel.r2-_dirSel.r1)>0||Math.abs(_dirSel.c2-_dirSel.c1)>0;
          var tblFoc=ae===tbl;
          if(e.key==='Delete'||(multi||!inEdit||tblFoc)){
            if(ae&&ae.closest('#directTbody')&&!multi&&e.key==='Delete'){ ae.textContent=''; return; }
            if(multi||tblFoc||e.key==='Delete'){
              e.preventDefault();
              var trs2=Array.from(document.querySelectorAll('#directTbody tr'));
              var r1=Math.min(_dirSel.r1,_dirSel.r2),r2=Math.max(_dirSel.r1,_dirSel.r2);
              var c1=Math.min(_dirSel.c1,_dirSel.c2),c2=Math.max(_dirSel.c1,_dirSel.c2);
              for(var r=r1;r<=r2;r++){
                if(!trs2[r]) continue;
                for(var cc=c1;cc<=c2;cc++){ var td2=trs2[r].cells[cc]; if(td2&&td2.contentEditable==='true') td2.textContent=''; }
              }
              updateDirectFoot();
            }
          }
          return;
        }
        if(!ae||!ae.closest('#directTbody')) return;
        var td3=ae.closest('td'); if(!td3) return;
        var tr3=td3.closest('tr');
        var trs3=Array.from(document.querySelectorAll('#directTbody tr'));
        var ri3=trs3.indexOf(tr3), ci3=td3.cellIndex;
        var editTds3=Array.from(tr3.querySelectorAll('td[contenteditable="true"]'));
        var ei3=editTds3.indexOf(td3);
        // Arrow pindah cell
        var isArr=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.key)>=0;
        if(isArr&&!e.shiftKey){
          e.preventDefault(); _dirClearSel();
          var nri3=ri3,nei3=ei3;
          if(e.key==='ArrowUp') nri3=Math.max(0,ri3-1);
          if(e.key==='ArrowDown') nri3=Math.min(trs3.length-1,ri3+1);
          if(e.key==='ArrowLeft') nei3=Math.max(0,ei3-1);
          if(e.key==='ArrowRight') nei3=Math.min(editTds3.length-1,ei3+1);
          if(e.key==='ArrowUp'||e.key==='ArrowDown'){
            var neTds=Array.from(trs3[nri3].querySelectorAll('td[contenteditable="true"]'));
            if(neTds[ei3]) neTds[ei3].focus();
          } else { if(editTds3[nei3]) editTds3[nei3].focus(); }
          return;
        }
        // Shift+Arrow extend sel
        if(isArr&&e.shiftKey){
          e.preventDefault();
          if(_dirSel.r1<0) _dirSel={r1:ri3,c1:ci3,r2:ri3,c2:ci3};
          var nri4=ri3,nci4=ci3;
          if(e.key==='ArrowUp') nri4=Math.max(0,ri3-1);
          if(e.key==='ArrowDown') nri4=Math.min(trs3.length-1,ri3+1);
          if(e.key==='ArrowLeft') nci4=Math.max(0,ci3-1);
          if(e.key==='ArrowRight') nci4=ci3+1;
          _dirSel.r2=nri4;_dirSel.c2=nci4;_dirApplySel();
          return;
        }
        // Overwrite
        var isSp3=e.key.length>1||e.ctrlKey||e.metaKey||e.altKey;
        if(!isSp3&&td3._dirOverwrite){ td3.textContent='';td3._dirOverwrite=false; }
      });
    }

    function initDirect(n){
      // Default 4 kolom tanggal kosong
      if(directDateCols.length === 0){
        directDateCols = ['','','',''];
      }
      directRowCount = 0;
      renderDirectHeader();
      document.getElementById('directTbody').innerHTML = '';
      document.getElementById('directTfoot').innerHTML = '';
      for(var i = 0; i < n; i++) addDirectRow('','','');
      updateDirectCount();
      _bindDirectEvents();
    }

    function renderDirectHeader(){
      var html = '<tr>';
      html += '<th style="text-align:center;width:36px;">#</th>';
      html += '<th style="text-align:left;">SKU</th>';
      html += '<th style="text-align:left;">NAMA BARANG</th>';
      html += '<th style="text-align:right;">QTY</th>';
      directDateCols.forEach(function(d, i){
        html += '<th class="direct-date-th" style="text-align:right;">'
              + '<span class="th-date-label" contenteditable="true" '
              + 'data-idx="'+i+'" '
              + 'onblur="updateDateLabel(this)" '
              + 'onkeydown="if(event.key===String.fromCharCode(13)){event.preventDefault();this.blur();}" '
              + 'title="Klik untuk edit tanggal" '
              + 'style="outline:none;cursor:text;min-width:60px;display:inline-block;padding:2px 4px;border-radius:4px;">'
              + escHtml(d)
              + '</span>'
              + '<span class="th-del-date" onclick="removeDateColumn('+i+')" title="Hapus kolom"><i class="fas fa-times"></i></span>'
              + '</th>';
      });
      html += '<th style="width:32px;"></th></tr>';
      document.getElementById('directThead').innerHTML = html;
      updateDirectFoot();
      var filled = directDateCols.filter(function(d){ return d && d.trim(); });
      document.getElementById('directColInfo').innerText =
        filled.length > 0
          ? filled.length + ' kolom tanggal: ' + filled.join(', ')
          : 'Klik header kolom tanggal untuk mengisi tanggal';
    }

    function addDirectRow(sku, nama, qty, tglVals){
      var tbody = document.getElementById('directTbody');
      directRowCount++;
      var idx = directRowCount;
      var tr = document.createElement('tr');
      tr.dataset.idx = idx;

      // Kolom no
      var tdNo = document.createElement('td');
      tdNo.className = '';
      tdNo.style.cssText = 'text-align:center;background:linear-gradient(135deg,#0f2027,#2c5364);color:#fff;font-weight:700;font-size:11px;';
      tdNo.innerText = idx;
      tr.appendChild(tdNo);

      // SKU
      var tdSku = document.createElement('td');
      tdSku.contentEditable = 'true';
      tdSku.style.textAlign = 'left';
      tdSku.innerText = sku || '';
      tr.appendChild(tdSku);

      // Nama
      var tdNama = document.createElement('td');
      tdNama.contentEditable = 'true';
      tdNama.style.textAlign = 'left';
      tdNama.innerText = nama || '';
      tr.appendChild(tdNama);

      // QTY
      var tdQty = document.createElement('td');
      tdQty.contentEditable = 'true';
      tdQty.style.textAlign = 'right';
      tdQty.innerText = qty || '';
      tr.appendChild(tdQty);

      // Tanggal cells
      directDateCols.forEach(function(d, i){
        var tdD = document.createElement('td');
        tdD.contentEditable = 'true';
        tdD.className = 'td-date-cell';
        tdD.innerText = (tglVals && tglVals[i] != null) ? (tglVals[i] || '') : '';
        tr.appendChild(tdD);
      });

      // Hapus row
      var tdDel = document.createElement('td');
      tdDel.style.textAlign = 'center';
      tdDel.innerHTML = '<button class="direct-del-row" onclick="delDirectRow(this)" title="Hapus baris"><i class="fas fa-times"></i></button>';
      tr.appendChild(tdDel);

      tbody.appendChild(tr);
      updateDirectCount();
    }

    function delDirectRow(btn){
      var tr = btn.closest('tr');
      tr.parentElement.removeChild(tr);
      updateDirectRowNumbers();
      updateDirectCount();
    }

    function updateDirectRowNumbers(){
      var rows = document.getElementById('directTbody').rows;
      for(var i = 0; i < rows.length; i++){
        rows[i].cells[0].innerText = i + 1;
        rows[i].dataset.idx = i + 1;
      }
      directRowCount = rows.length;
    }

    function updateDirectCount(){
      var n = document.getElementById('directTbody').rows.length;
      directRowCount = n;
      document.getElementById('directRowCount').innerText = n + ' baris';
      updateDirectFoot();
    }

    function updateDirectFoot(){
      // Hitung grand total dari tbody
      var rows = document.getElementById('directTbody').rows;
      var totQty = 0;
      var totTgl = directDateCols.map(function(){ return 0; });
      for(var i = 0; i < rows.length; i++){
        var cells = rows[i].cells;
        totQty += parseDirectNum(cells[3] ? cells[3].innerText : '');
        directDateCols.forEach(function(d, j){
          totTgl[j] += parseDirectNum(cells[4+j] ? cells[4+j].innerText : '');
        });
      }
      var html = '<tr>';
      html += '<td style="text-align:center;">—</td>';
      html += '<td style="text-align:left;" colspan="2">GRAND TOTAL</td>';
      html += '<td style="text-align:right;">'+fmtDirect(totQty)+'</td>';
      totTgl.forEach(function(v){
        html += '<td style="text-align:right;">'+fmtDirect(v)+'</td>';
      });
      html += '<td></td></tr>';
      document.getElementById('directTfoot').innerHTML = html;
    }

    function parseDirectNum(s){
      // Data planning = integer (karton/unit), tidak ada desimal
      // Format id-ID: titik = pemisah ribuan, koma = desimal
      // Hapus titik ribuan dan koma, ambil angka bulat saja
      s = (s || '').trim().replace(/[^0-9,]/g, '');
      // Hapus koma juga (tidak ada desimal di data ini)
      s = s.replace(/,/g, '');
      return parseInt(s, 10) || 0;
    }

    function fmtDirect(n){
      if(!n) return '—';
      return Number(n).toLocaleString('id-ID',{minimumFractionDigits:0,maximumFractionDigits:3});
    }

    function updateDateLabel(el){
      var idx = parseInt(el.dataset.idx);
      var val = el.innerText.trim();
      if(!isNaN(idx) && idx >= 0 && idx < directDateCols.length){
        directDateCols[idx] = val;
      }
      var filled = directDateCols.filter(function(d){ return d && d.trim(); });
      document.getElementById('directColInfo').innerText =
        filled.length > 0
          ? filled.length + ' kolom tanggal: ' + filled.join(', ')
          : 'Klik header kolom tanggal untuk mengisi tanggal';
    }

    function escHtml(s){
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function removeDateColumn(idx){
      if(!confirm('Hapus kolom "'+directDateCols[idx]+'"?')) return;
      directDateCols.splice(idx, 1);
      // Hapus cell ke-4+idx dari setiap baris
      var rows = document.getElementById('directTbody').rows;
      for(var i = 0; i < rows.length; i++){
        var cellIdx = 4 + idx;
        if(rows[i].cells[cellIdx]) rows[i].deleteCell(cellIdx);
      }
      renderDirectHeader();
    }

    function clearDirect(){
      if(!confirm('Reset semua data Planning Direct?')) return;
      document.getElementById('planningMobil').value = '';
      initDirect(30);
    }

    function pasteModeDirect(){
      showToast('💡 Klik sel di tabel lalu Ctrl+V dari Excel', '');
    }

    // ── Paste handler khusus Planning Direct ──────────────────────
    document.addEventListener('paste', function(e){
      var active = document.activeElement;
      if(!active) return;
      var inDirect = active.closest('#directTbody') || active.closest('#directThead');
      if(!inDirect) return;

      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text');
      if(!text || !text.trim()) return;

      var lines = text.trim().split('\n');
      var startTr = active.closest('tr');
      var startTbody = document.getElementById('directTbody');

      // Tentukan baris awal di tbody
      var startRowIdx = 0;
      if(startTr && startTr.parentElement === startTbody){
        startRowIdx = startTr.rowIndex - 1; // -1 karena thead ada 1 baris
      }

      // Tentukan kolom awal (cell yg aktif)
      var startColIdx = active.cellIndex !== undefined ? active.cellIndex : 1;

      lines.forEach(function(line, li){
        var cols = line.split('\t').map(function(c){ return c.trim(); });
        var rowIdx = startRowIdx + li;

        // Tambah baris jika kurang
        while(startTbody.rows.length <= rowIdx){
          addDirectRow('','','');
        }
        var tr = startTbody.rows[rowIdx];

        cols.forEach(function(val, ci){
          var colIdx = startColIdx + ci;
          // Skip kolom #(0) dan kolom hapus (terakhir)
          if(colIdx < 1 || colIdx >= tr.cells.length - 1) return;
          if(tr.cells[colIdx]) tr.cells[colIdx].innerText = val;
        });
      });

      updateDirectRowNumbers();
      updateDirectCount();
      showToast('✅ Data berhasil dipaste', 'success');
    });

    // Update grand total realtime saat ada input di tabel direct
    var _dtbl = document.getElementById('directTable');
    if(_dtbl) _dtbl.addEventListener('input', function(e){
      if(e.target.closest('#directTbody')) updateDirectFoot();
    });

    function getDirectRows(){
      var rows = document.getElementById('directTbody').rows;
      var result = [];
      for(var i = 0; i < rows.length; i++){
        var cells = rows[i].cells;
        var sku  = (cells[1] ? cells[1].innerText.trim() : '');
        var nama = (cells[2] ? cells[2].innerText.trim() : '');
        var qty  = (cells[3] ? cells[3].innerText.trim() : '');
        if(!sku && !nama && !qty) continue; // skip baris kosong
        var tgls = directDateCols.map(function(d, j){
          return cells[4+j] ? cells[4+j].innerText.trim() : '';
        });
        result.push([sku, nama, qty].concat(tgls));
      }
      return result;
    }

    function saveDirect(){
      var rows = getDirectRows();
      if(rows.length === 0){
        showToast('⚠️ Tidak ada data untuk disimpan', 'error'); return;
      }
      var planMobil = Number(document.getElementById('planningMobil').value) || 0;
      var btn = document.getElementById('btnSaveDirect');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" style="width:13px;height:13px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></span> Menyimpan...';

      var payload = {
        planningMobil: planMobil,
        dates:         directDateCols.slice(),
        rows:          rows
      };

      google.script.run
        .withSuccessHandler(function(res){
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-save"></i> Save';
          if(res && res.success){
            showToast('✅ ' + res.message, 'success');
          } else {
            showToast('❌ ' + (res ? res.message : 'Gagal'), 'error');
          }
        })
        .withFailureHandler(function(err){
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-save"></i> Save';
          showToast('❌ Gagal menyimpan ke FDOS', 'error');
        })
        .saveFdosData(payload);
    }


    var mdcRowCount = 0;
    var mdcDateCols = [];  // array label tanggal MDC
    var _mdcSel = {r1:-1,c1:-1,r2:-1,c2:-1};
    var _mdcDragging = false;

    var mdcInputMode = 'date'; // 'date' | 'week'

    function switchMdcInputMode(mode){
      mdcInputMode = mode;
      var btnD = document.getElementById('mInputMode_date');
      var btnW = document.getElementById('mInputMode_week');
      document.getElementById('mInputDate').style.display = mode==='date'?'flex':'none';
      document.getElementById('mInputWeek').style.display = mode==='week'?'flex':'none';
      var on  = 'background:linear-gradient(135deg,#0f2027,#2c5364);color:#fff;padding:5px 14px;border-radius:20px;border:none;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;';
      var off = 'background:transparent;color:#4a5568;padding:5px 14px;border-radius:20px;border:none;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;';
      btnD.style.cssText = mode==='date'?on:off;
      btnW.style.cssText = mode==='week'?on:off;
    }

    function applyMdcRange(){
      // Mode week: hitung Senin-Kamis lalu set 4 kolom langsung
      if(mdcInputMode === 'week'){
        var wn = parseInt(document.getElementById('mdcWeekNum').value);
        var wy = parseInt(document.getElementById('mdcWeekYear').value) || new Date().getFullYear();
        if(!wn){ showToast('⚠️ Isi nomor week dulu','error'); return; }
        var jan4 = new Date(Date.UTC(wy,0,4));
        var dow  = jan4.getUTCDay()||7;
        var mon  = new Date(jan4); mon.setUTCDate(jan4.getUTCDate()-(dow-1)+(wn-1)*7);
        mdcDateCols = [];
        for(var di=0;di<7;di++){
          var dd = new Date(mon); dd.setUTCDate(mon.getUTCDate()+di);
          var p = dd.toISOString().slice(0,10).split('-');
          mdcDateCols.push(p[2]+'/'+p[1]+'/'+p[0].slice(2));
          if(di===0) document.getElementById('mdcFrom').value = dd.toISOString().slice(0,10);
          if(di===6) document.getElementById('mdcTo').value   = dd.toISOString().slice(0,10);
        }
        renderMdcHeader();
        return;
      }
      var from = document.getElementById('mdcFrom').value;
      var to   = document.getElementById('mdcTo').value;
      if(!from || !to){
        showToast('⚠️ Pilih rentang tanggal terlebih dahulu', 'error'); return;
      }
      if(from > to){
        showToast('⚠️ Tanggal awal tidak boleh lebih besar dari tanggal akhir', 'error'); return;
      }
      // Generate array tanggal dari from sampai to
      var dates = [];
      var cur   = new Date(from+'T00:00:00Z');
      var end   = new Date(to+'T00:00:00Z');
      while(cur <= end){
        var dd = String(cur.getUTCDate()).padStart(2,'0');
        var mm = String(cur.getUTCMonth()+1).padStart(2,'0');
        var yy = String(cur.getUTCFullYear()).slice(2);
        dates.push(dd+'/'+mm+'/'+yy);
        cur.setUTCDate(cur.getUTCDate()+1);
      }
      if(dates.length > 14){
        if(!confirm('Rentang menghasilkan '+dates.length+' kolom. Lanjutkan?')) return;
      }
      // Reset tabel dengan kolom baru
      mdcDateCols = dates;
      mdcRowCount = 0;
      renderMdcHeader();
      document.getElementById('mdcTbody').innerHTML = '';
      document.getElementById('mdcTfoot').innerHTML = '';
      for(var i = 0; i < 30; i++) addMdcRow('','','');
      updateMdcCount();
      showToast('✅ '+dates.length+' kolom tanggal dibuat ('+dates[0]+' – '+dates[dates.length-1]+')', 'success');
    }

    function _mdcClearSel(){
      document.querySelectorAll('#mdcTable .dir-sel').forEach(function(el){ el.classList.remove('dir-sel'); });
      _mdcSel={r1:-1,c1:-1,r2:-1,c2:-1};
    }
    function _mdcApplySel(){
      document.querySelectorAll('#mdcTable .dir-sel').forEach(function(el){ el.classList.remove('dir-sel'); });
      var trs=Array.from(document.querySelectorAll('#mdcTbody tr'));
      var r1=Math.min(_mdcSel.r1,_mdcSel.r2),r2=Math.max(_mdcSel.r1,_mdcSel.r2);
      var c1=Math.min(_mdcSel.c1,_mdcSel.c2),c2=Math.max(_mdcSel.c1,_mdcSel.c2);
      for(var r=r1;r<=r2;r++){
        if(!trs[r]) continue;
        for(var cc=c1;cc<=c2;cc++){ if(trs[r].cells[cc]) trs[r].cells[cc].classList.add('dir-sel'); }
      }
    }
    function _mdcCopyBlock(){
      var trs=Array.from(document.querySelectorAll('#mdcTbody tr'));
      var r1=Math.min(_mdcSel.r1,_mdcSel.r2),r2=Math.max(_mdcSel.r1,_mdcSel.r2);
      var c1=Math.min(_mdcSel.c1,_mdcSel.c2),c2=Math.max(_mdcSel.c1,_mdcSel.c2);
      var lines=[];
      for(var r=r1;r<=r2;r++){
        if(!trs[r]) continue;
        var cells=[];
        for(var cc=c1;cc<=c2;cc++){ var td=trs[r].cells[cc]; cells.push(td?td.innerText.trim():''); }
        lines.push(cells.join('	'));
      }
      var txt=lines.join('\n');
      try{ navigator.clipboard.writeText(txt); }catch(ex){}
      showToast('\uD83D\uDCCB '+(r2-r1+1)+' baris disalin','success');
    }
    function _bindMdcEvents(){
      var tbl=document.getElementById('mdcTable');
      if(!tbl||tbl._mdcBound) return;
      tbl._mdcBound=true;
      // Mousedown: drag=blok, klik=anchor
      tbl.addEventListener('mousedown',function(e){
        var td=e.target.closest('td');
        if(!td||!td.closest('#mdcTbody')) return;
        if(e.target.tagName==='BUTTON'||e.target.closest('button')) return;
        var tr=td.closest('tr');
        var trs=Array.from(document.querySelectorAll('#mdcTbody tr'));
        var ri=trs.indexOf(tr), ci=td.cellIndex;
        var sx=e.clientX,sy=e.clientY;
        if(e.shiftKey&&_mdcSel.r1>=0){ _mdcSel.r2=ri;_mdcSel.c2=ci;_mdcApplySel();e.preventDefault();return; }
        _mdcSel={r1:ri,c1:ci,r2:ri,c2:ci};
        var moved=false;
        function onMove(ev){
          if(!moved&&(Math.abs(ev.clientX-sx)>4||Math.abs(ev.clientY-sy)>4)){
            moved=true;_mdcDragging=true;
            if(document.activeElement&&document.activeElement.closest('#mdcTbody')) document.activeElement.blur();
            _mdcApplySel();
          }
          if(moved){
            var ov=ev.target.closest('td');
            if(ov&&ov.closest('#mdcTbody')){ _mdcSel.r2=trs.indexOf(ov.closest('tr'));_mdcSel.c2=ov.cellIndex;_mdcApplySel(); }
            ev.preventDefault();
          }
        }
        function onUp(){
          document.removeEventListener('mousemove',onMove);
          document.removeEventListener('mouseup',onUp);
          _mdcDragging=false;
          if(moved) tbl.focus(); else _mdcSel={r1:ri,c1:ci,r2:ri,c2:ci};
        }
        document.addEventListener('mousemove',onMove);
        document.addEventListener('mouseup',onUp);
      });
      // focusin → overwrite flag + clear sel
      tbl.addEventListener('focusin',function(e){
        var td=e.target.closest('td[contenteditable="true"]');
        if(td && td.closest('#mdcTbody')){
          td._mdcOverwrite=true;
          if(!_mdcDragging) _mdcClearSel();
        }
      });
      tbl.addEventListener('input',function(e){ var td=e.target.closest('td'); if(td) td._mdcOverwrite=false; });
      // keydown: arrow, delete, overwrite, ctrl+c
      document.addEventListener('keydown',function(e){
        var dp=document.getElementById('mdcReal');
        if(!dp||!dp.classList.contains('active')) return;
        var ae=document.activeElement;
        // Ctrl+C
        if((e.ctrlKey||e.metaKey)&&e.key==='c'){
          if(_mdcSel.r1>=0){
            var hasBSel=window.getSelection()&&window.getSelection().toString().length>0;
            if(!hasBSel){ e.preventDefault();_mdcCopyBlock(); }
          }
          return;
        }
        // Delete/Backspace blok
        if((e.key==='Delete'||e.key==='Backspace')&&_mdcSel.r1>=0){
          var inEdit=ae&&ae.contentEditable==='true'&&ae.closest('#mdcTbody');
          var multi=Math.abs(_mdcSel.r2-_mdcSel.r1)>0||Math.abs(_mdcSel.c2-_mdcSel.c1)>0;
          var tblFoc=ae===tbl;
          if(e.key==='Delete'||(multi||!inEdit||tblFoc)){
            if(ae&&ae.closest('#mdcTbody')&&!multi&&e.key==='Delete'){ ae.textContent=''; return; }
            if(multi||tblFoc||e.key==='Delete'){
              e.preventDefault();
              var trs2=Array.from(document.querySelectorAll('#mdcTbody tr'));
              var r1=Math.min(_mdcSel.r1,_mdcSel.r2),r2=Math.max(_mdcSel.r1,_mdcSel.r2);
              var c1=Math.min(_mdcSel.c1,_mdcSel.c2),c2=Math.max(_mdcSel.c1,_mdcSel.c2);
              for(var r=r1;r<=r2;r++){
                if(!trs2[r]) continue;
                for(var cc=c1;cc<=c2;cc++){ var td2=trs2[r].cells[cc]; if(td2&&td2.contentEditable==='true') td2.textContent=''; }
              }
              updateMdcFoot();
            }
          }
          return;
        }
        if(!ae||!ae.closest('#mdcTbody')) return;
        var td3=ae.closest('td'); if(!td3) return;
        var tr3=td3.closest('tr');
        var trs3=Array.from(document.querySelectorAll('#mdcTbody tr'));
        var ri3=trs3.indexOf(tr3), ci3=td3.cellIndex;
        var editTds3=Array.from(tr3.querySelectorAll('td[contenteditable="true"]'));
        var ei3=editTds3.indexOf(td3);
        // Arrow pindah cell
        var isArr=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.key)>=0;
        if(isArr&&!e.shiftKey){
          e.preventDefault(); _mdcClearSel();
          var nri3=ri3,nei3=ei3;
          if(e.key==='ArrowUp') nri3=Math.max(0,ri3-1);
          if(e.key==='ArrowDown') nri3=Math.min(trs3.length-1,ri3+1);
          if(e.key==='ArrowLeft') nei3=Math.max(0,ei3-1);
          if(e.key==='ArrowRight') nei3=Math.min(editTds3.length-1,ei3+1);
          if(e.key==='ArrowUp'||e.key==='ArrowDown'){
            var neTds=Array.from(trs3[nri3].querySelectorAll('td[contenteditable="true"]'));
            if(neTds[ei3]) neTds[ei3].focus();
          } else { if(editTds3[nei3]) editTds3[nei3].focus(); }
          return;
        }
        // Shift+Arrow extend sel
        if(isArr&&e.shiftKey){
          e.preventDefault();
          if(_mdcSel.r1<0) _mdcSel={r1:ri3,c1:ci3,r2:ri3,c2:ci3};
          var nri4=ri3,nci4=ci3;
          if(e.key==='ArrowUp') nri4=Math.max(0,ri3-1);
          if(e.key==='ArrowDown') nri4=Math.min(trs3.length-1,ri3+1);
          if(e.key==='ArrowLeft') nci4=Math.max(0,ci3-1);
          if(e.key==='ArrowRight') nci4=ci3+1;
          _mdcSel.r2=nri4;_mdcSel.c2=nci4;_mdcApplySel();
          return;
        }
        // Overwrite
        var isSp3=e.key.length>1||e.ctrlKey||e.metaKey||e.altKey;
        if(!isSp3&&td3._dirOverwrite){ td3.textContent='';td3._dirOverwrite=false; }
      });
    }

    function initMdc(n){
      // Default 4 kolom tanggal kosong
      if(mdcDateCols.length === 0){
        mdcDateCols = ['','','','','','',''];
      }
      mdcRowCount = 0;
      renderMdcHeader();
      document.getElementById('mdcTbody').innerHTML = '';
      document.getElementById('mdcTfoot').innerHTML = '';
      for(var i = 0; i < n; i++) addMdcRow('','','');
      updateMdcCount();
      _bindMdcEvents();
    }

    function renderMdcHeader(){
      // Baris 1: fixed cols + per tanggal colspan=2
      var r1 = '<tr>';
      r1 += '<th rowspan="2" style="text-align:center;width:36px;">#</th>';
      r1 += '<th rowspan="2" style="text-align:left;">SKU</th>';
      r1 += '<th rowspan="2" style="text-align:left;">NAMA BARANG</th>';
      r1 += '<th rowspan="2" style="text-align:right;">QTY</th>';
      mdcDateCols.forEach(function(d, i){
        r1 += '<th colspan="2" class="direct-date-th" style="text-align:center;">'
            + '<span class="th-date-label" contenteditable="true" '
            + 'data-idx="'+i+'" '
            + 'onblur="updateMdcDateLabel(this)" '
            + 'onkeydown="if(event.key===String.fromCharCode(13)){event.preventDefault();this.blur();}" '
            + 'title="Klik untuk edit tanggal" '
            + 'style="outline:none;cursor:text;min-width:60px;display:inline-block;padding:2px 4px;border-radius:4px;">'
            + escHtml(d)
            + '</span>'
            + '<span class="th-del-date" onclick="removeMdcDateColumn('+i+')" title="Hapus kolom"><i class="fas fa-times"></i></span>'
            + '</th>';
      });
      r1 += '<th rowspan="2" style="width:32px;"></th></tr>';
      // Baris 2: sub-header KRT | PLT per tanggal
      var r2 = '<tr>';
      mdcDateCols.forEach(function(){
        r2 += '<th style="text-align:right;font-size:10px;font-weight:700;color:#4a5568;padding:3px 6px;">KRT</th>';
        r2 += '<th style="text-align:right;font-size:10px;font-weight:700;color:#4a5568;padding:3px 6px;">PLT</th>';
      });
      r2 += '</tr>';
      document.getElementById('mdcThead').innerHTML = r1 + r2;
      updateMdcFoot();
      var filled = mdcDateCols.filter(function(d){ return d && d.trim(); });
      document.getElementById('mdcColInfo').innerText =
        filled.length > 0
          ? filled.length + ' kolom tanggal: ' + filled.join(', ')
          : 'Klik header kolom tanggal untuk mengisi tanggal';
    }

    function updateMdcDateLabel(el){
      var idx = parseInt(el.dataset.idx);
      var val = el.innerText.trim();
      if(!isNaN(idx) && idx >= 0 && idx < mdcDateCols.length){
        mdcDateCols[idx] = val;
      }
      var filled = mdcDateCols.filter(function(d){ return d && d.trim(); });
      document.getElementById('mdcColInfo').innerText =
        filled.length > 0
          ? filled.length + ' kolom tanggal: ' + filled.join(', ')
          : 'Klik header kolom tanggal untuk mengisi tanggal';
    }

    function addMdcRow(sku, nama, qty, tglVals){
      var tbody = document.getElementById('mdcTbody');
      mdcRowCount++;
      var idx = mdcRowCount;
      var tr = document.createElement('tr');
      tr.dataset.idx = idx;

      // Kolom no
      var tdNo = document.createElement('td');
      tdNo.className = '';
      tdNo.style.cssText = 'text-align:center;background:linear-gradient(135deg,#0f2027,#2c5364);color:#fff;font-weight:700;font-size:11px;';
      tdNo.innerText = idx;
      tr.appendChild(tdNo);

      // SKU
      var tdSku = document.createElement('td');
      tdSku.contentEditable = 'true';
      tdSku.style.textAlign = 'left';
      tdSku.innerText = sku || '';
      tr.appendChild(tdSku);

      // Nama
      var tdNama = document.createElement('td');
      tdNama.contentEditable = 'true';
      tdNama.style.textAlign = 'left';
      tdNama.innerText = nama || '';
      tr.appendChild(tdNama);

      // QTY
      var tdQty = document.createElement('td');
      tdQty.contentEditable = 'true';
      tdQty.style.textAlign = 'right';
      tdQty.innerText = qty || '';
      tr.appendChild(tdQty);

      // Tanggal cells: 2 per tanggal (KRT dan PLT)
      mdcDateCols.forEach(function(d, i){
        ['krt','plt'].forEach(function(sub, si){
          var tdD = document.createElement('td');
          tdD.contentEditable = 'true';
          tdD.className = 'td-date-cell';
          tdD.dataset.sub = sub;
          tdD.innerText = (tglVals && tglVals[i*2+si] != null) ? (tglVals[i*2+si] || '') : '';
          tr.appendChild(tdD);
        });
      });

      // Hapus row
      var tdDel = document.createElement('td');
      tdDel.style.textAlign = 'center';
      tdDel.innerHTML = '<button class="direct-del-row" onclick="delMdcRow(this)" title="Hapus baris"><i class="fas fa-times"></i></button>';
      tr.appendChild(tdDel);

      tbody.appendChild(tr);
      updateMdcCount();
    }

    function delMdcRow(btn){
      var tr = btn.closest('tr');
      tr.parentElement.removeChild(tr);
      updateMdcRowNumbers();
      updateMdcCount();
    }

    function updateMdcRowNumbers(){
      var rows = document.getElementById('mdcTbody').rows;
      for(var i = 0; i < rows.length; i++){
        rows[i].cells[0].innerText = i + 1;
        rows[i].dataset.idx = i + 1;
      }
      mdcRowCount = rows.length;
    }

    function updateMdcCount(){
      var n = document.getElementById('mdcTbody').rows.length;
      mdcRowCount = n;
      document.getElementById('mdcRowCount').innerText = n + ' baris';
      updateMdcFoot();
    }

    function updateMdcFoot(){
      var rows = document.getElementById('mdcTbody').rows;
      var totQty = 0;
      var totSubs = mdcDateCols.map(function(){ return {krt:0,plt:0}; });
      for(var i = 0; i < rows.length; i++){
        var cells = rows[i].cells;
        totQty += parseMdcNum(cells[3] ? cells[3].innerText : '');
        mdcDateCols.forEach(function(d, j){
          totSubs[j].krt += parseMdcNum(cells[4+j*2]   ? cells[4+j*2].innerText   : '');
          totSubs[j].plt += parseMdcNum(cells[4+j*2+1] ? cells[4+j*2+1].innerText : '');
        });
      }
      // Baris 1: Grand Total KRT & PLT
      var html = '<tr style="font-weight:700;">';
      html += '<td style="text-align:center;">—</td>';
      html += '<td style="text-align:left;" colspan="2">GRAND TOTAL</td>';
      html += '<td style="text-align:right;">'+fmtMdc(totQty)+'</td>';
      totSubs.forEach(function(s){
        html += '<td style="text-align:right;">'+fmtMdc(s.krt)+'</td>';
        html += '<td style="text-align:right;">'+fmtMdc(s.plt)+'</td>';
      });
      html += '<td></td></tr>';
      // Baris 2: Planning Mobil = ROUNDUP(total PLT / 36) per hari
      var totalPlanMobil = 0;
      html += '<tr style="background:#1a3a5c;font-weight:700;">';
      html += '<td style="text-align:center;color:#fff;">—</td>';
      html += '<td colspan="2" style="font-size:11px;color:#90cdf4;">PLAN MOBIL <span style="font-size:10px;font-weight:400;color:#63b3ed;">(PLT÷36)</span></td>';
      html += '<td style="text-align:right;color:#fff;">—</td>';
      totSubs.forEach(function(s){
        html += '<td style="text-align:right;color:#4a5568;">—</td>';
        var planMobil = s.plt > 0 ? Math.ceil(s.plt / 36) : 0;
        totalPlanMobil += planMobil;
        html += '<td style="text-align:right;color:#f6e05e;font-weight:800;font-size:13px;">'+(planMobil||'—')+'</td>';
      });
      html += '<td></td></tr>';
      document.getElementById('mdcTfoot').innerHTML = html;
      // Auto-isi field Planning Mobil dengan total plan mobil harian
      var pmEl = document.getElementById('mdcPlanningMobil');
      if(pmEl) pmEl.value = totalPlanMobil || '';
    }

    function parseMdcNum(s){
      // Data planning = integer (karton/unit), tidak ada desimal
      // Format id-ID: titik = pemisah ribuan, koma = desimal
      // Hapus titik ribuan dan koma, ambil angka bulat saja
      s = (s || '').trim().replace(/[^0-9,]/g, '');
      // Hapus koma juga (tidak ada desimal di data ini)
      s = s.replace(/,/g, '');
      return parseInt(s, 10) || 0;
    }

    function fmtMdc(n){
      if(!n) return '—';
      return Number(n).toLocaleString('id-ID',{minimumFractionDigits:0,maximumFractionDigits:3});
    }

    function updateDateLabel(el){
      var idx = parseInt(el.dataset.idx);
      var val = el.innerText.trim();
      if(!isNaN(idx) && idx >= 0 && idx < mdcDateCols.length){
        mdcDateCols[idx] = val;
      }
      var filled = mdcDateCols.filter(function(d){ return d && d.trim(); });
      document.getElementById('mdcColInfo').innerText =
        filled.length > 0
          ? filled.length + ' kolom tanggal: ' + filled.join(', ')
          : 'Klik header kolom tanggal untuk mengisi tanggal';
    }

    function escHtml(s){
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function removeMdcDateColumn(idx){
      if(!confirm('Hapus kolom "'+mdcDateCols[idx]+'"?')) return;
      mdcDateCols.splice(idx, 1);
      // Hapus 2 cell (KRT+PLT) per tanggal
      var rows = document.getElementById('mdcTbody').rows;
      for(var i = 0; i < rows.length; i++){
        var cellIdx = 4 + idx*2;
        if(rows[i].cells[cellIdx]) rows[i].deleteCell(cellIdx);
        if(rows[i].cells[cellIdx]) rows[i].deleteCell(cellIdx); // hapus lagi (index bergeser)
      }
      renderMdcHeader();
    }

    function clearMdc(){
      if(!confirm('Reset semua data Planning MDC?')) return;
      document.getElementById('mdcPlanningMobil').value = '';
      initMdc(30);
    }

    function pasteModeMdc(){
      showToast('💡 Klik sel di tabel lalu Ctrl+V dari Excel', '');
    }

    // ── Paste handler khusus Planning Direct ──────────────────────
    document.addEventListener('paste', function(e){
      var active = document.activeElement;
      if(!active) return;
      var inDirect = active.closest('#mdcTbody') || active.closest('#directThead');
      if(!inDirect) return;

      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text');
      if(!text || !text.trim()) return;

      var lines = text.trim().split('\n');
      var startTr = active.closest('tr');
      var startTbody = document.getElementById('mdcTbody');

      // Tentukan baris awal di tbody
      var startRowIdx = 0;
      if(startTr && startTr.parentElement === startTbody){
        startRowIdx = startTr.rowIndex - 1; // -1 karena thead ada 1 baris
      }

      // Tentukan kolom awal (cell yg aktif)
      var startColIdx = active.cellIndex !== undefined ? active.cellIndex : 1;

      lines.forEach(function(line, li){
        var cols = line.split('\t').map(function(c){ return c.trim(); });
        var rowIdx = startRowIdx + li;

        // Tambah baris jika kurang
        while(startTbody.rows.length <= rowIdx){
          addMdcRow('','','');
        }
        var tr = startTbody.rows[rowIdx];

        cols.forEach(function(val, ci){
          var colIdx = startColIdx + ci;
          // Skip kolom #(0) dan kolom hapus (terakhir)
          if(colIdx < 1 || colIdx >= tr.cells.length - 1) return;
          if(tr.cells[colIdx]) tr.cells[colIdx].innerText = val;
        });
      });

      updateMdcRowNumbers();
      updateMdcCount();
      showToast('✅ Data berhasil dipaste', 'success');
    });

    // Update grand total realtime saat ada input di tabel direct
    var _dtbl = document.getElementById('mdcTable');
    if(_dtbl) _dtbl.addEventListener('input', function(e){
      if(e.target.closest('#mdcTbody')) updateMdcFoot();
    });

    function getMdcRows(){
      var rows = document.getElementById('mdcTbody').rows;
      var result = [];
      for(var i = 0; i < rows.length; i++){
        var cells = rows[i].cells;
        var sku  = (cells[1] ? cells[1].innerText.trim() : '');
        var nama = (cells[2] ? cells[2].innerText.trim() : '');
        var qty  = (cells[3] ? cells[3].innerText.trim() : '');
        if(!sku && !nama && !qty) continue;
        var vals = [];
        mdcDateCols.forEach(function(d, j){
          vals.push(cells[4+j*2]   ? cells[4+j*2].innerText.trim()   : ''); // KRT
          vals.push(cells[4+j*2+1] ? cells[4+j*2+1].innerText.trim() : ''); // PLT
        });
        result.push([sku, nama, qty].concat(vals));
      }
      return result;
    }

    function saveMdc(){
      var rows = getMdcRows();
      if(rows.length === 0){
        showToast('⚠️ Tidak ada data untuk disimpan', 'error'); return;
      }
      var planMobil = Number(document.getElementById('mdcPlanningMobil').value) || 0;
      var btn = document.getElementById('btnSaveMdc');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" style="width:13px;height:13px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></span> Menyimpan...';

      var payload = {
        planningMobil: planMobil,
        dates:         mdcDateCols.slice(),
        rows:          rows
      };

      google.script.run
        .withSuccessHandler(function(res){
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-save"></i> Save';
          if(res && res.success){
            showToast('✅ ' + res.message, 'success');
          } else {
            showToast('❌ ' + (res ? res.message : 'Gagal'), 'error');
          }
        })
        .withFailureHandler(function(err){
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-save"></i> Save';
          showToast('❌ Gagal menyimpan ke PLANNING_MDC', 'error');
        })
        .saveMdcData(payload);
    }



    // =============================================
    // DIRECT SUMMARY
    // =============================================
    var directSumCache = null; // { fdos, realisasi }



    // ===== TAB PLANNING =====
    var planWeekData = []; // semua week dari FDOS (di-cache)

    var _planView = 'direct';

    function switchPlanView(v){
      _planView = v;
      var btnD = document.getElementById('btnPlanView_direct');
      var btnM = document.getElementById('btnPlanView_mdc');
      var bodyD = document.getElementById('planningTabBody');
      var bodyM = document.getElementById('planningMdcBody');
      if(v === 'direct'){
        btnD.style.background='#2c5364'; btnD.style.color='#fff'; btnD.style.border='none';
        btnM.style.background='#fff'; btnM.style.color='#4a5568'; btnM.style.border='1px solid #cbd5e0';
        bodyD.style.display=''; bodyM.style.display='none';
      } else {
        btnM.style.background='#2c5364'; btnM.style.color='#fff'; btnM.style.border='none';
        btnD.style.background='#fff'; btnD.style.color='#4a5568'; btnD.style.border='1px solid #cbd5e0';
        bodyD.style.display='none'; bodyM.style.display='';
        loadPlanningMdc();
      }
    }

    function loadPlanningMdc(){
      var body = document.getElementById('planningMdcBody');
      // Ambil filter week yang sama dengan Direct
      var wFrom = parseInt(document.getElementById('planWeekFrom').value)||null;
      var wTo   = parseInt(document.getElementById('planWeekTo').value)||null;
      var wYear = parseInt(document.getElementById('planWeekYear').value)||(new Date().getFullYear());

      // Convert week range ke from-to date
      function weekToDate(week, year, startOfWeek){
        var jan4 = new Date(Date.UTC(year, 0, 4));
        var mon = new Date(jan4);
        mon.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay()||7)-1) + (week-1)*7);
        if(!startOfWeek){ var sun = new Date(mon); sun.setUTCDate(mon.getUTCDate()+6); return sun.toISOString().slice(0,10); }
        return mon.toISOString().slice(0,10);
      }

      var from = wFrom ? weekToDate(wFrom, wYear, true)  : null;
      var to   = wTo   ? weekToDate(wTo,   wYear, false) : null;

      body.innerHTML = "<div class='spinner' style='margin:30px auto;'></div>";
      if(typeof google === 'undefined'){ body.innerHTML='<p style="text-align:center;color:#a0aec0;padding:20px;">Tidak ada data.</p>'; return; }
      google.script.run
        .withSuccessHandler(function(res){
          if(!res||!res.success||!res.weeks||!res.weeks.length){
            body.innerHTML="<p style='text-align:center;color:#a0aec0;padding:30px;font-size:13px;'><i class='fas fa-inbox' style='font-size:28px;display:block;margin-bottom:8px;'></i>Belum ada data Planning MDC untuk periode ini.</p>";
            return;
          }
          renderPlanningMdcTables(res.weeks);
        })
        .withFailureHandler(function(){
          body.innerHTML="<p style='text-align:center;color:#e53e3e;padding:20px;'>Gagal load data Planning MDC.</p>";
        })
        .getMdcPlanningData(from, to);
    }

    function renderPlanningMdcTables(weeks){
      var body = document.getElementById('planningMdcBody');
      var html = '';
      weeks.forEach(function(wk, wi){
        var dates = Object.keys(wk.planHarian||{}).sort();
        if(!dates.length) return;
        var periodeFrom = formatTglDisplay(dates[0]);
        var periodeTo   = formatTglDisplay(dates[dates.length-1]);
        var isoWk = getISOWeek(dates[0]);

        html += '<div style="background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08);border:1px solid #e2e8f0;margin-bottom:16px;overflow:hidden;">';
        // Header
        html += '<div style="background:linear-gradient(135deg,#1a3a5c,#2d6a9f);color:#fff;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;">';
        html += '<div><div style="font-size:11px;opacity:.7;text-transform:uppercase;letter-spacing:.5px;">Planning MDC</div>';
        html += '<div style="font-size:15px;font-weight:800;">Week '+isoWk+' &nbsp;<span style="opacity:.7;font-size:12px;font-weight:500;">'+periodeFrom+' – '+periodeTo+'</span></div></div>';
        html += '<div style="text-align:right;"><div style="font-size:10px;opacity:.65;">Plan Mobil/Week</div><div style="font-size:14px;font-weight:800;">'+(wk.planMobil||0)+' DO</div></div>';
        html += '</div>';

        // Tabel per hari
        html += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;">';
        html += '<thead><tr style="background:#f0f4f8;">'
          + '<th style="padding:8px 12px;text-align:left;font-weight:700;color:#4a5568;">Tanggal</th>'
          + '<th style="padding:8px 12px;text-align:right;font-weight:700;color:#4a5568;">Plan Mobil Harian</th>'
          + '</tr></thead><tbody>';

        var totalMobil = 0;
        dates.forEach(function(tgl, i){
          var mobil = wk.planHarian[tgl]||0;
          totalMobil += mobil;
          var hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][new Date(tgl).getUTCDay()];
          var bg = i%2===0?'#fff':'#f7fafc';
          html += '<tr style="background:'+bg+';">'
            + '<td style="padding:8px 12px;color:#2d3748;">'+hari+', '+formatTglDisplay(tgl)+'</td>'
            + '<td style="padding:8px 12px;text-align:right;font-weight:700;color:#2c5364;">'+(mobil>0?fmtN(mobil)+' DO':'—')+'</td>'
            + '</tr>';
        });

        // Total
        html += '<tr style="background:#e8f0fe;font-weight:800;">'
          + '<td style="padding:8px 12px;color:#1a3a5c;">TOTAL</td>'
          + '<td style="padding:8px 12px;text-align:right;color:#1a3a5c;font-size:14px;">'+fmtN(totalMobil)+' DO</td>'
          + '</tr>';
        html += '</tbody></table></div></div>';
      });
      body.innerHTML = html || "<p style='text-align:center;color:#a0aec0;padding:30px;'>Tidak ada data.</p>";
    }

    function initPlanningTab(){
      document.getElementById('planningTabBody').innerHTML = "<div class='spinner' style='margin:30px auto;'></div>";

      // Set default filter: week saat ini
      var now = new Date();
      var day = now.getUTCDay()||7;
      var thu = new Date(now); thu.setUTCDate(now.getUTCDate()+4-day);
      var jan1 = new Date(Date.UTC(thu.getUTCFullYear(),0,1));
      var curWeek = Math.ceil((((thu-jan1)/86400000)+1)/7);
      var curYear = thu.getUTCFullYear();

      if(!document.getElementById('planWeekFrom').value){
        document.getElementById('planWeekFrom').value = curWeek;
        document.getElementById('planWeekTo').value   = curWeek;
        document.getElementById('planWeekYear').value = curYear;
      }

      if(planWeekData.length > 0){
        renderPlanningTables();
        return;
      }

      if(typeof google !== 'undefined'){
        google.script.run
          .withSuccessHandler(function(res){
            planWeekData = (res && res.success && res.weeks) ? res.weeks : [];
            renderPlanningTables();
          })
          .withFailureHandler(function(){
            document.getElementById('planningTabBody').innerHTML =
              "<p style='text-align:center;color:#e53e3e;padding:20px;'>Gagal load data.</p>";
          })
          .getFdosData(null, null); // null = ambil semua week
      } else {
        planWeekData = DUMMY_FDOS_WEEKS;
        renderPlanningTables();
      }
    }

    function resetPlanningFilter(){
      document.getElementById('planWeekFrom').value  = '';
      document.getElementById('planWeekTo').value    = '';
      document.getElementById('planWeekYear').value  = '';
      document.getElementById('planningTabBody').innerHTML =
        "<p style='text-align:center;color:#a0aec0;padding:30px;font-size:13px;'>" +
        "<i class='fas fa-filter' style='font-size:24px;display:block;margin-bottom:8px;'></i>Isi filter week lalu klik Tampilkan.</p>";
    }

    function loadPlanningTab(){
      if(_planView === 'mdc'){ loadPlanningMdc(); return; }
      renderPlanningTables();
    }

    function renderPlanningTables(){
      var body = document.getElementById('planningTabBody');
      var wFrom = parseInt(document.getElementById('planWeekFrom').value) || 0;
      var wTo   = parseInt(document.getElementById('planWeekTo').value)   || wFrom;
      var wYear = parseInt(document.getElementById('planWeekYear').value) || new Date().getFullYear();
      if(!wFrom){
        body.innerHTML = "<p style='text-align:center;color:#a0aec0;padding:30px;font-size:13px;'><i class='fas fa-filter' style='font-size:24px;display:block;margin-bottom:8px;'></i>Isi filter week lalu klik Tampilkan.</p>";
        return;
      }
      var selected = planWeekData.filter(function(wk){ return wk.isoWeek >= wFrom && wk.isoWeek <= wTo; });
      if(!selected.length){
        body.innerHTML = "<p style='text-align:center;color:#a0aec0;padding:30px;font-size:13px;'><i class='fas fa-inbox' style='font-size:24px;display:block;margin-bottom:8px;'></i>Tidak ada data untuk Week "+wFrom+(wTo!==wFrom?' – '+wTo:'')+".</p>";
        return;
      }

      var html = '';
      selected.forEach(function(wk){
        var dates   = wk.dates || [];
        var rows    = wk.rows  || [];
        var planMob = wk.planningMobil || 0;
        var totalQt = wk.totalQty || 0;

        // Header kartu
        html += "<div style='background:#fff;border-radius:14px;box-shadow:0 4px 18px rgba(15,32,39,.09);border:1px solid #e2e8f0;overflow:hidden;margin-bottom:16px;'>";

        // Card header
        html += "<div style='background:linear-gradient(135deg,#0f2027,#2c5364);color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;'>"
          + "<div><div style='font-size:11px;opacity:.65;text-transform:uppercase;letter-spacing:.5px;'>Planning Outbound Direct</div>"
          + "<div style='font-size:17px;font-weight:800;'>Week "+wk.isoWeek+"</div></div>"
          + "<div style='display:flex;gap:16px;'>"
          + "<div style='text-align:right;'><div style='font-size:10px;opacity:.65;'>Planning Mobil</div><div style='font-size:15px;font-weight:800;'>"+fmtN(planMob)+" mobil</div></div>"
          + "<div style='text-align:right;'><div style='font-size:10px;opacity:.65;'>Total Karton</div><div style='font-size:15px;font-weight:800;color:#f6e05e;'>"+fmtN(totalQt)+" ©</div></div>"
          + "</div></div>";

        // Tabel
        html += "<div style='overflow-x:auto;'><table style='width:100%;border-collapse:collapse;font-size:13px;'>";

        // Header kolom
        html += "<thead><tr style='background:#f7fafc;'>"
          + "<th style='padding:8px 14px;text-align:left;color:#718096;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;border-bottom:2px solid #e2e8f0;'>SKU</th>"
          + "<th style='padding:8px 14px;text-align:left;color:#718096;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;border-bottom:2px solid #e2e8f0;'>Nama Barang</th>"
          + "<th style='padding:8px 14px;text-align:right;color:#718096;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;border-bottom:2px solid #e2e8f0;'>QTY</th>";
        dates.forEach(function(d){
          html += "<th style='padding:8px 10px;text-align:right;color:#718096;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;border-bottom:2px solid #e2e8f0;'>"+formatTglDisplay(d)+"</th>";
        });
        html += "</tr></thead><tbody>";

        // Pisahkan baris biasa dan grand total
        var normalRows = rows.filter(function(r){
          return !(r.isGrandTotal
            || (r.sku||'').toUpperCase().indexOf('GRAND') >= 0
            || (r.nama||'').toUpperCase().indexOf('GRAND') >= 0
            || (r.nama||'').toUpperCase().indexOf('TOTAL') >= 0);
        });

        // Baris data biasa
        normalRows.forEach(function(r, i){
          var bg = i%2===0 ? 'background:#fff;' : 'background:#f9fafb;';
          html += "<tr style='"+bg+"border-bottom:1px solid #f0f4f8;'>"
            + "<td style='padding:8px 14px;color:#2d3748;font-weight:600;'>"+escHtml(r.sku||'')+"</td>"
            + "<td style='padding:8px 14px;color:#4a5568;'>"+escHtml(r.nama||'')+"</td>"
            + "<td style='padding:8px 14px;text-align:right;font-weight:700;color:#2c5364;'>"+fmtN(r.qty||0)+"</td>";
          dates.forEach(function(d){
            var v = (r.byDate && r.byDate[d]) ? r.byDate[d] : 0;
            html += "<td style='padding:8px 10px;text-align:right;color:"+(v>0?'#276749':'#a0aec0')+";font-weight:"+(v>0?'700':'400')+";'>"+(v>0?fmtN(v):'—')+"</td>";
          });
          html += "</tr>";
        });

        if(!normalRows.length){
          html += "<tr><td colspan='"+(3+dates.length)+"' style='text-align:center;padding:20px;color:#a0aec0;font-size:13px;'>Belum ada data SKU.</td></tr>";
        }

        // Hitung Grand Total dari normalRows
        var gtQty = 0;
        var gtByDate = {};
        dates.forEach(function(d){ gtByDate[d] = 0; });
        normalRows.forEach(function(r){
          gtQty += r.qty || 0;
          dates.forEach(function(d){
            gtByDate[d] += (r.byDate && r.byDate[d]) ? r.byDate[d] : 0;
          });
        });

        // Baris Grand Total
        html += "<tr style='background:#fffbeb;border-top:2px solid #f6e05e;font-weight:800;'>"
          + "<td style='padding:10px 14px;color:#2d3748;font-weight:800;'></td>"
          + "<td style='padding:10px 14px;color:#2d3748;font-weight:800;'>GRAND TOTAL</td>"
          + "<td style='padding:10px 14px;text-align:right;font-weight:800;color:#b7791f;'>"+fmtN(gtQty)+"</td>";
        dates.forEach(function(d){
          var v = gtByDate[d] || 0;
          html += "<td style='padding:10px 10px;text-align:right;font-weight:800;color:"+(v>0?'#b7791f':'#a0aec0')+";'>"+(v>0?fmtN(v):'—')+"</td>";
        });
        html += "</tr>";

        html += "</tbody></table></div></div>";
      });

      body.innerHTML = "<div style='animation:fadeIn .25s ease both'>"+html+"</div>";
    }


    // ===== DIRECT SIMPLE (Planning Karton vs Realisasi Karton) =====


    // Fetch 2 GAS functions paralel
    function fetchParallel(calls, onDone, onFail){
      var results = new Array(calls.length);
      var done = 0;
      calls.forEach(function(call, i){
        google.script.run
          .withSuccessHandler(function(res){ results[i] = res; if(++done === calls.length) onDone(results); })
          .withFailureHandler(onFail || function(){ })
          [call.fn].apply(null, call.args || []);
      });
    }

    // Expand tanggal ke Senin–Minggu week penuh
    function expandToFullWeek(from, to){
      function toMon(d){ var day=d.getUTCDay()||7; var m=new Date(d); m.setUTCDate(d.getUTCDate()-(day-1)); return m; }
      function toSun(d){ var day=d.getUTCDay()||7; var s=new Date(d); s.setUTCDate(d.getUTCDate()+(7-day)); return s; }
      return {
        from: toMon(new Date(from)).toISOString().slice(0,10),
        to:   toSun(new Date(to)).toISOString().slice(0,10)
      };
    }

    function loadDirectSimple(){
      var from = document.getElementById('filterFrom').value;
      var to   = document.getElementById('filterTo').value;
      if(!from || !to){
        document.getElementById('realSummaryBody').innerHTML =
          "<p style='text-align:center;color:#a0aec0;padding:30px;font-size:13px;'>" +
          "<i class='fas fa-calendar-alt' style='font-size:28px;display:block;margin-bottom:8px;'></i>" +
          "Pilih rentang tanggal atau week terlebih dahulu.</p>";
        return;
      }
      document.getElementById('realSummaryBody').innerHTML = "<div class='spinner' style='margin:20px auto;'></div>";

      google.script.run
        .withSuccessHandler(function(fdosRes){
          google.script.run
            .withSuccessHandler(function(realRes){
              renderDirectSimple(from, to, fdosRes, realRes);
            })
            .withFailureHandler(function(){ showToast('❌ Gagal load data Realisasi','error'); })
            .getRealisasiData(from, to);
        })
        .withFailureHandler(function(){ showToast('❌ Gagal load data FDOS','error'); })
        .getFdosData(from, to);
    }

    function renderDirectSimple(from, to, fdosRes, realRes){
      var body = document.getElementById('realSummaryBody');
      // from/to sudah di-expand ke full week oleh loadDirectSimple

      var weeks = (fdosRes && fdosRes.success && fdosRes.weeks) ? fdosRes.weeks : [];

      // Build fdosByDate dan fdosByWeek
      var fdosByDate = {};
      weeks.forEach(function(wk){
        Object.keys(wk.byDate).forEach(function(lbl){
          var norm = normalizeTglLabel(lbl);
          if(!norm) return;
          fdosByDate[norm] = (fdosByDate[norm]||0) + wk.byDate[lbl];
        });
      });

      // Build realByDate (kolom 17 = krtSub)
      var realByDate = {};
      if(realRes && realRes.success && realRes.data){
        realRes.data.forEach(function(r){
          var tgl = r[0];
          if(!realByDate[tgl]) realByDate[tgl] = { krtSub:0 };
          realByDate[tgl].krtSub += Number(r[17]) || 0; // r[17]=KRT_SUB (subdist only)
        });
      }

      // Kelompokkan tanggal per ISO week
      var weekGroups = {}; // isoWk → { dates[], planMobil, totalPlanKrt }
      var weekOrder  = [];
      var cur = new Date(from+'T00:00:00Z');
      var endD = new Date(to+'T00:00:00Z');
      while(cur <= endD){
        var tgl  = cur.toISOString().slice(0,10);
        var isoWk = getISOWeek(tgl);
        if(!weekGroups[isoWk]){ weekGroups[isoWk] = { dates:[], totalPlanKrt:0, totalRealKrt:0 }; weekOrder.push(isoWk); }
        weekGroups[isoWk].dates.push(tgl);
        weekGroups[isoWk].totalPlanKrt += fdosByDate[tgl] || 0;
        weekGroups[isoWk].totalRealKrt += (realByDate[tgl]||{krtSub:0}).krtSub;
        cur.setUTCDate(cur.getUTCDate()+1);
      }

      // Cari planningMobil & totalQty per week dari FDOS — pakai wk.isoWeek langsung
      weeks.forEach(function(wk){
        var isoWk = wk.isoWeek;
        if(weekGroups[isoWk]){
          weekGroups[isoWk].planMobil = wk.planningMobil || 0;
          weekGroups[isoWk].totalQty  = wk.totalQty || 0;
        }
      });

      if(weekOrder.length === 0){
        body.innerHTML = "<p style='text-align:center;color:#a0aec0;padding:30px;font-size:13px;'><i class='fas fa-inbox' style='font-size:28px;display:block;margin-bottom:8px;'></i>Tidak ada data.</p>";
        hideStickyFooter();
        return;
      }

      var HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

      var numWeeks = weekOrder.length;
      var html = numWeeks > 1
        ? "<div style='display:grid;grid-template-columns:repeat(2,1fr);gap:12px;'>"
        : "";
      weekOrder.forEach(function(isoWk){
        var grp       = weekGroups[isoWk];
        var planMobil = grp.planMobil || 0;
        var totalQty  = grp.totalQty  || 0;
        var totalReal = grp.totalRealKrt;
        var totalPlan = grp.totalPlanKrt;
        var pct       = totalPlan > 0 ? (totalReal/totalPlan*100).toFixed(1) : null;
        var pctColor  = pct===null?'#a0aec0': pct>=100?'#68d391': pct>=80?'#f6e05e':'#fc8181';
        var wDates    = grp.dates;
        var periodeWk = formatTglDisplay(wDates[0])+' – '+formatTglDisplay(wDates[wDates.length-1]);

        // Card per week
        html += "<div style='background:#fff;border-radius:14px;box-shadow:0 4px 18px rgba(15,32,39,.09);border:1px solid #e2e8f0;overflow:hidden;margin-bottom:14px;'>";

        // Header card
        html += "<div style='background:linear-gradient(135deg,#0f2027,#2c5364);color:#fff;padding:12px 16px;'>"
          + "<div style='display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;'>"
          + "<div><div style='font-size:11px;opacity:.7;text-transform:uppercase;letter-spacing:.5px;'>Planning Outbound Jayanti 2</div>"
          + "<div style='font-size:16px;font-weight:800;'>Week "+isoWk+" &nbsp;<span style='opacity:.7;font-size:13px;font-weight:500;'>"+periodeWk+"</span></div></div>"
          + "<div style='display:flex;gap:10px;align-items:center;'>"
          + (planMobil>0?"<div style='text-align:right;'><div style='font-size:10px;opacity:.65;'>Planning</div><div style='font-size:14px;font-weight:800;'>"+fmtN(planMobil)+" mobil</div></div>":"")
          + (totalQty>0?"<div style='text-align:right;'><div style='font-size:10px;opacity:.65;'>Plan Karton/Week</div><div style='font-size:14px;font-weight:800;color:#f6e05e;'>"+fmtN(totalQty)+" ©</div></div>":"")
          + "</div></div></div>";

        // Baris per hari
        html += "<div style='padding:8px 0;'>";
        var hasData = false;
        var cumRealKrt = 0; // akumulator realisasi karton kumulatif dalam week ini
        wDates.forEach(function(tgl){
          var planKrt = fdosByDate[tgl] || 0;
          var realKrt = (realByDate[tgl]||{krtSub:0}).krtSub;
          var hariNm  = HARI[new Date(tgl).getUTCDay()];
          var hasPlan = planKrt > 0;
          var hasReal = realKrt > 0;
          if(!isEmpty) hasData = true;
          cumRealKrt += realKrt;
          var isEmpty = !hasPlan && !hasReal;

          var pendKrt     = realKrt - planKrt;           // pendingan harian
          var pendKrtWk   = cumRealKrt - totalPlan;      // pendingan weekly kumulatif
          var dayPct    = hasPlan ? (realKrt/planKrt*100).toFixed(1) : null;
          var dayPctClr = dayPct===null?'#a0aec0': dayPct>=100?'#27ae60': dayPct>=80?'#f39c12':'#e74c3c';

          html += "<div style='display:grid;grid-template-columns:90px 1fr 1fr 1fr;align-items:center;padding:7px 16px;border-bottom:1px solid #f7fafc;gap:4px;'>";
          // Hari
          html += "<div style='font-size:12px;font-weight:700;color:#2d3748;'>"+hariNm+"<br><span style='font-size:10px;font-weight:500;color:#a0aec0;'>"+formatTglDisplay(tgl)+"</span></div>";
          // Planning
          html += "<div style='font-size:12px;'><div style='font-size:9px;text-transform:uppercase;color:#a0aec0;letter-spacing:.4px;'>Planning</div>"
            + "<div style='font-weight:700;color:#2c5364;'>"+(hasPlan?fmtN(planKrt)+' ©':'—')+"</div></div>";
          // Realisasi
          html += "<div style='font-size:12px;'><div style='font-size:9px;text-transform:uppercase;color:#a0aec0;letter-spacing:.4px;'>Realisasi</div>"
            + "<div style='font-weight:700;color:"+(hasReal?'#276749':'#a0aec0')+";'>"+fmtN(realKrt)+" ©</div></div>";
          // Pendingan: harian + weekly
          html += "<div style='text-align:right;'>";
          if(!isEmpty && dayPct!==null) html += "<span style='font-size:11px;font-weight:800;background:"+dayPctClr+";color:#fff;padding:2px 8px;border-radius:20px;'>"+dayPct+"%</span><br>";
          // Pendingan Harian
          if(!isEmpty && hasPlan && pendKrt!==0){
            var ps = pendKrt>0?'+':'';
            html += "<span style='font-size:10px;color:"+(pendKrt>=0?'#27ae60':'#e74c3c')+";font-weight:700;' title='Pendingan Harian'>"+ps+fmtN(pendKrt)+" ©</span><br>";
          }
          // Pendingan Weekly kumulatif
          if(!isEmpty && totalPlan > 0){
            var psWk = pendKrtWk>0?'+':'';
            var clrWk = pendKrtWk>=0?'#27ae60':'#e74c3c';
            html += "<span style='font-size:9px;color:"+clrWk+";font-weight:700;opacity:.8;' title='Pendingan Weekly s.d. hari ini'>"+psWk+fmtN(pendKrtWk)+" ©/wk</span>";
          }
          html += "</div></div>";
        });

        if(!hasData){
          html += "<div style='text-align:center;color:#a0aec0;padding:14px;font-size:12px;'>Belum ada realisasi</div>";
        }
        html += "</div>";

        // Footer card: total planning karton week + realisasi + %
        var footPct = totalPlan>0 ? (totalReal/totalPlan*100) : null;
        html += "<div style='background:#f7fafc;border-top:1px solid #e2e8f0;padding:10px 16px;'>"
          + "<div style='display:flex;justify-content:space-between;align-items:center;'>"
          + "<div style='font-size:12px;color:#4a5568;'>"
          + "<span style='font-weight:600;'>Total Realisasi:</span> "
          + "<span style='font-weight:800;color:#2c5364;font-size:14px;'>"+fmtN(totalReal)+" ©</span>"
          + (totalPlan>0 ? " <span style='color:#718096;'>dari "+fmtN(totalPlan)+" ©</span>" : "")
          + "</div>"
          + (footPct!==null ? "<span style='font-size:14px;font-weight:800;color:"+pctColor+";'>"+fmtPct(footPct)+"%</span>" : "")
          + "</div>"
          + (totalQty>0 ? "<div style='font-size:11px;color:#718096;margin-top:4px;'><i class='fas fa-boxes' style='margin-right:4px;'></i><span style='font-weight:600;'>Plan Karton/Week:</span> "+fmtN(totalQty)+" ©</div>" : "")
          + "</div>";

        html += "</div>"; // end card
      });

      if(numWeeks > 1) html += "</div>"; // end grid
      body.innerHTML = "<div style='animation:fadeIn .25s ease both'>"+html+"</div>";
      hideStickyFooter();
    }

    function updateStickyFooterDirectSimple(d){
      var el = document.getElementById('summaryFooter');
      if(!el) return;
      var summaryPane = document.getElementById('summaryReal');
      if(!summaryPane || !summaryPane.classList.contains('active')) return;

      document.querySelector('#ssfPeekKrt').previousElementSibling.innerText  = 'Plan Karton';
      document.querySelector('#ssfPeekPct').previousElementSibling.innerText  = 'Real Karton';
      document.querySelector('#ssfPeekSisa').previousElementSibling.innerText = 'Capaian';
      document.querySelector('#ssfPeekPend').previousElementSibling.innerText = 'Pendingan';

      document.getElementById('ssfPeekKrt').innerText   = fmtN(d.planKrt)+' ©';
      document.getElementById('ssfPeekPct').innerText   = fmtN(d.realKrt)+' ©';
      document.getElementById('ssfPeekSisa').innerText  = d.pct+'%';
      document.getElementById('ssfPeekPend').innerText  = d.pend===0?'—':(d.pend>0?'+':'')+fmtN(d.pend)+' ©';

      document.getElementById('ssfDetailPeriode').innerText = d.periodeLabel;
      document.getElementById('ssfDetailKrt').innerText     = fmtN(d.realKrt)+' © ('+d.pct+'%)';
      document.getElementById('ssfDetailSisa').innerText    = 'Plan '+fmtN(d.planKrt)+' ©';
      var pendEl = document.getElementById('ssfDetailPend');
      pendEl.innerText = d.pend===0?'—':(d.pend>0?'+':'')+fmtN(d.pend)+' ©';
      pendEl.style.color = d.pend>=0?'#68d391':'#fc8181';

      el.style.display = 'block';
      var body2 = document.getElementById('realSummaryBody');
      if(body2) body2.style.paddingBottom = '70px';
    }


    function loadDirectSummary(){
      var from = document.getElementById('filterFrom').value;
      var to   = document.getElementById('filterTo').value;
      if(!from || !to){
        document.getElementById('realSummaryBody').innerHTML =
          "<p style='text-align:center;color:#a0aec0;padding:30px;font-size:13px;'>" +
          "<i class='fas fa-calendar-alt' style='font-size:28px;display:block;margin-bottom:8px;'></i>" +
          "Pilih rentang tanggal atau week terlebih dahulu.</p>";
        return;
      }
      document.getElementById('realSummaryBody').innerHTML = "<div class='spinner' style='margin:20px auto;'></div>";

      google.script.run
        .withSuccessHandler(function(fdosRes){
          google.script.run
            .withSuccessHandler(function(realRes){
              renderDirectSummary(from, to, fdosRes, realRes);
            })
            .withFailureHandler(function(){ showToast('❌ Gagal load data Realisasi','error'); })
            .getRealisasiData(from, to);
        })
        .withFailureHandler(function(){ showToast('❌ Gagal load data FDOS','error'); })
        .getFdosData(from, to);
    }



    function renderDirectSummary(from, to, fdosRes, realRes){
      var body = document.getElementById('realSummaryBody');

      // ── Parse FDOS: multi-week ────────────────────────────────
      // weeks = [ { planningMobil, totalQty, byDate:{label:krt} } ]
      var weeks = (fdosRes && fdosRes.success && fdosRes.weeks) ? fdosRes.weeks : [];

      // Gabungkan semua byDate → fdosByDate (normalize label ke yyyy-MM-dd)
      // Sekaligus buat weekMap: yyyy-MM-dd → weekIndex
      var fdosByDate = {};
      var dateToWeek = {};
      weeks.forEach(function(wk, wi){
        Object.keys(wk.byDate).forEach(function(lbl){
          var norm = normalizeTglLabel(lbl);
          if(!norm) return;
          fdosByDate[norm] = (fdosByDate[norm]||0) + wk.byDate[lbl];
          dateToWeek[norm] = wi;
        });
      });

      // ── Parse REALISASI ───────────────────────────────────────
      var realByDate = {};
      if(realRes && realRes.success && realRes.data){
        // Sort by tanggal + shift_no agar shift terakhir = nilai terbesar
        var sorted = realRes.data.slice().sort(function(a,b){
          if(a[0] < b[0]) return -1; if(a[0] > b[0]) return 1;
          return (Number(a[2])||0) - (Number(b[2])||0);
        });
        sorted.forEach(function(r){
          var tgl = r[0];
          if(!realByDate[tgl]) realByDate[tgl] = { planSub:0, krtSub:0, totalSpe:0 };
          // planSub: ambil nilai shift terakhir (overwrite, bukan akumulasi)
          var ps = Number(r[7]) || 0;
          if(ps > 0) realByDate[tgl].planSub = ps;
          realByDate[tgl].krtSub   += Number(r[17]) || 0; // KRT_SUB kumulatif
          realByDate[tgl].totalSpe += Number(r[16]) || 0; // SPE_SUB kumulatif
        });
      }

      // ── Buat list tanggal dalam range ─────────────────────────
      var dates = [];
      var cur = new Date(from+'T00:00:00Z'), end2 = new Date(to+'T00:00:00Z');
      while(cur <= end2){
        dates.push(cur.toISOString().slice(0,10));
        cur.setUTCDate(cur.getUTCDate()+1);
      }

      // ── Kelompokkan tanggal per ISO week number ─────────────
      var weekGroups = {}; // isoWeekNum → { fdosIdx, dates[] }
      var weekOrder  = [];
      dates.forEach(function(tgl){
        var isoWk = getISOWeek(tgl);
        if(!weekGroups[isoWk]){
          weekGroups[isoWk] = { fdosIdx: undefined, dates:[] };
          weekOrder.push(isoWk);
        }
        weekGroups[isoWk].dates.push(tgl);
        if(weekGroups[isoWk].fdosIdx === undefined){
          // Cari index week dari FDOS yang isoWeek-nya cocok
          weeks.forEach(function(wk, wi){
            if(wk.isoWeek === isoWk) weekGroups[isoWk].fdosIdx = wi;
          });
          // Fallback: cari lewat dateToWeek
          if(weekGroups[isoWk].fdosIdx === undefined && dateToWeek[tgl] !== undefined){
            weekGroups[isoWk].fdosIdx = dateToWeek[tgl];
          }
        }
      });
      var weekKeys = weekOrder;

      // ── Hitung grand total semua hari ─────────────────────────
      var grandTotalRealKrt = 0, grandTotalPlanSub = 0, grandTotalSpe = 0;
      dates.forEach(function(tgl){
        var r = realByDate[tgl] || {};
        grandTotalRealKrt += Number(r.krtSub)   || 0;
        grandTotalPlanSub += Number(r.planSub)  || 0;
        grandTotalSpe     += Number(r.totalSpe) || 0;
      });
      var grandTotalKrtWk = 0;
      var grandPlanMobil  = 0; // total planning mobil dari FDOS (per week)
      weeks.forEach(function(wk){ grandTotalKrtWk += wk.totalQty || 0; grandPlanMobil += wk.planningMobil || 0; });
      var grandSisaPlan   = grandTotalKrtWk - grandTotalRealKrt;
      var grandPctReal    = grandTotalKrtWk > 0 ? (grandTotalRealKrt/grandTotalKrtWk*100).toFixed(2) : 0;
      // Pendingan mobil = pendingan di tanggal terakhir yang ada data
      var _lastDateDirect = null;
      for(var _di=dates.length-1;_di>=0;_di--){
        var _dr=realByDate[dates[_di]]||{};
        if((_dr.totalSpe||0)>0||(_dr.planSub||0)>0){ _lastDateDirect=dates[_di]; break; }
      }
      var _lastDr = _lastDateDirect ? (realByDate[_lastDateDirect]||{}) : {};
      // Cari planMobil di hari terakhir (dari FDOS week yang sesuai)
      var _lastPlanMobil = 0;
      if(_lastDateDirect){
        var _lWk = getISOWeek(_lastDateDirect);
        weeks.forEach(function(wk){ if(wk.isoWeek===_lWk) _lastPlanMobil=wk.planningMobil||0; });
      }
      var grandPendMobil  = (_lastDr.totalSpe||0) - _lastPlanMobil;
      var _lastDateLabel  = _lastDateDirect ? ' ('+formatTglDisplay(_lastDateDirect)+')' : '';

      var html = '';

      // ── Render per week ───────────────────────────────────────
      weekKeys.forEach(function(isoWk){
        var grp      = weekGroups[isoWk];
        if(!grp || !grp.dates || grp.dates.length === 0) return;
        var wkDates  = grp.dates;
        var fdosIdx  = grp.fdosIdx;
        var wkData   = (fdosIdx !== undefined && weeks[fdosIdx]) ? weeks[fdosIdx] : null;
        var planMobil  = wkData ? wkData.planningMobil : 0;
        var totalKrtWk = wkData ? wkData.totalQty      : 0;

        // Header week
        var weekNum = isoWk;
        html += '<div class="direct-sum-header" style="margin-bottom:10px;">';
        html += '<div class="direct-sum-title"><i class="fas fa-route"></i> Planning vs Realisasi Outbound Jayanti 2 — <span style="opacity:.85;">Week '+weekNum+'</span></div>';
        html += '<div class="direct-sum-kpi">';
        if(planMobil > 0) html += kpiItem('Total Mobil/Week', fmtN(planMobil)+' mobil');
        if(totalKrtWk > 0) html += kpiItem('Plan Karton/Week', fmtN(totalKrtWk)+' ©');

        html += '</div></div>';

        // Per hari dalam week ini — skip hari yang tidak ada data sama sekali
        var cumRealKrt = 0; // akumulator kumulatif realisasi karton dalam week ini
        wkDates.forEach(function(tgl){
          var real    = realByDate[tgl] || { planSub:0, krtSub:0, totalSpe:0 };
          var planKrt = fdosByDate[tgl] || 0;
          var hasPlan = planKrt > 0;
          cumRealKrt += real.krtSub;

          var pendingan  = real.totalSpe - real.planSub;
          var pendClass  = pendingan > 0 ? 'ok' : pendingan < 0 ? 'over' : 'ok';
          var pendSign   = pendingan > 0 ? '+' : '';

          var isEmpty = !hasPlan && real.planSub===0 && real.totalSpe===0 && real.krtSub===0;
          html += '<div class="direct-day-card">';
          html += '<div class="direct-day-header">';
          html += '<span><i class="fas fa-calendar-day" style="margin-right:6px;opacity:.8"></i>'+formatTglDisplay(tgl)+'</span>';
          html += '</div>';
          html += '<div class="direct-day-body">';

          html += dRow('PLANNING KARTON', hasPlan ? fmtN(planKrt)+' ©' : '—', hasPlan ? 'highlight' : '');
          html += dRow('SPE TURUN', fmtN(real.planSub)+' mobil', '');
          html += dRow('REALISASI', fmtN(real.totalSpe)+' mobil', real.totalSpe >= real.planSub ? 'success' : 'warning');

          html += '<div class="direct-day-row"><span class="direct-day-label">PENDINGAN</span>';
          if(pendingan === 0){
            html += '<span class="direct-day-val">—</span>';
          } else {
            html += '<span class="direct-pendgn-badge '+pendClass+'">'+pendSign+fmtN(pendingan)+' mobil</span>';
          }
          html += '</div>';

          html += dRow('REALISASI KARTON', fmtN(real.krtSub)+' ©', '');

          // Pendingan karton harian + weekly
          if(hasPlan || totalKrtWk > 0){
            var pendKrt   = real.krtSub - planKrt;
            var pKrtClass = pendKrt > 0 ? 'ok' : 'over';
            var pKrtSign  = pendKrt > 0 ? '+' : '';
            var pendKrtWk = totalKrtWk > 0 ? cumRealKrt - totalKrtWk : null;
            var pWkClass  = pendKrtWk !== null ? (pendKrtWk >= 0 ? 'ok' : 'over') : '';
            var pWkSign   = pendKrtWk !== null ? (pendKrtWk > 0 ? '+' : '') : '';
            // Baris PENDINGAN KRT HARIAN
            if(hasPlan){
              html += '<div class="direct-day-row"><span class="direct-day-label">PENDINGAN KRT HARIAN</span>';
              html += '<span style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">';
              html += '<span class="direct-pendgn-badge '+pKrtClass+'">'+pKrtSign+fmtN(pendKrt)+' ©</span>';
              if(pendKrtWk !== null) html += '<span class="direct-pendgn-badge '+pWkClass+'" style="font-size:10px;opacity:.85;">'+pWkSign+fmtN(pendKrtWk)+' © weekly</span>';
              html += '</span></div>';
            } else if(pendKrtWk !== null){
              // Tidak ada planning harian, hanya tampil weekly
              html += '<div class="direct-day-row"><span class="direct-day-label">PENDINGAN KRT WEEKLY</span>';
              html += '<span class="direct-pendgn-badge '+pWkClass+'" style="font-size:10px;opacity:.85;">'+pWkSign+fmtN(pendKrtWk)+' ©</span>';
              html += '</div>';
            }
          }

          html += '</div></div>';
        });
      });

      if(dates.length === 0){
        html += "<p style='text-align:center;color:#a0aec0;padding:30px;font-size:13px;'>" +
                "<i class='fas fa-inbox' style='font-size:28px;display:block;margin-bottom:8px;'></i>Tidak ada data.</p>";
      }

      // ── Footer grand total (gabungan semua week) ──────────────
      if(dates.length > 0){
        var pendMobilSign  = grandPendMobil > 0 ? '+' : '';
        var pendMobilColor = grandPendMobil > 0 ? '#68d391' : grandPendMobil < 0 ? '#fc8181' : '#a0aec0';
        // Kumpulkan info week untuk keterangan (hanya week yang punya tanggal tampil)
        var weekNums = weekKeys.filter(function(wk){
          return weekGroups[wk] && weekGroups[wk].dates.length > 0;
        });
        var weekLabel = weekNums.length > 0
          ? 'Week ' + (weekNums[0] === weekNums[weekNums.length-1]
              ? weekNums[0]
              : weekNums[0] + ' – ' + weekNums[weekNums.length-1])
          : '';
        var periodeLabel = dates.length > 0 ? formatTglDisplay(dates[0]) + ' s/d ' + formatTglDisplay(dates[dates.length-1]) : '';

      // ── Inline card "Total Kumulatif" di bawah konten ──────────
      if(dates.length > 0){
        var pMobilColor = grandPendMobil > 0 ? '#68d391' : grandPendMobil < 0 ? '#fc8181' : '#a0aec0';
        var pMobilSign  = grandPendMobil > 0 ? '+' : '';
        html += '<div class="direct-sisa-bar" style="margin:16px 0 8px;flex-direction:column;gap:6px;">'
          +'<div style="font-size:11px;opacity:.7;text-transform:uppercase;letter-spacing:.4px;font-weight:700;">Total Kumulatif</div>';
        if(weekLabel) html += '<div style="font-size:12px;opacity:.85;"><i class="fas fa-calendar-week" style="margin-right:5px;"></i>'+weekLabel+'</div>';
        html += '<div style="display:flex;justify-content:space-between;width:100%;align-items:center;">'
          +'<span class="direct-sisa-label">Realisasi Karton</span>'
          +'<span class="direct-sisa-val">'+fmtN(grandTotalRealKrt)+' © ('+grandPctReal+'%)</span></div>';
        html += '<div style="display:flex;justify-content:space-between;width:100%;align-items:center;">'
          +'<span class="direct-sisa-label">Sisa Planning</span>'
          +'<span class="direct-sisa-val" style="color:'+(grandSisaPlan>0?'#f6e05e':'#68d391')+';">'+fmtN(grandSisaPlan)+' ©</span></div>';
        html += '<div style="display:flex;justify-content:space-between;width:100%;align-items:center;">'
          +'<span class="direct-sisa-label">Pendingan SPE/DO'+_lastDateLabel+'</span>'
          +'<span class="direct-sisa-val" style="color:'+pMobilColor+';">'+( grandPendMobil===0 ? '—' : pMobilSign+fmtN(grandPendMobil)+' mobil')+'</span></div>';
        html += '</div>';
      }

      body.innerHTML = html;

      // Update sticky floating footer
      if(dates.length > 0){
        updateStickyFooter({
          realisasiKrt: grandTotalRealKrt,
          totalPlan:    grandTotalKrtWk,
          pctReal:      grandPctReal,
          sisaPlan:     grandSisaPlan,
          pendMobil:    grandPendMobil,
          weekLabel:    weekLabel,
          periodeLabel: periodeLabel
        });
      } else {
        hideStickyFooter();
      }
    } // end renderDirectSummary
    }

    function footerRow(label, val, color){
      return '<div style="display:flex;justify-content:space-between;width:100%;align-items:center;">'
        +'<span class="direct-sisa-label">'+label+'</span>'
        +'<span class="direct-sisa-val" style="'+(color?'color:'+color+';':'')+'"">'+val+'</span>'
        +'</div>';
    }


    function getISOWeek(dateStr){
      // Pakai Date.UTC agar tidak terpengaruh timezone
      var parts = dateStr.split('-');
      var d = new Date(Date.UTC(+parts[0], +parts[1]-1, +parts[2]));
      var dow = d.getUTCDay() || 7; // Mon=1...Sun=7
      d.setUTCDate(d.getUTCDate() + 4 - dow); // geser ke Kamis minggu ini
      var jan1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil(((d - jan1) / 86400000 + 1) / 7);
    }

    function kpiItem(label, val){
      return '<div class="direct-sum-kpi-item">'
        +'<span class="direct-sum-kpi-label">'+label+'</span>'
        +'<span class="direct-sum-kpi-val">'+val+'</span>'
        +'</div>';
    }

    function dRow(label, val, cls){
      return '<div class="direct-day-row">'
        +'<span class="direct-day-label">'+label+'</span>'
        +'<span class="direct-day-val'+(cls?' '+cls:'')+'" >'+val+'</span>'
        +'</div>';
    }



    function fmtN(n){
      return Number(n||0).toLocaleString('id-ID',{maximumFractionDigits:0});
    }

    function formatTglDisplay(tgl){
      if(!tgl) return '';
      var parts = tgl.split('-');
      if(parts.length !== 3) return tgl;
      var days  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
      var d     = new Date(tgl);
      return days[d.getDay()]+', '+parts[2]+'.'+parts[1]+'.'+parts[0];
    }

    function normalizeTglLabel(lbl){
      if(!lbl) return null;
      var s = String(lbl).trim();
      // Sudah yyyy-MM-dd → langsung return
      if(s.match(/^\d{4}-\d{2}-\d{2}$/)) return s;
      // dd/MM/yy atau dd/MM/yyyy
      var m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
      if(m){
        var d = m[1].padStart(2,'0'), mo = m[2].padStart(2,'0');
        var y = m[3].length === 2 ? '20'+m[3] : m[3];
        return y+'-'+mo+'-'+d;
      }
      return null;
    }


    // ===== STICKY SUMMARY FOOTER =====
    var ssfData = null; // { realisasiKrt, pctReal, sisaPlan, pendMobil, weekLabel, periodeLabel }


    function updateStickyFooterDetail(d){
      var el = document.getElementById('summaryFooter');
      if(!el) return;
      var summaryPane = document.getElementById('summaryReal');
      if(!summaryPane || !summaryPane.classList.contains('active')) return;

      // Peek bar: Total SPE / Karton / Planning
      document.getElementById('ssfPeekKrt').innerText  = fmtN(d.totalSpe)+' SPE';
      document.getElementById('ssfPeekPct').innerText  = fmtN(d.totalKrt)+' Krt';
      document.getElementById('ssfPeekSisa').innerText = fmtN(d.planTotal)+' DO';
      document.getElementById('ssfPeekPend').innerText = d.nHari+' hari';

      // Update labels peek
      document.querySelector('#ssfPeekKrt').previousElementSibling.innerText  = 'Total SPE';
      document.querySelector('#ssfPeekPct').previousElementSibling.innerText  = 'Total Krt';
      document.querySelector('#ssfPeekSisa').previousElementSibling.innerText = 'Planning';
      document.querySelector('#ssfPeekPend').previousElementSibling.innerText = 'Periode';

      // Detail expand
      var chips = [
        {lbl:'MDC', spe:d.mdcSpe, krt:d.mdcKrt},
        {lbl:'MT',  spe:d.mtSpe,  krt:d.mtKrt},
        {lbl:'LK',  spe:d.lkSpe,  krt:d.lkKrt},
        {lbl:'Sub', spe:d.subSpe, krt:d.subKrt},
        {lbl:'Exp', spe:d.expSpe, krt:d.expKrt}
      ].filter(function(c){ return c.spe || c.krt; })
       .map(function(c){
         return '<span style="background:rgba(255,255,255,.12);border-radius:20px;padding:3px 10px;font-size:12px;font-weight:700;">'
           +c.lbl+' <span style="color:#fff">'+fmtN(c.spe)+' SPE</span>'
           +' <span style="color:#f6e05e">'+fmtN(c.krt)+' Krt</span></span>';
       }).join(' ');

      // Pending per tujuan
      var ssfPendItems = [
        {lbl:'MDC',val:(d.mdcPlan||0)-d.mdcSpe, plan:d.mdcPlan||0},
        {lbl:'MT', val:(d.mtPlan||0) -d.mtSpe,  plan:d.mtPlan||0},
        {lbl:'LK', val:(d.lkPlan||0) -d.lkSpe,  plan:d.lkPlan||0},
        {lbl:'Sub',val:(d.subPlan||0)-d.subSpe, plan:d.subPlan||0},
        {lbl:'Exp',val:(d.expPlan||0)-d.expSpe, plan:d.expPlan||0}
      ];
      var ssfPendTotal = d.planTotal > 0 ? d.planTotal - d.totalSpe : 0;
      var ssfPendChips = ssfPendItems.filter(function(x){ return x.plan>0; }).map(function(x){
        var col = x.val>0?'#fc8181':'#68d391';
        var sign = x.val>0?'-':'+';
        return '<span style="background:rgba(255,255,255,.1);border-radius:12px;padding:2px 8px;font-size:11px;font-weight:700;color:'+col+';">'+x.lbl+' '+sign+Math.abs(x.val)+' DO</span>';
      }).join(' ');
      var ssfPendHtml = d.planTotal > 0
        ? '<span style="font-weight:800;font-size:14px;color:'+(ssfPendTotal>0?'#fc8181':'#68d391')+';">'+(ssfPendTotal>0?'-':'+')+Math.abs(ssfPendTotal)+' DO total</span>'
          +(ssfPendChips?'<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;width:100%;">'+ssfPendChips+'</div>':'')
        : '—';

      document.getElementById('ssfDetailPeriode').innerText  = d.periode || '—';
      document.getElementById('ssfDetailKrt').innerText      = fmtN(d.totalSpe)+' SPE / '+fmtN(d.totalKrt)+' Krt';
      document.getElementById('ssfDetailSisa').innerText     = 'Planning '+fmtN(d.planTotal)+' DO';
      document.getElementById('ssfDetailPend').innerHTML     = ssfPendHtml || chips || '—';
      document.getElementById('ssfDetailPend').style.color   = '';

      el.style.display = 'block';
      var body2 = document.getElementById('realSummaryBody');
      if(body2) body2.style.paddingBottom = '70px';
    }


    // =============================================
    // MDC Summary
    // =============================================
    // MDC sub-view: "mdc" = card per hari (mirip Direct Detail)
    // MDC sub-view: "mdcdetail" = per shift (mirip Detail Realisasi, hanya MDC)

    function loadMDCDetail(){
      var from = document.getElementById('filterFrom').value;
      var to   = document.getElementById('filterTo').value;
      if(!from || !to){
        document.getElementById('realSummaryBody').innerHTML =
          "<p style='text-align:center;color:#a0aec0;padding:30px;font-size:13px;'>" +
          "<i class='fas fa-calendar-alt' style='font-size:28px;display:block;margin-bottom:8px;'></i>" +
          "Pilih rentang tanggal terlebih dahulu.</p>";
        return;
      }
      document.getElementById('realSummaryBody').innerHTML = "<div class='spinner' style='margin:20px auto;'></div>";
      var _realRes=null, _planRes=null, _done=0;
      function _tryRenderDetail(){
        _done++;
        if(_done<2) return;
        if(!_realRes||!_realRes.success){ showToast('\u274c Gagal load data','error'); return; }
        // Build planByDate dari PLANNING_MDC
        var planByDate2 = {};
        if(_planRes && _planRes.success && _planRes.weeks){
          _planRes.weeks.forEach(function(wk){
            Object.keys(wk.planHarian||{}).forEach(function(tgl){
              planByDate2[tgl] = (planByDate2[tgl]||0) + (wk.planHarian[tgl]||0);
            });
          });
        }
        // Masking: hanya MDC, planMDC dari sheet jika ada
        var masked = _realRes.data.map(function(r){
          var row = r.slice();
          var pSheet = planByDate2[row[0]]||0;
          var pForm  = Number(row[4])||0;
          row[4]  = pSheet > 0 ? pSheet : pForm;    // planMDC
          row[9]  = row[4];                          // planTotal = planMDC
          row[5]=0; row[6]=0; row[7]=0; row[8]=0;
          row[20] = row[10]; row[21] = row[11];
          row[12]=0; row[13]=0; row[14]=0; row[15]=0;
          row[16]=0; row[17]=0; row[18]=0; row[19]=0;
          return row;
        });
        renderDetailView(masked);
      }
      google.script.run
        .withSuccessHandler(function(res){ _realRes=res; _tryRenderDetail(); })
        .withFailureHandler(function(){ _realRes={success:false}; _tryRenderDetail(); })
        .getRealisasiData(from, to);
      google.script.run
        .withSuccessHandler(function(res){ _planRes=res; _tryRenderDetail(); })
        .withFailureHandler(function(){ _planRes={success:false,weeks:[]}; _tryRenderDetail(); })
        .getMdcPlanningData(from, to);
    }

    function loadMDCSummary(){
      var from = document.getElementById('filterFrom').value;
      var to   = document.getElementById('filterTo').value;
      if(!from || !to){
        document.getElementById('realSummaryBody').innerHTML =
          "<p style='text-align:center;color:#a0aec0;padding:30px;font-size:13px;'>" +
          "<i class='fas fa-calendar-alt' style='font-size:28px;display:block;margin-bottom:8px;'></i>" +
          "Pilih rentang tanggal terlebih dahulu.</p>";
        return;
      }
      document.getElementById('realSummaryBody').innerHTML = "<div class='spinner' style='margin:20px auto;'></div>";
      // Fetch realisasi + planning MDC secara paralel
      var _realRes=null, _planRes=null, _done=0;
      function _tryRender(){
        _done++;
        if(_done<2) return;
        if(!_realRes||!_realRes.success){ showToast('\u274c Gagal load data Realisasi','error'); return; }
        renderMDCSummary(from, to, _realRes, _planRes);
      }
      google.script.run
        .withSuccessHandler(function(res){ _realRes=res; _tryRender(); })
        .withFailureHandler(function(){ _realRes={success:false}; _tryRender(); })
        .getRealisasiData(from, to);
      google.script.run
        .withSuccessHandler(function(res){ _planRes=res; _tryRender(); })
        .withFailureHandler(function(){ _planRes={success:false,weeks:[]}; _tryRender(); })
        .getMdcPlanningData(from, to);
    }

    function renderMDCSummary(from, to, realRes, planRes){
      var body = document.getElementById('realSummaryBody');

      // Build planByDate dari PLANNING_MDC sheet
      var planByDate = {};
      if(planRes && planRes.success && planRes.weeks){
        planRes.weeks.forEach(function(wk){
          Object.keys(wk.planHarian||{}).forEach(function(tgl){
            planByDate[tgl] = (planByDate[tgl]||0) + (wk.planHarian[tgl]||0);
          });
        });
      }

      // Build data per tanggal
      // [4]planMDC dari form realisasi, [10]speMDC [11]krtMDC
      var byDate = {};
      if(realRes && realRes.success && realRes.data){
        var sorted = realRes.data.slice().sort(function(a,b){
          if(a[0]<b[0]) return -1; if(a[0]>b[0]) return 1;
          return (Number(a[2])||0)-(Number(b[2])||0);
        });
        sorted.forEach(function(r){
          var tgl = r[0];
          if(!byDate[tgl]) byDate[tgl] = {planMDC:0, speMDC:0, krtMDC:0, cancelMDC:0};
          // planMDC = dari form realisasi (r[4]) — tidak di-override oleh planByDate
          var pForm = Number(r[4])||0;
          if(pForm>0) byDate[tgl].planMDC = pForm;
          byDate[tgl].speMDC    += Number(r[10])||0;
          byDate[tgl].krtMDC    += Number(r[11])||0;
          byDate[tgl].cancelMDC += Number(r[24])||0;
        });
      }
      // Tanggal di planByDate tapi belum ada di realisasi tetap dibuat
      Object.keys(planByDate).forEach(function(tgl){
        if(!byDate[tgl]) byDate[tgl] = {planMDC:0, speMDC:0, krtMDC:0, cancelMDC:0};
      });

      // Build planMobilWeekly per isoWeek dari planRes
      var planMobilByWeek = {};
      if(planRes && planRes.success && planRes.weeks){
        planRes.weeks.forEach(function(wk){
          // Cari isoWeek dari salah satu tanggal di planHarian
          var tgls = Object.keys(wk.planHarian||{});
          if(tgls.length > 0){
            var isoWkPlan = getISOWeek(tgls[0]);
            planMobilByWeek[isoWkPlan] = (planMobilByWeek[isoWkPlan]||0) + (wk.planMobil||0);
          }
        });
      }

      // Kelompokkan per ISO week
      var weekGroups = {}, weekOrder = [];
      var cur = new Date(from+'T00:00:00Z'), endD = new Date(to+'T00:00:00Z');
      while(cur <= endD){
        var tgl = cur.toISOString().slice(0,10);
        var isoWk = getISOWeek(tgl);
        if(!weekGroups[isoWk]){ weekGroups[isoWk]={dates:[],totalPlanMDC:0,totalSpe:0,totalKrt:0,totalCancel:0,planMobilWeekly:0}; weekOrder.push(isoWk); }
        weekGroups[isoWk].dates.push(tgl);
        var d = byDate[tgl]||{planMDC:0,speMDC:0,krtMDC:0,cancelMDC:0};
        weekGroups[isoWk].totalPlanMDC += d.planMDC;
        weekGroups[isoWk].totalSpe     += d.speMDC;
        weekGroups[isoWk].totalKrt     += d.krtMDC;
        weekGroups[isoWk].totalCancel  += d.cancelMDC;
        cur.setUTCDate(cur.getUTCDate()+1);
      }
      // Isi planMobilWeekly per week
      weekOrder.forEach(function(isoWk){
        weekGroups[isoWk].planMobilWeekly = planMobilByWeek[isoWk]||0;
      });

      if(weekOrder.length===0){
        body.innerHTML = "<p style='text-align:center;color:#a0aec0;padding:30px;font-size:13px;'><i class='fas fa-inbox' style='font-size:28px;display:block;margin-bottom:8px;'></i>Tidak ada data.</p>";
        hideStickyFooter(); return;
      }

      var html = '';
      weekOrder.forEach(function(isoWk){
        var grp = weekGroups[isoWk];
        var periodeWk = formatTglDisplay(grp.dates[0])+' \u2013 '+formatTglDisplay(grp.dates[grp.dates.length-1]);

        // Header week
        html += '<div class="direct-sum-header" style="margin-bottom:10px;">';
        html += '<div class="direct-sum-title"><i class="fas fa-truck"></i> MDC \u2014 Mayora Distribution &nbsp;<span style="opacity:.7;font-size:13px;font-weight:500;">Week '+isoWk+' | '+periodeWk+'</span></div>';
        html += '<div class="direct-sum-kpi">';
        if(grp.planMobilWeekly>0) html += kpiItem('Plan Mobil/Week', fmtN(grp.planMobilWeekly)+' DO');
        if(grp.totalKrt>0) html += kpiItem('Total Karton', fmtN(grp.totalKrt)+' \u00a9');
        html += '</div></div>';

        var cumSpe = 0;
        grp.dates.forEach(function(tgl){
          var d = byDate[tgl]||{planMDC:0,speMDC:0,krtMDC:0,cancelMDC:0};
          var planMDC = d.planMDC, speMDC = d.speMDC, krtMDC = d.krtMDC, cancelMDC = d.cancelMDC;
          var totalPlanHari = speMDC + cancelMDC; // total planning = realisasi + cancel
          var isEmpty = !planMDC && !speMDC && !krtMDC && !cancelMDC;
          cumSpe += speMDC;

          var planHari = planByDate[tgl]||0;
          // Pendingan Planning = Realisasi - Plan Mobil Harian (PLANNING_MDC)
          var pendPlanning = planHari > 0 ? speMDC - planHari : null;
          // Pendingan Aktual = Realisasi - SPE/DO Turun (form realisasi)
          var pendAktual = planMDC > 0 ? speMDC - planMDC : null;
          function pendBadge(val){
            if(val===null) return '<span class="direct-day-val">\u2014</span>';
            var cls = val>=0?'ok':'over';
            var sign = val>0?'+':'';
            return '<span class="direct-pendgn-badge '+cls+'">'+sign+fmtN(val)+' mobil</span>';
          }

          html += '<div class="direct-day-card">';
          html += '<div class="direct-day-header"><span><i class="fas fa-calendar-day" style="margin-right:6px;opacity:.8"></i>'+formatTglDisplay(tgl)+'</span></div>';
          html += '<div class="direct-day-body">';

          html += dRow('SPE/DO TURUN', planMDC>0 ? fmtN(planMDC)+' DO' : '\u2014', '');
          // Plan Mobil Harian dari PLANNING_MDC sheet (terpisah dari SPE/DO TURUN)
          if(planHari>0){
            html += dRow('PLANNING SPE/DO', fmtN(planHari)+' DO', 'highlight');
          }
          html += dRow('REALISASI SPE/DO', fmtN(speMDC)+' DO', speMDC>=planMDC&&planMDC>0?'success': speMDC>0?'warning':'');

          // Cancel DO (hanya tampil jika ada)
          if(cancelMDC>0){
            html += dRow('CANCEL DO', fmtN(cancelMDC)+' DO', 'warning');
          }

          // Pendingan Planning (vs Plan Mobil Harian dari PLANNING_MDC)
          if(planHari > 0){
            html += '<div class="direct-day-row"><span class="direct-day-label">PENDINGAN PLANNING</span>'
              + pendBadge(pendPlanning) + '</div>';
          }
          // Pendingan Aktual (vs SPE/DO Turun dari form realisasi)
          if(planMDC > 0){
            html += '<div class="direct-day-row"><span class="direct-day-label">PENDINGAN AKTUAL</span>'
              + pendBadge(pendAktual) + '</div>';
          }

          html += dRow('REALISASI KARTON', fmtN(krtMDC)+' \u00a9', '');

          // Total Planning = Realisasi + Cancel (hanya tampil jika ada cancel)
          if(cancelMDC>0){
            html += '<div class="direct-day-row" style="border-top:1px dashed #e2e8f0;margin-top:4px;padding-top:6px;">'
              + '<span class="direct-day-label" style="font-weight:700;color:#2d3748;">TOTAL PLANNING</span>'
              + '<span class="direct-day-val" style="font-weight:800;color:#2c5364;font-size:13px;">'+fmtN(totalPlanHari)+' mobil</span>'
              + '<span style="font-size:10px;color:#a0aec0;margin-left:6px;">('+fmtN(speMDC)+' real + '+fmtN(cancelMDC)+' cancel)</span>'
              + '</div>';
          }

          html += '</div></div>'; // end body + card
        });
      });

      // Grand total footer
      var gtSpe=0,gtKrt=0,gtPlan=0,gtCancel=0;
      weekOrder.forEach(function(w){ var g=weekGroups[w]; gtSpe+=g.totalSpe; gtKrt+=g.totalKrt; gtPlan+=g.totalPlanMDC; gtCancel+=g.totalCancel||0; });
      var gtTotalPlanning = gtSpe + gtCancel;

      // Pendingan DO = pendingan di tanggal terakhir yang ada data
      var lastDateWithData = null;
      var allDates = [];
      weekOrder.forEach(function(w){ weekGroups[w].dates.forEach(function(d){ allDates.push(d); }); });
      for(var di=allDates.length-1;di>=0;di--){
        var dd=byDate[allDates[di]];
        if(dd&&(dd.speMDC>0||dd.planMDC>0)){ lastDateWithData=allDates[di]; break; }
      }
      var lastD = lastDateWithData ? (byDate[lastDateWithData]||{}) : {};
      var gtPend = (lastD.speMDC||0) - (lastD.planMDC||0);
      var gtPendSign = gtPend>0?'+':'';
      var gtPendColor = gtPend>=0?'#68d391':'#fc8181';
      if(weekOrder.length>0){
        html += '<div class="direct-sum-footer">'
          +'<div><span style="font-size:11px;opacity:.6;text-transform:uppercase;letter-spacing:.5px;">Total Realisasi MDC</span>'
          +'<div style="font-size:18px;font-weight:800;">'+fmtN(gtSpe)+' mobil <span style="font-size:14px;color:#f6e05e;font-weight:600;">/'+fmtN(gtKrt)+' ©</span></div></div>'
          +(gtCancel>0?'<div><span style="font-size:11px;opacity:.6;">Total Cancel DO</span>'
            +'<div style="font-size:16px;font-weight:800;color:#fc8181;">'+fmtN(gtCancel)+' mobil</div></div>':'')
          +(gtCancel>0?'<div><span style="font-size:11px;opacity:.6;">Total Planning (Real + Cancel)</span>'
            +'<div style="font-size:16px;font-weight:800;color:#f6e05e;">'+fmtN(gtTotalPlanning)+' mobil</div></div>':'')
          +(gtPlan>0?'<div><span style="font-size:11px;opacity:.6;">Pendingan DO ('+formatTglDisplay(lastDateWithData)+')</span>'
            +'<div style="font-size:16px;font-weight:800;color:'+gtPendColor+';">'+gtPendSign+fmtN(gtPend)+' mobil</div></div>':'')
          +'</div>';
      }
      body.innerHTML = "<div style='animation:fadeIn .25s ease both'>"+html+"</div>";
      hideStickyFooter();
    }


    function updateStickyFooter(data){
      ssfData = data;
      var el = document.getElementById('summaryFooter');
      if(!el) return;
      // Hanya tampilkan jika tab Summary aktif
      var summaryPane = document.getElementById('summaryReal');
      if(!summaryPane || !summaryPane.classList.contains('active')) return;

      // Reset labels ke Direct mode
      document.querySelector('#ssfPeekKrt').previousElementSibling.innerText  = 'Realisasi Krt';
      document.querySelector('#ssfPeekPct').previousElementSibling.innerText  = 'Capaian';
      document.querySelector('#ssfPeekSisa').previousElementSibling.innerText = 'Planning';
      document.querySelector('#ssfPeekPend').previousElementSibling.innerText = 'Pendingan';

      // Peek bar
      document.getElementById('ssfPeekKrt').innerText    = fmtN(data.realisasiKrt)+' ©';
      document.getElementById('ssfPeekPct').innerText    = data.pctReal+'%';
      document.getElementById('ssfPeekSisa').innerText   = fmtN(data.totalPlan||data.sisaPlan)+' ©';
      document.getElementById('ssfPeekPend').innerText   = data.pendMobil===0?'—':(data.pendMobil>0?'+':'')+fmtN(data.pendMobil)+' mobil';

      // Detail
      document.getElementById('ssfDetailKrt').innerText  = fmtN(data.realisasiKrt)+' © ('+data.pctReal+'%)';
      document.getElementById('ssfDetailSisa').innerText = fmtN(data.totalPlan||data.sisaPlan)+' © (sisa: '+fmtN(data.sisaPlan)+' ©)';
      var pendColor = data.pendMobil>0?'#68d391':data.pendMobil<0?'#fc8181':'#a0aec0';
      var pendEl = document.getElementById('ssfDetailPend');
      pendEl.innerText = data.pendMobil===0?'—':(data.pendMobil>0?'+':'')+fmtN(data.pendMobil)+' mobil';
      pendEl.style.color = pendColor;
      document.getElementById('ssfDetailPeriode').innerText = (data.weekLabel?data.weekLabel+' · ':'')+data.periodeLabel;

      el.style.display = 'block';
      // Tambah padding-bottom ke realSummaryBody agar konten tidak tertutup footer
      var body2 = document.getElementById('realSummaryBody');
      if(body2) body2.style.paddingBottom = '70px';
    }

    function toggleStickyFooter(e){
      if(e) e.stopPropagation();
      var el = document.getElementById('summaryFooter');
      el.classList.toggle('expanded');
    }

    // Klik di luar footer → collapse
    document.addEventListener('click', function(e){
      var el = document.getElementById('summaryFooter');
      if(!el || el.style.display === 'none') return;
      if(!el.classList.contains('expanded')) return;
      if(!el.contains(e.target)){
        el.classList.remove('expanded');
      }
    });

    function hideStickyFooter(){
      var el = document.getElementById('summaryFooter');
      if(el) { el.style.display='none'; el.classList.remove('expanded'); }
      var body2 = document.getElementById('realSummaryBody');
      if(body2) body2.style.paddingBottom = '12px';
    }

    // PWA: Inject manifest via data URI (compatible dengan GAS CSP)
    (function(){
      var manifest = JSON.stringify({
        "name": "Warehouse FG Monitoring",
        "short_name": "WH Monitor",
        "description": "Warehouse Finish Good Monitoring Dashboard",
        "start_url": window.location.href,
        "scope": window.location.origin,
        "display": "standalone",
        "background_color": "#0f2027",
        "theme_color": "#0f2027",
        "orientation": "portrait-primary",
        "icons": [
          {"src":"https://placehold.co/192x192/0f2027/ffffff?text=WH","sizes":"192x192","type":"image/png","purpose":"any maskable"},
          {"src":"https://placehold.co/512x512/0f2027/ffffff?text=WH","sizes":"512x512","type":"image/png","purpose":"any maskable"}
        ]
      });
      var el = document.createElement('link');
      el.rel = 'manifest';
      el.setAttribute('href', 'data:application/manifest+json,' + encodeURIComponent(manifest));
      document.head.appendChild(el);
    })();
    // =============================================
    // REVISI RIWAYAT OPNAME
    // =============================================
    var _rvPending = null; // {tr, rowData, changedCols}

    function _rvEdit(btn){
      var tr = btn.closest('tr');
      if(tr.classList.contains('tr-editing')) return;

      // Cancel any existing edit first
      _rvCancelActive();

      var rowData = JSON.parse(decodeURIComponent(tr.dataset.row));
      var isEk    = tr.dataset.isek === '1';

      tr.classList.add('tr-editing');

      // Make each data-col cell editable
      tr.querySelectorAll('td[data-col]').forEach(function(td){
        var col = td.dataset.col;
        var raw = rowData[col];
        if(raw === undefined || raw === null) raw = '';
        td.classList.add('td-editable');
        var inp = document.createElement('input');
        inp.value = raw;
        inp.dataset.origVal = raw;
        inp.dataset.col = col;
        td.textContent = '';
        td.appendChild(inp);
      });

      // Replace edit pencil with save/cancel buttons
      var editTd = tr.querySelector('.td-edit-btn');
      editTd.innerHTML =
        '<button class="opv-edit-save" onclick="_rvSave(this)" title="Simpan"><i class="fas fa-check"></i></button>' +
        '<button class="opv-edit-cancel" onclick="_rvCancelActive()" title="Batal"><i class="fas fa-times"></i></button>';
    }

    function _rvCancelActive(){
      var editing = document.querySelectorAll('.tr-editing');
      editing.forEach(function(tr){
        tr.classList.remove('tr-editing');
        // Restore cells from input values
        tr.querySelectorAll('td.td-editable').forEach(function(td){
          var inp = td.querySelector('input');
          td.classList.remove('td-editable');
          td.textContent = inp ? inp.dataset.origVal : '';
        });
        // Restore edit button
        var editTd = tr.querySelector('.td-edit-btn');
        if(editTd) editTd.innerHTML = '<button class="opv-edit-btn" onclick="_rvEdit(this)" title="Edit baris ini"><i class="fas fa-pencil-alt"></i></button>';
      });
      _rvPending = null;
    }

    function _rvSave(btn){
      var tr = btn.closest('tr');
      var rowData = JSON.parse(decodeURIComponent(tr.dataset.row));

      // Collect changed columns
      var changedCols = [];
      tr.querySelectorAll('td.td-editable input').forEach(function(inp){
        var newVal = inp.value.trim();
        var origVal = String(inp.dataset.origVal).trim();
        changedCols.push({col: Number(inp.dataset.col), value: newVal, orig: origVal});
      });

      var hasChange = changedCols.some(function(c){ return String(c.value) !== String(c.orig); });
      if(!hasChange){
        _rvCancelActive();
        return;
      }

      _rvPending = {tr: tr, rowData: rowData, changedCols: changedCols};

      // Show popup
      document.getElementById('revisiAlasan').value = '';
      var modal = document.getElementById('revisiModal');
      modal.classList.add('show');
      setTimeout(function(){ document.getElementById('revisiAlasan').focus(); }, 100);
    }

    function _revisiCancel(){
      document.getElementById('revisiModal').classList.remove('show');
      _rvCancelActive();
      _rvPending = null;
    }

    function _revisiConfirm(){
      var alasan = document.getElementById('revisiAlasan').value.trim();
      if(!alasan){
        document.getElementById('revisiAlasan').style.borderColor='#e53e3e';
        document.getElementById('revisiAlasan').focus();
        return;
      }
      document.getElementById('revisiAlasan').style.borderColor='';
      document.getElementById('revisiModal').classList.remove('show');

      if(!_rvPending) return;
      var pending   = _rvPending;
      _rvPending    = null;
      var rowData   = pending.rowData;
      var tr        = pending.tr;

      // Bangun full row array dengan nilai terbaru dari edit
      var isEkPay = (String(rowData[3]||'').toUpperCase()==='EKSPOR'||String(rowData[3]||'').toUpperCase()==='GDFG-EKSPOR');
      var hdLen   = isEkPay ? 18 : 16;
      var newRow  = [];
      for(var ci=0; ci<hdLen; ci++) newRow.push(rowData[ci]!==undefined?rowData[ci]:'');
      // Timpa dengan nilai yang diedit
      pending.changedCols.forEach(function(c){ newRow[Number(c.col)] = c.value; });

      var payload = {
        area    : rowData[3],
        key     : {
          tanggal   : rowData[0],
          nama      : rowData[1],
          plant     : rowData[2],
          sku       : rowData[4],
          quotation : isEkPay ? rowData[7] : ''
        },
        data    : newRow,
        alasan  : alasan
      };

      // Show saving state
      var editTd = tr.querySelector('.td-edit-btn');
      if(editTd) editTd.innerHTML = '<i class="fas fa-spinner fa-spin" style="color:#718096;font-size:13px;"></i>';

      google.script.run
        .withSuccessHandler(function(res){
          if(res && res.success){
            // Update display cells with new values
            pending.changedCols.forEach(function(c){
              var td = tr.querySelector('td[data-col="'+c.col+'"]');
              if(td){
                td.classList.remove('td-editable');
                td.textContent = c.value;
              }
            });
            tr.classList.remove('tr-editing');
            // Flash green
            tr.style.background='#c6f6d5';
            setTimeout(function(){ tr.style.background=''; }, 1200);
            // Restore edit button
            if(editTd) editTd.innerHTML='<button class="opv-edit-btn" onclick="_rvEdit(this)" title="Edit baris ini"><i class="fas fa-pencil-alt"></i></button>';
            // Update rowData in dataset
            pending.changedCols.forEach(function(c){ rowData[c.col]=c.value; });
            tr.dataset.row = encodeURIComponent(JSON.stringify(rowData));
          } else {
            alert('Gagal menyimpan: '+(res&&res.message?res.message:'Unknown error'));
            _rvCancelActive();
          }
        })
        .withFailureHandler(function(e){
          alert('Error: '+e.message);
          _rvCancelActive();
        })
        .updateOpnameRow(payload);
    }

    // ── Generic Edit untuk FIFO, QT Ready, SJ Rekap ──────────────
    var _rvGenericPending = null;

    function _rvEditGeneric(btn, tipe){
      var tr = btn.closest('tr');
      if(tr.classList.contains('tr-editing')) return;
      _rvCancelGeneric();
      tr.classList.add('tr-editing');
      tr.querySelectorAll('td[data-col]').forEach(function(td){
        var col = td.dataset.col;
        if(col==='idx') return; // nomor urut, skip
        var raw = td.textContent.trim();
        td.classList.add('td-editable');
        td._origText = raw;
        var inp = document.createElement('input');
        inp.value = raw;
        inp.dataset.col = col;
        inp.dataset.origVal = raw;
        td.textContent = '';
        td.appendChild(inp);
      });
      var editTd = tr.querySelector('.td-edit-btn');
      if(editTd) editTd.innerHTML =
        '<button class="opv-edit-save" onclick="_rvSaveGeneric(this,\''+tipe+'\')" title="Simpan"><i class="fas fa-check"></i></button>'+
        '<button class="opv-edit-cancel" onclick="_rvCancelGeneric()" title="Batal"><i class="fas fa-times"></i></button>';
    }

    function _rvCancelGeneric(){
      document.querySelectorAll('.tr-editing').forEach(function(tr){
        // Skip opname rows yang punya handler sendiri
        if(tr.closest('#opnameViewBody')) return;
        tr.classList.remove('tr-editing');
        tr.querySelectorAll('td.td-editable').forEach(function(td){
          var inp = td.querySelector('input');
          td.classList.remove('td-editable');
          td.textContent = inp ? inp.dataset.origVal : (td._origText||'');
        });
        var editTd = tr.querySelector('.td-edit-btn');
        if(editTd){
          var tipe = tr.dataset.subtipe !== undefined ? 'fifo' : 'qt';
          if(tr.closest('#qtViewBody')) tipe='qt';
          if(tr.closest('#fifoViewBody')) tipe='fifo';
          if(tr.closest('#srTable')) tipe='sj';
          editTd.innerHTML='<button class="opv-edit-btn" onclick="_rvEditGeneric(this,\''+tipe+'\')" title="Edit"><i class="fas fa-pencil-alt"></i></button>';
        }
      });
      _rvGenericPending = null;
    }

    function _rvSaveGeneric(btn, tipe){
      var tr = btn.closest('tr');
      var rowData = tr.dataset.row ? JSON.parse(decodeURIComponent(tr.dataset.row)) : null;
      var changedCols = [];
      tr.querySelectorAll('td.td-editable input').forEach(function(inp){
        var newVal = inp.value.trim();
        var origVal = String(inp.dataset.origVal||'').trim();
        changedCols.push({col: inp.dataset.col, value: newVal, orig: origVal});
      });
      var hasChange = changedCols.some(function(c){ return c.value !== c.orig; });
      if(!hasChange){ _rvCancelGeneric(); return; }
      _rvGenericPending = {tr:tr, rowData:rowData, changedCols:changedCols, tipe:tipe};
      // Tampilkan modal alasan revisi
      document.getElementById('revisiAlasan').value = '';
      var modal = document.getElementById('revisiModal');
      // Override confirm button untuk generic
      document.getElementById('revisiConfirmBtn').onclick = _rvGenericConfirm;
      modal.classList.add('show');
      setTimeout(function(){ document.getElementById('revisiAlasan').focus(); }, 100);
    }

    function _rvGenericConfirm(){
      var alasan = document.getElementById('revisiAlasan').value.trim();
      if(!alasan){
        document.getElementById('revisiAlasan').style.borderColor='#e53e3e';
        document.getElementById('revisiAlasan').focus();
        return;
      }
      document.getElementById('revisiAlasan').style.borderColor='';
      document.getElementById('revisiModal').classList.remove('show');
      // Restore confirm button ke handler asli
      document.getElementById('revisiConfirmBtn').onclick = _revisiConfirm;
      if(!_rvGenericPending) return;

      var pending = _rvGenericPending; _rvGenericPending = null;
      var tr = pending.tr, rowData = pending.rowData, tipe = pending.tipe;

      // Bangun newRow dari rowData + perubahan
      var newRow = rowData ? rowData.slice() : [];
      pending.changedCols.forEach(function(c){
        var idx = parseInt(c.col);
        if(!isNaN(idx)) newRow[idx] = c.value;
      });

      var editTd = tr.querySelector('.td-edit-btn');
      if(editTd) editTd.innerHTML = '<i class="fas fa-spinner fa-spin" style="color:#718096;font-size:13px;"></i>';

      var gasFn = tipe==='fifo' ? (tr.dataset.subtipe==='EKSPOR'?'updateFifoEksporRow':'updateFifoRow')
                : tipe==='qt'   ? 'updateQtReadyRow'
                : 'updateSjRekapRow';

      google.script.run
        .withSuccessHandler(function(res){
          if(res&&res.success){
            pending.changedCols.forEach(function(c){
              var td = tr.querySelector('td[data-col="'+c.col+'"]');
              if(td){ td.classList.remove('td-editable'); td.textContent = c.value; }
            });
            tr.classList.remove('tr-editing');
            tr.style.background='#c6f6d5';
            setTimeout(function(){ tr.style.background=''; },1200);
            if(editTd) editTd.innerHTML='<button class="opv-edit-btn" onclick="_rvEditGeneric(this,\''+tipe+'\')" title="Edit"><i class="fas fa-pencil-alt"></i></button>';
            // Update dataset
            tr.dataset.row = encodeURIComponent(JSON.stringify(newRow));
          } else {
            alert('Gagal: '+(res&&res.message||'unknown'));
            _rvCancelGeneric();
            if(editTd) editTd.innerHTML='<button class="opv-edit-btn" onclick="_rvEditGeneric(this,\''+tipe+'\')" title="Edit"><i class="fas fa-pencil-alt"></i></button>';
          }
        })
        .withFailureHandler(function(e){
          alert('Error: '+e.message);
          _rvCancelGeneric();
          if(editTd) editTd.innerHTML='<button class="opv-edit-btn" onclick="_rvEditGeneric(this,\''+tipe+'\')" title="Edit"><i class="fas fa-pencil-alt"></i></button>';
        })
        [gasFn]({row: newRow, alasan: alasan});
    } // end _rvGenericConfirm

    // =============================================
    // STD EDIT — Dashboard tab Lokal/Ekspor/GDFG
    // =============================================
    var _stdPending = null; // {tr, rowData, headers, changedCells}
    var _stdSelectedPlant = '';

    function _stdEdit(btn){
      var tr = btn.closest('tr');
      if(tr.classList.contains('tr-std-editing')) return;

      // Cancel existing edit
      _stdCancelActive();

      tr.classList.add('tr-std-editing');

      // Make editable cells into inputs
      tr.querySelectorAll('td[data-stdcol]').forEach(function(td){
        var origVal = td.textContent.trim();
        // Strip badge text if any
        var badge = td.querySelector('.std-kosong-badge');
        if(badge) badge.remove();
        td.classList.add('td-std-editable');
        var inp = document.createElement('input');
        inp.value = origVal;
        inp.dataset.origVal = origVal;
        inp.dataset.stdcol = td.dataset.stdcol;
        inp.dataset.stdkey = td.dataset.stdkey;
        td.textContent = '';
        td.appendChild(inp);
      });

      // Replace pencil with save/cancel
      var editTd = tr.querySelector('.td-std-edit-btn');
      editTd.innerHTML =
        '<button class="std-save-btn" onclick="_stdSave(this)"><i class="fas fa-check"></i></button>' +
        '<button class="std-cancel-btn" onclick="_stdCancelActive()"><i class="fas fa-times"></i></button>';
    }

    function _stdCancelActive(){
      document.querySelectorAll('.tr-std-editing').forEach(function(tr){
        tr.classList.remove('tr-std-editing');
        tr.querySelectorAll('td.td-std-editable').forEach(function(td){
          var inp = td.querySelector('input');
          td.classList.remove('td-std-editable');
          td.textContent = inp ? inp.dataset.origVal : '';
        });
        var editTd = tr.querySelector('.td-std-edit-btn');
        if(editTd) editTd.innerHTML = '<button class="std-edit-btn" onclick="_stdEdit(this)" title="Edit"><i class="fas fa-pencil-alt"></i></button>';
      });
      _stdPending = null;
      _stdSelectedPlant = '';
    }

    function _stdSave(btn){
      var tr = btn.closest('tr');
      var rowData  = JSON.parse(decodeURIComponent(tr.dataset.stdrow));
      var headers  = JSON.parse(decodeURIComponent(tr.dataset.stdhdr));

      var changedCells = [];
      tr.querySelectorAll('td.td-std-editable input').forEach(function(inp){
        changedCells.push({
          col: Number(inp.dataset.stdcol),
          key: inp.dataset.stdkey,
          value: inp.value.trim(),
          orig: inp.dataset.origVal.trim()
        });
      });

      var hasChange = changedCells.some(function(c){ return c.value !== c.orig; });
      if(!hasChange){ _stdCancelActive(); return; }

      _stdPending = {tr: tr, rowData: rowData, headers: headers, changedCells: changedCells};
      _stdSelectedPlant = '';

      // Reset plant selection and show modal
      document.querySelectorAll('.std-plant-opt').forEach(function(el){ el.classList.remove('selected'); });
      document.getElementById('stdPlantModal').classList.add('show');
    }

    function _stdPlantSelect(el, plant){
      document.querySelectorAll('.std-plant-opt').forEach(function(o){ o.classList.remove('selected'); });
      el.classList.add('selected');
      _stdSelectedPlant = plant;
    }

    function _stdPlantCancel(){
      document.getElementById('stdPlantModal').classList.remove('show');
      _stdCancelActive();
      _stdPending = null;
      _stdSelectedPlant = '';
    }

    function _stdPlantConfirm(){
      if(!_stdSelectedPlant){
        // Shake effect via inline style (GAS CSP safe)
        var box = document.getElementById('stdPlantModalBox');
        box.style.transform = 'translateX(-8px)';
        setTimeout(function(){ box.style.transform='translateX(8px)'; }, 80);
        setTimeout(function(){ box.style.transform='translateX(-5px)'; }, 160);
        setTimeout(function(){ box.style.transform='translateX(0)'; }, 240);
        return;
      }
      document.getElementById('stdPlantModal').classList.remove('show');

      if(!_stdPending) return;
      var pending  = _stdPending;
      _stdPending  = null;
      var tr       = pending.tr;
      var rowData  = pending.rowData;
      var headers  = pending.headers;
      var changed  = pending.changedCells;

      // Build payload: ambil nilai dari rowData + timpa dengan nilai baru
      // Header mapping: [0]=SKU/MatCode, [1]=Nama, [2]=QTY, [3]=STD, [4]=JmlPallet, [5]=Divisi
      var getValue = function(keyIdx){
        var c = changed.find(function(x){ return x.col === keyIdx; });
        return c ? c.value : (rowData[headers[keyIdx]]||'');
      };

      var payload = {
        sku   : getValue(0),
        nama  : getValue(1),
        std   : Number(getValue(3)) || 0,
        divisi: getValue(5),
        plant : _stdSelectedPlant
      };
      _stdSelectedPlant = '';

      // Show spinner
      var editTd = tr.querySelector('.td-std-edit-btn');
      if(editTd) editTd.innerHTML = '<i class="fas fa-spinner fa-spin" style="color:#718096;font-size:12px;"></i>';

      google.script.run
        .withSuccessHandler(function(res){
          if(res && res.success){
            // Update display with new values
            changed.forEach(function(c){
              var td = tr.querySelector('td[data-stdcol="'+c.col+'"]');
              if(td){ td.classList.remove('td-std-editable'); td.textContent = c.value; }
            });
            tr.classList.remove('tr-std-editing');
            tr.style.background = '#c6f6d5';
            // Refresh section setelah 1.4 detik (setelah flash hijau)
            var contentEl = tr.closest('[id$="Content"]');
            var section   = contentEl ? contentEl.id.replace('Content','') : null;
            setTimeout(function(){
              tr.style.background = '';
              if(section && typeof loadSection === 'function') loadSection(section);
            }, 1400);
            if(editTd) editTd.innerHTML = '<button class="std-edit-btn" onclick="_stdEdit(this)" title="Edit"><i class="fas fa-pencil-alt"></i></button>';
            // Update rowData dataset
            changed.forEach(function(c){ rowData[headers[c.col]] = c.value; });
            tr.dataset.stdrow = encodeURIComponent(JSON.stringify(rowData));
          } else {
            alert('Gagal menyimpan: ' + (res&&res.message?res.message:'Unknown error'));
            _stdCancelActive();
          }
        })
        .withFailureHandler(function(e){
          alert('Error: ' + e.message);
          _stdCancelActive();
        })
        .saveStdEdit(payload);
    }


  // MONITORING RDC — JS
  // =============================================

  // ── State ──
  var _rdcZoom   = 100;
  var _rdcSel    = {r1:-1,c1:-1,r2:-1,c2:-1};
  var _rdcDrag   = false;

  // Urutan kolom editable (sesuai urutan td di baris)
  // Index 0 = td pertama setelah td-no
  var RDC_COLS = [
    {key:'plant',      grpSep:false},
    {key:'docno',      grpSep:false},
    {key:'no_do_sap',  grpSep:false},
    {key:'no_spe_sap', grpSep:false},
    {key:'ship_to',    grpSep:false},
    {key:'ekspedisi',  grpSep:false},
    {key:'no_pol',     grpSep:false},
    {key:'route',      grpSep:false},
    {key:'jenis_mob',  grpSep:false},
    {key:'sch_muat',   grpSep:true},
    {key:'sch_selesai',grpSep:false},
    {key:'std_durasi', grpSep:true},
    {key:'in_dt',      grpSep:true},
    {key:'sl_dt',      grpSep:false},
    {key:'fl_dt',      grpSep:false},
    {key:'out_dt',     grpSep:false}
  ];
  var RDC_NCOLS = RDC_COLS.length; // 16 kolom editable (plant,docno,no_do_sap,no_spe_sap,ship_to,ekspedisi,no_pol,route,jenis_mob,sch_muat,sch_selesai,std_durasi,in_dt,sl_dt,fl_dt,out_dt)

  // ── Helpers ──
  function _rdcTbody(){ return document.getElementById('rdcInputTbody'); }
  function _rdcTbl()  { return document.getElementById('rdcInputTbl'); }

  function _rdcAllTds(){
    // Returns 2D array [rowIdx][colIdx] of editable tds only
    var trs = Array.prototype.slice.call(_rdcTbody().querySelectorAll('tr'));
    return trs.map(function(tr){
      return RDC_COLS.map(function(col){
        return tr.querySelector('[data-key="'+col.key+'"]');
      });
    });
  }

  function _rdcTrIdx(tr){
    return Array.prototype.slice.call(_rdcTbody().querySelectorAll('tr')).indexOf(tr);
  }
  function _rdcTcIdx(td){
    var k = td.getAttribute('data-key');
    for(var i=0;i<RDC_COLS.length;i++){ if(RDC_COLS[i].key===k) return i; }
    return -1;
  }

  function _rdcFocus(ri,ci){
    var grid=_rdcAllTds(), nRows=grid.length;
    ri=Math.max(0,Math.min(nRows-1,ri));
    ci=Math.max(0,Math.min(RDC_NCOLS-1,ci));
    var td=grid[ri]&&grid[ri][ci];
    if(td&&td.contentEditable==='true'){ td.focus(); td.scrollIntoView&&td.scrollIntoView({block:'nearest',inline:'nearest'}); }
  }

  function _rdcClearSel(){
    document.querySelectorAll('#rdcInputTbl .rdc-sel').forEach(function(el){ el.classList.remove('rdc-sel'); });
    _rdcSel={r1:-1,c1:-1,r2:-1,c2:-1};
  }

  function _rdcApplySel(){
    document.querySelectorAll('#rdcInputTbl .rdc-sel').forEach(function(el){ el.classList.remove('rdc-sel'); });
    if(_rdcSel.r1<0) return;
    var trs=Array.prototype.slice.call(_rdcTbody().querySelectorAll('tr'));
    var r1=Math.min(_rdcSel.r1,_rdcSel.r2), r2=Math.max(_rdcSel.r1,_rdcSel.r2);
    var c1=Math.min(_rdcSel.c1,_rdcSel.c2), c2=Math.max(_rdcSel.c1,_rdcSel.c2);
    for(var r=r1;r<=r2;r++){
      if(!trs[r]) continue;
      for(var ci=c1;ci<=c2;ci++){
        var td=trs[r].querySelector('[data-key="'+RDC_COLS[ci].key+'"]');
        if(td) td.classList.add('rdc-sel');
      }
    }
  }

  function _rdcCopyBlock(){
    var trs=Array.prototype.slice.call(_rdcTbody().querySelectorAll('tr'));
    var r1=Math.min(_rdcSel.r1,_rdcSel.r2), r2=Math.max(_rdcSel.r1,_rdcSel.r2);
    var c1=Math.min(_rdcSel.c1,_rdcSel.c2), c2=Math.max(_rdcSel.c1,_rdcSel.c2);
    var lines=[];
    for(var r=r1;r<=r2;r++){
      if(!trs[r]) continue;
      var cells=[];
      for(var ci=c1;ci<=c2;ci++){
        var td=trs[r].querySelector('[data-key="'+RDC_COLS[ci].key+'"]');
        cells.push(td?td.textContent.trim():'');
      }
      lines.push(cells.join('\t'));
    }
    var text=lines.join('\n');
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text);
    } else {
      var ta=document.createElement('textarea');
      ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
    var nr=r2-r1+1, nc=c2-c1+1;
    showToast('&#128203; Copied '+nr+'R \u00d7 '+nc+'K','');
  }

  // ── Build table ──
