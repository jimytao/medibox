# Hub PCB Design Specification
# 中枢主板 PCB 设计规范

**Document Version**: 1.0  
**Date**: 2026-03-02  
**Purpose**: Complete PCB design specification for KiCad implementation  
**Related Documents**: 
- [`Modular_Pillbox_Architecture_v2.md`](../Modular_Pillbox_Architecture_v2.md:1)
- [`Hub_Module_Specification.md`](../Hub_Module_Specification.md:1)
- [`Phase2_Complete_BOM.md`](../Phase2_Complete_BOM.md:1)

---

## Table of Contents

1. [PCB Overview](#1-pcb-overview)
2. [Component Placement Guide](#2-component-placement-guide)
3. [Schematic Net List](#3-schematic-net-list)
4. [PCB Layout Guidelines](#4-pcb-layout-guidelines)
5. [Routing Rules](#5-routing-rules)
6. [Thermal Management](#6-thermal-management)
7. [DFM Checklist](#7-dfm-checklist)
8. [Gerber Generation](#8-gerber-generation)

---

## 1. PCB Overview

### 1.1 Basic Parameters

| Parameter | Specification | Notes |
|-----------|--------------|-------|
| **Board Dimensions** | 100mm × 70mm | Fits hub_module_shell.scad enclosure |
| **Layer Count** | 2 layers | Top + Bottom with copper pours |
| **Board Thickness** | 1.6mm | Standard FR4 |
| **Copper Weight** | 1 oz (35μm) | Standard thickness |
| **Surface Finish** | ENIG (gold) | Better for Pogo Pins, or HASL for economy |
| **Pogo Pin Count** | 4 pins | 12V, GND, SDA, SCL |
| **Pogo Pin Pitch** | 2.54mm | Standard pitch |
| **Minimum Trace Width** | 0.2mm | JLCPCB capability |
| **Minimum Trace Spacing** | 0.2mm | JLCPCB capability |
| **Minimum Via Size** | 0.3mm drill / 0.6mm pad | Standard via |
| **Soldermask Color** | Green | Or black for premium look |
| **Silkscreen Color** | White | High contrast |

### 1.2 Design Constraints

**Mechanical Constraints**:
- PCB must have 4× M2.5 mounting holes at corners (3mm diameter)
- Mounting hole keepout: 5mm radius from hole center
- Board edge clearance: 2mm from all traces/components
- Pogo Pin alignment: ±0.2mm tolerance (critical!)

**Electrical Constraints**:
- Power supply input: 12V DC, max 1A
- 3.3V rail capacity: 800mA (ESP32 + peripherals)
- 5V rail capacity: 1.5A (speaker amplifier peak)
- Ground plane impedance: <10mΩ between any two points

---

## 2. Component Placement Guide

### 2.1 Component List Summary

#### 2.1.1 Main ICs

| Ref Des | Component | Package | Quantity | Critical Notes |
|---------|-----------|---------|----------|----------------|
| U1 | ESP32-WROOM-32E | SMD Module 38-pin | 1 | Keep antenna area clear (15×5mm) |
| U2 | DS3231SN | SOIC-16 | 1 | Place near crystal, away from noisy circuits |
| U3 | AMS1117-5.0 | SOT-223 | 1 | Needs thermal relief, heat dissipation area |
| U4 | AMS1117-3.3 | SOT-223 | 1 | Needs thermal relief |
| U5 | PAM8403 | SOP-16 | 1 | Place near speaker terminal, isolated from digital |

#### 2.1.2 Connectors

| Ref Des | Component | Type | Quantity | Placement Notes |
|---------|-----------|------|----------|-----------------|
| J1 | DC Jack | 5.5×2.1mm barrel | 1 | Board edge, rear panel |
| J2 | USB-C | SMD 16-pin | 1 | Board edge, front panel access |
| J3 | Pogo Pin Left | Mill-Max 4-pin receptacle | 1 | Left edge, DOUT |
| J4 | Pogo Pin Right | Mill-Max 4-pin receptacle | 1 | Right edge, DOUT |
| J5 | Pogo Pin Bottom | Mill-Max 4-pin receptacle | 1 | Bottom edge, DOUT |
| J6 | Speaker Terminal | PH2.0 2-pin | 1 | Near amplifier, strain relief |
| J7 | ISP Header | 2×3 pin 2.54mm | 1 | Optional, for JTAG debugging |

#### 2.1.3 Discrete Components

| Type | Value/Part | Package | Quantity | Notes |
|------|------------|---------|----------|-------|
| R1, R2 | 4.7kΩ ±5% | 0805 | 2 | I²C pull-ups |
| R3, R4, R5, R6 | 10kΩ ±5% | 0805 | 4 | ESP32 strapping pins |
| R7 | 1kΩ ±5% | 0805 | 1 | Power LED current limit |
| R8 | 330Ω ±5% | 0805 | 1 | WS2812 data line protection |
| C1, C2, C3, C4 | 10μF 10V | 0805 Ceramic | 4 | LDO input/output |
| C5, C6 | 100μF 16V | Radial 6×7mm | 2 | Power bulk capacitors |
| C7, C8 | 10μF 10V | 0805 Ceramic | 2 | Audio AC coupling |
| C9-C18 | 100nF 50V | 0603 Ceramic | 10 | Decoupling (one per IC VCC) |
| D1 | Green LED 3mm | Through-hole | 1 | Power indicator |
| D2 | WS2812B-Mini | 3.5×3.5mm SMD | 1 | Status indicator |
| SW1, SW2 | 6×6mm Tactile | Through-hole | 2 | Reset + Boot buttons |
| BT1 | CR2032 Holder | SMD or Through-hole | 1 | RTC battery backup |
| Y1 | 32.768kHz Crystal | 3×8mm Cylinder | 1 | RTC timebase (if not internal to DS3231) |

### 2.2 Physical Layout (Top View)

```
┌──────────────────────────────────────────────────────────────────────┐
│  100mm × 70mm PCB - Top Layer Component Placement                    │
│                                                                       │
│  [M2.5]                                            [M2.5]            │
│    ○                                                  ○              │
│                                                                       │
│  ┌─J1──┐         ┌────────────────┐           ┌─J2─┐               │
│  │DC   │         │                │           │USB-C│               │
│  │Jack │         │   ESP32-WROOM  │           └─────┘               │
│  └─────┘         │      U1        │                                 │
│                  │                │         ┌──────────┐            │
│  ┌─U3──┐         └────────────────┘         │  DS3231  │            │
│  │AMS  │                                    │    U2    │            │
│  │1117 │          [WiFi Antenna Area]       └──────────┘            │
│  │-5.0 │          [Keep Clear 15×5mm]        ┌─BT1──┐              │
│  └─────┘                                     │CR2032│              │
│    ↓               ┌──────────────┐          └──────┘              │
│  [C5,C6]           │ Decoupling   │                                 │
│  100μF             │ Caps Array   │         ┌─U4──┐                │
│                    │ C9-C18       │         │AMS  │                │
│  ┌──────────┐      └──────────────┘         │1117 │                │
│  │ PAM8403  │                                │-3.3 │                │
│  │    U5    │       [R1-R8]                  └─────┘                │
│  └──────────┘       Resistors                                       │
│      ↓                                                               │
│   ┌─J5──┐          [SW1] [SW2]              [D2]                   │
│   │Spkr │          Reset  Boot            WS2812                   │
│   └─────┘                                                           │
│                                                                      │
│  ┌─J3──┐                                           ┌─J4──┐          │
│  │Pogo │          [J5 Pogo Bottom]                 │Pogo │          │
│  │Pin  │               ┌────┐                      │Pin  │          │
│  │Left │               │ 5P │                      │Right│          │
│  │     │               └────┘                      │     │          │
│  └─────┘                                           └─────┘          │
│                                                                      │
│    ○                                                  ○              │
│  [M2.5]                                            [M2.5]            │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.3 Component Placement Rules

**Critical Placement Rules**:

1. **ESP32 Module (U1)**:
   - Position: Center-top area
   - Antenna zone: 15mm × 5mm keepout at module edge (no copper, no components)
   - Orientation: Antenna pointing toward board edge (away from metal enclosure)
   - Clearance: ≥10mm from high-current traces (speaker output)

2. **Power Regulators (U3, U4)**:
   - AMS1117-5.0 (U3): Top-left, near DC input (J1)
   - AMS1117-3.3 (U4): Below U3 or near ESP32
   - Thermal consideration: ≥5mm spacing from each other
   - Input/output caps within 5mm of IC pins

3. **RTC Module (U2)**:
   - Position: Top-right, away from WiFi antenna
   - Battery holder (BT1): Adjacent to DS3231
   - Crystal (Y1): If external, place within 5mm of DS3231 XIN/XOUT pins
   - I²C lines: Short traces to ESP32 (maximize <50mm)

4. **Audio Amplifier (U5)**:
   - Position: Bottom-left, near speaker connector (J6)
   - Isolation: ≥15mm from ESP32 and digital circuitry
   - Ground: Dedicated star-point to analog ground

5. **Pogo Pins (J3, J4, J5)**:
   - Alignment: Left/Right edges (centered) and Bottom edge (centered)
   - J3 (Left): DOUT
   - J4 (Right): DOUT
   - J5 (Bottom): DOUT (Primary feed for 2D grid)
   - Spacing: Exactly as designed in hub_module_shell.scad (2.54mm pitch)
   - Mechanical support: Through-hole or SMD with reinforcement pads
   - Test point access: Add small vias nearby for test probe access

6. **Decoupling Capacitors (C9-C18)**:
   - Placement: Within 5mm of each IC VCC pin
   - Via placement: GND via immediately adjacent to capacitor pad
   - Quantity: At least one 100nF per IC, two for ESP32 (one per VCC pin)

---

## 3. Schematic Net List

### 3.1 Power Distribution Network

#### 3.1.1 12V Primary Power

```
NET: 12V_IN
===================================
J1 (DC Jack) Pin 1 (VCC)
  ├─→ C1+ (10μF input filter)
  ├─→ U3 (AMS1117-5.0) Pin VIN
  ├─→ J3 (Pogo Left) Pin 1
  ├─→ J4 (Pogo Right) Pin 1
  └─→ J5 (Pogo Bottom) Pin 1

C1- → GND
```

#### 3.1.2 5V Secondary Rail

```
NET: 5V_OUT
===================================
U3 (AMS1117-5.0) Pin VOUT
  ├─→ C2+ (22μF output filter)
  ├─→ U4 (AMS1117-3.3) Pin VIN
  ├─→ U5 (PAM8403) Pin VDD
  └─→ C5+ (100μF bulk capacitor)

C2-, C5- → GND
```

#### 3.1.3 3.3V Logic Rail

```
NET: 3.3V
===================================
U4 (AMS1117-3.3) Pin VOUT
  ├─→ C3+ (22μF output filter)
  ├─→ U1 (ESP32) Pin 3V3 (×2 pins)
  ├─→ U2 (DS3231) Pin VCC
  ├─→ R1 (4.7kΩ) - I²C SDA pull-up
  ├─→ R2 (4.7kΩ) - I²C SCL pull-up
  ├─→ R3 (10kΩ) - ESP32 EN pull-up
  ├─→ R4 (10kΩ) - ESP32 GPIO0 pull-up
  ├─→ R5 (10kΩ) - ESP32 GPIO2 pull-up
  ├─→ C9+ through C18+ (100nF decoupling caps)
  └─→ D2 (WS2812) Pin VDD

C3- → GND
All decoupling caps negative → GND
```

#### 3.1.4 Ground Network

```
NET: GND (continuous plane)
===================================
J1 (DC Jack) Pin 2 (GND)
  ├─→ U1 (ESP32) Pin GND (×multiple)
  ├─→ U2 (DS3231) Pin GND
  ├─→ U3 (AMS1117-5.0) Pin GND + Tab
  ├─→ U4 (AMS1117-3.3) Pin GND + Tab
  ├─→ U5 (PAM8403) Pin GND
  ├─→ J2 (USB-C) Pin GND
  ├─→ J3 (Pogo Left) Pin 2
  ├─→ J4 (Pogo Right) Pin 2
  └─→ J5 (Pogo Bottom) Pin 2

** Implement as solid copper pour on top and bottom layers **
** Connect layers with multiple vias (grid pattern, 5mm spacing) **
```

### 3.2 I²C Bus

```
NET: I2C_SDA
===================================
U1 (ESP32) Pin GPIO21
  ├─→ R1 (4.7kΩ pull-up to 3.3V)
  ├─→ U2 (DS3231) Pin SDA
  ├─→ J3 (Pogo Left) Pin 3
  ├─→ J4 (Pogo Right) Pin 3
  └─→ J5 (Pogo Bottom) Pin 3

NET: I2C_SCL
===================================
U1 (ESP32) Pin GPIO22
  ├─→ R2 (4.7kΩ pull-up to 3.3V)
  ├─→ U2 (DS3231) Pin SCL
  ├─→ J3 (Pogo Left) Pin 4
  ├─→ J4 (Pogo Right) Pin 4
  └─→ J5 (Pogo Bottom) Pin 4

Keep trace length <75mm, width 0.3mm
Route parallel to SDA (differential-like, ±5mm length matching)
```

### 3.3 WS2812 Hub 本地 LED

Hub 上的 WS2812（D2）仅作 Hub 自身状态指示，**不通过 Pogo Pin 向从模块输出 WS2812 数据**。
各从模块的 WS2812 由 ATtiny85 通过 I²C 命令 `CMD_LED_COLOR (0x05)` 独立控制本地 LED。

```
NET: WS2812_HUB_LOCAL (仅 Hub 本地，不连接 Pogo Pin)
===================================
U1 (ESP32) Pin GPIO25
  ├─→ R8 (330Ω series resistor, surge protection)
  └─→ D2 (WS2812B-Mini) Pin DIN

D2 DOUT → 悬空 (NC)

Trace width: 0.3mm
Max length to D2: <100mm
Add 100nF cap at D2 VDD pin

注意：J3/J4/J5 上无 Pin 5（WS2812 数据引脚已移除），Pogo Pin 仅承载 4 路信号：
  Pin 1: 12V, Pin 2: GND, Pin 3: I2C_SDA, Pin 4: I2C_SCL
```

### 3.4 Audio Subsystem (I²S)

```
NET: I2S_BCLK (Bit Clock)
===================================
U1 (ESP32) Pin GPIO26
  └─→ U5 (PAM8403) Pin BCLK

Trace width: 0.25mm
Route with ground guard on both sides (3mm spacing)
Keep away from I²C, WS2812 data lines
```

```
NET: I2S_LRCK (Word Select / Left-Right Clock)
===================================
U1 (ESP32) Pin GPIO27
  └─→ U5 (PAM8403) Pin LRCK

Trace width: 0.25mm
Route parallel to BCLK (±3mm length matching)
```

```
NET: I2S_DATA (Audio Data)
===================================
U1 (ESP32) Pin GPIO32
  ├─→ C7+ (10μF AC coupling capacitor)
  └─→ U5 (PAM8403) Pin IN_L

C7- → U5 (PAM8403) Pin IN_L_GND (internal bias)

For mono configuration:
U5 Pin IN_R → C8 → GPIO32 (bridge tied load)
```

```
NET: SPEAKER_OUT+ / SPEAKER_OUT-
===================================
U5 (PAM8403) Pin OUT_L+
  └─→ J5 (Speaker) Pin 1

U5 (PAM8403) Pin OUT_L-
  └─→ J5 (Speaker) Pin 2 (or GND for SE mode)

Trace width: 0.6mm (high current, up to 1A peak)
Keep short: <50mm
Avoid crossing digital signals
```

### 3.5 RTC Interrupt and Control

```
NET: RTC_INTERRUPT
===================================
U2 (DS3231) Pin INT# (active-low)
  └─→ U1 (ESP32) Pin GPIO33 (with internal pull-up enabled)

Trace width: 0.2mm
Add ESD protection diode if exposed to external connections
```

```
NET: RTC_BACKUP
===================================
BT1 (CR2032) Positive terminal
  └─→ U2 (DS3231) Pin VBAT

BT1 Negative terminal → GND
```

### 3.6 User Interface

```
NET: RESET_BTN
===================================
SW1 (Reset button) Pin 1
  └─→ U1 (ESP32) Pin EN

SW1 Pin 2 → GND
R3 (10kΩ) pulls EN to 3.3V when button not pressed
```

```
NET: BOOT_BTN
===================================
SW2 (Boot button) Pin 1
  └─→ U1 (ESP32) Pin GPIO0

SW2 Pin 2 → GND
R4 (10kΩ) pulls GPIO0 to 3.3V (normal boot mode)
Press during reset to enter bootloader mode
```

```
NET: POWER_LED
===================================
3.3V
  ├─→ R7 (1kΩ current limit)
  └─→ D1 (Green LED) Anode

D1 Cathode → GND

Forward voltage: ~2.0V, current: ~1.3mA (visible but low power)
```

### 3.7 USB Debug Interface

```
NET: USB_DP / USB_DM
===================================
J2 (USB-C) Pin D+ (A6/B6)
  └─→ U1 (ESP32) Pin TXD0 (via CP2102 if not direct)

J2 (USB-C) Pin D- (A7/B7)
  └─→ U1 (ESP32) Pin RXD0

** Option 1: Direct UART connection (simpler) **
ESP32 TXD0 → CH340G TX → USB D+
ESP32 RXD0 ← CH340G RX ← USB D-

** Option 2: USB-to-Serial IC on board **
Add U6 (CH340G or CP2102) between USB-C and ESP32 UART pins
Requires additional 12MHz crystal for CH340G
```

```
NET: USB_VBUS
===================================
J2 (USB-C) Pin VBUS (A4/B4, A9/B9)
  ├─→ Optional: Schottky diode → 5V rail (for USB-powered operation)
  └─→ Test point for power monitoring

If USB power is used, add reverse polarity protection:
VBUS → Schottky → 5V_OUT (parallel with AMS1117-5.0 output)
```

---

## 4. PCB Layout Guidelines

### 4.1 Layer Stackup (2-Layer Board)

```
┌─────────────────────────────────────────────┐
│  TOP LAYER (Component Side)                 │
│  - Signal routing (I²C, I²S, GPIO)          │
│  - Power traces (12V, 5V, 3.3V)             │
│  - SMD component pads                       │
│  - Copper pour: 3.3V zones (small areas)    │
├─────────────────────────────────────────────┤
│  FR4 Core: 1.6mm                            │
├─────────────────────────────────────────────┤
│  BOTTOM LAYER (Solder Side)                 │
│  - Ground plane (solid pour, max coverage)  │
│  - 12V power plane (isolated zone)          │
│  - Return paths for high-current signals    │
│  - Through-hole component connections       │
└─────────────────────────────────────────────┘

Via Types:
- Signal vias: 0.3mm drill / 0.6mm pad
- Power vias: 0.4mm drill / 0.8mm pad
- Thermal vias (under LDOs): 0.3mm drill, filled, array of 9× vias
```

### 4.2 Copper Pour Strategy

**Top Layer**:
- Priority: Keep clear for routing flexibility
- Small 3.3V pours: Around ESP32, DS3231 (local power distribution)
- Hatched pour: 0.5mm traces, 1mm spacing (reduces capacitance)

**Bottom Layer**:
- Primary: Solid GND plane (>85% coverage)
- Secondary: 12V power zone (top-left corner, near J1)
  - Isolated from GND with 1mm clearance
  - Width: 30mm × 25mm area
  - Connects: J1, U3 input, Pogo Pins
- Stitching vias: Grid pattern, 5mm × 5mm spacing (connects top/bottom GND)

**Thermal Relief**:
- LDO tabs (U3, U4): Direct connection to bottom GND pour (no thermal relief)
- Other pads: Standard thermal relief (4 spokes, 0.3mm width)

### 4.3 Critical Routing Zones

#### Zone 1: ESP32 WiFi Antenna Area
```
┌──────────────────────────────────┐
│  KEEPOUT ZONE (15mm × 5mm)       │
│  - No copper on top or bottom    │
│  - No components                 │
│  - No traces (routing prohibited)│
│  - Extends 2mm beyond antenna    │
│  - Silkscreen marking recommended│
└──────────────────────────────────┘
```

#### Zone 2: Audio Analog Ground
```
ESP32 → Digital GND (main plane)
           ↓
      Single point connection (choke or 0Ω resistor)
           ↓
PAM8403 → Analog GND (isolated pour)
           ↓
Speaker GND → Chassis GND (if metal enclosure)

** Avoid ground loops in audio path **
```

#### Zone 3: High-Speed Signal Routing Priority
```
Routing Order (high to low priority):
1. I²S signals (BCLK, LRCK, DATA) - Matched length ±3mm
2. I²C signals (SDA, SCL) - Matched length ±5mm
3. WS2812 data line - Single trace, no branching
4. Power traces (12V > 5V > 3.3V) - Width based on current
5. General GPIO - Standard 0.2mm width
```

### 4.4 Component Orientation Guidelines

**All ICs**:
- Pin 1 indicator: Top-left or marked with dot on silkscreen
- Orientation: Standardize all ICs facing same direction (aids assembly)

**Passive Components**:
- Resistors: Orient tax code readable from left or bottom
- Capacitors: Polarity mark on silkscreen (for electrolytics)
- LEDs: Cathode band clearly marked

**Connectors**:
- Pogo Pins: Alignment markers on silkscreen (±0.1mm tolerance required)
- USB-C: Mid-board mounting holes for mechanical strength
- DC Jack: Stress relief area (2mm clearance around mounting holes)

---

## 5. Routing Rules

### 5.1 Trace Width Requirements

| Net Type | Current | Trace Width | Temp Rise | Notes |
|----------|---------|-------------|-----------|-------|
| **12V Power** | 1A | 0.8mm | <10°C | From J1 to U3, Pogo Pins |
| **5V Power** | 1.5A | 0.6mm | <10°C | U3 output to U4, PAM8403 |
| **3.3V Power** | 800mA | 0.4mm | <5°C | U4 output to ESP32, DS3231 |
| **GND Returns** | - | Pour | - | Solid plane, maximize coverage |
| **Speaker Output** | 1A peak | 0.6mm | <15°C | Differential pair, short routing |
| **I²C (SDA/SCL)** | <5mA | 0.3mm | - | Controlled impedance ~50Ω |
| **I²S Audio** | <1mA | 0.25mm | - | Matched length, guard traces |
| **WS2812 Data** | <1mA | 0.3mm | - | 仅 Hub 本地（D2），不连接 Pogo Pin；Series 330Ω resistor |
| **GPIO Signals** | <10mA | 0.2mm | - | Standard digital signals |

**Temperature Rise Calculation** (IPC-2221):
- Formula: ΔT = k × I^1.6 / (W × T)^0.8
- k = 0.048 (internal traces), 0.024 (external traces)
- I = current (A), W = width (mm), T = thickness (oz)

### 5.2 Clearance Requirements

| Clearance Type | Distance | Standard |
|----------------|----------|----------|
| **Trace to Trace** | 0.2mm | JLCPCB min |
| **Trace to Pad** | 0.2mm | JLCPCB min |
| **Trace to Via** | 0.15mm | Design rule |
| **Trace to Board Edge** | 2mm | Mechanical |
| **Trace to Mounting Hole** | 3mm | Keep-out radius |
| **High Voltage (12V) to Low** | 0.5mm | Safety margin |
| **Component to Component** | 0.3mm | Assembly clearance |

### 5.3 Differential Pair Routing

**I²C Bus (SDA/SCL)**:
- Not true differential, but route as matched pair for noise immunity
- Trace width: 0.3mm
- Spacing: 0.3mm (center-to-center: 0.6mm)
- Length matching: ±5mm
- Avoid routing under noisy components (PAM8403, power inductors)

**I²S Audio (BCLK/LRCK paired, DATA separate)**:
- BCLK ↔ LRCK spacing: 0.5mm
- Length matching: ±3mm (critical for audio sync)
- Guard traces: GND traces on both sides (3mm spacing from signal)
- Guard trace width: 0.3mm, connected to GND every 10mm via

**Speaker Output (OUT_L+/OUT_L-)**:
- Differential pair: 0.6mm traces, 0.6mm spacing
- Length: <50mm (minimize EMI)
- Keep away from I²C and WS2812 data (>5mm separation)

### 5.4 Via Placement Strategy

**Signal Vias**:
- Minimize count (each via adds ~0.5pF capacitance)
- Avoid vias on high-speed signals (>10MHz) when possible
- Teardrops enabled for manufacturing reliability

**Ground Vias**:
- Abundant: Place adjacent to every decoupling capacitor
- Thermal vias under LDOs: 3×3 grid, 2mm spacing
- Stitching vias: 5mm grid across entire board (connects top/bottom GND)

**Power Vias**:
- Larger size: 0.4mm drill for high-current paths (>500mA)
- Multiple parallel vias for redundancy (e.g., 3× vias for 5V to PAM8403)

### 5.5 Special Routing Considerations

#### ESP32 Antenna Routing
```
ESP32 Module → Antenna trace (50Ω microstrip)
  - Width: 1.8mm (for 1.6mm FR4, εr=4.5)
  - Keep-out: 3× trace width on each side (5.4mm)
  - No vias within 2mm of antenna trace
  - Terminate at board edge (if external antenna connector)
```

#### WS2812 Data Line（Hub 本地）
```
ESP32 GPIO25 → [R8: 330Ω] → D2 WS2812 DIN（仅 Hub 状态指示）

DOUT → 悬空 (NC)，不连接 Pogo Pin

Add decoupling cap at D2 VDD:
    100nF → GND（紧贴 D2 VDD 引脚）

Purpose: Hub 状态 LED 指示（系统运行/WiFi/提醒状态）
注意：从模块的 WS2812 通过 I²C CMD_LED_COLOR (0x05) 独立控制，无需 Hub 驱动数据线
```

#### I²C Bus Routing Best Practices
```
1. Minimize stubs: Connect SDA/SCL directly to each device
2. Pull-up placement: Near master (ESP32) for best noise immunity
3. Trace topology:

   ESP32 ──────┬─────── DS3231
   GPIO21      │
               └─────── Pogo Pins (J3, J4)
   
   ** NOT a stub:
   ESP32 ────── DS3231 ────── Pogo Pins
```

---

## 6. Thermal Management

### 6.1 Heat Sources and Dissipation

#### 6.1.1 AMS1117-5.0 (U3) Thermal Analysis

**Power Dissipation**:
```
P = (VIN - VOUT) × IOUT
P = (12V - 5V) × 1A = 7W (worst case)
```

**Thermal Resistance**:
- θJA (junction-to-ambient, SOT-223): 110°C/W (no heatsink)
- θJC (junction-to-case): 10°C/W
- Maximum junction temp: 125°C

**Temperature Rise** (no heatsink):
```
ΔT = P × θJA = 7W × 110°C/W = 770°C (OVERHEAT!)
```

**Solution**: Thermal relief via bottom copper pour
```
Effective θJA with 4cm² copper pour: ~35°C/W
ΔT = 7W × 35°C/W = 245°C (still too high!)

** Required: Add external heatsink or reduce input voltage **

Option 1: Use 9V input instead of 12V
P = (9V - 5V) × 1A = 4W
ΔT = 4W × 35°C/W = 140°C (marginal at 85°C ambient)

Option 2: Use buck converter (MT3608 or similar)
Efficiency: ~85%
P_loss = 5W × (1 - 0.85) = 0.75W
ΔT = 0.75W × 35°C/W = 26°C (ACCEPTABLE)

** RECOMMENDATION: Use DC-DC buck converter for 12V→5V **
** Keep AMS1117-5.0 for prototype, replace with MT3608 module in production **
```

#### 6.1.2 Thermal Relief Design

**Bottom Copper Pour Heatsink**:
```
┌─────────────────────────────────┐
│  Top Layer: U3 (AMS1117-5.0)    │
│         [TAB connected to GND]  │
│              ↓                   │
│      Thermal Vias (3×3 array)   │
│         0.3mm drill              │
│         1.5mm spacing            │
│              ↓                   │
├─────────────────────────────────┤
│  Bottom Layer: GND Copper Pour  │
│  ┌───────────────────────────┐  │
│  │  Copper Zone: 40×30mm     │  │
│  │  Thickness: 35μm (1oz)    │  │
│  │  Thermal mass ~10g        │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘

Thermal via array:
○ ○ ○    Each via: 0.3mm drill, plated
○ ○ ○    Spacing: 1.5mm center-to-center
○ ○ ○    Total: 9 vias

Thermal conductivity:
- Copper: 400 W/m·K
- Via plating: 380 W/m·K
- Effective area: ~12 cm² (dissipates ~15W with 50°C rise)
```

**Optional External Heatsink**:
- Type: Adhesive aluminum heatsink, 20×20×10mm
- Thermal interface: Thermal tape or paste
- Placement: Top side, over U3
- Additional thermal reduction: ~15°C

#### 6.1.3 AMS1117-3.3 (U4) Thermal Management

**Power Dissipation**:
```
P = (5V - 3.3V) × 0.8A = 1.36W (manageable)
ΔT = 1.36W × 35°C/W = 47.6°C (OK with copper pour)
```

**Design**:
- Same thermal via array as U3 (3×3 grid)
- Copper pour: 30×20mm on bottom layer
- No external heatsink needed

#### 6.1.4 PAM8403 Thermal Consideration

**Power Dissipation**:
- Efficiency: >90% (Class-D amplifier)
- P_loss = 3W × (1 - 0.9) = 0.3W (negligible)
- No special thermal management needed

**Board Placement**:
- Near board edge for airflow
- Copper pour for EMI shielding (not thermal)

### 6.2 Thermal Simulation Recommendations

**Tools**:
- KiCad Plugin: Thermal Calculator
- External: Ansys Icepak, COMSOL Multiphysics (overkill for 2-layer board)

**Key Parameters to Verify**:
1. U3 junction temperature: Must be <100°C at 25°C ambient, worst case
2. U4 junction temperature: Target <80°C
3. PCB hot spots: No area > 70°C (ABS enclosure limit)
4. ESP32 module: <60°C (WiFi performance degrades above this)

### 6.3 Passive Cooling Enhancements

**Ventilation Holes in Enclosure**:
- Bottom face: 6× Ø3mm holes under LDO area
- Top face: 3× Ø2mm holes (chimney effect)
- Net airflow: ~0.01 m³/min (natural convection)

**PCB-to-Enclosure Heat Transfer**:
- Avoid full contact (creates hot spots)
- Use standoffs: 3mm height provides air gap
- Thermal pads: Optional, between LDO copper pour and enclosure wall

---

## 7. DFM Checklist

### 7.1 Fabrication Checks

- [ ] **Board dimensions**: 100mm × 70mm ±0.2mm
- [ ] **Mounting holes**: 4× M2.5 (3.0mm diameter drill)
- [ ] **Hole-to-edge clearance**: ≥5mm from board edge
- [ ] **Minimum trace width**: 0.2mm (verify all traces meet this)
- [ ] **Minimum trace spacing**: 0.2mm (run DRC check)
- [ ] **Minimum drill size**: 0.3mm (vias and holes)
- [ ] **Annular ring**: Minimum 0.15mm (pad diameter - drill diameter) / 2
- [ ] **Soldermask clearance**: 0.1mm from pads (auto-generated)
- [ ] **Silkscreen line width**: ≥0.15mm (ensure readability)
- [ ] **Silkscreen to pad clearance**: ≥0.15mm (avoid solder bridges)
- [ ] **No silkscreen over vias or pads**: Verify manually
- [ ] **Board outline**: Closed polyline, no gaps
- [ ] **Copper pour clearance**: 0.5mm from board edge
- [ ] **Fiducial marks**: Add 3× global fiducials (1mm copper circles)
- [ ] **Layer stackup documented**: Top, Bottom, defined in Gerber notes

### 7.2 Assembly Checks

#### SMD Component Orientation
- [ ] **All IC Pin 1 marked**: Dot on silkscreen, consistent orientation
- [ ] **Polarized capacitors marked**: "+" symbol on silkscreen
- [ ] **LED polarity marked**: Anode/cathode clearly labeled
- [ ] **Component reference designators visible**: Not hidden under components
- [ ] **Component values on silkscreen**: For hand assembly reference

#### Through-Hole Components
- [ ] **Hole sizes correct**: 
  - DC jack: 2.0mm drill (verify datasheet)
  - Tactile switches: 1.0mm drill
  - Speaker terminal: 1.2mm drill
- [ ] **Pad sizes adequate**: 1.8× drill diameter (e.g., 1.0mm drill → 1.8mm pad)
- [ ] **Mechanical support**: USB-C mounting holes plated and connected to GND

#### Critical Alignments
- [ ] **Pogo Pin alignment**: 
  - J3 and J4 positions verified against hub_module_shell.scad
  - Pitch: 2.54mm ±<0.1mm
  - Vertical alignment: Within ±0.2mm
  - Add alignment marks on silkscreen
- [ ] **ESP32 antenna keepout**: 15×5mm area completely clear
- [ ] **USB-C connector position**: Aligns with enclosure cutout
- [ ] **DC jack position**: Aligns with enclosure rear panel hole
- [ ] **Speaker terminal position**: Cable routing path clear

### 7.3 Electrical Checks

- [ ] **Power trace widths**: 
  - 12V: ≥0.8mm ✓
  - 5V: ≥0.6mm ✓
  - 3.3V: ≥0.4mm ✓
- [ ] **Decoupling capacitors placement**: Within 5mm of IC VCC pins
- [ ] **GND via distribution**: At least one via per decoupling cap
- [ ] **Pull-up resistors**: R1, R2 connected to 3.3V and I²C nets
- [ ] **I²C trace length**: SDA and SCL <75mm
- [ ] **I²S trace matching**: BCLK ↔ LRCK within ±3mm
- [ ] **No floating nets**: All nets connected (run ERC check)
- [ ] **No unconnected pads**: Manual visual inspection
- [ ] **Thermal vias under LDOs**: 9× vias minimum per IC
- [ ] **Test points added**: 
  - 12V, 5V, 3.3V, GND (for power rail testing)
  - I²C SDA, SCL (for bus debugging)
  - WS2812 data (for LED chain testing)

### 7.4 Manufacturing Specifications

**Provide to JLCPCB**:
- [ ] **Gerber files**: RS-274X format (see Section 8)
- [ ] **Drill files**: Excellon format, metric units
- [ ] **Board specifications**:
  - Layers: 2
  - Thickness: 1.6mm
  - Copper weight: 1oz (35μm)
  - Surface finish: ENIG (or HASL lead-free)
  - Soldermask: Green (or black)
  - Silkscreen: White
  - Minimum trace/space: 0.2mm / 0.2mm
  - Minimum drill: 0.3mm
- [ ] **Special requirements**:
  - Impedance control: Not required (if <100MHz)
  - Edge plating: Not required
  - Via filling: Not required (unless high-current vias)
  - Gold fingers: Not required

### 7.5 Quality Assurance

**Visual Inspection Points** (upon receiving boards):
1. No copper exposed outside pads/traces
2. Soldermask uniform, no voids >1mm
3. Silkscreen legible, aligned with pads
4. Mounting holes clean, no burrs
5. Board edges smooth (no routing marks >0.5mm)
6. No delamination or discoloration

**Electrical Testing** (before assembly):
- Continuity test: 12V → Pogo Pins
- Continuity test: GND plane (any two points <1Ω)
- Isolation test: 12V ↔ GND (>10MΩ)
- Isolation test: 5V ↔ 3.3V (>10MΩ when unpowered)

---

## 8. Gerber Generation

### 8.1 Required Files for Manufacturing

Generate from KiCad using **Plot** function:

| File Name | Layer | Description |
|-----------|-------|-------------|
| `Hub_PCB-F_Cu.gbr` | F.Cu | Top copper (component side) |
| `Hub_PCB-B_Cu.gbr` | B.Cu | Bottom copper (solder side) |
| `Hub_PCB-F_Mask.gbr` | F.Mask | Top soldermask |
| `Hub_PCB-B_Mask.gbr` | B.Mask | Bottom soldermask |
| `Hub_PCB-F_Silkscreen.gbr` | F.SilkS | Top silkscreen (white ink) |
| `Hub_PCB-B_Silkscreen.gbr` | B.SilkS | Bottom silkscreen (optional) |
| `Hub_PCB-Edge_Cuts.gbr` | Edge.Cuts | Board outline |
| `Hub_PCB-PTH.drl` | Drill | Plated through-holes |
| `Hub_PCB-NPTH.drl` | Drill | Non-plated holes (if any) |

**Additional Files** (for assembly):
| File Name | Format | Content |
|-----------|--------|---------|
| `Hub_PCB-BOM.csv` | CSV | Bill of materials (Ref Des, Value, Footprint, Qty) |
| `Hub_PCB-CPL.csv` | CSV | Component placement (Ref, X, Y, Rotation, Side) |
| `Hub_PCB-Schematic.pdf` | PDF | Reference schematic for debugging |

### 8.2 KiCad Plot Settings

**Gerber Options**:
```
Format: Gerber (RS-274X)
Units: Millimeters
Coordinate format: 4.6 (6-digit precision)
Include netlist attributes: Yes (for fabrication notes)
Use Protel filename extensions: No (use .gbr)
Generate drill file: Separate (not embedded)
Subtract soldermask from silkscreen: Yes
```

**Drill File Options**:
```
Format: Excellon
Units: Millimeters
Zero format: Decimal format
Mirror Y axis: No
Minimal header: No
PTH and NPTH in single file: No (separate files)
Oval holes drill mode: Use route command
Map file: Generate (PDF format, for verification)
```

### 8.3 JLCPCB Ordering Parameters

**When placing order on jlcpcb.com**:

| Parameter | Selection | Notes |
|-----------|-----------|-------|
| **Base Material** | FR-4 | Standard epoxy fiberglass |
| **Layers** | 2 | |
| **Dimensions** | 100mm × 70mm | Auto-detected from Edge.Cuts |
| **Quantity** | 5 | Minimum order (prototype) |
| **PCB Thickness** | 1.6mm | Standard |
| **PCB Color** | Green | Or black for premium look |
| **Silkscreen** | White | High contrast |
| **Surface Finish** | ENIG | Gold finish (recommended for Pogo Pins) |
| **Copper Weight** | 1oz | 35μm |
| **Gold Thickness** | 1 U" | For ENIG (sufficient for contacts) |
| **Confirm Production File** | Yes | Review Gerber viewer before production |
| **Remove Order Number** | Specify location | Or select "No" to avoid silkscreen marking |
| **Flying Probe Test** | Yes | Recommended for first batch |
| **Castellated Holes** | No | |
| **Edge Plating** | No | |

**SMT Assembly** (optional, add to order):
| Parameter | Selection | Notes |
|-----------|-----------|-------|
| **Assemble** | Top Side | Components on F.Cu |
| **SMT QTY** | 5 | Match PCB quantity |
| **Tooling Holes** | Added by Customer | Or let JLCPCB add automatically |
| **Confirm Parts Placement** | Yes | Review CPL file before production |

**Estimated Cost** (5 units, ENIG, no assembly):
- PCB: $18 (prototype pricing)
- Shipping (DHL): $25
- Total: ~$43 (~$8.60 per board)

**Estimated Lead Time**:
- Fabrication: 48 hours (expedited) or 5 days (standard)
- Shipping: 3-5 days (DHL to most countries)
- Total: 5-10 days door-to-door

### 8.4 Pre-Production Verification

**Before sending to manufacturer**:

1. **Gerber Viewer Check** (Use KiCad or online viewer):
   - Open all .gbr files in gerber viewer
   - Verify layers align correctly
   - Check for missing copper pours
   - Ensure soldermask openings are correct (pads exposed)
   - Verify silkscreen doesn't overlap pads

2. **Design Rule Check (DRC)**:
   ```
   KiCad → Inspect → Design Rules Checker
   - Run with all options enabled
   - Fix all errors (warnings can be reviewed case-by-case)
   - Common errors to fix:
     * Clearance violations (<0.2mm spacing)
     * Unconnected nets
     * Track width violations
     * Missing solder mask openings
   ```

3. **Electrical Rule Check (ERC)**:
   ```
   KiCad → Inspect → Electrical Rules Checker
   - Check for power pins not driven
   - Check for floating nets
   - Verify all components have correct footprints
   ```

4. **3D Visualization**:
   ```
   KiCad → View → 3D Viewer
   - Verify component heights don't exceed enclosure clearance (35mm internal)
   - Check component spacing (no overlaps)
   - Ensure connectors align with enclosure openings
   ```

5. **BOM Verification**:
   - Cross-reference BOM with Phase2_Complete_BOM.md
   - Verify all components have valid part numbers
   - Check stock availability at LCSC/Digi-Key

---

## 9. Assembly Instructions

### 9.1 Assembly Sequence

**Recommended Order** (for hand assembly):

1. **SMD Components** (requires hot air rework station or reflow oven):
   a. U1 (ESP32-WROOM-32E) - Most critical, align carefully
   b. U2 (DS3231) - Temperature sensitive, avoid overheating
   c. U3, U4 (AMS1117 LDOs) - Thermal pad requires good solder flow
   d. U5 (PAM8403) - Audio amplifier
   e. All 0805 resistors (R1-R6)
   f. All 0805 capacitors (C1-C4)
   g. All 0603 capacitors (C9-C18)
   h. D2 (WS2812B-Mini) - Polarity critical!

2. **Through-Hole Components**:
   a. J1 (DC jack) - Mechanical support, secure well
   b. J2 (USB-C) - Align carefully, use hot air for SMD pads
   c. J3, J4 (Pogo Pin receptacles) - **Critical alignment**, verify with enclosure
   d. BT1 (CR2032 holder) - Orient correctly
   e. C5, C6 (100μF electrolytics) - Polarity critical!
   f. J5 (Speaker terminal) - Ensure secure screw terminals
   g. SW1, SW2 (Tactile switches)
   h. D1 (Power LED) - Polarity: Long lead = anode
   i. J6 (ISP header) - Optional, for debugging

3. **Post-Assembly**:
   a. Visual inspection under magnification (check for solder bridges)
   b. Continuity testing (power rails, critical nets)
   c. Power-on test with current-limited supply (12V @ 100mA)
   d. Firmware upload via USB
   e. Functional testing (see Section 10)

### 9.2 Soldering Notes

**SMD Soldering** (Hot air):
- Temperature: 350°C air, 2-3 seconds per pad
- Solder paste: No-clean, SAC305 (lead-free) or SnPb for prototyping
- Flux: IPA-based, apply generously for BGA-like ESP32 module

**Through-Hole Soldering**:
- Iron temperature: 350°C with chisel tip
- Solder: 0.8mm diameter, rosin core
- Technique: Heat pad and lead simultaneously, flow solder from opposite side

**Critical Soldering Points**:
1. ESP32 ground pads: Ensure all GND pads have good thermal connection
2. LDO thermal tabs: Pre-heat bottom copper pour to 150°C before soldering
3. Pogo Pins: Use jig to ensure perpendicularity (±1° max deviation)
4. USB-C shield tabs: Solder all 4 mounting pads for mechanical strength

---

## 10. Testing and Validation

### 10.1 Power-On Test Sequence

**Step 1: Visual Inspection**
- [ ] No solder bridges between pins
- [ ] All components oriented correctly
- [ ] No burnt components or discoloration
- [ ] Pogo Pins perpendicular to board

**Step 2: Bare Board Test** (before applying power)
- [ ] 12V ↔ GND resistance: >10MΩ (no short)
- [ ] 5V ↔ GND resistance: >10MΩ
- [ ] 3.3V ↔ GND resistance: >10MΩ
- [ ] I²C pull-ups present: SDA/SCL to 3.3V = ~4.7kΩ

**Step 3: Power-On Test** (current-limited supply)
- [ ] Set supply: 12V @ 100mA limit
- [ ] Connect to J1 (DC jack)
- [ ] Observe current draw: Should be <50mA (no ESP32 activity)
- [ ] Measure 5V rail: Should be 4.9-5.1V
- [ ] Measure 3.3V rail: Should be 3.25-3.35V
- [ ] D1 (power LED) should illuminate

**Step 4: ESP32 Boot Test**
- [ ] Connect USB-C to computer
- [ ] Open serial monitor (115200 baud)
- [ ] Press EN button → Should see boot message
- [ ] Upload blink sketch to verify GPIO function

**Step 5: Peripheral Tests**
- [ ] I²C scan: Detect DS3231 at 0x68
- [ ] RTC read: Verify time/date registers accessible
- [ ] WS2812 test: Upload NeoPixel sketch, verify D2 lights up
- [ ] Speaker test: Play test tone via I²S
- [ ] Pogo Pin continuity: Verify 12V, GND, I²C, WS2812 signals present

### 10.2 Acceptance Criteria

**Before integration into system**:
- [ ] All power rails within ±5% of nominal
- [ ] ESP32 boots reliably (10 consecutive resets without failure)
- [ ] I²C communication stable (100 consecutive reads without error)
- [ ] RTC maintains time during power cycle (battery backup functional)
- [ ] Audio output clean (no distortion at 1kHz test tone)
- [ ] WS2812 responds to color commands
- [ ] Thermal test: LDOs <70°C at full load (1A on 12V input)
- [ ] No EMI issues (AM radio test: no buzzing within 1m)

---

## 11. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-02 | Hardware Team | Initial release for KiCad design |
| 1.1 | 2026-03-06 | Hardware Team | Pogo Pin 从 5 针改为 4 针；移除 WS2812 数据信号输出（J3/J4/J5 Pin 5 取消）；Hub WS2812（D2）改为本地专用，不经过 Pogo Pin |

---

## 12. References

1. ESP32-WROOM-32E Datasheet: [Espressif Systems](https://www.espressif.com/sites/default/files/documentation/esp32-wroom-32e_esp32-wroom-32ue_datasheet_en.pdf)
2. DS3231 RTC Datasheet: [Maxim Integrated](https://datasheets.maximintegrated.com/en/ds/DS3231.pdf)
3. PAM8403 Amplifier Datasheet: [Diodes Incorporated](https://www.diodes.com/assets/Datasheets/PAM8403.pdf)
4. AMS1117 LDO Datasheet: [Advanced Monolithic Systems](http://www.advanced-monolithic.com/pdf/ds1117.pdf)
5. WS2812B LED Datasheet: [WorldSemi](https://cdn-shop.adafruit.com/datasheets/WS2812B.pdf)
6. IPC-2221 PCB Design Standard: [IPC Association](https://www.ipc.org/ipc-2221)
7. JLCPCB Capabilities: [https://jlcpcb.com/capabilities/pcb-capabilities](https://jlcpcb.com/capabilities/pcb-capabilities)

---

**END OF DOCUMENT**

For questions or clarifications, contact: hardware@project.com
