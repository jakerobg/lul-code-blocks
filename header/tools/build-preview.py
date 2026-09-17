#!/usr/bin/env python3
"""Regenerate header_preview.html from lul_header.html."""
import re, os, sys

HD = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(HD, 'lul_header.html'), encoding='utf-8', errors='replace').read()

body_cls = ' '.join(re.search(r'<body[\s\S]*?class="([\s\S]*?)"', src).group(1).split())
s = src.index('<header'); e = src.index('</header>') + 9
header = src[s:e]
inline = re.findall(r'<style[^>]*>(.*?)</style>', src, re.S)
inline_css = '\n'.join(b.strip() for b in inline if b.strip())

out = f"""<!doctype html>
<html lang="en" class="js flexbox canvas canvastext webgl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LUL Header — local preview</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">

<!-- extracted Squarespace header styling -->
<link rel="stylesheet" href="header.css">

<!-- inline styles that shipped with the header markup -->
<style>
{inline_css}
</style>

<!-- your overrides -->
<link rel="stylesheet" href="header.custom.css">
</head>
<body class="{body_cls}">
<!-- #siteWrapper is required: several Squarespace rules are scoped to it -->
<div id="siteWrapper" class="clearfix site-wrapper">
{header}
<main style="padding:4vw;font-family:Inter,system-ui,sans-serif">
  <h1>Header preview</h1>
  <p>Scroll target so fixed/transparent header behaviour is visible.</p>
  <div style="height:150vh"></div>
</main>
</div>
</body>
</html>
"""
open(os.path.join(HD, 'header_preview.html'), 'w', encoding='utf-8').write(out)
print('header_preview.html rebuilt')
