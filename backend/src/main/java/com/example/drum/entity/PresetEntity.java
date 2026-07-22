package com.example.drum.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PresetEntity {
    private String id;
    private String userId;
    private String name;
    private int startBpm;
    private int maxBpm;
    private int accInterval;
    private int accAmount;
    private String accMode;
}
