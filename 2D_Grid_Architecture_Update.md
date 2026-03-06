# 2D 模块化药盒架构更新文档

## 1. 修订摘要

本文档旨在详细阐述模块化药盒从 **1D 线性布局** 升级为 **2D 栅格布局** 的技术决策、实施方案及影响范围。此次升级是为了响应用户对更灵活、可扩展布局的需求，参考设计如下图所示：

*(此处应插入用户提供的 2D 栅格布局参考图)*

## 2. 物理结构变更

为了实现 2D 布局，结构上需要支持任意方向的拼接。

- **增加 Pogo Pin 和磁铁**:
  - 在 `Slave` 和 `Hub` 模块外壳的 `Top` 和 `Bottom` 面增加 Pogo Pin（弹簧探针）和磁铁。
  - `Left` 和 `Right` 面保持原有设计，确保与旧模块的兼容性。
  - 此设计使得模块可以在垂直和水平方向上进行物理连接和电力/数据传输。

- **相关文件**:
  - [`hub_module_shell.scad`](hub_module_shell.scad)
  - [`slave_module_shell.scad`](slave_module_shell.scad)

## 3. 电气与通信变更

- **I2C 并联支持**:
  - 硬件上，所有 `Slave` 模块的 I2C 总线（SDA/SCL）通过 Pogo Pin 直接并联到 `Hub` 的总线上。
  - `Hub` 作为 I2C Master，通过轮询机制扫描总线上的所有 `Slave` 地址，从而识别和管理每个模块。

- **WS2812 级联逻辑优化**:
  - 传统 WS2812 的 `DIN/DOUT` 级联方式在 2D 布局中会变得复杂。
  - **新方案**: `Hub` 将直接驱动所有 `Slave` 模块的 WS2812 LED。每个 `Slave` 模块的 LED 数据线（DIN）都独立连接到 `Hub` 的一个 GPIO 引脚上。
  - 这样做简化了数据路由，但会占用 `Hub` 更多的 GPIO 资源。

- **相关文件**:
  - [`firmware/esp32_hub/esp32_hub.ino`](firmware/esp32_hub/esp32_hub.ino)
  - [`firmware/attiny85_slave/attiny85_slave.ino`](firmware/attiny85_slave/attiny85_slave.ino)

## 4. 软件与 UI 变更

- **UI 布局**:
  - 前端界面将从原有的线性 Flexbox 布局切换到 **CSS Grid** 布局，以精确映射 2D 物理布局。

- **坐标系统**:
  - 引入 `(row, col)` 的二维坐标系来唯一标识每个 `Slave` 模块在栅格中的位置。
  - `Hub` 在设备发现和通信时，将为每个 `Slave` 分配并存储其坐标。
  - 所有与模块相关的 API 和状态管理都将基于此坐标系。

- **相关文件**:
  - [`ui/src/components/Grid.tsx`](ui/src/components/Grid.tsx)
  - [`ui/src/store/useStore.ts`](ui/src/store/useStore.ts)
  - [`ui/src/App.tsx`](ui/src/App.tsx)

## 5. 受影响文件清单

- **硬件设计**:
  - [`hub_module_shell.scad`](hub_module_shell.scad)
  - [`slave_module_shell.scad`](slave_module_shell.scad)
  - [`plans/Hub_PCB_Design_Spec.md`](plans/Hub_PCB_Design_Spec.md)
  - [`plans/Slave_PCB_Design_Spec.md`](plans/Slave_PCB_Design_Spec.md)
- **固件**:
  - [`firmware/esp32_hub/esp32_hub.ino`](firmware/esp32_hub/esp32_hub.ino)
  - [`firmware/attiny85_slave/attiny85_slave.ino`](firmware/attiny85_slave/attiny85_slave.ino)
- **用户界面**:
  - [`ui/src/components/Grid.tsx`](ui/src/components/Grid.tsx)
  - [`ui/src/store/useStore.ts`](ui/src/store/useStore.ts)
  - [`ui/src/App.tsx`](ui/src/App.tsx)
  - [`ui/src/api/client.ts`](ui/src/api/client.ts)
- **架构文档**:
  - `Modular_Pillbox_Architecture_v2.md`
  - `2D_Grid_Architecture_Update.md` (本文)

---

## 6. LED 控制方案变更（WS2812 菊花链 → I²C 独立控制）

**变更日期**：2026-03-06
**触发原因**：固件升级，ATtiny85 从模块新增对 `CMD_LED_COLOR (0x05)` 命令的支持。

### 6.1 修改原因

原始方案中 WS2812 采用 S 型菊花链路由：Hub 通过单根 GPIO 驱动一条串行数据链，数据依次流经各从模块（DIN→DOUT→下一模块 DIN）。在 2D 网格拓扑中，此方案存在以下问题：

- **路由复杂**：S 型路径在 2D 网格中需要精心规划 PCB 走线和 Pogo Pin 方向，模块旋转 180° 时需特殊处理。
- **硬件冗余**：每个模块均需通过 Pogo Pin 传递 WS2812 数据信号（第 5 针），增加连接器成本。
- **链路脆弱**：任意一个模块断开或故障会导致后续所有模块 LED 失控。

### 6.2 新方案说明

| 项目 | 旧方案（WS2812 菊花链） | 新方案（I²C 独立控制） |
|------|----------------------|----------------------|
| **控制方式** | GPIO 单线串行数据链 | I²C 命令 `CMD_LED_COLOR (0x05)` |
| **数据路径** | Hub GPIO25 → Pogo Pin Pin5 → 各 Slave DIN→DOUT | Hub I²C → 各 Slave I²C 地址 → 本地 ATtiny85 PB4 |
| **Pogo Pin 数量** | 5 针（12V/GND/SDA/SCL/WS2812） | 4 针（12V/GND/SDA/SCL） |
| **WS2812 DOUT** | 连接到下一模块或连接器 | 悬空（NC） |
| **拓扑依赖** | 需要 S 型路由规划 | 无拓扑限制，任意网格形状均可 |
| **单模块故障影响** | 影响后续所有 LED | 仅影响该模块自身 |

**从模块 WS2812 接口**（更新后）：
```
ATtiny85 PB4 ──[R: 330Ω]──→ WS2812 DIN
WS2812 DOUT → 悬空 (NC)
```

**Hub 发送 LED 控制命令示例**：
```c
// 向地址 0x12 的从模块发送红色
Wire.beginTransmission(0x12);
Wire.write(0x05);   // CMD_LED_COLOR
Wire.write(0xFF);   // R = 255
Wire.write(0x00);   // G = 0
Wire.write(0x00);   // B = 0
Wire.endTransmission();
```

### 6.3 命令字节变化

| 命令 | 旧字节 | 新字节 | 说明 |
|------|--------|--------|------|
| `CMD_LED_COLOR` | —（新增） | **0x05** | I²C 独立 LED 颜色控制（[R][G][B]） |
| `SET_ADDRESS` | 0x05 | **0x06** | I²C 地址动态分配（[New Addr]） |

> ⚠️ **注意**：`SET_ADDRESS` 命令字节已由 `0x05` 变更为 `0x06`。需同步更新 Hub 固件（[`firmware/esp32_hub/esp32_hub.ino`](firmware/esp32_hub/esp32_hub.ino)）和 Slave 固件（[`firmware/attiny85_slave/attiny85_slave.ino`](firmware/attiny85_slave/attiny85_slave.ino)）中的命令定义常量。

### 6.4 受影响文件

| 文件 | 变更类型 | 摘要 |
|------|---------|------|
| [`plans/Slave_PCB_Design_Spec.md`](plans/Slave_PCB_Design_Spec.md) | PCB 规范 | Pogo Pin 5→4 针；移除 WS2812 S 型链路由；WS2812 改为 PB4 本地驱动 |
| [`plans/Hub_PCB_Design_Spec.md`](plans/Hub_PCB_Design_Spec.md) | PCB 规范 | Pogo Pin 5→4 针；移除 WS2812 数据输出到 Pogo Pin |
| [`Modular_Pillbox_Architecture_v2.md`](Modular_Pillbox_Architecture_v2.md) | 架构文档 | 新增 `CMD_LED_COLOR 0x05`；`SET_ADDRESS` 改为 `0x06`；WS2812 控制章节更新 |
| [`docs/api/API_Reference.md`](docs/api/API_Reference.md) | API 文档 | 命令表新增 `0x05 CMD_LED_COLOR`；`0x06 SET_ADDRESS`；4.2 节替换为 I²C 独立控制说明 |
| [`firmware/esp32_hub/esp32_hub.ino`](firmware/esp32_hub/esp32_hub.ino) | Hub 固件 | 需更新 `CMD_SET_ADDRESS` 常量为 `0x06`，新增 `CMD_LED_COLOR 0x05` 发送逻辑 |
| [`firmware/attiny85_slave/attiny85_slave.ino`](firmware/attiny85_slave/attiny85_slave.ino) | Slave 固件 | 需新增 `case 0x05: CMD_LED_COLOR` 处理，更新 `CMD_SET_ADDRESS` 为 `0x06` |
