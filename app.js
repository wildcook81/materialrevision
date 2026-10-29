/**
 * MatLab Pro — Materials Science & Testing Lab Hub
 * Frontend Interactive Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // State & Data
  // =========================================================================
  let currentExpId = 'exp1';
  let allVivaQuestions = [];
  let currentQuizIndex = 0;

  // Initialize Viva Database for Quiz Mode & Global Search
  initVivaDatabase();

  // =========================================================================
  // Theme Toggle (Dark / Light)
  // =========================================================================
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('matlab_theme') || 'theme-dark';
  document.body.className = savedTheme;

  themeToggleBtn.addEventListener('click', () => {
    if (document.body.classList.contains('theme-dark')) {
      document.body.classList.replace('theme-dark', 'theme-light');
      localStorage.setItem('matlab_theme', 'theme-light');
      const m = document.getElementById('themeColorMeta');
      if (m) m.setAttribute('content', '#f8fafc');
    } else {
      document.body.classList.replace('theme-light', 'theme-dark');
      localStorage.setItem('matlab_theme', 'theme-dark');
      const m = document.getElementById('themeColorMeta');
      if (m) m.setAttribute('content', '#0a0f1d');
    }
  });

  // =========================================================================
  // Mobile Sidebar Drawer (hamburger + backdrop + swipe-to-close)
  // =========================================================================
  const sidebar         = document.getElementById('sidebar');
  const backdrop        = document.getElementById('sidebarBackdrop');
  const mobileMenuBtn   = document.getElementById('mobileMenuBtn');

  function openSidebar() {
    sidebar.classList.add('open');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden'; // prevent background scroll
    if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'true');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
    if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
  }

  // Tap backdrop to close
  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar);
  }

  // Swipe left on sidebar to close (touch gesture)
  if (sidebar) {
    let touchStartX = 0;
    sidebar.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    sidebar.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (dx < -60) closeSidebar(); // swiped left
    }, { passive: true });
  }

  // Auto-reset on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) closeSidebar();
  });

  // =========================================================================
  // Mobile Search Bar Toggle
  // =========================================================================
  const mobileSearchToggleBtn = document.getElementById('mobileSearchToggleBtn');
  const mobileSearchBar       = document.getElementById('mobileSearchBar');
  const mobileSearchInput     = document.getElementById('mobileSearchInput');
  const clearMobileSearchBtn  = document.getElementById('clearMobileSearchBtn');

  if (mobileSearchToggleBtn && mobileSearchBar) {
    mobileSearchToggleBtn.addEventListener('click', () => {
      mobileSearchBar.classList.toggle('active');
      if (mobileSearchBar.classList.contains('active') && mobileSearchInput) {
        mobileSearchInput.focus();
      }
    });
  }

  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', () => {
      const q = mobileSearchInput.value.trim().toLowerCase();
      clearMobileSearchBtn.style.display = q ? 'block' : 'none';
      if (q.length > 1) performSearch(q);
      else {
        const sp = document.getElementById('searchResultsSection');
        if (sp) sp.style.display = 'none';
      }
    });
  }

  if (clearMobileSearchBtn) {
    clearMobileSearchBtn.addEventListener('click', () => {
      mobileSearchInput.value = '';
      clearMobileSearchBtn.style.display = 'none';
      const sp = document.getElementById('searchResultsSection');
      if (sp) sp.style.display = 'none';
      mobileSearchInput.focus();
    });
  }

  // =========================================================================
  // Navigation: Sidebar Experiment Switching
  // =========================================================================
  const navItems = document.querySelectorAll('.nav-item');
  const expArticles = document.querySelectorAll('.exp-article');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.dataset.expId;
      switchExperiment(targetId);
    });
  });

  function switchExperiment(expId) {
    currentExpId = expId;

    // Update Sidebar Active state
    navItems.forEach(n => {
      if (n.dataset.expId === expId) {
        n.classList.add('active');
        n.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        n.classList.remove('active');
      }
    });

    // Update Article Active state
    expArticles.forEach(art => {
      if (art.id === `${expId}-content`) {
        art.classList.add('active');
      } else {
        art.classList.remove('active');
      }
    });

    // Reset subtabs to first tab for this experiment
    const activeArt = document.getElementById(`${expId}-content`);
    if (activeArt) {
      const firstSubtabBtn = activeArt.querySelector('.subtab-btn');
      if (firstSubtabBtn) {
        firstSubtabBtn.click();
      }
    }

    // Hide search results if visible
    const searchPanel = document.getElementById('searchResultsSection');
    if (searchPanel) searchPanel.style.display = 'none';

    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Re-run MathJax on the newly visible content
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }

    // Auto-close sidebar drawer on mobile after user picks an experiment
    if (window.innerWidth <= 1024) closeSidebar();
  }

  // =========================================================================
  // Subtabs Bar Switching (How to Perform, Theory, Calc, Viva)
  // =========================================================================
  document.querySelectorAll('.subtabs-bar').forEach(bar => {
    const btns = bar.querySelectorAll('.subtab-btn');
    const parentArticle = bar.closest('.exp-article');

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const targetContentId = btn.dataset.target;
        const subtabContents = parentArticle.querySelectorAll('.subtab-content');
        subtabContents.forEach(content => {
          if (content.id === targetContentId) {
            content.classList.add('active');
            // Re-run MathJax on the newly visible subtab panel
            if (window.MathJax && window.MathJax.typesetPromise) {
              window.MathJax.typesetPromise([content]);
            }
          } else {
            content.classList.remove('active');
          }
        });
      });
    });
  });

  // =========================================================================
  // Viva Voce Accordion
  // =========================================================================
  document.querySelectorAll('.viva-q').forEach(qHeader => {
    qHeader.addEventListener('click', () => {
      const card = qHeader.closest('.viva-card');
      card.classList.toggle('open');
    });
  });

  // Toggle All Viva Questions Button
  document.querySelectorAll('.toggle-all-viva').forEach(btn => {
    btn.addEventListener('click', () => {
      const parentId = btn.dataset.parent;
      const parentEl = document.getElementById(parentId);
      if (!parentEl) return;

      const cards = parentEl.querySelectorAll('.viva-card');
      const anyClosed = Array.from(cards).some(c => !c.classList.contains('open'));

      cards.forEach(c => {
        if (anyClosed) {
          c.classList.add('open');
        } else {
          c.classList.remove('open');
        }
      });

      btn.textContent = anyClosed ? 'Collapse All Answers' : 'Expand All Answers';
    });
  });

  // =========================================================================
  // Lab Readiness Checklist Persistence & Progress
  // =========================================================================
  const allCheckboxes = document.querySelectorAll('input[type="checkbox"][data-check]');
  const readinessScoreEl = document.getElementById('readinessScore');
  const readinessBarEl = document.getElementById('readinessBar');

  // Load saved state
  allCheckboxes.forEach(cb => {
    const key = `matlab_check_${cb.dataset.check}`;
    const isChecked = localStorage.getItem(key) === 'true';
    cb.checked = isChecked;
    if (isChecked) {
      cb.closest('.check-item').classList.add('checked');
    }

    cb.addEventListener('change', () => {
      localStorage.setItem(key, cb.checked);
      if (cb.checked) {
        cb.closest('.check-item').classList.add('checked');
      } else {
        cb.closest('.check-item').classList.remove('checked');
      }
      updateReadinessProgress();
    });
  });

  function updateReadinessProgress() {
    const total = allCheckboxes.length;
    if (total === 0) return;
    const checkedCount = Array.from(allCheckboxes).filter(cb => cb.checked).length;
    const percent = Math.round((checkedCount / total) * 100);

    if (readinessScoreEl) readinessScoreEl.textContent = `${percent}%`;
    if (readinessBarEl) readinessBarEl.style.width = `${percent}%`;
  }
  updateReadinessProgress();

  // =========================================================================
  // Interactive Calculators
  // =========================================================================

  // --- Calculator 1: Metallography Optics & Grain Size ---
  const exp1CalcBtn = document.getElementById('exp1-calc-btn');
  if (exp1CalcBtn) {
    exp1CalcBtn.addEventListener('click', () => {
      const eye = parseFloat(document.getElementById('exp1-eye').value) || 10;
      const obj = parseFloat(document.getElementById('exp1-obj').value) || 10;
      const N = parseFloat(document.getElementById('exp1-grains').value) || 32;

      const totalMag = eye * obj;
      // N = 2^(G - 1) => G - 1 = log2(N) => G = 1 + (ln(N) / ln(2))
      const astmG = (1 + (Math.log(Math.max(1, N)) / Math.LN2)).toFixed(1);
      // Rough mean grain diameter from ASTM G: d ≈ 0.25 / (2^((G-1)/2)) in mm
      const diaMicrons = (250 / Math.pow(2, (parseFloat(astmG) - 1) / 2)).toFixed(1);

      document.getElementById('exp1-out-mag').textContent = `${totalMag}X`;
      document.getElementById('exp1-out-astm').textContent = `${astmG}`;
      document.getElementById('exp1-out-dia').textContent = `~${diaMicrons} µm`;
    });
  }

  // --- Calculator 2: Tensile Properties ---
  const exp2CalcBtn = document.getElementById('exp2-calc-btn');
  if (exp2CalcBtn) {
    exp2CalcBtn.addEventListener('click', () => {
      const L0 = parseFloat(document.getElementById('exp2-l0').value) || 50;
      const W0 = parseFloat(document.getElementById('exp2-w0').value) || 12.5;
      const t0 = parseFloat(document.getElementById('exp2-t0').value) || 3.0;

      const Py = (parseFloat(document.getElementById('exp2-py').value) || 10) * 1000; // N
      const Pmax = (parseFloat(document.getElementById('exp2-pmax').value) || 15) * 1000; // N
      const Pf = (parseFloat(document.getElementById('exp2-pf').value) || 12) * 1000; // N

      const Lf = parseFloat(document.getElementById('exp2-lf').value) || 60;
      const Wf = parseFloat(document.getElementById('exp2-wf').value) || 10;
      const tf = parseFloat(document.getElementById('exp2-tf').value) || 2.2;

      const A0 = W0 * t0;
      const Af = Wf * tf;

      const sy = Py / A0;
      const uts = Pmax / A0;
      const el = ((Lf - L0) / L0) * 100;
      const ra = Math.max(0, ((A0 - Af) / A0) * 100);

      document.getElementById('exp2-out-a0').textContent = `${A0.toFixed(2)} mm²`;
      document.getElementById('exp2-out-sy').textContent = `${sy.toFixed(1)} MPa`;
      document.getElementById('exp2-out-uts').textContent = `${uts.toFixed(1)} MPa`;
      document.getElementById('exp2-out-el').textContent = `${el.toFixed(1)}%`;
      document.getElementById('exp2-out-ra').textContent = `${ra.toFixed(1)}%`;
    });
  }

  // --- Calculator 3: Composite Batch Mixing ---
  const exp3CalcBtn = document.getElementById('exp3-calc-btn');
  if (exp3CalcBtn) {
    exp3CalcBtn.addEventListener('click', () => {
      const Wf = parseFloat(document.getElementById('exp3-wf').value) || 160;
      const ratio = parseFloat(document.getElementById('exp3-ratio').value) || 1.2;

      const totalMatrix = Wf * ratio;
      // 1 part hardener to 2 parts resin => 1/3 hardener, 2/3 resin
      const hardener = totalMatrix * (1 / 3);
      const resin = totalMatrix * (2 / 3);

      // Volume fraction estimate: assume rho_fiber = 2.54 g/cm3, rho_matrix = 1.15 g/cm3
      const vFiber = Wf / 2.54;
      const vMatrix = totalMatrix / 1.15;
      const Vf = ((vFiber / (vFiber + vMatrix)) * 100).toFixed(1);

      document.getElementById('exp3-out-matrix').textContent = `${totalMatrix.toFixed(1)} g`;
      document.getElementById('exp3-out-resin').textContent = `${resin.toFixed(1)} g`;
      document.getElementById('exp3-out-hard').textContent = `${hardener.toFixed(1)} g`;
      document.getElementById('exp3-out-vf').textContent = `~${Vf}%`;
    });
  }

  // --- Calculator 4: Impact Toughness ---
  const exp4CalcBtn = document.getElementById('exp4-calc-btn');
  if (exp4CalcBtn) {
    exp4CalcBtn.addEventListener('click', () => {
      const w = parseFloat(document.getElementById('exp4-w').value) || 12.7;
      const h = parseFloat(document.getElementById('exp4-h').value) || 10.16;
      const k = parseFloat(document.getElementById('exp4-k').value) || 18.5;
      const e0 = parseFloat(document.getElementById('exp4-e0').value) || 0.2;

      const netArea = w * h;
      const netEnergy = Math.max(0, k - e0);
      const isJmm2 = netEnergy / netArea;
      const isKJm2 = isJmm2 * 1000;

      document.getElementById('exp4-out-area').textContent = `${netArea.toFixed(2)} mm²`;
      document.getElementById('exp4-out-netenergy').textContent = `${netEnergy.toFixed(2)} J`;
      document.getElementById('exp4-out-is').textContent = `${isJmm2.toFixed(3)} J/mm² (${isKJm2.toFixed(1)} kJ/m²)`;
    });
  }

  // --- Calculator 5: Vernier Scale & Crack Length ---
  const exp5CalcBtn = document.getElementById('exp5-calc-btn');
  if (exp5CalcBtn) {
    exp5CalcBtn.addEventListener('click', () => {
      const smd = parseFloat(document.getElementById('exp5-smd').value) || 0.5;
      const vsd = parseFloat(document.getElementById('exp5-vsd').value) || 50;
      const lc = smd / vsd;
      document.getElementById('exp5-out-lc').value = `${lc.toFixed(3)} mm`;

      const r1a = parseFloat(document.getElementById('exp5-r1a').value) || 12.5;
      const r2a = parseFloat(document.getElementById('exp5-r2a').value) || 15.82;
      const a1 = Math.abs(r2a - r1a);

      const r1b = parseFloat(document.getElementById('exp5-r1b').value) || 12.5;
      const r2b = parseFloat(document.getElementById('exp5-r2b').value) || 16.14;
      const a2 = Math.abs(r2b - r1b);

      const r1c = parseFloat(document.getElementById('exp5-r1c').value) || 12.5;
      const r2c = parseFloat(document.getElementById('exp5-r2c').value) || 15.78;
      const a3 = Math.abs(r2c - r1c);

      const aAvg = (a1 + a2 + a3) / 3;

      document.getElementById('exp5-out-a1').textContent = `${a1.toFixed(2)} mm`;
      document.getElementById('exp5-out-a2').textContent = `${a2.toFixed(2)} mm`;
      document.getElementById('exp5-out-a3').textContent = `${a3.toFixed(2)} mm`;
      document.getElementById('exp5-out-avg').textContent = `${aAvg.toFixed(2)} mm`;
    });
  }

  // --- Calculator 6: Rotating Bending Fatigue ---
  const exp6CalcBtn = document.getElementById('exp6-calc-btn');
  if (exp6CalcBtn) {
    exp6CalcBtn.addEventListener('click', () => {
      const w = parseFloat(document.getElementById('exp6-w').value) || 12.0; // kg
      const l = parseFloat(document.getElementById('exp6-l').value) || 100; // mm
      const d = parseFloat(document.getElementById('exp6-d').value) || 8.0; // mm
      const rpm = parseFloat(document.getElementById('exp6-rpm').value) || 3500;
      const nf = parseFloat(document.getElementById('exp6-nf').value) || 284000;

      // Applied force F = W * 9.81 N
      const F = w * 9.80665;
      // Moment M = F * (l / 2)
      const M = (F * l) / 2; // N*mm
      // Z = pi * d^3 / 32
      const Z = (Math.PI * Math.pow(d, 3)) / 32;
      const sa = M / Z; // MPa

      // Duration: minutes = Nf / rpm
      const totalMinutes = nf / rpm;
      const hours = Math.floor(totalMinutes / 60);
      const mins = Math.floor(totalMinutes % 60);
      const secs = Math.round((totalMinutes * 60) % 60);

      document.getElementById('exp6-out-m').textContent = `${M.toFixed(1)} N·mm (${(M / 1000).toFixed(2)} N·m)`;
      document.getElementById('exp6-out-z').textContent = `${Z.toFixed(2)} mm³`;
      document.getElementById('exp6-out-sa').textContent = `${sa.toFixed(1)} MPa`;
      document.getElementById('exp6-out-time').textContent = `${hours}h ${mins}m ${secs}s`;
    });
  }

  // --- Calculator 7: Vickers Hardness ---
  const exp7CalcBtn = document.getElementById('exp7-calc-btn');
  if (exp7CalcBtn) {
    exp7CalcBtn.addEventListener('click', () => {
      const P = parseFloat(document.getElementById('exp7-p').value) || 10;
      const d1 = parseFloat(document.getElementById('exp7-d1').value) || 0.345;
      const d2 = parseFloat(document.getElementById('exp7-d2').value) || 0.349;

      const d = (d1 + d2) / 2;
      const hv = (1.8544 * P) / (d * d);

      // Approximations for structural steel:
      const bhn = (hv * 0.95).toFixed(0);
      // HRB approx = 130 - (500 / sqrt(HV))
      const hrb = Math.min(100, Math.max(0, 130 - (500 / Math.sqrt(hv)))).toFixed(0);

      document.getElementById('exp7-out-d').textContent = `${d.toFixed(4)} mm`;
      document.getElementById('exp7-out-hv').textContent = `${hv.toFixed(1)} HV${P}`;
      document.getElementById('exp7-out-bhn').textContent = `~${bhn} BHN`;
      document.getElementById('exp7-out-hrb').textContent = `~${hrb} HRB`;
    });
  }

  // --- Calculator 8: Heat Treatment Simulator ---
  const exp8CalcBtn = document.getElementById('exp8-calc-btn');
  if (exp8CalcBtn) {
    exp8CalcBtn.addEventListener('click', () => {
      const carbon = parseFloat(document.getElementById('exp8-carbon').value);
      const proc = document.getElementById('exp8-process').value;

      let phase = '';
      let hv = '';
      let duct = '';
      let app = '';

      if (carbon === 0.18) {
        // Mild steel
        if (proc === 'as-received') {
          phase = 'Equiaxed Ferrite (~80%) + Pearlite (~20%)';
          hv = '130–145 HV (75 HRB)';
          duct = 'High (~26% EL)';
          app = 'General structural framing, cold forming, shafts';
        } else if (proc === 'annealed') {
          phase = 'Coarse Polygonal Ferrite + Coarse Pearlite';
          hv = '110–125 HV (65 HRB)';
          duct = 'Maximum (~32% EL)';
          app = 'Deep drawing, stamping, optimum machinability';
        } else if (proc === 'normalized') {
          phase = 'Fine Equiaxed Ferrite + Fine Lamellar Pearlite';
          hv = '150–175 HV (82 HRB)';
          duct = 'Balanced (~24% EL)';
          app = 'Enhanced toughness, grain refinement, load gears';
        } else if (proc === 'quenched') {
          phase = 'Lath Martensite + Retained Proeutectoid Ferrite';
          hv = '280–360 HV (28–36 HRC)';
          duct = 'Low (~8% EL, Brittle)';
          app = 'Needs immediate tempering to prevent quench cracking';
        } else if (proc === 'tempered') {
          phase = 'Tempered Martensite (Ferrite + fine Fe₃C spheroids)';
          hv = '190–225 HV (90 HRB / 18 HRC)';
          duct = 'High (~20% EL, Tough)';
          app = 'Automotive axles, structural bolts, heavy duty pins';
        }
      } else if (carbon === 0.45) {
        // Medium carbon
        if (proc === 'quenched') {
          phase = 'Plate/Lath Martensite (Hard)';
          hv = '550–620 HV (52–56 HRC)';
          duct = 'Very Low (<3% EL)';
          app = 'High hardness dies, cutting edges';
        } else if (proc === 'tempered') {
          phase = 'Fine Tempered Martensite';
          hv = '320–380 HV (32–39 HRC)';
          duct = 'Moderate (~15% EL)';
          app = 'Connecting rods, engine crankshafts, transmission gears';
        } else {
          phase = 'Ferrite (~50%) + Pearlite (~50%)';
          hv = '180–220 HV (90 HRB)';
          duct = 'Good (~18% EL)';
          app = 'Forgings, machine spindles, rail axles';
        }
      } else {
        // High carbon 0.8%
        if (proc === 'quenched') {
          phase = '100% Acicular Martensite + Retained Austenite';
          hv = '700–850 HV (60–65 HRC)';
          duct = 'Extremely Brittle (<1% EL)';
          app = 'Hardened file teeth, razor blades, ball bearings';
        } else if (proc === 'tempered') {
          phase = 'Sorbite / Tempered Martensite';
          hv = '450–520 HV (45–50 HRC)';
          duct = 'Resilient (~10% EL)';
          app = 'Leaf & coil springs, chisels, punches';
        } else {
          phase = '100% Eutectoid Lamellar Pearlite';
          hv = '240–280 HV (25 HRC)';
          duct = 'Moderate (~12% EL)';
          app = 'Rail tracks, high-tensile wire ropes';
        }
      }

      document.getElementById('exp8-out-phase').textContent = phase;
      document.getElementById('exp8-out-hv').textContent = hv;
      document.getElementById('exp8-out-duct').textContent = duct;
      document.getElementById('exp8-out-app').textContent = app;
    });
  }

  // =========================================================================
  // Global Search Engine
  // =========================================================================
  const searchInput = document.getElementById('globalSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchResultsSection = document.getElementById('searchResultsSection');
  const searchResultsList = document.getElementById('searchResultsList');
  const searchQueryDisplay = document.getElementById('searchQueryDisplay');
  const closeSearchPanel = document.getElementById('closeSearchPanel');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      if (query.length > 0) {
        clearSearchBtn.style.display = 'block';
        performSearch(query);
      } else {
        clearSearchBtn.style.display = 'none';
        searchResultsSection.style.display = 'none';
      }
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      searchResultsSection.style.display = 'none';
      searchInput.focus();
    });

    closeSearchPanel.addEventListener('click', () => {
      searchResultsSection.style.display = 'none';
    });
  }

  function performSearch(query) {
    searchResultsSection.style.display = 'block';
    searchQueryDisplay.textContent = query;
    searchResultsList.innerHTML = '';

    const matches = [];

    // Search Viva Database
    allVivaQuestions.forEach(item => {
      if (item.question.toLowerCase().includes(query) || item.answer.toLowerCase().includes(query)) {
        matches.push({
          type: 'Viva Voce Question',
          expId: item.expId,
          title: item.question,
          snippet: item.answer.substring(0, 180) + '...',
          targetSubtab: 'viva'
        });
      }
    });

    // Search Headings & Procedures
    document.querySelectorAll('.exp-article').forEach(art => {
      const expId = art.id.replace('-content', '');
      const heading = art.querySelector('.exp-heading')?.textContent || '';
      const summary = art.querySelector('.exp-summary')?.textContent || '';

      if (heading.toLowerCase().includes(query) || summary.toLowerCase().includes(query)) {
        matches.push({
          type: 'Experiment Overview',
          expId: expId,
          title: heading,
          snippet: summary.substring(0, 160) + '...',
          targetSubtab: 'procedure'
        });
      }
    });

    if (matches.length === 0) {
      searchResultsList.innerHTML = `<div class="result-card"><p>No direct matches found for "${query}". Try searching for terms like <em>martensite, vernier, impact, charpy, vickers, ASTM E8, nital</em>.</p></div>`;
      return;
    }

    matches.slice(0, 15).forEach(m => {
      const card = document.createElement('div');
      card.className = 'result-card';
      card.innerHTML = `
        <span class="result-badge">${m.type} • ${m.expId.toUpperCase()}</span>
        <h4 class="result-title">${highlightQuery(m.title, query)}</h4>
        <p class="result-snippet">${highlightQuery(m.snippet, query)}</p>
      `;

      card.addEventListener('click', () => {
        switchExperiment(m.expId);
        // Switch to the target subtab
        const art = document.getElementById(`${m.expId}-content`);
        if (art) {
          const btn = art.querySelector(`.subtab-btn[data-target="${m.expId}-${m.targetSubtab}"]`);
          if (btn) btn.click();
        }
        searchResultsSection.style.display = 'none';
      });

      searchResultsList.appendChild(card);
    });
  }

  function highlightQuery(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark style="background: rgba(56, 189, 248, 0.3); color: inherit; padding: 0 2px; border-radius: 2px;">$1</mark>');
  }

  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // =========================================================================
  // Viva Flashcard / Quiz Mode
  // =========================================================================
  const quizModeBtn = document.getElementById('quizModeBtn');
  const quizModal = document.getElementById('quizModal');
  const closeQuizBtn = document.getElementById('closeQuizBtn');
  const flashcard = document.getElementById('flashcard');
  const flipCardBtn = document.getElementById('flipCardBtn');
  const prevCardBtn = document.getElementById('prevCardBtn');
  const nextCardBtn = document.getElementById('nextCardBtn');
  const quizQuestionText = document.getElementById('quizQuestionText');
  const quizAnswerText = document.getElementById('quizAnswerText');
  const quizExpBadge = document.getElementById('quizExpBadge');
  const quizProgressText = document.getElementById('quizProgressText');

  function initVivaDatabase() {
    allVivaQuestions = [];
    document.querySelectorAll('.exp-article').forEach(art => {
      const expId = art.id.replace('-content', '');
      const expName = art.querySelector('.exp-heading')?.textContent || expId;

      art.querySelectorAll('.viva-card').forEach((vc, idx) => {
        const q = vc.querySelector('.viva-q h4')?.textContent || '';
        const a = vc.querySelector('.viva-a')?.innerHTML || '';

        allVivaQuestions.push({
          expId: expId,
          expName: expName,
          index: idx + 1,
          question: q,
          answer: a
        });
      });
    });
  }

  if (quizModeBtn && quizModal) {
    quizModeBtn.addEventListener('click', () => {
      openQuiz();
    });

    closeQuizBtn.addEventListener('click', () => {
      quizModal.classList.remove('active');
    });

    // Close on backdrop click
    quizModal.addEventListener('click', (e) => {
      if (e.target === quizModal) {
        quizModal.classList.remove('active');
      }
    });

    // Flip card trigger
    flashcard.addEventListener('click', () => {
      flashcard.classList.toggle('flipped');
    });

    flipCardBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      flashcard.classList.toggle('flipped');
    });

    // Keyboard navigation: Space to flip, Arrow keys to navigate
    document.addEventListener('keydown', (e) => {
      if (!quizModal.classList.contains('active')) return;

      if (e.code === 'Space') {
        e.preventDefault();
        flashcard.classList.toggle('flipped');
      } else if (e.code === 'ArrowRight') {
        goToNextCard();
      } else if (e.code === 'ArrowLeft') {
        goToPrevCard();
      } else if (e.code === 'Escape') {
        quizModal.classList.remove('active');
      }
    });

    nextCardBtn.addEventListener('click', goToNextCard);
    prevCardBtn.addEventListener('click', goToPrevCard);
  }

  function openQuiz() {
    // Find index of first question in current experiment
    const firstMatch = allVivaQuestions.findIndex(q => q.expId === currentExpId);
    currentQuizIndex = firstMatch >= 0 ? firstMatch : 0;
    renderQuizCard();
    quizModal.classList.add('active');
  }

  function renderQuizCard() {
    if (allVivaQuestions.length === 0) return;
    const cardData = allVivaQuestions[currentQuizIndex];

    flashcard.classList.remove('flipped');
    quizExpBadge.textContent = `${cardData.expId.toUpperCase()} • Q${cardData.index}`;
    quizProgressText.textContent = `Card ${currentQuizIndex + 1} of ${allVivaQuestions.length}`;
    quizQuestionText.textContent = cardData.question;
    quizAnswerText.innerHTML = cardData.answer;
  }

  function goToNextCard() {
    if (currentQuizIndex < allVivaQuestions.length - 1) {
      currentQuizIndex++;
      renderQuizCard();
    } else {
      // Loop back to start
      currentQuizIndex = 0;
      renderQuizCard();
    }
  }

  function goToPrevCard() {
    if (currentQuizIndex > 0) {
      currentQuizIndex--;
      renderQuizCard();
    } else {
      currentQuizIndex = allVivaQuestions.length - 1;
      renderQuizCard();
    }
  }

  // =========================================================================
  // Print Lab Cheat Sheet
  // =========================================================================
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      // Temporarily expand all viva questions for clean PDF printout
      document.querySelectorAll('.viva-card').forEach(c => c.classList.add('open'));
      window.print();
    });
  }
});
