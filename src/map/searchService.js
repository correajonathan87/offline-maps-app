function parseLatLng(query) {
  const normalized = query.trim().replace(';', ',');
  const parts = normalized.split(',').map((p) => p.trim());
  if (parts.length !== 2) return null;

  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng, label: `Coordenadas: ${lat.toFixed(5)}, ${lng.toFixed(5)}` };
}

export async function searchAddress(query) {
  const byCoordinates = parseLatLng(query);
  if (byCoordinates) return byCoordinates;

  const endpoint = new URL('https://nominatim.openstreetmap.org/search');
  endpoint.searchParams.set('q', query);
  endpoint.searchParams.set('format', 'jsonv2');
  endpoint.searchParams.set('limit', '1');
  endpoint.searchParams.set('addressdetails', '1');

  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Busca por nome indisponível no momento.');
  }

  const results = await response.json();
  if (!results.length) {
    throw new Error('Endereço não encontrado.');
  }

  const item = results[0];
  return {
    lat: Number(item.lat),
    lng: Number(item.lon),
    label: item.display_name || query
  };
}
