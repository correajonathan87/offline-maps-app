const CACHE_NAME = 'osm-tile-cache-v1';
const TILE_URL_TEMPLATE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

function tileUrl(z, x, y) {
  return TILE_URL_TEMPLATE.replace('{z}', z).replace('{x}', x).replace('{y}', y);
}

export function createOfflineTileLayer(L, statusCb) {
  return L.TileLayer.extend({
    createTile(coords, done) {
      const tile = document.createElement('img');
      tile.alt = '';
      tile.setAttribute('role', 'presentation');

      (async () => {
        try {
          const url = tileUrl(coords.z, coords.x, coords.y);
          const cache = await caches.open(CACHE_NAME);
          let response = await cache.match(url);
          if (!response) {
            response = await fetch(url, { mode: 'cors' });
            if (response.ok) await cache.put(url, response.clone());
          }
          const blob = await response.blob();
          tile.src = URL.createObjectURL(blob);
          done(null, tile);
        } catch (error) {
          statusCb?.(`Falha ao carregar tile ${coords.z}/${coords.x}/${coords.y}`);
          done(error, tile);
        }
      })();

      return tile;
    }
  });
}

function lon2tileX(lon, zoom) {
  return Math.floor(((lon + 180) / 360) * 2 ** zoom);
}

function lat2tileY(lat, zoom) {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom
  );
}

export async function downloadVisibleRegion(map, minZoom = 12, maxZoom = 15, statusCb) {
  const bounds = map.getBounds();
  const cache = await caches.open(CACHE_NAME);
  let total = 0;
  let done = 0;

  for (let z = minZoom; z <= maxZoom; z++) {
    const minX = lon2tileX(bounds.getWest(), z);
    const maxX = lon2tileX(bounds.getEast(), z);
    const minY = lat2tileY(bounds.getNorth(), z);
    const maxY = lat2tileY(bounds.getSouth(), z);
    total += (maxX - minX + 1) * (maxY - minY + 1);
  }

  for (let z = minZoom; z <= maxZoom; z++) {
    const minX = lon2tileX(bounds.getWest(), z);
    const maxX = lon2tileX(bounds.getEast(), z);
    const minY = lat2tileY(bounds.getNorth(), z);
    const maxY = lat2tileY(bounds.getSouth(), z);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const url = tileUrl(z, x, y);
        if (!(await cache.match(url))) {
          const response = await fetch(url, { mode: 'cors' });
          if (response.ok) await cache.put(url, response.clone());
        }
        done += 1;
        statusCb?.(`Download tiles: ${done}/${total}`);
      }
    }
  }
  statusCb?.('Região salva para uso offline.');
}
