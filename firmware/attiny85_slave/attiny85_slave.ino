#include <TinyWireS.h>
#include <Adafruit_NeoPixel.h>
#include <avr/io.h>
#include <util/delay.h>
#include <EEPROM.h>

// ==========================================
// 硬件引脚定义
// ==========================================
// ATtiny85 Pinout:
// Pin 1 (PB5) - RESET
// Pin 2 (PB3) - Unused (Available)
// Pin 3 (PB4) - WS2812 Data (本地单颗 LED，不需要接到下一模块，无菊花链)
// Pin 4 (GND)
// Pin 5 (PB0) - I2C SDA (固定)
// Pin 6 (PB1) - Hall Sensor
// Pin 7 (PB2) - I2C SCL (固定)
// Pin 8 (VCC)
//
// [LED 控制说明]
// WS2812 数据线不再需要菊花链连接到下一个模块。
// 每个 Slave 通过 I²C 接收 CMD_LED_COLOR (0x05) 命令，独立控制本地单颗 WS2812 LED。
// 2D 栅格中的药盒可自由摆放，无需考虑信号顺序。

#define WS2812_PIN      4   // PB4 (Physical Pin 3)
#define HALL_SENSOR_PIN 1   // PB1 (Physical Pin 6)
#define I2C_SDA_PIN     0   // PB0 (Physical Pin 5) - TinyWireS 自动处理
#define I2C_SCL_PIN     2   // PB2 (Physical Pin 7) - TinyWireS 自动处理

// ==========================================
// 系统参数
// ==========================================
#define DEFAULT_I2C_ADDR 0x10
#define EEPROM_ADDR_LOC  0x00  // EEPROM 中存储地址的位置

// ==========================================
// 全局对象
// ==========================================
Adafruit_NeoPixel strip(1, WS2812_PIN, NEO_GRB + NEO_KHZ800);

// ==========================================
// 全局变量
// ==========================================
volatile uint8_t i2c_address = DEFAULT_I2C_ADDR;
volatile uint8_t status_byte = 0;
// Status Byte Format:
// Bit 7: Lid State (1=Open, 0=Closed)
// Bit 6: LED State (1=On, 0=Off)
// Bit 3-0: Error Code

volatile uint8_t led_mode = 0; // 0=Off, 1=On, 2=Blink
volatile uint8_t led_r = 255, led_g = 255, led_b = 255;
unsigned long last_blink_time = 0;
bool blink_state = false;

// ------------------------------------------
// CMD_LED_COLOR (0x05) 缓冲写变量
// I²C 中断处理函数中只写入此缓冲，主循环再驱动 WS2812，
// 避免在中断上下文操作 WS2812 精确时序导致的冲突。
// ------------------------------------------
volatile bool led_update_pending = false;
volatile uint8_t pending_r = 0, pending_g = 0, pending_b = 0;

// Debouncing
bool last_hall_state = false;
unsigned long last_debounce_time = 0;
#define DEBOUNCE_DELAY 50

// ==========================================
// I2C 回调函数
// ==========================================

// 主机写入数据 (命令)
void receiveEvent(uint8_t howMany) {
    if (howMany < 1) return;
    
    uint8_t cmd = TinyWireS.receive();
    
    switch (cmd) {
        case 0x01: // LED_ON (White or default)
            led_mode = 1;
            // 可选：读取后续 RGB 值
            if (TinyWireS.available() >= 3) {
                led_r = TinyWireS.receive();
                led_g = TinyWireS.receive();
                led_b = TinyWireS.receive();
            } else {
                led_r = 255; led_g = 255; led_b = 255; // Default White
            }
            break;
            
        case 0x02: // LED_OFF
            led_mode = 0;
            break;
            
        case 0x03: // LED_BLINK (Blue)
            led_mode = 2;
            led_r = 0; led_g = 0; led_b = 255;
            break;
            
        case 0x04: // GET_STATUS (Prepared for request)
            // Nothing to do, requestEvent handles it
            break;
            
        case 0x05: // CMD_LED_COLOR — 缓冲写，主循环再实际驱动 WS2812
            if (howMany >= 4) {  // cmd + R + G + B
                pending_r = TinyWireS.receive();
                pending_g = TinyWireS.receive();
                pending_b = TinyWireS.receive();
                led_update_pending = true;
            }
            break;

        case 0x06: // SET_ADDRESS (原 0x05，上移一位为 CMD_LED_COLOR 让路)
            if (TinyWireS.available()) {
                uint8_t new_addr = TinyWireS.receive();
                if (new_addr >= 0x08 && new_addr <= 0x77) {
                    EEPROM.write(EEPROM_ADDR_LOC, new_addr);
                    // 用绿色闪烁确认地址已写入
                    led_mode = 2; led_r=0; led_g=255; led_b=0; // Blink Green
                }
            }
            break;
    }
}

// 主机读取数据 (状态)
void requestEvent() {
    TinyWireS.send(status_byte);
}

// ==========================================
// Setup
// ==========================================
void setup() {
    // 1. 设置引脚
    pinMode(HALL_SENSOR_PIN, INPUT_PULLUP); // A3144 Open Drain 需要上拉
    
    // 2. 初始化 WS2812
    strip.begin();
    strip.setBrightness(50);
    strip.setPixelColor(0, strip.Color(0, 0, 0)); // Off
    strip.show();

    // 3. 读取/设置 I2C 地址
    uint8_t stored_addr = EEPROM.read(EEPROM_ADDR_LOC);
    if (stored_addr >= 0x08 && stored_addr <= 0x77 && stored_addr != 0xFF) {
        i2c_address = stored_addr;
    } else {
        i2c_address = DEFAULT_I2C_ADDR;
    }

    // 4. 初始化 I2C 从机
    TinyWireS.begin(i2c_address);
    TinyWireS.onReceive(receiveEvent);
    TinyWireS.onRequest(requestEvent);
    
    // 启动提示 (闪烁一次红色)
    strip.setPixelColor(0, strip.Color(255, 0, 0));
    strip.show();
    delay(200);
    strip.setPixelColor(0, strip.Color(0, 0, 0));
    strip.show();
}

// ==========================================
// LED 直接设色辅助函数
// ==========================================
// 在主循环中调用，不在中断上下文中调用，保证 WS2812 时序安全。
void led_set_color(uint8_t r, uint8_t g, uint8_t b) {
    strip.setPixelColor(0, strip.Color(r, g, b));
    strip.show();
    // 同步更新 led_mode 与颜色变量，保持状态一致
    if (r == 0 && g == 0 && b == 0) {
        led_mode = 0;
    } else {
        led_mode = 1;
        led_r = r; led_g = g; led_b = b;
    }
}

// ==========================================
// Main Loop
// ==========================================
void loop() {
    // 0. CMD_LED_COLOR 缓冲刷新（必须在主循环执行，避免中断上下文写 WS2812）
    if (led_update_pending) {
        led_set_color(pending_r, pending_g, pending_b);
        led_update_pending = false;
    }

    // 1. 处理 I2C (TinyWireS 需要不断检查停止条件)
    TinyWireS_stop_check();

    // 2. 读取霍尔传感器 (开盖检测)
    bool reading = digitalRead(HALL_SENSOR_PIN); // High = Open (No Magnet), Low = Closed (Magnet)
    // A3144: Magnet Present (Closed) -> Output LOW
    // A3144: Magnet Absent (Open) -> Output HIGH (Pull-up)
    // Logic: Lid Open = HIGH
    
    if (reading != last_hall_state) {
        last_debounce_time = millis();
    }
    
    if ((millis() - last_debounce_time) > DEBOUNCE_DELAY) {
        // 状态稳定
        bool lid_is_open = (reading == HIGH);
        
        // 更新状态字节 Bit 7
        if (lid_is_open) {
            status_byte |= (1 << 7);
        } else {
            status_byte &= ~(1 << 7);
        }
    }
    last_hall_state = reading;

    // 3. 控制 LED
    updateLED();
    
    // 更新状态字节 Bit 6 (LED Status)
    if (led_mode != 0) {
        status_byte |= (1 << 6);
    } else {
        status_byte &= ~(1 << 6);
    }
}

void updateLED() {
    unsigned long current_time = millis();
    
    if (led_mode == 0) {
        strip.setPixelColor(0, 0, 0, 0);
        strip.show();
    } 
    else if (led_mode == 1) { // Constant On
        strip.setPixelColor(0, strip.Color(led_r, led_g, led_b));
        strip.show();
    } 
    else if (led_mode == 2) { // Blink
        if (current_time - last_blink_time > 500) {
            last_blink_time = current_time;
            blink_state = !blink_state;
            if (blink_state) {
                strip.setPixelColor(0, strip.Color(led_r, led_g, led_b));
            } else {
                strip.setPixelColor(0, 0, 0, 0);
            }
            strip.show();
        }
    }
}
