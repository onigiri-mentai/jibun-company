from pathlib import Path
import re, base64
root=Path(__file__).parent
html=(root/'dist/index.html').read_text()
entry=html.replace('href="style.css"','href="dist/style.css?v=8"').replace('src="js/','src="dist/js/').replace('src="app.js"','src="dist/app.js"')
entry=entry.replace('href="assets/', 'href="dist/assets/')
entry=re.sub(r'src="([^"]+\.js)"',r'src="\1?v=8"',entry)
(root/'index.html').write_text(entry)
standalone=html.replace('<link rel="stylesheet" href="style.css">','<style>'+(root/'dist/style.css').read_text()+'</style>')
standalone=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>'+(root/'dist'/m[1]).read_text()+'</script>',standalone)
standalone=re.sub(r'href="(assets/[^"]+\.jpg)"', lambda m:'href="data:image/jpeg;base64,'+base64.b64encode((root/'dist'/m[1]).read_bytes()).decode()+'"',standalone)
(root/'じぶんカンパニー.html').write_text(standalone)
