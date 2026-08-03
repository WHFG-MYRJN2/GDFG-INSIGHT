function initOpnamePage(){
      _preloadSkuNames(); // pastikan SKU map terisi sebelum user mulai input
      _renderOpThead();     // render header tabel utama
      _renderOpTheadGdfg(); // render header tabel GDFG
      var today = new Date();
      var yyyy=today.getFullYear(), mm=String(today.getMonth()+1).padStart(2,'0'), dd=String(today.getDate()).padStart(2,'0');
      var ts=yyyy+'-'+mm+'-'+dd;
      document.getElementById('opTanggal').value=ts;
      document.getElementById('opViewFrom').value=ts;
      document.getElementById('opViewTo').value=ts;
      document.getElementById('fifoViewFrom').value=ts;
      document.getElementById('fifoViewTo').value=ts;
      _initViewNamaOptions();
      if(!_opnameInitDone){
        google.script.run
          .withSuccessHandler(function(res){
            if(res&&res.success&&res.data){
              _opnameStdMap={};
              _opnameNamaMap={};
              res.data.forEach(function(r){
                if(r.sku){
                  var sk=String(r.sku).trim();
                  _opnameStdMap[sk]=Number(r.std)||0;
                  _opnameNamaMap[sk]=String(r.nama||'');
                }
              });
            }
            _opnameInitDone=true;
            if(!document.getElementById('opnameTbody').children.length) initOpnameRows(30);
            if(!document.getElementById('opnameTbodyGdfg').children.length) initOpnameGdfgRows(30);
          })
          .withFailureHandler(function(){ _opnameInitDone=true; if(!document.getElementById('opnameTbody').children.length) initOpnameRows(30); if(!document.getElementById('opnameTbodyGdfg').children.length) initOpnameGdfgRows(30); })
          .getStandarPalet();
      } else {
        if(!document.getElementById('opnameTbody').children.length) initOpnameRows(30);
        if(!document.getElementById('opnameTbodyGdfg').children.length) initOpnameGdfgRows(30);
      }
    }

    function switchOpnameTab(tab){
      if(tab === 'view'){
        _patternOpen(function(){ _doSwitchOpnameTab('view'); });
        return;
      }
      _doSwitchOpnameTab(tab);
    }

    function _doSwitchOpnameTab(tab){
      if(_opActiveTab === tab) return;
      var inp      = document.getElementById('opnameInputPane');
      var view     = document.getElementById('opnameViewPane');
      var fifoview = document.getElementById('opnameFifoViewPane');
      var qtview   = document.getElementById('opnameQtViewPane');
      var bi   = document.getElementById('btnOpInput');
      var bv   = document.getElementById('btnOpView');
      var bfv  = document.getElementById('btnOpFifoView');
      var bqv  = document.getElementById('btnOpQtView');
      var panes = {input:inp, view:view, fifoview:fifoview, qtview:qtview};
      var current = panes[_opActiveTab] || inp;
      var target  = panes[tab] || inp;
      var goingForward = (tab !== 'input');
      _opActiveTab = tab;
      if(bi)  bi.style.background  = tab==='input'    ?'rgba(255,255,255,.38)':'rgba(255,255,255,.18)';
      if(bv)  bv.style.background  = tab==='view'     ?'rgba(255,255,255,.38)':'rgba(255,255,255,.18)';
      if(bfv) bfv.style.background = tab==='fifoview' ?'rgba(255,255,255,.38)':'rgba(255,255,255,.18)';
      if(bqv) bqv.style.background = tab==='qtview'   ?'rgba(255,255,255,.38)':'rgba(255,255,255,.18)';
      if(tab==='view') _initViewNamaOptions();
      if(tab==='qtview'){
        // Auto-fill tanggal hari ini jika belum diisi
        var today=new Date().toISOString().split('T')[0];
        var qf=document.getElementById('qtViewFrom'), qt2=document.getElementById('qtViewTo');
        if(qf&&!qf.value) qf.value=today;
        if(qt2&&!qt2.value) qt2.value=today;
      }
      // Fase 1: fade out current
      current.style.transition = 'opacity .18s ease, transform .18s ease';
      current.style.opacity    = '0';
      current.style.transform  = goingForward ? 'translateX(-24px)' : 'translateX(24px)';
      setTimeout(function(){
        current.style.display = 'none';
        current.style.transition = '';
        current.style.opacity = '';
        current.style.transform = '';
        // Fase 2: tampilkan target dengan fade in
        target.style.display   = '';
        target.style.opacity   = '0';
        target.style.transform = goingForward ? 'translateX(24px)' : 'translateX(-24px)';
        target.style.transition= '';
        void target.offsetWidth; // force reflow
        target.style.transition = 'opacity .18s ease, transform .18s ease';
        target.style.opacity    = '1';
        target.style.transform  = 'translateX(0)';
        setTimeout(function(){
          target.style.transition = '';
        }, 200);
      }, 180);
    }

    function initOpnameRows(n){
      var tbody=document.getElementById('opnameTbody');
      if(!tbody) return;
      tbody.innerHTML='';
      for(var i=0;i<n;i++) _appendOpRow();
      _renumberOpRows();
      _updateOpTotals();
      _opBindEvents();
    }

    function addOpnameRow(){
      for(var i=0;i<10;i++) _appendOpRow();
      _renumberOpRows();
    }

    // ── GDFG tabel helpers ────────────────────────────────
    var _opGSel = {r1:-1,c1:-1,r2:-1,c2:-1};
    var _opGDragging = false;
    var _opGZoom = 100;

    function initOpnameGdfgRows(n){
      var tbody=document.getElementById('opnameTbodyGdfg');
      if(!tbody) return;
      tbody.innerHTML='';
      for(var i=0;i<n;i++) _appendOpGdfgRow();
      _renumberOpGdfgRows();
      _updateOpGdfgTotals();
      _opBindGdfgEvents();
    }

    function addOpnameGdfgRow(){
      for(var i=0;i<10;i++) _appendOpGdfgRow();
      _renumberOpGdfgRows();
    }

    function _appendOpGdfgRow(vals){
      var v=vals||{};
      var tbody=document.getElementById('opnameTbodyGdfg');
      if(!tbody) return;
      var tr=document.createElement('tr');
      var no=document.createElement('td');
      no.className='row-no op-rnum'; tr.appendChild(no);
      // Kolom sama dengan tabel utama (OP_COLS_ORDER)
      OP_COLS_ORDER.forEach(function(k){
        var td=document.createElement('td');
        td.dataset.col=k;
        var isAuto=(k==='sel_awal'||k==='sel_akhir'||k==='palet');
        var isNum =(k==='sap'||k==='sap_detail'||k==='sap_total'||k==='fisik'||k==='pgr'||k==='pgi'||k==='salah_kirim'||k==='adj'||k==='sel_awal'||k==='sel_akhir'||k==='std'||k==='palet');
        td.className='op-td'+(isAuto?' op-auto':'')+(isNum?' td-num':'');
        if(isAuto){ td.style.background='#f7fafc'; td.style.color='#718096'; td.style.fontWeight='600'; }
        if(v[k]) td.textContent=v[k];
        if(!isAuto){
          td.contentEditable='true';
          td.spellcheck=false;
          td.addEventListener('focus', function(){ _opGOnFocus(this); });
          td.addEventListener('blur', function(){
            if(this.dataset.col==='std'){
              var v2=(this.textContent||'').trim();
              this._manualEdit=v2.length>0;
              this.style.color=v2?'#2d3748':'#718096';
              var row=this.closest('tr'); if(row){ _calcOpGdfgRow(row); _updateOpGdfgTotals(); }
            }
            if(this.dataset.col==='sku'){
              var skuVal=(this.textContent||'').trim();
              var row=this.closest('tr');
              var nCell=row&&row.querySelector('[data-col="item"]');
              var stdCell=row&&row.querySelector('[data-col="std"]');
              var sapColLookup=_opCurrentTipe==='EKSPOR'?'sap_detail':'sap';
              var sapCell=row&&row.querySelector('[data-col="'+sapColLookup+'"]');
              if(skuVal){
                if(_opnameNamaMap[skuVal]){
                  if(nCell){ nCell.textContent=_opnameNamaMap[skuVal]; nCell.style.color=''; }
                  var stdVal=_opnameStdMap[skuVal]||0;
                  if(stdCell&&!stdCell._manualEdit){ stdCell.textContent=stdVal||''; stdCell.style.color='#718096'; }
                  var sapVal=(_skuDataMap[skuVal]&&_skuDataMap[skuVal].sap)||0;
                  if(sapCell&&!sapCell.textContent.trim()&&sapVal){ sapCell.textContent=sapVal; sapCell.style.color='#2b6cb0'; }
                  if(row){ _calcOpGdfgRow(row); _updateOpGdfgTotals(); }
                } else {
                  if(nCell){ nCell.textContent='⚠️ SKU tidak terdaftar'; nCell.style.color='#e53e3e'; }
                  if(stdCell&&!stdCell._manualEdit){ stdCell.textContent=''; }
                }
              } else {
                if(nCell){ nCell.textContent=''; nCell.style.color=''; }
                if(stdCell&&!stdCell._manualEdit){ stdCell.textContent=''; }
                if(sapCell&&sapCell.style.color==='rgb(43, 108, 176)') sapCell.textContent='';
              }
            }
          });
          td.addEventListener('input', function(){
            var row=this.closest('tr'); if(row){ _calcOpGdfgRow(row); _updateOpGdfgTotals(); }
          });
          td.addEventListener('keydown', function(e){ /* handled by _STOKInit */ });
          td.addEventListener('mousedown', function(e){
            var _td=this,startX=e.clientX,startY=e.clientY,moved=false;
            function onMove(ev){
              if(Math.abs(ev.clientX-startX)>4||Math.abs(ev.clientY-startY)>4){
                moved=true;
                if(!_opGDragging){
                  _opGDragging=true;
                  var ri=_opGTrIdx(_td.closest('tr')),ci=_opGTcIdx(_td);
                  if(ci<0)ci=0;
                  _opGSel={r1:ri,c1:ci,r2:ri,c2:ci};
                  _opGApplySel();
                  document.activeElement&&document.activeElement.blur();
                }
              }
            }
            function onUp(){
              document.removeEventListener('mousemove',onMove);
              document.removeEventListener('mouseup',onUp);
              if(moved){ e.preventDefault(); var t2=document.getElementById('opnameTblGdfg'); if(t2)t2.focus(); }
              else { _opGClearSel(); }
            }
            document.addEventListener('mousemove',onMove);
            document.addEventListener('mouseup',onUp);
          });
        } else { td.contentEditable='false'; }
        tr.appendChild(td);
      });
      var del=document.createElement('td');
      del.style.cssText='text-align:center;width:28px;';
      del.innerHTML='<button onclick="delOpnameGdfgRow(this)" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:13px;padding:2px 5px;">&times;</button>';
      tr.appendChild(del);
      tbody.appendChild(tr);
    }

    function _calcOpGdfgRow(tr){
      // Formula sama persis dengan _calcOpRow tapi untuk tabel GDFG
      var isEkspor=_opCurrentTipe==='EKSPOR';
      var fisik=parseFloat(_getCell(tr,'fisik'))||0;
      var pgr=parseFloat(_getCell(tr,'pgr'))||0;
      var pgi=parseFloat(_getCell(tr,'pgi'))||0;
      var sku=(_getCell(tr,'sku')||'').trim();
      var stdCellVal=parseFloat((tr.querySelector('[data-col="std"]')||{}).textContent||'')||0;
      var std=stdCellVal||_opnameStdMap[sku]||0;
      var namaCell=tr.querySelector('[data-col="item"]');
      if(namaCell&&sku&&_opnameNamaMap[sku]) namaCell.textContent=_opnameNamaMap[sku];
      if(isEkspor){
        var sapDetail=parseFloat(_getCell(tr,'sap_detail'))||0;
        var sapTotal=sapDetail;
        var has=sapDetail||fisik||pgr||pgi;
        if(!has){ _setCell(tr,'sap_total',''); _setCell(tr,'sel_akhir',''); _setCell(tr,'palet',''); return; }
        _setCell(tr,'sap_total',sapTotal>0?sapTotal:'','#2b6cb0');
        var sx=fisik-sapTotal-pgr+pgi;
        _setCell(tr,'sel_akhir',sx,sx>0?'#27ae60':sx<0?'#e74c3c':'#2b6cb0');
        _setCell(tr,'palet',std>0&&fisik>0?Math.ceil(fisik/std):'');
        var ketEl=tr.querySelector('[data-col="ket"]');
        if(ketEl&&has&&!ketEl._manualKet) ketEl.textContent=sx>0?'PLUS':sx<0?'MINUS':'OK';
      } else {
        var sap=parseFloat(_getCell(tr,'sap'))||0;
        var sk=parseFloat(_getCell(tr,'salah_kirim'))||0;
        var adj=parseFloat(_getCell(tr,'adj'))||0;
        var has=sap||fisik||pgr||pgi||sk||adj;
        if(!has){ _setCell(tr,'sel_awal',''); _setCell(tr,'sel_akhir',''); _setCell(tr,'palet',''); return; }
        var sa=fisik-sap;
        var sx=fisik-sap-pgr+pgi+sk-adj;
        _setCell(tr,'sel_awal',sa,sa>0?'#27ae60':sa<0?'#e74c3c':'#2b6cb0');
        _setCell(tr,'sel_akhir',sx,sx>0?'#27ae60':sx<0?'#e74c3c':'#2b6cb0');
        _setCell(tr,'palet',std>0&&fisik>0?Math.ceil(fisik/std):'');
        var ketEl=tr.querySelector('[data-col="ket"]');
        if(ketEl&&has&&!ketEl._manualKet) ketEl.textContent=sx>0?'PLUS':sx<0?'MINUS':'OK';
      }
    }

    function _updateOpGdfgTotals(){
      var trs=document.getElementById('opnameTbodyGdfg').querySelectorAll('tr');
      var totSku=0,totPalet=0,totPlus=0,totMinus=0,totOk=0,tSap=0,tFisik=0;
      var sapColKey=_opCurrentTipe==='EKSPOR'?'sap_total':'sap';
      trs.forEach(function(tr){
        if(!_getCell(tr,'sku')) return;
        totSku++;
        totPalet+=parseFloat(_getCell(tr,'palet'))||0;
        var sx=parseFloat(_getCell(tr,'sel_akhir'));
        if(!isNaN(sx)){ if(sx>0)totPlus++; else if(sx<0)totMinus++; else totOk++; }
        tSap+=parseFloat((_getCell(tr,sapColKey)||'').replace(/[^0-9-]/g,''))||0;
        tFisik+=parseInt((_getCell(tr,'fisik')||'').replace(/[^0-9-]/g,''))||0;
      });
      var el=function(id){ return document.getElementById(id); };
      var paletStr=(Math.round(totPalet*1000)/1000).toLocaleString('id-ID',{maximumFractionDigits:3});
      if(el('opGTotSku'))   el('opGTotSku').textContent=totSku;
      if(el('opGTotPalet')) el('opGTotPalet').textContent=paletStr;
      if(el('opGTotPlus'))  el('opGTotPlus').textContent=totPlus;
      if(el('opGTotMinus')) el('opGTotMinus').textContent=totMinus;
      if(el('opGTotOk'))    el('opGTotOk').textContent=totOk;
      if(el('opGTotSap'))   el('opGTotSap').textContent=tSap.toLocaleString('id-ID');
      if(el('opGTotFisik')) el('opGTotFisik').textContent=tFisik.toLocaleString('id-ID');
      if(el('opGRowCount')) el('opGRowCount').textContent=trs.length+' BARIS';
    }

    function _renumberOpGdfgRows(){
      document.getElementById('opnameTbodyGdfg').querySelectorAll('tr').forEach(function(tr,i){
        var no=tr.querySelector('.op-rnum'); if(no) no.textContent=i+1;
      });
    }

    function delOpnameGdfgRow(btn){ btn.closest('tr').remove(); _renumberOpGdfgRows(); _updateOpGdfgTotals(); }

    function clearOpnameGdfgTable(){ initOpnameGdfgRows(30); }

    function opZoom(delta, tbl){
      if(tbl==='gdfg'){
        _opGZoom=Math.max(60,Math.min(150,_opGZoom+delta));
        var t=document.getElementById('opnameTblGdfg');
        if(t) t.style.fontSize=(_opGZoom/100*13)+'px';
        var pad=Math.max(2,Math.round(_opGZoom/100*6))+'px '+Math.max(4,Math.round(_opGZoom/100*8))+'px';
        document.querySelectorAll('#opnameTblGdfg td,#opnameTblGdfg th').forEach(function(el){ el.style.padding=pad; });
        var lbl=document.getElementById('opGZoomLabel'); if(lbl) lbl.innerText=_opGZoom+'%';
      } else {
        _opZoom=Math.max(60,Math.min(150,_opZoom+delta));
        var t=document.getElementById('opnameTbl');
        if(t) t.style.fontSize=(_opZoom/100*13)+'px';
        var pad=Math.max(2,Math.round(_opZoom/100*6))+'px '+Math.max(4,Math.round(_opZoom/100*8))+'px';
        document.querySelectorAll('#opnameTbl td,#opnameTbl th').forEach(function(el){ el.style.padding=pad; });
        var lbl=document.getElementById('opZoomLabel'); if(lbl) lbl.innerText=_opZoom+'%';
      }
    }

    function opZoomReset(tbl){
      if(tbl==='gdfg'){
        _opGZoom=100;
        var t=document.getElementById('opnameTblGdfg'); if(t) t.style.fontSize='';
        document.querySelectorAll('#opnameTblGdfg td,#opnameTblGdfg th').forEach(function(el){ el.style.padding=''; });
        var lbl=document.getElementById('opGZoomLabel'); if(lbl) lbl.innerText='100%';
      } else {
        _opZoom=100;
        var t=document.getElementById('opnameTbl'); if(t) t.style.fontSize='';
        document.querySelectorAll('#opnameTbl td,#opnameTbl th').forEach(function(el){ el.style.padding=''; });
        var lbl=document.getElementById('opZoomLabel'); if(lbl) lbl.innerText='100%';
      }
    }

    // GDFG keyboard/selection helpers (mirror dari tabel utama)
    function _opGOnFocus(td){ _opGClearSel(); }
    function _opGAllTds(){ return Array.from(document.getElementById('opnameTbodyGdfg').querySelectorAll('tr')).map(function(tr){ return OP_COLS_ORDER.map(function(k){ return tr.querySelector('[data-col="'+k+'"]'); }); }); }
    function _opGTrIdx(tr){ return Array.from(document.getElementById('opnameTbodyGdfg').querySelectorAll('tr')).indexOf(tr); }
    function _opGTcIdx(td){ return OP_COLS_ORDER.indexOf(td.dataset.col||''); }
    function _opGClearSel(){ _opGSel={r1:-1,c1:-1,r2:-1,c2:-1}; document.querySelectorAll('#opnameTblGdfg .op-sel').forEach(function(el){ el.classList.remove('op-sel'); }); }
    function _opGApplySel(){
      document.querySelectorAll('#opnameTblGdfg .op-sel').forEach(function(el){ el.classList.remove('op-sel'); });
      if(_opGSel.r1<0) return;
      var trs=Array.from(document.getElementById('opnameTbodyGdfg').querySelectorAll('tr'));
      var r1=Math.min(_opGSel.r1,_opGSel.r2),r2=Math.max(_opGSel.r1,_opGSel.r2);
      var c1=Math.min(_opGSel.c1,_opGSel.c2),c2=Math.max(_opGSel.c1,_opGSel.c2);
      for(var r=r1;r<=r2;r++) for(var c=c1;c<=c2;c++){
        var td=trs[r]&&trs[r].querySelector('[data-col="'+OP_COLS_ORDER[c]+'"]');
        if(td) td.classList.add('op-sel');
      }
      var info=document.getElementById('opGSelInfo');
      if(info) info.textContent=(r2-r1+1)>1||(c2-c1+1)>1?((r2-r1+1)+'×'+(c2-c1+1)):'';
    }
    function _opGOnKeydown(e,td){
      if(e.key==='Delete'){ e.preventDefault(); td.textContent=''; _calcOpGdfgRow(td.closest('tr')); _updateOpGdfgTotals(); return; }
      var arrows=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
      if(arrows.indexOf(e.key)<0) return;
      e.preventDefault();
      var allTrs=Array.from(document.getElementById('opnameTbodyGdfg').querySelectorAll('tr'));
      var ri=_opGTrIdx(td.closest('tr')), ci=_opGTcIdx(td);
      var nri=ri,nci=ci;
      if(e.key==='ArrowUp') nri=Math.max(0,ri-1);
      else if(e.key==='ArrowDown') nri=Math.min(allTrs.length-1,ri+1);
      else if(e.key==='ArrowLeft') nci=Math.max(0,ci-1);
      else if(e.key==='ArrowRight') nci=Math.min(OP_COLS_ORDER.length-1,ci+1);
      var tgt=allTrs[nri]&&allTrs[nri].querySelector('[data-col="'+OP_COLS_ORDER[nci]+'"]');
      if(tgt){ _opGClearSel(); tgt.focus(); }
    }
    function _opBindGdfgEvents(){
      var tbl=document.getElementById('opnameTblGdfg');
      if(!tbl) return;
      // SISTEM TABEL OK
      _STOKInit({tblId:'opnameTblGdfg',tbodyId:'opnameTbodyGdfg',cols:OP_COLS_ORDER,autoCols:{sel_awal:true,sel_akhir:true,palet:true},selClass:'op-sel',
        onAfterPaste:function(tr){ if(typeof _calcOpGdfgRow==='function') _calcOpGdfgRow(tr); if(typeof _updateOpGdfgTotals==='function') _updateOpGdfgTotals(); },
        onDelete:function(tr){ if(typeof _calcOpGdfgRow==='function') _calcOpGdfgRow(tr); }
      });
      tbl.addEventListener('mouseup',function(){ if(_opGDragging){ _opGDragging=false; _opGApplySel(); } });
      tbl.addEventListener('mousemove',function(e){
        if(!_opGDragging) return;
        var td=e.target.closest('td[data-col]'); if(!td) return;
        _opGSel.r2=_opGTrIdx(td.closest('tr')); _opGSel.c2=_opGTcIdx(td);
        _opGApplySel();
      });
      // Ctrl+C copy
      // keydown Ctrl+C and paste handled by _STOKInit
    }

    function _appendOpRow(vals){
      var v=vals||{};
      var tbody=document.getElementById('opnameTbody');
      var tr=document.createElement('tr');
      var no=document.createElement('td');
      no.className='row-no op-rnum'; tr.appendChild(no);
      OP_COLS_ORDER.forEach(function(k){
        var td=document.createElement('td');
        td.dataset.col=k;
        var isAuto=(k==='sel_awal'||k==='sel_akhir'||k==='palet'); // std bisa edit manual
        var isNum =(k==='sap'||k==='sap_detail'||k==='sap_total'||k==='fisik'||k==='pgr'||k==='pgi'||k==='salah_kirim'||k==='adj'||k==='sel_awal'||k==='sel_akhir'||k==='std'||k==='palet');
        td.className='op-td'+(isAuto?' op-auto':'')+(isNum?' td-num':'');
        if(isAuto){
          td.style.background='#f7fafc';
          td.style.color='#718096';
          td.style.fontWeight='600';
        }
        if(v[k]) td.textContent=v[k];
        // Sel yang bisa edit: pakai contenteditable
        if(!isAuto){
          td.contentEditable='true';
          td.spellcheck=false;
          td.addEventListener('focus', function(){ _opOnFocus(this); });
          td.addEventListener('blur',  function(){
            // Jika kolom SAP atau STD: tandai manual edit
            if(this.dataset.col==='sap'||this.dataset.col==='std'){
              this._manualEdit = (this.textContent||'').trim().length > 0;
            }
            if(this.dataset.col==='ket'){
              this._manualKet = (this.textContent||'').trim().length > 0;
            }
            if(this.dataset.col==='std'){
              var v=(this.textContent||'').trim();
              // Jika user mengisi sendiri (bukan dari lookup SKU), tandai
              this._manualEdit = v.length > 0;
              this.style.color = v ? '#2d3748' : '#718096';
              // Recalc palet dengan std baru
              var row=this.closest('tr');
              if(row) { _calcOpRow(row); _updateOpTotals(); }
            }
            // Jika kolom SKU: lookup nama & std langsung
            if(this.dataset.col==='sku'){
              var skuVal=(this.textContent||'').trim();
              var row=this.closest('tr');
              var nCell  = row&&row.querySelector('[data-col="item"]');
              var stdCell= row&&row.querySelector('[data-col="std"]');
              // Ekspor: SAP TOTAL auto-fill dari map (seperti SAP lokal)
              // SAP Detail QT diisi manual per quotation
              var sapColLookup = _opCurrentTipe==='EKSPOR' ? 'sap_total' : 'sap';
              var sapCell= row&&row.querySelector('[data-col="'+sapColLookup+'"]');
              if(skuVal){
                if(_opnameNamaMap[skuVal]){
                  // SKU ditemukan
                  if(nCell){ nCell.textContent=_opnameNamaMap[skuVal]; nCell.style.color=''; }
                  // STD — isi jika belum manual edit
                  var stdVal=_opnameStdMap[skuVal]||0;
                  if(stdCell&&!stdCell._manualEdit){
                    stdCell.textContent=stdVal||'';
                    stdCell.style.color='#718096';
                  }
                  // SAP dari _skuDataMap (QTY kolom ke-3) — isi jika kosong
                  // Ambil SAP sesuai tipe aktif
                  var _sapSection = _opCurrentTipe==='EKSPOR' ? 'ekspor' : 'lokal';
                  var sapVal=(_skuDataMap[skuVal]&&(_skuDataMap[skuVal][_sapSection]||_skuDataMap[skuVal].sap))||0;
                  if(sapCell&&!sapCell.textContent.trim()&&sapVal){
                    sapCell.textContent=sapVal;
                    sapCell.style.color='#2b6cb0';
                  }
                  // Recalc setelah auto-fill
                  if(row){ _calcOpRow(row); _updateOpTotals(); }
                } else {
                  // SKU tidak terdaftar — mungkin data belum selesai load, retry sekali
                  if(typeof _preloadPending!=='undefined' && _preloadPending > 0){
                    var _retryTd = this;
                    setTimeout(function(){
                      var skuRetry=(_retryTd.textContent||'').trim();
                      var rowRetry=_retryTd.closest('tr');
                      var nCellR=rowRetry&&rowRetry.querySelector('[data-col="item"]');
                      var stdCellR=rowRetry&&rowRetry.querySelector('[data-col="std"]');
                      if(skuRetry&&_opnameNamaMap[skuRetry]){
                        if(nCellR){ nCellR.textContent=_opnameNamaMap[skuRetry]; nCellR.style.color=''; }
                        var stdRetry=_opnameStdMap[skuRetry]||0;
                        if(stdCellR&&!stdCellR._manualEdit){ stdCellR.textContent=stdRetry||''; stdCellR.style.color='#718096'; }
                        _calcOpRow(rowRetry); _updateOpTotals();
                      } else {
                        if(nCellR){ nCellR.textContent='⚠️ SKU tidak terdaftar'; nCellR.style.color='#e53e3e'; }
                      }
                    }, 2000);
                  } else {
                    if(nCell){ nCell.textContent='⚠️ SKU tidak terdaftar'; nCell.style.color='#e53e3e'; }
                  }
                  if(stdCell&&!stdCell._manualEdit){ stdCell.textContent=''; }
                }
              } else {
                // SKU dikosongkan
                if(nCell){ nCell.textContent=''; nCell.style.color=''; }
                if(stdCell&&!stdCell._manualEdit){ stdCell.textContent=''; }
                if(sapCell&&sapCell.style.color==='rgb(43, 108, 176)') sapCell.textContent='';
              }
            }
            _opOnBlur(this);
          });
          td.addEventListener('input', function(){ _opOnInput(this); });
          td.addEventListener('keydown', function(e){ /* handled by _STOKInit */ });
          // mousedown handled by _STOKInit
        } else {
          td.contentEditable='false';
        }
        tr.appendChild(td);
      });
      var del=document.createElement('td');
      del.style.cssText='text-align:center;width:28px;';
      del.innerHTML='<button onclick="delOpnameRow(this)" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:13px;padding:2px 5px;">&times;</button>';
      tr.appendChild(del);
      tbody.appendChild(tr);
    }

    function _opOnFocus(td){
      td.style.outline='2px solid #3182ce';
      td.style.outlineOffset='-2px';
    }

    function _opOnBlur(td){
      td.style.outline='';
      td.style.outlineOffset='';
      // Evaluasi formula jika diawali =
      var raw = td.textContent.trim();
      if(raw.startsWith('=')){
        try{
          // Sanitasi: hanya izinkan angka dan operator dasar
          var expr = raw.slice(1).replace(/[^0-9+\-*/.() ]/g,'');
          var result = Function('"use strict"; return ('+expr+')')();
          if(isFinite(result)){
            // Bulatkan sampai 4 desimal
            td.textContent = Math.round(result*10000)/10000;
          }
        } catch(e){ /* biarkan apa adanya */ }
      }
      _opOnInput(td);
    }

    function _opOnInput(td){
      // Saat ketik: recalc
      
      var tr=td.closest('tr');
      if(tr){ _calcOpRow(tr); _updateOpTotals(); }
    }

    // Helper: ambil semua td editable dalam urutan grid
    function _opAllTds(){
      var allTrs=Array.from(document.getElementById('opnameTbody').querySelectorAll('tr'));
      return allTrs.map(function(tr){
        return OP_COLS_ORDER.map(function(k){ return tr.querySelector('[data-col="'+k+'"]'); });
      });
    }

    function _opFocusCell(ri, ci){
      var grid=_opAllTds();
      // Cari kolom editable terdekat ke arah ci
      var row=grid[ri]; if(!row) return;
      var td=row[ci];
      if(td && td.contentEditable==='true'){ td.focus(); _opScrollTd(td); return; }
      // Kalau kolom auto, cari kolom editable terdekat
      for(var d=1;d<OP_COLS_ORDER.length;d++){
        var l=row[ci-d], r=row[ci+d];
        if(r && r.contentEditable==='true'){ r.focus(); _opScrollTd(r); return; }
        if(l && l.contentEditable==='true'){ l.focus(); _opScrollTd(l); return; }
      }
    }

    function _opScrollTd(td){
      if(td && td.scrollIntoView) td.scrollIntoView({block:'nearest',inline:'nearest'});
    }

    function _opOnKeydown(e, td){
      var tr     = td.closest('tr');
      var col    = td.dataset.col;
      var ci     = OP_COLS_ORDER.indexOf(col);
      var allTrs = Array.from(document.getElementById('opnameTbody').querySelectorAll('tr'));
      var ri     = allTrs.indexOf(tr);

      // Helper: pindah ke cell target
      function _goTo(nri, nci){
        _opClearSel();
        if(nri >= allTrs.length){
          addOpnameRow();
          allTrs = Array.from(document.getElementById('opnameTbody').querySelectorAll('tr'));
        }
        nri = Math.max(0, Math.min(allTrs.length-1, nri));
        nci = Math.max(0, Math.min(OP_COLS_ORDER.length-1, nci));
        var tgt = allTrs[nri] && allTrs[nri].querySelector('[data-col="'+OP_COLS_ORDER[nci]+'"]');
        // Skip kolom auto
        var dir2 = (nci > ci || e.key==='ArrowDown'||e.key==='ArrowUp') ? 1 : -1;
        if(e.key==='ArrowLeft') dir2=-1;
        while(tgt && tgt.contentEditable!=='true'){
          nci+=dir2;
          if(nci<0||nci>=OP_COLS_ORDER.length) break;
          tgt = allTrs[nri].querySelector('[data-col="'+OP_COLS_ORDER[nci]+'"]');
        }
        if(tgt && tgt.contentEditable==='true'){
          // Set _opSel ke cell baru (untuk Ctrl+C)
          _opSel={r1:nri,c1:nci,r2:nri,c2:nci};
          tgt.focus(); _opScrollTd(tgt);
        }
      }

      // ── Tab ──────────────────────────────────────────────
      if(e.key==='Tab'){
        e.preventDefault();
        var editTds=Array.from(tr.querySelectorAll('td[contenteditable="true"]'));
        var idx=editTds.indexOf(td);
        if(e.shiftKey){
          if(idx>0){ editTds[idx-1].focus(); _opScrollTd(editTds[idx-1]); }
        } else {
          if(idx<editTds.length-1){ editTds[idx+1].focus(); _opScrollTd(editTds[idx+1]); }
          else {
            var nri=ri+1;
            if(nri>=allTrs.length){ addOpnameRow(); allTrs=Array.from(document.getElementById('opnameTbody').querySelectorAll('tr')); }
            var nxt=allTrs[nri] && allTrs[nri].querySelectorAll('td[contenteditable="true"]');
            if(nxt&&nxt.length){ nxt[0].focus(); _opScrollTd(nxt[0]); }
          }
        }
        return;
      }

      // ── Enter ─────────────────────────────────────────────
      if(e.key==='Enter' && !e.shiftKey){
        e.preventDefault();
        _goTo(ri+1, ci);
        return;
      }

      // ── Delete/Backspace: hapus isi cell saat ini (Excel style) ──
      if(e.key==='Delete'){
        e.preventDefault();
        td.textContent='';
        _calcOpRow(tr); _updateOpTotals();
        return;
      }

      // ── Arrow keys — selalu pindah cell, tidak geser kursor ──
      var isArrow=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.key)>=0;
      if(!isArrow) return;

      e.preventDefault();

      var nextRi=ri, nextCi=ci;
      if(e.key==='ArrowUp')    nextRi=ri-1;
      if(e.key==='ArrowDown')  nextRi=ri+1;
      if(e.key==='ArrowRight') nextCi=ci+1;
      if(e.key==='ArrowLeft')  nextCi=ci-1;

      // Shift+Arrow → extend selection (tidak pindah cell, extend blok)
      if(e.shiftKey){
        if(_opSel.r1<0){ _opSel={r1:ri,c1:ci,r2:ri,c2:ci}; }
        nextRi=Math.max(0,Math.min(allTrs.length-1,nextRi));
        nextCi=Math.max(0,Math.min(OP_COLS_ORDER.length-1,nextCi));
        _opSel.r2=nextRi; _opSel.c2=nextCi;
        _opApplySel();
        var tShift=allTrs[nextRi]&&allTrs[nextRi].querySelector('[data-col="'+OP_COLS_ORDER[nextCi]+'"]');
        if(tShift&&tShift.contentEditable==='true'){
          (function(t){ setTimeout(function(){ t.focus(); _opScrollTd(t); },0); })(tShift);
        }
        return;
      }

      // Arrow tanpa Shift → pindah cell, clear sel
      _goTo(nextRi, nextCi);
    }

    // ── Selection untuk copy ────────────────────────────────
    function _opClearSel(){
      document.querySelectorAll('#opnameTbl .op-sel').forEach(function(el){ el.classList.remove('op-sel'); });
      _opSel={r1:-1,c1:-1,r2:-1,c2:-1};
      var info=document.getElementById('opSelInfo'); if(info) info.textContent='';
    }

    function _opApplySel(){
      document.querySelectorAll('#opnameTbl .op-sel').forEach(function(el){ el.classList.remove('op-sel'); });
      var trs=Array.from(document.getElementById('opnameTbody').querySelectorAll('tr'));
      var r1=Math.min(_opSel.r1,_opSel.r2), r2=Math.max(_opSel.r1,_opSel.r2);
      var c1=Math.min(_opSel.c1,_opSel.c2), c2=Math.max(_opSel.c1,_opSel.c2);
      if(r1<0||c1<0) return;
      for(var r=r1;r<=r2;r++){
        if(!trs[r]) continue;
        for(var ci=c1;ci<=c2;ci++){
          var td=trs[r].querySelector('[data-col="'+OP_COLS_ORDER[ci]+'"]');
          if(td) td.classList.add('op-sel');
        }
      }
      // Tampilkan info selection
      var nR=r2-r1+1, nC=c2-c1+1;
      var info=document.getElementById('opSelInfo');
      if(info) info.textContent = nR+'R × '+nC+'K  (Ctrl+C copy)';
    }

    function _opTrIdx(tr){ return Array.from(document.getElementById('opnameTbody').querySelectorAll('tr')).indexOf(tr); }
    function _opTcIdx(td){ return OP_COLS_ORDER.indexOf(td.dataset.col||''); }

    function _opBindEvents(){
      var tbl=document.getElementById('opnameTbl');
      if(!tbl||tbl._opBound) return;
      tbl._opBound=true;
      // SISTEM TABEL OK
      _STOKInit({tblId:'opnameTbl',tbodyId:'opnameTbody',cols:OP_COLS_ORDER,autoCols:{sel_awal:true,sel_akhir:true,palet:true},selClass:'op-sel',
        onAfterPaste:function(tr){
          if(typeof _opLookupRow==='function') _opLookupRow(tr);
          if(typeof _calcOpRow==='function') _calcOpRow(tr);
          if(typeof _updateOpTotals==='function') _updateOpTotals();
        },
        onDelete:function(tr){ if(typeof _calcOpRow==='function') _calcOpRow(tr); if(typeof _updateOpTotals==='function') _updateOpTotals(); },
        onSkuBlur:function(tr){
          if(typeof _opLookupRow==='function'){ _opLookupRow(tr); _calcOpRow(tr); _updateOpTotals(); }
        }
      });

      // ── Excel-style: klik 1x = fokus+ketik, drag = blok, Ctrl+C = copy sel ──
      // mousedown drag select, keydown, paste handled by _STOKInit
      document.addEventListener('mousedown',function(e){
        var opPage=document.getElementById('opnamePage');
        if(!opPage||opPage.style.display==='none') return;
        var tbl2=document.getElementById('opnameTbl');
        if(tbl2&&!tbl2.contains(e.target)) _opClearSel();
      });
      // keydown (Delete, Ctrl+C, Ctrl+A) and paste handled by _STOKInit
    }

    function _opCopyBlock(){
      var trs=Array.from(document.getElementById('opnameTbody').querySelectorAll('tr'));
      var r1=Math.min(_opSel.r1,_opSel.r2), r2=Math.max(_opSel.r1,_opSel.r2);
      var c1=Math.min(_opSel.c1,_opSel.c2), c2=Math.max(_opSel.c1,_opSel.c2);
      if(c1<0||r1<0){ showToast('Tidak ada selection','error'); return; }
      var lines=[];
      for(var r=r1;r<=r2;r++){
        if(!trs[r]) continue;
        var cells=[];
        for(var ci=c1;ci<=c2;ci++){
          var td=trs[r].querySelector('[data-col="'+OP_COLS_ORDER[ci]+'"]');
          cells.push(td?td.textContent.trim():'');
        }
        lines.push(cells.join('\t'));
      }
      var text=lines.join('\n');
      try{ navigator.clipboard.writeText(text).catch(function(){ _fallbackCopy(text); }); }
      catch(e2){ _fallbackCopy(text); }
      showToast('\uD83D\uDCCB '+(r2-r1+1)+' baris disalin','success');
    }

    function _fallbackCopy(text){
      var ta=document.createElement('textarea');
      ta.value=text; ta.style.cssText='position:fixed;opacity:0;';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }

    // ── Kalkulasi ──────────────────────────────────────────
    function _getCell(tr,col){ var el=tr.querySelector('[data-col="'+col+'"]'); return el?el.textContent.trim():''; }
    function _setCell(tr,col,val,color){
      var el=tr.querySelector('[data-col="'+col+'"]');
      if(!el) return;
      el.textContent=val===''||val==null?'':String(val);
      el.style.color=color||'';
      el.style.fontWeight=color?'700':'600';
    }

    function _opLookupRow(tr){
      var skuVal = (_getCell(tr,'sku')||'').trim();
      if(!skuVal) return;
      var sapColLookup = _opCurrentTipe==='EKSPOR' ? 'sap_detail' : 'sap';
      var nCell   = tr.querySelector('[data-col="item"]');
      var stdCell = tr.querySelector('[data-col="std"]');
      var sapCell = tr.querySelector('[data-col="'+sapColLookup+'"]');
      if(_opnameNamaMap[skuVal]){
        if(nCell){ nCell.textContent=_opnameNamaMap[skuVal]; nCell.style.color=''; }
      }
      var stdVal = _opnameStdMap[skuVal]||0;
      if(stdCell && !stdCell._manualEdit && stdVal){
        stdCell.textContent = stdVal;
        stdCell.style.color = '#718096';
      }
      var _lSection = _opCurrentTipe==='EKSPOR' ? 'ekspor' : 'lokal';
      var sapVal = (_skuDataMap[skuVal]&&(_skuDataMap[skuVal][_lSection]||_skuDataMap[skuVal].sap))||0;
      if(sapCell && !sapCell.textContent.trim() && sapVal){
        sapCell.textContent = sapVal;
        sapCell.style.color = '#2b6cb0';
      }
    }

        function _calcOpRow(tr){
      var isEkspor = _opCurrentTipe === 'EKSPOR';
      var fisik=parseFloat(_getCell(tr,'fisik'))||0;
      var pgr=parseFloat(_getCell(tr,'pgr'))||0;
      var pgi=parseFloat(_getCell(tr,'pgi'))||0;
      var sku=(_getCell(tr,'sku')||'').trim();
      var stdCellVal=parseFloat((tr.querySelector('[data-col="std"]')||{}).textContent||'')||0;
      var std=stdCellVal||_opnameStdMap[sku]||0;
      var namaCell=tr.querySelector('[data-col="item"]');
      if(namaCell && sku && _opnameNamaMap[sku]){
        namaCell.textContent=_opnameNamaMap[sku];
      }
      if(isEkspor){
        var sapTotalCell=tr.querySelector('[data-col="sap_total"]');
        var sapDetail=parseFloat(_getCell(tr,'sap_detail'))||0;
        var quotation=(_getCell(tr,'quotation')||'').trim();
        var has=sapDetail||fisik||pgr||pgi||quotation;

        // Cari baris induk (baris dengan SKU)
        var isSubRow=!sku;
        var mainTr=tr;
        if(isSubRow){
          var p=tr.previousElementSibling;
          while(p){ if((_getCell(p,'sku')||'').trim()){ mainTr=p; break; } p=p.previousElementSibling; }
          tr.classList.add('op-sub-row');
        } else {
          tr.classList.remove('op-sub-row');
        }

        // STD: ikut baris induk
        var skuEfektif=(_getCell(mainTr,'sku')||'').trim();
        var mainStdCell=mainTr.querySelector('[data-col="std"]');
        var stdEfektif=parseFloat((mainStdCell&&mainStdCell.textContent)||'')||_opnameStdMap[skuEfektif]||0;
        if(isSubRow){
          // Sub-baris: auto-fill STD dari baris induk
          var thisStdCell=tr.querySelector('[data-col="std"]');
          if(thisStdCell && !thisStdCell.textContent.trim() && stdEfektif){
            thisStdCell.textContent=stdEfektif;
            thisStdCell.style.color='#a0aec0';
          }
          // Sub-baris: SAP TOTAL kosong
          if(sapTotalCell && !sapTotalCell._manualSapTotal){
            sapTotalCell.textContent='';
            sapTotalCell.style.background='';
          }
        } else {
          // Baris induk: SAP TOTAL auto-fill dari _skuDataMap (editable, seperti SAP lokal)
          if(sapTotalCell && !sapTotalCell._manualSapTotal){
            var sapFromMap=(_skuDataMap[skuEfektif]&&_skuDataMap[skuEfektif].sap)||0;
            if(sapFromMap && !sapTotalCell.textContent.trim()){
              sapTotalCell.textContent=sapFromMap;
              sapTotalCell.style.color='#2b6cb0';
            }
          }
        }

        // SAP TOTAL baris induk untuk referensi
        var mainSapTotalCell=mainTr.querySelector('[data-col="sap_total"]');
        var sapTotal=parseFloat((mainSapTotalCell&&mainSapTotalCell.textContent)||'')||0;

        // Hitung sum semua Detail QT (baris induk + sub-baris)
        var sumDetail=parseFloat(_getCell(mainTr,'sap_detail'))||0;
        var ns=mainTr.nextElementSibling;
        while(ns){
          if((_getCell(ns,'sku')||'').trim()) break;
          sumDetail+=parseFloat(_getCell(ns,'sap_detail'))||0;
          ns=ns.nextElementSibling;
        }
        // Warning merah di SAP TOTAL kalau sum Detail QT ≠ SAP TOTAL
        if(mainSapTotalCell){
          if(sapTotal>0 && sumDetail>0 && Math.abs(sumDetail-sapTotal)>0.001){
            mainSapTotalCell.style.background='#fed7d7';
            mainSapTotalCell.style.color='#c53030';
          } else {
            mainSapTotalCell.style.background='';
            mainSapTotalCell.style.color=sapTotal>0?'#2b6cb0':'';
          }
        }

        // SEL.AKHIR = FISIK - SAP Detail QT (per baris)
        if(!has){ _setCell(tr,'sel_akhir',''); _setCell(tr,'palet',''); return; }
        var sx=fisik-sapDetail-pgr+pgi;
        _setCell(tr,'sel_akhir',sx, sx>0?'#27ae60':sx<0?'#e74c3c':'#2b6cb0');
        _setCell(tr,'palet',stdEfektif>0&&fisik>0?Math.ceil(fisik/stdEfektif):'');
        var ketEl=tr.querySelector('[data-col="ket"]');
        if(ketEl&&has&&!ketEl._manualKet) ketEl.textContent=sx>0?'PLUS':sx<0?'MINUS':'OK';
      } else {
        var sap=parseFloat(_getCell(tr,'sap'))||0;
        var sk=parseFloat(_getCell(tr,'salah_kirim'))||0;
        var adj=parseFloat(_getCell(tr,'adj'))||0;
        var has=sap||fisik||pgr||pgi||sk||adj;
        if(!has){ _setCell(tr,'sel_awal',''); _setCell(tr,'sel_akhir',''); _setCell(tr,'palet',''); return; }
        var sa=fisik-sap;
        var sx=fisik-sap-pgr+pgi+sk-adj;
        _setCell(tr,'sel_awal', sa, sa>0?'#27ae60':sa<0?'#e74c3c':'#2b6cb0');
        _setCell(tr,'sel_akhir',sx, sx>0?'#27ae60':sx<0?'#e74c3c':'#2b6cb0');
        _setCell(tr,'palet',std>0&&fisik>0?Math.ceil(fisik/std):'');
        var ketEl=tr.querySelector('[data-col="ket"]');
        if(ketEl&&has&&!ketEl._manualKet) ketEl.textContent=sx>0?'PLUS':sx<0?'MINUS':'OK';
      }
    }

    function _updateOpTotals(){
      var trs=document.getElementById('opnameTbody').querySelectorAll('tr');
      var totSku=0,totPalet=0,totPlus=0,totMinus=0,totOk=0,totSap=0,totFisik=0;
      trs.forEach(function(tr){
        if(!_getCell(tr,'sku')) return;
        totSku++;
        totPalet+=parseFloat(_getCell(tr,'palet'))||0;
        var sx=parseFloat(_getCell(tr,'sel_akhir'));
        if(!isNaN(sx)){ if(sx>0)totPlus++; else if(sx<0)totMinus++; else totOk++; }
      });
      var el=function(id){ return document.getElementById(id); };
      var paletStr=(Math.round(totPalet*1000)/1000).toLocaleString('id-ID',{maximumFractionDigits:3});
      // Stat cards
      if(el('opTotSku'))   el('opTotSku').textContent=totSku;
      if(el('opTotPalet')) el('opTotPalet').textContent=paletStr;
      if(el('opTotPlus'))  el('opTotPlus').textContent=totPlus;
      if(el('opTotMinus')) el('opTotMinus').textContent=totMinus;
      if(el('opTotOk'))    el('opTotOk').textContent=totOk;
      // Total bar bawah
      if(el('opTotSkuBar'))   el('opTotSkuBar').textContent=totSku;
      if(el('opTotPaletBar')) el('opTotPaletBar').textContent=paletStr;
      if(el('opTotPlusBar'))  el('opTotPlusBar').textContent=totPlus;
      if(el('opTotMinusBar')) el('opTotMinusBar').textContent=totMinus;
      if(el('opTotOkBar'))    el('opTotOkBar').textContent=totOk;
      // SAP & Fisik total
      var tSap=0,tFisik=0;
      var sapColKey = _opCurrentTipe==='EKSPOR' ? 'sap_total' : 'sap';
      trs.forEach(function(tr){
        tSap   += parseFloat((_getCell(tr,sapColKey)||'').replace(/[^0-9-]/g,''))||0;
        tFisik += parseInt((_getCell(tr,'fisik')||'').replace(/[^0-9-]/g,''))||0;
      });
      if(el('opTotSap'))   el('opTotSap').textContent=tSap.toLocaleString('id-ID');
      if(el('opTotFisik')) el('opTotFisik').textContent=tFisik.toLocaleString('id-ID');
      // Row count
      if(el('opRowCount')) el('opRowCount').textContent=trs.length+' BARIS';
    }

    function _renumberOpRows(){
      document.getElementById('opnameTbody').querySelectorAll('tr').forEach(function(tr,i){
        var no=tr.querySelector('.op-rnum'); if(no) no.textContent=i+1;
      });
    }

    function delOpnameRow(btn){ btn.closest('tr').remove(); _renumberOpRows(); _updateOpTotals(); }

    function clearOpnameTable(){
      if(!confirm('Kosongkan semua data?')) return;
      document.getElementById('opnameTbody').innerHTML='';
      initOpnameRows(30);
    }

    // ── Seleksi baris (klik row-header) ───────────────────
    function _opSelectRow(tr, extend){
      var ri=_opTrIdx(tr);
      if(extend&&_opSel.r1>=0){
        _opSel.r2=ri; _opSel.c1=0; _opSel.c2=OP_COLS_ORDER.length-1;
      } else {
        _opSel={r1:ri,c1:0,r2:ri,c2:OP_COLS_ORDER.length-1};
      }
      _opApplySel();
    }

    function saveOpname(){
      var tanggal=document.getElementById('opTanggal').value;
      var nama=document.getElementById('opNama').value.trim();
      var plant=document.getElementById('opPlant').value.trim();
      var tipe=document.getElementById('opTipe').value; // tipe aktif saat ini
      if(!tanggal){ showToast('Lengkapi tanggal','error'); return; }
      if(!nama){    showToast('Lengkapi nama stock keeper','error'); return; }

      // Simpan cache tipe aktif dari DOM terlebih dulu
      _opSaveCacheFor(tipe);

      var rows=[];
      var isEkspor = tipe === 'EKSPOR';

      // ── Ambil dari DOM tabel AKTIF langsung ──
      document.getElementById('opnameTbody').querySelectorAll('tr').forEach(function(tr){
        var sku=_getCell(tr,'sku');
        var quotation=_getCell(tr,'quotation');
        if(!sku && !quotation) return;
        if(isEkspor){
          var lastSku=sku;
          if(!sku){
            // sub-baris: cari SKU baris atas
            var prev=tr.previousElementSibling;
            while(prev){ var ps=_getCell(prev,'sku'); if(ps){lastSku=ps;break;} prev=prev.previousElementSibling; }
          }
          rows.push([tanggal,nama,plant,'EKSPOR',lastSku,_getCell(tr,'item'),
            _getCell(tr,'buyer'),_getCell(tr,'quotation'),_getCell(tr,'exp_date'),
            parseFloat(_getCell(tr,'fisik'))||0,
            parseFloat(_getCell(tr,'sap_detail'))||0,
            parseFloat(_getCell(tr,'sap_total'))||0,
            parseFloat(_getCell(tr,'pgr'))||0,parseFloat(_getCell(tr,'pgi'))||0,
            parseFloat(_getCell(tr,'sel_akhir'))||0,
            _getCell(tr,'ket'),parseFloat(_getCell(tr,'palet'))||0,parseFloat(_getCell(tr,'std'))||0]);
        } else {
          if(!sku) return;
          rows.push([tanggal,nama,plant,'LOKAL',sku,_getCell(tr,'item'),
            parseFloat(_getCell(tr,'sap'))||0,parseFloat(_getCell(tr,'fisik'))||0,
            parseFloat(_getCell(tr,'sel_awal'))||0,
            parseFloat(_getCell(tr,'pgr'))||0,parseFloat(_getCell(tr,'pgi'))||0,
            parseFloat(_getCell(tr,'salah_kirim'))||0,parseFloat(_getCell(tr,'adj'))||0,
            parseFloat(_getCell(tr,'sel_akhir'))||0,
            _getCell(tr,'ket'),parseFloat(_getCell(tr,'palet'))||0]);
        }
      });

      // ── Ambil dari DOM tabel GDFG aktif ──
      document.getElementById('opnameTbodyGdfg').querySelectorAll('tr').forEach(function(tr){
        var sku=_getCell(tr,'sku'); if(!sku) return;
        if(isEkspor){
          rows.push([tanggal,nama,plant,'GDFG-EKSPOR',sku,_getCell(tr,'item'),
            _getCell(tr,'buyer'),_getCell(tr,'quotation'),_getCell(tr,'exp_date'),
            parseFloat(_getCell(tr,'fisik'))||0,
            parseFloat(_getCell(tr,'sap_detail'))||0,
            parseFloat(_getCell(tr,'sap_total'))||0,
            parseFloat(_getCell(tr,'pgr'))||0,parseFloat(_getCell(tr,'pgi'))||0,
            parseFloat(_getCell(tr,'sel_akhir'))||0,
            _getCell(tr,'ket'),parseFloat(_getCell(tr,'palet'))||0,parseFloat(_getCell(tr,'std'))||0]);
        } else {
          rows.push([tanggal,nama,plant,'GDFG',sku,_getCell(tr,'item'),
            parseFloat(_getCell(tr,'sap'))||0,parseFloat(_getCell(tr,'fisik'))||0,
            parseFloat(_getCell(tr,'sel_awal'))||0,
            parseFloat(_getCell(tr,'pgr'))||0,parseFloat(_getCell(tr,'pgi'))||0,
            parseFloat(_getCell(tr,'salah_kirim'))||0,parseFloat(_getCell(tr,'adj'))||0,
            parseFloat(_getCell(tr,'sel_akhir'))||0,
            _getCell(tr,'ket'),parseFloat(_getCell(tr,'palet'))||0]);
        }
      });

      // ── Tambah dari cache tipe NON-AKTIF ──
      var otherTipe = isEkspor ? 'LOKAL' : 'EKSPOR';
      var otherCache = _opTipeCache[otherTipe]||[];
      otherCache.forEach(function(d){
        if(!d.sku) return;
        if(otherTipe==='LOKAL'){
          rows.push([tanggal,nama,plant,'LOKAL',d.sku||'',d.item||'',
            parseFloat(d.sap)||0,parseFloat(d.fisik)||0,parseFloat(d.sel_awal)||0,
            parseFloat(d.pgr)||0,parseFloat(d.pgi)||0,
            parseFloat(d.salah_kirim)||0,parseFloat(d.adj)||0,
            parseFloat(d.sel_akhir)||0,d.ket||'',parseFloat(d.palet)||0]);
        } else {
          rows.push([tanggal,nama,plant,'EKSPOR',d.sku||'',d.item||'',
            d.buyer||'',d.quotation||'',d.exp_date||'',
            parseFloat(d.fisik)||0,parseFloat(d.sap_detail)||0,parseFloat(d.sap_total)||0,
            parseFloat(d.pgr)||0,parseFloat(d.pgi)||0,
            parseFloat(d.sel_akhir)||0,d.ket||'',parseFloat(d.palet)||0,parseFloat(d.std)||0]);
        }
      });
      // GDFG non-aktif
      var otherGdfg = _opGdfgTipeCache[otherTipe]||[];
      otherGdfg.forEach(function(d){
        if(!d.sku) return;
        var gArea = otherTipe==='LOKAL'?'GDFG':'GDFG-EKSPOR';
        if(otherTipe==='LOKAL'){
          rows.push([tanggal,nama,plant,gArea,d.sku||'',d.item||'',
            parseFloat(d.sap)||0,parseFloat(d.fisik)||0,parseFloat(d.sel_awal)||0,
            parseFloat(d.pgr)||0,parseFloat(d.pgi)||0,
            parseFloat(d.salah_kirim)||0,parseFloat(d.adj)||0,
            parseFloat(d.sel_akhir)||0,d.ket||'',parseFloat(d.palet)||0]);
        } else {
          rows.push([tanggal,nama,plant,gArea,d.sku||'',d.item||'',
            d.buyer||'',d.quotation||'',d.exp_date||'',
            parseFloat(d.fisik)||0,parseFloat(d.sap_detail)||0,parseFloat(d.sap_total)||0,
            parseFloat(d.pgr)||0,parseFloat(d.pgi)||0,
            parseFloat(d.sel_akhir)||0,d.ket||'',parseFloat(d.palet)||0,parseFloat(d.std)||0]);
        }
      });

      if(!rows.length){ showToast('Tidak ada data untuk disimpan','error'); return; }
      showToast('Menyimpan '+rows.length+' baris...','info');
      google.script.run
        .withSuccessHandler(function(res){
          if(res.success){
            showToast('\u2705 '+rows.length+' baris tersimpan!','success');
            // Clear tabel setelah save berhasil
            initOpnameRows(30);
            initOpnameGdfgRows(30);
            _updateOpTotals();
            _updateOpGdfgTotals();
          } else {
            showToast('\u274c '+(res.message||'Error'),'error');
          }
        })
        .withFailureHandler(function(e){ showToast('\u274c Gagal: '+e,'error'); })
        .saveOpnameData(rows);
    }


    // ═══════════════════════════════════════════════════════
    // FIFO TABLE — SKU|NAMA|PRODATE|PALLET|KARTON|TOTAL|BIN
    // ═══════════════════════════════════════════════════════
    var _fifoZoom = 100;
    var _fifoSkuMap = {}; // SKU → {nama, std}
    var _fifoPasteActive = false;

    // Load STD map dari getStandarPalet (sudah ada di GAS)
    function _loadFifoSkuMap(cb){
      if(Object.keys(_fifoSkuMap).length > 0){ if(cb) cb(); return; }
      if(typeof google === 'undefined' || !google.script){ if(cb) cb(); return; }
      google.script.run.withSuccessHandler(function(res){
        if(res && res.data){
          res.data.forEach(function(d){
            _fifoSkuMap[String(d.sku).trim()] = {nama: d.nama||'', std: Number(d.std)||0};
          });
        }
        if(cb) cb();
      }).getStandarPalet();
    }

    function _mkFifoTd(content, editable, cls){
      var td = document.createElement('td');
      if(cls) td.className = cls;
      if(editable){
        td.contentEditable = 'true';
        td.spellcheck = false;
        td.addEventListener('focus', function(){ _fifoOnFocus(this); });
        td.addEventListener('blur',  function(){ _fifoOnBlur(this); });
        // keydown handled by _STOKInit
      }
      if(content !== undefined && content !== null && content !== '') td.textContent = content;
      return td;
    }

    // ── FIFO Block Select & Copy ──────────────────────────
    var _fifoSel = {r1:-1,c1:-1,r2:-1,c2:-1};
    var _fifoDragging = false;
    var _fifoSubTipe = 'LOKAL'; // 'LOKAL' | 'EKSPOR'
    var FIFO_COLS_LOKAL  = ['sku','nama','prodate','pallet','karton','bin'];
    var FIFO_COLS_EKSPOR = ['sku','nama','buyer','prodate','quotation','pallet','karton','bin'];
    var FIFO_COLS = FIFO_COLS_LOKAL.slice();

    function _fifoTrIdx(tr){ return Array.from(document.getElementById('fifoTbody').querySelectorAll('tr')).indexOf(tr); }
    function _fifoTcIdx(td){ return FIFO_COLS.indexOf(td.dataset.col||''); }

    function fifoSetSubTipe(tipe){
      if(_fifoSubTipe === tipe) return;
      _fifoSubTipe = tipe;
      FIFO_COLS = tipe==='EKSPOR' ? FIFO_COLS_EKSPOR.slice() : FIFO_COLS_LOKAL.slice();
      // Update button style
      var bL=document.getElementById('btnFifoLokal'), bE=document.getElementById('btnFifoEkspor');
      if(bL) bL.style.cssText='padding:4px 14px;font-size:12px;font-weight:700;border:none;border-radius:6px;cursor:pointer;background:'+(tipe==='LOKAL'?'#2563eb;color:#fff':'#e2e8f0;color:#4a5568')+';';
      if(bE) bE.style.cssText='padding:4px 14px;font-size:12px;font-weight:700;border:none;border-radius:6px;cursor:pointer;background:'+(tipe==='EKSPOR'?'#9b59b6;color:#fff':'#e2e8f0;color:#4a5568')+';';
      // Update dropdown nama di form input (opNama) sesuai plant + sub-tipe FIFO
      _fifoUpdateNamaDropdown();
      // Update dropdown nama di riwayat FIFO
      _fifoUpdateViewNamaDropdown(tipe);
      // Rebuild thead
      _fifoRenderThead();
      // Clear table dan isi ulang
      var tbody=document.getElementById('fifoTbody'); if(tbody) tbody.innerHTML='';
      _loadFifoSkuMap(function(){
        for(var i=0;i<30;i++) _appendFifoRow();
        _updateFifoStats();
      });
    }

    function _fifoUpdateNamaDropdown(){
      var plant = (document.getElementById('opPlant')||{}).value||'';
      var tipeKey = plant + '|' + (_fifoSubTipe==='EKSPOR' ? 'FIFO-EKSPOR' : 'FIFO');
      var names = _NAMA_MAP[tipeKey] || [];
      var sel = document.getElementById('opNama');
      if(!sel) return;
      var cur = sel.value;
      sel.innerHTML = '<option value="">— Pilih Nama —</option>';
      names.forEach(function(n){
        var opt=document.createElement('option'); opt.value=n; opt.textContent=n;
        if(n===cur) opt.selected=true;
        sel.appendChild(opt);
      });
    }

    function _fifoUpdateViewNamaDropdown(subTipe){
      var sel = document.getElementById('fifoViewNama'); if(!sel) return;
      var isEks = subTipe==='EKSPOR';
      var names = isEks ? ['Ade','Aldy'] : ['Faishal','Dimas','Apri'];
      var cur = sel.value;
      sel.innerHTML = '<option value="">Semua Nama</option>';
      names.forEach(function(n){
        var opt=document.createElement('option'); opt.value=n; opt.textContent=n;
        if(n===cur) opt.selected=true;
        sel.appendChild(opt);
      });
    }

    function _fifoRenderThead(){
      var thead=document.getElementById('fifoThead'); if(!thead) return;
      var isEks=_fifoSubTipe==='EKSPOR';
      var thS='background:#1a3a6b;color:#fff;';
      var h='<tr>';
      h+='<th style="'+thS+'width:32px">#</th>';
      h+='<th style="'+thS+'min-width:100px">SKU</th>';
      h+='<th style="'+thS+'min-width:220px">NAMA BARANG</th>';
      if(isEks) h+='<th style="'+thS+'min-width:120px">BUYER</th>';
      h+='<th style="'+thS+'min-width:105px">PRODATE</th>';
      if(isEks) h+='<th style="'+thS+'min-width:120px">QUOTATION</th>';
      h+='<th class="num" style="'+thS+'min-width:75px">PALLET</th>';
      h+='<th class="num" style="'+thS+'min-width:75px">KARTON</th>';
      h+='<th class="num" style="'+thS+'min-width:100px">TOTAL KARTON</th>';
      h+='<th style="'+thS+'min-width:180px">BIN. LOC</th>';
      h+='<th style="'+thS+'width:28px"></th>';
      h+='</tr>';
      thead.innerHTML=h;
    }

    function _fifoTrIdx(tr){ return Array.from(document.getElementById('fifoTbody').querySelectorAll('tr')).indexOf(tr); }
    function _fifoTcIdx(td){ return FIFO_COLS.indexOf(td.dataset.col||''); }

    function _fifoClearSel(){
      document.querySelectorAll('#fifoTbl .fifo-sel').forEach(function(el){ el.classList.remove('fifo-sel'); });
      _fifoSel={r1:-1,c1:-1,r2:-1,c2:-1};
      var info=document.getElementById('fifoSelInfo'); if(info) info.textContent='';
    }

    function _fifoApplySel(){
      document.querySelectorAll('#fifoTbl .fifo-sel').forEach(function(el){ el.classList.remove('fifo-sel'); });
      var trs=Array.from(document.getElementById('fifoTbody').querySelectorAll('tr'));
      var r1=Math.min(_fifoSel.r1,_fifoSel.r2), r2=Math.max(_fifoSel.r1,_fifoSel.r2);
      var c1=Math.min(_fifoSel.c1,_fifoSel.c2), c2=Math.max(_fifoSel.c1,_fifoSel.c2);
      if(r1<0||c1<0) return;
      for(var r=r1;r<=r2;r++){
        if(!trs[r]) continue;
        for(var c=c1;c<=c2;c++){
          var td=trs[r].querySelector('[data-col="'+FIFO_COLS[c]+'"]');
          if(td) td.classList.add('fifo-sel');
        }
      }
      var nR=r2-r1+1, nC=c2-c1+1;
      var info=document.getElementById('fifoSelInfo');
      if(info) info.textContent = (nR>1||nC>1) ? nR+'R × '+nC+'K  (Ctrl+C copy)' : '';
    }

    function _fifoCopyBlock(){
      var trs=Array.from(document.getElementById('fifoTbody').querySelectorAll('tr'));
      var r1=Math.min(_fifoSel.r1,_fifoSel.r2), r2=Math.max(_fifoSel.r1,_fifoSel.r2);
      var c1=Math.min(_fifoSel.c1,_fifoSel.c2), c2=Math.max(_fifoSel.c1,_fifoSel.c2);
      if(r1<0||c1<0){ showToast('Tidak ada selection','error'); return; }
      var lines=[];
      for(var r=r1;r<=r2;r++){
        if(!trs[r]) continue;
        var cells=[];
        for(var c=c1;c<=c2;c++){
          var td=trs[r].querySelector('[data-col="'+FIFO_COLS[c]+'"]');
          cells.push(td?td.textContent.trim():'');
        }
        lines.push(cells.join('\t'));
      }
      var text=lines.join('\n');
      try{ navigator.clipboard.writeText(text).catch(function(){ _fallbackCopy(text); }); }
      catch(e){ _fallbackCopy(text); }
      showToast('📋 '+(r2-r1+1)+' baris disalin','success');
    }

    function _fifoBindEvents(){
      var tbl=document.getElementById('fifoTbl');
      if(!tbl||tbl._fifoBound) return;
      tbl._fifoBound=true;
      // SISTEM TABEL OK
      _STOKInit({tblId:'fifoTbl',tbodyId:'fifoTbody',cols:FIFO_COLS,autoCols:{total:true},selClass:'fifo-sel',
        onAfterPaste:function(tr){ _fifoLookupSku(tr); _fifoCalcTotal(tr); _updateFifoStats(); },
        onDelete:function(tr){ _fifoCalcTotal(tr); _updateFifoStats(); }
      });

      // mousedown, keydown, paste handled by _STOKInit

      // ── Klik di luar → clear sel ──
      document.addEventListener('mousedown',function(e){
        var cardFifo=document.getElementById('opCardFifo');
        if(!cardFifo||cardFifo.style.display==='none') return;
        if(!tbl.contains(e.target)) _fifoClearSel();
      });
    }

    function _appendFifoRow(vals){
      var v = vals || {};
      var tbody = document.getElementById('fifoTbody');
      var tr = document.createElement('tr');
      var isEks = _fifoSubTipe === 'EKSPOR';

      // # row number
      var noTd = document.createElement('td');
      noTd.className = 'row-no';
      tr.appendChild(noTd);

      // SKU
      var tdSku = _mkFifoTd(v.sku||'', true, 'op-td');
      tdSku.dataset.col = 'sku';
      tdSku.addEventListener('blur', function(){
        _fifoLookupSku(tr); _fifoCalcTotal(tr); _updateFifoStats();
      });
      tr.appendChild(tdSku);

      // NAMA
      var tdNama = _mkFifoTd(v.nama||'', true, 'op-td');
      tdNama.dataset.col = 'nama';
      tr.appendChild(tdNama);

      // BUYER (ekspor only)
      if(isEks){
        var tdBuyer = _mkFifoTd(v.buyer||'', true, 'op-td');
        tdBuyer.dataset.col = 'buyer';
        tr.appendChild(tdBuyer);
      }

      // PRODATE
      var tdProd = _mkFifoTd(v.prodate||'', true, 'op-td');
      tdProd.dataset.col = 'prodate';
      tr.appendChild(tdProd);

      // QUOTATION (ekspor only)
      if(isEks){
        var tdQuot = _mkFifoTd(v.quotation||'', true, 'op-td');
        tdQuot.dataset.col = 'quotation';
        tr.appendChild(tdQuot);
      }

      // PALLET
      var tdPal = _mkFifoTd(v.pallet||'', true, 'op-td td-num');
      tdPal.dataset.col = 'pallet';
      tdPal.addEventListener('blur', function(){ _fifoCalcTotal(tr); _updateFifoStats(); });
      tr.appendChild(tdPal);

      // KARTON
      var tdKrt = _mkFifoTd(v.karton||'', true, 'op-td td-num');
      tdKrt.dataset.col = 'karton';
      tdKrt.addEventListener('blur', function(){ _fifoCalcTotal(tr); _updateFifoStats(); });
      tr.appendChild(tdKrt);

      // TOTAL KARTON (auto)
      var tdTot = document.createElement('td');
      tdTot.dataset.col = 'total';
      tdTot.className = 'td-auto';
      if(v.total) tdTot.textContent = v.total;
      tr.appendChild(tdTot);

      // BIN LOC
      var tdBin = _mkFifoTd(v.bin||'', true, 'op-td');
      tdBin.dataset.col = 'bin';
      tr.appendChild(tdBin);

      // Hapus baris
      var tdDel = document.createElement('td');
      tdDel.className = 'td-del';
      var btnDel = document.createElement('button');
      btnDel.className = 'del-row-btn';
      btnDel.innerHTML = '&#10005;';
      btnDel.title = 'Hapus baris';
      btnDel.addEventListener('click', function(){
        tr.parentNode.removeChild(tr); _renumberFifo(); _updateFifoStats();
      });
      tdDel.appendChild(btnDel);
      tr.appendChild(tdDel);

      tbody.appendChild(tr);
      _renumberFifo();
    }

    // Helper: ambil SKU efektif dari baris — jika kosong, cari ke baris atas sampai ketemu
    function _fifoEffSku(tr){
      var tbody = document.getElementById('fifoTbody');
      var trs = tbody ? Array.from(tbody.querySelectorAll('tr')) : [];
      var idx = trs.indexOf(tr);
      for(var i = idx; i >= 0; i--){
        var v = (trs[i].querySelector('[data-col="sku"]').textContent||'').trim();
        if(v) return v;
      }
      return '';
    }

    function _fifoLookupSku(tr){
      var sku = _fifoEffSku(tr);
      var tdNama = tr.querySelector('[data-col="nama"]');
      if(sku && _fifoSkuMap[sku]){
        tdNama.textContent = _fifoSkuMap[sku].nama;
        tr._fifoStd = _fifoSkuMap[sku].std;
      }
    }

    function _fifoCalcTotal(tr){
      var pallet = parseFloat((tr.querySelector('[data-col="pallet"]').textContent||'0').replace(',','.'))||0;
      var karton = parseFloat((tr.querySelector('[data-col="karton"]').textContent||'0').replace(',','.'))||0;
      var sku = _fifoEffSku(tr);
      var stdPal = tr._fifoStd || (_fifoSkuMap[sku] ? _fifoSkuMap[sku].std : 0);
      var total = (pallet * stdPal) + karton;
      var tdTot = tr.querySelector('[data-col="total"]');
      tdTot.textContent = total > 0 ? total : '';
    }
    function _renumberFifo(){
      var rows = document.querySelectorAll('#fifoTbody tr');
      rows.forEach(function(tr, i){ var no = tr.querySelector('.row-no'); if(no) no.textContent = i+1; });
      var rc = document.getElementById('fifoRowCount');
      if(rc) rc.textContent = rows.length + ' BARIS';
    }

    function _updateFifoStats(){
      var rows = document.querySelectorAll('#fifoTbody tr');
      var skuSet = {}, prodateSet = {};
      var totPal = 0, totKrt = 0;
      rows.forEach(function(tr){
        var sku     = _fifoEffSku(tr);
        var prodate = (tr.querySelector('[data-col="prodate"]').textContent||'').trim();
        if(sku) skuSet[sku] = true;
        if(prodate) prodateSet[sku+'|'+prodate] = true;
        totPal += parseFloat((tr.querySelector('[data-col="pallet"]').textContent||'0').replace(',','.'))||0;
        totKrt += parseFloat((tr.querySelector('[data-col="total"]').textContent||'0').replace(',','.'))||0;
      });
      var el = function(id){ return document.getElementById(id); };
      if(el('fifoTotSku'))     el('fifoTotSku').textContent     = Object.keys(skuSet).length;
      if(el('fifoTotPallet'))  el('fifoTotPallet').textContent  = totPal;
      if(el('fifoTotKarton'))  el('fifoTotKarton').textContent  = totKrt;
      if(el('fifoTotProdate')) el('fifoTotProdate').textContent = Object.keys(prodateSet).length;
    }

    function addFifoRow(n){
      _loadFifoSkuMap(function(){
        for(var i=0;i<(n||1);i++) _appendFifoRow();
        _updateFifoStats();
      });
    }

    function clearFifoTable(){
      document.getElementById('fifoTbody').innerHTML='';
      _updateFifoStats();
    }

    function fifoZoom(delta){
      _fifoZoom = Math.min(150, Math.max(60, _fifoZoom + delta));
      var tbl = document.getElementById('fifoTbl');
      if(tbl) tbl.style.fontSize = (_fifoZoom/100*13)+'px';
      var lbl = document.getElementById('fifoZoomLabel');
      if(lbl) lbl.textContent = _fifoZoom+'%';
    }

    function fifoZoomReset(){
      _fifoZoom = 100;
      var tbl = document.getElementById('fifoTbl');
      if(tbl) tbl.style.fontSize = '13px';
      var lbl = document.getElementById('fifoZoomLabel');
      if(lbl) lbl.textContent = '100%';
    }

    function fifoPasteMode(){
      _fifoPasteActive = true;
      showToast('💡 Klik sel di tabel FIFO lalu paste (Ctrl+V) dari Excel\nUrutan kolom: SKU | NAMA | PRODATE | PALLET | KARTON | BIN.LOC', '');
    }

    // Paste handler untuk tabel FIFO
    document.addEventListener('paste', function(e){
      var active = document.activeElement;
      if(!active || !active.closest || !active.closest('#fifoTbl')) return;
      var text = (e.clipboardData || window.clipboardData).getData('text');
      if(!text) return;
      var lines = text.split(/\r?\n/).filter(function(l,i,a){ return !(i===a.length-1 && l===''); });
      if(lines.length <= 1 && !lines[0].includes('\t')) return;
      e.preventDefault();

      _loadFifoSkuMap(function(){
        var tbody = document.getElementById('fifoTbody');
        // Kolom urutan paste: SKU(0) NAMA(1) PRODATE(2) PALLET(3) KARTON(4) BIN(5)
        var COLS = ['sku','nama','prodate','pallet','karton','bin'];
        // Cari baris aktif
        var activeTr = active.closest('tr');
        var allTrs = Array.from(tbody.querySelectorAll('tr'));
        var startR = activeTr ? allTrs.indexOf(activeTr) : allTrs.length;
        var activeTd = active.closest('td[data-col]');
        var startC = activeTd ? COLS.indexOf(activeTd.dataset.col) : 0;
        if(startC < 0) startC = 0;

        lines.forEach(function(line, ri){
          var cells = line.split('\t');
          while(allTrs.length <= startR + ri){ _appendFifoRow(); allTrs = Array.from(tbody.querySelectorAll('tr')); }
          var tr = allTrs[startR + ri];
          cells.forEach(function(val, ci){
            var colIdx = startC + ci;
            if(colIdx >= COLS.length) return;
            var colKey = COLS[colIdx];
            var td = tr.querySelector('[data-col="'+colKey+'"]');
            if(td) td.textContent = val.trim();
          });
          _fifoLookupSku(tr); // jika SKU di-paste, auto-fill nama
          _fifoCalcTotal(tr);
        });
        _updateFifoStats();
        showToast('✅ '+lines.length+' baris dipaste', '');
      });
    });

    // Keyboard navigation FIFO
    function _fifoOnFocus(td){ td.style.outline='none'; }
    function _fifoOnBlur(td){
      _fifoEvalFormula(td);
      var tr = td.closest('tr');
      if(tr){ _fifoCalcTotal(tr); _updateFifoStats(); }
    }
    function _fifoKeydown(e, td){
      var tr    = td.closest('tr');
      var tbody = document.getElementById('fifoTbody');
      var allTrs= Array.from(tbody.querySelectorAll('tr'));
      var COLS  = ['sku','nama','prodate','pallet','karton','bin'];
      var curC  = COLS.indexOf(td.dataset.col);
      var curR  = allTrs.indexOf(tr);

      function _getTd(r, c){
        if(r<0||r>=allTrs.length||c<0||c>=COLS.length) return null;
        return allTrs[r].querySelector('[data-col="'+COLS[c]+'"]');
      }
      function _go(nextTd){
        _fifoEvalFormula(td);
        _fifoCalcTotal(tr);
        _updateFifoStats();
        if(nextTd && nextTd.contentEditable==='true'){
          nextTd.focus();
          // Pilih semua teks di cell tujuan
          var range = document.createRange();
          range.selectNodeContents(nextTd);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }

      var isArrow = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.key)>=0;
      if(isArrow){
        var sel    = window.getSelection();
        var txt    = td.textContent;
        var offset = sel ? sel.focusOffset : 0;
        var atEnd  = offset >= txt.length;
        var atStart= offset <= 0;

        if(e.key==='ArrowUp'){
          e.preventDefault(); _go(_getTd(curR-1, curC));
        } else if(e.key==='ArrowDown'){
          e.preventDefault(); _go(_getTd(curR+1, curC));
        } else if(e.key==='ArrowRight' && (atEnd || txt==='')){
          e.preventDefault();
          var nc=curC+1, nr=curR;
          if(nc>=COLS.length){ nc=0; nr++; }
          _go(_getTd(nr, nc));
        } else if(e.key==='ArrowLeft' && (atStart || txt==='')){
          e.preventDefault();
          var nc=curC-1, nr=curR;
          if(nc<0){ nc=COLS.length-1; nr--; }
          _go(_getTd(nr, nc));
        }
        return;
      }

      if(e.key==='Tab'){
        e.preventDefault();
        var nextC=e.shiftKey?curC-1:curC+1, nextR=curR;
        if(nextC>=COLS.length){ nextC=0; nextR++; }
        if(nextC<0){ nextC=COLS.length-1; nextR--; }
        _go(_getTd(nextR, nextC));
      } else if(e.key==='Enter'){
        e.preventDefault();
        _go(_getTd(curR+1, curC));
      }
    }

    // Evaluasi rumus =expr (contoh: =25+10+5+9)
    function _fifoEvalFormula(td){
      var txt = (td.textContent||'').trim();
      if(txt.charAt(0)!=='=') return;
      var expr = txt.slice(1)
                    .replace(/,/g,'.')           // desimal koma -> titik
                    .replace(/[^0-9.+\-*/().\s]/g,''); // whitelist karakter aman
      if(!expr) return;
      try{
        var result = Function('"use strict"; return ('+expr+')')();
        if(typeof result==='number' && isFinite(result)){
          // Tampilkan tanpa desimal trailing jika bilangan bulat
          td.textContent = (result % 1 === 0) ? String(Math.round(result)) : parseFloat(result.toFixed(6)).toString();
        }
      }catch(ex){ /* expr tidak valid, biarkan teks apa adanya */ }
    }

    // Simpan FIFO ke GAS
    function saveFifo(){
      var tanggal = document.getElementById('opTanggal').value;
      var nama    = document.getElementById('opNama').value.trim();
      var plant   = document.getElementById('opPlant').value.trim();
      var isEks   = _fifoSubTipe === 'EKSPOR';
      if(!tanggal){ showToast('Lengkapi tanggal','error'); return; }
      if(!nama){    showToast('Lengkapi nama stock keeper','error'); return; }

      var rows = [];
      document.querySelectorAll('#fifoTbody tr').forEach(function(tr){
        var sku     = _fifoEffSku(tr);
        var namaBrg = (tr.querySelector('[data-col="nama"]').textContent||'').trim();
        var prodate = (tr.querySelector('[data-col="prodate"]').textContent||'').trim();
        var pallet  = (tr.querySelector('[data-col="pallet"]').textContent||'').trim();
        var karton  = (tr.querySelector('[data-col="karton"]').textContent||'').trim();
        var total   = (tr.querySelector('[data-col="total"]').textContent||'').trim();
        var bin     = (tr.querySelector('[data-col="bin"]').textContent||'').trim();
        var stdPal  = tr._fifoStd || (_fifoSkuMap[sku] ? _fifoSkuMap[sku].std : 0);
        var prodateEmpty = !prodate || prodate === '-';
        var palletZero   = !parseFloat(pallet);
        var kartonZero   = !parseFloat(karton);
        if(prodateEmpty && palletZero && kartonZero) return;
        if(isEks){
          var buyer = (tr.querySelector('[data-col="buyer"]')||{textContent:''}).textContent.trim();
          var quot  = (tr.querySelector('[data-col="quotation"]')||{textContent:''}).textContent.trim();
          rows.push([tanggal, nama, plant, sku, namaBrg, buyer, prodate, quot,
                     parseFloat(pallet)||0, parseFloat(karton)||0,
                     parseFloat(total)||0, stdPal, bin]);
        } else {
          rows.push([tanggal, nama, plant, sku, namaBrg, prodate,
                     parseFloat(pallet)||0, parseFloat(karton)||0,
                     parseFloat(total)||0, stdPal, bin]);
        }
      });

      if(rows.length === 0){ showToast('Tidak ada data FIFO untuk disimpan','error'); return; }

      var btn = document.querySelector('#opCardFifo .op-btn-save');
      if(btn){ btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Menyimpan...'; }

      if(typeof google === 'undefined' || !google.script){ showToast('Tidak bisa connect ke server','error'); if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-save"></i> Simpan FIFO';} return; }

      var fn = isEks ? 'saveFifoEksporData' : 'saveFifoData';
      google.script.run
        .withSuccessHandler(function(res){
          if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-save"></i> Simpan FIFO'; }
          if(res && res.success){
            showToast('✅ '+res.message,'success');
            clearFifoTable();
            _loadFifoSkuMap(function(){
              for(var i=0;i<30;i++) _appendFifoRow();
              _updateFifoStats();
            });
          } else {
            showToast('❌ '+(res&&res.message?res.message:'Gagal menyimpan'),'error');
          }
        })
        .withFailureHandler(function(err){
          if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-save"></i> Simpan FIFO'; }
          showToast('❌ Error: '+err.message,'error');
        })
        [fn](rows);
    }

    // Init FIFO saat halaman opname dibuka
    function _initFifoIfNeeded(){
      _fifoRenderThead();
      _fifoUpdateNamaDropdown();
      _fifoUpdateViewNamaDropdown(_fifoSubTipe);
      var tbody = document.getElementById('fifoTbody');
      if(tbody && tbody.querySelectorAll('tr').length === 0){
        _loadFifoSkuMap(function(){
          for(var i=0;i<30;i++) _appendFifoRow();
          _updateFifoStats();
        });
      }
      _fifoBindEvents();
    }

    // ═══════════════════════════════════════════════════════
    // QT READY — Input tabel QT Ready
    // ═══════════════════════════════════════════════════════
    var QT_COLS       = ['sku','nama','buyer','qty','qt','si','schedule','cont','ket'];
    var QT_EDITABLE   = ['sku','buyer','qty','qt','si','schedule','cont','ket'];
    var QT_AUTO       = {}; // tidak ada kolom pure auto — nama bisa diisi manual
    var _qtZoom       = 100;
    var _qtPasteActive = false;
    var _qtSel        = {r1:-1,c1:-1,r2:-1,c2:-1};
    var _qtDragging   = false;
    var _qtInited     = false;
    var _qtSkuMap     = {}; // reuse dari _fifoSkuMap lewat _loadFifoSkuMap

    function _qtTrIdx(tr){ return Array.from(document.getElementById('qtTbody').querySelectorAll('tr')).indexOf(tr); }
    function _qtTcIdx(td){ return QT_COLS.indexOf(td.dataset.col||''); }

    function _qtClearSel(){
      document.querySelectorAll('#qtTbl .qt-sel').forEach(function(el){ el.classList.remove('qt-sel'); });
      _qtSel={r1:-1,c1:-1,r2:-1,c2:-1};
      var info=document.getElementById('qtSelInfo'); if(info) info.textContent='';
    }

    function _qtApplySel(){
      document.querySelectorAll('#qtTbl .qt-sel').forEach(function(el){ el.classList.remove('qt-sel'); });
      var r1=Math.min(_qtSel.r1,_qtSel.r2), r2=Math.max(_qtSel.r1,_qtSel.r2);
      var c1=Math.min(_qtSel.c1,_qtSel.c2), c2=Math.max(_qtSel.c1,_qtSel.c2);
      var trs=Array.from(document.getElementById('qtTbody').querySelectorAll('tr'));
      for(var r=r1;r<=r2;r++){
        if(!trs[r]) continue;
        for(var c=c1;c<=c2;c++){
          var k=QT_COLS[c]; var td=trs[r]&&trs[r].querySelector('[data-col="'+k+'"]');
          if(td) td.classList.add('qt-sel');
        }
      }
      var info=document.getElementById('qtSelInfo');
      if(info){var rows=r2-r1+1,cols=c2-c1+1; info.textContent=rows>1||cols>1?rows+'×'+cols:''; }
    }

    // Helper: ambil SKU efektif naik ke atas jika baris kosong
    function _qtEffSku(tr){
      var tbody=document.getElementById('qtTbody');
      var trs=tbody?Array.from(tbody.querySelectorAll('tr')):[];
      var idx=trs.indexOf(tr);
      for(var i=idx;i>=0;i--){
        var v=(trs[i].querySelector('[data-col="sku"]').textContent||'').trim();
        if(v) return v;
      }
      return '';
    }

    function _qtEffBuyer(tr){
      var tbody=document.getElementById('qtTbody');
      var trs=tbody?Array.from(tbody.querySelectorAll('tr')):[];
      var idx=trs.indexOf(tr);
      for(var i=idx;i>=0;i--){
        var v=(trs[i].querySelector('[data-col="buyer"]').textContent||'').trim();
        if(v) return v;
      }
      return '';
    }

    function _qtEffNama(tr){
      var tbody=document.getElementById('qtTbody');
      var trs=tbody?Array.from(tbody.querySelectorAll('tr')):[];
      var idx=trs.indexOf(tr);
      for(var i=idx;i>=0;i--){
        var v=(trs[i].querySelector('[data-col="nama"]').textContent||'').trim();
        if(v) return v;
      }
      return '';
    }

    // Merge visual: samarkan SKU/NAMA/BUYER jika sama dengan baris sebelumnya
    function _qtApplyMerge(){
      var trs=Array.from(document.querySelectorAll('#qtTbody tr'));
      trs.forEach(function(tr,i){
        ['sku','nama','buyer'].forEach(function(col){
          var td=tr.querySelector('[data-col="'+col+'"]');
          if(!td) return;
          var cur=(td.textContent||'').trim();
          if(i===0){ td.style.color=''; td.style.borderTop=''; return; }
          var prevTr=trs[i-1];
          var prevEff=col==='sku'?_qtEffSku(prevTr):col==='buyer'?_qtEffBuyer(prevTr):_qtEffNama(prevTr);
          var curEff =col==='sku'?_qtEffSku(tr)    :col==='buyer'?_qtEffBuyer(tr)    :_qtEffNama(tr);
          if(curEff && curEff===prevEff && !cur){
            td.style.color='transparent';
            td.style.borderTop='1px dashed #e2e8f0';
          } else {
            td.style.color='';
            td.style.borderTop='';
          }
        });
      });
    }

    function _qtLookupSku(tr){
      var sku=_qtEffSku(tr);
      var tdNama=tr.querySelector('[data-col="nama"]');
      // Hanya auto-fill jika NAMA masih kosong (belum diisi manual)
      if(sku && _fifoSkuMap[sku] && tdNama && !tdNama.textContent.trim()){
        tdNama.textContent=_fifoSkuMap[sku].nama;
      }
      _qtApplyMerge();
    }

    function _updateQtStats(){
      var rows=document.querySelectorAll('#qtTbody tr');
      var skuSet={}, qtSet={};
      var totQty=0;
      rows.forEach(function(tr){
        var sku=_qtEffSku(tr);
        var qt=(tr.querySelector('[data-col="qt"]').textContent||'').trim();
        var qty=parseFloat((tr.querySelector('[data-col="qty"]').textContent||'0').replace(',','.'))||0;
        if(sku) skuSet[sku]=true;
        if(qt) qtSet[qt]=true;
        totQty+=qty;
      });
      var el=function(id){ return document.getElementById(id); };
      if(el('qtTotSku'))  el('qtTotSku').textContent  = Object.keys(skuSet).length;
      if(el('qtTotQt'))   el('qtTotQt').textContent   = Object.keys(qtSet).length;
      if(el('qtTotQty'))  el('qtTotQty').textContent  = totQty;
      _qtApplyMerge();
    }

    function _qtUpdateTitle(){
      var tgl=(document.getElementById('opTanggal')||{}).value||'';
      var cell=document.getElementById('qtTitleCell');
      if(cell) cell.textContent = tgl ? 'QT READY '+tgl.split('-').reverse().join('.') : 'QT READY';
    }

    function _renumberQt(){
      var rows=document.querySelectorAll('#qtTbody tr');
      rows.forEach(function(tr,i){ var no=tr.querySelector('.row-no'); if(no) no.textContent=i+1; });
      var rc=document.getElementById('qtRowCount');
      if(rc) rc.textContent=rows.length+' BARIS';
    }

    function _mkQtTd(content, editable, cls){
      var td=document.createElement('td');
      if(cls) td.className=cls;
      if(editable){
        td.contentEditable='true'; td.spellcheck=false;
        td.addEventListener('focus', function(){ td.style.outline='none'; });
        // keydown handled by _STOKInit
      }
      if(content!==undefined&&content!==null&&content!=='') td.textContent=content;
      return td;
    }

    function _qtKeydown(e, td){
      var tr     = td.closest('tr');
      var tbody  = document.getElementById('qtTbody');
      var allTrs = Array.from(tbody.querySelectorAll('tr'));
      var COLS   = QT_COLS;
      var curC   = COLS.indexOf(td.dataset.col);
      var curR   = allTrs.indexOf(tr);

      function _getTd(r, c){
        if(r<0||r>=allTrs.length||c<0||c>=COLS.length) return null;
        return allTrs[r].querySelector('[data-col="'+COLS[c]+'"]');
      }
      function _go(nextTd){
        _qtLookupSku(tr); _updateQtStats();
        if(nextTd && nextTd.contentEditable==='true'){
          nextTd.focus();
          var range=document.createRange(); range.selectNodeContents(nextTd);
          var sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        }
      }

      var isArrow=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.key)>=0;
      if(isArrow){
        var sel=window.getSelection(), txt=td.textContent;
        var offset=sel?sel.focusOffset:0;
        var atEnd=offset>=txt.length, atStart=offset<=0;
        if(e.key==='ArrowUp'){ e.preventDefault(); _go(_getTd(curR-1, curC)); }
        else if(e.key==='ArrowDown'){ e.preventDefault(); _go(_getTd(curR+1, curC)); }
        else if(e.key==='ArrowRight'&&(atEnd||txt==='')){ e.preventDefault();
          var nc=curC+1,nr=curR; if(nc>=COLS.length){nc=0;nr++;} _go(_getTd(nr,nc));
        } else if(e.key==='ArrowLeft'&&(atStart||txt==='')){ e.preventDefault();
          var nc=curC-1,nr=curR; if(nc<0){nc=COLS.length-1;nr--;} _go(_getTd(nr,nc));
        }
        return;
      }
      if(e.key==='Tab'){
        e.preventDefault();
        var nextC=e.shiftKey?curC-1:curC+1, nextR=curR;
        if(nextC>=COLS.length){nextC=0;nextR++;} if(nextC<0){nextC=COLS.length-1;nextR--;}
        _go(_getTd(nextR,nextC));
      } else if(e.key==='Enter'){
        e.preventDefault(); _go(_getTd(curR+1, curC));
      }
    }

    function _appendQtRow(vals){
      var v=vals||{};
      var tbody=document.getElementById('qtTbody');
      var tr=document.createElement('tr');
      var noTd=document.createElement('td'); noTd.className='row-no'; tr.appendChild(noTd);

      // SKU
      var tdSku=_mkQtTd(v.sku||'',true,'op-td'); tdSku.dataset.col='sku';
      tdSku.addEventListener('blur',function(){ _qtLookupSku(tr); _updateQtStats(); });
      tr.appendChild(tdSku);

      // NAMA — editable manual, auto-fill dari SKU tapi bisa dioverride
      var tdNama=_mkQtTd(v.nama||'',true,'op-td'); tdNama.dataset.col='nama';
      tr.appendChild(tdNama);

      // BUYER
      var tdBuyer=_mkQtTd(v.buyer||'',true,'op-td'); tdBuyer.dataset.col='buyer';
      tdBuyer.addEventListener('blur',function(){ _updateQtStats(); });
      tr.appendChild(tdBuyer);

      // QTY
      var tdQty=_mkQtTd(v.qty||'',true,'op-td td-num'); tdQty.dataset.col='qty';
      tdQty.addEventListener('blur',function(){ _updateQtStats(); });
      tr.appendChild(tdQty);

      // QT
      var tdQt=_mkQtTd(v.qt||'',true,'op-td'); tdQt.dataset.col='qt';
      tdQt.addEventListener('blur',function(){ _updateQtStats(); });
      tr.appendChild(tdQt);

      // SI
      var tdSi=_mkQtTd(v.si||'',true,'op-td'); tdSi.dataset.col='si'; tr.appendChild(tdSi);

      // SCHEDULE
      var tdSch=_mkQtTd(v.schedule||'',true,'op-td'); tdSch.dataset.col='schedule'; tr.appendChild(tdSch);

      // CONT
      var tdCont=_mkQtTd(v.cont||'',true,'op-td td-num'); tdCont.dataset.col='cont'; tr.appendChild(tdCont);

      // KET
      var tdKet=_mkQtTd(v.ket||'',true,'op-td'); tdKet.dataset.col='ket'; tr.appendChild(tdKet);

      // Del
      var tdDel=document.createElement('td'); tdDel.className='td-del';
      var btnDel=document.createElement('button'); btnDel.className='del-row-btn'; btnDel.innerHTML='&#10005;'; btnDel.title='Hapus baris';
      btnDel.addEventListener('click',function(){ tr.parentNode.removeChild(tr); _renumberQt(); _updateQtStats(); });
      tdDel.appendChild(btnDel); tr.appendChild(tdDel);

      tbody.appendChild(tr);
      _renumberQt();
    }

    function addQtRow(n){ _loadFifoSkuMap(function(){ for(var i=0;i<(n||1);i++) _appendQtRow(); _updateQtStats(); }); }
    function clearQtTable(){ document.getElementById('qtTbody').innerHTML=''; _updateQtStats(); }
    function qtZoom(d){ _qtZoom=Math.min(150,Math.max(60,_qtZoom+d)); var t=document.getElementById('qtTbl'); if(t) t.style.fontSize=(_qtZoom/100*13)+'px'; var l=document.getElementById('qtZoomLabel'); if(l) l.textContent=_qtZoom+'%'; }
    function qtZoomReset(){ _qtZoom=100; var t=document.getElementById('qtTbl'); if(t) t.style.fontSize='13px'; var l=document.getElementById('qtZoomLabel'); if(l) l.textContent='100%'; }
    function qtPasteMode(){ _qtPasteActive=true; showToast('💡 Klik sel di tabel QT Ready lalu paste (Ctrl+V) dari Excel\nUrutan kolom: SKU | NAMA | BUYER | QTY | QT | SI | SCHEDULE | CONT | KET',''); }

    function _qtCopyBlock(){
      var tbody=document.getElementById('qtTbody'); if(!tbody) return;
      var trs=Array.from(tbody.querySelectorAll('tr'));
      var r1=Math.min(_qtSel.r1,_qtSel.r2),r2=Math.max(_qtSel.r1,_qtSel.r2);
      var c1=Math.min(_qtSel.c1,_qtSel.c2),c2=Math.max(_qtSel.c1,_qtSel.c2);
      if(r1<0||c1<0){ showToast('Tidak ada selection','error'); return; }
      var lines=[];
      for(var r=r1;r<=r2;r++){ if(!trs[r]) continue; var cells=[]; for(var ci=c1;ci<=c2;ci++){ var td=trs[r].querySelector('[data-col="'+QT_COLS[ci]+'"]'); cells.push(td?td.textContent.trim():''); } lines.push(cells.join('\t')); }
      var text=lines.join('\n');
      _qtFallbackCopy(text);
      if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(text).catch(function(){});
      showToast('📋 '+(r2-r1+1)+' baris disalin','success');
    }
    function _qtFallbackCopy(text){ var ta=document.createElement('textarea'); ta.value=text; ta.style.cssText='position:fixed;top:0;left:0;width:2px;height:2px;opacity:0;'; document.body.appendChild(ta); ta.focus(); ta.select(); try{ document.execCommand('copy'); }catch(ex){} document.body.removeChild(ta); }

    function _qtBindEvents(){
      var tbl=document.getElementById('qtTbl');
      var tbody=document.getElementById('qtTbody');
      if(!tbl||!tbody||tbl._qtBound) return;
      tbl._qtBound=true;
      // SISTEM TABEL OK
      _STOKInit({tblId:'qtTbl',tbodyId:'qtTbody',cols:QT_COLS,autoCols:{},selClass:'qt-sel',
        onAfterPaste:function(tr){ _qtLookupSku(tr); _updateQtStats(); },
        onDelete:function(tr){ _updateQtStats(); }
      });
      tbody.addEventListener('mousedown',function(e){
        var td=e.target.closest('td[data-col]'); if(!td) return;
        var tr=td.closest('tr');
        var ri=_qtTrIdx(tr), ci=_qtTcIdx(td);
        if(ri<0||ci<0) return;
        _qtClearSel();
        _qtSel={r1:ri,c1:ci,r2:ri,c2:ci}; _qtDragging=true; _qtApplySel();
      });
      document.addEventListener('mousemove',function(e){
        if(!_qtDragging) return;
        var td=e.target.closest&&e.target.closest('td[data-col]'); if(!td||!td.closest('#qtTbody')) return;
        var ri=_qtTrIdx(td.closest('tr')), ci=_qtTcIdx(td);
        if(ri<0||ci<0) return;
        var moved=ri!==_qtSel.r2||ci!==_qtSel.c2;
        _qtSel.r2=ri; _qtSel.c2=ci;
        if(moved){ tbl.focus(); _qtApplySel(); }
      });
      document.addEventListener('mouseup',function(){ _qtDragging=false; });
      // keydown, paste now handled by _STOKInit
      document.addEventListener('mousedown',function(e){
        var pg=document.getElementById('opnamePage'); if(!pg||pg.style.display==='none') return;
        if(tbl&&!tbl.contains(e.target)) _qtClearSel();
      });
    }

    function _initQtIfNeeded(){
      var tbody=document.getElementById('qtTbody');
      if(tbody&&tbody.querySelectorAll('tr').length===0){
        _loadFifoSkuMap(function(){
          for(var i=0;i<30;i++) _appendQtRow();
          _updateQtStats();
        });
      }
      _qtBindEvents();
    }

    function saveQtReady(){
      var tanggal=document.getElementById('opTanggal').value;
      var nama=document.getElementById('opNama').value.trim();
      var plant=document.getElementById('opPlant').value.trim();
      if(!tanggal){ showToast('Lengkapi tanggal','error'); return; }
      if(!nama){ showToast('Lengkapi nama stock keeper','error'); return; }
      var rows=[];
      document.querySelectorAll('#qtTbody tr').forEach(function(tr){
        var sku     = _qtEffSku(tr);
        var namaBrg = _qtEffNama(tr);
        var buyer   = _qtEffBuyer(tr);
        var qty=parseFloat((tr.querySelector('[data-col="qty"]').textContent||'0').replace(',','.'))||0;
        var qt=(tr.querySelector('[data-col="qt"]').textContent||'').trim();
        var si=(tr.querySelector('[data-col="si"]').textContent||'').trim();
        var schedule=(tr.querySelector('[data-col="schedule"]').textContent||'').trim();
        var cont=parseFloat((tr.querySelector('[data-col="cont"]').textContent||'0').replace(',','.'))||0;
        var ket=(tr.querySelector('[data-col="ket"]').textContent||'').trim();
        if(!qt && !qty) return;
        rows.push([tanggal, nama, plant, sku, namaBrg, buyer, qty, qt, si, schedule, cont, ket]);
      });
      if(rows.length===0){ showToast('Tidak ada data QT Ready untuk disimpan','error'); return; }
      var btn=document.querySelector('#opCardQtReady .op-btn-save');
      if(btn){ btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Menyimpan...'; }
      google.script.run
        .withSuccessHandler(function(res){
          if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-save"></i> Simpan QT Ready'; }
          if(res&&res.success){
            showToast('\u2705 '+rows.length+' baris QT Ready tersimpan','success');
            // Clear dan isi ulang 30 baris kosong
            clearQtTable();
            _loadFifoSkuMap(function(){
              for(var i=0;i<30;i++) _appendQtRow();
              _updateQtStats();
            });
          } else { showToast('\u274c Gagal: '+(res&&res.message||'unknown'),'error'); }
        })
        .withFailureHandler(function(e){
          if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-save"></i> Simpan QT Ready'; }
          showToast('\u274c Koneksi gagal','error');
        })
        .saveQtReadyData(rows);
    }


    // ═══════════════════════════════════════════════════════
    // FIFO VIEW — Picking List FIFO dengan merge SKU
    // ═══════════════════════════════════════════════════════
    function loadFifoView(){
      var allBtn = document.getElementById('fifoDownloadAllBtn');
      if(allBtn) allBtn.style.display = 'none';
      var from    = document.getElementById('fifoViewFrom').value;
      var to      = document.getElementById('fifoViewTo').value;
      var nama    = (document.getElementById('fifoViewNama')||{}).value||'';
      var plant   = (document.getElementById('fifoViewPlant')||{}).value||'';
      var subTipe = (document.getElementById('fifoViewSubTipe')||{}).value||'LOKAL';
      if(!from||!to){ showToast('Pilih rentang tanggal','error'); return; }
      document.getElementById('fifoViewBody').innerHTML = "<div class='spinner' style='margin:20px auto;'></div>";
      if(typeof google === 'undefined' || !google.script){ showToast('Tidak bisa connect ke server','error'); return; }
      var fn = subTipe==='EKSPOR' ? 'getFifoEksporData' : 'getFifoData';
      google.script.run
        .withSuccessHandler(function(res){ renderFifoView(res, nama, plant, subTipe); })
        .withFailureHandler(function(e){ showToast('❌ Gagal load data FIFO','error'); })
        [fn](from, to);
    }

    function renderFifoView(res, namaFilter, plantFilter, subTipe){
      var body = document.getElementById('fifoViewBody');
      var isEks = subTipe === 'EKSPOR';
      if(!res||!res.success||!res.data||!res.data.length){
        body.innerHTML="<div class='opv-empty'><i class='fas fa-inbox' style='font-size:28px;display:block;margin-bottom:8px;'></i>Tidak ada data FIFO.</div>";
        return;
      }
      // HDR_FIFO lokal: [0]TANGGAL [1]NAMA [2]PLANT [3]SKU [4]NAMA_BARANG [5]PRODATE [6]PALLET [7]KARTON [8]TOTAL_KARTON [9]STD_PALLET [10]BIN_LOC
      // HDR_FIFO ekspor: [0]TANGGAL [1]NAMA [2]PLANT [3]SKU [4]NAMA_BARANG [5]BUYER [6]PRODATE [7]QUOTATION [8]PALLET [9]KARTON [10]TOTAL_KARTON [11]STD_PALLET [12]BIN_LOC
      var data = res.data.filter(function(r){
        if(namaFilter  && String(r[1]||'') !== namaFilter)  return false;
        if(plantFilter && String(r[2]||'') !== plantFilter) return false;
        return true;
      });
      if(!data.length){
        body.innerHTML="<div class='opv-empty'>Tidak ada data sesuai filter.</div>";
        return;
      }

      // Group by tanggal+nama+plant
      var groups={}, gOrder=[];
      data.forEach(function(r){
        var k = String(r[0])+'|'+String(r[1])+'|'+String(r[2]);
        if(!groups[k]){ groups[k]={tanggal:r[0],nama:r[1],plant:r[2],rows:[]}; gOrder.push(k); }
        groups[k].rows.push(r);
      });

      // ── Mapping wajib FIFO per plant ──
      var WAJIB_FIFO = {
        '1111': ['Faishal'],
        '1112': ['Dimas','Apri'],
        '1113': ['Dimas'],
      };

      // ── Hitung siapa yang belum input per tanggal+plant ──
      var fifoPresent = {}; // key: tgl|plant → [nama]
      data.forEach(function(r){
        var k2 = String(r[0])+'|'+String(r[2]);
        if(!fifoPresent[k2]) fifoPresent[k2] = [];
        var nm = String(r[1]||'').trim();
        if(nm && fifoPresent[k2].indexOf(nm) < 0) fifoPresent[k2].push(nm);
      });

      // Kumpulkan semua tanggal unik dari seluruh data
      var allTglSet = {};
      data.forEach(function(r){ allTglSet[String(r[0])] = true; });
      var allTgls = Object.keys(allTglSet).sort();

      // Cek SEMUA plant wajib untuk setiap tanggal — termasuk yg tidak ada datanya sama sekali
      var missByTglFifo = {};
      allTgls.forEach(function(tgl){
        Object.keys(WAJIB_FIFO).forEach(function(plt){
          if(plantFilter && plt !== plantFilter) return;
          var wajib = WAJIB_FIFO[plt] || [];
          var present = fifoPresent[tgl+'|'+plt] || [];
          var missing = wajib.filter(function(n){ return present.indexOf(n) < 0; });
          if(missing.length){
            if(!missByTglFifo[tgl]) missByTglFifo[tgl] = [];
            missing.forEach(function(nm){ missByTglFifo[tgl].push({nama:nm, plant:plt}); });
          }
        });
      });

      // ── Render missing summary — tema merah seragam dengan riwayat opname ──
      var missingHtml = '';
      if(!namaFilter){
        var missTgls = Object.keys(missByTglFifo).sort();
        if(missTgls.length){
          missingHtml += '<div class="opv-missing-summary">';
          missingHtml += '<div class="opv-missing-summary-hdr"><i class="fas fa-exclamation-triangle"></i> BELUM INPUT PICKING LIST FIFO</div>';
          missingHtml += '<div class="opv-missing-summary-body">';
          missTgls.forEach(function(tgl){
            missingHtml += '<div class="opv-miss-tgl-group">';
            missingHtml += '<div class="opv-miss-tgl"><i class="fas fa-calendar-day" style="margin-right:4px;"></i>'+tgl+'</div>';
            missByTglFifo[tgl].forEach(function(m){
              missingHtml += '<span class="opv-miss-chip"><i class="fas fa-user-times"></i>'+m.nama;
              missingHtml += ' <span style="opacity:.7;font-size:10px;">'+m.plant+' FIFO</span></span>';
            });
            missingHtml += '</div>';
          });
          missingHtml += '</div></div>';
        } else if(allTgls.length){
          missingHtml += '<div class="opv-missing-summary">';
          missingHtml += '<div class="opv-missing-summary-hdr" style="background:linear-gradient(90deg,#276749,#38a169);"><i class="fas fa-check-circle"></i> STATUS KELENGKAPAN FIFO</div>';
          missingHtml += '<div class="opv-missing-summary-body"><div class="opv-miss-none">';
          missingHtml += '<i class="fas fa-check-circle" style="color:#68d391;"></i> Semua stock keeper sudah input untuk periode ini.</div></div>';
          missingHtml += '</div>';
        }
      }
      var html = missingHtml;
      gOrder.forEach(function(k){
        var g = groups[k];
        // Sub-group per SKU untuk merge
        var skuGroups=[], curSku=null;
        g.rows.forEach(function(r){
          var sku = String(r[3]||'').trim();
          // Baris dengan SKU kosong → ikut group SKU sebelumnya (baris sub prodate)
          if(sku && (!curSku || sku !== curSku.sku)){
            curSku = {sku:sku, nama:String(r[4]||''), rows:[]};
            skuGroups.push(curSku);
          }
          if(curSku) curSku.rows.push(r);
        });

        var totPallet=0, totKarton=0, totProdate=0;
        g.rows.forEach(function(r){
          var pIdx = isEks ? 8 : 6;
          var kIdx = isEks ? 10 : 8;
          var dIdx = isEks ? 6 : 5;
          totPallet  += Number(r[pIdx])||0;
          totKarton  += Number(r[kIdx])||0;
          if((String(r[dIdx]||'')).trim()) totProdate++;
        });

        var cardId = 'fifoCard_'+k.replace(/[|.]/g,'_');
        html+='<div class="opv-card" id="'+cardId+'">';
        html+='<div class="opv-card-hdr" style="background:linear-gradient(90deg,#1a3a6b,#2563eb);">';
        html+='<div class="opv-hdr-left"><div class="opv-hdr-title">';
        html+='<i class="fas fa-list-ol"></i><span>'+g.tanggal+' &nbsp;—&nbsp; '+(g.nama||'-')+'</span>';
        html+='<span class="opv-tipe-badge">FIFO</span>';
        html+='<span class="opv-tipe-badge" style="background:rgba(255,255,255,.18);font-weight:700;">'+(isEks?'EKSPOR':'LOKAL')+'</span>';
        html+='<span class="opv-tipe-badge" style="background:rgba(255,255,255,.18);font-weight:700;">'+(g.plant||'-')+'</span>';
        html+='</div><div class="opv-hdr-meta" style="display:flex;align-items:center;gap:10px;">';
        html+='<span>'+skuGroups.length+' SKU</span>';
        html+='<button class="fifo-pdf-btn" data-cardid="'+cardId+'" onclick="_fifoPrintCard(this.getAttribute(\'data-cardid\'))" title="Download PDF"><i class="fas fa-file-pdf"></i> Download PDF</button>';
        html+='</div></div>';
        html+='<div class="opv-stats">';
        html+='<div class="opv-stat-item"><div class="opv-stat-val">'+totProdate+'</div><div class="opv-stat-lbl">Prodate</div></div>';
        html+='<div class="opv-stat-sep"></div>';
        html+='<div class="opv-stat-item"><div class="opv-stat-val">'+totPallet+'</div><div class="opv-stat-lbl">Pallet</div></div>';
        html+='<div class="opv-stat-sep"></div>';
        html+='<div class="opv-stat-item"><div class="opv-stat-val">'+totKarton.toLocaleString('id-ID')+'</div><div class="opv-stat-lbl">Total Karton</div></div>';
        html+='</div></div>';
        html+='<div class="opv-tbl-wrap">';
        var thStyle = 'border:1px solid #111;padding:8px 10px;';
        html+='<table class="opv-tbl" style="border-collapse:collapse;">';
        html+='<thead><tr style="background:#1a3a6b;color:#fff;">';
        html+='<th style="'+thStyle+'text-align:center;width:32px;">#</th>';
        html+='<th style="'+thStyle+'min-width:110px;">SKU</th>';
        html+='<th style="'+thStyle+'min-width:220px;">NAMA BARANG</th>';
        if(isEks) html+='<th style="'+thStyle+'min-width:110px;">BUYER</th>';
        html+='<th style="'+thStyle+'min-width:110px;">PRODATE</th>';
        if(isEks) html+='<th style="'+thStyle+'min-width:120px;">QUOTATION</th>';
        html+='<th style="'+thStyle+'min-width:70px;text-align:right;">PALLET</th>';
        html+='<th style="'+thStyle+'min-width:70px;text-align:right;">KARTON</th>';
        html+='<th style="'+thStyle+'min-width:110px;text-align:right;">TOTAL KARTON</th>';
        html+='<th style="'+thStyle+'min-width:200px;">BIN. LOC</th>';
        html+='<th style="'+thStyle+'width:60px;text-align:center;">AKSI</th>';
        html+='</tr></thead><tbody>';

        var rowNum = 0;
        var cellBorder = 'border:1px solid #222;';
        var firstRowBg = 'background:#FFFF00;';
        var subBg      = 'background:#fff;';
        skuGroups.forEach(function(sg){
          var span = sg.rows.length;
          sg.rows.forEach(function(r, ri){
            var isFirst = ri===0;
            var rowBg   = isFirst ? firstRowBg : subBg;
            var sepTop  = !isFirst ? 'border-top:1px solid #bbb;' : '';
            var firstBold = isFirst ? 'font-weight:700;' : '';
            var buyerIdx = 5, prodIdx = isEks?6:5, quotIdx = 7, palIdx = isEks?8:6, karIdx = isEks?9:7, totIdx = isEks?10:8, binIdx = isEks?12:10;
            var rowEnc = encodeURIComponent(JSON.stringify(r));
            html+='<tr data-row="'+rowEnc+'" data-subtipe="'+(isEks?'EKSPOR':'LOKAL')+'">';
            if(isFirst){
              html+='<td rowspan="'+span+'" style="'+cellBorder+'text-align:center;font-weight:700;color:#2d3748;vertical-align:middle;background:#fff;">'+(++rowNum)+'</td>';
              html+='<td rowspan="'+span+'" style="'+cellBorder+'vertical-align:middle;font-weight:700;color:#111;background:#fff;" data-col="3">'+sg.sku+'</td>';
              html+='<td rowspan="'+span+'" style="'+cellBorder+'vertical-align:middle;font-weight:600;background:#fff;" data-col="4">'+sg.nama+'</td>';
              if(isEks) html+='<td rowspan="'+span+'" style="'+cellBorder+'vertical-align:middle;background:#fff;" data-col="'+buyerIdx+'">'+escHtml(String(r[buyerIdx]||''))+'</td>';
            }
            html+='<td style="'+cellBorder+rowBg+'font-size:12px;'+sepTop+'" data-col="'+prodIdx+'">'+(String(r[prodIdx]||'')||'-')+'</td>';
            if(isEks) html+='<td style="'+cellBorder+rowBg+sepTop+'" data-col="'+quotIdx+'">'+escHtml(String(r[quotIdx]||''))+'</td>';
            html+='<td style="'+cellBorder+rowBg+'text-align:right;'+firstBold+sepTop+'" data-col="'+palIdx+'">'+(Number(r[palIdx])||0)+'</td>';
            html+='<td style="'+cellBorder+rowBg+'text-align:right;'+firstBold+sepTop+'" data-col="'+karIdx+'">'+(Number(r[karIdx])||0).toLocaleString('id-ID')+'</td>';
            html+='<td style="'+cellBorder+rowBg+'text-align:right;font-weight:700;'+sepTop+'" data-col="'+totIdx+'">'+(Number(r[totIdx])||0).toLocaleString('id-ID')+'</td>';
            html+='<td style="'+cellBorder+rowBg+firstBold+sepTop+'" data-col="'+binIdx+'">'+escHtml(String(r[binIdx]||''))+'</td>';
            html+='<td class="td-edit-btn" style="'+cellBorder+'text-align:center;'+rowBg+sepTop+'"><button class="opv-edit-btn" onclick="_rvEditGeneric(this,\'fifo\')" title="Edit"><i class="fas fa-pencil-alt"></i></button></td>';
            html+='</tr>';
          });
        });

        html+='</tbody></table>';
        html+='</div></div>';
      });

      body.innerHTML = '<div class="opv-body">' + html + '</div>';
      // Tampilkan tombol Download All
      var allBtn = document.getElementById('fifoDownloadAllBtn');
      if(allBtn) allBtn.style.display = gOrder.length > 0 ? '' : 'none';
    }

    function _fifoPrintCard(cardId){
      var target = document.getElementById(cardId);
      if(!target){ showToast('Card tidak ditemukan','error'); return; }

      // ── Ambil info header ──
      var titleEl  = target.querySelector('.opv-hdr-title span');
      var badges   = target.querySelectorAll('.opv-tipe-badge');
      var tipeStr  = badges[0] ? badges[0].textContent.trim() : 'FIFO';
      var plantStr = badges[1] ? badges[1].textContent.trim() : '';
      var titleStr = (titleEl ? titleEl.textContent.trim() : '') +
                     (tipeStr  ? '  —  ' + tipeStr  : '') +
                     (plantStr ? '  ' + plantStr : '');

      // ── Ambil stat items ──
      var statItems = target.querySelectorAll('.opv-stat-item');
      var statsHtml = '';
      statItems.forEach(function(si){
        var val = si.querySelector('.opv-stat-val');
        var lbl = si.querySelector('.opv-stat-lbl');
        if(val && lbl){
          statsHtml += '<div class="stat-item">' +
            '<div class="stat-val">' + val.textContent + '</div>' +
            '<div class="stat-lbl">' + lbl.textContent + '</div>' +
            '</div>';
        }
      });

      // ── Ambil header tabel ──
      var thEls = target.querySelectorAll('thead th');
      var thTexts = Array.from(thEls).map(function(th){ return th.textContent.trim(); });
      var numCols = {'PALLET':true,'KARTON':true,'TOTAL KARTON':true,'#':true};
      var theadHtml = '<tr>';
      thTexts.forEach(function(t){ theadHtml += '<th'+(numCols[t]?' class="r"':'')+'>'+t+'</th>'; });
      theadHtml += '</tr>';

      // ── Ambil body tabel — reconstruct rowspan dari DOM ──
      var tbodyRows = target.querySelectorAll('tbody tr');
      var tbodyHtml = '';
      tbodyRows.forEach(function(tr){
        tbodyHtml += '<tr>';
        var tds = tr.querySelectorAll('td');
        tds.forEach(function(td){
          var rs = td.getAttribute('rowspan');
          var rsAttr = rs && parseInt(rs) > 1 ? ' rowspan="' + rs + '"' : '';
          // Deteksi baris pertama per SKU via data-first attribute (reliable)
          var isYellow = td.getAttribute('data-first') === '1';
          var isRight  = td.style.textAlign === 'right';
          var fw       = td.style.fontWeight || '';
          var clr      = td.style.color || '';
          var styleStr = '-webkit-print-color-adjust:exact;print-color-adjust:exact;';
          if(isYellow) styleStr += 'background:#FFFF00;font-weight:700;';
          if(isRight)  styleStr += 'text-align:right;';
          if(fw && fw !== 'normal' && fw !== '400') styleStr += 'font-weight:' + fw + ';';
          if(clr && clr !== 'rgb(0, 0, 0)' && clr !== '') styleStr += 'color:' + clr + ';';
          // border-left tidak di-copy (sudah diganti hitam seragam)
          var tdTxt = td.textContent.trim();
          var isNumTd = (isRight || (!isNaN(tdTxt.replace(/[.,]/g,'')) && tdTxt !== '' && tdTxt.length < 12 && !tdTxt.match(/[a-zA-Z]/)));
          if(isNumTd) styleStr += 'text-align:right;';
          tbodyHtml += '<td' + rsAttr + ' style="' + styleStr + '">' + tdTxt + '</td>';
        });
        tbodyHtml += '</tr>';
      });

      // ── Build HTML lengkap ──
      var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
        '<title>Picking List FIFO — ' + titleStr + '</title>' +
        '<style>' +
        '@page{size:A4 portrait;margin:8mm 10mm;}' +
        '*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
        'body{font-family:Arial,sans-serif;font-size:9px;color:#111;margin:0;padding:6px;}' +
        'h2{font-size:12px;font-weight:800;color:#1a3a6b;margin:0 0 5px;}' +
        '.stats{display:flex;gap:10px;margin:0 0 8px;flex-wrap:wrap;}' +
        '.stat-item{background:#eff6ff !important;border:1px solid #bfdbfe;border-radius:4px;padding:3px 10px;text-align:center;min-width:60px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
        '.stat-val{font-size:13px;font-weight:700;color:#1a3a6b;}' +
        '.stat-lbl{font-size:8px;color:#555;text-transform:uppercase;letter-spacing:.4px;}' +
        'table{width:100%;border-collapse:collapse;font-size:8px;table-layout:fixed;}' +
        'col.c-no{width:6mm;}col.c-sku{width:18mm;}col.c-nama{width:40mm;}col.c-prod{width:17mm;}col.c-pal{width:12mm;}col.c-krt{width:12mm;}col.c-tot{width:20mm;}col.c-bin{width:auto;}' +
        'thead th{background:#1a3a6b !important;color:#fff !important;padding:4px 5px;border:1px solid #1a3060;' +
          'font-weight:700;text-align:left;white-space:nowrap;overflow:hidden;' +
          '-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
        'thead th.r{text-align:right;}' +
        'tbody td{padding:3px 5px;border:1px solid #333;vertical-align:middle;overflow:hidden;word-break:break-word;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
        'tbody td.r{text-align:right;}' +
        '@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}' +
        '</style></head><body>' +
        '<h2>Picking List FIFO — ' + titleStr + '</h2>' +
        '<div class="stats">' + statsHtml + '</div>' +
        '<table>' +
        '<colgroup><col class="c-no"><col class="c-sku"><col class="c-nama"><col class="c-prod"><col class="c-pal"><col class="c-krt"><col class="c-tot"><col class="c-bin"></colgroup>' +
        '<thead>' + theadHtml + '</thead><tbody>' + tbodyHtml + '</tbody></table>' +
        '<script>window.onload=function(){ window.print(); };<\/script>' +
        '</body></html>';

      var w = window.open('', '_blank');
      if(w){
        w.document.open();
        w.document.write(html);
        w.document.close();
      } else {
        showToast('⚠ Popup diblokir. Izinkan popup untuk halaman ini.', 'error');
      }
    }


    function _fifoPrintAll(){
      var cards = document.querySelectorAll('#fifoViewBody .opv-card');
      if(!cards.length){ showToast('Tidak ada data untuk didownload','error'); return; }

      // Kumpulkan HTML semua card ke satu window
      var allSections = '';
      cards.forEach(function(target, idx){
        // Header info
        var titleEl  = target.querySelector('.opv-hdr-title span');
        var badges   = target.querySelectorAll('.opv-tipe-badge');
        var tipeStr  = badges[0] ? badges[0].textContent.trim() : 'FIFO';
        var plantStr = badges[1] ? badges[1].textContent.trim() : '';
        var titleStr = (titleEl ? titleEl.textContent.trim() : '') +
                       (tipeStr  ? '  —  ' + tipeStr  : '') +
                       (plantStr ? '  ' + plantStr : '');

        // Stat items
        var statsHtml = '';
        target.querySelectorAll('.opv-stat-item').forEach(function(si){
          var val = si.querySelector('.opv-stat-val');
          var lbl = si.querySelector('.opv-stat-lbl');
          if(val && lbl) statsHtml += '<div class="stat-item"><div class="stat-val">'+val.textContent+'</div><div class="stat-lbl">'+lbl.textContent+'</div></div>';
        });

        // Header tabel
        var thEls = target.querySelectorAll('thead th');
        var theadHtml = '<tr>';
        thEls.forEach(function(th){ theadHtml += '<th>'+th.textContent.trim()+'</th>'; });
        theadHtml += '</tr>';

        // Body tabel
        var tbodyHtml = '';
        target.querySelectorAll('tbody tr').forEach(function(tr){
          tbodyHtml += '<tr>';
          tr.querySelectorAll('td').forEach(function(td){
            var rs = td.getAttribute('rowspan');
            var rsAttr = rs && parseInt(rs)>1 ? ' rowspan="'+rs+'"' : '';
            var isYellow = td.getAttribute('data-first') === '1';
            var isRight  = td.style.textAlign === 'right';
            var fw = td.style.fontWeight || '';
            var styleStr = '-webkit-print-color-adjust:exact;print-color-adjust:exact;';
            if(isYellow) styleStr += 'background:#FFFF00;font-weight:700;';
            if(isRight)  styleStr += 'text-align:right;';
            if(fw && fw !== 'normal' && fw !== '400') styleStr += 'font-weight:'+fw+';';
            var txt = td.textContent.trim();
            var isNum = !isRight && !isNaN(txt.replace(/[.,]/g,'')) && txt !== '' && txt.length < 12 && !txt.match(/[a-zA-Z]/);
            if(isNum) styleStr += 'text-align:right;';
            tbodyHtml += '<td'+rsAttr+' style="'+styleStr+'">'+txt+'</td>';
          });
          tbodyHtml += '</tr>';
        });

        // Page break antar card (kecuali card terakhir)
        var pageBreak = idx < cards.length-1 ? 'page-break-after:always;' : '';
        allSections +=
          '<div style="'+pageBreak+'">' +
          '<h2>Picking List FIFO — '+titleStr+'</h2>' +
          '<div class="stats">'+statsHtml+'</div>' +
          '<table>' +
          '<colgroup><col class="c-no"><col class="c-sku"><col class="c-nama"><col class="c-prod"><col class="c-pal"><col class="c-krt"><col class="c-tot"><col class="c-bin"></colgroup>' +
          '<thead>'+theadHtml+'</thead><tbody>'+tbodyHtml+'</tbody>' +
          '</table></div>';
      });

      var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
        '<title>Picking List FIFO — All</title>' +
        '<style>' +
        '@page{size:A4 portrait;margin:8mm 10mm;}' +
        '*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
        'body{font-family:Arial,sans-serif;font-size:9px;color:#111;margin:0;padding:6px;}' +
        'h2{font-size:12px;font-weight:800;color:#1a3a6b;margin:0 0 5px;}' +
        '.stats{display:flex;gap:10px;margin:0 0 8px;flex-wrap:wrap;}' +
        '.stat-item{background:#eff6ff!important;border:1px solid #bfdbfe;border-radius:4px;padding:3px 10px;text-align:center;min-width:60px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
        '.stat-val{font-size:13px;font-weight:700;color:#1a3a6b;}' +
        '.stat-lbl{font-size:8px;color:#555;text-transform:uppercase;letter-spacing:.4px;}' +
        'table{width:100%;border-collapse:collapse;font-size:8px;table-layout:fixed;}' +
        'col.c-no{width:6mm;}col.c-sku{width:18mm;}col.c-nama{width:40mm;}col.c-prod{width:17mm;}col.c-pal{width:12mm;}col.c-krt{width:12mm;}col.c-tot{width:20mm;}col.c-bin{width:auto;}' +
        'thead th{background:#1a3a6b!important;color:#fff!important;padding:4px 5px;border:1px solid #1a3060;font-weight:700;text-align:left;white-space:nowrap;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
        'tbody td{padding:3px 5px;border:1px solid #333;vertical-align:middle;overflow:hidden;word-break:break-word;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
        '@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}}' +
        '</style></head><body>' +
        allSections +
        '<script>window.onload=function(){ window.print(); };<\/script>' +
        '</body></html>';

      var w = window.open('', '_blank');
      if(w){
        w.document.open();
        w.document.write(html);
        w.document.close();
      } else {
        showToast('⚠ Popup diblokir. Izinkan popup untuk halaman ini.', 'error');
      }
    }

    function _fifoPrintAll(){
      var cards = document.querySelectorAll('#fifoViewBody .opv-card');
      if(!cards.length){ showToast('Tidak ada data untuk didownload','error'); return; }

      var allSections = '';
      cards.forEach(function(target, idx){
        var titleEl  = target.querySelector('.opv-hdr-title span');
        var badges   = target.querySelectorAll('.opv-tipe-badge');
        var tipeStr  = badges[0] ? badges[0].textContent.trim() : 'FIFO';
        var plantStr = badges[1] ? badges[1].textContent.trim() : '';
        var titleStr = (titleEl ? titleEl.textContent.trim() : '') +
                       '  —  ' + tipeStr + (plantStr ? '  ' + plantStr : '');

        var statsHtml = '';
        target.querySelectorAll('.opv-stat-item').forEach(function(si){
          var val = si.querySelector('.opv-stat-val');
          var lbl = si.querySelector('.opv-stat-lbl');
          if(val && lbl) statsHtml += '<div class="stat-item"><div class="stat-val">'+val.textContent+'</div><div class="stat-lbl">'+lbl.textContent+'</div></div>';
        });

        var thEls = target.querySelectorAll('thead th');
        var theadHtml = '<tr>';
        thEls.forEach(function(th){ theadHtml += '<th>'+th.textContent.trim()+'</th>'; });
        theadHtml += '</tr>';

        var tbodyHtml = '';
        target.querySelectorAll('tbody tr').forEach(function(tr){
          tbodyHtml += '<tr>';
          tr.querySelectorAll('td').forEach(function(td){
            var rs = td.getAttribute('rowspan');
            var rsAttr = rs && parseInt(rs)>1 ? ' rowspan="'+rs+'"' : '';
            var isYellow = td.getAttribute('data-first') === '1';
            var isRight  = td.style.textAlign === 'right';
            var fw = td.style.fontWeight || '';
            var styleStr = '-webkit-print-color-adjust:exact;print-color-adjust:exact;';
            if(isYellow) styleStr += 'background:#FFFF00;font-weight:700;';
            if(isRight)  styleStr += 'text-align:right;';
            if(fw && fw !== 'normal' && fw !== '400') styleStr += 'font-weight:'+fw+';';
            var txt = td.textContent.trim();
            if(!isRight && !isNaN(txt.replace(/[.,]/g,'')) && txt !== '' && txt.length < 12 && !txt.match(/[a-zA-Z]/))
              styleStr += 'text-align:right;';
            tbodyHtml += '<td'+rsAttr+' style="'+styleStr+'">'+txt+'</td>';
          });
          tbodyHtml += '</tr>';
        });

        var pageBreak = idx < cards.length-1 ? 'page-break-after:always;' : '';
        allSections +=
          '<div style="'+pageBreak+'">' +
          '<h2>Picking List FIFO — '+titleStr+'</h2>' +
          '<div class="stats">'+statsHtml+'</div>' +
          '<table><colgroup>' +
          '<col class="c-no"><col class="c-sku"><col class="c-nama"><col class="c-prod">' +
          '<col class="c-pal"><col class="c-krt"><col class="c-tot"><col class="c-bin">' +
          '</colgroup><thead>'+theadHtml+'</thead><tbody>'+tbodyHtml+'</tbody></table></div>';
      });

      var css =
        '@page{size:A4 portrait;margin:8mm 10mm;}' +
        '*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
        'body{font-family:Arial,sans-serif;font-size:9px;color:#111;margin:0;padding:6px;}' +
        'h2{font-size:12px;font-weight:800;color:#1a3a6b;margin:0 0 5px;}' +
        '.stats{display:flex;gap:10px;margin:0 0 8px;flex-wrap:wrap;}' +
        '.stat-item{background:#eff6ff!important;border:1px solid #bfdbfe;border-radius:4px;padding:3px 10px;text-align:center;min-width:60px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
        '.stat-val{font-size:13px;font-weight:700;color:#1a3a6b;}' +
        '.stat-lbl{font-size:8px;color:#555;text-transform:uppercase;letter-spacing:.4px;}' +
        'table{width:100%;border-collapse:collapse;font-size:8px;table-layout:fixed;}' +
        'col.c-no{width:6mm;}col.c-sku{width:18mm;}col.c-nama{width:40mm;}col.c-prod{width:17mm;}' +
        'col.c-pal{width:12mm;}col.c-krt{width:12mm;}col.c-tot{width:20mm;}col.c-bin{width:auto;}' +
        'thead th{background:#1a3a6b!important;color:#fff!important;padding:4px 5px;border:1px solid #1a3060;font-weight:700;text-align:left;white-space:nowrap;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
        'tbody td{padding:3px 5px;border:1px solid #333;vertical-align:middle;overflow:hidden;word-break:break-word;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
        '@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}}';

      var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
        '<title>Picking List FIFO All</title>' +
        '<style>'+css+'</style></head><body>' +
        allSections +
        '<script>window.onload=function(){ window.print(); };<\/script>' +
        '</body></html>';

      var w = window.open('', '_blank');
      if(w){ w.document.open(); w.document.write(html); w.document.close(); }
      else { showToast('⚠ Popup diblokir. Izinkan popup untuk halaman ini.', 'error'); }
    }

    // ═══════════════════════════════════════════════════════
    // QT READY VIEW — Riwayat QT Ready
    // ═══════════════════════════════════════════════════════
    function loadQtView(){
      var from  = document.getElementById('qtViewFrom').value;
      var to    = document.getElementById('qtViewTo').value;
      var nama  = (document.getElementById('qtViewNama')||{}).value||'';
      var plant = (document.getElementById('qtViewPlant')||{}).value||'';
      if(!from||!to){ showToast('Pilih rentang tanggal','error'); return; }
      document.getElementById('qtViewBody').innerHTML="<div class='spinner' style='margin:20px auto;'></div>";
      var allBtn=document.getElementById('qtDownloadAllBtn');
      if(allBtn) allBtn.style.display='none';
      google.script.run
        .withSuccessHandler(function(res){ renderQtView(res, nama, plant); })
        .withFailureHandler(function(){ showToast('\u274c Gagal load data QT Ready','error'); })
        .getQtReadyData(from, to);
    }

    function renderQtView(res, namaFilter, plantFilter){
      var body=document.getElementById('qtViewBody');
      var allBtn=document.getElementById('qtDownloadAllBtn');
      if(!res||!res.success||!res.data||res.data.length===0){
        body.innerHTML="<div class='opv-empty'><i class='fas fa-clipboard-list' style='font-size:28px;display:block;margin-bottom:8px;'></i>Tidak ada data QT Ready untuk rentang ini.</div>";
        if(allBtn) allBtn.style.display='none';
        return;
      }
      var rows=res.data;
      if(namaFilter)  rows=rows.filter(function(r){ return String(r[1]||'')===namaFilter; });
      if(plantFilter) rows=rows.filter(function(r){ return String(r[2]||'')===plantFilter; });
      if(rows.length===0){
        body.innerHTML="<div class='opv-empty'>Tidak ada data sesuai filter.</div>";
        if(allBtn) allBtn.style.display='none';
        return;
      }

      // Group by tanggal|nama|plant
      var groups={}, gOrder=[];
      rows.forEach(function(r){
        var k=String(r[0])+'|'+String(r[1])+'|'+String(r[2]);
        if(!groups[k]){ groups[k]={tanggal:r[0],nama:r[1],plant:r[2],rows:[]}; gOrder.push(k); }
        groups[k].rows.push(r);
      });

      var html='';
      gOrder.forEach(function(k){
        var g=groups[k];

        // Sub-group per SKU+BUYER berurutan
        var skuGroups=[], curGrp=null;
        g.rows.forEach(function(r){
          var sku=String(r[3]||'').trim();
          var buyer=String(r[5]||'').trim();
          var isSub=curGrp&&(!sku||sku===curGrp.sku)&&(!buyer||buyer===curGrp.buyer);
          if(isSub){ curGrp.rows.push(r); return; }
          curGrp={sku:sku,buyer:buyer,rows:[r]};
          skuGroups.push(curGrp);
        });

        // Stats
        var skuSet={}, qtSet={}, totQty=0;
        g.rows.forEach(function(r){
          var sku=String(r[3]||'').trim();
          var qt=String(r[7]||'').trim();
          if(sku) skuSet[sku]=true;
          if(qt) qtSet[qt]=true;
          totQty+=Number(r[6])||0;
        });
        var totSku=Object.keys(skuSet).length;
        var totQt=Object.keys(qtSet).length;

        var cardId='qtCard_'+k.replace(/[|.\-]/g,'_');
        html+='<div class="opv-card" id="'+cardId+'">';
        html+='<div class="opv-card-hdr" style="background:linear-gradient(90deg,#553c9a,#7d3c98);">';
        html+='<div class="opv-hdr-left"><div class="opv-hdr-title">';
        html+='<i class="fas fa-clipboard-list"></i><span>'+g.tanggal+' &nbsp;—&nbsp; '+(g.nama||'-')+'</span>';
        html+='<span class="opv-tipe-badge">QT READY</span>';
        html+='<span class="opv-tipe-badge" style="background:rgba(255,255,255,.18);font-weight:700;">'+(g.plant||'-')+'</span>';
        html+='</div><div class="opv-hdr-meta" style="display:flex;align-items:center;gap:10px;">';
        html+='<span>'+totSku+' SKU</span>';
        html+='<button class="fifo-pdf-btn" data-cardid="'+cardId+'" onclick="_qtPrintCard(this.getAttribute(\'data-cardid\'))" title="Download PDF"><i class="fas fa-file-pdf"></i> Download PDF</button>';
        html+='</div></div></div>';
        html+='<div class="opv-stats">';
        html+='<div class="opv-stat-item"><div class="opv-stat-val">'+totSku+'</div><div class="opv-stat-lbl">SKU</div></div>';
        html+='<div class="opv-stat-sep"></div>';
        html+='<div class="opv-stat-item"><div class="opv-stat-val">'+totQt+'</div><div class="opv-stat-lbl">QT</div></div>';
        html+='<div class="opv-stat-sep"></div>';
        html+='<div class="opv-stat-item"><div class="opv-stat-val">'+totQty.toLocaleString('id-ID')+'</div><div class="opv-stat-lbl">Total QTY</div></div>';
        html+='</div>';
        html+='<div class="opv-tbl-wrap">';
        var thS='border:1px solid #111;padding:8px 10px;';
        html+='<table class="opv-tbl" style="border-collapse:collapse;">';
        html+='<thead><tr style="background:#553c9a;color:#fff;">';
        html+='<th style="'+thS+'text-align:center;width:32px;">#</th>';
        html+='<th style="'+thS+'min-width:90px;">SKU</th>';
        html+='<th style="'+thS+'min-width:200px;">MATERIAL NAME</th>';
        html+='<th style="'+thS+'min-width:100px;">BUYER</th>';
        html+='<th style="'+thS+'min-width:70px;text-align:right;">QTY</th>';
        html+='<th style="'+thS+'min-width:110px;">QT</th>';
        html+='<th style="'+thS+'min-width:70px;">SI</th>';
        html+='<th style="'+thS+'min-width:100px;">SCHEDULE</th>';
        html+='<th style="'+thS+'min-width:60px;text-align:right;">CONT</th>';
        html+='<th style="'+thS+'min-width:150px;">KET</th>';
        html+='<th style="'+thS+'width:60px;text-align:center;">AKSI</th>';
        html+='</tr></thead><tbody>';

        var rowNum=0;
        var cellB='border:1px solid #222;';
        var subBg='background:#fff;';
        skuGroups.forEach(function(sg){
          var span=sg.rows.length;
          sg.rows.forEach(function(r,ri){
            var isFirst=ri===0;
            var sepTop=!isFirst?'border-top:1px solid #bbb;':'';
            var bold=isFirst?'font-weight:700;':'';
            var rowEnc=encodeURIComponent(JSON.stringify(r));
            html+='<tr data-row="'+rowEnc+'">';
            if(isFirst){
              html+='<td rowspan="'+span+'" style="'+cellB+'text-align:center;font-weight:700;color:#2d3748;vertical-align:middle;background:#fff;" data-col="idx">'+(++rowNum)+'</td>';
              html+='<td rowspan="'+span+'" style="'+cellB+'vertical-align:middle;font-weight:700;color:#111;background:#fff;" data-col="3">'+escHtml(String(r[3]||''))+'</td>';
              html+='<td rowspan="'+span+'" style="'+cellB+'vertical-align:middle;font-weight:600;background:#fff;" data-col="4">'+escHtml(String(r[4]||''))+'</td>';
              html+='<td rowspan="'+span+'" style="'+cellB+'vertical-align:middle;background:#fff;" data-col="5">'+escHtml(String(r[5]||''))+'</td>';
            }
            html+='<td style="'+cellB+subBg+'text-align:right;'+bold+sepTop+'" data-col="6">'+(Number(r[6])||0).toLocaleString('id-ID')+'</td>';
            html+='<td style="'+cellB+subBg+bold+sepTop+'" data-col="7">'+escHtml(String(r[7]||''))+'</td>';
            html+='<td style="'+cellB+subBg+sepTop+'" data-col="8">'+escHtml(String(r[8]||''))+'</td>';
            html+='<td style="'+cellB+subBg+sepTop+'" data-col="9">'+escHtml(String(r[9]||''))+'</td>';
            html+='<td style="'+cellB+subBg+'text-align:right;'+sepTop+'" data-col="10">'+(r[10]?Number(r[10])||'':'')+'</td>';
            html+='<td style="'+cellB+subBg+sepTop+'" data-col="11">'+escHtml(String(r[11]||''))+'</td>';
            html+='<td class="td-edit-btn" style="'+cellB+'text-align:center;'+subBg+sepTop+'"><button class="opv-edit-btn" onclick="_rvEditGeneric(this,\'qt\')" title="Edit"><i class="fas fa-pencil-alt"></i></button></td>';
            html+='</tr>';
          });
        });

        html+='</tbody></table></div></div>';
      });

      body.innerHTML='<div class="opv-body">'+html+'</div>';
      if(allBtn) allBtn.style.display=gOrder.length>1?'':'none';
    }

    function _qtPrintCard(cardId){
      var target=document.getElementById(cardId);
      if(!target){ showToast('Card tidak ditemukan','error'); return; }
      var titleEl=target.querySelector('.opv-hdr-title span');
      var badges=target.querySelectorAll('.opv-tipe-badge');
      var tipeStr=badges[0]?badges[0].textContent.trim():'QT READY';
      var plantStr=badges[1]?badges[1].textContent.trim():'';
      var titleStr=(titleEl?titleEl.textContent.trim():'')+
                   (tipeStr?'  —  '+tipeStr:'')+(plantStr?'  '+plantStr:'');
      var statItems=target.querySelectorAll('.opv-stat-item');
      var statsHtml='';
      statItems.forEach(function(si){
        var val=si.querySelector('.opv-stat-val'), lbl=si.querySelector('.opv-stat-lbl');
        if(val&&lbl) statsHtml+='<div class="stat-item"><div class="stat-val">'+val.textContent+'</div><div class="stat-lbl">'+lbl.textContent+'</div></div>';
      });
      var thEls=target.querySelectorAll('thead th');
      var numCols={'QTY':true,'CONT':true,'#':true};
      var theadHtml='<tr>';
      Array.from(thEls).forEach(function(th){ var t=th.textContent.trim(); theadHtml+='<th'+(numCols[t]?' style="text-align:right"':'')+'>'+t+'</th>'; });
      theadHtml+='</tr>';
      var tbodyHtml='';
      var trs=target.querySelectorAll('tbody tr');
      trs.forEach(function(tr){
        tbodyHtml+='<tr>';
        Array.from(tr.querySelectorAll('td')).forEach(function(td){
          var rs=td.getAttribute('rowspan'), cs=td.getAttribute('colspan');
          var rsAttr=rs&&parseInt(rs)>1?' rowspan="'+rs+'"':'';
          var csAttr=cs&&parseInt(cs)>1?' colspan="'+cs+'"':'';
          var bg=td.style.background||'';
          var isYellow=bg.indexOf('255, 255, 0')>=0||bg==='#FFFF00'||bg==='yellow'||bg.indexOf('FFFF00')>=0;
          var bgStyle=isYellow?'background:#FFFF00;':'';
          var aRight=td.style.textAlign==='right'?'text-align:right;':'';
          tbodyHtml+='<td'+rsAttr+csAttr+' style="'+bgStyle+aRight+'">'+td.innerHTML+'</td>';
        });
        tbodyHtml+='</tr>';
      });
      var css=
        '@page{size:A4 landscape;margin:8mm 10mm;}'+
        '*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}'+
        'body{font-family:Arial,sans-serif;font-size:9px;color:#111;margin:0;padding:6px;}'+
        'h2{font-size:12px;font-weight:800;color:#553c9a;margin:0 0 5px;}'+
        '.stats{display:flex;gap:8px;margin:0 0 8px;}'+
        '.stat-item{background:#faf5ff!important;border:1px solid #d6bcfa;border-radius:4px;padding:3px 10px;text-align:center;min-width:60px;}'+
        '.stat-val{font-size:13px;font-weight:700;color:#553c9a;}'+
        '.stat-lbl{font-size:8px;color:#555;text-transform:uppercase;letter-spacing:.4px;}'+
        'table{width:100%;border-collapse:collapse;font-size:8px;}'+
        'thead tr{background:#553c9a!important;}'+
        'thead th{background:#553c9a!important;color:#fff!important;padding:5px 7px;border:1px solid #111;}'+
        'tbody td{padding:4px 7px;border:1px solid #222;vertical-align:middle;}';
      var html='<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+titleStr+'</title><style>'+css+'</style></head>'+
        '<body><h2>'+titleStr+'</h2><div class="stats">'+statsHtml+'</div>'+
        '<table><thead>'+theadHtml+'</thead><tbody>'+tbodyHtml+'</tbody></table>'+
        '<script>window.onload=function(){window.print();}<\/script></body></html>';
      var w=window.open('','_blank','width=900,height=700');
      if(w){ w.document.open(); w.document.write(html); w.document.close(); }
      else { showToast('⚠ Popup diblokir. Izinkan popup untuk halaman ini.','error'); }
    }

    function _qtPrintAll(){
      var cards=Array.from(document.querySelectorAll('#qtViewBody .opv-card'));
      if(!cards.length){ showToast('Tidak ada data untuk dicetak','error'); return; }
      var css=
        '@page{size:A4 landscape;margin:8mm 10mm;}'+
        '*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}'+
        'body{font-family:Arial,sans-serif;font-size:9px;color:#111;margin:0;padding:6px;}'+
        'h2{font-size:12px;font-weight:800;color:#553c9a;margin:0 0 5px;}'+
        '.stats{display:flex;gap:8px;margin:0 0 8px;}'+
        '.stat-item{background:#faf5ff!important;border:1px solid #d6bcfa;border-radius:4px;padding:3px 10px;text-align:center;min-width:60px;}'+
        '.stat-val{font-size:13px;font-weight:700;color:#553c9a;}'+
        '.stat-lbl{font-size:8px;color:#555;text-transform:uppercase;letter-spacing:.4px;}'+
        'table{width:100%;border-collapse:collapse;font-size:8px;}'+
        'thead tr{background:#553c9a!important;}'+
        'thead th{background:#553c9a!important;color:#fff!important;padding:5px 7px;border:1px solid #111;}'+
        'tbody td{padding:4px 7px;border:1px solid #222;vertical-align:middle;}';
      var allSections='';
      cards.forEach(function(card,idx){
        var cardId=card.id;
        var titleEl=card.querySelector('.opv-hdr-title span');
        var badges=card.querySelectorAll('.opv-tipe-badge');
        var tipeStr=badges[0]?badges[0].textContent.trim():'QT READY';
        var plantStr=badges[1]?badges[1].textContent.trim():'';
        var titleStr=(titleEl?titleEl.textContent.trim():'')+
                     (tipeStr?'  —  '+tipeStr:'')+(plantStr?'  '+plantStr:'');
        var statItems=card.querySelectorAll('.opv-stat-item');
        var statsHtml='';
        statItems.forEach(function(si){
          var val=si.querySelector('.opv-stat-val'), lbl=si.querySelector('.opv-stat-lbl');
          if(val&&lbl) statsHtml+='<div class="stat-item"><div class="stat-val">'+val.textContent+'</div><div class="stat-lbl">'+lbl.textContent+'</div></div>';
        });
        var thEls=card.querySelectorAll('thead th');
        var numCols={'QTY':true,'CONT':true,'#':true};
        var theadHtml='<tr>';
        Array.from(thEls).forEach(function(th){ var t=th.textContent.trim(); theadHtml+='<th'+(numCols[t]?' style="text-align:right"':'')+'>'+t+'</th>'; });
        theadHtml+='</tr>';
        var tbodyHtml='';
        card.querySelectorAll('tbody tr').forEach(function(tr){
          tbodyHtml+='<tr>';
          Array.from(tr.querySelectorAll('td')).forEach(function(td){
            var rs=td.getAttribute('rowspan'),cs=td.getAttribute('colspan');
            var rsA=rs&&parseInt(rs)>1?' rowspan="'+rs+'"':'';
            var csA=cs&&parseInt(cs)>1?' colspan="'+cs+'"':'';
            var bg=td.style.background||'';
            var isY=bg.indexOf('255, 255, 0')>=0||bg==='#FFFF00'||bg.indexOf('FFFF00')>=0;
            var bgS=isY?'background:#FFFF00;':'';
            var aR=td.style.textAlign==='right'?'text-align:right;':'';
            tbodyHtml+='<td'+rsA+csA+' style="'+bgS+aR+'">'+td.innerHTML+'</td>';
          });
          tbodyHtml+='</tr>';
        });
        var pageBreak=idx<cards.length-1?'page-break-after:always;':'';
        allSections+='<div style="'+pageBreak+'"><h2>'+titleStr+'</h2><div class="stats">'+statsHtml+'</div>'+
          '<table><thead>'+theadHtml+'</thead><tbody>'+tbodyHtml+'</tbody></table></div>';
      });
      var html='<!DOCTYPE html><html><head><meta charset="utf-8"><title>QT READY All</title><style>'+css+'</style></head>'+
        '<body>'+allSections+'<script>window.onload=function(){window.print();}<\/script></body></html>';
      var w=window.open('','_blank','width=900,height=700');
      if(w){ w.document.open(); w.document.write(html); w.document.close(); }
      else { showToast('⚠ Popup diblokir. Izinkan popup untuk halaman ini.','error'); }
    }

    function loadOpnameView(){
      var from  = document.getElementById('opViewFrom').value;
      var to    = document.getElementById('opViewTo').value;
      var nama  = (document.getElementById('opViewNama')||{}).value||'';
      var plant = (document.getElementById('opViewPlant')||{}).value||'';
      var tipe  = (document.getElementById('opViewTipe')||{}).value||'';
      if(!from||!to){ showToast('Pilih rentang tanggal','error'); return; }
      document.getElementById('opnameViewBody').innerHTML="<div class='spinner' style='margin:20px auto;'></div>";
      console.log('loadOpnameView: from='+from+' to='+to+' nama='+nama+' plant='+plant+' tipe='+tipe);
      google.script.run
        .withSuccessHandler(function(res){
          console.log('getOpnameData result: success='+res.success+' total='+(res.data?res.data.length:0));
          if(res.data && res.data.length>0) console.log('first row: '+JSON.stringify(res.data[0].slice(0,5)));
          renderOpnameView(res, nama, plant, tipe);
        })
        .withFailureHandler(function(e){ showToast('\u274c Gagal load data opname','error'); console.log('FAIL:'+e); })
        .getOpnameData(from,to);
    }

    function renderOpnameView(res, namaFilter, plantFilter, tipeFilter){
      var body = document.getElementById('opnameViewBody');
      if(!res||!res.success||!res.data||!res.data.length){
        body.innerHTML="<div class='opv-empty'><i class='fas fa-inbox' style='font-size:28px;display:block;margin-bottom:8px;'></i>Tidak ada data.</div>";
        return;
      }

      // ── Filter ──
      var data = res.data.filter(function(r){
        var area = String(r[3]||'').toUpperCase();
        var isGdfg = area==='GDFG'||area==='GDFG-EKSPOR';
        var isGdfgEkspor = area==='GDFG-EKSPOR';
        // Filter nama
        if(namaFilter && String(r[1]) !== namaFilter) return false;
        // Filter plant
        if(plantFilter && String(r[2]) !== plantFilter) return false;
        // Filter tipe — GDFG ikut pasangannya: Lokal→GDFG, Ekspor→GDFG-EKSPOR
        if(tipeFilter){
          if(!isGdfg){
            if(area !== tipeFilter) return false;
          } else {
            // GDFG: tampilkan GDFG-EKSPOR hanya jika filter Ekspor, GDFG hanya jika filter Lokal
            if(tipeFilter==='EKSPOR' && !isGdfgEkspor) return false;
            if(tipeFilter==='LOKAL'  &&  isGdfgEkspor) return false;
          }
        }
        return true;
      });

      if(!data.length){
        body.innerHTML="<div class='opv-empty'>Tidak ada data sesuai filter.</div>";
        return;
      }

      // ── Pisah data: utama (LOKAL/EKSPOR) vs GDFG ──
      var dataUtama = data.filter(function(r){
        var a=String(r[3]||'').toUpperCase();
        return a!=='GDFG' && a!=='GDFG-EKSPOR';
      });
      var dataGdfg = data.filter(function(r){
        var a=String(r[3]||'').toUpperCase();
        return a==='GDFG' || a==='GDFG-EKSPOR';
      });

      // ── Mapping wajib ──
      var WAJIB = {
        '1111|LOKAL':['Faisal'],'1111|EKSPOR':['Ade'],
        '1112|LOKAL':['Dimas','Apri'],'1112|EKSPOR':['Aldy'],
        '1113|LOKAL':['Dimas'],'1113|EKSPOR':['Aldy'],
        '1111|GDFG':['Faisal'],'1112|GDFG':['Dimas','Apri'],'1113|GDFG':['Dimas'],
        '1111|GDFG-EKSPOR':['Ade'],'1112|GDFG-EKSPOR':['Aldy'],'1113|GDFG-EKSPOR':['Aldy']
      };

      function getMissing(tgl,plant,tipe,presentList){
        var wajib=WAJIB[plant+'|'+tipe]||[];
        if(wajib.length<=1) return [];
        return wajib.filter(function(n){ return presentList.indexOf(n)<0; });
      }

      function groupData(arr){
        var groups={},gOrder=[];
        arr.forEach(function(r){
          var k=r[0]+'|'+r[1]+'|'+r[2]+'|'+r[3];
          if(!groups[k]){ groups[k]={tanggal:r[0],nama:r[1],plant:r[2],tipe:r[3],rows:[]}; gOrder.push(k); }
          groups[k].rows.push(r);
        });
        // Kumpulkan present per tgl+plant+tipe
        var present={};
        gOrder.forEach(function(k){
          var g=groups[k], pk=g.tanggal+'|'+g.plant+'|'+g.tipe;
          if(!present[pk]) present[pk]=[];
          present[pk].push(g.nama);
        });
        return {groups:groups, gOrder:gOrder, present:present};
      }

      var HDR_LOKAL=[
        {l:'#',cls:''},{l:'SKU',cls:''},{l:'Nama Barang',cls:''},
        {l:'SAP',cls:'th-num'},{l:'Fisik',cls:'th-num'},{l:'Sel. Awal',cls:'th-num'},
        {l:'Pend. GR',cls:'th-num'},{l:'Pend. GI',cls:'th-num'},{l:'Salah Kirim',cls:'th-num'},
        {l:'ADJ',cls:'th-num'},{l:'Sel. Akhir',cls:'th-num'},{l:'Keterangan',cls:''},{l:'Palet',cls:'th-num'}
      ];
      var HDR_EKSPOR=[
        {l:'#',cls:''},{l:'SKU',cls:''},{l:'Nama Barang',cls:''},
        {l:'Buyer',cls:''},{l:'Quotation',cls:''},{l:'Exp Date',cls:''},
        {l:'Fisik',cls:'th-num'},{l:'SAP Detail',cls:'th-num'},{l:'SAP Total',cls:'th-num'},
        {l:'Pend. GR',cls:'th-num'},{l:'Pend. GI',cls:'th-num'},
        {l:'Sel. Akhir',cls:'th-num'},{l:'Keterangan',cls:''},{l:'STD',cls:'th-num'},{l:'Palet',cls:'th-num'}
      ];

      var HDR_CLASS={'LOKAL':'opv-hdr-lokal','EKSPOR':'opv-hdr-ekspor','GDFG':'opv-hdr-gdfg','GDFG-EKSPOR':'opv-hdr-gdfgexp'};
      var ICON={'LOKAL':'fa-warehouse','EKSPOR':'fa-ship','GDFG':'fa-boxes','GDFG-EKSPOR':'fa-box-open'};

      function isEksp(t){ return t==='EKSPOR'||t==='GDFG-EKSPOR'; }

      // Render tabel dengan rowspan merge untuk Ekspor
      function renderTableMerged(rows, isEk, HDRS){
      // Helper: encode data untuk disimpan di data-* attribute
      function encRow(r){
        var obj={};
        for(var k in r){ if(Object.prototype.hasOwnProperty.call(r,k)) obj[k]=r[k]; }
        return encodeURIComponent(JSON.stringify(obj));
      }

      // ── LOKAL: render biasa tanpa merge ──
      if(!isEk){
        var visitorMode = window._visitorMode === true;
        var html='<table class="opv-tbl"><thead><tr>';
        if(!visitorMode) html+='<th style="width:28px;"></th>'; // kolom tombol edit
        if(visitorMode){
          // Visitor: hanya 4 kolom
          ['#','SKU','Nama Barang','Fisik'].forEach(function(l){ html+='<th>'+l+'</th>'; });
        } else {
          HDRS.forEach(function(h){ html+='<th class="'+h.cls+'">'+h.l+'</th>'; });
        }
        html+='</tr></thead><tbody>';
        rows.forEach(function(r,idx){
          var sa=Number(r[8]), sx2=Number(r[13]);
          var rid='rvL_'+idx+'_'+Date.now();
          html+='<tr data-rid="'+rid+'" data-row="'+encRow(r)+'" data-isek="0">';
          if(visitorMode){
            // Hanya nomor, SKU, Nama Barang, Fisik
            html+='<td class="td-num" style="color:#a0aec0;font-size:11px;">'+(idx+1)+'</td>';
            html+='<td class="td-sku">'+r[4]+'</td>';
            html+='<td>'+r[5]+'</td>';
            html+='<td class="td-num">'+(Number(r[7])||0).toLocaleString('id-ID')+'</td>';
          } else {
            html+='<td class="td-edit-btn"><button class="opv-edit-btn" onclick="_rvEdit(this)" title="Edit baris ini"><i class="fas fa-pencil-alt"></i></button></td>';
            html+='<td class="td-num" style="color:#a0aec0;font-size:11px;">'+(idx+1)+'</td>';
            html+='<td class="td-sku" data-col="4">'+r[4]+'</td>';
            html+='<td data-col="5">'+r[5]+'</td>';
            html+='<td class="td-num" data-col="6">'+(Number(r[6])||0).toLocaleString('id-ID')+'</td>';
            html+='<td class="td-num" data-col="7">'+(Number(r[7])||0).toLocaleString('id-ID')+'</td>';
            html+='<td class="'+(sa>0?'td-plus':sa<0?'td-minus':'td-ok')+'">'+(sa>0?'+':'')+sa+'</td>';
            html+='<td class="td-num" data-col="9">'+(Number(r[9])||0)+'</td>';
            html+='<td class="td-num" data-col="10">'+(Number(r[10])||0)+'</td>';
            html+='<td class="td-num" data-col="11">'+(Number(r[11])||0)+'</td>';
            html+='<td class="td-num" data-col="12">'+(Number(r[12])||0)+'</td>';
            html+='<td class="'+(sx2>0?'td-plus':sx2<0?'td-minus':'td-ok')+'">'+(sx2>0?'+':'')+sx2+'</td>';
            html+='<td class="'+(String(r[14]||'').toUpperCase().indexOf('PLUS')>=0?'td-ket-plus':String(r[14]||'').toUpperCase().indexOf('MINUS')>=0?'td-ket-minus':'td-ket-ok')+'" data-col="14">'+(r[14]||'')+'</td>';
            html+='<td class="td-num">'+Math.ceil(Number(r[15])||0)+'</td>';
          }
          html+='</tr>';
        });
        return html+'</tbody></table>';
      }

      // ── EKSPOR: group by SKU berurutan → rowspan ──
      var groups=[], curGroup=null;
      rows.forEach(function(r){
        var sku=String(r[4]||'').trim();
        var isSub = curGroup && (!sku || sku === curGroup.sku);
        if(isSub){ curGroup.rows.push(r); return; }
        curGroup={sku:sku, rows:[r]};
        groups.push(curGroup);
      });

      var MRG='style="vertical-align:middle;"';
      var visitorMode = window._visitorMode === true;

      // Header ekspor
      var html='<table class="opv-tbl"><thead>';
      if(visitorMode){
        // Visitor: hanya 7 kolom, tidak perlu rowspan 2
        html+='<tr>';
        html+='<th>#</th><th>SKU</th><th>Nama Barang</th>';
        html+='<th>Buyer</th><th>Quotation</th><th>Prod / Exp Date</th>';
        html+='<th class="th-num">Fisik</th>';
        html+='</tr>';
      } else {
        html+='<tr>';
        html+='<th rowspan="2" style="width:28px;"></th>';
        html+='<th rowspan="2" '+MRG+' style="width:28px;text-align:center;">#</th>';
        html+='<th rowspan="2" '+MRG+'>SKU</th>';
        html+='<th rowspan="2" '+MRG+'>Nama Barang</th>';
        html+='<th rowspan="2" '+MRG+'>Buyer</th>';
        html+='<th rowspan="2" '+MRG+'>Quotation</th>';
        html+='<th rowspan="2" '+MRG+'>Prod / Exp Date</th>';
        html+='<th rowspan="2" class="th-num" '+MRG+'>Fisik</th>';
        html+='<th colspan="2" style="text-align:center;vertical-align:middle;">SAP</th>';
        html+='<th rowspan="2" class="th-num" '+MRG+'>Pend. GR</th>';
        html+='<th rowspan="2" class="th-num" '+MRG+'>Pend. GI</th>';
        html+='<th rowspan="2" class="th-num" '+MRG+'>Sel. Akhir</th>';
        html+='<th rowspan="2" '+MRG+'>Keterangan</th>';
        html+='<th rowspan="2" class="th-num" '+MRG+'>STD</th>';
        html+='<th rowspan="2" class="th-num" '+MRG+'>Palet</th>';
        html+='</tr><tr>';
        html+='<th class="th-num">Detail QT</th>';
        html+='<th class="th-num" style="font-weight:900;">TOTAL</th>';
        html+='</tr>';
      }
      html+='</thead><tbody>';

      var rowNum=0;
      groups.forEach(function(grp){
        var span=grp.rows.length;
        grp.rows.forEach(function(r,ri){
          var isFirst=ri===0;
          var sx=Number(r[14]);
          var subStyle=!isFirst?'border-top:1px dashed #cbd5e0;background:#f8fbff;':'';
          var rid='rvE_'+rowNum+'_'+ri+'_'+Date.now();
          html+='<tr data-rid="'+rid+'" data-row="'+encRow(r)+'" data-isek="1">';
          if(visitorMode){
            // Visitor: hanya 7 kolom tanpa rowspan
            if(isFirst){
              html+='<td class="td-num" style="color:#a0aec0;font-size:11px;">'+(++rowNum)+'</td>';
              html+='<td class="td-sku">'+r[4]+'</td>';
              html+='<td class="td-nama">'+r[5]+'</td>';
              html+='<td class="td-buyer">'+(r[6]||'-')+'</td>';
            } else {
              html+='<td></td><td></td><td></td><td></td>';
            }
            html+='<td class="td-quot">'+(r[7]||'-')+'</td>';
            html+='<td style="font-size:11px;">'+(r[8]||'-')+'</td>';
            html+='<td class="td-num">'+(Number(r[9])||0).toLocaleString('id-ID')+'</td>';
          } else {
            html+='<td class="td-edit-btn" style="'+subStyle+'"><button class="opv-edit-btn" onclick="_rvEdit(this)" title="Edit baris ini"><i class="fas fa-pencil-alt"></i></button></td>';
            if(isFirst){
              html+='<td rowspan="'+span+'" class="td-num td-merged" style="text-align:center;font-weight:700;color:#4a5568;vertical-align:middle;">'+(++rowNum)+'</td>';
              html+='<td rowspan="'+span+'" class="td-sku td-merged" data-col="4" style="vertical-align:middle;">'+r[4]+'</td>';
              html+='<td rowspan="'+span+'" class="td-merged td-nama" data-col="5" style="vertical-align:middle;">'+r[5]+'</td>';
              html+='<td rowspan="'+span+'" class="td-merged td-buyer" data-col="6" style="vertical-align:middle;">'+(r[6]||'-')+'</td>';
            }
            html+='<td class="td-quot" data-col="7" style="'+subStyle+'">'+(r[7]||'-')+'</td>';
            html+='<td data-col="8" style="font-size:11px;'+subStyle+'">'+(r[8]||'-')+'</td>';
            html+='<td class="td-num" data-col="9" style="'+subStyle+'">'+(Number(r[9])||0?(Number(r[9])||0).toLocaleString('id-ID'):'')+'</td>';
            html+='<td class="td-num" data-col="10" style="background:rgba(66,153,225,.04);'+subStyle+'">'+(Number(r[10])||0).toLocaleString('id-ID')+'</td>';
            if(isFirst){
              html+='<td rowspan="'+span+'" class="td-num td-merged" data-col="11" style="font-weight:800;background:rgba(66,153,225,.12);vertical-align:middle;">'+(Number(r[11])||0).toLocaleString('id-ID')+'</td>';
            }
            html+='<td class="td-num" data-col="12" style="'+subStyle+'">'+(Number(r[12])||0)+'</td>';
            html+='<td class="td-num" data-col="13" style="'+subStyle+'">'+(Number(r[13])||0)+'</td>';
            html+='<td class="'+(sx>0?'td-plus':sx<0?'td-minus':'td-ok')+'" style="'+subStyle+'">'+(sx>0?'+':'')+sx+'</td>';
            html+='<td class="'+(String(r[15]||'').toUpperCase().indexOf('PLUS')>=0?'td-ket-plus':String(r[15]||'').toUpperCase().indexOf('MINUS')>=0?'td-ket-minus':'td-ket-ok')+'" data-col="15" style="'+subStyle+'">'+(r[15]||'')+'</td>';
            html+='<td class="td-num" data-col="17" style="'+subStyle+'">'+(Number(r[17])||0)+'</td>';
            html+='<td class="td-num" style="'+subStyle+'">'+(Number(r[16])||0?Math.ceil(Number(r[16])):'')+'</td>';
          }
          html+='</tr>';
        });
      });
      return html+'</tbody></table>';
    }

      // Kept for backward compat (Lokal)
      function renderRow(r,idx,isEk){
        return ''; // tidak dipakai lagi, diganti renderTableMerged
      }

      function renderGroup(g, present, isGdfgSection){
        var isEk=isEksp(g.tipe);
        var paletIdx=isEk?16:15, selIdx=isEk?14:13;
        var totP=g.rows.reduce(function(s,r){return s+(Number(r[paletIdx])||0);},0);
        var totPl=0,totMn=0,totOk=0;
        g.rows.forEach(function(r){ var sx=Number(r[selIdx]); if(sx>0)totPl++; else if(sx<0)totMn++; else totOk++; });
        var missing=getMissing(g.tanggal,g.plant,g.tipe,present[g.tanggal+'|'+g.plant+'|'+g.tipe]||[]);
        var hdrCls=HDR_CLASS[g.tipe]||'opv-hdr-lokal';
        var ico=ICON[g.tipe]||'fa-clipboard';
        var HDRS=isEk?HDR_EKSPOR:HDR_LOKAL;
        var html='<div class="opv-card">';
        html+='<div class="opv-card-hdr '+hdrCls+'">';
        html+='<div class="opv-hdr-left"><div class="opv-hdr-title">';
        html+='<i class="fas '+ico+'"></i><span>'+g.tanggal+' &nbsp;—&nbsp; '+g.nama+'</span>';
        html+='<span class="opv-tipe-badge">'+g.tipe+'</span>';
        html+='<span class="opv-tipe-badge" style="background:rgba(255,255,255,.18);font-weight:700;">'+( g.plant||'-')+'</span>';
        if(missing.length) html+='<span class="opv-missing-badge"><i class="fas fa-exclamation-triangle"></i> Belum: '+missing.join(', ')+'</span>';
        html+='</div><div class="opv-hdr-meta"><span>'+g.rows.length+' SKU</span></div></div>';
        html+='<div class="opv-stats">';
        html+='<div class="opv-stat-item"><div class="opv-stat-val" style="color:#68d391;">'+totPl+'</div><div class="opv-stat-lbl">Plus</div></div>';
        html+='<div class="opv-stat-sep"></div>';
        html+='<div class="opv-stat-item"><div class="opv-stat-val" style="color:#fc8181;">'+totMn+'</div><div class="opv-stat-lbl">Minus</div></div>';
        html+='<div class="opv-stat-sep"></div>';
        html+='<div class="opv-stat-item"><div class="opv-stat-val" style="color:rgba(255,255,255,.7);">'+totOk+'</div><div class="opv-stat-lbl">OK</div></div>';
        html+='<div class="opv-stat-sep"></div>';
        html+='<div class="opv-stat-item"><div class="opv-stat-val">'+(Math.ceil(totP)).toLocaleString('id-ID')+'</div><div class="opv-stat-lbl">Palet</div></div>';
        html+='</div></div>';
        html+='<div class="opv-tbl-wrap">';
        html+=renderTableMerged(g.rows, isEk, HDRS);
        html+='</div></div>';
        return html;
      }

      // ── Summary Belum Input (hanya jika filter Semua Nama) ──
      var missingHtml = '';
      if(!namaFilter){
        // Kumpulkan semua tanggal unik dari data
        var allTgl = {};
        data.forEach(function(r){
          var tgl = String(r[0]||'');
          if(!allTgl[tgl]) allTgl[tgl] = {};
          var area = String(r[3]||'').toUpperCase();
          // Normalize tipe untuk WAJIB lookup
          var tipe = area;
          var plant = String(r[2]||'');
          var nama  = String(r[1]||'');
          var key   = plant+'|'+tipe;
          if(!allTgl[tgl][key]) allTgl[tgl][key] = [];
          if(allTgl[tgl][key].indexOf(nama) < 0) allTgl[tgl][key].push(nama);
        });

        // Untuk setiap tanggal, hitung siapa yang belum input
        var tglList = Object.keys(allTgl).sort();
        var missByTgl = {};
        tglList.forEach(function(tgl){
          var missList = [];
          // Cek semua kombinasi plant|tipe di WAJIB
          Object.keys(WAJIB).forEach(function(key){
            // Filter sesuai plantFilter jika ada
            var parts = key.split('|');
            var wPlant = parts[0], wTipe = parts[1];
            if(plantFilter && wPlant !== plantFilter) return;
            // Skip tipe GDFG dan GDFG-EKSPOR (ikut lokal/ekspor)
            if(wTipe === 'GDFG' || wTipe === 'GDFG-EKSPOR') return;
            if(tipeFilter && wTipe !== tipeFilter) return;
            var wajibList = WAJIB[key] || [];
            var present   = allTgl[tgl][key] || [];
            wajibList.forEach(function(nm){
              if(present.indexOf(nm) < 0){
                missList.push({nama:nm, plant:wPlant, tipe:wTipe});
              }
            });
          });
          if(missList.length) missByTgl[tgl] = missList;
        });

        var missTglKeys = Object.keys(missByTgl).sort();
        if(missTglKeys.length){
          missingHtml += '<div class="opv-missing-summary">';
          missingHtml += '<div class="opv-missing-summary-hdr"><i class="fas fa-exclamation-triangle"></i> BELUM INPUT OPNAME</div>';
          missingHtml += '<div class="opv-missing-summary-body">';
          missTglKeys.forEach(function(tgl){
            missingHtml += '<div class="opv-miss-tgl-group">';
            missingHtml += '<div class="opv-miss-tgl"><i class="fas fa-calendar-day" style="margin-right:4px;"></i>'+tgl+'</div>';
            missByTgl[tgl].forEach(function(m){
              missingHtml += '<span class="opv-miss-chip"><i class="fas fa-user-times"></i>'+m.nama+' <span style="opacity:.7;font-size:10px;">'+m.plant+' '+m.tipe+'</span></span>';
            });
            missingHtml += '</div>';
          });
          missingHtml += '</div></div>';
        } else if(tglList.length){
          missingHtml += '<div class="opv-missing-summary">';
          missingHtml += '<div class="opv-missing-summary-hdr" style="background:linear-gradient(90deg,#276749,#38a169);"><i class="fas fa-check-circle"></i> STATUS KELENGKAPAN</div>';
          missingHtml += '<div class="opv-missing-summary-body"><div class="opv-miss-none"><i class="fas fa-check-circle" style="color:#68d391;"></i> Semua stock keeper sudah input untuk periode ini.</div></div>';
          missingHtml += '</div>';
        }
      }

      var html='<div class="opv-body">'+missingHtml;

      // ── Section LOKAL/EKSPOR ──
      if(dataUtama.length){
        var gu=groupData(dataUtama);
        gu.gOrder.forEach(function(k){ html+=renderGroup(gu.groups[k], gu.present, false); });
      }

      // ── Section GDFG — selalu tampil jika ada, dipisah dengan divider ──
      if(dataGdfg.length){
        html+='<div style="margin:16px 0 8px;padding:8px 14px;background:linear-gradient(90deg,#1a4731,#276749);border-radius:8px;color:#fff;font-size:11px;font-weight:800;letter-spacing:.8px;">';
        html+='<i class="fas fa-boxes" style="margin-right:6px;"></i>GDFG</div>';
        var gg=groupData(dataGdfg);
        gg.gOrder.forEach(function(k){ html+=renderGroup(gg.groups[k], gg.present, true); });
      }

      if(!dataUtama.length && !dataGdfg.length){
        html+='<div class="opv-empty">Tidak ada data sesuai filter.</div>';
      }

      html+='</div>';
      body.innerHTML=html;
    }

    // =============================================
    // SIDEBAR
    // =============================================


    // =============================================
    // INPUT TABLE — MODERN
    // =============================================



  // ── Pattern Lock (dipindah dari rdc.js) ──
  var _patternSeq     = [];       // titik yang sudah disentuh sesi ini
  var _patternDragging= false;
  var _patternSuccess = null;     // callback saat pola benar
  var _psNewSeq1      = [];       // pola baru step-1
  var _psNewSeq2      = [];       // pola baru step-2 (konfirmasi)
  var _psNewPhase     = 1;        // 1=gambar, 2=konfirmasi
  var _patternCache   = null;     // cache pola di memory (avoid repeated GAS calls)
  var _patternLoaded  = false;    // sudah di-load dari server?

  // ── Simpan / baca pola — GAS sheet PATTERN_LOCK per username, fallback sessionStorage preview ──
  function _patternSave(seq){
    var str = seq.join(',');
    _patternCache = seq.slice();
    _patternLoaded = true;
    if(true){
      API.saveOpnamePattern(_currentUser, str);
    } else {
      try{ sessionStorage.setItem(_PATTERN_KEY+'_'+_currentUser, str); }catch(e){}
    }
  }

  function _patternClear(){
    _patternCache = null;
    _patternLoaded = true;
    if(true){
      API.saveOpnamePattern(_currentUser, '');
    } else {
      try{ sessionStorage.removeItem(_PATTERN_KEY+'_'+_currentUser); }catch(e){}
    }
  }

  // Load pola async — panggil callback(seq|null)
  function _patternLoadAsync(cb){
    if(_patternLoaded){
      cb(_patternCache);
      return;
    }
    if(true){
      google.script.run
        .withSuccessHandler(function(res){
          if(res && res.success && res.pattern){
            _patternCache = res.pattern.split(',').map(Number);
          } else {
            _patternCache = null;
          }
          _patternLoaded = true;
          cb(_patternCache);
        })
        .withFailureHandler(function(){
          _patternCache = null;
          _patternLoaded = true;
          cb(null);
        })
        .loadOpnamePattern(_currentUser);
    } else {
      // Preview mode: pakai sessionStorage per user
      try{
        var s = sessionStorage.getItem(_PATTERN_KEY+'_'+_currentUser);
        _patternCache = s ? s.split(',').map(Number) : null;
      }catch(e){ _patternCache = null; }
      _patternLoaded = true;
      cb(_patternCache);
    }
  }

  // ── Buka overlay pattern lock ──
  var _patternEventsbound = false;
  function _patternOpen(onSuccess){
    if (!_patternEventsbound) { _patternBindEvents(); _patternEventsbound = true; }
    _patternLoadAsync(function(saved){
      if(!saved){
        // Belum ada pola — langsung masuk
        onSuccess && onSuccess();
        return;
      }
      _patternSuccess = onSuccess;
      _patternSeq = [];
      _patternReset();
      document.getElementById('patternSubtitle').textContent = 'Masukkan pola untuk melanjutkan';
      document.getElementById('patternOverlay').classList.add('show');
      // Bind events setelah overlay visible
      setTimeout(function(){ _patternBindEvents(); }, 50);
    });
  }

  function _patternCancel(){
    document.getElementById('patternOverlay').classList.remove('show');
    _patternSeq = [];
    _patternSuccess = null;
  }

  function _patternReset(){ _patternSeq=[]; _patternDrawLines([]); document.querySelectorAll('.pdot').forEach(function(d){ d.classList.remove('active','error','success'); }); }

  function _patternGetDotCenter(i){
    var dots = document.getElementById('patternDots');
    var wrap = document.getElementById('patternDotsWrap');
    var dot  = dots.querySelectorAll('.pdot')[i];
    if(!dot||!wrap) return {x:0,y:0};
    var wr = wrap.getBoundingClientRect();
    var dr = dot.getBoundingClientRect();
    return { x: dr.left+dr.width/2 - wr.left, y: dr.top+dr.height/2 - wr.top };
  }

  function _patternDrawLines(seq, curX, curY){
    var svg = document.getElementById('patternSvg');
    var wrap= document.getElementById('patternDotsWrap');
    if(!svg||!wrap) return;
    svg.style.width  = wrap.offsetWidth  + 'px';
    svg.style.height = wrap.offsetHeight + 'px';
    var lines = '';
    for(var i=1;i<seq.length;i++){
      var a=_patternGetDotCenter(seq[i-1]), b=_patternGetDotCenter(seq[i]);
      lines += '<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>';
    }
    if(seq.length && curX !== undefined){
      var last=_patternGetDotCenter(seq[seq.length-1]);
      var wr=wrap.getBoundingClientRect();
      lines += '<line x1="'+last.x+'" y1="'+last.y+'" x2="'+(curX-wr.left)+'" y2="'+(curY-wr.top)+'" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" opacity=".4" stroke-dasharray="4"/>';
    }
    svg.innerHTML = lines;
  }

  function _patternBindEvents(){
    var dots = document.querySelectorAll('#patternDots .pdot');
    var wrap = document.getElementById('patternDotsWrap');
    // Guard: jika elemen belum ada / overlay hidden, jangan bind
    if (!wrap || dots.length === 0) return;

    function startDot(i){
      if(_patternSeq.indexOf(i)<0){
        _patternSeq.push(i);
        dots[i].classList.add('active');
        _patternDrawLines(_patternSeq);
      }
    }

    function hitTest(clientX, clientY){
      dots.forEach(function(d){
        var r=d.getBoundingClientRect();
        var i=parseInt(d.dataset.i);
        if(clientX>=r.left&&clientX<=r.right&&clientY>=r.top&&clientY<=r.bottom && _patternSeq.indexOf(i)<0){
          _patternSeq.push(i);
          d.classList.add('active');
        }
      });
      _patternDrawLines(_patternSeq, clientX, clientY);
    }

    dots.forEach(function(d){
      d.addEventListener('mousedown',function(e){ e.preventDefault(); _patternDragging=true; startDot(parseInt(d.dataset.i)); });
      d.addEventListener('touchstart',function(e){ e.preventDefault(); _patternDragging=true; startDot(parseInt(d.dataset.i)); },{passive:false});
    });
    wrap.addEventListener('mousemove',function(e){ if(!_patternDragging) return; hitTest(e.clientX,e.clientY); });
    wrap.addEventListener('touchmove',function(e){ e.preventDefault(); if(!_patternDragging) return; var t=e.touches[0]; hitTest(t.clientX,t.clientY); },{passive:false});

    function endDraw(){
      if(!_patternDragging) return;
      _patternDragging=false;
      if(_patternSeq.length >= 4) _patternCheck();
      else { _patternFlash('error','Min. 4 titik'); }
    }
    document.addEventListener('mouseup', endDraw);
    document.addEventListener('touchend', endDraw);
  }

  function _patternCheck(){
    var saved = _patternCache;
    if(!saved){ _patternCancel(); _patternSuccess&&_patternSuccess(); return; }
    var ok = (JSON.stringify(_patternSeq) === JSON.stringify(saved));
    if(ok){
      _patternFlash('success','✓ Pola benar', function(){
        document.getElementById('patternOverlay').classList.remove('show');
        _patternSuccess && _patternSuccess();
        _patternSuccess = null;
      });
    } else {
      _patternFlash('error','✗ Pola salah, coba lagi');
    }
  }

  function _patternFlash(type, msg, cb){
    document.querySelectorAll('#patternDots .pdot').forEach(function(d){ d.classList.remove('active'); d.classList.add(type); });
    _patternDrawLines([]);
    document.getElementById('patternSubtitle').textContent = msg;
    setTimeout(function(){
      document.querySelectorAll('#patternDots .pdot').forEach(function(d){ d.classList.remove(type,'active'); });
      _patternSeq=[];
      if(cb) cb();
      else document.getElementById('patternSubtitle').textContent='Masukkan pola untuk melanjutkan';
    }, 700);
  }

  // ── Setting Pola ──
  function _psOpen(){
    document.getElementById('patternSettingOverlay').classList.add('show');
    document.getElementById('psettingPwInput').value='';
    document.getElementById('psettingErr').textContent='';
    ['psStep1','psStep2','psStep3'].forEach(function(s){ document.getElementById(s).classList.remove('active'); });
    document.getElementById('psStep1').classList.add('active');
    setTimeout(function(){ document.getElementById('psettingPwInput').focus(); }, 300);
  }
