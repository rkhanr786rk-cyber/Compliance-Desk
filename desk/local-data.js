(() => {
  const files = new Map();
  const pending = new Map();
  window.DeskData = {
    define(key, data) { files.set(key, data); },
    load(key) {
      if (files.has(key)) return Promise.resolve(files.get(key));
      if (!/^desk\/(library|procedures|drafts)\/[\w-]+\.json$/.test(key)) return Promise.reject(new Error('Unknown collection'));
      if (pending.has(key)) return pending.get(key);
      const request = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = key.replace(/\.json$/, '.data.js');
        script.onload = () => {
          script.remove();
          pending.delete(key);
          if (files.has(key)) resolve(files.get(key));
          else reject(new Error('Collection is unavailable'));
        };
        script.onerror = () => { script.remove(); pending.delete(key); reject(new Error('Could not load collection')); };
        document.head.append(script);
      });
      pending.set(key, request);
      return request;
    }
  };
})();
