---
title: spring-mvc 解决跨域问题
date: 2016-1-19
categories: blog
tags: [spring-mvc,java] 
---

解决跨域访问问题，只需在被访问的应用中加入一个请求过滤器：

<!-- more -->

``` java
public class CorsFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
            FilterChain chain) throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        if (req.getHeader("Origin") != null) {
            res.addHeader("Access-Control-Allow-Origin", "*");
        }

        if ("OPTIONS".equals(req.getMethod())) {
            res.addHeader("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
            res.addHeader("Access-Control-Allow-Headers","Origin, Content-Type");
            res.addHeader("Access-Control-Max-Age", "-1");
        }
        chain.doFilter(req, res);
    }

    @Override
    public void destroy() {
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }
}
```