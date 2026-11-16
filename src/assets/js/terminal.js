(() => {
  const fsData = window.GEEKONAUT_FS;
  const shellEl = document.getElementById("terminal-app");
  if (!fsData || !shellEl) return;

  const viewport = document.getElementById("terminal-viewport");
  const form = document.getElementById("terminal-form");
  const input = document.getElementById("terminal-input");
  const promptLabel = document.getElementById("terminal-prompt-label");
  const touchbar = document.getElementById("terminal-touchbar");

  let cwd = "/home/geekonaut";
  const history = [];
  let historyIdx = -1;

  // Build virtual filesystem tree in memory from window.GEEKONAUT_FS
  const vfs = {
    "/": { type: "dir", children: ["home", "etc", "proc", "usr"] },
    "/home": { type: "dir", children: ["geekonaut"] },
    "/home/geekonaut": {
      type: "dir",
      children: ["README.txt", "about.md", ".bashrc", "blog", "stuff"]
    },
    "/home/geekonaut/README.txt": {
      type: "file",
      size: "640 B",
      date: "2026-11-16",
      url: "/",
      title: "Welcome to Geekonaut OS 8-Bit Shell",
      content: [
        "==================================================================",
        "  GEEKONAUT-OS v4.2 // INTERACTIVE FILESYSTEM SHELL (gsh)         ",
        "==================================================================",
        "",
        "Welcome, traveler! Every page, blog post, and project on this",
        "website is mounted right here in /home/geekonaut.",
        "",
        "QUICK COMMANDS:",
        "  ls -la          List files in current directory",
        "  tree            Show full directory tree of the website",
        "  cd blog         Enter the blog directory (or tap 📁 blog/)",
        "  cd stuff        Enter the stuff/projects directory",
        "  cat <file>      Read any markdown/text file right here",
        "  open <file>     Navigate to the full web page for <file>",
        "  grep <term>     Search across all posts & projects",
        "  neofetch        Display 8-bit system info & ASCII art",
        "  fortune         Print a nerdy fortune cookie",
        "  matrix          Run 8-bit phosphor digital rain",
        "  theme [mode]    Switch color theme (light, dark, system)",
        "  clear           Clear terminal screen",
        "",
        "TIP: On mobile or desktop, you can also tap any yellow [📁 dir/]",
        "or cyan [📄 file.md] badge in the output to open it immediately!"
      ].join("\n")
    },
    "/home/geekonaut/.bashrc": {
      type: "file",
      size: "412 B",
      date: "2026-11-16",
      content: [
        "# ~/.bashrc: executed by gsh(1) for non-login shells",
        "export USER='geekonaut'",
        "export REAL_NAME='Martin Splitt'",
        "export HANDLE='@splitti.online'",
        "export EDITOR='vim'",
        "export COFFEE_LEVEL='CRITICAL'",
        "alias ll='ls -la'",
        "alias please='sudo'",
        "alias exit='echo \"You can check out any time you like, but you can never leave.\"'",
        "# Remember: Progressive enhancement saves lives and crawl budgets!"
      ].join("\n")
    },
    "/home/geekonaut/about.md": {
      type: "file",
      size: fsData.about.size || "2.4 KB",
      date: fsData.about.date || "2026-11-16",
      url: "/about/",
      title: fsData.about.title || "About Martin Splitt",
      content: fsData.about.content
    },
    "/home/geekonaut/blog": {
      type: "dir",
      children: fsData.blog.map((p) => p.filename)
    },
    "/home/geekonaut/stuff": {
      type: "dir",
      children: fsData.stuff.map((s) => s.filename)
    },
    "/etc": {
      type: "dir",
      children: ["motd", "hosts", "os-release"]
    },
    "/etc/motd": {
      type: "file",
      size: "318 B",
      date: "1989-01-01",
      content: "GEEKONAUT MAINFRAME // ZURICH NODE\n64KB RAM SYSTEM - 38911 BASIC BYTES FREE\nREADY."
    },
    "/etc/hosts": {
      type: "file",
      size: "184 B",
      date: "2026-11-16",
      content: [
        "127.0.0.1       localhost",
        "192.0.2.42      geekonaut.de",
        "192.0.2.98      splitti.online",
        "192.0.2.100     thatsaweb.site"
      ].join("\n")
    },
    "/etc/os-release": {
      type: "file",
      size: "210 B",
      date: "2026-11-16",
      content: [
        'NAME="GeekonautOS"',
        'VERSION="4.2 (8-Bit Club-Mate Edition)"',
        'ID=geekonaut',
        'PRETTY_NAME="GeekonautOS 4.2 LTS"',
        'HOME_URL="https://geekonaut.de/"'
      ].join("\n")
    },
    "/proc": {
      type: "dir",
      children: ["cpuinfo", "meminfo"]
    },
    "/proc/cpuinfo": {
      type: "file",
      size: "256 B",
      date: "2026-11-16",
      content: [
        "processor       : 0",
        "vendor_id       : GeekonautSilicon",
        "model name      : MOS 6510 / Z80 Quantum Co-Processor @ 4.77MHz (Turbo 8MHz)",
        "flags           : fpu 8bit chiptune",
        "bogomips        : 42.00"
      ].join("\n")
    },
    "/proc/meminfo": {
      type: "file",
      size: "140 B",
      date: "2026-11-16",
      content: [
        "MemTotal:            640 kB",
        "MemFree:             512 kB",
        "TeaBuffer:          1024 kB",
        "JSBundleBloat:         0 kB"
      ].join("\n")
    },
    "/usr": {
      type: "dir",
      children: ["bin"]
    },
    "/usr/bin": {
      type: "dir",
      children: ["fortune", "matrix", "neofetch"]
    },
    "/usr/bin/neofetch": {
      type: "file",
      size: "512 B",
      date: "2026-11-16",
      content: "#!/bin/gsh\n# Run 'neofetch' to display system summary"
    },
    "/usr/bin/fortune": {
      type: "file",
      size: "512 B",
      date: "2026-11-16",
      content: "#!/bin/gsh\n# Run 'fortune' to receive wisdom"
    },
    "/usr/bin/matrix": {
      type: "file",
      size: "512 B",
      date: "2026-11-16",
      content: "#!/bin/gsh\n# Run 'matrix' to see behind the curtain"
    }
  };

  // Mount blog posts into /home/geekonaut/blog/
  fsData.blog.forEach((post) => {
    vfs[`/home/geekonaut/blog/${post.filename}`] = {
      type: "file",
      size: post.size,
      date: post.date,
      url: post.url,
      title: post.title,
      tags: post.tags,
      summary: post.summary,
      content: post.content
    };
  });

  // Mount stuff items into /home/geekonaut/stuff/
  fsData.stuff.forEach((item) => {
    vfs[`/home/geekonaut/stuff/${item.filename}`] = {
      type: "file",
      size: item.size,
      date: item.date,
      url: item.url,
      externalUrl: item.externalUrl,
      repoUrl: item.repoUrl,
      title: item.title,
      category: item.category,
      summary: item.summary,
      content: item.content
    };
  });

  // Path resolution helpers
  function formatShortPath(p) {
    if (p === "/home/geekonaut") return "~";
    if (p.startsWith("/home/geekonaut/")) return "~/" + p.slice("/home/geekonaut/".length);
    return p;
  }

  function resolvePath(inputPath = "") {
    let raw = inputPath.trim();
    if (!raw || raw === "~") return "/home/geekonaut";
    if (raw.startsWith("~/")) {
      raw = "/home/geekonaut/" + raw.slice(2);
    } else if (!raw.startsWith("/")) {
      raw = (cwd === "/" ? "" : cwd) + "/" + raw;
    }
    const parts = raw.split("/").filter(Boolean);
    const resolved = [];
    for (const part of parts) {
      if (part === ".") continue;
      if (part === "..") {
        resolved.pop();
      } else {
        resolved.push(part);
      }
    }
    return "/" + resolved.join("/");
  }

  function updatePrompt() {
    const shortCwd = formatShortPath(cwd);
    promptLabel.textContent = `geekonaut@zurich:${shortCwd}$`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function appendLine(html, className = "term-line") {
    const div = document.createElement("div");
    div.className = className;
    div.innerHTML = html;
    viewport.appendChild(div);
    viewport.scrollTop = viewport.scrollHeight;
    return div;
  }

  function echoCommand(cmdStr) {
    const shortCwd = formatShortPath(cwd);
    appendLine(
      `<span class="term-prompt-echo">geekonaut@zurich:<span class="term-path">${escapeHtml(shortCwd)}</span>$</span> ${escapeHtml(cmdStr)}`
    );
  }

  // Create clickable button HTML for a directory or file
  function renderItemBadge(name, fullPath, isDir) {
    const icon = isDir ? "📁" : "📄";
    const suffix = isDir ? "/" : "";
    const cls = isDir ? "term-item-btn is-dir" : "term-item-btn";
    const cmd = isDir ? `cd ${fullPath} && ls -la` : `cat ${fullPath}`;
    return `<button type="button" class="${cls}" data-term-cmd="${escapeHtml(cmd)}" title="Click to run: ${escapeHtml(cmd)}">${icon} ${escapeHtml(name + suffix)}</button>`;
  }

  // --- Command Implementations ---
  const fortunes = [
    "\"It depends.\" — Ancient Google Search Relations Proverb",
    "\"The best JavaScript framework is the one that sends HTML first.\"",
    "\"640KB of client-side state management ought to be enough for nobody.\"",
    "\"In darkroom photography and CSS, timing and contrast are everything.\"",
    "\"At 30 meters underwater, nobody complains about your webpack config.\"",
    "\"A progressive enhancement a day keeps the blank white page away.\"",
    "\"Googlebot loves clean semantic HTML almost as much as Martin loves Club-Mate.\""
  ];

  function cmdHelp() {
    appendLine(
      `<div class="term-output-box">` +
        `<strong>GEEKONAUT SHELL (gsh v4.2) — AVAILABLE COMMANDS:</strong>\n` +
        `  <strong>ls [-la] [dir]</strong>   List directory contents (tap items to open!)\n` +
        `  <strong>cd &lt;dir&gt;</strong>         Change directory (e.g. <code>cd blog</code>, <code>cd ~/stuff</code>, <code>cd ..</code>)\n` +
        `  <strong>cat &lt;file&gt;</strong>       Read file content right in the terminal\n` +
        `  <strong>open &lt;file&gt;</strong>      Open the full web page for a file or section\n` +
        `  <strong>tree [dir]</strong>       Display interactive tree of the filesystem\n` +
        `  <strong>grep &lt;word&gt;</strong>      Search text across all blog posts, stuff &amp; about\n` +
        `  <strong>pwd</strong>              Print current working directory\n` +
        `  <strong>neofetch</strong>         Display 8-bit ASCII portrait &amp; system specs\n` +
        `  <strong>fortune</strong>          Receive nerdy wisdom\n` +
        `  <strong>cowsay [text]</strong>    Let an 8-bit ASCII cow speak\n` +
        `  <strong>matrix</strong>           Launch 8-bit phosphor digital rain\n` +
        `  <strong>theme [mode]</strong>     Set theme: <code>light</code>, <code>dark</code>, or <code>system</code>\n` +
        `  <strong>sfx [on|off]</strong>     Toggle 8-bit chiptune sound effects\n` +
        `  <strong>clear</strong>            Clear terminal output` +
        `</div>`
    );
  }

  function cmdLs(args) {
    const flags = args.filter((a) => a.startsWith("-")).join("");
    const showAll = flags.includes("a");
    const showLong = flags.includes("l");
    const targetArg = args.find((a) => !a.startsWith("-")) || cwd;
    const targetPath = resolvePath(targetArg);
    const node = vfs[targetPath];

    if (!node) {
      if (window.GeekSFX) window.GeekSFX.error();
      appendLine(`ls: cannot access '${escapeHtml(targetArg)}': No such file or directory`);
      return;
    }

    if (node.type === "file") {
      const name = targetPath.split("/").pop();
      appendLine(renderItemBadge(name, targetPath, false));
      return;
    }

    const entries = node.children.filter((name) => showAll || !name.startsWith("."));
    if (showLong) {
      let rows = `<div class="term-output-box">total ${entries.length}\n`;
      if (showAll && targetPath !== "/") {
        const parentPath = resolvePath(targetPath + "/..");
        rows += `drwxr-xr-x  geekonaut  staff     4.0 KB  2026-11-16  ${renderItemBadge("..", parentPath, true)}\n`;
      }
      entries.forEach((name) => {
        const childPath = (targetPath === "/" ? "" : targetPath) + "/" + name;
        const child = vfs[childPath];
        const isDir = child && child.type === "dir";
        const perms = isDir ? "drwxr-xr-x" : "-rw-r--r--";
        const size = (child && child.size ? child.size : isDir ? "4.0 KB" : "1.0 KB").padStart(8, " ");
        const date = child && child.date ? child.date : "2026-11-16";
        const titleHint = child && child.title ? `  <span class="text-muted"># ${escapeHtml(child.title)}</span>` : "";
        rows += `${perms}  geekonaut  staff  ${escapeHtml(size)}  ${escapeHtml(date)}  ${renderItemBadge(name, childPath, isDir)}${titleHint}\n`;
      });
      rows += `</div>`;
      appendLine(rows);
    } else {
      let html = `<div class="term-output-box">`;
      if (targetPath !== "/") {
        const parentPath = resolvePath(targetPath + "/..");
        html += renderItemBadge("..", parentPath, true);
      }
      entries.forEach((name) => {
        const childPath = (targetPath === "/" ? "" : targetPath) + "/" + name;
        const child = vfs[childPath];
        const isDir = child && child.type === "dir";
        html += renderItemBadge(name, childPath, isDir);
      });
      html += `</div>`;
      appendLine(html);
    }
  }

  function cmdCd(args) {
    const targetArg = args[0] || "~";
    const targetPath = resolvePath(targetArg);
    const node = vfs[targetPath];
    if (!node) {
      if (window.GeekSFX) window.GeekSFX.error();
      appendLine(`cd: no such file or directory: ${escapeHtml(targetArg)}`);
      return false;
    }
    if (node.type !== "dir") {
      if (window.GeekSFX) window.GeekSFX.error();
      appendLine(`cd: not a directory: ${escapeHtml(targetArg)} (Tip: use 'cat ${escapeHtml(targetArg)}' to read it!)`);
      return false;
    }
    cwd = targetPath;
    updatePrompt();
    return true;
  }

  function cmdCat(args) {
    if (!args.length) {
      appendLine("Usage: cat <filename> (e.g., cat README.txt, cat about.md, or tap a file in ls)");
      return;
    }
    const targetPath = resolvePath(args[0]);
    // Also check if user omitted .md
    const node = vfs[targetPath] || vfs[targetPath + ".md"] || vfs[targetPath + ".txt"];
    const actualPath = vfs[targetPath]
      ? targetPath
      : vfs[targetPath + ".md"]
      ? targetPath + ".md"
      : targetPath + ".txt";

    if (!node) {
      if (window.GeekSFX) window.GeekSFX.error();
      appendLine(`cat: ${escapeHtml(args[0])}: No such file or directory`);
      return;
    }
    if (node.type === "dir") {
      appendLine(`cat: ${escapeHtml(args[0])}: Is a directory. Running 'ls -la ${escapeHtml(args[0])}' instead:`);
      cmdLs(["-la", actualPath]);
      return;
    }

    let header = `<div class="term-output-box">`;
    header += `<strong>FILE:</strong> ${escapeHtml(actualPath)} (${escapeHtml(node.size || "1 KB")})`;
    if (node.date) header += ` | <strong>DATE:</strong> ${escapeHtml(node.date)}`;
    if (node.url) {
      header += `\n<a href="${escapeHtml(node.url)}" class="term-item-btn">↗ Open Rendered Web Page (${escapeHtml(node.url)})</a>`;
    }
    if (node.externalUrl) {
      header += ` <a href="${escapeHtml(node.externalUrl)}" target="_blank" rel="noopener" class="term-item-btn">🌐 Live Project</a>`;
    }
    if (node.repoUrl) {
      header += ` <a href="${escapeHtml(node.repoUrl)}" target="_blank" rel="noopener" class="term-item-btn">⌨ GitHub Repo</a>`;
    }
    header += `\n------------------------------------------------------------------\n`;
    header += escapeHtml(node.content || "");
    header += `</div>`;
    appendLine(header);
  }

  function cmdOpen(args) {
    if (!args.length) {
      appendLine("Usage: open <file-or-dir> (e.g., open blog, open about.md)");
      return;
    }
    const raw = args[0];
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      appendLine(`Opening external URL: <a href="${escapeHtml(raw)}" target="_blank" rel="noopener">${escapeHtml(raw)}</a>`);
      window.open(raw, "_blank", "noopener");
      return;
    }
    const targetPath = resolvePath(raw);
    const node = vfs[targetPath] || vfs[targetPath + ".md"];
    if (targetPath === "/home/geekonaut/blog") {
      window.location.href = "/blog/";
      return;
    }
    if (targetPath === "/home/geekonaut/stuff") {
      window.location.href = "/stuff/";
      return;
    }
    if (node && node.url) {
      appendLine(`Navigating to ${escapeHtml(node.url)} ...`);
      window.location.href = node.url;
      return;
    }
    appendLine(`open: cannot resolve web URL for '${escapeHtml(raw)}'. Try 'cat ${escapeHtml(raw)}'.`);
  }

  function cmdTree(args) {
    const startPath = resolvePath(args[0] || cwd);
    const rootNode = vfs[startPath];
    if (!rootNode || rootNode.type !== "dir") {
      appendLine(`tree: '${escapeHtml(args[0] || cwd)}' is not a directory`);
      return;
    }
    let out = `<div class="term-output-box"><strong>${escapeHtml(startPath)}</strong>\n`;
    function walk(dirPath, prefix) {
      const n = vfs[dirPath];
      if (!n || !n.children) return;
      n.children.forEach((name, idx) => {
        const isLast = idx === n.children.length - 1;
        const branch = isLast ? "└── " : "├── ";
        const childPath = (dirPath === "/" ? "" : dirPath) + "/" + name;
        const child = vfs[childPath];
        const isDir = child && child.type === "dir";
        out += `${prefix}${branch}${renderItemBadge(name, childPath, isDir)}\n`;
        if (isDir) {
          walk(childPath, prefix + (isLast ? "    " : "│   "));
        }
      });
    }
    walk(startPath, "");
    out += `</div>`;
    appendLine(out);
  }

  function cmdGrep(args) {
    const query = args.join(" ").trim();
    if (!query) {
      appendLine("Usage: grep <search-term> (e.g. grep javascript, grep seo, grep three.js)");
      return;
    }
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const matches = [];
    Object.keys(vfs).forEach((path) => {
      const node = vfs[path];
      if (node.type === "file" && node.content) {
        const lines = node.content.split("\n");
        lines.forEach((line, i) => {
          if (regex.test(line) || (node.title && regex.test(node.title))) {
            matches.push({ path, lineNum: i + 1, line: line.trim() });
          }
        });
      }
    });

    if (!matches.length) {
      appendLine(`grep: no matches found for '${escapeHtml(query)}'`);
      return;
    }

    let out = `<div class="term-output-box">Found ${matches.length} match(es) for '<strong>${escapeHtml(query)}</strong>':\n`;
    matches.slice(0, 15).forEach((m) => {
      const name = m.path.split("/").pop();
      out += `${renderItemBadge(name, m.path, false)} <span class="text-muted">:${m.lineNum}:</span> ${escapeHtml(m.line.slice(0, 90))}\n`;
    });
    out += `</div>`;
    appendLine(out);
  }

  function cmdNeofetch() {
    const art = [
      "   .------------------.     geekonaut@zurich",
      "   | .--------------. |     ----------------",
      "   | |   >_ GEEK    | |     OS: GeekonautOS 4.2 (8-Bit)",
      "   | |   [O]  [O]   | |     Host: Martin Splitt (@splitti.online)",
      "   | |     ____     | |     Role: Friendly Internet Fairy & DevRel",
      "   | '--------------' |     Kernel: 11ty Static Generator (0KB bloat)",
      "   '------------------'     Shell: gsh 4.2 (Progressive Enhancement)",
      "    / :::::::::::::: \\      Content: " + fsData.blog.length + " blog posts, " + fsData.stuff.length + " stuff cartridges",
      "   '------------------'     Theme: " + (window.GeekTheme ? window.GeekTheme.get().toUpperCase() : "AUTO")
    ].join("\n");
    appendLine(`<div class="term-output-box">${escapeHtml(art)}</div>`);
  }

  function cmdCowsay(args) {
    const msg = args.length ? args.join(" ") : fortunes[Math.floor(Math.random() * fortunes.length)];
    const bar = "-".repeat(Math.min(msg.length + 2, 54));
    const cow = [
      ` ${bar}`,
      `< ${msg} >`,
      ` ${bar}`,
      "        \\   ^__^",
      "         \\  (oo)\\_______",
      "            (__)\\       )\\/\\",
      "                ||----w |",
      "                ||     ||"
    ].join("\n");
    appendLine(`<div class="term-output-box">${escapeHtml(cow)}</div>`);
  }

  function cmdMatrix(args) {
    // Remove any existing overlay first
    const existing = shellEl.querySelector(".matrix-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "matrix-overlay";
    overlay.setAttribute("role", "region");
    overlay.setAttribute("aria-label", "Matrix digital rain animation");

    const canvas = document.createElement("canvas");
    canvas.className = "matrix-canvas";
    overlay.appendChild(canvas);

    const hud = document.createElement("div");
    hud.className = "matrix-hud";
    hud.innerHTML = `
      <span><strong>cmatrix v4.2</strong> // Follow the white rabbit 🐇</span>
      <div style="display:flex; gap:0.4rem;">
        <button type="button" class="pixel-btn" id="matrix-color-btn">🎨 Color</button>
        <button type="button" class="pixel-btn" id="matrix-pause-btn">⏸ Pause</button>
        <button type="button" class="pixel-btn" id="matrix-exit-btn">✕ Exit [Q/Esc]</button>
      </div>
    `;
    overlay.appendChild(hud);
    shellEl.appendChild(overlay);

    const ctx = canvas.getContext("2d");
    const glyphs =
      "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEF<>/{}[]#$*+=~GEEKONAUT";
    const secretWords = ["WEB SURFER", "BOT WRANGLER", "ZURICH", "11TY", "RUSTY", "CLUBMATE", "WEBGL"];

    const palettes = [
      { name: "Phosphor Green", head: "#eafff5", bright: "#38f29b", mid: "#139a5b", dim: "#09482b" },
      { name: "Cyber Cyan", head: "#ffffff", bright: "#4cc9f0", mid: "#0077b6", dim: "#033649" },
      { name: "Amber CRT", head: "#fff8d6", bright: "#ffd166", mid: "#d97706", dim: "#6b3800" },
      { name: "Synth Magenta", head: "#ffe5f0", bright: "#ff6b9d", mid: "#b5179e", dim: "#480ca8" }
    ];
    let paletteIdx = args && args[0] === "amber" ? 2 : args && args[0] === "cyan" ? 1 : 0;

    const fontSize = 15;
    let cols = 0;
    let drops = [];
    let speeds = [];
    let trails = [];
    let words = [];

    function resize() {
      const rect = overlay.getBoundingClientRect();
      canvas.width = Math.max(300, Math.floor(rect.width));
      canvas.height = Math.max(240, Math.floor(rect.height));
      cols = Math.floor(canvas.width / fontSize);
      drops = Array.from({ length: cols }, () => Math.random() * -40);
      speeds = Array.from({ length: cols }, () => 0.35 + Math.random() * 0.55);
      trails = Array.from({ length: cols }, () => 10 + Math.floor(Math.random() * 18));
      words = Array.from({ length: cols }, () =>
        Math.random() < 0.18 ? secretWords[Math.floor(Math.random() * secretWords.length)] : null
      );
      ctx.fillStyle = "#050807";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    resize();
    window.addEventListener("resize", resize);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let paused = reducedMotion;
    let animId = null;
    const startTime = performance.now();
    const introMessages = [
      "Wake up, Web Surfer...",
      "The Web Platform has you...",
      "Follow the white rabbit. 🐇"
    ];
    const msPerMessage = 4800; // 1.8s typing + 3.0s reading hold per message

    const pauseBtn = hud.querySelector("#matrix-pause-btn");
    const colorBtn = hud.querySelector("#matrix-color-btn");
    const exitBtn = hud.querySelector("#matrix-exit-btn");

    if (paused) {
      pauseBtn.textContent = "▶ Play";
    }

    function drawStep(showBanner = true) {
      const pal = palettes[paletteIdx];

      // Translucent black fade creates phosphor persistence trail
      ctx.fillStyle = "rgba(5, 8, 7, 0.14)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textBaseline = "top";

      for (let i = 0; i < cols; i++) {
        const yRow = Math.floor(drops[i]);
        if (yRow >= 0) {
          const x = i * fontSize;
          const y = yRow * fontSize;

          const word = words[i];
          const ch = word
            ? word[Math.abs(yRow) % word.length]
            : glyphs[Math.floor(Math.random() * glyphs.length)];

          // Draw bright trailing character one cell above head
          if (yRow > 0) {
            const prevCh = word
              ? word[Math.abs(yRow - 1) % word.length]
              : glyphs[Math.floor(Math.random() * glyphs.length)];
            ctx.fillStyle = Math.random() > 0.25 ? pal.bright : pal.mid;
            ctx.fillText(prevCh, x, (yRow - 1) * fontSize);
          }

          // Draw glowing white-hot leading glyph
          ctx.fillStyle = pal.head;
          ctx.fillText(ch, x, y);
        }

        drops[i] += speeds[i];
        if (drops[i] * fontSize > canvas.height + trails[i] * fontSize && Math.random() > 0.96) {
          drops[i] = Math.random() * -12;
          speeds[i] = 0.35 + Math.random() * 0.6;
        }
      }

      // Time-based typewriter banner (independent of monitor refresh rate)
      const elapsed = performance.now() - startTime;
      const totalIntroMs = introMessages.length * msPerMessage;
      if (showBanner && elapsed < totalIntroMs) {
        const msgIdx = Math.floor(elapsed / msPerMessage);
        const msgElapsed = elapsed % msPerMessage;
        const msg = introMessages[msgIdx];
        const charsToShow = Math.min(msg.length, Math.floor(msgElapsed / 65));
        const shown = msg.slice(0, charsToShow);
        const cursorOn = Math.floor(elapsed / 400) % 2 === 0;

        const boxW = Math.min(canvas.width - 32, 350);
        const boxX = Math.floor((canvas.width - boxW) / 2);
        const boxY = Math.floor(canvas.height * 0.38);

        ctx.fillStyle = "rgba(5, 8, 7, 0.92)";
        ctx.fillRect(boxX, boxY, boxW, 44);
        ctx.strokeStyle = pal.bright;
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, 44);

        ctx.fillStyle = pal.head;
        ctx.font = "bold 15px monospace";
        ctx.fillText("> " + shown + (cursorOn ? "█" : ""), boxX + 14, boxY + 14);
      }
    }

    // Pre-warm rain columns without advancing the intro timer
    for (let k = 0; k < 28; k++) {
      drawStep(false);
    }
    drawStep(true);

    function loop() {
      if (!paused) {
        drawStep();
      }
      animId = requestAnimationFrame(loop);
    }
    animId = requestAnimationFrame(loop);

    function cleanup() {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKey);
      overlay.remove();
      appendLine(`<span class="text-muted">[cmatrix exited — Welcome back to reality.]</span>`);
      input.focus();
    }

    function onKey(e) {
      if (e.key === "Escape" || e.key === "q" || e.key === "Q" || (e.ctrlKey && e.key === "c")) {
        e.preventDefault();
        cleanup();
      } else if (e.key === "c" || e.key === "C") {
        paletteIdx = (paletteIdx + 1) % palettes.length;
      } else if (e.key === " ") {
        e.preventDefault();
        paused = !paused;
        pauseBtn.textContent = paused ? "▶ Play" : "⏸ Pause";
      }
    }

    window.addEventListener("keydown", onKey);
    exitBtn.addEventListener("click", cleanup);
    canvas.addEventListener("click", cleanup);
    colorBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      paletteIdx = (paletteIdx + 1) % palettes.length;
      if (window.GeekSFX) window.GeekSFX.blip();
    });
    pauseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      paused = !paused;
      pauseBtn.textContent = paused ? "▶ Play" : "⏸ Pause";
      if (window.GeekSFX) window.GeekSFX.blip();
    });
    exitBtn.focus();
  }

  function executeSingleCommand(rawCmd) {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case "help":
      case "?":
        cmdHelp();
        break;
      case "ls":
      case "dir":
        cmdLs(args);
        break;
      case "ll":
        cmdLs(["-la", ...args]);
        break;
      case "cd":
        cmdCd(args);
        break;
      case "pwd":
        appendLine(escapeHtml(cwd));
        break;
      case "cat":
      case "less":
      case "more":
      case "head":
      case "view":
      case "read":
        cmdCat(args);
        break;
      case "open":
        cmdOpen(args);
        break;
      case "tree":
        cmdTree(args);
        break;
      case "grep":
      case "search":
      case "find":
        cmdGrep(args);
        break;
      case "whoami":
      case "id":
        appendLine("uid=1337(geekonaut) gid=42(devrel) groups=42(devrel),80(http),443(https),1989(zurich) — Martin Splitt");
        break;
      case "uname":
        appendLine("GeekonautOS zurich-mainframe 4.2.0-8bit #1 SMP PREEMPT_DYNAMIC WebPlatform x86_64/6510 GNU/11ty");
        break;
      case "date":
        appendLine(new Date().toUTCString());
        break;
      case "neofetch":
      case "sysinfo":
      case "screenfetch":
        cmdNeofetch();
        break;
      case "googlebot":
        cmdGooglebot(args);
        break;
      case "fortune":
        appendLine(`<div class="term-output-box">${escapeHtml(fortunes[Math.floor(Math.random() * fortunes.length)])}</div>`);
        break;
      case "cowsay":
        cmdCowsay(args);
        break;
      case "matrix":
      case "cmatrix":
        cmdMatrix(args);
        break;
      case "theme":
        if (window.GeekTheme && args[0]) {
          window.GeekTheme.set(args[0].toLowerCase());
          appendLine(`Theme updated to: ${escapeHtml(args[0].toLowerCase())}`);
        } else {
          appendLine("Usage: theme <light|dark|system>");
        }
        break;
      case "sfx":
        if (window.GeekSFX) {
          const next = args[0] ? args[0].toLowerCase() === "on" : !window.GeekSFX.isEnabled();
          window.GeekSFX.setEnabled(next);
          appendLine(`8-Bit Sound Effects: ${next ? "ON" : "OFF"}`);
        }
        break;
      case "history":
        appendLine(
          `<div class="term-output-box">` +
            history.map((h, i) => `  ${i + 1}  ${escapeHtml(h)}`).join("\n") +
            `</div>`
        );
        break;
      case "echo":
        appendLine(escapeHtml(args.join(" ")));
        break;
      case "sudo":
        if (args.join(" ").toLowerCase().includes("sandwich")) {
          appendLine("Okay. 🥪 (Here is your 8-bit pixel sandwich)");
        } else {
          appendLine("geekonaut is not in the sudoers file. This incident will be reported to the Master Control Program.");
        }
        break;
      case "vim":
      case "vi":
      case "emacs":
      case "nano":
        appendLine(`Opening ${escapeHtml(cmd)}... Just kidding! You don't want to get trapped in ${escapeHtml(cmd)} on a website. Use 'cat <file>' instead!`);
        break;
      case "rm":
        appendLine("rm: permission denied (Nice try! This static site is read-only memory.)");
        break;
      case "clear":
      case "cls":
        viewport.innerHTML = "";
        break;
      default:
        if (window.GeekSFX) window.GeekSFX.error();
        appendLine(
          `gsh: command not found: <strong>${escapeHtml(cmd)}</strong>. Type <code>help</code> or tap a button below.`
        );
    }
  }

  function runCommandChain(cmdString) {
    const trimmed = cmdString.trim();
    if (!trimmed) return;
    history.push(trimmed);
    historyIdx = history.length;
    echoCommand(trimmed);
    if (window.GeekSFX) window.GeekSFX.enter();

    const segments = trimmed.split("&&").map((s) => s.trim()).filter(Boolean);
    for (const seg of segments) {
      executeSingleCommand(seg);
    }
  }

  // Tab Autocompletion
  function handleTabComplete() {
    const val = input.value;
    const parts = val.split(/\s+/);
    const allCmds = [
      "help",
      "ls",
      "cd",
      "cat",
      "open",
      "tree",
      "grep",
      "pwd",
      "whoami",
      "neofetch",
      "fortune",
      "cowsay",
      "matrix",
      "theme",
      "sfx",
      "clear"
    ];

    if (parts.length <= 1) {
      const prefix = (parts[0] || "").toLowerCase();
      const match = allCmds.find((c) => c.startsWith(prefix));
      if (match) input.value = match + " ";
      return;
    }

    const lastPart = parts[parts.length - 1];
    const dirNode = vfs[cwd];
    if (dirNode && dirNode.children) {
      const match = dirNode.children.find((c) => c.toLowerCase().startsWith(lastPart.toLowerCase()));
      if (match) {
        parts[parts.length - 1] = match;
        input.value = parts.join(" ");
      }
    }
  }

  // Event Listeners
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = input.value;
    input.value = "";
    runCommandChain(val);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      handleTabComplete();
      if (window.GeekSFX) window.GeekSFX.blip();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIdx > 0) {
        historyIdx--;
        input.value = history[historyIdx];
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx < history.length - 1) {
        historyIdx++;
        input.value = history[historyIdx];
      } else {
        historyIdx = history.length;
        input.value = "";
      }
    } else if (e.key.length === 1) {
      if (window.GeekSFX) window.GeekSFX.key();
    }
  });

  // Delegate clicks on interactive file/directory badges inside terminal viewport
  viewport.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-term-cmd]");
    if (btn) {
      const cmd = btn.getAttribute("data-term-cmd");
      if (cmd) runCommandChain(cmd);
    }
  });

  // Delegate clicks on Mobile Touchbar quick action buttons
  if (touchbar) {
    touchbar.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-touch-cmd]");
      if (!chip) return;
      const action = chip.getAttribute("data-touch-cmd");
      if (action === "__TAB__") {
        handleTabComplete();
        input.focus();
      } else {
        runCommandChain(action);
      }
    });
  }

  // Boot sequence: clean minimal MOTD, then execute ?cmd= if present in URL
  updatePrompt();
  appendLine(
    `<span class="text-muted">GeekonautOS 4.2 LTS (tty1) — Type <code>help</code> or <code>ls</code> to explore.</span>`
  );

  const params = new URLSearchParams(window.location.search);
  const initialCmd = params.get("cmd");
  if (initialCmd) {
    runCommandChain(initialCmd);
  }
})();
