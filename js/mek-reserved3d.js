// ══════════════════════════════════════════════════════════════
// RESERVED VIEW — Peta 3D Rotate (Monitoring Ekspor)
// Modul ES (dipanggil dari monitoringekspor.js yang non-module lewat
// window.mekReserved3DRender(cells, longWaitBins, groups)).
//
// v3: PORT 1:1 dari sistem "3D Rotate" asli app BinLoc (fungsi
// _p3dInitRotateView / _p3dBuildRotateScene / _p3dSetupInteraction / dkk
// di index BinLoc yang dikirim user) — geometri rak, jalur pejalan kaki,
// outline gudang, posisi bin tambahan (T1-T36), kamera orthographic +
// viewcube preset (TOP/FRONT/BACK/L/R/ISO/RST + putar ISO 90°), klik blok
// buat zoom+dim rak lain, klik kotak/bin buat popup detail, hover tooltip
// — semuanya disalin apa adanya (koordinat hasil tuning manual di app
// BinLoc, gudangnya sama persis). Satu-satunya yang beda: sumber data
// (data reservasi kita, bukan _petaData BinLoc) dan warna kubus (status
// reservasi: hijau=available/oranye=reserved/merah=reserved>24 jam, bukan
// tipe/bulan prodate) — dan istilah "plt" (pallet) BinLoc jadi "krt"
// (karton) karena itu satuan yang kita pakai di sini.
// ══════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

var COLOR_AVAILABLE = '#10b981';
var COLOR_WAITING   = '#f59e0b';
var COLOR_LONGWAIT  = '#ef4444';

// ── Tata letak fisik rak & elemen tetap gudang — SAMA PERSIS dengan mode
// "3D Rotate" BinLoc (koordinat hasil tuning manual, gudangnya sama). ──
var LAYOUT_LETTERS = ['A','B','C','D','E','F','G','H','I'];
var MIRRORED       = ['B','D','F','H','I'];
var GAP_AFTER = { A:'aisle', B:'back', C:'aisle', D:'back', E:'aisle', F:'back', G:'aisle', H:'aisle' };
var AISLE_GAP = 5, BACK_GAP = 1.2;

var OUTLINE_CORNERS = [
  { x: -3, z: -1 }, { x: 0, z: -1 }, { x: 0, z: -1 }, { x: 29.5, z: -1 },
  { x: 29.5, z: 47 }, { x: 37, z: 47 }, { x: 37, z: 64 }, { x: 52, z: 64 },
  { x: 52, z: 74 }, { x: 36, z: 74 }, { x: 36, z: 72.5 }, { x: 24, z: 72.5 },
  { x: 24, z: 70.5 }, { x: -3, z: 70.5 }
];
var WALK_STRIPS = [
  { cx:14.3, cz:6.5, w:29.2, d:0.6 },
  { cx:12.5, cz:10.6, w:26.2, d:0.6 },
  { cx:12.5, cz:22.65, w:26.2, d:0.6 },
  { cx:12.5, cz:26.8, w:26.2, d:0.6 },
  { cx:12.5, cz:35.8, w:26.2, d:0.6 },
  { cx:12.5, cz:39.9, w:26.2, d:0.6 },
  { cx:18, cz:52, w:36.6, d:0.6 },
  { cx:18, cz:56.2, w:36.6, d:0.6 },
  { cx:20.3, cz:67.2, w:40.8, d:0.6 },
  { cx:46.1, cz:69.2, w:12, d:0.6 },
  { cx:25.4, cz:29, w:0.6, d:45.6 },
  { cx:-0.4, cz:33.8, w:0.6, d:67.5 },
  { cx:40.4, cz:68.5, w:0.6, d:2 }
];
var T_BIN_POSITIONS = [
  { label:"T1", cx:12.5, cz:7.5, w:25, d:1 },
  { label:"T2", cx:12.5, cz:9.7, w:25, d:1 },
  { label:"T3", cx:12.5, cz:23.5, w:25, d:1 },
  { label:"T4", cx:12.5, cz:25.9, w:25, d:1 },
  { label:"T5", cx:12.5, cz:36.7, w:25, d:1 },
  { label:"T6", cx:12.5, cz:39, w:25, d:1 },
  { label:"T7", cx:12.5, cz:52.9, w:25, d:1 },
  { label:"T8", cx:12.5, cz:55.3, w:25, d:1 },
  { label:"T9", cx:28.65, cz:9.1, w:1, d:4 },
  { label:"T10", cx:28.65, cz:14.4, w:1, d:5 },
  { label:"T11", cx:28.65, cz:20.2, w:1, d:5 },
  { label:"T12", cx:28.65, cz:26.2, w:1, d:5 },
  { label:"T13", cx:28.65, cz:32.1, w:1, d:5 },
  { label:"T14", cx:28.65, cz:38.3, w:1, d:5 },
  { label:"T15", cx:28.65, cz:44.5, w:1, d:5 },
  { label:"T16", cx:28.65, cz:49.7, w:1, d:3 },
  { label:"T17", cx:25.6, cz:45.9, w:1, d:4 },
  { label:"T18", cx:25.6, cz:31.7, w:1, d:4 },
  { label:"T19", cx:25.6, cz:16.8, w:1, d:4 },
  { label:"T20", cx:-0.6, cz:31.7, w:1, d:5 },
  { label:"T21", cx:-0.6, cz:45.9, w:1, d:5 },
  { label:"T22", cx:-0.6, cz:59.8, w:1, d:4 },
  { label:"T23", cx:2, cz:63.4, w:4, d:1 },
  { label:"T24", cx:6.3, cz:63.4, w:4, d:1 },
  { label:"T25", cx:10.6, cz:63.4, w:4, d:1 },
  { label:"T26", cx:14.9, cz:63.4, w:4, d:1 },
  { label:"T27", cx:19.2, cz:63.4, w:4, d:1 },
  { label:"T28", cx:23.5, cz:63.4, w:4, d:1 },
  { label:"T29", cx:27.8, cz:63.4, w:4, d:1 },
  { label:"T30", cx:32.1, cz:63.4, w:4, d:1 },
  { label:"T31", cx:35.5, cz:64.8, w:2, d:1 },
  { label:"T32", cx:37.8, cz:64.8, w:3, d:1 },
  { label:"T33", cx:40.9, cz:64.8, w:3, d:1 },
  { label:"T34", cx:44, cz:64.8, w:3, d:1 },
  { label:"T35", cx:47.1, cz:64.8, w:3, d:1 },
  { label:"T36", cx:50.2, cz:64.8, w:3, d:1 }
];

function _esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}

// ── State module-level (persist antar render, sama pola kayak global var
// di BinLoc — cuma di-scope ke modul ini, bukan window). ──
var _scene, _camera, _renderer, _controls, _canvas;
var _tooltipEl, _popupEl, _popupTitleEl, _popupBodyEl, _viewcubeEl;
var _initDone = false;
var _camInitialized = false;
var _boxesGroup = null, _framesGroup = null, _floorGroup = null, _labelsGroup = null;
var _hitboxGroup = null, _tBinHitGroup = null;
var _highlightRegistry = []; // [{mesh, letters:[...], binCodes?:[...]}]
var _selectedLetter = null;
var _rackInfo = {};          // { A: {cx,cz,x0,x1,z0,z1,maxLevel,maxDepth,rowCount,segCount}, ... }
var _sceneCenter = { x: 20, y: 6, z: 15 };
var _sceneSpan = { x: 20, z: 15 };
var _binRawRef = {};   // binCode -> [{sku,nama,karton,reservedKarton,availableKarton,prodate,tipe}]
var _binAggRef = {};   // binCode -> {totalKarton,totalReserved,totalAvailable}
var _binCapRef = {};   // binCode -> capacity slot (ny*nz), cuma keisi buat rak A-I yang ada barangnya
var _planningBySku = {}; // sku -> [{noSo,tanggal,tujuan,tier}] — planning yang masih outstanding buat sku itu (dari rows getMekReservedMap)
var _viewAnim = null;
var _raycaster, _pointer, _eventsBound = false;

function _easeInOut(t) { return t < 0.5 ? 2*t*t : -1 + (4-2*t)*t; }
function _toSpherical(offset) {
  var radius = Math.sqrt(offset.x*offset.x + offset.y*offset.y + offset.z*offset.z);
  var theta  = Math.atan2(offset.x, offset.z);
  var phi    = radius > 0 ? Math.acos(Math.max(-1, Math.min(1, offset.y / radius))) : 0;
  return { radius: radius, theta: theta, phi: phi };
}
function _fromSpherical(sph) {
  var sinPhiRadius = Math.sin(sph.phi) * sph.radius;
  return { x: sinPhiRadius * Math.sin(sph.theta), y: Math.cos(sph.phi) * sph.radius, z: sinPhiRadius * Math.cos(sph.theta) };
}
function _shortestAngleLerp(a, b, t) {
  var diff = b - a;
  while (diff > Math.PI)  diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

// ── Sprite label ("BLOK A", bin T, dock) ngambang di atas rak ──
function _makeLabelSprite(text, opts) {
  opts = opts || {};
  var canvas = document.createElement('canvas');
  canvas.width = opts.canvasW || 160; canvas.height = opts.canvasH || 64;
  var ctx = canvas.getContext('2d');
  var r = 16;
  ctx.fillStyle = opts.bg || 'rgba(24,24,32,0.82)';
  ctx.beginPath();
  ctx.moveTo(r,4); ctx.lineTo(canvas.width-r,4);
  ctx.quadraticCurveTo(canvas.width-4,4,canvas.width-4,r+4);
  ctx.lineTo(canvas.width-4,canvas.height-r-4);
  ctx.quadraticCurveTo(canvas.width-4,canvas.height-4,canvas.width-r-4,canvas.height-4);
  ctx.lineTo(r+4,canvas.height-4);
  ctx.quadraticCurveTo(4,canvas.height-4,4,canvas.height-r-4);
  ctx.lineTo(4,r+4);
  ctx.quadraticCurveTo(4,4,r+4,4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = opts.border || 'rgba(26,58,92,0.9)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  var fontPx = opts.fontPx || 30;
  ctx.font = 'bold ' + fontPx + 'px Arial';
  while (ctx.measureText(text).width > canvas.width - 24 && fontPx > 12) {
    fontPx -= 2;
    ctx.font = 'bold ' + fontPx + 'px Arial';
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width/2, canvas.height/2 + 2);
  var tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true });
  var sprite = new THREE.Sprite(mat);
  var sc = opts.scale || [5, 2, 1];
  sprite.scale.set(sc[0], sc[1], sc[2]);
  return sprite;
}

// ── Highlight per-blok — dim semua instance yang letter-nya beda dari yang dipilih ──
function _setHighlight(letter) {
  var white = new THREE.Color(1,1,1);
  var dim   = new THREE.Color(0.1,0.1,0.11);
  _highlightRegistry.forEach(function(entry) {
    var mesh = entry.mesh, letters = entry.letters;
    for (var i = 0; i < letters.length; i++) {
      mesh.setColorAt(i, (!letter || letters[i] === letter) ? white : dim);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });
}

// ── Zoom kamera ke 1 blok rak (kamera orthographic — "zoom" = camera.zoom, bukan jarak) ──
function _zoomToRack(letter) {
  var info = _rackInfo[letter];
  if (!info || !_camera || !_controls) return;
  var target = { x: info.cx, y: Math.min(info.maxLevel/2, 5), z: info.cz };
  var rackSpan  = Math.max(info.x1 - info.x0, info.z1 - info.z0, info.maxLevel, 4);
  var totalSpan = Math.max(_sceneSpan.x, _sceneSpan.z, 20);
  var toZoom = Math.min(9, Math.max(2, (totalSpan / rackSpan) * 0.55));
  var dist = rackSpan * 1.6 + 20;
  var dir = { x: 0.75, y: 0.6, z: 0.75 };
  var len = Math.sqrt(dir.x*dir.x + dir.y*dir.y + dir.z*dir.z);
  var fromTarget = _controls.target.clone();
  var fromOffset = { x: _camera.position.x - fromTarget.x, y: _camera.position.y - fromTarget.y, z: _camera.position.z - fromTarget.z };
  var toOffset   = { x: (dir.x/len) * dist, y: (dir.y/len) * dist, z: (dir.z/len) * dist };
  _viewAnim = {
    fromTarget: fromTarget, toTarget: target,
    fromSph: _toSpherical(fromOffset), toSph: _toSpherical(toOffset),
    fromZoom: _camera.zoom, toZoom: toZoom,
    start: performance.now(), dur: 550
  };
}

function _fmtTglShort(ymd) {
  if (!ymd) return '';
  var p = String(ymd).split('-');
  return p.length === 3 ? (p[2] + '/' + p[1] + '/' + p[0]) : ymd;
}

// Daftar planning (SO + tanggal) yang masih outstanding buat 1 SKU — bisa lebih
// dari 1 (beberapa SO nunggu bareng), jadi dibikin rapi: maks 3 baris, sisanya
// diringkes "+N lainnya" biar popup gak berantakan kepanjangan.
function _formatPlanningList(sku) {
  var list = _planningBySku[sku] || [];
  if (!list.length) return '';
  var sorted = list.slice().sort(function(a,b){ return (b.tanggal||'').localeCompare(a.tanggal||''); });
  var shown = sorted.slice(0, 3);
  var rowsHtml = shown.map(function(p) {
    var isLong = p.tier === 'gt24';
    return '<div style="display:flex;justify-content:space-between;gap:8px;font-size:10px;color:#cbd5e0;">' +
      '<span>SO ' + _esc(p.noSo || '-') + '</span>' +
      '<span' + (isLong ? ' style="color:#fc8181;font-weight:700;"' : '') + '>' + _esc(_fmtTglShort(p.tanggal)) + '</span>' +
    '</div>';
  }).join('');
  var more = sorted.length > 3 ? '<div style="font-size:9px;color:#718096;margin-top:1px;">+' + (sorted.length-3) + ' SO lainnya</div>' : '';
  return '<div style="margin-top:4px;padding-top:4px;border-top:1px dashed rgba(255,255,255,.15);">' +
    '<div style="font-size:9px;color:#718096;text-transform:uppercase;margin-bottom:2px;">Planning outstanding</div>' +
    rowsHtml + more +
  '</div>';
}

// ── Popup detail 1 bin spesifik ──
function _showBinPopup(binCode) {
  var raw = _binRawRef[binCode] || [];
  var cap = _binCapRef[binCode] || 0;
  var usedUnits = raw.reduce(function(s, r){ return s + (r.palletNum||0) + (r.pecahanCount||0); }, 0);
  if (!_popupEl) return;
  var itemsHtml = '<div style="opacity:.6;font-size:12px;">Kosong</div>';
  if (raw.length) {
    itemsHtml = raw.map(function(r) {
      var bits = [];
      if (r.reservedKarton > 0)  bits.push('<span style="color:#f6ad55;">Reserved ' + r.reservedKarton.toLocaleString('id-ID') + '</span>');
      if (r.availableKarton > 0) bits.push('<span style="color:#68d391;">Available ' + r.availableKarton.toLocaleString('id-ID') + '</span>');
      var pltBits = [];
      if (r.palletNum)    pltBits.push(r.palletNum + ' pallet');
      if (r.pecahanCount) pltBits.push(r.pecahanCount + ' pecahan');
      return '<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.12);">' +
        '<div style="font-weight:800;font-size:12.5px;color:#f7fafc;">' + _esc(r.nama || r.sku || '-') + '</div>' +
        '<div style="font-size:11px;color:#cbd5e0;margin-top:2px;">' + _esc(r.sku || '') + ' · ' + (r.karton||0).toLocaleString('id-ID') + ' krt' +
        (r.prodate ? ' · prod. ' + _esc(r.prodate) : '') + '</div>' +
        (pltBits.length ? '<div style="font-size:10px;color:#a0aec0;margin-top:2px;">🔲 ' + pltBits.join(' + ') + '</div>' : '') +
        (bits.length ? '<div style="font-size:10px;margin-top:3px;">' + bits.join(' · ') + '</div>' : '') +
        (r.reservedKarton > 0 ? _formatPlanningList(r.sku) : '') +
      '</div>';
    }).join('');
  }
  _popupTitleEl.textContent = '📍 ' + binCode;
  _popupBodyEl.innerHTML =
    (cap ? '<div style="font-size:11px;color:#a0aec0;margin-bottom:8px;">Kapasitas: ' + usedUnits + '/' + cap + ' slot</div>' : '') +
    '<div style="max-height:260px;overflow-y:auto;">' + itemsHtml + '</div>';
  _revealPopup();
}

function _revealPopup() {
  if (!_popupEl) return;
  _popupEl.classList.remove('show');
  _popupEl.style.display = 'block';
  void _popupEl.offsetWidth;
  _popupEl.classList.add('show');
}

// ── Popup detail 1 blok rak (agregat semua bin A1..A28 dst) ──
function _showRackPopup(letter) {
  var info = _rackInfo[letter];
  if (!info) return;
  var used = 0, reserved = 0, available = 0, itemCount = 0, pallet = 0, pecahan = 0;
  Object.keys(_binRawRef).forEach(function(binCode) {
    if (binCode.indexOf(letter) === 0 && /^\d+$/.test(binCode.slice(letter.length))) {
      var raw = _binRawRef[binCode];
      itemCount += raw.length;
      raw.forEach(function(r) {
        used += r.karton || 0;
        reserved += r.reservedKarton || 0;
        available += r.availableKarton || 0;
        pallet += r.palletNum || 0;
        pecahan += r.pecahanCount || 0;
      });
    }
  });
  if (!_popupEl) return;
  _popupTitleEl.textContent = '📦 BLOK ' + letter;
  _popupBodyEl.innerHTML =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;font-size:12px;">' +
      '<div><span style="color:#a0aec0;">Jumlah row</span><br><b>' + info.rowCount + '</b></div>' +
      '<div><span style="color:#a0aec0;">Level tertinggi</span><br><b>' + info.maxLevel + '</b></div>' +
      '<div><span style="color:#a0aec0;">Depth maksimum</span><br><b>' + info.maxDepth + '</b></div>' +
      '<div><span style="color:#a0aec0;">Segmen</span><br><b>' + info.segCount + (info.segCount>1 ? ' (kedalaman beda)' : '') + '</b></div>' +
      '<div><span style="color:#a0aec0;">Total stock</span><br><b>' + used.toLocaleString('id-ID') + ' krt</b></div>' +
      '<div><span style="color:#a0aec0;">Jumlah item SKU</span><br><b>' + itemCount + '</b></div>' +
      '<div><span style="color:#a0aec0;">Total pallet</span><br><b>🔲 ' + pallet.toLocaleString('id-ID') + ' plt' + (pecahan ? ' + ' + pecahan.toLocaleString('id-ID') + ' pcs' : '') + '</b></div>' +
      '<div><span style="color:#f6ad55;">Reserved</span><br><b>' + reserved.toLocaleString('id-ID') + ' krt</b></div>' +
      '<div><span style="color:#68d391;">Available</span><br><b>' + available.toLocaleString('id-ID') + ' krt</b></div>' +
    '</div>';
  _revealPopup();
}
function _closePopup() {
  if (!_popupEl) return;
  _popupEl.classList.remove('show');
  setTimeout(function(){ if (!_popupEl.classList.contains('show')) _popupEl.style.display = 'none'; }, 160);
}

function _selectRack(letter) {
  if (_selectedLetter === letter) return;
  _selectedLetter = letter;
  _setHighlight(letter);
  _zoomToRack(letter);
  _closePopup();
}
function _deselectRack() {
  _selectedLetter = null;
  _setHighlight(null);
  _closePopup();
}

// ── Preset kamera (viewcube) — window.mekRv3d* dipanggil dari tombol di index.html ──
var _presetDirs = {
  top:   { x: -0.0001, y: 1,    z: 0  },
  front: { x: -1,      y: 0,    z: 0  },
  back:  { x: 1,       y: 0,    z: 0  },
  left:  { x: 0,       y: 0,    z: 1  },
  right: { x: 0,       y: 0,    z: -1 },
  iso:   { x: 1,       y: 0.85, z: 1  }
};
var _presetDist = 220;
var _isoRotIndex = 0;
var _isoDirs = [
  { x: 1,  y: 0.85, z: 1  }, { x: 1,  y: 0.85, z: -1 },
  { x: -1, y: 0.85, z: -1 }, { x: -1, y: 0.85, z: 1  }
];
function _animateToDir(dir) {
  if (!dir || !_camera || !_controls) return;
  var len = Math.sqrt(dir.x*dir.x + dir.y*dir.y + dir.z*dir.z);
  var c = _sceneCenter;
  var fromTarget = _controls.target.clone();
  var toTarget   = { x: c.x, y: c.y, z: c.z };
  var fromOffset = { x: _camera.position.x - fromTarget.x, y: _camera.position.y - fromTarget.y, z: _camera.position.z - fromTarget.z };
  var toOffset   = { x: (dir.x/len) * _presetDist, y: (dir.y/len) * _presetDist, z: (dir.z/len) * _presetDist };
  _viewAnim = {
    fromTarget: fromTarget, toTarget: toTarget,
    fromSph: _toSpherical(fromOffset), toSph: _toSpherical(toOffset),
    fromZoom: _camera.zoom, toZoom: 1,
    start: performance.now(), dur: 500
  };
}
window.mekRv3dPresetView = function(view) {
  if (view === 'iso') _isoRotIndex = 0;
  _animateToDir(_presetDirs[view]);
};
window.mekRv3dRotateIso = function() {
  _isoRotIndex = (_isoRotIndex + 1) % 4;
  _animateToDir(_isoDirs[_isoRotIndex]);
};
window.mekRv3dResetView = function() {
  _deselectRack();
  if (!_camInitialized || !_initialCamPos) return;
  var fromTarget = _controls.target.clone();
  var toTarget   = _initialTarget.clone();
  var fromOffset = { x: _camera.position.x - fromTarget.x, y: _camera.position.y - fromTarget.y, z: _camera.position.z - fromTarget.z };
  var toOffset   = { x: _initialCamPos.x - toTarget.x, y: _initialCamPos.y - toTarget.y, z: _initialCamPos.z - toTarget.z };
  _viewAnim = {
    fromTarget: fromTarget, toTarget: toTarget,
    fromSph: _toSpherical(fromOffset), toSph: _toSpherical(toOffset),
    fromZoom: _camera.zoom, toZoom: 1,
    start: performance.now(), dur: 500
  };
};
var _initialCamPos = null, _initialTarget = null;

function _initScene() {
  if (_initDone) return;
  _canvas       = document.getElementById('mekRv3dCanvas');
  _tooltipEl    = document.getElementById('mekRv3dTooltip');
  _popupEl      = document.getElementById('mekRv3dPopup');
  _popupTitleEl = document.getElementById('mekRv3dPopupTitle');
  _popupBodyEl  = document.getElementById('mekRv3dPopupBody');
  _viewcubeEl   = document.getElementById('mekRv3dViewcube');
  if (!_canvas) return;

  _scene = new THREE.Scene();
  _scene.background = new THREE.Color(0xf3f4f6);

  _camera = new THREE.OrthographicCamera(-1,1,1,-1,1,5000);
  _renderer = new THREE.WebGLRenderer({ canvas: _canvas, antialias: true });
  _renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  function resize() {
    var w = _canvas.clientWidth || 600, h = _canvas.clientHeight || 360;
    _renderer.setSize(w, h, false);
    var aspect = w/h, viewSize = 32;
    _camera.left = -viewSize*aspect; _camera.right = viewSize*aspect;
    _camera.top = viewSize; _camera.bottom = -viewSize;
    _camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  _resizeFn = resize;
  _camera.position.set(50,45,70);

  _controls = new OrbitControls(_camera, _renderer.domElement);
  _controls.target.set(20,0,15);
  _controls.enableDamping = true;
  _controls.minPolarAngle = 0.05;
  _controls.maxPolarAngle = Math.PI * 0.5;
  _controls.addEventListener('start', function() { _viewAnim = null; });

  _scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  var dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
  dirLight.position.set(30,50,20);
  _scene.add(dirLight);

  resize();
  _setupInteraction(_canvas);

  var lastT = performance.now();
  function animate() {
    requestAnimationFrame(animate);
    if (_viewAnim) {
      if (_controls.enabled) _controls.enabled = false;
      var a = _viewAnim;
      var t = (performance.now() - a.start) / a.dur;
      if (t >= 1) t = 1;
      var e = _easeInOut(t);
      var curTarget = {
        x: a.fromTarget.x + (a.toTarget.x - a.fromTarget.x) * e,
        y: a.fromTarget.y + (a.toTarget.y - a.fromTarget.y) * e,
        z: a.fromTarget.z + (a.toTarget.z - a.fromTarget.z) * e
      };
      var curSph = {
        radius: a.fromSph.radius + (a.toSph.radius - a.fromSph.radius) * e,
        theta:  _shortestAngleLerp(a.fromSph.theta, a.toSph.theta, e),
        phi:    a.fromSph.phi + (a.toSph.phi - a.fromSph.phi) * e
      };
      var offset = _fromSpherical(curSph);
      _camera.position.set(curTarget.x + offset.x, curTarget.y + offset.y, curTarget.z + offset.z);
      _controls.target.set(curTarget.x, curTarget.y, curTarget.z);
      if (a.fromZoom != null && a.toZoom != null) {
        _camera.zoom = a.fromZoom + (a.toZoom - a.fromZoom) * e;
        _camera.updateProjectionMatrix();
      }
      if (t >= 1) { _viewAnim = null; _controls.enabled = true; }
    }
    if (_controls) _controls.update();
    if (_renderer && _scene && _camera) _renderer.render(_scene, _camera);
  }
  _initDone = true;
  animate();
}
var _resizeFn = null;

// ── Setup raycaster buat hover (tooltip) & klik (pilih blok / bin) ──
function _setupInteraction(canvas) {
  if (_eventsBound) return;
  _eventsBound = true;
  _raycaster = new THREE.Raycaster();
  _pointer = new THREE.Vector2();

  if (_popupEl) {
    var closeBtn = document.getElementById('mekRv3dPopupCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', function(ev){ ev.stopPropagation(); _closePopup(); });
  }
  document.addEventListener('click', function(e) {
    if (!_popupEl || _popupEl.style.display !== 'block') return;
    if (_popupEl.contains(e.target)) return;
    if (canvas.contains(e.target)) return;
    _closePopup();
  });

  function pickRackTarget(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    _pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    _raycaster.setFromCamera(_pointer, _camera);

    var bestBin = null;
    _highlightRegistry.forEach(function(entry) {
      if (!entry.binCodes) return;
      var hits = _raycaster.intersectObject(entry.mesh, false);
      if (hits.length && hits[0].instanceId != null) {
        var binCode = entry.binCodes[hits[0].instanceId];
        if (binCode && (!bestBin || hits[0].distance < bestBin.distance)) {
          bestBin = { letter: entry.letters[hits[0].instanceId], binCode: binCode, distance: hits[0].distance };
        }
      }
    });
    if (bestBin) return bestBin;

    var labelHits = _raycaster.intersectObjects(_scene.children, true);
    for (var i = 0; i < labelHits.length; i++) {
      var obj = labelHits[i].object;
      if (obj.userData && obj.userData.type === 'blockLabel') return { letter: obj.userData.letter, binCode: null };
      if (obj.userData && obj.userData.type === 'tbinLabel') return { letter: null, binCode: obj.userData.label, isTBin: true };
    }

    if (_tBinHitGroup) {
      var tbHits = _raycaster.intersectObjects(_tBinHitGroup.children, false);
      if (tbHits.length) return { letter: null, binCode: tbHits[0].object.userData.label, isTBin: true };
    }

    if (_hitboxGroup) {
      var hbHits = _raycaster.intersectObjects(_hitboxGroup.children, false);
      if (hbHits.length) return { letter: hbHits[0].object.userData.letter, binCode: null };
    }
    return null;
  }

  function formatBinTooltip(binCode) {
    var raw = _binRawRef[binCode] || [];
    var cap = _binCapRef[binCode] || 0;
    var used = raw.reduce(function(s, r){ return s + (r.karton||0); }, 0);
    var html = '<div style="font-weight:800;margin-bottom:3px;">' + binCode + (cap ? ' · ' + used + '/' + cap + ' krt' : '') + '</div>';
    if (raw.length) {
      html += raw.slice(0, 4).map(function(r) {
        var pltBits = [];
        if (r.palletNum)    pltBits.push(r.palletNum + ' plt');
        if (r.pecahanCount) pltBits.push(r.pecahanCount + ' pcs');
        var pltStr = pltBits.length ? ' <span style="opacity:.7;">(' + pltBits.join(' + ') + ')</span>' : '';
        return '<div style="display:flex;justify-content:space-between;gap:10px;"><span>' + _esc(r.nama || r.sku || '') + '</span><span style="font-weight:800;white-space:nowrap;">' + (r.karton||0).toLocaleString('id-ID') + ' krt' + pltStr + '</span></div>';
      }).join('');
      if (raw.length > 4) html += '<div style="opacity:.7;font-size:10px;">+' + (raw.length-4) + ' lainnya…</div>';
    } else {
      html += '<div style="opacity:.7;">Kosong</div>';
    }
    return html;
  }

  var _lastHoverCheck = 0;
  canvas.addEventListener('mousemove', function(e) {
    var now = performance.now();
    if (now - _lastHoverCheck < 60) return;
    _lastHoverCheck = now;
    if (!_camera || !_scene || !_tooltipEl) return;
    var rect = canvas.getBoundingClientRect();
    var target = pickRackTarget(e.clientX, e.clientY);
    if (target && target.isTBin) {
      _tooltipEl.innerHTML = formatBinTooltip(target.binCode);
      _tooltipEl.style.left = (e.clientX - rect.left + 14) + 'px';
      _tooltipEl.style.top  = (e.clientY - rect.top + 10) + 'px';
      _tooltipEl.style.display = 'block';
    } else if (target && target.letter && _selectedLetter && target.letter === _selectedLetter) {
      if (target.binCode) {
        _tooltipEl.innerHTML = formatBinTooltip(target.binCode);
      } else {
        var info = _rackInfo[target.letter];
        _tooltipEl.innerHTML = '<b>BLOK ' + target.letter + '</b> · ' + (info ? info.rowCount + ' row · depth ' + info.maxDepth + ' · level ' + info.maxLevel : '');
      }
      _tooltipEl.style.left = (e.clientX - rect.left + 14) + 'px';
      _tooltipEl.style.top  = (e.clientY - rect.top + 10) + 'px';
      _tooltipEl.style.display = 'block';
    } else {
      _tooltipEl.style.display = 'none';
    }
    canvas.style.cursor = target ? 'pointer' : '';
  });
  canvas.addEventListener('mouseleave', function() { if (_tooltipEl) _tooltipEl.style.display = 'none'; });

  canvas.addEventListener('click', function(e) {
    if (!_camera || !_scene) return;
    var target = pickRackTarget(e.clientX, e.clientY);
    var popupOpen = _popupEl && _popupEl.style.display === 'block';

    if (!target || (!target.letter && !target.isTBin)) {
      if (popupOpen) { _closePopup(); }
      else if (_selectedLetter) { window.mekRv3dResetView(); }
      return;
    }
    if (target.isTBin) { _showBinPopup(target.binCode); return; }
    if (!_selectedLetter) { _selectRack(target.letter); }
    else if (target.letter !== _selectedLetter) { _selectRack(target.letter); }
    else if (target.binCode) { _showBinPopup(target.binCode); }
    else if (popupOpen) { _closePopup(); }
    else { window.mekRv3dResetView(); }
  });
}

// ── Bangun ulang scene (rak + kubus + bin T + jalur + outline) dari data
// yang lagi aktif — dipanggil tiap kali data reservasi di-refresh. ──
function _buildScene(cells, longWaitBins, groups) {
  var THREE_ = THREE;
  while (_scene.children.length) _scene.remove(_scene.children[0]);
  _scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  var dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
  dirLight.position.set(30,50,20);
  _scene.add(dirLight);

  if (!groups || !groups.length) return false;
  var LAYOUT_ORDER = LAYOUT_LETTERS.filter(function(l){ return groups.some(function(g){ return g.bin === l; }); });
  if (!LAYOUT_ORDER.length) return false;

  function maxDepth(l){ var s=groups.filter(function(g){return g.bin===l;}); return s.length?Math.max.apply(null,s.map(function(x){return x.depth;})):0; }
  function maxLevel(l){ var s=groups.filter(function(g){return g.bin===l;}); return s.length?Math.max.apply(null,s.map(function(x){return x.level;})):0; }

  // ── Bangun binRaw/binAgg/binSlots dari cells — logikanya sama persis
  // dengan _mekAktual3dBuildBinMap di monitoringekspor.js: 1 baris stock
  // dipecah proporsional jadi bagian reserved (oranye/merah) & available
  // (hijau) berdasar jumlah slot fisik (pallet+pecahan) baris itu. ──
  _binRawRef = {}; _binAggRef = {}; _binCapRef = {};
  var binSlots = {}; // binCode -> [{units,color}]
  (cells || []).forEach(function(c) {
    var bin = c.binLoc; if (!bin) return;
    if (!_binRawRef[bin]) _binRawRef[bin] = [];
    _binRawRef[bin].push({ sku:c.sku, nama:c.nama, karton:c.karton||0, reservedKarton:c.reservedKarton||0, availableKarton:c.availableKarton||0, prodate:c.prodate, tipe:c.tipe, palletNum:c.palletNum||0, pecahanCount:c.pecahanCount||0 });
    if (!_binAggRef[bin]) _binAggRef[bin] = { totalKarton:0, totalReserved:0, totalAvailable:0 };
    _binAggRef[bin].totalKarton    += c.karton || 0;
    _binAggRef[bin].totalReserved  += c.reservedKarton || 0;
    _binAggRef[bin].totalAvailable += c.availableKarton || 0;

    var units = (c.palletNum||0) + (c.pecahanCount||0);
    if (units <= 0 && c.karton > 0) units = 1;
    if (units <= 0) return;
    var karton = c.karton || 0;
    var reservedKarton = Math.min(c.reservedKarton||0, karton);
    var reservedUnits = karton > 0 ? Math.round(units * (reservedKarton / karton)) : 0;
    if (reservedUnits > units) reservedUnits = units;
    if (reservedUnits < 0) reservedUnits = 0;
    var availableUnits = units - reservedUnits;
    var isLongWait = !!(longWaitBins && longWaitBins[bin]);
    if (!binSlots[bin]) binSlots[bin] = [];
    if (reservedUnits > 0)  binSlots[bin].push({ units: reservedUnits,  color: isLongWait ? COLOR_LONGWAIT : COLOR_WAITING });
    if (availableUnits > 0) binSlots[bin].push({ units: availableUnits, color: COLOR_AVAILABLE });
  });

  _boxesGroup = new THREE.Group(); _framesGroup = new THREE.Group(); _floorGroup = new THREE.Group();
  _scene.add(_boxesGroup, _framesGroup, _floorGroup);

  var rackMeta = {}, cursor = 0;
  LAYOUT_ORDER.forEach(function(l, idx) {
    var depth = maxDepth(l);
    if (idx>0) { var g = GAP_AFTER[LAYOUT_ORDER[idx-1]]||'aisle'; cursor += g==='aisle'?AISLE_GAP:BACK_GAP; }
    rackMeta[l] = { start: cursor, depth: depth };
    cursor += depth;
  });
  var globalMaxZ = cursor;
  var globalMaxX = Math.max.apply(null, LAYOUT_ORDER.map(function(l) {
    var s = groups.filter(function(g){return g.bin===l;});
    var o = Math.min.apply(null, s.map(function(x){return x.rowFrom;}));
    var nxRaw = Math.max.apply(null, s.map(function(x){return x.rowTo - o + 1;}));
    var extra = (l === 'G' ? (s.length-1)*4.5 : 0) + (l === 'I' ? 9 : 0);
    return nxRaw + extra;
  }));
  _sceneCenter = { x: globalMaxX/2, y: 6, z: globalMaxZ/2 };
  _sceneSpan = { x: globalMaxX, z: globalMaxZ };
  _rackInfo = {};
  _tBinHitGroup = null;
  _selectedLetter = null;
  _highlightRegistry = [];
  var _white = new THREE.Color(1,1,1);

  var labelsGroup = new THREE.Group();
  _scene.add(labelsGroup);
  LAYOUT_ORDER.forEach(function(l) {
    var s = groups.filter(function(g){return g.bin===l;});
    var o = Math.min.apply(null, s.map(function(x){return x.rowFrom;}));
    var nxRaw = Math.max.apply(null, s.map(function(x){return x.rowTo - o + 1;}));
    var iShift = (l === 'I') ? 9 : 0;
    var label = _makeLabelSprite('BLOK ' + l);
    var cx = nxRaw/2 + iShift, cz = rackMeta[l].start + maxDepth(l)/2;
    label.position.set(cx, maxLevel(l) + 2.5, cz);
    label.userData = { type: 'blockLabel', letter: l };
    labelsGroup.add(label);
    _rackInfo[l] = {
      cx: cx, cz: cz, x0: 0, x1: nxRaw + iShift,
      z0: rackMeta[l].start, z1: rackMeta[l].start + maxDepth(l),
      maxLevel: maxLevel(l), maxDepth: maxDepth(l), rowCount: nxRaw, segCount: s.length
    };
  });

  var hitboxGroup = new THREE.Group();
  _scene.add(hitboxGroup);
  _hitboxGroup = hitboxGroup;
  LAYOUT_ORDER.forEach(function(l) {
    var info = _rackInfo[l];
    var w = info.x1 - info.x0, d = info.z1 - info.z0, h = info.maxLevel + 1;
    var hitMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
    hitMesh.position.set(info.x0 + w/2, h/2, info.z0 + d/2);
    hitMesh.userData = { type: 'blockHitbox', letter: l };
    hitboxGroup.add(hitMesh);
  });

  var floorPad = 3;
  var floorGeo = new THREE.PlaneGeometry(globalMaxX + floorPad*2, globalMaxZ + floorPad*2);
  var floorMat = new THREE.MeshBasicMaterial({ color: 0xdde3ea, side: THREE.DoubleSide });
  var floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI/2;
  floorMesh.position.set(globalMaxX/2, 0, globalMaxZ/2);
  _floorGroup.add(floorMesh);

  var outlineLinePts = [];
  for (var oi = 0; oi < OUTLINE_CORNERS.length; oi++) {
    var ocA = OUTLINE_CORNERS[oi], ocB = OUTLINE_CORNERS[(oi + 1) % OUTLINE_CORNERS.length];
    outlineLinePts.push(ocA.x, 0.02, ocA.z, ocB.x, 0.02, ocB.z);
  }
  var outlineGeo = new THREE.BufferGeometry();
  outlineGeo.setAttribute('position', new THREE.Float32BufferAttribute(outlineLinePts, 3));
  _floorGroup.add(new THREE.LineSegments(outlineGeo, new THREE.LineBasicMaterial({ color: 0x1e3a8a })));

  var dockLabel = _makeLabelSprite('🚚 LOADING DOCK', { canvasW: 420, canvasH: 110, fontPx: 42, scale: [11, 3, 1] });
  dockLabel.position.set(-floorPad - 9, 6, globalMaxZ/2);
  labelsGroup.add(dockLabel);

  var PALLET_COLOR = 0x946d1c;
  var dummy = new THREE.Object3D();
  var mtx = new THREE.Matrix4();
  var identityQuat = new THREE.Quaternion();
  var boxData = [];
  var postData = [];

  var walkMat = new THREE.MeshBasicMaterial({ color: 0x127453, side: THREE.DoubleSide });
  var walkBorderMat = new THREE.LineBasicMaterial({ color: 0xfacc15 });
  function addWalkStrip(cx, cz, w, d) {
    var g = new THREE.PlaneGeometry(w, d);
    var mesh = new THREE.Mesh(g, walkMat);
    mesh.rotation.x = -Math.PI/2;
    mesh.position.set(cx, 0.005, cz);
    _floorGroup.add(mesh);
    var bx0=cx-w/2, bx1=cx+w/2, bz0=cz-d/2, bz1=cz+d/2;
    var bPts = [ bx0,0.01,bz0, bx1,0.01,bz0, bx1,0.01,bz0, bx1,0.01,bz1, bx1,0.01,bz1, bx0,0.01,bz1, bx0,0.01,bz1, bx0,0.01,bz0 ];
    var bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute(bPts, 3));
    _floorGroup.add(new THREE.LineSegments(bg, walkBorderMat));
  }
  WALK_STRIPS.forEach(function(s) { addWalkStrip(s.cx, s.cz, s.w, s.d); });

  // ── Bin tambahan (T1-T36) ──
  function addTBin(label, cx, cz, w, d) {
    var bx0 = cx-w/2, bx1 = cx+w/2, bz0 = cz-d/2, bz1 = cz+d/2;
    var bPts = [ bx0,0.01,bz0, bx1,0.01,bz0, bx1,0.01,bz0, bx1,0.01,bz1, bx1,0.01,bz1, bx0,0.01,bz1, bx0,0.01,bz1, bx0,0.01,bz0 ];
    var bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute(bPts, 3));
    _floorGroup.add(new THREE.LineSegments(bg, new THREE.LineBasicMaterial({ color: 0xfacc15 })));

    var slots = binSlots[label];
    var hasItems = slots && slots.length > 0;
    var maxLayerSeen = 0;

    if (hasItems) {
      var slotsX = Math.max(1, Math.round(w));
      var slotsZ = Math.max(1, Math.round(d));
      var order = [];
      for (var sz = 0; sz < slotsZ; sz++) for (var sx = 0; sx < slotsX; sx++) order.push([sx, sz]);
      var slotCount = order.length;
      var slotPtr = 0;
      var LAYER_H = 0.92;
      var palletMat = new THREE.MeshStandardMaterial({ color: PALLET_COLOR, roughness: 0.8 });
      var thx=0.43, thy=0.4, thz=0.43;
      var tCorners = [ [-thx,-thy,-thz],[thx,-thy,-thz],[thx,thy,-thz],[-thx,thy,-thz], [-thx,-thy, thz],[thx,-thy, thz],[thx,thy, thz],[-thx,thy, thz] ];
      var tEdgeIdx = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
      var tBoxLinePts = [];
      slots.forEach(function(subItem) {
        var units = subItem.units;
        var colorInt = parseInt(subItem.color.replace('#','0x'));
        var itemMat = new THREE.MeshStandardMaterial({ color: colorInt, roughness: 0.6 });
        for (var u = 0; u < units; u++, slotPtr++) {
          var slotIdx = slotPtr % slotCount;
          var layer   = Math.floor(slotPtr / slotCount);
          if (layer > maxLayerSeen) maxLayerSeen = layer;
          var yOff = layer * LAYER_H;
          var boxX = bx0 + order[slotIdx][0] + 0.5;
          var boxZ = bz0 + order[slotIdx][1] + 0.5;
          var boxMesh = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.8, 0.86), itemMat);
          boxMesh.position.set(boxX, 0.5 + 0.06 + yOff, boxZ);
          _framesGroup.add(boxMesh);
          var pMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.9), palletMat);
          pMesh.position.set(boxX, 0.06 + yOff, boxZ);
          _framesGroup.add(pMesh);

          var tcx=boxX, tcy=0.5+0.06+yOff, tcz=boxZ;
          tEdgeIdx.forEach(function(e) {
            var p1=tCorners[e[0]], p2=tCorners[e[1]];
            tBoxLinePts.push(tcx+p1[0], tcy+p1[1], tcz+p1[2],  tcx+p2[0], tcy+p2[1], tcz+p2[2]);
          });
          [0.12,0.4,0.68].forEach(function(t) {
            var yy = -thy + t*2*thy;
            tBoxLinePts.push(tcx+thx, tcy+yy, tcz-thz,  tcx+thx, tcy+yy, tcz+thz);
            tBoxLinePts.push(tcx-thx, tcy+yy, tcz+thz,  tcx+thx, tcy+yy, tcz+thz);
          });
          tBoxLinePts.push(tcx+thx, tcy-thy, tcz,  tcx+thx, tcy+thy, tcz);
          tBoxLinePts.push(tcx,     tcy-thy, tcz+thz,  tcx, tcy+thy, tcz+thz);
          [1/3, 2/3].forEach(function(t) {
            var zz = -thz + t*2*thz;
            tBoxLinePts.push(tcx-thx, tcy+thy, tcz+zz,  tcx+thx, tcy+thy, tcz+zz);
            var xx = -thx + t*2*thx;
            tBoxLinePts.push(tcx+xx, tcy+thy, tcz-thz,  tcx+xx, tcy+thy, tcz+thz);
          });
        }
      });
      if (tBoxLinePts.length) {
        var tBoxLineGeo = new THREE.BufferGeometry();
        tBoxLineGeo.setAttribute('position', new THREE.Float32BufferAttribute(tBoxLinePts, 3));
        _framesGroup.add(new THREE.LineSegments(tBoxLineGeo, new THREE.LineBasicMaterial({ color: 0x000000, transparent:true, opacity:0.55 })));
      }
      if (maxLayerSeen > 0) {
        var stackLbl = _makeLabelSprite('×' + (maxLayerSeen + 1) + ' tumpuk', { canvasW: 90, canvasH: 40, fontPx: 18, scale: [1.4, 0.7, 1], bg: 'rgba(220,38,38,0.9)', border: 'rgba(255,255,255,0.7)' });
        stackLbl.position.set(cx, 0.9 + (maxLayerSeen + 1) * LAYER_H, cz);
        labelsGroup.add(stackLbl);
      }
    }

    var lbl = _makeLabelSprite(label, { canvasW: 100, canvasH: 50, fontPx: 22, scale: [1.8, 0.9, 1], bg: 'rgba(120,80,30,0.85)', border: 'rgba(255,255,255,0.6)' });
    lbl.position.set(cx, hasItems ? 1.6 : 0.5, cz);
    lbl.userData = { type: 'tbinLabel', label: label };
    labelsGroup.add(lbl);

    if (!_tBinHitGroup) { _tBinHitGroup = new THREE.Group(); _scene.add(_tBinHitGroup); }
    var tHitMesh = new THREE.Mesh(new THREE.BoxGeometry(w, 2.2, d), new THREE.MeshBasicMaterial({ visible: false }));
    tHitMesh.position.set(cx, 1.1, cz);
    tHitMesh.userData = { type: 'tbinHitbox', label: label };
    _tBinHitGroup.add(tHitMesh);
  }
  T_BIN_POSITIONS.forEach(function(t) { addTBin(t.label, t.cx, t.cz, t.w, t.d); });

  if (_controls) _controls.target.set(globalMaxX/2, 0, globalMaxZ/2);

  function gFrontAlignOffset(letter, segsArr, seg) {
    if (letter !== 'G' || seg.rowFrom < 26) return 0;
    var mainSeg = segsArr.filter(function(s){ return s.rowFrom < 26; })[0];
    var mainDepth = mainSeg ? mainSeg.depth : seg.depth;
    return Math.max(0, mainDepth - seg.depth);
  }
  function isMir(l){ return MIRRORED.indexOf(l) !== -1; }

  var shadowInstances = [];
  LAYOUT_ORDER.forEach(function(letter) {
    var segs = groups.filter(function(g){return g.bin===letter;});
    var origin = Math.min.apply(null, segs.map(function(s){return s.rowFrom;}));
    var maxRow = Math.max.apply(null, segs.map(function(s){return s.rowTo;}));
    var nx = maxRow - origin + 1;
    var zBase = rackMeta[letter].start;
    var rackDepth = maxDepth(letter);
    var SEG_GAP = 4.5;
    var xGapOffset = 0, prevSeg = null;
    var positions = [];
    for (var xi=0; xi<nx; xi++) {
      var rowNum = origin + xi;
      var seg = segs.find(function(s){return rowNum>=s.rowFrom && rowNum<=s.rowTo;});
      if (!seg) continue;
      if (letter === 'G' && prevSeg && prevSeg !== seg) xGapOffset += SEG_GAP;
      prevSeg = seg;
      positions.push({ sx: xi + xGapOffset, seg: seg });
    }
    positions.forEach(function(p) {
      var iShift = (letter === 'I') ? 9 : 0;
      var finalX = p.sx + iShift;
      var seg = p.seg;
      var ny = seg.depth, nz = seg.level;
      var iBackAlign = (letter === 'I' && seg.rowFrom >= 28);
      var zBaseEff = iBackAlign ? (zBase + (rackDepth - ny)) : (zBase + gFrontAlignOffset(letter, segs, seg));
      postData.push({ x: finalX,   zBase: zBaseEff, depth: ny, levels: nz, letter: letter });
      postData.push({ x: finalX+1, zBase: zBaseEff, depth: ny, levels: nz, letter: letter });
      shadowInstances.push({ x: finalX, z: zBaseEff, depth: ny });
    });
  });

  if (shadowInstances.length) {
    var shadowMat = new THREE.MeshBasicMaterial({ color: 0x4b5058, side: THREE.DoubleSide, transparent: true, opacity: 0.55 });
    var shadowGeo = new THREE.PlaneGeometry(1, 1);
    var shadowQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2, 0, 0));
    var shadowMesh = new THREE.InstancedMesh(shadowGeo, shadowMat, shadowInstances.length);
    shadowInstances.forEach(function(si, i) {
      mtx.compose(new THREE.Vector3(si.x + 0.5, 0.004, si.z + si.depth/2), shadowQuat, new THREE.Vector3(1, si.depth, 1));
      shadowMesh.setMatrixAt(i, mtx);
    });
    _floorGroup.add(shadowMesh);
  }

  LAYOUT_ORDER.forEach(function(letter) {
    var segs = groups.filter(function(g){return g.bin===letter;});
    var origin = Math.min.apply(null, segs.map(function(s){return s.rowFrom;}));
    var maxRow = Math.max.apply(null, segs.map(function(s){return s.rowTo;}));
    var nx = maxRow - origin + 1;
    var zBase = rackMeta[letter].start;
    var rackDepth = maxDepth(letter);
    var SEG_GAP = 4.5;
    var xGapOffset = 0, prevSeg = null;
    for (var xi=0; xi<nx; xi++) {
      var rowNum = origin + xi;
      var seg = segs.find(function(s){return rowNum>=s.rowFrom && rowNum<=s.rowTo;});
      if (!seg) continue;
      if (letter === 'G' && prevSeg && prevSeg !== seg) xGapOffset += SEG_GAP;
      prevSeg = seg;
      var iShift = (letter === 'I') ? 9 : 0;
      var finalX = xi + xGapOffset + iShift;
      var ny = seg.depth, nz = seg.level;
      var iBackAlign = (letter === 'I' && seg.rowFrom >= 28);
      var zBaseEff = iBackAlign ? (zBase + (rackDepth - ny)) : (zBase + gFrontAlignOffset(letter, segs, seg));
      var binCode = letter + rowNum;
      var slots = binSlots[binCode];
      if (!slots || !slots.length) continue;
      _binCapRef[binCode] = ny * nz;
      var order = [];
      for (var z=nz-1; z>=0; z--) for (var y=ny-1; y>=0; y--) order.push([y,z]);
      var slotPtr = 0;
      slots.forEach(function(subItem) {
        var units = subItem.units;
        var colorInt = parseInt(subItem.color.replace('#','0x'));
        for (var u=0; u<units && slotPtr<order.length; u++, slotPtr++) {
          var depthIdx = isMir(letter) ? (ny-1-order[slotPtr][0]) : order[slotPtr][0];
          boxData.push({ x: finalX, y: order[slotPtr][1], z: zBaseEff+depthIdx, color: colorInt, letter: letter, binCode: binCode });
        }
      });
    }
  });

  var postGeo = new THREE.BoxGeometry(0.06, 1, 0.06);
  var postMat = new THREE.MeshBasicMaterial({ color: 0x1e3a8a });
  var postInstances = [];
  postData.forEach(function(p) {
    postInstances.push({ x:p.x, z:p.zBase, h:p.levels, letter:p.letter });
    postInstances.push({ x:p.x, z:p.zBase+p.depth, h:p.levels, letter:p.letter });
  });
  var postMesh = new THREE.InstancedMesh(postGeo, postMat, postInstances.length || 1);
  postInstances.forEach(function(pi, i) {
    mtx.compose(new THREE.Vector3(pi.x, pi.h/2, pi.z), identityQuat, new THREE.Vector3(1, pi.h, 1));
    postMesh.setMatrixAt(i, mtx);
    postMesh.setColorAt(i, _white);
  });
  if (postMesh.instanceColor) postMesh.instanceColor.needsUpdate = true;
  _framesGroup.add(postMesh);
  _highlightRegistry.push({ mesh: postMesh, letters: postInstances.map(function(pi){ return pi.letter; }) });

  var beamInstances = [];
  LAYOUT_ORDER.forEach(function(letter) {
    var segs = groups.filter(function(g){return g.bin===letter;});
    var origin = Math.min.apply(null, segs.map(function(s){return s.rowFrom;}));
    var maxRow = Math.max.apply(null, segs.map(function(s){return s.rowTo;}));
    var nx = maxRow - origin + 1;
    var zBase = rackMeta[letter].start;
    var lvls = maxLevel(letter);
    var rackDepthB = maxDepth(letter);
    var xGapOffsetB = 0, prevSegB = null;
    var posB = [];
    for (var xi2=0; xi2<nx; xi2++) {
      var rowNum2 = origin + xi2;
      var seg2 = segs.find(function(s){return rowNum2>=s.rowFrom && rowNum2<=s.rowTo;});
      if (!seg2) continue;
      if (letter === 'G' && prevSegB && prevSegB !== seg2) xGapOffsetB += 4.5;
      prevSegB = seg2;
      var iBackAlignB = (letter === 'I' && seg2.rowFrom >= 28);
      var zBaseEffB = iBackAlignB ? (zBase + (rackDepthB - seg2.depth)) : (zBase + gFrontAlignOffset(letter, segs, seg2));
      posB.push({ sx: xi2 + xGapOffsetB, depth: seg2.depth, zBaseEff: zBaseEffB });
    }
    posB.forEach(function(p) {
      var iShiftB = (letter === 'I') ? 9 : 0;
      var fx = p.sx + iShiftB;
      for (var lvl2=0; lvl2<=lvls; lvl2++) {
        beamInstances.push({ x:fx,   y:lvl2, z:p.zBaseEff+p.depth/2, depth:p.depth, letter: letter });
        beamInstances.push({ x:fx+1, y:lvl2, z:p.zBaseEff+p.depth/2, depth:p.depth, letter: letter });
      }
    });
  });
  var beamGeo = new THREE.BoxGeometry(0.07, 0.09, 1);
  var beamMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness:0.5 });
  var beamMesh = new THREE.InstancedMesh(beamGeo, beamMat, beamInstances.length || 1);
  beamInstances.forEach(function(bi, i) {
    mtx.compose(new THREE.Vector3(bi.x, bi.y, bi.z), identityQuat, new THREE.Vector3(1,1,bi.depth));
    beamMesh.setMatrixAt(i, mtx);
    beamMesh.setColorAt(i, _white);
  });
  if (beamMesh.instanceColor) beamMesh.instanceColor.needsUpdate = true;
  _framesGroup.add(beamMesh);
  _highlightRegistry.push({ mesh: beamMesh, letters: beamInstances.map(function(bi){ return bi.letter; }) });

  var beamXInstances = [];
  LAYOUT_ORDER.forEach(function(letter) {
    var segs = groups.filter(function(g){return g.bin===letter;});
    var origin = Math.min.apply(null, segs.map(function(s){return s.rowFrom;}));
    var maxRow = Math.max.apply(null, segs.map(function(s){return s.rowTo;}));
    var nx = maxRow - origin + 1;
    var zBase = rackMeta[letter].start;
    var lvls = maxLevel(letter);
    var rackDepthB = maxDepth(letter);
    var xGapOffsetB = 0, prevSegB = null;
    var posB = [];
    for (var xi2=0; xi2<nx; xi2++) {
      var rowNum2 = origin + xi2;
      var seg2 = segs.find(function(s){return rowNum2>=s.rowFrom && rowNum2<=s.rowTo;});
      if (!seg2) continue;
      if (letter === 'G' && prevSegB && prevSegB !== seg2) xGapOffsetB += 4.5;
      prevSegB = seg2;
      var iBackAlignB = (letter === 'I' && seg2.rowFrom >= 28);
      var zBaseEffB = iBackAlignB ? (zBase + (rackDepthB - seg2.depth)) : (zBase + gFrontAlignOffset(letter, segs, seg2));
      posB.push({ sx: xi2 + xGapOffsetB, depth: seg2.depth, zBaseEff: zBaseEffB });
    }
    posB.forEach(function(p) {
      var iShiftB = (letter === 'I') ? 9 : 0;
      var fx = p.sx + iShiftB;
      for (var lvl2=0; lvl2<lvls; lvl2++) {
        for (var d=2; d<=p.depth; d+=2) {
          beamXInstances.push({ x:fx+0.5, y:lvl2, z:p.zBaseEff + d - 0.5, letter: letter });
        }
      }
    });
  });
  var beamXGeo = new THREE.BoxGeometry(1, 0.09, 0.07);
  var beamXMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness:0.5 });
  var beamXMesh = new THREE.InstancedMesh(beamXGeo, beamXMat, beamXInstances.length || 1);
  beamXInstances.forEach(function(bi, i) {
    mtx.compose(new THREE.Vector3(bi.x, bi.y, bi.z), identityQuat, new THREE.Vector3(1,1,1));
    beamXMesh.setMatrixAt(i, mtx);
    beamXMesh.setColorAt(i, _white);
  });
  if (beamXMesh.instanceColor) beamXMesh.instanceColor.needsUpdate = true;
  _framesGroup.add(beamXMesh);
  _highlightRegistry.push({ mesh: beamXMesh, letters: beamXInstances.map(function(bi){ return bi.letter; }) });

  var byColor = {};
  boxData.forEach(function(b){ (byColor[b.color] = byColor[b.color]||[]).push(b); });
  var boxGeo = new THREE.BoxGeometry(0.86, 0.8, 0.86);
  var palletGeo = new THREE.BoxGeometry(0.9, 0.12, 0.9);
  var palletMat = new THREE.MeshStandardMaterial({ color: PALLET_COLOR, roughness:0.8 });
  Object.keys(byColor).forEach(function(colorKey) {
    var arr = byColor[colorKey];
    var mat = new THREE.MeshStandardMaterial({ color: parseInt(colorKey), roughness:0.6 });
    var mesh = new THREE.InstancedMesh(boxGeo, mat, arr.length);
    arr.forEach(function(b, i) {
      dummy.position.set(b.x + 0.5, b.y + 0.5 + 0.06, b.z + 0.5);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, _white);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    _boxesGroup.add(mesh);
    _highlightRegistry.push({ mesh: mesh, letters: arr.map(function(b){ return b.letter; }), binCodes: arr.map(function(b){ return b.binCode; }) });
  });
  if (boxData.length) {
    var palletMesh = new THREE.InstancedMesh(palletGeo, palletMat, boxData.length);
    boxData.forEach(function(b, i) {
      dummy.position.set(b.x + 0.5, b.y + 0.06, b.z + 0.5);
      dummy.updateMatrix();
      palletMesh.setMatrixAt(i, dummy.matrix);
      palletMesh.setColorAt(i, _white);
    });
    if (palletMesh.instanceColor) palletMesh.instanceColor.needsUpdate = true;
    _boxesGroup.add(palletMesh);
    _highlightRegistry.push({ mesh: palletMesh, letters: boxData.map(function(b){ return b.letter; }), binCodes: boxData.map(function(b){ return b.binCode; }) });

    var hx=0.43, hy=0.4, hz=0.43;
    var corners = [ [-hx,-hy,-hz],[hx,-hy,-hz],[hx,hy,-hz],[-hx,hy,-hz], [-hx,-hy, hz],[hx,-hy, hz],[hx,hy, hz],[-hx,hy, hz] ];
    var edgeIdx = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    var boxLinePts = [];
    boxData.forEach(function(b) {
      var cx=b.x+0.5, cy=b.y+0.5+0.06, cz=b.z+0.5;
      edgeIdx.forEach(function(e) {
        var p1=corners[e[0]], p2=corners[e[1]];
        boxLinePts.push(cx+p1[0], cy+p1[1], cz+p1[2],  cx+p2[0], cy+p2[1], cz+p2[2]);
      });
      [0.12,0.4,0.68].forEach(function(t) {
        var yy = -hy + t*2*hy;
        boxLinePts.push(cx+hx, cy+yy, cz-hz,  cx+hx, cy+yy, cz+hz);
        boxLinePts.push(cx-hx, cy+yy, cz+hz,  cx+hx, cy+yy, cz+hz);
      });
      boxLinePts.push(cx+hx, cy-hy, cz,  cx+hx, cy+hy, cz);
      boxLinePts.push(cx,    cy-hy, cz+hz,  cx, cy+hy, cz+hz);
      [1/3, 2/3].forEach(function(t) {
        var zz = -hz + t*2*hz;
        boxLinePts.push(cx-hx, cy+hy, cz+zz,  cx+hx, cy+hy, cz+zz);
        var xx = -hx + t*2*hx;
        boxLinePts.push(cx+xx, cy+hy, cz-hz,  cx+xx, cy+hy, cz+hz);
      });
    });
    var boxLineGeo = new THREE.BufferGeometry();
    boxLineGeo.setAttribute('position', new THREE.Float32BufferAttribute(boxLinePts, 3));
    _boxesGroup.add(new THREE.LineSegments(boxLineGeo, new THREE.LineBasicMaterial({ color: 0x000000, transparent:true, opacity:0.55 })));
  }
  return true;
}

// cells:         [{binLoc, sku, nama, karton, reservedKarton, availableKarton,
//                  palletNum, pecahanCount, prodate, tipe, ...}] dari getMekReservedMap
// longWaitBins:  {binLoc: true} — lokasi yang punya reservasi nunggu >24 jam
// groups:        [{bin, rowFrom, rowTo, level, depth}] dari getMekBinCap3D
// planningBySku: {sku: [{noSo,tanggal,tujuan,tier}]} — planning outstanding per SKU,
//                dipakai popup bin buat nunjukin SO/tanggal (bisa lebih dari 1 per SKU)
window.mekReserved3DRender = function(cells, longWaitBins, groups, planningBySku) {
  _initScene();
  if (!_scene) return;
  _planningBySku = planningBySku || {};
  var loadingEl = document.getElementById('mekRv3dLoading');

  if (!groups || !groups.length) {
    if (loadingEl) {
      loadingEl.style.display = 'flex';
      loadingEl.innerHTML = '<span style="font-size:11px;color:#a0aec0;">Gagal memuat struktur rak (BIN_CAP kosong/gangguan koneksi) — coba tekan <b>Refresh</b>.</span>';
    }
    return;
  }

  var ok = _buildScene(cells, longWaitBins, groups);
  if (loadingEl) loadingEl.style.display = ok ? 'none' : 'flex';
  if (!ok) {
    if (loadingEl) loadingEl.innerHTML = '<span style="font-size:11px;color:#a0aec0;">Belum ada data LEVEL/DEPTH di BIN_CAP kolom I-L</span>';
    return;
  }
  if (_viewcubeEl) _viewcubeEl.style.display = 'grid';

  // Sudut pandang awal — ISO diputar 180° dari ISO biasa ({1,0.85,1} → {-1,0.85,-1}) — SEKALI
  // aja per sesi (bukan tiap kali data di-refresh), biar drag manual user gak ke-reset terus.
  if (!_camInitialized) {
    var initDir = { x: -1, y: 0.85, z: -1 };
    var initLen = Math.sqrt(initDir.x*initDir.x + initDir.y*initDir.y + initDir.z*initDir.z);
    var initDist = Math.max(_sceneSpan.x, _sceneSpan.z, 20) * 1.3;
    var c = _sceneCenter;
    _camera.position.set(c.x + (initDir.x/initLen) * initDist, c.y + (initDir.y/initLen) * initDist, c.z + (initDir.z/initLen) * initDist);
    _controls.target.set(c.x, c.y, c.z);
    _camera.zoom = 1;
    _camera.updateProjectionMatrix();
    _camInitialized = true;
    _initialCamPos = _camera.position.clone();
    _initialTarget = _controls.target.clone();
  }
  if (_resizeFn) _resizeFn();
};
