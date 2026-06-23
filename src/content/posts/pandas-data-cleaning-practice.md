---
title: Pandas 数据清洗实战：把混乱表格变成可训练数据
description: 用一个小型表格案例串起读取数据、检查缺失、去重、处理异常值、编码类别特征和导出干净数据的流程。
cover: /images/covers/pandas-data-cleaning-practice-video.jpg
coverAlt: Pandas 清洗流程图，表格从混乱状态经过检查、去重、填充和编码变成训练数据。
pubDate: 2026-06-23T09:40:00+08:00
tags: [Pandas, 数据清洗, 代码实战]
---

前一课讲了缺失值、重复值和异常值。

这一课把概念放进代码里，用 Pandas 做一个最小清洗流程。

目标不是写一堆复杂技巧，而是建立一条可以反复复用的思路：先看数据，再定规则，最后把清洗过程写成稳定代码。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/pandas-data-cleaning-practice-video.jpg" aria-label="第 23 课：Pandas 数据清洗实战">
    <source src="/videos/lesson-23-pandas-data-cleaning-practice.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 23 课视频 · Pandas 数据清洗实战（约 1 分 40 秒）</figcaption>
</figure>

## 准备一个小型混乱表格

假设我们有一份用户购买数据：

```python
import pandas as pd

raw = pd.DataFrame({
    "user_id": [1, 2, 2, 3, 4, 5, 6],
    "age": [23, None, None, 42, 300, 35, 29],
    "city": ["北京", "上海", "上海", None, "广州", "深圳 ", "深圳"],
    "income": [8000, 12000, 12000, None, -5000, 15000, 16000],
    "buy": ["yes", "no", "no", "yes", "yes", "no", "no"],
})
```

这份数据有几个问题：

- 第 2、3 行重复；
- `age` 有缺失值，也有明显异常值 300；
- `city` 有缺失值，还有多余空格；
- `income` 有缺失值，也有负数；
- `buy` 是字符串标签，后面需要转成数字。

这已经很接近真实数据了：问题不一定很难，但会同时出现。

## 第一步：先检查数据

不要一上来就清洗。

先看数据长什么样：

```python
print(raw.head())
print(raw.shape)
print(raw.info())
print(raw.isna().sum())
print(raw.duplicated().sum())
```

这一步回答几个基本问题：

- 有多少行、多少列；
- 每列是什么类型；
- 哪些列有缺失；
- 有没有完全重复行；
- 数据是否和预期一致。

如果这一关跳过，后面很容易在不知道问题的情况下乱改数据。

## 第二步：复制一份数据再处理

清洗时建议不要直接改原始数据。

```python
df = raw.copy()
```

这样做有两个好处：

第一，原始数据还能回看。

第二，如果规则写错，可以重新从 `raw` 开始，不用担心把源数据改坏。

## 第三步：处理文本格式

文本字段经常有空格、大小写、符号不统一的问题。

比如 `city` 里有一个 `"深圳 "`，尾部多了空格。

可以先统一去掉前后空白：

```python
df["city"] = df["city"].str.strip()
```

如果是英文类别，还可以统一大小写：

```python
df["buy"] = df["buy"].str.lower().str.strip()
```

这类操作看起来小，但会直接影响后面的去重和编码。

## 第四步：删除重复行

现在检查重复：

```python
duplicate_count = df.duplicated().sum()
print("重复行数量：", duplicate_count)
```

删除完全重复行：

```python
df = df.drop_duplicates()
```

如果真实项目里有订单 ID、用户 ID、时间等字段，要按业务主键判断重复。

例如：

```python
df = df.drop_duplicates(subset=["user_id"])
```

不过这要谨慎。如果一个用户本来就有多条行为记录，按 `user_id` 去重就会误删。

## 第五步：处理异常值

这份数据里，年龄 300 明显不合理，收入 -5000 也不合理。

我们先把不可能的值转成缺失值，再统一填充。

```python
df.loc[(df["age"] < 0) | (df["age"] > 120), "age"] = None
df.loc[df["income"] < 0, "income"] = None
```

这里的规则来自常识和业务约束。

不是所有离群值都应该这样处理，但这种“不可能值”通常可以先标成缺失。

## 第六步：填充缺失值

数值字段常用中位数填充。

中位数比均值更不容易被极端值影响。

```python
df["age"] = df["age"].fillna(df["age"].median())
df["income"] = df["income"].fillna(df["income"].median())
```

类别字段可以用“未知”填充：

```python
df["city"] = df["city"].fillna("未知")
```

填充后再检查：

```python
print(df.isna().sum())
```

如果还有缺失，就要继续定位原因。

## 第七步：把类别转成模型能用的数字

模型不能直接理解 `"北京"`、`"上海"`、`"yes"`、`"no"`。

目标标签 `buy` 可以映射成 0 和 1：

```python
df["buy"] = df["buy"].map({
    "no": 0,
    "yes": 1,
})
```

城市这种无大小关系的类别，可以用 One-Hot Encoding：

```python
df = pd.get_dummies(df, columns=["city"], dtype=int)
```

处理后，表格会多出类似这样的列：

```text
city_上海
city_北京
city_广州
city_深圳
city_未知
```

每一列用 0 或 1 表示样本是否属于这个城市。

## 第八步：拆出特征和标签

清洗完成后，就可以拆成 `X` 和 `y`。

```python
X = df.drop(columns=["buy"])
y = df["buy"]

print(X.head())
print(y.head())
```

`X` 是模型用来学习的信息，`y` 是模型要预测的答案。

这一步对应前面文章里讲过的“特征”和“标签”。

## 第九步：导出清洗后的数据

如果清洗流程比较稳定，可以保存一份处理后的数据：

```python
df.to_csv("clean_data.csv", index=False)
```

但真实项目里更推荐保存清洗代码，而不只是保存结果。

因为数据会更新，清洗规则也需要能重复执行。

## 完整代码整理

把上面流程合起来：

```python
import pandas as pd

raw = pd.DataFrame({
    "user_id": [1, 2, 2, 3, 4, 5, 6],
    "age": [23, None, None, 42, 300, 35, 29],
    "city": ["北京", "上海", "上海", None, "广州", "深圳 ", "深圳"],
    "income": [8000, 12000, 12000, None, -5000, 15000, 16000],
    "buy": ["yes", "no", "no", "yes", "yes", "no", "no"],
})

df = raw.copy()

df["city"] = df["city"].str.strip()
df["buy"] = df["buy"].str.lower().str.strip()

df = df.drop_duplicates()

df.loc[(df["age"] < 0) | (df["age"] > 120), "age"] = None
df.loc[df["income"] < 0, "income"] = None

df["age"] = df["age"].fillna(df["age"].median())
df["income"] = df["income"].fillna(df["income"].median())
df["city"] = df["city"].fillna("未知")

df["buy"] = df["buy"].map({"no": 0, "yes": 1})
df = pd.get_dummies(df, columns=["city"], dtype=int)

X = df.drop(columns=["buy"])
y = df["buy"]

print(X)
print(y)
```

这段代码虽然短，但已经包含了一个清洗流程的主干。

## 小结

Pandas 数据清洗的重点不是记住每个函数，而是形成顺序：

```text
检查数据 -> 复制原始表 -> 统一格式 -> 去重 -> 处理异常 -> 填充缺失 -> 编码类别 -> 拆分特征标签
```

下一课，我们会继续进入特征工程：模型为什么不能直接理解原始数据，以及怎样把业务信息变成有用特征。
