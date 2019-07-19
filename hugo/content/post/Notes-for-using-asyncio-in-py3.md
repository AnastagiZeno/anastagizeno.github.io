---
title: "Notes for Using Asyncio in Py3"
author: "Ted"
cover: "/images/cover.jpg"
tags: ["Notes", "Asyncid", "Python"]
date: 2019-06-24T10:41:55+08:00
draft: false
---

Async Generators: yield Inside async def Functions
Async generators answer the question, “What happens if you use yield inside a native async def coroutine function?” This concept might be confusing if you have some experience with using generators as if they were coroutines, such as with the Twisted framework, or the Tornado framework, or even with yield from in Python 3.4’s asyncio.

Therefore, before we continue in this section, it is best if you can convince yourself that:

Coroutines and generators are completely different concepts.

Async generators behave much like ordinary generators.

For iteration, you use async for for async generators, instead of ordinary for for ordinary generators.

The example used in the previous section to demonstrate an async iterator for interaction with Redis turns out to be much simpler if we set it up as an async generator:

<!--more-->



```python
import asyncio
from aioredis import create_redis

async def main():  1
    redis = await create_redis(('localhost', 6379))  2
    keys = ['Americas', 'Africa', 'Europe', 'Asia']  3

    async for value in OneAtATime(redis, keys):  4
        await do_something_with(value)  5

class OneAtATime:
    def __init__(self, redis, keys):  6
        self.redis = redis
        self.keys = keys
    def __aiter__(self):  7
        self.ikeys = iter(self.keys)
        return self
    async def __anext__(self):  8
        try:
            k = next(self.ikeys)  9
        except StopIteration:  10
            raise StopAsyncIteration

        value = await redis.get(k)  11
        return value

asyncio.get_event_loop().run_until_complete(main())
```

Easier with an async generator:

```python
import asyncio
from aioredis import create_redis

async def main():  1
    redis = await create_redis(('localhost', 6379))
    keys = ['Americas', 'Africa', 'Europe', 'Asia']

    async for value in one_at_a_time(redis, keys):  2
        await do_something_with(value)

async def one_at_a_time(redis, keys):  3
    for k in keys:
        value = await redis.get(k)  4
        yield value  5

asyncio.get_event_loop().run_until_complete(main())

```