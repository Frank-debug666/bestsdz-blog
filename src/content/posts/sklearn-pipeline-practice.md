---
title: Pipeline 实战：把预处理和模型封装成一条流水线
description: 理解 sklearn Pipeline 如何串联标准化、TF-IDF、模型训练、交叉验证和调参，避免数据泄漏。
cover: /images/covers/sklearn-pipeline-practice-video.jpg
coverAlt: 数据依次经过预处理、特征转换、模型训练三个步骤，被 Pipeline 封装成统一流程。
pubDate: 2026-06-28T09:40:00+08:00
tags: [机器学习, Pipeline, 数据泄漏, scikit-learn]
---

到目前为止，我们已经写过不少机器学习代码：划分数据、做标准化、训练模型、评估分数、交叉验证、调参。代码一多，就很容易出现流程不一致。

Pipeline 的作用是：**把预处理和模型封装成同一条可复用的流水线**。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/sklearn-pipeline-practice-video.jpg" aria-label="第 35 课：Pipeline 实战">
    <source src="/videos/lesson-35-sklearn-pipeline-practice.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 35 课视频 · Pipeline 实战：把预处理和模型封装成一条流水线</figcaption>
</figure>

## 为什么需要 Pipeline

先看一个常见但危险的写法：

```python
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(X_scaled, y)
```

问题在于：标准化器已经在全量数据上 `fit` 过了，测试集的均值和标准差信息提前参与了训练流程。这就是数据泄漏。

正确做法应该是：

```python
scaler.fit(X_train)
X_train_scaled = scaler.transform(X_train)
X_test_scaled = scaler.transform(X_test)
```

Pipeline 可以帮我们把这种流程固定下来，减少人为失误。

## Pipeline 的基本结构

Pipeline 由一组有顺序的步骤组成：

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier

pipe = Pipeline(steps=[
    ("scaler", StandardScaler()),
    ("model", KNeighborsClassifier(n_neighbors=5)),
])
```

每个步骤是一个二元组：

```text
("步骤名", 对象)
```

中间步骤通常是转换器，必须有 `fit` 和 `transform`。最后一步通常是模型，必须有 `fit`，并且可以有 `predict`、`score` 等方法。

## Pipeline 怎样执行

当你调用：

```python
pipe.fit(X_train, y_train)
```

Pipeline 会自动执行：

1. 对 `scaler` 调用 `fit_transform(X_train)`；
2. 把转换后的结果交给 `model`；
3. 对 `model` 调用 `fit`。

当你调用：

```python
pipe.predict(X_test)
```

Pipeline 会自动执行：

1. 对 `scaler` 调用 `transform(X_test)`；
2. 把转换后的结果交给 `model.predict()`。

这样训练和预测永远走同一条路线。

## 数值特征示例：标准化 + KNN

KNN 依赖距离，所以标准化很重要。用 Pipeline 写会更稳：

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier

X, y = load_iris(return_X_y=True)

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)

pipe = Pipeline(steps=[
    ("scaler", StandardScaler()),
    ("knn", KNeighborsClassifier(n_neighbors=5)),
])

pipe.fit(X_train, y_train)
print("测试集准确率:", pipe.score(X_test, y_test))
```

这段代码的好处是，你不用手动管理 `X_train_scaled` 和 `X_test_scaled`，也不会把测试集拿去 `fit` 标准化器。

## 文本特征示例：TF-IDF + 随机森林

文本分类更适合 Pipeline，因为 TF-IDF 也有 `fit` 和 `transform`。

```python
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier

pipe = Pipeline(steps=[
    ("tfidf", TfidfVectorizer(max_features=20000)),
    ("rf", RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)),
])

pipe.fit(train_texts, train_labels)
pred = pipe.predict(test_texts)
```

训练阶段，TF-IDF 会学习词表和 IDF。预测阶段，它只会使用同一个词表做 `transform`。这正好解决了文本分类项目里“训练和预测特征空间必须一致”的问题。

## Pipeline 和交叉验证一起用

Pipeline 最大的价值之一，是和交叉验证一起用。

```python
from sklearn.model_selection import cross_val_score

scores = cross_val_score(
    pipe,
    X,
    y,
    cv=5,
    scoring="accuracy",
)

print(scores.mean(), scores.std())
```

交叉验证每一折都会重新执行 Pipeline。也就是说，每一折的标准化器或 TF-IDF 都只在当前训练折上 `fit`，验证折不会提前泄漏进去。

## Pipeline 和 GridSearchCV 一起用

如果要调 Pipeline 内部某一步的参数，写法是：

```text
步骤名__参数名
```

例如：

```python
from sklearn.model_selection import GridSearchCV

param_grid = {
    "knn__n_neighbors": [3, 5, 7, 9],
    "knn__weights": ["uniform", "distance"],
}

search = GridSearchCV(
    pipe,
    param_grid=param_grid,
    scoring="accuracy",
    cv=5,
)

search.fit(X_train, y_train)

print(search.best_params_)
print(search.best_score_)
```

如果是文本分类：

```python
param_grid = {
    "tfidf__max_features": [10000, 20000, 50000],
    "rf__n_estimators": [100, 200],
    "rf__max_depth": [None, 20],
}
```

这让预处理参数和模型参数可以一起搜索。

## 保存 Pipeline

实际项目中，保存整个 Pipeline 通常比分别保存预处理器和模型更省心。

```python
import joblib

joblib.dump(pipe, "text_classifier_pipeline.joblib")

loaded_pipe = joblib.load("text_classifier_pipeline.joblib")
pred = loaded_pipe.predict(["这是一条新的文本"])
```

如果你只保存模型，不保存 TF-IDF 或标准化器，预测阶段就很容易对不上训练阶段的特征空间。

## 常见错误

### 把预处理放在 train_test_split 之前

如果预处理器需要从数据中学习统计信息，例如均值、标准差、词表、IDF，就不能在全量数据上先 `fit`。

### Pipeline 步骤顺序写反

先做预处理，再训练模型。模型必须放在最后一步。

### 忘记双下划线

GridSearchCV 调 Pipeline 参数时，必须写 `步骤名__参数名`。一个下划线或点号都不对。

### 保存模型但漏掉预处理器

文本分类、标准化、One-Hot 编码都可能出问题。保存完整 Pipeline 往往更可靠。

## 课后练习

把 KNN 示例改成 Pipeline + GridSearchCV，搜索：

```python
{
    "knn__n_neighbors": [3, 5, 7, 9],
    "knn__weights": ["uniform", "distance"],
}
```

然后输出 `best_params_` 和测试集分数。

## 本课总结

- Pipeline 把预处理和模型封装成同一条流程；
- 它能减少训练、验证、预测阶段不一致；
- 交叉验证中使用 Pipeline 可以避免预处理泄漏；
- GridSearchCV 调 Pipeline 参数要用 `步骤名__参数名`；
- 实际项目里保存完整 Pipeline 往往更稳。

下一阶段我们会进入中文文本分类项目，把前面学过的数据清洗、TF-IDF、随机森林、评估和 Pipeline 串成一个完整项目闭环。
