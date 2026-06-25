---
title: 类别特征如何处理：Label Encoding 与 One-Hot Encoding
description: Label Encoding 和 One-Hot Encoding 都能把类别变成数字，但它们表达的含义完全不同。
cover: /images/covers/label-encoding-vs-one-hot-video.jpg
coverAlt: 类别字段分别经过标签编码和独热编码转换成数字特征的对比图。
pubDate: 2026-06-25T09:20:00+08:00
tags: [机器学习, 特征工程, 类别编码, Pandas]
---

很多机器学习数据里都会有类别字段，比如城市、性别、职业、会员等级、商品类型。

这些字段对预测很有用，但模型不能直接读取“北京”“黄金会员”“电子产品”这些文字。我们必须先把类别转换成数字，这一步叫类别编码。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/label-encoding-vs-one-hot-video.jpg" aria-label="第 25 课：类别特征如何处理">
    <source src="/videos/lesson-25-label-encoding-vs-one-hot.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 25 课视频 · Label Encoding 与 One-Hot Encoding（约 1 分 48 秒）</figcaption>
</figure>

## 先看最常见的两种编码

第一种是 Label Encoding，也叫标签编码。

它会给每个类别分配一个数字：

```text
普通会员 -> 0
白银会员 -> 1
黄金会员 -> 2
```

第二种是 One-Hot Encoding，也叫独热编码。

它会把一个类别字段拆成多列：

```text
city=北京 -> city_北京=1, city_上海=0, city_深圳=0
city=上海 -> city_北京=0, city_上海=1, city_深圳=0
```

两种方法都把文字变成了数字，但它们传递给模型的含义不一样。

## Label Encoding 适合什么情况

Label Encoding 适合有明确顺序的类别。

比如：

```text
低 -> 0
中 -> 1
高 -> 2
```

或者：

```text
差 -> 0
一般 -> 1
好 -> 2
优秀 -> 3
```

这些类别本身有大小关系，用数字表达是合理的。

代码可以这样写：

```python
from sklearn.preprocessing import OrdinalEncoder

encoder = OrdinalEncoder(categories=[["普通会员", "白银会员", "黄金会员"]])
df["member_level_code"] = encoder.fit_transform(df[["member_level"]])
```

这里要注意，类别顺序最好由你自己指定，不要完全交给工具按字母或出现顺序自动决定。

## One-Hot Encoding 适合什么情况

One-Hot Encoding 更适合没有大小顺序的类别。

比如城市：

```text
北京、上海、深圳
```

这些城市没有谁天然比谁“大”。如果你把它们编码成：

```text
北京=0，上海=1，深圳=2
```

某些模型可能会误以为深圳比北京“更大”，这就是错误的信息。

用独热编码更合适：

```python
import pandas as pd

df = pd.get_dummies(df, columns=["city"], drop_first=False)
```

这样每个城市都变成一列，只表示这个样本是不是属于这个城市。

## 什么时候不能盲目 One-Hot

One-Hot Encoding 虽然直观，但类别很多时会让特征列数暴涨。

比如一个商品 ID 有 10 万个取值，如果全部独热编码，表格会一下多出 10 万列。这样不仅训练慢，还可能让模型更难泛化。

遇到高基数类别时，可以考虑：

- 合并低频类别；
- 只保留 Top N 类别；
- 用目标编码；
- 用 Embedding；
- 或者根据业务重新构造更有意义的类别。

初学阶段先记住：类别少、无顺序，可以 One-Hot；类别有顺序，可以考虑有序编码。

## 训练和预测必须使用同一套编码规则

类别编码最容易出问题的地方，是训练和预测不一致。

比如训练时城市只有：

```text
北京、上海、深圳
```

上线后来了一个新城市：

```text
杭州
```

如果编码器没有处理未知类别，预测接口可能直接报错。

用 scikit-learn 时，可以这样设置：

```python
from sklearn.preprocessing import OneHotEncoder

encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
encoded = encoder.fit_transform(train_df[["city"]])

new_encoded = encoder.transform(new_df[["city"]])
```

注意训练集用 `fit_transform`，新数据只用 `transform`。不能在预测数据上重新 `fit`，否则列的含义会变。

## 一个简单选择表

可以先用这个规则判断：

```text
有顺序的类别 -> Ordinal / Label Encoding
无顺序且类别不多 -> One-Hot Encoding
类别特别多 -> 先合并低频或考虑更高级方法
预测时可能有新类别 -> 编码器要支持 unknown
```

这不是绝对规则，但足够帮你开始做第一个版本。

## 本课总结

类别编码的核心不是“怎么把文字变成数字”，而是“这个数字会不会传递错误含义”。

这一课记住四句话：

- 类别特征必须先转成数字；
- 无序类别不要随便标签编码；
- 独热编码会增加特征列数；
- 编码规则要和模型一起保存。

下一课继续讲数值特征：标准化和归一化有什么区别，什么时候需要做。
