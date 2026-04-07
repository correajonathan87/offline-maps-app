import { initMap, renderPois, renderRoutes } from './map/mapRenderer.js';
import { downloadVisibleRegion } from './map/offlineTileLayer.js';
import { searchAddress } from './map/searchService.js';
import { startGpsTracking } from './gps/locationService.js';
import { setupMapEditor } from './editor/mapEditor.js';
import { loadState, saveState } from './persistence/storage.js';
import { exportToGpx, exportToKml, importGpxOrKml } from './io/fileInterop.js';

const state = loadState();
const statusEl = document.querySelector('#status');
const setStatus = (msg) => (statusEl.textContent = msg);

const { map, poiLayer, routeLayer } = initMap(setStatus);
let searchMarker;

function refresh() {
  renderPois(poiLayer, state.pois);
  renderRoutes(routeLayer, state.routes);
}

function persist() {
  saveState(state);
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

document.getElementById('btn-download').addEventListener('click', async () => {
  setStatus('Baixando tiles da região visível...');
  await downloadVisibleRegion(map, 12, 15, setStatus);
});

async function runSearch() {
  const input = document.getElementById('search-input');
  const query = input.value.trim();
  if (!query) {
    setStatus('Digite um endereço ou coordenadas (lat,lng).');
    return;
  }

  try {
    setStatus('Buscando localização...');
    const result = await searchAddress(query);
    const latLng = [result.lat, result.lng];

    map.setView(latLng, 16);
    if (!searchMarker) {
      searchMarker = L.marker(latLng).addTo(map);
    } else {
      searchMarker.setLatLng(latLng);
    }
    searchMarker.bindPopup(result.label).openPopup();
    setStatus(`Local encontrado: ${result.label}`);
  } catch (error) {
    setStatus(`Falha na busca: ${error.message}`);
  }
}

document.getElementById('btn-search').addEventListener('click', runSearch);
document.getElementById('search-input').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') runSearch();
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
