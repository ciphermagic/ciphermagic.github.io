---
title: Mybatis分页方案
date: 2017-4-10
tag: [mybatis]
categories: blog
---
## 概述
项目开发中经常需要分页，但为了提高开发效率，开发过程中往往不考虑分页。那么如何在功能开发完后使用一种对代码侵略度最低的方式实现分页，本文将提供一种方案。

参考：
- [Mybatis极其(最)简(好)单(用)的一个分页插件 ](http://blog.csdn.net/isea533/article/details/23831273)
- [Mybatis分页插件 - PageHelper](http://git.oschina.net/free/Mybatis_PageHelper)

### 1. 简单使用

#### 1.1 引入分页插件

添加如下maven依赖：

``` xml
<dependency>
    <groupId>com.github.pagehelper</groupId>
    <artifactId>pagehelper</artifactId>
    <version>3.6.3</version>
</dependency>
```

#### 1.2 配置Mybatis拦截器插件（以下两种方式选一种即可）

##### 1.2.1 在Mybatis配置文件中配置

``` xml
<!-- 
    plugins在配置文件中的位置必须符合要求，否则会报错，顺序如下:
    properties?, settings?, 
    typeAliases?, typeHandlers?, 
    objectFactory?,objectWrapperFactory?, 
    plugins?, 
    environments?, databaseIdProvider?, mappers?
-->
<plugins>
    <!-- com.github.pagehelper为PageHelper类所在包名 -->
    <plugin interceptor="com.github.pagehelper.PageHelper">
        <property name="dialect" value="mysql"/>
        <!-- 该参数默认为false -->
        <!-- 设置为true时，会将RowBounds第一个参数offset当成pageNum页码使用 -->
        <!-- 和startPage中的pageNum效果一样-->
        <property name="offsetAsPageNum" value="true"/>
        <!-- 该参数默认为false -->
        <!-- 设置为true时，使用RowBounds分页会进行count查询 -->
        <property name="rowBoundsWithCount" value="true"/>
        <!-- 设置为true时，如果pageSize=0或者RowBounds.limit = 0就会查询出全部的结果 -->
        <!-- （相当于没有执行分页查询，但是返回结果仍然是Page类型）-->
        <property name="pageSizeZero" value="true"/>
        <!-- 3.3.0版本可用 - 分页参数合理化，默认false禁用 -->
        <!-- 启用合理化时，如果pageNum<1会查询第一页，如果pageNum>pages会查询最后一页 -->
        <!-- 禁用合理化时，如果pageNum<1或pageNum>pages会返回空数据 -->
        <property name="reasonable" value="true"/>
        <!-- 3.5.0版本可用 - 为了支持startPage(Object params)方法 -->
        <!-- 增加了一个`params`参数来配置参数映射，用于从Map或ServletRequest中取值 -->
        <!-- 可以配置pageNum,pageSize,count,pageSizeZero,reasonable,不配置映射的用默认值 -->
        <property name="params" value="pageNum=start;pageSize=limit;pageSizeZero=zero;reasonable=heli;count=contsql"/>
    </plugin>
</plugins>
```

##### 1.2.2 在spring配置文件中配置

``` xml
<!-- 定义SqlSessionFactoryBean -->
<bean id="sqlSessionFactory" class="org.mybatis.spring.SqlSessionFactoryBean">
	<!-- 指定连接资源 -->
	<property name="dataSource" ref="druidDataSource" />
	<!-- 指定映射文件 -->
	<property name="mapperLocations" value="classpath*:mapper/*.xml" />
	<!-- 配置分页插件 -->
	<property name="plugins">
		<array>
			<bean class="com.github.pagehelper.PageHelper">
				<property name="properties">
					<value>
						dialect=mysql
						reasonable=true
					</value>
				</property>
			</bean>
		</array>
	</property>
</bean>
```

#### 1.2 在代码中使用

在你需要进行分页的Mybatis方法前调用`PageHelper.startPage`静态方法即可，紧跟在这个方法后的第一个**Mybatis查询方法**会被进行分页。

``` java
// startPage(第几页, 多少条数据)
PageHelper.startPage(currentPage, Constant.PERPAGE_SIZE);
List<OperationVO> resultList = operationService.queryOperations(operationVO);
//用PageInfo对结果进行包装
PageInfo pageInfo = new PageInfo(resultList);
```

如此，就能获取指定页数和数量的数据（resultList）。

PageInfo包含了非常全面的分页属性

``` java
public class PageInfo<T> implements Serializable {
    private static final long serialVersionUID = 1L;
    //当前页
    private int pageNum;
    //每页的数量
    private int pageSize;
    //当前页的数量
    private int size;
    //由于startRow和endRow不常用，这里说个具体的用法
    //可以在页面中"显示startRow到endRow 共size条数据"
    //当前页面第一个元素在数据库中的行号
    private int startRow;
    //当前页面最后一个元素在数据库中的行号
    private int endRow;
    //总记录数
    private long total;
    //总页数
    private int pages;
    //结果集
    private List<T> list;
    //第一页
    private int firstPage;
    //前一页
    private int prePage;
    //下一页
    private int nextPage;
    //最后一页
    private int lastPage;
    //是否为第一页
    private boolean isFirstPage = false;
    //是否为最后一页
    private boolean isLastPage = false;
    //是否有前一页
    private boolean hasPreviousPage = false;
    //是否有下一页
    private boolean hasNextPage = false;
    //导航页码数
    private int navigatePages;
    //所有导航页号
    private int[] navigatepageNums; 
    ...
}    
```
   
可根据这些信息发送到前端实现前端分页。

### 2. 结合前端jquery.DataTable插件实现前端分页
DataTable插件的详细使用方法请参考各搜索引擎或[dataTables-使用详细说明整理](http://blog.csdn.net/mickey_miki/article/details/8240477)

为了结合DataTable插件，需要传递一些特定的参数，为此封装了两个类。请参考(essa内网)：

- [DataTableVO](http://gitlab.gz.essa/essa1005/essa_privilege/blob/master/privilege-domain/src/main/java/cn/essa/component/privilege/domain/datatable/DataTableVO.java)
- [DataTableUtil](http://gitlab.gz.essa/essa1005/essa_privilege/blob/master/privilege-common/src/main/java/cn/essa/component/privilege/util/DataTableUtil.java)

#### 2.1 前端代码示例

``` javascript
resultDataTable = $("#" + tableId).dataTable({
		"aLengthMenu" : [ [ 5, 10, 20 ], [ 5, 10, 20 ] ],
		"iDisplayLength" : 5,
		"bProcessing" : true,
		"bServerSide" : true,
		// 指定后台对应的url
		"sAjaxSource" : rootPath + "/log/getTableData.do",
		// 指定列的值，mData与后台返回的属性名一致
		"aoColumns" : [
		    {
			    "mData" : "updateUserName",
			    "sClass" : "hidden-480 center"
		    }, {
			    "mData" : "objectName",
				"sClass" : "hidden-480 center"
			}, {
				"mData" : "objectId",
				"sClass" : "hidden-480 center"
			}, {
				"mData" : "olderValue",
				"sClass" : "hidden-480"
			}, {
				"mData" : "newValue",
				"sClass" : "hidden-480"
			} ],
		// ajax发送请求参数到后台，aaData必须包含，也可以增加自定义参数
		"fnServerData" : function(sSource, aaData, fnCallback) {
							$.ajax({
								"type" : "post",
								"url" : sSource,
								"dataType" : "json",
								"data" : {
									aaData : JSON.stringify(aaData)，
									// 自定义参数，如搜索条件
									custom : custom
								},
								"success" : function(resp) {
									fnCallback(resp);
								}
							});
						},
		"sPaginationType" : "bootstrap"
		});
```

#### 2.2 后端代码示例

``` java
    @RequestMapping("/getTableData.do")
	@ResponseBody
	public Map<String, Object> getTableData(String aaData, HistoryVO historyVO) {
		// 接收DataTable插件传递的aaData，封装成DataTableVO
		DataTableVO<HistoryVO> table = DataTableUtil.getDataTableVO(aaData);
		// 开始分页
		PageHelper.startPage(table.getPageIndex(), table.getiDisplayLength());
		List<HistoryVO> resultList = historyService.queryHistory(historyVO);
		PageInfo pageInfo = new PageInfo(resultList);
		// 根据分页结果设置table参数
		table.setiTotalRecords(pageInfo.getTotal());
		table.setAaData(resultList);
		// 返回DataTable相应的json数据
		Map<String, Object> dataMap = DataTableUtil.getReturnMap(table);
		return dataMap;
	}
```

通过上述示例方法返回json数据到前台，DataTable接收显示分页数据。

### 3. 使用EL表达式实现前端分页的一个示例

- 后台发送pageInfo到前台

``` java
model.addAttribute("page", pageInfo);
```

- 前台使用EL表达式实现分页，pageInfo中的各项参数请参考1.2节

``` html
<div class="row-fluid">
	<div class="span6">
		<div id="user_group_table_info" class="dataTables_info" role="status"
			aria-live="polite">显示第 ${page.startRow} - ${page.endRow} 条数据;
			共有${page.total} 条记录</div>
	</div>
	<div class="span6">
		<div id="role_group_table_paginate"
			class="dataTables_paginate paging_bootstrap pagination">
			<ul>
				<c:choose>
					<c:when test="${page.isFirstPage}">
						<li class="prev disabled"><a href="#"> ← <span
								class="hidden-480">上一页</span>
						</a></li>
					</c:when>
					<c:otherwise>
						<li class="prev"><a
							href="${currentPath}?pageNum=${page.prePage}"> ← <span
								class="hidden-480">上一页</span>
						</a></li>
					</c:otherwise>
				</c:choose>

				<c:forEach begin="1" end="${page.pages}" var="p">
					<c:choose>
						<c:when test="${p == page.pageNum}">
							<li class="active"><a href="#">${p}</a></li>
						</c:when>
						<c:otherwise>
							<li class=""><a href="${currentPath}?pageNum=${p}">${p}</a></li>
						</c:otherwise>
					</c:choose>
				</c:forEach>

				<c:choose>
					<c:when test="${page.isLastPage}">
						<li class="next disabled"><a href="#"><span
								class="hidden-480">下一页</span> → </a></li>
					</c:when>
					<c:otherwise>
						<li class="next"><a
							href="${currentPath}?pageNum=${page.nextPage}"> <span
								class="hidden-480">下一页</span> →
						</a></li>
					</c:otherwise>
				</c:choose>
			</ul>
		</div>
	</div>

</div>
```
## 总结

在使用此Mybatis分页插件时，不需要在分页的地方手写分页sql和count的sql，不需要更改已有的业务代码，只需要在执行sql前调用一句代码，即可实现分页，并得到丰富的分页信息。有了这些分页信息，前端可以选用多种分页方法，非常方便。
