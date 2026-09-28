// What api/health answers with. Mirrors the sing-box fork's per-node prober
// state, keyed by outbound tag, plus the urltest group config it is judged
// against.
export type HealthState = "alive" | "suspect" | "dead" | "unknown"

export interface HealthProbe {
  rtt?: number
  last?: number
  status?: number
  at?: number
}

export interface HealthNode {
  tag: string
  state: HealthState
  state_since?: number
  last_ok?: number
  fails?: number
  connections?: number
  udp_flows?: number
  country?: string
  // Counters since core start, not since state_since.
  bytes_down?: number
  bytes_up?: number
  race_wins?: number
  race_losses?: number
  dial_fails?: number
  probe_ok?: number
  probe_fail?: number
  deaths?: number
  // 0 means unknown, not zero latency/speed.
  ttfb_ms?: number
  speed_bps?: number
  // Keyed by the probe URL, so a node carries one entry per group it belongs
  // to that tests a distinct URL.
  probes?: Record<string, HealthProbe>
}

export interface HealthGroup {
  tag: string
  link?: string
  primary?: string
  members?: string[]
  exclude_egress?: string[]
  expected_status?: number[]
}

export type HealthEventKind = "dead" | "alive" | "primary" | "udp_moved" | "site_moved" | "site_restored" | "site_slow"

export interface HealthEvent {
  at: number
  kind: HealthEventKind
  node?: string
  group?: string
  detail?: string
}

export interface HealthData {
  nodes: HealthNode[]
  groups: HealthGroup[]
  events?: HealthEvent[]
}
