from pathlib import Path
import re, base64
root=Path(__file__).parent
html=(root/'dist/index.html').read_text()
entry=html.replace('href="style.css"','href="dist/style.css?v=12"').replace('src="js/','src="dist/js/').replace('src="app.js"','src="dist/app.js"')
entry=entry.replace('href="handcraft.css"','href="dist/handcraft.css?v=12"')
entry=entry.replace('href="assets/', 'href="dist/assets/')
entry=re.sub(r'src="([^"]+\.js)"',r'src="\1?v=12"',entry)
(root/'index.html').write_text(entry)
standalone=re.sub(r'<link rel="stylesheet" href="([^"]+\.css)">',lambda m:'<style>'+(root/'dist'/m[1]).read_text()+'</style>',html)
standalone=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>'+(root/'dist'/m[1]).read_text()+'</script>',standalone)
standalone=re.sub(r'href="(assets/[^"]+\.(?:jpg|png))"', lambda m:'href="data:image/'+('png' if m[1].endswith('.png') else 'jpeg')+';base64,'+base64.b64encode((root/'dist'/m[1]).read_bytes()).decode()+'"',standalone)
(root/'じぶんカンパニー.html').write_text(standalone)
