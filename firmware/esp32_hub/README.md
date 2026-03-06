# ESP32 Hub Firmware Guide

## 1. 简介
这是智能药箱的中枢固件，运行在 ESP32 上。它负责管理 I2C 从机（药盒模块）、连接 WiFi、提供 Web API 以及进行语音播报。

## 2. 硬件连接
根据 `config.h` 中的 `USE_PROMPT_PINS` 定义，默认引脚如下（基于用户 Prompt）：

| 功能 | 引脚 (GPIO) | 说明 |
|---|---|---|
| I2C SDA | 21 | 连接到从机和 RTC |
| I2C SCL | 22 | 连接到从机和 RTC |
| I2S LRCK | 25 | 音频字时钟 |
| I2S BCLK | 26 | 音频位时钟 |
| I2S DOUT | 27 | 音频数据输出 |
| WS2812 | 5 | LED 灯带数据 |

**注意**：如果使用 PCB 设计规范的引脚，请在 `config.h` 中注释掉 `#define USE_PROMPT_PINS`。

## 3. 依赖库
在 Arduino IDE 中，请通过 "库管理器" (Library Manager) 安装以下库：
1. **WiFiManager** by tzapu (重要：用于首次配网)
2. **ArduinoJson** by Benoit Blanchon (v6.x)
3. **RTClib** by Adafruit
4. **Adafruit NeoPixel** by Adafruit
5. **ESP8266Audio** by Earle F. Philhower, III (支持 ESP32)

## 4. 首次配网说明
本固件支持 WiFiManager 首次配网功能，无需在代码中硬编码 WiFi 信息。

### 配网步骤
1. **进入配网模式**：
   - 首次烧录后自动进入。
   - 或长按 **GPIO13 (复位按钮)** 超过 5 秒，系统将清除旧凭证并重启进入配网模式。
2. **连接热点**：使用手机搜索并连接 WiFi 热点 `MediBox-Setup`（无密码）。
3. **配置 WiFi**：连接后浏览器通常会自动弹出配置页面（若未弹出，请手动访问 `192.168.4.1`）。
4. **提交信息**：在页面中选择您家的 WiFi 并输入密码，点击保存。
5. **连接成功**：ESP32 将重启并尝试连接，成功后 LED 状态灯（GPIO4）将变绿（常亮）。

## 5. 烧录步骤
1. 安装 [Arduino IDE](https://www.arduino.cc/en/software)。
2. 在 "首选项" -> "附加开发板管理器网址" 中添加：
   `https://dl.espressif.com/dl/package_esp32_index.json`
3. 在 "开发板管理器" 中搜索并安装 **esp32**。
4. 选择开发板: **ESP32 Dev Module**。
5. 打开 `esp32_hub/esp32_hub.ino`。
6. 修改 `config.h`（注意：WiFi 信息不再需要在此修改，已由 WiFiManager 处理）。
7. 如果使用百度 TTS，请填入 API Key 和 Secret Key。
8. 点击 "上传" (Upload)。

## 5. 使用说明
- **Web API**: 访问 `http://[ESP32_IP]/api/status` 查看系统状态。
- **控制命令**: 发送 POST 到 `http://[ESP32_IP]/api/control`，Body: `{"addr": 16, "cmd": "on"}`。
- **调试**: 打开串口监视器 (115200 baud) 查看日志。
