# Hub Module Detailed Specification
# 中枢模块详细规范 v2.0

**Document Type**: Technical Specification  
**Version**: 2.0  
**Date**: 2026-03-02  
**Purpose**: Alzheimer's Care Medication Management System  
**Related Documents**: [`Modular_Pillbox_Architecture_v2.md`](Modular_Pillbox_Architecture_v2.md:1)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Hardware Specification](#2-hardware-specification)
3. [Firmware Architecture](#3-firmware-architecture)
4. [API Specification](#4-api-specification)
5. [Mechanical Design](#5-mechanical-design)
6. [Testing Requirements](#6-testing-requirements)

---

## 1. Overview

### 1.1 Module Purpose

The **Hub Module** serves as the central controller for the Alzheimer's medication management system, responsible for:

- **Timing**: RTC-based scheduling of medication reminders
- **Voice Output**: TTS synthesis and audio playback
- **Coordination**: I²C bus master for all slave modules
- **Connectivity**: WiFi gateway for web UI and cloud services
- **Power Distribution**: 12V DC supply to all connected modules

### 1.2 Key Differentiation from v1.0

| Feature | v1.0 Main Controller | v2.0 Hub Module |
|---------|---------------------|-----------------|
| **Role** | WiFi gateway only | Central intelligence + gateway |
| **Timing** | NTP-based (requires WiFi) | RTC-based (offline operation) |
| **Audio** | None | 3W speaker + amplifier |
| **User Alerts** | LED only | LED + voice announcements |
| **Size** | 60×60mm | 120×80mm (larger for speaker) |

### 1.3 Design Principles

1. **Offline-first**: Core reminder functionality works without internet
2. **Elderly-friendly**: Large, clear audio output (>85dB @ 1m)
3. **Reliability**: Industrial-grade RTC (±2ppm accuracy)
4. **Maintainability**: USB-C for debugging and OTA updates

---

## 2. Hardware Specification

### 2.1 Block Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Hub Module PCB                         │
│                                                             │
│  12V DC Input                                               │
│      ↓                                                      │
│  ┌──────┐    5V      ┌──────────┐                         │
│  │ LDO  │────────────→│ PAM8403  │──→ Speaker (8Ω 3W)    │
│  │ 5.0V │            │ Amplifier │                         │
│  └──────┘            └──────────┘                         │
│      ↓                    ↑                                 │
│  ┌──────┐    3.3V     I²S Audio                           │
│  │ LDO  │────────────┐   ↑                                 │
│  │ 3.3V │            │   │                                 │
│  └──────┘            ↓   ↓                                 │
│              ┌──────────────────┐                          │
│              │   ESP32-WROOM-32 │                          │
│              │                  │                          │
│              │  GPIO25: WS2812  ├──→ LED Chain            │
│              │  GPIO21: SDA     ├──┐                       │
│              │  GPIO22: SCL     ├──┤                       │
│              │  GPIO26-32: I²S  │  │                       │
│              │  GPIO33: RTC INT │  │                       │
│              └──────────────────┘  │                       │
│                      │             │                       │
│                      ↓             ↓                       │
│                  ┌─────────┐   I²C Bus                    │
│                  │ DS3231  │────────────→ Slave Modules   │
│                  │   RTC   │                              │
│                  │ + CR2032│                              │
│                  └─────────┘                              │
│                                                             │
│  12V Out ──────────────────────────────────→ Pogo Pins    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Component List

#### 2.2.1 Core Components

| Component | Part Number | Quantity | Function | Datasheet Link |
|-----------|-------------|----------|----------|----------------|
| **MCU** | ESP32-WROOM-32E | 1 | Main controller | [Espressif](espressif.com) |
| **RTC** | DS3231SN | 1 | Real-time clock | [Maxim Integrated](maximintegrated.com) |
| **Crystal** | 32.768kHz | 1 | RTC timebase (internal to DS3231) | - |
| **Battery** | CR2032 Holder | 1 | RTC backup power | - |
| **Amplifier** | PAM8403 | 1 | Audio amplifier | [Diodes Inc.](diodes.com) |
| **Speaker** | 8Ω 3W 40mm | 1 | Audio output | Generic |

#### 2.2.2 Power Management

| Component | Part Number | Quantity | Input | Output | Current |
|-----------|-------------|----------|-------|--------|---------|
| **Boost Converter** | MT3608 (v1.0, optional) | 1 | 5V USB | 12V | 1A |
| **5V LDO** | AMS1117-5.0 | 1 | 12V | 5V | 1A |
| **3.3V LDO** | AMS1117-3.3 | 1 | 5V | 3.3V | 800mA |

**Note**: If using 12V wall adapter input, MT3608 is not needed.

#### 2.2.3 Connectors and Interfaces

| Component | Type | Pin Count | Purpose |
|-----------|------|-----------|---------|
| **Pogo Pin Receptacles** | Mill-Max P50 | 6×2 (left + right) | Slave module connection |
| **USB-C** | USB 2.0 Type-C | 1 | Power input + UART debug |
| **DC Jack** | 5.5×2.1mm barrel | 1 | 12V external power (alternative) |
| **Programming Header** | 2×3 pin IDC | 1 | ESP32 JTAG (optional) |

#### 2.2.4 Passive Components

| Type | Value | Package | Quantity | Notes |
|------|-------|---------|----------|-------|
| **Resistor** | 4.7kΩ | 0805 | 2 | I²C pull-ups |
| **Resistor** | 10kΩ | 0805 | 4 | ESP32 strapping pins |
| **Capacitor** | 10μF ceramic | 0805 | 4 | LDO input/output |
| **Capacitor** | 100μF electrolytic | Through-hole | 2 | Power supply bulk |
| **Capacitor** | 10μF ceramic | 0805 | 2 | Audio AC coupling |
| **Capacitor** | 100nF ceramic | 0603 | 10 | Decoupling (0.1μF) |

### 2.3 Schematic Highlights

#### 2.3.1 ESP32 Connections

```
ESP32-WROOM-32E
├── Power
│   ├── 3.3V (VDD)
│   ├── GND (×multiple)
│   └── EN (10kΩ pull-up to 3.3V)
│
├── Programming
│   ├── GPIO0 (10kΩ pull-up, boot button to GND)
│   ├── GPIO2 (10kΩ pull-up, strapping)
│   ├── TXD0 → USB-C UART TX
│   └── RXD0 ← USB-C UART RX
│
├── I²C Bus
│   ├── GPIO21 (SDA) + 4.7kΩ pull-up → Pogo Pin
│   ├── GPIO22 (SCL) + 4.7kΩ pull-up → Pogo Pin
│   └── Connected to DS3231 (SDA/SCL)
│
├── LED Control
│   └── GPIO25 (RMT) → WS2812 DIN
│
├── Audio Output (I²S)
│   ├── GPIO26 (BCLK) → PAM8403 BCLK
│   ├── GPIO27 (LRCK) → PAM8403 LRCK
│   └── GPIO32 (DOUT) → 10μF cap → PAM8403 IN_L/IN_R
│
└── RTC Interrupt
    └── GPIO33 (INPUT) ← DS3231 INT#
```

#### 2.3.2 DS3231 RTC Wiring

```
DS3231 (SOIC-16 or Module)
├── VCC → 3.3V
├── GND → GND
├── SDA → GPIO21 (ESP32)
├── SCL → GPIO22 (ESP32)
├── INT# → GPIO33 (ESP32)  // Alarm interrupt, active-low
├── RST → 3.3V (not used)
├── 32KHZ → NC (not used)
└── VBAT → CR2032+ (via holder)
```

**Key Features**:
- **Temperature-compensated crystal oscillator (TCXO)**: ±2ppm accuracy (±1 minute/year)
- **Battery backup**: 3+ years on CR2032 (typical 200μA draw)
- **Two programmable alarms**: Alarm 1 (seconds precision), Alarm 2 (minutes precision)

#### 2.3.3 PAM8403 Audio Amplifier

```
PAM8403 (SOP-16)
├── VDD → 5V (100μF bulk cap)
├── GND → AGND (audio ground plane)
│
├── Input (AC-coupled)
│   ├── IN_L ← 10μF cap ← ESP32 GPIO32 (I²S)
│   └── IN_R ← 10μF cap ← ESP32 GPIO32 (bridged mono)
│
├── Output
│   ├── OUT_L+ \
│   ├── OUT_L-  }→ 8Ω Speaker (bridged)
│   ├── OUT_R+ /
│   └── OUT_R- → GND (mono config)
│
└── Control
    ├── SHUTDOWN → 3.3V (always on, or GPIO control)
    └── MUTE → GND (unmuted)
```

**Power Output** (Bridged-Tied Load):
- 3W @ 5V, 4Ω load
- 2W @ 5V, 8Ω load (sufficient for speech)

### 2.4 PCB Layout Guidelines

#### 2.4.1 Layer Stack-up (2-Layer FR4)

```
TOP LAYER (Component Side):
- Signal traces (I²C, I²S, GPIO)
- Power traces (3.3V, 5V thin traces)
- SMD components (ESP32, LDOs, passives)

BOTTOM LAYER (Solder Side):
- Ground plane (solid copper pour)
- 12V power plane (isolated zone)
- Through-hole components (USB-C, DC jack, Pogo Pins)
```

#### 2.4.2 Critical Routing Rules

| Net/Region | Rule | Reason |
|------------|------|--------|
| **I²C (SDA/SCL)** | <75mm trace length, 0.3mm width | Minimize capacitance |
| **I²S Audio** | Differential pairs, <50mm length | Reduce jitter |
| **WS2812 Data** | 0.3mm width, <100mm to first LED | Signal integrity |
| **Speaker Traces** | 0.8mm width, keep away from I²C | High current (2A peak) |
| **Ground Plane** | Solid pour, no splits | Low-impedance return path |
| **Analog GND** | Star-point connection to digital GND | Reduce noise coupling |

#### 2.4.3 Component Placement

```
┌────────────────────────────────────────┐
│  TOP VIEW (120mm × 80mm PCB)           │
│                                        │
│   [USB-C]      [ESP32]      [DC Jack] │
│                                        │
│   [LDO 3.3V]   [DS3231]     [LDO 5V]  │
│                [CR2032]                │
│                                        │
│   [PAM8403]    [Passives]   [Pogo L]  │
│                                        │
│   [Speaker     [WS2812]     [Pogo R]  │
│    Terminal]                          │
└────────────────────────────────────────┘
```

**Thermal Considerations**:
- PAM8403: Place near PCB edge for airflow
- LDO 3.3V/5.0V: Add thermal vias (9×, 0.3mm diameter) to bottom ground plane
- ESP32: Keep away from speaker (EMI isolation)

### 2.5 Power Budget

| Component | Voltage | Current (Typical) | Current (Peak) | Power |
|-----------|---------|-------------------|----------------|-------|
| ESP32-WROOM-32 | 3.3V | 160mA (WiFi TX) | 240mA | 0.53W |
| DS3231 RTC | 3.3V | 200μA | 300μA | 0.66mW |
| WS2812 LED (1×) | 5V | 10mA | 60mA | 0.05W |
| PAM8403 + Speaker | 5V | 500mA (avg) | 1500mA | 2.5W |
| I²C Pull-ups | 3.3V | 2mA | 2mA | 6.6mW |
| **Total from 12V** | - | - | - | **~4W** |

**12V Input Current**: 4W ÷ 12V ÷ 0.6 (efficiency) ≈ **550mA**

**Recommended Power Supply**: 12V 1A adapter (with safety margin)

---

## 3. Firmware Architecture

### 3.1 Software Modules

```
Hub Firmware (ESP32)
├── Core System
│   ├── main.cpp                  // Entry point, FreeRTOS tasks
│   ├── config.h                  // Pin definitions, constants
│   └── credentials.h             // WiFi SSID, TTS API keys
│
├── Hardware Drivers
│   ├── rtc_driver.cpp            // DS3231 I²C communication
│   ├── i2c_master.cpp            // Slave module communication
│   ├── led_controller.cpp        // WS2812 RMT driver
│   └── audio_output.cpp          // I²S + PAM8403 control
│
├── Business Logic
│   ├── schedule_engine.cpp       // Medication schedule CRUD
│   ├── reminder_fsm.cpp          // State machine (IDLE→ALERT→WAITING→COMPLETE)
│   └── history_logger.cpp        // Flash storage for adherence records
│
├── Network Services
│   ├── wifi_manager.cpp          // WiFi connection, auto-reconnect
│   ├── tts_service.cpp           // Baidu TTS HTTP client
│   ├── web_server.cpp            // HTTP REST API
│   └── websocket_server.cpp      // Real-time push to UI
│
└── Libraries (External)
    ├── TinyGPS++                 // (Future: GPS for location-based reminders)
    ├── ArduinoJson               // JSON parsing
    ├── ESP8266Audio              // MP3 decoder
    └── AsyncWebServer            // Non-blocking HTTP server
```

### 3.2 FreeRTOS Task Structure

| Task Name | Priority | Stack Size | Period | Function |
|-----------|----------|------------|--------|----------|
| **RTC_Monitor** | 5 (High) | 4KB | 1Hz | Check DS3231 alarms, trigger reminders |
| **I2C_Poller** | 4 | 2KB | 10Hz | Poll slave modules for status |
| **Reminder_FSM** | 4 | 4KB | 10Hz | State machine tick() |
| **WiFi_Manager** | 3 | 4KB | 0.1Hz | Reconnect if disconnected |
| **WebServer** | 2 | 8KB | Event | Handle HTTP/WebSocket requests |
| **LED_Update** | 1 | 2KB | 30Hz | Update WS2812 chain |

### 3.3 State Machine (Reminder Flow)

```cpp
enum State { IDLE, ALERT, WAITING, DOSAGE_SPEAK, COMPLETE };

State reminder_state = IDLE;
uint8_t target_boxes[16];  // I²C addresses (0x10-0x1F)
bool box_opened[16];
uint32_t last_alert_ms = 0;

void reminder_fsm_tick() {
    switch (reminder_state) {
        case IDLE:
            // Wait for RTC interrupt
            break;
            
        case ALERT:
            tts_speak("该吃药了");  // "Time for medicine"
            for (auto addr : target_boxes) {
                led_set(addr, WHITE, SOLID);
            }
            last_alert_ms = millis();
            reminder_state = WAITING;
            break;
            
        case WAITING:
            // Poll I²C for lid opens
            for (int i = 0; i < num_targets; i++) {
                if (!box_opened[i]) {
                    uint8_t status = i2c_read_status(target_boxes[i]);
                    if (status & 0x80) {  // Lid opened
                        box_opened[i] = true;
                        reminder_state = DOSAGE_SPEAK;
                        current_box = i;
                        return;
                    }
                }
            }
            
            // Check for 5-minute timeout
            if (millis() - last_alert_ms > 300000) {
                tts_speak("请记得吃药");  // "Remember your medicine"
                last_alert_ms = millis();
            }
            
            // Check if all done
            if (all_boxes_opened()) {
                reminder_state = COMPLETE;
            }
            break;
            
        case DOSAGE_SPEAK:
            tts_speak_dosage(current_box);  // "Take 2 pills"
            led_set(target_boxes[current_box], OFF);
            reminder_state = WAITING;
            break;
            
        case COMPLETE:
            tts_speak("已完成用药");  // "Medication complete"
            log_history();
            websocket_broadcast("{\"event\":\"complete\"}");
            reminder_state = IDLE;
            break;
    }
}
```

### 3.4 DS3231 RTC Programming

```cpp
#include <Wire.h>

#define DS3231_I2C_ADDR 0x68

// Set alarm 1 to trigger at specific time (e.g., 08:00:00)
void rtc_set_alarm(uint8_t hour, uint8_t minute) {
    Wire.beginTransmission(DS3231_I2C_ADDR);
    Wire.write(0x07);  // Alarm 1 seconds register
    Wire.write(0x00);  // Seconds = 0
    Wire.write(decToBcd(minute));  // Minutes
    Wire.write(decToBcd(hour));    // Hours (24-hour format)
    Wire.write(0x80);  // Day/Date (bit 7 = alarm when match H:M:S)
    Wire.endTransmission();
    
    // Enable alarm 1 interrupt
    Wire.beginTransmission(DS3231_I2C_ADDR);
    Wire.write(0x0E);  // Control register
    Wire.write(0x05);  // A1IE=1 (enable alarm 1), INTCN=1 (interrupt on alarm)
    Wire.endTransmission();
}

// ISR triggered when DS3231 INT# pin goes LOW
void IRAM_ATTR rtc_interrupt_handler() {
    // Clear alarm flag
    Wire.beginTransmission(DS3231_I2C_ADDR);
    Wire.write(0x0F);  // Status register
    Wire.write(0x00);  // Clear A1F and A2F flags
    Wire.endTransmission();
    
    // Trigger reminder FSM
    xTaskNotifyFromISR(reminder_task_handle, 0, eNoAction, NULL);
}

void setup() {
    pinMode(33, INPUT_PULLUP);  // DS3231 INT# pin (active-low)
    attachInterrupt(33, rtc_interrupt_handler, FALLING);
}
```

---

## 4. API Specification

### 4.1 RESTful HTTP Endpoints

**Base URL**: `http://192.168.4.1` (ESP32 AP mode) or `http://hub.local` (mDNS)

#### 4.1.1 Box Management

**GET `/api/boxes`** - List all detected modules

**Response**:
```json
{
  "boxes": [
    {
      "address": 16,  // 0x10
      "name": "降压药",
      "position": {"x": 1, "y": 0},
      "lid_open": false,
      "led_on": false,
      "last_opened": "2026-03-02T08:00:00Z"
    },
    {
      "address": 17,  // 0x11
      "name": "阿司匹林",
      "position": {"x": 2, "y": 0},
      "lid_open": true,
      "led_on": true,
      "last_opened": null
    }
  ]
}
```

**POST `/api/boxes/{address}/bind`** - Bind module to virtual position

**Request Body**:
```json
{
  "name": "降压药",
  "position": {"x": 1, "y": 0}
}
```

**Response**: `{"success": true}`

#### 4.1.2 Schedule Management

**PUT `/api/boxes/{address}/schedule`** - Set medication schedule

**Request Body**:
```json
{
  "times": ["08:00", "20:00"],  // HH:MM format (24-hour)
  "dosage": 2,  // Number of pills
  "notes": "饭后服用"  // Optional
}
```

**Response**: `{"success": true, "next_reminder": "2026-03-03T08:00:00Z"}`

**GET `/api/schedule`** - Get all schedules

**Response**:
```json
{
  "schedules": [
    {
      "address": 16,
      "times": ["08:00", "20:00"],
      "dosage": 2,
      "enabled": true
    }
  ]
}
```

#### 4.1.3 History Records

**GET `/api/history?date=2026-03-02`** - Get medication adherence history

**Response**:
```json
{
  "date": "2026-03-02",
  "records": [
    {
      "time": "08:00:00",
      "boxes": [16, 17],
      "status": "completed",
      "opened_at": "08:02:15",
      "delay_minutes": 2
    },
    {
      "time": "12:00:00",
      "boxes": [18],
      "status": "missed",
      "opened_at": null,
      "delay_minutes": null
    }
  ]
}
```

#### 4.1.4 System Control

**POST `/api/tts/test`** - Test TTS playback

**Request Body**: `{"text": "测试语音"}`

**POST `/api/system/reboot`** - Reboot hub module

### 4.2 WebSocket Protocol

**URL**: `ws://192.168.4.1/ws`

**Message Format** (JSON):

**From Hub → Client** (Events):
```json
{
  "event": "reminder_started",
  "timestamp": "2026-03-02T08:00:00Z",
  "boxes": [16, 17]
}

{
  "event": "box_opened",
  "address": 16,
  "timestamp": "2026-03-02T08:02:15Z"
}

{
  "event": "reminder_complete",
  "timestamp": "2026-03-02T08:05:30Z"
}

{
  "event": "connection_status",
  "wifi_connected": true,
  "signal_strength": -45  // dBm
}
```

**From Client → Hub** (Commands):
```json
{
  "command": "identify",
  "address": 16  // Blink LED for spatial mapping
}

{
  "command": "manual_reminder",
  "address": 16  // Trigger immediate reminder
}
```

---

## 5. Mechanical Design

### 5.1 Enclosure Dimensions

```
External: 120mm (L) × 80mm (W) × 40mm (H)
Internal: 116mm (L) × 76mm (W) × 35mm (H)
Wall Thickness: 2mm
Material: ABS or PC/ABS blend (UL94 V-0 fire rating)
```

### 5.2 Feature Layout

**Top Face**:
- Speaker grille (40mm diameter, hexagonal pattern, 2mm holes)
- Status LED (RGB indicator, 5mm diffused)
- Setup button (6mm tactile switch, flush mount)

**Front Face**:
- Power LED (green, 3mm)
- USB-C port (centered, 10mm from bottom)

**Rear Face**:
- DC jack (5.5×2.1mm, 15mm from left edge)
- Reset button (recessed, 3mm diameter)

**Left/Right Faces**:
- Pogo Pin receptacles (6-pin, vertically aligned)
- Alignment guides (ridges, ±0.5mm tolerance)

**Bottom Face**:
- Rubber feet (4×, 8mm diameter, 2mm height)
- Ventilation slots (for LDO heat dissipation)
- Label area (40×20mm, medication info sticker)

### 5.3 Assembly Instructions

1. **PCB Mounting**: 4× M2.5 screws, 3mm standoffs
2. **Speaker Installation**: Front-firing through top grille, 2× M2 screws
3. **Pogo Pin Alignment**: Press-fit receptacles, ensure perpendicularity (±0.2mm)
4. **Cable Management**: Speaker wires routed along PCB edge, strain relief
5. **Lid Attachment**: 4× M3 screws (Phillips head, flush with surface)

---

## 6. Testing Requirements

### 6.1 Functional Tests

| Test ID | Description | Pass Criteria | Equipment |
|---------|-------------|---------------|-----------|
| **HUB-F001** | Power-on self-test | ESP32 boots, WiFi AP starts within 5s | Serial monitor |
| **HUB-F002** | RTC time accuracy | Drift <1 min/week | Reference clock |
| **HUB-F003** | TTS playback | Voice clearly audible at 2m | SPL meter (>75dB) |
| **HUB-F004** | I²C communication | Successfully polls 10 slave modules | Logic analyzer |
| **HUB-F005** | WS2812 control | All LEDs addressable, no flicker | Visual inspection |
| **HUB-F006** | Alarm triggering | RTC alarm fires at scheduled time | Oscilloscope on INT# |

### 6.2 Environmental Tests

| Test ID | Condition | Duration | Pass Criteria |
|---------|-----------|----------|---------------|
| **HUB-E001** | High temperature | 50°C, 24h | No thermal shutdown, <5% timing drift |
| **HUB-E002** | Low temperature | 0°C, 24h | All functions operational |
| **HUB-E003** | Humidity | 85% RH, 40°C, 48h | No condensation, no corrosion |
| **HUB-E004** | Vibration | 5-500Hz, 1G, 1h | No loose components, no cracks |

### 6.3 Reliability Tests

| Test ID | Description | Cycles/Duration | Equipment |
|---------|-------------|-----------------|-----------|
| **HUB-R001** | Power cycling | 1000 cycles (on 10s, off 10s) | Programmable power supply |
| **HUB-R002** | Continuous operation | 168h (1 week) | Black box recording |
| **HUB-R003** | Pogo Pin mating | 10,000 insertions | Custom test jig |
| **HUB-R004** | WiFi dropout recovery | 100 disconnect events | Network simulator |

### 6.4 Safety Tests

| Test ID | Standard | Description |
|---------|----------|-------------|
| **HUB-S001** | IEC 60950-1 | Electrical safety (low voltage) |
| **HUB-S002** | EN 55032 | EMC emissions (Class B) |
| **HUB-S003** | EN 55024 | EMC immunity |
| **HUB-S004** | RoHS 2011/65/EU | Hazardous substance compliance |

### 6.5 Acceptance Criteria

Before mass production, the hub module must:
- [ ] Pass all functional tests (HUB-F001 to F006)
- [ ] Pass environmental tests at extremes (0°C, 50°C)
- [ ] Demonstrate 1-week continuous operation without failure
- [ ] Achieve TTS latency <3 seconds (WiFi connected)
- [ ] Maintain RTC accuracy ±2ppm (confirmed with calibration)
- [ ] Show <2% field failure rate in pilot production (100 units)

---

## Appendix A: Pin Assignment Reference

```
ESP32-WROOM-32E (38-pin module)

GND    1  ┌─────┐  38  GND
3V3    2  │     │  37  GPIO23
EN     3  │     │  36  GPIO22 (SCL)
GPIO36 4  │     │  35  TXD0
GPIO39 5  │     │  34  RXD0
GPIO34 6  │     │  33  GPIO21 (SDA)
GPIO35 7  │     │  32  GPIO19
GPIO32 8  │ ESP │  31  GPIO18
GPIO33 9  │ 32  │  30  GPIO5
GPIO25 10 │     │  29  GPIO17
GPIO26 11 │     │  28  GPIO16
GPIO27 12 │     │  27  GPIO4
GPIO14 13 │     │  26  GPIO0
GPIO12 14 │     │  25  GPIO2
GND    15 │     │  24  GPIO15
GPIO13 16 │     │  23  GND
GPIO9  17 │     │  22  GPIO8
GPIO10 18 │     │  21  GPIO11
GPIO11 19 └─────┘  20  GPIO6

Used Pins (v2.0 Hub):
- GPIO25: WS2812 data out (RMT)
- GPIO21: I²C SDA
- GPIO22: I²C SCL
- GPIO26: I²S BCLK
- GPIO27: I²S LRCK
- GPIO32: I²S DOUT
- GPIO33: DS3231 INT#
- GPIO13: Status LED
- GPIO34: Setup button (input-only)
- GPIO0: Boot button (strapping)
- TXD0/RXD0: UART debug

Reserved for future:
- GPIO2, GPIO4, GPIO5: User-definable
```

---

## Appendix B: BOM with Supplier Part Numbers

| Component | Manufacturer | Part Number | Quantity | Unit Price | Supplier | Lead Time |
|-----------|--------------|-------------|----------|------------|----------|-----------|
| ESP32-WROOM-32E | Espressif | ESP32-WROOM-32E(4MB) | 1 | $2.20 | LCSC, Digi-Key | 2 weeks |
| DS3231SN | Maxim | DS3231SN# | 1 | $1.50 | Mouser, LCSC | 4 weeks |
| PAM8403 | Diodes Inc. | PAM8403DR | 1 | $0.30 | LCSC, Arrow | 1 week |
| AMS1117-3.3 | AMS | AMS1117-3.3 | 1 | $0.12 | LCSC | Stock |
| AMS1117-5.0 | AMS | AMS1117-5.0 | 1 | $0.12 | LCSC | Stock |
| Pogo Pin (Female) | Mill-Max | 0906-8-15-20-75-14-11-0 | 12 | $0.18 | Digi-Key | 6 weeks |
| WS2812B-Mini | WorldSemi | WS2812B-Mini | 1 | $0.08 | LCSC, Alibaba | 2 weeks |
| CR2032 Holder | Keystone | 3001 | 1 | $0.15 | Digi-Key | Stock |
| 8Ω 3W Speaker | Generic | 40mm full-range | 1 | $0.80 | Alibaba | 2 weeks |
| USB-C Connector | Korean Hroparts | TYPE-C-31-M-12 | 1 | $0.15 | LCSC | Stock |

---

## Document Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-02 | Initial release for Phase 2 |

---

**End of Hub Module Specification**
