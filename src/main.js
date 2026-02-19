import { initMap, renderPois, renderRoutes } from './map/mapRenderer.js';
import { downloadVisibleRegion } from './map/offlineTileLayer.js';
import { startGpsTracking } from './gps/locationService.js';
import { setupMapEditor } from './editor/mapEditor.js';
import { loadState, saveState } from './persistence/storage.js';
import { createSyncFolderService } from './persistence/syncFolder.js';
import { exportToGpx, exportToKml, importGpxOrKml } from './io/fileInterop.js';

const state = loadState();
const statusEl = document.querySelector('#status');
const setStatus = (msg) => (statusEl.textContent = msg);

const { map, poiLayer, routeLayer } = initMap(setStatus);
const syncService = createSyncFolderService(setStatus);

function refresh() {
  renderPois(poiLayer, state.pois);
  renderRoutes(routeLayer, state.routes);
}

function persist() {
  saveState(state);
}

function replaceState(nextState) {
  state.pois = nextState.pois || [];
  state.routes = nextState.routes || [];
  state.mapEdits = nextState.mapEdits || [];
  persist();
  refresh();
}

refresh();
const gps = startGpsTracking(map, setStatus);

const editor = setupMapEditor(map, state, persist, refresh, setStatus);

function activate(buttonId) {
  ['btn-point', 'btn-route'].forEach((id) => document.getElementById(id).classList.remove('active'));
  if (buttonId) document.getElementById(buttonId).classList.add('active');
}

document.getElementById('btn-point').addEventListener('click', () => {
  editor.setMode('point');
  activate('btn-point');
});

document.getElementById('btn-route').addEventListener('click', () => {
  editor.setMode('route');
  activate('btn-route');
});

document.getElementById('btn-finish-route').addEventListener('click', () => editor.finishRoute());

document.getElementById('btn-locate').addEventListener('click', () => {
  gps.centerOnUser();
});

document.getElementById('btn-sync-folder').addEventListener('click', async () => {
  await syncService.chooseFolder();
});

document.getElementById('btn-sync-save').addEventListener('click', async () => {
  await syncService.saveSnapshot(state);
});

document.getElementById('btn-sync-load').addEventListener('click', async () => {
  const snapshot = await syncService.loadSnapshot();
  if (!snapshot) return;
  replaceState(snapshot);
  setStatus('Dados sincronizados a partir da pasta compartilhada.');
});

document.getElementById('btn-download').addEventListener('click', async () => {
  setStatus('Baixando tiles da região visível...');
  await downloadVisibleRegion(map, 12, 15, setStatus);
});

document.getElementById('btn-export-gpx').addEventListener('click', () => exportToGpx(state));
document.getElementById('btn-export-kml').addEventListener('click', () => exportToKml(state));

document.getElementById('file-import').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  await importGpxOrKml(file, state);
  persist();
  refresh();
  setStatus(`Arquivo importado: ${file.name}`);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch((err) => setStatus(`SW erro: ${err.message}`));
}

setStatus('Aplicativo pronto para uso offline após baixar uma região.');
