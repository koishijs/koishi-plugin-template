import { Awaitable, Context, Dict, Fragment, h, Schema, Service, valueMap } from 'koishi'

declare module 'koishi' {
  interface Context {
    template: Template
  }

  interface Session {
    layout: string
    slots: Dict<Fragment | Slot>
  }
}

export type Slot = () => Awaitable<Fragment>

export interface Layout extends Layout.Options {
  render: Layout.Render
}

export namespace Layout {
  export type Render = (slots: Dict<Slot>) => Awaitable<Fragment>

  export interface Options {}
}

class Template extends Service {
  static filter = false

  private layouts: Dict<Layout> = Object.create(null)

  constructor(ctx: Context, config: Template.Config) {
    super(ctx, 'template')

    ctx.any().on('message', (session) => {
      session.layout = 'default'
      session.slots = {}
    })

    ctx.any().before('send', async (session, options) => {
      const layout = this.layouts[options.session?.layout]
      if (!layout) return
      const oldElements = session.elements
      session.elements = h.normalize(await layout.render({
        ...valueMap(options.session.slots, (slot) => {
          return typeof slot === 'function' ? slot : () => slot
        }),
        default: () => oldElements,
      }))
    })
  }

  define(name: string, render: Layout.Render, options?: Layout.Options) {
    this.layouts[name] = { ...options, render }
  }
}

namespace Template {
  export interface Config {}

  export const Config: Schema<Config> = Schema.object({})
}

export default Template
