# 虚拟列表原理及实现

> 标签：前端 / 性能优化 / 长列表

## 什么是虚拟列表

虚拟列表（Virtual List / Windowing）是一种**只渲染可视区域**（及其附近缓冲区域）列表项的技术。无论数据有多少条，DOM 中实际存在的节点数始终保持在一个固定的小范围内，从而大幅提升长列表的渲染与滚动性能。

## 为什么需要虚拟列表

假设有一个 10 万条数据的列表，如果一次性全部渲染：

- 生成 10 万个 DOM 节点，首屏渲染耗时、内存占用剧增；
- 滚动时触发布局 / 重绘，帧率下降，出现卡顿。

虚拟列表通过「按需渲染」把 DOM 数量从 `O(n)` 降到 `O(可视项数)`，让 10 万条与 100 条在性能上几乎无差别。

## 核心原理

### 基本思路

1. 用一个**外层容器**撑出整份列表的真实总高度（制造滚动条）；
2. 监听滚动，得到 `scrollTop`；
3. 根据 `scrollTop` 计算当前**可视区对应的索引区间**；
4. 只渲染该区间内的数据，并用 `transform: translateY()` 把它们**平移到正确位置**。

### 三个核心变量

| 变量 | 含义 |
| --- | --- |
| `containerHeight` | 可视区域的高度（外层容器的高度） |
| `itemHeight` | 每项的高度（固定高度场景） |
| `scrollTop` | 当前滚动距离 |

由此可推出：

- 起始索引 `startIndex = floor(scrollTop / itemHeight)`
- 可视项数 `visibleCount = ceil(containerHeight / itemHeight)`
- 结束索引 `endIndex = startIndex + visibleCount`

```
┌────────────────────────┐  ← 外层容器（overflow: auto，高度 = containerHeight）
│  ⬆ 上方不可见区域        │
│  ┌──────────────────┐  │
│  │  startIndex 项    │  │  ← 通过 translateY 定位
│  │  ...可视项...      │  │
│  │  endIndex 项      │  │
│  └──────────────────┘  │
│  ⬇ 下方不可见区域        │
└────────────────────────┘
        总高度 = n * itemHeight（由内层占位元素撑起）
```

## 固定高度的实现

固定高度是最简单、最常见的场景。下面是一个 React + TypeScript 的最小实现：

```tsx
import { useState } from 'react'

interface VirtualListProps {
  list: string[]
  itemHeight: number      // 每项固定高度
  containerHeight: number // 可视区高度
  buffer?: number         // 上下缓冲项数，默认 5
}

export default function VirtualList({
  list,
  itemHeight,
  containerHeight,
  buffer = 5,
}: VirtualListProps) {
  const [scrollTop, setScrollTop] = useState(0)

  // 真实总高度，用来撑出滚动条
  const totalHeight = list.length * itemHeight

  // 可视区能容纳的项数
  const visibleCount = Math.ceil(containerHeight / itemHeight)

  // 起始 / 结束索引（加入 buffer 避免滚动时白屏）
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer)
  const endIndex = Math.min(list.length, startIndex + visibleCount + buffer * 2)

  // 只渲染切片数据
  const visibleList = list.slice(startIndex, endIndex)

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  return (
    <div
      onScroll={onScroll}
      style={{ height: containerHeight, overflowY: 'auto', position: 'relative' }}
    >
      {/* 内层占位元素：撑起总高度，制造滚动条 */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* 将可见项整体平移到正确位置 */}
        <div style={{ transform: `translateY(${startIndex * itemHeight}px)` }}>
          {visibleList.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight, boxSizing: 'border-box' }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

要点：

- 内层占位元素的高度必须是 `list.length * itemHeight`，否则滚动条会缺失或长度不对；
- `key` 使用真实的全局索引 `startIndex + index`，保证元素复用与状态正确；
- 使用 `transform` 而非 `margin-top` / `top` 定位，避免触发额外布局。

## 动态高度的实现

当每一项高度不固定（富文本、图片懒加载、自适应卡片等）时，`itemHeight` 不再是常量，也就无法用 `scrollTop / itemHeight` 直接求索引。解决思路是「**预估 + 实测 + 二分查找**」：

1. 先给所有项一个**预估高度** `estimatedHeight`，用它初始化高度缓存；
2. 项渲染后用 `ResizeObserver` 测量**真实高度**，回写到缓存；
3. 由缓存维护**前缀和数组** `offsets`（`offsets[i]` = 前 i 项的累计高度）；
4. 用**二分查找**根据 `scrollTop` 定位起始索引、根据 `scrollTop + containerHeight` 定位结束索引。

### 1. 核心数据结构与工具函数

动态高度相比固定高度，多维护了「高度缓存」和「前缀和」两层数据：

```ts
// 高度缓存：index -> 真实高度，初始全部填预估值
const heights = new Array(list.length).fill(estimatedHeight)

// 前缀和：offsets[i] = 前 i 项累计高度，offsets[0] = 0，offsets[n] = 总高度
// 例：heights = [50, 80, 60]，则 offsets = [0, 50, 130, 190]
function buildOffsets() {
  const offsets = new Array(list.length + 1)
  offsets[0] = 0
  for (let i = 0; i < list.length; i++) {
    offsets[i + 1] = offsets[i] + heights[i]
  }
  return offsets
}

// 二分查找：最后一个「offsets[mid] <= top」的索引，即 scrollTop 所在的项
function findStartIndex(offsets: number[], top: number) {
  let low = 0
  let high = offsets.length - 2 // 有效索引上限是 n - 1
  while (low <= high) {
    const mid = (low + high) >> 1
    if (offsets[mid] <= top) low = mid + 1
    else high = mid - 1
  }
  return Math.max(0, low - 1)
}

// 二分查找：第一个「offsets[mid] >= bottom」的索引，即可视区底边所在的项
function findEndIndex(offsets: number[], bottom: number) {
  let low = 0
  let high = offsets.length - 2
  while (low <= high) {
    const mid = (low + high) >> 1
    if (offsets[mid] < bottom) low = mid + 1
    else high = mid - 1
  }
  return Math.min(offsets.length - 1, low)
}
```

> `offsets` 是「单调递增」数组，满足二分查找的前提；这也是为什么每项真实高度一旦变化，就要重新构建一次 `offsets`。

### 2. 完整 React 实现

下面把「测量 → 缓存 → 前缀和 → 二分查找 → 定位渲染」串成一个可运行的组件：

```tsx
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface VirtualListProps {
  list: string[]
  containerHeight: number
  estimatedItemHeight?: number
  buffer?: number
}

export default function DynamicVirtualList({
  list,
  containerHeight,
  estimatedItemHeight = 60,
  buffer = 5,
}: VirtualListProps) {
  const [scrollTop, setScrollTop] = useState(0)
  // 高度缓存变化时 +1，用来触发 offsets 重新计算
  const [version, setVersion] = useState(0)

  // 高度缓存：index -> 真实高度，初始用预估值填充
  const heightsRef = useRef<number[]>(
    new Array(list.length).fill(estimatedItemHeight)
  )

  // 前缀和：offsets[i] = 前 i 项累计高度
  const offsets = useMemo(() => {
    const arr = new Array(list.length + 1)
    arr[0] = 0
    for (let i = 0; i < list.length; i++) {
      arr[i + 1] = arr[i] + heightsRef.current[i]
    }
    return arr
  }, [list.length, version])

  // 总高度 = 所有项累计高度，用来撑出滚动条
  const totalHeight = offsets[list.length]

  // 二分查找：scrollTop 所在的项（最后一个 offsets[mid] <= scrollTop）
  const findStartIndex = (top: number) => {
    let low = 0
    let high = list.length - 1
    while (low <= high) {
      const mid = (low + high) >> 1
      if (offsets[mid] <= top) low = mid + 1
      else high = mid - 1
    }
    return Math.max(0, low - 1)
  }

  // 二分查找：可视区底边所在的项（第一个 offsets[mid] >= bottom）
  const findEndIndex = (bottom: number) => {
    let low = 0
    let high = list.length - 1
    while (low <= high) {
      const mid = (low + high) >> 1
      if (offsets[mid] < bottom) low = mid + 1
      else high = mid - 1
    }
    return Math.min(list.length, low)
  }

  // 加上 buffer，避免快速滚动时白屏
  const startIndex = Math.max(0, findStartIndex(scrollTop) - buffer)
  const endIndex = Math.min(
    list.length,
    findEndIndex(scrollTop + containerHeight) + buffer
  )

  // 可见项整体向下偏移 startIndex 项之前的累计高度
  const translateY = offsets[startIndex]
  const visibleList = list.slice(startIndex, endIndex)

  // 测量回调：真实高度与缓存不一致时更新并触发重算
  const updateHeight = useCallback((index: number, height: number) => {
    if (Math.abs(heightsRef.current[index] - height) > 0.5) {
      heightsRef.current[index] = height
      setVersion((v) => v + 1)
    }
  }, [])

  return (
    <div
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      style={{ height: containerHeight, overflowY: 'auto', position: 'relative' }}
    >
      {/* 占位元素：用总高度撑出滚动条 */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* 将可见项整体平移到正确位置 */}
        <div style={{ transform: `translateY(${translateY}px)` }}>
          {visibleList.map((item, i) => {
            const index = startIndex + i
            return (
              <Item key={index} index={index} onHeightChange={updateHeight}>
                {item}
              </Item>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// 单个列表项：负责用 ResizeObserver 上报自己的真实高度
function Item({
  index,
  children,
  onHeightChange,
}: {
  index: number
  children: ReactNode
  onHeightChange: (index: number, height: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    // 监听尺寸变化（图片加载、文字换行都会触发）
    const observer = new ResizeObserver((entries) => {
      const height = entries[0].contentRect.height
      onHeightChange(index, height)
    })
    observer.observe(el)

    return () => observer.disconnect()
  }, [index, onHeightChange])

  return (
    <div ref={ref} style={{ boxSizing: 'border-box' }}>
      {children}
    </div>
  )
}
```

### 3. 滚动时的完整流程

以一次向下滚动为例：

1. 用户滚动 → `onScroll` 更新 `scrollTop`；
2. `findStartIndex(scrollTop)` / `findEndIndex(scrollTop + containerHeight)` 二分定位到新的索引区间；
3. 组件只重渲染 `startIndex ~ endIndex` 之间的项；
4. 新渲染的项触发 `ResizeObserver`，把真实高度写回 `heightsRef`；
5. 高度发生变化时 `version + 1`，`offsets` 重新构建，`totalHeight` 与 `translateY` 随之更新；
6. 后续滚动始终基于「越来越准确」的高度缓存，滚动位置越来越稳。

### 4. 易踩的坑

- **预估高度偏差过大**：会导致滚动条跳动、定位不准。预估越接近真实值越稳，可用历史平均值作为初始预估。
- **频繁重算 `offsets`**：每项高度变化都触发一次 O(n) 的前缀和重建。数据量极大时，可考虑增量更新或分块计算。
- **测量触发回流**：`ResizeObserver` 回调里不要再同步读取大量布局属性，避免 layout thrash。
- **`key` 必须用全局索引**：否则 React 复用错元素，高度缓存会对错位置。

## 关键细节与优化

1. **缓冲区（buffer）**：在可视区上下各多渲染几项，避免快速滚动时出现短暂白屏。
2. **滚动节流**：用 `requestAnimationFrame` 包裹 `onScroll`，只在浏览器下一帧更新，避免高频 `setState`。
3. **高度缓存**：动态高度场景中，已测量项的高度要缓存下来，滚动回来时直接复用，不要重复测量。
4. **惰性测量**：只为「渲染过的项」更新真实高度，未渲染项继续用预估值，减少测量开销。
5. **`contain` / `will-change`**：可配合 CSS 提示浏览器做合成层优化，减少重绘。

## 现成方案

生产环境通常直接使用成熟库，不必手写：

- `react-window` / `react-virtualized`（React）
- `@tanstack/react-virtual`（React，支持动态高度，底层 Headless）
- `VueUse` 的 `useVirtualList`（Vue）
- `vxe-table`、`element-plus` 的 `el-table-v2` 等（表格场景内置虚拟滚动）

## 总结

- 虚拟列表的核心思想：**只渲染看得见的项，用占位元素撑出总高度 + translateY 定位**。
- 固定高度：`startIndex = scrollTop / itemHeight`，实现简单；
- 动态高度：预估高度 + 实测缓存 + 前缀和 + 二分查找；
- 工程上优先用成熟库，但理解原理有助于排查白屏、抖动、定位不准等问题。
