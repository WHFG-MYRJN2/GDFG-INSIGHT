// ============================================================
// api.js — MONITORING GDFG
// Pengganti google.script.run untuk GitHub Pages
// Semua request dikirim ke Cloudflare Worker → GAS
// ============================================================

const API = (function () {

  const WORKER_URL = "https://insight.gdfg-app.online/";

  // ----------------------------------------------------------
  // Token auth — disimpan di memori, disisipkan otomatis ke tiap request
  // ----------------------------------------------------------
  let _authToken = null;

  function setToken(token) { _authToken = token || null; }
  function getToken() { return _authToken; }
  function clearToken() { _authToken = null; }

  // ----------------------------------------------------------
  // Core: kirim request ke Worker
  // ----------------------------------------------------------
  async function _call(action, payload) {
    var finalPayload = payload || {};
    if (action !== "verifyLogin" && _authToken) {
      finalPayload = Object.assign({}, finalPayload, { token: _authToken });
    }
    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload: finalPayload })
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      var json = await res.json();
      if (json && json.authError) {
        // Token invalid/expired di tengah pemakaian -> paksa balik ke login
        clearToken();
        if (typeof window.handleAuthExpired === "function") {
          window.handleAuthExpired(json.message);
        }
      }
      return json;
    } catch (err) {
      return { success: false, message: "Network error: " + err.message };
    }
  }

  // ----------------------------------------------------------
  // Helper: wrapper mirip google.script.run
  // Pemakaian:
  //   API.run("getFoo", {a:1}, onSuccess, onError)
  // ----------------------------------------------------------
  function run(action, payload, onSuccess, onFailure) {
    _call(action, payload)
      .then(function (res) {
        if (typeof onSuccess === "function") onSuccess(res);
      })
      .catch(function (err) {
        if (typeof onFailure === "function") {
          onFailure(err);
        } else {
          console.error("[API] " + action + " error:", err);
        }
      });
  }

  // ============================================================
  // AUTH
  // ============================================================
  function verifyLogin(username, password, onSuccess, onFailure) {
    run("verifyLogin", { username, password }, onSuccess, onFailure);
  }

  // ============================================================
  // KAPASITAS / DASHBOARD
  // ============================================================
  function getData(section, onSuccess, onFailure) {
    run("getData", { section }, onSuccess, onFailure);
  }

  function getSummaryLokal(onSuccess, onFailure) {
    run("getSummaryLokal", {}, onSuccess, onFailure);
  }

  function getSummaryEkspor(onSuccess, onFailure) {
    run("getSummaryEkspor", {}, onSuccess, onFailure);
  }

  function getTotalPallet(onSuccess, onFailure) {
    run("getTotalPallet", {}, onSuccess, onFailure);
  }

  function getLastUpdate(onSuccess, onFailure) {
    run("getLastUpdate", {}, onSuccess, onFailure);
  }

  function getSummaryDivisi(onSuccess, onFailure) {
    run("getSummaryDivisi", {}, onSuccess, onFailure);
  }

  function getHistoryKapasitas(from, to, tipes, onSuccess, onFailure) {
    run("getHistoryKapasitas", { from, to, tipes }, onSuccess, onFailure);
  }

  // ============================================================
  // INPUT DATA
  // ============================================================
  function saveGudangData(gudang, rows, tanggal, newSkus, onSuccess, onFailure) {
    run("saveGudangData", { gudang, rows, tanggal, newSkus }, onSuccess, onFailure);
  }

  function saveStandarPallet(rows, onSuccess, onFailure) {
    run("saveStandarPallet", { rows }, onSuccess, onFailure);
  }

  function getStandarPalet(onSuccess, onFailure) {
    run("getStandarPalet", {}, onSuccess, onFailure);
  }

  function saveStdEdit(payload, onSuccess, onFailure) {
    run("saveStdEdit", payload, onSuccess, onFailure);
  }

  function saveRekapHistory(payload, onSuccess, onFailure) {
    run("saveRekapHistory", payload, onSuccess, onFailure);
  }

  function getRekapHistory(from, to, tipes, onSuccess, onFailure) {
    run("getRekapHistory", { from, to, tipes }, onSuccess, onFailure);
  }

  // ============================================================
  // REALISASI SPE
  // ============================================================
  function saveRealisasiData(row, overwrite, onSuccess, onFailure) {
    run("saveRealisasiData", { row, overwrite }, onSuccess, onFailure);
  }

  function getRealisasiData(from, to, onSuccess, onFailure) {
    run("getRealisasiData", { from, to }, onSuccess, onFailure);
  }

  function saveFdosData(payload, onSuccess, onFailure) {
    run("saveFdosData", payload, onSuccess, onFailure);
  }

  function getFdosData(from, to, onSuccess, onFailure) {
    run("getFdosData", { from, to }, onSuccess, onFailure);
  }

  function saveMdcData(payload, onSuccess, onFailure) {
    run("saveMdcData", payload, onSuccess, onFailure);
  }

  function getMdcPlanningData(from, to, onSuccess, onFailure) {
    run("getMdcPlanningData", { from, to }, onSuccess, onFailure);
  }

  // ============================================================
  // STOCK OPNAME
  // ============================================================
  function saveOpnameData(rows, onSuccess, onFailure) {
    run("saveOpnameData", { rows }, onSuccess, onFailure);
  }

  function getOpnameData(from, to, onSuccess, onFailure) {
    run("getOpnameData", { from, to }, onSuccess, onFailure);
  }

  function updateOpnameRow(payload, onSuccess, onFailure) {
    run("updateOpnameRow", payload, onSuccess, onFailure);
  }

  function saveFifoData(rows, onSuccess, onFailure) {
    run("saveFifoData", { rows }, onSuccess, onFailure);
  }

  function getFifoData(from, to, onSuccess, onFailure) {
    run("getFifoData", { from, to }, onSuccess, onFailure);
  }

  function saveFifoEksporData(rows, onSuccess, onFailure) {
    run("saveFifoEksporData", { rows }, onSuccess, onFailure);
  }

  function getFifoEksporData(from, to, onSuccess, onFailure) {
    run("getFifoEksporData", { from, to }, onSuccess, onFailure);
  }

  function updateFifoRow(payload, onSuccess, onFailure) {
    run("updateFifoRow", payload, onSuccess, onFailure);
  }

  function updateFifoEksporRow(payload, onSuccess, onFailure) {
    run("updateFifoEksporRow", payload, onSuccess, onFailure);
  }

  function saveQtReadyData(rows, onSuccess, onFailure) {
    run("saveQtReadyData", { rows }, onSuccess, onFailure);
  }

  function getQtReadyData(from, to, onSuccess, onFailure) {
    run("getQtReadyData", { from, to }, onSuccess, onFailure);
  }

  function updateQtReadyRow(payload, onSuccess, onFailure) {
    run("updateQtReadyRow", payload, onSuccess, onFailure);
  }

  function saveOpnamePattern(username, pattern, onSuccess, onFailure) {
    run("saveOpnamePattern", { username, pattern }, onSuccess, onFailure);
  }

  function loadOpnamePattern(username, onSuccess, onFailure) {
    run("loadOpnamePattern", { username }, onSuccess, onFailure);
  }

  // ============================================================
  // MONITORING RDC
  // ============================================================
  function saveRdcData(payload, onSuccess, onFailure) {
    run("saveRdcData", payload, onSuccess, onFailure);
  }

  function getRdcData(from, to, onSuccess, onFailure) {
    run("getRdcData", { from, to }, onSuccess, onFailure);
  }

  function saveRdcCatatan(payload, onSuccess, onFailure) {
    run("saveRdcCatatan", payload, onSuccess, onFailure);
  }

  function getRdcTim(slDt, onSuccess, onFailure) {
    run("getRdcTim", { slDt }, onSuccess, onFailure);
  }

  // ============================================================
  // STOCK JALUR
  // ============================================================
  function searchSheetNames(ssUrl, keyword, onSuccess, onFailure) {
    run("searchSheetNames", { ssUrl, keyword }, onSuccess, onFailure);
  }

  function getKartuStock(ssUrl, sheetName, onSuccess, onFailure) {
    run("getKartuStock", { ssUrl, sheetName }, onSuccess, onFailure);
  }

  function rekapStockJalur(data, onSuccess, onFailure) {
    run("rekapStockJalur", { data }, onSuccess, onFailure);
  }

  function rekapOutputJalur(data, onSuccess, onFailure) {
    run("rekapOutputJalur", { data }, onSuccess, onFailure);
  }

  function updateSrShiftCell(payload, onSuccess, onFailure) {
    run("updateSrShiftCell", payload, onSuccess, onFailure);
  }

  function updateSrKirimCell(payload, onSuccess, onFailure) {
    run("updateSrKirimCell", payload, onSuccess, onFailure);
  }

  // ============================================================
  // BIN LOC
  // ============================================================
  function getBinSkuStdList(onSuccess, onFailure) {
    run("getBinSkuStdList", {}, onSuccess, onFailure);
  }

  function getBinSkuList(onSuccess, onFailure) {
    run("getBinSkuList", {}, onSuccess, onFailure);
  }

  function saveBinMovement(payload, onSuccess, onFailure) {
    run("saveBinMovement", payload, onSuccess, onFailure);
  }

  function getBinCurrent(filters, onSuccess, onFailure) {
    run("getBinCurrent", filters || {}, onSuccess, onFailure);
  }

  function getBinMovement(filters, onSuccess, onFailure) {
    run("getBinMovement", filters || {}, onSuccess, onFailure);
  }

  function getBinFifoAllocation(sku, qty, onSuccess, onFailure) {
    run("getBinFifoAllocation", { sku, qty }, onSuccess, onFailure);
  }

  function updateMekAntrianRow(payload, onSuccess, onFailure) {
    run("updateMekAntrianRow", payload, onSuccess, onFailure);
  }

  // ============================================================
  // STOCK JALUR LOG
  // ============================================================
  function saveInputJalurLog(rows, onSuccess, onFailure) {
    run("saveInputJalurLog", { rows }, onSuccess, onFailure);
  }

  function saveOutputJalurLog(rows, onSuccess, onFailure) {
    run("saveOutputJalurLog", { rows }, onSuccess, onFailure);
  }

  // ============================================================
  // Public API
  // ============================================================
  return {
    // core
    run,
    setToken, getToken, clearToken,
    // auth
    verifyLogin,
    // dashboard
    getData, getSummaryLokal, getSummaryEkspor, getTotalPallet,
    getLastUpdate, getSummaryDivisi, getHistoryKapasitas,
    // input data
    saveGudangData, saveStandarPallet, getStandarPalet,
    saveStdEdit, saveRekapHistory, getRekapHistory,
    // realisasi
    saveRealisasiData, getRealisasiData,
    saveFdosData, getFdosData,
    saveMdcData, getMdcPlanningData,
    // opname
    saveOpnameData, getOpnameData, updateOpnameRow,
    saveFifoData, getFifoData,
    saveFifoEksporData, getFifoEksporData,
    updateFifoRow, updateFifoEksporRow,
    saveQtReadyData, getQtReadyData, updateQtReadyRow,
    saveOpnamePattern, loadOpnamePattern,
    // rdc
    saveRdcData, getRdcData, saveRdcCatatan, getRdcTim,
    // stock jalur
    searchSheetNames, getKartuStock,
    rekapStockJalur, rekapOutputJalur,
    updateSrShiftCell, updateSrKirimCell,
    // bin loc
    getBinSkuList, getBinSkuStdList, saveBinMovement,
    getBinCurrent, getBinMovement, getBinFifoAllocation,
    updateMekAntrianRow,
    // stock jalur log
    saveInputJalurLog, saveOutputJalurLog
  };

})();
