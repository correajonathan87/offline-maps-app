const SYNC_FILE_NAME = 'offline-osm-sync.json';

export function createSyncFolderService(statusCb) {
  let dirHandle = null;

  async function chooseFolder() {
    if (!window.showDirectoryPicker) {
      statusCb('Seu navegador não suporta seleção de pasta (File System Access API).');
      return false;
    }

    try {
      dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      statusCb(`Pasta de sync conectada: ${dirHandle.name}`);
      return true;
    } catch (error) {
      statusCb(`Seleção de pasta cancelada/negada: ${error.message}`);
      return false;
    }
  }

  async function ensureFolderReady() {
    if (dirHandle) return true;
    return chooseFolder();
  }

  async function saveSnapshot(state) {
    const ready = await ensureFolderReady();
    if (!ready) return;

    const fileHandle = await dirHandle.getFileHandle(SYNC_FILE_NAME, { create: true });
    const writable = await fileHandle.createWritable();
    const payload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      state
    };

    await writable.write(JSON.stringify(payload, null, 2));
    await writable.close();

    statusCb(`Sync salvo em ${dirHandle.name}/${SYNC_FILE_NAME}`);
  }

  async function loadSnapshot() {
    const ready = await ensureFolderReady();
    if (!ready) return null;

    try {
      const fileHandle = await dirHandle.getFileHandle(SYNC_FILE_NAME, { create: false });
      const file = await fileHandle.getFile();
      const payload = JSON.parse(await file.text());
      if (!payload?.state) {
        statusCb('Arquivo de sync inválido.');
        return null;
      }

      statusCb(`Sync carregado de ${dirHandle.name}/${SYNC_FILE_NAME}`);
      return payload.state;
    } catch (error) {
      statusCb(`Falha ao carregar sync: ${error.message}`);
      return null;
    }
  }

  return {
    chooseFolder,
    saveSnapshot,
    loadSnapshot
  };
}
