function updateRowCount(){
      var n = document.querySelectorAll("#tbodyInput tr").length;
      var el = document.getElementById('rowCount');
      if(el) el.innerText = n + ' baris';
      var empty = document.getElementById('emptyState');
      if(empty) empty.style.display = n === 0 ? 'block' : 'none';
    }

    function updateRowNumbers(){
      var rows = document.querySelectorAll("#tbodyInput tr");
      rows.forEach(function(tr, i){
        var no = tr.querySelector('.row-no');
        if(no) no.innerText = i + 1;
      });
      updateRowCount();
    }

    function addRowToTable(code, name, bal, rec, issued, ending, std, div, plt){
      issued  = issued  || '';
      ending  = ending  || '';
      std     = std     || '';
      var tbody = document.getElementById("tbodyInput");
      var tr    = document.createElement("tr");
      var idx   = tbody.rows.length + 1;

      // Hitung JML PALLET jika std dan ending sudah ada
      var jml = '';
      if(std !== '' && bal !== '' && !isNaN(Number(std)) && !isNaN(Number(bal)) && Number(std) > 0){
        jml = Math.ceil(Number(bal) / Number(std));
      }

      tr.innerHTML =
        '<td class="row-no">'+idx+'</td>'
        + '<td contenteditable="true" class="td-gudang-code">'+code+'</td>'
        + '<td class="td-spacer" contenteditable="true"></td>'
        + '<td contenteditable="true">'+name+'</td>'
        + '<td class="td-spacer" contenteditable="true"></td>'
        + '<td class="td-spacer" contenteditable="true"></td>'
        + '<td class="td-spacer" contenteditable="true"></td>'
        + '<td contenteditable="true" class="td-num td-gudang-bb">'+bal+'</td>'
        + '<td contenteditable="true" class="td-num">'+rec+'</td>'
        + '<td contenteditable="true" class="td-num">'+issued+'</td>'
        + '<td contenteditable="true" class="td-num td-gudang-eb">'+ending+'</td>'
        + '<td contenteditable="true" class="td-num td-gudang-std" style="background:#fffbeb;color:#92400e;" data-std="'+std+'">'+std+'</td>'
        + '<td class="td-num td-gudang-jml" style="background:#f0fdf4;color:#166534;font-weight:700;">'+jml+'</td>'
        + '<td contenteditable="true" class="td-gudang-divisi" style="background:#faf5ff;color:#6b46c1;font-weight:700;text-align:center;min-width:80px;">'+(div||'')+'</td>'
        + '<td contenteditable="true" class="td-gudang-plant" style="background:#ebf8ff;color:#2b6cb0;font-weight:700;text-align:center;min-width:70px;">'+(plt||'')+'</td>'
        + '<td class="td-del" onclick="deleteRow(this)" title="Hapus baris"><i class="fas fa-times"></i></td>';

      tbody.appendChild(tr);
      updateRowNumbers();
      _bindGudangRowEvents(tr);
    }

    // Bind events pada satu baris: auto-lookup STD saat Material Code blur,
    // auto-hitung JML PALLET saat Ending Balance atau STD berubah
    var _stdLookupMap = {}; // cache SKU → {std, divisi, plant}

    function _bindGudangRowEvents(tr){
      var codeTd  = tr.querySelector('.td-gudang-code');
      var stdTd   = tr.querySelector('.td-gudang-std');
      var ebTd    = tr.querySelector('.td-gudang-eb');
      var jmlTd   = tr.querySelector('.td-gudang-jml');
      var divTd   = tr.querySelector('.td-gudang-divisi');
      var pltTd   = tr.querySelector('.td-gudang-plant');

      function calcJml(){ _calcJmlPallet(tr); }

      // Saat Material Code blur → lookup STD + DIVISI + PLANT
      if(codeTd) codeTd.addEventListener('blur', function(){
        var sku = _stripSkuZeros(this.innerText.trim());
        if(!sku) return;
        if(this.innerText.trim() !== sku) this.innerText = sku;

        var cached = _stdLookupMap[sku];
        if(cached !== undefined){
          if(cached && cached.std > 0 && stdTd && stdTd.innerText.trim() === '') stdTd.innerText = cached.std;
          if(cached && cached.divisi && divTd && divTd.innerText.trim() === '') divTd.innerText = cached.divisi;
          if(cached && cached.plant  && pltTd && pltTd.innerText.trim() === '') pltTd.innerText = cached.plant;
          calcJml();
          return;
        }
        // Fetch dari server
        if(true){
          google.script.run
            .withSuccessHandler(function(res){
              if(res && res.success){
                res.data.forEach(function(d){
                  _stdLookupMap[d.sku] = {std: Number(d.std)||0, divisi: d.divisi||'', plant: d.plant||''};
                });
                var c = _stdLookupMap[sku];
                if(c){
                  if(c.std  > 0 && stdTd && stdTd.innerText.trim() === '') stdTd.innerText = c.std;
                  if(c.divisi && divTd && divTd.innerText.trim() === '') divTd.innerText = c.divisi;
                  if(c.plant  && pltTd && pltTd.innerText.trim() === '') pltTd.innerText = c.plant;
                  calcJml();
                }
              }
            })
            .getStandarPalet();
        }
      });

      var bbTd2 = tr.querySelector('.td-gudang-bb');
      // Kolom numerik lain (rec, issued, eb) — ambil semua td-num editable selain bb, std, jml
      var numTds = Array.from(tr.querySelectorAll('td[contenteditable="true"].td-num'));

      // Eval formula di setiap blur kolom numerik, lalu recalc
      numTds.forEach(function(ntd){
        ntd.addEventListener('blur', function(){
          _evalGudangFormula(this);
          calcJml();
        });
      });

      if(stdTd) stdTd.addEventListener('input', calcJml);
      if(stdTd) stdTd.addEventListener('blur',  function(){ _evalGudangFormula(this); calcJml(); });
      if(bbTd2) bbTd2.addEventListener('input', calcJml);
      if(bbTd2) bbTd2.addEventListener('blur',  function(){ _evalGudangFormula(this); calcJml(); });
    }

    // Evaluasi rumus =expr di cell numerik tabel input data
    function _evalGudangFormula(td){
      var txt = (td.innerText||'').trim();
      if(!txt || txt.charAt(0) !== '=') return;
      var expr = txt.slice(1)
                    .replace(/,/g, '.')              // desimal koma → titik
                    .replace(/[^0-9.+\-*/()\s]/g, ''); // whitelist aman
      if(!expr) return;
      try{
        var result = Function('"use strict"; return (' + expr + ')')();
        if(typeof result === 'number' && isFinite(result)){
          td.innerText = (result % 1 === 0)
            ? String(Math.round(result))
            : parseFloat(result.toFixed(6)).toString();
        }
      }catch(ex){ /* ekspresi tidak valid, biarkan */ }
    }

    // Pre-load semua STD ke cache saat halaman input dibuka
    function _preloadStdCache(){
      if(Object.keys(_stdLookupMap).length > 0) return;
      if(true){
        google.script.run
          .withSuccessHandler(function(res){
            if(res && res.success){
              res.data.forEach(function(d){
                _stdLookupMap[d.sku] = {std: Number(d.std)||0, divisi: d.divisi||'', plant: d.plant||''};
              });
            }
          })
          .getStandarPalet();
      }
    }

    function addRow(){
      var code = document.getElementById('fCode').value.trim();
      var name = document.getElementById('fName').value.trim();
      var bal  = document.getElementById('fBal').value.trim();
      var rec  = document.getElementById('fRec').value.trim();
      var err  = document.getElementById('formError');

      // Reset error
      ['fCode','fName','fBal','fRec'].forEach(function(id){
        document.getElementById(id).classList.remove('error');
      });
      err.style.display = 'none';

      // Validasi
      var errors = [];
      if(!code){ document.getElementById('fCode').classList.add('error'); errors.push('Material Code'); }
      if(!name){ document.getElementById('fName').classList.add('error'); errors.push('Material Name'); }
      if(bal==='' || isNaN(bal) || Number(bal)<0){ document.getElementById('fBal').classList.add('error'); errors.push('Beginning Balance'); }
      if(rec==='' || isNaN(rec) || Number(rec)<0){ document.getElementById('fRec').classList.add('error'); errors.push('Receipt'); }

      if(errors.length > 0){
        err.innerText     = '⚠️ Wajib diisi: ' + errors.join(', ');
        err.style.display = 'block';
        return;
      }

      addRowToTable(code, name, bal, rec);

      // Reset form
      document.getElementById('fCode').value = '';
      document.getElementById('fName').value = '';
      document.getElementById('fBal').value  = '';
      document.getElementById('fRec').value  = '';
      document.getElementById('fCode').focus();
    }

    function deleteRow(el){
      el.closest('tr').remove();
      updateRowNumbers();
    }

    // ===== STANDAR PALLET =====
    function addSpRowToTable(code, name, val, div){
      var tbody = document.getElementById("tbodyInput");
      var tr    = document.createElement("tr");
      var idx   = tbody.rows.length + 1;
      var divOpts = '<option value="WAFER"'+(div==='WAFER'?' selected':'')+'>WAFER</option>'
                  + '<option value="BISKUIT"'+(div==='BISKUIT'?' selected':'')+'>BISKUIT</option>';
      tr.innerHTML =
        '<td class="row-no">'+idx+'</td>'
        + '<td contenteditable="true">'+code+'</td>'
        + '<td contenteditable="true">'+name+'</td>'
        + '<td contenteditable="true" class="td-num">'+val+'</td>'
        + '<td><select style="border:1px solid #e2e8f0;border-radius:6px;padding:3px 6px;font-size:12px;color:#2d3748;">'+divOpts+'</select></td>'
        + '<td class="td-del" onclick="deleteRow(this)" title="Hapus"><i class="fas fa-times"></i></td>';
      tbody.appendChild(tr);
      updateRowNumbers();
    }

    function addSpRow(){
      var code = document.getElementById('spCode').value.trim();
      var name = document.getElementById('spName').value.trim();
      var val  = document.getElementById('spVal').value.trim();
      var div  = document.getElementById('spDiv').value;
      var err  = document.getElementById('spFormError');
      ['spCode','spName','spVal'].forEach(function(id){ document.getElementById(id).classList.remove('error'); });
      err.style.display = 'none';
      var errors = [];
      if(!code){ document.getElementById('spCode').classList.add('error'); errors.push('Material Code'); }
      if(!name){ document.getElementById('spName').classList.add('error'); errors.push('Material Name'); }
      if(val===''||isNaN(val)||Number(val)<0){ document.getElementById('spVal').classList.add('error'); errors.push('Standar Pallet'); }
      if(errors.length > 0){ err.innerText='⚠️ Wajib diisi: '+errors.join(', '); err.style.display='block'; return; }
      addSpRowToTable(code, name, val, div);
      document.getElementById('spCode').value='';
      document.getElementById('spName').value='';
      document.getElementById('spVal').value='';
      document.getElementById('spCode').focus();
    }

    ['spCode','spName','spVal'].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); addSpRow(); } });
    });


    function addEmptyRows(n){
      var isSP = document.getElementById('gudangAktif').innerText === 'STANDAR_PALLET';
      for(var i = 0; i < n; i++){
        if(isSP) addSpRowToTable('','','','WAFER');
        else addRowToTable('','','','','','','');
      }
      updateRowCount();
    }

    function clearTable(){
      initEmptyRows(30);
    }

    function getTableData(){
      var rows  = document.querySelectorAll("#tbodyInput tr");
      var isSP  = document.getElementById("gudangAktif").innerText === 'STANDAR_PALLET';
      var data  = [];
      rows.forEach(function(row){
        var tds  = row.querySelectorAll("td");
        var code = _stripSkuZeros(tds[1] ? tds[1].innerText.trim() : '');
        var name = tds[3] ? tds[3].innerText.trim() : '';
        if(isSP){
          var name2 = tds[2] ? tds[2].innerText.trim() : '';
          var val   = tds[3] ? tds[3].innerText.trim() : '';
          var div   = tds[4] ? (tds[4].querySelector('select') ? tds[4].querySelector('select').value : tds[4].innerText.trim()) : '';
          if(code || name2) data.push([code, name2, val, div]);
        } else {
          var bal    = tds[7]  ? tds[7].innerText.trim()  : '';
          var rec    = tds[8]  ? tds[8].innerText.trim()  : '';
          var issued = tds[9]  ? tds[9].innerText.trim()  : '';
          var ending = tds[10] ? tds[10].innerText.trim() : '';
          var std    = tds[11] ? tds[11].innerText.trim() : '';
          var divisi = tds[13] ? tds[13].innerText.trim() : '';
          var plant  = tds[14] ? tds[14].innerText.trim() : '';
          if(code || name) data.push([code, name, bal, rec, issued, ending, std, divisi, plant]);
        }
      });
      return data;
    }

    function validateTableData(rows){
      var isSP   = document.getElementById("gudangAktif").innerText === 'STANDAR_PALLET';
      var errors = [];
      // Helper: cek apakah string angka valid (termasuk format ribuan dengan titik/koma)
      function isValidNum(v){ return v!=='' && !isNaN(_rdcParseNum(v)); }
      rows.forEach(function(r, i){
        var line = i + 1;
        if(!r[0]) errors.push('Baris '+line+': Material Code kosong');
        if(!r[1]) errors.push('Baris '+line+': Material Name kosong');
        if(isSP){
          if(r[2]==='' || !isValidNum(r[2])) errors.push('Baris '+line+': Standar Pallet tidak valid');
        } else {
          if(r[2]==='' || !isValidNum(r[2])) errors.push('Baris '+line+': Beginning Balance tidak valid');
          if(r[3]==='' || !isValidNum(r[3])) errors.push('Baris '+line+': Receipt tidak valid');
          if(r[4]!=='' && !isValidNum(r[4])) errors.push('Baris '+line+': Issued tidak valid');
          if(r[5]!=='' && !isValidNum(r[5])) errors.push('Baris '+line+': Ending Balance tidak valid');
          if(r[6]==='' || !isValidNum(r[6]) || _rdcParseNum(r[6])<=0) errors.push('Baris '+line+': STD Pallet wajib diisi dan harus > 0');
          if(!r[7]) errors.push('Baris '+line+': DIVISI wajib diisi');
          if(!r[8]) errors.push('Baris '+line+': PLANT wajib diisi');
        }
      });
      return errors;
    }

    function saveGudang(){
      var btn    = document.getElementById("btnSave");
      var gudang = document.getElementById("gudangAktif").innerText;
      var rows   = getTableData();

      if(rows.length === 0){
        showToast('⚠️ Tidak ada data untuk disimpan', 'error');
        return;
      }

      // Validasi
      var errs = validateTableData(rows);
      if(errs.length > 0){
        showToast('⚠️ ' + errs[0] + (errs.length > 1 ? ' (+' + (errs.length-1) + ' lainnya)' : ''), 'error');
        return;
      }

      btn.disabled  = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

      // Normalize angka (index 2-6 = angka, 7-8 = divisi/plant tetap string)
      var rowsNorm = rows.map(function(r){
        return r.map(function(v,i){
          if(i>=2 && i<=6 && v!=='') return String(_rdcParseNum(v));
          return v;
        });
      });
      // Deteksi SKU baru → perlu update sheet STD
      var newSkus = [];
      rowsNorm.forEach(function(r){
        var sku=r[0], std=r[6], divisi=r[7], plant=r[8];
        if(!sku||!std||!divisi||!plant) return;
        var cached=_stdLookupMap[sku];
        var isNew=!cached||!cached.std;
        if(isNew) newSkus.push({sku:sku, nama:r[1]||'', std:std, divisi:divisi, plant:plant});
      });
      google.script.run
        .withSuccessHandler(function(res){
          showToast('✅ ' + res.message + (newSkus.length?' (+'+newSkus.length+' SKU baru disimpan ke STD)':''), 'success');
          var _g = document.getElementById('gudangAktif').innerText;
          if(_gudangCache[_g]) delete _gudangCache[_g];
          clearTable();
          btn.disabled  = false;
          btn.innerHTML = '<i class="fas fa-save"></i> Save';
          // Update cache lokal untuk SKU baru
          newSkus.forEach(function(s){
            _stdLookupMap[s.sku]={std:Number(s.std)||0,divisi:s.divisi,plant:s.plant};
          });
        })
        .withFailureHandler(function(){
          showToast('❌ Gagal menyimpan data', 'error');
          btn.disabled  = false;
          btn.innerHTML = '<i class="fas fa-save"></i> Save';
        })
        .saveGudangData(gudang, rowsNorm, (document.getElementById('inputDataTanggal')||{}).value||'', newSkus);
    }

    function initEmptyRows(n){
      // Set default tanggal hari ini kalau belum diisi
      var tglEl = document.getElementById('inputDataTanggal');
      if(tglEl && !tglEl.value){
        var today = new Date();
        tglEl.value = today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
      }
      // Pre-load STD cache dari server
      _preloadStdCache();
      var tbody = document.getElementById("tbodyInput");
      tbody.innerHTML = "";
      var issp = document.getElementById("gudangAktif").innerText === 'STANDAR_PALLET';
      for(var i=0;i<(n||30);i++){
        if(issp) addSpRowToTable('','','');
        else addRowToTable('','','','');
      }
    }

    // Cache data per tab agar tidak hilang saat pindah tab
    var _gudangCache = {};

    function _saveCurrentTab(){
      var gudang = document.getElementById('gudangAktif').innerText;
      if(!gudang) return;
      var isSP = (gudang === 'STANDAR_PALLET');
      var rows = document.querySelectorAll('#tbodyInput tr');
      var data = [];
      rows.forEach(function(tr){
        if(isSP){
          var tds = tr.querySelectorAll('td');
          var code='', name='', val='', div='WAFER';
          tds.forEach(function(td){
            var sel = td.querySelector('select');
            if(sel){ div = sel.value; return; }
            if(td.contentEditable !== 'true') return;
            var v = td.innerText.trim();
            if(!code)      { code = v; }
            else if(!name) { name = v; }
            else if(!val)  { val  = v; }
          });
          data.push({code:code, name:name, val:val, div:div});
        } else {
          var codeTd3= tr.querySelector('.td-gudang-code');
          var bbTd3  = tr.querySelector('.td-gudang-bb');
          var stdTd3 = tr.querySelector('.td-gudang-std');
          var ebTd3  = tr.querySelector('.td-gudang-eb');
          // rec dan issued: td-num contenteditable yang bukan bb, eb, std
          var tds2   = tr.querySelectorAll('td[contenteditable="true"]:not(.td-spacer)');
          var vals   = [];
          tds2.forEach(function(td){ vals.push(td.innerText.trim()); });
          // Nama barang = vals[1] (contenteditable non-spacer ke-2)
          // Normalize angka agar tidak ada format ribuan yang ambigu
          var rawBal    = bbTd3  ? bbTd3.innerText.trim()  : (vals[2]||'');
          var rawEnding = ebTd3  ? ebTd3.innerText.trim()  : (vals[5]||'');
          var rawStd    = stdTd3 ? stdTd3.innerText.trim() : (vals[6]||'');
          var divTd3    = tr.querySelector('.td-gudang-divisi');
          var pltTd3    = tr.querySelector('.td-gudang-plant');
          data.push({
            code  : _stripSkuZeros(codeTd3 ? codeTd3.innerText.trim() : (vals[0]||'')),
            name  : vals[1]||'',
            bal   : rawBal    ? String(_rdcParseNum(rawBal))    : '',
            rec   : vals[3]   ? String(_rdcParseNum(vals[3]))   : '',
            issued: vals[4]   ? String(_rdcParseNum(vals[4]))   : '',
            ending: rawEnding ? String(_rdcParseNum(rawEnding)) : '',
            std   : rawStd    ? String(_rdcParseNum(rawStd))    : '',
            divisi: divTd3    ? divTd3.innerText.trim()         : '',
            plant : pltTd3    ? pltTd3.innerText.trim()         : ''
          });
        }
      });
      _gudangCache[gudang] = data;
    }

    function _restoreTab(gudang){
      var data = _gudangCache[gudang];
      if(!data || data.length === 0) return false;
      var isSP = (gudang === 'STANDAR_PALLET');
      var tbody = document.getElementById('tbodyInput');
      tbody.innerHTML = '';
      data.forEach(function(row){
        if(isSP) addSpRowToTable(row.code||'', row.name||'', row.val||'', row.div||'WAFER');
        else addRowToTable(row.code||'', row.name||'', row.bal||'', row.rec||'', row.issued||'', row.ending||'', row.std||'', row.divisi||'', row.plant||'');
      });
      updateRowCount();
      return true;
    }

    function setGudang(gudang, btn){
      _saveCurrentTab();
      document.getElementById("gudangAktif").innerText = gudang;
      btn.parentElement.querySelectorAll(".gudang-tab").forEach(function(t){ t.classList.remove("active"); });
      btn.classList.add("active");

      var isSP  = gudang === 'STANDAR_PALLET';
      var tbody = document.getElementById("tbodyInput");

      // Fade out tabel
      tbody.classList.add('fading');

      setTimeout(function(){
        // Tampilkan / sembunyikan form SP
        document.getElementById('spFormWrap').style.display = isSP ? 'block' : 'none';

        // Ganti header tabel
        document.getElementById('inputThead').innerHTML = isSP
          ? '<tr><th class="row-no">#</th><th>MATERIAL CODE</th><th>MATERIAL NAME</th><th style="text-align:right">STANDAR PALLET</th><th>DIVISI</th><th></th></tr>'
          : '<tr><th class="row-no">#</th><th>MATERIAL CODE</th><th class="th-spacer"></th><th>MATERIAL NAME</th><th class="th-spacer"></th><th class="th-spacer"></th><th class="th-spacer"></th><th style="text-align:right">BEG. BALANCE</th><th style="text-align:right">RECEIPT</th><th style="text-align:right">ISSUED</th><th style="text-align:right">ENDING BALANCE</th><th style="text-align:right;background:#fffbeb;color:#92400e;">STD PALLET</th><th style="text-align:right;background:#f0fdf4;color:#166534;">JML PALLET</th><th></th></tr>';

        // Restore dari cache atau init kosong
        var restored = _restoreTab(gudang);
        if(!restored){
          tbody.innerHTML = "";
          for(var i=0;i<30;i++){
            if(isSP) addSpRowToTable('','','','WAFER');
            else addRowToTable('','','','','','','');
          }
          updateRowCount();
        } else if(!isSP){
          // Bind events ke baris yang di-restore dari cache
          Array.from(tbody.querySelectorAll('tr')).forEach(function(tr){ _bindGudangRowEvents(tr); });
        }

        // Fade in kembali
        tbody.classList.remove('fading');
      }, 200);
    }

    function pasteMode(){
      showToast('💡 Klik sel di tabel lalu paste (Ctrl+V) dari Excel', '');
    }

    // =============================================
    // INPUT DATA — Block Select & Copy
    // =============================================
    var _inSel = {r1:-1,c1:-1,r2:-1,c2:-1};
    var _inDragging = false;

    // Kolom editable di tableInput (index sel, skip row-no dan del)
    // Kita track pakai cellIndex langsung
    function _inTrIdx(tr){
      return Array.from(document.getElementById('tbodyInput').querySelectorAll('tr')).indexOf(tr);
    }
    function _inCellIdx(td){ return td.cellIndex; }

    function _inClearSel(){
      document.querySelectorAll('#tableInput .in-sel').forEach(function(el){ el.classList.remove('in-sel'); });
      _inSel = {r1:-1,c1:-1,r2:-1,c2:-1};
      var info = document.getElementById('inSelInfo');
      if(info) info.textContent = '';
    }

    function _inApplySel(){
      document.querySelectorAll('#tableInput .in-sel').forEach(function(el){ el.classList.remove('in-sel'); });
      if(_inSel.r1 < 0) return;
      var trs = Array.from(document.getElementById('tbodyInput').querySelectorAll('tr'));
      var r1=Math.min(_inSel.r1,_inSel.r2), r2=Math.max(_inSel.r1,_inSel.r2);
      var c1=Math.min(_inSel.c1,_inSel.c2), c2=Math.max(_inSel.c1,_inSel.c2);
      for(var r=r1;r<=r2;r++){
        if(!trs[r]) continue;
        for(var ci=c1;ci<=c2;ci++){
          var td = trs[r].cells[ci];
          if(td) td.classList.add('in-sel');
        }
      }
      var nR=r2-r1+1, nC=c2-c1+1;
      var info = document.getElementById('inSelInfo');
      if(info) info.textContent = nR+'R × '+nC+'K  (Ctrl+C copy)';
    }

    function _inCopyBlock(){
      if(_inSel.r1 < 0) return;
      var trs = Array.from(document.getElementById('tbodyInput').querySelectorAll('tr'));
      var r1=Math.min(_inSel.r1,_inSel.r2), r2=Math.max(_inSel.r1,_inSel.r2);
      var c1=Math.min(_inSel.c1,_inSel.c2), c2=Math.max(_inSel.c1,_inSel.c2);
      var lines = [];
      for(var r=r1;r<=r2;r++){
        if(!trs[r]) continue;
        var cells = [];
        for(var ci=c1;ci<=c2;ci++){
          var td = trs[r].cells[ci];
          cells.push(td ? td.textContent.trim() : '');
        }
        lines.push(cells.join('\t'));
      }
      var text = lines.join('\n');
      try{ navigator.clipboard.writeText(text).catch(function(){ _inFallbackCopy(text); }); }
      catch(e){ _inFallbackCopy(text); }
      showToast('\uD83D\uDCCB '+(r2-r1+1)+' baris disalin','success');
    }

    function _inFallbackCopy(text){
      var ta=document.createElement('textarea');
      ta.value=text; ta.style.cssText='position:fixed;opacity:0;';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }

    function _inBindEvents(){
      var tbl = document.getElementById('tableInput');
      if(!tbl || tbl._inBound) return;
      tbl._inBound = true;

      // Mousedown pada td — deteksi drag vs click
      tbl.addEventListener('mousedown', function(e){
        if(e.target.tagName === 'BUTTON' || e.target.closest('.td-del')) return;
        var td = e.target.closest('td');
        if(!td) return;
        var tr = td.closest('tr');
        if(!tr || !tr.closest('#tbodyInput')) return;

        var ri = _inTrIdx(tr);
        var ci = _inCellIdx(td);

        if(e.shiftKey && _inSel.r1 >= 0){
          _inSel.r2=ri; _inSel.c2=ci; _inApplySel();
          e.preventDefault(); return;
        }

        // Deteksi drag
        var startX=e.clientX, startY=e.clientY;
        var moved=false;
        function onMove(ev){
          if(Math.abs(ev.clientX-startX)>4||Math.abs(ev.clientY-startY)>4){
            if(!moved){
              moved=true;
              _inDragging=true;
              _inSel={r1:ri,c1:ci,r2:ri,c2:ci};
              _inApplySel();
              if(document.activeElement && document.activeElement.contentEditable==='true'){
                document.activeElement.blur();
              }
            }
            var overTd=ev.target.closest('td');
            if(overTd && overTd.closest('#tbodyInput')){
              var overTr=overTd.closest('tr');
              _inSel.r2=_inTrIdx(overTr); _inSel.c2=_inCellIdx(overTd);
              _inApplySel();
            }
          }
        }
        function onUp(){
          document.removeEventListener('mousemove',onMove);
          document.removeEventListener('mouseup',onUp);
          _inDragging=false;
        }
        document.addEventListener('mousemove',onMove);
        document.addEventListener('mouseup',onUp);
      });

      // Klik di luar → clear sel (hanya saat inputPage aktif)
      document.addEventListener('mousedown', function(e){
        var ip=document.getElementById('inputPage');
        if(!ip||ip.style.display==='none') return;
        var tbl2=document.getElementById('tableInput');
        if(tbl2&&!tbl2.contains(e.target)) _inClearSel();
      });

      // Keyboard Ctrl+A (hanya saat inputPage aktif)
      document.addEventListener('keydown', function(e){
        if(!(e.ctrlKey||e.metaKey)) return;
        var ip=document.getElementById('inputPage');
        if(!ip||ip.style.display==='none') return;
        if(e.key==='a'){
          var tbl2=document.getElementById('tableInput');
          var ae2=document.activeElement;
          if(!tbl2||!tbl2.contains(ae2)) return;
          if(ae2&&ae2.contentEditable==='true') return;
          e.preventDefault();
          var trs=document.getElementById('tbodyInput').querySelectorAll('tr');
          if(!trs.length) return;
          var lastTr=trs[trs.length-1];
          var lastCi=lastTr.cells.length-2;
          _inSel={r1:0,c1:1,r2:trs.length-1,c2:lastCi};
          _inApplySel();
        }
      });


      // ── Excel-style keydown untuk Input Data ──
      tbl.addEventListener('keydown', function(e){
        var ae = document.activeElement;
        if(!ae || !ae.closest('#tbodyInput')) return;
        var td = ae.closest('td');
        if(!td) return;
        var tr = td.closest('tr');
        var trs = Array.from(document.getElementById('tbodyInput').querySelectorAll('tr'));
        var ri = _inTrIdx(tr);
        var ci = _inCellIdx(td);
        var editTds = Array.from(tr.querySelectorAll('td[contenteditable="true"]'));
        var eiIdx = editTds.indexOf(td);

        // Arrow tanpa Shift → pindah cell, clear sel
        var isArrow=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.key)>=0;
        if(isArrow && !e.shiftKey){
          e.preventDefault();
          _inClearSel();
          var nri=ri, nei=eiIdx;
          if(e.key==='ArrowUp')    nri=ri-1;
          if(e.key==='ArrowDown')  nri=ri+1;
          if(e.key==='ArrowLeft')  nei=eiIdx-1;
          if(e.key==='ArrowRight') nei=eiIdx+1;
          if(e.key==='ArrowUp'||e.key==='ArrowDown'){
            nri=Math.max(0,Math.min(trs.length-1,nri));
            var nextEditTds=Array.from(trs[nri].querySelectorAll('td[contenteditable="true"]'));
            if(nextEditTds[eiIdx]) nextEditTds[eiIdx].focus();
          } else {
            nei=Math.max(0,Math.min(editTds.length-1,nei));
            if(editTds[nei]) editTds[nei].focus();
          }
          return;
        }

        // Ketik karakter saat _inOverwrite → timpa isi cell
        var isSpecial=e.key.length>1||e.ctrlKey||e.metaKey||e.altKey;
        if(!isSpecial && td._inOverwrite){
          td.textContent=''; td._inOverwrite=false;
        }
      });

      // Set _inOverwrite dan clear sel saat cell fokus (klik normal)
      tbl.addEventListener('focusin', function(e){
        var td=e.target.closest('td[contenteditable="true"]');
        if(td && td.closest('#tbodyInput')){
          td._inOverwrite=true;
          // Clear blok jika tidak sedang drag
          if(!_inDragging) _inClearSel();
        }
      });
      tbl.addEventListener('input', function(e){
        var td=e.target.closest('td');
        if(td) td._inOverwrite=false;
      });

      // Ctrl+C: copy cell/blok (intercept jika tidak ada teks ter-select)
      document.addEventListener('keydown', function(e){
        if(!(e.ctrlKey||e.metaKey)||e.key!=='c') return;
        var ip=document.getElementById('inputPage');
        if(!ip||ip.style.display==='none') return;
        if(_inSel.r1<0) return;
        var hasBrowserSel=window.getSelection()&&window.getSelection().toString().length>0;
        if(hasBrowserSel) return;
        e.preventDefault(); _inCopyBlock();
      });

      // Delete key — hapus blok (document level agar tetap aktif setelah drag)
      document.addEventListener('keydown', function(e){
        if(e.key !== 'Delete') return;
        var ip = document.getElementById('inputPage');
        if(!ip || ip.style.display==='none') return;
        // Jika ada blok terpilih di input table
        if(_inSel.r1 >= 0){
          e.preventDefault();
          var trsAll = Array.from(document.getElementById('tbodyInput').querySelectorAll('tr'));
          var r1=Math.min(_inSel.r1,_inSel.r2), r2=Math.max(_inSel.r1,_inSel.r2);
          var c1=Math.min(_inSel.c1,_inSel.c2), c2=Math.max(_inSel.c1,_inSel.c2);
          for(var ri2=r1;ri2<=r2;ri2++){
            if(!trsAll[ri2]) continue;
            for(var ci2=c1;ci2<=c2;ci2++){
              var tdDel = trsAll[ri2].cells[ci2];
              if(tdDel && tdDel.contentEditable==='true') tdDel.textContent='';
            }
          }
          return;
        }
        // Jika tidak ada blok, hapus cell aktif jika sedang fokus di tabel
        var ae = document.activeElement;
        if(!ae || !ae.closest('#tbodyInput')) return;
        var tdAct = ae.closest('td[contenteditable="true"]');
        if(tdAct){ e.preventDefault(); tdAct.textContent=''; }
      });
      // Shift+Arrow untuk extend selection saat ada sel fokus
      tbl.addEventListener('keydown', function(e){
        if(!e.shiftKey || ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.key)<0) return;
        var ae = document.activeElement;
        if(!ae||!ae.closest('#tbodyInput')) return;
        var td=ae.closest('td'), tr=td&&td.closest('tr');
        if(!td||!tr) return;
        var ri=_inTrIdx(tr), ci=_inCellIdx(td);
        if(_inSel.r1<0){ _inSel={r1:ri,c1:ci,r2:ri,c2:ci}; }
        var nr=ri, nc=ci;
        if(e.key==='ArrowUp')    nr=Math.max(0,ri-1);
        if(e.key==='ArrowDown')  nr=Math.min(document.getElementById('tbodyInput').rows.length-1,ri+1);
        if(e.key==='ArrowLeft')  nc=Math.max(1,ci-1);
        if(e.key==='ArrowRight') nc=ci+1;
        _inSel.r2=nr; _inSel.c2=nc;
        _inApplySel();
        // Fokus ke sel tujuan
        var trs=Array.from(document.getElementById('tbodyInput').querySelectorAll('tr'));
        var nextTd = trs[nr] && trs[nr].cells[nc];
        if(nextTd&&nextTd.contentEditable==='true'){
          (function(t){ setTimeout(function(){ t.focus(); },0); })(nextTd);
        }
        e.preventDefault();
      });
    }

    // Reset state saat showPage
    function _inResetSel(){
      _inDragging=false; _inClearSel();
    }


    // Enter di form = addRow
    ['fCode','fName','fBal','fRec'].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.addEventListener('keydown', function(e){
        if(e.key === 'Enter'){ e.preventDefault(); addRow(); }
      });
    });

    window.onload = function(){ initEmptyRows(30); _inBindEvents(); }

    // Paste dari Excel langsung ke tabel
    document.addEventListener('paste', function(e){
      var active = document.activeElement;
      if(!active || !active.closest('#tbodyInput')) return;
      e.preventDefault();
      var paste    = (e.clipboardData || window.clipboardData).getData("text");
      var rows     = paste.trim().split("\n");
      var startRow = active.closest('tr') ? active.closest('tr').rowIndex - 1 : 0;
      var startCol = active.cellIndex - 1; // -1 karena kolom 0 adalah no urut
      var tbody    = document.getElementById("tbodyInput");

      rows.forEach(function(row, i){
        var cols = row.split("\t");
        if(startRow + i >= tbody.rows.length){
          addRowToTable('','','','','','');
        }
        var tr = tbody.rows[startRow + i];
        if(!tr) return;
        var pasted = 0;
        cols.forEach(function(cell, j){
          // Cari kolom editable berikutnya mulai dari startCol+j+1
          // Skip kolom #(0), spacer (tidak contenteditable), dan kolom ✕ (terakhir)
          var targetIdx = startCol + j + 1;
          // Maju sampai ketemu kolom contenteditable
          while(targetIdx < tr.cells.length - 1){
            var td = tr.cells[targetIdx];
            if(td && td.contentEditable === 'true') break;
            targetIdx++;
          }
          if(targetIdx >= tr.cells.length - 1) return;
          tr.cells[targetIdx].innerText = cell.trim();
        });
      });
      updateRowNumbers();
      // Auto-apply STD ke semua baris setelah paste
      setTimeout(_applyStdToAllRows, 100);
    });

    // Terapkan STD + DIVISI + PLANT dari cache ke semua baris + recalc JML PALLET
    function _applyStdToAllRows(){
      var tbody = document.getElementById('tbodyInput');
      if(!tbody) return;
      var isSP = (document.getElementById('gudangAktif')||{}).innerText === 'STANDAR_PALLET';
      if(isSP) return;
      var rows = Array.from(tbody.querySelectorAll('tr'));
      var needFetch = false;

      function applyToRow(tr){
        var codeTd = tr.querySelector('.td-gudang-code');
        var stdTd  = tr.querySelector('.td-gudang-std');
        var divTd  = tr.querySelector('.td-gudang-divisi');
        var pltTd  = tr.querySelector('.td-gudang-plant');
        if(!codeTd) return;
        var sku = _stripSkuZeros(codeTd.innerText.trim());
        if(!sku) return;
        if(codeTd.innerText.trim() !== sku) codeTd.innerText = sku;

        var cached = _stdLookupMap[sku];
        if(cached !== undefined){
          // Cache sudah ada — apply langsung
          var std    = typeof cached === 'object' ? cached.std    : (Number(cached)||0);
          var divisi = typeof cached === 'object' ? cached.divisi : '';
          var plant  = typeof cached === 'object' ? cached.plant  : '';
          if(stdTd && !stdTd.innerText.trim() && std > 0) stdTd.innerText = std;
          if(divTd && !divTd.innerText.trim() && divisi) divTd.innerText = divisi;
          if(pltTd && !pltTd.innerText.trim() && plant)  pltTd.innerText = plant;
        } else {
          needFetch = true;
        }
        _calcJmlPallet(tr);
      }

      rows.forEach(applyToRow);

      // Ada SKU yang belum dicache — fetch sekali lalu apply semua
      if(needFetch && true){
        google.script.run
          .withSuccessHandler(function(res){
            if(res && res.success){
              res.data.forEach(function(d){
                _stdLookupMap[d.sku] = {std: Number(d.std)||0, divisi: d.divisi||'', plant: d.plant||''};
              });
            }
            // Apply ulang semua baris setelah cache terisi
            rows.forEach(applyToRow);
          })
          .getStandarPalet();
      }
    }

    // Helper hitung JML PALLET satu baris
    // Strip leading zeros dari SKU (misal "0000410230" → "410230")
    function _stripSkuZeros(sku){
      if(!sku) return '';
      var s = String(sku).trim();
      // Strip leading zeros tapi jaga kalau semua zero (misal "000" → "0")
      return s.replace(/^0+([1-9]\d*)$/, '$1') || s;
    }

    function _rdcParseNum(s){
      // Aturan: titik = ribuan, koma = desimal (format id-ID)
      // Tapi deteksi cerdas untuk kasus desimal titik tanpa koma:
      // - Ada koma → titik pasti ribuan: "1.500,50" → 1500.50, "280,870" → 280.870 → 280.87
      // - Tidak ada koma, titik di akhir dengan 1-2 digit → desimal: "280.87" → 280.87
      // - Tidak ada koma, titik di akhir dengan 3 digit → ribuan: "14.803" → 14803
      // - Tidak ada koma, lebih dari 1 titik → semua ribuan: "14.803.000" → 14803000
      s = String(s||'').trim().replace(/\s/g,'');
      if(!s) return 0;
      var hasComma = s.indexOf(',') >= 0;
      if(hasComma){
        // Koma ada → titik = ribuan, koma = desimal
        s = s.replace(/\./g,'').replace(',','.');
      } else {
        var dots = s.split('.').length - 1;
        if(dots > 1){
          // Lebih dari 1 titik → semua ribuan
          s = s.replace(/\./g,'');
        } else if(dots === 1){
          var afterDot = s.split('.')[1];
          if(afterDot.length <= 2){
            // 1-2 digit setelah titik → desimal (misal 280.87)
            // tidak perlu ubah, parseFloat langsung handle
          } else {
            // 3 digit setelah titik → ribuan (misal 14.803)
            s = s.replace(/\./g,'');
          }
        }
      }
      return parseFloat(s)||0;
    }

    function _calcJmlPallet(tr){
      var stdTd=tr.querySelector('.td-gudang-std');
      var bbTd =tr.querySelector('.td-gudang-bb');
      var jmlTd=tr.querySelector('.td-gudang-jml');
      if(!stdTd||!bbTd||!jmlTd) return;
      var std=_rdcParseNum(stdTd.innerText);
      var bb =_rdcParseNum(bbTd.innerText);
      jmlTd.innerText=(std>0&&bb>=0)?Math.ceil(bb/std):'';
    }

    // =============================================
    // REALISASI
    // =============================================
    var realSummaryView = 'tabel';
    var realSummaryData = [];
