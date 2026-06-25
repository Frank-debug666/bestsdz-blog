---
title: 特征工程是什么？模型为什么不能直接理解原始数据
description: 特征工程不是随便增加几列，而是把原始业务数据整理成模型能稳定学习的信号。
cover: /images/covers/what-is-feature-engineering-video.jpg
coverAlt: 原始数据经过选择、转换和构造，变成模型可学习特征的流程图。
pubDate: 2026-06-25T09:00:00+08:00
tags: [机器学习, 特征工程, AI基础]
---

学完数据清洗以后，下一步不是马上选算法，而是把数据变成模型能真正学习的样子。

很多初学者会把“有数据”和“能训练”看成一件事。其实不是。原始数据只是业务记录，它里面有文字、日期、类别、单位、缺失、重复和各种隐含含义。模型并不理解这些业务语言，它只会根据输入的特征去学习统计关系。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/what-is-feature-engineering-video.jpg" aria-label="第 24 课：特征工程是什么">
    <source src="/videos/lesson-24-what-is-feature-engineering.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 24 课视频 · 特征工程是什么（约 1 分 43 秒）</figcaption>
</figure>

## 先用一句话理解特征工程

特征工程就是把原始数据转换成模型能理解、能学习、能泛化的输入信息。

比如一张用户表里有这些字段：

```text
注册时间、城市、年龄、会员等级、最近一次购买时间、总消费金额
```

这些字段直接丢给模型，未必好用。我们可能需要把它们处理成：

```text
注册天数、是否一线城市、年龄分组、会员等级编码、距离上次购买天数、平均客单价
```

这一步就是特征工程。

它不是为了让表格看起来更复杂，而是为了把更有预测价值的信息放到模型面前。

## 模型为什么不能直接理解原始数据

人看到“会员等级=黄金会员”，会自然理解它代表更高价值或更高活跃度。

但模型看到的是输入矩阵。它并不知道“黄金会员”比“普通会员”意味着什么，除非我们把这个信息转换成合适的数字形式。

再比如“注册时间”这个字段，人能理解早注册的用户可能更稳定；模型却不能直接从一个日期字符串里理解“老用户”这个概念。我们需要把日期拆成模型能用的特征：

```python
import pandas as pd

df["register_date"] = pd.to_datetime(df["register_date"])
df["days_since_register"] = (pd.Timestamp("2026-06-25") - df["register_date"]).dt.days
```

这样模型拿到的就不是一个复杂日期，而是一个明确的数字：这个用户注册了多少天。

## 常见的特征工程动作

特征工程可以先分成三类。

第一类是选择特征。

不是所有字段都应该进入模型。明显无关的字段、唯一 ID、泄露答案的字段，都要谨慎处理。

比如预测用户是否会购买时，如果把“是否已经付款”放进特征里，模型当然会很准，但这已经把答案提前告诉模型了。

第二类是转换特征。

常见转换包括：

- 把类别字段编码成数字；
- 把日期字段拆成年、月、星期、间隔天数；
- 把文本字段转成词频或 TF-IDF；
- 对数值字段做标准化或归一化；
- 对偏态严重的金额做对数变换。

第三类是构造特征。

构造特征就是从已有字段里组合出新信息。比如：

```python
df["avg_order_value"] = df["total_amount"] / df["order_count"]
df["is_high_value_user"] = df["total_amount"] > 1000
df["days_since_last_order"] = (
    pd.Timestamp("2026-06-25") - pd.to_datetime(df["last_order_date"])
).dt.days
```

这些新字段往往比原始字段更接近业务问题。

## 一个小例子

假设我们要预测一个用户是否会复购，原始数据长这样：

```text
user_id, city, member_level, total_amount, order_count, last_order_date, repurchase
```

可以先做一版简单特征：

```python
import pandas as pd

df = pd.read_csv("users.csv")

df["last_order_date"] = pd.to_datetime(df["last_order_date"])
df["days_since_last_order"] = (
    pd.Timestamp("2026-06-25") - df["last_order_date"]
).dt.days

df["avg_order_value"] = df["total_amount"] / df["order_count"].replace(0, 1)

df = pd.get_dummies(df, columns=["city", "member_level"], drop_first=True)

X = df.drop(columns=["user_id", "last_order_date", "repurchase"])
y = df["repurchase"]
```

这段代码做了几件事：

- 把日期变成间隔天数；
- 把总金额和订单数变成平均客单价；
- 把城市和会员等级做成模型能读的数字列；
- 最后拆出特征 `X` 和标签 `y`。

这才是模型真正开始学习前要做的准备。

## 特征工程里最容易踩的坑

第一个坑是数据泄漏。

如果某个特征包含未来信息，模型在测试集上会表现得非常好，但上线后效果会崩。比如预测用户是否会流失时，把“流失后客服回访次数”放进特征里，就是泄漏。

第二个坑是训练和预测规则不一致。

训练时怎么编码、怎么填缺失、怎么缩放，上线预测时也必须完全一样。否则模型拿到的输入分布就变了。

第三个坑是只追求复杂特征。

特征不是越多越好。无关特征会增加噪声，重复特征会让模型更不稳定。好的特征应该解释得通、能重复生成、在新数据上仍然存在。

## 本课总结

特征工程是从数据清洗走向建模的关键步骤。

这一课先记住四句话：

- 特征是模型真正读取的信息；
- 原始字段不一定能直接训练；
- 好特征来自业务理解和数据检查；
- 构造特征时一定避开数据泄漏。

下一课我们继续处理一类非常常见的特征：类别特征。重点讲 Label Encoding 和 One-Hot Encoding 到底怎么选。
