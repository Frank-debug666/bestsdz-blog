---
title: 用 Streamlit 给文本分类模型做一个演示页面
description: 把已经训练好的文本分类 Pipeline 接到 Streamlit 页面里，完成输入文本、预测类别和查看置信度的交互演示。
cover: /images/covers/streamlit-text-classification-demo-video.jpg
coverAlt: Streamlit 文本分类演示页面课程视频封面，展示模型加载、文本输入和预测结果展示流程。
pubDate: 2026-07-04T10:40:00+08:00
tags: [机器学习, NLP, Streamlit, 文本分类, 模型部署]
---

文本分类模型训练好以后，如果只能在 notebook 里运行，就很难给别人演示。

这一课不做正式部署，只做一个本地交互页面：输入一段中文文本，点击按钮，页面显示模型预测结果。

我们用 Streamlit，是因为它适合快速把 Python 脚本变成演示页面。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/streamlit-text-classification-demo-video.jpg" aria-label="第 42 课：Streamlit 文本分类演示页面">
    <source src="/videos/lesson-42a-streamlit-text-classification-demo.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 42 课视频 - 用 Streamlit 给文本分类模型做一个演示页面</figcaption>
</figure>

## 本课目标

假设你已经有一个保存好的 Pipeline：

```text
models/text_classifier_pipeline.joblib
```

它包含：

- TF-IDF 向量化器；
- 分类模型；
- 训练阶段的特征处理流程。

这节课要做的是：

```text
加载模型
  -> 输入文本
  -> 分词或清洗
  -> 调用 predict
  -> 在页面展示结果
```

## 安装 Streamlit

先安装：

```bash
pip install streamlit joblib jieba scikit-learn
```

如果你的模型训练时用到了别的库，也要在当前环境里安装同样依赖。

## 推荐目录结构

可以先用这个最小结构：

```text
text-classifier-demo/
  app.py
  models/
    text_classifier_pipeline.joblib
```

`app.py` 是页面入口，`models` 目录放模型文件。

## 写一个最小页面

先创建 `app.py`：

```python
import streamlit as st

st.set_page_config(
    page_title="中文文本分类演示",
    page_icon="🧠",
)

st.title("中文文本分类演示")
st.write("输入一段文本，查看模型预测类别。")

text = st.text_area("请输入文本", height=160)

if st.button("开始预测"):
    if not text.strip():
        st.warning("请先输入文本")
    else:
        st.success("这里显示预测结果")
```

运行：

```bash
streamlit run app.py
```

如果页面能打开，说明 Streamlit 基础环境没问题。

## 加载模型

接着加载模型：

```python
from pathlib import Path
import joblib
import streamlit as st

MODEL_PATH = Path("models/text_classifier_pipeline.joblib")

@st.cache_resource
def load_model():
    return joblib.load(MODEL_PATH)

model = load_model()
```

这里用了 `@st.cache_resource`，作用是让模型只加载一次。否则页面每次刷新或交互都重新加载，会变慢。

## 加入文本预处理

如果你的 Pipeline 输入的是原始文本，可以直接传入原句。

如果你的 Pipeline 输入的是分词后的文本，就要保持和训练阶段一致：

```python
import jieba

def cut_text(text):
    return " ".join(jieba.lcut(str(text)))
```

预测时：

```python
input_text = cut_text(text)
pred = model.predict([input_text])[0]
```

训练和预测的预处理必须一致。否则模型看到的特征空间会变。

## 完整预测代码

把页面和模型合起来：

```python
from pathlib import Path

import jieba
import joblib
import streamlit as st

MODEL_PATH = Path("models/text_classifier_pipeline.joblib")

st.set_page_config(page_title="中文文本分类演示")
st.title("中文文本分类演示")
st.caption("输入中文文本，查看模型预测类别。")

@st.cache_resource
def load_model():
    return joblib.load(MODEL_PATH)

def cut_text(text):
    return " ".join(jieba.lcut(str(text)))

model = load_model()

text = st.text_area("请输入文本", height=180)

if st.button("开始预测"):
    if not text.strip():
        st.warning("请先输入文本")
    else:
        input_text = cut_text(text)
        label = model.predict([input_text])[0]
        st.success(f"预测类别：{label}")
```

这就是一个最小可运行版本。

## 如果模型支持置信度

有些模型支持 `predict_proba()`：

```python
if hasattr(model, "predict_proba"):
    proba = model.predict_proba([input_text])[0]
    classes = model.classes_
    scores = dict(zip(classes, proba))
    st.write(scores)
```

可以用表格展示：

```python
import pandas as pd

score_df = pd.DataFrame({
    "类别": classes,
    "概率": proba,
}).sort_values("概率", ascending=False)

st.dataframe(score_df, use_container_width=True)
```

注意：概率不一定等于真实可信度。它只是模型的输出分布，仍然要结合测试集评估。

## 增加错误提示

模型文件不存在时，不要让页面直接崩掉：

```python
if not MODEL_PATH.exists():
    st.error("没有找到模型文件，请先训练并保存模型。")
    st.stop()
```

这样别人打开页面时，也能知道问题出在哪里。

## Streamlit 演示不是正式部署

这一课只把模型做成演示页面，不等于正式线上服务。

正式部署还要考虑：

- 依赖文件如何管理；
- 模型文件如何上传；
- 多用户同时访问；
- 日志和异常处理；
- 输入长度限制；
- 敏感内容过滤；
- API 鉴权和安全。

所以这里先把交互跑通，后面再进入工程化部署。

## 常见错误

### 模型路径写错

本地运行时相对路径以命令执行目录为准。建议用 `Path` 管理路径。

### 预测前忘记分词

如果训练时使用的是分词后的文本，页面输入也要走同样分词。

### 模型和依赖版本不一致

`joblib` 加载模型依赖 Python 对象结构。训练环境和演示环境里的 scikit-learn 版本差异太大，可能加载失败。

### 页面显示概率但不解释含义

概率只是模型估计，不代表一定正确。不要在页面上写成“准确率”。

## 这一课先记住

Streamlit 的价值是快速演示：

```text
输入文本
  -> 加载模型
  -> 复用训练时的预处理
  -> predict
  -> 展示结果
```

它适合教学、验证和内部演示。正式部署还需要 API、日志、安全和环境管理。

下一阶段我们回到 PyTorch，先补 Tensor 进阶操作，再理解自动微分和计算图。
