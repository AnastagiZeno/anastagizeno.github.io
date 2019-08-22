---
title: "Cassandra Scale Research"
author: "Ted"
tags: ["NoSql", "Cassandra"]
date: 2019-06-17T16:48:37+08:00
draft: true
---

* Cassandra弹性伸缩能力，节点失败以后的恢复能力
* 备份恢复能力
* 跨集群同步能力

<!--more-->

### Compare
- [x] [What is Cassandra] (https://www.educba.com/what-is-cassandra/)
- [x] [Hadoop vs Cassandra] (https://www.educba.com/hadoop-vs-cassandra/) 
- [x] [Hadoop vs Cassandra 2] (https://www.scnsoft.com/blog/cassandra-vs-hadoop)
- [x] [Mongodb vs Cassandra in 2016] (https://scalegrid.io/blog/cassandra-vs-mongodb/)
- [x] [Mongodb vs Cassandra In 2018] (https://blog.panoply.io/cassandra-vs-mongodb)
- [x] [Benchmarks] (https://www.datastax.com/nosql-databases/benchmarks-cassandra-vs-mongodb-vs-Hbase)
- [x] [Cassandra tu] (https://towardsdatascience.com/getting-started-with-apache-cassandra-and-python-81e00ccf17c9)

### Cassandra弹性伸缩能力，节点失败以后的恢复能力
- [Doc](https://docs.datastax.com/en/ddac/doc/datastax_enterprise/operations/opsTOC.html)
- [NoSQL at Netflix](https://medium.com/netflix-techblog/nosql-at-netflix-e937b660b4c)
- [Understanding Cassandra Operations at scale](https://medium.com/@zhongzhongzhong/understanding-cassandra-repair-at-scale-ca3cf33dd987)


#### Scale


#### Backup
- [snap tool](https://github.com/JeremyGrosser/tablesnap)


#### Recover

==================


#### Choose a compact strategy for tables

[Compact Strategy](https://docs.datastax.com/en/dse/5.1/dse-arch/datastax_enterprise/dbInternals/dbIntHowDataMaintain.html#dbIntHowDataMaintain__stcs-compaction)

Which compaction strategy is best?
The following questions are based on the experiences of developers and users with the strategies.

Does your table process time series data?
If so, your best choice is Compaction strategiesTWCS. If not, the following questions introduce other considerations to guide your choice.
Does your table handle more reads than writes, or more writes than reads?
LCS is a good choice if your table processes twice as many reads as writes or more — especially randomized reads. If the proportion of reads to writes is closer, the performance hit exacted by LCS may not be worth the benefit. Be aware that LCS can be quickly overwhelmed by a high volume of writes.
Does the data in your table change often?
One advantage of LCS is that it keeps related data in a small set of SSTables. If your data is immutable or not subject to frequent upserts, STCS accomplishes the same type of grouping without the LCS performance hit.
Do you require predictable levels of read and write activity?
LCS keeps the SSTables within predictable sizes and numbers. For example, if your table's read/write ratio is small, and it is expected to conform to a Service Level Agreements (SLAs) for reads, it may be worth taking the write performance penalty of LCS in order to keep read rates and latency at predictable levels. And you may be able to overcome this write penalty through horizontal scaling (adding more nodes).
Will your table be populated by a batch process?
On both batch reads and batch writes, STCS performs better than LCS. The batch process causes little or no fragmentation, so the benefits of LCS are not realized; batch processes can overwhelm LCS-configured tables.
Does your system have limited disk space?
LCS handles disk space more efficiently than STCS: it requires about 10% headroom in addition to the space occupied by the data is handles. STCS and DTCS generally require, in some cases, as much as 50% more than the data space. (DateTieredStorageStrategy (DTCS) is deprecated.)
Is your system reaching its limits for I/O?
LCS is significantly more I/O intensive than DTCS or STCS. Switching to LCS may introduce extra I/O load that offsets the advantages.
