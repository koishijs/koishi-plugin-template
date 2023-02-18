import { Awaitable, Context, Dict, Fragment, h, Schema, Service, valueMap } from 'koishi'

declare module 'koishi' {
  interface Context {
    template: Template
  }

  interface Session {
    layout?: string
    slots?: Dict<Fragment | Slot>
  }
}

export type Slot = () => Awaitable<Fragment>
export type Layout = (slots: Dict<Slot>) => Awaitable<Fragment>

class Template extends Service {
  static filter = false

  private layouts: Dict<Layout> = Object.create(null)

  constructor(ctx: Context, config: Template.Config) {
    super(ctx, 'template')

    ctx.any().on('message', (session) => {
      session.slots = {}
    })

    ctx.any().before('send', async (session, options) => {
      if (!options.session?.layout) return
      const { layout, slots } = options.session
      const oldElements = session.elements
      session.elements = h.normalize(await this.render(layout, {
        ...slots,
        default: oldElements,
      }))
    })
  }

  define(name: string, render: (slots: Dict<Slot>) => Awaitable<Fragment>) {
    this.layouts[name] = render
  }

  render(name: string, slots: Dict<Fragment | Slot>) {
    return this.layouts[name](valueMap(slots, (slot) => {
      return typeof slot === 'function' ? slot : () => slot
    }))
  }
}

namespace Template {
  export interface Config {}

  export const Config: Schema<Config> = Schema.object({})
}

export default Template
