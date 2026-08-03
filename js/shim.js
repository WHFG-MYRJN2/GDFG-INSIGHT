// ============================================================
// shim.js — google.script.run compatibility layer
// ============================================================
(function() {
  var _s = null, _f = null;

  var ARG_MAP = {
    // Auth
    'verifyLogin':         function(a){ return {username:a[0], password:a[1]}; },
    // Kapasitas / Dashboard
    'getData':             function(a){ return {section:a[0]}; },
    'getSummaryLokal':     function(a){ return {}; },
    'getSummaryEkspor':    function(a){ return {}; },
    'getTotalPallet':      function(a){ return {}; },
    'getLastUpdate':       function(a){ return {}; },
    'getSummaryDivisi':    function(a){ return {}; },
    'getHistoryKapasitas': function(a){ return {from:a[0]||'', to:a[1]||'', tipes:a[2]||[]}; },
    // Input Data
    'saveGudangData':      function(a){ return {gudang:a[0], rows:a[1], tanggal:a[2], newSkus:a[3]}; },
    'saveStandarPallet':   function(a){ return {rows:a[0]}; },
    'getStandarPalet':     function(a){ return {}; },
    'saveStdEdit':         function(a){ return a[0]||{}; },
    'saveRekapHistory':    function(a){ return a[0]||{}; },
    'getRekapHistory':     function(a){ return {from:a[0]||'', to:a[1]||'', tipes:a[2]||[]}; },
    // Realisasi
    'saveRealisasiData':   function(a){ return {row:a[0], overwrite:a[1]}; },
    'getRealisasiData':    function(a){ return {from:a[0]||'', to:a[1]||''}; },
    'saveFdosData':        function(a){ return a[0]||{}; },
    'getFdosData':         function(a){ return {from:a[0]||'', to:a[1]||''}; },
    'saveMdcData':         function(a){ return a[0]||{}; },
    'getMdcPlanningData':  function(a){ return {from:a[0]||'', to:a[1]||''}; },
    // Opname
    'saveOpnameData':      function(a){ return {rows:a[0]}; },
    'getOpnameData':       function(a){ return {from:a[0]||'', to:a[1]||''}; },
    'updateOpnameRow':     function(a){ return a[0]||{}; },
    'saveFifoData':        function(a){ return {rows:a[0]}; },
    'getFifoData':         function(a){ return {from:a[0]||'', to:a[1]||''}; },
    'saveFifoEksporData':  function(a){ return {rows:a[0]}; },
    'getFifoEksporData':   function(a){ return {from:a[0]||'', to:a[1]||''}; },
    'updateFifoRow':       function(a){ return a[0]||{}; },
    'updateFifoEksporRow': function(a){ return a[0]||{}; },
    'saveQtReadyData':     function(a){ return {rows:a[0]}; },
    'getQtReadyData':      function(a){ return {from:a[0]||'', to:a[1]||''}; },
    'updateQtReadyRow':    function(a){ return a[0]||{}; },
    'saveOpnamePattern':   function(a){ return {username:a[0], pattern:a[1]}; },
    'loadOpnamePattern':   function(a){ return {username:a[0]}; },
    // RDC
    'saveRdcData':         function(a){ return a[0]||{}; },
    'saveKpiData':          function(a){ return a[0]||{}; },
    'getKpiData':           function(a){ return {from:a[0]||'', to:a[1]||''}; },
    'getKpiRitaseSummary':  function(a){ return {from:a[0]||'', to:a[1]||'', mode:a[2]||'all', groupMode:a[3]||'day'}; },
    'getKpiStaySummary':    function(a){ return {from:a[0]||'', to:a[1]||''}; },
    'getKpiLoadingSummary': function(a){ return {from:a[0]||'', to:a[1]||''}; },
    'getKpiSemesterGrade':  function(a){ return {type:a[0]||'', subKey:a[1]||'', year:a[2]||''}; },
    'getRdcData':          function(a){ return {from:a[0]||'', to:a[1]||''}; },
    'saveRdcCatatan':      function(a){ return a[0]||{}; },
    'getRdcTim':           function(a){ return {slDt:a[0]}; },
    // Stock Jalur
    'getSheetNames':       function(a){ return {ssUrl:a[0]}; },
    'searchSheetNames':    function(a){ return {ssUrl:a[0], keyword:a[1]}; },
    'getKartuStock':       function(a){ return {ssUrl:a[0], sheetName:a[1]}; },
    'getKartuStockArsip':  function(a){ return {ssUrl:a[0], sheetName:a[1]}; },
    'rekapStockJalur':     function(a){ return {data:a[0]}; },
    'rekapOutputJalur':    function(a){ return {data:a[0]}; },
    'updateSrShiftCell':   function(a){ return a[0]||{}; },
    'updateSrKirimCell':   function(a){ return a[0]||{}; },
    // Bin Loc
    'getBinSkuList':       function(a){ return {}; },
    'getBinSkuStdList':    function(a){ return {}; },
    'saveBinMovement':     function(a){ return a[0]||{}; },
    'getBinCurrent':       function(a){ return a[0]||{}; },
    'getBinMovement':      function(a){ return a[0]||{}; },
    'getBinFifoAllocation':function(a){ return {sku:a[0], qty:a[1]}; },
    'updateMekAntrianRow': function(a){ return a[0]||{}; },
  };

  var handler = {
    withSuccessHandler: function(fn) { _s = fn; return handler; },
    withFailureHandler: function(fn) { _f = fn; return handler; },
    withUserObject:     function()   { return handler; }
  };

  Object.keys(ARG_MAP).forEach(function(fn) {
    handler[fn] = function() {
      var args    = Array.prototype.slice.call(arguments);
      var onS     = _s, onF = _f;
      _s = null; _f = null;
      var payload = ARG_MAP[fn](args);
      API.run(fn, payload, onS, onF);
    };
  });

  window.google              = window.google              || {};
  window.google.script       = window.google.script       || {};
  window.google.script.run   = handler;
})();
