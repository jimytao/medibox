# ATtiny85 Slave Firmware Guide

## 1. 简介
这是智能药箱模块的从机固件，运行在 ATtiny85 上。它负责检测药盒盖子的开关状态（通过霍尔传感器）并控制 LED 灯光。

## 2. 硬件引脚配置
**重要注意**：由于 `TinyWireS` 库强制占用 PB0 作为 SDA，我们将 LED 数据引脚调整为 PB4。

| ATtiny85 引脚 (Physical) | 功能 | 对应 Arduino 引脚 | 说明 |
|---|---|---|---|
| Pin 1 (PB5) | RESET | - | 烧录复位，不可用 |
| Pin 2 (PB3) | - | 3/A3 | 空闲 (可用作调试或地址选择) |
| Pin 3 (PB4) | **WS2812 Data** | 4/A2 | LED 灯带数据 (原 Prompt 建议 PB0，因冲突已修改) |
| Pin 4 (GND) | GND | - | 地 |
| Pin 5 (PB0) | **I2C SDA** | 0 | I2C 数据 (固定) |
| Pin 6 (PB1) | **Hall Sensor** | 1 | 霍尔传感器输入 (需上拉) |
| Pin 7 (PB2) | **I2C SCL** | 2/A1 | I2C 时钟 (固定) |
| Pin 8 (VCC) | VCC | - | 3.3V 电源 |

## 3. 依赖库
请在 Arduino IDE 中安装：
1. **Adafruit NeoPixel** by Adafruit
2. **TinyWireS** (可在库管理器搜索，或从 GitHub 下载: `nadavmatalon/TinyWireS`)

## 4. 开发板配置 (Arduino IDE)
你需要安装 **ATTinyCore** 或 **Digistump AVR Boards** 支持。
推荐使用 [ATTinyCore](https://github.com/SpenceKonde/ATTinyCore)。

1. **Board URL**: `http://drazzy.com/package_drazzy.com_index.json`
2. **Board**: ATtiny25/45/85
3. **Chip**: ATtiny85
4. **Clock**: 8 MHz (Internal) - **烧录前请先 "Burn Bootloader" 设置熔丝位**
5. **Programmer**: Arduino as ISP (如果你使用 Uno 作为编程器) 或 USBasp。

## 5. 烧录步骤
1. 将 ATtiny85 连接到编程器 (ISP 接口: MISO/PB1, MOSI/PB0, SCK/PB2, RESET/PB5)。
2. **注意**：烧录时，PB0 和 PB2 上的外设 (LED/I2C) 可能会干扰。建议在焊接前烧录，或确保电路设计允许 ISP 烧录。
3. 如果是首次使用，点击 "烧录引导程序" (Burn Bootloader) 设置 8MHz 时钟。
4. 打开 `attiny85_slave.ino`。
5. 点击 "上传"。

## 6. 功能测试
- 上电时，LED 应闪烁一次红色。
- 当 Hub 连接时，若发送命令 `0x03`，LED 应闪烁蓝色。
- 当磁铁靠近霍尔传感器 (PB1) 时，Hub 读到的状态字节 Bit 7 应为 0；移开磁铁应为 1。

## 7. 地址修改
默认地址为 `0x10`。可以通过 I2C 命令 `0x05` 修改并保存到 EEPROM，或在代码中修改 `DEFAULT_I2C_ADDR` 并重新烧录。
