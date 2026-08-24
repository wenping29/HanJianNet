import { useMemo, useState } from 'react'
import type { AdminMenuItem } from '../types'

export interface MenuPickerProps {
  menus: AdminMenuItem[]
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
  disabledKeys?: string[]
}

interface Node {
  id: string
  key: string
  label: string
  parent?: string | null
  children: Node[]
}

function buildTree(items: AdminMenuItem[]): { roots: Node[]; byKey: Map<string, Node> } {
  const byKey = new Map<string, Node>()
  items.forEach((m) =>
    byKey.set(m.key, { id: m.id, key: m.key, label: m.label, parent: m.parent, children: [] }),
  )
  const roots: Node[] = []
  items.forEach((m) => {
    const node = byKey.get(m.key)!
    if (m.parent && byKey.has(m.parent)) {
      byKey.get(m.parent)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  const sortRec = (arr: Node[]) => {
    arr.sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))
    arr.forEach((n) => sortRec(n.children))
  }
  sortRec(roots)
  return { roots, byKey }
}

function descendantsKeys(node: Node): string[] {
  const out: string[] = []
  const walk = (n: Node) => {
    out.push(n.key)
    n.children.forEach(walk)
  }
  walk(node)
  return out
}

type CheckState = 'on' | 'off' | 'half'
function computeState(node: Node, valueSet: Set<string>): CheckState {
  const sub = descendantsKeys(node)
  const on = sub.filter((k) => valueSet.has(k)).length
  if (on === 0) return 'off'
  if (on === sub.length) return 'on'
  return 'half'
}

export default function MenuPicker({ menus, value, onChange, disabled, disabledKeys = [] }: MenuPickerProps) {
  const [keyword, setKeyword] = useState('')
  const { roots, byKey } = useMemo(() => buildTree(menus), [menus])
  const disabledSet = useMemo(() => new Set(disabledKeys), [disabledKeys])
  const valueSet = useMemo(() => new Set(value), [value])

  const allKeys = useMemo(() => Array.from(byKey.keys()), [byKey])
  const writableKeys = useMemo(() => allKeys.filter((k) => !disabledSet.has(k)), [allKeys, disabledSet])
  const writableCheckedCount = writableKeys.filter((k) => valueSet.has(k)).length

  const setNode = (nodeKey: string, checked: boolean) => {
    if (disabled || disabledSet.has(nodeKey)) return
    const node = byKey.get(nodeKey)
    if (!node) return
    const next = new Set(valueSet)
    // 1) 子树全部跟随
    descendantsKeys(node).forEach((k) => {
      if (disabledSet.has(k)) return
      if (checked) next.add(k)
      else next.delete(k)
    })
    // 2) 向上追溯所有祖先，重新计算
    const pushUp = (childKey: string | null | undefined) => {
      if (!childKey) return
      const c = byKey.get(childKey)
      if (!c || !c.parent) return
      const p = byKey.get(c.parent)
      if (!p) return
      const sibsOn = p.children.every((s) => {
        const sState = computeState(s, next)
        return sState === 'on' || disabledSet.has(s.key)
      })
      if (!disabledSet.has(p.key)) {
        if (sibsOn) next.add(p.key)
        else next.delete(p.key)
      }
      pushUp(p.key)
    }
    pushUp(node.key)
    onChange([...next].filter((k) => byKey.has(k)))
  }

  const toggleSubtree = (nodeKey: string) => {
    if (disabled || disabledSet.has(nodeKey)) return
    const node = byKey.get(nodeKey)
    if (!node) return
    const state = computeState(node, valueSet)
    setNode(nodeKey, state !== 'on')
  }

  const selectAll = () => {
    if (disabled) return
    const next = new Set(valueSet)
    writableKeys.forEach((k) => next.add(k))
    onChange([...next].filter((k) => byKey.has(k)))
  }

  const clearAll = () => {
    if (disabled) return
    const next = new Set<string>()
    disabledKeys.forEach((k) => {
      if (valueSet.has(k)) next.add(k)
    })
    onChange([...next])
  }

  const kw = keyword.trim().toLowerCase()
  const filterTree = (arr: Node[]): Node[] => {
    if (!kw) return arr
    return arr
      .map((n) => {
        const kids = filterTree(n.children)
        const selfHit = n.label.toLowerCase().includes(kw) || n.key.toLowerCase().includes(kw)
        if (selfHit || kids.length) return { ...n, children: kids }
        return null
      })
      .filter(Boolean) as Node[]
  }
  const displayTree = filterTree(roots)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          className="input max-w-xs"
          placeholder="搜索菜单名称或 Key…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          disabled={disabled}
        />
        <div className="flex flex-wrap items-center gap-2 text-xs tracking-wider text-paperdim/80">
          <span>
            已选 <b className="text-bronzelight">{writableCheckedCount}</b> / {writableKeys.length}
          </span>
          <button
            type="button"
            className="btn-bamboo !px-3 !py-1 text-xs"
            onClick={selectAll}
            disabled={disabled || writableKeys.length === 0}
          >
            全选
          </button>
          <button
            type="button"
            className="btn-ghost !px-3 !py-1 text-xs"
            onClick={clearAll}
            disabled={disabled || writableKeys.length === 0}
          >
            清空
          </button>
        </div>
      </div>

      <div className="rounded-sm border border-paperedge/15 bg-ink/40 p-3">
        {displayTree.length === 0 ? (
          <p className="py-12 text-center text-sm tracking-wider text-paperdim/60">没有匹配的菜单</p>
        ) : (
          <ul className="space-y-0.5">
            {displayTree.map((n) => (
              <TreeNode
                key={n.id}
                node={n}
                depth={0}
                valueSet={valueSet}
                disabled={disabled}
                disabledSet={disabledSet}
                onToggleSubtree={toggleSubtree}
                setNode={setNode}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

interface TreeNodeProps {
  node: Node
  depth: number
  valueSet: Set<string>
  disabled?: boolean
  disabledSet: Set<string>
  onToggleSubtree: (key: string) => void
  setNode: (key: string, checked: boolean) => void
}

function TreeNode({ node, depth, valueSet, disabled, disabledSet, onToggleSubtree, setNode }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0
  const state = computeState(node, valueSet)
  const isDisabled = disabled || disabledSet.has(node.key)

  return (
    <li>
      <div
        className="group flex items-center gap-2 rounded-sm px-2 py-1.5 transition hover:bg-paperedge/8"
        style={{ paddingLeft: 8 + depth * 22 }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="w-5 text-xs text-paperdim/60 transition group-hover:text-paperdim"
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? '折叠' : '展开'}
          >
            {expanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="inline-block w-5" />
        )}
        <label className="flex flex-1 cursor-pointer items-center gap-2 select-none">
          <IndeterminateCheckbox
            checked={state === 'on'}
            indeterminate={state === 'half'}
            disabled={isDisabled}
            onChange={() => {
              // 有子节点 = 以"子树整体翻转"语义
              if (hasChildren) onToggleSubtree(node.key)
              else setNode(node.key, state !== 'on')
            }}
          />
          <span className={isDisabled ? 'text-paperdim/50' : 'text-paper'}>{node.label}</span>
          <span className="ml-1 font-garamond text-[10px] uppercase tracking-wider text-paperdim/45">
            {node.key}
          </span>
          {disabledSet.has(node.key) && (
            <span className="ml-2 rounded-sm bg-paperedge/15 px-1.5 py-0.5 text-[10px] tracking-wider text-paperdim/60">
              固定
            </span>
          )}
        </label>
      </div>
      {hasChildren && expanded && (
        <ul className="mt-0.5 space-y-0.5">
          {node.children.map((c) => (
            <TreeNode
              key={c.id}
              node={c}
              depth={depth + 1}
              valueSet={valueSet}
              disabled={disabled}
              disabledSet={disabledSet}
              onToggleSubtree={onToggleSubtree}
              setNode={setNode}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

interface ICProps {
  checked: boolean
  indeterminate?: boolean
  disabled?: boolean
  onChange: () => void
}
function IndeterminateCheckbox({ checked, indeterminate, disabled, onChange }: ICProps) {
  return (
    <input
      ref={(el) => {
        if (el) el.indeterminate = !!indeterminate
      }}
      type="checkbox"
      className="accent-cinnabar"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
    />
  )
}
