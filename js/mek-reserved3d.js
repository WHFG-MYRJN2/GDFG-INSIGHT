// ══════════════════════════════════════════════════════════════
// RESERVED VIEW — Peta 3D (Monitoring Ekspor)
// Modul ES (dipanggil dari monitoringekspor.js yang non-module lewat
// window.mekReserved3DRender(cells)). Satu kubus per BinLoc unik, tinggi
// kubus ~ total karton di lokasi itu, warna ngikut status reservasi:
//   hijau  = available (belum di-reserve)
//   oranye = reserved, masih nunggu (<24 jam)
//   merah  = reserved, udah nunggu >24 jam
//   abu    = kosong / gak ada data
//
// CATATAN: ini grid 3D yang disusun dari kode BinLoc yang benar-benar ada
// isinya (bukan replika presisi struktur rak fisik BinLoc yang punya rak
// bertingkat/T-bin dsb — itu butuh data BIN_CAP yang lebih detail lagi).
// Kalau nanti mau posisinya persis samain rak asli, tinggal sambungin ke
// action getMekBinCap3D yang udah disiapin di backend.
// ══════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

var _scene, _camera, _renderer, _controls, _canvas, _tooltipEl;
var _boxesGroup = null;
var _raycaster, _pointer;
var _initDone = false;
var _hoverMeta = {}; // uuid -> {binLoc, items:[{sku,nama,karton,reservedKarton,availableKarton}], totalReserved, totalAvailable}

function _colorForCell(agg) {
  if (agg.totalKarton <= 0) return 0xcbd5e0; // kosong
  if (agg.totalReserved <= 0) return 0x10b981; // available penuh
  return agg.hasLongWait ? 0xef4444 : 0xf59e0b;
}

function _parseBinLoc(binLoc) {
  var s = String(binLoc || '').toUpperCase().trim();
  var m = s.match(/^([A-Z]+)[\s\-]?(\d+)/);
  if (m) return { letter: m[1], num: parseInt(m[2], 10) };
  return { letter: s.charAt(0) || '?', num: 0 };
}

function _initScene() {
  if (_initDone) return;
  _canvas = document.getElementById('mekRv3dCanvas');
  _tooltipEl = document.getElementById('mekRv3dTooltip');
  if (!_canvas) return;

  _scene = new THREE.Scene();
  _scene.background = new THREE.Color(0xf8fafc);

  var w = _canvas.clientWidth || 600, h = _canvas.clientHeight || 360;
  _camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 5000);
  _camera.position.set(60, 70, 90);

  _renderer = new THREE.WebGLRenderer({ canvas: _canvas, antialias: true });
  _renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  _renderer.setSize(w, h, false);

  _controls = new OrbitControls(_camera, _renderer.domElement);
  _controls.target.set(0, 0, 0);
  _controls.enableDamping = true;
  _controls.dampingFactor = 0.08;
  _controls.maxPolarAngle = Math.PI / 2.1;
  _controls.update();

  _scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  var dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(50, 80, 30);
  _scene.add(dir);

  // Lantai
  var floorGeo = new THREE.PlaneGeometry(200, 200);
  var floorMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, side: THREE.DoubleSide });
  var floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = Math.PI / 2;
  floor.position.y = -0.5;
  _scene.add(floor);

  _raycaster = new THREE.Raycaster();
  _pointer = new THREE.Vector2();

  _canvas.addEventListener('pointermove', _onPointerMove);
  _canvas.addEventListener('pointerleave', function(){ if (_tooltipEl) _tooltipEl.style.display = 'none'; });
  window.addEventListener('resize', _onResize);

  _initDone = true;
  _animate();
}

function _onResize() {
  if (!_canvas || !_renderer || !_camera) return;
  var w = _canvas.clientWidth || 600, h = _canvas.clientHeight || 360;
  _renderer.setSize(w, h, false);
  _camera.aspect = w / h;
  _camera.updateProjectionMatrix();
}

function _onPointerMove(ev) {
  if (!_boxesGroup || !_canvas) return;
  var rect = _canvas.getBoundingClientRect();
  _pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  _pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  _raycaster.setFromCamera(_pointer, _camera);
  var hits = _raycaster.intersectObjects(_boxesGroup.children, false);
  if (!hits.length) { if (_tooltipEl) _tooltipEl.style.display = 'none'; return; }
  var meta = _hoverMeta[hits[0].object.uuid];
  if (!meta || !_tooltipEl) return;
  var lines = ['<b>' + meta.binLoc + '</b>'];
  lines.push('Total: ' + meta.totalKarton.toLocaleString('id-ID') + ' krt');
  if (meta.totalReserved > 0) lines.push('<span style="color:#fbd38d">Reserved: ' + meta.totalReserved.toLocaleString('id-ID') + ' krt</span>');
  if (meta.totalAvailable > 0) lines.push('<span style="color:#9ae6b4">Available: ' + meta.totalAvailable.toLocaleString('id-ID') + ' krt</span>');
  (meta.items || []).slice(0, 4).forEach(function(it){ lines.push(it.sku + (it.nama ? ' — ' + it.nama : '')); });
  _tooltipEl.innerHTML = lines.join('<br>');
  _tooltipEl.style.display = 'block';
  _tooltipEl.style.left = (ev.clientX - rect.left + 12) + 'px';
  _tooltipEl.style.top  = (ev.clientY - rect.top + 12) + 'px';
}

function _animate() {
  requestAnimationFrame(_animate);
  if (_controls) _controls.update();
  if (_renderer && _scene && _camera) _renderer.render(_scene, _camera);
}

// cells: [{binLoc, sku, nama, karton, reservedKarton, availableKarton}], dari getMekReservedMap
// longWaitBins: Set-like object {binLoc: true} — lokasi yang mengandung reservasi >24 jam
window.mekReserved3DRender = function(cells, longWaitBins) {
  _initScene();
  if (!_scene) return;
  var loadingEl = document.getElementById('mekRv3dLoading');
  if (loadingEl) loadingEl.style.display = 'none';

  if (_boxesGroup) { _scene.remove(_boxesGroup); _boxesGroup = null; }
  _hoverMeta = {};
  _boxesGroup = new THREE.Group();

  // Agregasi per binLoc
  var byBin = {};
  (cells || []).forEach(function(c){
    var key = c.binLoc || '?';
    if (!byBin[key]) byBin[key] = { binLoc: key, totalKarton: 0, totalReserved: 0, totalAvailable: 0, items: [] };
    byBin[key].totalKarton    += c.karton || 0;
    byBin[key].totalReserved  += c.reservedKarton || 0;
    byBin[key].totalAvailable += c.availableKarton || 0;
    byBin[key].items.push({ sku: c.sku, nama: c.nama, karton: c.karton });
    if (longWaitBins && longWaitBins[key]) byBin[key].hasLongWait = true;
  });

  var bins = Object.keys(byBin).map(function(k){ return byBin[k]; });
  if (!bins.length) return;

  // Susun grid: kelompok per huruf blok (kolom X), urut nomor bin (kedalaman Z)
  var groups = {};
  bins.forEach(function(b){
    var p = _parseBinLoc(b.binLoc);
    b._letter = p.letter; b._num = p.num;
    if (!groups[p.letter]) groups[p.letter] = [];
    groups[p.letter].push(b);
  });
  var letters = Object.keys(groups).sort();
  var maxKarton = Math.max.apply(null, bins.map(function(b){ return b.totalKarton; })) || 1;

  var cellSize = 3.2, gap = 1.0;
  letters.forEach(function(letter, li){
    var list = groups[letter].sort(function(a,b){ return a._num - b._num; });
    list.forEach(function(b, ri){
      var h = Math.max(0.6, (b.totalKarton / maxKarton) * 14);
      var geo = new THREE.BoxGeometry(cellSize, h, cellSize);
      var mat = new THREE.MeshLambertMaterial({ color: _colorForCell(b) });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        li * (cellSize + gap) - (letters.length * (cellSize + gap)) / 2,
        h / 2,
        ri * (cellSize + gap) - (list.length * (cellSize + gap)) / 2
      );
      _boxesGroup.add(mesh);
      _hoverMeta[mesh.uuid] = b;
    });
  });
  _scene.add(_boxesGroup);
  _onResize();
};
