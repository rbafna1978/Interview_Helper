export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('theme')||'system';var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var v=t==='system'?(d?'dark':'light'):t;document.documentElement.dataset.theme=v;}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
