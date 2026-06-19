// ===================================================================
//  TREYLEGZ TTS  ·  "RETAINER" voice synthesizer
//  OrbitalUnderground HD Productions
//
//  Single-file Cloudflare Worker.
//   - GET  /        -> serves the UI
//   - POST /tts     -> { text, lang } -> returns audio/mpeg (MP3)
//
//  Uses Workers AI: @cf/myshell-ai/melotts  (true MP3 out, basically free)
//  REQUIRED: bind Workers AI to this Worker with the variable name  AI
// ===================================================================

const MAX_CHARS = 2000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/tts") {
      try {
        const data = await request.json();
        const text = (data && data.text ? String(data.text) : "").trim();
        const lang = (data && data.lang ? String(data.lang) : "en");

        if (!text) return json({ error: "Type something to read first." }, 400);
        if (text.length > MAX_CHARS) {
          return json({ error: "Too long — keep it under " + MAX_CHARS + " characters." }, 400);
        }

        const out = await env.AI.run("@cf/myshell-ai/melotts", { prompt: text, lang: lang });
        // out.audio is a base64-encoded MP3 — decode to raw bytes
        const bytes = Uint8Array.from(atob(out.audio), function (c) { return c.charCodeAt(0); });

        return new Response(bytes, {
          headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" }
        });
      } catch (err) {
        return json({ error: "Synthesis failed. Try again in a moment." + (err && err.message ? " (" + err.message + ")" : "") }, 500);
      }
    }

    return new Response(PAGE, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json" }
  });
}

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<title>TREYLEGZ · RETAINER voice synth</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800;900&family=Chakra+Petch:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --void:#07060c;
    --gold-hi:#fff6cf;
    --gold:#ffd24a;
    --gold-deep:#e0a019;
    --gold-shadow:#7a4f10;
    --chrome:#d7dcec;
    --ice:#6ad7ff;
    --cream:#f4efe2;
    --muted:#8b8597;
    --panel:#0d0b15;
    --danger:#ff5a6e;
    --disp:'Orbitron',"Segoe UI",system-ui,sans-serif;
    --tech:'Chakra Petch',"Segoe UI",system-ui,sans-serif;
    --body:"Segoe UI",system-ui,-apple-system,sans-serif;
  }
  *{box-sizing:border-box}
  html,body{margin:0;height:100%}
  body{
    font-family:var(--body);
    color:var(--cream);
    background:
      radial-gradient(1100px 520px at 50% -8%, rgba(255,210,74,.16), transparent 60%),
      radial-gradient(900px 600px at 110% 120%, rgba(110,80,200,.18), transparent 55%),
      radial-gradient(700px 500px at -10% 110%, rgba(255,170,40,.08), transparent 55%),
      var(--void);
    min-height:100%;
    display:flex;flex-direction:column;align-items:center;
    padding:28px 18px 40px;
    -webkit-text-size-adjust:100%;
  }

  header{text-align:center;margin:8px 0 22px;width:100%;max-width:640px}
  .eyebrow{
    font-family:var(--tech);font-weight:600;font-size:11px;letter-spacing:.42em;
    text-transform:uppercase;color:var(--gold-deep);margin-bottom:14px;padding-left:.42em;
  }
  .wordmark{
    font-family:var(--disp);font-weight:900;line-height:.9;margin:0;
    font-size:clamp(44px,13vw,86px);letter-spacing:.02em;
    background:linear-gradient(180deg,var(--gold-hi) 6%,var(--gold) 38%,var(--gold-deep) 72%,var(--gold-shadow) 100%);
    -webkit-background-clip:text;background-clip:text;color:transparent;
    background-size:100% 220%;
    text-shadow:0 1px 0 rgba(0,0,0,.4);
    filter:drop-shadow(0 6px 26px rgba(255,200,60,.22));
    animation:sheen 7s ease-in-out infinite;
  }
  .wordmark span{
    background:linear-gradient(180deg,#ffffff 4%,var(--chrome) 40%,#7e879c 100%);
    -webkit-background-clip:text;background-clip:text;color:transparent;
  }
  @keyframes sheen{0%,100%{background-position:50% 0%}50%{background-position:50% 100%}}
  .sub{
    font-family:var(--tech);font-weight:600;letter-spacing:.34em;text-transform:uppercase;
    font-size:12px;color:var(--muted);margin-top:14px;padding-left:.34em;
  }
  .sub b{color:var(--chrome);font-weight:700}

  .console{
    width:100%;max-width:640px;border-radius:20px;padding:26px 22px 24px;
    background:
      linear-gradient(180deg,rgba(20,17,30,.92),rgba(10,9,16,.96)) padding-box,
      linear-gradient(150deg,var(--gold-hi),var(--gold-deep) 30%,rgba(120,90,30,.25) 55%,var(--chrome) 100%) border-box;
    border:1.5px solid transparent;
    box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 0 1px rgba(0,0,0,.4) inset,0 1px 0 rgba(255,240,200,.06) inset;
  }

  .lab{
    display:block;font-family:var(--tech);font-weight:700;font-size:11px;letter-spacing:.26em;
    text-transform:uppercase;color:var(--gold);margin:0 0 9px 2px;
  }
  .lab:not(:first-child){margin-top:20px}

  textarea{
    width:100%;min-height:158px;resize:vertical;border-radius:13px;
    padding:15px 16px;font-family:var(--body);font-size:16px;line-height:1.5;color:var(--cream);
    background:#08070e;border:1px solid rgba(215,220,236,.14);
    box-shadow:0 2px 10px rgba(0,0,0,.5) inset;outline:none;transition:border-color .15s,box-shadow .15s;
  }
  textarea::placeholder{color:#5c576a}
  textarea:focus{
    border-color:var(--gold);
    box-shadow:0 2px 10px rgba(0,0,0,.5) inset,0 0 0 3px rgba(255,210,74,.18);
  }

  .meta{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:9px 2px 0;flex-wrap:wrap}
  #count{font-family:var(--tech);font-weight:600;font-size:12px;letter-spacing:.08em;color:var(--muted)}
  #count.warn{color:var(--gold)}
  #count.max{color:var(--danger)}
  .hint{font-family:var(--tech);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#5f5a6e}

  .selectwrap{position:relative}
  .selectwrap::after{
    content:"";position:absolute;right:16px;top:50%;width:9px;height:9px;
    border-right:2px solid var(--gold);border-bottom:2px solid var(--gold);
    transform:translateY(-65%) rotate(45deg);pointer-events:none;
  }
  select{
    width:100%;appearance:none;-webkit-appearance:none;border-radius:13px;
    padding:14px 40px 14px 16px;font-family:var(--tech);font-weight:600;font-size:15px;letter-spacing:.04em;
    color:var(--cream);background:#08070e;border:1px solid rgba(215,220,236,.14);
    box-shadow:0 2px 10px rgba(0,0,0,.5) inset;outline:none;cursor:pointer;transition:border-color .15s,box-shadow .15s;
  }
  select:focus{border-color:var(--gold);box-shadow:0 2px 10px rgba(0,0,0,.5) inset,0 0 0 3px rgba(255,210,74,.18)}

  /* signature: the RETAINER grill — speech meter as a glinting gold grill */
  .grill{
    display:flex;align-items:flex-end;justify-content:center;gap:5px;
    height:62px;margin:24px 0 6px;padding:0 4px;
  }
  .tooth{
    width:13px;border-radius:4px 4px 3px 3px;
    background:linear-gradient(180deg,#fffbe9 0%,var(--gold) 34%,var(--gold-deep) 78%,var(--gold-shadow) 100%);
    box-shadow:0 0 0 1px rgba(0,0,0,.35),0 1px 0 rgba(255,255,255,.5) inset,0 -6px 8px rgba(0,0,0,.35) inset;
    transform-origin:bottom;transform:scaleY(.26);opacity:.5;
    transition:opacity .25s;
  }
  .tooth::before{
    content:"";display:block;height:5px;margin:2px 2px 0;border-radius:3px;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.85),transparent);
  }
  .tooth:nth-child(7){height:100%}
  .tooth:nth-child(6),.tooth:nth-child(8){height:92%}
  .tooth:nth-child(5),.tooth:nth-child(9){height:80%}
  .tooth:nth-child(4),.tooth:nth-child(10){height:68%}
  .tooth:nth-child(3),.tooth:nth-child(11){height:56%}
  .tooth:nth-child(2),.tooth:nth-child(12){height:46%}
  .tooth:nth-child(1),.tooth:nth-child(13){height:40%}
  .grill.live .tooth{opacity:1;animation:chew .7s ease-in-out infinite}
  .grill.live .tooth:nth-child(odd){animation-duration:.62s}
  .grill.live .tooth:nth-child(2),.grill.live .tooth:nth-child(8){animation-delay:.08s}
  .grill.live .tooth:nth-child(3),.grill.live .tooth:nth-child(9){animation-delay:.16s}
  .grill.live .tooth:nth-child(4),.grill.live .tooth:nth-child(10){animation-delay:.24s}
  .grill.live .tooth:nth-child(5),.grill.live .tooth:nth-child(11){animation-delay:.12s}
  .grill.live .tooth:nth-child(6),.grill.live .tooth:nth-child(12){animation-delay:.2s}
  .grill.live .tooth:nth-child(7){animation-delay:.06s}
  @keyframes chew{0%,100%{transform:scaleY(.34)}50%{transform:scaleY(1)}}
  .grill.think .tooth{opacity:.85;animation:think 1s ease-in-out infinite}
  @keyframes think{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(.5)}}

  .cta{
    width:100%;margin-top:16px;border:0;border-radius:14px;cursor:pointer;
    font-family:var(--disp);font-weight:800;font-size:18px;letter-spacing:.08em;text-transform:uppercase;
    color:#2a1c02;padding:18px 20px;min-height:60px;
    background:linear-gradient(180deg,#fff3c4 0%,var(--gold) 44%,var(--gold-deep) 100%);
    box-shadow:0 10px 30px rgba(255,190,50,.28),0 1px 0 rgba(255,255,255,.6) inset,0 -3px 8px rgba(120,80,10,.4) inset;
    transition:transform .08s ease,box-shadow .15s,filter .15s;
  }
  .cta:hover{filter:brightness(1.04)}
  .cta:active{transform:translateY(2px) scale(.992);box-shadow:0 5px 16px rgba(255,190,50,.24),0 1px 0 rgba(255,255,255,.5) inset}
  .cta:focus-visible{outline:3px solid var(--ice);outline-offset:3px}
  .cta:disabled{cursor:default;filter:saturate(.5) brightness(.78);box-shadow:none}

  .status{
    min-height:20px;margin:16px 2px 0;text-align:center;
    font-family:var(--tech);font-weight:600;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);
  }
  .status.work{color:var(--ice)}
  .status.live{color:var(--gold)}
  .status.err{color:var(--danger);text-transform:none;letter-spacing:.02em;font-weight:600}

  .save{
    display:block;text-align:center;text-decoration:none;margin-top:14px;border-radius:14px;
    font-family:var(--disp);font-weight:800;font-size:15px;letter-spacing:.1em;text-transform:uppercase;
    color:#10131c;padding:16px 18px;
    background:linear-gradient(180deg,#ffffff 0%,var(--chrome) 50%,#8b94a8 100%);
    box-shadow:0 8px 26px rgba(0,0,0,.45),0 1px 0 rgba(255,255,255,.7) inset;
    animation:rise .4s ease both;
  }
  .save:active{transform:translateY(2px)}
  @keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

  .hidden{display:none}

  footer{
    font-family:var(--tech);font-size:10px;letter-spacing:.34em;text-transform:uppercase;
    color:#46414f;margin-top:30px;padding-left:.34em;text-align:center;
  }

  @media (prefers-reduced-motion:reduce){
    .wordmark{animation:none}
    .grill.live .tooth,.grill.think .tooth{animation:none;transform:scaleY(.85)}
    .save{animation:none}
  }
</style>
</head>
<body>
  <header>
    <div class="eyebrow">OrbitalUnderground HD · TreyLegz Edition</div>
    <h1 class="wordmark">TREY<span>LEGZ</span></h1>
    <div class="sub"><b>RETAINER</b> &nbsp;//&nbsp; voice synthesizer</div>
  </header>

  <main class="console">
    <label class="lab" for="text">Your words</label>
    <textarea id="text" maxlength="2000" placeholder="Drop your text here. Pick a voice. Hit read."></textarea>
    <div class="meta">
      <span id="count">0 / 2000</span>
      <span class="hint">Edge synthesis · free</span>
    </div>

    <label class="lab" for="lang">Voice</label>
    <div class="selectwrap">
      <select id="lang">
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="zh">Chinese</option>
        <option value="jp">Japanese</option>
        <option value="kr">Korean</option>
      </select>
    </div>

    <div class="grill" id="grill" aria-hidden="true">
      <span class="tooth"></span><span class="tooth"></span><span class="tooth"></span>
      <span class="tooth"></span><span class="tooth"></span><span class="tooth"></span>
      <span class="tooth"></span><span class="tooth"></span><span class="tooth"></span>
      <span class="tooth"></span><span class="tooth"></span><span class="tooth"></span>
      <span class="tooth"></span>
    </div>

    <button id="go" class="cta">&#9654; Read it</button>

    <div id="status" class="status" role="status" aria-live="polite"></div>

    <a id="dl" class="save hidden" download="treylegz-reading.mp3">&#8675; Save the MP3</a>
  </main>

  <audio id="audio" preload="auto"></audio>

  <footer>OrbitalUnderground HD Productions</footer>

<script>
  var ta = document.getElementById("text");
  var sel = document.getElementById("lang");
  var go = document.getElementById("go");
  var grill = document.getElementById("grill");
  var statusEl = document.getElementById("status");
  var dl = document.getElementById("dl");
  var audio = document.getElementById("audio");
  var count = document.getElementById("count");
  var lastUrl = null;

  function updateCount(){
    var n = ta.value.length;
    count.textContent = n + " / 2000";
    count.className = n >= 2000 ? "max" : (n > 1700 ? "warn" : "");
  }
  ta.addEventListener("input", updateCount);
  updateCount();

  function setStatus(text, cls){ statusEl.textContent = text; statusEl.className = "status" + (cls ? " " + cls : ""); }
  function grillMode(mode){ grill.className = "grill" + (mode ? " " + mode : ""); }

  function hideSave(){
    dl.classList.add("hidden");
    if(lastUrl){ URL.revokeObjectURL(lastUrl); lastUrl = null; }
  }

  async function read(){
    var text = ta.value.trim();
    if(!text){ setStatus("Type something to read first.", "err"); ta.focus(); return; }

    hideSave();
    go.disabled = true;
    setStatus("Synthesizing on the edge\\u2026", "work");
    grillMode("think");

    try{
      var res = await fetch("/tts", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ text: text, lang: sel.value })
      });

      if(!res.ok){
        var msg = "Something went wrong (" + res.status + "). Try again.";
        try{ var e = await res.json(); if(e && e.error) msg = e.error; }catch(_){}
        throw new Error(msg);
      }

      var blob = await res.blob();
      lastUrl = URL.createObjectURL(blob);
      audio.src = lastUrl;
      await audio.play();
      setStatus("Now playing", "live");
      grillMode("live");
    }catch(err){
      grillMode("");
      setStatus(err && err.message ? err.message : "Synthesis failed. Try again.", "err");
      go.disabled = false;
    }
  }

  audio.addEventListener("ended", function(){
    grillMode("");
    go.disabled = false;
    setStatus("Done \\u2014 grab your file below", "live");
    if(lastUrl){
      dl.href = lastUrl;
      dl.classList.remove("hidden");
    }
  });

  audio.addEventListener("error", function(){
    grillMode("");
    go.disabled = false;
    if(audio.src) setStatus("Playback failed on this device. Tap Save and play the file.", "err");
  });

  go.addEventListener("click", read);
</script>
</body>
</html>`;
