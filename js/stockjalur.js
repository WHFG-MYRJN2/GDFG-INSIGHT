function sjInitPage(){
    var bi=document.getElementById('btnSjInput'),bo=document.getElementById('btnSjOutput'),br=document.getElementById('btnSjRekap');
    if(bi)bi.style.background='rgba(255,255,255,.38)';
    if(bo)bo.style.background='rgba(255,255,255,.18)';
    if(br)br.style.background='rgba(255,255,255,.18)';
    _sjActiveTab='input';
    document.getElementById('sjInputPane').style.display='';
    document.getElementById('sjOutputPane').style.display='none';
    document.getElementById('sjRekapPane').style.display='none';
    if(!document.getElementById('sjTbody').children.length)sjInitRows(30);
    if(!document.getElementById('soTbody').children.length)soInitRows(30);
    if(!_sjInitDone){
      var hasData=typeof _opnameNamaMap!=='undefined'&&Object.keys(_opnameNamaMap).length>0;
      if(hasData)_sjInitDone=true;
    }
  }

  // ── INPUT tabel ───────────────────────────────────────────────
  function _sjClearSel(){
    document.querySelectorAll('#sjTbl .sj-sel').forEach(function(el){el.classList.remove('sj-sel');});
    _sjSel={r1:-1,c1:-1,r2:-1,c2:-1};
    var info=document.getElementById('sjSelInfo');if(info)info.textContent='';
  }
  function _sjApplySel(){
    document.querySelectorAll('#sjTbl .sj-sel').forEach(function(el){el.classList.remove('sj-sel');});
    var tbody=document.getElementById('sjTbody');if(!tbody)return;
    var trs=Array.from(tbody.querySelectorAll('tr'));
    var r1=Math.min(_sjSel.r1,_sjSel.r2),r2=Math.max(_sjSel.r1,_sjSel.r2);
    var c1=Math.min(_sjSel.c1,_sjSel.c2),c2=Math.max(_sjSel.c1,_sjSel.c2);
    if(r1<0||c1<0)return;
    for(var r=r1;r<=r2;r++){if(!trs[r])continue;for(var ci=c1;ci<=c2;ci++){var td=trs[r].querySelector('[data-col="'+SJ_COLS[ci]+'"]');if(td)td.classList.add('sj-sel');}}
    var info=document.getElementById('sjSelInfo');if(info)info.textContent=(r2-r1+1)+'R \u00d7 '+(c2-c1+1)+'K  (Ctrl+C copy)';
  }
  function _sjCopyBlock(){
    var tbody=document.getElementById('sjTbody');if(!tbody)return;
    var trs=Array.from(tbody.querySelectorAll('tr'));
    var r1=Math.min(_sjSel.r1,_sjSel.r2),r2=Math.max(_sjSel.r1,_sjSel.r2);
    var c1=Math.min(_sjSel.c1,_sjSel.c2),c2=Math.max(_sjSel.c1,_sjSel.c2);
    if(r1<0||c1<0){showToast('Tidak ada selection','error');return;}
    var lines=[];
    for(var r=r1;r<=r2;r++){if(!trs[r])continue;var cells=[];for(var ci=c1;ci<=c2;ci++){var td=trs[r].querySelector('[data-col="'+SJ_COLS[ci]+'"]');cells.push(td?td.textContent.trim():'');}lines.push(cells.join('\t'));}
    var text=lines.join('\n');
    // Jalankan fallback synchronous dulu (masih dalam user gesture), lalu coba clipboard API
    _sjFallbackCopy(text);
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).catch(function(){});
    }
    showToast('\uD83D\uDCCB '+(r2-r1+1)+' baris disalin','success');
  }
  // Evaluasi rumus =expr di kolom qty (=22+44+34 → 100)
  function _sjSoEvalFormula(td){
    var txt = (td.textContent||'').trim();
    if(!txt || txt.charAt(0) !== '=') return;
    var expr = txt.slice(1)
                  .replace(/,/g, '.')
                  .replace(/[^0-9.+\-*/()\s]/g, '');
    if(!expr) return;
    try{
      var result = Function('"use strict"; return (' + expr + ')')();
      if(typeof result === 'number' && isFinite(result)){
        td.textContent = (result % 1 === 0)
          ? String(Math.round(result))
          : parseFloat(result.toFixed(6)).toString();
      }
    }catch(ex){}
  }

  // Evaluasi rumus =expr di kolom qty (=22+44+34 → 100)
  function _sjSoEvalFormula(td){
    var txt=(td.textContent||'').trim();
    if(!txt||txt.charAt(0)!=='=') return;
    var expr=txt.slice(1).replace(/,/g,'.').replace(/[^0-9.+\-*/()\s]/g,'');
    if(!expr) return;
    try{
      var result=Function('"use strict"; return ('+expr+')')();
      if(typeof result==='number'&&isFinite(result)){
        td.textContent=(result%1===0)?String(Math.round(result)):parseFloat(result.toFixed(6)).toString();
      }
    }catch(ex){}
  }

    function sjInitRows(n){var t=document.getElementById('sjTbody');if(!t)return;t.innerHTML='';for(var i=0;i<n;i++)_sjAppendRow();_sjRenumber();_sjUpdateTotals();_sjBindEvents();}
  function sjAddRows(n){for(var i=0;i<n;i++)_sjAppendRow();_sjRenumber();_sjBindEvents();}
  function _sjAppendRow(v){
    v=v||{}; var tbody=document.getElementById('sjTbody');if(!tbody)return;
    var tr=document.createElement('tr');
    var no=document.createElement('td');no.className='row-no sj-rnum';tr.appendChild(no);
    SJ_COLS.forEach(function(k){
      var td=document.createElement('td');td.dataset.col=k;
      var isAuto=SJ_AUTO[k],isNum=(k==='qty'),isCenter=(k==='shift'||k==='plant'||k==='status');
      td.className='sj-td'+(isAuto?' sj-auto':'')+(isNum?' td-num':'')+(isCenter?' td-center':'');
      if(v[k])td.textContent=v[k];
      if(!isAuto){td.contentEditable='true';td.spellcheck=false;}
      tr.appendChild(td);
    });
    var dt=document.createElement('td');dt.style.cssText='padding:2px 4px;border:1px solid #e8edf2;';
    var db=document.createElement('button');db.className='sj-del-btn';db.innerHTML='<i class="fas fa-times"></i>';
    db.onclick=function(){tr.remove();_sjRenumber();_sjUpdateTotals();}; dt.appendChild(db);tr.appendChild(dt);
    tbody.appendChild(tr);
  }
  function _sjRenumber(){
    var rows=document.querySelectorAll('#sjTbody tr');
    rows.forEach(function(r,i){var c=r.querySelector('.sj-rnum');if(c)c.textContent=i+1;});
    var el=document.getElementById('sjRowCount');if(el)el.textContent=rows.length+' BARIS';
  }
  function _sjUpdateTotals(){
    var rows=document.querySelectorAll('#sjTbody tr'),skus={},qty=0,filled=0,p1=0,p2=0,p3=0;
    rows.forEach(function(r){
      var sku=_sjRawText(r.querySelector('[data-col="sku"]'));
      var q=parseFloat(_sjRawText(r.querySelector('[data-col="qty"]'))||0)||0;
      var plant=_sjRawText(r.querySelector('[data-col="plant"]'));
      if(sku){skus[sku]=true;filled++;} qty+=q;
      if(plant==='1111')p1++; else if(plant==='1112')p2++; else if(plant==='1113')p3++;
    });
    var s=function(id,v){var el=document.getElementById(id);if(el)el.textContent=v;};
    s('sjTotSku',Object.keys(skus).length);s('sjTotQty',qty.toLocaleString('id-ID'));
    s('sjTotRows',filled);s('sjTotPlant1111',p1);s('sjTotPlant1112',p2);s('sjTotPlant1113',p3);
  }
  function _sjOnKeydown(e,td){
    var tbody=document.getElementById('sjTbody'),trs=Array.from(tbody.querySelectorAll('tr'));
    var ri=_sjTrIdx(tbody,td.closest('tr')),ci=_sjTcIdx(SJ_COLS,td);
    if(e.key==='Tab'){
      e.preventDefault();
      var nextCi=ci+1;while(nextCi<SJ_COLS.length&&SJ_AUTO[SJ_COLS[nextCi]])nextCi++;
      if(nextCi<SJ_COLS.length){var nt=trs[ri]&&trs[ri].querySelector('[data-col="'+SJ_COLS[nextCi]+'"]');if(nt){nt.focus();_sjClearSel();}}
      else if(trs[ri+1]){var nf=trs[ri+1].querySelector('[contenteditable="true"]');if(nf){nf.focus();_sjClearSel();}}
      return;
    }
    if(e.key==='Enter'){
      e.preventDefault();
      if(trs[ri+1]){var nc=trs[ri+1].children[td.cellIndex];if(nc&&nc.contentEditable==='true'){nc.focus();_sjClearSel();}}
      else{sjAddRows(1);setTimeout(function(){var nr=tbody.querySelectorAll('tr');var nc2=nr[ri+1]&&nr[ri+1].children[td.cellIndex];if(nc2&&nc2.contentEditable==='true')nc2.focus();},50);}
      return;
    }
    // ── Arrow keys — pindah cell, tidak geser kursor teks ──────
    var isArrow=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.key)>=0;
    if(!isArrow) return;
    e.preventDefault();
    var nri=ri, nci=ci;
    if(e.key==='ArrowUp')    nri=ri-1;
    if(e.key==='ArrowDown')  nri=ri+1;
    if(e.key==='ArrowLeft')  nci=ci-1;
    if(e.key==='ArrowRight') nci=ci+1;
    // Shift+Arrow → extend seleksi
    if(e.shiftKey){
      if(_sjSel.r1<0) _sjSel={r1:ri,c1:ci,r2:ri,c2:ci};
      nri=Math.max(0,Math.min(trs.length-1,nri));
      nci=Math.max(0,Math.min(SJ_COLS.length-1,nci));
      _sjSel.r2=nri; _sjSel.c2=nci; _sjApplySel();
      var tgt=trs[nri]&&trs[nri].querySelector('[data-col="'+SJ_COLS[nci]+'"]');
      if(tgt&&tgt.contentEditable==='true') setTimeout(function(){tgt.focus();},0);
      return;
    }
    // Arrow tanpa Shift → pindah cell, clear sel
    nri=Math.max(0,Math.min(trs.length-1,nri));
    nci=Math.max(0,Math.min(SJ_COLS.length-1,nci));
    var tgt2=trs[nri]&&trs[nri].querySelector('[data-col="'+SJ_COLS[nci]+'"]');
    if(tgt2&&tgt2.contentEditable==='true'){tgt2.focus();_sjClearSel();_sjSel={r1:nri,c1:nci,r2:nri,c2:nci};}
  }
  function _sjBindEvents(){
    var tbl=document.getElementById('sjTbl');if(!tbl||tbl._sjBound)return;tbl._sjBound=true;
    var tbody=document.getElementById('sjTbody');
    // SISTEM TABEL OK
    _STOKInit({tblId:'sjTbl',tbodyId:'sjTbody',cols:SJ_COLS,autoCols:{},selClass:'sj-sel',
      onAfterPaste:function(tr){ if(typeof _sjApplyShiftBadge==='function'){ var td=tr.querySelector('[data-col="shift"]'); if(td) _sjApplyShiftBadge(td); } if(typeof _sjUpdateTotals==='function') _sjUpdateTotals(); },
      onDelete:function(tr){ if(typeof _sjUpdateTotals==='function') _sjUpdateTotals(); }
    });
    // mousedown drag, keydown, paste handled by _STOKInit
    document.addEventListener('mousedown',function(e){var pg=document.getElementById('stockJalurPage');if(!pg||pg.style.display==='none')return;if(tbl&&!tbl.contains(e.target))_sjClearSel();});
    // paste handled by _STOKInit
    tbody.addEventListener('blur',function(e){
      var td=e.target.closest('td[data-col]');if(!td)return;
      var col=td.dataset.col,tr=td.closest('tr');
      if(col==='qty') _sjSoEvalFormula(td);
      if(col==='sku')_sjLookupSku(tr);  // auto-fill nama jika masih kosong
      if(col==='shift')_sjApplyShiftBadge(td);
      if(col==='plant')_sjApplyPlantBadge(td,'sj');
      _sjUpdateTotals();
    },true);
    // keydown handled by _STOKInit
  }
  function sjZoom(d){_sjZoom=Math.min(150,Math.max(60,_sjZoom+d));var t=document.getElementById('sjTbl');if(t)t.style.fontSize=(_sjZoom/100*12)+'px';var l=document.getElementById('sjZoomLabel');if(l)l.textContent=_sjZoom+'%';}
  function sjZoomReset(){_sjZoom=100;var t=document.getElementById('sjTbl');if(t)t.style.fontSize='';var l=document.getElementById('sjZoomLabel');if(l)l.textContent='100%';}
  function sjClearTable(){
    if(!confirm('Yakin clear data input?')) return;
    // Collect semua baris yang ada datanya
    var rows = [];
    document.querySelectorAll('#sjTbody tr').forEach(function(tr){
      var sku     = _sjRawText(tr.querySelector('[data-col="sku"]'));
      var prodate = _sjRawText(tr.querySelector('[data-col="prodate"]'));
      if(!sku && !prodate) return;
      var statusEl = tr.querySelector('[data-col="status"]');
      var status   = statusEl ? statusEl.textContent.trim() : '';
      rows.push({
        prodate   : prodate,
        sku       : sku,
        nama      : _sjRawText(tr.querySelector('[data-col="nama"]')),
        qty       : _sjRawText(tr.querySelector('[data-col="qty"]')),
        shift     : _sjRawText(tr.querySelector('[data-col="shift"]')),
        plant     : _sjRawText(tr.querySelector('[data-col="plant"]')),
        catatan   : _sjRawText(tr.querySelector('[data-col="catatan"]')),
        status    : status,
        timestamp : tr._ts || ''
      });
    });
    if(!rows.length){ sjInitRows(30); showToast('Tabel Input berhasil di-clear',''); return; }
    // Log dulu ke INPUT_JALUR, baru clear
    API.run('saveInputJalurLog', {rows: rows},
      function(){ sjInitRows(30); showToast('Tabel Input berhasil di-clear',''); },
      function(){ sjInitRows(30); showToast('Tabel Input berhasil di-clear',''); }
    );
  }
  function _sjCollect(){
    var data=[];
    document.querySelectorAll('#sjTbody tr').forEach(function(r){
      var prodate=_sjRawText(r.querySelector('[data-col="prodate"]')),sku=_sjRawText(r.querySelector('[data-col="sku"]'));
      var qty=_sjRawText(r.querySelector('[data-col="qty"]')),shift=_sjRawText(r.querySelector('[data-col="shift"]')),plant=_sjRawText(r.querySelector('[data-col="plant"]'));
      var status=_sjRawText(r.querySelector('[data-col="status"]'));
      var catatan=_sjRawText(r.querySelector('[data-col="catatan"]'))||'';
      var nama=_sjRawText(r.querySelector('[data-col="nama"]'))||'';
      if(status && status.indexOf('DONE')===0)return;  // skip DONE dan 'DONE (dicatat di ...)'
      if(!sku||!prodate||!qty||!shift||!plant)return;
      var qtyNum=parseFloat(qty.replace(/\./g,'').replace(',','.'))||0,shiftNum=parseInt(String(shift).replace(/[^0-9]/g,''));
      if(qtyNum<=0||shiftNum<1||shiftNum>3||['1111','1112','1113'].indexOf(plant)<0)return;
      data.push({prodate:prodate,sku:sku,nama:nama,qty:qtyNum,shift:shiftNum,plant:plant,catatan:catatan,_row:r});
    });
    return data;
  }
  var _sjSaving=false;
  function sjSave(){
    if(_sjSaving){showToast('\u23f3 Sedang memproses...','');return;}
    var data=_sjCollect();
    if(!data||!data.length){showToast('\u26a0\ufe0f Tidak ada data baru (semua sudah DONE atau tidak valid).','error');return;}
    var btn=document.getElementById('btnSjSave');
    if(btn){btn.disabled=true;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Memproses...';}
    _sjSaving=true;
    var total=data.length, doneCount=0, errCount=0, idx=0;
    showToast('\u23f3 Memproses baris 1 dari '+total+'...','');

    function processNext(){
      if(idx>=total){
        // Semua selesai
        _sjSaving=false;
        if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-save"></i> Simpan & Rekap';}
        var msg='\u2705 Selesai! '+doneCount+' berhasil'+(errCount?' | \u274c '+errCount+' error':'')+'.'
        showToast(msg, errCount?'error':'success');
        return;
      }
      var d=data[idx];
      var payload=[{prodate:d.prodate,sku:d.sku,nama:d.nama||'',qty:d.qty,shift:d.shift,plant:d.plant,catatan:d.catatan||''}];

      // Update tombol progress
      if(btn) btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> '+(idx+1)+'/'+total+'...';

      // Tandai baris sedang diproses
      var statusTd=d._row?d._row.querySelector('[data-col="status"]'):null;
      if(statusTd){statusTd.innerHTML='<span style="color:#718096;font-size:11px;"><i class="fas fa-spinner fa-spin"></i></span>';}

      google.script.run
        .withSuccessHandler(function(res){
          if(statusTd){
            statusTd.innerHTML='';
            var key=d.sku+'_'+d.shift;
            var isDone=res&&res.success&&res.done&&res.done.indexOf(key)>=0;
            var isErr =res&&(!res.success||(res.errors&&res.errors.indexOf(d.sku)>=0));
            if(isDone){
              d._timestamp=new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta',hour12:false}).replace(/\./g,'/');
              if(d._row)d._row._ts=d._timestamp;
              var s=document.createElement('span');s.className='sj-status-done';s.textContent='DONE';
              statusTd.appendChild(s);if(d._row)d._row.style.background='#f0fff4';
              doneCount++;
            } else if(isErr){
              var s=document.createElement('span');s.className='sj-status-error';
              s.textContent='Error'+(res&&res.message?' ('+res.message+')':'');
              statusTd.appendChild(s);if(d._row)d._row.style.background='#fff5f5';
              errCount++;
            } else {
              d._timestamp=new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta',hour12:false}).replace(/\./g,'/');
              if(d._row)d._row._ts=d._timestamp;
              var s=document.createElement('span');s.className='sj-status-done';s.textContent='DONE';
              statusTd.appendChild(s);if(d._row)d._row.style.background='#f0fff4';
              doneCount++;
            }
          }
          idx++;
          if(idx<total) showToast('\u23f3 Memproses baris '+(idx+1)+' dari '+total+'...','');
          processNext();
        })
        .withFailureHandler(function(err){
          if(statusTd){
            statusTd.innerHTML='';
            var s=document.createElement('span');s.className='sj-status-error';
            // Peringatan jangan langsung retry — data mungkin sudah terinput
            s.textContent='Network Error \u2014 cek spreadsheet dulu sebelum submit ulang!';
            statusTd.appendChild(s);
            if(d._row)d._row.style.background='#fff5f5';
          }
          errCount++;
          idx++;
          if(idx<total) showToast('\u23f3 Memproses baris '+(idx+1)+' dari '+total+'...','');
          processNext();
        })
        .rekapStockJalur(payload);
    }
    processNext();
  }
  function _sjMarkDone(dataWithRows,done,errors){
    dataWithRows.forEach(function(d){
      var r=d._row;if(!r)return;
      var statusTd=r.querySelector('[data-col="status"]');if(!statusTd)return;
      var key=d.sku+'_'+d.shift;
      statusTd.innerHTML='';
      if(done.indexOf(key)>=0){var s=document.createElement('span');s.className='sj-status-done';s.textContent='DONE';statusTd.appendChild(s);r.style.background='#f0fff4';}
      else if(errors.indexOf(d.sku)>=0){var s=document.createElement('span');s.className='sj-status-error';s.textContent='Error';statusTd.appendChild(s);r.style.background='#fff5f5';}
    });
  }

  // ── OUTPUT tabel ──────────────────────────────────────────────
  function _soClearSel(){
    document.querySelectorAll('#soTbl .so-sel').forEach(function(el){el.classList.remove('so-sel');});
    _soSel={r1:-1,c1:-1,r2:-1,c2:-1};
    var info=document.getElementById('soSelInfo');if(info)info.textContent='';
  }
  function _soApplySel(){
    document.querySelectorAll('#soTbl .so-sel').forEach(function(el){el.classList.remove('so-sel');});
    var tbody=document.getElementById('soTbody');if(!tbody)return;
    var trs=Array.from(tbody.querySelectorAll('tr'));
    var r1=Math.min(_soSel.r1,_soSel.r2),r2=Math.max(_soSel.r1,_soSel.r2);
    var c1=Math.min(_soSel.c1,_soSel.c2),c2=Math.max(_soSel.c1,_soSel.c2);
    if(r1<0||c1<0)return;
    for(var r=r1;r<=r2;r++){if(!trs[r])continue;for(var ci=c1;ci<=c2;ci++){var td=trs[r].querySelector('[data-col="'+SO_COLS[ci]+'"]');if(td)td.classList.add('so-sel');}}
    var info=document.getElementById('soSelInfo');if(info)info.textContent=(r2-r1+1)+'R \u00d7 '+(c2-c1+1)+'K  (Ctrl+C copy)';
  }
  function _soCopyBlock(){
    var tbody=document.getElementById('soTbody');if(!tbody)return;
    var trs=Array.from(tbody.querySelectorAll('tr'));
    var r1=Math.min(_soSel.r1,_soSel.r2),r2=Math.max(_soSel.r1,_soSel.r2);
    var c1=Math.min(_soSel.c1,_soSel.c2),c2=Math.max(_soSel.c1,_soSel.c2);
    if(r1<0||c1<0){showToast('Tidak ada selection','error');return;}
    var lines=[];
    for(var r=r1;r<=r2;r++){if(!trs[r])continue;var cells=[];for(var ci=c1;ci<=c2;ci++){var td=trs[r].querySelector('[data-col="'+SO_COLS[ci]+'"]');cells.push(td?td.textContent.trim():'');}lines.push(cells.join('\t'));}
    var text=lines.join('\n');
    try{navigator.clipboard.writeText(text).catch(function(){_sjFallbackCopy(text);});}catch(e2){_sjFallbackCopy(text);}
    showToast('\uD83D\uDCCB '+(r2-r1+1)+' baris disalin','success');
  }
  function soInitRows(n){var t=document.getElementById('soTbody');if(!t)return;t.innerHTML='';for(var i=0;i<n;i++)_soAppendRow();_soRenumber();_soUpdateTotals();_soBindEvents();}
  function soAddRows(n){for(var i=0;i<n;i++)_soAppendRow();_soRenumber();_soBindEvents();}
  function _soAppendRow(v){
    v=v||{}; var tbody=document.getElementById('soTbody');if(!tbody)return;
    var tr=document.createElement('tr');
    var no=document.createElement('td');no.className='row-no so-rnum';tr.appendChild(no);
    SO_COLS.forEach(function(k){
      var td=document.createElement('td');td.dataset.col=k;
      var isAuto=SO_AUTO[k],isNum=(k==='qty'),isCenter=(k==='plant'||k==='status');
      td.className='so-td'+(isAuto?' so-auto':'')+(isNum?' td-num':'')+(isCenter?' td-center':'');
      if(v[k])td.textContent=v[k];
      if(!isAuto){td.contentEditable='true';td.spellcheck=false;}
      tr.appendChild(td);
    });
    var dt=document.createElement('td');dt.style.cssText='padding:2px 4px;border:1px solid #e8edf2;';
    var db=document.createElement('button');db.className='so-del-btn';db.innerHTML='<i class="fas fa-times"></i>';
    db.onclick=function(){tr.remove();_soRenumber();_soUpdateTotals();}; dt.appendChild(db);tr.appendChild(dt);
    tbody.appendChild(tr);
  }
  function _soRenumber(){
    var rows=document.querySelectorAll('#soTbody tr');
    rows.forEach(function(r,i){var c=r.querySelector('.so-rnum');if(c)c.textContent=i+1;});
    var el=document.getElementById('soRowCount');if(el)el.textContent=rows.length+' BARIS';
  }
  function _soUpdateTotals(){
    var rows=document.querySelectorAll('#soTbody tr'),skus={},qty=0,filled=0,done=0,err=0;
    rows.forEach(function(r){
      var sku=_sjRawText(r.querySelector('[data-col="sku"]'));
      var q=parseFloat(_sjRawText(r.querySelector('[data-col="qty"]'))||0)||0;
      var status=_sjRawText(r.querySelector('[data-col="status"]'));
      if(sku){skus[sku]=true;filled++;} qty+=q;
      if(status==='DONE')done++; else if(status&&status.length>0)err++;
    });
    var s=function(id,v){var el=document.getElementById(id);if(el)el.textContent=v;};
    s('soTotSku',Object.keys(skus).length);s('soTotQty',qty.toLocaleString('id-ID'));
    s('soTotRows',filled);s('soTotDone',done);s('soTotError',err);
  }
  function _soOnKeydown(e,td){
    var tbody=document.getElementById('soTbody'),trs=Array.from(tbody.querySelectorAll('tr'));
    var ri=_sjTrIdx(tbody,td.closest('tr')),ci=_sjTcIdx(SO_COLS,td);
    if(e.key==='Tab'){
      e.preventDefault();
      var nextCi=ci+1;while(nextCi<SO_COLS.length&&SO_AUTO[SO_COLS[nextCi]])nextCi++;
      if(nextCi<SO_COLS.length){var nt=trs[ri]&&trs[ri].querySelector('[data-col="'+SO_COLS[nextCi]+'"]');if(nt){nt.focus();_soClearSel();}}
      else if(trs[ri+1]){var nf=trs[ri+1].querySelector('[contenteditable="true"]');if(nf){nf.focus();_soClearSel();}}
      return;
    }
    if(e.key==='Enter'){
      e.preventDefault();
      if(trs[ri+1]){var nc=trs[ri+1].children[td.cellIndex];if(nc&&nc.contentEditable==='true'){nc.focus();_soClearSel();}}
      else{soAddRows(1);setTimeout(function(){var nr=tbody.querySelectorAll('tr');var nc2=nr[ri+1]&&nr[ri+1].children[td.cellIndex];if(nc2&&nc2.contentEditable==='true')nc2.focus();},50);}
      return;
    }
    // ── Arrow keys ──────────────────────────────────────────────
    var isArrow=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.key)>=0;
    if(!isArrow) return;
    e.preventDefault();
    var nri=ri, nci=ci;
    if(e.key==='ArrowUp')    nri=ri-1;
    if(e.key==='ArrowDown')  nri=ri+1;
    if(e.key==='ArrowLeft')  nci=ci-1;
    if(e.key==='ArrowRight') nci=ci+1;
    if(e.shiftKey){
      if(_soSel.r1<0) _soSel={r1:ri,c1:ci,r2:ri,c2:ci};
      nri=Math.max(0,Math.min(trs.length-1,nri));
      nci=Math.max(0,Math.min(SO_COLS.length-1,nci));
      _soSel.r2=nri; _soSel.c2=nci; _soApplySel();
      var tgt=trs[nri]&&trs[nri].querySelector('[data-col="'+SO_COLS[nci]+'"]');
      if(tgt&&tgt.contentEditable==='true') setTimeout(function(){tgt.focus();},0);
      return;
    }
    nri=Math.max(0,Math.min(trs.length-1,nri));
    nci=Math.max(0,Math.min(SO_COLS.length-1,nci));
    var tgt2=trs[nri]&&trs[nri].querySelector('[data-col="'+SO_COLS[nci]+'"]');
    if(tgt2&&tgt2.contentEditable==='true'){tgt2.focus();_soClearSel();_soSel={r1:nri,c1:nci,r2:nri,c2:nci};}
  }
  function _soBindEvents(){
    var tbl=document.getElementById('soTbl');if(!tbl||tbl._soBound)return;tbl._soBound=true;
    var tbody=document.getElementById('soTbody');
    // SISTEM TABEL OK
    _STOKInit({tblId:'soTbl',tbodyId:'soTbody',cols:SO_COLS,autoCols:{},selClass:'so-sel',
      onAfterPaste:function(tr){ if(typeof _soUpdateTotals==='function') _soUpdateTotals(); },
      onDelete:function(tr){ if(typeof _soUpdateTotals==='function') _soUpdateTotals(); }
    });
    // mousedown drag, keydown, paste handled by _STOKInit
    document.addEventListener('mousedown',function(e){var pg=document.getElementById('stockJalurPage');if(!pg||pg.style.display==='none')return;if(tbl&&!tbl.contains(e.target))_soClearSel();});
    // paste handled by _STOKInit
    tbody.addEventListener('blur',function(e){
      var td=e.target.closest('td[data-col]');if(!td)return;
      var col=td.dataset.col,tr=td.closest('tr');
      if(col==='qty') _sjSoEvalFormula(td);
      if(col==='sku')_sjLookupSku(tr,'nama');
      if(col==='plant')_sjApplyPlantBadge(td,'so');
      _soUpdateTotals();
    },true);
    // keydown handled by _STOKInit
  }
  function soZoom(d){_soZoom=Math.min(150,Math.max(60,_soZoom+d));var t=document.getElementById('soTbl');if(t)t.style.fontSize=(_soZoom/100*12)+'px';var l=document.getElementById('soZoomLabel');if(l)l.textContent=_soZoom+'%';}
  function soZoomReset(){_soZoom=100;var t=document.getElementById('soTbl');if(t)t.style.fontSize='';var l=document.getElementById('soZoomLabel');if(l)l.textContent='100%';}
  function soClearTable(){
    if(!confirm('Yakin clear data output?')) return;
    var rows = [];
    document.querySelectorAll('#soTbody tr').forEach(function(tr){
      var sku     = _sjRawText(tr.querySelector('[data-col="sku"]'));
      var prodate = _sjRawText(tr.querySelector('[data-col="prodate"]'));
      if(!sku && !prodate) return;
      var statusEl = tr.querySelector('[data-col="status"]');
      var status   = statusEl ? statusEl.textContent.trim() : '';
      rows.push({
        prodate   : prodate,
        sku       : sku,
        qty       : _sjRawText(tr.querySelector('[data-col="qty"]')),
        tglkeluar : _sjRawText(tr.querySelector('[data-col="tglkeluar"]')),
        nomobil   : _sjRawText(tr.querySelector('[data-col="nomobil"]')),
        nodo      : _sjRawText(tr.querySelector('[data-col="nodo"]')),
        tujuan    : _sjRawText(tr.querySelector('[data-col="tujuan"]')),
        plant     : _sjRawText(tr.querySelector('[data-col="plant"]')),
        catatan   : _sjRawText(tr.querySelector('[data-col="catatan"]')),
        status    : status,
        timestamp : tr._ts || ''
      });
    });
    if(!rows.length){ soInitRows(30); showToast('Tabel Output berhasil di-clear',''); return; }
    // Log dulu ke OUTPUT_JALUR, baru clear
    API.run('saveOutputJalurLog', {rows: rows},
      function(){ soInitRows(30); showToast('Tabel Output berhasil di-clear',''); },
      function(){ soInitRows(30); showToast('Tabel Output berhasil di-clear',''); }
    );
  }
  function _soCollect(){
    var data=[];
    document.querySelectorAll('#soTbody tr').forEach(function(r){
      var prodate=_sjRawText(r.querySelector('[data-col="prodate"]')),sku=_sjRawText(r.querySelector('[data-col="sku"]'));
      var qty=_sjRawText(r.querySelector('[data-col="qty"]')),tglkeluar=_sjRawText(r.querySelector('[data-col="tglkeluar"]'));
      var nomobil=_sjRawText(r.querySelector('[data-col="nomobil"]')),nodo=_sjRawText(r.querySelector('[data-col="nodo"]'));
      var tujuan=_sjRawText(r.querySelector('[data-col="tujuan"]')),plant=_sjRawText(r.querySelector('[data-col="plant"]'));
      var status=_sjRawText(r.querySelector('[data-col="status"]'));
      var catatan=_sjRawText(r.querySelector('[data-col="catatan"]'))||'';
      if(status==='DONE')return;
      if(!sku||!prodate||!qty||!tglkeluar||!plant)return;
      var qtyNum=parseFloat(qty.replace(/\./g,'').replace(',','.'))||0;
      if(qtyNum<=0||['1111','1112','1113'].indexOf(plant)<0)return;
      data.push({prodate:prodate,sku:sku,qty:qtyNum,tglkeluar:tglkeluar,nomobil:nomobil,nodo:nodo,tujuan:tujuan,plant:plant,catatan:catatan,_row:r});
    });
    return data;
  }
  var _soSaving=false;
  function soSave(){
    if(_soSaving){showToast('\u23f3 Sedang memproses...','');return;}
    var data=_soCollect();
    if(!data||!data.length){showToast('\u26a0\ufe0f Tidak ada data baru (semua sudah DONE atau tidak valid).','error');return;}
    var btn=document.getElementById('btnSoSave');
    if(btn){btn.disabled=true;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Memproses...';}
    _soSaving=true;
    var total=data.length, doneCount=0, errCount=0, idx=0;
    showToast('\u23f3 Memproses baris 1 dari '+total+'...','');

    function processNext(){
      if(idx>=total){
        _soSaving=false;
        if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-truck"></i> Simpan & Kirim';}
        _soUpdateTotals();
        var msg='\u2705 Selesai! '+doneCount+' berhasil'+(errCount?' | \u274c '+errCount+' error':'')+'.'
        showToast(msg, errCount?'error':'success');
        return;
      }
      var d=data[idx];
      var payload=[{prodate:d.prodate,sku:d.sku,qty:d.qty,tglkeluar:d.tglkeluar,nomobil:d.nomobil,nodo:d.nodo,tujuan:d.tujuan,plant:d.plant,catatan:d.catatan||''}];

      if(btn) btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> '+(idx+1)+'/'+total+'...';

      var statusTd=d._row?d._row.querySelector('[data-col="status"]'):null;
      if(statusTd) statusTd.innerHTML='<span style="color:#718096;font-size:11px;"><i class="fas fa-spinner fa-spin"></i></span>';

      google.script.run
        .withSuccessHandler(function(res){
          if(statusTd){
            statusTd.innerHTML='';
            var resStatus=res&&res.results&&res.results[0]?res.results[0].status:'';
            var isDone=resStatus.indexOf('DONE')===0;
            var isErr=resStatus.indexOf('Error')>=0||resStatus.indexOf('Warning')>=0;
            var cls=isDone?'so-status-done':isErr?'so-status-error':'so-status-warn';
            var s=document.createElement('span');s.className=cls;s.textContent=resStatus||'DONE';
            statusTd.appendChild(s);
            if(isDone){d._timestamp=new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta',hour12:false}).replace(/\./g,'/');d._row._ts=d._timestamp;d._row.style.background='#f0fff4';doneCount++;}
            else if(isErr){d._row.style.background='#fff5f5';errCount++;}
            else{d._timestamp=new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta',hour12:false}).replace(/\./g,'/');d._row._ts=d._timestamp;d._row.style.background='#fffbeb';doneCount++;}
          }
          idx++;
          if(idx<total) showToast('\u23f3 Memproses baris '+(idx+1)+' dari '+total+'...','');
          processNext();
        })
        .withFailureHandler(function(err){
          if(statusTd){
            statusTd.innerHTML='';
            var s=document.createElement('span');s.className='so-status-error';
            s.textContent='Network Error \u2014 cek spreadsheet dulu sebelum submit ulang!';
            statusTd.appendChild(s);
            if(d._row) d._row.style.background='#fff5f5';
          }
          errCount++;
          idx++;
          if(idx<total) showToast('\u23f3 Memproses baris '+(idx+1)+' dari '+total+'...','');
          processNext();
        })
        .rekapOutputJalur(payload);
    }
    processNext();
  }
  function _soMarkResult(dataWithRows,results){
    dataWithRows.forEach(function(d,i){
      var r=d._row;if(!r)return;
      var res=results[i];if(!res)return;
      var statusTd=r.querySelector('[data-col="status"]');if(!statusTd)return;
      statusTd.innerHTML='';
      var cls=res.status.indexOf('DONE')===0?'so-status-done':(res.status.indexOf('Error')>=0||res.status.indexOf('kurang')>=0?'so-status-error':'so-status-warn');
      var s=document.createElement('span');s.className=cls;s.textContent=res.status;statusTd.appendChild(s);
      if(res.status.indexOf('DONE')===0)r.style.background='#f0fff4';
      else if(res.status.indexOf('Error')>=0||res.status.indexOf('kurang')>=0)r.style.background='#fff5f5';
      else r.style.background='#fffbeb';
    });
  }

  // =============================================
  // TAB REKAP — viewer kartu stock dari spreadsheet
  // =============================================
  var SR_SS_MAP = {
    '1111': [
      {label:'WAFER',      key:'wafer1', url:'https://docs.google.com/spreadsheets/d/1NfdZnC_C4S1HUwkzQcLDYUf4D7JKs2Gr82RWyPHkpc0/edit'},
      {label:'WAFER 2026', key:'wafer2', url:'https://docs.google.com/spreadsheets/d/1JnDnW5QGRX4rIm1IqTZTI2alt88ouCEzpyjpUXxJSVY/edit'}
    ],
    '1112': [
      {label:'BISKUIT',      key:'bisk1', url:'https://docs.google.com/spreadsheets/d/143003ya1y46YhAcM_PSfd5xbYDmzaYW6Qz11w5hjkJ8/edit'},
      {label:'BISKUIT 2026', key:'bisk2', url:'https://docs.google.com/spreadsheets/d/18Aq7G0fzbIXnSByubbJQZVDUurpeUV2R9fzG5A-ln4w/edit'}
    ],
    '1113': [
      {label:'BISKUIT',      key:'bisk1', url:'https://docs.google.com/spreadsheets/d/143003ya1y46YhAcM_PSfd5xbYDmzaYW6Qz11w5hjkJ8/edit'},
      {label:'BISKUIT 2026', key:'bisk2', url:'https://docs.google.com/spreadsheets/d/18Aq7G0fzbIXnSByubbJQZVDUurpeUV2R9fzG5A-ln4w/edit'}
    ]
  };

  var _srAllSheets=[];

  function srOnPlantChange(){
    var plant=document.getElementById('srPlant').value;
    var ssSel=document.getElementById('srSS');
    ssSel.innerHTML='<option value="">— Pilih Spreadsheet —</option>';
    _srResetSKU('— Pilih SS dulu —', true, true); // ganti SS = clear list
    srHideResult();
    if(!plant||!SR_SS_MAP[plant])return;
    SR_SS_MAP[plant].forEach(function(ss){
      var opt=document.createElement('option');
      opt.value=ss.key; opt.textContent=ss.label;
      ssSel.appendChild(opt);
    });
  }

  function srOnSSChange(){
    var plant=document.getElementById('srPlant').value;
    var ssKey=document.getElementById('srSS').value;
    // Reset cache & timer karena spreadsheet ganti
    _srSearchCache = {};
    _srSearchActive = '';
    if(_srSearchTimer){ clearTimeout(_srSearchTimer); _srSearchTimer=null; }
    _srResetSKU('— Pilih Plant & SS dulu —', true, true);
    srHideResult();
    if(!plant||!ssKey)return;
    var ssInfo=null;
    (SR_SS_MAP[plant]||[]).forEach(function(s){if(s.key===ssKey)ssInfo=s;});
    if(!ssInfo)return;
    // Tidak fetch sheet list — langsung enable input, user ketik baru fetch
    _srAllSheets=[];
    _srResetSKU('Ketik min. 2 karakter untuk cari SKU...', false, false);
  }

  // Debounce + cache untuk pencarian SKU on-demand
  var _srSearchTimer = null;
  var _srSearchCache = {};  // keyword → [sheet names]
  var _srSearchActive = ''; // keyword yang sedang di-fetch

  function _srResetSKU(placeholder, disabled, clearList){
    var inp=document.getElementById('srSKU');
    var dd=document.getElementById('srSKUDropdown');
    inp.value=''; inp.placeholder=placeholder; inp.disabled=!!disabled;
    inp.readOnly=false;
    if(dd) dd.style.display='none';
    if(clearList) _srAllSheets=[];
  }

  function srOpenDropdown(){
    var inp=document.getElementById('srSKU');
    if(inp.disabled) return;
    inp.readOnly=false;
    srFilterSKU(inp.value);
  }

  function _srDoSearch(keyword){
    var plant=document.getElementById('srPlant').value;
    var ssKey=document.getElementById('srSS').value;
    if(!plant||!ssKey) return;
    var ssInfo=null;
    (SR_SS_MAP[plant]||[]).forEach(function(s){if(s.key===ssKey)ssInfo=s;});
    if(!ssInfo) return;

    // Cek cache dulu
    if(_srSearchCache[keyword]){
      _srRenderDropdown(keyword, _srSearchCache[keyword]);
      return;
    }

    // Fetch dari server
    _srSearchActive = keyword;
    var dd=document.getElementById('srSKUDropdown');
    dd.innerHTML='<div class="sr-sku-empty"><i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i>Mencari "'+_srEsc(keyword)+'"...</div>';
    dd.style.display='block';

    google.script.run
      .withSuccessHandler(function(res){
        // Hanya render kalau keyword masih aktif (user belum ketik lagi)
        if(_srSearchActive!==keyword) return;
        var results = (res&&res.success&&res.sheets) ? res.sheets : [];
        _srSearchCache[keyword] = results;
        _srRenderDropdown(keyword, results);
      })
      .withFailureHandler(function(){
        if(_srSearchActive!==keyword) return;
        dd.innerHTML='<div class="sr-sku-empty" style="color:#e53e3e;">Gagal memuat</div>';
      })
      .searchSheetNames(ssInfo.url, keyword);
  }

  function _srRenderDropdown(keyword, list){
    var dd=document.getElementById('srSKUDropdown');
    if(!dd) return;
    if(!list||!list.length){
      dd.innerHTML='<div class="sr-sku-empty">Tidak ditemukan</div>';
      dd.style.display='block';
      return;
    }
    dd.innerHTML='';
    var kLow=(keyword||'').toLowerCase();
    list.forEach(function(s){
      var div=document.createElement('div');
      div.className='sr-sku-item';
      if(kLow){
        var idx=s.toLowerCase().indexOf(kLow);
        if(idx>=0){
          div.innerHTML=_srEsc(s.slice(0,idx))+'<strong>'+_srEsc(s.slice(idx,idx+kLow.length))+'</strong>'+_srEsc(s.slice(idx+kLow.length));
        } else {
          div.textContent=s;
        }
      } else {
        div.textContent=s;
      }
      div.addEventListener('mousedown',function(e){
        e.preventDefault();
        document.getElementById('srSKU').value=s;
        // Simpan ke _srAllSheets agar srLoad() bisa resolve
        if(_srAllSheets.indexOf(s)<0) _srAllSheets.push(s);
        dd.style.display='none';
      });
      dd.appendChild(div);
    });
    dd.style.display='block';
  }

  function srFilterSKU(q){
    var dd=document.getElementById('srSKUDropdown');
    if(!dd) return;
    var keyword=(q||'').trim();

    // Clear timer sebelumnya
    if(_srSearchTimer){ clearTimeout(_srSearchTimer); _srSearchTimer=null; }

    if(keyword.length < 2){
      dd.innerHTML='<div class="sr-sku-empty">Ketik min. 2 karakter untuk mulai mencari...</div>';
      dd.style.display='block';
      return;
    }

    // Debounce 350ms — tunggu user selesai mengetik
    _srSearchTimer = setTimeout(function(){
      _srDoSearch(keyword.toLowerCase());
    }, 350);
  }

  // Tutup dropdown saat klik di luar
  document.addEventListener('click',function(e){
    var wrap=document.getElementById('srSKU');
    var dd=document.getElementById('srSKUDropdown');
    if(dd&&wrap&&!wrap.contains(e.target)&&!dd.contains(e.target)){
      dd.style.display='none';
    }
  });

  function srHideResult(){
    document.getElementById('srSkuInfo').style.display='none';
    document.getElementById('srTable').style.display='none';
    document.getElementById('srEmpty').style.display='flex';
  }

  function _srEditCell(td){
    if(td.classList.contains('sr-editing')) return;
    var origText = td.textContent.trim();
    td.classList.add('sr-editing');
    td.innerHTML = '';
    var inp = document.createElement('input');
    inp.type = 'text';
    inp.value = origText;
    td.appendChild(inp);
    inp.focus(); inp.select();

    function save(){
      var newVal = inp.value.trim();
      td.classList.remove('sr-editing');
      td.innerHTML = newVal;
      if(newVal === origText) return;
      // Kirim ke GAS
      var blokIdx  = parseInt(td.dataset.blok);
      var ki       = parseInt(td.dataset.ki);
      var field    = td.dataset.field;
      var sheetName = _srCurrentSheet;
      var ssUrl     = _srCurrentSsUrl;
      if(!sheetName||!ssUrl){ showToast('Sheet tidak diketahui','error'); return; }
      td.style.opacity = '0.5';
      google.script.run
        .withSuccessHandler(function(res){
          td.style.opacity = '';
          if(res && res.success){
            td.style.background='#c6f6d5'; td.style.outline='1px solid #38a169';
            setTimeout(function(){ td.style.background=''; td.style.outline=''; },1200);
          } else {
            showToast('❌ Gagal: '+(res&&res.message||'unknown'),'error');
            td.innerHTML = origText;
          }
        })
        .withFailureHandler(function(e){
          td.style.opacity = '';
          showToast('❌ Error: '+e.message,'error');
          td.innerHTML = origText;
        })
        .updateSrKirimCell({ssUrl: ssUrl, sheetName: sheetName, blokIdx: blokIdx, ki: ki, field: field, value: newVal});
    }

    inp.addEventListener('blur', save);
    inp.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){ e.preventDefault(); inp.blur(); }
      if(e.key === 'Escape'){ inp.removeEventListener('blur', save); td.classList.remove('sr-editing'); td.innerHTML = origText; }
    });
  }

  function _srEditShift(td){
    if(td.classList.contains('sr-editing')) return;
    var origVal = td.textContent.trim();
    var blokIdx = parseInt(td.dataset.blok);
    var field   = td.dataset.field;
    var fieldLabel = field==='shift1'?'Shift 1':field==='shift2'?'Shift 2':'Shift 3';

    // Tampilkan modal input nilai + catatan
    var modal = document.getElementById('srShiftEditModal');
    if(!modal){
      modal = document.createElement('div');
      modal.id = 'srShiftEditModal';
      modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99999;display:flex;align-items:center;justify-content:center;';
      modal.innerHTML =
        '<div style="background:#fff;border-radius:12px;padding:24px;min-width:340px;max-width:420px;box-shadow:0 8px 32px rgba(0,0,0,.18);">'+
          '<div style="font-weight:800;font-size:15px;color:#1a3a6b;margin-bottom:16px;">✏️ Edit <span id="srShiftLabel"></span></div>'+
          '<label style="font-size:12px;font-weight:700;color:#718096;text-transform:uppercase;letter-spacing:.5px;">Nilai Baru</label>'+
          '<input id="srShiftValInput" type="number" min="0" style="width:100%;margin:6px 0 14px;padding:8px 12px;border:2px solid #e2e8f0;border-radius:8px;font-size:15px;font-weight:700;box-sizing:border-box;" placeholder="Masukkan nilai...">'+
          '<label style="font-size:12px;font-weight:700;color:#718096;text-transform:uppercase;letter-spacing:.5px;">Catatan (wajib)</label>'+
          '<textarea id="srShiftNoteInput" rows="3" style="width:100%;margin:6px 0 14px;padding:8px 12px;border:2px solid #e2e8f0;border-radius:8px;font-size:13px;resize:vertical;box-sizing:border-box;" placeholder="Alasan perubahan..."></textarea>'+
          '<div style="display:flex;gap:8px;justify-content:flex-end;">'+
            '<button onclick="_srShiftEditCancel()" style="padding:8px 18px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;font-weight:700;color:#718096;">Batal</button>'+
            '<button onclick="_srShiftEditSave()" style="padding:8px 18px;border:none;border-radius:8px;background:linear-gradient(135deg,#1a3a6b,#2563eb);color:#fff;cursor:pointer;font-weight:700;">Simpan</button>'+
          '</div>'+
        '</div>';
      document.body.appendChild(modal);
    }

    // Set state ke modal
    modal._td        = td;
    modal._origVal   = origVal;
    modal._blokIdx   = blokIdx;
    modal._field     = field;
    modal._ssUrl     = _srCurrentSsUrl;
    modal._sheetName = _srCurrentSheet;

    document.getElementById('srShiftLabel').textContent = fieldLabel;
    var valInput  = document.getElementById('srShiftValInput');
    var noteInput = document.getElementById('srShiftNoteInput');
    valInput.value  = origVal.replace(/\./g,'').replace(',','') || '';
    noteInput.value = '';
    valInput.style.borderColor='';
    noteInput.style.borderColor='';

    modal.style.display='flex';
    setTimeout(function(){ valInput.focus(); valInput.select(); }, 50);
  }

  function _srShiftEditCancel(){
    var modal=document.getElementById('srShiftEditModal');
    if(modal) modal.style.display='none';
  }

  function _srShiftEditSave(){
    var modal=document.getElementById('srShiftEditModal');
    var valInput  = document.getElementById('srShiftValInput');
    var noteInput = document.getElementById('srShiftNoteInput');
    var newVal    = valInput.value.trim();
    var catatan   = noteInput.value.trim();

    // Validasi
    if(newVal===''||isNaN(Number(newVal))){
      valInput.style.borderColor='#e53e3e'; valInput.focus(); return;
    }
    if(!catatan){
      noteInput.style.borderColor='#e53e3e'; noteInput.focus(); return;
    }

    var td        = modal._td;
    var origVal   = modal._origVal;
    if(newVal===origVal){ _srShiftEditCancel(); return; }

    modal.style.display='none';
    td.style.opacity='0.5';

    google.script.run
      .withSuccessHandler(function(res){
        td.style.opacity='';
        if(res&&res.success){
          td.textContent=Number(newVal).toLocaleString('id-ID');
          td.style.background='#c6f6d5'; td.style.outline='1px solid #38a169';
          setTimeout(function(){ td.style.background=''; td.style.outline=''; },1500);
        } else {
          showToast('❌ Gagal: '+(res&&res.message||'unknown'),'error');
          td.textContent=origVal;
        }
      })
      .withFailureHandler(function(e){
        td.style.opacity='';
        showToast('❌ Error: '+e.message,'error');
        td.textContent=origVal;
      })
      .updateSrShiftCell({
        ssUrl     : modal._ssUrl,
        sheetName : modal._sheetName,
        blokIdx   : modal._blokIdx,
        field     : modal._field,
        value     : Number(newVal),
        catatan   : catatan
      });
  }

  function _srShowShiftNote(el){
    var note=(el.dataset.note||'').replace(/&#10;/g,'\n');
    if(!note) return;
    var td=el.closest('td'); var field=td?td.dataset.field:'';
    var lbl=field==='shift1'?'Shift 1':field==='shift2'?'Shift 2':'Shift 3';
    var existing=document.getElementById('srShiftNotePopup');
    if(existing) existing.remove();
    var html='<div id="srShiftNotePopup" style="position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.45);" onclick="if(event.target===this)document.getElementById(\'srShiftNotePopup\').remove();">'+
      '<div style="background:#fff;border-radius:14px;box-shadow:0 8px 40px rgba(0,0,0,.25);max-width:380px;width:100%;padding:20px;">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">'+
      '<div style="font-size:13px;font-weight:800;color:#2d3748;"><i class="fas fa-sticky-note" style="color:#e53e3e;margin-right:6px;"></i>Catatan '+lbl+'</div>'+
      '<button onclick="document.getElementById(\'srShiftNotePopup\').remove()" style="border:none;background:none;cursor:pointer;font-size:18px;color:#718096;">&times;</button>'+
      '</div>'+
      '<div style="background:#fff5f5;border-left:3px solid #fc8181;border-radius:6px;padding:12px 14px;font-size:13px;color:#742a2a;line-height:1.6;white-space:pre-wrap;">'+note.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>'+
      '</div></div>';
    document.body.insertAdjacentHTML('beforeend',html);
  }

  function srLoad(){
    var plant  = document.getElementById('srPlant').value;
    var ssKey  = document.getElementById('srSS').value;
    var inputVal = (document.getElementById('srSKU').value||'').trim();
    if(!plant||!ssKey||!inputVal){showToast('\u26a0\ufe0f Pilih Plant, Spreadsheet, dan Kode Barang terlebih dahulu','error');return;}

    // Resolve nama sheet — cari di _srAllSheets (hasil yang sudah dipilih user)
    // atau fallback: kirim inputVal langsung ke server, biar server yang cari
    var sku=inputVal;
    if(_srAllSheets.length){
      // 1. Exact match
      var exact=_srAllSheets.filter(function(s){return s===inputVal;});
      if(exact.length){
        sku=exact[0];
      } else {
        // 2. Case-insensitive exact
        var ciExact=_srAllSheets.filter(function(s){return s.toLowerCase()===inputVal.toLowerCase();});
        if(ciExact.length){
          sku=ciExact[0];
        }
        // Kalau tidak ada match pun, biarkan sku=inputVal → server akan cari
      }
    }

    var ssInfo=null;
    (SR_SS_MAP[plant]||[]).forEach(function(s){if(s.key===ssKey)ssInfo=s;});
    if(!ssInfo)return;
    var pdfBtn=document.getElementById('srPdfBtn');
    if(pdfBtn)pdfBtn.style.display='none';
    document.getElementById('srLoading').style.display='flex';
    document.getElementById('srEmpty').style.display='none';
    document.getElementById('srTable').style.display='none';
    document.getElementById('srSkuInfo').style.display='none';
    google.script.run
      .withSuccessHandler(function(res){
        document.getElementById('srLoading').style.display='none';
        if(!res||!res.success){showToast('\u274c Gagal: '+(res&&res.message?res.message:'error'),'error');srHideResult();return;}
        srRender(res, plant, ssInfo.label, sku);
      })
      .withFailureHandler(function(err){
        document.getElementById('srLoading').style.display='none';
        showToast('\u274c Error: '+(err&&err.message?err.message:String(err)),'error');
        srHideResult();
      })
      .getKartuStock(ssInfo.url, sku);
  }

  function srRender(res, plant, ssLabel, skuName){
    _srCurrentSheet  = res.sheetName || '';
    _srCurrentSsUrl  = res.ssUrl     || '';
    // Info SKU
    var info=document.getElementById('srSkuInfo');
    info.style.display='block';
    document.getElementById('srSkuNama').textContent=res.nama||skuName;
    var skuDisplay=res.sku||(skuName.match(/^(\d{6,8})/)||[])[1]||skuName;
    document.getElementById('srSkuKode').textContent=skuDisplay;
    document.getElementById('srSkuPlant').textContent=plant+' \u2014 '+ssLabel;
    var sisaEl=document.getElementById('srSkuSisa');
    var sisaNum=Number(res.sisaTotal)||0;
    sisaEl.textContent=sisaNum.toLocaleString('id-ID')+' Krt';
    sisaEl.style.color=sisaNum>0?'#c05621':'#9b2c2c';

    function fmtNum(v){
      if(v===null||v===undefined||v==='')return '';
      var n=Number(String(v).replace(/[^0-9.-]/g,''));
      return isNaN(n)?String(v):n.toLocaleString('id-ID');
    }

    var thead=document.getElementById('srThead');
    var tbody=document.getElementById('srTbody');
    var bloks=res.bloks||[];

    // Hitung jumlah kolom pengiriman maksimal
    var maxKirim=0;
    bloks.forEach(function(b){ if((b.kirim||[]).length>maxKirim) maxKirim=(b.kirim||[]).length; });
    maxKirim=Math.max(maxKirim,1);

    // ── Header 2 baris ─────────────────────────────────────────
    var th1='<tr>';
    th1+='<th rowspan="2" style="text-align:center;min-width:36px;vertical-align:middle;">No.</th>';
    th1+='<th rowspan="2" style="min-width:110px;text-align:center;vertical-align:middle;">TGL PRODUKSI</th>';
    th1+='<th colspan="4" style="text-align:center;">OUTPUT PROD.</th>';
    th1+='<th rowspan="2" style="min-width:80px;text-align:center;vertical-align:middle;">SISA STOCK</th>';
    th1+='<th rowspan="2" style="min-width:90px;text-align:center;vertical-align:middle;"></th>';
    // PENGIRIMAN = 1 header colspan semua kolom pengiriman, rowspan 2
    if(maxKirim>0){
      th1+='<th rowspan="2" colspan="'+maxKirim+'" style="text-align:center;vertical-align:middle;min-width:'+(maxKirim*120)+'px;">PENGIRIMAN</th>';
    }
    th1+='</tr>';

    var th2='<tr>';
    th2+='<th style="min-width:70px;text-align:center;">SHIFT 1</th>';
    th2+='<th style="min-width:70px;text-align:center;">SHIFT 2</th>';
    th2+='<th style="min-width:70px;text-align:center;">SHIFT 3</th>';
    th2+='<th style="min-width:70px;text-align:center;">TOTAL</th>';
    th2+='</tr>';
    thead.innerHTML=th1+th2;

    if(bloks.length===0){
      tbody.innerHTML='<tr><td colspan="'+(8+maxKirim)+'" style="text-align:center;color:#a0aec0;padding:30px;">Tidak ada data produksi</td></tr>';
      document.getElementById('srTable').style.display='table';
      document.getElementById('srEmpty').style.display='none';
      return;
    }

    var LABELS=['TANGGAL','TUJUAN','NO. DO','NO. MOBIL','JUMLAH'];
    var KIRIM_KEYS=['tanggal','tujuan','noDO','noMobil','jumlah'];

    var rows='';
    bloks.forEach(function(blok, blokIdx){
      var sisa=Number(blok.sisa)||0;
      var kirimList=blok.kirim||[];
      while(kirimList.length<maxKirim) kirimList.push({tanggal:'',tujuan:'',noDO:'',noMobil:'',jumlah:''});

      for(var rowIdx=0;rowIdx<5;rowIdx++){
        var isFirst=(rowIdx===0);
        var isJml=(rowIdx===4);
        var label=LABELS[rowIdx];
        var kirimKey=KIRIM_KEYS[rowIdx];

        var nfClass=blok.nonFifo?' sr-non-fifo':'';
        rows+='<tr class="'+(isFirst?'sr-blok-first':'sr-blok-sub')+nfClass+'">';

        if(isFirst){
          var ns1=blok.noteShift1||'', ns2=blok.noteShift2||'', ns3=blok.noteShift3||'';
          function shiftCell(field,val,note){
            var dot=note?'<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#e53e3e;margin-left:4px;vertical-align:middle;cursor:pointer;" onclick="_srShowShiftNote(this)" data-note="'+note.replace(/"/g,'&quot;').replace(/\n/g,'&#10;')+'" title="Ada catatan"></span>':'';
            return '<td rowspan="5" class="sr-editable" style="text-align:center;vertical-align:middle;" data-blok="'+blokIdx+'" data-field="'+field+'" ondblclick="_srEditShift(this)">'+fmtNum(val)+dot+'</td>';
          }
          rows+='<td rowspan="5" style="text-align:center;vertical-align:middle;font-weight:800;">'+_srEsc(String(blok.no||''))+'</td>';
          rows+='<td rowspan="5" style="text-align:center;vertical-align:middle;font-weight:800;" data-blok="'+blokIdx+'" data-field="tglProd">'+_srEsc(String(blok.tglProd||''))+'</td>';
          rows+=shiftCell('shift1',blok.shift1,ns1);
          rows+=shiftCell('shift2',blok.shift2,ns2);
          rows+=shiftCell('shift3',blok.shift3,ns3);
          rows+='<td rowspan="5" style="text-align:center;vertical-align:middle;font-weight:800;" data-blok="'+blokIdx+'" data-field="total">'+fmtNum(blok.total)+'</td>';
          rows+='<td rowspan="5" style="text-align:center;vertical-align:middle;font-weight:800;" class="'+(sisa>0?'sr-sisa-pos':'sr-sisa-zero')+'" data-blok="'+blokIdx+'" data-field="sisa">'+sisa.toLocaleString('id-ID')+'</td>';
        }

        // Label cell
        rows+='<td class="sr-label-cell">'+label+'</td>';

        // Nilai pengiriman — editable on dblclick
        for(var ki=0;ki<maxKirim;ki++){
          var k=blok.kirim[ki]||{};
          var val='';
          if(rowIdx===0) val=_srEsc(String(k.tanggal||''));
          else if(rowIdx===1) val=_srEsc(String(k.tujuan||''));
          else if(rowIdx===2) val=_srEsc(String(k.noDO||''));
          else if(rowIdx===3) val=_srEsc(String(k.noMobil||''));
          else if(rowIdx===4){
            var hasCat=k.catatan&&k.catatan.trim();
            if(hasCat){
              val='<span style="position:relative;display:inline-flex;align-items:center;gap:4px;cursor:pointer;" onclick="_srShowCatatanKirim(this)" data-cat="'+k.catatan.replace(/"/g,'&quot;').replace(/\n/g,'&#10;')+'">'+fmtNum(k.jumlah)+'<span style="width:7px;height:7px;border-radius:50%;background:#e53e3e;flex-shrink:0;" title="Ada catatan"></span></span>';
            } else {
              val=fmtNum(k.jumlah);
            }
          }
          rows+='<td class="sr-kirim-val sr-editable" data-blok="'+blokIdx+'" data-ki="'+ki+'" data-field="'+kirimKey+'" ondblclick="_srEditCell(this)">'+val+'</td>';
        }

        rows+='</tr>';
      }

      rows+='<tr class="sr-sep"><td colspan="'+(8+maxKirim)+'"></td></tr>';
    });

    tbody.innerHTML=rows;
    document.getElementById('srTable').style.display='table';
    document.getElementById('srEmpty').style.display='none';
    // Tampilkan tombol PDF
    var pdfBtn=document.getElementById('srPdfBtn');
    if(pdfBtn){pdfBtn.style.display='flex';}
    // Reset arsip state & tampilkan tombol arsip
    _srArsipLoaded = false;
    _srArsipData   = null;
    _srRenderArsipToggle();
  }

  function _srRenderArsipToggle(){
    // Buat/update wrapper arsip di bawah srTableWrap
    var wrap = document.getElementById('srArsipWrap');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.id = 'srArsipWrap';
      wrap.style.cssText = 'padding:0 14px 14px;';
      var tableWrap = document.getElementById('srTableWrap');
      if(tableWrap && tableWrap.parentNode){
        tableWrap.parentNode.insertBefore(wrap, tableWrap.nextSibling);
      }
    }
    wrap.innerHTML =
      '<div id="srArsipToggleBtn" onclick="_srToggleArsip()" style="'+
      'display:inline-flex;align-items:center;gap:8px;cursor:pointer;'+
      'padding:8px 16px;border-radius:8px;border:1.5px solid #e2e8f0;'+
      'background:#fff;color:#718096;font-size:12px;font-weight:700;'+
      'margin-top:8px;transition:all .2s;user-select:none;">' +
      '<i class="fas fa-archive"></i> Lihat Arsip' +
      '</div>'+
      '<div id="srArsipContent" style="display:none;margin-top:12px;"></div>';
  }

  function _srToggleArsip(){
    var btn     = document.getElementById('srArsipToggleBtn');
    var content = document.getElementById('srArsipContent');
    if(!btn || !content) return;

    var isOpen = content.style.display !== 'none';
    if(isOpen){
      // Tutup
      content.style.display = 'none';
      btn.innerHTML = '<i class="fas fa-archive"></i> Lihat Arsip';
      btn.style.color = '#718096';
      btn.style.borderColor = '#e2e8f0';
      return;
    }

    // Buka — cek apakah perlu load
    if(_srArsipLoaded){
      content.style.display = 'block';
      btn.innerHTML = '<i class="fas fa-archive"></i> Sembunyikan Arsip';
      btn.style.color = '#c05621';
      btn.style.borderColor = '#c05621';
      return;
    }

    // Load dari GAS
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat arsip...';
    btn.style.pointerEvents = 'none';

    var plant  = document.getElementById('srPlant').value;
    var ssKey  = document.getElementById('srSS').value;
    var ssInfo = null;
    (SR_SS_MAP[plant]||[]).forEach(function(s){ if(s.key===ssKey) ssInfo=s; });
    if(!ssInfo){
      btn.innerHTML = '<i class="fas fa-archive"></i> Lihat Arsip';
      btn.style.pointerEvents = '';
      showToast('\u26a0\ufe0f Spreadsheet tidak ditemukan','error');
      return;
    }

    google.script.run
      .withSuccessHandler(function(res){
        btn.style.pointerEvents = '';
        if(!res || !res.success){
          var msg = res && res.message ? res.message : 'Sheet arsip tidak ditemukan';
          btn.innerHTML = '<i class="fas fa-archive"></i> Arsip tidak tersedia';
          btn.style.color = '#a0aec0';
          btn.onclick = null;
          showToast('\u2139\ufe0f '+msg,'');
          return;
        }
        _srArsipLoaded = true;
        _srArsipData   = res;
        // Render arsip
        _srRenderArsipContent(res);
        content.style.display = 'block';
        btn.innerHTML = '<i class="fas fa-archive"></i> Sembunyikan Arsip';
        btn.style.color = '#c05621';
        btn.style.borderColor = '#c05621';
      })
      .withFailureHandler(function(err){
        btn.style.pointerEvents = '';
        btn.innerHTML = '<i class="fas fa-archive"></i> Lihat Arsip';
        btn.style.color = '#718096';
        showToast('\u274c Error: '+(err&&err.message||'gagal load arsip'),'error');
      })
      .getKartuStockArsip(ssInfo.url, _srCurrentSheet);
  }

  function _srRenderArsipContent(res){
    var content = document.getElementById('srArsipContent');
    if(!content) return;

    var bloks = res.bloks || [];
    if(!bloks.length){
      content.innerHTML =
        '<div style="text-align:center;padding:24px;color:#a0aec0;font-size:13px;">'+
        '<i class="fas fa-inbox" style="font-size:24px;display:block;margin-bottom:8px;opacity:.4;"></i>'+
        'Tidak ada data di sheet arsip</div>';
      return;
    }

    // Header arsip
    var maxKirim = 0;
    bloks.forEach(function(b){ if((b.kirim||[]).length>maxKirim) maxKirim=(b.kirim||[]).length; });
    maxKirim = Math.max(maxKirim,1);

    var html =
      '<div style="background:#fff8f0;border:1.5px solid #fed7aa;border-radius:10px;padding:12px 14px;margin-bottom:10px;">'+
      '<div style="font-size:11px;font-weight:800;color:#c05621;text-transform:uppercase;letter-spacing:.5px;">'+
      '<i class="fas fa-archive" style="margin-right:6px;"></i>Data Arsip — '+res.sheetName+'</div>'+
      '<div style="font-size:12px;color:#718096;margin-top:2px;">'+bloks.length+' blok produksi tersimpan di arsip</div>'+
      '</div>';

    html += '<div style="overflow:auto;"><table class="input-tbl" style="min-width:700px;opacity:.85;">';
    // Header
    html += '<thead><tr>';
    html += '<th style="text-align:center;">No.</th>';
    html += '<th style="min-width:110px;text-align:center;">TGL PRODUKSI</th>';
    html += '<th style="text-align:center;">SHIFT 1</th>';
    html += '<th style="text-align:center;">SHIFT 2</th>';
    html += '<th style="text-align:center;">SHIFT 3</th>';
    html += '<th style="text-align:center;">TOTAL</th>';
    html += '<th style="text-align:center;">SISA</th>';
    if(maxKirim>0) html += '<th colspan="'+maxKirim+'" style="text-align:center;">PENGIRIMAN</th>';
    html += '</tr></thead><tbody>';

    function fn(v){ if(v===null||v===undefined||v==='')return ''; var n=Number(String(v).replace(/[^0-9.-]/g,'')); return isNaN(n)?String(v):n.toLocaleString('id-ID'); }

    bloks.forEach(function(blok,idx){
      var sisa = Number(blok.sisa)||0;
      var rowStyle = 'background:#fffaf5;';
      html += '<tr style="'+rowStyle+'">';
      html += '<td style="text-align:center;color:#a0aec0;" rowspan="5">'+(idx+1)+'</td>';
      html += '<td rowspan="5" style="font-weight:700;text-align:center;font-size:12px;">'+blok.tglProd+'</td>';
      html += '<td style="text-align:right;">'+fn(blok.shift1)+'</td>';
      html += '<td style="text-align:right;">'+fn(blok.shift2)+'</td>';
      html += '<td style="text-align:right;">'+fn(blok.shift3)+'</td>';
      html += '<td style="text-align:right;font-weight:700;">'+fn(blok.total)+'</td>';
      html += '<td rowspan="5" style="text-align:center;font-weight:800;color:'+(sisa>0?'#c05621':'#9b2c2c')+';">'+fn(sisa)+'</td>';
      // Pengiriman baris 1 (tanggal)
      var kirims = blok.kirim || [];
      for(var ki=0;ki<maxKirim;ki++){
        var k = kirims[ki];
        html += '<td style="text-align:center;font-size:11px;color:#718096;">'+(k?k.tanggal:'')+'</td>';
      }
      html += '</tr>';
      // Baris 2-4: data pengiriman lainnya
      var subLabels = ['tujuan','noDO','noMobil'];
      subLabels.forEach(function(field){
        html += '<tr style="'+rowStyle+'">';
        for(var ki=0;ki<maxKirim;ki++){
          var k = kirims[ki];
          html += '<td style="text-align:center;font-size:11px;color:#4a5568;">'+(k?k[field]:'')+'</td>';
        }
        html += '</tr>';
      });
      // Baris 5: jumlah pengiriman
      html += '<tr style="'+rowStyle+'">';
      for(var ki=0;ki<maxKirim;ki++){
        var k = kirims[ki];
        html += '<td style="text-align:right;font-weight:700;">'+(k&&k.jumlah?fn(k.jumlah):'')+'</td>';
      }
      html += '</tr>';
      html += '<tr class="sr-sep"><td colspan="'+(7+maxKirim)+'"></td></tr>';
    });

    html += '</tbody></table></div>';
    content.innerHTML = html;
  }

  function srDownloadPdf(){
    var tbl=document.getElementById('srTable');
    if(!tbl||tbl.style.display==='none'){showToast('\u26a0\ufe0f Tampilkan data dulu','error');return;}

    var nama=document.getElementById('srSkuNama').textContent||'';
    var sku =document.getElementById('srSkuKode').textContent||'';
    var plant=document.getElementById('srSkuPlant').textContent||'';
    var sisa=document.getElementById('srSkuSisa').textContent||'';
    var title='KARTU STOCK \u2014 '+sku+' '+nama;

    var w=window.open('','_blank','width=1200,height=800');
    if(!w){showToast('\u26a0\ufe0f Pop-up diblokir browser','error');return;}

    // Clone tabel, hapus separator, hapus min-width agar auto-fit
    var tblClone=tbl.cloneNode(true);
    tblClone.querySelectorAll('tr.sr-sep').forEach(function(r){r.remove();});
    // Hapus semua inline style width/min-width pada th & td
    tblClone.querySelectorAll('th,td').forEach(function(el){
      el.style.minWidth='';
      el.style.width='';
      el.style.maxWidth='';
    });

    var html='<!DOCTYPE html><html><head><meta charset="UTF-8">';
    html+='<title>'+title+'</title>';
    html+='<style>';
    html+='*{box-sizing:border-box;}';
    html+='body{font-family:Arial,sans-serif;font-size:9px;color:#1a202c;margin:0;padding:10px;}';
    html+='.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;border-bottom:2px solid #0f2027;padding-bottom:6px;}';
    html+='.hdr-title{font-size:12px;font-weight:800;color:#0f2027;}';
    html+='.hdr-sub{font-size:9px;color:#4a5568;margin-top:2px;}';
    html+='.hdr-sisa{font-size:15px;font-weight:800;color:#c05621;}';
    html+='.hdr-sisa-lbl{font-size:8px;color:#718096;text-transform:uppercase;letter-spacing:.5px;}';
    // Kunci: table-layout:auto + width:auto agar kolom menyesuaikan konten
    html+='table{border-collapse:collapse;width:auto;table-layout:auto;font-size:9px;}';
    html+='thead tr:nth-child(1) th{background:#0f2027;color:#fff;padding:4px 6px;text-align:center;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.3px;border:1px solid rgba(255,255,255,.2);white-space:nowrap;}';
    html+='thead tr:nth-child(2) th{background:#1a3a5c;color:#e2e8f0;padding:3px 6px;text-align:center;font-size:8px;font-weight:700;border:1px solid rgba(255,255,255,.15);white-space:nowrap;}';
    html+='tbody td{padding:3px 6px;border:1px solid #d1d5db;text-align:center;vertical-align:middle;white-space:nowrap;}';
    html+='.sr-blok-first td{background:#e6f4ea;}';
    html+='.sr-blok-sub td{background:#fff;}';
    // Label cell — sedikit lebih lebar karena ada teks
    html+='.sr-label-cell{background:#b8ddd0 !important;color:#0d3325 !important;font-weight:800;font-size:8px;text-transform:uppercase;letter-spacing:.3px;text-align:left !important;padding:3px 7px !important;white-space:nowrap;}';
    html+='.sr-blok-sub .sr-label-cell{background:#d4e9f7 !important;color:#1a3a5c !important;}';
    html+='.sr-sisa-pos{color:#276749;font-weight:800;}';
    html+='.sr-sisa-zero{color:#9b2c2c;font-weight:800;}';
    html+='@media print{';
    html+='@page{size:landscape;margin:8mm;}';
    html+='body{padding:0;font-size:8px;}';
    html+='table{font-size:8px;}';
    html+='-webkit-print-color-adjust:exact;print-color-adjust:exact;';
    html+='}';
    html+='</style></head><body>';
    html+='<div class="hdr">';
    html+='<div>';
    html+='<div class="hdr-title">'+title+'</div>';
    html+='<div class="hdr-sub">'+plant+'</div>';
    html+='<div class="hdr-sub">Dicetak: '+new Date().toLocaleString('id-ID')+'</div>';
    html+='</div>';
    html+='<div style="text-align:right;">';
    html+='<div class="hdr-sisa-lbl">Sisa Stock</div>';
    html+='<div class="hdr-sisa">'+sisa+'</div>';
    html+='</div>';
    html+='</div>';
    html+=tblClone.outerHTML;
    html+='</body></html>';

    w.document.write(html);
    w.document.close();
    setTimeout(function(){w.print();},400);
  }

  function _srFmtDate(val){
    if(!val)return '';
    if(val instanceof Date)return val.toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric'});
    return String(val);
  }
  function _srEsc(v){ return v?String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;'):''; }

  // ═══════════════════════════════════════════════════════
  // BIN LOC MONITORING
  // ═══════════════════════════════════════════════════════
  var _blData      = [];
  var _blFiltered  = [];
  var _blStdMap    = {};   // { skuKode: std } dari sheet STD
  var _blTimer     = null;
  var _blInterval  = 30;
  var _blCountdown = 0;
  var _blLoading   = false;
