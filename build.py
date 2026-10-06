from pathlib import Path
import re
root=Path(__file__).parent
html=(root/'dist/index.html').read_text()
(root/'index.html').write_text(html.replace('href="style.css"','href="dist/style.css?v=6"').replace('src="js/','src="dist/js/').replace('src="app.js"','src="dist/app.js"'))
standalone=html.replace('<link rel="stylesheet" href="style.css">','<style>'+(root/'dist/style.css').read_text()+'</style>')
standalone=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>'+(root/'dist'/m[1]).read_text()+'</script>',standalone)
(root/'じぶんカンパニー.html').write_text(standalone)
