---
title: Tensorflow——对电影评论进行分类
date: 2017-08-07 10:23
categories: 技术
tags: [tensorflow,python] 
---

### 前言
本文整理自[TensorFlow练习1: 对评论进行分类][1]，修改了原文代码中的一些bug，重构了一下代码，并添加了一些注释，最后还添加了如何使用训练后的模型进行预测，希望对初学者有一定的帮助。原作者的[博客][2]中还有很多tensorflow相关的练习，大家可以多多关注一下，感谢作者的分享。

### 数据集
本例子是对电影评论作分类，分为正面的评论和负面的评论。原文中提供了两份数据集：

 - [neg.txt：5331条负面电影评论][3]
 - [pos.txt：5331条正面电影评论][4]

### 第三方包

 - numpy
 - tensorflow
 - pickle
 - nltk

### 创建词汇表
把数据集中的数据通过中文分词，分解出每一个单词，作词形还原，例如复数单词还原为原单词（cats->cat），过滤出现频率过高和过低的单词，最后以列表形式返回：
``` python
# 创建词汇表
def create_lexicon(p_file, n_file):
    result_lex = []

    # 读取文件
    def process_file(txtfile):
        with open(txtfile, 'r') as f:
            arr = []
            lines = f.readlines()
            # print(lines)
            for line in lines:
                words = word_tokenize(line.lower())
                arr += words
            return arr

    # 分词
    result_lex += process_file(p_file)
    result_lex += process_file(n_file)
    # print(len(result_lex))
    # 词形还原(cats->cat)
    lemmatizer = WordNetLemmatizer()
    result_lex = [lemmatizer.lemmatize(word) for word in result_lex]
    # 统计词出现次数
    word_count = Counter(result_lex)
    # print(word_count)
    # 去掉不常用的词
    result_lex = []
    for word in word_count:
        num = word_count[word]
        if 2000 > num > 20:
            result_lex.append(word)
    # print(len(result_lex))
    return result_lex
```

### 准备特征集
把每条评论转换为向量, 转换原理：假设词汇表为['woman', 'great', 'feel', 'actually', 'looking', 'latest', 'seen', 'is'] 当然实际上要大的多。例如：评论'i think this movie is great' 转换为 [0,1,0,0,0,0,0,1],把评论中出现的字在词汇表中标记，出现过的标记为1，其余标记为0：
``` python
# lex:词汇表；review:评论
def word_to_vector(_lex, review):
    words = word_tokenize(review.lower())
    lemmatizer = WordNetLemmatizer()
    words = [lemmatizer.lemmatize(word) for word in words]
    features = np.zeros(len(_lex))
    for word in words:
        if word in _lex:
            features[_lex.index(word)] = 1
    return features
```

### 把数据集转换为特征集
调用上述方法把数据集中的每条评论转换为向量，并在最后拼接分类，标识该条评论是正面还是负面：
``` python
# 将所有评论转换为向量，并拼接评论的的分类
def normalize_dataset(inner_lex):
    ds = []

    # [0,1]代表负面评论 [1,0]代表正面评论，拼接到向量后
    with open(pos_file, 'r') as f:
        lines = f.readlines()
        for line in lines:
            one_sample = [word_to_vector(inner_lex, line), [1, 0]]
            ds.append(one_sample)
    with open(neg_file, 'r') as f:
        lines = f.readlines()
        for line in lines:
            one_sample = [word_to_vector(inner_lex, line), [0, 1]]
            ds.append(one_sample)

    # print(len(ds))
    return ds
```

### 整理数据
通过上述的步骤，我们已经创建了词汇表和把词汇表转换为向量，这时我们可以把结果保存起来，方便以后的调用，该方法可以保存数据或者重新加载数据：
``` python
# 整理数据
def clear_up(has_dataset):
    if not has_dataset:
        # 词典：文本中出现过的单词
        _lex = create_lexicon(pos_file, neg_file)
        # 词典转换为向量
        ds = normalize_dataset(_lex)
        random.shuffle(ds)
        # 把整理好的数据保存到文件，方便使用。到此完成了数据的整理工作
        with open('lex.pickle', 'wb') as f:
            pickle.dump(_lex, f)
        with open('dataset.pickle', 'wb') as f:
            pickle.dump(ds, f)
    else:
        _lex = pickle.load(open('lex.pickle', 'rb'))
        ds = pickle.load(open('dataset.pickle', 'rb'))
    return _lex, ds
```

### 定义待训练的神经网络
定义前馈神经网络，每添加一个层，需要有输入， 参数权重，偏置，以及最后的输出， 当然还有激励函数：
``` python
# 定义待训练的神经网络
def neural_network(_lex, data):
    # 输入层
    n_input_layer = len(_lex)
    # hide layer(隐藏层)听着很神秘，其实就是除输入输出层外的中间层
    n_layer_1 = 2000
    n_layer_2 = 2000
    # 输出层
    n_output_layer = 2

    # 定义第一层"神经元"的权重和偏移量
    layer_1_w_b = {'w_': tf.Variable(tf.random_normal([n_input_layer, n_layer_1])),
                   'b_': tf.Variable(tf.random_normal([n_layer_1]))}
    # 定义第二层"神经元"的权重和偏移量
    layer_2_w_b = {'w_': tf.Variable(tf.random_normal([n_layer_1, n_layer_2])),
                   'b_': tf.Variable(tf.random_normal([n_layer_2]))}
    # 定义输出层"神经元"的权重和偏移量
    layer_output_w_b = {'w_': tf.Variable(tf.random_normal([n_layer_2, n_output_layer])),
                        'b_': tf.Variable(tf.random_normal([n_output_layer]))}

    # w*x + b
    layer_1 = tf.add(tf.matmul(data, layer_1_w_b['w_']), layer_1_w_b['b_'])
    layer_1 = tf.nn.relu(layer_1)  # 激活函数
    layer_2 = tf.add(tf.matmul(layer_1, layer_2_w_b['w_']), layer_2_w_b['b_'])
    layer_2 = tf.nn.relu(layer_2)  # 激活函数
    layer_output = tf.add(tf.matmul(layer_2, layer_output_w_b['w_']), layer_output_w_b['b_'])

    return layer_output
```

### 使用数据训练神经网络
使用整理好的数据训练神经网络，最后保存模型：
``` python
# 使用数据训练神经网络
def train_neural_network(has_dataset):
    _lex, _dataset = clear_up(has_dataset)
    _dataset = np.array(_dataset)
    x = tf.placeholder('float', [None, len(_dataset[0][0])])
    y = tf.placeholder('float')

    # 每次使用50条数据进行训练
    batch_size = 50

    predict = neural_network(_lex, x)
    cost_func = tf.reduce_mean(tf.nn.softmax_cross_entropy_with_logits(logits=predict, labels=y))
    optimizer = tf.train.AdamOptimizer().minimize(cost_func)  # learning rate 默认 0.001

    epochs = 10
    with tf.Session() as session:
        saver = tf.train.Saver()
        session.run(tf.global_variables_initializer())
        train_x = _dataset[:, 0]
        train_y = _dataset[:, 1]
        for epoch in range(epochs):
            i = 0
            epoch_loss = 0
            while i < len(train_x):
                start = i
                end = i + batch_size
                batch_x = train_x[start:end]
                batch_y = train_y[start:end]
                _, c = session.run([optimizer, cost_func], feed_dict={x: list(batch_x), y: list(batch_y)})
                epoch_loss += c
                i += batch_size
            print(epoch, ' : ', epoch_loss)  #

        text_x = _dataset[:, 0]
        text_y = _dataset[:, 1]
        correct = tf.equal(tf.argmax(predict, 1), tf.argmax(y, 1))
        accuracy = tf.reduce_mean(tf.cast(correct, 'float'))
        print('准确率: ', accuracy.eval({x: list(text_x), y: list(text_y)}))
        # 保存session
        saver.save(session, './model.ckpt')
```

### 使用模型预测
把评论字符串转换为向量，调用保存的模型，进行预测，[0]为正面评论，\[1]为负面评论：
``` python 
# 使用模型预测
def prediction(text):
    _lex = pickle.load(open('lex.pickle', 'rb'))
    x = tf.placeholder('float')
    predict = neural_network(_lex, x)
    with tf.Session() as session:
        session.run(tf.global_variables_initializer())
        saver = tf.train.Saver()
        saver.restore(session, 'model.ckpt')
        features = word_to_vector(_lex, text)
        res = session.run(tf.argmax(predict.eval(feed_dict={x: [features]}), 1))
        return res
```

### 结果
训练的结果：
``` log
0  :  154066.731888
1  :  54634.1575928
2  :  28382.4827766
3  :  50698.829367
4  :  23948.3449777
5  :  9888.94352563
6  :  3610.13648503
7  :  1088.47069195
8  :  809.218485014
9  :  868.404643207
准确率:  0.975239
```
预测的结果：
``` python
print(prediction("very good")) # [0]
print(prediction("very bad")) # [1]
```

### 完整代码
``` python
import os
import numpy as np
import tensorflow as tf
import random
import pickle
from collections import Counter
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

pos_file = 'pos.txt'
neg_file = 'neg.txt'


# 创建词汇表
def create_lexicon(p_file, n_file):
    result_lex = []

    # 读取文件
    def process_file(txtfile):
        with open(txtfile, 'r') as f:
            arr = []
            lines = f.readlines()
            # print(lines)
            for line in lines:
                words = word_tokenize(line.lower())
                arr += words
            return arr

    # 分词
    result_lex += process_file(p_file)
    result_lex += process_file(n_file)
    # print(len(result_lex))
    # 词形还原(cats->cat)
    lemmatizer = WordNetLemmatizer()
    result_lex = [lemmatizer.lemmatize(word) for word in result_lex]
    # 统计词出现次数
    word_count = Counter(result_lex)
    # print(word_count)
    # 去掉不常用的词
    result_lex = []
    for word in word_count:
        num = word_count[word]
        if 2000 > num > 20:
            result_lex.append(word)
    # print(len(result_lex))
    return result_lex


# 把每条评论转换为向量, 转换原理：
# 假设lex为['woman', 'great', 'feel', 'actually', 'looking', 'latest', 'seen', 'is'] 当然实际上要大的多
# 评论'i think this movie is great' 转换为 [0,1,0,0,0,0,0,1], 把评论中出现的字在lex中标记，出现过的标记为1，其余标记为0
# lex:词汇表；review:评论
def word_to_vector(_lex, review):
    words = word_tokenize(review.lower())
    lemmatizer = WordNetLemmatizer()
    words = [lemmatizer.lemmatize(word) for word in words]
    features = np.zeros(len(_lex))
    for word in words:
        if word in _lex:
            features[_lex.index(word)] = 1
    return features


# 将所有评论转换为向量，并拼接评论的的分类
def normalize_dataset(inner_lex):
    ds = []

    # [0,1]代表负面评论 [1,0]代表正面评论，拼接到向量后
    with open(pos_file, 'r') as f:
        lines = f.readlines()
        for line in lines:
            one_sample = [word_to_vector(inner_lex, line), [1, 0]]
            ds.append(one_sample)
    with open(neg_file, 'r') as f:
        lines = f.readlines()
        for line in lines:
            one_sample = [word_to_vector(inner_lex, line), [0, 1]]
            ds.append(one_sample)

    # print(len(ds))
    return ds


# 整理数据
def clear_up(has_dataset):
    if not has_dataset:
        # 词典：文本中出现过的单词
        _lex = create_lexicon(pos_file, neg_file)
        # 词典转换为向量
        ds = normalize_dataset(_lex)
        random.shuffle(ds)
        # 把整理好的数据保存到文件，方便使用。到此完成了数据的整理工作
        with open('lex.pickle', 'wb') as f:
            pickle.dump(_lex, f)
        with open('dataset.pickle', 'wb') as f:
            pickle.dump(ds, f)
    else:
        _lex = pickle.load(open('lex.pickle', 'rb'))
        ds = pickle.load(open('dataset.pickle', 'rb'))
    return _lex, ds


# 定义待训练的神经网络
def neural_network(_lex, data):
    # 输入层
    n_input_layer = len(_lex)
    # hide layer(隐藏层)听着很神秘，其实就是除输入输出层外的中间层
    n_layer_1 = 2000
    n_layer_2 = 2000
    # 输出层
    n_output_layer = 2

    # 定义第一层"神经元"的权重和偏移量
    layer_1_w_b = {'w_': tf.Variable(tf.random_normal([n_input_layer, n_layer_1])),
                   'b_': tf.Variable(tf.random_normal([n_layer_1]))}
    # 定义第二层"神经元"的权重和偏移量
    layer_2_w_b = {'w_': tf.Variable(tf.random_normal([n_layer_1, n_layer_2])),
                   'b_': tf.Variable(tf.random_normal([n_layer_2]))}
    # 定义输出层"神经元"的权重和偏移量
    layer_output_w_b = {'w_': tf.Variable(tf.random_normal([n_layer_2, n_output_layer])),
                        'b_': tf.Variable(tf.random_normal([n_output_layer]))}

    # w*x + b
    layer_1 = tf.add(tf.matmul(data, layer_1_w_b['w_']), layer_1_w_b['b_'])
    layer_1 = tf.nn.relu(layer_1)  # 激活函数
    layer_2 = tf.add(tf.matmul(layer_1, layer_2_w_b['w_']), layer_2_w_b['b_'])
    layer_2 = tf.nn.relu(layer_2)  # 激活函数
    layer_output = tf.add(tf.matmul(layer_2, layer_output_w_b['w_']), layer_output_w_b['b_'])

    return layer_output


# 使用数据训练神经网络
def train_neural_network(has_dataset):
    _lex, _dataset = clear_up(has_dataset)
    _dataset = np.array(_dataset)
    x = tf.placeholder('float', [None, len(_dataset[0][0])])
    y = tf.placeholder('float')

    # 每次使用50条数据进行训练
    batch_size = 50

    predict = neural_network(_lex, x)
    cost_func = tf.reduce_mean(tf.nn.softmax_cross_entropy_with_logits(logits=predict, labels=y))
    optimizer = tf.train.AdamOptimizer().minimize(cost_func)  # learning rate 默认 0.001

    epochs = 10
    with tf.Session() as session:
        saver = tf.train.Saver()
        session.run(tf.global_variables_initializer())
        train_x = _dataset[:, 0]
        train_y = _dataset[:, 1]
        for epoch in range(epochs):
            i = 0
            epoch_loss = 0
            while i < len(train_x):
                start = i
                end = i + batch_size
                batch_x = train_x[start:end]
                batch_y = train_y[start:end]
                _, c = session.run([optimizer, cost_func], feed_dict={x: list(batch_x), y: list(batch_y)})
                epoch_loss += c
                i += batch_size
            print(epoch, ' : ', epoch_loss)  #

        text_x = _dataset[:, 0]
        text_y = _dataset[:, 1]
        correct = tf.equal(tf.argmax(predict, 1), tf.argmax(y, 1))
        accuracy = tf.reduce_mean(tf.cast(correct, 'float'))
        print('准确率: ', accuracy.eval({x: list(text_x), y: list(text_y)}))
        # 保存session
        saver.save(session, './model.ckpt')


# 使用模型预测
def prediction(text):
    _lex = pickle.load(open('lex.pickle', 'rb'))
    x = tf.placeholder('float')
    predict = neural_network(_lex, x)
    with tf.Session() as session:
        session.run(tf.global_variables_initializer())
        saver = tf.train.Saver()
        saver.restore(session, 'model.ckpt')
        features = word_to_vector(_lex, text)
        res = session.run(tf.argmax(predict.eval(feed_dict={x: [features]}), 1))
        return res


if __name__ == "__main__":
    # 训练模型
    train_neural_network(False)
    # 预测结果
    # print(prediction("very good"))

```

  [1]: http://blog.topspeedsnail.com/archives/10399
  [2]: http://blog.topspeedsnail.com/
  [3]: http://blog.topspeedsnail.com/wp-content/uploads/2016/11/neg.txt
  [4]: http://blog.topspeedsnail.com/wp-content/uploads/2016/11/pos.txt