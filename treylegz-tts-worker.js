// ===================================================================
//  R34D 1T T0 M3H  ·  edge voice synthesizer
//  OrbitalUnderground HD Productions
//
//  Single-file Cloudflare Worker.
//   - GET  /        -> serves the UI
//   - POST /tts     -> { text, voiceId } -> returns audio/mpeg (MP3)
//
//  Engine: ElevenLabs.  Returns MP3.
//  REQUIRED secret:  ELEVENLABS_API_KEY  (set in Worker Settings -> Secrets)
// ===================================================================

const MAX_CHARS = 2000;

// Quality model. Swap for cheaper/faster:
//   "eleven_turbo_v2_5"  (faster, ~half the credits)
//   "eleven_flash_v2_5"  (cheapest, lowest latency)
const MODEL = "eleven_multilingual_v2";

// Your voice menu. Add more lines to grow the dropdown — it appears
// automatically once there is more than one voice.
const VOICES = [
  { id: "OiVAqaJXgFPmJH8CMk60", label: "Voice 1" }
  // , { id: "PASTE_ANOTHER_ID", label: "Movie Trailer" }
  // , { id: "PASTE_ANOTHER_ID", label: "News Anchor" }
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/tts") {
      return handleTTS(request, env);
    }
    const html = PAGE.replace("__VOICES_JSON__", function () { return JSON.stringify(VOICES); });
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
};

async function handleTTS(request, env) {
  try {
    if (!env.ELEVENLABS_API_KEY) {
      return json({ error: "Server is missing the ELEVENLABS_API_KEY secret." }, 500);
    }

    const data = await request.json();
    const text = (data && data.text ? String(data.text) : "").trim();
    let voiceId = (data && data.voiceId ? String(data.voiceId) : "");

    if (!text) return json({ error: "Type something to read first." }, 400);
    if (text.length > MAX_CHARS) {
      return json({ error: "Too long — keep it under " + MAX_CHARS + " characters." }, 400);
    }

    // Only allow the voices we configured (stops anyone spending your credits on arbitrary voices).
    const allowed = VOICES.map(function (v) { return v.id; });
    if (!voiceId || allowed.indexOf(voiceId) === -1) { voiceId = allowed[0]; }

    const r = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + voiceId, {
      method: "POST",
      headers: {
        "xi-api-key": env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
      },
      body: JSON.stringify({
        text: text,
        model_id: MODEL,
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true }
      })
    });

    if (!r.ok) {
      let detail = "";
      try {
        const e = await r.json();
        if (e && e.detail) detail = e.detail.message ? e.detail.message : (typeof e.detail === "string" ? e.detail : JSON.stringify(e.detail));
      } catch (_) {}
      let msg = "ElevenLabs error (" + r.status + ").";
      if (r.status === 401) msg = "ElevenLabs rejected the API key (401). Check the ELEVENLABS_API_KEY secret.";
      else if (r.status === 422) msg = "ElevenLabs couldn't use that voice or text (422). " + detail;
      else if (r.status === 429) msg = "ElevenLabs rate or quota limit hit (429).";
      else if (detail) msg += " " + detail;
      return json({ error: msg }, 502);
    }

    const buf = await r.arrayBuffer();
    return new Response(buf, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  } catch (err) {
    return json({ error: "Synthesis failed. " + (err && err.message ? err.message : "") }, 500);
  }
}

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
<title>R34D 1T T0 M3H</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800;900&family=Chakra+Petch:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --void:#07060c;--gold-hi:#fff6cf;--gold:#ffd24a;--gold-deep:#e0a019;--gold-shadow:#7a4f10;
    --chrome:#d7dcec;--ice:#6ad7ff;--cream:#f4efe2;--muted:#8b8597;--danger:#ff5a6e;
    --disp:'Orbitron',"Segoe UI",system-ui,sans-serif;
    --tech:'Chakra Petch',"Segoe UI",system-ui,sans-serif;
    --body:"Segoe UI",system-ui,-apple-system,sans-serif;
  }
  *{box-sizing:border-box}
  html,body{margin:0;height:100%}
  body{
    font-family:var(--body);color:var(--cream);
    background:
      radial-gradient(1100px 520px at 50% -8%, rgba(255,210,74,.16), transparent 60%),
      radial-gradient(900px 600px at 110% 120%, rgba(110,80,200,.18), transparent 55%),
      radial-gradient(700px 500px at -10% 110%, rgba(255,170,40,.08), transparent 55%),
      var(--void);
    min-height:100%;display:flex;flex-direction:column;align-items:center;
    padding:30px 18px 40px;-webkit-text-size-adjust:100%;
  }

  .head{width:100%;max-width:680px;margin:8px 0 24px}
  .slot{
    display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px 0;
    padding:18px 16px;border-radius:18px;
    background:
      linear-gradient(180deg,rgba(18,15,28,.92),rgba(7,6,12,.96)) padding-box,
      linear-gradient(150deg,var(--gold-hi),var(--gold-deep) 42%,rgba(120,90,30,.3) 60%,var(--chrome)) border-box;
    border:1.5px solid transparent;
    box-shadow:0 26px 64px rgba(0,0,0,.55),0 0 0 1px rgba(0,0,0,.4) inset,0 1px 0 rgba(255,240,200,.07) inset;
  }
  .word{display:flex;gap:4px}
  .gap{width:clamp(12px,3.4vw,26px)}
  .reel{
    position:relative;overflow:hidden;border-radius:8px;
    width:clamp(26px,8.2vw,56px);height:clamp(46px,13.2vw,84px);background:#050409;
    box-shadow:0 0 0 1px rgba(0,0,0,.7) inset,0 2px 0 rgba(255,255,255,.05) inset,0 8px 16px rgba(0,0,0,.55) inset;
  }
  .reel::before,.reel::after{content:"";position:absolute;left:0;right:0;height:30%;z-index:2;pointer-events:none}
  .reel::before{top:0;background:linear-gradient(180deg,rgba(5,4,9,.92),rgba(5,4,9,0))}
  .reel::after{bottom:0;background:linear-gradient(0deg,rgba(5,4,9,.92),rgba(5,4,9,0))}
  .strip{display:flex;flex-direction:column;will-change:transform}
  .glyph{
    height:clamp(46px,13.2vw,84px);display:flex;align-items:center;justify-content:center;
    font-family:var(--disp);font-weight:900;font-size:clamp(24px,7.4vw,50px);line-height:1;letter-spacing:.01em;
    background:linear-gradient(180deg,#fff8d8 8%,var(--gold) 44%,var(--gold-deep) 78%,var(--gold-shadow) 100%);
    -webkit-background-clip:text;background-clip:text;color:transparent;
    filter:drop-shadow(0 2px 5px rgba(255,190,60,.16));
  }

  .console{
    width:100%;max-width:640px;border-radius:20px;padding:26px 22px 24px;
    background:
      linear-gradient(180deg,rgba(20,17,30,.92),rgba(10,9,16,.96)) padding-box,
      linear-gradient(150deg,var(--gold-hi),var(--gold-deep) 30%,rgba(120,90,30,.25) 55%,var(--chrome) 100%) border-box;
    border:1.5px solid transparent;
    box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 0 1px rgba(0,0,0,.4) inset,0 1px 0 rgba(255,240,200,.06) inset;
  }
  .lab{display:block;font-family:var(--tech);font-weight:700;font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--gold);margin:0 0 9px 2px}
  .lab.mt{margin-top:20px}

  textarea{
    width:100%;min-height:170px;resize:vertical;border-radius:13px;padding:15px 16px;
    font-family:var(--body);font-size:16px;line-height:1.5;color:var(--cream);
    background:#08070e;border:1px solid rgba(215,220,236,.14);
    box-shadow:0 2px 10px rgba(0,0,0,.5) inset;outline:none;transition:border-color .15s,box-shadow .15s;
  }
  textarea::placeholder{color:#5c576a}
  textarea:focus{border-color:var(--gold);box-shadow:0 2px 10px rgba(0,0,0,.5) inset,0 0 0 3px rgba(255,210,74,.18)}

  .meta{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:9px 2px 0;flex-wrap:wrap}
  #count{font-family:var(--tech);font-weight:600;font-size:12px;letter-spacing:.08em;color:var(--muted)}
  #count.warn{color:var(--gold)}
  #count.max{color:var(--danger)}
  .hint{font-family:var(--tech);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#5f5a6e}

  .selectwrap{position:relative;margin-top:4px}
  .selectwrap::after{content:"";position:absolute;right:16px;top:50%;width:9px;height:9px;border-right:2px solid var(--gold);border-bottom:2px solid var(--gold);transform:translateY(-65%) rotate(45deg);pointer-events:none}
  select{width:100%;appearance:none;-webkit-appearance:none;border-radius:13px;padding:14px 40px 14px 16px;font-family:var(--tech);font-weight:600;font-size:15px;letter-spacing:.04em;color:var(--cream);background:#08070e;border:1px solid rgba(215,220,236,.14);box-shadow:0 2px 10px rgba(0,0,0,.5) inset;outline:none;cursor:pointer;transition:border-color .15s,box-shadow .15s}
  select:focus{border-color:var(--gold);box-shadow:0 2px 10px rgba(0,0,0,.5) inset,0 0 0 3px rgba(255,210,74,.18)}

  .grill{display:flex;align-items:flex-end;justify-content:center;gap:5px;height:62px;margin:24px 0 6px;padding:0 4px}
  .tooth{
    width:13px;border-radius:4px 4px 3px 3px;
    background:linear-gradient(180deg,#fffbe9 0%,var(--gold) 34%,var(--gold-deep) 78%,var(--gold-shadow) 100%);
    box-shadow:0 0 0 1px rgba(0,0,0,.35),0 1px 0 rgba(255,255,255,.5) inset,0 -6px 8px rgba(0,0,0,.35) inset;
    transform-origin:bottom;transform:scaleY(.26);opacity:.5;transition:opacity .25s;
  }
  .tooth::before{content:"";display:block;height:5px;margin:2px 2px 0;border-radius:3px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.85),transparent)}
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

  .status{min-height:20px;margin:16px 2px 0;text-align:center;font-family:var(--tech);font-weight:600;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
  .status.work{color:var(--ice)}
  .status.live{color:var(--gold)}
  .status.err{color:var(--danger);text-transform:none;letter-spacing:.02em}

  .save{
    display:block;text-align:center;text-decoration:none;margin-top:14px;border-radius:14px;
    font-family:var(--disp);font-weight:800;font-size:15px;letter-spacing:.1em;text-transform:uppercase;color:#10131c;padding:16px 18px;
    background:linear-gradient(180deg,#ffffff 0%,var(--chrome) 50%,#8b94a8 100%);
    box-shadow:0 8px 26px rgba(0,0,0,.45),0 1px 0 rgba(255,255,255,.7) inset;animation:rise .4s ease both;
  }
  .save:active{transform:translateY(2px)}
  @keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

  .hidden{display:none}
  footer{font-family:var(--tech);font-size:10px;letter-spacing:.34em;text-transform:uppercase;color:#46414f;margin-top:30px;padding-left:.34em;text-align:center}

  @media (prefers-reduced-motion:reduce){
    .grill.live .tooth,.grill.think .tooth{animation:none;transform:scaleY(.85)}
    .save{animation:none}
  }
</style>
</head>
<body>
  <header class="head">
    <div class="slot" id="slot" aria-label="R34D 1T T0 M3H"></div>
  </header>

  <main class="console">
    <label class="lab" for="text">Your words</label>
    <textarea id="text" maxlength="2000" placeholder="Drop your text here. Hit read."></textarea>
    <div class="meta">
      <span id="count">0 / 2000</span>
      <span class="hint">ElevenLabs voice</span>
    </div>

    <label class="lab mt" for="voice" id="voiceLab">Voice</label>
    <div class="selectwrap" id="voiceWrap"><select id="voice"></select></div>

    <div class="grill" id="grill" aria-hidden="true">
      <span class="tooth"></span><span class="tooth"></span><span class="tooth"></span>
      <span class="tooth"></span><span class="tooth"></span><span class="tooth"></span>
      <span class="tooth"></span><span class="tooth"></span><span class="tooth"></span>
      <span class="tooth"></span><span class="tooth"></span><span class="tooth"></span>
      <span class="tooth"></span>
    </div>

    <button id="go" class="cta">&#9654; Read it</button>
    <div id="status" class="status" role="status" aria-live="polite"></div>
    <a id="dl" class="save hidden" download="read-it-to-me.mp3">&#11015; Save the MP3</a>
  </main>

  <audio id="audio" preload="auto"></audio>
  <footer>OrbitalUnderground HD Productions</footer>

<script>
  /* ---------- slot-machine headline ---------- */
  (function(){
    var TITLE = "R34D 1T T0 M3H";
    var POOL = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#@$%&";
    var slot = document.getElementById("slot");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var STEPS = 16;
    var reels = [];
    function rnd(n){ return Math.floor(Math.random() * n); }
    function randGlyph(){ return POOL.charAt(rnd(POOL.length)); }
    var words = TITLE.split(" ");
    for (var w = 0; w < words.length; w++){
      var wordEl = document.createElement("div"); wordEl.className = "word";
      var chars = words[w].split("");
      for (var c = 0; c < chars.length; c++){
        var reelEl = document.createElement("div"); reelEl.className = "reel";
        var strip = document.createElement("div"); strip.className = "strip";
        for (var i = 0; i < STEPS; i++){
          var g = document.createElement("div"); g.className = "glyph"; g.textContent = randGlyph(); strip.appendChild(g);
        }
        var tgt = document.createElement("div"); tgt.className = "glyph"; tgt.textContent = chars[c]; strip.appendChild(tgt);
        reelEl.appendChild(strip); wordEl.appendChild(reelEl);
        reels.push({ strip: strip, reel: reelEl });
      }
      slot.appendChild(wordEl);
      if (w < words.length - 1){ var gap = document.createElement("div"); gap.className = "gap"; slot.appendChild(gap); }
    }
    function settle(r){ var h = r.reel.clientHeight; r.strip.style.transition = "none"; r.strip.style.transform = "translateY(-" + (STEPS * h) + "px)"; }
    function spin(r, dur){
      var h = r.reel.clientHeight;
      r.strip.style.transition = "none"; r.strip.style.transform = "translateY(0px)";
      void r.strip.offsetHeight;
      r.strip.style.transition = "transform " + dur + "ms cubic-bezier(0.1,0.8,0.2,1)";
      r.strip.style.transform = "translateY(-" + (STEPS * h) + "px)";
    }
    function cycle(){
      var maxEnd = 0;
      for (var i = 0; i < reels.length; i++){
        (function(idx){
          var delay = idx * (80 + rnd(80));
          var dur = 1300 + rnd(1000) + idx * 45;
          if (delay + dur > maxEnd) maxEnd = delay + dur;
          setTimeout(function(){ spin(reels[idx], dur); }, delay);
        })(i);
      }
      setTimeout(cycle, maxEnd + 4000 + rnd(1800));
    }
    for (var k = 0; k < reels.length; k++){ settle(reels[k]); }
    if (!reduce){ setTimeout(cycle, 700); }
  })();

  /* ---------- voices ---------- */
  var VOICES = __VOICES_JSON__;
  var voiceSel = document.getElementById("voice");
  (function(){
    for (var i = 0; i < VOICES.length; i++){
      var o = document.createElement("option");
      o.value = VOICES[i].id;
      o.textContent = VOICES[i].label || ("Voice " + (i + 1));
      voiceSel.appendChild(o);
    }
    if (VOICES.length <= 1){
      document.getElementById("voiceWrap").style.display = "none";
      document.getElementById("voiceLab").style.display = "none";
    }
  })();

  /* ---------- synthesis ---------- */
  var ta = document.getElementById("text");
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
  function hideSave(){ dl.classList.add("hidden"); if (lastUrl){ URL.revokeObjectURL(lastUrl); lastUrl = null; } }

  async function read(){
    var text = ta.value.trim();
    if (!text){ setStatus("Type something to read first.", "err"); ta.focus(); return; }
    hideSave();
    go.disabled = true;
    setStatus("Synthesizing…", "work");
    grillMode("think");
    try{
      var res = await fetch("/tts", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ text: text, voiceId: voiceSel.value })
      });
      if (!res.ok){
        var msg = "Something went wrong (" + res.status + "). Try again.";
        try{ var e = await res.json(); if (e && e.error) msg = e.error; }catch(_){}
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
    setStatus("Done — grab your file below", "live");
    if (lastUrl){ dl.href = lastUrl; dl.classList.remove("hidden"); }
  });
  audio.addEventListener("error", function(){
    grillMode("");
    go.disabled = false;
    if (audio.src) setStatus("Playback failed on this device. Tap Save and play the file.", "err");
  });
  go.addEventListener("click", read);
</script>
</body>
</html>`;
