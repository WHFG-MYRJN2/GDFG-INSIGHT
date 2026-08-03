// ============================================================
// CHART ZOOM
// ============================================================
var _chartZoomLevel = 100; // percent

function _chartZoom(delta) {
  _chartZoomLevel = Math.min(200, Math.max(50, _chartZoomLevel + delta));
  // Update semua elemen chartZoomVal (ada 2: atas dan bawah toggle)
  document.querySelectorAll('#chartZoomVal').forEach(function(el) {
    el.textContent = _chartZoomLevel + '%';
  });
  _applyChartZoom();
}

function _applyChartZoom() {
  var scale = _chartZoomLevel / 100;
  // Scale canvas wrap height
  var baseH   = window.innerWidth <= 520 ? 300 : window.innerWidth <= 768 ? 220 : 340;
  var newH    = Math.round(baseH * scale);
  document.querySelectorAll('.chart-canvas-wrap.horizontal').forEach(function(el) {
    el.style.height = newH + 'px';
  });
  var baseV   = window.innerWidth <= 520 ? 140 : window.innerWidth <= 768 ? 160 : 220;
  var newHV   = Math.round(baseV * scale);
  document.querySelectorAll('.chart-canvas-wrap:not(.horizontal)').forEach(function(el) {
    el.style.height = newHV + 'px';
  });
  // Re-render chart
  if      (currentView === 'horizontal') renderChartsHorizontal();
  else if (currentView === 'chart')      renderCharts();
  // Update zoom font size
  var fScale = Math.max(0.7, Math.min(1.4, scale));
  document.querySelectorAll('.chart-card').forEach(function(el) {
    el.style.fontSize = (fScale * 100) + '%';
  });
}

    function renderPieChart(){
      if(!divisiChartData) return;

      // === PIE 1: Lokal (Wafer+Biskuit) vs Ekspor ===
      var wafer   = divisiChartData.wafer   || 0;
      var biskuit = divisiChartData.biskuit  || 0;
      var ekspor  = divisiChartData.ekspor   || 0;
      var total1  = wafer + biskuit + ekspor || 1;
      var colors1 = ['#f6ad55','#4299e1','#68d391'];
      var labels1 = ['Wafer Lokal','Biskuit Lokal','Ekspor'];
      var values1 = [wafer, biskuit, ekspor];

      if(divisiPieInstance){ divisiPieInstance.destroy(); divisiPieInstance = null; }
      divisiPieInstance = new Chart(document.getElementById('divisiPieChart').getContext('2d'), {
        type:'doughnut',
        data:{ labels:labels1, datasets:[{ data:values1, backgroundColor:colors1, borderWidth:3, borderColor:'#fff', hoverOffset:10 }] },
        options:{
          responsive:true, maintainAspectRatio:false, cutout:'62%',
          plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label:function(c){ var p=((c.parsed/total1)*100).toFixed(1); return ' '+c.parsed.toLocaleString('id-ID')+' pallet ('+p+'%)'; } } } }
        }
      });
      document.getElementById('pieLegend').innerHTML = labels1.map(function(l,i){
        var pct=((values1[i]/total1)*100).toFixed(1);
        return '<div class="pie-legend-item"><div class="pie-legend-dot" style="background:'+colors1[i]+'"></div><div><div class="pie-legend-label">'+l+'</div><div class="pie-legend-val">'+values1[i].toLocaleString('id-ID')+' pallet &bull; '+pct+'%</div></div></div>';
      }).join('');

      // === PIE 2: Divisi khusus Ekspor ===
      var eksporDivisi = divisiChartData.eksporDivisi || {};
      var labels2 = Object.keys(eksporDivisi);
      var values2 = labels2.map(function(k){ return eksporDivisi[k]; });
      var total2  = values2.reduce(function(a,b){ return a+b; }, 0) || 1;
      var palette = ['#f6ad55','#4299e1','#68d391','#fc8181','#b794f4','#76e4f7','#faf089'];
      var colors2 = labels2.map(function(_,i){ return palette[i % palette.length]; });

      if(eksporDivisiPieInstance){ eksporDivisiPieInstance.destroy(); eksporDivisiPieInstance = null; }
      eksporDivisiPieInstance = new Chart(document.getElementById('eksporDivisiPieChart').getContext('2d'), {
        type:'doughnut',
        data:{ labels:labels2, datasets:[{ data:values2, backgroundColor:colors2, borderWidth:3, borderColor:'#fff', hoverOffset:10 }] },
        options:{
          responsive:true, maintainAspectRatio:false, cutout:'62%',
          plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label:function(c){ var p=((c.parsed/total2)*100).toFixed(1); return ' '+c.parsed.toLocaleString('id-ID')+' pallet ('+p+'%)'; } } } }
        }
      });
      document.getElementById('pieLegendEkspor').innerHTML = labels2.length
        ? labels2.map(function(l,i){
            var pct=((values2[i]/total2)*100).toFixed(1);
            return '<div class="pie-legend-item"><div class="pie-legend-dot" style="background:'+colors2[i]+'"></div><div><div class="pie-legend-label">'+l+'</div><div class="pie-legend-val">'+values2[i].toLocaleString('id-ID')+' pallet &bull; '+pct+'%</div></div></div>';
          }).join('')
        : '<div style="color:#a0aec0;font-size:12px;">Tidak ada data</div>';
    }

    // =============================================
    // BUILD CHART CONFIG
    // =============================================
    function buildChartConfig(labels, values){
      var total    = values.length;
      var bgColors = values.map(function(_,i){
        var t = i / (total - 1 || 1);
        return 'rgb('+Math.round(15+t*29)+','+Math.round(32+t*51)+','+Math.round(39+t*61)+')';
      });
      return {
        type: 'bar',
        data:{
          labels: labels,
          datasets:[{
            data: values, backgroundColor: bgColors,
            borderRadius: 6, borderSkipped: false,
            barPercentage: .65, categoryPercentage: .75
          }]
        },
        plugins: [ChartDataLabels],
        options:{
          responsive: true, maintainAspectRatio: false,
          layout:{ padding:{ top:4, right:50, left:4, bottom:4 } },
          plugins:{
            legend:{ display:false },
            datalabels:{
              anchor:'end', align:'top', color:'#2d3748',
              font:{ size:10, weight:'700' },
              formatter: function(v){ return v.toLocaleString('id-ID'); }
            }
          },
          scales:{
            x:{ grid:{ display:false }, border:{ display:false }, ticks:{ color:'#718096', font:{ size:10, weight:'600' }, maxRotation:30 } },
            y:{ display:false }
          },
          animation:{ duration:700, easing:'easeOutQuart', delay: function(ctx){ return ctx.dataIndex * 110; } },
          animations:{ y:{ from: function(ctx){ return ctx.chart.scales.y.getPixelForValue(0); } } }
        }
      };
    }

    // =============================================
    // RENDER CHARTS
    // =============================================
    function renderCharts(){
      if(lokalChartData){
        if(lokalChartInstance) lokalChartInstance.destroy();
        lokalChartInstance = new Chart(
          document.getElementById('lokalChart').getContext('2d'),
          buildChartConfig(lokalChartData.labels, lokalChartData.values)
        );
      }
      if(eksporChartData){
        if(eksporChartInstance) eksporChartInstance.destroy();
        eksporChartInstance = new Chart(
          document.getElementById('eksporChart').getContext('2d'),
          buildChartConfig(eksporChartData.labels, eksporChartData.values)
        );
      }
    }

    // =============================================
    // BUILD CHART CONFIG HORIZONTAL
    // =============================================
    function buildChartConfigHorizontal(labels, values, skus){
      var rankColors = ['#e53e3e','#e8572a','#ed6b1a','#f0820f','#d4a017','#b8b820','#8fc42a','#68c832','#45cc3a','#2db82d'];
      var bgColors = values.map(function(_,i){ return rankColors[i] || '#2db82d'; });
      // label dipotong maks 30 karakter untuk sidebar
      var shortLabels = labels.map(function(l){
        return l.length > 28 ? l.substring(0,26)+'…' : l;
      });
      return {
        type: 'bar',
        data:{
          labels: shortLabels,
          datasets:[{
            data: values, backgroundColor: bgColors,
            borderRadius: 6, borderSkipped: false,
            barPercentage: .7, categoryPercentage: .8
          }]
        },
        plugins: [ChartDataLabels],
        options:{
          indexAxis: 'y',
          responsive: true, maintainAspectRatio: false,
          layout:{ padding:{ top:4, right:50, left:4, bottom:4 } },
          plugins:{
            legend:{ display:false },
            datalabels:{
              anchor:'end', align:'right', color:'#2d3748',
              font:{ size:10, weight:'700' },
              formatter: function(v){ return v.toLocaleString('id-ID'); }
            },
            tooltip:{
              callbacks:{
                title: function(items){
                  return skus[items[0].dataIndex];
                }
              }
            }
          },
          scales:{
            x:{ display:false, grid:{ display:false } },
            y:{
              grid:{ display:false }, border:{ display:false },
              ticks:{ color:'#2d3748', font:{ size:10, weight:'600' }, padding:4 }
            }
          },
          animation:{ duration:700, easing:'easeOutQuart', delay: function(ctx){ return ctx.dataIndex * 80; } },
          animations:{ x:{ from: function(ctx){ return ctx.chart.scales.x.getPixelForValue(0); } } }
        }
      };
    }

    // =============================================
    // RENDER CHARTS HORIZONTAL
    // =============================================
    function renderChartsHorizontal(){
      if(lokalChartData){
        if(lokalChartHInstance) lokalChartHInstance.destroy();
        lokalChartHInstance = new Chart(
          document.getElementById('lokalChartH').getContext('2d'),
          buildChartConfigHorizontal(lokalChartData.labels, lokalChartData.values, lokalChartData.skus)
        );
      }
      if(eksporChartData){
        if(eksporChartHInstance) eksporChartHInstance.destroy();
        eksporChartHInstance = new Chart(
          document.getElementById('eksporChartH').getContext('2d'),
          buildChartConfigHorizontal(eksporChartData.labels, eksporChartData.values, eksporChartData.skus)
        );
      }
    }

    // =============================================
    // RENDER TABEL VIEW
    // =============================================
    function renderTableView(){
      renderTableRows('tableLokalRows',  lokalChartData);
      renderTableRows('tableEksporRows', eksporChartData);
    }

    function renderTableRows(id, chartData){
      if(!chartData) return;
      var html = '';
      chartData.labels.forEach(function(label, i){
        var val = chartData.values[i];
        var krt = (chartData.kartons && chartData.kartons[i]) ? chartData.kartons[i] : 0;
        var sku = (chartData.skus && chartData.skus[i]) ? chartData.skus[i] : '-';
        var rc  = 'r' + (i + 1);
        var valHtml = '<span style="font-weight:800;">' + val.toLocaleString('id-ID') + ' P</span>';
        if(krt > 0) valHtml += '<span style="font-size:11px;color:#718096;margin-left:5px;">/ ' + krt.toLocaleString('id-ID') + ' ©</span>';
        html += '<div class="stbl-row">'
          + '<div class="stbl-rank '+rc+'">'+(i+1)+'</div>'
          + '<div class="stbl-sku">'+sku+'</div>'
          + '<div class="stbl-name">'+label+'</div>'
          + '<div class="stbl-val">'+valHtml+'</div>'
          + '</div>';
      });
      document.getElementById(id).innerHTML = html;
    }

    // =============================================
    // LOAD SECTION TABLE (LOKAL / EKSPOR / GDFG)
    // =============================================
    var _skuMapReady = false;

    function _preloadSkuNames(){
      // Jika loadSection sudah mengisi map (dari dashboard), langsung pakai
      if(_skuMapReady || Object.keys(_opnameNamaMap).length > 0){
        _skuMapReady = true;
        return;
      }
      // Belum ada data — load 3 section sekaligus
      var pending = 3;
      ['lokal','ekspor','gdfg'].forEach(function(sec){
        API.run('getData', {section: sec}, function(res){
            if(res&&res.success&&res.headers&&res.data){
              var h0=res.headers[0], h1=res.headers[1], h2=res.headers[2];
              res.data.forEach(function(r){
                var sku=String(r[h0]||'').trim(), nama=String(r[h1]||'').trim(), sap=Number(r[h2])||0;
                if(sku&&nama){
                  _skuNamaMap[sku]=nama; _opnameNamaMap[sku]=nama;
                  if(!_skuDataMap[sku]) _skuDataMap[sku]={nama:nama, sap:sap};
                }
              });
            }
            if(--pending===0) _skuMapReady=true;
          });
      });
    }

    function loadSection(section){
      document.getElementById(section+"Content").innerHTML = "<div class='spinner'></div>";
      API.run('getData', {section: section}, function(res){
        if(res.success && res.data.length > 0){
          var jumlahKosong = res.data.filter(function(r){ return r.__stdKosong; }).length;
          var html = "";

          // Info banner jika ada STD kosong
          if(jumlahKosong > 0){
            html += "<div class='std-kosong-info'>"
              + "<i class='fas fa-exclamation-triangle'></i>"
              + jumlahKosong + " baris belum memiliki standar pallet. Silakan update melalui menu <strong>Input Data &rarr; Standar Pallet</strong>."
              + "</div>";
          }

          // Kolom mana yg editable: Material Code(0), Nama(1), STD(2), Divisi(3)
          // Header index: headers[0]=SKU/Mat.Code, [1]=Nama, [2]=QTY, [3]=STD, [4]=JmlPallet, [5]=Divisi, [6]=TOTAL
          var H = res.headers;
          html += "<table class='g-table'><thead><tr><th style=\'width:32px;\'></th>";
          H.forEach(function(h){ html += "<th>"+(h||"")+"</th>"; });
          html += "</tr></thead><tbody>";

          res.data.forEach(function(r, ri){
            var kosong = r.__stdKosong;
            // Encode row for dataset
            var rowEnc = encodeURIComponent(JSON.stringify(r));
            var hEnc   = encodeURIComponent(JSON.stringify(H));
            html += "<tr class='"+(kosong?"tr-std-kosong":"")+"' data-stdrow=\'"+rowEnc+"\' data-stdhdr=\'"+hEnc+"\'>";
            html += "<td class='td-std-edit-btn'><button class='std-edit-btn' onclick='_stdEdit(this)' title='Edit'><i class='fas fa-pencil-alt'></i></button></td>";
            H.forEach(function(h, hi){
              var val = r[h] !== undefined ? r[h] : "";
              // editable cols: index 0(SKU), 1(Nama), 3(STD), 5(Divisi) — based on typical getData headers
              // Attach data-stdcol for editable detection
              var isEditCol = (hi===0||hi===1||hi===3||hi===5);
              var editAttr  = isEditCol ? " data-stdcol=\'"+hi+"\' data-stdkey=\'"+h+"\'" : "";
              if(h === H[0] && kosong){
                html += "<td"+editAttr+">"+val+"<span class='std-kosong-badge'><i class='fas fa-exclamation'></i> Update standar pallet</span></td>";
              } else {
                html += "<td"+editAttr+">"+val+"</td>";
              }
            });
            html += "</tr>";
          });

          html += "</tbody></table>";
          document.getElementById(section+"Content").innerHTML = html;
          var badge = document.getElementById(section+"RowCount");
          if(badge) badge.innerText = res.data.length;
          // Simpan SKU→{nama,sap} ke lookup map untuk opname
          if(res.headers && res.headers.length >= 2){
            var hSku=res.headers[0], hNama=res.headers[1];
            var hSap=res.headers[2]; // QTY (kolom ke-3)
            res.data.forEach(function(r){
              var sku=String(r[hSku]||'').trim(), nama=String(r[hNama]||'').trim();
              var sap=hSap?Number(r[hSap])||0:0;
              if(sku&&nama){
                _skuNamaMap[sku]=nama;
                _opnameNamaMap[sku]=nama;
                // Simpan SAP per section: lokal, ekspor, gdfg terpisah
                if(!_skuDataMap[sku]) _skuDataMap[sku]={nama:nama, sap:sap, lokal:0, ekspor:0, gdfg:0};
                _skuDataMap[sku][section]=sap; // simpan per section
                _skuDataMap[sku].nama=nama;
              }
            });
            _skuMapReady = true;
          }
        } else {
          document.getElementById(section+"Content").innerText = res.message || "Tidak ada data.";
        }
      }).getData(section);
    }

    // =============================================
    // SUMMARY CARDS
    // =============================================
    function updateTotalPallet(){
      API.withSuccessHandler(function(res){
        if(res.success){
          var pct = ((res.total / 7096) * 100).toFixed(2);
          document.getElementById("totalPalletValue").innerText = res.total.toLocaleString('id-ID');
          document.getElementById("percentageValue").innerText  = pct + "%";
          document.getElementById("percentageNote").innerText   = pct > 100 ? "⚠️ OVERLOAD!" : "Kapasitas 7.096 pallet";
        } else {
          document.getElementById("totalPalletValue").innerText = "Error";
          document.getElementById("percentageValue").innerText  = "Error";
        }
      }).getTotalPallet();
    }

    function updatePersentaseLokal(){
      API.withSuccessHandler(function(res){
        if(res.success){
          var total = res.data.reduce(function(s,i){ return s+(Number(i.jmlPallet)||0); }, 0);
          var pct   = ((total / 5800) * 100).toFixed(2);
          document.getElementById("percentageLokal").innerText = pct + "%";
          document.getElementById("noteLokal").innerText       = total.toLocaleString('id-ID') + " pallet dari 5.800";
        }
      }).getSummaryLokal();
    }

    function updatePersentaseEkspor(){
      API.withSuccessHandler(function(res){
        if(res.success){
          var total = res.data.reduce(function(s,i){ return s+(Number(i.jmlPallet)||0); }, 0);
          var pct   = ((total / 1296) * 100).toFixed(2);
          document.getElementById("percentageEkspor").innerText = pct + "%";
          document.getElementById("noteEkspor").innerText       = total.toLocaleString('id-ID') + " pallet dari 1.296";
        }
      }).getSummaryEkspor();
    }


    function updateStock(){
      _patternOpen(function(){
        window.open("https://docs.google.com/spreadsheets/d/1JZag93NSI8paVZHzxPYp6rAFlUDbOzXFrXM_lBKgPZg/edit?usp=sharing","_blank");
      });
    }

    // Auto refresh setiap 3 menit
    // ── Load daftar tanggal dari HISTORY KAPASITAS ──
    function loadTanggalHistory(){
      API.run('getHistoryKapasitas', {from:'', to:'', tipes:[]}, function(res){
          var sel = document.getElementById('kapasitasTanggalSelect');
          if(!sel) return;
          var cur = sel.value;
          while(sel.options.length > 1) sel.remove(1);
          if(res && res.success && res.tanggals){
            res.tanggals.forEach(function(tgl){
              var opt = document.createElement('option');
              opt.value = tgl;
              var parts = tgl.split('-');
              opt.textContent = parts.length===3 ? parts[2]+'-'+parts[1]+'-'+parts[0] : tgl;
              sel.appendChild(opt);
            });
          }
          if(cur) sel.value = cur;
        });
    }

    // ── Load kapasitas by tanggal terpilih ──
    function loadKapasitasByTanggal(){
      var sel = document.getElementById('kapasitasTanggalSelect');
      var tgl = sel ? sel.value : '';
      if(!tgl){
        // Terkini = load ulang via fungsi utama
        if(typeof loadTanggalHistoryThenHariIni === 'function'){
          loadTanggalHistoryThenHariIni();
        }
        return;
      }
      // Update Last Update label
      var luEl = document.getElementById('lastUpdateValue');
      if(luEl && tgl){
        var p = tgl.split('-');
        luEl.innerText = p.length===3 ? p[2]+'/'+p[1]+'/'+p[0] : tgl;
      }
      _loadKapasitasByTgl(tgl);
      showToast('\u23F3 Memuat data '+tgl+'...','');
    }

    // ── Render tab section dari data history ──

    // =============================================
    // LOAD KAPASITAS DARI HISTORY (pengganti REKAP STOCK)
    // =============================================
    function _getTodayStr(){
      var t=new Date();
      return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
    }

    function loadKapasitasHariIni(){
      var today = _getTodayStr();
      // Cek apakah hari ini ada data — kalau tidak, pakai tanggal terakhir
      API.run('getHistoryKapasitas', {from:'', to:'', tipes:[]}, function(res){
          var tanggals = (res && res.success && res.tanggals) ? res.tanggals : [];
          var tglToLoad = today;
          if(tanggals.length && tanggals.indexOf(today) < 0){
            tglToLoad = tanggals[0];
          }
          var luEl = document.getElementById('lastUpdateValue');
          if(luEl && tglToLoad){
            var p = tglToLoad.split('-');
            luEl.innerText = p.length===3 ? p[2]+'/'+p[1]+'/'+p[0] : tglToLoad;
          }
          var sel = document.getElementById('kapasitasTanggalSelect');
          if(sel && tglToLoad !== today){
            var found = false;
            for(var i=0;i<sel.options.length;i++){ if(sel.options[i].value===tglToLoad){ found=true; sel.value=tglToLoad; break; } }
            if(!found){ sel.value=''; }
          } else if(sel){
            sel.value = '';
          }
          _loadKapasitasByTgl(tglToLoad);
        });
    }

    function _loadKapasitasByTgl(tgl){
      // Tampilkan spinner di semua section
      ['lokalContent','eksporContent','gdfgContent'].forEach(function(id){
        var el=document.getElementById(id);
        if(el) el.innerHTML="<div class='spinner' style='margin:20px auto;'></div>";
      });

      API.run('getHistoryKapasitas', {from: tgl, to: tgl, tipes: []}, function(res){
          if(!res||!res.success){
            ['lokalContent','eksporContent','gdfgContent'].forEach(function(id){
              var el=document.getElementById(id);
              if(el) el.innerHTML='<div style="text-align:center;padding:30px;color:#a0aec0;">Tidak ada data untuk tanggal ini.<br>Silakan input data terlebih dahulu.</div>';
            });
            ['totalPalletValue','percentageLokal','percentageEkspor','percentageValue'].forEach(function(id){
              var el=document.getElementById(id); if(el) el.innerText='-';
            });
            return;
          }

          var data = res.data || [];

          // Pisah per tipe
          var gdi2 = data.filter(function(r){ return r.tipe==='GDI2'; });
          var gdin = data.filter(function(r){ return r.tipe==='GDIN'; });
          var eksp = data.filter(function(r){ return r.tipe==='EKSPOR'; });
          var gdfg = data.filter(function(r){ return r.tipe==='GDFG'; });

          // Reset _skuDataMap dari history kapasitas (BB = karton)
          // Ini menggantikan getSummaryLokal/Ekspor yang lama baca REKAP STOCK
          data.forEach(function(r){
            if(!r.sku) return;
            var tipe = r.tipe;
            var section = (tipe==='GDI2'||tipe==='GDIN') ? 'lokal' : tipe==='EKSPOR' ? 'ekspor' : 'gdfg';
            if(!_skuDataMap[r.sku]) _skuDataMap[r.sku] = {nama:r.nama, sap:0, lokal:0, ekspor:0, gdfg:0};
            _skuDataMap[r.sku].nama = r.nama;
            _skuDataMap[r.sku][section] = (_skuDataMap[r.sku][section]||0) + (r.bb||0);
            // sap = BB lokal (untuk autofill opname, sama dengan sebelumnya dari REKAP STOCK)
            if(section==='lokal') _skuDataMap[r.sku].sap = (_skuDataMap[r.sku].sap||0) + (r.bb||0);
            else if(!_skuDataMap[r.sku].sap) _skuDataMap[r.sku].sap = r.bb||0;
          });

          // Lokal = GDI2+GDIN, gabung & sum by SKU
          var lokalMap = {};
          gdi2.concat(gdin).forEach(function(r){
            if(!lokalMap[r.sku]) lokalMap[r.sku]={nama:r.nama,bb:0,std:r.std,jml:0,divisi:r.divisi||'',plant:r.plant||''};
            lokalMap[r.sku].bb  += r.bb;
            lokalMap[r.sku].jml += (r.std > 0 ? Math.ceil(r.bb / r.std) : r.jmlPallet);
            // Update SKU lookup maps
            if(r.sku){ _skuNamaMap[r.sku]=r.nama; _opnameNamaMap[r.sku]=r.nama; }
          });
          var lokalArr = Object.keys(lokalMap).map(function(sku){
            return {sku:sku, nama:lokalMap[sku].nama, bb:lokalMap[sku].bb, jml:lokalMap[sku].jml, std:lokalMap[sku].std, divisi:lokalMap[sku].divisi||'', plant:lokalMap[sku].plant||''};
          }).sort(function(a,b){ return b.jml-a.jml; });

          var eksporArr = eksp.map(function(r){ return {sku:r.sku,nama:r.nama,bb:r.bb,jml:(r.std>0?Math.ceil(r.bb/r.std):r.jmlPallet),std:r.std,divisi:r.divisi||'',plant:r.plant||''}; })
                             .sort(function(a,b){ return b.jml-a.jml; });
          var gdfgArr  = gdfg.map(function(r){ return {sku:r.sku,nama:r.nama,bb:r.bb,jml:(r.std>0?Math.ceil(r.bb/r.std):r.jmlPallet),std:r.std,divisi:r.divisi||'',plant:r.plant||''}; })
                             .sort(function(a,b){ return b.jml-a.jml; });

          // ── Summary cards ──
          var CAP_ALL=7096, CAP_LK=5800, CAP_EK=1296;
          var totLK  = lokalArr.reduce(function(s,r){ return s+r.jml; },0);
          var totEK  = eksporArr.reduce(function(s,r){ return s+r.jml; },0);
          var totGDFG= gdfgArr.reduce(function(s,r){ return s+r.jml; },0);
          var totAll = totLK+totEK+totGDFG;

          document.getElementById('totalPalletValue').innerText = totAll.toLocaleString('id-ID');
          document.getElementById('percentageValue').innerText  = ((totAll/CAP_ALL)*100).toFixed(2)+'%';
          document.getElementById('percentageLokal').innerText  = ((totLK/CAP_LK)*100).toFixed(2)+'%';
          document.getElementById('percentageEkspor').innerText = ((totEK/CAP_EK)*100).toFixed(2)+'%';
          document.getElementById('noteLokal').innerText  = totLK.toLocaleString('id-ID')+' pallet dari 5.800';
          document.getElementById('noteEkspor').innerText = totEK.toLocaleString('id-ID')+' pallet dari 1.296';
          var noteAll = document.getElementById('percentageNote');
          if(noteAll) noteAll.innerText = totAll>CAP_ALL ? '⚠️ OVERLOAD!' : 'Kapasitas 7.096 pallet';

          // ── Chart data (Top 10) ──
          lokalChartData = {
            labels : lokalArr.slice(0,10).map(function(r){ return r.nama; }),
            skus   : lokalArr.slice(0,10).map(function(r){ return r.sku;  }),
            values : lokalArr.slice(0,10).map(function(r){ return r.jml;  }),
            kartons: lokalArr.slice(0,10).map(function(r){ return r.bb;   })
          };
          eksporChartData = {
            labels : eksporArr.slice(0,10).map(function(r){ return r.nama; }),
            skus   : eksporArr.slice(0,10).map(function(r){ return r.sku;  }),
            values : eksporArr.slice(0,10).map(function(r){ return r.jml;  }),
            kartons: eksporArr.slice(0,10).map(function(r){ return r.bb;   })
          };

          // Render chart/tabel jika tab summary aktif
          // Selalu build divisi dari history (agar siap saat user switch ke pie)
          _buildDivisiFromHistory(lokalArr, eksporArr);
          // Pastikan hanya view aktif yang visible, sisanya none
          var _views = {
            'chart':      'viewChart',
            'horizontal': 'viewHorizontal',
            'pie':        'viewPie',
            'trend':      'viewTrend'
          };
          if(!currentView) currentView = 'horizontal';
          Object.keys(_views).forEach(function(v) {
            var el = document.getElementById(_views[v]);
            if(!el) return;
            var isActive = (v === currentView);
            el.style.display = isActive ? (v==='pie'?'flex':'grid') : 'none';
          });

          if(document.getElementById('summary').classList.contains('active')){
            // Pastikan view yang aktif sudah display:grid sebelum render
            // (kalau tidak, canvas ukuran 0 dan Chart.js tidak bisa render)
            if(currentView==='chart'){
              var vc=document.getElementById('viewChart');
              if(vc && vc.style.display==='none') vc.style.display='grid';
            } else if(currentView==='horizontal'){
              var vh=document.getElementById('viewHorizontal');
              if(vh && vh.style.display==='none') vh.style.display='grid';
            }
            // Double rAF supaya browser layout canvas dulu
            requestAnimationFrame(function(){
              requestAnimationFrame(function(){
                if(currentView==='chart') renderCharts();
                else if(currentView==='horizontal') renderChartsHorizontal();
                else if(currentView==='pie') renderPieChart();
                else renderTableView();
              });
            });
          }

          // ── Render tab Lokal / Ekspor / GDFG ──
          _renderHistorySection('lokalContent',  lokalArr,  'lokalRowCount',  'GDI2+GDIN');
          _renderHistorySection('eksporContent', eksporArr, 'eksporRowCount', 'EKSPOR');
          _renderHistorySection('gdfgContent',   gdfgArr,   'gdfgRowCount',   'GDFG');
        })
        // error sudah handled di API.run
    }

    // Render section dari array history
    function _renderHistorySection(containerId, arr, badgeId, tipeLabel){
      var el=document.getElementById(containerId);
      var badge=document.getElementById(badgeId);
      if(!el) return;
      if(!arr.length){
        el.innerHTML='<div style="text-align:center;padding:30px;color:#a0aec0;font-size:13px;"><i class="fas fa-inbox" style="font-size:24px;display:block;margin-bottom:8px;opacity:.3;"></i>Tidak ada data '+tipeLabel+'</div>';
        if(badge) badge.innerHTML='0 SKU';
        return;
      }
      // Hitung total
      var totKrt  = arr.reduce(function(s,r){ return s+(r.bb||0); }, 0);
      var totPlt  = arr.reduce(function(s,r){ return s+(r.jml||0); }, 0);
      var totSku  = arr.length;
      if(badge){
        badge.innerHTML=
          '<span style="background:#ebf8ff;color:#2b6cb0;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;margin-right:4px;">'+totKrt.toLocaleString('id-ID')+' Krt</span>'+
          '<span style="background:#f0fdf4;color:#166534;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;margin-right:4px;">'+totPlt.toLocaleString('id-ID')+' Plt</span>'+
          '<span style="background:#f3f4f6;color:#374151;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;">'+totSku+' SKU</span>';
      }
      var html='<table class="g-table"><thead><tr>'
        +'<th style="width:32px;">#</th>'
        +'<th>Material Code</th>'
        +'<th>Nama Barang</th>'
        +'<th style="text-align:center;">Divisi</th>'
        +'<th style="text-align:center;">Plant</th>'
        +'<th style="text-align:right;">QTY</th>'
        +'<th style="text-align:right;background:#fffbeb;color:#92400e;">STD Pallet</th>'
        +'<th style="text-align:right;background:#f0fdf4;color:#166534;font-weight:700;">Jml Pallet</th>'
        +'</tr></thead><tbody>';
      arr.forEach(function(r,i){
        var divisi=String(r.divisi||'').trim();
        var plant=String(r.plant||'').trim();
        var divColor=divisi.toUpperCase()==='WAFER'?'#2b6cb0':divisi.toUpperCase()==='BISKUIT'?'#276749':'#718096';
        var divBg  =divisi.toUpperCase()==='WAFER'?'#ebf8ff':divisi.toUpperCase()==='BISKUIT'?'#f0fff4':'#f3f4f6';
        html+='<tr>'
          +'<td style="color:#a0aec0;text-align:center;">'+(i+1)+'</td>'
          +'<td style="font-weight:700;color:#2b6cb0;font-size:11px;">'+r.sku+'</td>'
          +'<td>'+r.nama+'</td>'
          +'<td style="text-align:center;">'
            +(divisi?'<span style="background:'+divBg+';color:'+divColor+';font-size:10px;font-weight:700;border-radius:10px;padding:1px 8px;">'+divisi+'</span>':'<span style="color:#cbd5e0;">—</span>')
          +'</td>'
          +'<td style="text-align:center;">'
            +(plant?'<span style="background:#faf5ff;color:#6b46c1;font-size:10px;font-weight:700;border-radius:10px;padding:1px 8px;">'+plant+'</span>':'<span style="color:#cbd5e0;">—</span>')
          +'</td>'
          +'<td style="text-align:right;font-variant-numeric:tabular-nums;">'+(r.bb||0).toLocaleString('id-ID')+'</td>'
          +'<td style="text-align:right;background:#fffbeb;color:#92400e;">'+(r.std||0).toLocaleString('id-ID')+'</td>'
          +'<td style="text-align:right;font-weight:700;background:#f0fdf4;color:#166534;">'+(r.jml||0).toLocaleString('id-ID')+'</td>'
          +'</tr>';
      });
      html+='</tbody></table>';
      el.innerHTML=html;
    }

    // Build divisi data dari history untuk pie chart
    function _buildDivisiFromHistory(lokalArr, eksporArr){
      var wafer=0, biskuit=0, eksporTotal=0;
      var eksporDivisi={};
      lokalArr.forEach(function(r){
        if((r.divisi||'').toUpperCase()==='WAFER') wafer+=r.jml;
        else biskuit+=r.jml;
      });
      eksporArr.forEach(function(r){
        eksporTotal+=r.jml;
        var div=(r.divisi||'LAINNYA').toUpperCase()||'LAINNYA';
        eksporDivisi[div]=(eksporDivisi[div]||0)+r.jml;
      });
      divisiChartData={success:true, wafer:wafer, biskuit:biskuit, ekspor:eksporTotal, eksporDivisi:eksporDivisi};
      renderPieChart();
    }

        // =============================================
    // TREND CHART
    // =============================================
    var _trendMetrik  = 'total';  // total | lokal | ekspor
    var _trendSatuan  = 'pallet'; // pallet | persen
    var _trendInstance = null;
    var CAP_TOTAL = 7096, CAP_LOKAL = 5800, CAP_EKSPOR = 1296;

    function setTrendMetrik(m){
      _trendMetrik = m;
      ['total','lokal','ekspor'].forEach(function(k){
        var el = document.getElementById('trendMetrik'+k.charAt(0).toUpperCase()+k.slice(1));
        if(el) el.classList.toggle('active', k===m);
      });
      if(_trendInstance) loadTrendChart();
    }

    function setTrendSatuan(s){
      _trendSatuan = s;
      document.getElementById('trendSatuanPallet').classList.toggle('active', s==='pallet');
      document.getElementById('trendSatuanPersen').classList.toggle('active', s==='persen');
      if(_trendInstance) loadTrendChart();
    }

    function initTrendView(){
      // Default from: 08/04/2026, to: hari ini — masih bisa diubah user
      function fmtD(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
      var fromEl = document.getElementById('trendFrom');
      var toEl   = document.getElementById('trendTo');
      if(fromEl && !fromEl.value) fromEl.value = '2026-04-08';
      if(toEl   && !toEl.value)   toEl.value   = fmtD(new Date());
      // Auto load chart tanpa perlu klik Tampilkan
      loadTrendChart();
    }

    function loadTrendChart(){
      var from = (document.getElementById('trendFrom')||{}).value || '';
      var to   = (document.getElementById('trendTo')  ||{}).value || '';
      if(!from||!to){ showToast('⚠️ Pilih rentang tanggal',''); return; }

      document.getElementById('trendEmpty').style.display  = 'none';
      document.getElementById('trendLineChart').style.display = 'none';
      // Tampilkan loading
      document.getElementById('trendChartWrap').insertAdjacentHTML('beforeend',
        '<div id="trendLoading" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#a0aec0;font-size:13px;"><i class="fas fa-spinner fa-spin"></i> Memuat...</div>');

      API.run('getHistoryKapasitas', {from: from, to: to, tipes: []}, function(res){
          var loader = document.getElementById('trendLoading');
          if(loader) loader.remove();
          if(!res||!res.success||!res.data||!res.data.length){
            document.getElementById('trendEmpty').style.display='flex';
            document.getElementById('trendEmpty').querySelector('span').textContent='Tidak ada data pada rentang tanggal ini';
            return;
          }
          _renderTrendChart(res.data, from, to);
        });
    }

    function _renderTrendChart(data, from, to){
      // Group by tanggal, hitung total/lokal/ekspor per hari
      var dayMap = {};
      data.forEach(function(r){
        var tgl = r.tanggal;
        if(!dayMap[tgl]) dayMap[tgl] = {lokal:0, ekspor:0, gdfg:0};
        var jml = r.std>0 ? Math.ceil(r.bb/r.std) : r.jmlPallet;
        if(r.tipe==='GDI2'||r.tipe==='GDIN') dayMap[tgl].lokal  += jml;
        else if(r.tipe==='EKSPOR')            dayMap[tgl].ekspor += jml;
        else if(r.tipe==='GDFG')              dayMap[tgl].gdfg   += jml;
      });

      // Sort tanggal
      var dates = Object.keys(dayMap).sort();
      var labels = dates.map(function(d){
        var p=d.split('-'); return p.length===3?p[2]+'/'+p[1]:d;
      });

      // Hitung nilai sesuai metrik & satuan
      function getVal(d){
        var row = dayMap[d];
        var total = row.lokal + row.ekspor + row.gdfg;
        var val, cap;
        if(_trendMetrik==='lokal')       { val=row.lokal;  cap=CAP_LOKAL;  }
        else if(_trendMetrik==='ekspor') { val=row.ekspor; cap=CAP_EKSPOR; }
        else                             { val=total;      cap=CAP_TOTAL;  }
        if(_trendSatuan==='persen') return Math.round((val/cap)*10000)/100;
        return val;
      }

      var values = dates.map(getVal);
      var isPct  = _trendSatuan==='persen';
      var cap    = _trendMetrik==='lokal'?CAP_LOKAL:_trendMetrik==='ekspor'?CAP_EKSPOR:CAP_TOTAL;
      var capLine= isPct?100:(cap);

      // Label judul
      var metrikLabel = _trendMetrik==='lokal'?'Pallet Lokal':_trendMetrik==='ekspor'?'Pallet Ekspor':'Total Pallet';
      var satuanLabel = isPct ? '%' : ' pallet';


      var canvas = document.getElementById('trendLineChart');
      canvas.style.display = 'block';
      if(_trendInstance){ _trendInstance.destroy(); _trendInstance=null; }

      _trendInstance = new Chart(canvas.getContext('2d'), {
        type:'line',
        data:{
          labels: labels,
          datasets:[
            {
              label: metrikLabel,
              data: values,
              borderColor:'#2c5364',
              backgroundColor:'rgba(44,83,100,.1)',
              borderWidth:2.5,
              pointRadius:4,
              pointHoverRadius:6,
              pointBackgroundColor:'#2c5364',
              tension:0.4,
              cubicInterpolationMode:'monotone',
              fill:true
            },
            {
              label: 'Kapasitas '+(isPct?'100%':cap.toLocaleString('id-ID')+' pallet'),
              data: dates.map(function(){ return capLine; }),
              borderColor:'rgba(229,62,62,.75)',
              borderWidth:3,
              borderDash:[6,4],
              pointRadius:0,
              fill:false,
              tension:0
            }
          ]
        },
        options:{
          responsive:true, maintainAspectRatio:false,
          interaction:{mode:'index', intersect:false},
          plugins:{
            datalabels:{display:false},
            legend:{display:true, position:'top', labels:{font:{size:11},boxWidth:14}},
            tooltip:{
              callbacks:{
                label:function(ctx){
                  if(ctx.datasetIndex===1) return ctx.dataset.label;
                  return ' '+ctx.parsed.y.toLocaleString('id-ID')+(isPct?'%':' pallet');
                }
              }
            }
          },
          scales:{
            x:{
              grid:{color:'rgba(0,0,0,.05)'},
              ticks:{font:{size:11}, color:'#718096'}
            },
            y:{
              beginAtZero:false,
              grid:{color:'rgba(0,0,0,.06)'},
              ticks:{
                font:{size:11}, color:'#718096',
                callback:function(v){ return isPct?v+'%':v.toLocaleString('id-ID'); }
              }
            }
          },
          animation:{duration:600, easing:'easeOutQuart'}
        }
      });
    }

        setInterval(function(){ if(typeof google!=='undefined'&&google.script) refreshData(); }, 180000);


    // Guard helper - cek apakah google.script ready
    function _gasReady(){ return typeof google !== 'undefined' && google && google.script; }

    // =============================================
    // SISTEM TABEL OK — Universal Table Engine
    // Fitur: Arrow Nav, Tab/Enter, Overwrite Mode,
    //        Delete, Drag Select, Shift+Arrow,
    //        Ctrl+A, Ctrl+C, Paste, Drag Fill
    // Usage: _STOKInit(config)
    // =============================================
    function _STOKInit(cfg){
      /*
        cfg = {
          tblId      : string  — id <table>
          tbodyId    : string  — id <tbody>
          cols       : array   — ordered col keys (data-col values)
          autoCols   : object  — {colKey: true} untuk kolom auto/read-only
          selClass   : string  — CSS class untuk cell terselect
          onAfterPaste: fn(tr) — callback setelah paste per baris (opsional)
          onDelete   : fn(tr,col) — callback setelah delete cell (opsional)
        }
      */
      var tbl    = document.getElementById(cfg.tblId);
      var tbody  = document.getElementById(cfg.tbodyId);
      if(!tbl || !tbody) return;
      if(tbl._stokBound) return;
      tbl._stokBound = true;

      // cfg.cols diupdate dari luar saat tipe berubah — cfg.cols selalu baca live
      var AUTO      = cfg.autoCols || {};
      var SEL_CLS   = cfg.selClass || 'stok-sel';
      var sel       = {r1:-1,c1:-1,r2:-1,c2:-1};
      var dragging  = false;
      var fillDrag  = false;
      var fillAnchorR = -1, fillAnchorC = -1;
      // Expose updateCols agar caller bisa update cfg.cols saat tipe berubah
      tbl._stokUpdateCols = function(newCols){ cfg.cols = newCols; };

      function allTrs(){ return Array.from(tbody.querySelectorAll('tr')); }
      function trIdx(tr){ return allTrs().indexOf(tr); }
      function tcIdx(td){ return cfg.cols.indexOf(td.dataset.col||''); }
      function getTd(trs,r,c){
        if(r<0||r>=trs.length||c<0||c>=cfg.cols.length) return null;
        return trs[r].querySelector('[data-col="'+cfg.cols[c]+'"]');
      }
      function isEditable(td){ return td && td.contentEditable==='true'; }

      // ── Selection ──────────────────────────────
      function clearSel(){
        tbody.querySelectorAll('.'+SEL_CLS).forEach(function(el){ el.classList.remove(SEL_CLS); });
        sel={r1:-1,c1:-1,r2:-1,c2:-1};
        var info=document.getElementById(cfg.tbodyId.replace('Tbody','SelInfo').replace('tbody','SelInfo'));
        if(info) info.textContent='';
        fillHandleEl.style.display='none';
      }
      function applySel(){
        tbody.querySelectorAll('.'+SEL_CLS).forEach(function(el){ el.classList.remove(SEL_CLS); });
        var r1=Math.min(sel.r1,sel.r2), r2=Math.max(sel.r1,sel.r2);
        var c1=Math.min(sel.c1,sel.c2), c2=Math.max(sel.c1,sel.c2);
        var trs=allTrs();
        for(var r=r1;r<=r2;r++) for(var c=c1;c<=c2;c++){
          var td=getTd(trs,r,c); if(td) td.classList.add(SEL_CLS);
        }
        var info=document.getElementById(cfg.tbodyId.replace('Tbody','SelInfo').replace('tbody','SelInfo'));
        if(info){ var rows=r2-r1+1, cols=c2-c1+1; info.textContent=rows>1||cols>1?rows+'×'+cols:''; }
      }

      // ── Focus + navigate ───────────────────────
      function navigate(td, dr, dc, extend){
        var trs=allTrs();
        var ri=trIdx(td.closest('tr')), ci=tcIdx(td);
        var nri=ri+dr, nci=ci+dc;
        if(dc!==0 && dr===0){
          if(nci<0){ nci=cfg.cols.length-1; nri--; }
          else if(nci>=cfg.cols.length){ nci=0; nri++; }
        }
        nri=Math.max(0,Math.min(trs.length-1,nri));
        nci=Math.max(0,Math.min(cfg.cols.length-1,nci));

        if(extend){
          if(sel.r1<0){ sel={r1:ri,c1:ci,r2:ri,c2:ci}; }
          sel.r2=nri; sel.c2=nci; applySel();
          var tgt=getTd(trs,nri,nci);
          if(tgt){ tgt._stokSuppressFocus=true; tgt.focus(); }
        } else {
          var maxStep=cfg.cols.length+trs.length;
          var step=0;
          while(step<maxStep){
            var tgt=getTd(trs,nri,nci);
            if(!tgt) break;
            if(isEditable(tgt)){
              clearSel();
              sel={r1:nri,c1:nci,r2:nri,c2:nci};
              // Explicit blur dulu agar blur event (SAP lookup dll) terpanggil
              if(td && td!==tgt && typeof td.blur==='function') td.blur();
              tgt.focus(); break;
            }
            if(dr!==0){ nri+=dr; }
            else { nci+=dc; if(nci<0){nci=cfg.cols.length-1;nri--;} else if(nci>=cfg.cols.length){nci=0;nri++;} }
            nri=Math.max(0,Math.min(trs.length-1,nri));
            nci=Math.max(0,Math.min(cfg.cols.length-1,nci));
            step++;
          }
        }
      }

      // ── Copy ───────────────────────────────────
      function copyBlock(){
        var trs=allTrs();
        var r1=Math.min(sel.r1,sel.r2),r2=Math.max(sel.r1,sel.r2);
        var c1=Math.min(sel.c1,sel.c2),c2=Math.max(sel.c1,sel.c2);
        if(r1<0) return;
        var lines=[];
        for(var r=r1;r<=r2;r++){
          var cells=[];
          for(var c=c1;c<=c2;c++){ var td=getTd(trs,r,c); cells.push(td?td.textContent.trim():''); }
          lines.push(cells.join('\t'));
        }
        var text=lines.join('\n');

        // Simpan focus sekarang sebelum membuat textarea
        var prevFocus = document.activeElement;

        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:50%;left:50%;width:1px;height:1px;'+
          'padding:0;border:none;outline:none;box-shadow:none;'+
          'background:transparent;color:transparent;font-size:1px;z-index:-1;';
        ta.setAttribute('readonly','');
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        try{ ta.setSelectionRange(0, ta.value.length); }catch(ex){}
        var copied = false;
        try{ copied = document.execCommand('copy'); }catch(ex){}
        document.body.removeChild(ta);

        // Kembalikan focus ke cell terakhir yang terselect (bukan tbl/body)
        // supaya user bisa langsung ketik setelah copy
        var restoreTd = null;
        if(sel.r1>=0){
          var trs2=allTrs();
          var rr=Math.max(sel.r1,sel.r2), cc=Math.max(sel.c1,sel.c2);
          restoreTd = getTd(trs2,rr,cc);
        }
        if(restoreTd && isEditable(restoreTd)){
          restoreTd.focus();
        } else if(prevFocus && prevFocus!==ta && prevFocus!==document.body &&
                  document.body.contains(prevFocus) && typeof prevFocus.focus==='function'){
          prevFocus.focus();
        }

        if(navigator.clipboard&&navigator.clipboard.writeText){
          navigator.clipboard.writeText(text).catch(function(){});
        }

        showToast(copied?'📋 '+(r2-r1+1)+(r2>r1?' baris':' sel')+' disalin':'📋 Ctrl+C untuk copy','');
      }

      // ── Paste ──────────────────────────────────
      function doPaste(text, startR, startC){
        var trs=allTrs();
        var rows=text.split(/\r?\n/).filter(function(l,i,a){ return !(i===a.length-1&&l===''); });
        rows.forEach(function(rowStr,ri){
          while(allTrs().length<=startR+ri){
            // Append kosong jika kurang baris — panggil fungsi append tabel masing-masing
            var appendFn = window['_append'+cfg.tbodyId.charAt(0).toUpperCase()+cfg.tbodyId.slice(1).replace('Tbody','')+'Row']
                        || window['_append'+cfg.tbodyId.replace('Tbody','')+'Row']
                        || window['_append'+cfg.tbodyId.replace('tbody','').charAt(0).toUpperCase()+cfg.tbodyId.replace('tbody','').slice(1)+'Row'];
            if(appendFn) appendFn(); else break;
            trs=allTrs();
          }
          var tr=allTrs()[startR+ri]; if(!tr) return;
          rowStr.split('\t').forEach(function(val,ci){
            var colIdx=startC+ci; if(colIdx>=cfg.cols.length) return;
            var k=cfg.cols[colIdx]; if(AUTO[k]) return;
            var td=tr.querySelector('[data-col="'+k+'"]'); if(td) td.textContent=val.trim();
          });
          if(cfg.onAfterPaste) cfg.onAfterPaste(tr);
        });
      }

      // ── Undo / Redo stack ──────────────────────
      var undoStack=[], redoStack=[], MAX_UNDO=50;

      function snapshotTbl(){
        // Snapshot isi semua editable cell sebagai array-of-objects {r,c,v}
        var snap=[];
        var trs=allTrs();
        for(var r=0;r<trs.length;r++){
          for(var c=0;c<cfg.cols.length;c++){
            if(AUTO[cfg.cols[c]]) continue;
            var td=getTd(trs,r,c);
            snap.push({r:r,c:c,v:td?td.textContent:''});
          }
        }
        return snap;
      }

      function applySnapshot(snap){
        var trs=allTrs();
        snap.forEach(function(s){
          var td=getTd(trs,s.r,s.c);
          if(td) td.textContent=s.v;
        });
        // Trigger callbacks untuk recalc
        trs.forEach(function(tr){
          if(cfg.onAfterPaste) cfg.onAfterPaste(tr);
        });
      }

      function pushUndo(){
        var snap=snapshotTbl();
        // Jangan push kalau sama dengan snapshot terakhir
        var last=undoStack[undoStack.length-1];
        if(last){
          var same=last.length===snap.length&&last.every(function(s,i){ return s.v===snap[i].v; });
          if(same) return;
        }
        undoStack.push(snap);
        if(undoStack.length>MAX_UNDO) undoStack.shift();
        redoStack=[];
      }

      function doUndo(){
        if(undoStack.length<2) return; // butuh minimal 2: sebelum dan sesudah
        var current=undoStack.pop();
        redoStack.push(current);
        var prev=undoStack[undoStack.length-1];
        applySnapshot(prev);
        showToast('↩ Undo','');
      }

      function doRedo(){
        if(!redoStack.length) return;
        var next=redoStack.pop();
        undoStack.push(next);
        applySnapshot(next);
        showToast('↪ Redo','');
      }

      // Push snapshot awal
      pushUndo();

      // ── Drag Fill handle — overlay fixed di luar tabel ──
      var fillHandleEl=(function(){
        var h=document.createElement('div');
        h.className='stok-fill-handle-overlay';
        h.dataset.stokId=cfg.tbodyId; // tandai milik tabel mana
        h.style.cssText='display:none;position:fixed;width:8px;height:8px;background:#2563eb;border:2px solid #fff;cursor:crosshair;z-index:9999;border-radius:1px;box-shadow:0 0 0 1px #2563eb;pointer-events:auto;';
        document.body.appendChild(h);
        h.addEventListener('mousedown',function(e){
          e.preventDefault(); e.stopPropagation();
          fillDrag=true;
          h._active=true;
          fillAnchorR=Math.max(sel.r1,sel.r2);
          fillAnchorC=Math.max(sel.c1,sel.c2);
        });
        return h;
      })();

      function showFillHandle(){
        if(sel.r1<0){ fillHandleEl.style.display='none'; return; }
        var r2=Math.max(sel.r1,sel.r2), c2=Math.max(sel.c1,sel.c2);
        var td=getTd(allTrs(),r2,c2);
        if(!td){ fillHandleEl.style.display='none'; return; }
        // Sembunyikan fillHandle milik tabel lain
        document.querySelectorAll('.stok-fill-handle-overlay').forEach(function(h){
          if(h!==fillHandleEl) h.style.display='none';
        });
        var rect=td.getBoundingClientRect();
        fillHandleEl.style.left=(rect.right-5)+'px';
        fillHandleEl.style.top=(rect.bottom-5)+'px';
        fillHandleEl.style.display='block';
      }

      // ── Mouse events ───────────────────────────
      tbody.addEventListener('mousedown',function(e){
        var td=e.target.closest('td[data-col]'); if(!td) return;
        var ri=trIdx(td.closest('tr')), ci=tcIdx(td); if(ri<0||ci<0) return;
        if(e.shiftKey && sel.r1>=0){
          // Shift+Click: extend selection dari anchor ke cell ini
          e.preventDefault();
          sel.r2=ri; sel.c2=ci; applySel();
          return;
        }
        clearSel(); sel={r1:ri,c1:ci,r2:ri,c2:ci};
        dragging=true; applySel();
      });
      document.addEventListener('mousemove',function(e){
        if(!dragging&&!fillDrag) return;
        // Pastikan drag ini milik instance ini (bukan fillDrag dari tabel lain)
        if(fillDrag && !fillHandleEl._active) return;
        if(fillDrag){
          var td2=e.target.closest&&e.target.closest('td[data-col]');
          if(!td2||!td2.closest('#'+cfg.tbodyId)) return;
          var ri2=trIdx(td2.closest('tr'));
          // Highlight range fill
          tbody.querySelectorAll('.stok-fill-preview').forEach(function(el){ el.classList.remove('stok-fill-preview'); });
          var trs=allTrs();
          var c1=Math.min(sel.c1,sel.c2), c2m=Math.max(sel.c1,sel.c2);
          var rStart=Math.max(sel.r1,sel.r2)+1;
          for(var r=rStart;r<=ri2;r++) for(var c=c1;c<=c2m;c++){ var tdt=getTd(trs,r,c); if(tdt) tdt.classList.add('stok-fill-preview'); }
          return;
        }
        // drag select
        var td2=e.target.closest&&e.target.closest('td[data-col]');
        if(!td2||!td2.closest('#'+cfg.tbodyId)) return;
        var ri2=trIdx(td2.closest('tr')), ci2=tcIdx(td2); if(ri2<0||ci2<0) return;
        if(ri2!==sel.r2||ci2!==sel.c2){ sel.r2=ri2; sel.c2=ci2; applySel(); tbl.focus(); }
      });
      document.addEventListener('mouseup',function(e){
        if(fillDrag){
          fillDrag=false;
          fillHandleEl._active=false;
          tbody.querySelectorAll('.stok-fill-preview').forEach(function(el){ el.classList.remove('stok-fill-preview'); });
          var td2=e.target.closest&&e.target.closest('td[data-col]');
          if(td2&&td2.closest('#'+cfg.tbodyId)){
            var endR=trIdx(td2.closest('tr'));
            var r1=Math.min(sel.r1,sel.r2), r2=Math.max(sel.r1,sel.r2);
            var c1=Math.min(sel.c1,sel.c2), c2=Math.max(sel.c1,sel.c2);
            var trs=allTrs();
            if(endR>r2){
              pushUndo();
              // Ambil nilai dari baris sumber
              var srcVals={};
              for(var c=c1;c<=c2;c++){ var st=getTd(trs,r2,c); srcVals[c]=st?st.textContent.trim():''; }
              for(var r=r2+1;r<=endR;r++){
                for(var c=c1;c<=c2;c++){
                  var k=cfg.cols[c]; if(AUTO[k]) continue;
                  var tdt=getTd(trs,r,c); if(tdt) tdt.textContent=srcVals[c];
                }
                if(cfg.onAfterPaste) cfg.onAfterPaste(trs[r]);
              }
              sel.r2=endR; applySel();
            }
          }
        }
        if(dragging){
          dragging=false; showFillHandle();
          var multiSel=(Math.abs(sel.r2-sel.r1)>0||Math.abs(sel.c2-sel.c1)>0);
          if(multiSel) tbl.focus();
        }
      });

      // ── Keyboard ───────────────────────────────
      tbl.addEventListener('keydown',function(e){
        var ae=document.activeElement, td=ae&&ae.closest&&ae.closest('td[data-col]');
        var inThisTbl=td&&td.closest('#'+cfg.tbodyId);

        // Delete / Backspace
        if(e.key==='Delete'||e.key==='Backspace'){
          if(sel.r1>=0){
            var multi=Math.abs(sel.r2-sel.r1)>0||Math.abs(sel.c2-sel.c1)>0;
            if(multi||(inThisTbl&&ae===tbl)){
              e.preventDefault();
              pushUndo();
              var trs=allTrs();
              var r1=Math.min(sel.r1,sel.r2),r2=Math.max(sel.r1,sel.r2);
              var c1=Math.min(sel.c1,sel.c2),c2=Math.max(sel.c1,sel.c2);
              for(var r=r1;r<=r2;r++) for(var c=c1;c<=c2;c++){
                var k=cfg.cols[c]; if(AUTO[k]) continue;
                var tdt=getTd(trs,r,c); if(tdt){ tdt.textContent=''; if(cfg.onDelete) cfg.onDelete(trs[r],k); }
              }
              if(multi) clearSel();
            }
          }
          return;
        }

        // Ctrl+Z — Undo
        if((e.ctrlKey||e.metaKey)&&e.key==='z'&&!e.shiftKey){
          if(!inThisTbl) return;
          e.preventDefault(); doUndo(); return;
        }

        // Ctrl+Y / Ctrl+Shift+Z — Redo
        if((e.ctrlKey||e.metaKey)&&(e.key==='y'||(e.key==='z'&&e.shiftKey))){
          if(!inThisTbl) return;
          e.preventDefault(); doRedo(); return;
        }

        // Ctrl+C
        if((e.ctrlKey||e.metaKey)&&(e.key==='c'||e.key==='C')&&sel.r1>=0){ e.preventDefault(); copyBlock(); return; }

        // Ctrl+A
        if((e.ctrlKey||e.metaKey)&&e.key==='a'){
          if(inThisTbl&&isEditable(td)) return; // biar browser handle select-all teks
          e.preventDefault();
          var trs2=allTrs();
          sel={r1:0,c1:0,r2:trs2.length-1,c2:cfg.cols.length-1}; applySel(); return;
        }

        if(!inThisTbl) return;

        // Arrow keys
        var isArrow=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.key)>=0;
        if(isArrow){
          var txt=td.textContent, sObj=window.getSelection(), off=sObj?sObj.focusOffset:0;
          var atEnd=off>=txt.length, atStart=off<=0;
          if(e.key==='ArrowUp'||e.key==='ArrowDown'){ e.preventDefault(); navigate(td,e.key==='ArrowDown'?1:-1,0,e.shiftKey); return; }
          if(e.key==='ArrowLeft'&&(atStart||txt==='')){ e.preventDefault(); navigate(td,0,-1,e.shiftKey); return; }
          if(e.key==='ArrowRight'&&(atEnd||txt==='')){ e.preventDefault(); navigate(td,0,1,e.shiftKey); return; }
          return;
        }

        // Tab
        if(e.key==='Tab'){ e.preventDefault(); navigate(td,0,e.shiftKey?-1:1,false); return; }

        // Enter
        if(e.key==='Enter'){ e.preventDefault(); navigate(td,1,0,false); return; }
      });

      // Focus → set sel anchor
      tbody.addEventListener('focusin',function(e){
        var td=e.target.closest('td[data-col]'); if(!td) return;
        var ri=trIdx(td.closest('tr')), ci=tcIdx(td); if(ri<0) return;
        if(td._stokSuppressFocus){ td._stokSuppressFocus=false; return; }
        if(sel.r1<0||!e.shiftKey){ sel={r1:ri,c1:ci,r2:ri,c2:ci}; applySel(); showFillHandle(); }
      });

      // Blur → push undo + trigger SKU lookup kalau perlu
      tbody.addEventListener('focusout',function(e){
        var td=e.target.closest('td[data-col]'); if(!td) return;
        pushUndo();
        // Kalau cell SKU yang blur, trigger lookup via callback
        if(td.dataset.col==='sku' && cfg.onSkuBlur){
          cfg.onSkuBlur(td.closest('tr'));
        }
      });

      // Paste
      tbl.addEventListener('paste',function(e){
        var ae=document.activeElement, td=ae&&ae.closest&&ae.closest('td[data-col]');
        if(!td||!td.closest('#'+cfg.tbodyId)){
          if(sel.r1>=0){
            var trs=allTrs();
            var r1=Math.min(sel.r1,sel.r2), c1=Math.min(sel.c1,sel.c2);
            td=getTd(trs,r1,c1);
          }
          if(!td||!td.closest('#'+cfg.tbodyId)) return;
        }
        var text=(e.clipboardData||window.clipboardData).getData('text'); if(!text) return;
        e.preventDefault();
        pushUndo();
        doPaste(text, trIdx(td.closest('tr')), tcIdx(td));
      });

      // Click outside → clear sel
      document.addEventListener('mousedown',function(e){
        if(!tbl.contains(e.target)){ clearSel(); fillHandleEl.style.display='none'; }
      });
    }

    // CSS untuk SISTEM TABEL OK (inject sekali)
    (function(){
      if(document.getElementById('_stokStyle')) return;
      var s=document.createElement('style'); s.id='_stokStyle';
      s.textContent=
        '.stok-sel{background:#bfdbfe!important;}'+
        '.stok-fill-preview{background:#dbeafe!important;outline:1px dashed #3b82f6;}';
      document.head.appendChild(s);
    })();

    // =============================================
    // STOCK OPNAME
    // =============================================
    var _opnameStdMap   = {};
    var _opnameNamaMap  = {};
    var _opnameInitDone = false;
    var _opSel = {r1:-1,c1:-1,r2:-1,c2:-1};
    var _opDragging = false;

    // Kolom per tipe
    var OP_COLS_LOKAL   = ['sku','item','sap','fisik','sel_awal','pgr','pgi','salah_kirim','adj','sel_akhir','ket','std','palet'];
    var OP_EDIT_LOKAL   = ['sku','item','sap','fisik','pgr','pgi','salah_kirim','adj','std','ket'];
    var OP_COLS_EKSPOR  = ['sku','item','buyer','quotation','exp_date','fisik','sap_detail','sap_total','pgr','pgi','sel_akhir','ket','std','palet'];
    var OP_EDIT_EKSPOR  = ['sku','item','buyer','quotation','exp_date','fisik','sap_detail','sap_total','pgr','pgi','std','ket'];

    var OP_COLS_ORDER = OP_COLS_LOKAL.slice();
    var OP_EDITABLE   = OP_EDIT_LOKAL.slice();
    var _opCurrentTipe = 'LOKAL';
    var _opActiveTab = 'input';


    // Mapping nama per plant + tipe
    var _NAMA_MAP = {
      '1111|LOKAL':       ['Faisal'],
      '1111|EKSPOR':      ['Ade'],
      '1112|LOKAL':       ['Dimas','Apri'],
      '1112|EKSPOR':      ['Aldy'],
      '1113|LOKAL':       ['Dimas'],
      '1113|EKSPOR':      ['Aldy'],
      // GDFG ikut plant yg sama (lokal)
      '1111|GDFG':        ['Faisal'],
      '1112|GDFG':        ['Dimas','Apri'],
      '1113|GDFG':        ['Dimas'],
      '1111|GDFG-EKSPOR': ['Ade'],
      '1112|GDFG-EKSPOR': ['Aldy'],
      '1113|GDFG-EKSPOR': ['Aldy'],
      // FIFO
      '1111|FIFO':        ['Faishal'],
      '1112|FIFO':        ['Dimas','Apri'],
      '1113|FIFO':        ['Dimas'],
      // FIFO EKSPOR
      '1111|FIFO-EKSPOR': ['Ade'],
      '1112|FIFO-EKSPOR': ['Aldy'],
      '1113|FIFO-EKSPOR': ['Aldy'],
      // QT READY (sama dengan EKSPOR)
      '1111|QT_READY':    ['Ade'],
      '1112|QT_READY':    ['Aldy'],
      '1113|QT_READY':    ['Aldy'],
    };

    // Mapping terbalik: nama → [{plant, tipe}]
    var _NAMA_TO_PT = (function(){
      var map = {};
      Object.keys(_NAMA_MAP).forEach(function(key){
        var parts = key.split('|'), plant=parts[0], tipe=parts[1];
        // Hanya lokal/ekspor untuk filter riwayat (bukan GDFG)
        if(tipe==='GDFG'||tipe==='GDFG-EKSPOR') return;
        _NAMA_MAP[key].forEach(function(nama){
          if(!map[nama]) map[nama]=[];
          map[nama].push({plant:plant, tipe:tipe});
        });
      });
      return map;
    })();

    function _initViewNamaOptions(){
      var sel = document.getElementById('opViewNama');
      if(!sel) return;
      var allNames = Object.keys(_NAMA_TO_PT).sort();
      sel.innerHTML = '<option value="">Semua Nama</option>';
      allNames.forEach(function(n){
        var opt = document.createElement('option');
        opt.value = n; opt.textContent = n;
        sel.appendChild(opt);
      });
    }

    function _onViewNamaChange(){
      var nama  = (document.getElementById('opViewNama')||{}).value||'';
      var plantSel = document.getElementById('opViewPlant');
      var tipeSel  = document.getElementById('opViewTipe');
      if(!nama){
        // Kosong → reset plant & tipe
        if(plantSel) plantSel.value='';
        if(tipeSel)  tipeSel.value='';
        return;
      }
      var pts = _NAMA_TO_PT[nama]||[];
      var _plantsSeen={}, plants=[];
      pts.forEach(function(x){ if(!_plantsSeen[x.plant]){ _plantsSeen[x.plant]=1; plants.push(x.plant); } });
      var _tipesSeen={}, tipes=[];
      pts.forEach(function(x){ if(!_tipesSeen[x.tipe]){ _tipesSeen[x.tipe]=1; tipes.push(x.tipe); } });
      // Selalu auto-set saat nama dipilih (bisa diubah manual setelahnya)
      if(plantSel) plantSel.value = plants.length===1 ? plants[0] : '';
      if(tipeSel)  tipeSel.value  = tipes.length===1  ? tipes[0]  : '';
    }

    function _onViewPlantChange(){
      // Plant berubah manual — biarkan nama tetap terpilih
    }

    function _updateNamaOptions(){
      var plant = (document.getElementById('opPlant')||{}).value || '';
      var tipe  = _opCurrentTipe || 'LOKAL';
      // FIFO bisa punya sub-tipe EKSPOR → key berbeda
      var key = (tipe==='FIFO' && _fifoSubTipe==='EKSPOR')
                ? plant + '|FIFO-EKSPOR'
                : plant + '|' + tipe;
      var names = _NAMA_MAP[key] || [];
      var sel   = document.getElementById('opNama');
      if(!sel) return;
      var prev  = sel.value;
      sel.innerHTML = '<option value="">— Pilih Nama —</option>';
      names.forEach(function(n){
        var opt = document.createElement('option');
        opt.value = n; opt.textContent = n;
        if(n === prev) opt.selected = true;
        sel.appendChild(opt);
      });
      if(names.length === 1) sel.value = names[0];
    }
    // Cache data tabel per tipe agar tidak hilang saat switch
    var _opTipeCache = { LOKAL: null, EKSPOR: null };
    var _opGdfgTipeCache = { LOKAL: null, EKSPOR: null };

    function _opSaveCacheFor(tipe){
      if(!tipe) return;
      var rows = [];
      document.getElementById('opnameTbody').querySelectorAll('tr').forEach(function(tr){
        var rowData = {};
        tr.querySelectorAll('td[data-col]').forEach(function(td){
          rowData[td.dataset.col] = td.textContent.trim();
        });
        rows.push(rowData);
      });
      _opTipeCache[tipe] = rows;
      var gRows = [];
      document.getElementById('opnameTbodyGdfg').querySelectorAll('tr').forEach(function(tr){
        var rowData = {};
        tr.querySelectorAll('td[data-col]').forEach(function(td){
          rowData[td.dataset.col] = td.textContent.trim();
        });
        gRows.push(rowData);
      });
      _opGdfgTipeCache[tipe] = gRows;
    }

    function _opRestoreCache(tipe){
      var cached = _opTipeCache[tipe];
      if(!cached || !cached.length) return;
      var trs = Array.from(document.getElementById('opnameTbody').querySelectorAll('tr'));
      cached.forEach(function(rowData, i){
        var tr = trs[i];
        if(!tr) return;
        Object.keys(rowData).forEach(function(col){
          var td = tr.querySelector('[data-col="'+col+'"]');
          if(td && rowData[col]) td.textContent = rowData[col];
        });
        _calcOpRow(tr);
      });
      _updateOpTotals();
      // GDFG
      var gCached = _opGdfgTipeCache[tipe];
      if(gCached && gCached.length){
        var gTrs = Array.from(document.getElementById('opnameTbodyGdfg').querySelectorAll('tr'));
        gCached.forEach(function(rowData, i){
          var tr = gTrs[i];
          if(!tr) return;
          Object.keys(rowData).forEach(function(col){
            var td = tr.querySelector('[data-col="'+col+'"]');
            if(td && rowData[col]) td.textContent = rowData[col];
          });
          _calcOpGdfgRow(tr);
        });
        _updateOpGdfgTotals();
      }
    }

        function opSetTipe(val){
      var prevTipe = _opCurrentTipe; // simpan sebelum update
      _opSaveCacheFor(prevTipe);     // simpan data tabel lama
      _opCurrentTipe = val;
      var sel = document.getElementById('opTipe');
      var strip = document.getElementById('opTipeStrip');
      var badge = document.getElementById('opTipeBadge');
      var labelMain = document.getElementById('opCardLabelMain');
      var labelTbl  = document.getElementById('opCardLabelTbl');
      var isEkspor  = val==='EKSPOR';
      var isFifo    = val==='FIFO';
      var isQtReady = val==='QT_READY';

      // CSS class untuk warna
      var cls = isFifo ? 'fifo' : (isEkspor ? 'ekspor' : (isQtReady ? 'qtready' : 'lokal'));
      if(sel){ sel.className = 'op-tipe-select '+cls; }
      if(strip){ strip.className = 'op-tipe-strip '+cls; }
      if(badge){ badge.textContent = val; }

      var cardMain = document.querySelector('#opnamePage .op-card-section:not(.op-card-gdfg):not(.op-card-fifo):not(.op-card-qtready)');
      var cardGdfg = document.querySelector('.op-card-gdfg');
      var cardFifo = document.getElementById('opCardFifo');
      var cardQt   = document.getElementById('opCardQtReady');
      var saveBarMain = document.getElementById('opSaveBarMain');

      // Sembunyikan semua card dulu
      if(cardMain)    cardMain.style.display='none';
      if(cardGdfg)    cardGdfg.style.display='none';
      if(saveBarMain) saveBarMain.style.display='none';
      if(cardFifo){   cardFifo.style.display='none'; cardFifo.classList.remove('active'); }
      if(cardQt){     cardQt.style.display='none';   cardQt.classList.remove('active'); }

      if(isFifo){
        if(cardFifo){ cardFifo.style.display=''; cardFifo.classList.add('active'); }
        _initFifoIfNeeded();
        _updateFifoStats();
      } else if(isQtReady){
        if(cardQt){ cardQt.style.display=''; cardQt.classList.add('active'); }
        _initQtIfNeeded();
        _updateQtStats();
        // Update judul tabel dengan tanggal
        _qtUpdateTitle();
      } else {
        if(cardMain)    cardMain.style.display='';
        if(cardGdfg)    cardGdfg.style.display='';
        if(saveBarMain) saveBarMain.style.display='';
        if(labelMain){ labelMain.textContent = isEkspor ? '🚢 EKSPOR' : '🏭 LOKAL'; }
        if(labelTbl) { labelTbl.textContent  = isEkspor ? 'Ekspor'   : 'Lokal';   }
        if(isEkspor){
          OP_COLS_ORDER = OP_COLS_EKSPOR.slice();
          OP_EDITABLE   = OP_EDIT_EKSPOR.slice();
        } else {
          OP_COLS_ORDER = OP_COLS_LOKAL.slice();
          OP_EDITABLE   = OP_EDIT_LOKAL.slice();
        }
        // Update STOK cols agar navigate/paste ikut kolom baru
        var opTbl=document.getElementById('opnameTbl');
        if(opTbl&&opTbl._stokUpdateCols) opTbl._stokUpdateCols(OP_COLS_ORDER);
        var opTblG=document.getElementById('opnameTblGdfg');
        if(opTblG&&opTblG._stokUpdateCols) opTblG._stokUpdateCols(OP_COLS_ORDER);
        _renderOpThead();
        _renderOpTheadGdfg();
        _updateNamaOptions();
        initOpnameRows(30);
        initOpnameGdfgRows(30);
        _opRestoreCache(val);
      }
    }

    function _renderOpThead(){
      var thead = document.getElementById('opnameThead');
      if(!thead) return;
      if(_opCurrentTipe === 'EKSPOR'){
        thead.innerHTML =
          '<tr>' +
            '<th class="row-no" rowspan="2">#</th>' +
            '<th style="min-width:90px" rowspan="2">SKU</th>' +
            '<th style="min-width:200px" rowspan="2">NAMA BARANG</th>' +
            '<th style="min-width:110px" rowspan="2">BUYER</th>' +
            '<th style="min-width:110px" rowspan="2">QUOTATION</th>' +
            '<th style="min-width:105px" rowspan="2">PROD / EXP DATE</th>' +
            '<th style="min-width:80px;text-align:right" rowspan="2">FISIK</th>' +
            '<th colspan="2" style="text-align:center;background:rgba(66,153,225,.12)">SAP</th>' +
            '<th style="min-width:80px;text-align:right" rowspan="2">PENDING GR</th>' +
            '<th style="min-width:80px;text-align:right" rowspan="2">PENDING GI</th>' +
            '<th style="min-width:90px;text-align:right;background:rgba(66,153,225,.15)" rowspan="2">SELISIH AKHIR</th>' +
            '<th style="min-width:120px" rowspan="2">KETERANGAN</th>' +
            '<th style="min-width:70px;text-align:right;background:rgba(246,224,94,.06)" rowspan="2">STD PALLET</th>' +
            '<th style="min-width:80px;text-align:right;background:rgba(246,224,94,.1)" rowspan="2">JML PALLET</th>' +
            '<th style="width:28px" rowspan="2"></th>' +
          '</tr>' +
          '<tr>' +
            '<th style="min-width:90px;text-align:right;background:rgba(66,153,225,.08)">Detail QT</th>' +
            '<th style="min-width:90px;text-align:right;background:rgba(66,153,225,.12)">TOTAL</th>' +
          '</tr>';
      } else {
        thead.innerHTML =
          '<tr>' +
            '<th class="row-no">#</th>' +
            '<th style="min-width:90px">SKU</th>' +
            '<th style="min-width:220px">NAMA BARANG</th>' +
            '<th style="min-width:75px;text-align:right">SAP</th>' +
            '<th style="min-width:75px;text-align:right">FISIK</th>' +
            '<th style="min-width:75px;text-align:right;background:rgba(66,153,225,.15)">SEL. AWAL</th>' +
            '<th style="min-width:75px;text-align:right">PEND. GR</th>' +
            '<th style="min-width:75px;text-align:right">PEND. GI</th>' +
            '<th style="min-width:85px;text-align:right">SALAH KIRIM</th>' +
            '<th style="min-width:65px;text-align:right">ADJ</th>' +
            '<th style="min-width:75px;text-align:right;background:rgba(66,153,225,.15)">SEL. AKHIR</th>' +
            '<th style="min-width:110px">KET</th>' +
            '<th style="min-width:60px;text-align:right;background:rgba(246,224,94,.06)">STD</th>' +
            '<th style="min-width:75px;text-align:right;background:rgba(246,224,94,.1)">PALET</th>' +
            '<th style="width:28px"></th>' +
          '</tr>';
      }
    }

    // ── Opname Zoom ──────────────────────────────
    var _opZoom = 100; // percent
    // opZoom dan opZoomReset: lihat definisi di bawah (support parameter tbl)

    function _renderOpTheadGdfg(){
      var thead = document.getElementById('opnameTheadGdfg');
      if(!thead) return;
      // GDFG pakai kolom yang sama dengan tipe aktif (lokal/ekspor)
      if(_opCurrentTipe === 'EKSPOR'){
        thead.innerHTML =
          '<tr>' +
            '<th class="row-no" rowspan="2">#</th>' +
            '<th style="min-width:90px" rowspan="2">SKU</th>' +
            '<th style="min-width:200px" rowspan="2">NAMA BARANG</th>' +
            '<th style="min-width:110px" rowspan="2">BUYER</th>' +
            '<th style="min-width:110px" rowspan="2">QUOTATION</th>' +
            '<th style="min-width:105px" rowspan="2">PROD / EXP DATE</th>' +
            '<th style="min-width:80px;text-align:right" rowspan="2">FISIK</th>' +
            '<th colspan="2" style="text-align:center;background:rgba(66,153,225,.12)">SAP</th>' +
            '<th style="min-width:80px;text-align:right" rowspan="2">PENDING GR</th>' +
            '<th style="min-width:80px;text-align:right" rowspan="2">PENDING GI</th>' +
            '<th style="min-width:90px;text-align:right;background:rgba(66,153,225,.15)" rowspan="2">SELISIH AKHIR</th>' +
            '<th style="min-width:120px" rowspan="2">KETERANGAN</th>' +
            '<th style="min-width:70px;text-align:right;background:rgba(246,224,94,.06)" rowspan="2">STD PALLET</th>' +
            '<th style="min-width:80px;text-align:right;background:rgba(246,224,94,.1)" rowspan="2">JML PALLET</th>' +
            '<th style="width:28px" rowspan="2"></th>' +
          '</tr>' +
          '<tr>' +
            '<th style="min-width:90px;text-align:right;background:rgba(66,153,225,.08)">Detail QT</th>' +
            '<th style="min-width:90px;text-align:right;background:rgba(66,153,225,.12)">TOTAL</th>' +
          '</tr>';
      } else {
        thead.innerHTML =
          '<tr>' +
            '<th class="row-no">#</th>' +
            '<th style="min-width:90px">SKU</th>' +
            '<th style="min-width:220px">NAMA BARANG</th>' +
            '<th style="min-width:75px;text-align:right">SAP</th>' +
            '<th style="min-width:75px;text-align:right">FISIK</th>' +
            '<th style="min-width:75px;text-align:right;background:rgba(66,153,225,.15)">SEL. AWAL</th>' +
            '<th style="min-width:75px;text-align:right">PEND. GR</th>' +
            '<th style="min-width:75px;text-align:right">PEND. GI</th>' +
            '<th style="min-width:85px;text-align:right">SALAH KIRIM</th>' +
            '<th style="min-width:65px;text-align:right">ADJ</th>' +
            '<th style="min-width:75px;text-align:right;background:rgba(66,153,225,.15)">SEL. AKHIR</th>' +
            '<th style="min-width:110px">KET</th>' +
            '<th style="min-width:60px;text-align:right;background:rgba(246,224,94,.06)">STD</th>' +
            '<th style="min-width:75px;text-align:right;background:rgba(246,224,94,.1)">PALET</th>' +
            '<th style="width:28px"></th>' +
          '</tr>';
      }
    }
