---
title: vertical-align 原理及相关问题
comments: true
tags:
  - vertical-align
---

## 1. 概念

> `vertical-align` 的使用涉及到多个概念，所以在分析具体问题之前，我们有必要先了解一下 `vertical-align` 相关的属性和概念。

### 1.1 字体大小与行高

例子：设置字体大小为 `100px`：

```vue
<template>
  <div class="box">
    中文Exgp
    <span></span>
  </div>
</template>

<style lang="scss" scoped>
  .box {
    background-color: rgb(233, 233, 233);
    text-align: center;
    font-size: 100px;
  }
</style>
```

- **文字大小 `font-size` ：**

<img class="zoomable" :src="$withBase('/images/screenshot/notes/5/1/1.png')" alt="foo">

从上图可以看出，文字（text）的高度等于文字大小（font-size），即 `100px` 。

- **行高 `line-height` ：**

<img class="zoomable" :src="$withBase('/images/screenshot/notes/5/1/2.png')" alt="foo">

从上图可以看出，行高为 `114px` （ `div 的高度 = 行高 * 行数`，此处行数为 1，故行高为 `114px` ）。不设置行高的情况下，浏览器会采用 **『默认行高』** ，一般为字体大小的 `1.1` ~ `1.2` 倍左右，本例中行高 `114px` 正好处于此区间内。不同浏览器的默认行高可能会不一样。

::: tip 思考：『默认行高』为什么不等于文字大小？

『默认行高』比文字大小要稍微大一些，这样设计的原因是为了给多行文字之间 <strong style="color:green">留出行间距，避免上下行文字贴边</strong> 。

:::

### 1.2 基线

文字在设计时有几条参考线：顶线、主线（基本不会用到）、中线、基线和底线。

<img class="zoomable" :src="$withBase('/images/screenshot/notes/5/1/3.png')" alt="foo">

顶线、底线、中线很好理解：

- 顶线：文字顶端水平线；
- 底线：文字底端水平线；
- 中线：处于文字顶端与底端正中间的水平线

::: tip 什么是基线？

<strong style="color:red">基线</strong> 是指欧洲和西亚文字排版中，用于在上面放置字符的一条基准线。<strong style="color:red">它与字母 `x` 的底部对齐</strong> 。

- **英文字母整体是下降的**，比如 `g` 和 `p` ，会向下超出基线。
- **而东亚文字没有基线，字体会放置在方盒子，没有上升部分和下降部分**。

:::

### 1.3 vertical-align

::: tip

CSS 的属性 `vertical-align` 用来指定 **行内元素**（inline）、**行内块元素**（inline-block）或 **表格单元格**（table-cell）的 **垂直对齐方式**。

:::

`vertical-align` 的值有很多，最常用的是下面四个关键字：
|关键字| 描述 |
|---|---|
|**`top`**|使元素及其后代元素的顶部与整行的 **顶部对齐**。|
|**`middle`**|使元素的中部与父元素的基线加上父元素 `x` 高度的一半对齐（<strong style="color:red">中部对齐：使元素的中部与父元素 x 的中心点对齐</strong> ）。
|**`baseline`**|使元素的基线与父元素的 <strong style="color:red">基线对齐（默认值）</strong> 。|
|**`bottom`**|使元素及其后代元素的底部与整行的 **底部对齐**。|

例子：加入**行内元素 `span`**，字体大小设为 `40px`，对 `span` 设置不同的 `vertical-align` 值：

```vue
<template>
  <div class="box">
    中文Exgp
    <span>中文Exgp</span>
  </div>
</template>

<style lang="scss" scoped>
  .box {
    background-color: rgb(233, 233, 233);
    font-size: 100px;
    > span {
      font-size: 40px;
    }
  }
</style>
```

**（1）顶部对齐：**

`vertical-align: top`

<img class="zoomable" :src="$withBase('/images/screenshot/notes/5/1/4.png')" alt="foo">

**（2）中部对齐：**

`vertical-align: middle`

<img class="zoomable" :src="$withBase('/images/screenshot/notes/5/1/5.png')" alt="foo">

**（3）基线对齐：**

`vertical-align: baseline`

<img class="zoomable" :src="$withBase('/images/screenshot/notes/5/1/6.png')" alt="foo">

**（4）底部对齐：**

`vertical-align: bottom`

<img class="zoomable" :src="$withBase('/images/screenshot/notes/5/1/7.png')" alt="foo">

::: warning 注意：

`vertical-align` <strong style="color:red">不能</strong> 不能用于 <strong style="color:red">块元素</strong> ，不会生效。

:::

## 2. 问题一：图片幽灵空白

### 2.1. 背景

简单显示一张图片：

```vue
<template>
  <div class="box">
    <img src="./images/xiugou.png" alt="修勾" />
  </div>
</template>

<style lang="scss" scoped>
  .box {
    background-color: rgb(233, 233, 233);
    font-size: 100px;
  }
</style>
```

<img class="zoomable" :src="$withBase('/images/screenshot/notes/5/1/8.png')" alt="foo">

---

### 2.2. 问题

可以看出，图片下方有一片空白区域（红色框内区域），外层 `div` 由内容撑开，但是其最终高度却高于图片高度，那么这片 **“幽灵空白”** 是如何产生的呢？

---

### 2.3. 原因

其实是 **由于基线对齐导致的**，给父元素添加文字 `x` 能看的更清楚：

<img class="zoomable" :src="$withBase('/images/screenshot/notes/5/1/9.png')" alt="foo">

前面说到，`vertical-align` 的默认值是 `baseline`。与文字不同，**图片的基线是其底部。** 所以图片底部与父元素的 `x` 的底部对齐。导致了图片底部出现了空白区域。

---

### 2.4. 解决

将图片的 `vertical-align` 设为 **非 `baseline`** 即可，如设为 `middle`：

```css
img {
  vertical-align: middle;
}
```

<img class="zoomable" :src="$withBase('/images/screenshot/notes/5/1/10.png')" alt="foo">

## 3. 问题二：绝对垂直居中

### 3.1. 背景

在开发中会经常遇到这样的需求：

> 设计一个按钮，内容包含 **图标和文字**，要求图标和文字 **水平垂直居中**。

最常用的方式是：

- **水平居中**：给父元素设置 `text-align: center`。
- **垂直居中**：将父元素高度 `height` 和行高 `line-height` 设置相同值，即 `line-height` = `height`。

```vue
<template>
  <div class="box"><i class="h-icon-star"></i> Ex收藏</div>
</template>

<style lang="scss" scoped>
  .box {
    width: 400px;
    height: 100px;
    margin: 20px auto;
    line-height: 100px;
    text-align: center;
    font-size: 40px;
    border-radius: 10px;
    background-color: rgb(233, 233, 233);
    i {
      font-size: 50px;
      background-color: rgb(117, 231, 166);
    }
  }
</style>
```

这里为了更清楚的看清图标位置，给图标加上了绿色背景。效果如下：

<img class="zoomable" :src="$withBase('/images/screenshot/notes/5/1/11.png')" alt="foo">

从上图可以看出，文字是垂直居中的，但是图标没有垂直居中，**与图片一样，图标也是默认基线对齐的**（图标底部与父元素 `x` 的底部对齐）。对图标设置中部对齐：

```css
i {
  vertical-align: middle;
}
```

<img class="zoomable" :src="$withBase('/images/screenshot/notes/5/1/12.png')" alt="foo">

---

### 3.2. 问题

从上图可以看出，对图标设置 `vertical-align: middle;` 后，虽然生效了，图标 **基本** 垂直居中，但是仔细观察的话，可以发现，图标并 **没有绝对垂直居中**，而是相对偏下。为什么`vertical-align: middle;` 没有达到理想的绝对垂直居中呢？

---

### 3.3. 原因

因为，**此时图标的中部与父元素的 `x` 的中心点对齐，** 而在 1.1 节中，已经说明过，**英文字母整体是下降的，所以 `x` 的中心点并不在中线上，而是在中线下方，** 所以图标的中部并没有与父元素的中线对齐, **图标相对偏下。**

---

### 3.4. 解决

实现绝对垂直居中的方法有很多，如利用 `flex` 布局、绝对定位等。

**这里仅采用 `vertical-align` 来实现绝对垂直居中。**

---

### 3.5. 解决方案一

::: tip 方案一：微调

`vertical-align` 的值除了前面讲到的几个关键字（ `baseline` 等）外，还可以用长度来表示。

- 当长度为 `0` 时：等效于 `baseline` 。
- 当长度大于 `0` 时：元素向上偏移。
- 当长度小于 `0` 时：元素向下偏移。

通过前面的图可以看出，**基线对齐时，图标是偏上的，要想图标垂直居中，则需要向下偏移，** 所以要给 `vertical-align` 设置负值。

微调后，大概在 `-11px` 的位置（**具体长度需要根据实际情况微调**），图标垂直居中：

:::

```css
i {
  vertical-align: -11px;
}
```

<img class="zoomable" :src="$withBase('/images/screenshot/notes/5/1/13.png')" alt="foo">

---

### 3.6. 解决方案二

::: tip 方案二：重置字体大小

1. 将父元素的字体大小设为 `0` 。
2. 将父元素中的文字用行内元素 `span` 包裹起来，子元素 `span` 的字体大小设为 `40px` 。
3. 将图标和 `span` 都设为中部对齐：`vertical-align: middle;` 。

:::

```vue
<template>
  <div class="box">
    <i class="h-icon-star"></i>
    <!-- 方案二-->
    <span> Ex收藏</span>
  </div>
</template>

<style lang="scss" scoped>
  .box {
    width: 400px;
    height: 100px;
    margin: 20px auto;
    line-height: 100px;
    text-align: center;
    font-size: 0; /* 方案二 */
    border-radius: 10px;
    background-color: rgb(233, 233, 233);
    i {
      font-size: 50px;
      vertical-align: middle; /* 方案二 */
      background-color: rgb(117, 231, 166);
    }
    > span {
      font-size: 40px; /* 方案二 */
      vertical-align: middle; /* 方案二 */
    }
  }
</style>
```

::: details <strong style="color:lightseagreen">这么做的原理是什么呢？</strong>

- **第 1 步：** **将父元素的字体大小设为 `0`** 。这个时候，**父元素的顶线、中线、基线、底线和字母 `x` 的中点都处于同一条水平线**，其位置就是父元素行高的正中间位置。

- **第 2 步：** 将文字用 `span` 包裹起来是为了能单独设置字体大小，字体大于 `0` 才能显示出来。

- **第 3 步：** 图标和 `span` 都设置中部对齐，即图标和 `span` 的中部与父元素 `x` 的中点对齐，所以，图标和文字都实现了绝对垂直居中。

:::

<img class="zoomable" :src="$withBase('/images/screenshot/notes/5/1/14.png')" alt="foo">

---

### 3.7. 解决方案三

::: tip 方案三：通过伪元素改变父元素 x 中心点位置

1. 父元素不再设置行高 `line-height` 。
2. 给父元素增加伪元素 `::beforer` ，类型为行内块元素，高度等于父元素高度，并对伪元素设置中部对齐 `vertical-align: middle;` 。
3. 将图标和 `span` 都设为中部对齐：`vertical-align: middle;` 。

:::

```vue
<template>
  <div class="box">
    <!-- 为了更清楚地演示，临时给父元素加上字母 x ，颜色为橙色 -->
    x
    <i class="h-icon-star"></i>
    <!-- 方案三-->
    <span> Ex收藏</span>
  </div>
</template>

<style lang="scss" scoped>
  .box {
    width: 400px;
    height: 100px;
    margin: 20px auto;
    /* line-height: 100px; */ /* 方案三：取消父元素行高 */
    text-align: center;
    font-size: 40px;
    border-radius: 10px;
    background-color: rgb(233, 233, 233);
    /* 方案三：给父元素增加伪元素，高度等于父元素高度，设置中部对齐 */
    &::before {
      content: "";
      width: 10px;
      height: 100px;
      display: inline-block;
      vertical-align: middle;
      background-color: orange;
    }
    i {
      font-size: 50px;
      vertical-align: middle; /* 方案三 */
      background-color: rgb(117, 231, 166);
    }
    > span {
      vertical-align: middle; /* 方案三 */
    }
  }
</style>
```

::: details <strong style="color:lightseagreen">方案三是如何实现绝对垂直居中的呢？</strong>

- **第 1 步：** 取消父元素的行高，是为了让父元素在第 2 步中可以调节各个参考线的位置。

- **第 2 步：** 给父元素设置伪元素，高度等于父元素高度，此时伪元素的高度是 **大于** 父元素文本内容区高度的。而 `vertical-align` 对齐时，是采用 <strong style="color:red">“就高不就矮”</strong> 的原则，即：**伪元素（高的）不需要移动，而是通过调节父元素文本（矮的）的垂直位置来实现对齐**。由于伪元素设置的是中部对齐，所以调节之后，父元素字母 `x` 的中心点与伪元素的中部对齐了，也就是说，此时父元素字母 `x` 的中心点位于父元素垂方向上正中间位置。

- **第 3 步：** 图标和子元素 `span` 设置了中部对齐，即图标和 `span` 的中部与父元素字母 `x` 的中心点对齐，也就实现了绝对垂直居中了。

:::

<img class="zoomable" :src="$withBase('/images/screenshot/notes/5/1/15.png')" alt="foo">

备注：上面为了更清楚地演示，临时给父元素加上了字母 `x`，并将其颜色和伪元素背景色设为橙色，便于区分子元素。**实际开发中，不需要给父元素增加文本，且伪元素宽度设为 `0` 即可**，如下：

<img class="zoomable" :src="$withBase('/images/screenshot/notes/5/1/16.png')" alt="foo">

## 4. 总结

`vertical-align` 在 `CSS` 中属于比较复杂的一个属性，而官方文档对 `vertical-align` 仅仅做了简单的介绍，没有详细的举例演示，也没有将其与 `font-size`、`line-height`、`基线` 等关联性很强的属性和概念串联起来讲解。

本文梳理了与 `vertical-align` 相关的概念和原理，为了便于更好地理解，编写了对应的 `demo`，并总结了开发中遇到的一些很隐蔽的问题和解决方法，如 “图片幽灵空白”、“绝对垂直居中”，希望可以帮助开发者快速定位和解决类似问题。
