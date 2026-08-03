function rdcInitPage(){
    var today=new Date();
    var yyyy=today.getFullYear();
    var mm=String(today.getMonth()+1).padStart(2,'0');
    var dd=String(today.getDate()).padStart(2,'0');
    var ymd=yyyy+'-'+mm+'-'+dd;
    var ymFrom=yyyy+'-'+mm+'-01';
    var el;
    el=document.getElementById('rdcMetaTanggal'); if(el&&!el.value) el.value=ymd;
    // Set range tanggal default (awal bulan s/d hari ini) tapi TIDAK auto-load
    el=document.getElementById('rdcFilterFrom'); if(el) el.value=ymFrom;
    el=document.getElementById('rdcFilterTo');   if(el) el.value=ymd;
    if(_rdcTbody().rows.length===0) rdcInitRows(20);
    _rdcBindEvents();
    rdcSwitchTab('summary');
    // Reset tabel ke state kosong — tunggu user klik Tampilkan
    var tbody=document.getElementById('rdcSumTbody');
    if(tbody) tbody.innerHTML='<tr><td colspan="19" style="text-align:center;padding:40px;color:#a0aec0;font-size:13px;"><i class="fas fa-search" style="font-size:28px;display:block;margin-bottom:10px;opacity:.25;"></i>Pilih rentang tanggal lalu klik <b>Tampilkan</b></td></tr>';
    document.getElementById('rdcSumRowCount').textContent='0 DATA';
    _rdcData=[];
    setTimeout(_rdcFixStickyHeaders, 50);
  }

  function rdcSwitchTab(tab){
    var sp=document.getElementById('rdcSummaryPane');
    var ip=document.getElementById('rdcInputPane');
    var ts=document.getElementById('rdcTabSummary');
    var ti=document.getElementById('rdcTabInput');
    var showEl=tab==='summary'?sp:ip;
    var hideEl=tab==='summary'?ip:sp;
    // Fade out → hide → show → fade in (GAS CSP safe, tanpa @keyframes)
    hideEl.style.opacity='0';
    hideEl.style.transition='opacity .18s ease';
    setTimeout(function(){
      hideEl.style.display='none';
      showEl.style.opacity='0';
      showEl.style.display='block';
      showEl.style.transition='opacity .2s ease';
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){ showEl.style.opacity='1'; _rdcFixStickyHeaders(); });
      });
    }, 180);
    // Tab button styling
    if(ts){ ts.style.color=tab==='summary'?'#2c5364':'#718096'; ts.style.borderBottomColor=tab==='summary'?'#2c5364':'transparent'; }
    if(ti){ ti.style.color=tab==='input'  ?'#2c5364':'#718096'; ti.style.borderBottomColor=tab==='input'  ?'#2c5364':'transparent'; }
    var bs=document.getElementById('btnRdcSummary'); if(bs) bs.style.background=tab==='summary'?'rgba(255,255,255,.35)':'rgba(255,255,255,.2)';
    var bi=document.getElementById('btnRdcInput');   if(bi) bi.style.background=tab==='input'  ?'rgba(255,255,255,.35)':'rgba(255,255,255,.2)';
  }

  // Fix sticky header: hitung tinggi row 1 & pastikan background opaque
  function _rdcFixStickyHeaders(){
    // ── Summary table ──
    var sumTbl = document.getElementById('rdcSumTable');
    if(sumTbl){
      var r1 = sumTbl.querySelector('thead tr:first-child');
      if(r1){
        sumTbl.style.setProperty('--rdc-sum-r1', r1.offsetHeight+'px');
        // Pastikan semua th punya background opaque (bukan transparent)
        var ths = sumTbl.querySelectorAll('thead th');
        ths.forEach(function(th){
          var bg = th.style.background || th.style.backgroundColor;
          if(!bg || bg==='transparent' || bg==='') th.style.background='#f0f4f8';
        });
      }
    }
    // ── Input table ──
    var inpTbl = document.getElementById('rdcInputTbl');
    if(inpTbl){
      var r1i = inpTbl.querySelector('thead tr:first-child');
      if(r1i){
        inpTbl.style.setProperty('--rdc-inp-r1', r1i.offsetHeight+'px');
        var ths2 = inpTbl.querySelectorAll('thead th');
        ths2.forEach(function(th){
          var bg = th.style.background || th.style.backgroundColor;
          if(!bg || bg==='transparent' || bg==='') th.style.background='#0f2027';
        });
      }
    }
  }

  function rdcInitRows(n){ for(var i=0;i<n;i++) _rdcAppendRow({}); rdcUpdateRowCount(); setTimeout(_rdcFixStickyHeaders,50); }
  function rdcAddRows(n) { for(var i=0;i<n;i++) _rdcAppendRow({}); rdcUpdateRowCount(); }

  function _rdcAppendRow(data){
    var tbody=_rdcTbody();
    var rowIdx=tbody.rows.length+1;
    var tr=document.createElement('tr');

    // No
    var tdNo=document.createElement('td');
    tdNo.className='td-no'; tdNo.textContent=rowIdx; tdNo.style.cssText='text-align:center;color:#a0aec0;font-size:11px;font-weight:700;background:#f8fafc;width:32px;user-select:none;';
    tr.appendChild(tdNo);

    // Data cells
    RDC_COLS.forEach(function(col){
      var td=document.createElement('td');
      td.setAttribute('data-key',col.key);
      td.contentEditable='true';
      td.style.padding='5px 7px';
      if(col.grpSep) td.classList.add('grp-sep');
      if(col.key.endsWith('_dt')||col.key==='sch_muat'||col.key==='sch_selesai') td.style.minWidth='140px';
      else if(col.key==='std_durasi') td.style.minWidth='80px';
      else if(col.key==='ship_to') td.style.minWidth='130px';
      else if(col.key==='route') td.style.minWidth='100px';
      else td.style.minWidth='80px';
      if(data[col.key]) td.textContent=data[col.key];

      // Focus / Blur
      td.addEventListener('focus', function(){
        if(_rdcDrag){ td.blur(); return; }
        td.style.outline='2px solid #3182ce';
        td.style.outlineOffset='-2px';
        td._rdcOvr=true;
      });
      td.addEventListener('blur', function(){
        td.style.outline=''; td.style.outlineOffset='';
        _rdcCalcDurasi(tr);
      });

      // Keydown
      td.addEventListener('keydown', function(e){
        var allTrs=Array.prototype.slice.call(_rdcTbody().querySelectorAll('tr'));
        var ri=allTrs.indexOf(tr);
        var ci=_rdcTcIdx(td);

        // Tab
        if(e.key==='Tab'){
          e.preventDefault();
          if(e.shiftKey){
            if(ci>0) _rdcFocus(ri,ci-1); else if(ri>0) _rdcFocus(ri-1,RDC_NCOLS-1);
          } else {
            if(ci<RDC_NCOLS-1) _rdcFocus(ri,ci+1); else { if(ri>=allTrs.length-1) _rdcAppendRow({}); rdcUpdateRowCount(); _rdcFocus(ri+1,0); }
          }
          return;
        }
        // Enter
        if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); if(ri>=allTrs.length-1){ _rdcAppendRow({}); rdcUpdateRowCount(); } _rdcFocus(ri+1,ci); return; }

        // Delete — single cell
        if(e.key==='Delete'){ e.preventDefault(); td.textContent=''; _rdcCalcDurasi(tr); return; }

        // Overwrite mode (Excel: first keypress clears cell)
        var special=e.key.length>1||e.ctrlKey||e.metaKey||e.altKey;
        if(!special&&td._rdcOvr){ td.textContent=''; td._rdcOvr=false; }

        // Arrow keys
        if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.key)<0) return;
        e.preventDefault();
        var nr=ri, nc=ci;
        if(e.key==='ArrowUp')    nr--;
        if(e.key==='ArrowDown')  nr++;
        if(e.key==='ArrowLeft')  nc--;
        if(e.key==='ArrowRight') nc++;
        // Shift+Arrow → extend selection
        if(e.shiftKey){
          if(_rdcSel.r1<0) _rdcSel={r1:ri,c1:ci,r2:ri,c2:ci};
          nr=Math.max(0,Math.min(allTrs.length-1,nr));
          nc=Math.max(0,Math.min(RDC_NCOLS-1,nc));
          _rdcSel.r2=nr; _rdcSel.c2=nc;
          _rdcApplySel();
          var tgt=allTrs[nr]&&allTrs[nr].querySelector('[data-key="'+RDC_COLS[nc].key+'"]');
          if(tgt) setTimeout(function(){ tgt.focus(); tgt.scrollIntoView&&tgt.scrollIntoView({block:'nearest',inline:'nearest'}); },0);
          return;
        }
        // Normal arrow — clear sel, move
        _rdcClearSel();
        if(nc<0){ nc=RDC_NCOLS-1; nr--; }
        if(nc>=RDC_NCOLS){ nc=0; nr++; }
        if(nr>=allTrs.length){ _rdcAppendRow({}); rdcUpdateRowCount(); allTrs=Array.prototype.slice.call(_rdcTbody().querySelectorAll('tr')); }
        nr=Math.max(0,Math.min(allTrs.length-1,nr));
        _rdcSel={r1:nr,c1:nc,r2:nr,c2:nc};
        _rdcFocus(nr,nc);
      });

      tr.appendChild(td);
    });

    // Durasi (auto)
    var tdDur=document.createElement('td');
    tdDur.setAttribute('data-key','durasi');
    tdDur.className='grp-sep';
    tdDur.style.cssText='text-align:center;font-weight:700;color:#2c5364;min-width:90px;background:#f0f7ff;padding:5px 7px;border-left:2px solid #b0c8d8;white-space:nowrap;';
    tr.appendChild(tdDur);

    // Del button
    var tdDel=document.createElement('td');
    tdDel.style.cssText='width:28px;text-align:center;cursor:pointer;color:#cbd5e0;font-size:13px;padding:4px;';
    tdDel.innerHTML='&#10005;';
    tdDel.addEventListener('mouseenter',function(){ this.style.color='#e53e3e'; });
    tdDel.addEventListener('mouseleave',function(){ this.style.color='#cbd5e0'; });
    tdDel.addEventListener('click',function(){ tr.parentNode&&tr.parentNode.removeChild(tr); _rdcRenumber(); rdcUpdateRowCount(); });
    tr.appendChild(tdDel);

    tbody.appendChild(tr);
  }

  function _rdcCalcDurasi(tr){
    // Hitung durasi dari IN dan OUT (format: dd-MMM-yy HH:mm:ss atau teks bebas)
    var g=function(k){ var t=tr.querySelector('[data-key="'+k+'"]'); return t?t.textContent.trim():''; };
    var td=tr.querySelector('[data-key="durasi"]'); if(!td) return;
    var inStr=g('in_dt'), outStr=g('out_dt');
    if(!inStr||!outStr){ td.textContent=''; td.style.color=''; return; }
    try{
      // Ekstrak bagian waktu (HH:mm) dari string datetime
      function extractMin(s){
        var m=s.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
        if(!m) return null;
        return parseInt(m[1])*60+parseInt(m[2]);
      }
      // Coba parse sebagai Date dulu untuk handle overnight beda hari
      var dIn=new Date(inStr), dOut=new Date(outStr);
      if(!isNaN(dIn.getTime())&&!isNaN(dOut.getTime())){
        var diffMin=Math.round((dOut-dIn)/60000);
        if(diffMin<0||isNaN(diffMin)){ td.textContent=''; td.style.color=''; return; }
        var h=Math.floor(diffMin/60), m=diffMin%60;
        td.textContent=h+' JAM '+m+' MENIT';
        td.style.color=diffMin>240?'#e53e3e':'#276749';
        td.style.fontWeight='700';
        return;
      }
      // Fallback: pakai jam saja, handle overnight
      var mIn=extractMin(inStr), mOut=extractMin(outStr);
      if(mIn===null||mOut===null){ td.textContent=''; td.style.color=''; return; }
      var diffMin=mOut<mIn?1440+mOut-mIn:mOut-mIn;
      if(diffMin<0||isNaN(diffMin)){ td.textContent=''; td.style.color=''; return; }
      var h=Math.floor(diffMin/60), m=diffMin%60;
      td.textContent=h+' JAM '+m+' MENIT';
      td.style.color=diffMin>240?'#e53e3e':'#276749';
      td.style.fontWeight='700';
    }catch(e){ td.textContent=''; }
  }

  function _rdcRenumber(){
    var rows=_rdcTbody().querySelectorAll('tr');
    for(var i=0;i<rows.length;i++){ var td=rows[i].querySelector('.td-no'); if(td) td.textContent=i+1; }
  }

  function rdcUpdateRowCount(){
    var el=document.getElementById('rdcRowCount');
    if(el) el.textContent=_rdcTbody().rows.length+' BARIS';
  }

  function rdcClearTable(){
    _rdcTbody().innerHTML=''; rdcInitRows(20); _rdcClearSel();
  }

  // ── Zoom ──
  function rdcZoom(delta){
    _rdcZoom=Math.min(150,Math.max(60,_rdcZoom+delta));
    var t=_rdcTbl(); if(t) t.style.fontSize=(_rdcZoom/100*12)+'px';
    var l=document.getElementById('rdcZoomLabel'); if(l) l.textContent=_rdcZoom+'%';
  }
  function rdcZoomReset(){
    _rdcZoom=100; var t=_rdcTbl(); if(t) t.style.fontSize='';
    var l=document.getElementById('rdcZoomLabel'); if(l) l.textContent='100%';
  }

  // ── Bind document-level events (dipanggil sekali) ──
  var _rdcEventsBound=false;
  function _rdcBindEvents(){
    if(_rdcEventsBound) return; _rdcEventsBound=true;
    var tbl=_rdcTbl();

    // Mousedown on tbl → drag selection
    tbl.addEventListener('mousedown',function(e){
      var td=e.target.closest('[data-key]');
      if(!td||!td.closest('#rdcInputTbody')||!td.contentEditable==='true') return;
      var ri=_rdcTrIdx(td.closest('tr')), ci=_rdcTcIdx(td);
      if(ci<0) return;
      var sx=e.clientX, sy=e.clientY, moved=false;

      // Shift+click → extend
      if(e.shiftKey&&_rdcSel.r1>=0){ e.preventDefault(); _rdcSel.r2=ri; _rdcSel.c2=ci; _rdcApplySel(); return; }

      _rdcSel={r1:ri,c1:ci,r2:ri,c2:ci};

      function onMove(ev){
        if(!moved&&(Math.abs(ev.clientX-sx)>4||Math.abs(ev.clientY-sy)>4)){
          moved=true; _rdcDrag=true;
          var ae=document.activeElement; if(ae&&ae.closest('#rdcInputTbody')) ae.blur();
          _rdcApplySel();
        }
        if(moved){
          var ov=ev.target.closest('[data-key]');
          if(ov&&ov.closest('#rdcInputTbody')){
            _rdcSel.r2=_rdcTrIdx(ov.closest('tr')); _rdcSel.c2=_rdcTcIdx(ov);
            _rdcApplySel();
          }
          ev.preventDefault();
        }
      }
      function onUp(){
        document.removeEventListener('mousemove',onMove);
        document.removeEventListener('mouseup',onUp);
        _rdcDrag=false;
        if(moved){ tbl.focus(); _rdcApplySel(); }
        else { _rdcClearSel(); _rdcSel={r1:ri,c1:ci,r2:ri,c2:ci}; }
      }
      document.addEventListener('mousemove',onMove);
      document.addEventListener('mouseup',onUp);
    });

    // Document keydown — Delete blok, Ctrl+C, Ctrl+A
    document.addEventListener('keydown',function(e){
      var rdcPg=document.getElementById('rdcPage');
      if(!rdcPg||rdcPg.style.display==='none') return;
      var ip=document.getElementById('rdcInputPane');
      if(!ip||ip.style.display==='none') return;

      // Delete/Backspace → hapus blok
      if(e.key==='Delete'||e.key==='Backspace'){
        if(_rdcSel.r1>=0){
          var ae=document.activeElement;
          var inEdit=ae&&ae.contentEditable==='true'&&ae.closest('#rdcInputTbody');
          var multi=(Math.abs(_rdcSel.r2-_rdcSel.r1)>0||Math.abs(_rdcSel.c2-_rdcSel.c1)>0);
          var tblFoc=document.activeElement===tbl;
          if(multi||!inEdit||tblFoc){
            e.preventDefault();
            var trs=Array.prototype.slice.call(_rdcTbody().querySelectorAll('tr'));
            var r1=Math.min(_rdcSel.r1,_rdcSel.r2), r2=Math.max(_rdcSel.r1,_rdcSel.r2);
            var c1=Math.min(_rdcSel.c1,_rdcSel.c2), c2=Math.max(_rdcSel.c1,_rdcSel.c2);
            for(var r=r1;r<=r2;r++){
              if(!trs[r]) continue;
              for(var ci=c1;ci<=c2;ci++){
                var td=trs[r].querySelector('[data-key="'+RDC_COLS[ci].key+'"]');
                if(td&&td.contentEditable==='true') td.textContent='';
              }
              _rdcCalcDurasi(trs[r]);
            }
            if(multi) _rdcClearSel();
          }
        }
      }

      // Ctrl+C → copy blok
      if((e.ctrlKey||e.metaKey)&&e.key==='c'){
        if(_rdcSel.r1>=0&&_rdcSel.c1>=0){ e.preventDefault(); _rdcCopyBlock(); }
      }

      // Ctrl+A → select all
      if((e.ctrlKey||e.metaKey)&&e.key==='a'){
        if(!tbl.contains(document.activeElement)) return;
        var ae2=document.activeElement;
        if(ae2&&ae2.contentEditable==='true') return;
        e.preventDefault();
        var nRows=_rdcTbody().rows.length;
        _rdcSel={r1:0,c1:0,r2:nRows-1,c2:RDC_NCOLS-1};
        _rdcApplySel();
      }
    });

    // Click outside → clear sel
    document.addEventListener('mousedown',function(e){
      var rdcPg=document.getElementById('rdcPage');
      if(!rdcPg||rdcPg.style.display==='none') return;
      if(!tbl.contains(e.target)) _rdcClearSel();
    });

    // Paste (Ctrl+V dari Excel)
    tbl.addEventListener('paste',function(e){
      var active=document.activeElement;
      var td=active&&active.getAttribute&&active.getAttribute('data-key')&&active.closest('#rdcInputTbody')&&active;
      if(!td) return;
      var text=(e.clipboardData||window.clipboardData).getData('text');
      if(!text) return;
      var lines=text.split(/\r?\n/); if(lines[lines.length-1]==='') lines.pop();
      if(lines.length<=1&&lines[0]&&!lines[0].includes('\t')) return; // single cell, biarkan browser handle
      e.preventDefault();
      var startR=_rdcTrIdx(td.closest('tr')), startC=_rdcTcIdx(td);
      lines.forEach(function(lineStr,li){
        var cells=lineStr.split('\t');
        while(_rdcTbody().rows.length<=startR+li){ _rdcAppendRow({}); rdcUpdateRowCount(); }
        var trow=_rdcTbody().rows[startR+li];
        cells.forEach(function(val,ci){
          var colIdx=startC+ci; if(colIdx>=RDC_NCOLS) return;
          var tcell=trow.querySelector('[data-key="'+RDC_COLS[colIdx].key+'"]');
          if(tcell) tcell.textContent=val.trim();
        });
        _rdcCalcDurasi(trow);
      });
    });
  }

  // ── Save ──
  function rdcSaveData(){
    var tbody=_rdcTbody(), data=[];
    for(var i=0;i<tbody.rows.length;i++){
      var row={}, empty=true;
      RDC_COLS.forEach(function(col){
        var td=tbody.rows[i].querySelector('[data-key="'+col.key+'"]');
        var v=td?td.textContent.trim():''; row[col.key]=v; if(v) empty=false;
      });
      var dur=tbody.rows[i].querySelector('[data-key="durasi"]');
      // Bersihkan textContent dari karakter non-printable
      row.durasi=dur?(dur.textContent||'').replace(/[\u00a0\u200b]/g,'').trim():'';
      // Sanitasi semua field — pastikan string bersih
      RDC_COLS.forEach(function(col){ if(row[col.key]) row[col.key]=String(row[col.key]).replace(/[\u00a0\u200b]/g,'').trim(); });
      if(!empty) data.push(row);
    }
    if(!data.length){ showToast('⚠ Tidak ada data untuk disimpan',''); return; }
    var tgl=document.getElementById('rdcMetaTanggal').value;
    if(!tgl){ showToast('⚠ Tanggal wajib diisi!',''); return; }

    // Disable tombol simpan
    var btnSave=document.querySelector('#rdcInputPane .op-btn.success');
    if(btnSave){ btnSave.disabled=true; btnSave.innerHTML='<i class="fas fa-spinner fa-spin"></i> Menyimpan...'; }

    var payload={tanggal:tgl, rows:data};

    if(typeof google!=='undefined'&&google.script&&google.script.run){
      google.script.run
        .withSuccessHandler(function(res){
          if(btnSave){ btnSave.disabled=false; btnSave.innerHTML='<i class="fas fa-save" style="margin-right:5px;"></i>Simpan Data'; }
          if(res&&res.success){
            showToast('✓ '+res.message,'');
            rdcClearTable();
          } else {
            showToast('✖ '+(res?res.message:'Gagal menyimpan'),'err');
          }
        })
        .withFailureHandler(function(err){
          if(btnSave){ btnSave.disabled=false; btnSave.innerHTML='<i class="fas fa-save" style="margin-right:5px;"></i>Simpan Data'; }
          showToast('✖ Error: '+err.message,'err');
        })
        .saveRdcData(payload);
    } else {
      // Preview mode
      if(btnSave){ btnSave.disabled=false; btnSave.innerHTML='<i class="fas fa-save" style="margin-right:5px;"></i>Simpan Data'; }
      showToast('✓ '+data.length+' baris disimpan (preview mode)','');
    }
  }

  // ── Summary data (diisi dari google.script.run.getRdcData) ──
  var _rdcData = [];

  // ── Format tanggal/jam dari GAS (bisa Date object atau string) ──
  // ── Parse "dd-MMM-yy HH:mm:ss" → Date object ──
  function _rdcParseDT(s){
    if(!s) return null;
    var mo={'JAN':0,'FEB':1,'MAR':2,'APR':3,'MAY':4,'JUN':5,'JUL':6,'AUG':7,'SEP':8,'OCT':9,'NOV':10,'DEC':11};
    var m=String(s).trim().toUpperCase().match(/^(\d{2})-([A-Z]{3})-(\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if(m){
      var yr=parseInt(m[3]); if(yr<100) yr+=2000;
      return new Date(yr, mo[m[2]]||0, parseInt(m[1]), parseInt(m[4]), parseInt(m[5]), parseInt(m[6]||0));
    }
    // Fallback: coba Date()
    try{ var d=new Date(s); if(!isNaN(d.getTime())) return d; }catch(e){}
    return null;
  }

  // ── Ekstrak yyyy-MM-dd dari datetime string (untuk filter tanggal) ──
  function _rdcExtractDate(v){
    if(!v) return '';
    var d=_rdcParseDT(v);
    if(d&&!isNaN(d.getTime())){
      return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    }
    return '';
  }

  // ── Ekstrak HH:MM dari datetime string (untuk getRdcTim) ──
  function _rdcExtractTime(v){
    if(!v) return '';
    var m=String(v).match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
    return m ? m[1].padStart(2,'0')+':'+m[2] : '';
  }

  function _rdcFmtTglRaw(v){
    // Return yyyy-MM-dd untuk perbandingan tanggal — support format dd-MMM-yy juga
    if(!v) return '';
    var s=String(v);
    if(s.match(/^\d{4}-\d{2}-\d{2}/)) return s.substring(0,10);
    return _rdcExtractDate(v);
  }

  function _rdcFmtTgl(v){
    if(!v) return '';
    var s = String(v);
    // Kalau sudah format yyyy-MM-dd, ambil langsung
    if(s.match(/^\d{4}-\d{2}-\d{2}/)) return s.substring(0,10);
    // Kalau Date object (dari GAS kadang jadi string panjang)
    try{
      var d = new Date(v);
      if(!isNaN(d.getTime())){
        var yyyy = d.getFullYear();
        var mm   = String(d.getMonth()+1).padStart(2,'0');
        var dd   = String(d.getDate()).padStart(2,'0');
        return dd+'-'+mm+'-'+yyyy; // format dd-MM-yyyy agar mudah dibaca
      }
    }catch(e){}
    return s.substring(0,10);
  }

  function _rdcFmtJam(v){
    if(!v) return '';
    var s = String(v).trim();
    // Format HH:MM:SS → HH:MM
    if(s.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) return s.substring(0,5);
    // Date object string → ambil jam
    try{
      var d = new Date(v);
      if(!isNaN(d.getTime())){
        return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
      }
    }catch(e){}
    return s.substring(0,5);
  }

  // ── Helper: parse "HH:MM" ke menit sejak 00:00 ──
  function _rdcToMin(jamStr){
    if(!jamStr) return null;
    var p=(jamStr+'').replace(/[^0-9:]/g,'').split(':');
    var h=parseInt(p[0]||0), m=parseInt(p[1]||0);
    return isNaN(h)||isNaN(m) ? null : h*60+m;
  }

  // ── Hitung selisih jam (handle overnight, hasil dalam menit) ──
  function _rdcJamDiff(jamA, jamB){
    // IF(B<A; 1440+B-A; B-A)  → sama dengan rumus spreadsheet
    var mA=_rdcToMin(jamA), mB=_rdcToMin(jamB);
    if(mA===null||mB===null) return null;
    return mB < mA ? 1440 + mB - mA : mB - mA;
  }

  // ── Selisih datetime bertanda: positif = terlambat, negatif = lebih cepat ──
  // tglA/tglB format: "dd-MM-yyyy" atau "yyyy-MM-dd"
  function _rdcTglToDate(tgl, jam){
    if(!tgl) return null;
    var s = String(tgl).trim();
    var y,m,d;
    // dd-MM-yyyy
    var m1 = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    // yyyy-MM-dd
    var m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if(m1){ y=parseInt(m1[3]); m=parseInt(m1[2])-1; d=parseInt(m1[1]); }
    else if(m2){ y=parseInt(m2[1]); m=parseInt(m2[2])-1; d=parseInt(m2[3]); }
    else return null;
    var parts = String(jam||'00:00').split(':');
    var h = parseInt(parts[0])||0, mn = parseInt(parts[1])||0;
    return new Date(y, m, d, h, mn);
  }

  function _rdcJamDiffSigned(jamA, jamB, tglA, tglB){
    // Kalau ada tanggal, hitung selisih datetime penuh
    if(tglA && tglB){
      var dtA = _rdcTglToDate(tglA, jamA);
      var dtB = _rdcTglToDate(tglB, jamB);
      if(!dtA||!dtB) return null;
      return Math.round((dtB - dtA) / 60000); // menit
    }
    // Fallback: hanya jam, pakai window ±12 jam
    var mA=_rdcToMin(jamA), mB=_rdcToMin(jamB);
    if(mA===null||mB===null) return null;
    var diff = mB - mA;
    if(diff > 720)  diff = diff - 1440;
    if(diff < -720) diff = diff + 1440;
    return diff;
  }

  // ── Format menit → "X JAM Y MENIT" ──
  function _rdcFmtDur(mnt){
    if(mnt===null||isNaN(mnt)) return '&#8212;';
    return Math.floor(mnt/60)+' JAM '+(mnt%60)+' MENIT';
  }

  // ── Parse datetime string ke menit sejak 00:00 pada hari itu ──
  function _rdcDtToMin(s){
    if(!s) return null;
    var m=String(s).match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
    if(!m) return null;
    return parseInt(m[1])*60+parseInt(m[2]);
  }

  // ── Selisih bertanda antara dua datetime string (menit), positif = B > A ──
  function _rdcDtDiffSigned(strA, strB){
    if(!strA||!strB) return null;
    var dA=new Date(strA), dB=new Date(strB);
    if(!isNaN(dA.getTime())&&!isNaN(dB.getTime())) return Math.round((dB-dA)/60000);
    // Fallback: hanya jam, window ±12 jam
    var mA=_rdcDtToMin(strA), mB=_rdcDtToMin(strB);
    if(mA===null||mB===null) return null;
    var diff=mB-mA;
    if(diff>720) diff-=1440;
    if(diff<-720) diff+=1440;
    return diff;
  }

  // ── Keterangan SCHEDULE: OK jika selisih sch_muat → in_dt ≤ 12 jam ──
  function _rdcKetSchedule(r){
    if(!r.sch_muat||!r.in_dt) return {ok:null, label:'&#8212;'};
    var diff=_rdcDtDiffSigned(r.sch_muat, r.in_dt);
    if(diff===null) return {ok:null, label:'&#8212;'};
    return diff<=480 ? {ok:true,label:'OK'} : {ok:false,label:'NOT OK'};
  }

  // ── Keterangan WAKTU STAY: OK jika in_dt → out_dt ≤ 6 jam (360 menit) ──
  function _rdcKetWaktuStay(r){
    if(!r.in_dt||!r.out_dt) return {ok:null, label:'&#8212;'};
    var diff=_rdcDtDiffSigned(r.in_dt, r.out_dt);
    if(diff===null) return {ok:null, label:'&#8212;'};
    return diff>=0&&diff<=360 ? {ok:true,label:'OK'} : {ok:false,label:'NOT OK'};
  }

  // Kategori Ship to Name: RDC = mengandung "RDC" atau "IBN PURWOSARI" (case-insensitive)
  function _rdcIsRdc(shipTo){
    if(!shipTo) return false;
    var s=shipTo.toString().toUpperCase();
    return s.indexOf('RDC')!==-1 || s.indexOf('IBN PURWOSARI')!==-1;
  }

  function rdcLoadSummary(){
    var fP  = document.getElementById('rdcFilterPlant').value;
    var fST = document.getElementById('rdcFilterShipTo').value;
    var fd  = document.getElementById('rdcFilterFrom').value;
    var ft  = document.getElementById('rdcFilterTo').value;

    // Loading state
    var btn = document.querySelector('#rdcSummaryPane .opname-btn-primary');
    if(btn){ btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Memuat...'; }
    var tbody=document.getElementById('rdcSumTbody');
    if(tbody) tbody.innerHTML='<tr><td colspan="19" style="text-align:center;padding:30px;color:#a0aec0;"><i class="fas fa-spinner fa-spin" style="font-size:20px;display:block;margin-bottom:8px;"></i>Memuat data...</td></tr>';

    function resetBtn(){ if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-search"></i> Tampilkan'; } }

    // Ambil semua data lalu filter sl_dt (Start Loading) di frontend
    google.script.run
      .withSuccessHandler(function(res){
        resetBtn();
        var raw = (res && res.success) ? (res.data || []) : [];
        _rdcData = _rdcDedupData(raw);
        _rdcRenderSummary(fP, fST, fd, ft);
      })
      .withFailureHandler(function(){
        resetBtn();
        _rdcData = [];
        _rdcRenderSummary(fP, fST, fd, ft);
      })
      .getRdcData('', ''); // kirim kosong → ambil semua, filter di frontend
  }

  // ── Dedup: DocNo + NoPol + TANGGAL Waktu Muat (kolom K "SCH WAKTU MUAT") sama = duplikat
  // (kemungkinan akibat retry jaringan). Tanggal saja (tanpa jam) supaya lebih ketat —
  // dua baris dengan DocNo+NoPol sama tapi beda hari tetap dianggap truk/kunjungan berbeda.
  // Kalau ketemu duplikat, ambil yang datanya PALING LENGKAP (skor tertinggi:
  // hitung berapa field datetime kunci yang terisi — IN, Start Loading, Finish Loading, OUT)
  function _rdcDedupData(rows){
    function completeness(r){
      var score = 0;
      if (r.in_dt)  score++;
      if (r.sl_dt)  score++;
      if (r.fl_dt)  score++;
      if (r.out_dt) score++; // OUT paling berat — data paling lengkap
      return score;
    }
    var map = {};
    var order = [];
    rows.forEach(function(r){
      var tglMuat = _rdcExtractDate(r.sch_muat); // hanya tanggal, jam diabaikan
      var key = String(r.docno||'').trim() + '|' + String(r.no_pol||'').trim() + '|' + tglMuat;
      // Kalau salah satu kunci kosong (docno/no_pol/tglMuat), jangan dedup — biarkan lolos apa adanya
      if (!r.docno || !r.no_pol || !tglMuat) { order.push(r); return; }
      if (!map[key]) {
        map[key] = r;
        order.push(r);
      } else {
        if (completeness(r) > completeness(map[key])) {
          var idx = order.indexOf(map[key]);
          if (idx >= 0) order[idx] = r;
          map[key] = r;
        }
      }
    });
    return order;
  }

  // ── Filter + dedup BERSAMA — dipakai oleh tabel web, Download PDF, dan Download Excel ──
  // supaya ketiganya SELALU menghasilkan dataset yang identik, tidak ada lagi selisih angka.
  function _rdcScore(r){
    var fields=['ship_to','ekspedisi','no_pol','route','jenis_mob',
      'sch_muat','sch_selesai','std_durasi','in_dt','sl_dt','fl_dt','out_dt','catatan'];
    return fields.reduce(function(s,f){ return s+(r[f]?1:0); },0);
  }
  function _rdcGetFilteredDeduped(fP, fST, fd, ft){
    var d=_rdcData.filter(function(r){
      if(fP&&r.plant!==fP) return false;
      if(fST){
        var isRdc=_rdcIsRdc(r.ship_to);
        if(fST==='RDC'&&!isRdc) return false;
        if(fST==='SELAIN_RDC'&&isRdc) return false;
      }
      // Filter by sl_dt (Start Loading), fallback ke in_dt kalau sl_dt kosong
      if(fd&&ft){
        var dtRef=r.sl_dt||r.in_dt;
        if(!dtRef) return false; // kalau keduanya kosong, exclude
        var dtNorm=_rdcExtractDate(dtRef);
        if(dtNorm&&dtNorm<fd) return false;
        if(dtNorm&&dtNorm>ft) return false;
      }
      return true;
    });

    // Deduplikasi — kunci utama: No Pol + IN + OUT (jam fisik aktual, paling jarang beda
    // antar percobaan retry). Fallback ke No Pol + Waktu Muat + Start Loading kalau IN/OUT
    // belum terisi (truk belum keluar). Dipakai SEKALI SAJA di sini — supaya total selalu
    // sama persis di semua tempat (tabel, kartu rekap, PDF, Excel), tidak dedup ulang di manapun.
    var _dupMap={};
    d.forEach(function(r){
      var key = (r.in_dt && r.out_dt)
        ? (r.no_pol||'')+'|'+r.in_dt+'|'+r.out_dt
        : (r.no_pol||'')+'|sch:'+(r.sch_muat||'')+'|sl:'+(r.sl_dt||'');
      if(!_dupMap[key]||_rdcScore(r)>_rdcScore(_dupMap[key])) _dupMap[key]=r;
    });
    return Object.keys(_dupMap).map(function(k){ return _dupMap[k]; });
  }

  function _rdcRenderSummary(fP, fST, fd, ft){
    var d=_rdcGetFilteredDeduped(fP, fST, fd, ft);

    var total=d.length;
    document.getElementById('rdcSumRowCount').textContent=total+' DATA';

    // Simpan filtered data untuk rekap
    _rdcFilteredData = d.slice();

    // Sort by in_dt ascending (terkecil ke terbesar), null/kosong ke bawah
    d.sort(function(a,b){
      var da=a.in_dt?_rdcParseDT(a.in_dt):null;
      var db=b.in_dt?_rdcParseDT(b.in_dt):null;
      if(!da&&!db) return 0;
      if(!da) return 1;
      if(!db) return -1;
      return da.getTime()-db.getTime();
    });

    var tbody=document.getElementById('rdcSumTbody'); tbody.innerHTML='';
    if(!d.length){
      tbody.innerHTML='<tr><td colspan="19" style="text-align:center;padding:30px;color:#a0aec0;"><i class="fas fa-inbox" style="font-size:24px;display:block;margin-bottom:8px;opacity:.3;"></i>Tidak ada data</td></tr>';
      return;
    }

    var SEP='border-left:1px solid #e2e8f0;';
    var SEP2='border-left:1px solid #c3d8f5;';

    d.forEach(function(r,i){
      // DELAY = selisih sch_muat → sl_dt (Start Loading), positif = terlambat
      var delayMin=_rdcDtDiffSigned(r.sch_muat, r.sl_dt);
      // DURASI TOTAL = in_dt → out_dt
      var durMin=_rdcDtDiffSigned(r.in_dt, r.out_dt);
      // DURASI LOADING = sl_dt (Start Loading) → fl_dt (Finish Loading), dalam menit
      var durLoadMin=_rdcDtDiffSigned(r.sl_dt, r.fl_dt);
      // SELISIH DURASI = durasi loading - std_durasi, positif = melebihi
      var stdMnt=r.std_durasi ? parseInt(r.std_durasi) : null;
      var selisihMin=(durLoadMin!==null && stdMnt!==null && !isNaN(stdMnt)) ? (durLoadMin - stdMnt) : null;

      var sch   = _rdcKetSchedule(r);
      var stay  = _rdcKetWaktuStay(r);
      // WAKTU LOADING: OK jika durasi loading <= std_durasi, NOT OK jika melebihi
      var loadingOk = (durLoadMin!==null && stdMnt!==null && !isNaN(stdMnt))
                      ? (durLoadMin <= stdMnt) : null;
      var loadingLabel = loadingOk===null ? '&#8212;' : (loadingOk ? 'OK' : 'NOT OK');

      var schStyle    = 'text-align:center;font-weight:700;padding:6px 10px;'+SEP2+
                        (sch.ok===true   ? 'color:#276749;background:#f0fff4;' :
                         sch.ok===false  ? 'color:#9b2c2c;background:#fff5f5;' : 'color:#a0aec0;');
      var stayStyle   = 'text-align:center;font-weight:700;padding:6px 10px;'+
                        (stay.ok===true  ? 'color:#276749;background:#f0fff4;' :
                         stay.ok===false ? 'color:#9b2c2c;background:#fff5f5;' : 'color:#a0aec0;');
      var loadingStyle= 'text-align:center;font-weight:700;padding:6px 10px;'+
                        (loadingOk===true  ? 'color:#276749;background:#f0fff4;' :
                         loadingOk===false ? 'color:#9b2c2c;background:#fff5f5;' : 'color:#a0aec0;');

      var tr=document.createElement('tr');
      tr.style.cursor='pointer';
      tr.title='Klik untuk detail';
      tr.addEventListener('click',function(){ rdcOpenPopup(r); });
      tr.innerHTML=
        '<td style="text-align:center;color:#a0aec0;font-weight:700;position:relative;padding:4px 8px;">'+
          (i+1)+
          (r.catatan?'<span style="position:absolute;top:4px;right:4px;width:8px;height:8px;background:#e53e3e;border-radius:50%;display:inline-block;"></span>':'')+
        '</td>'+
        '<td style="font-weight:600;">'+r.ship_to+'</td>'+
        '<td>'+r.ekspedisi+'</td>'+
        '<td><b>'+r.no_pol+'</b></td>'+
        '<td>'+(r.route||'')+'</td>'+
        '<td>'+r.jenis_mob+'</td>'+
        '<td style="'+SEP+'white-space:nowrap;">'+(r.sch_muat   ||'&#8212;')+'</td>'+
        '<td style="white-space:nowrap;">'        +(r.sch_selesai||'&#8212;')+'</td>'+
        '<td style="text-align:center;font-weight:700;'+SEP+'">'+(r.std_durasi||'&#8212;')+'</td>'+
        '<td style="'+SEP+'white-space:nowrap;">'+(r.in_dt ||'&#8212;')+'</td>'+
        '<td style="white-space:nowrap;">'        +(r.sl_dt ||'&#8212;')+'</td>'+
        '<td style="white-space:nowrap;">'        +(r.fl_dt ||'&#8212;')+'</td>'+
        '<td style="white-space:nowrap;">'        +(r.out_dt||'&#8212;')+'</td>'+
        // DELAY
        '<td style="text-align:center;font-weight:700;border-left:1px solid #e2e8f0;white-space:nowrap;min-width:90px;color:'+
          (delayMin===null?'#a0aec0':delayMin>0?'#856404':delayMin<0?'#276749':'#718096')+';">'+
          (delayMin===null?'&#8212;':
           delayMin>0 ? _rdcFmtDur(delayMin) :
           delayMin<0 ? ('- '+_rdcFmtDur(Math.abs(delayMin))) :
           '0 JAM 0 MENIT')+'</td>'+
        // DURASI LOADING (menit)
        '<td style="text-align:center;font-weight:700;border-left:1px solid #e2e8f0;min-width:80px;color:'+
          (durLoadMin===null?'#a0aec0':'#2d3748')+';">'+
          (durLoadMin===null?'&#8212;':durLoadMin+' mnt')+'</td>'+
        // SELISIH DURASI (menit), merah jika positif (melebihi)
        '<td style="text-align:center;font-weight:700;border-left:1px solid #e2e8f0;min-width:80px;color:'+
          (selisihMin===null?'#a0aec0':selisihMin>0?'#9b2c2c':selisihMin<0?'#276749':'#718096')+';">'+
          (selisihMin===null?'&#8212;':
           selisihMin>0 ? ('+'+selisihMin+' mnt') :
           selisihMin<0 ? (selisihMin+' mnt') :
           '0 mnt')+'</td>'+
        // DURASI TOTAL IN/OUT
        '<td style="text-align:center;font-weight:700;border-left:1px solid #e2e8f0;white-space:nowrap;color:'+
          (durMin!==null?(durMin>360?'#9b2c2c':'#276749'):'#a0aec0')+';">'+
          (durMin!==null?_rdcFmtDur(durMin):'&#8212;')+'</td>'+
        // KETERANGAN
        '<td style="'+schStyle    +'">'+sch.label    +'</td>'+
        '<td style="'+stayStyle   +'">'+stay.label   +'</td>'+
        '<td style="'+loadingStyle+'">'+loadingLabel +'</td>';
      tbody.appendChild(tr);
    });
    setTimeout(_rdcFixStickyHeaders, 50);
  }

  // =============================================
  // RDC PDF DOWNLOAD
  // =============================================
  var _rdcFilteredData = [];
  var _rdcCurrentView = 'data';

  function rdcSwitchView(v){
    if(_rdcCurrentView===v) return;
    _rdcCurrentView = v;
    var btnD=document.getElementById('rdcToggleData');
    var btnR=document.getElementById('rdcToggleRekap');
    var dataPane=document.getElementById('rdcDataPane');
    var rekapPane=document.getElementById('rdcRekapPane');

    // Fade out pane aktif dulu, lalu swap
    var hidePane = v==='data' ? rekapPane : dataPane;
    var showPane = v==='data' ? dataPane  : rekapPane;

    hidePane.style.transition='opacity .18s ease';
    hidePane.style.opacity='0';
    setTimeout(function(){
      hidePane.style.display='none';
      hidePane.style.opacity='';
      hidePane.style.transition='';

      if(v==='rekap') rdcRenderRekap();

      showPane.style.display='';
      showPane.style.opacity='0';
      showPane.style.transition='opacity .2s ease';
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          showPane.style.opacity='1';
          setTimeout(function(){ showPane.style.transition=''; showPane.style.opacity=''; },220);
        });
      });
    }, 180);

    // Update tombol
    if(v==='data'){
      btnD.style.background='#2c5364'; btnD.style.color='#fff'; btnD.style.border='none';
      btnR.style.background='#fff'; btnR.style.color='#4a5568'; btnR.style.border='1px solid #cbd5e0';
    } else {
      btnR.style.background='#2c5364'; btnR.style.color='#fff'; btnR.style.border='none';
      btnD.style.background='#fff'; btnD.style.color='#4a5568'; btnD.style.border='1px solid #cbd5e0';
    }
  }

  function rdcRenderRekap(){
    var pane=document.getElementById('rdcRekapPane');
    var d=_rdcFilteredData;
    if(!d||!d.length){
      pane.innerHTML="<p style='text-align:center;color:#a0aec0;padding:30px;font-size:13px;'>Belum ada data — klik Tampilkan dulu.</p>";
      return;
    }

    // d sudah bersih (dedup sudah dilakukan SEKALI di _rdcGetFilteredDeduped, sebelum sampai
    // ke sini via _rdcFilteredData). Tidak dedup lagi di sini — supaya total (header) SELALU
    // sama dengan jumlah OK+NOTOK+N/A tiap kartu (partisi lurus dari 1 dataset yang sama).
    var total=d.length;
    // Kumpulkan OK/NOT OK per kategori — partisi SATU dataset yang sama (d), jadi
    // OK+NOTOK+N/A per kartu otomatis selalu = total, tidak mungkin beda lagi.
    var schOk=[],schNotOk=[],schNull=0;
    var stayOk=[],stayNotOk=[],stayNull=0;
    var loadOk=[],loadNotOk=[],loadNull=0;

    d.forEach(function(r){
      var sch=_rdcKetSchedule(r);
      var stay=_rdcKetWaktuStay(r);
      var durLoadMin=_rdcDtDiffSigned(r.sl_dt,r.fl_dt);
      var stdMnt=r.std_durasi?parseInt(r.std_durasi):null;
      var loadingOk=(durLoadMin!==null&&stdMnt!==null&&!isNaN(stdMnt))?(durLoadMin<=stdMnt):null;
      var delayMin=_rdcDtDiffSigned(r.sch_muat,r.sl_dt);
      var durStayMin=_rdcDtDiffSigned(r.in_dt,r.out_dt);

      // Satu object gabungan per baris — dipakai bersama oleh sch/stay/load (field yang tidak
      // relevan untuk suatu kategori tinggal diabaikan di popup, tidak perlu object terpisah)
      var rowObj={
        no_pol:r.no_pol, ship_to:r.ship_to,
        sch_muat:r.sch_muat, sl_dt:r.sl_dt, fl_dt:r.fl_dt, in_dt:r.in_dt, out_dt:r.out_dt,
        std:r.std_durasi, delay:delayMin, durLoad:durLoadMin,
        selisih:(durLoadMin!==null&&stdMnt!==null&&!isNaN(stdMnt))?(durLoadMin-stdMnt):null,
        durStay:durStayMin,
        catatan:r.catatan||''
      };

      // SCHEDULE
      if(sch.ok===true) schOk.push(rowObj);
      else if(sch.ok===false) schNotOk.push(rowObj);
      else schNull++;

      // WAKTU STAY
      if(stay.ok===true) stayOk.push(rowObj);
      else if(stay.ok===false) stayNotOk.push(rowObj);
      else stayNull++;

      // WAKTU LOADING
      if(loadingOk===true) loadOk.push(rowObj);
      else if(loadingOk===false) loadNotOk.push(rowObj);
      else loadNull++;
    });

    // Simpan supaya popup baca dari sini langsung — TIDAK hitung ulang dari _rdcFilteredData
    window._rdcRekapAll = {
      sch:  {ok:schOk,  notok:schNotOk},
      stay: {ok:stayOk, notok:stayNotOk},
      load: {ok:loadOk, notok:loadNotOk}
    };

    function rekapCard(title,icon,okList,notOk,nullCount,onClickNotOk,onClickOk){
      var ok=okList.length;
      var total2=ok+notOk.length+(nullCount||0);
      var notOkCount=notOk.length;
      var pctOk=total2>0?Math.round(ok/total2*100):0;
      var pctNotOk=total2>0?Math.round(notOkCount/total2*100):0;
      var pctColor=pctOk>=90?'#276749':pctOk>=70?'#856404':'#9b2c2c';
      var pctBg=pctOk>=90?'#f0fff4':pctOk>=70?'#fffff0':'#fff5f5';
      var pctBorder=pctOk>=90?'#9ae6b4':pctOk>=70?'#fbd38d':'#feb2b2';
      return '<div style="background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08);border:1px solid #e2e8f0;padding:16px;min-width:220px;flex:1;">'
        +'<div style="font-size:11px;font-weight:800;color:#718096;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;"><i class="'+icon+'" style="margin-right:5px;"></i>'+title+'</div>'
        +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">'
          +'<div style="font-size:28px;font-weight:900;color:#2d3748;">'+total2+' <span style="font-size:13px;color:#a0aec0;font-weight:600;">mobil</span></div>'
          +(total2>0?'<div style="font-size:20px;font-weight:900;padding:4px 12px;border-radius:20px;background:'+pctBg+';color:'+pctColor+';border:1.5px solid '+pctBorder+';text-align:center;line-height:1.2;"><div style="font-size:9px;font-weight:700;opacity:.7;letter-spacing:.4px;">% OK</div>'+pctOk+'%</div>':'')
        +'</div>'
        +'<div style="display:flex;gap:8px;margin-top:10px;">'
        +(ok>0?'<div onclick="'+onClickOk+'" style="flex:1;background:#f0fff4;border:1px solid #9ae6b4;border-radius:8px;padding:8px;text-align:center;cursor:pointer;" title="Klik untuk lihat list OK">'
          +'<div style="font-size:18px;font-weight:800;color:#276749;">'+ok+'</div>'
          +'<div style="font-size:10px;font-weight:700;color:#276749;">OK</div>'
          +'<div style="font-size:13px;font-weight:800;color:#276749;opacity:.85;">'+pctOk+'%</div>'
          +'</div>':'')
        +(notOkCount>0?'<div onclick="'+onClickNotOk+'" style="flex:1;background:#fff5f5;border:1px solid #feb2b2;border-radius:8px;padding:8px;text-align:center;cursor:pointer;" title="Klik untuk lihat list NOT OK">'
          +'<div style="font-size:18px;font-weight:800;color:#9b2c2c;">'+notOkCount+'</div>'
          +'<div style="font-size:10px;font-weight:700;color:#9b2c2c;">NOT OK</div>'
          +'<div style="font-size:13px;font-weight:800;color:#9b2c2c;opacity:.85;">'+pctNotOk+'%</div>'
          +'</div>':'<div style="flex:1;background:#f7fafc;border-radius:8px;padding:8px;text-align:center;">'
          +'<div style="font-size:18px;font-weight:800;color:#a0aec0;">0</div>'
          +'<div style="font-size:10px;color:#a0aec0;">NOT OK</div>'
          +'<div style="font-size:13px;font-weight:800;color:#a0aec0;">0%</div>'
          +'</div>')
        +(nullCount>0?'<div style="flex:1;background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px;text-align:center;">'
          +'<div style="font-size:18px;font-weight:800;color:#a0aec0;">'+nullCount+'</div>'
          +'<div style="font-size:10px;color:#a0aec0;">N/A</div>'
          +'</div>':'')
        +'</div>'
        +'</div>';
    }

    var html='<div style="margin-bottom:12px;"><span style="font-size:13px;font-weight:700;color:#4a5568;">Total Mobil: </span><span style="font-size:15px;font-weight:800;color:#2c5364;">'+total+'</span></div>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:12px;">';
    html+=rekapCard('Schedule','fas fa-clock',schOk,schNotOk,schNull,
      "rdcShowRekapPopup('sch','notok')",
      "rdcShowRekapPopup('sch','ok')");
    html+=rekapCard('Waktu Loading','fas fa-boxes',loadOk,loadNotOk,loadNull,
      "rdcShowRekapPopup('load','notok')",
      "rdcShowRekapPopup('load','ok')");
    html+=rekapCard('Waktu Stay','fas fa-parking',stayOk,stayNotOk,stayNull,
      "rdcShowRekapPopup('stay','notok')",
      "rdcShowRekapPopup('stay','ok')");
    html+='</div>';

    pane.innerHTML=html;
  }

  function _srShowCatatanKirim(el){
    var cat = (el.getAttribute('data-cat')||'').replace(/&#10;/g,'\n');
    var existing = document.getElementById('srCatatanKirimPopup');
    if(existing) existing.remove();
    var html = '<div id="srCatatanKirimPopup" style="position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);background:rgba(0,0,0,0);transition:background .2s ease;" onclick="if(event.target===this)document.getElementById(\'srCatatanKirimPopup\').remove();">'
      +'<div style="background:#fff;border-radius:14px;box-shadow:0 8px 40px rgba(0,0,0,.25);max-width:380px;width:100%;padding:20px;transform:scale(.93);opacity:0;transition:transform .22s cubic-bezier(.34,1.56,.64,1),opacity .18s ease;">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">'
      +'<div style="font-size:13px;font-weight:800;color:#2d3748;"><i class="fas fa-sticky-note" style="color:#e53e3e;margin-right:6px;"></i>Catatan Pengiriman</div>'
      +'<button onclick="document.getElementById(\'srCatatanKirimPopup\').remove()" style="border:none;background:none;cursor:pointer;font-size:18px;color:#718096;">&times;</button>'
      +'</div>'
      +'<div style="background:#fff5f5;border-left:3px solid #fc8181;border-radius:6px;padding:12px 14px;font-size:13px;color:#742a2a;line-height:1.6;white-space:pre-wrap;">'+cat.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>'
      +'</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    requestAnimationFrame(function(){
      var ov=document.getElementById('srCatatanKirimPopup');
      if(!ov) return;
      ov.style.background='rgba(0,0,0,.45)';
      var inner=ov.querySelector('div');
      if(inner){ inner.style.transform='scale(1)'; inner.style.opacity='1'; }
    });
  }

  function _rdcShowCatatanPopup(btn){
    var cat = btn.getAttribute('data-cat') || '';
    var pol = btn.getAttribute('data-pol') || '';
    var existing = document.getElementById('rdcCatatanSubPopup');
    if(existing) existing.remove();
    var html = '<div id="rdcCatatanSubPopup" style="position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);background:rgba(0,0,0,.4);" onclick="if(event.target===this)document.getElementById(\'rdcCatatanSubPopup\').remove();">'
      +'<div style="background:#fff;border-radius:14px;box-shadow:0 8px 40px rgba(0,0,0,.25);max-width:420px;width:100%;padding:20px;animation:fadeIn .2s ease;">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">'
      +'<div style="font-size:13px;font-weight:800;color:#2d3748;"><i class="fas fa-sticky-note" style="color:#e53e3e;margin-right:6px;"></i>Catatan — '+pol+'</div>'
      +'<button onclick="document.getElementById(\'rdcCatatanSubPopup\').remove()" style="border:none;background:none;cursor:pointer;font-size:18px;color:#718096;">&times;</button>'
      +'</div>'
      +'<div style="background:#fff5f5;border-left:3px solid #fc8181;border-radius:6px;padding:12px 14px;font-size:13px;color:#742a2a;line-height:1.6;">'+cat+'</div>'
      +'</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
  }

  function _rdcCloseRekapPopup(){
    var ov=document.getElementById('rdcRekapPopupOverlay');
    if(!ov) return;
    ov.style.transition='opacity .18s ease,backdrop-filter .18s ease,-webkit-backdrop-filter .18s ease';
    ov.style.opacity='0';
    ov.style.backdropFilter='blur(0px)';
    ov.style.webkitBackdropFilter='blur(0px)';
    var inner=ov.querySelector('div');
    if(inner){ inner.style.transition='transform .18s ease,opacity .18s ease'; inner.style.transform='scale(.95)'; inner.style.opacity='0'; }
    setTimeout(function(){ ov.remove(); },190);
  }

  function rdcShowRekapPopup(type, status){
    // Baca LANGSUNG dari array yang sudah dihitung + dedup di rdcRenderRekap — tidak hitung ulang.
    // Ini yang menjamin angka di kartu dan isi popup SELALU sama persis.
    var all=window._rdcRekapAll;
    if(!all || !all[type]) return;
    var srcList = all[type][status] || []; // status: 'ok' | 'notok'
    var list=[];
    var title='', cols=[];

    if(type==='sch'){
      list = srcList.map(function(r){
        return {no_pol:r.no_pol,ship_to:r.ship_to,sch_muat:r.sch_muat,sl_dt:r.sl_dt,delay:r.delay,catatan:r.catatan||''};
      });
      title='Schedule '+(status==='notok'?'NOT OK':'OK');
      cols=['No Pol','Ship To','Waktu Muat (SCH)','Start Loading','Delay',''];
    } else if(type==='load'){
      list = srcList.map(function(r){
        return {no_pol:r.no_pol,ship_to:r.ship_to,std:r.std,sl_dt:r.sl_dt,fl_dt:r.fl_dt,dur:r.durLoad,selisih:r.selisih,catatan:r.catatan||''};
      });
      title='Waktu Loading '+(status==='notok'?'NOT OK':'OK');
      cols=['No Pol','Ship To','STD Durasi','Start Loading','Finish Loading','Durasi (mnt)','Selisih (mnt)',''];
    } else {
      list = srcList.map(function(r){
        return {no_pol:r.no_pol,ship_to:r.ship_to,in_dt:r.in_dt,out_dt:r.out_dt,dur:r.durStay,catatan:r.catatan||''};
      });
      title='Waktu Stay '+(status==='notok'?'NOT OK':'OK');
      cols=['No Pol','Ship To','IN Loading','OUT Loading','Durasi IN/OUT',''];
    }

    if(!list.length){
      showToast('Tidak ada data untuk kategori ini','');
      return;
    }

    // Build popup HTML
    var color=status==='notok'?'#9b2c2c':'#276749';
    var bgH=status==='notok'?'#fff5f5':'#f0fff4';
    var tblH='<thead><tr>'+cols.map(function(c){
      return '<th style="padding:6px 10px;background:#f0f4f8;font-size:11px;font-weight:700;color:#4a5568;white-space:nowrap;border-bottom:1px solid #e2e8f0;">'+c+'</th>';
    }).join('')+'</tr></thead>';

    var rows=list.map(function(r,i){
      var cells=[];
      var hasCat = r.catatan && r.catatan.trim();
      var dotHtml = hasCat ? '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#e53e3e;margin-left:5px;vertical-align:middle;flex-shrink:0;" title="Ada catatan"></span>' : '';
      // No Pol dengan dot merah jika ada catatan
      var nopolCell = '<span style="display:flex;align-items:center;gap:4px;font-weight:700;">'+(r.no_pol||'—')+dotHtml+'</span>';
      if(type==='sch'){
        var delayStr=r.delay===null?'—':r.delay>0?_rdcFmtDur(r.delay):r.delay<0?('-'+_rdcFmtDur(Math.abs(r.delay))):'0';
        var delayColor=r.delay>0?'#856404':r.delay<0?'#276749':'#718096';
        cells=[nopolCell,r.ship_to,r.sch_muat||'—',r.sl_dt||'—',
          '<span style="font-weight:800;color:'+delayColor+'">'+delayStr+'</span>',
          hasCat?'<button onclick="_rdcShowCatatanPopup(this)" data-cat="'+r.catatan.replace(/"/g,'&quot;').replace(/'/g,'&#39;')+'" data-pol="'+r.no_pol+'" style="background:none;border:none;cursor:pointer;color:#e53e3e;font-size:13px;" title="Lihat catatan">&#x1F4DD;</button>':''];
      } else if(type==='load'){
        var selStr=r.selisih===null?'—':(r.selisih>0?'+':'')+r.selisih+' mnt';
        var selColor=r.selisih>0?'#9b2c2c':r.selisih<0?'#276749':'#718096';
        cells=[nopolCell,r.ship_to,r.std||'—',r.sl_dt||'—',r.fl_dt||'—',
          r.dur!==null?r.dur+' mnt':'—',
          '<span style="font-weight:800;color:'+selColor+'">'+selStr+'</span>',
          hasCat?'<button onclick="_rdcShowCatatanPopup(this)" data-cat="'+r.catatan.replace(/"/g,'&quot;').replace(/'/g,'&#39;')+'" data-pol="'+r.no_pol+'" style="background:none;border:none;cursor:pointer;color:#e53e3e;font-size:13px;" title="Lihat catatan">&#x1F4DD;</button>':''];
      } else {
        var durStr=r.dur!==null?_rdcFmtDur(r.dur):'—';
        cells=[nopolCell,r.ship_to,r.in_dt||'—',r.out_dt||'—',durStr,
          hasCat?'<button onclick="_rdcShowCatatanPopup(this)" data-cat="'+r.catatan.replace(/"/g,'&quot;').replace(/'/g,'&#39;')+'" data-pol="'+r.no_pol+'" style="background:none;border:none;cursor:pointer;color:#e53e3e;font-size:13px;" title="Lihat catatan">&#x1F4DD;</button>':''];
      }
      var bg=i%2===0?'#fff':'#f7fafc';
      return '<tr style="background:'+bg+';">'+cells.map(function(c){
        return '<td style="padding:5px 10px;font-size:12px;border-bottom:1px solid #f0f4f8;white-space:nowrap;">'+c+'</td>';
      }).join('')+'</tr>';
    }).join('');

    var OVL='rdcRekapPopupOverlay';
    var popupHtml='<div style="position:fixed;inset:0;background:rgba(0,0,0,0);backdrop-filter:blur(0px);-webkit-backdrop-filter:blur(0px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;transition:background .2s ease,backdrop-filter .2s ease,-webkit-backdrop-filter .2s ease;" id="'+OVL+'" onclick="if(event.target===this)_rdcCloseRekapPopup();">'
      +'<div style="background:#fff;border-radius:14px;box-shadow:0 8px 40px rgba(0,0,0,.2);max-width:900px;width:100%;max-height:80vh;display:flex;flex-direction:column;overflow:hidden;transform:scale(.93);opacity:0;transition:transform .22s cubic-bezier(.34,1.56,.64,1),opacity .18s ease;">'
      +'<div style="padding:14px 18px;background:'+bgH+';border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;">'
      +'<div style="font-size:14px;font-weight:800;color:'+color+';">'+title+' <span style="font-size:12px;font-weight:600;color:#718096;">('+list.length+' mobil)</span></div>'
      +'<button onclick="_rdcCloseRekapPopup()" style="border:none;background:none;cursor:pointer;font-size:18px;color:#718096;">&times;</button>'
      +'</div>'
      +'<div style="overflow:auto;flex:1;"><table style="width:100%;border-collapse:collapse;">'+tblH+'<tbody>'+rows+'</tbody></table></div>'
      +'</div></div>';

    var el=document.getElementById(OVL);
    if(el) el.remove();
    document.body.insertAdjacentHTML('beforeend',popupHtml);
    // Trigger animasi masuk
    requestAnimationFrame(function(){
      var ov=document.getElementById(OVL);
      if(!ov) return;
      ov.style.background='rgba(0,0,0,.45)';
      ov.style.backdropFilter='blur(6px)';
      ov.style.webkitBackdropFilter='blur(6px)';
      var inner=ov.querySelector('div');
      if(inner){ inner.style.transform='scale(1)'; inner.style.opacity='1'; }
    });
  }

    function rdcDownloadExcel(){
    if(!_rdcData||!_rdcData.length){ showToast('\u26a0 Belum ada data \u2014 klik Tampilkan dulu',''); return; }
    if(typeof XLSX==='undefined'){ showToast('\u26a0 Library Excel belum termuat, coba refresh halaman','err'); return; }
    var btn=document.getElementById('rdcBtnExcel');
    if(btn){ btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Membuat...'; }

    var fP =document.getElementById('rdcFilterPlant').value;
    var fST=document.getElementById('rdcFilterShipTo').value;
    var fd =document.getElementById('rdcFilterFrom').value||'';
    var ft =document.getElementById('rdcFilterTo').value||'';
    // Pakai fungsi bersama — supaya jumlah SELALU sama persis dengan tabel & kartu ringkasan di web
    var d = _rdcGetFilteredDeduped(fP, fST, fd, ft);
    d.sort(function(a,b){
      var da=a.in_dt?_rdcParseDT(a.in_dt):null, db=b.in_dt?_rdcParseDT(b.in_dt):null;
      if(!da&&!db) return 0; if(!da) return 1; if(!db) return -1;
      return da.getTime()-db.getTime();
    });
    if(!d.length){ showToast('\u26a0 Tidak ada data untuk didownload',''); if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-file-excel"></i> Download Excel';} return; }

    // Excel pakai nilai MENTAH persis seperti di web (dd-MMM-yy HH:mm:ss), tidak dipendekkan
    function fmtDtRawXl(s){
      if(!s||s==='&#8212;'||s==='-') return '-';
      return s;
    }

    var header1=['#','Ship to Name','EKSPEDISI','NO POL','JENIS MOBIL','ROUTE',
      'SCHEDULE','','STD DURASI (mnt)','LOADING','','','',
      'DELAY','DURASI LOADING (mnt)','SELISIH DURASI (mnt)','DURASI TOTAL IN/OUT',
      'KETERANGAN','',''];
    var header2=['','','','','','',
      'Waktu Muat','Waktu Selesai','','IN','Start Loading','Finish Loading','Out',
      '','','','',
      'SCHEDULE','WAKTU STAY','WAKTU LOADING'];

    var aoa=[header1, header2];

    d.forEach(function(r,i){
      var delayMin   =_rdcDtDiffSigned(r.sch_muat,r.sl_dt);
      var durMin     =_rdcDtDiffSigned(r.in_dt,r.out_dt);
      var durLoadMin =_rdcDtDiffSigned(r.sl_dt,r.fl_dt);
      var stdMnt     =r.std_durasi?parseInt(r.std_durasi):null;
      var selisihMin =(durLoadMin!==null&&stdMnt!==null&&!isNaN(stdMnt))?(durLoadMin-stdMnt):null;
      var sch        =_rdcKetSchedule(r);
      var stay       =_rdcKetWaktuStay(r);
      var loadOk     =(durLoadMin!==null&&stdMnt!==null&&!isNaN(stdMnt))?(durLoadMin<=stdMnt):null;

      aoa.push([
        i+1,
        r.ship_to||'-',
        r.ekspedisi||'-',
        r.no_pol||'-',
        r.jenis_mob||'-',
        r.route||'-',
        fmtDtRawXl(r.sch_muat),
        fmtDtRawXl(r.sch_selesai),
        r.std_durasi||'-',
        fmtDtRawXl(r.in_dt),
        fmtDtRawXl(r.sl_dt),
        fmtDtRawXl(r.fl_dt),
        fmtDtRawXl(r.out_dt),
        delayMin===null?'-':delayMin>0?_rdcFmtDur(delayMin):delayMin<0?'- '+_rdcFmtDur(Math.abs(delayMin)):'0',
        durLoadMin===null?'-':durLoadMin+' mnt',
        selisihMin===null?'-':selisihMin>0?'+'+selisihMin+' mnt':selisihMin+' mnt',
        durMin===null?'-':_rdcFmtDur(durMin),
        sch.label,
        stay.label,
        loadOk===null?'-':loadOk?'OK':'NOT OK'
      ]);
    });

    var ws=XLSX.utils.aoa_to_sheet(aoa);

    ws['!merges']=[
      {s:{r:0,c:0},e:{r:1,c:0}},
      {s:{r:0,c:1},e:{r:1,c:1}},
      {s:{r:0,c:2},e:{r:1,c:2}},
      {s:{r:0,c:3},e:{r:1,c:3}},
      {s:{r:0,c:4},e:{r:1,c:4}},
      {s:{r:0,c:5},e:{r:1,c:5}},
      {s:{r:0,c:6},e:{r:0,c:7}},
      {s:{r:0,c:8},e:{r:1,c:8}},
      {s:{r:0,c:9},e:{r:0,c:12}},
      {s:{r:0,c:13},e:{r:1,c:13}},
      {s:{r:0,c:14},e:{r:1,c:14}},
      {s:{r:0,c:15},e:{r:1,c:15}},
      {s:{r:0,c:16},e:{r:1,c:16}},
      {s:{r:0,c:17},e:{r:0,c:19}}
    ];

    // ── Lebar kolom — AUTO-FIT berdasarkan panjang karakter isi terpanjang per kolom ──
    var numCols = header1.length;
    var colWidths = new Array(numCols).fill(0);
    [header1, header2].forEach(function(hr){
      hr.forEach(function(v,ci){ colWidths[ci]=Math.max(colWidths[ci], String(v||'').length); });
    });
    for(var ai=2; ai<aoa.length; ai++){
      aoa[ai].forEach(function(v,ci){
        colWidths[ci]=Math.max(colWidths[ci], String(v===null||v===undefined?'':v).length);
      });
    }
    ws['!cols']=colWidths.map(function(len){
      var w=Math.max(6, Math.min(28, len+2));
      return {wch:w};
    });
    ws['!rows']=[{hpt:20},{hpt:20}];

    var range=XLSX.utils.decode_range(ws['!ref']);
    for(var R=0;R<=1;R++){
      for(var C=range.s.c;C<=range.e.c;C++){
        var addr=XLSX.utils.encode_cell({r:R,c:C});
        if(!ws[addr]) ws[addr]={t:'s',v:''};
        var isKet=C>=17;
        ws[addr].s={
          font:{bold:true,color:{rgb:isKet?'FFFFFF':'2D3748'}},
          fill:{fgColor:{rgb:isKet?'1A3A5C':'F0F4F8'}},
          alignment:{horizontal:'center',vertical:'center',wrapText:true},
          border:{top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'}}
        };
      }
    }
    for(var R2=2;R2<aoa.length;R2++){
      for(var C2=range.s.c;C2<=range.e.c;C2++){
        var addr2=XLSX.utils.encode_cell({r:R2,c:C2});
        if(!ws[addr2]) continue;
        ws[addr2].s={
          font:{sz:10},
          alignment:{horizontal:(C2===1?'left':'center'),vertical:'center'},
          fill: (R2%2===0) ? {fgColor:{rgb:'F7FAFC'}} : undefined,
          border:{top:{style:'thin',color:{rgb:'E2E8F0'}},bottom:{style:'thin',color:{rgb:'E2E8F0'}},
                  left:{style:'thin',color:{rgb:'E2E8F0'}},right:{style:'thin',color:{rgb:'E2E8F0'}}}
        };
      }
    }

    var wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,'Monitoring RDC');

    var ts=new Date();
    var tsStr=('0'+ts.getDate()).slice(-2)+('0'+(ts.getMonth()+1)).slice(-2)+ts.getFullYear()+
              '_'+('0'+ts.getHours()).slice(-2)+('0'+ts.getMinutes()).slice(-2);
    XLSX.writeFile(wb, 'Monitoring_RDC_'+tsStr+'.xlsx');

    if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-file-excel"></i> Download Excel'; }
  }

  function rdcDownloadPdf(){
    if(!_rdcData||!_rdcData.length){ showToast('\u26a0 Belum ada data \u2014 klik Tampilkan dulu',''); return; }
    var btn=document.getElementById('rdcBtnPdf');
    if(btn){ btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Membuat...'; }

    // Filter + dedup — pakai fungsi bersama supaya sama persis dengan tabel & kartu ringkasan di web
    var fP =document.getElementById('rdcFilterPlant').value;
    var fST=document.getElementById('rdcFilterShipTo').value;
    var fd =document.getElementById('rdcFilterFrom').value||'';
    var ft =document.getElementById('rdcFilterTo').value||'';
    var d = _rdcGetFilteredDeduped(fP, fST, fd, ft);
    d.sort(function(a,b){
      var da=a.in_dt?_rdcParseDT(a.in_dt):null, db=b.in_dt?_rdcParseDT(b.in_dt):null;
      if(!da&&!db) return 0; if(!da) return 1; if(!db) return -1;
      return da.getTime()-db.getTime();
    });
    if(!d.length){ showToast('\u26a0 Tidak ada data untuk didownload',''); if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-file-pdf"></i> Download PDF';} return; }

    var ts=new Date();
    var tsStr=('0'+ts.getDate()).slice(-2)+'-'+('0'+(ts.getMonth()+1)).slice(-2)+'-'+ts.getFullYear()+
              ' '+('0'+ts.getHours()).slice(-2)+':'+('0'+ts.getMinutes()).slice(-2);
    var judulFilter='Periode: '+(fd&&ft?fd+' s/d '+ft:'Semua')+
                    ' | Plant: '+(fP||'Semua')+' | Shipment: '+(fST||'Semua')+
                    ' | '+d.length+' DATA | Dicetak: '+tsStr;

    function ketBg(ok){ return ok===true?'background:#d1fae5;color:#065f46;':ok===false?'background:#fee2e2;color:#7f1d1d;':'color:#a0aec0;'; }

    var rowsHtml='';
    d.forEach(function(r,i){
      var delayMin   =_rdcDtDiffSigned(r.sch_muat,r.sl_dt);
      var durMin     =_rdcDtDiffSigned(r.in_dt,r.out_dt);
      var durLoadMin =_rdcDtDiffSigned(r.sl_dt,r.fl_dt);
      var stdMnt     =r.std_durasi?parseInt(r.std_durasi):null;
      var selisihMin =(durLoadMin!==null&&stdMnt!==null&&!isNaN(stdMnt))?(durLoadMin-stdMnt):null;
      var sch        =_rdcKetSchedule(r);
      var stay       =_rdcKetWaktuStay(r);
      var loadOk     =(durLoadMin!==null&&stdMnt!==null&&!isNaN(stdMnt))?(durLoadMin<=stdMnt):null;

      var dStyle=delayMin===null?'':delayMin>0?'color:#856404;font-weight:700;':delayMin<0?'color:#276749;font-weight:700;':'';
      var sStyle=selisihMin===null?'':selisihMin>0?'color:#9b2c2c;font-weight:700;':selisihMin<0?'color:#276749;font-weight:700;':'';
      var rowBg=i%2===0?'background:#f7fafc;':'';

      rowsHtml+='<tr>'+
        '<td style="text-align:center;'+rowBg+'">'+(i+1)+'</td>'+
        '<td style="'+rowBg+'">'+r.ship_to+'</td>'+
        '<td style="'+rowBg+'">'+r.ekspedisi+'</td>'+
        '<td style="font-weight:700;'+rowBg+'">'+r.no_pol+'</td>'+
        '<td style="'+rowBg+'">'+(r.route||'-')+'</td>'+
        '<td style="'+rowBg+'">'+(r.jenis_mob||'-')+'</td>'+
        '<td style="'+rowBg+'">'+fmtDtShort(r.sch_muat)+'</td>'+
        '<td style="'+rowBg+'">'+fmtDtShort(r.sch_selesai)+'</td>'+
        '<td style="text-align:center;'+rowBg+'">'+(r.std_durasi||'-')+'</td>'+
        '<td style="'+rowBg+'">'+fmtDtShort(r.in_dt)+'</td>'+
        '<td style="'+rowBg+'">'+fmtDtShort(r.sl_dt)+'</td>'+
        '<td style="'+rowBg+'">'+fmtDtShort(r.fl_dt)+'</td>'+
        '<td style="'+rowBg+'">'+fmtDtShort(r.out_dt)+'</td>'+
        '<td style="text-align:center;'+dStyle+rowBg+'">'+
          (delayMin===null?'-':delayMin>0?_rdcFmtDur(delayMin):delayMin<0?'- '+_rdcFmtDur(Math.abs(delayMin)):'0')+'</td>'+
        '<td style="text-align:center;'+rowBg+'">'+(durLoadMin===null?'-':durLoadMin+' mnt')+'</td>'+
        '<td style="text-align:center;'+sStyle+rowBg+'">'+
          (selisihMin===null?'-':selisihMin>0?'+'+selisihMin+' mnt':selisihMin+' mnt')+'</td>'+
        '<td style="text-align:center;'+rowBg+'">'+(durMin===null?'-':_rdcFmtDur(durMin))+'</td>'+
        '<td style="text-align:center;'+ketBg(sch.ok)+'">'+sch.label+'</td>'+
        '<td style="text-align:center;'+ketBg(stay.ok)+'">'+stay.label+'</td>'+
        '<td style="text-align:center;'+ketBg(loadOk)+'">'+(loadOk===null?'-':loadOk?'OK':'NOT OK')+'</td>'+
      '</tr>';
    });

    // Format datetime pendek untuk PDF: "13-Apr 08:15" (buang detik + tahun)
    function fmtDtShort(s){
      if(!s||s==='&#8212;'||s==='-') return '-';
      // dd-MMM-yy HH:mm:ss → dd-MMM HH:mm
      var m=s.match(/(\d{1,2}-[A-Za-z]{3})(?:-\d{2,4})?\s+(\d{2}:\d{2})/);
      if(m) return m[1]+' '+m[2];
      return s.replace(/:\d{2}$/, '').replace(/-\d{2,4}\s/,' ');
    }

    // ── Hitung lebar kolom PDF secara dinamis berdasarkan panjang konten terpanjang ──
    var pdfColLabels=['#','Ship to Name','Ekspedisi','No Pol','Route','Jenis Mobil',
      'Waktu Muat','Waktu Selesai','STD Dur','IN','Start Loading','Finish Loading','Out',
      'Delay','Dur Load','Selisih','Dur Total','Schedule','Waktu Stay','Waktu Loading'];
    var pdfColGetters=[
      function(r,i){return String(i+1);},
      function(r){return r.ship_to||'';},
      function(r){return r.ekspedisi||'';},
      function(r){return r.no_pol||'';},
      function(r){return r.route||'-';},
      function(r){return r.jenis_mob||'-';},
      function(r){return fmtDtShort(r.sch_muat);},
      function(r){return fmtDtShort(r.sch_selesai);},
      function(r){return String(r.std_durasi||'-');},
      function(r){return fmtDtShort(r.in_dt);},
      function(r){return fmtDtShort(r.sl_dt);},
      function(r){return fmtDtShort(r.fl_dt);},
      function(r){return fmtDtShort(r.out_dt);},
      function(r){var v=_rdcDtDiffSigned(r.sch_muat,r.sl_dt);return v===null?'-':v>0?_rdcFmtDur(v):v<0?'- '+_rdcFmtDur(Math.abs(v)):'0';},
      function(r){var v=_rdcDtDiffSigned(r.sl_dt,r.fl_dt);return v===null?'-':v+' mnt';},
      function(r){
        var dl=_rdcDtDiffSigned(r.sl_dt,r.fl_dt), sd=r.std_durasi?parseInt(r.std_durasi):null;
        var v=(dl!==null&&sd!==null&&!isNaN(sd))?(dl-sd):null;
        return v===null?'-':v>0?'+'+v+' mnt':v+' mnt';
      },
      function(r){var v=_rdcDtDiffSigned(r.in_dt,r.out_dt);return v===null?'-':_rdcFmtDur(v);},
      function(r){return _rdcKetSchedule(r).label;},
      function(r){return _rdcKetWaktuStay(r).label;},
      function(r){
        var dl=_rdcDtDiffSigned(r.sl_dt,r.fl_dt), sd=r.std_durasi?parseInt(r.std_durasi):null;
        var ok=(dl!==null&&sd!==null&&!isNaN(sd))?(dl<=sd):null;
        return ok===null?'-':ok?'OK':'NOT OK';
      }
    ];
    var pdfCharLen=pdfColLabels.map(function(lbl){ return lbl.length; });
    d.forEach(function(r,i){
      pdfColGetters.forEach(function(fn,ci){
        var len=String(fn(r,i)||'').length;
        if(len>pdfCharLen[ci]) pdfCharLen[ci]=len;
      });
    });
    var mmPerChar=1.55, minMm=8;
    var rawMm=pdfCharLen.map(function(len){ return Math.max(minMm, len*mmPerChar+3); });
    var totalRaw=rawMm.reduce(function(a,b){return a+b;},0);
    var targetTotal=380;
    var scale=targetTotal/totalRaw;
    var pdfColMm=rawMm.map(function(w){ return Math.round(w*scale*10)/10; });

    var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Monitoring RDC</title>'+
      '<style>'+
        '@page{size:A3 landscape;margin:5mm 7mm;}'+
        '*{box-sizing:border-box;}'+
        'body{font-family:Arial,sans-serif;font-size:6px;color:#1a202c;margin:0;padding:5px 0 0 0;}'+
        '.ttl{font-size:10px;font-weight:800;color:#0f2027;margin:0 0 1px 0;}'+
        '.sub{font-size:5.5px;color:#555;margin:0 0 4px 0;}'+
        'table{width:100%;border-collapse:collapse;table-layout:fixed;}'+
        'thead th{background:#2c5364;color:#fff;padding:2px 2px;border:1px solid #1a3a4c;'+
          'font-weight:700;text-align:center;-webkit-print-color-adjust:exact;'+
          'print-color-adjust:exact;font-size:5.5px;line-height:1.2;overflow:hidden;}'+
        'thead th.ket{background:#1a3a5c;-webkit-print-color-adjust:exact;print-color-adjust:exact;}'+
        'tbody td{padding:1px 2px;border:1px solid #e2e8f0;vertical-align:middle;'+
          'overflow:hidden;font-size:6px;line-height:1.3;}'+
        'tbody tr:nth-child(even) td{background:#f7fafc;}'+
        '@media print{html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}'+
      '</style></head><body>'+
      '<div class="ttl">Monitoring RDC</div>'+
      '<div class="sub">'+judulFilter+'</div>'+
      '<table>'+
        '<colgroup>'+
          pdfColMm.map(function(w){ return '<col style="width:'+w+'mm">'; }).join('')+
        '</colgroup>'+
        '<thead>'+
          '<tr>'+
            '<th rowspan="2">#</th>'+
            '<th rowspan="2">Ship to Name</th>'+
            '<th rowspan="2">EKSPEDISI</th>'+
            '<th rowspan="2">NO POL</th>'+
            '<th rowspan="2">ROUTE</th>'+
            '<th rowspan="2">JENIS MOBIL</th>'+
            '<th colspan="2">SCHEDULE</th>'+
            '<th rowspan="2">STD<br>DUR<br>(mnt)</th>'+
            '<th colspan="4">LOADING</th>'+
            '<th rowspan="2">DELAY</th>'+
            '<th rowspan="2">DUR<br>LOAD<br>(mnt)</th>'+
            '<th rowspan="2">SELISIH<br>DUR<br>(mnt)</th>'+
            '<th rowspan="2">DUR<br>TOTAL</th>'+
            '<th colspan="3" class="ket">KETERANGAN</th>'+
          '</tr>'+
          '<tr>'+
            '<th>Waktu Muat</th><th>Waktu Selesai</th>'+
            '<th>IN</th><th>Start Loading</th><th>Finish Loading</th><th>Out</th>'+
            '<th class="ket">SCHEDULE</th><th class="ket">WAKTU STAY</th><th class="ket">WAKTU LOADING</th>'+
          '</tr>'+
        '</thead>'+
        '<tbody>'+rowsHtml+'</tbody>'+
      '</table>'+
      '<script>window.onload=function(){window.print();};<\/script>'+
      '</body></html>';

    var w=window.open('','_blank');
    if(w){ w.document.open(); w.document.write(html); w.document.close(); }
    else { showToast('\u26a0 Popup diblokir. Izinkan popup untuk halaman ini.','err'); }
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-file-pdf"></i> Download PDF'; }
  }

  // =============================================
  // RDC DETAIL POPUP
  // =============================================
  var _rdcPopupRow = null; // simpan data baris yg diklik

  function rdcOpenPopup(r){
    _rdcPopupRow = r;
    // Isi info grid
    document.getElementById('rdcPopupShipTo').textContent   = r.ship_to    || '-';
    document.getElementById('rdcPopupNoPol').textContent    = r.no_pol     || '-';
    document.getElementById('rdcPopupEkspedisi').textContent= r.ekspedisi  || '-';
    document.getElementById('rdcPopupSl').textContent       = r.sl_dt || '-';
    var existingCatatan = r.catatan || '';
    document.getElementById('rdcCatatanInput').value = existingCatatan;
    // Tunjukkan border hijau kalau catatan sudah ada
    document.getElementById('rdcCatatanInput').style.borderColor = existingCatatan ? '#27ae60' : '';
    document.getElementById('rdcCatatanInput').style.borderWidth = existingCatatan ? '2px' : '';

    // Reset border warna textarea saat fokus
    var ta = document.getElementById('rdcCatatanInput');
    ta.addEventListener('input', function(){
      this.style.borderColor = '';
      this.style.borderWidth = '';
    }, {once:true});

    // Reset TIM sementara loading
    document.getElementById('rdcPopupTim').textContent      = '...';
    document.getElementById('rdcPopupShiftInfo').textContent= 'Memuat...';

    // Tampilkan popup
    var overlay = document.getElementById('rdcDetailOverlay');
    overlay.classList.add('show');

    // Ambil TIM dari GAS
    if(true){
      google.script.run
        .withSuccessHandler(function(res){
          if(res && res.success){
            document.getElementById('rdcPopupTim').textContent = res.tim || '-';
            var shiftLabel = res.shift==='1'?'Shift 1 (07:00-14:59)':
                             res.shift==='2'?'Shift 2 (15:00-22:59)':
                             res.shift==='3'?'Shift 3 (23:00-06:59)':'-';
            document.getElementById('rdcPopupShiftInfo').textContent = shiftLabel + ' | ' + (res.tanggal||'');
          } else {
            document.getElementById('rdcPopupTim').textContent = '-';
            document.getElementById('rdcPopupShiftInfo').textContent = 'Data tidak ditemukan';
          }
        })
        .withFailureHandler(function(){
          document.getElementById('rdcPopupTim').textContent = '-';
          document.getElementById('rdcPopupShiftInfo').textContent = 'Gagal memuat';
        })
        .getRdcTim(r.sl_dt, '');
    } else {
      // Preview mode — ekstrak jam dari sl_dt untuk hitung shift lokal
      var shift = '-';
      if(r.sl_dt){
        var slM=r.sl_dt.match(/(\d{1,2}):(\d{2})/);
        if(slM){ var h=parseInt(slM[1]); shift=(h>=7&&h<=14)?'1':(h>=15&&h<=22)?'2':'3'; }
      }
      var shiftLabel = shift==='1'?'Shift 1 (07:00-14:59)':
                       shift==='2'?'Shift 2 (15:00-22:59)':
                       shift==='3'?'Shift 3 (23:00-06:59)':'-';
      document.getElementById('rdcPopupTim').textContent = 'Tim ' + shift + ' (preview)';
      document.getElementById('rdcPopupShiftInfo').textContent = shiftLabel;
    }
  }

  function rdcClosePopup(e, force){
    if(!force && e && e.target !== document.getElementById('rdcDetailOverlay')) return;
    document.getElementById('rdcDetailOverlay').classList.remove('show');
    _rdcPopupRow = null;
  }

  function rdcSaveCatatan(){
    if(!_rdcPopupRow) return;
    var catatan = document.getElementById('rdcCatatanInput').value.trim();
    var btn = document.getElementById('rdcCatatanSaveBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:5px;"></i>Menyimpan...';

    if(true){
      google.script.run
        .withSuccessHandler(function(res){
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-save" style="margin-right:5px;"></i>Simpan Catatan';
          if(res && res.success){
            showToast('\u2713 Catatan disimpan','');
            _rdcPopupRow.catatan = catatan;
            document.getElementById('rdcDetailOverlay').classList.remove('show');
          } else {
            showToast('\u2716 '+(res?res.message:'Gagal'),'err');
          }
        })
        .withFailureHandler(function(err){
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-save" style="margin-right:5px;"></i>Simpan Catatan';
          showToast('\u2716 Error: '+err.message,'err');
        })
        .saveRdcCatatan({docno:_rdcPopupRow.docno, no_pol:_rdcPopupRow.no_pol, catatan:catatan});
    } else {
      // Preview
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save" style="margin-right:5px;"></i>Simpan Catatan';
      showToast('\u2713 Catatan disimpan (preview)','');
      _rdcPopupRow.catatan = catatan;
      document.getElementById('rdcDetailOverlay').classList.remove('show');
    }
  }


  // ============================================================
  // PATTERN LOCK — Riwayat Stock Opname
  // ============================================================
  var _PATTERN_KEY    = 'opname_pattern_v1';
  var _PATTERN_PW     = 'GDFG1234';

  function _psClose(){
    document.getElementById('patternSettingOverlay').classList.remove('show');
    _psNewSeq1=[]; _psNewSeq2=[]; _psNewPhase=1;
    _psNewReset();
  }

  function _psCheckPassword(){
    var pw = document.getElementById('psettingPwInput').value;
    if(pw === _PATTERN_PW){
      document.getElementById('psettingErr').textContent='';
      document.getElementById('psStep1').classList.remove('active');
      document.getElementById('psStep2').classList.add('active');
    } else {
      document.getElementById('psettingErr').textContent='Password salah.';
      document.getElementById('psettingPwInput').select();
    }
  }

  function _psGoSetNew(){
    document.getElementById('psStep2').classList.remove('active');
    document.getElementById('psStep3').classList.add('active');
    _psNewSeq1=[]; _psNewSeq2=[]; _psNewPhase=1;
    _psNewReset();
    document.getElementById('psStep3Hint').textContent='Gambar pola baru Anda (min. 4 titik)';
    document.getElementById('psettingHint').textContent='Gambar pola di atas';
    _psBindNewDots();
  }

  function _psRemovePattern(){
    _patternClear();
    _psClose();
    showToast('✓ Pola dihapus — Riwayat tidak terkunci','');
  }

  var _psNewDragging = false;
  var _psNewSeqCurrent = [];

  function _psNewReset(){
    _psNewSeqCurrent=[];
    document.querySelectorAll('#psettingNewDots .psnewdot').forEach(function(d){ d.classList.remove('active'); });
    document.getElementById('psNewSvg').innerHTML='';
  }

  function _psNewGetCenter(i){
    var wrap = document.getElementById('psNewDotsWrap');
    var dot  = document.querySelectorAll('#psettingNewDots .psnewdot')[i];
    if(!dot||!wrap) return {x:0,y:0};
    var wr=wrap.getBoundingClientRect(), dr=dot.getBoundingClientRect();
    return {x:dr.left+dr.width/2-wr.left, y:dr.top+dr.height/2-wr.top};
  }

  function _psNewDrawLines(seq, curX, curY){
    var svg = document.getElementById('psNewSvg');
    var wrap= document.getElementById('psNewDotsWrap');
    if(!svg||!wrap) return;
    svg.style.width=wrap.offsetWidth+'px'; svg.style.height=wrap.offsetHeight+'px';
    var lines='';
    for(var i=1;i<seq.length;i++){
      var a=_psNewGetCenter(seq[i-1]),b=_psNewGetCenter(seq[i]);
      lines+='<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="#3182ce" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>';
    }
    if(seq.length&&curX!==undefined){
      var last=_psNewGetCenter(seq[seq.length-1]);
      var wr=wrap.getBoundingClientRect();
      lines+='<line x1="'+last.x+'" y1="'+last.y+'" x2="'+(curX-wr.left)+'" y2="'+(curY-wr.top)+'" stroke="#3182ce" stroke-width="2" stroke-linecap="round" opacity=".4" stroke-dasharray="4"/>';
    }
    svg.innerHTML=lines;
  }

  function _psBindNewDots(){
    var dots = document.querySelectorAll('#psettingNewDots .psnewdot');
    var wrap = document.getElementById('psNewDotsWrap');

    function startDot(i){ if(_psNewSeqCurrent.indexOf(i)<0){ _psNewSeqCurrent.push(i); dots[i].classList.add('active'); _psNewDrawLines(_psNewSeqCurrent); } }
    function hitTest(cx,cy){
      dots.forEach(function(d){
        var r=d.getBoundingClientRect(), i=parseInt(d.dataset.i);
        if(cx>=r.left&&cx<=r.right&&cy>=r.top&&cy<=r.bottom&&_psNewSeqCurrent.indexOf(i)<0){ _psNewSeqCurrent.push(i); d.classList.add('active'); }
      });
      _psNewDrawLines(_psNewSeqCurrent,cx,cy);
    }

    dots.forEach(function(d){
      d.addEventListener('mousedown',function(e){ e.preventDefault(); _psNewDragging=true; startDot(parseInt(d.dataset.i)); });
      d.addEventListener('touchstart',function(e){ e.preventDefault(); _psNewDragging=true; startDot(parseInt(d.dataset.i)); },{passive:false});
    });
    wrap.addEventListener('mousemove',function(e){ if(!_psNewDragging)return; hitTest(e.clientX,e.clientY); });
    wrap.addEventListener('touchmove',function(e){ e.preventDefault(); if(!_psNewDragging)return; var t=e.touches[0]; hitTest(t.clientX,t.clientY); },{passive:false});

    function endDraw(){
      if(!_psNewDragging)return; _psNewDragging=false;
      if(_psNewSeqCurrent.length<4){ document.getElementById('psettingHint').textContent='Min. 4 titik, ulangi'; _psNewReset(); return; }
      if(_psNewPhase===1){
        _psNewSeq1 = _psNewSeqCurrent.slice();
        _psNewPhase = 2;
        _psNewReset();
        document.getElementById('psStep3Hint').textContent='Konfirmasi pola';
        document.getElementById('psettingHint').textContent='Gambar ulang pola yang sama';
      } else {
        _psNewSeq2 = _psNewSeqCurrent.slice();
        if(JSON.stringify(_psNewSeq1)===JSON.stringify(_psNewSeq2)){
          _patternSave(_psNewSeq1);
          _psClose();
          showToast('✓ Pola berhasil disimpan','');
        } else {
          document.getElementById('psettingHint').textContent='✗ Pola tidak cocok, mulai ulang';
          _psNewSeq1=[]; _psNewSeq2=[]; _psNewPhase=1;
          setTimeout(function(){ _psNewReset(); document.getElementById('psStep3Hint').textContent='Gambar pola baru Anda (min. 4 titik)'; document.getElementById('psettingHint').textContent='Gambar pola di atas'; }, 800);
        }
      }
    }
    document.addEventListener('mouseup',endDraw);
    document.addEventListener('touchend',endDraw);
  }

  function _psResetNew(){ _psNewSeq1=[]; _psNewSeq2=[]; _psNewPhase=1; _psNewReset(); document.getElementById('psStep3Hint').textContent='Gambar pola baru Anda (min. 4 titik)'; document.getElementById('psettingHint').textContent='Gambar pola di atas'; }

  // Init pattern events on load
  function sjToggleSSMenu(){
    var menu=document.getElementById('sjSSMenu');
    if(!menu)return;
    var isOpen=menu.style.display!=='none';
    menu.style.display=isOpen?'none':'block';
  }
  // Tutup dropdown saat klik di luar
  document.addEventListener('click',function(e){
    var wrap=document.getElementById('sjSSDropWrap');
    var menu=document.getElementById('sjSSMenu');
    if(menu&&wrap&&!wrap.contains(e.target)) menu.style.display='none';
  });

  // =============================================
  // STOCK JALUR PAGE
  // =============================================
  var _sjZoom=100, _soZoom=100, _sjActiveTab='input';
  var _sjSel={r1:-1,c1:-1,r2:-1,c2:-1}, _sjDragging=false;
  var _soSel={r1:-1,c1:-1,r2:-1,c2:-1}, _soDragging=false;
  var _sjInitDone=false;
  var _srCurrentSheet=''; // sheet name aktif untuk edit rekap
  var _srCurrentSsUrl=''; // ssUrl aktif untuk edit rekap

  var SJ_COLS=['prodate','sku','nama','qty','shift','plant','catatan','status'];
  var SO_COLS=['prodate','sku','nama','qty','tglkeluar','nomobil','nodo','tujuan','plant','catatan','status'];
  // STATUS saja yang auto (tidak bisa diedit) — NAMA BARANG bisa diedit
  var SJ_AUTO={'status':true};
  var SO_AUTO={'status':true};

  function _sjFallbackCopy(text){
    var ta=document.createElement('textarea');
    ta.value=text; ta.style.cssText='position:fixed;top:0;left:0;width:2px;height:2px;opacity:0;';
    document.body.appendChild(ta); ta.focus(); ta.select();
    try{ document.execCommand('copy'); }catch(ex){}
    document.body.removeChild(ta);
  }
  function _sjRawText(td){ return td?(td.textContent||'').trim():''; }

  function _sjApplyShiftBadge(td){
    var v=_sjRawText(td); td.innerHTML=''; if(!v)return;
    var cls={'1':'sj-shift-1','2':'sj-shift-2','3':'sj-shift-3'}[v];
    if(cls){var s=document.createElement('span');s.className=cls;s.textContent='Shift '+v;td.appendChild(s);}else td.textContent=v;
  }
  function _sjApplyPlantBadge(td,pfx){
    var v=_sjRawText(td); td.innerHTML=''; if(!v)return;
    var p=pfx||'sj';
    var cls={'1111':p+'-plant-1111','1112':p+'-plant-1112','1113':p+'-plant-1113'}[v];
    if(cls){var s=document.createElement('span');s.className=cls;s.textContent=v;td.appendChild(s);}else td.textContent=v;
  }
  function _sjApplyStatusBadge(td,pfx){
    var v=_sjRawText(td); td.innerHTML=''; if(!v)return;
    var p=pfx||'sj';
    var cls=v==='DONE'?p+'-status-done':(v.indexOf('Error')>=0||v.indexOf('kurang')>=0?p+'-status-error':'so-status-warn');
    var s=document.createElement('span');s.className=cls;s.textContent=v;td.appendChild(s);
  }

  // Lookup nama — pakai _opnameNamaMap (shared), hanya auto-fill jika sel masih kosong
  function _sjGetNama(sku){
    if(typeof _opnameNamaMap!=='undefined'&&_opnameNamaMap[sku]) return _opnameNamaMap[sku];
    if(typeof _skuNamaMap!=='undefined'&&_skuNamaMap[sku]) return _skuNamaMap[sku];
    return null;
  }
  var _sjStdLoading = false;   // sedang load STD
  var _sjStdLoaded  = false;   // sudah selesai load
  var _sjPendingLookup = [];   // [{tr, namaCol}] yang menunggu data

  function _sjLookupSku(tr, namaCol){
    var st=tr.querySelector('[data-col="sku"]');
    var nt=tr.querySelector('[data-col="'+(namaCol||'nama')+'"]');
    if(!st||!nt) return;
    var sku=_sjRawText(st);
    if(!sku){ nt.textContent=''; nt.style.color=''; return; }
    // Hanya auto-fill jika sel nama masih kosong
    if(_sjRawText(nt)) return;

    var nama=_sjGetNama(sku);
    if(nama){
      nt.textContent=nama; nt.style.color='#2d3748'; return;
    }

    // Nama tidak ditemukan di map lokal
    if(_sjStdLoaded){
      // Data sudah ada tapi SKU benar-benar tidak ada
      nt.textContent='\u26a0\ufe0f Tidak terdaftar'; nt.style.color='#e53e3e';
      return;
    }

    // Data belum ada — queue dan load kalau belum loading
    nt.textContent='\u23f3 Mencari...'; nt.style.color='#a0aec0';
    _sjPendingLookup.push({tr:tr, namaCol:namaCol||'nama'});

    if(!_sjStdLoading){
      _sjStdLoading=true;
      google.script.run
        .withSuccessHandler(function(res){
          _sjStdLoading=false;
          _sjStdLoaded=true;
          if(res&&res.success&&res.data) res.data.forEach(function(r){
            if(r.sku){
              var sk=String(r.sku).trim();
              if(typeof _opnameNamaMap!=='undefined') _opnameNamaMap[sk]=_opnameNamaMap[sk]||r.nama||'';
              if(typeof _skuNamaMap!=='undefined')    _skuNamaMap[sk]   =_skuNamaMap[sk]   ||r.nama||'';
            }
          });
          // Retry semua yang pending
          var pending=_sjPendingLookup.splice(0);
          pending.forEach(function(p){
            var st2=p.tr.querySelector('[data-col="sku"]');
            var nt2=p.tr.querySelector('[data-col="'+p.namaCol+'"]');
            if(!st2||!nt2) return;
            var sku2=_sjRawText(st2);
            var nama2=_sjGetNama(sku2);
            if(nama2){ nt2.textContent=nama2; nt2.style.color='#2d3748'; }
            else { nt2.textContent='\u26a0\ufe0f Tidak terdaftar'; nt2.style.color='#e53e3e'; }
          });
        })
        .withFailureHandler(function(){
          _sjStdLoading=false; _sjStdLoaded=true;
          var pending=_sjPendingLookup.splice(0);
          pending.forEach(function(p){
            var nt2=p.tr.querySelector('[data-col="'+p.namaCol+'"]');
            if(nt2){ nt2.textContent='\u26a0\ufe0f Tidak terdaftar'; nt2.style.color='#e53e3e'; }
          });
        })
        .getStandarPalet();
    }
  }

  function _sjTrIdx(tbody,tr){ return Array.from(tbody.querySelectorAll('tr')).indexOf(tr); }
  function _sjTcIdx(cols,td){ return cols.indexOf(td.dataset.col||''); }

  function sjSwitchTab(tab){
    if(_sjActiveTab===tab)return; _sjActiveTab=tab;
    var panes={input:'sjInputPane',output:'sjOutputPane',rekap:'sjRekapPane'};
    var btns={input:'btnSjInput',output:'btnSjOutput',rekap:'btnSjRekap'};
    // Sembunyikan semua pane dengan animasi fade
    var curPane=document.getElementById(panes[_sjActiveTab==='input'?'input':_sjActiveTab]);
    // Cari pane yang sedang tampil
    var curId=null;
    ['input','output','rekap'].forEach(function(t){
      var p=document.getElementById(panes[t]);
      if(p&&p.style.display!=='none')curId=panes[t];
    });
    var cur=curId?document.getElementById(curId):null;
    var tgt=document.getElementById(panes[tab]);
    if(!tgt)return;
    _sjActiveTab=tab;
    // Update tombol aktif
    Object.keys(btns).forEach(function(t){
      var b=document.getElementById(btns[t]);
      if(b)b.style.background=t===tab?'rgba(255,255,255,.38)':'rgba(255,255,255,.18)';
    });
    if(cur&&cur!==tgt){
      cur.style.transition='opacity .18s ease,transform .18s ease';
      cur.style.opacity='0'; cur.style.transform='translateX(-24px)';
      setTimeout(function(){
        cur.style.display='none'; cur.style.transition=cur.style.opacity=cur.style.transform='';
        _sjShowPane(tgt);
      },180);
    } else {
      _sjShowPane(tgt);
    }
  }
  function _sjShowPane(tgt){
    tgt.style.display=''; tgt.style.opacity='0'; tgt.style.transform='translateX(24px)';
    void tgt.offsetWidth;
    tgt.style.transition='opacity .18s ease,transform .18s ease';
    tgt.style.opacity='1'; tgt.style.transform='translateX(0)';
    setTimeout(function(){tgt.style.transition='';},200);
  }
