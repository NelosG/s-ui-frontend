<template>
  <v-row>
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-select
        v-model="selectedGroupTag"
        :items="groupItems"
        :label="$t('health.selectGroup')"
        hide-details
      />
    </v-col>
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-switch
        v-model="showAll"
        color="primary"
        :label="$t('health.allNodes')"
        hide-details
      />
    </v-col>
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-select
        v-model="enabledColumns"
        :items="columnItems"
        :label="$t('health.columns')"
        multiple
        chips
        hide-details
      />
    </v-col>
  </v-row>

  <v-row class="mt-1">
    <v-col
      v-for="tile in summaryTiles"
      :key="tile.key"
      cols="6"
      sm="4"
      md="3"
    >
      <v-card>
        <v-card-text class="text-center">
          <div
            class="text-h5"
            :class="tile.colorClass"
          >
            {{ tile.value }}
          </div>
          <div>{{ tile.label }}</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-card
    class="mt-4"
    :subtitle="$t('health.groups')"
  >
    <v-data-table
      :items="groups"
      :headers="groupHeaders"
      :loading="firstLoad"
      :mobile="smAndDown"
      :hide-default-footer="groups.length <= 10"
      items-per-page="10"
      density="compact"
    />
  </v-card>

  <v-card
    class="mt-4"
    :subtitle="$t('health.nodes')"
  >
    <v-data-table
      :items="nodeRows"
      :headers="nodeHeaders"
      :loading="firstLoad"
      :mobile="smAndDown"
      :hide-default-footer="nodeRows.length <= 50"
      items-per-page="50"
      density="compact"
    >
      <template #item.state="{ item }">
        <v-chip
          :color="stateColor(item.state)"
          size="small"
          variant="flat"
        >
          {{ item.state }}
        </v-chip>
      </template>
      <template #item.tag="{ item }">
        <v-icon
          v-if="item.tag === selectedGroup?.primary"
          icon="mdi-star"
          size="small"
          color="primary"
        />
        {{ item.tag }}
      </template>
      <template #item.state_since="{ item }">
        {{ relativeTime(item.state_since) }}
      </template>
      <template #item.rtt="{ item }">
        {{ item.probe?.rtt != null ? item.probe.rtt + $t('date.ms') : '-' }}
      </template>
      <template #item.probeLast="{ item }">
        {{ item.probe?.at ? relativeTime(item.probe.at) : '-' }}
      </template>
      <template #item.bytes_down="{ item }">
        {{ item.bytes_down ? HumanReadable.sizeFormat(item.bytes_down) : '-' }}
      </template>
      <template #item.bytes_up="{ item }">
        {{ item.bytes_up ? HumanReadable.sizeFormat(item.bytes_up) : '-' }}
      </template>
      <template #item.probe_success="{ item }">
        {{ probeSuccess(item) != null ? probeSuccess(item) + '%' : '-' }}
      </template>
      <template #item.ttfb_ms="{ item }">
        {{ item.ttfb_ms ? item.ttfb_ms + $t('date.ms') : '-' }}
      </template>
      <template #item.speed_bps="{ item }">
        {{ item.speed_bps ? formatSpeed(item.speed_bps) : '-' }}
      </template>
    </v-data-table>
  </v-card>

  <v-card
    class="mt-4"
    :subtitle="$t('health.events')"
  >
    <v-card-text>
      <v-row>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-select
            v-model="eventKindFilter"
            :items="eventKinds"
            :label="$t('health.eventKindFilter')"
            multiple
            chips
            hide-details
          />
        </v-col>
      </v-row>
    </v-card-text>
    <v-data-table
      :items="filteredEvents"
      :headers="eventHeaders"
      :loading="firstLoad"
      :mobile="smAndDown"
      :hide-default-footer="filteredEvents.length <= 20"
      items-per-page="20"
      density="compact"
    >
      <template #item.at="{ item }">
        {{ formatEventTime(item.at) }}
      </template>
      <template #item.kind="{ item }">
        <v-chip
          :color="eventKindColor(item.kind)"
          size="small"
          variant="flat"
        >
          {{ item.kind }}
        </v-chip>
      </template>
    </v-data-table>
  </v-card>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import HttpUtils from '@/plugins/httputil'
import { HumanReadable } from '@/plugins/utils'
import { i18n } from '@/locales'
import { HealthData, HealthEvent, HealthEventKind, HealthGroup, HealthNode, HealthProbe, HealthState } from '@/types/health'

// A node row carries its probe against the currently selected group's link
// alongside the fields api/health always sends.
type NodeRow = HealthNode & { probe?: HealthProbe }

const { smAndDown } = useDisplay()

// Only the first load shows progress; the 3s refresh would otherwise flash the bar.
const firstLoad = ref(true)
const showAll = ref(false)
const nodes = ref<HealthNode[]>([])
const groups = ref<HealthGroup[]>([])
const events = ref<HealthEvent[]>([])
const selectedGroupTag = ref('')
const eventKindFilter = ref<HealthEventKind[]>([])

const eventKinds: HealthEventKind[] = ['dead', 'alive', 'primary', 'udp_moved', 'site_moved', 'site_restored', 'site_slow']

const groupItems = computed(() => groups.value.map(g => g.tag).sort())

const selectedGroup = computed((): HealthGroup | undefined =>
  groups.value.find(g => g.tag === selectedGroupTag.value))

// Every member of the selected group probes the same link, so that URL is
// the one entry in a node's probe map worth surfacing for it.
const nodeRows = computed((): NodeRow[] => {
  const group = selectedGroup.value
  const link = group?.link
  const byTag = new Map(nodes.value.map(n => [n.tag, n]))
  // Members in the group's own order: that order is the failover priority, and a stable
  // order keeps rows from jumping between refreshes.
  const list = showAll.value || !group
    ? [...nodes.value].sort((a, b) => a.tag.localeCompare(b.tag))
    : (group.members ?? []).map(tag => byTag.get(tag) ?? { tag, state: 'unknown' } as HealthNode)
  return list.map(n => ({ ...n, probe: link ? n.probes?.[link] : undefined }))
})

const groupHeaders = computed(() => [
  { title: i18n.global.t('objects.tag'), key: 'tag' },
  { title: i18n.global.t('health.primary'), key: 'primary', value: (g: HealthGroup) => g.primary || '-' },
  { title: i18n.global.t('health.members'), key: 'members', value: (g: HealthGroup) => g.members?.length ?? 0 },
  { title: i18n.global.t('types.lb.excludeEgress'), key: 'exclude_egress',
    value: (g: HealthGroup) => g.exclude_egress?.length ? g.exclude_egress.join(', ') : '-' },
  { title: i18n.global.t('types.lb.expectedStatus'), key: 'expected_status',
    value: (g: HealthGroup) => g.expected_status?.length ? g.expected_status.join(', ') : '-' },
])

// Counters and rarely-needed columns stay behind the picker below so the
// table does not turn into an unreadable wall on an 18-column node list.
const optionalNodeColumns = computed(() => [
  { key: 'country', title: i18n.global.t('health.country'), value: (n: NodeRow) => n.country || '-' },
  { key: 'connections', title: i18n.global.t('health.connections'), value: (n: NodeRow) => n.connections ?? 0 },
  { key: 'udp_flows', title: i18n.global.t('health.udpFlows'), value: (n: NodeRow) => n.udp_flows ?? 0 },
  { key: 'bytes_down', title: i18n.global.t('health.trafficDown'), value: (n: NodeRow) => n.bytes_down ?? 0 },
  { key: 'bytes_up', title: i18n.global.t('health.trafficUp'), value: (n: NodeRow) => n.bytes_up ?? 0 },
  { key: 'race_wins', title: i18n.global.t('health.raceWins'), value: (n: NodeRow) => n.race_wins ?? 0 },
  { key: 'race_losses', title: i18n.global.t('health.raceLosses'), value: (n: NodeRow) => n.race_losses ?? 0 },
  { key: 'dial_fails', title: i18n.global.t('health.dialFails'), value: (n: NodeRow) => n.dial_fails ?? 0 },
  { key: 'probe_success', title: i18n.global.t('health.probeSuccess'), value: (n: NodeRow) => probeSuccess(n) ?? -1 },
  { key: 'deaths', title: i18n.global.t('health.deaths'), value: (n: NodeRow) => n.deaths ?? 0 },
  { key: 'ttfb_ms', title: i18n.global.t('health.ttfb'), value: (n: NodeRow) => n.ttfb_ms ?? 0 },
  { key: 'speed_bps', title: i18n.global.t('health.speed'), value: (n: NodeRow) => n.speed_bps ?? 0 },
  { key: 'rtt', title: i18n.global.t('health.rtt'), value: (n: NodeRow) => n.probe?.rtt ?? -1 },
  { key: 'probeLast', title: i18n.global.t('health.probeLast'), value: (n: NodeRow) => n.probe?.at ?? 0 },
  { key: 'probeStatus', title: i18n.global.t('health.probeStatus'), value: (n: NodeRow) => n.probe?.status ?? '-' },
  { key: 'state_since', title: i18n.global.t('health.stateSince'), value: (n: NodeRow) => n.state_since ?? 0 },
])

const columnItems = computed(() => optionalNodeColumns.value.map(c => ({ title: c.title, value: c.key })))

const defaultColumns = ['country', 'connections', 'probe_success', 'rtt', 'state_since']

const loadStoredColumns = (): string[] => {
  try {
    const raw = localStorage.getItem('healthNodeColumns')
    return raw ? JSON.parse(raw) : defaultColumns
  } catch {
    return defaultColumns
  }
}

const enabledColumns = ref<string[]>(loadStoredColumns())

watch(enabledColumns, (v) => {
  localStorage.setItem('healthNodeColumns', JSON.stringify(v))
})

const nodeHeaders = computed(() => [
  { title: i18n.global.t('objects.tag'), key: 'tag' },
  { title: i18n.global.t('health.state'), key: 'state' },
  ...optionalNodeColumns.value.filter(c => enabledColumns.value.includes(c.key)),
])

const eventHeaders = computed(() => [
  { title: i18n.global.t('health.eventTime'), key: 'at', value: (e: HealthEvent) => e.at },
  { title: i18n.global.t('health.eventKind'), key: 'kind' },
  { title: i18n.global.t('objects.tag'), key: 'node', value: (e: HealthEvent) => e.node || '-' },
  { title: i18n.global.t('health.eventGroup'), key: 'group', value: (e: HealthEvent) => e.group || '-' },
  { title: i18n.global.t('health.eventDetail'), key: 'detail', value: (e: HealthEvent) => e.detail || '-' },
])

const filteredEvents = computed(() => eventKindFilter.value.length
  ? events.value.filter(e => eventKindFilter.value.includes(e.kind))
  : events.value)

const stateColor = (state: HealthState): string => {
  switch (state) {
    case 'alive': return 'success'
    case 'suspect': return 'warning'
    case 'dead': return 'error'
    default: return 'grey'
  }
}

const eventKindColor = (kind: HealthEventKind): string => {
  switch (kind) {
    case 'dead': return 'error'
    case 'alive': return 'success'
    case 'primary': return 'primary'
    case 'site_moved': return 'warning'
    case 'site_restored': return 'success'
    case 'site_slow': return 'grey'
    default: return 'info'
  }
}

// probe_ok/probe_fail are counters since core start, not since state_since,
// so this is the node's whole-lifetime hit rate rather than a recent one.
const probeSuccess = (n: NodeRow): number | undefined => {
  const total = (n.probe_ok ?? 0) + (n.probe_fail ?? 0)
  if (total === 0) return undefined
  return Math.round((n.probe_ok ?? 0) / total * 100)
}

const formatSpeed = (bps: number): string => (bps * 8 / 1_000_000).toFixed(1) + ' ' + i18n.global.t('stats.Mbps')

// The panel deals in unix ms everywhere else; the health snapshot is no
// different, so elapsed time reuses the existing duration formatter.
const relativeTime = (ms?: number): string => {
  if (!ms) return '-'
  const seconds = Math.max(0, Math.floor((Date.now() - ms) / 1000))
  return HumanReadable.formatSecond(seconds)
}

const formatEventTime = (ms: number): string => new Date(ms).toLocaleTimeString() + ' (' + relativeTime(ms) + ')'

const ONE_HOUR_MS = 3600_000

const eventsLastHour = computed(() => {
  const cutoff = Date.now() - ONE_HOUR_MS
  return events.value.filter(e => e.at >= cutoff)
})

const countEvents = (kind: HealthEventKind) => eventsLastHour.value.filter(e => e.kind === kind).length

const summaryTiles = computed(() => [
  { key: 'alive', value: nodes.value.filter(n => n.state === 'alive').length, label: i18n.global.t('health.aliveNow'), colorClass: 'text-success' },
  { key: 'suspect', value: nodes.value.filter(n => n.state === 'suspect').length, label: i18n.global.t('health.suspectNow'), colorClass: 'text-warning' },
  { key: 'dead', value: nodes.value.filter(n => n.state === 'dead').length, label: i18n.global.t('health.deadNow'), colorClass: 'text-error' },
  { key: 'deaths', value: countEvents('dead'), label: i18n.global.t('health.deathsLastHour'), colorClass: '' },
  { key: 'primary', value: countEvents('primary'), label: i18n.global.t('health.primarySwitchesLastHour'), colorClass: '' },
  { key: 'udp', value: countEvents('udp_moved'), label: i18n.global.t('health.udpMovesLastHour'), colorClass: '' },
  { key: 'site', value: countEvents('site_moved'), label: i18n.global.t('health.sitesMovedLastHour'), colorClass: '' },
])

const loadData = async () => {
  const msg = await HttpUtils.get<HealthData>('api/health')
  if (msg.success && msg.obj) {
    nodes.value = msg.obj.nodes ?? []
    groups.value = msg.obj.groups ?? []
    events.value = msg.obj.events ?? []
    if (!selectedGroupTag.value && groups.value.length > 0) {
      selectedGroupTag.value = groups.value[0].tag
    }
  }
  firstLoad.value = false
}

let intervalId: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await loadData()
  intervalId = setInterval(loadData, 3000)
})

onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
})
</script>
