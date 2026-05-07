import { motion } from 'framer-motion';

interface NetworkPatternProps {
  className?: string;
  nodeCount?: number;
  animate?: boolean;
  color?: string;
  opacity?: number;
}

// Deterministic node positions for consistent rendering
const presetNodes = [
  { x: 5, y: 20 }, { x: 15, y: 55 }, { x: 25, y: 15 },
  { x: 35, y: 70 }, { x: 45, y: 30 }, { x: 55, y: 65 },
  { x: 65, y: 18 }, { x: 75, y: 50 }, { x: 85, y: 25 },
  { x: 95, y: 60 }, { x: 10, y: 80 }, { x: 30, y: 45 },
  { x: 50, y: 50 }, { x: 70, y: 75 }, { x: 90, y: 40 },
  { x: 20, y: 35 }, { x: 40, y: 85 }, { x: 60, y: 10 },
  { x: 80, y: 70 }, { x: 48, y: 92 },
];

// Pre-computed edges based on proximity
const presetEdges = [
  [0, 2], [0, 15], [1, 3], [1, 11], [2, 4], [2, 17],
  [3, 5], [3, 16], [4, 6], [4, 12], [5, 7], [5, 13],
  [6, 8], [6, 17], [7, 9], [7, 14], [8, 14], [9, 13],
  [10, 1], [10, 16], [11, 15], [11, 12], [12, 7], [13, 18],
  [14, 9], [15, 0], [16, 19], [17, 6], [18, 9], [19, 16],
];

const NetworkPattern = ({
  className = '',
  nodeCount = 20,
  animate = true,
  color = 'currentColor',
  opacity = 0.12,
}: NetworkPatternProps) => {
  const nodes = presetNodes.slice(0, nodeCount);
  const edges = presetEdges.filter(([a, b]) => a < nodeCount && b < nodeCount);

  return (
    <svg className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} preserveAspectRatio="none">
      {/* Connection lines */}
      {edges.map(([a, b], i) => (
        animate ? (
          <motion.line
            key={`e${i}`}
            x1={`${nodes[a].x}%`} y1={`${nodes[a].y}%`}
            x2={`${nodes[b].x}%`} y2={`${nodes[b].y}%`}
            stroke={color}
            strokeWidth="0.6"
            opacity={opacity * 0.4}
            initial={{ opacity: 0 }}
            animate={{ opacity: [opacity * 0.2, opacity * 0.6, opacity * 0.2] }}
            transition={{
              duration: 4 + (i % 5) * 1,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: (i % 7) * 0.4,
            }}
          />
        ) : (
          <line
            key={`e${i}`}
            x1={`${nodes[a].x}%`} y1={`${nodes[a].y}%`}
            x2={`${nodes[b].x}%`} y2={`${nodes[b].y}%`}
            stroke={color}
            strokeWidth="0.6"
            opacity={opacity * 0.4}
          />
        )
      ))}

      {/* Nodes with glow */}
      {nodes.map((n, i) => (
        animate ? (
          <g key={`n${i}`}>
            {/* Glow ring */}
            <motion.circle
              cx={`${n.x}%`} cy={`${n.y}%`}
              r="3"
              fill="none"
              stroke={color}
              strokeWidth="0.3"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, opacity * 0.3, 0],
                r: [2, 4, 2],
              }}
              transition={{
                duration: 3 + (i % 4) * 0.6,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: (i % 6) * 0.3,
              }}
            />
            {/* Core dot */}
            <motion.circle
              cx={`${n.x}%`} cy={`${n.y}%`}
              r="1.2"
              fill={color}
              initial={{ opacity: opacity * 0.4 }}
              animate={{
                opacity: [opacity * 0.4, opacity * 0.9, opacity * 0.4],
              }}
              transition={{
                duration: 2.5 + (i % 4) * 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: (i % 6) * 0.25,
              }}
            />
          </g>
        ) : (
          <circle
            key={`n${i}`}
            cx={`${n.x}%`} cy={`${n.y}%`}
            r="1.2"
            fill={color}
            opacity={opacity}
          />
        )
      ))}
    </svg>
  );
};

export default NetworkPattern;
