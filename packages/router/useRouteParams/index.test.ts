import { effectScope, nextTick, ref } from 'vue-demi'
import { describe, expect, it } from 'vitest'
import type { Ref } from 'vue-demi'
import { useRouteParams } from '.'

describe('useRouteParams', () => {
  const getRoute = (params: Record<string, any> = {}) => ({
    params,
    query: {},
    fullPath: '',
    hash: '',
    matched: [],
    meta: {},
    name: '',
    path: '',
    redirectedFrom: undefined,
  })

  it('should export', () => {
    expect(useRouteParams).toBeDefined()
  })

  it('should return current value', () => {
    const router = {} as any
    const route = getRoute({
      id: '1',
    })

    const id = useRouteParams('id', null, { route, router })

    expect(id.value).toBe('1')
  })

  it('should return transformed value', () => {
    const route = getRoute()
    const router = {} as any

    const id = useRouteParams('id', '1', { transform: Number, route, router })

    expect(id.value).toBe(1)
  })

  it('should re-evaluate the value immediately', () => {
    let route = getRoute()
    const router = { replace: (r: any) => route = r } as any

    const slug: Ref<any> = useRouteParams('slug', 'foo', { route, router })
    const id: Ref<any> = useRouteParams('id', '123', { route, router })
    const page: Ref<any> = useRouteParams('page', null, { route, router })

    slug.value = 'bar'
    id.value = '456'
    page.value = '2'

    expect(slug.value).toBe('bar')
    expect(id.value).toBe('456')
    expect(page.value).toBe('2')
  })

  it('should update the route', async () => {
    let route = getRoute()
    const router = { replace: (r: any) => route = r } as any

    const code: Ref<any> = useRouteParams('code', null, { route, router })
    const page: Ref<any> = useRouteParams('page', null, { route, router })
    const lang: Ref<any> = useRouteParams('lang', null, { route, router })

    code.value = 'bar'
    page.value = '1'
    lang.value = 'en'

    await nextTick()

    expect(code.value).toBe('bar')
    expect(route.params.code).toBe('bar')
    expect(page.value).toBe('1')
    expect(route.params.page).toBe('1')
    expect(lang.value).toBe('en')
    expect(route.params.lang).toBe('en')
  })

  it('should return default value', () => {
    let route = getRoute()
    const router = { replace: (r: any) => route = r } as any

    const page: Ref<any> = useRouteParams('page', 10, { route, router })
    const lang: Ref<any> = useRouteParams('lang', 'pt-BR', { route, router })

    expect(page.value).toBe(10)
    expect(lang.value).toBe('pt-BR')
  })

  it('should reset state on scope dispose', async () => {
    let route = getRoute()
    const router = { replace: (r: any) => route = r } as any
    const scopeA = effectScope()
    const scopeB = effectScope()

    let page: Ref<any> = ref(null)
    let lang: Ref<any> = ref(null)
    let code: Ref<any> = ref(null)
    let slug: Ref<any> = ref(null)

    await scopeA.run(async () => {
      page = useRouteParams('page', null, { route, router })
      lang = useRouteParams('lang', null, { route, router })

      page.value = 2
      lang.value = 'pt-BR'

      await nextTick()
    })

    expect(page.value).toBe(2)
    expect(lang.value).toBe('pt-BR')
    expect(route.params.page).toBe(2)
    expect(route.params.lang).toBe('pt-BR')

    await scopeB.run(async () => {
      code = useRouteParams('code', null, { route, router })
      slug = useRouteParams('slug', null, { route, router })

      code.value = 'xyz'
      slug.value = 'vueuse'

      await nextTick()
    })

    expect(code.value).toBe('xyz')
    expect(slug.value).toBe('vueuse')
    expect(route.params.code).toBe('xyz')
    expect(route.params.slug).toBe('vueuse')

    scopeB.stop()

    expect(page.value).toBe(2)
    expect(lang.value).toBe('pt-BR')
    expect(code.value).toBeNull()
    expect(slug.value).toBeNull()

    scopeA.stop()

    expect(page.value).toBeNull()
    expect(lang.value).toBeNull()
  })
})