// ==========================================
// Smart Pillbox Slave Module Shell Design
// ==========================================
// Author: Roo
// Date: 2024-05-22
// Description: Parametric 3D printable shell for the slave module of the smart pillbox system.
// Includes Pogo Pin connectors, magnetic coupling, and PCB mounting.

// === 核心尺寸参数 (Core Dimensions) ===
inner_length = 100;      // 内部长度 (mm)
inner_width = 60;        // 内部宽度 (mm)
inner_depth = 25;        // 内部深度 (mm)
wall_thickness = 2;      // 壁厚 (mm)
fillet_radius = 3;       // 外部圆角半径 (mm)
tolerance = 0.2;         // 通用公差 (mm)

// === Pogo Pin 参数 (Pogo Pin Parameters) ===
pogo_pin_count = 5;       // 引脚数量
pogo_pin_pitch = 2.54;    // 引脚间距 (mm)
pogo_groove_length = 15;  // 凹槽长度 (mm)
pogo_groove_width = 3;    // 凹槽宽度 (mm)
pogo_groove_depth = 2;    // 凹槽深度 (mm)
pogo_z_offset = 12;       // Pogo Pin 距离底部的垂直高度 (mm, approx center)

// === 磁铁参数 (Magnet Parameters) ===
magnet_diameter = 5.2;    // 磁铁孔直径 (mm, 含公差)
magnet_depth = 2.5;       // 磁铁孔深度 (mm)
magnet_spacing_x = 12;    // 磁铁水平间距 (mm)
magnet_spacing_z = 8;     // 磁铁垂直间距 (mm)

// === LED 参数 (LED Parameters) ===
led_hole_size = 4;        // LED 透光孔尺寸 (mm)
led_chamfer_dia = 6;      // LED 倒角直径 (mm)

// === PCB 参数 (PCB Parameters) ===
pcb_length = 90;          // PCB 长度 (mm)
pcb_width = 50;           // PCB 宽度 (mm)
pcb_thickness = 1.6;      // PCB 厚度 (mm)
pcb_post_height = 3;      // PCB 安装柱高度 (mm)
pcb_hole_dia = 2.2;       // PCB 螺丝孔直径 (mm)

// === 盖子参数 (Lid Parameters) ===
lid_thickness = 2;        // 顶盖厚度 (mm)
lid_screw_dia = 2.5;      // 顶盖螺丝孔直径 (mm)
lid_screw_head_dia = 5.0; // 顶盖螺丝头直径 (mm)

// === 霍尔传感器参数 (Hall Sensor Parameters) ===
lid_magnet_hole_d = 5.2;  // 顶盖磁铁孔直径 (mm)
lid_magnet_hole_h = 1.2;  // 顶盖磁铁孔深度 (mm)
lid_magnet_y_offset = -20;// 顶盖磁铁孔 Y 轴偏移 (mm)

// 计算外部尺寸 (Calculated Outer Dimensions)
outer_length = inner_length + 2 * wall_thickness;
outer_width = inner_width + 2 * wall_thickness;
total_height = inner_depth + wall_thickness;

$fn = 60; // 圆弧精度 (Resolution)

// ==========================================
// 模块定义 (Module Definitions)
// ==========================================

// 1. 基础圆角立方体 (Helper: Rounded Cube)
module rounded_cube(size, radius) {
    x = size[0];
    y = size[1];
    z = size[2];
    
    translate([radius, radius, 0])
    minkowski() {
        cube([x - 2*radius, y - 2*radius, z - 0.1]); // -0.1 to avoid z-fighting on top if needed
        cylinder(r=radius, h=0.1);
    }
}

// 2. Pogo Pin 凹槽 (Pogo Pin Groove)
// Creates the negative volume for the Pogo Pin connector
module pogo_pin_groove() {
    // 居中绘制凹槽
    translate([-pogo_groove_depth, -pogo_groove_length/2, -pogo_groove_width/2])
        cube([pogo_groove_depth + 0.1, pogo_groove_length, pogo_groove_width]);
}

// 3. 磁铁盲孔 (Magnet Hole)
// Creates the negative volume for a magnet
module magnet_hole() {
    rotate([0, 90, 0])
        cylinder(d=magnet_diameter, h=magnet_depth + 0.1);
}

// 4. 侧面接口组 (Side Connector Group)
// Combines Pogo groove and 4 magnets
module side_connector_group() {
    // Pogo Pin Groove (Center)
    // Aligned to start at outer wall (-wall_thickness) and go inwards
    // Current origin is Inner Wall Surface (0)
    // Pogo groove depth is defined by parameter, assumed to start from outer face
    // If groove depth == wall thickness, it goes -wall to 0.
    // If groove depth < wall, it goes -wall to -wall+depth.
    translate([-wall_thickness, -pogo_groove_length/2, -pogo_groove_width/2])
        cube([pogo_groove_depth + 0.1, pogo_groove_length, pogo_groove_width]);
    
    // Magnets (4 corners around center)
    // Layout: Rectangular distribution around the Pogo groove
    // Coordinates relative to the center of the groove on the wall surface
    // Magnets start at outer wall (-wall_thickness) and go deeper than wall (into reinforcement)
    
    // Top-Left
    translate([-wall_thickness, -magnet_spacing_x/2, magnet_spacing_z/2])
        magnet_hole();
        
    // Top-Right
    translate([-wall_thickness, magnet_spacing_x/2, magnet_spacing_z/2])
        magnet_hole();
        
    // Bottom-Left
    translate([-wall_thickness, -magnet_spacing_x/2, -magnet_spacing_z/2])
        magnet_hole();
        
    // Bottom-Right
    translate([-wall_thickness, magnet_spacing_x/2, -magnet_spacing_z/2])
        magnet_hole();
}

// 4b. 侧面加强筋 (Side Reinforcement Boss)
// Adds material inside the wall to support the magnets (2.5mm depth > 2mm wall)
module side_reinforcement() {
    // Size to cover magnets and pogo groove
    // Width: magnet spacing 12 + dia 5.2 + margin ~ 20mm
    // Height: magnet spacing 8 + dia 5.2 + margin ~ 16mm
    // Thickness: Extra 2mm inside
    boss_width = 22;
    boss_height = 18;
    boss_thick = 2; 
    
    translate([0, -boss_width/2, -boss_height/2])
        cube([boss_thick, boss_width, boss_height]);
}

// 5. PCB 安装柱 (PCB Mounting Post)
// Creates a single PCB standoff
module pcb_mounting_post() {
    difference() {
        cylinder(d=5, h=pcb_post_height);
        translate([0, 0, 0.5]) // Leave 0.5mm solid at bottom if needed, or through hole. Let's make it a blind hole for self-tapping.
            cylinder(d=pcb_hole_dia, h=pcb_post_height + 1);
    }
}

// 6. LED 透光孔 (LED Light Hole)
// Creates the cutout for the LED in the lid
module led_light_hole() {
    // Square hole
    translate([-led_hole_size/2, -led_hole_size/2, -1])
        cube([led_hole_size, led_hole_size, lid_thickness + 2]);
    
    // Chamfer for light diffusion (inside)
    translate([0, 0, 0])
        cylinder(d1=led_chamfer_dia, d2=led_hole_size, h=lid_thickness/2);
}

// 7. 盖子螺丝柱 (Lid Screw Post - in Main Body)
module lid_screw_post() {
    difference() {
        // Post integrated into the corner
        cylinder(d=6, h=inner_depth); 
        // Screw hole (m3 tap size approx)
        translate([0, 0, inner_depth - 10])
            cylinder(d=2.5, h=11);
    }
}

// 7b. 顶盖内侧磁铁孔 (Lid Magnet Hole)
module lid_magnet_hole() {
    // Magnet hole on the inner side (bottom face Z=0)
    // Position: Center line (X=0), Y offset -20, Z from -0.1 to hole depth
    translate([0, lid_magnet_y_offset, -0.1]) 
        cylinder(d=lid_magnet_hole_d, h=lid_magnet_hole_h+0.1, $fn=30);
    
    // S极标注 (Marking)
    // Engraved next to the hole on the inner face
    translate([5, lid_magnet_y_offset, 0])
        rotate([0, 180, 0]) // Text on bottom face, so flip it to read correctly when looking at bottom
        linear_extrude(height=0.5)
            text("S↓", size=4, halign="center", valign="center", font="Arial:style=Bold");
}

// 7c. 底部霍尔传感器位置标注 (Hall Sensor Marking)
module hall_sensor_marking() {
    // Mark on the floor of the box (Z = wall_thickness)
    // Engraved into the floor from the inside
    translate([0, lid_magnet_y_offset, wall_thickness - 0.5])
        linear_extrude(height=0.6) // Cut 0.5mm deep (0.1 overlap)
            text("HALL↑", size=4, halign="center", valign="center", font="Arial:style=Bold");
}

// 8. 主体盒子 (Main Body)
module main_body() {
    difference() {
        // A. 基础壳体 (Base Shell with Reinforcements)
        union() {
             // 1. 空心盒子 (Hollow Box)
             difference() {
                translate([-outer_length/2, -outer_width/2, 0])
                    rounded_cube([outer_length, outer_width, total_height], fillet_radius);
                    
                translate([-inner_length/2, -inner_width/2, wall_thickness])
                    rounded_cube([inner_length, inner_width, total_height], fillet_radius - wall_thickness);
             }
             
             // 2. 侧面加强筋 (Add Reinforcements back inside)
             // Left Side
            translate([-inner_length/2, 0, pogo_z_offset + wall_thickness])
                side_reinforcement();
                
            // Right Side
            translate([inner_length/2, 0, pogo_z_offset + wall_thickness])
                rotate([0, 0, 180])
                side_reinforcement();
                
            // Top Side (+Y)
            translate([0, inner_width/2, pogo_z_offset + wall_thickness])
                rotate([0, 0, -90])
                side_reinforcement();
                
            // Bottom Side (-Y)
            translate([0, -inner_width/2, pogo_z_offset + wall_thickness])
                rotate([0, 0, 90])
                side_reinforcement();
        }

        // B. 减去侧面接口 (Subtract Side Connectors - cut through everything)
        // Left Side
        translate([-outer_length/2 + wall_thickness + 0.1, 0, pogo_z_offset + wall_thickness]) 
            rotate([0, 0, 0]) 
            side_connector_group();

        // Right Side
        translate([outer_length/2 - wall_thickness - 0.1, 0, pogo_z_offset + wall_thickness])
             rotate([0, 0, 180]) 
             side_connector_group();
             
        // Top Side (+Y)
        translate([0, outer_width/2 - wall_thickness - 0.1, pogo_z_offset + wall_thickness])
            rotate([0, 90, 0])
            side_connector_group();

        // Bottom Side (-Y)
        translate([0, -outer_width/2 + wall_thickness + 0.1, pogo_z_offset + wall_thickness])
            rotate([0, -90, 0])
            side_connector_group();
             
        // D. 减去霍尔传感器标注 (Subtract Hall Sensor Marking)
        hall_sensor_marking();
    }
    
    // C. 添加 PCB 安装柱 (Add PCB Posts)
    // Post positions based on PCB size centered
    post_x = pcb_length/2 - 2.5; // Approx inset
    post_y = pcb_width/2 - 2.5;
    
    translate([0, 0, wall_thickness]) {
        translate([post_x, post_y, 0]) pcb_mounting_post();
        translate([post_x, -post_y, 0]) pcb_mounting_post();
        translate([-post_x, post_y, 0]) pcb_mounting_post();
        translate([-post_x, -post_y, 0]) pcb_mounting_post();
    }
    
    // E. 添加盖子螺丝柱 (Add Lid Screw Posts)
    // Located at the 4 corners of the inner box
    lid_post_x = inner_length/2 - 3;
    lid_post_y = inner_width/2 - 3;
    
    translate([0, 0, wall_thickness]) {
        translate([lid_post_x, lid_post_y, 0]) lid_screw_post();
        translate([lid_post_x, -lid_post_y, 0]) lid_screw_post();
        translate([-lid_post_x, lid_post_y, 0]) lid_screw_post();
        translate([-lid_post_x, -lid_post_y, 0]) lid_screw_post();
    }
}

// 9. 顶盖 (Top Cover)
module top_cover() {
    difference() {
        // Plate
        translate([-outer_length/2, -outer_width/2, 0])
            rounded_cube([outer_length, outer_width, lid_thickness], fillet_radius);
            
        // LED Hole (Center)
        led_light_hole();
        
        // 7b. 磁铁孔 (Magnet Hole)
        lid_magnet_hole();
        
        // Screw Holes (Corners)
        lid_post_x = inner_length/2 - 3;
        lid_post_y = inner_width/2 - 3;
        
        translate([lid_post_x, lid_post_y, -0.1]) cylinder(d=lid_screw_dia, h=lid_thickness+0.2);
        translate([lid_post_x, -lid_post_y, -0.1]) cylinder(d=lid_screw_dia, h=lid_thickness+0.2);
        translate([-lid_post_x, lid_post_y, -0.1]) cylinder(d=lid_screw_dia, h=lid_thickness+0.2);
        translate([-lid_post_x, -lid_post_y, -0.1]) cylinder(d=lid_screw_dia, h=lid_thickness+0.2);
        
        // Countersink
        translate([lid_post_x, lid_post_y, lid_thickness/2]) cylinder(d1=lid_screw_dia, d2=lid_screw_head_dia, h=lid_thickness/2+0.1);
        translate([lid_post_x, -lid_post_y, lid_thickness/2]) cylinder(d1=lid_screw_dia, d2=lid_screw_head_dia, h=lid_thickness/2+0.1);
        translate([-lid_post_x, lid_post_y, lid_thickness/2]) cylinder(d1=lid_screw_dia, d2=lid_screw_head_dia, h=lid_thickness/2+0.1);
        translate([-lid_post_x, -lid_post_y, lid_thickness/2]) cylinder(d1=lid_screw_dia, d2=lid_screw_head_dia, h=lid_thickness/2+0.1);
    }
}

// ==========================================
// 组装视图 (Assembly View)
// ==========================================

// 渲染主体 (Render Main Body)
color("White") 
    main_body();

// 渲染顶盖 (Render Top Cover - Exploded View)
// 悬浮在盒子上方 20mm 处
translate([0, 0, total_height + 20])
    color("LightBlue", 0.8) // Transparent blue for lid
    top_cover();

// 辅助参考：PCB 示意图 (Reference PCB - Not printed)
/*
translate([0, 0, wall_thickness + pcb_post_height])
    color("Green", 0.5)
    cube([pcb_length, pcb_width, pcb_thickness], center=true);
*/
