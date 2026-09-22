1. v-model 修饰符
   .trim
   .number
   .lazy
   ```js
   <!-- 把input时出发改为change时触发，减少触发频率 -->
   <input v-model.lazy="msg">
   ```
2. defineModel
   1. defineModel() 会自动帮子组件声明：

   2. prop：modelValue

   事件：update:modelValue
   返回可读写的ref

   改 defineModel 的 ref —— 合法

3. 自定义修饰符
   修饰符由vue自动传递，但具体处理要在子组件中自己实现
   使用

```js
<MyComponent v-model.capitalize="myText" />


<script setup>
const [model, modifiers] = defineModel({
   set(value) {
    if (modifiers.capitalize) {
      return value.charAt(0).toUpperCase() + value.slice(1)
    }
    return value
  }
})

</script>

<template>
<input type="text" v-model="model" />
</template>
```

4. 带参数的v-model修饰符

5. Vue 3 中 <Child v-model="value" /> 默认展开成什么？子组件如何实现这个 v-model？
6. 多个 v-model 怎么写？
   指定参数

   ```js
   v-model:title="title"
   ```
