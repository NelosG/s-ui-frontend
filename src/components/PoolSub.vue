<template>
  <v-row>
    <v-col cols="12">
      <div class="text-subtitle-2 mb-1">
        {{ $t('setting.poolSubUrls') }}
      </div>
      <v-table
        v-if="links.length"
        density="compact"
      >
        <tbody>
          <tr
            v-for="(link, i) in links"
            :key="link"
          >
            <td class="text-no-wrap">
              {{ i + 1 }}
            </td>
            <td
              style="word-break: break-all"
              :title="link"
            >
              {{ shortLink(link) }}
            </td>
            <td class="text-no-wrap">
              <template v-if="sourceOf(link)">
                <v-chip
                  v-if="sourceOf(link)?.error"
                  color="error"
                  size="small"
                  :title="sourceOf(link)?.error"
                >
                  {{ $t('poolSub.linkFailed') }}
                </v-chip>
                <span
                  v-else
                  :title="typesText(sourceOf(link)?.types)"
                >
                  {{ $t('poolSub.linkNodes', { usable: sourceOf(link)?.usable, fetched: sourceOf(link)?.fetched }) }}
                </span>
              </template>
              <span
                v-else
                class="text-medium-emphasis"
              >
                {{ $t('poolSub.linkNotRun') }}
              </span>
            </td>
            <td class="text-no-wrap text-right">
              <v-btn
                icon="mdi-arrow-up"
                size="small"
                variant="text"
                :disabled="i == 0"
                @click="move(i, -1)"
              />
              <v-btn
                icon="mdi-arrow-down"
                size="small"
                variant="text"
                :disabled="i == links.length - 1"
                @click="move(i, 1)"
              />
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                @click="removeLink(i)"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
      <div
        v-else
        class="text-medium-emphasis"
      >
        {{ $t('poolSub.noLinks') }}
      </div>
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="12">
      <v-textarea
        v-model="pending"
        :label="$t('poolSub.addLinks')"
        :hint="$t('poolSub.addLinksHint')"
        persistent-hint
        rows="2"
        auto-grow
        spellcheck="false"
      />
      <div class="d-flex ga-2 mt-2">
        <v-btn
          variant="outlined"
          :loading="checking"
          :disabled="!pendingLinks.length"
          @click="checkPending"
        >
          {{ $t('poolSub.check') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="outlined"
          :disabled="!pendingLinks.length"
          @click="addPending"
        >
          {{ $t('actions.add') }} ({{ pendingLinks.length }})
        </v-btn>
      </div>
      <v-alert
        v-for="(r, i) in checked"
        :key="i"
        :type="r.error ? 'error' : (r.usable ? 'success' : 'warning')"
        variant="tonal"
        density="compact"
        class="mt-2"
      >
        <div style="word-break: break-all">
          {{ r.link }}
        </div>
        <div v-if="r.error">
          {{ r.error }}
        </div>
        <template v-else>
          <div>
            {{ $t('poolSub.linkNodes', { usable: r.usable, fetched: r.fetched }) }}<span v-if="r.usable">: {{ typesText(r.types) }}</span>
          </div>
          <div
            v-if="r.sample?.length"
            class="text-caption"
          >
            {{ r.sample.join(', ') }}{{ r.usable > r.sample.length ? ', ...' : '' }}
          </div>
        </template>
      </v-alert>
    </v-col>
  </v-row>
  <v-row>
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-text-field
        v-model="model.poolSubUA"
        :label="$t('setting.poolSubUA')"
        hide-details
      />
    </v-col>
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-text-field
        v-model.number="poolSubInterval"
        type="number"
        min="0"
        :label="$t('setting.poolSubInterval')"
        :suffix="$t('date.m')"
        hide-details
      />
    </v-col>
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-text-field
        v-model="model.poolSubProtocols"
        :label="$t('setting.poolSubProtocols') + ' ' + $t('commaSeparated')"
        hide-details
      />
    </v-col>
  </v-row>
  <v-row>
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-text-field
        v-model="model.poolSubSkip"
        :label="$t('setting.poolSubSkip')"
        hide-details
      />
    </v-col>
    <v-col
      cols="12"
      sm="6"
      md="4"
      class="d-flex align-center"
    >
      <v-switch
        v-model="poolSubAddNew"
        color="primary"
        :label="$t('setting.poolSubAddNew')"
        hide-details
      />
    </v-col>
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-text-field
        v-model.number="poolSubRemoveAfter"
        type="number"
        min="0"
        :label="$t('setting.poolSubRemoveAfter')"
        :suffix="$t('date.d')"
        :hint="$t('setting.poolSubRemoveAfterHint')"
        persistent-hint
      />
    </v-col>
  </v-row>
  <v-card-actions>
    <v-spacer />
    <v-btn
      color="primary"
      variant="outlined"
      :loading="updating"
      @click="updateNow"
    >
      {{ $t('actions.updateNow') }}
    </v-btn>
  </v-card-actions>

  <v-card
    v-if="report"
    class="mt-4"
    :subtitle="$t('poolSub.lastReport')"
  >
    <v-card-text>
      <v-row>
        <v-col
          cols="6"
          sm="3"
        >
          {{ $t('poolSub.at') }}: {{ formatAt(report.at) }}
        </v-col>
        <v-col
          cols="6"
          sm="3"
        >
          {{ $t('poolSub.fetched') }}: {{ report.fetched }}
        </v-col>
        <v-col
          cols="6"
          sm="3"
        >
          {{ $t('poolSub.usable') }}: {{ report.usable }}
        </v-col>
        <v-col
          cols="6"
          sm="3"
        >
          {{ $t('poolSub.unchanged') }}: {{ report.unchanged }}
        </v-col>
        <v-col
          cols="6"
          sm="3"
        >
          {{ $t('poolSub.joined') }}: {{ report.joined ?? 0 }}
        </v-col>
      </v-row>
      <v-expansion-panels
        variant="accordion"
        class="mt-2"
      >
        <v-expansion-panel>
          <v-expansion-panel-title>
            {{ $t('poolSub.updated') }} ({{ report.updated.length }})
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            {{ report.updated.join(', ') || $t('none') }}
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-title>
            {{ $t('poolSub.added') }} ({{ report.added.length }})
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            {{ report.added.join(', ') || $t('none') }}
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-title>
            {{ $t('poolSub.missing') }} ({{ report.missing.length }})
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            {{ report.missing.join(', ') || $t('none') }}
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-title>
            {{ $t('poolSub.removed') }} ({{ report.removed.length }})
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            {{ report.removed.join(', ') || $t('none') }}
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-title>
            {{ $t('poolSub.held') }} ({{ report.held.length }})
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            {{ report.held.join(', ') || $t('none') }}
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-title>
            {{ $t('poolSub.duplicates') }} ({{ report.duplicates.length }})
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            {{ report.duplicates.join(', ') || $t('none') }}
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
      <v-alert
        v-if="report.errors.length"
        type="error"
        variant="tonal"
        density="compact"
        class="mt-2"
      >
        <div
          v-for="(e, i) in report.errors"
          :key="i"
        >
          {{ e }}
        </div>
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import HttpUtils from '@/plugins/httputil'

// Only the settings rows this form touches. The parent owns the whole
// settings object and keeps the rest of it.
interface PoolSubSettings {
  poolSubUrls: string
  poolSubUA: string
  poolSubInterval: string
  poolSubProtocols: string
  poolSubSkip: string
  poolSubAddNew: string
  poolSubRemoveAfter: string
}

// One link's share of a run, and what api/poolSubCheck answers per link.
interface PoolSubSource {
  link: string
  fetched: number
  usable: number
  types: Record<string, number> | null
  sample?: string[]
  error?: string
}

// What api/poolSubUpdate and api/poolSub answer with.
interface PoolSubReport {
  at: number
  fetched: number
  usable: number
  updated: string[]
  added: string[]
  unchanged: number
  joined?: number
  missing: string[]
  errors: string[]
  removed: string[]
  held: string[]
  duplicates: string[]
  sources?: PoolSubSource[]
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<PoolSubSettings>('settings', { required: true })

const updating = ref(false)
const report = ref<PoolSubReport | null>(null)
const pending = ref('')
const checking = ref(false)
const checked = ref<PoolSubSource[]>([])

// poolSubUrls stays a newline list in the settings table; the order matters (the first
// link wins on duplicate node names).
const links = computed({
  get: (): string[] => (model.value.poolSubUrls ?? '').split(/\s+/).filter(l => l.length > 0),
  set: (v: string[]) => { model.value.poolSubUrls = v.join('\n') }
})

const isHttp = (l: string): boolean => /^https?:\/\/\S+$/i.test(l)

// links pasted in the box that are not in the list yet
const pendingLinks = computed((): string[] => {
  const seen = new Set(links.value)
  const result: string[] = []
  for (const l of pending.value.split(/\s+/)) {
    if (isHttp(l) && !seen.has(l)) {
      seen.add(l)
      result.push(l)
    }
  }
  return result
})

// Same cut as the backend's redactSub: the report only carries links in this form, and the
// token has no business on screen either.
const shortLink = (link: string): string => {
  const i = link.lastIndexOf('/')
  return i > 0 && link.length - i > 12 ? link.slice(0, i + 9) + '...' : link
}

const sourceOf = (link: string): PoolSubSource | undefined =>
  report.value?.sources?.find(s => s.link == shortLink(link))

const typesText = (types: Record<string, number> | null | undefined): string =>
  Object.entries(types ?? {}).map(([t, n]) => `${t} ${n}`).join(', ')

const move = (i: number, d: number) => {
  const l = [...links.value]
  const [item] = l.splice(i, 1)
  l.splice(i + d, 0, item)
  links.value = l
}

const removeLink = (i: number) => {
  links.value = links.value.filter((_, j) => j != i)
}

const addPending = () => {
  links.value = [...links.value, ...pendingLinks.value]
  pending.value = ''
  checked.value = []
}

const checkPending = async () => {
  checking.value = true
  const msg = await HttpUtils.post<PoolSubSource[]>('api/poolSubCheck', { urls: pendingLinks.value.join('\n') })
  checked.value = msg.success && msg.obj ? msg.obj : []
  checking.value = false
}

const poolSubInterval = computed({
  get: (): number => model.value.poolSubInterval.length > 0 ? parseInt(model.value.poolSubInterval) : 0,
  set: (v:number) => { model.value.poolSubInterval = v > 0 ? v.toString() : "0" }
})

const poolSubAddNew = computed({
  get: (): boolean => model.value.poolSubAddNew == "true",
  set: (v:boolean) => { model.value.poolSubAddNew = v ? "true" : "false" }
})

const poolSubRemoveAfter = computed({
  get: (): number => model.value.poolSubRemoveAfter?.length > 0 ? parseInt(model.value.poolSubRemoveAfter) : 7,
  set: (v:number) => { model.value.poolSubRemoveAfter = v > 0 ? v.toString() : "0" }
})

const formatAt = (at: number): string => new Date(at * 1000).toLocaleString()

// Older stored reports may carry JSON null for these lists rather than [],
// and the template joins/lengths them unconditionally.
const normalizeReport = (r: PoolSubReport): PoolSubReport => ({
  ...r,
  updated: r.updated ?? [],
  added: r.added ?? [],
  missing: r.missing ?? [],
  errors: r.errors ?? [],
  removed: r.removed ?? [],
  held: r.held ?? [],
  duplicates: r.duplicates ?? [],
  sources: r.sources ?? [],
})

const updateNow = async () => {
  updating.value = true
  const msg = await HttpUtils.post<PoolSubReport>('api/poolSubUpdate', {})
  if (msg.success && msg.obj) report.value = normalizeReport(msg.obj)
  updating.value = false
}

onMounted(async () => {
  const msg = await HttpUtils.get<PoolSubReport | null>('api/poolSub')
  if (msg.success) report.value = msg.obj ? normalizeReport(msg.obj) : null
})
</script>
