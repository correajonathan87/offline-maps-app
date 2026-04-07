# Offline OSM Navigator (PWA)

Aplicativo open source inspirado no fluxo do MAPS.ME, focado em navegação e edição local **offline** usando dados do OpenStreetMap.

## Por que escolhi **Web App PWA** em vez de React Native?

Para uma primeira versão mínima funcional, PWA traz vantagens:
- Menor barreira de entrada para iniciantes (abre no navegador, sem build mobile nativo).
- Instalação no dispositivo (Android/desktop) com `manifest` + `service worker`.
- APIs web suficientes para o escopo inicial: Geolocation, Cache Storage, LocalStorage/IndexedDB, import/export de arquivos.
- Base 100% open source com Leaflet + OSM.

> Em produção, é possível evoluir para React Native reaproveitando boa parte da lógica de domínio (edição, persistência, import/export).

## Estrutura por camadas

```txt
src/
  main.js                      # Orquestração da aplicação
  map/
    mapRenderer.js             # Renderização do mapa e overlays
    offlineTileLayer.js        # Cache offline de tiles + download por região
    searchService.js           # Busca por endereço (nome ou coordenadas)
  gps/
    locationService.js         # Localização do usuário (GPS)
  editor/
    mapEditor.js               # Criação de POIs e rotas desenhadas
  persistence/
    storage.js                 # Persistência local offline
  io/
    fileInterop.js             # Importação/exportação GPX e KML
sw.js                          # Service Worker para app shell offline
manifest.webmanifest           # Manifesto PWA
index.html                     # UI base e toolbar
```

## Funcionalidades implementadas (MVP)

- ✅ Mapa OSM com camada de tiles em cache local.
- ✅ Mapa inicia enquadrado no território do Brasil.
- ✅ Download de região visível (zoom 12 a 15) para uso offline.
- ✅ Exibição da posição atual via GPS.
- ✅ Janela de busca para endereço por nome ou coordenadas (lat,lng).
- ✅ Botão para centralizar rapidamente na localização atual do usuário.
- ✅ Modo de criação de ponto (POI) manual.
- ✅ Modo de criação de rota por cliques no mapa + salvar rota.
- ✅ Persistência local de POIs, rotas e edições do mapa (`mapEdits`).
- ✅ Importar e exportar GPX/KML.
- ✅ Sobreposição de todas as rotas e pontos salvos no mapa.

## Como rodar

Como é um app estático, basta servir os arquivos:

```bash
python3 -m http.server 4173
```

Abrir: `http://localhost:4173`

> Para testar offline completo: abra o app, baixe uma região com o botão, depois desligue internet.

## Explicação detalhada por módulo

### 1) Renderização do mapa
- `src/map/mapRenderer.js`: inicializa o Leaflet, adiciona camada de tiles offline-first, cria layers de POIs e rotas.
- `src/map/searchService.js`: resolve busca por coordenadas digitadas (`lat,lng`) e por nome usando Nominatim (OSM).
- `renderPois` e `renderRoutes`: redesenham o estado persistido no mapa sempre que algo muda.

### 2) GPS / localização
- `src/gps/locationService.js`: usa `navigator.geolocation.watchPosition`.
- Atualiza um marcador de posição em tempo real e centraliza o mapa no primeiro fix.

### 3) Editor de mapa e rotas
- `src/editor/mapEditor.js`:
  - `mode=point`: clique cria POI com nome.
  - `mode=route`: cada clique adiciona vértice na rota temporária.
  - `finishRoute()`: transforma o rascunho em rota persistida.
- Também grava operações em `mapEdits` para representar “edições do mapa principal” locais.

### 4) Persistência offline
- `src/persistence/storage.js` salva/carrega estado da aplicação via `localStorage`.
- `src/map/offlineTileLayer.js` guarda tiles em `Cache Storage`.
- `sw.js` cacheia o app shell para inicialização offline da interface.

### 5) Importação/exportação
- `src/io/fileInterop.js`:
  - Exporta GPX (`wpt`, `trk/trkseg/trkpt`) e KML (`Placemark`, `Point`, `LineString`).
  - Importa GPX/KML e converte para o formato interno de POIs e rotas.

## Decisões técnicas importantes

- **Leaflet + OSM tiles**: stack aberta e madura.
- **Cache API para tiles**: permite “baixar região” sem servidor customizado.
- **Service Worker simples**: garante que a interface abra sem internet.
- **Separação em camadas**: facilita migração para React Native ou backend no futuro.

## Melhorias futuras sugeridas

1. Trocar tiles raster por **vetoriais (MapLibre + PMTiles)** para reduzir tamanho de download.
2. Persistência robusta com **IndexedDB** ou SQLite (via wrapper), com versionamento.
3. Editor avançado: mover vértices, apagar trechos, snapping em vias existentes.
4. “Edição do mapa principal” em formato de diff e exportação para mudanças OSM (após validação).
5. Sincronização opcional com nuvem (criptografada), múltiplos perfis e backup automático.
6. Camadas extras: trilhas, relevo, ciclovias, pontos de interesse temáticos.
7. Navegação turn-by-turn offline com engine de roteamento local (ex: GraphHopper/Valhalla adaptado).

## Limitações do MVP

- Download de tiles pode ficar pesado em regiões grandes.
- Importador GPX/KML cobre casos comuns, não todos os metadados do padrão.
- Sem autenticação/sincronização remota nesta versão inicial.
