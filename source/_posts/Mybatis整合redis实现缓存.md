---
title: Mybatis整合redis实现缓存
date: 2017-4-10
categories: blog
tags: [mybatis,redis] 
---
## 概述
Mybatis默认缓存是PerpetualCache，它实现了Cache接口。Mybatis为了方便我们扩展缓存定义了一个Cache接口，因此，我们只需要参考源码自己使用redis实现Cache接口，即可达到Mybatis整合redis管理缓存的目的。

## 开始
本文介绍在spring-mvc的项目中，如何实现使用redis作为Mybatis的二级缓存。重点是实现Cache接口，而如何引入redis有多种方式，本文使用其中一种。

### 环境
- jdk：1.7
- redis：2.8.12
- spring：4.1.1.RELEASE

### 新建redis.properties文件
用于记录redis的基本信息
``` xml
# ====================================================
#                redis settings
# ====================================================

redis.host=127.0.0.1
redis.port=6379
redis.pass=
redis.maxIdle=300
redis.maxActive=600
redis.maxWait=1000
redis.testOnBorrow=false
```

### 新建RedisConfig.java类
用于获取redis配置信息
``` java
public class RedisConfig {

    private static String host;
    private static String port;
    private static String pass;
    private static String maxIdle;
    private static String maxActive;
    private static String maxWait;
    private static String testOnBorrow;   

    public RedisConfig(String host, String port, String pass, String maxIdle,
            String maxActive, String maxWait, String testOnBorrow) {
        super();
        RedisConfig.host = host;
        RedisConfig.port = port;
        RedisConfig.pass = pass;
        RedisConfig.maxIdle = maxIdle;
        RedisConfig.maxActive = maxActive;
        RedisConfig.maxWait = maxWait;
        RedisConfig.testOnBorrow = testOnBorrow;
    }

    public static String getHost() {
        return host;
    }

    public static String getPort() {
        return port;
    }

    public static String getPass() {
        return pass;
    }

    public static String getMaxIdle() {
        return maxIdle;
    }

    public static String getMaxActive() {
        return maxActive;
    }

    public static String getMaxWait() {
        return maxWait;
    }

    public static String getTestOnBorrow() {
        return testOnBorrow;
    }

    public void setHost(String host) {
        RedisConfig.host = host;
    }

    public void setPort(String port) {
        RedisConfig.port = port;
    }

    public void setPass(String pass) {
        RedisConfig.pass = pass;
    }

    public void setMaxIdle(String maxIdle) {
        RedisConfig.maxIdle = maxIdle;
    }

    public void setMaxActive(String maxActive) {
        RedisConfig.maxActive = maxActive;
    }

    public void setMaxWait(String maxWait) {
        RedisConfig.maxWait = maxWait;
    }

    public void setTestOnBorrow(String testOnBorrow) {
        RedisConfig.testOnBorrow = testOnBorrow;
    }

}
```

### spring配置文件中构造RedisConfig
``` xml
    <context:property-placeholder
        location="classpath:redis.properties"
        ignore-unresolvable="true" ignore-resource-not-found="true" />

    <bean id="redisConfig" class="cn.essa.component.privilege.util.RedisConfig">
        <constructor-arg index="0">
            <value>${redis.host}</value>
        </constructor-arg>
        <constructor-arg index="1">
            <value>${redis.port}</value>
        </constructor-arg>
        <constructor-arg index="2">
            <value>${redis.pass}</value>
        </constructor-arg>
        <constructor-arg index="3">
            <value>${redis.maxIdle}</value>
        </constructor-arg>
        <constructor-arg index="4">
            <value>${redis.maxActive}</value>
        </constructor-arg>
        <constructor-arg index="5">
            <value>${redis.maxWait}</value>
        </constructor-arg>
        <constructor-arg index="6">
            <value>${redis.testOnBorrow}</value>
        </constructor-arg>
    </bean>
```
如此即可在普通类中使用RedisConfig，得到redis配置信息

### 新建RedisCache.java类
该类实现了`org.apache.ibatis.cache.Cache`接口
``` java
/**
 * @ClassName: RedisCache
 * @Description: 使用第三方缓存服务器redis，处理二级缓存
 * @author cipher
 *
 */
public class RedisCache implements Cache {
    private static final Log LOG = LogFactory.getLog(RedisCache.class);
    /** The ReadWriteLock. */
    private final ReadWriteLock readWriteLock = new ReentrantReadWriteLock();

    private String id;

    public RedisCache(final String id) {
        if (id == null) {
            throw new IllegalArgumentException("必须传入ID");
        }
        LOG.debug(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>MybatisRedisCache:id=" + id);
        this.id = id;
    }

    @Override
    public String getId() {
        return this.id;
    }

    @Override
    public int getSize() {
        Jedis jedis = null;
        JedisPool jedisPool = null;
        int result = 0;
        boolean borrowOrOprSuccess = true;
        try {
            jedis = CachePool.getInstance().getJedis();
            jedisPool = CachePool.getInstance().getJedisPool();
            result = Integer.valueOf(jedis.dbSize().toString());
        } catch (JedisConnectionException e) {
            LOG.error(e);
            borrowOrOprSuccess = false;
            if (jedis != null) {
                jedisPool.returnBrokenResource(jedis);
            }
        } finally {
            if (borrowOrOprSuccess) {
                jedisPool.returnResource(jedis);
            }
        }
        return result;

    }

    @Override
    public void putObject(Object key, Object value) {
        if (LOG.isDebugEnabled()) {
            LOG.debug(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>putObject:"
                    + key.hashCode() + "=" + value);
        } 
        if (LOG.isInfoEnabled()) {
            LOG.info(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>put to redis sql :"
                    + key.toString());
        } 
        Jedis jedis = null;
        JedisPool jedisPool = null;
        boolean borrowOrOprSuccess = true;
        try {
            jedis = CachePool.getInstance().getJedis();
            jedisPool = CachePool.getInstance().getJedisPool();
            jedis.set(SerializeUtil.serialize(key.hashCode()),
                    SerializeUtil.serialize(value));
        } catch (JedisConnectionException e) {
            LOG.error(e);
            borrowOrOprSuccess = false;
            if (jedis != null) {
                jedisPool.returnBrokenResource(jedis); 
            } 
        } finally {
            if (borrowOrOprSuccess) {
                jedisPool.returnResource(jedis); 
            }   
        }

    }

    @Override
    public Object getObject(Object key) {
        Jedis jedis = null;
        JedisPool jedisPool = null;
        Object value = null;
        boolean borrowOrOprSuccess = true;
        try {
            jedis = CachePool.getInstance().getJedis();
            jedisPool = CachePool.getInstance().getJedisPool();
            value = SerializeUtil.unserialize(jedis.get(SerializeUtil
                    .serialize(key.hashCode())));
        } catch (JedisConnectionException e) {
            LOG.error(e);
            borrowOrOprSuccess = false;
            if (jedis != null) {
                jedisPool.returnBrokenResource(jedis);
            }  
        } finally {
            if (borrowOrOprSuccess) {
                jedisPool.returnResource(jedis);
            }  
        }
        if (LOG.isDebugEnabled()) {
            LOG.debug(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>getObject:"
                    + key.hashCode() + "=" + value); 
        } 
        return value;
    }

    @Override
    public Object removeObject(Object key) {
        Jedis jedis = null;
        JedisPool jedisPool = null;
        Object value = null;
        boolean borrowOrOprSuccess = true;
        try {
            jedis = CachePool.getInstance().getJedis();
            jedisPool = CachePool.getInstance().getJedisPool();
            value = jedis.expire(SerializeUtil.serialize(key.hashCode()), 0);
        } catch (JedisConnectionException e) {
            LOG.error(e);
            borrowOrOprSuccess = false;
            if (jedis != null) {
                jedisPool.returnBrokenResource(jedis);
            } 
        } finally {
            if (borrowOrOprSuccess) {
                jedisPool.returnResource(jedis);
            }  
        }
        if (LOG.isDebugEnabled()) {
            LOG.debug(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>removeObject:"
                    + key.hashCode() + "=" + value);
        } 
        return value;
    }

    @Override
    public void clear() {
        Jedis jedis = null;
        JedisPool jedisPool = null;
        boolean borrowOrOprSuccess = true;
        try {
            jedis = CachePool.getInstance().getJedis();
            jedisPool = CachePool.getInstance().getJedisPool();
            jedis.flushDB();
            jedis.flushAll();
        } catch (JedisConnectionException e) {
            LOG.error(e);
            borrowOrOprSuccess = false;
            if (jedis != null) {
                jedisPool.returnBrokenResource(jedis); 
            }  
        } finally {
            if (borrowOrOprSuccess) {
                jedisPool.returnResource(jedis);
            } 
        }
    }

    @Override
    public ReadWriteLock getReadWriteLock() {
        return readWriteLock;
    }

    /**
     * 
     * @ClassName: CachePool
     * @Description: 单例Cache池
     * 
     */
    public static class CachePool {
        JedisPool pool;
        private static final CachePool CACHEPOOL = new CachePool();

        public static CachePool getInstance() {
            return CACHEPOOL;
        }

        private CachePool() {
            try {
                int maxIdle = Integer
                        .valueOf(RedisConfig.getMaxIdle());
                long maxWait = Long.valueOf(RedisConfig.getMaxWait());
                int maxActive = Integer.valueOf(RedisConfig.getMaxActive());
                String redisHost = RedisConfig.getHost();
                int redisPort = Integer.valueOf(RedisConfig.getPort());
                JedisPoolConfig config = new JedisPoolConfig();
                config.setMaxIdle(maxIdle);
                config.setMaxWait(maxWait);
                config.setMaxActive(maxActive);
                config.setTestOnBorrow(false);
                pool = new JedisPool(config, redisHost, redisPort);
            } catch (Exception e) {
                LOG.error(e);
                throw new RuntimeException("初始化连接池错误");
            }
        }

        public Jedis getJedis() {
            Jedis jedis = null;
            boolean borrowOrOprSuccess = true;
            try {
                jedis = pool.getResource();
            } catch (JedisConnectionException e) {
                LOG.error(e);
                borrowOrOprSuccess = false;
                if (jedis != null) {
                    pool.returnBrokenResource(jedis); 
                } 
            } finally {
                if (borrowOrOprSuccess) {
                    pool.returnResource(jedis);
                }  
            }
            jedis = pool.getResource();
            return jedis;
        }

        public JedisPool getJedisPool() {
            return this.pool;
        }

    }

    private static class SerializeUtil {
        public static byte[] serialize(Object object) {
            ObjectOutputStream oos = null;
            ByteArrayOutputStream baos = null;
            byte[] bytes = null;
            try {
                // 序列化
                baos = new ByteArrayOutputStream();
                oos = new ObjectOutputStream(baos);
                oos.writeObject(object);
                bytes = baos.toByteArray();
                return bytes;
            } catch (Exception e) {
                LOG.error(e);
            }
            return bytes;
        }

        public static Object unserialize(byte[] bytes) {
            if (bytes == null) {
                return null;
            } 
            ByteArrayInputStream bais = null;
            try {
                // 反序列化
                bais = new ByteArrayInputStream(bytes);
                ObjectInputStream ois = new ObjectInputStream(bais);
                return ois.readObject();
            } catch (Exception e) {
                LOG.error(e);
            }
            return null;
        }
    }
}
```

### 新建LoggingRedisCache.java类
该类继承了org.apache.ibatis.cache.decorators.LoggingCache，是缓存的入口类
``` java
public class LoggingRedisCache extends LoggingCache {
    public LoggingRedisCache(String id) {
        super(new RedisCache(id));
    }
}
```

### 使用缓存
在需要使用缓存的mapper文件中加入（要在`<mapper>`标签范围内）：
``` xml
<cache type="cn.essa.component.privilege.cache.LoggingRedisCache" />
```

注意：测试时请记得开启redis
