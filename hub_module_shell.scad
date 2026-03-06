// ==========================================
// Smart Pillbox Hub Module Shell Design
// ==========================================
// Author: Roo
// Date: 2026-03-02
// Description: Parametric 3D printable shell for the central hub module.
// Includes Speaker grille, Pogo Pin sockets, DC/USB-C ports, and PCB mounting.

// === 核心尺寸参数 (Core Dimensions) ===
hub_length = 120;        // 外部长度 (mm)
hub_width = 80;          // 外部宽度 (mm)
hub_height = 40;         // 外部高度 (mm)
wall_thickness = 2.5;    // 壁厚 (mm)
bottom_thickness = 2;    // 底板厚度 (mm)
fillet_radius = 4;       // 外部圆角半径 (mm)

// === 内部空间 (Inner Dimensions) ===
inner_length = hub_length - 2 * wall_thickness;
inner_width = hub_width - 2 * wall_thickness;
inner_depth = hub_height - bottom_thickness;

// === 盖子参数 (Lid Parameters) ===
lid_thickness = 2;       // 顶盖厚度 (mm)
lid_screw_dia = 2.5;     // 螺丝孔直径 (mm)
lid_screw_head_dia = 5.0;// 螺丝头直径 (mm)

// === 磁铁参数 (Magnet Parameters) - Copied from slave_module_shell.scad ===
magnet_diameter = 5.2;    // 磁铁孔直径 (mm, 含公差)
magnet_depth = 2.5;       // 磁铁孔深度 (mm)
magnet_spacing_x = 22;    // 磁铁水平间距 (mm) - Adjusted for pogo socket
magnet_spacing_z = 10;     // 磁铁垂直间距 (mm) - Adjusted for pogo socket

$fn = 60;

// ==========================================
// 辅助模块 (Helper Modules)
// ==========================================

// 圆角立方体
module rounded_cube(size, radius) {
    x = size[0];
    y = size[1];
    z = size[2];
    
    translate([radius, radius, 0])
    minkowski() {
        cube([x - 2*radius, y - 2*radius, z - 0.1]); 
        cylinder(r=radius, h=0.1);
    }
}

// ==========================================
// 功能组件模块 (Feature Modules)
// ==========================================

// 1. 扬声器格栅 (Speaker Grille)
module speaker_grille() {
    speaker_radius = 21;  // 42mm diameter area
    hole_d = 3;           // Hole diameter
    hole_spacing = 4;     // Hole spacing
    
    for (x = [-6:6]) {
        for (y = [-6:6]) {
            offset_x = x * hole_spacing;
            offset_y = y * hole_spacing + (x % 2) * hole_spacing/2;
            
            if (sqrt(offset_x*offset_x + offset_y*offset_y) <= speaker_radius) {
                translate([offset_x, offset_y, -1])
                    cylinder(d=hole_d, h=lid_thickness + 2, $fn=6);
            }
        }
    }
}

// 2. Pogo Pin 母座开孔 (Pogo Pin Socket Cutout)
module pogo_socket_cutout() {
    // Cutout for Mill-Max 850 sockets
    translate([-wall_thickness/2, 0, 0])
        cube([wall_thickness + 2, 20, 8], center=true);
}

// 2b. 磁铁盲孔 (Magnet Hole) - Copied from slave
module magnet_hole() {
    rotate([0, 90, 0])
        cylinder(d=magnet_diameter, h=magnet_depth + 0.1);
}

// 2c. 底部连接器组 (Bottom Connector Group)
module bottom_connector_group() {
     // Pogo Pin Socket (Center)
    pogo_socket_cutout();
    
    // Magnets (4 corners around pogo socket)
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


// 3. DC 插孔 (DC Jack Hole)
module dc_jack_hole() {
    rotate([90, 0, 0])
        cylinder(d=8, h=wall_thickness+4, center=true, $fn=30);
}

// 4. USB-C 插孔 (USB-C Hole)
module usbc_hole() {
    rotate([90, 0, 0])
        cube([9, 3.5, wall_thickness+4], center=true);
}

// 5. PCB 安装柱 (PCB Standoff)
module pcb_standoff() {
    difference() {
        cylinder(d=6, h=8, $fn=30);
        cylinder(d=3.2, h=8+0.1, $fn=20);
    }
}

// 6. 通风槽 (Ventilation Slots)
module ventilation_slots() {
    // 5 slots, 40x3mm
    for (i = [0:4]) {
        translate([0, i*5 - 10, -1]) // Centered Y group approx
            cube([40, 3, bottom_thickness + 2]);
    }
}

// 7. 盖子螺丝柱 (Lid Screw Post)
module lid_screw_post() {
    difference() {
        // Post
        cylinder(d=6, h=inner_depth); 
        // Screw hole
        translate([0, 0, inner_depth - 10])
            cylinder(d=2.5, h=11);
    }
}

// ==========================================
// 主体与顶盖 (Main Structures)
// ==========================================

// 主体盒子 (Hub Main Body)
module hub_main_body() {
    difference() {
        // A. 壳体 (Shell)
        union() {
            difference() {
                // Outer
                translate([-hub_length/2, -hub_width/2, 0])
                    rounded_cube([hub_length, hub_width, hub_height], fillet_radius);
                // Inner
                translate([-inner_length/2, -inner_width/2, bottom_thickness])
                    rounded_cube([inner_length, inner_width, hub_height], fillet_radius - wall_thickness);
            }
            
            // Lid Screw Posts (Added to union so they are solid)
            post_offset = 6;
            translate([inner_length/2 - post_offset, inner_width/2 - post_offset, bottom_thickness]) lid_screw_post();
            translate([inner_length/2 - post_offset, -(inner_width/2 - post_offset), bottom_thickness]) lid_screw_post();
            translate([-(inner_length/2 - post_offset), inner_width/2 - post_offset, bottom_thickness]) lid_screw_post();
            translate([-(inner_length/2 - post_offset), -(inner_width/2 - post_offset), bottom_thickness]) lid_screw_post();
        }
        
        // B. 侧面接口 (Side Cutouts)
        // Left Side (-X)
        translate([-hub_length/2, 0, 15])
             pogo_socket_cutout();
             
        // Right Side (+X)
        translate([hub_length/2, 0, 15])
             pogo_socket_cutout(); 

        // Bottom Side (-Y)
        translate([0, -hub_width/2, 15])
            rotate([0,0,90])
                bottom_connector_group();

        // C. 后部接口 (Rear Cutouts)
        // Rear is +Y (based on front being -Y in comments).
        // DC: Left from back view? Or Front view?
        // User: "Rear wall center left".
        // Let's put them symmetric.
        translate([-15, hub_width/2, 10])
            dc_jack_hole();
            
        translate([15, hub_width/2, 10])
            usbc_hole();
            
        // D. 通风槽 (Ventilation)
        // "Bottom rear (under speaker)". 
        // Note: User spec had "Speaker: Front 30mm" and "Vent: Rear under speaker". 
        // This is contradictory. Assuming "Under Speaker" is the priority.
        // Speaker is at Y = -hub_width/2 + 30.
        translate([-20, -hub_width/2 + 30, 0]) // Centered X=0 (minus half width of slots group 20)
            ventilation_slots();
    }
    
    // E. PCB Standoffs
    // Coordinates converted from User (0..120) to Center (-60..60)
    standoff_positions = [
        [10, 10], [10, 60], [50, 10], [50, 60], [90, 10], [90, 60]
    ];
    for (pos = standoff_positions) {
        translate([pos[0] - hub_length/2, pos[1] - hub_width/2, bottom_thickness])
            pcb_standoff();
    }
}

// 顶盖 (Hub Top Cover)
module hub_top_cover() {
    difference() {
        translate([-hub_length/2, -hub_width/2, 0])
            rounded_cube([hub_length, hub_width, lid_thickness], fillet_radius);
            
        // Speaker Grille
        // Position: 30mm from front wall.
        // Front is -Y.
        translate([0, -hub_width/2 + 30, 0])
            speaker_grille();
            
        // Screw Holes
        post_offset = 6;
        for (mx = [0,1]) {
            for (my = [0,1]) {
                x = (mx==0 ? 1 : -1) * (inner_length/2 - post_offset);
                y = (my==0 ? 1 : -1) * (inner_width/2 - post_offset);
                translate([x, y, -0.1]) cylinder(d=lid_screw_dia, h=lid_thickness+0.2);
                translate([x, y, lid_thickness/2]) cylinder(d1=lid_screw_dia, d2=lid_screw_head_dia, h=lid_thickness/2+0.1);
            }
        }
    }
}

// ==========================================
// 组装视图 (Assembly View)
// ==========================================

// 渲染主体 (Render Main Body)
color("White") 
    hub_main_body();

// 渲染顶盖 (Render Top Cover - Exploded)
translate([0, 0, hub_height + 20])
    color("LightBlue", 0.8) 
    hub_top_cover();
