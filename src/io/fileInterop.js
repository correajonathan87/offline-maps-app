function downloadTextFile(name, text, mime) {
  const blob = new Blob([text], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}

export function exportToGpx(state) {
  const wpts = state.pois
    .map((p) => `<wpt lat="${p.lat}" lon="${p.lng}"><name>${p.name}</name></wpt>`)
    .join('');

  const trks = state.routes
    .map(
      (r) =>
        `<trk><name>${r.name}</name><trkseg>${r.points
          .map((pt) => `<trkpt lat="${pt[0]}" lon="${pt[1]}"></trkpt>`)
          .join('')}</trkseg></trk>`
    )
    .join('');

  const gpx = `<?xml version="1.0"?><gpx version="1.1" creator="Offline OSM Navigator">${wpts}${trks}</gpx>`;
  downloadTextFile('offline-map-data.gpx', gpx, 'application/gpx+xml');
}

export function exportToKml(state) {
  const placemarks = state.pois
    .map(
      (p) =>
        `<Placemark><name>${p.name}</name><Point><coordinates>${p.lng},${p.lat},0</coordinates></Point></Placemark>`
    )
    .join('');

  const lines = state.routes
    .map(
      (r) =>
        `<Placemark><name>${r.name}</name><LineString><coordinates>${r.points
          .map((pt) => `${pt[1]},${pt[0]},0`)
          .join(' ')}</coordinates></LineString></Placemark>`
    )
    .join('');

  const kml = `<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>${placemarks}${lines}</Document></kml>`;
  downloadTextFile('offline-map-data.kml', kml, 'application/vnd.google-earth.kml+xml');
}

export async function importGpxOrKml(file, state) {
  const text = await file.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'text/xml');

  if (file.name.endsWith('.gpx')) {
    xml.querySelectorAll('wpt').forEach((wpt) => {
      state.pois.push({
        id: crypto.randomUUID(),
        name: wpt.querySelector('name')?.textContent || 'POI importado',
        lat: Number(wpt.getAttribute('lat')),
        lng: Number(wpt.getAttribute('lon'))
      });
    });

    xml.querySelectorAll('trk').forEach((trk) => {
      const points = [...trk.querySelectorAll('trkpt')].map((p) => [
        Number(p.getAttribute('lat')),
        Number(p.getAttribute('lon'))
      ]);
      if (points.length > 1) {
        state.routes.push({
          id: crypto.randomUUID(),
          name: trk.querySelector('name')?.textContent || 'Rota importada',
          points,
          color: '#7b2cbf'
        });
      }
    });
  }

  if (file.name.endsWith('.kml')) {
    xml.querySelectorAll('Placemark').forEach((placemark) => {
      const name = placemark.querySelector('name')?.textContent || 'Elemento KML';
      const pointCoords = placemark.querySelector('Point coordinates')?.textContent?.trim();
      const lineCoords = placemark.querySelector('LineString coordinates')?.textContent?.trim();

      if (pointCoords) {
        const [lng, lat] = pointCoords.split(',').map(Number);
        state.pois.push({ id: crypto.randomUUID(), name, lat, lng });
      }

      if (lineCoords) {
        const points = lineCoords.split(/\s+/).map((entry) => {
          const [lng, lat] = entry.split(',').map(Number);
          return [lat, lng];
        });
        if (points.length > 1) {
          state.routes.push({ id: crypto.randomUUID(), name, points, color: '#7b2cbf' });
        }
      }
    });
  }
}
