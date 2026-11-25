import { motion } from "framer-motion";

export function ScoreRing({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) {
    return <span className="score-empty">—</span>;
  }
  const radius = 19;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  return (
    <span aria-label={`Score ${score} sur 100`} className="score-ring">
      <svg aria-hidden="true" viewBox="0 0 48 48">
        <circle className="score-track" cx="24" cy="24" r={radius} />
        <motion.circle
          animate={{ strokeDashoffset: circumference * (1 - progress / 100) }}
          className="score-progress"
          cx="24"
          cy="24"
          initial={{ strokeDashoffset: circumference }}
          r={radius}
          strokeDasharray={circumference}
          transform="rotate(-90 24 24)"
          transition={{ type: "spring", stiffness: 65, damping: 16 }}
        />
      </svg>
      <span>{Math.round(score)}</span>
    </span>
  );
}
