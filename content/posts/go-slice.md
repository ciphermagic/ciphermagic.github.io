---
title: GO Slice 链式操作
date: 2023-04-07T22:47:00+08:00
categories: ["技术"]
tags: ["go"]
---
## 示例

首先模拟一个业务场景，有订单、产品、自定义订单三个结构体，订单中包含多个产品：

``` go
type Order struct {
	Id       string
	Products []Product
}

type Product struct {
	Id    string
	Price int
}

type CustomOrder struct {
	Id string
}
```

初始化模拟数据：
``` go
var orders = []Order{
	{
		Id: "o1",
		Products: []Product{
			{
				Id:    "p1",
				Price: 1,
			},
			{
				Id:    "p2",
				Price: 2,
			},
		},
	},
	{
		Id: "o2",
		Products: []Product{
			{
				Id:    "p3",
				Price: 3,
			},
			{
				Id:    "p4",
				Price: 4,
			},
		},
	},
}
```

接下来对订单列表做各种操作：

``` go
// 过滤Id为o2的订单
func TestFilter(t *testing.T) {
	res := Lists[Order](orders).Filter(func(o any) bool {
		return o.(Order).Id == "o2"
	}).Collect()
	t.Log(res) // [{o2 [{p3 3} {p4 4}]}]
}

// 将订单列表映射为自定义订单列表
func TestMap(t *testing.T) {
	res := Lists[CustomOrder](orders).Map(func(o any) any {
		return CustomOrder{
			Id: "custom-" + o.(Order).Id,
		}
	}).Collect()
	t.Log(res) // [{custom-o1} {custom-o2}]
}

// 将每个订单里的产品展开，并映射为自定义订单
func TestFlatAndMap(t *testing.T) {
	res := Lists[CustomOrder](orders).
		Flat(func(o any) []any {
			return Lists[any](o.(Order).Products).ToList()
		}).
		Map(func(p any) any {
			return CustomOrder{
				Id: "ProductId-" + p.(Product).Id,
			}
		}).Collect()
	t.Log(res) // [{ProductId-p1} {ProductId-p2} {ProductId-p3} {ProductId-p4}]
}

// 找到所有订单产品中价格最贵的那个产品
func TestMax(t *testing.T) {
	res, found := Lists[Product](orders).
		Flat(func(o any) []any {
			return Lists[any](o.(Order).Products).ToList()
		}).
		Max(func(i, j any) bool {
			return i.(Product).Price > j.(Product).Price
		})
	t.Log(found, res) // true {p4 4}
}
```

## 原理

``` go
type List[T any] struct {
	list []any
}
```

将 go 中的原生切片包装成 `List[T]` 结构体，特别说明其中的泛型 `T` 是最终结果的元素类型，并不是原始传入切片的类型。

这样设计是因为 go 只能在构造结构体时指定泛型，因此将 `List[T]` 的泛型指定为最终结果的元素类型，就可以在操作完成后调用 `Collect()` 方法，得到最终的 `T`  类型切片，方便后面的业务逻辑使用。

因为 go 不支持在接受者函数中定义泛型，因此所有操作函数的参数和返回值类型只能定义为`any`，然后在函数体内转换为业务结构体使用，例如上面的 `i.(Product).Price`。

此后将每一种操作，例如Filter、Map、Flat等，都返回`List[T]` 结构体，就可以实现链式操作。

## 实现

``` go
type List[T any] struct {
	list []any
}

func Lists[T any](items any) *List[T] {
	rv := reflect.ValueOf(items)
	if rv.Kind() != reflect.Slice {
		panic(fmt.Sprintf("not supported type: %v, please use slice instead", rv.Kind()))
	}
	l := rv.Len()
	s := make([]any, 0, l)
	for i := 0; i < l; i++ {
		s = append(s, rv.Index(i).Interface())
	}
	return &List[T]{
		list: s,
	}
}

func (s *List[T]) Filter(fn func(any) bool) *List[T] {
	l := make([]any, 0)
	for _, e := range s.list {
		if fn(e) {
			l = append(l, e)
		}
	}
	s.list = l
	return s
}

func (s *List[T]) Map(fn func(any) any) *List[T] {
	l := make([]any, 0)
	for _, element := range s.list {
		l = append(l, fn(element))
	}
	return &List[T]{
		list: l,
	}
}

func (s *List[T]) Flat(fn func(any) []any) *List[T] {
	l := make([]any, 0)
	for _, element := range s.list {
		l = append(l, fn(element)...)
	}
	return &List[T]{
		list: l,
	}
}

func (s *List[T]) Sort(fn func(i, j any) bool) *List[T] {
	if len(s.list) <= 0 {
		return s
	}
	sort.SliceStable(s.list, func(i, j int) bool {
		return fn(s.list[i], s.list[j])
	})
	return s
}

func (s *List[T]) Max(fn func(i, j any) bool) (T, bool) {
	return s.Sort(fn).FindFirst()
}

func (s *List[T]) FindFirst() (T, bool) {
	if len(s.list) <= 0 {
		var nonsense T
		return nonsense, false
	}
	return s.list[0].(T), true
}

func (s *List[T]) ToList() []any {
	return s.list
}

func (s *List[T]) Collect() []T {
	t := make([]T, 0)
	for _, a := range s.list {
		t = append(t, a.(T))
	}
	return t
}
```
