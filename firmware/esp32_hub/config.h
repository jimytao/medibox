#ifndef CONFIG_H
#define CONFIG_H

// ==========================================
// WiFi 配置
// ==========================================
// WiFi 凭证通过首次配网流程写入，无需在此修改
// #define WIFI_SSID     "Your_WiFi_SSID"
// #define WIFI_PASSWORD "Your_WiFi_Password"
#define API_PORT      80

// ==========================================
// 百度 TTS 配置
// ==========================================
// 请在百度云控制台获取: https://console.bce.baidu.com/ai/
#define BAIDU_API_KEY    "Your_API_Key"
#define BAIDU_SECRET_KEY "Your_Secret_Key"
#define TTS_VOICE_PER    0  // 发音人选择: 0为度小美, 1为度小宇, 3为度逍遥, 4为度丫丫
#define TTS_SPEED        5  // 语速，取值0-9，默认为5中语速
#define TTS_PITCH        5  // 音调，取值0-9，默认为5中语调
#define TTS_VOLUME       5  // 音量，取值0-15，默认为5中音量

// ==========================================
// 硬件引脚定义
// ==========================================

// 选择引脚定义模式:
// 1: 使用用户提示中的引脚 (PROMPT_PINS) - 默认
// 2: 使用 PCB 设计规范中的引脚 (PCB_SPEC_PINS)
#define USE_PROMPT_PINS  // 注释此行以使用 PCB 规范引脚

#ifdef USE_PROMPT_PINS
    // --- 基于用户提示 (Prompt) ---
    // I2C 总线
    #define I2C_SDA_PIN     21
    #define I2C_SCL_PIN     22

    // I2S 音频 (MAX98357A / PCM5102)
    #define I2S_LRCK_PIN    25  // Word Select / Left-Right Clock
    #define I2S_BCLK_PIN    26  // Bit Clock
    #define I2S_DOUT_PIN    27  // Data Out

    // LED & WS2812
    #define WS2812_PIN      5   // WS2812 数据脚
    #define LED_POWER_PIN   2   // 电源指示 LED (通常板载)
    #define LED_STATUS_PIN  4   // 状态指示 LED
    #define BUTTON_RESET    13  // 复位按钮 (长按 5 秒清除 WiFi 配置)

#else
    // --- 基于 PCB 设计规范 (Hub_PCB_Design_Spec.md) ---
    // I2C 总线
    #define I2C_SDA_PIN     21
    #define I2C_SCL_PIN     22

    // I2S 音频 (PAM8403 不直接支持 I2S，通常需 I2S DAC 如 PCM5102)
    // 规范中提到 GPIO26(BCLK), GPIO27(LRCK), GPIO32(DATA)
    #define I2S_BCLK_PIN    26
    #define I2S_LRCK_PIN    27
    #define I2S_DOUT_PIN    32

    // LED & WS2812
    #define WS2812_PIN      25  // 规范中定义 GPIO25 为 WS2812_DATA
    #define LED_POWER_PIN   -1  // 规范中未分配 GPIO 给电源 LED (直接 3.3V)
    #define LED_STATUS_PIN  -1  // 规范中无独立状态 LED (使用 WS2812)
#endif

// ==========================================
// 系统参数
// ==========================================
#define SLAVE_ADDR_START 0x10   // 从机地址起始
#define SLAVE_ADDR_END   0x1F   // 从机地址结束
#define NTP_SERVER       "pool.ntp.org"
#define GMT_OFFSET_SEC   28800  // UTC+8 (8 * 3600)
#define DST_OFFSET_SEC   0      // 夏令时偏移

#endif // CONFIG_H
