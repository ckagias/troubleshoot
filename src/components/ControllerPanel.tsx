import { useState, useEffect, useRef } from 'react'

const TOTAL = 17 + 2 + 2

interface State {
  btnPressed: boolean[]
  btnTested: boolean[]
  btnCounts: number[]
  axes: number[]
  axesTested: boolean[]
  triggerTested: boolean[]
  triggerVal: number[]
  stickCounts: [number, number]
  triggerCounts: [number, number]
}

function freshState(): State {
  return {
    btnPressed: Array(20).fill(false),
    btnTested: Array(20).fill(false),
    btnCounts: Array(20).fill(0),
    axes: [0, 0, 0, 0],
    axesTested: [false, false],
    triggerTested: [false, false],
    triggerVal: [0, 0],
    stickCounts: [0, 0],
    triggerCounts: [0, 0],
  }
}

function smoothClosedPath(pts: [number, number][]): string {
  const n = pts.length
  const segs: string[] = []
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    if (i === 0) segs.push(`M ${p1[0].toFixed(1)},${p1[1].toFixed(1)}`)
    segs.push(`C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`)
  }
  return segs.join(' ') + ' Z'
}

const W = 560, H = 380

function btnStyle(pressed: boolean, tested: boolean) {
  if (pressed) return { fill: 'var(--color-accent)', stroke: 'var(--color-accent)' }
  if (tested)  return { fill: 'var(--color-success)', stroke: 'var(--color-success)' }
  return           { fill: 'var(--color-surface-raised)', stroke: 'var(--color-border)' }
}

function textFill(pressed: boolean, tested: boolean) {
  if (pressed) return 'var(--color-accent)'
  if (tested)  return 'var(--color-success)'
  return 'var(--color-text-muted)'
}

const STYLES = {
  panel: 'space-y-4',
  title: 'text-lg font-semibold tracking-tight',
  description: 'text-sm text-text-muted leading-relaxed',
  statusRow: 'flex items-center gap-3 text-sm text-text-muted',
  resetBtn: 'bg-surface border border-border text-text-muted text-sm px-3 py-1 rounded-lg transition-colors hover:bg-surface-raised hover:text-text',
  prompt: 'text-sm text-text-muted py-8',
  layout: 'flex items-start gap-9',
  diagramWrap: 'shrink-0 pt-24',
  svg: 'block w-[480px] overflow-visible',
  counter: 'flex flex-col min-w-[200px]',
  counterTitle: 'text-sm font-semibold text-text mb-2.5',
  counterRow: 'flex items-center justify-between py-1.5 border-b border-border text-sm',
  counterLabel: 'text-text-muted',
  counterVal: (n: number) =>
    ['tabular-nums min-w-[28px] text-right', n > 0 ? 'text-success' : 'text-text-muted'].join(' '),
}

export function ControllerPanel() {
  const [connected, setConnected] = useState(false)
  const [state, setState] = useState<State>(freshState)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    function onConnect() { setConnected(true) }
    function onDisconnect() { setConnected(false); setState(freshState()) }
    window.addEventListener('gamepadconnected', onConnect)
    window.addEventListener('gamepaddisconnected', onDisconnect)
    const gp = navigator.getGamepads().find((g) => g !== null)
    if (gp) setConnected(true)
    return () => {
      window.removeEventListener('gamepadconnected', onConnect)
      window.removeEventListener('gamepaddisconnected', onDisconnect)
    }
  }, [])

  useEffect(() => {
    if (!connected) return
    function tick() {
      const gp = navigator.getGamepads().find((g) => g !== null)
      if (!gp) { rafRef.current = requestAnimationFrame(tick); return }
      setState((prev) => {
        const btnPressed = gp.buttons.map((b) => b.pressed)
        const btnCounts = prev.btnCounts.map((c, i) => {
          const wasPressed = prev.btnPressed[i]
          const nowPressed = gp.buttons[i]?.pressed ?? false
          return c + (!wasPressed && nowPressed ? 1 : 0)
        })
        const btnTested = prev.btnTested.map((t, i) => t || (gp.buttons[i]?.pressed ?? false))
        const axes = Array.from(gp.axes)
        const l2 = gp.buttons[6]?.value ?? 0
        const r2 = gp.buttons[7]?.value ?? 0
        const newL = Math.abs(axes[0]) > 0.3 || Math.abs(axes[1]) > 0.3
        const newR = Math.abs(axes[2]) > 0.3 || Math.abs(axes[3]) > 0.3
        const prevL = Math.abs(prev.axes[0] ?? 0) > 0.3 || Math.abs(prev.axes[1] ?? 0) > 0.3
        const prevR = Math.abs(prev.axes[2] ?? 0) > 0.3 || Math.abs(prev.axes[3] ?? 0) > 0.3
        const axesTested = [prev.axesTested[0] || newL, prev.axesTested[1] || newR]
        const stickCounts: [number, number] = [
          prev.stickCounts[0] + (!prevL && newL ? 1 : 0),
          prev.stickCounts[1] + (!prevR && newR ? 1 : 0),
        ]
        const prevL2Full = prev.triggerVal[0] >= 0.95
        const prevR2Full = prev.triggerVal[1] >= 0.95
        const triggerTested = [prev.triggerTested[0] || l2 >= 0.95, prev.triggerTested[1] || r2 >= 0.95]
        const triggerCounts: [number, number] = [
          prev.triggerCounts[0] + (!prevL2Full && l2 >= 0.95 ? 1 : 0),
          prev.triggerCounts[1] + (!prevR2Full && r2 >= 0.95 ? 1 : 0),
        ]
        return { btnPressed, btnTested, btnCounts, axes, axesTested, triggerTested, triggerVal: [l2, r2], stickCounts, triggerCounts }
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [connected])

  function reset() { setState(freshState()) }

  const { btnPressed, btnTested, btnCounts, axes, axesTested, triggerTested, triggerVal, stickCounts, triggerCounts } = state

  const testedCount =
    btnTested.slice(0, 17).filter(Boolean).length +
    axesTested.filter(Boolean).length +
    triggerTested.filter(Boolean).length

  const lx = (axes[0] ?? 0) * 18
  const ly = (axes[1] ?? 0) * 18
  const rx = (axes[2] ?? 0) * 18
  const ry = (axes[3] ?? 0) * 18

  const bodyPts: [number, number][] = [
    [0.108*W, H],[0.062*W,0.970*H],[0.032*W,0.916*H],[0.012*W,0.849*H],[0.003*W,0.778*H],[0.002*W,0.702*H],
    [0.014*W,0.561*H],[0.044*W,0.352*H],[0.082*W,0.213*H],
    [0.110*W,0.155*H],[0.140*W,0.075*H],[0.185*W,0.018*H],[0.240*W,0.003*H],[0.282*W,0.028*H],
    [0.380*W,0.013*H],[0.440*W,0.011*H],[0.500*W,0.010*H],[0.560*W,0.011*H],
    [(1-0.282)*W,0.028*H],[(1-0.240)*W,0.003*H],[(1-0.185)*W,0.018*H],[(1-0.140)*W,0.075*H],[(1-0.110)*W,0.155*H],
    [(1-0.082)*W,0.213*H],[(1-0.044)*W,0.352*H],[(1-0.014)*W,0.561*H],
    [(1-0.002)*W,0.702*H],[(1-0.003)*W,0.778*H],[(1-0.012)*W,0.849*H],[(1-0.032)*W,0.916*H],[(1-0.062)*W,0.970*H],
    [(1-0.108)*W, H],
    [(1-0.158)*W,0.982*H],[(1-0.181)*W,0.924*H],[(1-0.212)*W,0.816*H],[(1-0.237)*W,0.748*H],[(1-0.254)*W,0.716*H],
    [(1-0.324)*W,0.692*H],[(1-0.430)*W,0.696*H],
    [0.430*W,0.696*H],[0.324*W,0.692*H],
    [0.254*W,0.716*H],[0.237*W,0.748*H],[0.212*W,0.816*H],[0.181*W,0.924*H],[0.158*W,0.982*H],
  ]
  const bodyD = smoothClosedPath(bodyPts)

  const COUNTER_ROWS = [
    { label: 'Face Up',           count: btnCounts[3] },
    { label: 'Face Right',        count: btnCounts[1] },
    { label: 'Face Down',         count: btnCounts[0] },
    { label: 'Face Left',         count: btnCounts[2] },
    { label: 'D-Pad Up',          count: btnCounts[12] },
    { label: 'D-Pad Down',        count: btnCounts[13] },
    { label: 'D-Pad Left',        count: btnCounts[14] },
    { label: 'D-Pad Right',       count: btnCounts[15] },
    { label: 'L1',                count: btnCounts[4] },
    { label: 'R1',                count: btnCounts[5] },
    { label: 'L3',                count: btnCounts[10] },
    { label: 'R3',                count: btnCounts[11] },
    { label: 'Share',             count: btnCounts[8] },
    { label: 'Options',           count: btnCounts[9] },
    { label: 'PS',                count: btnCounts[16] },
    { label: 'Left Stick',        count: stickCounts[0] },
    { label: 'Right Stick',       count: stickCounts[1] },
    { label: 'L2 (full press)',   count: triggerCounts[0] },
    { label: 'R2 (full press)',   count: triggerCounts[1] },
  ]

  function btn(i: number) { return btnStyle(btnPressed[i], btnTested[i]) }

  const dpCx = 0.19 * W, dpCy = 0.28 * H
  const dpAW = 20, dpAL = 28, dpAR = 3, dpCapS = dpAW
  const dpHalf = dpCapS / 2
  const dpadArms = [
    { dx: 0,               dy: -(dpHalf + dpAL/2), i: 12, w: dpAW, h: dpAL },
    { dx: 0,               dy:  (dpHalf + dpAL/2), i: 13, w: dpAW, h: dpAL },
    { dx: -(dpHalf + dpAL/2), dy: 0,               i: 14, w: dpAL, h: dpAW },
    { dx:  (dpHalf + dpAL/2), dy: 0,               i: 15, w: dpAL, h: dpAW },
  ]

  const fcCx = 0.81 * W, fcCy = 0.28 * H
  const fOff = 28, fR = 15
  const faceItems = [
    { dx: 0, dy: -fOff, i: 3 },
    { dx: fOff, dy: 0, i: 1 },
    { dx: 0, dy: fOff, i: 0 },
    { dx: -fOff, dy: 0, i: 2 },
  ]

  const stickF = 0.30
  const lsCx = stickF * W, lsCy = 0.55 * H, sR = 33
  const rsCx = (1 - stickF) * W, rsCy = 0.55 * H

  return (
    <div className={STYLES.panel}>
      <div>
        <h2 className={STYLES.title}>Controller Test</h2>
        <p className={STYLES.description}>Connect a controller and press any button to start.</p>
      </div>
      <div className={STYLES.statusRow}>
        <span>{testedCount} / {TOTAL} inputs tested</span>
        <button className={STYLES.resetBtn} onClick={reset} aria-label="Reset test state">Reset</button>
      </div>

      {!connected ? (
        <p className={STYLES.prompt}>No controller detected, connect one and press any button.</p>
      ) : (
        <div className={STYLES.layout}>
          <div className={STYLES.diagramWrap}>
            <svg className={STYLES.svg} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
              <defs>
                {(() => {
                  const lx0 = 0.09*W, l2w = 0.19*W, l2h = 32, l2y = -74
                  const rx0 = (1-0.09)*W - 0.19*W, r2w = 0.19*W, r2h = 32, r2y = -74
                  return <>
                    <clipPath id="l2-clip">
                      <rect x={lx0} y={l2y} width={l2w} height={l2h} rx="10" />
                    </clipPath>
                    <clipPath id="r2-clip">
                      <rect x={rx0} y={r2y} width={r2w} height={r2h} rx="10" />
                    </clipPath>
                  </>
                })()}
              </defs>

              <path d={bodyD} fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="1.5" />

              {(() => {
                const lx0 = 0.09*W
                const l1w = 0.19*W, l1h = 22, l1y = -104
                const l2w = 0.19*W, l2h = 32, l2y = -74
                const { fill: l1fill, stroke: l1stroke } = btn(4)
                return <>
                  <text x={lx0 + l1w/2} y={l1y - 4} textAnchor="middle" fontSize="13" fill={textFill(btnPressed[4], btnTested[4])}>L1</text>
                  <rect x={lx0} y={l1y} width={l1w} height={l1h} rx={l1h/2} fill={l1fill} stroke={l1stroke} strokeWidth="1" />
                  <rect x={lx0} y={l2y} width={l2w} height={l2h} rx="10" fill="var(--color-surface-raised)" stroke={triggerTested[0] ? 'var(--color-success)' : 'var(--color-border)'} strokeWidth="1" />
                  <rect x={lx0} y={l2y} width={l2w * triggerVal[0]} height={l2h} fill="var(--color-accent)" opacity="0.7" clipPath="url(#l2-clip)" />
                  <text x={lx0 + l2w/2} y={l2y + l2h + 13} textAnchor="middle" fontSize="13" fill={triggerTested[0] ? 'var(--color-success)' : 'var(--color-text-muted)'}>{`L2 ${Math.round(triggerVal[0] * 100)}%`}</text>
                </>
              })()}

              {(() => {
                const rx0 = (1 - 0.09)*W - 0.19*W
                const r1w = 0.19*W, r1h = 22, r1y = -104
                const r2w = 0.19*W, r2h = 32, r2y = -74
                const { fill: r1fill, stroke: r1stroke } = btn(5)
                return <>
                  <text x={rx0 + r1w/2} y={r1y - 4} textAnchor="middle" fontSize="13" fill={textFill(btnPressed[5], btnTested[5])}>R1</text>
                  <rect x={rx0} y={r1y} width={r1w} height={r1h} rx={r1h/2} fill={r1fill} stroke={r1stroke} strokeWidth="1" />
                  <rect x={rx0} y={r2y} width={r2w} height={r2h} rx="10" fill="var(--color-surface-raised)" stroke={triggerTested[1] ? 'var(--color-success)' : 'var(--color-border)'} strokeWidth="1" />
                  <rect x={rx0} y={r2y} width={r2w * triggerVal[1]} height={r2h} fill="var(--color-accent)" opacity="0.7" clipPath="url(#r2-clip)" />
                  <text x={rx0 + r2w/2} y={r2y + r2h + 13} textAnchor="middle" fontSize="13" fill={triggerTested[1] ? 'var(--color-success)' : 'var(--color-text-muted)'}>{`R2 ${Math.round(triggerVal[1] * 100)}%`}</text>
                </>
              })()}

              {dpadArms.map(({ dx, dy, i, w, h }) => {
                const { fill, stroke } = btn(i)
                return (
                  <rect key={i}
                    x={dpCx + dx - w/2} y={dpCy + dy - h/2} width={w} height={h}
                    rx={dpAR} fill={fill} stroke={stroke} strokeWidth="1" />
                )
              })}
              <rect
                x={dpCx - dpCapS/2} y={dpCy - dpCapS/2} width={dpCapS} height={dpCapS} rx={4}
                fill="var(--color-surface-raised)" />

              {faceItems.map(({ dx, dy, i }) => {
                const { fill, stroke } = btn(i)
                return (
                  <circle key={i} cx={fcCx + dx} cy={fcCy + dy} r={fR} fill={fill} stroke={stroke} strokeWidth="1" />
                )
              })}

              {(() => { const { fill, stroke } = btn(8); return <circle cx={0.28*W} cy={0.17*H} r={10} fill={fill} stroke={stroke} strokeWidth="1" /> })()}
              {(() => { const { fill, stroke } = btn(9); return <circle cx={0.72*W} cy={0.17*H} r={10} fill={fill} stroke={stroke} strokeWidth="1" /> })()}
              {(() => { const { fill, stroke } = btn(16); return <circle cx={0.50*W} cy={0.55*H} r={10} fill={fill} stroke={stroke} strokeWidth="1" /> })()}

              {(() => {
                const lsTested = axesTested[0] || btnTested[10]
                const lsPressed = btnPressed[10]
                const ringStroke = lsPressed ? 'var(--color-accent)' : lsTested ? 'var(--color-success)' : 'var(--color-border)'
                const ringWidth = (lsPressed || lsTested) ? '2.5' : '1'
                const dotFill = lsPressed ? 'var(--color-accent)' : lsTested ? 'var(--color-success)' : 'var(--color-border)'
                const dzR = sR * 0.3
                return <g>
                  <circle cx={lsCx} cy={lsCy} r={sR} fill="var(--color-surface-raised)" stroke={ringStroke} strokeWidth={ringWidth} />
                  <circle cx={lsCx} cy={lsCy} r={dzR} fill="none" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                  <circle cx={lsCx + lx} cy={lsCy + ly} r={11} fill={dotFill} />
                  <text x={lsCx} y={lsCy + sR + 14} textAnchor="middle" fontSize="12" fill={lsTested ? 'var(--color-success)' : 'var(--color-text-muted)'}>L Stick</text>
                </g>
              })()}

              {(() => {
                const rsTested = axesTested[1] || btnTested[11]
                const rsPressed = btnPressed[11]
                const ringStroke = rsPressed ? 'var(--color-accent)' : rsTested ? 'var(--color-success)' : 'var(--color-border)'
                const ringWidth = (rsPressed || rsTested) ? '2.5' : '1'
                const dotFill = rsPressed ? 'var(--color-accent)' : rsTested ? 'var(--color-success)' : 'var(--color-border)'
                const dzR = sR * 0.3
                return <g>
                  <circle cx={rsCx} cy={rsCy} r={sR} fill="var(--color-surface-raised)" stroke={ringStroke} strokeWidth={ringWidth} />
                  <circle cx={rsCx} cy={rsCy} r={dzR} fill="none" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                  <circle cx={rsCx + rx} cy={rsCy + ry} r={11} fill={dotFill} />
                  <text x={rsCx} y={rsCy + sR + 14} textAnchor="middle" fontSize="12" fill={rsTested ? 'var(--color-success)' : 'var(--color-text-muted)'}>R Stick</text>
                </g>
              })()}

            </svg>
          </div>

          <div className={STYLES.counter}>
            <p className={STYLES.counterTitle}>Input Counter</p>
            {COUNTER_ROWS.map((row) => (
              <div key={row.label} className={STYLES.counterRow}>
                <span className={STYLES.counterLabel}>{row.label}</span>
                <span className={STYLES.counterVal(row.count)}>{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
