# API Reference & Communication Protocols

This document outlines the communication interfaces for the Modular Smart Pillbox system, including the REST API for frontend-backend interaction, WebSocket for real-time updates, and the I2C protocol for internal module communication.

## 1. REST API

The ESP32 Hub exposes a RESTful API for system control and configuration.

### System Status

**Endpoint:** `GET /api/status`

Retrieves the current system snapshot, including WiFi status, RTC time, and the state of all connected pillbox modules.

**Response:**

```json
{
  "system": {
    "wifi": true,
    "rtc_time": "2023-10-27T10:00:00",
    "ip_address": "192.168.1.100"
  },
  "slaves": [
    {
      "addr": 16,
      "row": 0,
      "col": 0,
      "lid": "closed",
      "led": "off",
      "connected": true
    },
    {
      "addr": 17,
      "row": 0,
      "col": 1,
      "lid": "open",
      "led": "blink",
      "connected": true
    }
  ]
}
```

### Module Control

**Endpoint:** `POST /api/control`

Controls the LED indicator on a specific pillbox module.

**Request Body:**

```json
{
  "addr": 16,      // Module I2C Address (decimal)
  "cmd": "blink"   // Options: "on", "off", "blink"
}
```

**Response:**

```json
{ "status": "ok" }
```

### Reminder Management

**Endpoint:** `POST /api/reminders`

Adds, updates, or deletes medication reminders.

**Request Body (Add/Update):**

```json
{
  "time": "08:00",
  "days": [0, 1, 2, 3, 4, 5, 6], // 0 = Sunday
  "boxId": 16,
  "label": "Morning Meds",
  "enabled": true
}
```

**Request Body (Delete):**
*(Method: DELETE or POST with action)*

```json
{ "id": "reminder_id_123", "action": "delete" }
```

### System Configuration

**Endpoint:** `POST /api/config`

Configures system settings such as WiFi credentials and RTC time sync.

**Request Body:**

```json
{
  "wifi_ssid": "MyNetwork",
  "wifi_pass": "secret123",
  "ntp_server": "pool.ntp.org"
}
```

---

## 2. WebSocket API

Real-time updates are pushed to connected clients via WebSocket.

**URL:** `ws://<HUB_IP>:81`

### Message Structure

All WebSocket messages follow a standard JSON envelope:

```json
{
  "type": "MESSAGE_TYPE",
  "payload": { ... },
  "timestamp": 1698393600000
}
```

### Event Types

#### `STATUS_UPDATE`
Sent periodically or when a state change is detected (e.g., a lid is opened).

**Payload:**
```json
{
  "hub": {
    "wifiConnected": true,
    "uptime": 3600
  },
  "pillboxes": [
    { "id": 16, "row": 0, "col": 0, "isOpen": false, "hasPill": true }
  ]
}
```

#### `ALARM_TRIGGERED` / `REMINDER_TRIGGERED`
Sent when a medication reminder time is reached.

**Payload:**
```json
{
  "reminderId": "123",
  "boxId": 16,
  "label": "Time for medication"
}
```

#### `PILL_TAKEN`
Sent when the system detects that a pill has been removed (lid opened and closed during an alarm window).

**Payload:**
```json
{
  "boxId": 16,
  "timestamp": 1698394000000
}
```

---

## 3. I2C Protocol (Hub ↔ Slave Modules)

The ESP32 Hub acts as the I2C Master, and each ATtiny85-based pillbox module acts as an I2C Slave.

- **Bus Speed:** Standard Mode (100kHz)
- **Slave Address Range:** `0x10` (16) to `0x1F` (31)

### Command Byte Definition (Master Write)

The Hub sends a single byte command to the Slave to trigger actions.

| Command (Hex) | Name | Description | Data Bytes Followed |
| :--- | :--- | :--- | :--- |
| **0x01** | `LED_ON` | Turn LED solid ON (White) | Optional: R, G, B |
| **0x02** | `LED_OFF` | Turn LED OFF | None |
| **0x03** | `LED_BLINK` | Blink LED (Blue/Alert) | None |
| **0x04** | `GET_STATUS` | Prepare for Status Read | None |
| **0x05** | `CMD_LED_COLOR` | **Set LED RGB Color**（I²C 独立控制，替代 WS2812 菊花链。ATtiny85 PB4 本地驱动单颗 WS2812） | 3 Bytes (R, G, B) |
| **0x06** | `SET_ADDRESS` | Change Module I2C Address | 1 Byte (New Address) |

### Status Byte Definition (Master Read)

When the Hub requests 1 byte from the Slave (after sending `0x04`), the Slave responds with a status byte.

| Bit | Function | Value Description |
| :--- | :--- | :--- |
| **7** (MSB) | **Lid State** | `1` = Open, `0` = Closed |
| **6** | **LED State** | `1` = On/Blinking, `0` = Off |
| **5-4** | *Reserved* | Reserved for future use |
| **3-0** (LSB)| **Error Code** | `0000` = No Error<br>`0001` = Sensor Fault |

### Communication Flow Example (Status Check)

1.  **Hub** sends `0x04` (Write) to Slave `0x10`.
2.  **Hub** requests 1 byte (Read) from Slave `0x10`.
3.  **Slave** sends `0x80` (Binary `10000000`).
    - Bit 7 is `1` → Lid is **OPEN**.
    - Bit 6 is `0` → LED is **OFF**.

---

## 4. Topology Routing

This section describes how the 2D grid layout is managed at the physical and protocol levels.

### 4.1 I2C Parallel Bus
Since I2C is a parallel bus, all slave modules are electrically connected in parallel. This naturally supports a 2D mesh connection where Pogo Pins on all four sides (Top, Bottom, Left, Right) can extend the bus in any direction.

### 4.2 WS2812B I²C 独立控制（原 Snake Pattern 已废弃）

**原 WS2812 S 型菊花链路由已不再使用。** 当前方案为 I²C 独立控制：

- Hub 通过 I²C 命令 `CMD_LED_COLOR (0x05)` 向每个从模块单独发送 RGB 颜色值。
- 每个从模块的 ATtiny85 通过 PB4 引脚以 bit-bang 方式驱动本地单颗 WS2812。
- WS2812 的 DOUT 引脚悬空，不连接到任何连接器引脚。
- Pogo Pin 仅保留 4 路信号：**12V / GND / I²C SDA / I²C SCL**，无 WS2812 数据线。
- 无拓扑路由限制，2D 网格中任意位置模块均可独立控制 LED 颜色。

### 4.3 Coordinate Binding
The current version relies on the **"Blink to Identify"** mechanism for manual coordinate binding:
1. The Hub commands a specific module (by I2C address) to blink.
2. The user identifies the physical location and assigns the corresponding `(row, col)` coordinates via the UI.
3. The system maps the I2C address to these coordinates for future status updates and control.
