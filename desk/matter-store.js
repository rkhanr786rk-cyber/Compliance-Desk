(() => {
  'use strict';
  const dbName = 'compliance-desk-practice';
  let opening;
  function database() {
    if (!opening) {
      opening = new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          db.createObjectStore('companies', { keyPath: 'id' });
          db.createObjectStore('matters', { keyPath: 'id' });
          const files = db.createObjectStore('files', { keyPath: 'id' });
          files.createIndex('matterId', 'matterId');
        };
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => { db.close(); opening = undefined; };
          resolve(db);
        };
        request.onerror = () => { opening = undefined; reject(request.error); };
      });
    }
    return opening;
  }
  async function transaction(tables, mode, run) {
    const db = await database();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(tables, mode);
      let value;
      tx.oncomplete = () => resolve(value);
      tx.onabort = () => reject(tx.error || new Error('The change could not be saved.'));
      run(tx, result => { value = result; });
    });
  }
  function read(table, id) {
    return transaction(table, 'readonly', (tx, set) => {
      const store = tx.objectStore(table);
      const req = id === undefined ? store.getAll() : store.get(id);
      req.onsuccess = () => set(req.result);
    });
  }
  async function saveMatter(matter, newCompany) {
    await transaction(['companies','matters'], 'readwrite', tx => {
      if (newCompany) tx.objectStore('companies').add(newCompany);
      tx.objectStore('matters').add(matter);
    });
  }
  function patch(table, id, fields, nested) {
    return transaction(table, 'readwrite', (tx, set) => {
      const store = tx.objectStore(table);
      const get = store.get(id);
      get.onsuccess = () => {
        if (!get.result) { tx.abort(); return; }
        const next = { ...get.result };
        if (nested) next[nested] = { ...next[nested], ...fields };
        else Object.assign(next, fields);
        store.put(next);
        set(next);
      };
    });
  }
  function files(matterId, withData = false) {
    return transaction('files', 'readonly', (tx, set) => {
      const req = tx.objectStore('files').index('matterId').openCursor(matterId);
      const found = [];
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) { set(found); return; }
        const { data, ...info } = cursor.value;
        found.push(withData ? { ...info, data } : info);
        cursor.continue();
      };
    });
  }
  window.MatterStore = {
    read, patch, files, saveMatter,
    addCompany: company => transaction('companies','readwrite', tx => tx.objectStore('companies').add(company)),
    addFiles: records => transaction('files','readwrite', tx => records.forEach(r => tx.objectStore('files').add(r))),
    removeFile: id => transaction('files','readwrite', tx => tx.objectStore('files').delete(id))
  };
})();
