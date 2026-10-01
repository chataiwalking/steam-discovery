import { useCallback, useEffect, useRef, useState } from 'react';
import type { AudioEntry, NarrationClip } from '../types';
type Status = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';
let manifestPromise: Promise<Record<string, AudioEntry>> | undefined;
function getManifest() {
  return manifestPromise ??= fetch(`${import.meta.env.BASE_URL}audio/manifest.json`, {cache:"no-cache"})
    .then(response => { if (!response.ok) throw new Error('语音尚未就绪'); return response.json(); })
    .catch(error => { manifestPromise = undefined; throw error; });
}
export function useNarration(clip: NarrationClip) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sequence = useRef(0), pauseRequested = useRef(false);
  const [status, setStatus] = useState<Status>('idle');
  const [time, setTime] = useState(0), [duration, setDuration] = useState(0);
  const statusRef = useRef(status); statusRef.current = status;
  const stop = useCallback(() => {
    sequence.current++;
    pauseRequested.current = false;
    if (audioRef.current) {
      audioRef.current.pause(); audioRef.current.removeAttribute('src'); audioRef.current.load(); audioRef.current = null;
    }
    setStatus('idle'); setTime(0); setDuration(0);
  }, []);
  useEffect(() => { stop(); return stop; }, [clip.id, stop]);
  useEffect(() => {
    let raf = 0;
    function tick() { if (audioRef.current) setTime(audioRef.current.currentTime); raf = requestAnimationFrame(tick); }
    if (status === 'playing') raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status]);
  const startCurrent = useCallback(async (element: HTMLAudioElement, seq: number) => {
    if (document.hidden || pauseRequested.current) { setStatus('paused'); return; }
    try {
      await element.play();
      if (seq !== sequence.current || audioRef.current !== element) { element.pause(); return; }
      if (document.hidden || pauseRequested.current) { element.pause(); setStatus('paused'); }
      else setStatus('playing');
    } catch {
      if (seq === sequence.current && audioRef.current === element) setStatus(pauseRequested.current ? 'paused' : 'error');
    }
  }, []);
  const play = useCallback(async (restart = false) => {
    pauseRequested.current = false;
    if (audioRef.current && statusRef.current === 'paused' && !restart) {
      const element = audioRef.current, seq = sequence.current;
      setStatus('loading'); await startCurrent(element, seq); return;
    }
    stop(); const seq = sequence.current; setStatus('loading');
    try {
      const entries = await getManifest();
      if (seq !== sequence.current) return;
      const entry = entries[clip.id]; if (!entry) throw new Error('missing clip');
      const element = new Audio(`${import.meta.env.BASE_URL}${entry.file}?v=${(entry.audioHash||entry.textHash).slice(0,16)}`);
      audioRef.current = element; setDuration(entry.duration);
      element.onended = () => { if (seq === sequence.current) { setTime(element.duration || entry.duration); setStatus('ended'); } };
      element.onerror = () => { if (seq === sequence.current) setStatus('error'); };
      await startCurrent(element, seq);
    } catch { if (seq === sequence.current) setStatus('error'); }
  }, [clip.id, stop, startCurrent]);
  const pause = useCallback(() => {
    pauseRequested.current = true;
    audioRef.current?.pause(); setStatus('paused');
  }, []);
  useEffect(() => {
    const listener = () => { if (document.hidden && ['playing', 'loading'].includes(statusRef.current)) pause(); };
    document.addEventListener('visibilitychange', listener);
    return () => document.removeEventListener('visibilitychange', listener);
  }, [pause]);
  return { status, time, duration, play, pause, stop, active: ['playing', 'paused', 'ended'].includes(status) };
}
