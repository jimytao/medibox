# Slave PCB Design Specification
# 从模块板 PCB 设计规范

**Document Version**: 1.0  
**Date**: 2026-03-02  
**Purpose**: Complete PCB design specification for KiCad implementation  
**Related Documents**: 
- [`Modular_Pillbox_Architecture_v2.md`](../Modular_Pillbox_Architecture_v2.md:1)
- [`Phase2_Complete_BOM.md`](../Phase2_Complete_BOM.md:1)
- [`slave_module_shell.scad`](../slave_module_shell.scad:1)

---

## Table of Contents

1. [PCB Overview](#1-pcb-overview)
2. [Component Placement Guide](#2-component-placement-guide)
3. [Schematic Net List](#3-schematic-net-list)
4. [PCB Layout Guidelines](#4-pcb-layout-guidelines)
5. [Routing Rules](#5-routing-rules)
6. [Mechanical Integration](#6-mechanical-integration)
7. [DFM Checklist](#7-dfm-checklist)
8. [Gerber Generation](#8-gerber-generation)

---

## 1. PCB Overview

### 1.1 Basic Parameters

| Parameter | Specification | Notes |
|-----------|--------------|-------|
| **Board Dimensions** | 90mm × 50mm | Fits slave_module_shell.scad enclosure |
| **Layer Count** | 2 layers | Top + Bottom with copper pours |
| **Board Thickness** | 1.6mm | Standard FR4 |
| **Copper Weight** | 1 oz (35μm) | Standard thickness |
| **Surface Finish** | ENIG or HASL | ENIG preferred for Pogo Pins |
| **Pogo Pin Count** | 4 pins | 12V, GND, SDA, SCL |
| **Pogo Pin Pitch** | 2.54mm | Standard pitch |
| **Minimum Trace Width** | 0.2mm | JLCPCB capability |
| **Minimum Trace Spacing** | 0.2mm | JLCPCB capability |
| **Minimum Via Size** | 0.3mm drill / 0.6mm pad | Standard via |
| **Soldermask Color** | Green | Or custom color per medication type |
| **Silkscreen Color** | White | High contrast |

### 1.2 Design Philosophy

**Simplicity and Cost Optimization**:
- Minimal component count (8 active + 15 passive components)
- Single-sided assembly (all SMD on top, except ATtiny85 socket)
- Efficient use of space (90×50mm footprint)
- 2D Grid Daisy-chain (S-shape routing supported)

**Key Design Constraints**:
- PCB must align with Hall sensor position (magnet in lid at [50, 30] mm from corner)
- WS2812 LED position must align with light pipe hole in enclosure
- Pogo Pin spacing: 2.54mm pitch, perpendicular alignment ±0.2mm
- Board edge clearance: 2mm (mechanical assembly tolerance)

---

## 2. Component Placement Guide

### 2.1 Component List Summary

#### 2.1.1 Active Components

| Ref Des | Component | Package | Quantity | Critical Notes |
|---------|-----------|---------|----------|----------------|
| U1 | ATtiny85-20PU | DIP-8 | 1 | Socket-mounted for easy replacement |
| U2 | AMS1117-3.3 | SOT-223 | 1 | Local 3.3V regulation from 12V |
| Q1 | A3144 Hall Sensor | TO-92 | 1 | **Position critical**: Align with lid magnet |
| D1 | WS2812B-Mini | 3.5×3.5mm SMD | 1 | **Position critical**: Align with light pipe |

#### 2.1.2 Connectors

| Ref Des | Component | Type | Quantity | Placement Notes |
|---------|-----------|------|----------|-----------------|
| J1 | Pogo Pin Left | Mill-Max 4-pin receptacle | 1 | Left edge, Input (DIN) |
| J2 | Pogo Pin Right | Mill-Max 4-pin receptacle | 1 | Right edge, Output (DOUT) |
| J3 | ISP Header | 2×3 pin 2.54mm | 1 | Optional, for ATtiny85 programming |
| J4 | Pogo Pin Top | Mill-Max 4-pin receptacle | 1 | Top edge, Input (DIN) |
| J5 | Pogo Pin Bottom | Mill-Max 4-pin receptacle | 1 | Bottom edge, Output (DOUT) |

#### 2.1.3 Passive Components

| Type | Value/Part | Package | Quantity | Notes |
|------|------------|---------|----------|-------|
| R1 | 10kΩ ±5% | 0805 | 1 | Hall sensor pull-up |
| R2 | 330Ω ±5% | 0805 | 1 | WS2812 data line protection |
| R3, R4 | 4.7kΩ ±5% | 0805 | 2 | I²C pull-ups (optional, passive) |
| C1 | 10μF 25V | 0805 Ceramic | 1 | LDO input filter |
| C2 | 22μF 10V | 0805 Ceramic | 1 | LDO output filter |
| C3 | 100nF 50V | 0603 Ceramic | 1 | ATtiny85 VCC decoupling |
| C4 | 100nF 50V | 0603 Ceramic | 1 | WS2812 power decoupling |
| C5 | 100nF 50V | 0603 Ceramic | 1 | Hall sensor decoupling |

**Optional Components** (for full feature set):
- IC Socket: 8-pin DIP socket for U1 (allows firmware updates without desoldering)

### 2.2 Physical Layout (Top View)

```
┌────────────────────────────────────────────────────────────────┐
│  90mm × 50mm PCB - Top Layer Component Placement              │
│                                                                │
│                    [J4 Pogo Top (DIN)]                         │
│                           ┌────┐                               │
│                           │ 5P │                               │
│                           └────┘                               │
│  [J1 Pogo Left (DIN)]                             [J2 Pogo Right (DOUT)]
│   ┌────┐                                           ┌────┐     │
│   │ 5P │                                           │ 5P │     │
│   │ V  │                                           │ V  │     │
│   │ E  │         ┌──────────────┐                 │ E  │     │
│   │ R  │         │              │                 │ R  │     │
│   │ T  │         │   ATtiny85   │                 │ T  │     │
│   │    │         │     U1       │                 │    │     │
│   └────┘         │   (Socket)   │                 └────┘     │
│                  └──────────────┘                            │
│                                                                │
│  ┌─U2──┐         [C3]  [C4]  [C5]                            │
│  │AMS  │          Decoupling Caps                            │
│  │1117 │                                                      │
│  │-3.3 │         [R1] [R2] [R3] [R4]                         │
│  └─────┘          Resistor Array                             │
│   ↓ ↓                                                         │
│  [C1][C2]                                                     │
│                                                                │
│                  ┌──────┐                                     │
│                  │ HALL │  ← Position: [45, 25]mm from TL    │
│                  │ Q1   │     (Aligns with lid magnet)       │
│                  └──────┘                                     │
│                                                                │
│                                                                │
│                     [D1]    ← Position: Aligns with          │
│                  WS2812B       light pipe in lid             │
│                                                                │
│                           ┌────┐                               │
│                           │ 5P │                               │
│                           └────┘                               │
│                  [J3 ISP] [J5 Pogo Bottom (DOUT)]              │
│                  ○ ○ ○                                        │
│                  ○ ○ ○                                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 2.3 Critical Component Positioning

#### 2.3.1 Hall Sensor (Q1) - Position Critical!

**Absolute Position** (from top-left corner):
- X: 45mm (center of 90mm width)
- Y: 25mm (center of 50mm height)
- Orientation: Flat face (sensitive side) pointing UP toward lid
- Clearance: 3mm from lid interior when assembled

**Verification Against Enclosure**:
```scad
// Extract from slave_module_shell.scad
module hall_sensor_marking() {
    translate([50, 30, 20])  // Z=20 is PCB mounting height
        cube([4, 4, 3]);  // Sensor footprint boss
}

// Magnet cavity in lid
translate([50, 30, lid_thickness - 1.5])
    cylinder(d=5.2, h=1.5, $fn=32);  // 5mm magnet + tolerance
```

**Detection Distance**:
- Lid closed: Magnet 3mm from sensor → ~400 Gauss → A3144 output LOW
- Lid open: Magnet >10mm → <30 Gauss → A3144 output HIGH (via pull-up)

**PCB Design Notes**:
- Place Q1 through-hole footprint at exact [45, 25] coordinates
- Add silkscreen crosshair marking for visual alignment verification
- Ensure no tall components within 10mm radius (clearance for magnet field)

#### 2.3.2 WS2812 LED (D1) - Position Critical!

**Absolute Position** (from top-left corner):
- X: 45mm (center of board width)
- Y: 40mm (near bottom edge, visible through lid)
- Orientation: Emitting face pointing UP

**Alignment with Enclosure Light Pipe**:
```scad
// Extract from slave_module_shell.scad
module led_light_pipe() {
    translate([45, 40, lid_inner_height])
        cylinder(d=4, h=lid_thickness, $fn=32);  // 4mm clear pipe
}
```

**Optical Design**:
- LED-to-diffuser distance: ~8mm
- Viewing angle: 120° (standard WS2812B)
- Brightness visibility: Readable in daylight (through white ABS diffuser)

**PCB Design Notes**:
- Orient D1 with DIN pad toward ATtiny85 (minimize trace length)
- Add 100nF capacitor (C4) within 5mm of VDD pin
- Silkscreen outline showing LED active area (3.5×3.5mm)

#### 2.3.3 Pogo Pin Receptacles (J1, J2, J4, J5)

**Spacing and Alignment**:
- Pin pitch: 2.54mm (0.1" standard)
- **J1 (Left Input)**: 5mm from left edge, centered vertically at 25mm.
- **J2 (Right Output)**: 5mm from right edge, centered vertically at 25mm.
- **J4 (Top Input)**: 45mm from left edge, 5mm from top edge.
- **J5 (Bottom Output)**: 45mm from left edge, 5mm from bottom edge.
- Vertical/Horizontal alignment tolerance: ±0.2mm (critical for mating)

**Pin Order** (Looking from top):
```
Pin 1: 12V
Pin 2: GND
Pin 3: I2C_SDA
Pin 4: I2C_SCL
```
*(第5针 WS2812_DATA 已移除。WS2812 DIN 由 ATtiny85 PB4 直接本地驱动，不经过 Pogo Pin。)*

**Mechanical Considerations**:
- Through-hole mounting for mechanical strength.
- Top and Left connectors (J4, J1) function as **Data Inputs**.
- Bottom and Right connectors (J5, J2) function as **Data Outputs**.
- Verify perpendicularity with enclosure alignment guides.

---

## 3. Schematic Net List

### 3.1 Power Distribution

#### 3.1.1 12V Input and Pass-Through

```
NET: 12V
===================================
J1 (Left) Pin 1
J4 (Top) Pin 1
  ├─→ C1+ (10μF input filter to GND)
  ├─→ U2 (AMS1117-3.3) Pin VIN
  ├─→ J2 (Right) Pin 1 (pass-through)
  └─→ J5 (Bottom) Pin 1 (pass-through)

Purpose: 2D Grid power distribution
Trace width: 0.5mm
```

#### 3.1.2 Local 3.3V Regulation

```
NET: 3.3V
===================================
U2 (AMS1117-3.3) Pin VOUT
  ├─→ C2+ (22μF output filter to GND)
  ├─→ U1 (ATtiny85) Pin 8 (VCC)
  ├─→ Q1 (A3144) Pin 1 (VDD)
  ├─→ D1 (WS2812) Pin VDD
  ├─→ R1 (10kΩ pull-up for Hall sensor)
  └─→ Decoupling caps: C3, C4, C5

Current budget:
- ATtiny85: ~5mA (active), 1μA (sleep)
- A3144: 10mA (max)
- WS2812: 60mA (full white), 1mA (off)
- Total: <100mA (well within AMS1117 capability)
```

#### 3.1.3 Ground Network

```
NET: GND (solid plane)
===================================
J1, J2, J4, J5 Pin 2
  ├─→ U1 (ATtiny85) Pin 4 (GND)
  ├─→ U2 (AMS1117-3.3) Pin GND + Tab
  ├─→ Q1 (A3144) Pin 2 (GND)
  ├─→ D1 (WS2812) Pin GND
  ├─→ All capacitor negative terminals
  └─→ Star-point connection across all 4 connectors

Implementation: 
- Bottom layer: Solid GND plane (>90% coverage)
```

### 3.2 I²C Bus 2D Mesh Pass-Through

```
NET: I2C_SDA
===================================
J1, J2, J4, J5 Pin 3
  ├─→ U1 (ATtiny85) Pin 5 (PB0/SDA)
  └─→ R3 (4.7kΩ pull-up to 3.3V) [Optional]

NET: I2C_SCL
===================================
J1, J2, J4, J5 Pin 4
  └─→ U1 (ATtiny85) Pin 7 (PB2/SCL)

Routing:
- All 4 connectors are connected in parallel to create a 2D bus mesh.
- Main tracks: 0.3mm width.
```

### 3.3 WS2812 LED 本地单点控制

固件升级后，WS2812 由 ATtiny85 通过 I²C 命令 `0x05 CMD_LED_COLOR` 接收 RGB 颜色值后本地驱动。**WS2812 数据线不再在模块间传递**，Pogo Pin 也不再承载 WS2812 信号。

```
NET: WS2812_DATA (本地，不连接任何连接器引脚)
===================================
U1 (ATtiny85) Pin 3 (PB4)
  └─→ R2 (330Ω protection)
      └─→ D1 (WS2812) Pin DIN

D1 (WS2812) Pin DOUT → 悬空 (NC, Not Connected)

控制方式：
- Hub 通过 I²C 发送 CMD_LED_COLOR (0x05) [R][G][B] 命令
- ATtiny85 接收后，通过 PB4 bit-bang 驱动本地单颗 WS2812
- 无需 S 型路由，无需跨模块数据传递
```

### 3.4 Hall Sensor Interface

```
NET: HALL_OUTPUT
===================================
Q1 (A3144) Pin 3 (Output, open-drain)
  ├─→ R1 (10kΩ pull-up to 3.3V)
  └─→ U1 (ATtiny85) Pin 6 (PB1, digital input)

Logic:
- Lid CLOSED: Magnet near → A3144 pulls low → PB1 = 0V (logic LOW)
- Lid OPEN: Magnet far → A3144 high-Z → Pull-up brings PB1 = 3.3V (HIGH)

Firmware reading:
bool lid_open = digitalRead(PB1);  // HIGH = open, LOW = closed
```

**Debouncing**:
- Hardware: Optional 100nF capacitor parallel to R1 (slows response to 1ms)
- Software: Poll at 50Hz (20ms), require 2 consecutive identical readings
- Hysteresis: A3144 has built-in ~50 Gauss hysteresis (prevents oscillation)

### 3.5 ATtiny85 Pin Assignment

```
ATtiny85-20PU (DIP-8 Package)
====================================
Pin 1 (PB5/RESET):  ISP programming (J3 Pin 5)
Pin 2 (PB3/ADC3):   [Reserved for future analog input]
Pin 3 (PB4/ADC2):   [Reserved for future features]
Pin 4 (GND):        Ground
Pin 5 (PB0/SDA):    I²C Data (TinyWireS slave)
Pin 6 (PB1):        Hall sensor input (digital read)
Pin 7 (PB2/SCL):    I²C Clock (TinyWireS slave)
Pin 8 (VCC):        3.3V power
```

**ISP Programming Header (J3)**:
```
J3 Pin Assignment (2×3 header, 2.54mm pitch)
===============================================
Pin 1: MISO (ATtiny PB0/SDA) ──┐
Pin 2: VCC (3.3V)              │ Standard
Pin 3: SCK (ATtiny PB2/SCL)    │ AVR ISP
Pin 4: MOSI (ATtiny PB1)       │ pinout
Pin 5: RESET (ATtiny PB5)      │
Pin 6: GND                     ─┘

Programmer: USBasp or Arduino as ISP
Fuse settings: 8MHz internal oscillator, no clock divider
```

### 3.6 ATtiny85 引脚分配更新

**已分配引脚**：
- PB0 (Pin 5): I²C SDA (TinyWireS)
- PB1 (Pin 6): Hall sensor input (digital read, with 10kΩ pull-up)
- PB2 (Pin 7): I²C SCL (TinyWireS)
- PB4 (Pin 3): **WS2812 DIN 驱动** (bit-bang 输出，连接 R2→D1 DIN)
- PB5 (Pin 1): ISP RESET (J3)

**保留引脚**：
- PB3 (Pin 2): Route to test point (TP1) for future analog sensing

---

## 4. PCB Layout Guidelines

### 4.1 Layer Stackup (2-Layer Board)

```
┌─────────────────────────────────────────────┐
│  TOP LAYER (Component Side)                 │
│  - Signal routing (I²C, WS2812_DATA)        │
│  - 3.3V power traces                        │
│  - SMD component pads                       │
│  - Hatched GND pour (secondary)             │
├─────────────────────────────────────────────┤
│  FR4 Core: 1.6mm                            │
├─────────────────────────────────────────────┤
│  BOTTOM LAYER (Solder Side)                 │
│  - Solid GND plane (primary)                │
│  - 12V power trace (J1-1 to U2 to J2-1)     │
│  - Return paths for all signals             │
│  - Through-hole pads (ATtiny socket, Pogo)  │
└─────────────────────────────────────────────┘
```

### 4.2 Component Density and Spacing

**Design for Hand Assembly**:
- Component-to-component spacing: ≥1mm (allows rework)
- IC-to-board edge: ≥5mm (mechanical clearance)
- SMD pad-to-through-hole: ≥2mm (avoid solder bridging during reflow)

**Component Grouping**:
```
Zone 1 (Top-Left): Power regulation
- U2, C1, C2 clustered within 20mm diameter circle

Zone 2 (Center): Microcontroller
- U1 (ATtiny85 socket), C3 decoupling

Zone 3 (Bottom-Center): Hall sensor
- Q1, R1, C5

Zone 4 (Bottom-Center): WS2812 LED
- D1, C4, R2

Zone 5 (Edges): Interconnects
- J1 (left), J2 (right), J3 (bottom)
```

### 4.3 Critical Trace Routing

#### 4.3.1 12V Power Bus

```
J1 Pin 1 ──[0.5mm trace]──→ U2 VIN ──→ J2 Pin 1
                              ↓
                            C1 (10μF)
                              ↓
                             GND

Current capacity: 0.5mm trace @ 1oz copper = ~600mA (safe for 500mA load)
Voltage drop: Calculate using IPC-2221:
  R = 0.5 mΩ/mm × L(mm) × (0.2mm / 0.5mm)
  For 80mm trace: R = 16 mΩ
  V_drop = 0.5A × 16mΩ = 8mV (negligible)
```

#### 4.3.2 I²C Pass-Through Routing

```
TOP VIEW (schematic representation):

J1-3 (SDA) ───┬─────────────────────→ J2-3 (SDA)
              │
              └──> U1 PB0 (10mm stub)

J1-4 (SCL) ───┬─────────────────────→ J2-4 (SCL)
              │
              └──> U1 PB2 (10mm stub)

Routing rules:
- Main trace (J1 to J2): Straight line, 0.3mm width
- Stub to ATtiny: <10mm, perpendicular junction
- SDA and SCL spacing: 0.3mm (parallel routing)
- Length matching: ±5mm
```

#### 4.3.3 WS2812 本地驱动布线

```
ATtiny85 PB4 (Pin 3) ──[R2: 330Ω]──→ D1 DIN

D1 DOUT → 悬空 (NC)

信号完整性说明：
- 330Ω 保护电阻防止 WS2812 输入过冲（输入电容 ~15pF）
- 走线阻抗：~60Ω（0.3mm 宽度，1.6mm FR4 在 GND 铺铜上方）
- 最大走线长度：<30mm（PB4 到 D1 DIN 短路径，无级联延迟）
- DOUT 悬空，不连接任何连接器引脚
```

### 4.4 Copper Pour Strategy

**Bottom Layer (Primary GND)**:
- Solid pour: >90% coverage (avoid islands)
- Clearance to 12V trace: 1mm isolation gap
- Thermal relief: Standard for all pads except LDO tab

**Top Layer (Secondary GND)**:
- Hatched pour: 0.4mm traces, 1mm spacing (60% coverage)
- Purpose: Reduce EMI, improve heat distribution
- Clearance: 0.3mm from signal traces

**12V Power Zone** (Bottom Layer):
- Isolated copper zone: Left edge (J1) → U2 → Right edge (J2)
- Width: 5mm (wide enough for visual inspection)
- Flood fill: Not connected to GND plane (1mm separation)

### 4.5 Via Placement Strategy

**Signal Vias**:
- I²C lines: No vias on main J1-to-J2 trace (stay on top layer)
- WS2812 data (PB4→D1 DIN): No vias (local short trace, single-layer routing)
- Total signal vias: <5 (minimize capacitance)

**Ground Stitching Vias**:
- Grid pattern: 10mm × 10mm spacing
- Quantity: ~40 vias across 90×50mm board
- Size: 0.3mm drill / 0.6mm pad
- Purpose: Equalize GND potential between layers

**Thermal Vias** (under U2 LDO):
- Array: 2×2 grid (4 vias)
- Spacing: 2mm center-to-center
- Size: 0.3mm drill, plated (not filled)
- Purpose: Dissipate ~1.4W from LDO to bottom GND plane

---

## 5. Routing Rules

### 5.1 Trace Width Requirements

| Net Type | Current | Trace Width | Temperature Rise | Notes |
|----------|---------|-------------|------------------|-------|
| **12V Power** | 500mA | 0.5mm | <5°C | J1→U2→J2 path |
| **3.3V Local** | 100mA | 0.3mm | <3°C | U2 output to ICs |
| **GND Returns** | - | Pour | - | Solid plane on bottom |
| **I²C (SDA/SCL)** | <1mA | 0.3mm | - | Matched pair routing |
| **WS2812 Data** | <1mA | 0.3mm | - | 本地 PB4→DIN，330Ω 阻尼，不经过 Pogo Pin |
| **Hall Sensor** | <1mA | 0.2mm | - | Low-speed digital |
| **GPIO / Test** | <10mA | 0.2mm | - | Standard signals |

### 5.2 Clearance Requirements

| Clearance Type | Distance | Rationale |
|----------------|----------|-----------|
| **Trace to Trace** | 0.2mm | JLCPCB minimum |
| **12V to 3.3V** | 0.5mm | Safety margin (different voltages) |
| **Trace to Pad** | 0.2mm | Manufacturing tolerance |
| **Component to Board Edge** | 2mm | Mechanical assembly clearance |
| **Hall Sensor Keepout** | 10mm radius | Avoid ferromagnetic components (interfere with magnet field) |

### 5.3 Specific Routing Guidelines

#### Hall Sensor Routing Best Practices

```
Q1 (A3144) Pin 3 ──[0.2mm trace]──> [R1: 10kΩ] ──> 3.3V
                                      │
                                      └──[0.2mm]──> U1 PB1

Critical considerations:
1. Keep trace to ATtiny short (<20mm) to minimize noise pickup
2. Route away from WS2812 data line (high-frequency switching)
3. Add C5 (100nF) decoupling at Q1 VCC pin (filter power supply noise)
4. Optional: Add small RC filter (100Ω + 1nF) on output for EMI immunity
```

#### WS2812 LED 本地布线

```
DIN Path（本地驱动，不经过 Pogo Pin）：
U1 PB4 (Pin 3) ──[Top layer]──> [R2: 330Ω, 0805] ──> D1 DIN (Pin 4)

DOUT：
D1 DOUT (Pin 2) → 悬空 (NC)，不连接任何连接器引脚

Power Path:
3.3V ──[0.3mm]──> [C4: 100nF, very close!] ──> D1 VDD (Pin 1)
                                                   │
D1 GND (Pin 3) ──[Via to bottom GND plane]────────┘

Critical notes:
- C4 placement: Within 5mm of D1 VDD pin (critical for clean WS2812 operation)
- GND via: Immediately adjacent to D1 GND pad (low-impedance return path)
- DIN trace: ATtiny85 PB4 到 D1 DIN，走线 <30mm，无 90° 弯折（使用 45° 或弧形）
- DOUT 悬空，PCB 上无连接，防止信号干扰
```

#### I²C Bus Routing

```
Topology: Multi-drop with stubs (acceptable for low speed 100kHz)

        Main Bus (J1 to J2, 0.3mm trace)
J1-3 SDA ──────────┬─────────────────> J2-3 SDA
                   │
                   └─> [10mm stub] ──> U1 PB0
                   
J1-4 SCL ──────────┬─────────────────> J2-4 SCL
                   │
                   └─> [10mm stub] ──> U1 PB2

Design rules:
- Stub length: <λ/10 at max frequency
  λ = c / f = 3×10^8 m/s / 100kHz = 3000m
  λ/10 = 300m (stub can be meters long, 10mm is fine)
- Parallel routing: SDA and SCL spaced 0.3mm apart
- Length matching: ±5mm (not critical at 100kHz, but good practice)
- No vias on main bus (keep on top layer for simplicity)
```

---

## 6. Mechanical Integration

### 6.1 Alignment with Enclosure

#### 6.1.1 Hall Sensor to Lid Magnet Alignment

**3D Model Extract** (from slave_module_shell.scad):
```scad
// PCB mounting position
pcb_z_height = 3;  // 3mm above enclosure floor

// Hall sensor position on PCB (relative to PCB origin)
hall_sensor_pcb_x = 45;  // Center of 90mm width
hall_sensor_pcb_y = 25;  // Center of 50mm height

// Magnet position in lid (relative to enclosure origin)
magnet_enclosure_x = 50;  // Accounting for wall thickness
magnet_enclosure_y = 30;  // Accounting for wall thickness
magnet_z_offset = lid_height - 1.5;  // Magnet embedded 1.5mm into lid

// Verification: Magnet should be directly above Hall sensor
assert(abs(magnet_enclosure_x - (hall_sensor_pcb_x + 2.5)) < 1,
       "Hall sensor misalignment X-axis!");
assert(abs(magnet_enclosure_y - (hall_sensor_pcb_y + 2.5)) < 1,
       "Hall sensor misalignment Y-axis!");
```

**PCB Design Action Items**:
1. Place Q1 (A3144) footprint at coordinates [45, 25] mm from top-left corner
2. Add silkscreen crosshair marking: ± 0.5mm lines centered on Q1
3. Add silkscreen text: "MAGNET ALIGN" next to Q1
4. Verify with 3D model overlay in KiCad (import STEP file from OpenSCAD)

**Alignment Tolerance Analysis**:
- Magnet diameter: 5mm
- Hall sensor active area: ~2mm × 2mm
- Lateral tolerance budget: ±1.5mm (magnet radius - sensor active radius)
- **Design margin**: Target ±0.5mm for robust detection

#### 6.1.2 WS2812 to Light Pipe Alignment

**Light Pipe Specification** (from enclosure design):
```
Light pipe diameter: 4mm (clear ABS or acrylic)
Light pipe height: 5mm (lid thickness)
LED-to-diffuser distance: ~8mm (PCB to lid interior)
```

**Optical Design Considerations**:
- WS2812 viewing angle: 120° (standard)
- 4mm light pipe captures ~60° cone at 8mm distance
- Efficiency: ~40% of LED output reaches exterior
- Brightness requirement: "Full white" (R=255, G=255, B=255) visible in daylight

**PCB Design Actions**:
1. Place D1 at [45, 40] mm from top-left corner
2. Ensure no components taller than 5mm within 10mm radius (avoid shadowing)
3. Add white soldermask ring around D1 (reflect light upward)
4. Silkscreen marking: "LED UP" with arrow pointing to emitting face

#### 6.1.3 Pogo Pin Mechanical Alignment

**Critical Dimensions**:
```
Enclosure interior width: 96mm (with 2mm wall on each side)
PCB width: 90mm
Edge clearance: 3mm on each side (96mm - 90mm) / 2

Pogo Pin specifications:
- Receptacle type: Mill-Max 0906-8-15-20-75-14-11-0
- Pin height: 8.5mm above PCB surface
- Mating force: 50-100g per pin (×6 pins = 300-600g total)
- Alignment tolerance: ±0.3mm lateral, ±1° angular

Verification measurements:
- J1 center X: 5mm from left edge
- J2 center X: 85mm from left edge (90mm - 5mm)
- Both J1 and J2 center Y: 25mm from top edge (centered vertically)
```

**Alignment Guides in Enclosure**:
```scad
// Add guide ridges in enclosure to enforce PCB position
module pogo_alignment_guides() {
    // Left guide
    translate([2, 20, 0])
        cube([1, 10, 5]);  // 1mm ridge, 10mm length
    
    // Right guide
    translate([97, 20, 0])
        cube([1, 10, 5]);  // Mirror of left guide
}
```

**PCB Design Actions**:
1. Add mechanical mounting holes for J1, J2 (if connectors have them)
2. Increase pad size for through-hole Pogo pins: 1.8mm pad for 1.0mm pin
3. Use plated slots if connector has elongated pins (allows ±0.2mm adjustment)

### 6.2 PCB Mounting

**Mounting Holes**:
- Quantity: 4 (one near each corner)
- Size: 2.5mm diameter (for M2 screws)
- Position: 3mm inset from edges
- Keepout zone: 5mm radius around each hole

**Mounting Hardware**:
- Screws: M2 × 6mm, Phillips head, nylon or brass
- Standoffs: 3mm height (elevates PCB above enclosure floor)
- Washers: 5mm OD, 2.2mm ID (optional, for stress distribution)

**Assembly Sequence**:
1. Install standoffs in enclosure base (glued or press-fit)
2. Place PCB on standoffs, align Pogo Pins with enclosure guides
3. Verify Hall sensor alignment (check crosshair marking visible through lid cutout)
4. Secure with 4× M2 screws (tighten gently, 0.5 N·m max torque)

### 6.3 Thermal Considerations

**Heat Sources**:
1. AMS1117-3.3 (U2): ~1.4W dissipation
2. WS2812 (D1): ~0.2W (full brightness)
3. ATtiny85 (U1): Negligible (<0.02W)

**Thermal Management**:
```
U2 Temperature Rise Calculation:
P = (12V - 3.3V) × 100mA = 0.87W (typical load)
θJA = 35°C/W (with bottom copper pour heatsink)
ΔT = 0.87W × 35°C/W = 30.5°C

Ambient temp: 25°C (room temperature)
Junction temp: 25°C + 30.5°C = 55.5°C (SAFE, max is 125°C)
```

**Enclosure Ventilation**:
- Add 4× Ø2mm ventilation holes in enclosure base (under LDO area)
- Natural convection provides ~0.005 m³/min airflow
- Effect: Reduces ambient temp by ~3°C

**No Active Cooling Required**: Passive cooling via copper pour is sufficient.

---

## 7. DFM Checklist

### 7.1 Fabrication Checks

- [ ] **Board dimensions**: 90mm × 50mm ±0.2mm tolerance
- [ ] **Mounting holes**: 4× M2.0 (2.5mm diameter drill), positioned at [5,5], [85,5], [5,45], [85,45]
- [ ] **Hole clearance**: ≥3mm from board edge
- [ ] **Minimum trace width**: 0.2mm (verify all traces ≥ this value)
- [ ] **Minimum spacing**: 0.2mm (run DRC in KiCad)
- [ ] **Minimum drill size**: 0.3mm for vias
- [ ] **Annular ring**: ≥0.15mm (drill to pad edge distance)
- [ ] **Soldermask expansion**: 0.1mm from pads (auto-generated)
- [ ] **Silkscreen width**: ≥0.15mm (ensure readability)
- [ ] **Silkscreen clearance**: ≥0.2mm from pads (avoid printing on copper)
- [ ] **Board outline**: Closed polyline, no gaps or overlaps
- [ ] **Fiducial marks**: Add 3× global fiducials (1mm diameter copper circles, no soldermask)

### 7.2 Component Placement Checks

#### Critical Alignments
- [ ] **Hall sensor (Q1) position**: Exactly at [45mm, 25mm] from board origin (verify with dimension tool)
- [ ] **Hall sensor orientation**: TO-92 flat face pointing UP (mark on silkscreen: "FLAT UP")
- [ ] **WS2812 (D1) position**: At [45mm, 40mm] from board origin
- [ ] **WS2812 orientation**: Pin 1 (DIN) correctly aligned with PCB footprint marking
- [ ] **Pogo Pin J1 vertical alignment**: Y-coordinate = 25mm
- [ ] **Pogo Pin J2 vertical alignment**: Y-coordinate = 25mm (±0.2mm from J1)
- [ ] **Pogo Pin pitch**: 2.54mm ±0.05mm (measure with dimension tool)

#### Component Orientation
- [ ] **ATtiny85 socket**: Pin 1 (dot) at top-left, matches silkscreen
- [ ] **AMS1117 (U2)**: Tab orientation correct (connects to GND plane via vias)
- [ ] **A3144 (Q1)**: Pinout verified against datasheet (VDD-GND-OUT, TO-92 package)
- [ ] **Polarized capacitors**: All polarity marks on silkscreen (C1, C2 are ceramic, non-polarized)
- [ ] **Resistors**: Reference designators visible (not hidden under components)

#### Clearances
- [ ] **Hall sensor keepout**: No ferromagnetic components within 10mm radius of Q1
- [ ] **WS2812 keepout**: No components taller than 5mm within 8mm radius of D1
- [ ] **Pogo Pin clearance**: ≥2mm from adjacent components (allow for connector installation)
- [ ] **Board edge clearance**: All components ≥2mm from board edge

### 7.3 Electrical Checks

#### Power Integrity
- [ ] **12V trace width**: ≥0.5mm from J1-1 to U2 to J2-1
- [ ] **3.3V trace width**: ≥0.3mm from U2 to all load points
- [ ] **GND plane coverage**: >90% on bottom layer (verify with copper pour fill)
- [ ] **Decoupling capacitors**: 
  - C3 within 5mm of ATtiny85 VCC pin
  - C4 within 5mm of WS2812 VDD pin
  - C5 within 5mm of A3144 VCC pin
- [ ] **GND vias**: At least one via adjacent to each decoupling capacitor

#### Signal Integrity
- [ ] **I²C trace length**: J1 to J2 direct path <80mm
- [ ] **I²C stub length**: U1 connection stubs <10mm
- [ ] **I²C SDA/SCL matching**: Length difference <5mm
- [ ] **WS2812 series resistor**: R2 (330Ω) present in data path
- [ ] **Hall sensor pull-up**: R1 (10kΩ) connected between Q1 OUT and 3.3V

#### Connectivity
- [ ] **No floating nets**: Run ERC (Electrical Rule Check) in KiCad schematic
- [ ] **All pads connected**: Visual inspection of generated netlist
- [ ] **Pass-through nets**: J1 Pin X → J2 Pin X for all 4 pins (verify in netlist)
- [ ] **Test points**: Added for critical nets (12V, GND, SDA, SCL, WS2812_DIN_LOCAL)

### 7.4 Assembly Considerations

#### SMD Assembly
- [ ] **Stencil compatibility**: All SMD pads accessible (no hidden pads under components)
- [ ] **Component orientation marks**: Pin 1 indicators on silkscreen for U2, D1
- [ ] **Fiducial placement**: 3× fiducials at [5,5], [85,5], [45,45] (for pick-and-place machine vision)
- [ ] **Minimum component spacing**: ≥1mm between SMD components (allows rework)

#### Through-Hole Assembly
- [ ] **ATtiny85 socket**: 8-pin DIP socket footprint correct (7.62mm row spacing)
- [ ] **Pogo Pin holes**: Plated, 1.0mm diameter for 0.8mm pins
- [ ] **ISP header holes**: 1.0mm diameter, 2.54mm pitch (verify with actual header fit)
- [ ] **Hole-to-hole spacing**: ≥2.54mm (avoid drill bit breakage)

#### Hand-Soldering Friendly
- [ ] **SMD pad size**: Standard IPC-7351 footprints (not reduced)
- [ ] **Through-hole pad size**: 1.8× drill diameter minimum
- [ ] **Thermal relief**: Enabled for all pads except U2 tab (which needs direct thermal connection)
- [ ] **Silkscreen component values**: Visible for manual assembly (R1=10K, R2=330R, etc.)

### 7.5 Manufacturing Specifications for JLCPCB

**Order Configuration**:
- [ ] **Layers**: 2
- [ ] **Thickness**: 1.6mm
- [ ] **Copper weight**: 1oz (35μm)
- [ ] **Surface finish**: ENIG (preferred) or HASL Lead-Free
- [ ] **Soldermask color**: Green (or custom color per medication type)
- [ ] **Silkscreen color**: White
- [ ] **Min trace/space**: 0.2mm/0.2mm
- [ ] **Min drill**: 0.3mm
- [ ] **Edge connector**: No (not applicable)
- [ ] **Castellated holes**: No

**Special Requirements**:
- [ ] **Color-coded soldermask**: If ordering multiple medication modules, specify different colors (Green=Morning, Blue=Noon, Yellow=Evening, Red=Bedtime)
- [ ] **Remove order number**: Specify location on bottom silkscreen (or pay $1.50 per design to remove completely)

---

## 8. Gerber Generation

### 8.1 Required Files for Manufacturing

Generate using KiCad **Plot** function:

| File Name | Layer | Description |
|-----------|-------|-------------|
| `Slave_PCB-F_Cu.gbr` | F.Cu | Top copper layer |
| `Slave_PCB-B_Cu.gbr` | B.Cu | Bottom copper layer |
| `Slave_PCB-F_Mask.gbr` | F.Mask | Top soldermask (openings for pads) |
| `Slave_PCB-B_Mask.gbr` | B.Mask | Bottom soldermask |
| `Slave_PCB-F_Silkscreen.gbr` | F.SilkS | Top silkscreen (component outlines, text) |
| `Slave_PCB-B_Silkscreen.gbr` | B.SilkS | Bottom silkscreen (optional) |
| `Slave_PCB-Edge_Cuts.gbr` | Edge.Cuts | Board outline (90×50mm) |
| `Slave_PCB-PTH.drl` | Drill/PTH | Plated through-holes (vias, mounting) |
| `Slave_PCB-NPTH.drl` | Drill/NPTH | Non-plated holes (if any) |

**Assembly Files** (for SMT service):
| File Name | Format | Content |
|-----------|--------|---------|
| `Slave_PCB-BOM.csv` | CSV | Bill of Materials (RefDes, Value, Footprint, Qty, LCSC Part#) |
| `Slave_PCB-CPL.csv` | CSV | Component Placement (RefDes, X, Y, Rotation, Side) |

### 8.2 KiCad Plot Settings

**Gerber Export Settings**:
```
Format: Gerber (RS-274X)
Units: Millimeters
Coordinate format: 4.6 (±999.9999mm range)
Include netlist attributes: Yes
Use Protel extensions: No (use .gbr)
Generate drill file: Separate
Subtract soldermask from silkscreen: Yes (prevents silkscreen on pads)
```

**Drill File Settings**:
```
Format: Excellon
Units: Millimeters
Zero format: Decimal (suppress leading zeros)
Mirror Y axis: No
Minimal header: No
PTH and NPTH in separate files: Yes
Oval holes drill mode: Use route command
Generate map file: Yes (PDF format for verification)
```

### 8.3 JLCPCB Order Parameters

**When placing order at jlcpcb.com**:

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Base Material** | FR-4 | Standard epoxy fiberglass |
| **Layers** | 2 | |
| **Dimensions** | 90mm × 50mm | Auto-detected from Gerber |
| **PCB Qty** | 10 | Economical batch for prototypes |
| **Product Type** | Industrial/Consumer electronics | |
| **PCB Thickness** | 1.6mm | Standard |
| **PCB Color** | Green (or custom) | Color-code by medication schedule |
| **Silkscreen** | White | |
| **Surface Finish** | ENIG | Recommended for Pogo Pin contacts |
| **Copper Weight** | 1oz | |
| **Gold Thickness** | 1 U" | For ENIG finish |
| **Edge Connector** | No | |
| **Remove Order Number** | Specify location: Bottom side, near edge | Or pay to remove |
| **Confirm Production** | Yes | Review Gerber before fabrication |

**Advanced Options**:
- **Flying probe test**: Yes (recommended for first batch, ensures no shorts/opens)
- **4-wire Kelvin test**: No (for gold fingers only)
- **Paper between PCBs**: No

### 8.4 Cost Estimate (10 units, ENIG finish)

**PCB Fabrication**:
- Base cost: $10.00 (10 pcs, 90×50mm, 2-layer)
- ENIG finish: +$12.00
- Subtotal: $22.00

**Shipping**:
- DHL Express (5-7 days): $18.00
- China Post (15-30 days): $5.00

**Total**: $40-50 for 10 boards (~$4-5 per board)

**Optional SMT Assembly** (JLCPCB service):
- Setup fee: $8.00
- Component cost: ~$3.00 per board (if using basic parts library)
- Assembly labor: $12.00 (5 components per side)
- Total per board: ~$7.00 assembled + PCB cost = ~$9.50/board

### 8.5 Pre-Production Verification Steps

**1. Gerber Visual Inspection**:
- Use KiCad built-in Gerber viewer or https://www.pcbway.com/project/OnlineGerberViewer.html
- Check all layers loaded correctly
- Verify copper pours filled completely
- Ensure soldermask openings match pads (no covered pads)
- Check silkscreen doesn't overlap pads or vias

**2. Design Rule Check (DRC)**:
```
KiCad → Inspect → Design Rules Checker
- Clearance violations: 0 errors
- Track width violations: 0 errors
- Unconnected items: 0 errors (if all intentional DNP marked)
- Annular ring violations: 0 errors
```

**3. 3D Model Verification**:
```
KiCad → View → 3D Viewer
- Import enclosure STEP file (exported from slave_module_shell.scad via OpenSCAD)
- Verify PCB fits within enclosure (no component collisions)
- Check Hall sensor and WS2812 alignment with enclosure features
- Ensure Pogo Pins align with enclosure guidance ribs
```

**4. Netlist Comparison**:
```
KiCad → Tools → Update PCB from Schematic
- Check for any mismatches between schematic and PCB
- Verify all components have footprints assigned
- Ensure no orphaned footprints on PCB
```

**5. BOM Cross-Reference**:
- Compare generated BOM against Phase2_Complete_BOM.md
- Verify all part numbers correct (especially LCSC part codes for assembly)
- Check component values match schematic

---

## 9. Firmware Development Notes

### 9.1 ATtiny85 Firmware Overview

**Programming Method**:
- Via ISP header (J3) using USBasp or Arduino as ISP
- Fuse settings for 8MHz internal oscillator:
  ```bash
  avrdude -c usbasp -p attiny85 -U lfuse:w:0xE2:m -U hfuse:w:0xDF:m -U efuse:w:0xFF:m
  ```

**Core Libraries Required**:
- TinyWireS: I²C slave library for ATtiny (https://github.com/nadavmatalon/TinyWireS)
- WS2812 bit-banging (custom implementation, no hardware SPI)

**Main Firmware Tasks**:
1. I²C slave mode: Listen to address (0x10-0x1F, assigned by hub)
2. Poll Hall sensor (PB1) at 50Hz, debounce lid state
3. Respond to hub status queries with 8-bit status byte
4. Receive LED commands and update WS2812 (optional override of chain data)
5. Low-power sleep mode when no activity (power savings)

### 9.2 Hall Sensor Debouncing Algorithm

```c
// Debounce configuration
#define DEBOUNCE_SAMPLES 3  // Require 3 consecutive readings
#define SAMPLE_INTERVAL_MS 20  // Poll at 50Hz

bool read_lid_state() {
    static uint8_t consecutive_high = 0;
    static uint8_t consecutive_low = 0;
    static bool last_stable_state = false;  // Assume closed initially
    
    bool current_reading = digitalRead(HALL_PIN);  // PB1
    
    if (current_reading == HIGH) {  // Lid open
        consecutive_high++;
        consecutive_low = 0;
        if (consecutive_high >= DEBOUNCE_SAMPLES) {
            last_stable_state = true;  // Confirmed open
            consecutive_high = DEBOUNCE_SAMPLES;  // Prevent overflow
        }
    } else {  // Lid closed
        consecutive_low++;
        consecutive_high = 0;
        if (consecutive_low >= DEBOUNCE_SAMPLES) {
            last_stable_state = false;  // Confirmed closed
            consecutive_low = DEBOUNCE_SAMPLES;
        }
    }
    
    return last_stable_state;
}
```

### 9.3 I²C Protocol Implementation

**Status Byte Format** (8 bits):
```
Bit 7: Lid state (1=open, 0=closed)
Bit 6: LED state (1=on, 0=off)
Bit 5-4: Reserved (0)
Bit 3-0: Error code (0=OK, 1-15=errors)
```

**I²C Command Set**:
- `0x01`: LED_ON [R][G][B] - Turn LED solid color
- `0x02`: LED_OFF - Turn LED off
- `0x03`: LED_BLINK [R][G][B] - Blink LED at 1Hz
- `0x04`: GET_STATUS - Request status byte
- `0x05`: CMD_LED_COLOR [R][G][B] - Set LED RGB color (I²C 独立控制，替代 WS2812 菊花链)
- `0x06`: SET_ADDRESS [addr] - Change I²C address (stored in EEPROM)
- `0xFF`: RESET - Software reset slave MCU

---

## 10. Testing and Quality Assurance

### 10.1 Incoming Inspection (PCB Receipt)

- [ ] **Visual inspection**: No scratches, discoloration, or delamination
- [ ] **Dimension check**: 90mm × 50mm ±0.5mm (use calipers)
- [ ] **Hole positions**: M2 mounting holes at correct coordinates
- [ ] **Soldermask quality**: No voids >1mm, uniform coverage
- [ ] **Silkscreen legibility**: All text readable, no smudging
- [ ] **Copper thickness**: Verify via cross-section (or trust manufacturer cert)

### 10.2 Bare Board Electrical Test

**Continuity Tests**:
- [ ] 12V net: J1-1 to U2 VIN to J2-1 = **<0.5Ω**
- [ ] GND net: J1-2 to J2-2 = **<0.2Ω** (solid plane)
- [ ] I²C SDA: J1-3 to U1 Pin5 to J2-3 = **<1Ω**
- [ ] I²C SCL: J1-4 to U1 Pin7 to J2-4 = **<1Ω**
- [ ] WS2812 local DIN: U1 PB4 (Pin3) to R2 to D1 DIN = **<1Ω**

**Isolation Tests** (unpowered):
- [ ] 12V to GND = **>10MΩ** (no short)
- [ ] 3.3V pads to GND = **>10MΩ**
- [ ] I²C SDA to SCL = **>1MΩ** (isolated)

### 10.3 Assembled Board Functional Test

**Step 1: Power-On Test**
- [ ] Apply 12V to J1 Pin 1, GND to J1 Pin 2
- [ ] Measure 3.3V at U2 output: **3.25-3.35V**
- [ ] ATtiny85 VCC (Pin 8): **3.3V ±0.05V**
- [ ] Current draw at 12V: **<50mA** (idle, LED off)

**Step 2: Hall Sensor Test**
- [ ] Place magnet near Q1 → Voltage at U1 Pin 6 = **0V** (low)
- [ ] Remove magnet → Voltage at U1 Pin 6 = **3.3V** (high, via R1 pull-up)
- [ ] Hysteresis: Verify switch points at ~100 Gauss (operate) and ~30 Gauss (release)

**Step 3: WS2812 LED Test**
- [ ] Upload test firmware: cycle RGB colors via I²C CMD_LED_COLOR (0x05)
- [ ] LED lights up red → green → blue → white
- [ ] Brightness: Visible in normal room lighting
- [ ] 确认：Pogo Pin 上无 WS2812 数据信号（使用示波器验证 J1/J2/J4/J5 Pin 4 为 SCL，无 LED 数据）

**Step 4: I²C Communication Test**
- [ ] Connect hub module (or I²C master test jig)
- [ ] I²C scan: Detect slave at address 0x10 (or assigned address)
- [ ] Read status byte: Bit pattern matches lid state
- [ ] Write LED command: Verify D1 responds

**Step 5: ISP Programming Test**
- [ ] Connect USBasp to J3
- [ ] Read device signature: **0x1E930B** (ATtiny85)
- [ ] Upload firmware via ISP
- [ ] Verify fuses set correctly (8MHz internal oscillator)

### 10.4 Acceptance Criteria

**Before shipping to assembly**:
- [ ] All power rails within ±5% of nominal
- [ ] Hall sensor responds reliably (10 consecutive open/close cycles)
- [ ] WS2812 displays all colors correctly (no dead LEDs)
- [ ] I²C communication stable (100 consecutive read/write operations without error)
- [ ] Current consumption <50mA (idle), <120mA (LED full white)
- [ ] No thermal issues (U2 <65°C at full load, 25°C ambient)

---

## 11. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-02 | Hardware Team | Initial release for KiCad design |
| 1.1 | 2026-03-06 | Hardware Team | Pogo Pin 从 5 针改为 4 针；移除 WS2812 数据线（Pin 5）；WS2812 改为 ATtiny85 PB4 本地驱动；更新 I²C 命令集（新增 CMD_LED_COLOR 0x05，SET_ADDRESS 改为 0x06） |

---

## 12. References

1. ATtiny85 Datasheet: [Microchip Technology](http://ww1.microchip.com/downloads/en/DeviceDoc/Atmel-2586-AVR-8-bit-Microcontroller-ATtiny25-ATtiny45-ATtiny85_Datasheet.pdf)
2. A3144 Hall Sensor Datasheet: [Allegro MicroSystems](https://www.allegromicro.com/~/media/Files/Datasheets/A3141-2-3-4-Datasheet.ashx)
3. AMS1117 LDO Datasheet: [Advanced Monolithic Systems](http://www.advanced-monolithic.com/pdf/ds1117.pdf)
4. WS2812B LED Datasheet: [WorldSemi](https://cdn-shop.adafruit.com/datasheets/WS2812B.pdf)
5. Mill-Max Pogo Pins: [Mill-Max Mfg Corp](https://www.mill-max.com/products/spring-loaded-contacts/0906-series)
6. IPC-2221 PCB Design Standard: [IPC Association](https://www.ipc.org/ipc-2221)
7. JLCPCB Capabilities: [https://jlcpcb.com/capabilities/pcb-capabilities](https://jlcpcb.com/capabilities/pcb-capabilities)

---

**END OF DOCUMENT**

For questions or clarifications, contact: hardware@project.com
