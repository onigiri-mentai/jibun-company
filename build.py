from pathlib import Path
import re, base64
root=Path(__file__).parent
html=(root/'dist/index.html').read_text()
entry=html.replace('href="style.css"','href="dist/style.css?v=15"').replace('src="js/','src="dist/js/').replace('src="app.js"','src="dist/app.js"')
entry=entry.replace('href="handcraft.css"','href="dist/handcraft.css?v=15"')
entry=entry.replace('href="assets/', 'href="dist/assets/').replace('src="assets/', 'src="dist/assets/')
entry=re.sub(r'src="([^"]+\.js)"',r'src="\1?v=15"',entry)
(root/'index.html').write_text(entry)
standalone=re.sub(r'<link rel="stylesheet" href="([^"]+\.css)">',lambda m:'<style>'+(root/'dist'/m[1]).read_text()+'</style>',html)
standalone=standalone.replace("url('assets/fonts/","url('https://onigiri-mentai.github.io/jibun-company/dist/assets/fonts/")
standalone=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>'+(root/'dist'/m[1]).read_text()+'</script>',standalone)
standalone=re.sub(r'(?:href|src)="(assets/[^"]+\.(?:jpg|png))"', lambda m:m[0].split('=')[0]+'="data:image/'+('png' if m[1].endswith('.png') else 'jpeg')+';base64,'+base64.b64encode((root/'dist'/m[1]).read_bytes()).decode()+'"',standalone)
(root/'じぶんカンパニー.html').write_text(standalone)
