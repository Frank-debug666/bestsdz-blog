---
title: 文本分类模型评估：从混淆矩阵找到改进方向
description: 学会用 classification_report、confusion_matrix 和错分样本分析文本分类模型，不只看准确率。
cover: /images/covers/text-classification-evaluation-confusion-matrix-video.jpg
coverAlt: 文本分类预测结果进入混淆矩阵，帮助定位哪些类别最容易被模型混淆。
pubDate: 2026-06-30T09:40:00+08:00
tags: [机器学习, NLP, 模型评估, 混淆矩阵, 文本分类]
---

上一课我们训练了一个 TF-IDF + 逻辑回归 baseline。模型能跑起来只是第一步，真正重要的是：**它错在哪里，为什么错，下一步怎么改**。

如果只看一个准确率，我们很容易被表面分数骗到。文本分类尤其如此，因为类别不平衡、标签模糊、文本表达复杂，都会让单个指标变得不可靠。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/text-classification-evaluation-confusion-matrix-video.jpg" aria-label="第 41 课：文本分类模型评估">
    <source src="/videos/lesson-41-text-classification-evaluation-confusion-matrix.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 41 课视频 · 文本分类模型评估：从混淆矩阵找到改进方向</figcaption>
</figure>

## 先看 classification_report

最常用的第一步是：

```python
from sklearn.metrics import classification_report

print(classification_report(y_test, y_pred))
```

报告里会看到：

| 指标 | 含义 |
| --- | --- |
| precision | 预测成这个类的样本里，有多少是真的 |
| recall | 这个类的真实样本里，有多少被找出来 |
| f1-score | precision 和 recall 的综合 |
| support | 测试集中这个类有多少样本 |

如果某个类别的 support 很少，它的分数波动会很大，不要过度解读。

## 准确率为什么会骗人

假设测试集中 90% 都是“正常文本”，10% 是“风险文本”。

如果模型全部预测“正常文本”，准确率也能达到 90%。但它完全找不出风险文本。

这时候 accuracy 很高，模型却没有业务价值。

所以要看每个类别的 precision、recall 和 F1，尤其是你真正关心的类别。

## 混淆矩阵是什么

混淆矩阵能告诉我们：真实类别和预测类别之间是怎么错的。

```python
from sklearn.metrics import confusion_matrix

labels = sorted(y_test.unique())
cm = confusion_matrix(y_test, y_pred, labels=labels)
print(cm)
```

如果是二分类，可以理解为：

| | 预测负类 | 预测正类 |
| --- | --- | --- |
| 真实负类 | TN | FP |
| 真实正类 | FN | TP |

对于多分类，矩阵会更大。行通常是真实类别，列通常是预测类别。

对角线上的数字越大越好，说明预测正确。非对角线上的数字就是混淆。

## 看混淆矩阵要问什么

看混淆矩阵时，不要只看热力图好不好看，而是问几个问题：

1. 哪两个类别最容易互相混淆；
2. 有没有某个类别几乎总是被预测成别的类；
3. 少数类是不是被模型忽略了；
4. 错误是否集中在某些相似表达；
5. 这些错误是模型问题，还是标签本身不清楚。

这些问题会直接指向下一步优化方向。

## 把错分样本拿出来看

只看指标还不够，要看具体错分文本。

```python
error_df = pd.DataFrame({
    "text": X_test,
    "true": y_test,
    "pred": y_pred,
})

error_df = error_df[error_df["true"] != error_df["pred"]]
print(error_df.head(20))
```

错分样本通常会暴露很多问题：

| 现象 | 可能原因 |
| --- | --- |
| 文本太短 | 信息不足 |
| 标签本身模糊 | 标注规则不清 |
| 某类表达很多样 | 数据覆盖不够 |
| 领域词被切坏 | 分词或词典问题 |
| 否定词被删掉 | 停用词表问题 |

优化模型之前，先把这些原因分清楚。

## 用错分样本指导改进

假设你发现“无法登录”和“登录成功但页面卡住”经常混淆。

这可能说明：

1. 标签边界不清楚；
2. 分词没有保留关键短语；
3. 训练数据里相关样本太少；
4. 当前特征无法表达细微差别。

对应的改进方式可能是：

1. 调整标签定义；
2. 加入自定义词典；
3. 补充样本；
4. 加入 bigram；
5. 尝试更强的模型。

评估不是为了批评模型，而是为了告诉你下一步该改哪里。

## 宏平均和加权平均

`classification_report` 里通常还有 macro avg 和 weighted avg。

macro avg 是每个类别一视同仁地平均。它更关注少数类是否也表现不错。

weighted avg 会按类别样本数加权。大类别影响更大，所以它更接近总体表现。

如果类别不平衡，建议重点看 macro F1 和关键类别的 recall。

## 这一课先记住

文本分类评估不能只看准确率。

一套更可靠的检查顺序是：

```text
classification_report
  -> confusion_matrix
  -> 错分样本
  -> 归因分析
  -> 有针对性地改数据、特征或模型
```

下一步，我们会把文本分类流程封装起来，让训练和预测更接近真实项目。
