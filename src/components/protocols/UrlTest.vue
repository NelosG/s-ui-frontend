<template>
  <v-card subtitle="URL Test">
    <v-row>
      <v-col
        cols="12"
        sm="6"
      >
        <v-combobox
          v-model="data.outbounds"
          :items="tags"
          :label="$t('pages.outbounds')"
          multiple
          chips
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="mode"
          :items="[{ title: $t('types.lb.modeLatency'), value: 'latency' }, { title: $t('types.lb.modeFallback'), value: 'fallback' }]"
          :label="$t('types.lb.mode')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-if="optionUrl"
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="data.url"
          :label="$t('types.lb.testUrl')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="optionEgressUrl"
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="data.egress_url"
          :label="$t('types.lb.egressUrl')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-if="optionInterval"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="interval"
          :label="$t('types.lb.interval')"
          hide-details
          type="number"
          min="3"
          :suffix="$t('date.s')"
        />
      </v-col>
      <v-col
        v-if="optionFastInterval"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="fastInterval"
          :label="$t('types.lb.fastInterval')"
          hide-details
          type="number"
          min="1"
          :suffix="$t('date.s')"
        />
      </v-col>
      <v-col
        v-if="optionTolerance"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="tolerance"
          :label="$t('types.lb.tolerance')"
          hide-details
          type="number"
          min="0"
          :suffix="$t('date.ms')"
        />
      </v-col>
      <v-col
        v-if="optionIdle"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="idle_timeout"
          :label="$t('transport.idleTimeout')"
          hide-details
          type="number"
          min="0"
          :suffix="$t('date.m')"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-if="optionSiteMemory"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="siteMemory"
          :label="$t('types.lb.siteMemory')"
          hide-details
          type="number"
          min="1"
          :suffix="$t('date.h')"
        />
      </v-col>
      <v-col
        v-if="optionHedgeDelay"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="hedgeDelay"
          :label="$t('types.lb.hedgeDelay')"
          hide-details
          type="number"
          min="0"
          :suffix="$t('date.ms')"
        />
      </v-col>
      <v-col
        v-if="optionMinSpeed"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="minSpeed"
          :label="$t('types.lb.minSpeed')"
          hide-details
          type="number"
          min="0"
          :suffix="$t('stats.Mbps')"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-if="optionExpectedStatus"
        cols="12"
        sm="6"
      >
        <v-combobox
          v-model="expectedStatus"
          :label="$t('types.lb.expectedStatus')"
          multiple
          chips
          hide-details
        />
      </v-col>
      <v-col
        v-if="optionExcludeEgress"
        cols="12"
        sm="6"
      >
        <v-combobox
          v-model="excludeEgress"
          :label="$t('types.lb.excludeEgress')"
          multiple
          chips
          hide-details
        />
      </v-col>
      <v-col
        v-if="optionLastResort"
        cols="12"
        sm="6"
      >
        <v-select
          v-model="data.last_resort"
          :items="tags"
          :label="$t('types.lb.lastResort')"
          :hint="$t('types.lb.lastResortHint')"
          persistent-hint
          multiple
          chips
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        sm="6"
      >
        <v-switch
          v-model="data.interrupt_exist_connections"
          color="primary"
          :label="$t('types.lb.interruptConn')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-switch
          v-model="data.disable_race"
          color="primary"
          :label="$t('types.lb.disableRace')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-card-actions>
      <v-spacer />
      <v-menu
        v-model="menu"
        :close-on-content-click="false"
        location="start"
      >
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            hide-details
            variant="tonal"
          >
            {{ $t('types.lb.urlTestOptions') }}
          </v-btn>
        </template>
        <v-card>
          <v-list>
            <v-list-item>
              <v-switch
                v-model="optionUrl"
                color="primary"
                :label="$t('types.lb.testUrl')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionEgressUrl"
                color="primary"
                :label="$t('types.lb.egressUrl')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionInterval"
                color="primary"
                :label="$t('types.lb.interval')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionFastInterval"
                color="primary"
                :label="$t('types.lb.fastInterval')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionTolerance"
                color="primary"
                :label="$t('types.lb.tolerance')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionIdle"
                color="primary"
                :label="$t('transport.idleTimeout')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionSiteMemory"
                color="primary"
                :label="$t('types.lb.siteMemory')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionHedgeDelay"
                color="primary"
                :label="$t('types.lb.hedgeDelay')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionMinSpeed"
                color="primary"
                :label="$t('types.lb.minSpeed')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionExpectedStatus"
                color="primary"
                :label="$t('types.lb.expectedStatus')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionExcludeEgress"
                color="primary"
                :label="$t('types.lb.excludeEgress')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionLastResort"
                color="primary"
                :label="$t('types.lb.lastResort')"
                hide-details
              />
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Outbound } from '@/types/outbounds'

// Only the URLTest outbound fields this form reads or writes.
interface UrlTestData {
  outbounds?: string[]
  url?: string
  interval?: string
  tolerance?: number
  idle_timeout?: string
  interrupt_exist_connections?: boolean
  fast_interval?: string
  expected_status?: number[]
  exclude_egress?: string[]
  egress_url?: string
  disable_race?: boolean
  mode?: string
  site_memory?: string
  hedge_delay?: string
  min_speed?: number
  last_resort?: string[]
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Outbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as UrlTestData)

defineProps<{
  tags: string[]
}>()

const menu = ref(false)

const optionUrl = computed({
  get: (): boolean => data.value.url != undefined,
  set: (v:boolean) => { data.value.url = v ? 'https://www.gstatic.com/generate_204' : undefined },
})

const optionEgressUrl = computed({
  get: (): boolean => data.value.egress_url != undefined,
  set: (v:boolean) => { data.value.egress_url = v ? 'https://www.cloudflare.com/cdn-cgi/trace' : undefined },
})

const optionInterval = computed({
  get: (): boolean => data.value.interval != undefined,
  set: (v:boolean) => { data.value.interval = v ? '3s' : undefined },
})

const optionFastInterval = computed({
  get: (): boolean => data.value.fast_interval != undefined,
  set: (v:boolean) => { data.value.fast_interval = v ? '3s' : undefined },
})

const optionTolerance = computed({
  get: (): boolean => data.value.tolerance != undefined,
  set: (v:boolean) => { data.value.tolerance = v ? 50 : undefined },
})

const optionIdle = computed({
  get: (): boolean => data.value.idle_timeout != undefined,
  set: (v:boolean) => { data.value.idle_timeout = v ? '30m' : undefined },
})

const optionSiteMemory = computed({
  get: (): boolean => data.value.site_memory != undefined,
  set: (v:boolean) => { data.value.site_memory = v ? '3h' : undefined },
})

const optionHedgeDelay = computed({
  get: (): boolean => data.value.hedge_delay != undefined,
  set: (v:boolean) => { data.value.hedge_delay = v ? '1500ms' : undefined },
})

const optionMinSpeed = computed({
  get: (): boolean => data.value.min_speed != undefined,
  set: (v:boolean) => { data.value.min_speed = v ? 5 : undefined },
})

const optionExpectedStatus = computed({
  get: (): boolean => data.value.expected_status != undefined,
  set: (v:boolean) => { data.value.expected_status = v ? [401] : undefined },
})

const optionExcludeEgress = computed({
  get: (): boolean => data.value.exclude_egress != undefined,
  set: (v:boolean) => { data.value.exclude_egress = v ? [] : undefined },
})

// Exits outside the group tried only when none of its members answers; the usual pick is
// zapret's socks and direct, never for a group whose sites refuse Russian addresses.
const optionLastResort = computed({
  get: (): boolean => data.value.last_resort != undefined,
  set: (v:boolean) => { data.value.last_resort = v ? [] : undefined },
})

const interval = computed({
  get: (): number => data.value.interval ? parseInt(data.value.interval.replace('s','')) : 3,
  set: (v:number) => { data.value.interval = v > 0 ? v + 's' : '3s' },
})

const fastInterval = computed({
  get: (): number => data.value.fast_interval ? parseInt(data.value.fast_interval.replace('s','')) : 3,
  set: (v:number) => { data.value.fast_interval = v > 0 ? v + 's' : '3s' },
})

const tolerance = computed({
  get: (): number => data.value.tolerance ? parseInt(String(data.value.tolerance)) : 0,
  set: (v:number) => { data.value.tolerance = v > 0 ? v : 0 },
})

const idle_timeout = computed({
  get: (): number => data.value.idle_timeout ? parseInt(data.value.idle_timeout.replace('m','')) : 30,
  set: (v:number) => { data.value.idle_timeout = v > 0 ? v + 'm' : '0m' },
})

// Absent means "latency", so the default keeps the saved JSON unchanged for
// every group that never touches fallback mode.
const mode = computed({
  get: (): string => data.value.mode ?? 'latency',
  set: (v:string) => { data.value.mode = v === 'latency' ? undefined : v },
})

const siteMemory = computed({
  get: (): number => data.value.site_memory ? parseInt(data.value.site_memory.replace('h','')) : 3,
  set: (v:number) => { data.value.site_memory = v > 0 ? v + 'h' : '3h' },
})

const hedgeDelay = computed({
  get: (): number => data.value.hedge_delay ? parseInt(data.value.hedge_delay.replace('ms','')) : 1500,
  set: (v:number) => { data.value.hedge_delay = v > 0 ? v + 'ms' : '1500ms' },
})

const minSpeed = computed({
  get: (): number => data.value.min_speed ?? 5,
  set: (v:number) => { data.value.min_speed = v > 0 ? v : 0 },
})

// Free-typed chips rather than a fixed item list: a node's real exit country
// is only known after a probe, so there is nothing to draw suggestions from.
const excludeEgress = computed({
  get: (): string[] => data.value.exclude_egress ?? [],
  set: (v:string[]) => { data.value.exclude_egress = v.map(c => String(c).toUpperCase().trim()).filter(c => c.length > 0) },
})

const expectedStatus = computed({
  get: (): number[] => data.value.expected_status ?? [],
  set: (v:(string|number)[]) => { data.value.expected_status = v.map(s => parseInt(String(s), 10)).filter(n => !isNaN(n)) },
})
</script>
