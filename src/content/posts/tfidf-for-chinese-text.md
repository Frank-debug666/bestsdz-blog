---
title: TF-IDF 是什么？把中文文本变成模型能读的数字
description: 从词频和逆文档频率出发，理解 TF-IDF 为什么适合文本分类，以及如何在 sklearn 中使用 TfidfVectorizer。
cover: /images/covers/tfidf-for-chinese-text-video.jpg
coverAlt: 分词后的中文词语被转换成 TF-IDF 权重矩阵，进入机器学习模型完成分类。
pubDate: 2026-06-29T09:40:00+08:00
tags: [机器学习, NLP, TF-IDF, 文本分类, scikit-learn]
---

上一课我们把中文句子切成了词。现在要解决下一个问题：**模型只能处理数字，不能直接处理词语**。

所以文本分类必须做特征提取。TF-IDF 就是一种经典、好用、适合入门的文本特征方法。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/tfidf-for-chinese-text-video.jpg" aria-label="第 38 课：TF-IDF">
    <source src="/videos/lesson-38-tfidf-for-chinese-text.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 38 课视频 · TF-IDF 是什么？把中文文本变成模型能读的数字</figcaption>
</figure>

## 从词频开始理解

最直观的方法是统计一个词在文本里出现了几次。

比如：

```text
我 喜欢 机器学习 机器学习 很 有用
```

词频可能是：

| 词 | 出现次数 |
| --- | --- |
| 我 | 1 |
| 喜欢 | 1 |
| 机器学习 | 2 |
| 很 | 1 |
| 有用 | 1 |

如果只看词频，“机器学习”权重最高，因为出现了两次。

这就是 TF，也就是 Term Frequency，词频。

## 只看词频有什么问题

有些词出现很多，但不一定重要。

比如在很多文章里，“我们”“这个”“可以”“进行”都可能频繁出现。它们出现多，不代表它们能帮助分类。

TF-IDF 的核心思想是：

```text
一个词在当前文本里出现越多，越重要；
但如果它在很多文本里都出现，就没那么特殊。
```

也就是说，TF-IDF 不只看当前文本里的词频，还会看这个词在整个语料库里是不是常见。

## IDF 是什么

IDF 是 Inverse Document Frequency，逆文档频率。

可以粗略理解为：

```text
一个词出现在越少的文档里，它越有区分度。
```

比如在一个技术博客数据集里：

| 词 | 出现范围 | 区分度 |
| --- | --- | --- |
| 这个 | 很多文章都有 | 低 |
| 模型 | 很多 AI 文章都有 | 中 |
| 交叉验证 | 少数文章出现 | 高 |
| TF-IDF | 特定主题文章出现 | 高 |

TF-IDF 会提高“交叉验证”“TF-IDF”这种更能代表主题的词，降低“这个”“可以”这种泛化词。

## TF-IDF 的直觉公式

不用一开始死记公式，可以先记住直觉：

```text
TF-IDF = 词在当前文本的重要程度 x 词在全局语料里的稀有程度
```

更正式一点：

```text
TF-IDF = TF x IDF
```

TF 越高，说明这个词在当前文本里更突出。

IDF 越高，说明这个词在全局里更有区分度。

两者相乘，就能得到一个更适合分类的权重。

## 用 sklearn 做 TF-IDF

在 sklearn 里可以用 `TfidfVectorizer`。

英文文本通常可以直接交给它分词，但中文最好先自己分词，再把词用空格拼起来。

```python
import jieba
from sklearn.feature_extraction.text import TfidfVectorizer

texts = [
    "我喜欢机器学习",
    "机器学习可以做文本分类",
    "这个功能不好用",
]

texts_cut = [" ".join(jieba.lcut(text)) for text in texts]

vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(texts_cut)

print(X.shape)
print(vectorizer.get_feature_names_out())
```

`X` 就是模型可以使用的数字矩阵。

它的形状通常是：

```text
样本数 x 词表大小
```

如果有 1000 条文本，词表里有 5000 个词，那么矩阵形状就是：

```text
1000 x 5000
```

## TF-IDF 输出为什么是稀疏矩阵

每条文本只会用到词表中的一小部分词。

比如词表有 5000 个词，但一条短信可能只有 20 个词。剩下 4980 个位置都是 0。

所以 sklearn 默认使用稀疏矩阵存储，节省内存。

这也是为什么打印 `X` 时，你看到的可能不是普通二维数组，而是类似坐标和值的结构。

## 常用参数

`TfidfVectorizer` 有几个常用参数。

| 参数 | 作用 |
| --- | --- |
| max_features | 最多保留多少个词 |
| min_df | 低于多少文档频率的词不要 |
| max_df | 高于多少文档频率的词不要 |
| ngram_range | 是否加入连续词组合 |

例如：

```python
vectorizer = TfidfVectorizer(
    max_features=5000,
    min_df=2,
    max_df=0.9,
    ngram_range=(1, 2),
)
```

这表示：

1. 最多保留 5000 个特征；
2. 至少出现在 2 篇文档里的词才保留；
3. 出现在 90% 以上文档里的词过滤掉；
4. 同时考虑单个词和连续两个词。

## 和 Pipeline 结合

TF-IDF 通常不要单独散着写，而是和模型放进 Pipeline。

```python
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer

pipe = Pipeline([
    ("tfidf", TfidfVectorizer(max_features=5000)),
    ("model", LogisticRegression(max_iter=1000)),
])

pipe.fit(X_train_text, y_train)
pred = pipe.predict(X_test_text)
```

这样训练、验证、调参和上线时都使用同一条流程，能减少数据泄漏和预处理不一致。

如果是中文文本，可以先把分词结果拼成空格字符串，再传给 Pipeline。

## 这一课先记住

TF-IDF 的本质是给词分配权重。

它会提高“当前文本常出现、全局又不太泛滥”的词，降低到处都出现的普通词。

对中文文本分类来说，一条经典入门路线是：

```text
中文分词 -> 停用词处理 -> TF-IDF -> 逻辑回归/朴素贝叶斯
```

下一批内容会继续把 TF-IDF 接进模型训练，完成一个可运行的中文文本分类 baseline。
