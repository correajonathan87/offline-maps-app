export function setupMapEditor(map, state, persist, refresh, statusCb) {
  let mode = 'none';
  let currentRoute = [];
  let tempPolyline;

  function setMode(nextMode) {
    mode = nextMode;
    statusCb(`Modo ativo: ${mode}`);
  }

  map.on('click', (e) => {
    const { lat, lng } = e.latlng;

    if (mode === 'point') {
      const name = prompt('Nome do ponto (POI):', `POI ${state.pois.length + 1}`) || 'POI';
      state.pois.push({ id: crypto.randomUUID(), name, lat, lng });
      // Edição do "mapa principal" é armazenada como alteração local.
      state.mapEdits.push({ id: crypto.randomUUID(), type: 'add-poi', lat, lng, name });
      persist();
      refresh();
      statusCb(`Ponto salvo: ${name}`);
    }

    if (mode === 'route') {
      currentRoute.push([lat, lng]);
      if (!tempPolyline) {
        tempPolyline = L.polyline(currentRoute, { color: 'orange', dashArray: '4,6' }).addTo(map);
      } else {
        tempPolyline.setLatLngs(currentRoute);
      }
    }
  });

  function finishRoute() {
    if (currentRoute.length < 2) {
      statusCb('Adicione pelo menos 2 pontos para formar uma rota.');
      return;
    }

    const name = prompt('Nome da rota:', `Rota ${state.routes.length + 1}`) || 'Rota';
    state.routes.push({
      id: crypto.randomUUID(),
      name,
      points: [...currentRoute],
      color: '#d22f27'
    });
    state.mapEdits.push({ id: crypto.randomUUID(), type: 'add-route', name, points: [...currentRoute] });

    currentRoute = [];
    if (tempPolyline) {
      map.removeLayer(tempPolyline);
      tempPolyline = null;
    }

    persist();
    refresh();
    statusCb(`Rota salva: ${name}`);
  }

  return { setMode, finishRoute };
}
