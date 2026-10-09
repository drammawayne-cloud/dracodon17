// Apply the existing preference before paint; do not change or create settings.
(()=>{try{document.documentElement.dataset.theme=localStorage.getItem('dracodon17-theme')==='dark'?'dark':'light';}catch{document.documentElement.dataset.theme='light';}})();
