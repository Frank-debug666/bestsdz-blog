---
title: 数据标准化和归一化有什么区别
description: 标准化和归一化都在处理数值尺度问题，但一个看均值方差，一个看最大最小值。
cover: /images/covers/standardization-vs-normalization-video.jpg
coverAlt: 年龄、收入和距离等不同尺度的数值字段被缩放到可比较范围的示意图。
pubDate: 2026-06-25T09:40:00+08:00
tags: [机器学习, 数据预处理, 特征工程, 标准化]
---

做机器学习时，经常会遇到这种情况：一个字段是年龄，范围大概是几十；另一个字段是收入，范围可能是几千到几十万；再一个字段是距离，可能从 0 到几千。

这些字段的数值尺度差异很大。某些模型会被大尺度特征牵着走，导致训练不稳定或效果变差。标准化和归一化，就是用来处理这类问题的。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/standardization-vs-normalization-video.jpg" aria-label="第 26 课：标准化和归一化有什么区别">
    <source src="/videos/lesson-26-standardization-vs-normalization.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 26 课视频 · 标准化和归一化有什么区别（约 1 分 40 秒）</figcaption>
</figure>

## 先用一句话区分

标准化关注均值和标准差。

它通常把数据变成均值约为 0、标准差约为 1 的分布：

```text
x_standard = (x - mean) / std
```

归一化关注最大值和最小值。

它通常把数据压缩到 0 到 1 的范围：

```text
x_norm = (x - min) / (max - min)
```

所以两者都在缩放数值，但依据不同。

## 为什么数值尺度会影响模型

假设我们有两个特征：

```text
年龄：18 到 60
年收入：30000 到 500000
```

如果模型使用距离、梯度或权重更新，大范围的收入字段可能会对结果产生更大的影响。不是因为收入一定更重要，而是因为它的数字更大。

这会影响很多模型，比如：

- KNN；
- K-Means；
- 线性回归；
- 逻辑回归；
- SVM；
- 神经网络。

树模型通常对缩放不那么敏感，比如决策树、随机森林、梯度提升树。因为它们主要按阈值切分特征，而不是直接计算距离或梯度尺度。

## 标准化怎么做

标准化在 scikit-learn 里常用 `StandardScaler`：

```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()

X_train_scaled = scaler.fit_transform(X_train)
X_valid_scaled = scaler.transform(X_valid)
X_test_scaled = scaler.transform(X_test)
```

注意这里的顺序非常重要：

- 训练集用 `fit_transform`；
- 验证集和测试集只用 `transform`；
- 不能在测试集上重新 `fit`。

因为 `fit` 会计算均值和标准差。如果你在测试集上 `fit`，就等于让预处理过程提前看到了测试集信息。

## 归一化怎么做

归一化常用 `MinMaxScaler`：

```python
from sklearn.preprocessing import MinMaxScaler

scaler = MinMaxScaler()

X_train_norm = scaler.fit_transform(X_train)
X_valid_norm = scaler.transform(X_valid)
X_test_norm = scaler.transform(X_test)
```

归一化会把训练集里的最小值映射到 0，最大值映射到 1。

如果新数据超出了训练集范围，转换后也可能小于 0 或大于 1。这不是一定错误，只说明新数据超出了训练时见过的范围，需要结合业务判断。

## 标准化和归一化怎么选

初学阶段可以先这样判断：

```text
线性模型、逻辑回归、SVM、神经网络 -> 标准化常用
KNN、K-Means、距离相关模型 -> 很需要缩放
数据范围固定且有明确上下界 -> 可以考虑归一化
决策树、随机森林、XGBoost -> 通常不强依赖缩放
```

比如像像素值这种天然在 0 到 255 的数据，归一化到 0 到 1 很常见。

而像收入、年龄、消费金额这类表格数据，标准化更常见。

## 最重要的坑：不要先缩放全量数据

错误写法是：

```python
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(X_scaled, y)
```

这段代码看起来很顺，但有一个问题：它在划分训练集和测试集之前，就已经用全量数据计算了均值和标准差。

这样测试集的信息泄漏到了训练流程里。

更稳妥的写法是：

```python
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
```

先划分，再用训练集学习缩放规则。

## 上线时也要保存缩放器

模型上线时不能只保存模型文件，还要保存预处理对象。

比如：

```python
import joblib

joblib.dump(model, "model.pkl")
joblib.dump(scaler, "scaler.pkl")
```

预测新样本时：

```python
model = joblib.load("model.pkl")
scaler = joblib.load("scaler.pkl")

new_x_scaled = scaler.transform(new_x)
pred = model.predict(new_x_scaled)
```

训练时怎么缩放，预测时就必须怎么缩放。

## 本课总结

标准化和归一化都是为了处理数值尺度问题。

这一课记住四句话：

- 标准化用均值和标准差；
- 归一化用最大值和最小值；
- 缩放参数只能从训练集学习；
- 缩放器要和模型一起保存。

下一课我们进入第一个经典模型：线性回归，看模型怎样用一条线预测连续数值。
