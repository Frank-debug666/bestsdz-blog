---
title: 保存与加载文本分类模型：让预测可以复用
description: 学会保存完整 Pipeline、标签信息和项目元数据，让文本分类模型不只停留在 notebook 里。
cover: /images/covers/save-load-text-classification-model-video.jpg
coverAlt: 训练好的文本分类 Pipeline 被保存成模型文件，再加载用于新文本预测。
pubDate: 2026-07-01T09:20:00+08:00
tags: [机器学习, NLP, 模型保存, joblib, 文本分类]
---

模型训练出来以后，如果每次预测都要重新训练一遍，就还没有进入真实项目状态。

真实项目更常见的流程是：训练一次，保存下来；下次启动程序时加载模型，直接对新文本做预测。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/save-load-text-classification-model-video.jpg" aria-label="第 41 课：保存与加载文本分类模型">
    <source src="/videos/lesson-41-save-load-text-classification-model.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 41 课视频 · 保存与加载文本分类模型：让预测可以复用</figcaption>
</figure>

## 要保存什么

文本分类项目里，最容易犯的错误是只保存分类器：

```python
joblib.dump(model, "model.joblib")
```

这通常不够。因为模型依赖前面的 TF-IDF 词表和 IDF 权重。

更稳的做法是保存完整 Pipeline：

```text
TfidfVectorizer
  + LogisticRegression
  = text_classifier_pipeline.joblib
```

这样加载后，模型知道应该用哪套词表、哪套参数、哪种特征空间。

## 保存完整 Pipeline

假设上一课已经训练好了 `pipe`：

```python
import joblib

joblib.dump(pipe, "text_classifier_pipeline.joblib")
```

保存成功后，会得到一个模型文件。它里面包含：

1. TF-IDF 的词表；
2. IDF 权重；
3. 模型参数；
4. Pipeline 步骤顺序。

这比把向量化器和模型分开保存更不容易出错。

## 加载模型并预测

加载时很简单：

```python
loaded_pipe = joblib.load("text_classifier_pipeline.joblib")
```

然后对新文本预测：

```python
new_texts = [
    cut_text("这篇文章讲得很清楚"),
    cut_text("软件一直闪退，完全没法用"),
]

pred = loaded_pipe.predict(new_texts)
print(pred)
```

这里仍然要注意：如果训练阶段输入的是分词后的文本，预测阶段也要先分词。

## 封装成可复用函数

可以把加载和预测写成函数：

```python
import joblib

MODEL_PATH = "text_classifier_pipeline.joblib"

def load_model():
    return joblib.load(MODEL_PATH)

def predict_texts(model, texts):
    cut_texts = [cut_text(text) for text in texts]
    return model.predict(cut_texts)

model = load_model()
labels = predict_texts(model, ["这个功能很好用"])
print(labels)
```

这样以后无论是命令行、网页接口，还是 Streamlit 页面，都可以复用这套逻辑。

## 如果想输出置信度

很多分类器支持 `predict_proba()`：

```python
proba = loaded_pipe.predict_proba(new_texts)
print(proba)
```

它会输出每个类别的概率估计。

不过要记住：概率不一定等于真实可信度。尤其是数据少、类别不平衡、模型没校准时，概率只能作为参考。

## 保存标签和元数据

除了模型文件，建议额外保存一份元数据：

```python
import json

meta = {
    "model_name": "tfidf_logistic_regression",
    "version": "v1.0",
    "labels": list(loaded_pipe.classes_),
    "created_at": "2026-07-01",
    "text_format": "jieba_cut_with_space",
}

with open("model_meta.json", "w", encoding="utf-8") as f:
    json.dump(meta, f, ensure_ascii=False, indent=2)
```

元数据能帮你在几个月后快速知道：这个模型是谁训练的、用的什么输入格式、支持哪些标签。

## 常见踩坑

### 只保存模型，没保存向量化器

预测时会丢失词表，导致新文本无法转成和训练时一致的特征。

### 训练和预测分词规则不同

训练时用 jieba，预测时直接传原句，模型效果会明显不稳定。

### 路径写死

本地能跑，部署到服务器后找不到文件。建议统一使用配置项或相对项目根目录的路径。

### 依赖版本变化

`joblib` 保存的是 Python 对象。跨环境加载时，最好记录 scikit-learn、jieba、Python 的版本。

```python
import sklearn
import jieba
import sys

print(sys.version)
print(sklearn.__version__)
```

## 一个最小目录结构

实际项目可以这样组织：

```text
text-classifier/
  train.py
  predict.py
  models/
    text_classifier_pipeline.joblib
    model_meta.json
```

`train.py` 负责训练并保存模型，`predict.py` 负责加载模型并预测。

这样代码职责会更清楚。

## 这一课先记住

文本分类模型要能复用，保存的重点不是“分类器对象”，而是“完整预测链路”。

更稳的顺序是：

```text
训练 Pipeline
  -> 评估效果
  -> 保存完整 Pipeline
  -> 保存标签和元数据
  -> 加载模型
  -> 对新文本预测
```

到这里，中文文本分类项目已经形成闭环。下一阶段我们回到 PyTorch，理解模型训练背后的自动微分机制。
