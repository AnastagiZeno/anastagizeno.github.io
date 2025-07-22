+++
title = "k8s"
date = 2025-07-22T10:55:16+08:00
draft = false
description = ""
subtitle = ""
header_img = ""
short = false
toc = true
tags = ["k8s"]
categories = ["Engineering"]
series = ["分布式"]
comment = false
summary = ""
hidden = false
+++

# Kubernetes Web 服务部署架构总结

## 一、Kubernetes 基本概念对比

| 概念                     | 类型       | 作用                              | 是否运行实体                          | 属于控制面/数据面 |
| ---------------------- | -------- | ------------------------------- | ------------------------------- | --------- |
| **Pod**                | 最小运行单元   | 封装容器，提供统一网络/存储视图                | ✅ 是，运行容器进程                      | 数据面       |
| **Node**               | 虚拟/物理主机  | 承载 Pod 的计算资源                    | ✅ 是，运行 kubelet/containerd 等     | 数据面       |
| **Deployment**         | 控制器资源    | 管理 Pod 副本数与滚动发布策略               | ❌ 否，仅为声明式配置                     | 控制面       |
| **Service**            | 虚拟资源     | 提供 Pod 的统一访问入口与负载均衡             | ❌ 否，由 kube-proxy 实现             | 控制面 + 数据面 |
| **Ingress**            | 路由规则     | 定义 HTTP(S) 的域名路由                | ❌ 否，实际代理由 Ingress Controller 执行 | 控制面       |
| **Ingress Controller** | 实体服务     | 实现 Ingress 路由转发，如 nginx/traefik | ✅ 是，运行在 Pod 中                   | 数据面       |
| **kubelet**            | Agent 进程 | 每个 Node 的管理守护进程，控制容器运行          | ✅ 是，常驻进程                        | 数据面       |
| **kube-proxy**         | 网络代理     | 维护 Service 到 Pod 的路由规则          | ✅ 是，运行在每个 Node 上                | 数据面       |
| **kube-apiserver**     | 中心组件     | 控制面入口，所有操作都需通过它                 | ✅ 是，集群入口服务                      | 控制面       |
| **kube-scheduler**     | 控制器      | 负责 Pod 的调度分配                    | ✅ 是                             | 控制面       |

## 二、典型 Web 服务部署架构组件

以下是一个对外提供 HTTP 服务的典型架构组成：

| 组件                   | 功能              | 类型                     | 部署位置                 |
| -------------------- | --------------- | ---------------------- | -------------------- |
| Web 应用 Pod           | 运行业务容器          | Deployment → Pod       | 多个 Node 上调度运行        |
| Service              | 提供内部统一访问 + 负载均衡 | ClusterIP              | 控制面定义，Node 上转发       |
| Ingress              | 定义路由规则          | 资源对象                   | 控制面定义                |
| Ingress Controller   | 实际处理 HTTP 请求    | DaemonSet / Deployment | 多个节点运行               |
| External LB          | 提供公网入口          | 云厂商资源                  | 集群外（如 AWS ELB）       |
| ConfigMap/Secret     | 配置与密钥注入         | K8s 原生对象               | 控制面中，由 API Server 管理 |
| Fluentd / Promtail   | 日志采集            | DaemonSet / Sidecar    | 每个节点或 Pod 内          |
| HPA / PDB            | 弹性伸缩与高可用保障      | 控制器资源                  | 控制面运行逻辑              |
| kubelet / kube-proxy | 控制与转发           | 进程守护                   | 每个 Node 上            |

## 三、典型网络流量路径

```text
用户请求 ➜ 云厂商 LB ➜ Ingress Controller Pod ➜ Service ➜ Pod(8080)
```

* 云 LB 是公网/入口网关，一般为四层或七层代理（TCP/HTTP）；
* Ingress Controller 实际执行反向代理，通常使用 NGINX、Traefik、Istio Gateway 等；
* Service 实现 Pod 层的负载均衡，使用 kube-proxy 的 iptables 或 ipvs；

## 四、AWS 和阿里云架构差异对比

### AWS 架构示意：

```text
[Route53]
   ↓
[AWS ALB/NLB] (公网/内网)
   ↓
[Ingress Controller Pod] (运行在 Node 上)
   ↓
[Service]
   ↓
[Pod]
```

* **云 LB**：ALB (7层)、NLB (4层)
* **证书管理**：AWS Certificate Manager
* **弹性扩容**：结合 ASG + HPA + Cluster Autoscaler
* **镜像仓库**：ECR (Elastic Container Registry)

### 阿里云架构示意：

```text
[阿里云解析 DNS] (阿里云 DNS)
   ↓
[SLB (共享型/独享型)]
   ↓
[Ingress Controller Pod] (支持 Cert-Manager)
   ↓
[Service]
   ↓
[Pod]
```

* **云 LB**：阿里云 SLB
* **证书管理**：阿里云证书中心（或接入 cert-manager）
* **弹性扩缩容**：ACK 支持弹性伸缩组 + Cluster Auto Scaling
* **镜像仓库**：阿里云容器镜像服务（ACR）

## 五、CI/CD 集成部署流程

| 阶段   | 工具举例                                | 说明                     |
| ---- | ----------------------------------- | ---------------------- |
| 代码提交 | GitHub / GitLab                     | 开发者推送代码至主干分支           |
| 编译构建 | Docker / BuildKit                   | 制作镜像并打 tag（CI）         |
| 镜像发布 | Harbor / ACR / ECR                  | 镜像推送到仓库                |
| 部署触发 | ArgoCD / Jenkins / GitLab CI        | 自动或手动触发部署流程            |
| 应用发布 | Helm / Kustomize / kubectl          | 通过 Helm 或 YAML 部署到 K8s |
| 发布策略 | RollingUpdate / Blue-Green / Canary | 分批上线、灰度发布等策略支持         |

CI/CD 通常与 GitOps 结合，可通过 ArgoCD/Flux 监听 Git 仓库中 YAML 变化，自动完成部署。

## 六、常见问题 Q\&A

### Q1: 节点和 Pod 的区别与联系？挂了怎么恢复？

| 比较项   | Node（节点）          | Pod（运行单元）                      |
| ----- | ----------------- | ------------------------------ |
| 定义    | 物理或虚拟主机           | K8s 中最小部署单元                    |
| 内容    | OS、kubelet、容器运行时等 | 一个或多个容器及其共享资源                  |
| 管理者   | 云平台 + kubelet     | K8s 控制面（Deployment、ReplicaSet） |
| 挂掉后恢复 | 云平台重启或重新加入集群      | K8s 控制器检测后重新调度到其他节点            |

### Q2: Deployment 和 Service 是“实际运行服务”吗？

不是，它们是 Kubernetes 控制面上的逻辑资源：

* Deployment：声明式定义副本数、更新策略，由控制器创建 Pod；
* Service：定义访问策略、负载方式，由 kube-proxy 实现访问路径；
* 都不是进程，也不是运行在 Node 上的实体程序。

### Q3: 各个组件运行位置分别在哪？

| 组件                                              | 运行位置                                  |
| ----------------------------------------------- | ------------------------------------- |
| kube-apiserver / controller-manager / scheduler | Master 节点（控制面）                        |
| kubelet / containerd / kube-proxy               | 所有工作节点（Node）                          |
| Deployment / Service / Ingress                  | 存储于 etcd，通过控制器解释执行                    |
| Pod（业务）                                         | 部署在多个 Worker Node 上                   |
| Ingress Controller                              | 一般以 DaemonSet 或 Deployment 运行在 Node 上 |

### Q4: Ingress Controller 为什么在图里画在 Cluster 外边？

* 从**网络流量视角**来看，公网流量先经过云 LB，再进入 Ingress Controller；
* 所以图中将 Ingress Controller 视为“集群边缘接入点”；
* 实际上它是运行在集群内部的 Pod，只是为了便于理解边界流量而画在外面。

### Q5: Kubernetes 提供的负载均衡 vs 云厂商的 LB 有何区别？

| 比较项      | Kubernetes Service                     | 云厂商 LB（如 ELB）               |
| -------- | -------------------------------------- | --------------------------- |
| 作用域      | 集群内部 Pod 之间                            | 集群外部 → 内部入口                 |
| 实现方式     | kube-proxy + iptables/ipvs             | 云平台原生资源，如四层/七层代理            |
| 是否自动创建   | 是（ClusterIP / NodePort / LoadBalancer） | 是（Service 设置为 LoadBalancer） |
| 是否需公网 IP | 否（除非 LoadBalancer 类型）                  | 是                           |
| 使用场景     | Pod-to-Pod、微服务内部调用                     | 终端用户访问集群 HTTP 服务            |

