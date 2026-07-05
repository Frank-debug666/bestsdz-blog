---
title: GridSearchCV 调参：怎样系统寻找更好的参数
description: 理解参数、超参数、参数网格、交叉验证搜索、best_params_ 和 best_estimator_ 的使用方式。
pubDate: 2026-06-28T09:20:00+08:00
tags: [机器学习, 调参, GridSearchCV, scikit-learn]
---

上一课我们讲了交叉验证，它能让模型评估更稳。接下来要解决另一个问题：模型参数那么多，怎么系统地选？

很多初学者会靠感觉改参数：KNN 的 K 改一下，随机森林的树数量改一下，决策树深度改一下。这样能试，但容易乱。

GridSearchCV 的作用是：**把你想尝试的参数组合列出来，然后用交叉验证逐组比较**。

## 参数和超参数有什么区别

先分清两个词。

| 名称 | 谁来决定 | 例子 |
| --- | --- | --- |
| 参数 | 模型从数据中学出来 | 线性回归的权重、逻辑回归的系数 |
| 超参数 | 训练前由我们设置 | KNN 的 K、树深度、随机森林树数量 |

GridSearchCV 搜索的是超参数。它不会替你发明搜索范围，而是根据你给出的参数网格逐个尝试。

## GridSearchCV 的工作流程

可以把 GridSearchCV 理解为一个自动化实验助手：

1. 你给出模型；
2. 你给出参数网格；
3. 它遍历每一种参数组合；
4. 每组参数都做交叉验证；
5. 选出平均验证分数最高的组合；
6. 默认用最优参数在全部训练数据上重新训练。

它的价值不是让模型必然变强，而是让调参过程变得可复现、可比较、可解释。

## 参数网格怎么写

参数网格是一个字典，键是参数名，值是候选列表。

例如随机森林：

```python
param_grid = {
    "n_estimators": [50, 100, 200],
    "max_depth": [3, 5, None],
    "min_samples_leaf": [1, 3, 5],
}
```

这会产生 `3 × 3 × 3 = 27` 种组合。如果 `cv=5`，总共要训练 `27 × 5 = 135` 次模型。网格越大，搜索越慢。

所以初学阶段不要一上来写巨大网格。先用小范围找到方向，再逐步细化。

## sklearn 代码示例

下面用随机森林做一个完整的 GridSearchCV 示例。

```python
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.metrics import classification_report

X, y = load_iris(return_X_y=True)

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)

param_grid = {
    "n_estimators": [50, 100, 200],
    "max_depth": [3, 5, None],
    "min_samples_leaf": [1, 3],
}

search = GridSearchCV(
    estimator=RandomForestClassifier(random_state=42, n_jobs=-1),
    param_grid=param_grid,
    scoring="accuracy",
    cv=5,
    n_jobs=-1,
    refit=True,
)

search.fit(X_train, y_train)

print("最优参数:", search.best_params_)
print("最优交叉验证分数:", search.best_score_)

best_model = search.best_estimator_
y_pred = best_model.predict(X_test)
print(classification_report(y_test, y_pred))
```

`best_params_` 是最优参数组合。`best_score_` 是这组参数在交叉验证中的平均分。`best_estimator_` 是已经用最优参数重新训练好的模型。

## 为什么还要看测试集

GridSearchCV 的 `best_score_` 来自训练集内部的交叉验证，不是最终测试集分数。

正确流程是：

1. 先切出测试集；
2. 只在训练集上做 GridSearchCV；
3. 得到 `best_estimator_`；
4. 最后在测试集上评估一次。

不要把测试集也放进 GridSearchCV。否则你是在用测试集参与选参数，最终分数会失真。

## Pipeline 里的参数怎么写

如果模型被放在 Pipeline 里，参数名要写成：

```text
步骤名__参数名
```

例如：

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier

pipe = Pipeline(steps=[
    ("scaler", StandardScaler()),
    ("knn", KNeighborsClassifier()),
])

param_grid = {
    "knn__n_neighbors": [3, 5, 7, 9],
    "knn__weights": ["uniform", "distance"],
}
```

这里的 `knn__n_neighbors` 表示修改 Pipeline 里名为 `knn` 的步骤的 `n_neighbors` 参数。

## 如何查看所有搜索结果

`cv_results_` 里保存了每组参数的详细结果。可以转成 DataFrame 查看：

```python
import pandas as pd

results = pd.DataFrame(search.cv_results_)

columns = [
    "mean_test_score",
    "std_test_score",
    "param_n_estimators",
    "param_max_depth",
    "param_min_samples_leaf",
]

print(results[columns].sort_values("mean_test_score", ascending=False).head())
```

调参时不要只看第一名。也要看前几名的分数是否接近、标准差是否稳定、参数是否过于复杂。

## 调参不是越复杂越好

如果两个参数组合分数差不多，优先选择更简单、更稳定、更容易解释的模型。

例如：

| 参数组合 | 平均分 | 标准差 |
| --- | ---: | ---: |
| `max_depth=5` | 0.862 | 0.018 |
| `max_depth=None` | 0.865 | 0.061 |

虽然第二个平均分略高，但波动更大，树也更复杂。实际项目里，第一组可能更值得选。

## 常见错误

### 搜索范围太大

网格一大，训练次数会爆炸。先粗搜，再细搜，通常比一次性塞入大量参数更实用。

### 只看 best_score_

`best_score_` 是交叉验证平均分，不是最终测试分数。它只能说明在训练集内部验证中表现最好。

### 没有固定 random_state

如果模型本身有随机性，而你没有固定随机种子，每次搜索结果可能不一致，难以复盘。

### 用测试集参与搜索

这是最严重的错误之一。测试集必须留到最后，不能参与参数选择。

## 课后练习

把示例里的 `scoring="accuracy"` 改成 `"f1_macro"`，再运行一次。观察最优参数是否变化。然后比较两个最优模型在测试集上的分类报告。

## 本课总结

- GridSearchCV 会遍历参数网格；
- 每组参数都会通过交叉验证比较；
- `best_params_` 是最优参数，`best_estimator_` 是最优模型；
- 参数网格不要盲目写太大；
- 调参要在训练集内部完成，测试集留到最后。

下一课我们学习 Pipeline。它能把预处理和模型封装成一条流水线，避免很多隐蔽的数据泄漏问题。
