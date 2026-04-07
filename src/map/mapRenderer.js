import { createOfflineTileLayer } from './offlineTileLayer.js';

export function initMap(statusCb) {
  // Iniciamos com o enquadramento do Brasil inteiro para atender ao caso de uso principal.
  const brazilBounds = [
    [-33.75, -73.99],
    [5.27, -34.79]
  ];
  const map = L.map('map', {
    minZoom: 3,
    maxBounds: [
      [-60, -100],
      [20, -20]
    ]
  });
  map.fitBounds(brazilBounds);

  const OfflineTileLayer = createOfflineTileLayer(L, statusCb);
  new OfflineTileLayer('', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  const poiLayer = L.layerGroup().addTo(map);
  const routeLayer = L.layerGroup().addTo(map);

  return { map, poiLayer, routeLayer };
}

export function renderPois(layer, pois) {
  layer.clearLayers();
  pois.forEach((poi) => {
    L.marker([poi.lat, poi.lng]).bindPopup(`<b>${poi.name}</b>`).addTo(layer);
  });
}

export function renderRoutes(layer, routes) {
  layer.clearLayers();
  routes.forEach((route) => {
    L.polyline(route.points, { color: route.color || 'red' })
      .bindPopup(route.name)
      .addTo(layer);
  });
}
