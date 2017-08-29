---
title: 神经网络识别手写数字：数据集长什么样
date: 2017-08-09 14:30
categories: 技术
tags: [tensorflow,python] 
---

## 介绍
当我们开始学习编程的时候，第一件事往往是学习打印`Hello World!`。而MNIST是一个入门级的计算机视觉数据集就是深度学习中的`Hello World`，MNIST是一个入门级的计算机视觉数据集，它包含各种手写数字图片：

![此处输入图片的描述][1]

它也包含每一张图片对应的标签，告诉我们这个是数字几。比如，上面这四张图片的标签分别是5，0，4，1。
数据集下载地址：[http://yann.lecun.com/exdb/mnist/][2]
数据集内容：

 - train-images-idx3-ubyte  训练数据图像  (60,000)
 - train-labels-idx1-ubyte    训练数据label
 - t10k-images-idx3-ubyte   测试数据图像  (10,000)
 - t10k-labels-idx1-ubyte     测试数据label

每一张图片包含28像素X28像素。我们可以用一个数字数组来表示这张图片：

![此处输入图片的描述][3]
 
我们的任务就是训练一个机器学习模型用于预测图片里面的数字。

## 问题
一切看起来很美好，但当我下载完数据集后一看，傻眼了：

![此处输入图片的描述][4]

说好的图像呢，说好的标签呢。原来，为了方便解析，数据集被保存为二进制的格式，并不是我们熟悉的图片格式和文本格式，因此我们不能直观的看到它到底长什么样。对于初学者来说，神经网络已经是一个很玄的东西了，现在连数据集都是个黑盒子，让人怎么入门呢。本着眼见为实的精神，我决定使用Python把数据集还原为原始的格式。

## 解决
主要使用`struct`读取二进制文件，然后保存为相应格式的文件。
使用到的包：

- struct
- numpy
- PIL
- os
- shutil

### 转换图片
``` python
# 转换图片
def read_image(file_name, output_name, num=-1):
    if os.path.exists(output_name):
        shutil.rmtree(output_name)
    os.makedirs(output_name)
    # 二进制的形式读入
    filename = file_name
    binfile = open(filename, 'rb')
    buf = binfile.read()
    # 大端法读入 4 个 unsigned int32
    # struct 用法参见网站 http://www.cnblogs.com/gala/archive/2011/09/22/2184801.html
    index = 0
    magic, num_images, num_rows, num_columns = struct.unpack_from('>IIII', buf, index)
    index += struct.calcsize('>IIII')
    num_images = num_images if num == -1 else num
    # 将每张图片按照格式存储到对应位置
    for image in range(0, num_images):
        im = struct.unpack_from('>784B', buf, index)
        index += struct.calcsize('>784B')
        # 这里注意 Image 对象的 dtype 是 uint8，需要转换
        im = np.array(im, dtype='uint8')
        im = im.reshape(28, 28)
        im = Image.fromarray(im)
        im.save('%s/%s_%s.bmp' % (output_name, output_name, image), 'bmp')
```
因为训练图片有60000张，于是加入一个参数指定转换多少张，并不一定要全部转换。
``` python
read_image('data/train-images.idx3-ubyte', 'train', 10)
```
执行上面的代码，会在当前目录新建一个`train`目录，里面有前10张图片：

![此处输入图片的描述][5]

### 转换标签
``` python
# 转换 label
def read_label(filename, save_filename):
    f = open(filename, 'rb')
    index = 0
    buf = f.read()
    f.close()
    magic, labels = struct.unpack_from('>II', buf, index)
    index += struct.calcsize('>II')
    label_arr = [0] * labels
    for x in range(0, labels):
        label_arr[x] = int(struct.unpack_from('>B', buf, index)[0])
        index += struct.calcsize('>B')
    save = open(save_filename, 'w')
    save.write(','.join(map(lambda n: str(n), label_arr)))
    save.write('\n')
    save.close()
    print('save labels success')
```
标签转换相对比较简单，只需读取二进制文件并转存为txt即可。
``` python
read_label('data/train-labels.idx1-ubyte', 'train_labels.txt')
```
执行上面的代码，会在当前目录生成一个`train_labels.txt`，里面就是所有图片对应的数字：

![此处输入图片的描述][6]

看到图片和标签，可以直观的看到图片和数字是如何对应的，非常有助于理解后面机器学习的算法。

### [全部代码][7]
``` python
import struct
import numpy as np
from PIL import Image
import os
import shutil


# 转换图片
def read_image(file_name, output_name, num=-1):
    if os.path.exists(output_name):
        shutil.rmtree(output_name)
    os.makedirs(output_name)
    # 二进制的形式读入
    filename = file_name
    binfile = open(filename, 'rb')
    buf = binfile.read()
    # 大端法读入 4 个 unsigned int32
    # struct 用法参见网站 http://www.cnblogs.com/gala/archive/2011/09/22/2184801.html
    index = 0
    magic, num_images, num_rows, num_columns = struct.unpack_from('>IIII', buf, index)
    index += struct.calcsize('>IIII')
    num_images = num_images if num == -1 else num
    # 将每张图片按照格式存储到对应位置
    for image in range(0, num_images):
        im = struct.unpack_from('>784B', buf, index)
        index += struct.calcsize('>784B')
        # 这里注意 Image 对象的 dtype 是 uint8，需要转换
        im = np.array(im, dtype='uint8')
        im = im.reshape(28, 28)
        im = Image.fromarray(im)
        im.save('%s/%s_%s.bmp' % (output_name, output_name, image), 'bmp')


# 转换 label
def read_label(filename, save_filename):
    f = open(filename, 'rb')
    index = 0
    buf = f.read()
    f.close()
    magic, labels = struct.unpack_from('>II', buf, index)
    index += struct.calcsize('>II')
    label_arr = [0] * labels
    for x in range(0, labels):
        label_arr[x] = int(struct.unpack_from('>B', buf, index)[0])
        index += struct.calcsize('>B')
    save = open(save_filename, 'w')
    save.write(','.join(map(lambda n: str(n), label_arr)))
    save.write('\n')
    save.close()
    print('save labels success')


if __name__ == '__main__':
    # read_image('data/t10k-images.idx3-ubyte', 'test', 10)
    read_image('data/train-images.idx3-ubyte', 'train', 10)
    # read_label('data/t10k-labels.idx1-ubyte', 'test_labels.txt')
    read_label('data/train-labels.idx1-ubyte', 'train_labels.txt')
    pass

```


  [1]: http://images.ciphermagic.cn/MNIST.png-blog
  [2]: http://yann.lecun.com/exdb/mnist/
  [3]: http://images.ciphermagic.cn/MNIST-Matrix.png-blog
  [4]: http://images.ciphermagic.cn/dataset.png-blog
  [5]: http://images.ciphermagic.cn/train.png-blog
  [6]: http://images.ciphermagic.cn/label.png-blog
  [7]: https://github.com/ciphermagic/python-learn/blob/master/tensorflow_learn/mnist/transform.py