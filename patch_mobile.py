import re

with open(r'C:\Users\piyus\materials_lab_hub\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Insert hamburger button before logo-box inside header-left
OLD1 = '    <div class="header-left">\n      <div class="logo-box">'
NEW1 = '''    <div class="header-left">
      <!-- Hamburger -- auto-shown on phones and tablets -->
      <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Open experiment menu" aria-expanded="false">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <line x1="3" y1="6"  x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <div class="logo-box">'''
html = html.replace(OLD1, NEW1, 1)

# 2. Add mobile search toggle before quiz button
OLD2 = '    <div class="header-right">\n      <!-- Mobile search toggle -->'
if OLD2 not in html:
    OLD2 = '    <div class="header-right">\n      <button id="quizModeBtn"'
    NEW2 = '''    <div class="header-right">
      <!-- Mobile search toggle -->
      <button id="mobileSearchToggleBtn" class="nav-action-btn icon-only" title="Search" style="display:none;">
        <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
      </button>
      <button id="quizModeBtn"'''
    html = html.replace(OLD2, NEW2, 1)

# 3. Insert mobile search bar + backdrop right after </header>
OLD3 = '  </header>\n\n  <!-- Main Container'
NEW3 = '''  </header>

  <!-- Mobile Search Bar -->
  <div class="mobile-search-bar" id="mobileSearchBar">
    <div class="search-wrapper">
      <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
      </svg>
      <input type="text" id="mobileSearchInput" placeholder="Search experiments, viva, formulas..." autocomplete="off">
      <button id="clearMobileSearchBtn" class="clear-btn" style="display:none;">&times;</button>
    </div>
  </div>

  <!-- Sidebar backdrop -- tap to close drawer on mobile -->
  <div class="sidebar-backdrop" id="sidebarBackdrop"></div>

  <!-- Main Container'''
html = html.replace(OLD3, NEW3, 1)

with open(r'C:\Users\piyus\materials_lab_hub\index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('HTML patched OK')
