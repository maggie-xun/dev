## props声明

1. 数组
2. 对象形式
3. ts 类型标注

```js
<script setup lang="ts">
defineProps<{
  title?: string
  likes?: number
}>()
</script>
```

## 响应式props解构

1. 解构出来依然保持响应式
   安全解构 props.title、toRefs(props)、computed(() => props.title)
2. 监听props的变化
   将解构的props当作为参数传递给函数时，使用getter方式
3. 传递props的细节
   1. 名字 camelCase；作为属性传递时，使用kebab-case
   2. 如果传递的是一个表达式，需要使用v-bind动态传递

4. 合并绑定的合并行为
   常规属性以最后一个为主
   事件会全部调用
5. 单向数据流
   直接修改会警告
   避免直接更改数组、对象的类型的props
6. Prop 校验
   required
   default
   validator
   Boolean类型转换
   1. <Child disabled /> 等价 :disabled="true"
   2. 未传布尔值且没有默认值，等价为false
7. 默认值
   基础数据类型直接给
   引用类型使用工厂函数，避免多个实例共享同一个引用
   withDefaults和类型声明配合
   ```js
   withDefaults(defineProps<{
   list?: string[]
   user?: { name: string }
   }>(), {
   list: () => [],
   user: () => ({ name: '' })
   })
   ```
8. 类型声明
   运行时声明 对象或数组，方便自定义校验函数
   类型声明，既通过泛型参数，ts友好，根据类型参数推导出等价的运行时选项

   [你是一个面试官，面试范围是vue3 props,出10道面试题，和日常开发紧密结合的](https://chat.deepseek.com/share/neu8pnjjouj3a0ke7u)
