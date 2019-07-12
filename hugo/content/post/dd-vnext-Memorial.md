---
title: "Dd Vnext Memorial"
author: "Author Name"
cover: "/images/cover.jpg"
tags: ["tagA", "tagB"]
date: 2019-06-24T16:32:16+08:00
draft: true
---

Aio Age is Coming

<!--more-->

#### 1. The Janus Queue
The Janus Queue (installed with pip install janus) provides a solution for communication between threads and coroutines. In the standard library, there are these kinds of queues:

- queue.Queue: a “blocking” queue, commonly used for communication and buffering between threads
- asyncio.Queue: an async-compatible queue, commonly used for communication and buffering between coroutines.

Unfortunately, neither is useful for communication between threads and coroutines! This is where Janus comes in: it is a single Queue that exposes both APIs: a blocking one and an async one. In the following code sample, data is generated from inside a thread, placed on a queue, and then consumed from a coroutine.

Example j-q
```python
import asyncio, time, random, janus

loop = asyncio.get_event_loop()
queue = janus.Queue(loop=loop)  1

async def main():
    while True:
        data = await queue.async_q.get()  2
        if data is None:
            break
        print(f'Got {data} off queue')  3
    print('Done.')

def data_source():
    for i in range(10):
        r = random.randint(0, 4)
        time.sleep(r)  4
        queue.sync_q.put(r)  5
    queue.sync_q.put(None)

loop.run_in_executor(None, data_source)
loop.run_until_complete(main())
loop.close()
```