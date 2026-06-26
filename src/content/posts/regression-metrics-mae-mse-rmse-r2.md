---
title: 回归模型怎样评估：MAE、MSE、RMSE 和 R²
description: 用同一组测试数据理解四个常用回归指标，并根据业务代价选择正确的评价方式。
cover: /images/covers/regression-metrics-mae-mse-rmse-r2-video.jpg
coverAlt: 四张指标卡片对比 MAE、MSE、RMSE 和 R 平方在回归评估中的作用。
pubDate: 2026-06-26T09:20:00+08:00
tags: [机器学习, 回归, 模型评估, scikit-learn]
---

上一课我们用线性回归预测了房价。但“模型预测出一个数字”还不等于模型可靠。

如果真实价格是 200 万，模型预测成 198 万，和预测成 120 万显然不是一回事。我们需要一套明确的尺度，来量化模型到底错了多少，以及这些错误对业务是否可接受。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/regression-metrics-mae-mse-rmse-r2-video.jpg" aria-label="第 28 课：回归模型怎样评估">
    <source src="/videos/lesson-28-regression-metrics-mae-mse-rmse-r2.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 28 课视频 · 回归模型怎样评估</figcaption>
</figure>

## 先把预测误差说清楚

对每个测试样本，都有一个真实值 `y_true` 和预测值 `y_pred`：

```text
误差 = 预测值 - 真实值
```

正负号只表示高估或低估。评估“错了多少”时，我们通常会消掉方向，重点看偏差的大小。

假设真实配送时长是 30 分钟：

- 预测 28 分钟，偏差是 2 分钟；
- 预测 42 分钟，偏差是 12 分钟。

所有指标都从这些偏差出发，只是对大错的态度不同。

## MAE：平均绝对误差

MAE（Mean Absolute Error）把每个样本的误差取绝对值后求平均：

```text
MAE = 平均值(|预测值 - 真实值|)
```

它最直观，因为单位和原始目标一致。

如果房价用“万元”表示，`MAE = 8.4` 就可以直接读作：模型平均会偏离约 8.4 万元。对于需要和业务方沟通的项目，MAE 往往是很好的首要指标。

## MSE 与 RMSE：更在意大错误

MSE（Mean Squared Error）会先把误差平方：

```text
MSE = 平均值((预测值 - 真实值)²)
```

误差从 2 变成 4，误差从 12 变成 144。于是大偏差会被明显放大。

不过 MSE 的单位也被平方了，读起来不直观。RMSE（Root Mean Squared Error）再对 MSE 开平方：

```text
RMSE = √MSE
```

RMSE 回到了原始单位，同时保留了对大错更敏感的特点。当一次严重低估或高估代价很高时，它通常比 MAE 更有提醒作用。

## R²：模型比“猜平均值”好多少

R²（决定系数）不直接表示错了几元或几分钟，而是衡量模型相对“永远预测训练目标平均值”这个基线的提升程度。

- `R² = 1`：测试数据上预测完全准确；
- `R² = 0`：和只猜平均值差不多；
- `R² < 0`：甚至不如只猜平均值。

R² 很适合比较同一任务、同一测试集上的不同模型，但不能替代 MAE 或 RMSE。一个 `R²` 看起来不错的模型，仍可能存在业务无法接受的平均误差。

## 用 scikit-learn 一次计算四个指标

```python
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)

y_true = [120, 145, 168, 180]
y_pred = [118, 150, 160, 191]

mae = mean_absolute_error(y_true, y_pred)
mse = mean_squared_error(y_true, y_pred)
rmse = mean_squared_error(y_true, y_pred) ** 0.5
r2 = r2_score(y_true, y_pred)

print(f"MAE:  {mae:.2f}")
print(f"MSE:  {mse:.2f}")
print(f"RMSE: {rmse:.2f}")
print(f"R²:   {r2:.3f}")
```

在真实项目里，`y_true` 和 `y_pred` 应来自测试集：

```python
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
```

同一个测试集、同一种数据切分方式，是比较模型的基本前提。

## 到底选哪个指标

可以先用下面这张判断表：

| 你最想知道什么 | 优先关注 |
| --- | --- |
| 平均会差多少，且要容易解释 | MAE |
| 严重大错需要被额外惩罚 | RMSE 或 MSE |
| 模型相对均值基线有没有价值 | R² |
| 要完整了解模型行为 | MAE + RMSE + R² 一起看 |

例如预测快递到达时间时，MAE 能说明平均偏差几分钟；如果“晚到一小时”会造成严重损失，则还应重点看 RMSE 和最差样本。指标不是排行榜，而是把业务担心的事情翻译成一个可比较的数字。

## 两个高频误区

### 用训练集分数证明模型好

训练集本来就是模型用于学习的数据。只有在验证集或测试集上计算的分数，才更接近模型面对新数据时的表现。

### 跨数据集比较误差绝对值

一个模型在“房价单位是万元”的数据上 MAE 为 5，另一个在“房价单位是元”的数据上 MAE 为 50000，不能直接比大小。目标单位、样本范围和测试集不同，指标没有可比性。

## 课后练习

把上面的 `y_pred` 最后一个值从 `191` 改为 `220`，重新运行。观察 MAE 和 RMSE 哪一个变化更明显，再解释为什么。

## 本课总结

- MAE 最容易解释平均偏差；
- MSE 会强烈放大大错误；
- RMSE 回到原始单位，同时仍重视大错误；
- R² 用来判断模型相对均值基线的解释能力；
- 评估必须基于未参与训练的、可比较的数据。

下一课我们切换到分类任务：逻辑回归为什么名字里有“回归”，却能判断用户会不会流失？
