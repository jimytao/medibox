# 智能药箱 (Medibox)

> **使命**：为阿尔兹海默症老人提供贴心、可靠的用药管理解决方案。

![Project Status](https://img.shields.io/badge/Status-Phase_6_Integration-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## 📋 项目简介

Medibox 是一个模块化的智能药箱系统，专为阿尔兹海默症患者及其护理人员设计。它通过物理药盒与数字系统的结合，解决了“忘记吃药”、“吃错药”和“重复吃药”的痛点。

### 核心特性
- **模块化设计**：支持 1 个中枢 (Hub) 连接多个药盒 (Slave)，灵活扩展。
- **语音提醒 (TTS)**：清晰的语音播报，提示用药时间和剂量。
- **智能开盖检测**：霍尔传感器实时监测药盒开关状态。
- **空间映射 (Blink to Identify)**：通过 LED 闪烁快速识别物理药盒与 APP 设置的对应关系。
- **2D 栅格布局**：支持药盒自由拼接为多行多列阵列，突破线性连接限制。
- **状态同步**：Web 界面实时显示药箱状态（连接、电量、服药记录）。

---

## 🎯 快速导航

| 资源 | 说明 | 路径 |
|------|------|------|
| **架构设计** | 系统整体架构与设计理念 | [Phase 2 Architecture](Modular_Pillbox_Architecture_v2.md) |
| **2D 栅格架构** | 2D 栅格架构升级记录 | [Grid Update](2D_Grid_Architecture_Update.md) |
| **硬件规范** | PCB 设计与 3D 外壳模型 | [Plans](plans/) / [SCAD Models](.) |
| **固件代码** | ESP32 主控与 ATtiny85 从机代码 | [Firmware](firmware/) |
| **前端 UI** | Web 管理界面源码 | [UI Source](ui/) |
| **API 文档** | WebSocket 与 HTTP 接口定义 | [API Reference](docs/api/API_Reference.md) |
| **测试计划** | 系统测试与验收标准 | [Test Plan](docs/testing/Test_Plan.md) |
| **用户手册** | 老年人与家属使用指南 | [User Guide](docs/user/User_Guide.md) |

---

## 📁 项目结构

```text
medibox/
├── docs/               # 文档中心
│   ├── api/            # API 接口定义
│   ├── testing/        # 测试计划与用例
│   └── user/           # 用户手册
├── firmware/           # 嵌入式固件
│   ├── esp32_hub/      # 主控模块 (WiFi, Web Server, I2C Master)
│   └── attiny85_slave/ # 从机模块 (I2C Slave, Sensor, LED)
├── ui/                 # Web 前端项目 (React + Vite)
├── plans/              # 硬件设计规范 (PCB, BOM)
├── *.scad              # 3D 打印外壳模型 (OpenSCAD)
└── README.md           # 项目主页
```

---

## 🚀 快速开始

### 1. 硬件准备
请参考 [BOM 清单](plans/Phase2_Complete_BOM.md) 采购以下核心组件：
- ESP32 Development Board
- ATtiny85 Microcontroller
- 霍尔传感器 (Hall Effect Sensor)
- Pogo Pin 连接器
- 3D 打印外壳

### 2. 开发环境搭建
- **固件开发**：安装 [Arduino IDE](https://www.arduino.cc/en/software)，并添加 ESP32 和 ATtiny85 开发板支持。
- **前端开发**：安装 [Node.js](https://nodejs.org/) (v16+)。

### 3. 固件烧录
1. **Slave (ATtiny85)**:
   - 使用 ISP 编程器将 `firmware/attiny85_slave` 烧录至芯片。
   - 确保设置正确的 I2C 地址 (默认 0x08-0x0B)。
2. **Hub (ESP32)**:
   - 打开 `firmware/esp32_hub`。
   - 修改 `config.h` 中的 WiFi 配置（或使用配网模式）。
   - 上传代码至 ESP32。
   - 运行 `Tools > ESP32 Sketch Data Upload` 上传前端文件（需先构建前端）。

### 4. 前端部署
```bash
cd ui
npm install       # 安装依赖
npm run build     # 构建生产环境代码
# 构建产物位于 ui/dist/，需通过 SPIFFS 上传至 ESP32
```

---

## 📊 项目状态

- [x] **Phase 1**: 概念验证与原型设计
- [x] **Phase 2**: 模块化架构升级 (I2C 总线)
- [x] **Phase 3**: 硬件设计规范 (PCB & Shell)
- [x] **Phase 4**: 固件开发 (ESP32 & ATtiny85)
- [x] **Phase 5**: Web 前端开发 (已完成，含 2D 栅格升级)
- [ ] **Phase 6**: 硬件集成与系统测试 (进行中)

**当前阶段**：等待硬件打样与采购，准备进行集成测试。

---

## 📅 最近更新

- **2026-03-06**: 升级系统架构支持 2D 栅格布局，优化 Web UI 显示逻辑，支持多行多列药盒阵列。

---

## 🤝 贡献指南

欢迎参与 Medibox 的开发！

1. **报告 Bug**: 请在 Issues 页面详细描述复现步骤。
2. **提交代码**:
   - Fork 本仓库。
   - 创建特性分支 (`git checkout -b feature/AmazingFeature`)。
   - 提交更改 (`git commit -m 'Add some AmazingFeature'`)。
   - 推送到分支 (`git push origin feature/AmazingFeature`)。
   - 提交 Pull Request。

---

## 📜 许可证

本项目采用 [MIT License](LICENSE) 授权。
