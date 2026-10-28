import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  duration?: number;
  isOutgoing?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  duration = 0,
  isOutgoing = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoaded = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoaded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoaded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 py-1 px-1 min-w-[220px] max-w-[280px]">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Voice avatar or play button */}
      <div className="relative">
        <button
          onClick={togglePlay}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-md ${
            isOutgoing
              ? 'bg-[#00a884] text-[#111b21] hover:bg-[#06cf9c]'
              : 'bg-[#00a884] text-[#111b21] hover:bg-[#06cf9c]'
          }`}
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
        </button>
        <span className="absolute -bottom-1 -right-1 bg-[#202c33] text-[#00a884] rounded-full p-0.5 border border-[#111b21]">
          <Mic className="w-3 h-3" />
        </span>
      </div>

      {/* Waveform track */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="relative flex items-center h-4">
          {/* Simulated waveform bars */}
          <div className="absolute inset-0 flex items-center justify-between gap-[2px] pointer-events-none opacity-80">
            {[40, 70, 30, 90, 60, 45, 85, 30, 50, 75, 95, 40, 65, 35, 80, 50, 60, 30, 90, 45].map((h, i) => {
              const barPercent = (i / 20) * 100;
              const isPassed = barPercent <= progressPercent;
              return (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`w-[3px] rounded-full transition-colors ${
                    isPassed ? 'bg-[#53bdeb]' : isOutgoing ? 'bg-white/40' : 'bg-[#8696a0]'
                  }`}
                />
              );
            })}
          </div>

          <input
            type="range"
            min={0}
            max={totalDuration || 1}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full opacity-0 cursor-pointer h-4 z-10"
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-[#8696a0] mt-1 font-mono">
          <span>{formatTime(isPlaying ? currentTime : totalDuration)}</span>
          <span className="text-[10px] uppercase tracking-wider text-[#8696a0]/80">Voice note</span>
        </div>
      </div>
    </div>
  );
};
