1. 默认内容
2. 具名插槽

   ```js
   <slot name='header'></slot>
   ```

   使用

   ```js
   <BaseLayout>
      <template v-slot:header>
          <!-- header 插槽的内容放这里 -->
      </template>
   </BaseLayout>
   ```

3. 条件插槽
   根据内容是否被传入了插槽来决定是否渲染相应插槽

   ```js
   <div v-if='$slots.header class='card-header'>
     <slot name='header' />
   </div>
   ```

4. 动态插槽

   ```js
   <base-layout>
     <template v-slot:[dynamicSlotName]>
       ...
     </template>

     <!-- 缩写为 -->
     <template #[dynamicSlotName]>
       ...
     </template>
   </base-layout>
   ```

5. 作用域插槽
   父组件通过v-slot接受插槽props
   子组件在渲染时传递props

```js
// 单个插槽的情况
//父
<MyButton v-slot="receivedProps">
  {{receivedProps.text}}{{receivedProps.count}}
</MyButton>
//子
<button >
    <slot text="hello" :count="1">
  </slot>
</button>
```

```js
// 具名插槽
//父
<MyButton >
  <template v-slot:header='receivedProps'>
        {{receivedProps.text}}{{receivedProps.count}}
  </template>
  //简写
  <template #header>
    {{receivedProps.text}}{{receivedProps.count}}
  </template>
</MyButton>

//子
<button>
  <slot name="header" message="hello"></slot>
</button>
```

原理：子组件将v-slot的值作为参数传递给插槽

```js
ChildComponent({
  default: (receivedProps) => {
    return `${receivedProps.text}${receivedProps.count}`
  }
})
function ChildComponent(slots) {
  return $slots.default({ text: slots.text, count: slots.count })
}
```

6. 什么场景用作用域插槽
   1. 表单组件
   2. table组件
   3. [高级表单](https://cn.vuejs.org/guide/components/slots.html#fancy-list-example)
