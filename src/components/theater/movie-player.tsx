"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";

interface MoviePlayerProps {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentFrame: number;
  setCurrentFrame: (frame: number) => void;
}

const TOTAL_FRAMES = 2400;
const FPS = 30;

const MoviePlayer: React.FC<MoviePlayerProps> = ({
  isPlaying,
  setIsPlaying,
  currentFrame,
  setCurrentFrame,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, setIsPlaying]);

  const handleRestart = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [setIsPlaying]);

  const handleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // 프로그레스 바 클릭으로 seek
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = (percentage * TOTAL_FRAMES) / FPS;
      videoRef.current.currentTime = Math.max(0, Math.min(newTime, TOTAL_FRAMES / FPS));
    }
  }, []);

  // 프레임 업데이트 (30fps 기준)
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current) {
        const frame = Math.floor(videoRef.current.currentTime * FPS);
        setCurrentFrame(frame);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [setCurrentFrame]);

  // 영상 종료 시 상태 업데이트
  const handleEnded = () => {
    setIsPlaying(false);
  };

  const formatTime = (frame: number) => {
    const seconds = Math.floor(frame / FPS);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div>
      {/* 비디오 컨테이너 */}
      <div className="relative rounded-xl overflow-hidden bg-black border border-white/10">
        <div className="aspect-video">
          <video
            ref={videoRef}
            src="/documentary-v2.mp4"
            className="w-full h-full"
            onEnded={handleEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>

        {/* 오버레이 컨트롤 (재생 전) */}
        {!isPlaying && currentFrame === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlayPause}
              className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center"
            >
              <Play className="w-10 h-10 text-white ml-1" />
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* 컨트롤 바 */}
      <div className="mt-4 flex items-center gap-4">
        {/* 재생/일시정지 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePlayPause}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" />
          )}
        </motion.button>

        {/* 처음으로 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRestart}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20"
        >
          <RotateCcw className="w-5 h-5 text-white" />
        </motion.button>

        {/* 음소거 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleMute}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </motion.button>

        {/* 시간 표시 */}
        <span className="text-white/60 text-sm font-mono min-w-[60px]">
          {formatTime(currentFrame)}
        </span>

        {/* 프로그레스 바 (클릭 가능) */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden cursor-pointer hover:bg-white/15 transition-colors relative group"
        >
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100 relative"
            style={{ width: `${(currentFrame / TOTAL_FRAMES) * 100}%` }}
          >
            {/* 드래그 핸들 */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* 총 시간 */}
        <span className="text-white/40 text-sm font-mono">
          1:20
        </span>
      </div>
    </div>
  );
};

export default MoviePlayer;
