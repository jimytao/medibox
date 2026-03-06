// [LED 控制说明 - 更新]
// LED 控制已从"WS2812 整条链刷新"改为"通过 I²C 按地址独立发送颜色命令"。
// ESP32 Hub 调用 i2c_set_led_color(addr, r, g, b) 向各 Slave 发送 CMD_LED_COLOR (0x05)，
// Slave 本地驱动各自的单颗 WS2812 LED，药盒可任意摆放，无需考虑菊花链顺序。
// Adafruit_NeoPixel 全局链控制对象已移除，Hub 端不再进行 WS2812 直接驱动。

#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <WiFiManager.h>      // 需要安装 WiFiManager 库 by tzapu
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>      // 需要安装 ArduinoJson 库
#include <RTClib.h>           // 需要安装 RTClib 库
// #include <Adafruit_NeoPixel.h> // 已移除：Hub 不再直接驱动 WS2812 链
#include "Audio.h"            // 需要安装 ESP8266Audio 库 (兼容ESP32)

#include "config.h"

// ==========================================
// 全局对象
// ==========================================
WebServer server(API_PORT);
RTC_DS3231 rtc;
// Adafruit_NeoPixel strip(1, WS2812_PIN, NEO_GRB + NEO_KHZ800); // 已移除：改为 I²C 颜色命令控制
Audio audio; // I2S 音频对象

// ==========================================
// 状态机变量
// ==========================================
struct PillboxState {
    bool wifi_connected = false;
    bool rtc_valid = false;
    uint8_t current_volume = 15;
    bool alarm_active = false;
    unsigned long last_alarm_time = 0;
};
PillboxState systemState;

// 从机状态结构
struct SlaveStatus {
    uint8_t address;
    bool connected;
    bool lid_open;
    bool led_on;
    uint8_t error_code;
    unsigned long last_seen;
};
SlaveStatus slaves[16]; // 最多支持 0x10-0x1F 范围的从机

// ==========================================
// 函数声明
// ==========================================
void setupWiFi();
bool checkForceConfig();
void setupRTC();
void setupAudio();
void setupWebServer();
void scanSlaves();
void controlSlaveLED(uint8_t addr, uint8_t cmd);
bool i2c_set_led_color(uint8_t addr, uint8_t r, uint8_t g, uint8_t b);
void light_up_box(uint8_t addr);
void turn_off_box(uint8_t addr);
void blink_box(uint8_t addr);
void playTTS(String text);
void checkAlarm();
void handleAPI_Status();
void handleAPI_Control();

// ==========================================
// Setup
// ==========================================
void setup() {
    Serial.begin(115200);
    Serial.println("\n[System] Starting ESP32 Hub...");

    // 1. 初始化引脚
    if (LED_POWER_PIN != -1) pinMode(LED_POWER_PIN, OUTPUT);
    if (LED_STATUS_PIN != -1) pinMode(LED_STATUS_PIN, OUTPUT);
    
    // 2. WS2812 直接驱动已移除，Hub 状态通过 Serial 日志输出
    // strip.begin(); // 已移除
    Serial.println("[System] 启动中...");

    // 3. 初始化 I2C
    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
    Serial.println("[I2C] Bus initialized.");

    // 4. WiFiManager 配网（必须在其他网络模块之前）
    setupWiFi();

    // 5. 初始化其他组件
    setupRTC();
    setupAudio();
    setupWebServer();

    // 6. 初始扫描
    scanSlaves();
    
    // 启动完成（状态通过 Serial 输出，不再驱动 Hub 本地 WS2812）
    Serial.println("[System] 就绪");
    playTTS("系统启动成功，智能药箱准备就绪");
}

// ==========================================
// Main Loop
// ==========================================
void loop() {
    server.handleClient();
    audio.loop();
    
    static unsigned long last_scan = 0;
    if (millis() - last_scan > 2000) {
        scanSlaves();
        checkAlarm(); // 检查是否有药箱未关闭或定时提醒
        last_scan = millis();
    }
}

// ==========================================
// WiFi Manager（首次配网 / Portal 模式）
// ==========================================

// 检测复位按钮是否被长按超过 5 秒
// 若是，则返回 true，触发强制配网模式（清除 NVS 凭证）
bool checkForceConfig() {
    pinMode(BUTTON_RESET, INPUT_PULLUP);
    // 按钮未被按下（HIGH），直接返回 false
    if (digitalRead(BUTTON_RESET) == HIGH) return false;

    Serial.println("[WiFi] Reset button held, checking duration...");
    unsigned long holdStart = millis();
    while (digitalRead(BUTTON_RESET) == LOW) {
        if (millis() - holdStart > 5000) {
            Serial.println("[WiFi] 长按 5 秒确认 - 进入强制配网模式");
            return true;
        }
        delay(100);
    }
    return false;
}

void setupWiFi() {
    bool forceConfig = checkForceConfig();

    WiFiManager wm;
    wm.setTitle("MediBox 智能药箱");
    wm.setTimeout(180);  // AP 模式超时 3 分钟，超时后自动重启

    if (forceConfig) {
        Serial.println("[WiFi] 强制配网：清除已保存的 WiFi 凭证...");
        wm.resetSettings();  // 清除 NVS 中保存的 SSID/Password
    }

    // autoConnect:
    //   - 若 NVS 中有凭证，直接连接已保存 WiFi
    //   - 若无凭证或连接失败，自动开启 AP「MediBox-Setup」并在 192.168.4.1 提供配置页面
    //   - 用户在页面填写 SSID+密码，保存后 ESP32 重启并自动连接
    Serial.println("[WiFi] 启动 WiFiManager（若无凭证将进入配网热点模式）...");
    if (!wm.autoConnect("MediBox-Setup")) {
        Serial.println("[WiFi] 配网超时或失败，重启设备...");
        delay(3000);
        ESP.restart();
    }

    // 到此处表示 WiFi 连接成功
    Serial.println("[WiFi] 连接成功！");
    Serial.print("[WiFi] IP 地址: ");
    Serial.println(WiFi.localIP());

    // 点亮绿色状态 LED（如果有）
    if (LED_STATUS_PIN != -1) {
        digitalWrite(LED_STATUS_PIN, HIGH);
    }

    systemState.wifi_connected = true;
}

// ==========================================
// RTC Manager
// ==========================================
void setupRTC() {
    if (!rtc.begin()) {
        Serial.println("[RTC] Couldn't find RTC!");
        systemState.rtc_valid = false;
        return;
    }

    if (rtc.lostPower()) {
        Serial.println("[RTC] RTC lost power, setting time!");
        rtc.adjust(DateTime(F(__DATE__), F(__TIME__))); // 设为编译时间
    }
    systemState.rtc_valid = true;
    Serial.println("[RTC] Initialized.");
}

void checkAlarm() {
    // 这里实现简化的报警逻辑
    // 实际应用中应从 Web 设置读取定时列表
    
    // 示例：每分钟检查一次是否有药箱打开
    for (int i = 0; i < 16; i++) {
        if (slaves[i].connected && slaves[i].lid_open) {
            Serial.printf("[Alarm] Slave 0x%02X lid is OPEN!\n", slaves[i].address);
            // 如果打开太久，可以触发语音提醒
        }
    }
}

// ==========================================
// I2C / Slave Manager
// ==========================================
void scanSlaves() {
    // 扫描配置范围内的 I2C 设备
    for (uint8_t addr = SLAVE_ADDR_START; addr <= SLAVE_ADDR_END; addr++) {
        Wire.beginTransmission(addr);
        uint8_t error = Wire.endTransmission();
        
        int idx = addr - SLAVE_ADDR_START;
        
        if (error == 0) {
            // 设备在线，查询状态
            if (!slaves[idx].connected) {
                Serial.printf("[I2C] New Device found at 0x%02X\n", addr);
                playTTS("检测到新药盒接入");
                blink_box(addr); // 蓝色闪烁 Blink-to-Identify（使用 CMD_LED_COLOR 0x05）
            }
            slaves[idx].connected = true;
            slaves[idx].address = addr;
            slaves[idx].last_seen = millis();
            
            // 请求状态: 发送 0x04 (GET_STATUS)
            // 注意：如果从机设计为直接读取则不需要先写命令，这里假设需要先发命令
            Wire.beginTransmission(addr);
            Wire.write(0x04); 
            Wire.endTransmission();
            
            Wire.requestFrom((int)addr, 1);
            if (Wire.available()) {
                uint8_t status = Wire.read();
                // 解析状态字节: Bit 7 = Lid, Bit 6 = LED
                bool lid = (status >> 7) & 0x01;
                bool led = (status >> 6) & 0x01;
                
                if (slaves[idx].lid_open != lid) {
                    Serial.printf("[Slave 0x%02X] Lid changed to %s\n", addr, lid ? "OPEN" : "CLOSED");
                    if (lid) playTTS("药盒已打开");
                    else playTTS("药盒已关闭");
                }
                
                slaves[idx].lid_open = lid;
                slaves[idx].led_on = led;
            }
        } else {
            if (slaves[idx].connected) {
                Serial.printf("[I2C] Device lost at 0x%02X\n", addr);
            }
            slaves[idx].connected = false;
        }
    }
}

// 保留旧接口以向后兼容（内部仍使用原始命令字节）
void controlSlaveLED(uint8_t addr, uint8_t cmd) {
    Wire.beginTransmission(addr);
    Wire.write(cmd); // 0x01=ON, 0x02=OFF, 0x03=BLINK
    Wire.endTransmission();
}

// ------------------------------------------
// I²C 颜色命令发送（CMD_LED_COLOR 0x05）
// 向指定地址的 Slave 发送 RGB 颜色，Slave 独立驱动本地 WS2812。
// 返回 true 表示 ACK 正常，false 表示从机无响应。
// ------------------------------------------
bool i2c_set_led_color(uint8_t addr, uint8_t r, uint8_t g, uint8_t b) {
    Wire.beginTransmission(addr);
    Wire.write(0x05);  // CMD_LED_COLOR
    Wire.write(r);
    Wire.write(g);
    Wire.write(b);
    return (Wire.endTransmission() == 0);
}

// 点亮某个药盒（白色常亮）
void light_up_box(uint8_t addr) {
    i2c_set_led_color(addr, 255, 255, 255);
}

// 熄灭某个药盒
void turn_off_box(uint8_t addr) {
    i2c_set_led_color(addr, 0, 0, 0);
}

// 让某个药盒闪烁蓝色（新设备接入时的 Blink-to-Identify）
// 在主循环或扫描中周期性调用，通过 i2c_set_led_color 切换蓝色/熄灭。
void blink_box(uint8_t addr) {
    static bool blink_state = false;
    static unsigned long last_blink = 0;
    if (millis() - last_blink > 500) {
        blink_state = !blink_state;
        i2c_set_led_color(addr, 0, 0, blink_state ? 200 : 0);
        last_blink = millis();
    }
}

// ==========================================
// Audio & TTS (Baidu)
// ==========================================
void setupAudio() {
    audio.setPinout(I2S_BCLK_PIN, I2S_LRCK_PIN, I2S_DOUT_PIN);
    audio.setVolume(TTS_VOLUME);
    Serial.println("[Audio] I2S Initialized.");
}

void playTTS(String text) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[TTS] No WiFi, cannot play TTS.");
        return;
    }
    
    Serial.print("[TTS] Playing: ");
    Serial.println(text);
    
    // 生成百度 TTS API URL
    // 注意：实际生产中需要处理 Token 获取和 URL 编码
    // 这里简化为直接调用 (需填入有效 Token 或使用公开接口)
    
    // 简易实现：使用 ESP8266Audio 的 connecttoSpeech 或 connecttohost
    // 由于百度 TTS 需要复杂的鉴权 (Access Token)，这里演示直接播放 URL 的结构
    // 实际需先 HTTP POST 获取 Token，再拼接 URL
    // URL 示例: http://tsn.baidu.com/text2audio?tex=...&lan=zh&cuid=...&ctp=1&tok=...
    
    // 为演示完整性，这里播放一个在线提示音或使用 google translate tts (无需鉴权但需翻墙)
    // 假设用户已有百度 URL 生成逻辑
    
    String url = "http://tsn.baidu.com/text2audio?tex=" + text + "&lan=zh&cuid=ESP32&ctp=1&tok=" + "YOUR_ACCESS_TOKEN";
    
    // 注意：百度 TTS 返回的是 MP3 或 PCM。ESP8266Audio 库可以处理流媒体
    // audio.connecttohost(url.c_str()); 
    // 上述代码会阻塞 loop，实际建议使用专门的 TTS 库或异步处理
    
    // 模拟输出
    tone(I2S_DOUT_PIN, 1000, 200); // 简单的蜂鸣提示，因为实际 TTS 需要有效 Token
}

// ==========================================
// Web Server & API
// ==========================================
void setupWebServer() {
    server.on("/api/status", HTTP_GET, handleAPI_Status);
    server.on("/api/control", HTTP_POST, handleAPI_Control);
    server.begin();
    Serial.println("[Web] Server started.");
}

void handleAPI_Status() {
    StaticJsonDocument<1024> doc;
    doc["system"]["wifi"] = systemState.wifi_connected;
    doc["system"]["rtc_time"] = rtc.now().timestamp();
    
    JsonArray slaveArr = doc.createNestedArray("slaves");
    for (int i = 0; i < 16; i++) {
        if (slaves[i].connected) {
            JsonObject s = slaveArr.createNestedObject();
            s["addr"] = slaves[i].address;
            s["lid"] = slaves[i].lid_open ? "open" : "closed";
            s["led"] = slaves[i].led_on ? "on" : "off";
        }
    }
    
    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
}

void handleAPI_Control() {
    if (!server.hasArg("plain")) {
        server.send(400, "text/plain", "Body missing");
        return;
    }
    
    StaticJsonDocument<200> doc;
    deserializeJson(doc, server.arg("plain"));
    
    uint8_t addr = doc["addr"];
    String cmd = doc["cmd"]; // "on", "off", "blink"
    
    // 使用 i2c_set_led_color (CMD_LED_COLOR 0x05) 发送颜色命令
    if (cmd == "on")         light_up_box(addr);           // 白色常亮
    else if (cmd == "off")   turn_off_box(addr);           // 熄灭
    else if (cmd == "blink") blink_box(addr);              // 蓝色闪烁
    else if (cmd == "color") {
        // 支持自定义颜色: {"addr":16,"cmd":"color","r":255,"g":0,"b":0}
        uint8_t r = doc["r"] | 0;
        uint8_t g = doc["g"] | 0;
        uint8_t b = doc["b"] | 0;
        i2c_set_led_color(addr, r, g, b);
    }
    
    server.send(200, "application/json", "{\"status\":\"ok\"}");
}
