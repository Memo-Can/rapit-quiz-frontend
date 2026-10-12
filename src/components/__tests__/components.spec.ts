import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import ChoiceButton from '../ChoiceButton.vue'
import CountdownBar from '../CountdownBar.vue'
import LeaderboardList from '../LeaderboardList.vue'

describe('ChoiceButton', () => {
  it('tıklanınca pick yayar, kilitliyken yaymaz', async () => {
    const w = mount(ChoiceButton, {
      props: { index: 0, text: 'A', state: 'idle', disabled: false },
    })
    await w.trigger('click')
    expect(w.emitted('pick')).toHaveLength(1)
    await w.setProps({ disabled: true })
    await w.trigger('click')
    expect(w.emitted('pick')).toHaveLength(1)
  })

  it('doğru/yanlış durumunda renge ek olarak ikon ve ekran okuyucu metni gösterir', () => {
    const ok = mount(ChoiceButton, {
      props: { index: 1, text: 'B', state: 'correct', disabled: true },
    })
    expect(ok.text()).toContain('✓')
    expect(ok.text()).toContain('Doğru cevap')
    const bad = mount(ChoiceButton, {
      props: { index: 2, text: 'C', state: 'wrong', disabled: true },
    })
    expect(bad.text()).toContain('✕')
    expect(bad.text()).toContain('Yanlış cevap')
  })
})

describe('CountdownBar', () => {
  const level = (fraction: number, remainingMs: number) =>
    mount(CountdownBar, { props: { fraction, remainingMs } }).classes()

  it('süre azaldıkça yeşil → sarı → kırmızı olur', () => {
    expect(level(0.9, 4500)).toContain('countdown--ok')
    expect(level(0.4, 2000)).toContain('countdown--warn')
    expect(level(0.2, 1000)).toContain('countdown--danger')
  })

  it('yalnızca son 2 saniyede titreşir', () => {
    expect(level(0.5, 2500)).not.toContain('countdown--urgent')
    expect(level(0.3, 1800)).toContain('countdown--urgent')
    expect(level(0, 0)).not.toContain('countdown--urgent')
  })
})

describe('LeaderboardList', () => {
  const entries = [1, 2, 3, 4].map((rank) => ({
    rank,
    entry_id: rank * 10,
    player_name: `Oyuncu${rank}`,
    score: 3000 - rank * 100,
    correct_count: 20,
    total_time_ms: 42500,
  }))

  it('ilk üçe madalya verir, kullanıcının satırını vurgular', () => {
    const w = mount(LeaderboardList, { props: { entries, highlightId: 20 } })
    const rows = w.findAll('li')
    expect(rows[0]!.text()).toContain('🥇')
    expect(rows[1]!.text()).toContain('🥈')
    expect(rows[2]!.text()).toContain('🥉')
    expect(rows[3]!.text()).not.toMatch(/[🥇🥈🥉]/u)
    expect(rows[1]!.classes()).toContain('row--me')
    expect(rows[1]!.text()).toContain('Sen')
    expect(rows[0]!.classes()).not.toContain('row--me')
  })
})
