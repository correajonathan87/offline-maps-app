export function startGpsTracking(map, statusCb) {
  if (!navigator.geolocation) {
    statusCb('Geolocalização não suportada no dispositivo/navegador.');
    return {
      centerOnUser: () => statusCb('Geolocalização não suportada no dispositivo/navegador.')
    };
  }

  let marker;

  function updateMarker(position, center = false) {
    const { latitude, longitude, accuracy } = position.coords;
    const latLng = [latitude, longitude];

    if (!marker) {
      marker = L.circleMarker(latLng, { radius: 8, color: '#005eff' }).addTo(map);
      center = true;
    } else {
      marker.setLatLng(latLng);
    }

    if (center) {
      map.setView(latLng, 16);
    }

    statusCb(`GPS ativo: precisão ~${Math.round(accuracy)}m`);
  }

  navigator.geolocation.watchPosition(
    (position) => updateMarker(position),
    (error) => statusCb(`Erro GPS: ${error.message}`),
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000
    }
  );

  function centerOnUser() {
    navigator.geolocation.getCurrentPosition(
      (position) => updateMarker(position, true),
      (error) => statusCb(`Erro ao centralizar GPS: ${error.message}`),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );
  }

  return { centerOnUser };
}
