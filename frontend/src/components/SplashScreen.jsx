import { useEffect, useRef, useState } from 'react';

function SplashScreen({ fade }) {
  const [text, setText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [lineActive, setLineActive] = useState(false);
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const [highlightFinal, setHighlightFinal] = useState(false);
  const timers = useRef([]);

  useEffect(() => {
    const sleep = (ms) => new Promise((res) => {
      const t = setTimeout(res, ms);
      timers.current.push(t);
    });

    let cancelled = false;

    const runType = async () => {
      if (cancelled) return;
      // Use a local buffer to avoid stale state closures
      let cur = '';
      setText('');

      // 1) "Don't sign blind." (55ms per char)
      const first = "Don't sign blind.";
      for (let i = 0; i < first.length; i++) {
        cur += first[i];
        setText(cur);
        await sleep(55);
        if (cancelled) return;
      }

      await sleep(400);
      if (cancelled) return;

      // Backspace "blind." (35ms per char)
      const back = 'blind.';
      for (let i = 0; i < back.length; i++) {
        cur = cur.slice(0, -1);
        setText(cur);
        await sleep(35);
        if (cancelled) return;
      }

      // Type "in the dark." (55ms per char)
      const second = 'in the dark.';
      for (let i = 0; i < second.length; i++) {
        cur += second[i];
        setText(cur);
        await sleep(55);
        if (cancelled) return;
      }

      await sleep(400);
      if (cancelled) return;

      // Clear everything quickly (25ms per char)
      while (cur.length > 0) {
        cur = cur.slice(0, -1);
        setText(cur);
        await sleep(25);
        if (cancelled) return;
      }

      // To be safe, reset once
      cur = '';
      setText('');

      // Type final: "Know your rights." (45ms per char)
      const final = 'Know your rights.';
      for (let i = 0; i < final.length; i++) {
        cur += final[i];
        setText(cur);
        await sleep(45);
        if (cancelled) return;
      }

      // When final finishes, highlight the 'rights.' word
      setHighlightFinal(true);

      // Cursor blinks 3 times then disappears; blink period 700ms
      await sleep(2100);
      if (cancelled) return;
      setShowCursor(false);

      // After final phrase completes, trigger line and subtitle
      setLineActive(true);
      await sleep(450); // wait for line grow (0.4s + small buffer)
      if (cancelled) return;
      setSubtitleVisible(true);
    };

    runType();

    return () => {
      cancelled = true;
      timers.current.forEach((t) => clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`splash-screen ${fade ? 'fade-out' : ''}`} aria-hidden={!fade}>
      <div className="splash-inner">
        <div className="splash-label">RENTREBEL</div>

        <div className="typewrap">
          <span className="type-text">
            {highlightFinal ? (
              // highlight final 'rights.' word
              <>{'Know your '}<span className="highlight">rights.</span></>
            ) : (
              text
            )}
          </span>
          {showCursor ? <span className="type-cursor">|</span> : null}
        </div>

        <div className={`splash-line ${lineActive ? 'active' : ''}`} />

        <div className={`splash-subtitle ${subtitleVisible ? 'visible' : ''}`}>
          Analyzing Karnataka rental law since 2025
        </div>
      </div>

      <div className="splash-powered">Powered by Graph RAG · Multi-Modal AI</div>

      <div className="splash-progress" aria-hidden="true" />
    </div>
  );
}

export default SplashScreen;
