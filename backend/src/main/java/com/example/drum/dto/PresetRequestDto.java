package com.example.drum.dto;

import lombok.Data;

@Data
public class PresetRequestDto {
    private String userId;
    private String name;
    private int startBpm;
    private int maxBpm;
    private int accInterval;
    private int accAmount;
}
