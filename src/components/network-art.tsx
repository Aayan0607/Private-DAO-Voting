/** Decorative membership network; no live activity or transaction data. */
export function NetworkArt() {
  return (
    <div className="network-art" aria-hidden="true">
      <svg viewBox="0 0 640 210" fill="none">
        <defs>
          <linearGradient
            id="network-line"
            x1="100"
            y1="100"
            x2="540"
            y2="100"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#b7a5ff" stopOpacity=".5" />
            <stop offset=".5" stopColor="#81f4d4" />
            <stop offset="1" stopColor="#83d8ff" stopOpacity=".5" />
          </linearGradient>
          <linearGradient
            id="network-glass"
            x1="275"
            y1="55"
            x2="365"
            y2="145"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#81f4d4" stopOpacity=".2" />
            <stop offset="1" stopColor="#b7a5ff" stopOpacity=".05" />
          </linearGradient>
        </defs>
        <ellipse
          className="network-halo"
          cx="320"
          cy="100"
          rx="113"
          ry="78"
          stroke="#81f4d4"
          strokeOpacity=".13"
          strokeDasharray="3 7"
        />
        <ellipse
          cx="320"
          cy="100"
          rx="88"
          ry="62"
          stroke="#b7a5ff"
          strokeOpacity=".14"
        />
        <g stroke="url(#network-line)">
          <path d="M100 60H170L275 100M100 140H170L275 100M365 100L470 60H540M365 100L470 140H540" />
          <path d="M100 60V140M540 60V140" strokeOpacity=".25" />
        </g>
        {[
          [100, 60],
          [100, 140],
          [540, 60],
          [540, 140],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <circle
              cx={cx}
              cy={cy}
              r="23"
              fill="#101c2c"
              stroke={i < 2 ? "#b7a5ff" : "#83d8ff"}
              strokeOpacity=".5"
            />
            <rect
              x={cx - 6}
              y={cy - 6}
              width="12"
              height="12"
              rx="3"
              stroke={i < 2 ? "#c7baff" : "#9fe8ff"}
              transform={`rotate(45 ${cx} ${cy})`}
            />
          </g>
        ))}
        <rect
          x="275"
          y="55"
          width="90"
          height="90"
          rx="24"
          fill="url(#network-glass)"
          stroke="#81f4d4"
          strokeOpacity=".55"
        />
        <path
          d="M320 73L338 80V95C338 108 320 120 320 120C320 120 302 108 302 95V80L320 73Z"
          stroke="#a4ffe1"
          strokeWidth="1.5"
        />
        <path
          d="M312 95L318 101L329 89"
          stroke="#a4ffe1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="100" y="191" textAnchor="middle" className="network-label">
          MEMBERSHIP
        </text>
        <text
          x="320"
          y="191"
          textAnchor="middle"
          className="network-core-label"
        >
          ZERO-KNOWLEDGE
        </text>
        <text x="540" y="191" textAnchor="middle" className="network-label">
          VERIFICATION
        </text>
      </svg>
    </div>
  );
}
