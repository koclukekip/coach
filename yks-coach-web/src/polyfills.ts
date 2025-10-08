// Ensure Node-style global is defined before any third-party modules execute
// This needs to load before libraries like sockjs-client that expect `global`.
(function() {
  try {
    const w: any = window as any;
    if (typeof w.global === 'undefined') {
      w.global = w;
    }
    if (typeof (globalThis as any).global === 'undefined') {
      (globalThis as any).global = globalThis;
    }
  } catch {}
})();


