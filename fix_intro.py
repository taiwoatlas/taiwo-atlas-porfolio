old = '''<p class="lede hero-sub">Taiwo Atlas is a front-end developer and digital experience builder. The work spans security platforms, agricultural commerce, editorial ecosystems and institutional archives — well over fifty projects united by one discipline: understand the problem before touching the interface.</p>'''

new = '''<p class="lede hero-sub">Hi, I'm Taiwo. I've always believed a website is really just a promise — a quiet handshake between an idea and the people who need to find it. My job is crafting that handshake: listening closely to founders, institutions, and causes before a single pixel gets placed, so the final result doesn't just look good, it actually understands what it's there to do. Fifty-plus projects later, spanning security platforms, agricultural marketplaces, editorial ecosystems and institutional archives, that approach has never changed — understand the problem deeply, then let the interface follow naturally from it. If your idea deserves a home online that truly gets it, I'd love to build that with you.</p>'''

content = open('index.html').read()
assert old in content, "Text not found — file may have changed"
content = content.replace(old, new)
open('index.html', 'w').write(content)
print("Done")
