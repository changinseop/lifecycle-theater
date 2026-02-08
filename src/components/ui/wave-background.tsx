"use client";

import { useRef, useEffect, useState } from "react";

// 5등급 컬러
const FLOW_COLORS = [
  "#fbbf24", // VIP - amber
  "#22c55e", // 충성 - green
  "#3b82f6", // 활성 - blue
  "#f97316", // 위험 - orange
  "#6b7280", // 이탈 - gray
];

export function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setCanvasSize({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0) return;

    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvasSize;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // 흐름 스트림 정의
    interface FlowStream {
      y: number;
      amplitude: number;
      frequency: number;
      speed: number;
      color: string;
      particles: FlowParticle[];
    }

    interface FlowParticle {
      x: number;
      offset: number;
      size: number;
      speed: number;
      alpha: number;
    }

    // 5개의 주요 흐름 스트림
    const streams: FlowStream[] = FLOW_COLORS.map((color, i) => {
      const baseY = height * (0.15 + i * 0.18);
      const particles: FlowParticle[] = [];

      // 각 스트림에 파티클 생성
      for (let j = 0; j < 60; j++) {
        particles.push({
          x: Math.random() * (width + 200) - 100,
          offset: (Math.random() - 0.5) * 40,
          size: 1 + Math.random() * 2,
          speed: 0.3 + Math.random() * 0.5,
          alpha: 0.2 + Math.random() * 0.4,
        });
      }

      return {
        y: baseY,
        amplitude: 20 + Math.random() * 30,
        frequency: 0.002 + Math.random() * 0.002,
        speed: 0.3 + Math.random() * 0.2,
        color,
        particles,
      };
    });

    let time = 0;

    const render = () => {
      // 페이드 효과
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, width, height);
      time += 0.02;

      // 흐름 곡선 그리기
      streams.forEach((stream) => {
        // 메인 흐름 곡선 (은은하게)
        ctx.beginPath();
        ctx.moveTo(0, stream.y);

        for (let x = 0; x <= width; x += 5) {
          const waveY = stream.y + Math.sin(x * stream.frequency + time * stream.speed) * stream.amplitude;
          ctx.lineTo(x, waveY);
        }

        ctx.strokeStyle = stream.color + "15";
        ctx.lineWidth = width < 768 ? 25 : 30;
        ctx.stroke();

        // 파티클 업데이트 및 렌더링
        stream.particles.forEach((p) => {
          // 흐름을 따라 이동
          p.x += p.speed;

          // 화면 밖으로 나가면 왼쪽에서 재시작
          if (p.x > width + 50) {
            p.x = -50;
            p.offset = (Math.random() - 0.5) * 40;
          }

          // 흐름 곡선 위의 Y 위치 계산
          const waveY = stream.y + Math.sin(p.x * stream.frequency + time * stream.speed) * stream.amplitude;
          const y = waveY + p.offset;

          // 파티클 그리기
          ctx.beginPath();
          ctx.arc(p.x, y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = stream.color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
          ctx.fill();

          // 글로우
          ctx.beginPath();
          ctx.arc(p.x, y, p.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = stream.color + "10";
          ctx.fill();
        });
      });

      // 스트림 간 연결 파티클 (전환 표현)
      if (Math.random() < 0.02) {
        const fromStream = Math.floor(Math.random() * (streams.length - 1));
        const toStream = fromStream + (Math.random() < 0.5 ? 1 : -1);
        if (toStream >= 0 && toStream < streams.length) {
          // 연결 효과 (곡선)
          const startX = Math.random() * width * 0.7 + width * 0.1;
          const startY = streams[fromStream].y + Math.sin(startX * streams[fromStream].frequency + time * streams[fromStream].speed) * streams[fromStream].amplitude;
          const endY = streams[Math.max(0, Math.min(streams.length - 1, toStream))].y;

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.quadraticCurveTo(startX + 50, (startY + endY) / 2, startX + 100, endY);
          ctx.strokeStyle = FLOW_COLORS[fromStream] + "30";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationRef.current);
  }, [canvasSize]);

  return (
    <div ref={containerRef} className="fixed inset-0" style={{ zIndex: -1, background: "#000" }}>
      <canvas ref={canvasRef} className="w-full h-full" style={{ filter: "blur(2px)" }} />
      {/* 블러 오버레이 */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
    </div>
  );
}
