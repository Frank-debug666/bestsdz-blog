---
title: 计算机怎样读取中文文本：编码、清洗与标准化
description: 进入中文文本分类前，先理解文本文件编码、乱码、空白符、标点、大小写和基础清洗规则。
pubDate: 2026-07-04T10:20:00+08:00
tags: [NLP, 文本分类, 中文文本, 数据清洗, 编码]
---

文本分类项目看起来是在训练模型，但第一步其实不是模型，而是让计算机正确读取文本。

如果一开始就乱码、混入奇怪符号、空白不统一，后面的分词、TF-IDF 和模型训练都会受到影响。

这一课先解决一个基础问题：**中文文本进入模型之前，应该怎样读取、清洗和标准化**。

## 文本在计算机里是什么

人看到的是一句话：

```text
这个课程讲得很清楚。
```

计算机看到的是一串编码后的数字。编码规则决定了这些数字怎样还原成文字。

如果保存文件时用一种编码，读取时却用另一种编码，就可能出现乱码。

常见编码包括：

| 编码 | 说明 |
| --- | --- |
| UTF-8 | 最推荐，跨平台最常用 |
| GBK | 中文 Windows 老文件常见 |
| UTF-8 with BOM | 带特殊文件头，某些工具会受影响 |

初学阶段建议统一使用 UTF-8。

## 读取 CSV 时先指定编码

Pandas 读取中文 CSV 时，可以显式指定编码：

```python
import pandas as pd

df = pd.read_csv("data.csv", encoding="utf-8")
```

如果出现乱码，可以尝试：

```python
df = pd.read_csv("data.csv", encoding="gbk")
```

不要看到报错就直接换模型。很多 NLP 项目的第一个问题，其实是文件读取阶段就错了。

## 先检查文本列

读取数据后，先看几行文本：

```python
print(df.head())
print(df["text"].head(10))
```

再看缺失值：

```python
print(df["text"].isna().sum())
print(df["label"].isna().sum())
```

文本列为空、标签为空、标签写法不统一，都会影响训练。

## 最小清洗流程

初学阶段可以先写一个简单清洗函数：

```python
import re

def clean_text(text):
    text = str(text)
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    return text

df["text_clean"] = df["text"].apply(clean_text)
```

这段代码做了三件事：

1. 把输入转成字符串；
2. 去掉首尾空白；
3. 把多个空格、换行、制表符合并成一个空格。

不要一开始就写很复杂的清洗规则。先保证基础一致，再根据错分样本逐步补规则。

## 要不要删除标点

这取决于任务。

如果是情感分析，感叹号、问号可能有价值：

```text
太好用了！！！
```

如果是主题分类，很多标点可能只是噪声。

所以不要机械地“全部删除标点”。更稳的做法是：

1. 先保留标点训练一个 baseline；
2. 再尝试删除或统一部分标点；
3. 用验证集指标比较效果。

## 中文里的全角和半角

中文文本里常见全角符号：

```text
ＡＢＣ１２３，。！？　
```

英文和数字也可能有全角形式。为了减少同义不同形的问题，可以做全角转半角。

```python
def fullwidth_to_halfwidth(text):
    result = []
    for char in text:
        code = ord(char)
        if code == 0x3000:
            code = 32
        elif 0xFF01 <= code <= 0xFF5E:
            code -= 0xFEE0
        result.append(chr(code))
    return "".join(result)
```

这个函数可以把全角英数字和常见符号转成半角形式。

## 要不要统一大小写

中文本身没有大小写，但中文文本里经常混入英文、产品名、网址、变量名。

是否统一小写，要看任务：

- 普通用户评论分类：可以考虑统一小写；
- 代码、品牌、专有名词分类：不要轻易改大小写。

比如 `Apple` 和 `apple` 在某些任务里含义可能不同。

## 标签也要清洗

很多人只清洗文本，忘了标签。

标签列可能出现：

```text
正面
正面 
 正面
positive
POS
```

这些对人来说可能是同一类，对模型来说却是不同标签。

可以先查看唯一值：

```python
print(df["label"].value_counts())
```

再做统一映射：

```python
label_map = {
    "正面": "positive",
    "positive": "positive",
    "POS": "positive",
    "负面": "negative",
    "negative": "negative",
}

df["label_clean"] = df["label"].astype(str).str.strip().map(label_map)
```

标签混乱会直接污染训练目标，必须提前处理。

## 一个基础预处理模板

下面是一个适合初学者的最小模板：

```python
import re
import pandas as pd

def fullwidth_to_halfwidth(text):
    result = []
    for char in str(text):
        code = ord(char)
        if code == 0x3000:
            code = 32
        elif 0xFF01 <= code <= 0xFF5E:
            code -= 0xFEE0
        result.append(chr(code))
    return "".join(result)

def clean_text(text):
    text = fullwidth_to_halfwidth(text)
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    return text

df = pd.read_csv("data.csv", encoding="utf-8")
df = df.dropna(subset=["text", "label"])
df["text_clean"] = df["text"].apply(clean_text)
df["label_clean"] = df["label"].astype(str).str.strip()
```

这不是万能清洗规则，但足够作为第一版 baseline 的输入。

## 清洗不要过度

过度清洗可能会删掉有用信息。

例如：

- 删除所有数字，可能丢掉价格、日期、版本号；
- 删除所有英文，可能丢掉产品名；
- 删除所有标点，可能丢掉情绪强度；
- 删除停用词，可能误删否定词。

所以清洗规则应该随着评估结果和错分样本逐步调整。

## 这一课先记住

中文文本分类进入分词之前，至少要检查：

```text
文件编码是否正确
文本列是否为空
标签是否统一
空白符是否混乱
全角半角是否需要转换
清洗规则是否过度
```

下一课再进入中文分词，看看 jieba 到底怎样把一句话切成模型可以使用的词。
