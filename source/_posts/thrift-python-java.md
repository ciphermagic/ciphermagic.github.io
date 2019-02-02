---
title: Thrift 连接 Java 与 Python，附 Java 通用工厂方法
date: 2017-09-22 10:51
categories: 技术
tags: [thrift,java,python] 
---

Python 作为服务端，Java 作为客户端调用 Python 提供的接口。本文主要按照[这篇文章][1]的思路连通 Python 与 Java，下面简单介绍一下如何使用，具体可参看原文章。最后重点提供一个 Java 的通用工厂方法，用来调用 Thrift 提供的接口。

### 生成文件
首先定义`thrift`接口文件，`hello.thrift`：
``` thrift
service Hello {    

    string helloString(1:string word)    

}  
```

生成 Python 代码：
``` shell
thrift --gen py hello.thrift
```

生成 Java 代码：
``` shell
thrift --gen java hello.thrift
```

生成完的文件要各自放到 Python 和 Java 的工程中。

### Python 客户端
``` python
from hello import Hello
from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol
from thrift.server import TServer


class HelloHandler:
    def __init__(self):
        pass

    def helloString(self, word):
        ret = "Hello Thrift! Received: " + word
        return ret


# handler processer类
handler = HelloHandler()
processor = Hello.Processor(handler)
transport = TSocket.TServerSocket("127.0.0.1", 8989)
# 传输方式，使用buffer
tfactory = TTransport.TBufferedTransportFactory()
# 传输的数据类型：二进制
pfactory = TBinaryProtocol.TBinaryProtocolFactory()
# 创建一个thrift 服务~
server = TServer.TThreadPoolServer(processor, transport, tfactory, pfactory)

print("Starting thrift server in python...")
server.serve()
print("done!")
```

### Java 通用工厂方法
提供一个工厂类，不管 Thrift 文件怎么变化，核心调用代码都不需要变，只需要替换生成的代码即可。Thrift 的 ip 地址和端口一般写在配置文件中，由于各人读取配置文件的方法不尽相同，这里就写死在代码里，使用时换成从配置文件读就行了。

``` java
import org.apache.thrift.protocol.TBinaryProtocol;
import org.apache.thrift.protocol.TProtocol;
import org.apache.thrift.transport.TSocket;
import org.apache.thrift.transport.TTransport;
import org.apache.thrift.transport.TTransportException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.Constructor;
import java.lang.reflect.Method;

/**
 * Thrift 连接工厂
 * Created by cipher on 2017/9/22.
 */
public class ThriftFactory {

    private ThriftFactory() {
    }

    private static final Logger LOG = LoggerFactory.getLogger(ThriftFactory.class);

    private static TProtocol protocol;

    private static TTransport transport;

    /**
     * 获取二进制 protocol
     *
     * @return 二进制 protocol
     */
    public static TProtocol getTProtocol() {
        // 单例获取 protocol
        if (protocol == null) {
            protocol = new TBinaryProtocol(getTTransport());
        }
        return protocol;
    }

    /**
     * 获取传输对象
     *
     * @return 传输对象
     */
    public static TTransport getTTransport() {
        // 单例获取 transport
        if (transport == null) {
            // 应改成从配置文件读取
            String ip = "127.0.0.1";
            Integer port = 8989;
            transport = new TSocket(ip, port);
        }
        return transport;
    }

    /**
     * 获取客户端实例
     *
     * @param clazz 客户端类
     * @param <T>   泛型
     * @return 客户端实例
     */
    public static <T> T getClient(Class<T> clazz) {
        T instance = null;
        try {
            //获取有参构造器
            Constructor c = clazz.getConstructor(TProtocol.class);
            // 实例化客户端，需要传入 protocol
            instance = (T) c.newInstance(getTProtocol());
        } catch (Exception e) {
            LOG.error("", e);
            throw new RuntimeException(e.getMessage());
        }
        return instance;
    }

    /**
     * 发起请求
     *
     * @param clazz      客户端类
     * @param methodName 方法名，客户端中不能有重载的方法
     * @param param      方法参数
     * @param <T>        泛型
     * @return 方法返回值
     */
    public static <T> Object doRequest(Class<T> clazz, String methodName, Object... param) {
        Object result = null;
        try {
            // 获取客户端实例
            T instance = getClient(clazz);
            Method[] methods = clazz.getMethods();
            for (Method method : methods) {
                // 获取指定的方法
                if (method.getName().equals(methodName)) {
                    open();
                    result = method.invoke(instance, param);
                    close();
                    break;
                }
            }
        } catch (Exception e) {
            LOG.error("", e);
            throw new RuntimeException(e.getMessage());
        }
        return result;
    }

    /**
     * 打开传输
     */
    public static void open() {
        try {
            getTTransport().open();
        } catch (TTransportException e) {
            LOG.error("", e);
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * 关闭传输
     */
    public static void close() {
        getTTransport().close();
    }

}
```

测试代码：
``` java
public static void main(String[] args) throws Exception {
    String msg = (String) ThriftFactory.doRequest(Hello.Client.class, "helloString", "测试");
    System.out.println(msg);
}
```

`Hello`是 Thrift 生成的 java 代码，以后如果接口改了或者新增的接口，只需要使用 Thrift 生成代码，放到 java 工程中，修改`doRequst`的参数就行了。


  [1]: https://my.oschina.net/u/780876/blog/691293
