from pathlib import Path
import re
root=Path(__file__).parent
html=(root/'dist/index.html').read_text()
entry=html.replace('href="style.css"','href="dist/style.css?v=7"').replace('src="js/','src="dist/js/').replace('src="app.js"','src="dist/app.js"')
entry=re.sub(r'src="([^"]+\.js)"',r'src="\1?v=7"',entry)
(root/'index.html').write_text(entry)
standalone=html.replace('<link rel="stylesheet" href="style.css">','<style>'+(root/'dist/style.css').read_text()+'</style>')
standalone=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>'+(root/'dist'/m[1]).read_text()+'</script>',standalone)
(root/'じぶんカンパニー.html').write_text(standalone)
