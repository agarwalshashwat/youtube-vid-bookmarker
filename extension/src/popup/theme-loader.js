// Theme loader - prevents flash of unstyled content
(function() {
  chrome.storage.local.get(['theme'], (result) => {
    const theme = result.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  });
})();
