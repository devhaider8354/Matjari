'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STATE_KEY = 'music-state'; // موضع التشغيل (يبقى عند إعادة تحميل الصفحة)
const PREF_KEY = 'music-pref'; // اختيار الزائر: 'on' أو 'off'

const read = (store, key) => {
  try {
    return JSON.parse(window[store].getItem(key));
  } catch {
    return null;
  }
};
const write = (store, key, value) => {
  try {
    window[store].setItem(key, JSON.stringify(value));
  } catch {}
};

// مشغّل موسيقى الخلفية. يوضع في تخطيط المتجر، والتخطيط لا يُعاد بناؤه عند التنقل بين
// الصفحات، فيستمر الصوت بلا انقطاع. عند إعادة تحميل كاملة يُستأنف من نفس الثانية.
// المتصفحات تمنع تشغيل الصوت قبل أول تفاعل للزائر، فيبدأ مع أول نقرة أو لمسة.
export default function MusicPlayer({ settings, lang }) {
  const audio = useRef(null);
  const tracks = settings.tracks;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(false);
  const [volume, setVolume] = useState(settings.volume);
  const wantPlay = useRef(false);
  const en = lang === 'en';

  const play = useCallback(() => {
    const a = audio.current;
    if (!a) return;
    a.play().then(
      () => {
        setPlaying(true);
        write('localStorage', PREF_KEY, 'on');
      },
      () => {} // ممنوع قبل التفاعل: سنحاول مع أول نقرة
    );
  }, []);

  const pause = useCallback(() => {
    audio.current?.pause();
    setPlaying(false);
    wantPlay.current = false;
    write('localStorage', PREF_KEY, 'off');
  }, []);

  // استعادة المقطع والموضع، والتشغيل التلقائي (ما لم يوقفه الزائر سابقاً)
  useEffect(() => {
    const saved = read('sessionStorage', STATE_KEY);
    if (saved && saved.index < tracks.length) setIndex(saved.index);
    const pref = read('localStorage', PREF_KEY);
    wantPlay.current = pref === 'on' || (pref == null && settings.autoplay) || Boolean(saved?.playing);
    if (pref === 'off') wantPlay.current = false;

    const onFirstInteraction = (e) => {
      // النقر على أزرار المشغّل نفسه يعالجه زر التشغيل (وإلا يبدأ ثم يتوقف فوراً)
      if (e.target?.closest?.('.music-player')) return;
      if (wantPlay.current && audio.current?.paused) play();
    };
    const events = ['pointerdown', 'keydown', 'touchend'];
    events.forEach((e) => window.addEventListener(e, onFirstInteraction, { passive: true }));
    // محاولة فورية (تنجح إذا سمح المتصفح، مثل زائر عائد تفاعل مع الموقع سابقاً)
    const t = setTimeout(() => wantPlay.current && play(), 300);
    return () => {
      clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, onFirstInteraction));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // عند تحميل المقطع: الرجوع لنفس الثانية بعد إعادة التحميل
  const onLoaded = () => {
    const saved = read('sessionStorage', STATE_KEY);
    if (saved && saved.index === index && saved.time > 0) audio.current.currentTime = saved.time;
    if (wantPlay.current) play();
  };

  // حفظ الموضع كل ثانيتين
  useEffect(() => {
    const t = setInterval(() => {
      const a = audio.current;
      if (a) write('sessionStorage', STATE_KEY, { index, time: a.currentTime, playing: !a.paused });
    }, 2000);
    return () => clearInterval(t);
  }, [index]);

  useEffect(() => {
    if (audio.current) audio.current.volume = volume;
  }, [volume]);

  const next = () => {
    const n = settings.shuffle && tracks.length > 2 ? (index + 1 + Math.floor(Math.random() * (tracks.length - 1))) % tracks.length : (index + 1) % tracks.length;
    write('sessionStorage', STATE_KEY, { index: n, time: 0, playing: true });
    wantPlay.current = true;
    setIndex(n);
  };

  // الحالة الحقيقية من عنصر الصوت نفسه (state قد يتأخر لحظة)
  const toggle = () => {
    if (audio.current && !audio.current.paused) pause();
    else {
      wantPlay.current = true;
      play();
    }
  };

  if (!tracks.length) return null;
  const track = tracks[index];

  return (
    <div className={`music-player ${open ? 'open' : ''}`}>
      <audio ref={audio} src={track.url} preload="auto" onLoadedMetadata={onLoaded} onEnded={next} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
      <button
        type="button"
        className={`music-fab ${playing ? 'playing' : ''}`}
        onClick={toggle}
        aria-label={playing ? (en ? 'Pause music' : 'إيقاف الموسيقى') : en ? 'Play music' : 'تشغيل الموسيقى'}
        title={track.title}
      >
        {playing ? (
          <span className="eq" aria-hidden="true"><i /><i /><i /><i /></span>
        ) : (
          <span aria-hidden="true">♪</span>
        )}
      </button>
      <button type="button" className="music-toggle" onClick={() => setOpen((o) => !o)} aria-label={en ? 'Music settings' : 'إعدادات الموسيقى'}>
        {open ? '×' : '⋯'}
      </button>
      {open && (
        <div className="music-panel">
          <div className="music-title">{track.title || (en ? 'Store music' : 'موسيقى المتجر')}</div>
          <div className="music-controls">
            <button type="button" onClick={toggle}>{playing ? '⏸' : '▶'}</button>
            {tracks.length > 1 && <button type="button" onClick={next} aria-label={en ? 'Next' : 'التالي'}>⏭</button>}
            <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(Number(e.target.value))} aria-label={en ? 'Volume' : 'الصوت'} />
          </div>
        </div>
      )}
    </div>
  );
}
