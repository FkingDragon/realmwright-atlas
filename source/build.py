t=open('template.html').read()
lib=open('lib.js').read().replace("if (typeof module !== 'undefined') module.exports = terrainLib;\n","")
app=''.join(open(f).read() for f in ['app1.js','app2.js','app3.js','app5.js','app6.js','app7.js','app8.js','app9.js','app10.js','app21.js','app31.js','app34.js','app11.js','app12.js','app13.js','app14.js','app15.js','app16.js','app17.js','app18.js','app19.js','app20.js','app22.js','app23.js','app24.js','srd-data.js','app25.js','app26.js','app27.js','app28.js','app29.js','app30.js','app32.js','app33.js','app35.js','app4.js'])
out=t.replace('/*LIB*/',lib).replace('/*APP*/',app)
open('atlas.html','w').write(out)
open('check.js','w').write(lib+'\n'+app)
print(len(out))
# the GitHub Pages copy: a full standard-mode document with a share description and the compass tab icon
import os
os.makedirs('github', exist_ok=True)
ICON = "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2212%22 fill=%22%23171a1f%22/%3E%3Ccircle cx=%2232%22 cy=%2232%22 r=%2220%22 fill=%22none%22 stroke=%22%23d6a548%22 stroke-width=%224%22/%3E%3Cpath d=%22M32 14l6 18-6 18-6-18z%22 fill=%22%23e3b341%22/%3E%3C/svg%3E"
head = '<!doctype html>\n<html lang="en">\n<meta name="description" content="A procedural D&amp;D 5e world atlas: maps, live markets, NPC tracking, guilds, monsters, a pixel battle map and a character creator, all in one page.">\n<link rel="icon" href="' + ICON + '">\n'
open('github/index.html', 'w').write(head + out + '\n</html>\n')

