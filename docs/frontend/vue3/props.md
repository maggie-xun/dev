## props声明

1. 数组
2. 对象形式
   3.ts 类型标注

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
2. 将解构的props当作为参数传递给函数时，使用getter方式
3. 传递props的细节
   1. 名字 camelCase；作为属性传递时，使用kebab-case
   2. 如果传递的是一个表达式，需要使用v-bind动态传递

4. 合并绑定的合并行为
   常规属性以最后一个为主
   事件会全部调用
5. 单向数据流
   避免直接更改数组、对象的类型的props
6. Prop 校验
7. Boolean类型转换
